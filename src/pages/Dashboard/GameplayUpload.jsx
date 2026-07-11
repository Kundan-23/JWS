import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { playerAPI } from '../../services/api';
import { Camera, Plus, Link as LinkIcon, Trash2, CheckCircle, Video, Upload, ExternalLink } from 'lucide-react';

const GameplayUpload = () => {
  const [links, setLinks] = useState({ batting: ['', ''], bowling: ['', ''], fielding: [], wk: [] });
  const [inputs, setInputs] = useState({
    batting0: '',
    batting1: '',
    bowling0: '',
    bowling1: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const getInstagramEmbedUrl = (url) => {
    if (!url) return '';
    try {
      const cleanUrl = url.split('?')[0];
      const baseUrl = cleanUrl.endsWith('/') ? cleanUrl : `${cleanUrl}/`;
      return `${baseUrl}embed`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    playerAPI.getProfile()
      .then(res => {
        const p = res.data?.player || res.data;
        if (p?.gameplay_links) {
          const batting = [...(p.gameplay_links.batting || [])];
          const bowling = [...(p.gameplay_links.bowling || [])];
          setLinks({
            batting: [batting[0] || '', batting[1] || ''],
            bowling: [bowling[0] || '', bowling[1] || ''],
            fielding: p.gameplay_links.fielding || [],
            wk: p.gameplay_links.wk || []
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddLink = (category, index) => {
    const key = `${category}${index}`;
    const value = (inputs[key] || '').trim();

    if (value && value.includes('instagram.com')) {
      const updated = [...links[category]];
      updated[index] = value;
      setLinks({ ...links, [category]: updated });
      setInputs({ ...inputs, [key]: '' });
    } else {
      alert('Please enter a valid Instagram post or reel link.');
    }
  };

  const handleRemoveLink = (category, index) => {
    const updated = [...links[category]];
    updated[index] = '';
    setLinks({ ...links, [category]: updated });
  };

  const handleSave = async () => {
    // Filter out empty strings before saving
    const cleanedLinks = {
      batting: links.batting.filter(Boolean),
      bowling: links.bowling.filter(Boolean),
      fielding: links.fielding || [],
      wk: links.wk || []
    };

    const totalLinks = Object.values(cleanedLinks).reduce((acc, curr) => acc + curr.length, 0);
    if (totalLinks === 0) {
      Swal.fire({ icon: 'warning', title: 'No Links Added', text: 'Add at least one Instagram batting or bowling video link.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
      return;
    }

    setSubmitting(true);
    try {
      await playerAPI.updateProfile({ gameplayLinks: cleanedLinks });
      // Keep local state normalized
      setLinks({
        ...links,
        batting: [cleanedLinks.batting[0] || '', cleanedLinks.batting[1] || ''],
        bowling: [cleanedLinks.bowling[0] || '', cleanedLinks.bowling[1] || '']
      });
      Swal.fire({ icon: 'success', title: 'Video Links Saved! 🎉', text: 'Your videos have been submitted to the selectors for review.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save. Try again.', background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setSubmitting(false); }
  };

  const renderVideoSlot = (category, index, label) => {
    const link = links[category]?.[index];
    const key = `${category}${index}`;
    const inputValue = inputs[key] || '';

    if (link) {
      return (
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)' }}>{label}</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Open in Instagram">
                <ExternalLink size={16} />
              </a>
              <button type="button" onClick={() => handleRemoveLink(category, index)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 0 }} title="Remove Link">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <CheckCircle size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '90%' }}>{link}</span>
          </div>
          
          {/* Instagram Video Preview (Same preview function) */}
          <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, cursor: 'pointer' }}
              title="Watch on Instagram"
            />
            <iframe 
              src={getInstagramEmbedUrl(link)} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              allowTransparency="true" 
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Instagram Video Preview"
              style={{ border: 'none', overflow: 'hidden', pointerEvents: 'none' }}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending Link</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 0.75rem', height: '2.5rem' }}>
            <LinkIcon size={14} color="var(--text-secondary)" style={{ flexShrink: 0, marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Paste Instagram link here..."
              value={inputValue}
              onChange={e => setInputs({ ...inputs, [key]: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink(category, index))}
              style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%', outline: 'none' }}
            />
          </div>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => handleAddLink(category, index)}
            style={{ padding: '0 1rem', height: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    );
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
        <h1 className="heading-1">Upload Batting & Bowling Videos</h1>
        <p className="text-body" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Share your best Instagram cricket videos with JWS Selectors. You must add at least one video to be reviewed.
        </p>
      </div>

      {/* Batting Section */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', marginBottom: '1.5rem' }}>
        <h3 className="heading-3" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
          <Video size={20} /> Batting Videos (Max 2)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {renderVideoSlot('batting', 0, 'Batting Video One')}
          {renderVideoSlot('batting', 1, 'Batting Video Two')}
        </div>
      </div>

      {/* Bowling Section */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', marginBottom: '1.5rem' }}>
        <h3 className="heading-3" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
          <Video size={20} /> Bowling Videos (Max 2)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {renderVideoSlot('bowling', 0, 'Bowling Video One')}
          {renderVideoSlot('bowling', 1, 'Bowling Video Two')}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={submitting}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: 'auto', padding: '0.75rem 2rem' }}>
        <Upload size={20} />
        {submitting ? 'Saving...' : 'Save Video Links'}
      </button>
    </motion.div>
  );
};

export default GameplayUpload;


