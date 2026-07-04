import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoachStore } from '../../store/useCoachStore';
import { useConfig } from '../../context/ConfigContext';
import { Users, X, User } from 'lucide-react';

// Compute age from ISO date string
const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const getAgeGroupLimitDays = (ag) => {
  if (ag.limit) return (ag.limit.years || 0) * 365 + (ag.limit.months || 0) * 30 + (ag.limit.days || 0);
  if (ag.range) return (ag.range[1] || 99) * 365;
  return 99 * 365;
};

// Find the age-group config entry for a given DOB
const getAgeGroup = (ageGroups, dob) => {
  if (!dob || !ageGroups?.length) return null;
  const playerDOB = new Date(dob);
  
  const sortedGroups = [...ageGroups].sort((a, b) => getAgeGroupLimitDays(a) - getAgeGroupLimitDays(b));
  
  for (const ag of sortedGroups) {
    let maxDate = new Date();
    if (ag.limit) {
      maxDate.setFullYear(maxDate.getFullYear() - (ag.limit.years || 0));
      maxDate.setMonth(maxDate.getMonth() - (ag.limit.months || 0));
      maxDate.setDate(maxDate.getDate() - (ag.limit.days || 0));
    } else if (ag.range) {
      maxDate.setFullYear(maxDate.getFullYear() - (ag.range[1] || 99));
    } else continue;
    
    let minDate = new Date();
    if (ag.minLimit) {
      minDate.setFullYear(minDate.getFullYear() - (ag.minLimit.years || 0));
      minDate.setMonth(minDate.getMonth() - (ag.minLimit.months || 0));
      minDate.setDate(minDate.getDate() - (ag.minLimit.days || 0));
    } else if (ag.range) {
      minDate.setFullYear(minDate.getFullYear() - (ag.range[0] || 0));
    }
    
    // Reset time components to 00:00:00 to compare purely by date
    maxDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    const dobCompare = new Date(playerDOB);
    dobCompare.setHours(0, 0, 0, 0);

    // dobCompare >= maxDate ensures player is not older than max age
    // dobCompare <= minDate ensures player is not younger than min age
    if (dobCompare >= maxDate && dobCompare <= minDate) return ag;
  }
  return null;
};

