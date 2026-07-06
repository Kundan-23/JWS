import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { playerAPI } from '../../services/api';
import { CheckCircle2, Trophy } from 'lucide-react';

const Step5_Complete = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleCompleteRegistration = async () => {
    setSubmitting(true);
    try {
      // Call API to unlock dashboard
      await playerAPI.unlockDashboard();
      
      // Get fresh profile
      const profileRes = await playerAPI.getProfile();
      const freshPlayer = profileRes.data?.player || profileRes.data;
      
      // Update auth context
      const updatedUser = { ...freshPlayer, is_dashboard_unlocked: true, isDashboardUnlocked: true };
      setUser(updatedUser);
      localStorage.setItem('jws_user', JSON.stringify(updatedUser));

      Swal.fire({
        icon: 'success',
        title: '🎉 Registration Complete!',
        text: 'Welcome to JWS 2026! Taking you to your dashboard...',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905',
        timer: 2500,
        showConfirmButton: false
      });
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to complete registration. Try again.',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        confirmButtonColor: '#cbf905'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
        style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'linear-gradient(135deg, #513b8a, #cbf905)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 0 40px rgba(203, 249, 5, 0.4)'
        }}
      >
        <Trophy size={48} color="#fff" />
      </motion.div>

      <h2 className="heading-2" style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
        Profile Complete! 🏏
      </h2>
      <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', maxWidth: '320px' }}>
        Your JWS player profile has been successfully set up.
      </p>
      <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '320px' }}>
        You can upload your batting & bowling videos and documents from your dashboard after registration.
      </p>

      {/* Feature highlights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', width: '100%', maxWidth: '320px' }}>
        {[
          'Upload batting & bowling videos for selectors',
          'Upload your Aadhaar card',
          'Book upcoming offline trials',
          'Track your selection status'
        ].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(203,249,5,0.2)' }}>
            <CheckCircle2 size={18} color="#cbf905" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{feature}</span>
          </div>
        ))}
      </div>

      <div className="progress-container" style={{ marginBottom: '2rem', width: '100%' }}>
        <div className="progress-bar" style={{ width: '100%' }}></div>
      </div>

      <button
        className="btn-primary"
        onClick={handleCompleteRegistration}
        disabled={submitting}
        style={{ fontSize: '1rem', padding: '1rem 2rem' }}
      >
        {submitting ? 'Setting up your dashboard...' : 'Complete Registration & Continue to Dashboard'}
      </button>
    </motion.div>
  );
};

export default Step5_Complete;

