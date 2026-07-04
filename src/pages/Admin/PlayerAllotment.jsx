import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { useConfig } from '../../context/ConfigContext';
import { Users, Search, UserCog, RefreshCw, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const PlayerAllotment = () => {
  const config = useConfig();
  const MAX_SQUAD = config.max_players_per_coach || 20;

  const [unassigned, setUnassigned]   = useState([]);
  const [coaches, setCoaches]         = useState([]);
  const [allPlayers, setAllPlayers]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [assigning, setAssigning]     = useState(null); // playerId being assigned
  const [coachSelect, setCoachSelect] = useState({}); // { [playerId]: coachId }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        adminAPI.getPlayers({ limit: 500 }),
        adminAPI.getCoaches(),
      ]);
      const players = pRes.data?.players || pRes.data || [];
      const coachList = cRes.data?.coaches || cRes.data || [];
      setAllPlayers(players);
      setCoaches(coachList);
      // Unassigned: paid players with no coach
      setUnassigned(players.filter(p => p.payment_status === 'paid' && !p.allocated_coach_id));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Load Error', text: err.response?.data?.message || 'Failed to load allotment data.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getSquad = (coachId) => allPlayers.filter(p => p.allocated_coach_id === coachId);

  const handleAssign = async (playerId) => {
    const coachId = coachSelect[playerId];
    if (!coachId) {
      Swal.fire({ icon: 'warning', title: 'Select a coach', background: 'var(--bg-surface)', color: 'var(--text-primary)', timer: 1500, showConfirmButton: false });
      return;
    }
    setAssigning(playerId);
    try {
      await adminAPI.assignCoach(playerId, coachId);
      // Optimistic update
      setAllPlayers(prev => prev.map(p => p.id === playerId ? { ...p, allocated_coach_id: coachId } : p));
      setUnassigned(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to assign.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    } finally {
      setAssigning(null);
    }
  };



  const filtered = unassigned.filter(p => {
    const q = search.toLowerCase();
    return !q
      || `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
      || (p.gicl_id || '').toLowerCase().includes(q)
      || (p.email || '').toLowerCase().includes(q);
  });

  const selectStyle = {
    padding: '0.45rem 2rem 0.45rem 0.65rem',
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.35rem center',
    backgroundSize: '1.1em',
    minWidth: 130,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1">Player Allotment</h1>
          <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Assign paid players to coaches and manage squads.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* ── LEFT: Unassigned Players ─────────────────────────────── */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#3b82f6" /> Unassigned Players
                <span style={{ marginLeft: '0.25rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                  {unassigned.length}
                </span>
              </h2>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 520 }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p>All paid players are assigned!</p>
              </div>
            ) : (
              filtered.map(player => (
                <div
                  key={player.id}
                  style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.first_name} {player.last_name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {player.gicl_id} · {player.dob ? `${Math.floor((Date.now() - new Date(player.dob)) / (365.25 * 24 * 3600 * 1000))} Yrs` : 'Age N/A'}
                    </p>
                  </div>
                  <select
                    value={coachSelect[player.id] || ''}
                    onChange={e => setCoachSelect(prev => ({ ...prev, [player.id]: e.target.value }))}
                    style={selectStyle}
                  >
                    <option value="">Select coach</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(player.id)}
                    disabled={assigning === player.id || !coachSelect[player.id]}
                    style={{
                      padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)',
                      background: coachSelect[player.id] ? 'linear-gradient(135deg, var(--brand-primary), #F0A500)' : 'rgba(255,255,255,0.05)',
                      color: coachSelect[player.id] ? '#121A3F' : 'var(--text-secondary)',
                      border: 'none', fontWeight: 700, fontSize: '0.8rem',
                      cursor: coachSelect[player.id] && assigning !== player.id ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {assigning === player.id ? '…' : 'Assign'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Coaches & Squads ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0 0.25rem' }}>
            <UserCog size={18} color="#a78bfa" />
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Coaches & Squads</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({coaches.length} coaches)</span>
          </div>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 120, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
            ))
          ) : coaches.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
              No coaches found.
            </div>
          ) : (
            coaches.map(coach => {
              const squad = getSquad(coach.id);
              const pct = Math.min(100, Math.round((squad.length / MAX_SQUAD) * 100));
              const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';

              return (
                <div key={coach.id} style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: squad.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{coach.first_name} {coach.last_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{coach.gicl_id || coach.email}</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: barColor }}>
                        {squad.length} / {MAX_SQUAD}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {squad.length > 0 && (
                    <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                      {squad.map(p => (
                        <div key={p.id} style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</span>
                          <span style={{ fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{p.gicl_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) {
          .allotment-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PlayerAllotment;
