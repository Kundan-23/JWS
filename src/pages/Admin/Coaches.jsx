import React, { useEffect, useRef, useState } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { Plus, Pencil, Trash2, X, Camera, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { compressImage } from '../../utils/imageCompressor';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

const BATTING_STYLES = ['Right-hand Bat', 'Left-hand Bat'];
const BOWLING_STYLES = ['Right-arm Fast', 'Right-arm Medium Fast', 'Right-arm Medium', 'Right-arm Off Spin', 'Right-arm Leg Spin', 'Left-arm Fast', 'Left-arm Medium', 'Left-arm Orthodox', 'Left-arm Chinaman', 'None'];
const BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const JERSEY_SIZES   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const GENDERS        = ['Male', 'Female', 'Other'];

const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', whatsapp: '', password: '',
  dob: '', gender: '', blood_group: '', emergency_contact: '', emergency_contact_name: '',
  address_line1: '', address_line2: '', city: '', country: 'India', zip_code: '',
  batting_style: '', bowling_style: '', jersey_size: '', instagram_link: '',
  cricket_history: '', coaching_history: '',
  profile_photo_url: '',
};

// ─── Comprehensive Coach Form ──────────────────────────────────────────────
const CoachFormDrawer = ({ coach, onClose, onSave }) => {
  const [form, setForm]       = useState(coach ? { 
    ...EMPTY_FORM, 
    ...coach,
    emergency_contact: coach.emergency_contact || coach.emergencyContact || '',
    emergency_contact_name: coach.emergency_contact_name || coach.emergencyContactName || '',
    address_line1: coach.address_line1 || coach.addressLine1 || '',
    address_line2: coach.address_line2 || coach.addressLine2 || '',
    city: coach.city || '',
    country: coach.country || 'India',
    zip_code: coach.zip_code || coach.zipCode || '',
    batting_style: coach.batting_style || coach.battingStyle || '',
    bowling_style: coach.bowling_style || coach.bowlingStyle || '',
    jersey_size: coach.jersey_size || coach.jerseySize || '',
    instagram_link: coach.instagram_link || coach.instagramLink || '',
    cricket_history: coach.cricket_history || coach.cricketHistory || '',
    coaching_history: coach.coaching_history || coach.coachingHistory || '',
    profile_photo_url: coach.profile_photo_url || coach.profilePhotoUrl || '',
    password: '' 
  } : { ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [photoPreview, setPhotoPreview] = useState(coach?.profile_photo_url || null);
  const [pincodeState, setPincodeState] = useState({ loading: false, stateName: '', error: '' });
  const [aadharFrontFile, setAadharFrontFile] = useState(null);
  const [aadharBackFile, setAadharBackFile] = useState(null);

  const getAadharUrls = () => {
    try {
      const parsed = JSON.parse(coach?.aadhar_url || '{}');
      if (parsed && typeof parsed === 'object') {
        return {
          front: parsed.front || '',
          back: parsed.back || ''
        };
      }
    } catch (e) {}
    return { front: coach?.aadhar_url || '', back: '' };
  };
  const aadharUrls = getAadharUrls();
  const photoRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.zip_code?.length === 6) {
      const fetchLocation = async () => {
        setPincodeState({ loading: true, stateName: '', error: '' });
        try {
          let foundState = '';
          const res = await fetch(`https://api.postalpincode.in/pincode/${form.zip_code}`);
          const data = await res.json();
          if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            foundState = data[0].PostOffice[0].State;
            if (!form.city && data[0].PostOffice[0].District) {
              setForm(f => ({ ...f, city: data[0].PostOffice[0].District }));
            }
          } else {
            // Fallback to Zippopotam
            const res2 = await fetch(`https://api.zippopotam.us/in/${form.zip_code}`);
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2.places && data2.places.length > 0) {
                foundState = data2.places[0].state;
                if (!form.city && data2.places[0]['place name']) {
                  setForm(f => ({ ...f, city: data2.places[0]['place name'] }));
                }
              }
            }
          }

          if (foundState) {
            setPincodeState({ loading: false, stateName: foundState, error: '' });
          } else {
            setPincodeState({ loading: false, stateName: '', error: 'Invalid Pincode' });
          }
        } catch {
          setPincodeState({ loading: false, stateName: '', error: 'Lookup failed' });
        }
      };
      fetchLocation();
    }
  }, [form.zip_code]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      set('profile_photo_url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        whatsapp: form.whatsapp,
        dob: form.dob,
        gender: form.gender,
        bloodGroup: form.blood_group,
        emergencyContact: form.emergency_contact,
        emergencyContactName: form.emergency_contact_name,
        addressLine1: form.address_line1,
        addressLine2: form.address_line2,
        city: form.city,
        country: form.country,
        zipCode: form.zip_code,
        battingStyle: form.batting_style,
        bowlingStyle: form.bowling_style,
        jerseySize: form.jersey_size,
        instagramLink: form.instagram_link,
        cricketHistory: form.cricket_history,
        coachingHistory: form.coaching_history,
        profilePhotoUrl: form.profile_photo_url,
      };
      if (form.password) payload.password = form.password;
      await onSave(payload, aadharFrontFile, aadharBackFile);
    } finally {
      setSaving(false);
    }
  };

  const inp = { width: '100%', padding: '0.65rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 };
  const sel = { ...inp, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.2rem' };
  const sec = { marginBottom: '1.5rem' };
  const secTitle = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(203,249,5,0.2)' };
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' };
  const fgrp = { display: 'flex', flexDirection: 'column' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />

      {/* Drawer Panel */}
      <div style={{ position: 'relative', backgroundColor: 'var(--bg-surface)', width: '100%', maxWidth: 680, overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-surface)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="heading-2" style={{ margin: 0 }}>{coach ? 'Edit Selector' : 'Add Selector'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {coach ? `Editing ${coach.first_name} ${coach.last_name}` : 'Fill in the complete selector profile'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem', flex: 1 }}>

          {/* Profile Photo */}
          <div style={{ ...sec, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              onClick={() => photoRef.current?.click()}
              style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid var(--brand-primary)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(203,249,5,0.08)', position: 'relative' }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="Coach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={28} color="var(--brand-primary)" />
              }
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Click to upload profile photo</span>
          </div>

          {/* Section: Account Details */}
          <div style={sec}>
            <p style={secTitle}>🔐 Account Details</p>
            <div style={{ ...grid2, marginBottom: '0.875rem' }}>
              <div style={fgrp}><label style={lbl}>First Name *</label><input required style={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" /></div>
              <div style={fgrp}><label style={lbl}>Last Name *</label><input required style={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" /></div>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Email Address *</label>
              <input required type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="coach@example.com" disabled={!!coach} />
            </div>
            <div style={{ ...grid2, marginBottom: '0.875rem' }}>
              <div style={fgrp}>
                <label style={lbl}>WhatsApp</label>
                <PhoneInput international defaultCountry="IN" value={form.whatsapp} onChange={v => set('whatsapp', v)} style={{ ...inp, '--PhoneInput-color--focus': 'transparent' }} />
              </div>
              <div style={fgrp}><label style={lbl}>{coach ? 'New Password (blank = no change)' : 'Password *'}</label><input required={!coach} type="password" style={inp} value={form.password} onChange={e => set('password', e.target.value)} placeholder={coach ? 'Leave blank to keep' : 'Min 8 characters'} minLength={coach ? 0 : 8} /></div>
            </div>
          </div>

          {/* Section: Personal Details */}
          <div style={sec}>
            <p style={secTitle}>👤 Personal Details</p>
            <div style={{ ...grid3, marginBottom: '0.875rem' }}>
              <div style={fgrp}><label style={lbl}>Date of Birth</label><input type="date" style={inp} value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
              <div style={fgrp}>
                <label style={lbl}>Gender</label>
                <select style={sel} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">--Select--</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={fgrp}>
                <label style={lbl}>Blood Group</label>
                <select style={sel} value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  <option value="">--Select--</option>
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Emergency Contact Name</label>
              <input style={inp} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Contact person's full name" />
            </div>
              <div style={fgrp}>
                <label style={lbl}>Emergency Contact *</label>
                <PhoneInput international defaultCountry="IN" value={form.emergency_contact} onChange={v => set('emergency_contact', v)} style={{ ...inp, '--PhoneInput-color--focus': 'transparent' }} />
              </div>
          </div>

          {/* Section: Address */}
          <div style={sec}>
            <p style={secTitle}>📍 Address</p>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Flat no, Wing name, Build name, Sector</label>
              <input style={inp} value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="Building, Street" />
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Area and Address</label>
              <input style={inp} value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Area, Landmark (optional)" />
            </div>
            <div style={{ ...grid3, marginBottom: '0.875rem' }}>
              <div style={fgrp}>
                <label style={lbl}>Pincode</label>
                <input type="tel" style={inp} value={form.zip_code} onChange={e => set('zip_code', e.target.value)} placeholder="400001" maxLength={6} />
                {pincodeState.loading && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>🔍 Detecting...</span>}
                {pincodeState.stateName && !pincodeState.loading && <span style={{ fontSize: '0.78rem', color: 'var(--success)', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>📍 {pincodeState.stateName}</span>}
                {pincodeState.error && <span style={{ fontSize: '0.78rem', color: 'var(--error)', display: 'block', marginTop: '0.25rem' }}>⚠️ {pincodeState.error}</span>}
              </div>
              <div style={fgrp}><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" /></div>
              <div style={fgrp}><label style={lbl}>Country</label><input style={inp} value={form.country} onChange={e => set('country', e.target.value)} placeholder="India" /></div>
            </div>
          </div>

          {/* Section: Cricket Profile */}
          <div style={sec}>
            <p style={secTitle}>🏏 Cricket Profile</p>
            <div style={{ ...grid3, marginBottom: '0.875rem' }}>
              <div style={fgrp}>
                <label style={lbl}>Batting Style</label>
                <select style={sel} value={form.batting_style} onChange={e => set('batting_style', e.target.value)}>
                  <option value="">--Select--</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={fgrp}>
                <label style={lbl}>Bowling Style</label>
                <select style={sel} value={form.bowling_style} onChange={e => set('bowling_style', e.target.value)}>
                  <option value="">--Select--</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={fgrp}>
                <label style={lbl}>Jersey Size</label>
                <select style={sel} value={form.jersey_size} onChange={e => set('jersey_size', e.target.value)}>
                  <option value="">--Select--</option>
                  {JERSEY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Playing History / Career Summary</label>
              <textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={form.cricket_history} onChange={e => set('cricket_history', e.target.value)} placeholder="Highest level played, teams represented, key achievements..." />
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={lbl}>Coaching History / Experience</label>
              <textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={form.coaching_history} onChange={e => set('coaching_history', e.target.value)} placeholder="Certifications, previous clubs coached, years of experience..." />
            </div>
          </div>

          {/* Section: Other */}
          <div style={sec}>
            <p style={secTitle}>🔗 Other Details</p>
            <div style={{ ...grid2 }}>
              <div style={fgrp}><label style={lbl}>Instagram Link</label><input style={inp} value={form.instagram_link} onChange={e => set('instagram_link', e.target.value)} placeholder="@handle or URL" /></div>
            </div>
          </div>

          {/* Section: Documents */}
          <div style={sec}>
            <p style={secTitle}>📄 Documents</p>
            <div style={{ ...grid2 }}>
              <div style={fgrp}>
                <label style={lbl}>Aadhaar Card Front (PDF/Image)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setAadharFrontFile(e.target.files[0])} style={{ ...inp, padding: '0.4rem' }} />
                {aadharUrls.front && !aadharFrontFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.3rem' }}>
                    ✓ Uploaded (<a href={aadharUrls.front} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)', textDecoration: 'underline' }}>View</a>)
                  </span>
                )}
              </div>
              <div style={fgrp}>
                <label style={lbl}>Aadhaar Card Back (PDF/Image)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setAadharBackFile(e.target.files[0])} style={{ ...inp, padding: '0.4rem' }} />
                {aadharUrls.back && !aadharBackFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.3rem' }}>
                    ✓ Uploaded (<a href={aadharUrls.back} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)', textDecoration: 'underline' }}>View</a>)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.7rem 1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '0.7rem 2rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(203,249,5,0.3)' }}>
              {saving ? 'Saving…' : coach ? 'Save Changes' : 'Add Selector'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Coaches List Page ─────────────────────────────────────────────────────
const Coaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'add' | coach object

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getCoaches();
      setCoaches(r.data?.coaches || r.data || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load coaches.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data, aadharFrontFile, aadharBackFile) => {
    try {
      let coachId;
      if (modal && modal !== 'add') {
        await adminAPI.updateCoach(modal.id, data);
        coachId = modal.id;
        Swal.fire({ icon: 'success', title: 'Selector Updated!', timer: 1400, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      } else {
        const res = await adminAPI.createCoach(data);
        coachId = res.data.coach.id;
        Swal.fire({ icon: 'success', title: 'Selector Added!', timer: 1400, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      }

      if (aadharFrontFile) {
        const compressed = await compressImage(aadharFrontFile, { maxDimension: 1200, quality: 0.8 });
        await adminAPI.uploadCoachDocument(coachId, 'aadhar_front', compressed);
      }
      if (aadharBackFile) {
        const compressed = await compressImage(aadharBackFile, { maxDimension: 1200, quality: 0.8 });
        await adminAPI.uploadCoachDocument(coachId, 'aadhar_back', compressed);
      }

      setModal(null);
      load();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Operation failed.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      throw err;
    }
  };

  const handleDelete = async (coach) => {
    const result = await Swal.fire({
      title: `Delete ${coach.first_name} ${coach.last_name}?`,
      text: 'This action cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: 'transparent',
      confirmButtonText: 'Delete', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    });
    if (!result.isConfirmed) return;
    try {
      await adminAPI.deleteCoach(coach.id);
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
          <h1 className="heading-1">Selectors</h1>
          <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Manage all JWS selectors and their complete profiles.</p>
        </div>
        <button
          onClick={() => setModal('add')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(203,249,5,0.25)' }}
        >
          <Plus size={18} /> Add Selector
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading selectors…</div>
          ) : coaches.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No selectors found. Add one!</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>Selector ID</th>
                  <th style={thStyle}>First Name</th>
                  <th style={thStyle}>Last Name</th>
                  <th style={thStyle}>Date of Birth</th>
                  <th style={thStyle}>Age</th>
                  <th style={thStyle}>Whatsapp</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Pincode</th>
                  <th style={thStyle}>Aadhaar Front</th>
                  <th style={thStyle}>Aadhaar Back</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => {
                  const age = c.dob
                    ? Math.floor((Date.now() - new Date(c.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                    : null;
                  const dob = c.dob
                    ? new Date(c.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—';
                  const docBadge = (uploaded) => (
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                      backgroundColor: uploaded ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                      color: uploaded ? '#10b981' : '#ef4444',
                      border: `1px solid ${uploaded ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
                      {uploaded ? '✓ Done' : 'Pending'}
                    </span>
                  );
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.78rem' }}>{c.gicl_id || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.first_name}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.last_name}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{dob}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{age ?? '—'}</td>
                      <td style={tdStyle}>{c.whatsapp || '—'}</td>
                      <td style={tdStyle}>{c.city || '—'}</td>
                       <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{c.zip_code || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{(() => {
                        try {
                          const parsed = JSON.parse(c.aadhar_url || '{}');
                          return docBadge(!!(parsed && parsed.front));
                        } catch (e) {
                          return docBadge(!!c.aadhar_url);
                        }
                      })()}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{(() => {
                        try {
                          const parsed = JSON.parse(c.aadhar_url || '{}');
                          return docBadge(!!(parsed && parsed.back));
                        } catch (e) {
                          return docBadge(false);
                        }
                      })()}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: c.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: c.status === 'Active' ? '#10b981' : '#ef4444',
                          border: `1px solid ${c.status === 'Active' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                          {c.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setModal(c)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(96,165,250,0.1)', color: 'var(--brand-accent)', border: '1px solid rgba(96,165,250,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDelete(c)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && <CoachFormDrawer coach={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
};

export default Coaches;

