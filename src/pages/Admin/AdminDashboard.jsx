import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, DollarSign, X } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { useAdminStore } from '../../store/useAdminStore';

const AdminDashboard = () => {
  const { plans } = useConfigStore();
  const { players, coaches } = useAdminStore();
  const [selectedCard, setSelectedCard] = useState(null);
  const basicPlan = plans.find(p => p.id === 'p1') || plans[0];
  const elitePlan = plans.find(p => p.id === 'p2') || plans[1] || plans[0];
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Admin Dashboard</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Overview of GICL System</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div 
          onClick={() => setSelectedCard('players')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--bg-surface-elevated)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <h3 className="heading-3">Total Players</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{players.length}</p>
          <p className="text-small text-secondary">View detailed list</p>
        </div>

        <div 
          onClick={() => setSelectedCard('coaches')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--bg-surface-elevated)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <h3 className="heading-3">Total Selectors</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{coaches.length}</p>
          <p className="text-small text-secondary">View detailed list</p>
        </div>

        <div 
          onClick={() => setSelectedCard('revenue')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-accent)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(255, 199, 44, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <DollarSign size={24} color="var(--brand-accent)" />
            </div>
            <h3 className="heading-3">Revenue Details</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">{basicPlan.name}:</span>
              <span style={{ fontWeight: 600 }}>₹{basicPlan.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">{elitePlan.name}:</span>
              <span style={{ fontWeight: 600 }}>₹{elitePlan.price}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedCard(null)} 
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', color: 'var(--text-secondary)' }}
              >
                <X size={24} />
              </button>

              {selectedCard === 'players' && (
                <div>
                  <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>All Players</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ID</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Age</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Batting</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{p.id}</td>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '1rem' }}>{p.age}</td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.battingStyle}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: p.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.status === 'Active' ? 'var(--success)' : 'var(--error)' }}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedCard === 'coaches' && (
                <div>
                  <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Active Selectors</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ID</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Name</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Location</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Max Squad</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coaches.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{c.id}</td>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{c.name}</td>
                            <td style={{ padding: '1rem' }}>{c.location || 'N/A'}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>{c.maxSquadSize}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: c.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: c.status === 'Active' ? 'var(--success)' : 'var(--error)' }}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedCard === 'revenue' && (
                <div>
                  <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Revenue & Plan Details</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {plans.map(p => (
                      <div key={p.id} style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-surface-elevated)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{p.name}</h4>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{p.price}</span>
                        </div>
                        <p className="text-secondary text-small" style={{ marginBottom: '1rem' }}>{p.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                          <span className="text-small">Active Subscriptions</span>
                          <span style={{ fontWeight: 600 }}>{Math.floor(Math.random() * 500) + 50} users</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
