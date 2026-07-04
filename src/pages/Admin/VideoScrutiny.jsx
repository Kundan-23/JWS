import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { Video, Check, X, Clock, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const TABS = [
  { key: 'pending',  label: 'Pending',  color: '#f59e0b' },
  { key: 'approved', label: 'Approved', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const VideoScrutiny = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const loadUploads = useCallback(async (tab) => {
    setLoading(true);
    try {
      const res = await adminAPI.getCoachUploads(tab);
      const list = res.data?.uploads || [];
      setUploads(list);
      if (tab === 'pending') setPendingCount(list.length);
    } catch {
      setUploads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-fetch pending count for badge when not on pending tab
  useEffect(() => {
    adminAPI.getCoachUploads('pending')
      .then(r => setPendingCount((r.data?.uploads || []).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUploads(activeTab);
  }, [activeTab, loadUploads]);

  const handleApprove = async (upload) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Approve Video?',
      text: `"${upload.title || 'Untitled'}" will be marked as approved.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: '✅ Approve',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
    });
    if (!isConfirmed) return;
    try {
      await adminAPI.approveCoachUpload(upload.id);
      Swal.fire({ icon: 'success', title: 'Approved!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      loadUploads(activeTab);
      setPendingCount(c => Math.max(0, c - 1));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to approve.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
  };

  const handleReject = async (upload) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Video',
      input: 'textarea',
      inputLabel: 'Reason for rejection (required)',
      inputPlaceholder: 'e.g., Lighting is too poor, audio unclear, incorrect technique...',
      inputAttributes: { required: true },
      showCancelButton: true,
      confirmButtonText: '❌ Reject',
      confirmButtonColor: '#ef4444',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      preConfirm: (val) => {
        if (!val || val.trim().length < 5) {
          Swal.showValidationMessage('Please provide a reason (min 5 characters).');
          return false;
        }
        return val.trim();
      },
    });
    if (!isConfirmed || !reason) return;
    try {
      await adminAPI.rejectCoachUpload(upload.id, reason);
      Swal.fire({ icon: 'success', title: 'Rejected', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      loadUploads(activeTab);
      setPendingCount(c => Math.max(0, c - 1));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to reject.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Video Scrutiny</h1>
        <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Review and approve tutorial videos uploaded by coaches.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
              color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span style={{
                backgroundColor: '#f59e0b', color: '#121A3F',
                borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800,
                padding: '0.1rem 0.5rem', lineHeight: 1.5,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 120, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
          <Video size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No {activeTab} videos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {uploads.map(video => {
            const coach = video.coach_id;
            const coachName = coach
              ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || coach.email
              : 'Unknown Coach';

            return (
              <div
                key={video.id}
                style={{
                  backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
                      {video.title || 'Untitled Video'}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>👤 {coachName}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} /> {formatDate(video.created_at)}
                      </span>
                    </div>
                    {(video.video_url || video.url) ? (
                      <a
                        href={video.video_url || video.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          marginTop: '0.85rem', padding: '0.4rem 0.9rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(59,130,246,0.1)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.25)',
                          fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                        }}
                      >
                        <Video size={13} /> View Video ↗
                      </a>
                    ) : (
                      <span style={{ display: 'inline-block', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No video URL</span>
                    )}
                  </div>

                  {/* Pending Actions */}
                  {activeTab === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleApprove(video)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.2)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
                      >
                        <Check size={15} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(video)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Rejection reason note (on rejected tab) */}
                {activeTab === 'rejected' && (video.rejection_reason || video.admin_note) && (
                  <div style={{
                    margin: '0 1.5rem 1.5rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                  }}>
                    <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem' }}>Rejection Reason</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{video.rejection_reason || video.admin_note}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default VideoScrutiny;
