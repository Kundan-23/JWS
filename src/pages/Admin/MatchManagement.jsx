import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMatchStore } from '../../store/useMatchStore';
import { Search, Plus, Calendar, MapPin, Users, Trash2, Edit } from 'lucide-react';

const MatchManagement = () => {
  const { matches, addMatch, updateMatch, deleteMatch } = useMatchStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    teamA: '',
    teamB: '',
    date: '',
    location: '',
    type: 'League Match',
    minSquadSize: 11,
    maxSquadSize: 15
  });

  const filteredMatches = matches.filter(m => 
    m.teamA?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.teamB?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure date is ISO format for consistency
    const matchObj = {
      ...formData,
      minSquadSize: Number(formData.minSquadSize),
      maxSquadSize: Number(formData.maxSquadSize),
      date: new Date(formData.date).toISOString()
    };

    if (isEditing) {
      updateMatch(matchObj);
    } else {
      addMatch(matchObj);
    }

    resetForm();
  };

  const handleEdit = (match) => {
    // Convert ISO string to datetime-local format
    const dt = new Date(match.date);
    const dateString = dt.toISOString().slice(0, 16);
    
    setFormData({
      ...match,
      date: dateString
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: '', teamA: '', teamB: '', date: '', location: '', type: 'League Match', minSquadSize: 11, maxSquadSize: 15
    });
    setShowAddForm(false);
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Match Management</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Create global matches and configure squad requirements.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Create Match
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-accent)', marginBottom: '2rem' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Match' : 'Create New Match'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Team A *</label>
              <input type="text" value={formData.teamA} onChange={e => setFormData({...formData, teamA: e.target.value})} className="form-input" required placeholder="e.g., Delhi Capitals" style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Team B *</label>
              <input type="text" value={formData.teamB} onChange={e => setFormData({...formData, teamB: e.target.value})} className="form-input" required placeholder="e.g., Mumbai Indians" style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Date & Time *</label>
              <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input" required style={{ width: '100%', padding: '0.75rem', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Location *</label>
              <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="form-input" required placeholder="Stadium / Ground Name" style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Match Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem' }}>
                <option value="League Match">League Match</option>
                <option value="Quarter Final">Quarter Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Final">Final</option>
                <option value="Friendly">Friendly</option>
              </select>
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Min Squad Size</label>
              <input type="number" min="5" max="30" value={formData.minSquadSize} onChange={e => setFormData({...formData, minSquadSize: e.target.value})} className="form-input" required style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Max Squad Size</label>
              <input type="number" min="5" max="50" value={formData.maxSquadSize} onChange={e => setFormData({...formData, maxSquadSize: e.target.value})} className="form-input" required style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="button" onClick={resetForm} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isEditing ? 'Update Match' : 'Create Match'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search Matches..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem' }}>
          {filteredMatches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No matches found.
            </div>
          ) : (
            filteredMatches.map(match => (
              <div key={match.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'rgba(249, 203, 26, 0.1)', color: 'var(--brand-primary)', borderRadius: '4px' }}>
                      {match.type}
                    </span>
                    <span className="text-secondary text-small">{match.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{match.teamA} vs {match.teamB}</h3>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={18} />
                    <span className="text-small">{new Date(match.date).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={18} />
                    <span className="text-small">{match.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Users size={18} />
                    <span className="text-small">Squad: {match.minSquadSize} - {match.maxSquadSize}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(match)} className="btn-secondary" style={{ padding: '0.5rem' }} title="Edit Match">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteMatch(match.id)} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.5rem' }} title="Delete Match">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MatchManagement;
