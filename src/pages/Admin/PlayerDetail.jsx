import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/adminAPI';
import { ChevronLeft, Save, Trash2, Video, Key, Search, Phone, Calendar, X, ArrowLeft, User, Mail, FileText, CreditCard, Users, DollarSign, CheckCircle, XCircle, UserCheck, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useConfig } from '../../context/ConfigContext';
import { compressImage, compressPDF } from '../../utils/imageCompressor';

const Section = ({ title, icon: Icon, children }) => (
  <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', overflow: 'hidden' }}>
    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {Icon && <Icon size={18} color="var(--brand-primary)" />}
      <h3 className="heading-3" style={{ margin: 0 }}>{title}</h3>
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value || '—'}</span>
  </div>
);

const inputStyle = { width: '100%', padding: '0.6rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 500 };

const EditPlayerModal = ({ player, onClose, onSave }) => {
  const [form, setForm] = useState(player);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = { ...form };
    
    if (typeof payload.balls_selected === 'string') {
      payload.balls_selected = payload.balls_selected.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof payload.field_positions === 'string') {
      payload.field_positions = payload.field_positions.split(',').map(s => s.trim()).filter(Boolean);
    }

    await onSave(payload);
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', padding: '2rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="heading-2">Edit Player</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <div><label style={labelStyle}>First Name</label><input required value={form.first_name || ''} onChange={e => setForm({...form, first_name: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Last Name</label><input required value={form.last_name || ''} onChange={e => setForm({...form, last_name: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Email</label><input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Phone</label><PhoneInput defaultCountry="IN" value={form.phone || ''} onChange={val => setForm({...form, phone: val})} style={inputStyle} /></div>
          <div><label style={labelStyle}>WhatsApp</label><PhoneInput defaultCountry="IN" value={form.whatsapp || ''} onChange={val => setForm({...form, whatsapp: val})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Date of Birth</label><input type="date" value={form.dob ? form.dob.substring(0,10) : ''} onChange={e => setForm({...form, dob: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Gender</label><select value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})} style={inputStyle}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
          <div><label style={labelStyle}>Player Tier</label><select value={form.player_tier || ''} onChange={e => setForm({...form, player_tier: e.target.value})} style={inputStyle}><option value="">Select</option><option value="U-13">U-13</option><option value="U-17">U-17</option><option value="U-22">U-22</option><option value="Open">Open</option></select></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Flat no, Wing name, Build name, Sector</label><input value={form.address_line1 || ''} onChange={e => setForm({...form, address_line1: e.target.value})} style={inputStyle} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Area and Address</label><input value={form.address_line2 || ''} onChange={e => setForm({...form, address_line2: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>City / District</label><input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>State Code</label><input value={form.state_code || ''} onChange={e => setForm({...form, state_code: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Country</label><input value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>ZIP Code</label><input value={form.zip_code || ''} onChange={e => setForm({...form, zip_code: e.target.value})} style={inputStyle} /></div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}><h4 style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Personal Info</h4></div>
          <div><label style={labelStyle}>Blood Group</label><input value={form.blood_group || ''} onChange={e => setForm({...form, blood_group: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Parent/Guardian Name</label><input value={form.emergency_contact_name || ''} onChange={e => setForm({...form, emergency_contact_name: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Parent/Guardian Number</label><PhoneInput defaultCountry="IN" value={form.emergency_contact || ''} onChange={val => setForm({...form, emergency_contact: val})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Height (cm)</label><input type="number" value={form.height || ''} onChange={e => setForm({...form, height: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Weight (kg)</label><input type="number" value={form.weight || ''} onChange={e => setForm({...form, weight: e.target.value})} style={inputStyle} /></div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}><h4 style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Cricket Profile</h4></div>
          <div><label style={labelStyle}>Batting Style</label><input value={form.batting_style || ''} onChange={e => setForm({...form, batting_style: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Bowling Style</label><input value={form.bowling_style || ''} onChange={e => setForm({...form, bowling_style: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Jersey Size</label><input value={form.jersey_size || ''} onChange={e => setForm({...form, jersey_size: e.target.value})} style={inputStyle} /></div>

          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Ball Types (comma separated)</label><input value={Array.isArray(form.balls_selected) ? form.balls_selected.join(', ') : form.balls_selected || ''} onChange={e => setForm({...form, balls_selected: e.target.value})} style={inputStyle} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Field Positions (comma separated)</label><input value={Array.isArray(form.field_positions) ? form.field_positions.join(', ') : form.field_positions || ''} onChange={e => setForm({...form, field_positions: e.target.value})} style={inputStyle} /></div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plans } = useConfig();

  // Viewer admin — no write access
  const isViewerAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('jws_user') || '{}')?.email === 'jwsadmin2026@gmail.com'; }
    catch { return false; }
  })();
  
  const getPlanName = (planId) => {
    if (!planId) return '—';
    const id = planId.trim();
    if (id === 'p1') return 'Basic';
    if (id === 'p2') return 'Elite';
    const plan = plans?.find(p => p.id === id);
    return plan ? plan.name : id;
  };

  const [player, setPlayer] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [referrerDetail, setReferrerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        adminAPI.getPlayerDetail(id),
        adminAPI.getCoaches(),
      ]);
      const p = pRes.data?.player || pRes.data;
      setPlayer(p);
      setSelectedCoach(p.allocated_coach_id || '');
      setReferrerDetail(pRes.data.referrerDetail);
      setCoaches(cRes.data?.coaches || cRes.data || []);
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load player.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleApproveDocs = async () => {
    const result = await Swal.fire({
      title: 'Approve Documents?',
      text: 'This will mark the player\'s documents as verified.',
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#10b981', cancelButtonColor: 'var(--bg-surface-elevated)',
      confirmButtonText: 'Yes, Approve', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    });
    if (!result.isConfirmed) return;
    try {
      await adminAPI.approveDocs(id);
      Swal.fire({ icon: 'success', title: 'Docs Approved!', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to approve docs.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  const handleToggleStatus = async () => {
    const isActive = player.status !== 'Disabled';

    if (isActive) {
      const { value: reason, isConfirmed } = await Swal.fire({
        title: 'Disable Player',
        input: 'textarea',
        inputLabel: 'Reason for disabling this player',
        inputPlaceholder: 'e.g., Violation of JWS terms...',
        inputAttributes: { required: true },
        showCancelButton: true,
        confirmButtonText: 'Disable',
        confirmButtonColor: '#ef4444',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      });
      if (!isConfirmed || !reason) return;
      try {
        await adminAPI.updatePlayerStatus(id, 'Disabled');
        setPlayer(prev => ({ ...prev, status: 'Disabled' }));
        Swal.fire({ icon: 'success', title: 'Player disabled', text: reason, timer: 2000, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update status.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      }
    } else {
      const { isConfirmed } = await Swal.fire({
        title: 'Enable Player?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      });
      if (!isConfirmed) return;
      try {
        await adminAPI.updatePlayerStatus(id, 'Active');
        setPlayer(prev => ({ ...prev, status: 'Active' }));
        Swal.fire({ icon: 'success', title: 'Player enabled', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update status.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      }
    }
  };

  const handleAssignCoach = async () => {
    if (!selectedCoach) return;
    setSaving(true);
    try {
      await adminAPI.assignCoach(id, selectedCoach);
      Swal.fire({ icon: 'success', title: 'Coach Assigned!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to assign coach.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (formData) => {
    try {
      await adminAPI.updatePlayer(id, formData);
      Swal.fire({ icon: 'success', title: 'Player Updated', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      setIsEditing(false);
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update player.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    }
  };

  const fileInputRef = React.useRef(null);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);

  const handleUploadIdCard = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(rawFile.type)) {
      return Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please upload a PDF, JPG, or PNG.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }

    setUploadingIdCard(true);
    try {
      // Compress before upload — route by file type
      let file;
      if (rawFile.type === 'application/pdf') {
        file = await compressPDF(rawFile, { scale: 1.2, quality: 0.7 });
      } else {
        file = await compressImage(rawFile, { maxDimension: 1200, quality: 0.8 });
      }

      await adminAPI.uploadPlayerIdCard(id, file);
      Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'ID Card has been saved.', timer: 1500, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.response?.data?.message || 'Failed to upload ID card.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally {
      setUploadingIdCard(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
      Loading player…
    </div>
  );

  if (!player) return null;

  const isActive = player.status !== 'Disabled';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin2/players')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="heading-1">{player.first_name} {player.last_name}</h1>
          <p style={{ fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{player.gicl_id}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input type="file" ref={fileInputRef} onChange={handleUploadIdCard} accept=".pdf,image/png,image/jpeg" style={{ display: 'none' }} />
          {!isViewerAdmin && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingIdCard}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', background: player.manual_id_card_url ? 'rgba(16,185,129,0.1)' : 'var(--brand-primary)', color: player.manual_id_card_url ? '#10b981' : '#121A3F', border: `1px solid ${player.manual_id_card_url ? 'rgba(16,185,129,0.3)' : 'var(--brand-primary)'}`, fontWeight: 600, fontSize: '0.875rem', cursor: uploadingIdCard ? 'wait' : 'pointer', transition: 'all 0.15s' }}
              >
                <FileText size={16} /> 
                {uploadingIdCard ? 'Uploading...' : player.manual_id_card_url ? 'Replace ID Card' : 'Upload ID Card'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.07)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                onClick={handleToggleStatus}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isActive ? '#ef4444' : '#10b981', border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                {isActive ? 'Disable Player' : 'Enable Player'}
              </button>
            </>
          )}
          {/* View ID Card (always visible to viewer admin if uploaded) */}
          {isViewerAdmin && player.manual_id_card_url && (
            <a
              href={player.manual_id_card_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', transition: 'all 0.15s' }}
            >
              <FileText size={16} /> View ID Card
            </a>
          )}
        </div>
      </div>
      
      {isEditing && <EditPlayerModal player={player} onClose={() => setIsEditing(false)} onSave={handleSaveEdit} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <Section title="Profile" icon={User}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', backgroundColor: 'var(--bg-color)', border: '2px solid var(--brand-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {player.profile_photo_url
                ? <img src={player.profile_photo_url} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={30} color="var(--text-secondary)" />
              }
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{player.first_name} {player.last_name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{player.email}</p>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', marginTop: '0.4rem', display: 'inline-block', backgroundColor: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isActive ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
          <InfoRow label="JWS ID" value={player.gicl_id} />
          <InfoRow label="Phone / WhatsApp" value={player.whatsapp || player.phone} />
          <InfoRow label="Gender" value={player.gender} />
          <InfoRow 
            label="Date of Birth" 
            value={
              player.dob 
                ? `${new Date(player.dob).toLocaleDateString('en-IN')} (Age: ${Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} Yrs)` 
                : null
            } 
          />
          <InfoRow label="Blood Group" value={player.blood_group} />
          <InfoRow label="Parent/Guardian Name" value={player.emergency_contact_name} />
          <InfoRow label="Parent/Guardian Number" value={player.emergency_contact} />
        </Section>

        <Section title="Address" icon={Mail}>
          <InfoRow label="Address" value={player.address_line1} />
          <InfoRow label="District / City" value={player.city} />
          <InfoRow label="State" value={player.state_code} />
          <InfoRow label="Country" value={player.country} />
          <InfoRow label="ZIP Code" value={player.zip_code} />
        </Section>

        <Section title="Cricket Profile" icon={UserCheck}>
          <InfoRow label="Batting Style" value={player.batting_style} />
          <InfoRow label="Bowling Style" value={player.bowling_style} />
          <InfoRow label="Height" value={player.height ? `${player.height} cm` : null} />
          <InfoRow label="Weight" value={player.weight ? `${player.weight} kg` : null} />
          <InfoRow label="Jersey Size" value={player.jersey_size} />

          <InfoRow label="Ball Types" value={Array.isArray(player.balls_selected) ? player.balls_selected.join(', ') : player.balls_selected} />
          <InfoRow label="Field Positions" value={Array.isArray(player.field_positions) ? player.field_positions.join(', ') : player.field_positions} />
        </Section>

        <Section title="Documents" icon={FileText}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {player.aadhar_front_url && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>🪪 Aadhaar — Front Side</span>
                <a href={player.aadhar_front_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)', fontSize: '0.8rem', fontWeight: 600 }}>View →</a>
              </div>
            )}
            {player.aadhar_back_url && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>🪪 Aadhaar — Back Side</span>
                <a href={player.aadhar_back_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)', fontSize: '0.8rem', fontWeight: 600 }}>View →</a>
              </div>
            )}
            {!player.aadhar_front_url && !player.aadhar_back_url && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No documents uploaded.</p>
            )}
            {player.aadhar_front_url && !player.aadhar_back_url && (
              <p style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: 500 }}>⚠️ Back side not yet uploaded by player.</p>
            )}
            {(player.aadhar_front_url || player.aadhar_back_url) && !isViewerAdmin && (
              <button
                onClick={handleApproveDocs}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', background: player.docs_approved ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600, fontSize: '0.875rem', cursor: player.docs_approved ? 'default' : 'pointer', width: 'fit-content', transition: 'all 0.15s' }}
                disabled={player.docs_approved}
              >
                <CheckCircle size={16} />
                {player.docs_approved ? 'Docs Approved ✓' : 'Approve Documents'}
              </button>
            )}
            {/* Viewer admin: show approval status only */}
            {(player.aadhar_front_url || player.aadhar_back_url) && isViewerAdmin && (
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: player.docs_approved ? '#10b981' : '#f59e0b' }}>
                {player.docs_approved ? '✓ Documents Approved' : '⏳ Documents Pending Approval'}
              </span>
            )}
          </div>
        </Section>

        <Section title="Payment Info" icon={CreditCard}>
          <InfoRow label="Plan" value={player.plan_name || getPlanName(player.plan)} />
          <InfoRow label="Payment Status" value={player.payment_status} />
          <InfoRow label="Payment Date" value={player.payment_date ? new Date(player.payment_date).toLocaleDateString('en-IN') : (player.created_at ? new Date(player.created_at).toLocaleDateString('en-IN') : null)} />
          <InfoRow label="Transaction ID" value={player.payment_order_id || player.payment_id} />
        </Section>


        {player.cashouts && player.cashouts.length > 0 && (
          <Section title="Cashout History" icon={DollarSign}>
            {player.cashouts.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.875rem' }}>
                <span>₹{c.amount} — {c.method}</span>
                <span style={{ color: c.status === 'approved' ? '#10b981' : c.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{c.status}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Assign Selector */}
        <Section title="Assign Selector" icon={UserCheck}>
          {isViewerAdmin ? (
            // Read-only view for viewer admin
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {player.allocated_coach_id && coaches.find(c => c.id === player.allocated_coach_id)
                ? <>
                    Currently assigned to:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {coaches.find(c => c.id === player.allocated_coach_id)?.first_name}{' '}
                      {coaches.find(c => c.id === player.allocated_coach_id)?.last_name}
                    </strong>
                  </>
                : 'No selector assigned yet.'}
            </p>
          ) : (
            // Full interactive form for full admin
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={selectedCoach}
                onChange={e => setSelectedCoach(e.target.value)}
                style={{ flex: 1, minWidth: 180, padding: '0.65rem 2.5rem 0.65rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em' }}
              >
                <option value="">No Selector</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                ))}
              </select>
              <button
                onClick={handleAssignCoach}
                disabled={saving}
                style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'wait' : 'pointer', border: 'none', transition: 'all 0.15s' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
          {!isViewerAdmin && player.allocated_coach_id && coaches.find(c => c.id === player.allocated_coach_id) && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Current selector: <strong style={{ color: 'var(--text-primary)' }}>
                {coaches.find(c => c.id === player.allocated_coach_id)?.first_name} {coaches.find(c => c.id === player.allocated_coach_id)?.last_name}
              </strong>
            </p>
          )}
        </Section>
      </div>
    </div>
  );
};

export default PlayerDetail;
