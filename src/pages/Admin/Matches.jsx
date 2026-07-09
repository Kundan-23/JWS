import React, { useEffect, useState, useRef } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' };
const inputStyle = { width: '100%', padding: '0.7rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 };

const MATCH_TYPES = ['Trial', 'Friendly', 'Tournament', 'Practice', 'Intro Match'];
const MATCH_TYPE_COLORS = { Trial: '#3b82f6', Friendly: '#10b981', Tournament: '#f59e0b', Practice: '#a78bfa', 'Intro Match': '#f97316' };
const AGE_CATEGORIES = ['U-13', 'U-15', 'U-17', 'U-19', 'U-22', 'Open', '35+', '40+', '45+', '50+', '55+', '60+', '65+'];
const EMPTY = { title: '', date: '', venue: '', match_type: 'Trial', base_age: 'U-13', gender: 'Boys', description: '', rules: '', price_per_slot: 0, total_slots: 0 };

// Custom dark-themed dropdown
const DarkSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const color = MATCH_TYPE_COLORS[value] || '#94a3b8';

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.7rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.25)',
          border: `1px solid ${open ? color : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'border-color 0.2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
          {value}
        </span>
        <ChevronDown size={16} color="var(--text-secondary)" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#1a2340', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => {
            const optColor = MATCH_TYPE_COLORS[opt] || '#94a3b8';
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.7rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
                  color: isSelected ? optColor : 'var(--text-primary)',
                  backgroundColor: isSelected ? `${optColor}18` : 'transparent',
                  fontWeight: isSelected ? 700 : 400,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: optColor, display: 'inline-block', flexShrink: 0 }} />
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MatchModal = ({ match, onClose, onSave }) => {
  const [form, setForm] = useState({ ...EMPTY, dateOnly: '', timeOnly: '' });
  
  useEffect(() => {
    if (match) {
      // Split age_category back into base_age and gender if possible
      let base_age = match.age_category || 'U-13';
      let gender = 'Boys';
      if (match.age_category) {
        // e.g., "U-13 Boys" -> ["U-13", "Boys"]
        const parts = match.age_category.split(' ');
        if (parts.length >= 2) {
          gender = parts.pop();
          base_age = parts.join(' ');
        } else {
          base_age = match.age_category;
        }
      }
      let dateOnly = '';
      let timeOnly = '';
      if (match.date) {
        const d = new Date(match.date);
        dateOnly = d.toISOString().split('T')[0];
        timeOnly = d.toTimeString().substring(0, 5);
      }
      setForm({ ...EMPTY, ...match, dateOnly, timeOnly, base_age, gender });
    } else {
      setForm({ ...EMPTY, dateOnly: '', timeOnly: '' });
    }
  }, [match]);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('General'); // 'General' | 'Date' | 'Time'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateMatchFaq = (fi, field, val) => setForm(f => ({ ...f, faqs: (f.faqs||[]).map((faq, j) => j === fi ? { ...faq, [field]: val } : faq) }));
  const addMatchFaq = () => setForm(f => ({ ...f, faqs: [...(f.faqs||[]), { q: '', a: '' }] }));
  const removeMatchFaq = (fi) => setForm(f => ({ ...f, faqs: (f.faqs||[]).filter((_, j) => j !== fi) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { 
      const payload = { ...form };
      if (form.dateOnly && form.timeOnly) {
        payload.date = `${form.dateOnly}T${form.timeOnly}:00`;
      }
      
      // Combine base_age and gender into age_category
      payload.age_category = `${form.base_age} ${form.gender}`;
      
      delete payload.dateOnly;
      delete payload.timeOnly;
      delete payload.base_age;
      delete payload.gender;
      
      await onSave(payload); 
    }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="heading-2">{match ? 'Edit Selection Trial' : 'Schedule Selection Trial'}</h2>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><X size={22} /></button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {['General', 'Date', 'Time'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1rem', background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'General' && (
              <>
              <div>
                <label style={labelStyle}>Title / Event Name *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="e.g. Sunday Practice Slot" />
              </div>
              <div>
                <label style={labelStyle}>Trial Type</label>
                <DarkSelect
                  value={form.match_type}
                  options={MATCH_TYPES}
                  onChange={(val) => {
                    set('match_type', val);
                    if (val === 'Practice' || val === 'Intro Match') set('price_per_slot', 0);
                  }}
                />
              </div>
              {/* Age Category */}
              {/* Age Category & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Age Category</label>
                  <select
                    value={form.base_age}
                    onChange={e => {
                      const newAge = e.target.value;
                      const isU = newAge.startsWith('U-');
                      setForm(f => ({ 
                        ...f, 
                        base_age: newAge, 
                        gender: isU ? 'Boys' : 'Male' // default for selection
                      }));
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {AGE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#1a2340', color: '#fff' }}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => set('gender', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {form.base_age?.startsWith('U-') ? (
                      <>
                        <option value="Boys" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Boys</option>
                        <option value="Girls" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Girls</option>
                        <option value="Mixed" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Mixed</option>
                      </>
                    ) : (
                      <>
                        <option value="Male" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Male</option>
                        <option value="Female" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Female</option>
                        <option value="Mixed" style={{ backgroundColor: '#1a2340', color: '#fff' }}>Mixed</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price per Slot (₹)</label>
                  <input
                    type="number" min="0"
                    value={form.price_per_slot || ''}
                    onChange={e => set('price_per_slot', e.target.value === '' ? 0 : Number(e.target.value))}
                    disabled={form.match_type === 'Practice' || form.match_type === 'Intro Match'}
                    style={{ ...inputStyle, opacity: (form.match_type === 'Practice' || form.match_type === 'Intro Match') ? 0.5 : 1 }}
                    placeholder="0 for free"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Total Slots</label>
                  <input 
                    type="number" min="0" 
                    value={form.total_slots || ''} 
                    onChange={e => set('total_slots', e.target.value === '' ? 0 : Number(e.target.value))} 
                    style={inputStyle} 
                    placeholder="0 for unlimited" 
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Venue</label>
                <input value={form.venue} onChange={e => set('venue', e.target.value)} style={inputStyle} placeholder="Ground / location" />
              </div>
              <div>
                <label style={labelStyle}>About the Trial</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional notes…" />
              </div>
              
              {/* FAQs */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>FAQs</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {(form.faqs || []).map((faq, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input value={faq.q} onChange={e => updateMatchFaq(fi, 'q', e.target.value)} style={{ ...inputStyle, fontWeight: 600 }} placeholder="Q: e.g. What to bring?" />
                        <textarea value={faq.a} onChange={e => updateMatchFaq(fi, 'a', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="A: Your answer here..." />
                      </div>
                      <button type="button" onClick={() => removeMatchFaq(fi)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', marginTop: '0.2rem', height: 'fit-content' }} title="Remove FAQ">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addMatchFaq} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', width: 'max-content' }}>
                  <Plus size={14} /> Add FAQ
                </button>
              </div>
              <div>
                <label style={labelStyle}>Terms & Conditions / Rules</label>
                <textarea value={form.rules || ''} onChange={e => set('rules', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional rules or terms for this trial…" />
              </div>
            </>
          )}

          {activeTab === 'Date' && (
            <div>
              <label style={labelStyle}>Select Date *</label>
              <input required type="date" value={form.dateOnly} onChange={e => set('dateOnly', e.target.value)} style={{ ...inputStyle, fontSize: '1.2rem', padding: '1rem' }} />
            </div>
          )}

          {activeTab === 'Time' && (
            <div>
              <label style={labelStyle}>Select Time *</label>
              <input required type="time" value={form.timeOnly} onChange={e => set('timeOnly', e.target.value)} style={{ ...inputStyle, fontSize: '1.2rem', padding: '1rem' }} />
            </div>
          )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', border: 'none' }}>
              {saving ? 'Saving…' : match ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TypeBadge = ({ type }) => {
  let key = (type || '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  if (key === 'League') key = 'Trial';
  const colorMap = { Trial: '#3b82f6', Friendly: '#10b981', Tournament: '#f59e0b', Practice: '#a78bfa', 'Intro Match': '#f97316' };
  const col = colorMap[key] || '#94a3b8';
  return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: `${col}22`, color: col, border: `1px solid ${col}44` }}>{key}</span>;
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [squads, setSquads] = useState([]);
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Viewer admin restriction
  const isViewerAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('jws_user') || '{}')?.email === 'jwsadmin2026@gmail.com'; }
    catch { return false; }
  })();

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getMatches();
      setMatches(r.data?.matches || r.data || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load matches.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadSquads = async (matchId) => {
    if (expandedId === matchId) { setExpandedId(null); return; }
    setExpandedId(matchId);
    setSquadsLoading(true);
    try {
      const r = await adminAPI.getMatchSquads(matchId);
      setSquads(r.data?.squads || []);
    } catch { setSquads([]); }
    finally { setSquadsLoading(false); }
  };

  const loadBookings = async (matchId) => {
    if (expandedId === matchId) { setExpandedId(null); return; }
    setExpandedId(matchId);
    setBookingsLoading(true);
    try {
      const r = await adminAPI.getMatchBookings(matchId);
      setBookings(r.data?.bookings || []);
    } catch { setBookings([]); }
    finally { setBookingsLoading(false); }
  };

  const handleApproveSquad = async (squadId, matchId) => {
    try {
      await adminAPI.approveSquad(squadId);
      Swal.fire({ icon: 'success', title: 'Squad Approved!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
      const r = await adminAPI.getMatchSquads(matchId);
      setSquads(r.data?.squads || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to approve.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
  };

  const handleRejectSquad = async (squadId, matchId) => {
    try {
      await adminAPI.rejectSquad(squadId);
      Swal.fire({ icon: 'success', title: 'Squad Rejected', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      const r = await adminAPI.getMatchSquads(matchId);
      setSquads(r.data?.squads || []);
    } catch { }
  };

  const handleSave = async (data) => {
    try {
      if (modal && modal !== 'add') {
        await adminAPI.updateMatch(modal.id, data);
        Swal.fire({ icon: 'success', title: 'Match Updated!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      } else {
        await adminAPI.createMatch(data);
        Swal.fire({ icon: 'success', title: 'Match Scheduled!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      }
      setModal(null);
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Operation failed.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      throw err;
    }
  };

  const handleDelete = async (m) => {
    const result = await Swal.fire({
      title: 'Delete Match?',
      text: `"${m.title || m.opponent}" on ${new Date(m.date).toLocaleDateString('en-IN')}`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: 'transparent',
      confirmButtonText: 'Delete', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    });
    if (!result.isConfirmed) return;
    try {
      await adminAPI.deleteMatch(m.id);
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1000, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Selection Trials</h1>
          <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Schedule and manage JWS selection trials.</p>
        </div>
        {!isViewerAdmin && (
          <button
            onClick={() => setModal('add')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(203,249,5,0.25)', transition: 'all 0.15s' }}
          >
            <Plus size={18} /> Schedule Trial
          </button>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading trials…</div>
          ) : matches.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No selection trials scheduled yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Venue</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Age Group</th>
                  <th style={thStyle}>Price (₹)</th>
                  <th style={thStyle}>Slots</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => {
                  const mt = (m.match_type || m.type || '').toLowerCase();
                  const isPractice = mt === 'practice' || mt === 'intro match';
                  const isExpanded = expandedId === m.id;
                  const slotsLeft = (m.total_slots || 0) - (m.booked_slots || 0);
                  const isFull = m.total_slots > 0 && slotsLeft <= 0;
                  return (
                    <React.Fragment key={m.id || i}>
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', backgroundColor: isExpanded ? 'rgba(167,139,250,0.06)' : 'transparent' }}
                        onMouseOver={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                        onMouseOut={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td
                          style={{ ...tdStyle, fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => isPractice ? loadSquads(m.id) : loadBookings(m.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: isPractice ? '#a78bfa' : '#3b82f6', flexShrink: 0 }} />
                            {m.title || m.opponent}
                          </div>
                        </td>
                        <td style={tdStyle}>{m.date ? new Date(m.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{m.venue || m.location || '—'}</td>
                        <td style={tdStyle}><TypeBadge type={m.match_type || m.type} /></td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {m.age_category || 'Open (All Ages)'}
                        </td>
                        <td style={tdStyle}>{m.price_per_slot > 0 ? `₹${m.price_per_slot}` : 'Free'}</td>
                        <td style={tdStyle}>
                          <span style={{ color: isFull ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                            {m.booked_slots || 0} / {m.total_slots || '∞'}
                          </span>
                          {isFull && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>FULL</span>}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.description || '—'}</td>
                        <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                          {!isViewerAdmin && (
                            <>
                              <button onClick={() => setModal(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(96,165,250,0.1)', color: 'var(--brand-accent)', border: '1px solid rgba(96,165,250,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                <Pencil size={13} /> Edit
                              </button>
                              <button onClick={() => handleDelete(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                <Trash2 size={13} /> Delete
                              </button>
                            </>
                          )}
                          {isViewerAdmin && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>View only</span>
                          )}
                        </td>
                      </tr>

                      {/* ── Expanded Panel ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: '0 1.25rem 1.25rem', backgroundColor: isPractice ? 'rgba(167,139,250,0.04)' : 'rgba(59,130,246,0.04)', borderBottom: `2px solid ${isPractice ? 'rgba(167,139,250,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                            <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(0,0,0,0.2)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, color: isPractice ? '#a78bfa' : '#3b82f6', fontSize: '0.95rem', fontWeight: 700 }}>
                                  {isPractice ? '🏏 Coach Squad Submissions' : '🎫 Player Bookings'}
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  Slots: <strong style={{ color: isFull ? '#ef4444' : '#10b981' }}>{m.booked_slots || 0} / {m.total_slots || '∞'}</strong>
                                  {!isFull && m.total_slots > 0 && <span style={{ color: '#a78bfa', marginLeft: '0.5rem' }}>({slotsLeft} remaining)</span>}
                                </span>
                              </div>

                              {/* ─ Squad Panel (Practice / Intro Match) ─ */}
                              {isPractice && (
                                squadsLoading ? (
                                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Loading squads...</p>
                                ) : squads.length === 0 ? (
                                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No squad submissions yet.</p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {squads.map(sq => {
                                      const statusColor = sq.status === 'approved' ? '#10b981' : sq.status === 'rejected' ? '#ef4444' : '#f59e0b';
                                      return (
                                        <div key={sq.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: `1px solid ${statusColor}33` }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Coach: {sq.coach?.first_name} {sq.coach?.last_name}</span>
                                              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`, fontWeight: 700, textTransform: 'uppercase' }}>{sq.status || 'pending'}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                              <strong>Players ({sq.players?.length || 0}):</strong>{' '}
                                              {sq.players?.length > 0 ? sq.players.map(p => `${p.first_name} ${p.last_name} (${p.gicl_id})`).join(', ') : 'No players listed'}
                                            </div>
                                          </div>
                                          {sq.status === 'pending' && !isViewerAdmin && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
                                              <button onClick={() => handleApproveSquad(sq.id, m.id)} disabled={isFull}
                                                style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-md)', background: isFull ? 'rgba(100,100,100,0.2)' : 'rgba(16,185,129,0.15)', color: isFull ? '#666' : '#10b981', border: `1px solid ${isFull ? '#333' : 'rgba(16,185,129,0.4)'}`, fontWeight: 700, fontSize: '0.78rem', cursor: isFull ? 'not-allowed' : 'pointer' }}>
                                                ✓ Approve
                                              </button>
                                              <button onClick={() => handleRejectSquad(sq.id, m.id)}
                                                style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                ✗ Reject
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )
                              )}

                              {/* ─ Bookings Panel (League / Friendly / Tournament) ─ */}
                              {!isPractice && (
                                bookingsLoading ? (
                                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Loading bookings...</p>
                                ) : bookings.length === 0 ? (
                                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No player bookings yet for this trial.</p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem 1rem', padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      <span>Player</span><span>GICL ID</span><span>Amount Paid</span><span>Payment ID</span>
                                    </div>
                                    {bookings.map((bk, bi) => (
                                      <div key={bk.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem 1rem', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', background: bi % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{bk.player?.first_name} {bk.player?.last_name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bk.player?.gicl_id || '—'}</span>
                                        <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 700 }}>₹{bk.amount_paid}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bk.razorpay_payment_id ? bk.razorpay_payment_id.slice(0,16) + '…' : '—'}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Total Bookings: <strong style={{ color: 'var(--text-primary)' }}>{bookings.length}</strong></span>
                                      <span style={{ color: 'var(--text-secondary)' }}>Total Collected: <strong style={{ color: '#10b981' }}>₹{bookings.reduce((s, b) => s + (b.amount_paid || 0), 0)}</strong></span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && <MatchModal match={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
};

export default Matches;

