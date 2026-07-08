import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Users, Video, ShieldPlus, CalendarDays, LogOut, Bell } from 'lucide-react';
import { useCoachStore } from '../../store/useCoachStore';
import { useConfig } from '../../context/ConfigContext';
import { useNotificationStore } from '../../store/useNotificationStore';
import NotificationDropdown from './NotificationDropdown';

const CoachDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const { profile, fetchProfile, fetchPlayers, fetchVideos, fetchMatches, resetCoach } = useCoachStore();
  const { appLogoUrl } = useConfig();

  useEffect(() => {
    fetchProfile();
    fetchPlayers();
    fetchVideos();
    fetchMatches();
  }, []);

  const handleLogout = () => {
    resetCoach();
    localStorage.removeItem('jws_token');
    navigate('/');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/coach-dashboard', icon: <ShieldPlus size={20} />, end: true },
    { name: 'My Squad', path: '/coach-dashboard/squad', icon: <Users size={20} /> },
    { name: 'Player Videos', path: '/coach-dashboard/scrutiny', icon: <Video size={20} /> },
    { name: 'Upcoming Offline Trials', path: '/coach-dashboard/matches', icon: <CalendarDays size={20} /> },
  ];

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '260px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--bg-surface-elevated)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xl)'
        }}
        className="sidebar-desktop"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
            <img src={appLogoUrl || "/logo/logonew.png"} alt="JWS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', color: 'var(--text-secondary)' }} className="close-btn-mobile">
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '0.25rem' }} className="custom-scrollbar">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.end}
              onClick={() => setIsSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? '#2a1d4e' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s'
              })}
              onMouseEnter={e => { const el = e.currentTarget; if (el.getAttribute('aria-current') !== 'page') { el.style.color = '#cbf905'; el.style.backgroundColor = 'rgba(203,249,5,0.12)'; } }}
              onMouseLeave={e => { const el = e.currentTarget; if (el.getAttribute('aria-current') !== 'page') { el.style.color = ''; el.style.backgroundColor = ''; } }}
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Customer Support */}
          <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '0.65rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.72rem', color: '#fff', margin: 0, fontWeight: 600, letterSpacing: '0.02em' }}>Connect For Customer Support</p>
            <p style={{ fontSize: '1rem', color: 'var(--brand-accent)', margin: '0.2rem 0 0 0', fontWeight: 800, letterSpacing: '0.05em' }}>08045253558</p>
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', color: 'var(--error)', background: 'none', fontWeight: 500 }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, transition: 'margin-left 0.4s' }} className="main-content">
        
        {/* Top Header (Mobile + Desktop Notification) */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', color: 'var(--text-primary)' }}>
              <Menu size={24} />
            </button>
            <h2 className="heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldPlus size={20} color="var(--brand-accent)" /> Selector Portal
            </h2>
          </div>

          {/* Coach name pill & Notifications */}
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              
              {/* Profile Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.4rem 1rem 0.4rem 0.4rem', borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {profile.profile_photo_url
                  ? <img src={profile.profile_photo_url} alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{profile.full_name?.[0]}</div>
                }
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', lineHeight: 1.2 }}>{profile.full_name || 'Selector'}</span>
                  {profile.email && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{profile.email}</span>}
                </div>
              </div>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={handleNotifClick}
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
                <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} roleId={profile.id} roleType="coach" />
              </div>

            </div>
          )}
        </header>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { transform: translateX(0) !important; }
          .close-btn-mobile { display: none !important; }
          .mobile-menu-btn { display: none !important; }
          .main-content { margin-left: 260px; }
        }
      `}</style>
    </div>
  );
};

export default CoachDashboardLayout;
