import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfigStore } from '../../store/useConfigStore';
import { Save, AlertCircle } from 'lucide-react';

const AppConfig = () => {
  const { ageGroups, updateAgeGroups, landingBgImage, updateLandingBgImage } = useConfigStore();
  
  // Local state for editing
  const [localAgeGroups, setLocalAgeGroups] = useState([...ageGroups]);
  const [bgImage, setBgImage] = useState(landingBgImage || '');
  
  const [savedMsg, setSavedMsg] = useState('');

  const handleColorChange = (id, newColor) => {
    setLocalAgeGroups(prev => prev.map(ag => ag.id === id ? { ...ag, color: newColor } : ag));
  };

  const handleSave = () => {
    updateAgeGroups(localAgeGroups);
    updateLandingBgImage(bgImage);
    
    setSavedMsg('Global configuration updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">App Configuration</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Manage global settings, pricing, and system variables.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={18} /> Save Changes
        </button>
      </div>

      {savedMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)' }}>
          <AlertCircle size={20} />
          {savedMsg}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Age Groups & Colors */}
        <section style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h2 className="heading-3" style={{ marginBottom: '1.5rem' }}>Age Groups & Colors</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {localAgeGroups.map((ag) => (
              <div key={ag.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)' }}>
                <div>
                  <span className="text-small text-secondary">{ag.cat}</span>
                  <p style={{ fontWeight: 600 }}>{ag.sub}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="color" 
                    value={ag.color} 
                    onChange={(e) => handleColorChange(ag.id, e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                  />
                  <span className="text-small" style={{ fontFamily: 'monospace' }}>{ag.color.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* Landing Page Customization */}
        <section style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h2 className="heading-3" style={{ marginBottom: '1.5rem' }}>Landing Page Background</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className="text-secondary text-small">Upload a background image for the app landing screen. (Max 2MB)</p>
            
            {bgImage && (
              <div style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <img src={bgImage} alt="Landing Background Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <input 
              type="file" 
              accept="image/*"
              className="form-input"
              style={{ padding: '0.5rem' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setBgImage(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {bgImage && (
              <button 
                className="btn-outline" 
                onClick={() => setBgImage('')}
                style={{ alignSelf: 'flex-start', color: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}
              >
                Clear Custom Image
              </button>
            )}
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default AppConfig;
