import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '../../store/useAdminStore';
import { Search, Upload, Plus, Eye, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

const CoachManagement = () => {
  const { coaches, importCoaches } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Coach Form State
  const [newCoach, setNewCoach] = useState({ name: '', phone: '', experience: '', location: '' });

  const filteredCoaches = coaches.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        importCoaches(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!newCoach.name || !newCoach.phone) return;
    importCoaches([newCoach]);
    setNewCoach({ name: '', phone: '', experience: '', location: '' });
    setShowAddForm(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Coach Management</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Manage all registered coaches, their profiles, and data.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Import Excel
            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Coach
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-accent)', marginBottom: '2rem' }}>
          <h3 className="heading-3" style={{ marginBottom: '1.5rem' }}>Add New Coach</h3>
          <form onSubmit={handleManualAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
              <input type="text" value={newCoach.name} onChange={e => setNewCoach({...newCoach, name: e.target.value})} className="input-field" required style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number *</label>
              <input type="text" value={newCoach.phone} onChange={e => setNewCoach({...newCoach, phone: e.target.value})} className="input-field" required style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Experience</label>
              <input type="text" value={newCoach.experience} onChange={e => setNewCoach({...newCoach, experience: e.target.value})} className="input-field" placeholder="e.g., 5 Years" style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div>
              <label className="text-small text-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>Location *</label>
              <input type="text" value={newCoach.location} onChange={e => setNewCoach({...newCoach, location: e.target.value})} className="input-field" required placeholder="e.g., Mumbai" style={{ width: '100%', padding: '0.75rem' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search Coaches..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Coach ID</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Location</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Experience</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.map(coach => (
                <tr key={coach.id} style={{ borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--brand-accent)' }}>{coach.id}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{coach.name}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{coach.phone}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{coach.location || 'N/A'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{coach.experience}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981'
                    }}>
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="View Profile">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCoaches.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No coaches found matching your search.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CoachManagement;
