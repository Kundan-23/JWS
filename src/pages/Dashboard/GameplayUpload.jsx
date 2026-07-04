import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { playerAPI } from '../../services/api';
import { Camera, Plus, Link as LinkIcon, Trash2, CheckCircle, Video, Upload } from 'lucide-react';

const categories = [
  { id: 'batting',  label: 'Batting' },
  { id: 'bowling',  label: 'Bowling' },
  { id: 'fielding', label: 'Fielding' },
  { id: 'wk',       label: 'Wicket Keeping' }
];

const GameplayUpload = () => {
  const [links, setLinks] = useState({ batting: [], bowling: [], fielding: [], wk: [] });
  const [currentCategory, setCurrentCategory] = useState('batting');
  const [currentLink, setCurrentLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerAPI.getProfile()
      .then(res => {
        const p = res.data?.player || res.data;
        if (p?.gameplay_links) setLinks({ batting: [], bowling: [], fielding: [], wk: [], ...p.gameplay_links });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddLink = () => {
    if (links[currentCategory].length >= 2) {
      alert(`Max 2 videos per category.`);
      return;
    }
    if (currentLink.trim() && currentLink.includes('instagram.com')) {
      setLinks({ ...links, [currentCategory]: [...links[currentCategory], currentLink.trim()] });
      setCurrentLink('');
    } else {
      alert('Please enter a valid Instagram post or reel link.');
    }
  };

  const handleRemoveLink = (category, index) => {
    setLinks({ ...links, [category]: links[category].filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    const totalLinks = Object.values(links).reduce((acc, curr) => acc + curr.length, 0);
    if (totalLinks === 0) {
      Swal.fire({ icon: 'warning', title: 'No Links Added', text: 'Add at least one Instagram gameplay link.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
      return;
    }
    setSubmitting(true);
    try {
      await playerAPI.updateProfile({ gameplayLinks: links });
      Swal.fire({ icon: 'success', title: 'Gameplay Links Saved! 🎉', text: 'Your videos have been submitted to the selectors for review.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save. Try again.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setSubmitting(false); }
  };

  const totalLinksCount = Object.values(links).reduce((acc, curr) => acc + curr.length, 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--bg-surface-elevated)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="heading-1">Upload My Gameplay</h1>
        <p className="text-body" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Share your best Instagram cricket videos with JWS Selectors. Max 2 links per category.
        </p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', marginBottom: '1.5rem' }}>
        <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={20} color="#E1306C" /> Upload from Instagram
        </h3>
        <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Paste your Instagram post or reel links below. Selectors will review these videos for trial selection.
        </p>

        {/* Category Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => (
            <button key={cat.id} type="button" onClick={() => setCurrentCategory(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${currentCategory === cat.id ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)'}`,
                backgroundColor: currentCategory === cat.id ? 'rgba(203,249,5,0.1)' : 'var(--bg-color)',
                color: currentCategory === cat.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: currentCategory === cat.id ? 600 : 400
              }}>
              {cat.label} ({links[cat.id].length}/2)
            </button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '0 1rem' }}>
            <LinkIcon size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginRight: '0.5rem' }} />
            <input
              type="text" className="form-input"
              placeholder="https://www.instagram.com/p/..."
              value={currentLink}
              onChange={e => setCurrentLink(e.target.value)}
              style={{ border: 'none', backgroundColor: 'transparent' }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              disabled={links[currentCategory].length >= 2}
            />
          </div>
          <button className="btn-secondary" onClick={handleAddLink} disabled={links[currentCategory].length >= 2}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Add
          </button>
        </div>

        {/* Previews */}
        {totalLinksCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {categories.map(cat => {
              if (links[cat.id].length === 0) return null;
              return (
                <div key={cat.id}>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontSize: '0.9rem' }}>
                    <Video size={16} /> {cat.label} Videos
                  </h4>
                  {links[cat.id].map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--bg-surface-elevated)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <CheckCircle size={14} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                      </span>
                      <button onClick={() => handleRemoveLink(cat.id, idx)} style={{ background: 'none', color: 'var(--error)', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={submitting}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <Upload size={20} />
        {submitting ? 'Saving...' : 'Save Gameplay Links'}
      </button>
    </motion.div>
  );
};

export default GameplayUpload;

