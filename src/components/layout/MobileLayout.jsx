import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';

const MobileLayout = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { landing_bg_image: landingBgImage, appLogoUrl } = useConfig();

  if (isLanding) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url('${landingBgImage || '/images/landingpagebgimage/bg-image.jpeg'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        /* Edge vignette to frame the background */
        boxShadow: 'inset 0 0 120px 40px rgba(10, 15, 40, 0.85)',
        position: 'relative',
      }}>
        {/* Dark radial vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8, 12, 35, 0.75) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Centered glassmorphism card */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          margin: '1.5rem',
          background: 'rgba(18, 26, 63, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Outlet />
          <footer style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2rem' }}>
            © {new Date().getFullYear()} JWS Sports
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* Header/Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={appLogoUrl || "/logo/logo.png"} alt="JWS Sports Logo" style={{ maxWidth: '100%', maxHeight: '48px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
      </header>

      {/* Main App Container */}
      <div className="app-container" style={{ minHeight: 'auto', flex: 1, boxShadow: 'none' }}>
        <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
        <footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          © {new Date().getFullYear()} JWS Sports
        </footer>
      </div>
    </div>
  );
};

export default MobileLayout;
