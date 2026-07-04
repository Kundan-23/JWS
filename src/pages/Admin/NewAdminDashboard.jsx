import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/adminAPI';
import { Users, CheckCircle, Clock, UserPlus, TrendingUp, UserCog, IndianRupee } from 'lucide-react';
import Swal from 'sweetalert2';
import { useConfig } from '../../context/ConfigContext';

const StatCard = ({ title, value, icon: Icon, color, bg, prefix = '' }) => (
  <div style={{
    backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
    padding: '1.5rem', border: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'flex-start', gap: '1rem',
    boxShadow: 'var(--shadow-sm)', transition: 'transform 0.18s, box-shadow 0.18s',
    cursor: 'default',
  }}
    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
  >
    <div style={{ backgroundColor: bg, padding: '0.85rem', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {prefix}{value ?? '—'}
      </p>
    </div>
  </div>
);

const MEDAL = { 0: '🥇', 1: '🥈', 2: '🥉' };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [extraLoading, setExtraLoading] = useState(true);
  const navigate = useNavigate();
  const { plans } = useConfig();

  const getPlanName = (planId) => {
    if (!planId) return '—';
    const id = planId.trim();
    if (id === 'p1') return 'Basic';
    if (id === 'p2') return 'Elite';
    const plan = plans?.find(p => p.id === id);
    return plan ? plan.name : id;
  };

  useEffect(() => {
    const fetchMain = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data?.stats || res.data);
        setRecentPlayers(res.data?.recentPlayers || []);
      } catch (err) {
        Swal.fire({
          icon: 'error', title: 'Failed to load stats',
          text: err.response?.data?.message || 'Could not fetch dashboard data.',
          background: 'var(--bg-surface)', color: 'var(--text-primary)',
          confirmButtonColor: 'var(--brand-primary)',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchExtra = async () => {
      try {
        const coachRes = await adminAPI.getCoaches();
        const coachList = coachRes.data?.coaches || coachRes.data || [];
        setCoaches(coachList);
      } catch {
        // non-critical — silent fail
      } finally {
        setExtraLoading(false);
      }
    };

    fetchMain();
    fetchExtra();
  }, []);

  const statCards = [
    { title: 'Total Players',         value: stats?.totalPlayers,        icon: Users,        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { title: 'Paid Players',          value: stats?.paidPlayers,         icon: CheckCircle,  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { title: "Today's Registrations", value: stats?.todayRegistrations,  icon: UserPlus,     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    { title: 'Total Selectors',       value: extraLoading ? null : coaches.length, icon: UserCog, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    { title: 'Est. Revenue',          value: stats?.estimatedRevenue != null ? stats.estimatedRevenue.toLocaleString('en-IN') : null, icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.12)', prefix: '₹' },
    { title: 'Pending Allotment',     value: stats?.pendingAllotment,    icon: Users,        color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  ];

  const recent = recentPlayers;

  const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'left' };
  const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textAlign: 'left' };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Admin Dashboard</h1>
        <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Here's what's happening in JWS today.</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 110, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {statCards.map(s => <StatCard key={s.title} {...s} />)}
        </div>
      )}

      {/* Recent Registrations */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="heading-3">Recent Registrations</h2>
          <button
            onClick={() => navigate('/admin2/players')}
            style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', background: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            View All →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent registrations.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>JWS ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, idx) => (
                  <tr key={p.id || idx}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => navigate(`/admin2/players/${p.id}`)}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700 }}>{p.gicl_id || p.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{p.email}</td>
                    <td style={tdStyle}>{p.plan_name || getPlanName(p.plan) || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: p.payment_status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: p.payment_status === 'paid' ? '#10b981' : '#ef4444',
                        border: `1px solid ${p.payment_status === 'paid' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>
                        {p.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>



      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
