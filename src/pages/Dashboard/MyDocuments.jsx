import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { playerAPI } from '../../services/api';
import { FileText, Upload, CheckCircle2, Clock } from 'lucide-react';

const MyDocuments = () => {
  const [aadharUrl, setAadharUrl] = useState('');
  const [docsApproved, setDocsApproved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerAPI.getProfile()
      .then(res => {
        const p = res.data?.player || res.data;
        if (p?.aadhar_url) setAadharUrl(p.aadhar_url);
        if (p?.docs_approved) setDocsApproved(p.docs_approved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAadharUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await playerAPI.uploadAadhar(file);
      const url = res.data?.url;
      if (url) setAadharUrl(url);
      Swal.fire({ icon: 'success', title: 'Aadhaar Uploaded! ✅', text: 'Your document has been submitted for admin verification.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905', timer: 2500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.response?.data?.message || 'Please try again.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setUploading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--bg-surface-elevated)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="heading-1">My Documents</h1>
        <p className="text-body" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Upload and manage your identity verification documents for JWS registration.
        </p>
      </div>

      {/* Aadhaar Card */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="heading-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--brand-primary)" /> Aadhaar Card
          </h3>
          {aadharUrl && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: docsApproved ? '#10b981' : '#f59e0b' }}>
              {docsApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              {docsApproved ? 'Verified ✓' : 'Pending Review'}
            </span>
          )}
        </div>

        {aadharUrl ? (
          <div>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--bg-surface-elevated)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Uploaded document:</p>
              <a href={aadharUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                View Aadhaar Card ↗
              </a>
            </div>
            {!docsApproved && (
              <label htmlFor="aadhar-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--brand-accent)', fontWeight: 600, fontSize: '0.875rem' }}>
                <Upload size={16} /> Re-upload
              </label>
            )}
          </div>
        ) : (
          <div style={{ border: '2px dashed var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
            <FileText size={44} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>No document uploaded yet</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Upload your Aadhaar Card (front &amp; back) for identity verification
            </p>
            <label htmlFor="aadhar-upload" style={{
              cursor: 'pointer',
              padding: '0.75rem 1.75rem',
              backgroundColor: 'var(--brand-primary)',
              color: '#2a1d4e',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              display: 'inline-block',
              transition: 'transform 0.15s'
            }}>
              {uploading ? 'Uploading...' : '📎 Choose File'}
            </label>
          </div>
        )}
        <input id="aadhar-upload" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleAadharUpload} disabled={uploading} />
      </div>

      {/* Info Box */}
      <div style={{ backgroundColor: 'rgba(203,249,5,0.06)', border: '1px solid rgba(203,249,5,0.2)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong style={{ color: '#cbf905' }}>📌 Why is this required?</strong><br />
        JWS requires identity proof to ensure all players are genuine and age-eligible for the Junior World Series trials.
        Your Aadhaar data is kept strictly confidential.
      </div>
    </motion.div>
  );
};

export default MyDocuments;

