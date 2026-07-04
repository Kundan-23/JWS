import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* Glassmorphism button styles */
const glassBtn = {
  base: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '1.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.875rem',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  player: {
    border: '1.5px solid rgba(249, 203, 26, 0.6)',
  },
  coach: {
    border: '1.5px solid rgba(147, 168, 255, 0.45)',
  },
  playerHover: {
    background: 'rgba(249, 203, 26, 0.18)',
    boxShadow: '0 4px 32px rgba(249, 203, 26, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
    transform: 'translateY(-2px)',
  },
  coachHover: {
    background: 'rgba(147, 168, 255, 0.18)',
    boxShadow: '0 4px 32px rgba(147, 168, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
    transform: 'translateY(-2px)',
  },
};

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const [playerHover, setPlayerHover] = React.useState(false);
  const [coachHover, setCoachHover]   = React.useState(false);

  // If admin is already logged in and lands here, redirect to admin2
  React.useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      navigate('/admin2', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handlePlayerClick = async () => {
    // If logged in as admin/coach, log out first so a player can register fresh
    if (isAuthenticated && role !== 'player') {
      await logout();
      navigate('/login');
      return;
    }

    // If already logged in as a player → check where they left off
    if (isAuthenticated && role === 'player') {
      try {
        const { authAPI } = await import('../services/api');
        const profileRes = await authAPI.me();
        const p = profileRes.data?.user;

        if (!p) { navigate('/onboarding/step1'); return; }

        // Not paid yet → payment page
        if (p.payment_status !== 'paid') {
          // Check if they filled step2 already (have a first name)
          if (!p.first_name) {
            navigate('/onboarding/step1');
          } else {
            navigate('/onboarding/payment');
          }
          return;
        }

        // Paid but dashboard not unlocked → back to payment (shouldn't happen but safe)
        if (!p.is_dashboard_unlocked) {
          navigate('/onboarding/payment');
          return;
        }

        // Check step4 (cricket profile) completion
        const hasStep4 = p.batting_style || p.bowling_style || p.height || p.weight;
        if (!hasStep4) {
          navigate('/onboarding/step4');
          return;
        }

        // All complete → dashboard
        navigate('/dashboard');
      } catch {
        // API failed → send to login to re-authenticate
        navigate('/login');
      }
      return;
    }

    // Not logged in → go to login/register
    navigate('/login');
  };

  const handleCoachClick = async () => {
    // If logged in as admin, log out first
    if (isAuthenticated && role === 'admin') {
      await logout();
    }
    if (isAuthenticated && role === 'coach') {
      navigate('/coach-dashboard');
    } else {
      navigate('/login', { state: { role: 'coach' } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      {/* Logo + headline */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '0.5rem' }}>
        <motion.img
          src="/logo/logo.png"
          alt="JWS Sports Logo"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
          style={{ height: '72px', objectFit: 'contain', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 16px rgba(203,249,5,0.35))' }}
        />
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: '0.4rem',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>
          Welcome to JWS Sports 2026
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
          Select your role to continue onboarding.
        </p>
      </div>

      {/* Role buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <button
          onClick={handlePlayerClick}
          onMouseEnter={() => setPlayerHover(true)}
          onMouseLeave={() => setPlayerHover(false)}
          style={{ ...glassBtn.base, ...glassBtn.player, ...(playerHover ? glassBtn.playerHover : {}) }}
        >
          <User size={44} color={playerHover ? '#cbf905' : 'rgba(203,249,5,0.85)'} strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>I am a Player</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>Register & manage your cricket journey</div>
          </div>
        </button>

        <button
          onClick={handleCoachClick}
          onMouseEnter={() => setCoachHover(true)}
          onMouseLeave={() => setCoachHover(false)}
          style={{ ...glassBtn.base, ...glassBtn.coach, ...(coachHover ? glassBtn.coachHover : {}) }}
        >
          <ShieldAlert size={44} color={coachHover ? '#a3b4ff' : 'rgba(163,180,255,0.85)'} strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>I am a Selector</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>Access squad management & analytics</div>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default Landing;

