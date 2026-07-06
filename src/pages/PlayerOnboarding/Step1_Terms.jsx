import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormStore } from '../../store/useFormStore';
import { useConfig } from '../../context/ConfigContext';

const Step1_Terms = () => {
  const navigate = useNavigate();
  const { updateBasicInfo } = useFormStore();
  const { registration_terms: registrationTerms } = useConfig();

  const handleAccept = () => {
    updateBasicInfo({ acceptedTerms: true });
    navigate('/onboarding/step2');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="heading-2">Terms & Conditions</h2>
        <p className="text-small" style={{ marginTop: '0.5rem' }}>Please read and accept to proceed.</p>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        overflowY: 'auto',
        marginBottom: '1.5rem',
        border: '1px solid var(--bg-surface-elevated)'
      }}>
        <h3 className="heading-3" style={{ marginBottom: '1rem' }}>JWS 2026 Registration Agreement</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit', 
          fontSize: '0.875rem',
          lineHeight: '1.6',
          color: 'var(--text-secondary)'
        }}>
          {registrationTerms || 'Loading terms & conditions...'}
        </pre>
      </div>

      <button className="btn-primary" onClick={handleAccept}>
        I Accept the Terms & Conditions
      </button>
    </motion.div>
  );
};

export default Step1_Terms;