const SquadOverview = () => {
  const { allocatedPlayers = [], profile } = useCoachStore();
  const { age_groups: ageGroups = [], maxSquadSize = 20 } = useConfig();

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  // Normalise real API fields to display-friendly shape
  const players = allocatedPlayers.map(p => {
    const age = calcAge(p.dob);
    const ag  = getAgeGroup(ageGroups, p.dob);
    return {
      ...p,
      fullName:     `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      age,
      photo:        p.profile_photo_url || null,
      battingStyle: p.batting_style || '—',
      category:     ag?.cat   || 'Open',
      subCategory:  ag?.sub   || 'Open',
      color:        ag?.color || 'var(--brand-accent)',
      attemptUrl:   p.training_attempt_url || null,
    };
  });

  // Unique top-level categories from config + players
  const configCategories = ageGroups.map(ag => ag.cat);
  const playerCategories = players.map(p => p.category);
  const uniqueCats = [...new Set([...configCategories, ...playerCategories])].filter(Boolean);
  
  // Custom sort to keep Open/Masters at the end if desired, or just alphabetical
  const categories = ['All', ...uniqueCats];

  const displayed = activeFilter === 'All'
    ? players
    : players.filter(p => p.category === activeFilter);

  // Pre-fill sub-categories from config so they always appear when a filter is clicked
  const grouped = {};
  if (activeFilter !== 'All') {
    const activeConfigs = ageGroups.filter(ag => ag.cat === activeFilter);
    activeConfigs.forEach(ag => {
      if (ag.sub) {
        grouped[ag.sub] = { color: ag.color || 'var(--brand-accent)', players: [] };
      }
    });
  }

  // Group by sub-category for sorted display
  displayed.forEach(p => {
    const key = p.subCategory || 'Other';
    if (!grouped[key]) grouped[key] = { color: p.color || 'var(--brand-accent)', players: [] };
    grouped[key].players.push(p);
  });

  const avatarUrl = (p) =>
    p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName || 'P')}&background=0f172a&color=ffc72c`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1">My Squad</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
            Welcome Selector {profile ? `${profile.first_name} ${profile.last_name}` : ''}. Here are your allocated players.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--brand-primary)', color: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
          <Users size={18} />
          {players.length} / {maxSquadSize} Players
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)',
              backgroundColor: activeFilter === f ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: activeFilter === f ? 'var(--bg-surface)' : 'var(--text-secondary)',
              border: `1px solid ${activeFilter === f ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)'}`,
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Players grouped by sub-category */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No players allocated in this category.
        </div>
      ) : (
        Object.entries(grouped).map(([subCat, { color, players: grpPlayers }]) => (
          <div key={subCat} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{subCat}</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({grpPlayers.length} player{grpPlayers.length !== 1 ? 's' : ''})</span>
            </div>
            
            {grpPlayers.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--bg-surface-elevated)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No players allocated to {subCat} yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {grpPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  style={{
                    backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--bg-surface-elevated)', display: 'flex', gap: '1rem', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = color}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-surface-elevated)'}
                >
                  <img src={avatarUrl(player)} alt={player.fullName} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {player.fullName}
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    </h3>
                    <p className="text-small text-secondary" style={{ marginBottom: '0.4rem' }}>
                      {player.subCategory}{player.age ? ` | Age: ${player.age}` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>{player.battingStyle}</span>
                      <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>{player.bowlingStyle}</span>
                    </div>
                    {player.attemptUrl && (
                      <span style={{ display: 'inline-block', fontSize: '0.7rem', backgroundColor: 'rgba(249, 203, 26, 0.1)', color: 'var(--brand-primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        Attempt Submitted
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPlayer(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', padding: '2rem' }}>
              <button onClick={() => setSelectedPlayer(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                <img src={avatarUrl(selectedPlayer)} alt={selectedPlayer.fullName} style={{ width: 110, height: 110, borderRadius: '50%', border: `4px solid ${selectedPlayer.color}`, marginBottom: '1rem', objectFit: 'cover' }} />
                <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>{selectedPlayer.fullName}</h2>
                <span style={{ backgroundColor: selectedPlayer.color, color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{selectedPlayer.subCategory}</span>
                <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}><User size={14} style={{ display: 'inline', marginRight: 4 }} /> {selectedPlayer.jws_id || selectedPlayer.gicl_id || selectedPlayer.id}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {selectedPlayer.age && (
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)' }}>
                    <p className="text-small text-secondary" style={{ marginBottom: '0.25rem' }}>Age</p>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedPlayer.age} yrs</p>
                  </div>
                )}
                {selectedPlayer.city && (
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)' }}>
                    <p className="text-small text-secondary" style={{ marginBottom: '0.25rem' }}>City</p>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedPlayer.city}</p>
                  </div>
                )}
                {selectedPlayer.plan && (
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-surface-elevated)' }}>
                    <p className="text-small text-secondary" style={{ marginBottom: '0.25rem' }}>Plan</p>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedPlayer.plan}</p>
                  </div>
                )}
              </div>

              <h4 className="heading-3" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Playing Style</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-secondary">Batting</span><span style={{ fontWeight: 600 }}>{selectedPlayer.battingStyle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-secondary">Bowling</span><span style={{ fontWeight: 600 }}>{selectedPlayer.bowlingStyle}</span>
                </div>
                {selectedPlayer.attemptUrl && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(249, 203, 26, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(249, 203, 26, 0.3)' }}>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Training Attempt</span>
                    <a href={selectedPlayer.attemptUrl} target="_blank" rel="noreferrer" style={{ color: '#fff', backgroundColor: 'var(--brand-primary)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>View Video</a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default SquadOverview;
