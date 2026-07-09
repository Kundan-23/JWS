import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import {
  LayoutDashboard, Users, CreditCard, Share2, Wallet,
  UserCog, Calendar, Settings, LogOut, Menu, X, ShieldCheck,
  ChevronRight, Video, Users2, Bell, Eye
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import NotificationDropdown from '../../components/layout/NotificationDropdown';

const READ_ONLY_ADMIN_EMAIL = 'jwsadmin2026@gmail.com';
const VIEWER_FORBIDDEN_PATHS = ['/admin2/allotment', '/admin2/scrutiny', '/admin2/config'];

const SIDEBAR_WIDTH = 240;

const ALL_NAV_LINKS = [
  { name: 'Dashboard',       path: '/admin2',              icon: LayoutDashboard, end: true },
  { name: 'Players',         path: '/admin2/players',      icon: Users },
  { name: 'Selectors',       path: '/admin2/coaches',      icon: UserCog },
  { name: 'Selection Trials',path: '/admin2/matches',      icon: Calendar },
  { name: 'Allotment',       path: '/admin2/allotment',    icon: Users2,   viewerHidden: true },
  { name: 'Video Review',    path: '/admin2/scrutiny',     icon: Video,    viewerHidden: true },
  { name: 'Configuration',   path: '/admin2/config',       icon: Settings, viewerHidden: true },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { appLogoUrl } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  // Auth guard
  const raw = localStorage.getItem('jws_user');
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // Viewer-admin restrictions
  const isViewerAdmin = user.email === READ_ONLY_ADMIN_EMAIL;
  const navLinks = ALL_NAV_LINKS.filter(l => !(isViewerAdmin && l.viewerHidden));

  // Block direct URL access to forbidden paths for viewer admin
  if (isViewerAdmin && VIEWER_FORBIDDEN_PATHS.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/admin2" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('jws_token');
    localStorage.removeItem('jws_user');
    navigate('/login');
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: `${SIDEBAR_WIDTH}px`,
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    transition: 'transform 0.3s ease',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...sidebarStyle,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
        className="admin-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {appLogoUrl ? (
            <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
              <img src={appLogoUrl} alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--brand-primary), #F0A500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(203,249,5,0.35)',
              }}>
                <ShieldCheck size={20} color="#121A3F" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1 }}>JWS</div>
                <div style={{ fontSize: '0.7rem', color: isViewerAdmin ? '#f59e0b' : 'var(--brand-primary)', fontWeight: 600, letterSpacing: '0.1em' }}>{isViewerAdmin ? 'VIEWER ACCESS' : 'ADMIN PANEL'}</div>
              </div>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-close-btn"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', color: 'var(--text-secondary)', display: 'none' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', minHeight: 0 }}>
          {navLinks.map(({ name, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                color: isActive ? '#2a1d4e' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                boxShadow: isActive ? '0 4px 12px rgba(203,249,5,0.25)' : 'none',
                transition: 'all 0.18s',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? '#2a1d4e' : 'currentColor'} />
                  <span style={{ flex: 1 }}>{name}</span>
                  {isActive && <ChevronRight size={14} color="#2a1d4e" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sponsors + Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Customer Support */}
          <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', padding: '0.65rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', alignItems: 'stretch' }}>
              <p style={{ fontSize: '0.72rem', color: '#fff', margin: 0, fontWeight: 600, letterSpacing: '0.02em', textAlign: 'center', whiteSpace: 'nowrap' }}>Connect For Customer Support</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'var(--brand-accent)', margin: '0.2rem 0 0 0', fontWeight: 800, fontSize: '1rem' }}>
                {"08067335522".split("").map((digit, idx) => (
                  <span key={idx}>{digit}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Logo Placeholders (Sponsors) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              {[1, 2].map(slot => {
                const link = slot === 1 
                  ? "https://www.instagram.com/indianindoorcricketofficial/"
                  : "https://www.instagram.com/giclsports/";
                return (
                  <a 
                    key={slot} 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ flex: 1, height: '52px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img 
                      src={`https://olppjpllvtwmzijskyeh.supabase.co/storage/v1/object/public/banners/sponsor-${slot}.png`} 
                      alt={`Sponsor ${slot}`} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      onLoad={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', display: 'none' }}>Sponsor {slot}</span>
                  </a>
                );
              })}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: '0.15rem 0 0 0', fontWeight: 500 }}>
              Click The Logos To Follow Us On Instagram
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)', fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Top header (mobile only) */}
        <header className="admin-topbar" style={{ display: 'none', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', color: 'var(--text-primary)', display: 'flex' }}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--brand-primary)" />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>JWS Admin</span>
          </div>
        </header>

        {/* Global Floating Header (Profile & Notifs) - ONLY ON DASHBOARD */}
        {(location.pathname === '/admin2' || location.pathname === '/admin2/') && (
          <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 50, display: 'flex', alignItems: 'center', gap: '1rem' }} className="notif-trigger">
            
            {/* Admin Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.4rem 1rem 0.4rem 0.4rem', borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', lineHeight: 1.2 }}>{user?.name || 'Admin'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{user?.email}</span>
              </div>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: 'var(--error)', color: '#fff', fontSize: '11px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} roleId={user?.id} roleType="admin" />
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', minHeight: 0 }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar { transform: translateX(0) !important; }
          .admin-close-btn { display: none !important; }
          .admin-main { margin-left: ${SIDEBAR_WIDTH}px; }
          .admin-topbar { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-close-btn { display: flex !important; }
          .admin-topbar { display: flex !important; }
          .admin-main { margin-left: 0; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

