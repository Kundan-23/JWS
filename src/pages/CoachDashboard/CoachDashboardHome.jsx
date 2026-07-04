import React from 'react';
import { motion } from 'framer-motion';
import { useCoachStore } from '../../store/useCoachStore';
import { useConfig } from '../../context/ConfigContext';
import { Users, Calendar, Video, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CoachDashboardHome = () => {
  const { allocatedPlayers = [], matches = [], profile, videos = [] } = useCoachStore();
  const { maxSquadSize = 20 } = useConfig();
  const navigate = useNavigate();

  const squadSize = allocatedPlayers.length;
  const upcomingMatchesCount = matches.length;

  // Pending player videos to review
  const pendingVideos = videos.filter(v => v.status !== 'Reviewed').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Welcome back, Selector!</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Here is what's happening with your squad today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Squad Status */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/coach-dashboard/squad')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <h3 className="text-small text-secondary">My Squad</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{squadSize} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ {maxSquadSize}</span></p>
          {squadSize >= maxSquadSize && <p className="text-small" style={{ color: 'var(--brand-primary)', marginTop: '0.5rem' }}>Squad Full</p>}
        </motion.div>

        {/* Offline Trials Status */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/coach-dashboard/matches')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <Calendar size={24} color="#10b981" />
            </div>
            <h3 className="text-small text-secondary">Upcoming Trials</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{upcomingMatchesCount}</p>
        </motion.div>

        {/* Video Scrutiny Status */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/coach-dashboard/scrutiny')}
          style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(255, 199, 44, 0.1)', padding: '0.75rem', borderRadius: '50%' }}>
              <Video size={24} color="var(--brand-primary)" />
            </div>
            <h3 className="text-small text-secondary">Pending Player Videos</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingVideos}</p>
        </motion.div>

      </div>

      <h2 className="heading-2" style={{ marginBottom: '1rem' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <div 
          onClick={() => navigate('/coach-dashboard/squad')}
          style={{ cursor: 'pointer', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', transition: 'all 0.2s' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-surface-elevated)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Users size={28} color="#3b82f6" />
            <ArrowRight size={20} color="var(--text-secondary)" />
          </div>
          <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>Squad Overview</h3>
          <p className="text-small text-secondary">View player profiles, skill levels, and analyze squad strength.</p>
        </div>

        <div 
          onClick={() => navigate('/coach-dashboard/scrutiny')}
          style={{ cursor: 'pointer', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', transition: 'all 0.2s' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-surface-elevated)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Activity size={28} color="#10b981" />
            <ArrowRight size={20} color="var(--text-secondary)" />
          </div>
          <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>Video Scrutiny</h3>
          <p className="text-small text-secondary">Review gameplay footage uploaded by your allocated players.</p>
        </div>

      </div>

    </motion.div>
  );
};

export default CoachDashboardHome;
