import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { adminAPI } from '../../services/adminAPI';
import { useConfig } from '../../context/ConfigContext';
import { Save, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import Swal from 'sweetalert2';

// ─── Style constants ────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.875rem',
  backgroundColor: 'rgba(0,0,0,0.2)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
};
const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
  fontWeight: 500,
};
const saveBtnStyle = (saving) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.55rem 1.2rem',
  borderRadius: 'var(--radius-md)',
  background: 'var(--brand-primary)',
  color: '#121A3F',
  fontWeight: 700,
  fontSize: '0.8rem',
  cursor: saving ? 'wait' : 'pointer',
  border: 'none',
  transition: 'all 0.15s',
});
const sectionCardStyle = {
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-subtle)',
  marginBottom: '1.5rem',
  overflow: 'hidden',
};
const sectionHeaderStyle = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-subtle)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const sectionBodyStyle = { padding: '1.5rem' };

// ─── Shared Section wrapper ──────────────────────────────────────────────────
const Section = ({ title, description, children, onSave, saving }) => (
  <div style={sectionCardStyle}>
    <div style={sectionHeaderStyle}>
      <div>
        <h3 className="heading-3" style={{ marginBottom: '0.2rem' }}>{title}</h3>
        {description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {onSave && (
        <button onClick={onSave} disabled={saving} style={saveBtnStyle(saving)}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save'}
        </button>
      )}
    </div>
    <div style={sectionBodyStyle}>{children}</div>
  </div>
);

// ─── TagList component ───────────────────────────────────────────────────────
const TagList = ({ items, onRemove, onAdd, placeholder }) => {
  const [val, setVal] = useState('');
  const handleAdd = () => {
    const v = val.trim();
    if (v && !items.includes(v)) { onAdd(v); setVal(''); }
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', backgroundColor: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {item}
            <button onClick={() => onRemove(i)} style={{ background: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', padding: 0, lineHeight: 1, border: 'none' }}>
              <Trash2 size={12} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>None added yet.</span>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder || 'Add item…'}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          <Plus size={15} /> Add
        </button>
      </div>
    </div>
  );
};

// ─── Tab button ──────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.6rem 1.1rem',
      borderRadius: 'var(--radius-md)',
      border: active ? '1px solid rgba(203,249,5,0.4)' : '1px solid transparent',
      background: active ? 'rgba(203,249,5,0.12)' : 'transparent',
      color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
      fontWeight: active ? 700 : 500,
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// ─── Main Config component ───────────────────────────────────────────────────
const Config = () => {
  const { config, refetch } = useConfig();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [savingSection, setSavingSection] = useState(null);

  // Tab 1 — Referral
  const [referral, setReferral] = useState({ 
    level1: '', level2: '', level3: '', minCashout: '',
    level1Name: 'Level 1', level2Name: 'Level 2', level3Name: 'Level 3+',
    level1Active: true, level2Active: true, level3Active: true
  });

  // Tab 2 — Plans
  const [plans, setPlans] = useState([]);
  const [expandedTnc, setExpandedTnc] = useState({});

  // Tab 3 — Appearance
  const [landingBg, setLandingBg] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [banners, setBanners] = useState([]);
  const [adBanners, setAdBanners] = useState([]);
  const [uploadingLanding, setUploadingLanding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAdBanner, setUploadingAdBanner] = useState(false);
  const [kidsJerseyUrls, setKidsJerseyUrls] = useState([]);
  const [adultsJerseyUrls, setAdultsJerseyUrls] = useState([]);
  const [uploadingKidsJersey, setUploadingKidsJersey] = useState(false);
  const [uploadingAdultsJersey, setUploadingAdultsJersey] = useState(false);
  const landingFileRef = useRef();
  const appLogoRef = useRef();
  const bannerFileRef = useRef();
  const adBannerFileRef = useRef();
  const kidsJerseyRef = useRef();
  const adultsJerseyRef = useRef();
  const sponsor1FileRef = useRef();
  const sponsor2FileRef = useRef();
  const [uploadingSponsor, setUploadingSponsor] = useState({ 1: false, 2: false });
  const [sponsorTimestamp, setSponsorTimestamp] = useState(Date.now());

  // Tab 4 — Player Options
  const [jerseySizes, setJerseySizes] = useState([]);
  const [battingStyles, setBattingStyles] = useState([]);
  const [bowlingStyles, setBowlingStyles] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [ballTypes, setBallTypes] = useState([]); // array of { name, imageUrl } or legacy strings
  const [showBallForm, setShowBallForm] = useState(false);
  const [newBallName, setNewBallName] = useState('');
  const [uploadingBall, setUploadingBall] = useState(false);
  const ballFileRef = useRef();
  const [ageGroups, setAgeGroups] = useState([]); // array of { cat, sub, color }
  const [showAgeForm, setShowAgeForm] = useState(false);
  const [newAge, setNewAge] = useState({ cat: '', sub: '', color: '#cbf905', maxYears: '', maxMonths: '', maxDays: '', minYears: '', minMonths: '', minDays: '' });
  const [maxPlayersPerCoach, setMaxPlayersPerCoach] = useState(20);

  // Tab 5 — Registration T&C
  const [regTerms, setRegTerms] = useState('');

  // Tab 6 — Training
  const [basicVideos, setBasicVideos] = useState([]);
  const [advanceFee, setAdvanceFee] = useState(499);
  const [newBasicVideo, setNewBasicVideo] = useState({ id: '', title: '', url: '' });

  // ─── Load config on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await adminAPI.getConfig();
        const cfg = r.data?.config || r.data || {};

        // Tab 1
        if (cfg.referral) {
          setReferral({ 
            level1: cfg.referral.level1 ?? '', level2: cfg.referral.level2 ?? '', level3: cfg.referral.level3plus ?? '', minCashout: cfg.referral.minCashout ?? '',
            level1Name: cfg.referral.level1Name ?? 'Level 1', level2Name: cfg.referral.level2Name ?? 'Level 2', level3Name: cfg.referral.level3Name ?? 'Level 3+',
            level1Active: cfg.referral.level1Active ?? true, level2Active: cfg.referral.level2Active ?? true, level3Active: cfg.referral.level3Active ?? true
          });
        } else {
          // Also handle flat keys from backend
          setReferral({
            level1: cfg.referral_level1 ?? '',
            level2: cfg.referral_level2 ?? '',
            level3: cfg.referral_level3plus ?? '',
            minCashout: cfg.referral_min_cashout ?? '',
            level1Name: cfg.referral_level1_name ?? 'Level 1',
            level2Name: cfg.referral_level2_name ?? 'Level 2',
            level3Name: cfg.referral_level3plus_name ?? 'Level 3+',
            level1Active: cfg.referral_level1_active ?? true,
            level2Active: cfg.referral_level2_active ?? true,
            level3Active: cfg.referral_level3plus_active ?? true,
          });
        }

        // Tab 2
        if (cfg.plans) setPlans(cfg.plans.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : [], terms: p.terms || '' })));

        // Tab 3
        if (cfg.landing_bg_image) setLandingBg(cfg.landing_bg_image);
        if (cfg.app_logo_url || cfg.appLogoUrl) setAppLogo(cfg.app_logo_url || cfg.appLogoUrl);
        if (Array.isArray(cfg.banners)) setBanners(cfg.banners);
        if (Array.isArray(cfg.ad_banners)) setAdBanners(cfg.ad_banners);
        if (Array.isArray(cfg.kids_jersey_measure_urls)) setKidsJerseyUrls(cfg.kids_jersey_measure_urls);
        if (Array.isArray(cfg.adults_jersey_measure_urls)) setAdultsJerseyUrls(cfg.adults_jersey_measure_urls);

        // Tab 4
        if (cfg.jersey_sizes || cfg.jerseySizes) setJerseySizes(cfg.jersey_sizes || cfg.jerseySizes);
        if (cfg.batting_styles || cfg.battingStyles) setBattingStyles(cfg.batting_styles || cfg.battingStyles);
        if (cfg.bowling_styles || cfg.bowlingStyles) setBowlingStyles(cfg.bowling_styles || cfg.bowlingStyles);
        if (Array.isArray(cfg.clubs)) setClubs(cfg.clubs);
        if (Array.isArray(cfg.ball_types)) {
          // Normalize: legacy strings become { name: str, imageUrl: '' }
          setBallTypes(cfg.ball_types.map(b => typeof b === 'string' ? { name: b, imageUrl: '' } : b));
        } else if (Array.isArray(cfg.ballTypes)) {
          setBallTypes(cfg.ballTypes.map(b => typeof b === 'string' ? { name: b, imageUrl: '' } : b));
        }
        if (Array.isArray(cfg.age_groups)) setAgeGroups(cfg.age_groups);
        if (cfg.max_squad_size !== undefined) setMaxPlayersPerCoach(cfg.max_squad_size);
        else if (cfg.max_players_per_coach !== undefined) setMaxPlayersPerCoach(cfg.max_players_per_coach);

        // Tab 5
        if (cfg.registration_terms !== undefined) setRegTerms(cfg.registration_terms || '');

        // Tab 6
        if (Array.isArray(cfg.basic_training_videos)) setBasicVideos(cfg.basic_training_videos);
        if (cfg.advance_training_fee !== undefined) setAdvanceFee(cfg.advance_training_fee);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load config.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // ─── Generic save via adminAPI ─────────────────────────────────────────────
  const save = async (section, data) => {
    setSavingSection(section);
    try {
      await adminAPI.updateConfig(data);
      Swal.fire({ icon: 'success', title: 'Saved!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setSavingSection(null); }
  };

  // ─── Plan helpers ─────────────────────────────────────────────────────────
  const updatePlanField = (pi, field, val) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, [field]: val } : p));
  const updatePlanFeature = (pi, fi, val) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, features: p.features.map((f, j) => j === fi ? val : f) } : p));
  const addPlanFeature = (pi) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, features: [...p.features, ''] } : p));
  const removePlanFeature = (pi, fi) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, features: p.features.filter((_, j) => j !== fi) } : p));

  const updatePlanFaq = (pi, fi, field, val) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, faqs: (p.faqs||[]).map((f, j) => j === fi ? { ...f, [field]: val } : f) } : p));
  const addPlanFaq = (pi) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, faqs: [...(p.faqs||[]), { q: '', a: '' }] } : p));
  const removePlanFaq = (pi, fi) => setPlans(ps => ps.map((p, i) => i === pi ? { ...p, faqs: (p.faqs||[]).filter((_, j) => j !== fi) } : p));
  const toggleTnc = (pi) => setExpandedTnc(prev => ({ ...prev, [pi]: !prev[pi] }));

  const deletePlan = async (pi) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete this plan?',
      text: 'Players who already purchased it will not be affected, but it will be removed from registration.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
    });
    if (!isConfirmed) return;
    const updated = plans.filter((_, i) => i !== pi);
    setPlans(updated);
    await save('plans', { plans: updated });
  };

  const addNewPlan = () => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: 'New Plan',
      price: 0,
      features: ['Feature 1'],
      terms: '',
    };
    setPlans(ps => [...ps, newPlan]);
  };

  // ─── File upload helper ───────────────────────────────────────────────────
  const uploadFile = async (file, endpoint) => {
    if (!file) return null;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'Too Large', text: 'Max file size is 2MB.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res = await axios.post(`${base}${endpoint}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('jws_token')}` },
    });
    return res.data?.url || null;
  };

  // ─── Landing BG upload ────────────────────────────────────────────────────
  const handleLandingUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLanding(true);
    try {
      const url = await uploadFile(file, '/admin/config/banner/upload');
      if (!url) return;
      setLandingBg(url);
      await adminAPI.updateConfig({ landing_bg_image: url });
      Swal.fire({ icon: 'success', title: 'Background updated!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message, background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setUploadingLanding(false); if (landingFileRef.current) landingFileRef.current.value = ''; }
  };

  const handleClearLanding = async () => {
    setLandingBg('');
    await adminAPI.updateConfig({ landing_bg_image: '' });
  };

  // ─── App Logo upload ───────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return Swal.fire('Error', 'Image must be under 2MB', 'error');

    setUploadingLogo(true);
    try {
      const url = await uploadFile(file, '/admin/config/app-logo/upload');
      setAppLogo(url);
      
      await adminAPI.updateConfig({ app_logo_url: url });
      if (refetch) refetch();
      
      Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'App Logo updated.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not upload logo' });
    } finally { setUploadingLogo(false); if (appLogoRef.current) appLogoRef.current.value = ''; }
  };

  const handleRemoveLogo = async () => {
    setAppLogo('');
    await adminAPI.updateConfig({ app_logo_url: '' });
    if (refetch) refetch();
  };

  // ─── Kids Jersey Measure Image upload ──────────────────────────────────────────────
  const handleKidsJerseyUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return Swal.fire('Error', 'Image must be under 5MB', 'error');
    if (kidsJerseyUrls.length >= 4) return Swal.fire('Error', 'Maximum 4 images allowed', 'error');

    setUploadingKidsJersey(true);
    try {
      const url = await uploadFile(file, '/admin/config/jersey-measure/upload');
      if (!url) return;
      const updated = [...kidsJerseyUrls, url];
      setKidsJerseyUrls(updated);
      await adminAPI.updateConfig({ kids_jersey_measure_urls: updated });
      if (refetch) refetch();
      Swal.fire({ icon: 'success', title: 'Added!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not upload image' });
    } finally { setUploadingKidsJersey(false); if (kidsJerseyRef.current) kidsJerseyRef.current.value = ''; }
  };

  const handleRemoveKidsJersey = async (idx) => {
    const updated = kidsJerseyUrls.filter((_, i) => i !== idx);
    setKidsJerseyUrls(updated);
    await adminAPI.updateConfig({ kids_jersey_measure_urls: updated });
    if (refetch) refetch();
  };

  // ─── Adults Jersey Measure Image upload ──────────────────────────────────────────────
  const handleAdultsJerseyUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return Swal.fire('Error', 'Image must be under 5MB', 'error');
    if (adultsJerseyUrls.length >= 4) return Swal.fire('Error', 'Maximum 4 images allowed', 'error');

    setUploadingAdultsJersey(true);
    try {
      const url = await uploadFile(file, '/admin/config/jersey-measure/upload');
      if (!url) return;
      const updated = [...adultsJerseyUrls, url];
      setAdultsJerseyUrls(updated);
      await adminAPI.updateConfig({ adults_jersey_measure_urls: updated });
      if (refetch) refetch();
      Swal.fire({ icon: 'success', title: 'Added!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not upload image' });
    } finally { setUploadingAdultsJersey(false); if (adultsJerseyRef.current) adultsJerseyRef.current.value = ''; }
  };

  const handleRemoveAdultsJersey = async (idx) => {
    const updated = adultsJerseyUrls.filter((_, i) => i !== idx);
    setAdultsJerseyUrls(updated);
    await adminAPI.updateConfig({ adults_jersey_measure_urls: updated });
    if (refetch) refetch();
  };

  // ─── Dashboard banner upload ──────────────────────────────────────────────
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadFile(file, '/admin/config/banner/upload');
      if (!url) return;
      const updated = [...banners, url];
      setBanners(updated);
      await adminAPI.updateConfig({ banners: updated });
      Swal.fire({ icon: 'success', title: 'Banner added!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message, background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setUploadingBanner(false); if (bannerFileRef.current) bannerFileRef.current.value = ''; }
  };

  const handleRemoveBanner = async (idx) => {
    const updated = banners.filter((_, i) => i !== idx);
    setBanners(updated);
    await adminAPI.updateConfig({ banners: updated });
  };

  // ─── Ad banner upload ─────────────────────────────────────────────────────
  const handleAdBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAdBanner(true);
    try {
      const url = await uploadFile(file, '/admin/config/ad-banner/upload');
      if (!url) return;
      const updated = [...adBanners, url];
      setAdBanners(updated);
      await adminAPI.updateConfig({ ad_banners: updated });
      Swal.fire({ icon: 'success', title: 'Ad banner added!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message, background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setUploadingAdBanner(false); if (adBannerFileRef.current) adBannerFileRef.current.value = ''; }
  };

  const handleRemoveAdBanner = async (idx) => {
    const updated = adBanners.filter((_, i) => i !== idx);
    setAdBanners(updated);
    await adminAPI.updateConfig({ ad_banners: updated });
  };

  // ─── Sponsor Logo upload ──────────────────────────────────────────────────
  const handleSponsorUpload = async (e, slot) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingSponsor(prev => ({ ...prev, [slot]: true }));
    try {
      await adminAPI.uploadSponsorLogo(file, slot);
      setSponsorTimestamp(Date.now());
      Swal.fire({ icon: 'success', title: `Sponsor Logo ${slot} updated!`, timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.response?.data?.message || err.message, background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { 
      setUploadingSponsor(prev => ({ ...prev, [slot]: false })); 
      if (slot === 1 && sponsor1FileRef.current) sponsor1FileRef.current.value = ''; 
      if (slot === 2 && sponsor2FileRef.current) sponsor2FileRef.current.value = ''; 
    }
  };

  // ─── Ball type image upload ────────────────────────────────────────────────
  const handleBallImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !newBallName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Enter a name first', text: 'Please type a ball name before choosing an image.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
      if (ballFileRef.current) ballFileRef.current.value = '';
      return;
    }
    setUploadingBall(true);
    try {
      const url = await uploadFile(file, '/admin/config/banner/upload');
      if (!url) return;
      const newBall = { name: newBallName.trim(), imageUrl: url };
      const updated = [...ballTypes, newBall];
      setBallTypes(updated);
      await adminAPI.updateConfig({ ball_types: updated });
      setNewBallName('');
      setShowBallForm(false);
      Swal.fire({ icon: 'success', title: 'Ball type added!', timer: 1200, showConfirmButton: false, background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message, background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' });
    } finally { setUploadingBall(false); if (ballFileRef.current) ballFileRef.current.value = ''; }
  };

  const handleRemoveBall = async (idx) => {
    const updated = ballTypes.filter((_, i) => i !== idx);
    setBallTypes(updated);
    await adminAPI.updateConfig({ ball_types: updated });
  };

  // ─── Age Groups ───────────────────────────────────────────────────────────
  const handleAddAgeGroup = async () => {
    if (!newAge.cat.trim() || !newAge.sub.trim()) return;
    const maxYears = newAge.maxYears ? parseInt(newAge.maxYears) : 99;
    const maxMonths = newAge.maxMonths ? parseInt(newAge.maxMonths) : 0;
    const maxDays = newAge.maxDays ? parseInt(newAge.maxDays) : 0;
    const minYears = newAge.minYears ? parseInt(newAge.minYears) : 0;
    const minMonths = newAge.minMonths ? parseInt(newAge.minMonths) : 0;
    const minDays = newAge.minDays ? parseInt(newAge.minDays) : 0;
    
    const updated = [...ageGroups, { 
      cat: newAge.cat, 
      sub: newAge.sub, 
      color: newAge.color,
      limit: { years: maxYears, months: maxMonths, days: maxDays },
      minLimit: { years: minYears, months: minMonths, days: minDays }
    }];
    setAgeGroups(updated);
    setNewAge({ cat: '', sub: '', color: '#cbf905', maxYears: '', maxMonths: '', maxDays: '', minYears: '', minMonths: '', minDays: '' });
    setShowAgeForm(false);
    await adminAPI.updateConfig({ age_groups: updated });
  };

  const handleRemoveAgeGroup = async (idx) => {
    const updated = ageGroups.filter((_, i) => i !== idx);
    setAgeGroups(updated);
    await adminAPI.updateConfig({ age_groups: updated });
  };

  const handleUpdateAgeLimit = async (idx, type, field, value) => {
    const updated = [...ageGroups];
    const ag = updated[idx];
    if (type === 'max') {
      if (!ag.limit) ag.limit = { years: ag.range?.[1] ?? 99, months: 0, days: 0 };
      ag.limit[field] = value ? parseInt(value) : 0;
    } else {
      if (!ag.minLimit) ag.minLimit = { years: ag.range?.[0] ?? 0, months: 0, days: 0 };
      ag.minLimit[field] = value ? parseInt(value) : 0;
    }
    setAgeGroups(updated);
    await adminAPI.updateConfig({ age_groups: updated });
  };

  const handleAgeColorChange = async (idx, color) => {
    const updated = ageGroups.map((ag, i) => i === idx ? { ...ag, color } : ag);
    setAgeGroups(updated);
    await adminAPI.updateConfig({ age_groups: updated });
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading config…</div>;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="heading-1">Configuration</h1>
        <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Manage global app settings and options.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.75rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'plans', label: 'Membership Plans' },
          { key: 'appearance', label: 'Appearance' },
          { key: 'player', label: 'Player Options' },
          { key: 'terms', label: 'Registration T&C' },
          { key: 'training', label: 'Training Videos' },
        ].map(tab => (
          <TabBtn key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
        ))}
      </div>


      {/* ─── TAB 2: Membership Plans ───────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <Section
          title="Membership Plans"
          description="Edit plan names, prices, features and per-plan Terms & Conditions."
          onSave={() => save('plans', { plans })}
          saving={savingSection === 'plans'}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {plans.map((plan, pi) => (
              <div key={plan.id || pi} style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                {/* Delete plan button */}
                <button
                  onClick={() => deletePlan(pi)}
                  title="Delete this plan"
                  style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <Trash2 size={12} /> Delete Plan
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', paddingRight: '5rem' }}>
                  Plan P{pi + 1}
                </p>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Plan Name</label>
                  <input value={plan.name} onChange={e => updatePlanField(pi, 'name', e.target.value)} style={inputStyle} placeholder="e.g. Basic" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Price (₹)</label>
                  <input type="number" min="0" value={plan.price} onChange={e => updatePlanField(pi, 'price', e.target.value)} style={inputStyle} placeholder="0" />
                </div>

                {/* Features */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Features</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {plan.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input value={f} onChange={e => updatePlanFeature(pi, fi, e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder={`Feature ${fi + 1}`} />
                        <button onClick={() => removePlanFeature(pi, fi)} style={{ padding: '0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addPlanFeature(pi)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.08)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                    <Plus size={13} /> Add Feature
                  </button>
                </div>

                {/* FAQs */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>FAQs</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {(plan.faqs || []).map((faq, fi) => (
                      <div key={fi} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input value={faq.q} onChange={e => updatePlanFaq(pi, fi, 'q', e.target.value)} style={{ ...inputStyle, fontWeight: 600 }} placeholder="Q: e.g. What is this?" />
                          <textarea value={faq.a} onChange={e => updatePlanFaq(pi, fi, 'a', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="A: Your answer here..." />
                        </div>
                        <button onClick={() => removePlanFaq(pi, fi)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', marginTop: '0.2rem', height: 'fit-content' }} title="Remove FAQ">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addPlanFaq(pi)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', width: 'max-content' }}>
                    <Plus size={14} /> Add FAQ
                  </button>
                </div>

                {/* T&C collapsible */}
                <div>
                  <button
                    onClick={() => toggleTnc(pi)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.6rem 0.75rem', backgroundColor: 'rgba(203,249,5,0.06)', border: '1px solid rgba(203,249,5,0.15)', borderRadius: 'var(--radius-md)', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    <span>Edit T&amp;C</span>
                    {expandedTnc[pi] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {expandedTnc[pi] && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <textarea
                        value={plan.terms || ''}
                        onChange={e => updatePlanField(pi, 'terms', e.target.value)}
                        rows={5}
                        placeholder="Enter terms and conditions for this plan…"
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                        {(plan.terms || '').length} characters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add New Plan card */}
            <div
              onClick={addNewPlan}
              style={{ backgroundColor: 'rgba(203,249,5,0.04)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '2px dashed rgba(203,249,5,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', minHeight: '160px', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(203,249,5,0.1)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(203,249,5,0.04)'}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(203,249,5,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="var(--brand-primary)" />
              </div>
              <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Create New Plan</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>Click to add a new membership plan</p>
            </div>
          </div>
        </Section>
      )}

      {/* ─── TAB 3: Appearance ─────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <>
          {/* A. Landing Page Background */}
          <Section title="Landing Page Background" description="Upload a background image for the app landing screen. (Max 2MB)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {landingBg && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <img src={landingBg} alt="Landing BG Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input ref={landingFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLandingUpload} />
                <button
                  onClick={() => landingFileRef.current?.click()}
                  disabled={uploadingLanding}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.85rem', cursor: uploadingLanding ? 'wait' : 'pointer', border: 'none' }}
                >
                  <ImageIcon size={15} /> {uploadingLanding ? 'Uploading…' : 'Upload Background'}
                </button>
                {landingBg && (
                  <button
                    onClick={handleClearLanding}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
              {!landingBg && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No background image set.</p>}
            </div>
          </Section>

          {/* B. App Logo */}
          <Section title="Sidebar App Logo" description="Upload the main logo for the app. It will appear in the player sidebar. (Max 2MB)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appLogo && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <img src={appLogo} alt="Logo Preview" style={{ width: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input ref={appLogoRef} type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleLogoUpload} />
                <button
                  onClick={() => appLogoRef.current?.click()}
                  disabled={uploadingLogo}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.85rem', cursor: uploadingLogo ? 'wait' : 'pointer', border: 'none' }}
                >
                  <ImageIcon size={15} /> {uploadingLogo ? 'Uploading…' : 'Upload App Logo'}
                </button>
                {appLogo && (
                  <button
                    onClick={handleRemoveLogo}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
              {!appLogo && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No logo set.</p>}
            </div>
          </Section>

          {/* C. Kids Jersey Measure Image */}
          <Section title="Kids Jersey Measure Images" description="Upload up to 4 images for the 'Kids Tshirt Measurement Guide'.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {kidsJerseyUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={url} alt={`Kids Measure ${idx + 1}`} style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleRemoveKidsJersey(idx)}
                    style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {kidsJerseyUrls.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No kids measure images yet.</p>}
            </div>
            {kidsJerseyUrls.length < 4 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input ref={kidsJerseyRef} type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleKidsJerseyUpload} />
                <button
                  onClick={() => kidsJerseyRef.current?.click()}
                  disabled={uploadingKidsJersey}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 600, fontSize: '0.85rem', cursor: uploadingKidsJersey ? 'wait' : 'pointer', border: 'none' }}
                >
                  <ImageIcon size={15} /> {uploadingKidsJersey ? 'Uploading…' : 'Upload Kids Image'}
                </button>
              </div>
            )}
          </Section>

          {/* D. Adults Jersey Measure Image */}
          <Section title="Adults Jersey Measure Images" description="Upload up to 4 images for the 'Adults Tshirt Measurement Guide'.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {adultsJerseyUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={url} alt={`Adults Measure ${idx + 1}`} style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleRemoveAdultsJersey(idx)}
                    style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {adultsJerseyUrls.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No adults measure images yet.</p>}
            </div>
            {adultsJerseyUrls.length < 4 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input ref={adultsJerseyRef} type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleAdultsJerseyUpload} />
                <button
                  onClick={() => adultsJerseyRef.current?.click()}
                  disabled={uploadingAdultsJersey}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 600, fontSize: '0.85rem', cursor: uploadingAdultsJersey ? 'wait' : 'pointer', border: 'none' }}
                >
                  <ImageIcon size={15} /> {uploadingAdultsJersey ? 'Uploading…' : 'Upload Adults Image'}
                </button>
              </div>
            )}
          </Section>

          {/* D. Banners */}
          <Section title="Dashboard Banners" description="Images shown in the player dashboard banner carousel.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {banners.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={url} alt={`Banner ${idx + 1}`} style={{ width: 'auto', height: '120px', display: 'block', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleRemoveBanner(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {banners.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No banners yet.</p>}
            </div>
            <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
            <button
              onClick={() => bannerFileRef.current?.click()}
              disabled={uploadingBanner}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: uploadingBanner ? 'wait' : 'pointer' }}
            >
              <Plus size={15} /> {uploadingBanner ? 'Uploading…' : 'Upload Banner'}
            </button>
          </Section>

          {/* C. Ad Banners */}
          <Section title="Ad Banners" description="Advertising banners shown below announcements.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {adBanners.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={url} alt={`Ad Banner ${idx + 1}`} style={{ width: 'auto', height: '120px', display: 'block', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleRemoveAdBanner(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {adBanners.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No ad banners yet.</p>}
            </div>
            <input ref={adBannerFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAdBannerUpload} />
            <button
              onClick={() => adBannerFileRef.current?.click()}
              disabled={uploadingAdBanner}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: uploadingAdBanner ? 'wait' : 'pointer' }}
            >
              <Plus size={15} /> {uploadingAdBanner ? 'Uploading…' : 'Upload Ad Banner'}
            </button>
          </Section>

          {/* D. Sponsor Logos */}
          <Section title="Sponsor Logos" description="Logos displayed inside the player sidebar navigation.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[1, 2].map(slot => (
                <div key={slot} style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-lg)', padding: '1rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logo Placeholder {slot}</p>
                  
                  <div style={{ width: '100%', height: '80px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed var(--border-subtle)' }}>
                    <img 
                      src={`https://qrgwmahlngkmebtwntha.supabase.co/storage/v1/object/public/banners/sponsor-${slot}.png?t=${sponsorTimestamp}`} 
                      alt={`Sponsor ${slot}`} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      onLoad={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'none' }}>No image</span>
                  </div>

                  <input ref={slot === 1 ? sponsor1FileRef : sponsor2FileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSponsorUpload(e, slot)} />
                  <button
                    onClick={() => slot === 1 ? sponsor1FileRef.current?.click() : sponsor2FileRef.current?.click()}
                    disabled={uploadingSponsor[slot]}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, fontSize: '0.8rem', cursor: uploadingSponsor[slot] ? 'wait' : 'pointer', width: '100%' }}
                  >
                    <ImageIcon size={14} /> {uploadingSponsor[slot] ? 'Uploading…' : `Update Logo ${slot}`}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 4: Player Options ─────────────────────────────────────────── */}
      {activeTab === 'player' && (
        <>
          <Section title="Jersey Sizes" description="Add or remove jersey size options." onSave={() => save('jerseySizes', { jersey_sizes: jerseySizes })} saving={savingSection === 'jerseySizes'}>
            <TagList items={jerseySizes} onRemove={i => setJerseySizes(s => s.filter((_, j) => j !== i))} onAdd={v => setJerseySizes(s => [...s, v])} placeholder="e.g. XL" />
          </Section>

          <Section title="Batting Styles" description="Add or remove batting style options." onSave={() => save('battingStyles', { batting_styles: battingStyles })} saving={savingSection === 'battingStyles'}>
            <TagList items={battingStyles} onRemove={i => setBattingStyles(s => s.filter((_, j) => j !== i))} onAdd={v => setBattingStyles(s => [...s, v])} placeholder="e.g. Right-hand bat" />
          </Section>

          <Section title="Bowling Styles" description="Add or remove bowling style options." onSave={() => save('bowlingStyles', { bowling_styles: bowlingStyles })} saving={savingSection === 'bowlingStyles'}>
            <TagList items={bowlingStyles} onRemove={i => setBowlingStyles(s => s.filter((_, j) => j !== i))} onAdd={v => setBowlingStyles(s => [...s, v])} placeholder="e.g. Right-arm fast" />
          </Section>

          {/* Associated Clubs */}
          <Section title="Associated Clubs" description="Clubs players can be associated with." onSave={() => save('clubs', { clubs })} saving={savingSection === 'clubs'}>
            <TagList items={clubs} onRemove={i => setClubs(s => s.filter((_, j) => j !== i))} onAdd={v => setClubs(s => [...s, v])} placeholder="e.g. Mumbai Cricket Club" />
          </Section>

          {/* Ball Types with images */}
          <Section title="Ball Types" description="Add ball types with images. Legacy text entries are shown as text-only.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {ballTypes.map((ball, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0.5rem', gap: '0.4rem' }}>
                  {ball.imageUrl
                    ? <img src={ball.imageUrl} alt={ball.name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                    : <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>No image</div>
                  }
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', wordBreak: 'break-word' }}>{ball.name}</span>
                  <button
                    onClick={() => handleRemoveBall(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {ballTypes.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No ball types added yet.</p>}
            </div>

            {!showBallForm
              ? (
                <button
                  onClick={() => setShowBallForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <Plus size={15} /> Add Ball Type
                </button>
              )
              : (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px' }}>
                  <div>
                    <label style={labelStyle}>Ball Name</label>
                    <input value={newBallName} onChange={e => setNewBallName(e.target.value)} style={inputStyle} placeholder="e.g. Red Leather" />
                  </div>
                  <div>
                    <label style={labelStyle}>Ball Image (max 2MB)</label>
                    <input ref={ballFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBallImageUpload} />
                    <button
                      onClick={() => { if (!newBallName.trim()) { Swal.fire({ icon: 'warning', title: 'Enter name first', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)' }); return; } ballFileRef.current?.click(); }}
                      disabled={uploadingBall}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.8rem', cursor: uploadingBall ? 'wait' : 'pointer', border: 'none' }}
                    >
                      <ImageIcon size={14} /> {uploadingBall ? 'Uploading…' : 'Choose Image & Save'}
                    </button>
                  </div>
                  <button
                    onClick={() => { setShowBallForm(false); setNewBallName(''); }}
                    style={{ alignSelf: 'flex-start', background: 'none', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          </Section>

          {/* Age Groups */}
          <Section title="Age Groups" description="Define age categories, sub-groups, and their representative colors.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {ageGroups.map((ag, idx) => {
                const maxLimit = ag.limit || { years: ag.range?.[1] ?? 99, months: 0, days: 0 };
                const minLimit = ag.minLimit || { years: ag.range?.[0] ?? 0, months: 0, days: 0 };
                return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{ag.cat}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ag.sub}</span>
                  
                  <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)', width: '30px' }}>Min:</span>
                      <input type="number" min="0" placeholder="Y" value={minLimit.years} onChange={e => handleUpdateAgeLimit(idx, 'min', 'years', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> y
                      <input type="number" min="0" max="11" placeholder="M" value={minLimit.months} onChange={e => handleUpdateAgeLimit(idx, 'min', 'months', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> m
                      <input type="number" min="0" max="31" placeholder="D" value={minLimit.days} onChange={e => handleUpdateAgeLimit(idx, 'min', 'days', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> d
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)', width: '30px' }}>Max:</span>
                      <input type="number" min="0" placeholder="Y" value={maxLimit.years} onChange={e => handleUpdateAgeLimit(idx, 'max', 'years', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> y
                      <input type="number" min="0" max="11" placeholder="M" value={maxLimit.months} onChange={e => handleUpdateAgeLimit(idx, 'max', 'months', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> m
                      <input type="number" min="0" max="31" placeholder="D" value={maxLimit.days} onChange={e => handleUpdateAgeLimit(idx, 'max', 'days', e.target.value)} style={{ width: '50px', ...inputStyle, padding: '0.3rem', textAlign: 'center' }} /> d
                    </div>
                  </div>

                  <input
                    type="color"
                    value={ag.color || '#cbf905'}
                    onChange={e => handleAgeColorChange(idx, e.target.value)}
                    style={{ width: '32px', height: '32px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}
                    title="Change color"
                  />
                  <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-secondary)', flexShrink: 0 }}>{(ag.color || '#cbf905').toUpperCase()}</span>
                  <button
                    onClick={() => handleRemoveAgeGroup(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '0.2rem', flexShrink: 0 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                );
              })}
              {ageGroups.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No age groups defined yet.</p>}
            </div>

            {!showAgeForm
              ? (
                <button
                  onClick={() => setShowAgeForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(203,249,5,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(203,249,5,0.25)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <Plus size={15} /> Add Age Group
                </button>
              )
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div>
                        <label style={labelStyle}>Category</label>
                        <input value={newAge.cat} onChange={e => setNewAge(a => ({ ...a, cat: e.target.value }))} style={{ ...inputStyle, width: '120px' }} placeholder="e.g. Juniors" />
                      </div>
                      <div>
                        <label style={labelStyle}>Sub-group</label>
                        <input value={newAge.sub} onChange={e => setNewAge(a => ({ ...a, sub: e.target.value }))} style={{ ...inputStyle, width: '100px' }} placeholder="e.g. U-13" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div>
                        <label style={labelStyle}>Min Yrs</label>
                        <input type="number" value={newAge.minYears} onChange={e => setNewAge(a => ({ ...a, minYears: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="0" />
                      </div>
                      <div>
                        <label style={labelStyle}>Min Mos</label>
                        <input type="number" min="0" max="11" value={newAge.minMonths} onChange={e => setNewAge(a => ({ ...a, minMonths: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="0" />
                      </div>
                      <div>
                        <label style={labelStyle}>Min Days</label>
                        <input type="number" min="0" max="31" value={newAge.minDays} onChange={e => setNewAge(a => ({ ...a, minDays: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="0" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div>
                        <label style={labelStyle}>Max Yrs</label>
                        <input type="number" value={newAge.maxYears} onChange={e => setNewAge(a => ({ ...a, maxYears: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="99" />
                      </div>
                      <div>
                        <label style={labelStyle}>Max Mos</label>
                        <input type="number" min="0" max="11" value={newAge.maxMonths} onChange={e => setNewAge(a => ({ ...a, maxMonths: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="0" />
                      </div>
                      <div>
                        <label style={labelStyle}>Max Days</label>
                        <input type="number" min="0" max="31" value={newAge.maxDays} onChange={e => setNewAge(a => ({ ...a, maxDays: e.target.value }))} style={{ ...inputStyle, width: '65px', padding: '0.4rem 0.2rem', textAlign: 'center' }} placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Color</label>
                    <input type="color" value={newAge.color} onChange={e => setNewAge(a => ({ ...a, color: e.target.value }))} style={{ width: '44px', height: '38px', padding: 0, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-md)' }} />
                  </div>
                  <button
                    onClick={handleAddAgeGroup}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#121A3F', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Add
                  </button>
                  <button
                    onClick={() => { setShowAgeForm(false); setNewAge({ cat: '', sub: '', color: '#cbf905', min: '', max: '' }); }}
                    style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          </Section>

          <Section
            title="Selector Allotment limit"
            description="Set the maximum number of players that can be assigned to a single selector."
            onSave={() => save('coachAllotment', { max_squad_size: parseInt(maxPlayersPerCoach, 10) || 20 })}
            saving={savingSection === 'coachAllotment'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Max Players per Selector</label>
              <input
                type="number"
                value={maxPlayersPerCoach}
                onChange={e => setMaxPlayersPerCoach(e.target.value)}
                style={{ ...inputStyle, width: '100px' }}
                min="1"
              />
            </div>
          </Section>
        </>
      )}

      {/* ─── TAB 5: Registration T&C ───────────────────────────────────────── */}
      {activeTab === 'terms' && (
        <Section
          title="Registration Terms & Conditions"
          description="Text shown to users during registration. Supports plain text."
          onSave={() => save('terms', { registration_terms: regTerms })}
          saving={savingSection === 'terms'}
        >
          <textarea
            value={regTerms}
            onChange={e => setRegTerms(e.target.value)}
            placeholder="Enter registration terms and conditions…"
            style={{ ...inputStyle, minHeight: '300px', resize: 'vertical' }}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {regTerms.length} characters
          </p>
        </Section>
      )}

      {/* ─── TAB 6: Training ────────────────────────────────────────────── */}
      {activeTab === 'training' && (
        <>
          <Section
            title="Basic Training Videos"
            description="Players must watch these completely before their dashboard unlocks."
            onSave={() => save('basicVideos', { basic_training_videos: basicVideos })}
            saving={savingSection === 'basicVideos'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {basicVideos.map((vid, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.8rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      style={inputStyle}
                      value={vid.title}
                      onChange={e => {
                        const newVids = [...basicVideos];
                        newVids[idx].title = e.target.value;
                        setBasicVideos(newVids);
                      }}
                      placeholder="Video Title"
                    />
                    <input
                      style={inputStyle}
                      value={vid.url}
                      onChange={e => {
                        const newVids = [...basicVideos];
                        newVids[idx].url = e.target.value;
                        setBasicVideos(newVids);
                      }}
                      placeholder="Video URL (Vimeo/YouTube)"
                    />
                  </div>
                  <button onClick={() => setBasicVideos(basicVideos.filter((_, i) => i !== idx))} style={{ background: 'none', color: '#f87171', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input style={inputStyle} value={newBasicVideo.title} onChange={e => setNewBasicVideo({ ...newBasicVideo, title: e.target.value })} placeholder="New Title" />
              <input style={inputStyle} value={newBasicVideo.url} onChange={e => setNewBasicVideo({ ...newBasicVideo, url: e.target.value })} placeholder="New URL" />
              <button 
                onClick={() => {
                  if (newBasicVideo.title && newBasicVideo.url) {
                    setBasicVideos([...basicVideos, { id: 'v' + Date.now(), title: newBasicVideo.title, url: newBasicVideo.url }]);
                    setNewBasicVideo({ id: '', title: '', url: '' });
                  }
                }}
                style={{ ...saveBtnStyle(false), padding: '0.7rem 1.2rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add Video
              </button>
            </div>
          </Section>

          <Section
            title="Advance Training Unlock Fee"
            description="Fee required to unlock advanced training videos uploaded by selectors (₹)."
            onSave={() => save('advanceFee', { advance_training_fee: Number(advanceFee) })}
            saving={savingSection === 'advanceFee'}
          >
            <input
              type="number"
              value={advanceFee}
              onChange={e => setAdvanceFee(e.target.value)}
              style={{ ...inputStyle, maxWidth: '200px' }}
            />
          </Section>
        </>
      )}
    </div>
  );
};

export default Config;

