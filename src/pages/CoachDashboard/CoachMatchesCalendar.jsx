import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCoachStore } from '../../store/useCoachStore';
import { Calendar as CalendarIcon, MapPin, Clock, Globe } from 'lucide-react';
import { coachAPI } from '../../services/api';

const CoachMatchesCalendar = () => {
  const { matches: upcomingMatches = [] } = useCoachStore();
  const [availableMatches, setAvailableMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coachAPI.getAvailableMatches()
      .then(res => {
        if (res.data?.success) {
          setAvailableMatches(res.data.matches || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const renderMatchCard = (match, isPublic = false) => {
    const matchDate = new Date(match.date);
    // Use title as opponent if opponent is missing
    const opponentName = match.opponent || match.title || 'TBA';
    const matchType = match.type || match.match_type || 'Match';
    const location = match.location || match.venue || 'TBA';
    
    return (
      <div 
        key={match.id}
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--bg-surface-elevated)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center'
        }}
      >
        {/* Date Badge */}
        <div style={{ 
          backgroundColor: isPublic ? 'var(--bg-surface-elevated)' : 'var(--brand-primary)', 
          color: isPublic ? 'var(--text-primary)' : 'var(--bg-surface)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.5rem 1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          minWidth: '80px'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {matchDate.toLocaleString('default', { month: 'short' })}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, marginTop: '0.25rem' }}>
            {matchDate.getDate()}
          </span>
        </div>

        {/* Trial Details */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--brand-accent)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isPublic && <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
              {matchType}
            </p>
            <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>{isPublic ? opponentName : `vs ${opponentName}`}</h3>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <Clock size={16} />
                {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <MapPin size={16} />
                {location}
              </div>
              {isPublic && match.price_per_slot && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                  ₹{match.price_per_slot} / slot
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Upcoming Offline Trials</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>View your squad's offline trials and other available selection trials.</p>
      </div>

      <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Your Squad Trials</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
        {upcomingMatches && upcomingMatches.length > 0 ? (
          upcomingMatches.map((match) => renderMatchCard(match, false))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            <CalendarIcon size={48} color="var(--bg-surface-elevated)" style={{ margin: '0 auto 1rem' }} />
            <p className="text-secondary">No upcoming trials scheduled for your squad.</p>
          </div>
        )}
      </div>

      <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Globe size={24} color="var(--brand-primary)" />
        Public Trials (Available to Players)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <p className="text-secondary text-center">Loading public trials...</p>
        ) : availableMatches && availableMatches.length > 0 ? (
          availableMatches.map((match) => renderMatchCard(match, true))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            <CalendarIcon size={48} color="var(--bg-surface-elevated)" style={{ margin: '0 auto 1rem' }} />
            <p className="text-secondary">No public trials available at this time.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CoachMatchesCalendar;
