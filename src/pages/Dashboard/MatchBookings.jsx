import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { Calendar, MapPin, IndianRupee, ShieldCheck, Share2, CheckCircle2, Users, Tag, Zap, ChevronDown, AlertTriangle } from 'lucide-react';
import { playerAPI } from '../../services/api';
import FaqAccordionList from '../../components/FaqAccordionList';

const TYPE_COLORS = {
  league:     { bg: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  friendly:   { bg: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  tournament: { bg: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
};

const CollapsibleSection = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!content) return null;

  return (
    <div style={{ marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '0.6rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isOpen ? 'var(--brand-primary)' : 'rgba(255,255,255,0.7)' }}>{title}</span>
        <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'flex' }}>
          <ChevronDown size={16} />
        </span>
      </div>
      {isOpen && (
        <div style={{ 
          padding: '0.75rem', 
          fontSize: '0.8rem', 
          color: 'rgba(255,255,255,0.6)', 
          lineHeight: 1.5, 
          whiteSpace: 'pre-wrap',
          maxHeight: '160px', 
          overflowY: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {content}
        </div>
      )}
    </div>
  );
};

const MatchBookings = ({ hideHeader }) => {
  const navigate = useNavigate();
  const [matches,   setMatches]   = useState([]);
  const [booked,    setBooked]    = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [aadharUrl, setAadharUrl] = useState(null); // null = not checked yet, '' = missing

  const hasAnyBooking = booked.size > 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRes, bookingRes, profileRes] = await Promise.all([
        playerAPI.getAvailableMatches(),
        playerAPI.getMyBookings(),
        playerAPI.getProfile(),
      ]);
      setMatches(matchRes.data?.matches || []);
      const bookedIds = new Set((bookingRes.data?.bookings || []).map(b => b.match_id));
      setBooked(bookedIds);
      // Store aadhar_url — empty string means not uploaded
      setAadharUrl(profileRes.data?.player?.aadhar_url || '');
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBook = async (match) => {
    if (booked.has(match.id)) return;

    // ── Aadhaar gate ──────────────────────────────────────────
    if (!aadharUrl) {
      Swal.fire({
        icon: 'warning',
        title: 'Aadhaar Card Required',
        html: `<p style="color:#cbd5e1;">You must upload your <strong>Aadhaar card</strong> before booking a trial slot.</p>
               <p style="margin-top:0.5rem;color:#94a3b8;font-size:0.85rem;">Go to <b>My Documents</b> to upload it.</p>`,
        background: '#0f1629',
        color: '#fff',
        confirmButtonColor: '#cbf905',
        confirmButtonText: '📄 Upload Now',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#374151',
      }).then((result) => {
        if (result.isConfirmed) navigate('/dashboard/documents');
      });
      return;
    }
    // ─────────────────────────────────────────────────────────
    setBookingId(match.id);
    try {
      const res = await playerAPI.createBookingOrder({ matchId: match.id });
      const { orderId, amount, currency, matchTitle } = res.data;

      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name:        'JWS Sports',
        description: `Slot booking — ${matchTitle}`,
        order_id:    orderId,
        theme:       { color: '#cbf905' },
        modal:       { ondismiss: () => setBookingId(null) },
        handler: async function (response) {
          try {
            await playerAPI.verifyBookingPayment({
              matchId:             match.id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            setBooked(prev => new Set([...prev, match.id]));
            setMatches(prev => prev.map(m =>
              m.id === match.id ? { ...m, booked_slots: (m.booked_slots || 0) + 1 } : m
            ));
            Swal.fire({
              icon: 'success',
              title: '🎉 Slot Confirmed!',
              html: `<p>Your slot for <strong>${matchTitle}</strong> is confirmed.</p><p style="margin-top:0.5rem;color:#94a3b8;font-size:0.85rem;">Payment ID: ${response.razorpay_payment_id}</p>`,
              background: '#0f1629',
              color: '#fff',
              confirmButtonColor: '#cbf905',
            });
          } catch (err) {
            Swal.fire({ icon: 'error', title: 'Verification Failed', text: err.response?.data?.message || 'Contact support.', background: '#0f1629', color: '#fff' });
          } finally { setBookingId(null); }
        },
      };

      if (!window.Razorpay) {
        Swal.fire({ icon: 'error', title: 'Payment Error', text: 'Razorpay failed to load. Please refresh.', background: '#0f1629', color: '#fff' });
        setBookingId(null);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => {
        Swal.fire({ icon: 'error', title: 'Payment Failed', text: r.error.description, background: '#0f1629', color: '#fff' });
        setBookingId(null);
      });
      rzp.open();
    } catch (err) {
      setBookingId(null);
      Swal.fire({
        icon: 'error', title: 'Booking Failed',
        text: err.response?.data?.message || 'Could not initiate booking. Please try again.',
        background: '#0f1629', color: '#fff', confirmButtonColor: '#cbf905',
      });
    }
  };

  const handleShare = async (match) => {
    const text = `🏏 ${match.match_type?.toUpperCase()} | ${match.title}\n📅 ${new Date(match.date).toLocaleString('en-IN')}\n📍 ${match.venue}\n💰 ₹${match.price_per_slot}/slot\n\nBook on JWS Sports!`;
    if (navigator.share) {
      try { await navigator.share({ title: match.title, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      Swal.fire({ icon: 'success', title: 'Copied!', text: 'Match details copied.', timer: 1500, showConfirmButton: false, background: '#0f1629', color: '#fff' });
    }
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div>
        {!hideHeader && (
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="heading-1">Book a Trial Slot</h1>
            <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Loading available matches…</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 280, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'relative' }}>
      
      {/* Background glow orbs to make glassmorphism pop */}
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        {!hideHeader && (
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="heading-1">Book a Trial Slot</h1>
            <p className="text-secondary" style={{ marginTop: '0.35rem' }}>
              {matches.length > 0 ? `${matches.length} trial slot${matches.length > 1 ? 's' : ''} available — secure your slot now` : 'No trial slots available yet'}
            </p>
          </div>
        )}

        {/* Single booking restriction warning banner */}
        {hasAnyBooking && (
          <div style={{ 
            maxWidth: '800px',
            margin: '0 auto 1.5rem auto', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '0.85rem 1.25rem', 
            borderRadius: 'var(--radius-lg)', 
            display: 'flex', 
            gap: '0.75rem', 
            alignItems: 'center' 
          }}>
            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: '#f87171', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
              You have already booked a selection trial slot. Players are restricted to one active slot booking.
            </p>
          </div>
        )}

      {/* Empty state */}
      {matches.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '5rem 2rem', borderRadius: 20, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <Calendar size={52} color="var(--text-secondary)" style={{ margin: '0 auto 1.25rem', opacity: 0.35 }} />
          <h3 className="heading-3">No Upcoming Matches</h3>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Check back soon — new matches will appear here once scheduled.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
          {matches.map((match, idx) => {
            const isFull    = match.total_slots > 0 && (match.booked_slots || 0) >= match.total_slots;
            const isBooked  = booked.has(match.id);
            const isLoading = bookingId === match.id;
            const slotsLeft = match.total_slots > 0 ? match.total_slots - (match.booked_slots || 0) : null;
            const typeKey   = (match.match_type || '').toLowerCase();
            const typeColor = TYPE_COLORS[typeKey]?.bg || '#94a3b8';
            const typeGlow  = TYPE_COLORS[typeKey]?.glow || 'transparent';
            const fillPct   = match.total_slots > 0
              ? Math.min(100, ((match.booked_slots || 0) / match.total_slots) * 100)
              : 0;
            const ageCategory = match.age_category && match.age_category !== 'Open (All Ages)'
              ? match.age_category
              : null;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  borderRadius: '1.25rem',
                  border: 'none',
                  background: isBooked
                    ? 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: isBooked
                    ? '0 8px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(16,185,129,0.4), inset 0 0 0 1px rgba(16,185,129,0.1)'
                    : `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.05)`,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseOver={e => { 
                  if (!isBooked) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)`;
                  }
                }}
                onMouseOut={e => { 
                  if (!isBooked) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.05)`;
                  }
                }}
              >
                {/* Top colour stripe — turns green when booked */}
                <div style={{ height: 3, background: isBooked ? 'linear-gradient(90deg, #10b981, #059669)' : `linear-gradient(90deg, ${typeColor}, ${typeColor}55)` }} />

                {/* ── Card Body ── */}
                <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>

                  {/* Row 1: Type badge + age category + booked badge | slots status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {/* Match type */}
                      <span style={{
                        padding: '0.22rem 0.75rem',
                        borderRadius: 9999,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        backgroundColor: `${typeColor}20`,
                        color: typeColor,
                        border: `1px solid ${typeColor}50`,
                        textTransform: 'uppercase',
                      }}>
                        {match.match_type}
                      </span>
                      {/* Age category */}
                      {ageCategory && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.22rem 0.65rem',
                          borderRadius: 9999,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(167,139,250,0.12)',
                          color: '#a78bfa',
                          border: '1px solid rgba(167,139,250,0.3)',
                        }}>
                          <Tag size={10} />
                          {ageCategory}
                        </span>
                      )}
                      {/* Booked badge — inline, no overlap */}
                      {isBooked && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.22rem 0.65rem',
                          borderRadius: 9999,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                          backgroundColor: 'rgba(16,185,129,0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.4)',
                        }}>
                          <CheckCircle2 size={11} /> BOOKED
                        </span>
                      )}
                    </div>

                    {/* Slot status pill — always visible, no overlap */}
                    <div style={{ flexShrink: 0 }}>
                      {isFull ? (
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '0.2rem 0.65rem', borderRadius: 9999, border: '1px solid rgba(239,68,68,0.25)' }}>
                          ● FULL
                        </span>
                      ) : slotsLeft !== null && slotsLeft <= 5 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                          <Zap size={11} fill="#f59e0b" /> {slotsLeft} left
                        </span>
                      ) : slotsLeft !== null ? (
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>{slotsLeft} slots left</span>
                      ) : null}
                    </div>
                  </div>


                  {/* Match title */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '1rem' }}>
                    {match.title}
                  </h3>

                  {/* Info rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontSize: '0.84rem', fontWeight: 500 }}>
                      <Calendar size={14} style={{ flexShrink: 0, color: '#10b981' }} />
                      <span>{new Date(match.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontSize: '0.84rem', fontWeight: 500 }}>
                      <MapPin size={14} style={{ flexShrink: 0, color: '#10b981' }} />
                      <span>{match.venue || '—'}</span>
                    </div>
                  </div>

                  {/* Slot progress bar */}
                  {match.total_slots > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={11} /> {match.booked_slots || 0} / {match.total_slots} filled
                        </span>
                        <span>{Math.round(fillPct)}%</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${fillPct}%`,
                          background: isFull
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : fillPct > 70
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : `linear-gradient(90deg, ${typeColor}, ${typeColor}aa)`,
                          borderRadius: 9999,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Description & Rules & FAQs */}
                  <div style={{ marginBottom: '1rem' }}>
                    <CollapsibleSection title="About the Match" content={match.description} />
                    
                    {match.faqs && match.faqs.length > 0 && (
                      <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>FAQs</p>
                        <FaqAccordionList faqs={match.faqs} />
                      </div>
                    )}
                    
                    <CollapsibleSection title="Terms & Conditions" content={match.rules} />
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 -0.25rem 1rem' }} />

                  {/* Footer: Price + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: 700 }}>₹</span>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-primary)', lineHeight: 1 }}>
                        {match.price_per_slot > 0 ? match.price_per_slot : '—'}
                      </span>
                      {match.price_per_slot > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>/slot</span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Share */}
                      <button
                        onClick={() => handleShare(match)}
                        title="Share"
                        style={{
                          width: 38, height: 38, borderRadius: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                      >
                        <Share2 size={15} />
                      </button>

                      {/* Book / Booked button */}
                      {isBooked ? (
                        <button disabled style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.6rem 1.1rem', borderRadius: 10,
                          background: 'rgba(16,185,129,0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                          fontWeight: 700, fontSize: '0.84rem', cursor: 'default',
                        }}>
                          <CheckCircle2 size={15} /> Booked
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBook(match)}
                          disabled={isFull || isLoading || hasAnyBooking}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.6rem 1.1rem', borderRadius: 10,
                            background: (isFull || hasAnyBooking)
                              ? 'rgba(255,255,255,0.06)'
                              : isLoading
                                ? 'rgba(203,249,5,0.7)'
                                : 'var(--brand-primary)',
                            color: (isFull || hasAnyBooking) ? 'rgba(255,255,255,0.3)' : '#121A3F',
                            fontWeight: 700, fontSize: '0.84rem',
                            border: 'none',
                            cursor: (isFull || isLoading || hasAnyBooking) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isLoading ? (
                            'Processing…'
                          ) : isFull ? (
                            'Fully Booked'
                          ) : hasAnyBooking ? (
                            'Limit Exceeded'
                          ) : (
                            <><ShieldCheck size={15} /> Book — ₹{match.price_per_slot}</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </div>
    </motion.div>
  );
};

export default MatchBookings;

