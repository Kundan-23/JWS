import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { playerAPI } from '../../services/api';
import { FileText, Upload, CheckCircle2, Clock } from 'lucide-react';

const MyDocuments = () => {
  const [aadharFrontUrl, setAadharFrontUrl] = useState('');
  const [aadharBackUrl, setAadharBackUrl] = useState('');
  const [docsApproved, setDocsApproved] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerAPI.getProfile()
      .then(res => {
        const p = res.data?.player || res.data;
        if (p?.aadhar_front_url) setAadharFrontUrl(p.aadhar_front_url);
        if (p?.aadhar_back_url)  setAadharBackUrl(p.aadhar_back_url);
        if (p?.docs_approved)    setDocsApproved(p.docs_approved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFrontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFront(true);
    try {
      const res = await playerAPI.uploadAadharFront(file);
      const url = res.data?.url;
      if (url) setAadharFrontUrl(url);
      Swal.fire({
        icon: 'success', title: 'Front Side Uploaded! ✅',
        text: 'Aadhaar front side submitted for admin verification.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905', timer: 2500, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload Failed',
        text: err.response?.data?.message || 'Please try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905'
      });
    } finally { setUploadingFront(false); }
  };

  const handleBackUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBack(true);
    try {
      const res = await playerAPI.uploadAadharBack(file);
      const url = res.data?.url;
      if (url) setAadharBackUrl(url);
      Swal.fire({
        icon: 'success', title: 'Back Side Uploaded! ✅',
        text: 'Aadhaar back side submitted for admin verification.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905', timer: 2500, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload Failed',
        text: err.response?.data?.message || 'Please try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905'
      });
    } finally { setUploadingBack(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--bg-surface-elevated)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const UploadCard = ({ title, url, uploading, inputId, onUpload, side }) => (
    <div style={{
      backgroundColor: 'var(--bg-surface)', padding: '1.5rem',
      borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)',
      marginBottom: '1rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="heading-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--brand-primary)" />
          {title}
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, marginLeft: '0.25rem' }}>Required</span>
        </h3>
        {url && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: docsApproved ? '#10b981' : '#f59e0b' }}>
            {docsApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            {docsApproved ? 'Verified ✓' : 'Pending Review'}
          </span>
        )}
      </div>

      {/* Content */}
      {url ? (
        <div>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--bg-surface-elevated)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Uploaded document:</p>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              View Aadhaar {side} ↗
            </a>
          </div>
          {!docsApproved && (
            <label htmlFor={inputId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--brand-accent)', fontWeight: 600, fontSize: '0.875rem' }}>
              <Upload size={16} /> Re-upload
            </label>
          )}
        </div>
      ) : (
        <div style={{ border: '2px dashed var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <FileText size={40} color="var(--text-secondary)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>No document uploaded yet</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
            Upload the {side.toLowerCase()} of your Aadhaar card (image or PDF)
          </p>
          <label htmlFor={inputId} style={{
            cursor: 'pointer', padding: '0.75rem 1.75rem',
            backgroundColor: 'var(--brand-primary)', color: '#2a1d4e',
            borderRadius: 'var(--radius-md)', fontWeight: 700,
            display: 'inline-block', transition: 'transform 0.15s'
          }}>
            {uploading ? 'Uploading...' : `📎 Upload ${side}`}
          </label>
        </div>
      )}

      <input
        id={inputId} type="file" accept="image/*,application/pdf"
        style={{ display: 'none' }} onChange={onUpload} disabled={uploading}
      />
    </div>
  );

  const bothUploaded = aadharFrontUrl && aadharBackUrl;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="heading-1">My Documents</h1>
        <p className="text-body" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Upload both sides of your Aadhaar card for identity verification. Both are compulsory.
        </p>
      </div>

      {/* Overall status banner */}
      {bothUploaded && (
        <div style={{
          backgroundColor: docsApproved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${docsApproved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: 'var(--radius-lg)', padding: '0.875rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.9rem',
          color: docsApproved ? '#10b981' : '#f59e0b'
        }}>
          {docsApproved ? <CheckCircle2 size={18} /> : <Clock size={18} />}
          {docsApproved
            ? 'Both documents verified by admin ✓'
            : 'Both documents uploaded — awaiting admin verification'}
        </div>
      )}

      {/* Front Side Upload */}
      <UploadCard
        title="Aadhaar Card — Front Side"
        url={aadharFrontUrl}
        uploading={uploadingFront}
        inputId="aadhar-front-upload"
        onUpload={handleFrontUpload}
        side="Front"
      />

      {/* Back Side Upload */}
      <UploadCard
        title="Aadhaar Card — Back Side"
        url={aadharBackUrl}
        uploading={uploadingBack}
        inputId="aadhar-back-upload"
        onUpload={handleBackUpload}
        side="Back"
      />

      {/* Info Box */}
      <div style={{
        backgroundColor: 'rgba(203,249,5,0.06)',
        border: '1px solid rgba(203,249,5,0.2)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7
      }}>
        <strong style={{ color: '#cbf905' }}>📌 Why is this required?</strong><br />
        JWS requires both sides of your Aadhaar card to verify your identity and age eligibility for the Junior World Series trials.
        Your Aadhaar data is kept strictly confidential.
      </div>
    </motion.div>
  );
};

export default MyDocuments;
