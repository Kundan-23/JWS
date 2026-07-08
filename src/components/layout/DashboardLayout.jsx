import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Calendar, CalendarDays, User, LogOut, Upload, FileText, Bell } from 'lucide-react';
import { useFormStore } from '../../store/useFormStore';
import { useConfig } from '../../context/ConfigContext';
import { useNotificationStore } from '../../store/useNotificationStore';
import NotificationDropdown from './NotificationDropdown';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    try {
      const token = localStorage.getItem('jws_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      }
    } catch (e) { console.error('Failed to parse token', e); }
  }, []);
  const { resetForm, dashboardState, basicInfo } = useFormStore();
  const { banners, ad_banners: adBanners, appLogoUrl } = useConfig();

  const handleLogout = () => {
    resetForm();
    navigate('/');
  };

  const uploadedVideos = dashboardState.uploadedVideos || [];
  const poorVideo = uploadedVideos.find(v => v.review_flag === 'poor');
  const selectedVideo = uploadedVideos.find(v => v.review_flag === 'good' || v.review_flag === 'best');

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} />, end: true },
  ];

  if (!poorVideo) {
    navLinks.push({ name: 'Upload Batting & Bowling Videos', path: '/dashboard/gameplay', icon: <Upload size={20} /> });
  }

  navLinks.push({ name: 'My Documents', path: '/dashboard/documents', icon: <FileText size={20} /> });

  if (selectedVideo) {
    navLinks.push({ name: 'Offline Trials', path: '/dashboard/trials', icon: <CalendarDays size={20} /> });
  }

  // Auto-scroll banners
  useEffect(() => {
    const timer = setInterval(() => {
      if (banners && banners.length > 0) {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const [currentAdBanner, setCurrentAdBanner] = useState(0);
  // Auto-scroll ad banners
  useEffect(() => {
    const timer = setInterval(() => {
      if (adBanners && adBanners.length > 0) {
        setCurrentAdBanner((prev) => (prev + 1) % adBanners.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [adBanners]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
            <img src={appLogoUrl || "/logo/logonew.png"} alt="JWS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', color: 'var(--text-secondary)', flexShrink: 0 }} className="close-btn-mobile">
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '0.25rem' }}>
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
                transition: 'all 0.2s',
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
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.72rem', color: '#fff', margin: 0, fontWeight: 500 }}>connect for customer support</p>
            <p style={{ fontSize: '0.92rem', color: 'var(--brand-accent)', margin: '0.15rem 0 0 0', fontWeight: 700, letterSpacing: '0.03em' }}>08045253558</p>
          </div>

          {/* Logo Placeholders (Sponsors) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: '0.15rem 0 0 0' }}>
              click the logos to follow us on instagram
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
        
        {/* Top Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', color: 'var(--text-primary)' }}>
              <Menu size={24} />
            </button>
            <h2 className="heading-3" style={{ margin: 0 }}>Player Portal</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* Profile Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.4rem 1rem 0.4rem 0.4rem', borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden' }}>
                {dashboardState.profilePhotoUrl ? (
                  <img src={dashboardState.profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : 'P'
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', lineHeight: 1.2 }}>{user?.name || 'Player'}</span>
                {user?.email && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{user.email}</span>}
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
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} roleId={user?.id} roleType="player" />
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          
          {/* Web Banners Carousel */}
          {banners && banners.length > 0 && (
            <div style={{ marginBottom: '2rem', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)', height: '160px' }}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${banners[currentBanner]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#1a1a2e',
                  }}
                />
              </AnimatePresence>
              
              {/* Carousel Indicators */}
              <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {banners.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentBanner(idx)}
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: currentBanner === idx ? '#fff' : 'rgba(255,255,255,0.3)',
                      border: 'none',
                      padding: 0
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ad Banners Carousel */}
          {adBanners && adBanners.length > 0 && (
            <div style={{ marginBottom: '2rem', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)', height: '250px' }}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={`ad-${currentAdBanner}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${adBanners[currentAdBanner]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#1a1a2e',
                  }}
                />
              </AnimatePresence>
              
              {/* Carousel Indicators for Ads */}
              {adBanners.length > 1 && (
                <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {adBanners.map((_, idx) => (
                    <button 
                      key={`ad-ind-${idx}`} 
                      onClick={() => setCurrentAdBanner(idx)}
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: currentAdBanner === idx ? '#fff' : 'rgba(255,255,255,0.3)',
                        border: 'none',
                        padding: 0
                      }} 
                    />
                  ))}
                </div>
              )}
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#fff', letterSpacing: '0.05em' }}>
                ADVERTISEMENT
              </div>
            </div>
          )}

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

export default DashboardLayout;
