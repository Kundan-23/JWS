import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFormStore } from '../../store/useFormStore';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Share2 } from 'lucide-react';
import { playerAPI } from '../../services/api';

const MatchesCalendar = ({ hideHeader }) => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await playerAPI.getMatches();
      if (res.data?.success && res.data.matches) {
        const now = new Date();
        const upcoming = res.data.matches
          .filter(m => new Date(m.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(m => ({
            ...m,
            opponent: m.title || 'TBA',
            location: m.venue || m.location || 'TBA',
            type: m.match_type || m.type || 'Match',
            totalSlots: m.total_slots || 22,
            bookedSlots: m.booked_slots || 0,
            isBookedByMe: true
          }));
        setUpcomingMatches(upcoming);
      }
    } catch (err) {
      console.error('Failed to load booked matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleBookSlot = (id) => {
    // legacy mock handler, no longer used as booking goes through MatchBookings
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 30, height: 30, border: '3px solid var(--bg-surface-elevated)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading booked trials…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {!hideHeader && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-1">JWS Selection Trials Calendar</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>View upcoming trials and manage your bookings.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {upcomingMatches && upcomingMatches.length > 0 ? (
          upcomingMatches.map((match) => {
            const matchDate = new Date(match.date);
            const slotsRemaining = match.totalSlots - match.bookedSlots;
            
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
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {/* Date Badge */}
                <div style={{ 
                  backgroundColor: 'var(--brand-primary)', 
                  color: 'var(--bg-surface)', 
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

                {/* Match Details */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: 'var(--brand-accent)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{match.type}</p>
                      <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>vs {match.opponent}</h3>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <Clock size={16} />
                      {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <MapPin size={16} />
                      {match.location}
                    </div>
                  </div>
                </div>

                {/* Booking Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '150px', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: slotsRemaining > 5 ? 'var(--brand-accent)' : 'var(--error)' }}>
                    <Users size={16} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{slotsRemaining} Slots Left</span>
                  </div>
                  
                  {match.isBookedByMe ? (
                    <button className="btn-secondary" disabled style={{ width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }}>
                      Slot Booked
                    </button>
                  ) : slotsRemaining > 0 ? (
                    <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleBookSlot(match.id)}>
                      Book Slot
                    </button>
                  ) : (
                    <button className="btn-secondary" disabled style={{ width: '100%' }}>
                      Fully Booked
                    </button>
                  )}
                  
                  <button 
                    className="btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `JWS Selection Trial: ${match.opponent}`,
                          text: `Join us for the ${match.type} trial against ${match.opponent} on ${matchDate.toLocaleString()} at ${match.location}!`,
                          url: window.location.href,
                        }).catch(console.error);
                      } else {
                        alert("Sharing is not supported on this device/browser.");
                      }
                    }}
                  >
                    <Share2 size={16} /> Share
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            <CalendarIcon size={48} color="var(--bg-surface-elevated)" style={{ margin: '0 auto 1rem' }} />
            <p className="text-secondary">No upcoming matches at this time.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MatchesCalendar;
