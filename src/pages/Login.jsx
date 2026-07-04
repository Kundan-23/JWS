import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RESEND_SECONDS = 60;

const Login = () => {
  const navigate = useNavigate();
  const { saveSession, isAuthenticated, role } = useAuth();

  // Redirect if ALREADY logged in when page first loads
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin')        navigate('/admin2',          { replace: true });
      else if (role === 'coach')   navigate('/coach-dashboard', { replace: true });
      else {
        // For players, check onboarding completion via stored user data
        const stored = localStorage.getItem('jws_user');
        let u = null;
        try { u = stored ? JSON.parse(stored) : null; } catch { u = null; }
        const paymentDone = u?.payment_status === 'paid' || u?.is_dashboard_unlocked || u?.isDashboardUnlocked;
        if (!paymentDone) {
          navigate('/onboarding/payment', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── State ───────────────────────────────────────────────
  const [mode,   setMode]   = useState('login');    // 'login' | 'register' | 'forgot'
  const [step,   setStep]   = useState('email');    // 'email' | 'otp' | 'password' | 'set-password'
  const [loading, setLoading] = useState(false);

  const [email,           setEmail]           = useState('');
  const [otp,             setOtp]             = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionToken,    setSessionToken]    = useState('');
  const [resetToken,      setResetToken]      = useState('');
  const [resendTimer,     setResendTimer]     = useState(0);

  // OTP resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Helpers ─────────────────────────────────────────────
  function showError(msg) {
    Swal.fire({ icon: 'error', title: 'Error', text: msg,
      background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
  }
  function showSuccess(msg) {
    Swal.fire({ icon: 'success', title: 'Success', text: msg,
      background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905', timer: 2000, showConfirmButton: false });
  }

  function resetAll() {
    setStep('email'); setOtp(''); setPassword(''); setConfirmPassword('');
    setSessionToken(''); setResetToken(''); setResendTimer(0);
  }

  function switchMode(newMode) { setMode(newMode); resetAll(); }

  // ── API Calls ───────────────────────────────────────────

  // Step 1: Send OTP (register or forgot)
  async function handleSendOTP(e) {
    e.preventDefault();
    if (!email.trim()) return;
    const purpose = mode === 'register' ? 'register' : 'reset_password';
    setLoading(true);
    try {
      await authAPI.sendOTP(email.trim(), purpose);
      setStep('otp');
      setResendTimer(RESEND_SECONDS);
      showSuccess('OTP sent to your email!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally { setLoading(false); }
  }

  // Resend OTP
  async function handleResendOTP() {
    if (resendTimer > 0) return;
    const purpose = mode === 'register' ? 'register' : 'reset_password';
    setLoading(true);
    try {
      await authAPI.sendOTP(email.trim(), purpose);
      setResendTimer(RESEND_SECONDS);
      showSuccess('New OTP sent!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  }

  // Step 2: Verify OTP
  async function handleVerifyOTP(e) {
    e.preventDefault();
    if (otp.length !== 6) return;
    const purpose = mode === 'register' ? 'register' : 'reset_password';
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email.trim(), otp, purpose);
      if (mode === 'register') {
        setSessionToken(res.data.sessionToken);
        setStep('set-password');
      } else {
        setResetToken(res.data.resetToken);
        setStep('set-password');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  }

  // Step 3a: Set password after register OTP
  async function handleSetPassword(e) {
    e.preventDefault();
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return showError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await authAPI.setPassword(sessionToken, password, confirmPassword);
      const { token, refreshToken, user } = res.data;
      saveSession(token, refreshToken, user);
      showSuccess('Account created! Welcome to JWS Sports 🎉');
      navigate('/onboarding/step1', { replace: true });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to set password.');
    } finally { setLoading(false); }
  }

  // Step 3b: Reset password (forgot)
  async function handleResetPassword(e) {
    e.preventDefault();
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return showError('Passwords do not match.');
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, password, confirmPassword);
      showSuccess('Password updated! Please login.');
      switchMode('login');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  }

  // Direct login: email + password
  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      const { token, refreshToken, role: userRole, user } = res.data;
      saveSession(token, refreshToken, user);

      if (userRole === 'admin') {
        navigate('/admin2', { replace: true });
      } else if (userRole === 'coach') {
        navigate('/coach-dashboard', { replace: true });
      } else {
        // Smart player routing — resume from where they left off
        try {
          const profileRes = await authAPI.me();
          const p = profileRes.data?.user;

          if (!p) { navigate('/dashboard', { replace: true }); return; }

          // Not paid yet → back to payment step
          if (p.payment_status !== 'paid' && !p.is_dashboard_unlocked) {
            navigate('/onboarding/payment', { replace: true });
            return;
          }

          // Paid → go to dashboard
          navigate('/dashboard', { replace: true });
        } catch {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally { setLoading(false); }
  }


  // ── UI ──────────────────────────────────────────────────
  const fadeSlide = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 }, transition: { duration: 0.2 } };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '2.5rem 1.5rem',
        background: 'linear-gradient(135deg, #513b8a 0%, #cbf905 100%)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.2)'
      }}>

      <div style={{ 
        backgroundColor: '#20163b', 
        padding: '2rem', 
        borderRadius: 'var(--radius-xl)',
        width: '100%', 
        maxWidth: '400px', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)'
      }}>

        {/* Mode Toggle: Login / Register */}
        <div style={{ display: 'flex', backgroundColor: '#160e2b', padding: '0.25rem',
          borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, transition: 'all 0.2s',
                backgroundColor: mode === m ? '#20163b' : 'transparent',
                color: mode === m ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="heading-1" style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
            {mode === 'login'    && 'Welcome Back 👋'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot'   && 'Reset Password'}
          </h1>
          <p className="text-secondary text-small">
            {mode === 'login'    && step === 'email'        && 'Sign in with your email and password'}
            {mode === 'register' && step === 'email'        && 'Enter your email to get started'}
            {mode === 'register' && step === 'otp'          && `Check ${email} for your 6-digit code`}
            {mode === 'register' && step === 'set-password' && 'Set a secure password for your account'}
            {mode === 'forgot'   && step === 'email'        && 'Enter your registered email'}
            {mode === 'forgot'   && step === 'otp'          && `Check ${email} for your 6-digit code`}
            {mode === 'forgot'   && step === 'set-password' && 'Enter your new password'}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── LOGIN: Email + Password ── */}
          {mode === 'login' && (
            <motion.form key="login" {...fadeSlide} onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div style={{ textAlign: 'right', marginTop: '-0.75rem' }}>
                <button type="button" onClick={() => switchMode('forgot')}
                  style={{ background: 'none', color: 'var(--brand-accent)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="btn-primary" disabled={loading || !email || !password}>
                {loading ? 'Signing in…' : 'Login'}
              </button>

            </motion.form>
          )}

          {/* ── REGISTER / FORGOT: Step 1 — Email ── */}
          {(mode === 'register' || mode === 'forgot') && step === 'email' && (
            <motion.form key="otp-email" {...fadeSlide} onSubmit={handleSendOTP}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading || !email}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
              {mode === 'forgot' && (
                <button type="button" onClick={() => switchMode('login')}
                  style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  ← Back to Login
                </button>
              )}
            </motion.form>
          )}

          {/* ── REGISTER / FORGOT: Step 2 — OTP ── */}
          {(mode === 'register' || mode === 'forgot') && step === 'otp' && (
            <motion.form key="otp-verify" {...fadeSlide} onSubmit={handleVerifyOTP}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">6-Digit OTP</label>
                <input type="text" className="form-input" placeholder="• • • • • •" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus style={{ textAlign: 'center', letterSpacing: '0.75rem', fontSize: '1.4rem' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setStep('email'); setOtp(''); }}
                  style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Change Email
                </button>
                <button type="button" onClick={handleResendOTP} disabled={resendTimer > 0 || loading}
                  style={{ background: 'none', fontSize: '0.8rem', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--brand-accent)' }}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </motion.form>
          )}

          {/* ── REGISTER / FORGOT: Step 3 — Set Password ── */}
          {(mode === 'register' || mode === 'forgot') && step === 'set-password' && (
            <motion.form key="set-password" {...fadeSlide}
              onSubmit={mode === 'register' ? handleSetPassword : handleResetPassword}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  {mode === 'register' ? 'Create Password' : 'New Password'}
                </label>
                <input type="password" className="form-input" placeholder="Min 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>Passwords don't match</p>
                )}
              </div>
              <button type="submit" className="btn-primary"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}>
                {loading
                  ? (mode === 'register' ? 'Creating Account…' : 'Resetting…')
                  : (mode === 'register' ? 'Create Account & Continue' : 'Reset Password')}
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Login;

