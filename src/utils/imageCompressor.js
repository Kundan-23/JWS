/**
 * imageCompressor.js
 * Compresses an image File using HTML5 Canvas before upload.
 * - PDFs and non-image files are returned untouched.
 * - Falls back to the original file if compression produces a larger result.
 *
 * @param {File} file - The file to compress.
 * @param {object} options
 * @param {number} [options.maxDimension=1200] - Max width or height in pixels.
 * @param {number} [options.quality=0.7]        - JPEG quality (0 to 1).
 * @returns {Promise<File>} - A promise resolving to the compressed (or original) File.
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve) => {
    // Skip compression for non-image files (e.g. PDFs)
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
            if (!blob) return resolve(file); // fallback on error

            const compressedFile = new File([blob], file.name, {
              type:         'image/jpeg',
              lastModified: Date.now(),
            });

            // If compression made it bigger, use the original
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};
