import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MatchesCalendar from './MatchesCalendar';
import MatchBookings from './MatchBookings';

const OfflineTrials = () => {
  const [activeTab, setActiveTab] = useState('matches'); // Default to showing booked matches

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="heading-1">Offline Selection Trials</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Manage your booked selection trials and discover new trial slots.</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-surface-elevated)', marginBottom: '2rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('matches')}
          style={{
            padding: '1rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'matches' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: activeTab === 'matches' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          My Booked Trials
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            padding: '1rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bookings' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: activeTab === 'bookings' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          Book a New Trial
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'matches' ? (
          <MatchesCalendar hideHeader={true} />
        ) : (
          <MatchBookings hideHeader={true} />
        )}
      </motion.div>
    </div>
  );
};

export default OfflineTrials;
