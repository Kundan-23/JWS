import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfigStore } from '../../store/useConfigStore';
import { Settings, Plus, Trash2, Image as ImageIcon, Check, DollarSign, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const PlayerConfig = () => {
  const config = useConfigStore();
  
  const [newJersey, setNewJersey] = useState('');
  const [newBatting, setNewBatting] = useState('');
  const [newBowling, setNewBowling] = useState('');
  const [newClub, setNewClub] = useState('');
  
  const [regTerms, setRegTerms] = useState(config.registrationTerms);
  const [savedReg, setSavedReg] = useState(false);

  // New Plan State
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({ id: '', name: '', price: 0, features: '', terms: '' });

  const handleAdd = (val, setter, currentArray, updateFn) => {
    if (!val.trim()) return;
    updateFn([...currentArray, val.trim()]);
    setter('');
  };
  const handleDelete = (val, currentArray, updateFn) => {
    updateFn(currentArray.filter(i => i !== val));
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // Limit to 2MB to prevent localStorage overflow
        Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Please upload an image smaller than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const newBanner = { id: Date.now(), text: "", color: "var(--bg-surface)", image: reader.result };
          config.updateBanners([...config.banners, newBanner]);
        } catch(err) {
          Swal.fire({ icon: 'error', title: 'Storage Error', text: 'Storage limit exceeded. Try a smaller image or delete existing banners.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // Limit to 2MB
        Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Please upload an image smaller than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const newBanner = { id: Date.now(), text: "", color: "var(--bg-surface)", image: reader.result };
          config.updateAdBanners([...(config.adBanners || []), newBanner]);
        } catch(err) {
          Swal.fire({ icon: 'error', title: 'Storage Error', text: 'Storage limit exceeded. Try a smaller image or delete existing banners.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBallUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const ballName = prompt("Enter the name of this ball type (e.g., Red Leather):");
        if (ballName) {
          const newBall = { id: `ball_${Date.now()}`, name: ballName, image: reader.result };
          config.updateBallTypes([...config.ballTypes, newBall]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const savePlan = () => {
    if (!newPlan.name || !newPlan.price) return;
    const planToAdd = {
      id: newPlan.id || `p${Date.now()}`,
      name: newPlan.name,
      price: Number(newPlan.price),
      features: newPlan.features.split(',').map(f => f.trim()),
      terms: newPlan.terms
    };
    
    // Update if exists, else add
    const existing = config.plans.find(p => p.id === planToAdd.id);
    if (existing) {
      config.updatePlans(config.plans.map(p => p.id === planToAdd.id ? planToAdd : p));
    } else {
      config.updatePlans([...config.plans, planToAdd]);
    }
    setShowPlanForm(false);
    setNewPlan({ id: '', name: '', price: 0, features: '', terms: '' });
  };

  const editPlan = (plan) => {
    setNewPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features.join(', '),
      terms: plan.terms
    });
    setShowPlanForm(true);
  };

  const deletePlan = (id) => {
    config.updatePlans(config.plans.filter(p => p.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-1">Player Configuration</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Manage all configurable dropdowns, terms, and banners for the player experience.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          onClick={() => {
            // Because zustand persists immediately, this button is purely for UX confirmation
            // and explicitly saving the Registration terms if they forgot to click its specific save button.
            config.updateRegistrationTerms(regTerms);
            Swal.fire({
              icon: 'success',
              title: 'Saved Successfully',
              text: 'All configurations and banners have been universally saved.',
              timer: 2000,
              showConfirmButton: false
            });
          }}
        >
          <Save size={20} />
          Save All Changes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Registration T&C */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--brand-accent)" /> Registration T&C
          </h3>
          <textarea 
            value={regTerms}
            onChange={(e) => { setRegTerms(e.target.value); setSavedReg(false); }}
            style={{ width: '100%', height: '120px', padding: '1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '1rem' }}
          />
          <button className="btn-primary" onClick={() => { config.updateRegistrationTerms(regTerms); setSavedReg(true); setTimeout(() => setSavedReg(false), 2000); }}>
            {savedReg ? <><Check size={16}/> Saved</> : 'Save Terms'}
          </button>
        </div>

        {/* Subscription Plans */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="heading-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--brand-accent)" /> Subscription Plans
            </h3>
            <button className="btn-primary" onClick={() => { setShowPlanForm(true); setNewPlan({ id: '', name: '', price: 0, features: '', terms: '' }); }} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Add Plan
            </button>
          </div>

          {showPlanForm && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.25rem' }}>Plan Name</label>
                  <input type="text" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.25rem' }}>Price (₹)</label>
                  <input type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem' }} />
                </div>
              </div>
              <div>
                <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.25rem' }}>Features (comma separated)</label>
                <input type="text" value={newPlan.features} onChange={e => setNewPlan({...newPlan, features: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem' }} />
              </div>
              <div>
                <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.25rem' }}>Payment Terms & Conditions</label>
                <textarea value={newPlan.terms} onChange={e => setNewPlan({...newPlan, terms: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', height: '80px' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setShowPlanForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={savePlan}>Save Plan</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {config.plans.map(plan => (
              <div key={plan.id} style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-surface-elevated)', position: 'relative' }}>
                <h4 className="heading-3">{plan.name}</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '1rem' }}>₹{plan.price}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {plan.features.map((f, i) => <li key={i} className="text-small text-secondary">• {f}</li>)}
                </ul>
                <p className="text-small" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>T&C: {plan.terms}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => editPlan(plan)} className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>Edit</button>
                  <button onClick={() => deletePlan(plan.id)} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.5rem' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dropdowns */}
        <ConfigList title="Jersey Sizes" items={config.jerseySizes} val={newJersey} setVal={setNewJersey} onAdd={() => handleAdd(newJersey, setNewJersey, config.jerseySizes, config.updateJerseySizes)} onDelete={(item) => handleDelete(item, config.jerseySizes, config.updateJerseySizes)} />
        <ConfigList title="Batting Styles" items={config.battingStyles} val={newBatting} setVal={setNewBatting} onAdd={() => handleAdd(newBatting, setNewBatting, config.battingStyles, config.updateBattingStyles)} onDelete={(item) => handleDelete(item, config.battingStyles, config.updateBattingStyles)} />
        <ConfigList title="Bowling Styles" items={config.bowlingStyles} val={newBowling} setVal={setNewBowling} onAdd={() => handleAdd(newBowling, setNewBowling, config.bowlingStyles, config.updateBowlingStyles)} onDelete={(item) => handleDelete(item, config.bowlingStyles, config.updateBowlingStyles)} />
        <ConfigList title="Associated Clubs" items={config.clubs} val={newClub} setVal={setNewClub} onAdd={() => handleAdd(newClub, setNewClub, config.clubs, config.updateClubs)} onDelete={(item) => handleDelete(item, config.clubs, config.updateClubs)} />

        {/* Banners */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', gridColumn: '1 / -1' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={20} color="var(--brand-accent)" /> Dashboard Banners
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {config.banners.map((banner) => (
              <div key={banner.id} style={{ position: 'relative', width: '250px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: banner.image ? `url(${banner.image}) center/cover` : banner.color, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                {!banner.image && <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{banner.text}</span>}
                <button onClick={() => config.updateBanners(config.banners.filter(b => b.id !== banner.id))} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <label style={{ width: '250px', height: '100px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Plus size={24} style={{ marginBottom: '0.5rem' }} />
              <span className="text-small">Upload Image</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
            </label>
          </div>
        </div>

        {/* Ad Banners */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', gridColumn: '1 / -1' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={20} color="var(--brand-accent)" /> Ad Banners (Below Announcements)
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {(config.adBanners || []).map((banner) => (
              <div key={banner.id} style={{ position: 'relative', width: '250px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: banner.image ? `url(${banner.image}) center/cover` : banner.color, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                {!banner.image && <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{banner.text}</span>}
                <button onClick={() => config.updateAdBanners(config.adBanners.filter(b => b.id !== banner.id))} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <label style={{ width: '250px', height: '100px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Plus size={24} style={{ marginBottom: '0.5rem' }} />
              <span className="text-small">Upload Ad Banner</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAdBannerUpload} />
            </label>
          </div>
        </div>

        {/* Custom Ball Types */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', gridColumn: '1 / -1' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={20} color="var(--brand-accent)" /> Custom Ball Types
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {config.ballTypes.map((ball) => (
              <div key={ball.id} style={{ position: 'relative', width: '120px', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                <img src={ball.image} alt={ball.name} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ball.name}</span>
                <button onClick={() => config.updateBallTypes(config.ballTypes.filter(b => b.id !== ball.id))} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <label style={{ width: '120px', height: '140px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Plus size={24} style={{ marginBottom: '0.5rem' }} />
              <span className="text-small">Add Ball</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBallUpload} />
            </label>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const ConfigList = ({ title, items, val, setVal, onAdd, onDelete }) => (
  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
    <h3 className="heading-3" style={{ marginBottom: '1rem' }}>{title}</h3>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder="Add new..." style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
      <button className="btn-primary" onClick={onAdd} style={{ width: 'auto' }}><Plus size={20} /></button>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
          <span className="text-body">{item}</span>
          <button onClick={() => onDelete(item)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={16} /></button>
        </li>
      ))}
    </ul>
  </div>
);

export default PlayerConfig;
