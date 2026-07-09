/**
 * imageCompressor.js
 * Browser-side compression for both image files and PDF files.
 *
 * compressImage  — uses HTML5 Canvas to resize + re-encode images as JPEG.
 *                  PDFs and non-image files are returned untouched.
 *
 * compressPDF    — uses pdfjs-dist to render each page onto a canvas,
 *                  compresses each canvas to JPEG, then rebuilds a smaller
 *                  PDF using jsPDF. Falls back to original on any error.
 */

// ─── Image Compression ────────────────────────────────────────────────────────

/**
 * Compress an image File using the HTML5 Canvas API.
 * Non-image files (including PDFs) are returned untouched.
 *
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number }} [options]
 * @returns {Promise<File>}
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve) => {
    // Skip non-image files (PDFs, etc.) — use compressPDF for those
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const maxDimension = options.maxDimension || 1200;
    const quality      = options.quality      || 0.7;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Downscale if either dimension exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width  = maxDimension;
          } else {
            width  = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);

            const compressedFile = new File([blob], file.name, {
              type:         'image/jpeg',
              lastModified: Date.now(),
            });

            // Keep original if compression made it larger
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror  = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

// ─── PDF Compression ─────────────────────────────────────────────────────────

/**
 * Compress a PDF File by:
 *   1. Rendering each page onto a Canvas via pdfjs-dist (at reduced scale)
 *   2. Encoding the canvas as a compressed JPEG
 *   3. Rebuilding a new PDF from those JPEG images using jsPDF
 *
 * Falls back to the original file on any error.
 *
 * @param {File} file
 * @param {{ scale?: number, quality?: number }} [options]
 *   scale   — render scale factor (default 1.2; lower = smaller but less sharp)
 *   quality — JPEG quality 0–1 (default 0.7)
 * @returns {Promise<File>}
 */
export const compressPDF = async (file, options = {}) => {
  if (!file || file.type !== 'application/pdf') {
    return file; // not a PDF — return as-is
  }

  const scale   = options.scale   || 1.2;
  const quality = options.quality || 0.7;

  try {
    // ── 1. Lazy-load pdfjs-dist (keeps it out of the main bundle) ──
    const pdfjsLib = await import('pdfjs-dist');

    // Point the worker at the pre-built file bundled by Vite
    // (pdfjs-dist ships the worker in dist/pdf.worker.min.mjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    // ── 2. Read the file as an ArrayBuffer ──
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;

    // ── 3. Lazy-load jsPDF ──
    const { jsPDF } = await import('jspdf');

    let outputDoc = null; // we'll create jsPDF once we know the first page size

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page     = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Render page onto an off-screen canvas
      const canvas  = document.createElement('canvas');
      canvas.width  = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Compress canvas to JPEG data URL
      const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Page dimensions in mm (jsPDF uses mm by default)
      const widthMm  = (canvas.width  * 25.4) / 96; // 96 DPI assumed
      const heightMm = (canvas.height * 25.4) / 96;

      if (pageNum === 1) {
        // Initialise jsPDF with the orientation + size of the first page
        const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
        outputDoc = new jsPDF({ orientation, unit: 'mm', format: [widthMm, heightMm] });
      } else {
        outputDoc.addPage([widthMm, heightMm], widthMm > heightMm ? 'landscape' : 'portrait');
      }

      outputDoc.addImage(imgDataUrl, 'JPEG', 0, 0, widthMm, heightMm);
    }

    // ── 4. Export and wrap in a File ──
    const pdfBlob = outputDoc.output('blob');
    const compressedFile = new File(
      [pdfBlob],
      file.name.replace(/\.pdf$/i, '_compressed.pdf'),
      { type: 'application/pdf', lastModified: Date.now() }
    );

    console.info(
      `[compressPDF] ${file.name}: ${(file.size / 1024).toFixed(0)} KB → ` +
      `${(compressedFile.size / 1024).toFixed(0)} KB`
    );

    // If compression somehow made it larger, return the original
    return compressedFile.size < file.size ? compressedFile : file;

  } catch (err) {
    console.warn('[compressPDF] Compression failed, using original:', err);
    return file; // safe fallback
  }
};
