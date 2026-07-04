import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/adminAPI';
import Swal from 'sweetalert2';
import { Check, X, ShieldAlert } from 'lucide-react';

const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

const AdminTrainingSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTrainingSlots();
      setSlots(res.data?.slots || []);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load training slots.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await adminAPI.approveTrainingSlot(id);
        Swal.fire({ icon: 'success', title: 'Approved', timer: 1000, showConfirmButton: false });
      } else {
        await adminAPI.rejectTrainingSlot(id);
        Swal.fire({ icon: 'info', title: 'Rejected', timer: 1000, showConfirmButton: false });
      }
      loadSlots();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: `Failed to ${action} slot.` });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Training Slot Approvals</h1>
          <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Review coach-requested player training slots.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading slots…</div>
          ) : slots.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No training slots requested.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>Coach</th>
                  <th style={thStyle}>Training Type</th>
                  <th style={thStyle}>Scheduled Time</th>
                  <th style={thStyle}>Players Selected</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {slot.coach?.first_name} {slot.coach?.last_name}
                      <br />
                      <span className="text-secondary text-small">{slot.coach?.gicl_id}</span>
                    </td>
                    <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{slot.training_type}</td>
                    <td style={tdStyle}>{new Date(slot.scheduled_time).toLocaleString()}</td>
                    <td style={tdStyle}>{Array.isArray(slot.player_ids) ? slot.player_ids.length : 0} players</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: slot.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : slot.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: slot.status === 'pending' ? '#f59e0b' : slot.status === 'approved' ? '#10b981' : '#ef4444'
                      }}>
                        {slot.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                      {slot.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(slot.id, 'approve')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                            <Check size={13} /> Approve
                          </button>
                          <button onClick={() => handleAction(slot.id, 'reject')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                            <X size={13} /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTrainingSlots;
