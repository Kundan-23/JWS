import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '../../store/useAdminStore';
import { Search, Download, Upload, Eye, UserX, UserCheck, Shield, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const PlayerManagement = () => {
  const { players, togglePlayerStatus, importPlayers, coaches, assignCoachToPlayer } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleToggleStatus = (player) => {
    if (player.status === 'Active') {
      const reason = window.prompt(`Please provide a reason for disabling ${player.name}:`);
      if (reason === null) return;
      togglePlayerStatus(player.id, reason);
    } else {
      togglePlayerStatus(player.id);
    }
  };

  // Filter players
  const filteredPlayers = players.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting for top referrals
  const topReferrals = [...players].sort((a, b) => b.referralsCount - a.referralsCount).slice(0, 5);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(players);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "GICL_Players.xlsx");
  };

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
        importPlayers(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Player Management</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Manage all registered players, assign coaches, and handle data.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Import Excel
            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Main Grid */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', overflow: 'hidden' }}>
          
          {/* Toolbar */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-surface-elevated)', display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search by ID or Name..." 
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
                <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Player ID</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Age</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map(player => (
                  <tr key={player.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 600 }}>{player.id}</td>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{player.name}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{player.age}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.35rem 0.85rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        backgroundColor: player.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: player.status === 'Active' ? '#10b981' : '#ef4444',
                        border: `1px solid ${player.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {player.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setSelectedPlayer(player)} className="btn-secondary" style={{ padding: '0.5rem' }} title="View Profile">
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(player)} 
                        className="btn-secondary" 
                        style={{ padding: '0.5rem', color: player.status === 'Active' ? 'var(--error)' : 'var(--success)', borderColor: player.status === 'Active' ? 'var(--error)' : 'var(--success)' }}
                        title={player.status === 'Active' ? 'Disable Player' : 'Enable Player'}
                      >
                        {player.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlayers.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No players found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="var(--brand-accent)" /> Top Referrals
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topReferrals.map((player, idx) => (
                <li key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-secondary)', width: '20px' }}>#{idx + 1}</span>
                    <div>
                      <p style={{ fontWeight: 600 }}>{player.name}</p>
                      <p className="text-small text-secondary">{player.id}</p>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                    {player.referralsCount}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expanded Profile Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerProfileModal 
            player={selectedPlayer} 
            onClose={() => setSelectedPlayer(null)} 
            coaches={coaches}
            onAssign={(coachId) => { assignCoachToPlayer(selectedPlayer.id, coachId); setSelectedPlayer({...selectedPlayer, coachId}); }}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

const PlayerProfileModal = ({ player, onClose, coaches, onAssign }) => {
  const [showCoachDropdown, setShowCoachDropdown] = useState(false);
  const currentCoach = coaches.find(c => c.id === player.coachId);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', width: '95%', maxWidth: '500px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>{player.name}</h2>
              <p className="text-secondary" style={{ fontFamily: 'monospace', color: 'var(--brand-accent)' }}>{player.id}</p>
            </div>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: player.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: player.status === 'Active' ? '#10b981' : '#ef4444' }}>
              {player.status}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p className="text-small text-secondary">Age</p>
              <p style={{ fontWeight: 600 }}>{player.age} Years</p>
            </div>
            <div>
              <p className="text-small text-secondary">Phone</p>
              <p style={{ fontWeight: 600 }}>{player.phone}</p>
            </div>
            <div>
              <p className="text-small text-secondary">Batting Style</p>
              <p style={{ fontWeight: 600 }}>{player.battingStyle}</p>
            </div>
            <div>
              <p className="text-small text-secondary">Bowling Style</p>
              <p style={{ fontWeight: 600 }}>{player.bowlingStyle}</p>
            </div>
            <div>
              <p className="text-small text-secondary">Total Referrals</p>
              <p style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{player.referralsCount}</p>
            </div>
          </div>

          {player.referralsCount > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p className="text-small text-secondary" style={{ marginBottom: '0.5rem' }}>Referred Players</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto' }}>
                {Array.from({ length: player.referralsCount }).map((_, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-surface-elevated)' }}>
                    <span style={{ fontSize: '0.875rem' }}>Player #{Math.floor(Math.random() * 9000) + 1000}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

          <div>
            <h4 className="heading-4" style={{ marginBottom: '1rem' }}>Coach Assignment</h4>
            {currentCoach ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{currentCoach.name}</p>
                  <p className="text-small text-secondary">{currentCoach.id}</p>
                </div>
                <button className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setShowCoachDropdown(!showCoachDropdown)}>Reassign</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--error)' }}>
                <p style={{ color: 'var(--error)', fontWeight: 600 }}>Unassigned</p>
                <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setShowCoachDropdown(!showCoachDropdown)}>Assign</button>
              </div>
            )}

            {showCoachDropdown && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)' }}>
                <p className="text-small text-secondary" style={{ marginBottom: '0.5rem' }}>Select a Coach to assign:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {coaches.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { onAssign(c.id); setShowCoachDropdown(false); }}
                      style={{ padding: '0.75rem', textAlign: 'left', background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className="text-small text-secondary">{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
        
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" style={{ width: 'auto' }} onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerManagement;
