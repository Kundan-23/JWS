import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/adminAPI';
import Swal from 'sweetalert2';

const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    approved: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const Cashouts = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      const r = await adminAPI.getCashouts('pending');
      setPending(r.data?.cashouts || r.data || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load cashouts.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  const loadHistory = async () => {
    try {
      const r = await adminAPI.getCashouts('all');
      setHistory((r.data?.cashouts || r.data || []).filter(c => c.status !== 'pending'));
    } catch { /* silent */ }
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadPending(), loadHistory()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (c) => {
    const { value: note } = await Swal.fire({
      title: 'Approve Cashout',
      html: `<p style="color:#94a3b8;margin-bottom:0.5rem">Amount: <strong style="color:#fff">₹${c.amount}</strong> to <strong style="color:#fff">${c.player_name || c.player_id}</strong></p>`,
      input: 'text', inputPlaceholder: 'Optional admin note…',
      confirmButtonText: 'Approve', showCancelButton: true,
      confirmButtonColor: '#10b981', cancelButtonColor: 'transparent',
      background: 'var(--bg-surface)', color: 'var(--text-primary)',
    });
    if (note === undefined) return; // cancelled
    try {
      await adminAPI.approveCashout(c.id, note || '');
      Swal.fire({ icon: 'success', title: 'Cashout Approved!', timer: 1400, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to approve.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  const handleReject = async (c) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Cashout',
      html: `<p style="color:#94a3b8;margin-bottom:0.5rem">Amount: <strong style="color:#fff">₹${c.amount}</strong></p>`,
      input: 'textarea', inputPlaceholder: 'Reason for rejection (required)…',
      confirmButtonText: 'Reject', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: 'transparent',
      background: 'var(--bg-surface)', color: 'var(--text-primary)',
      preConfirm: (v) => {
        if (!v?.trim()) { Swal.showValidationMessage('Reason is required'); return false; }
        return v;
      },
    });
    if (!isConfirmed || !reason) return;
    try {
      await adminAPI.rejectCashout(c.id, reason);
      Swal.fire({ icon: 'success', title: 'Cashout Rejected', timer: 1400, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to reject.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  const btnStyle = (color, bg, border) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)',
    background: bg, color, border: `1px solid ${border}`,
    fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
  });

  const tabs = ['pending', 'history'];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Cashouts</h1>
        <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Review and manage player cashout requests.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.55rem 1.3rem', borderRadius: 'var(--radius-md)', border: '1px solid', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s', borderColor: tab === t ? 'var(--brand-primary)' : 'var(--border-subtle)', background: tab === t ? 'rgba(203,249,5,0.12)' : 'transparent', color: tab === t ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
            {t === 'pending' ? `Pending (${pending.length})` : 'History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {tab === 'pending' ? (
              pending.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No pending cashouts. 🎉</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={thStyle}>Player</th>
                      <th style={thStyle}>GICL ID</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Method</th>
                      <th style={thStyle}>UPI / Account</th>
                      <th style={thStyle}>Requested On</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{c.player_name || c.player_id}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700 }}>{c.gicl_id || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>₹{c.amount}</td>
                        <td style={tdStyle}>{c.method}</td>
                        <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.upi_id || c.account_number || '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApprove(c)} style={btnStyle('#10b981', 'rgba(16,185,129,0.1)', 'rgba(16,185,129,0.3)')}>Approve</button>
                          <button onClick={() => handleReject(c)} style={btnStyle('#ef4444', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.3)')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              history.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No history yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={thStyle}>Player</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Method</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Admin Note</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{c.player_name || c.player_id}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>₹{c.amount}</td>
                        <td style={tdStyle}>{c.method}</td>
                        <td style={tdStyle}><StatusBadge status={c.status} /></td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.admin_note || '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{c.updated_at ? new Date(c.updated_at).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashouts;

