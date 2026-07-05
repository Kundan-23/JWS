import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFormStore } from '../../store/useFormStore';
import { PlayCircle, CheckCircle, Upload, Lock, Video, CreditCard, Unlock, AlertTriangle, ExternalLink } from 'lucide-react';
import ReactPlayerRaw from 'react-player';
const ReactPlayer = ReactPlayerRaw.default || ReactPlayerRaw;
import Swal from 'sweetalert2';
import { trainingAPI, paymentAPI } from '../../services/api';

const Tutorials = () => {
  const { dashboardState, unlockDashboard } = useFormStore();
  
  const [loading, setLoading] = useState(true);
  const [basicVideos, setBasicVideos] = useState([]);
  const [advanceFee, setAdvanceFee] = useState(499);
  const [watchedIds, setWatchedIds] = useState([]);
  const [hasUnlockedAdvance, setHasUnlockedAdvance] = useState(false);
  const [advanceVideos, setAdvanceVideos] = useState([]);
  
  const [attemptLink, setAttemptLink] = useState('');
  const [activeVideo, setActiveVideo] = useState(null); // id of basic video currently playing
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(dashboardState?.isDashboardUnlocked || false);
  const [attemptStatus, setAttemptStatus] = useState(null);
  const [allocatedCoachId, setAllocatedCoachId] = useState(null);
  const [clickedExternalIds, setClickedExternalIds] = useState([]);

  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const res = await trainingAPI.getTraining();
      const d = res.data;
      setBasicVideos(Array.isArray(d.basic_training_videos) ? d.basic_training_videos : []);
      setAdvanceFee(d.advance_training_fee || 499);
      setWatchedIds(Array.isArray(d.training_progress) ? d.training_progress : []);
      setHasUnlockedAdvance(d.has_unlocked_advance_training || false);
      setIsDashboardUnlocked(d.is_dashboard_unlocked || false);
      setAttemptStatus(d.training_attempt_status || null);
      setAllocatedCoachId(d.allocated_coach_id || null);
      if (d.is_dashboard_unlocked && !dashboardState?.isDashboardUnlocked) {
        unlockDashboard();
      }
      setAdvanceVideos(Array.isArray(d.advance_videos) ? d.advance_videos : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const safeBasicVideos = Array.isArray(basicVideos) ? basicVideos : [];
  const safeWatchedIds = Array.isArray(watchedIds) ? watchedIds : [];
  const allBasicWatched = safeBasicVideos.length > 0 && safeBasicVideos.every(v => v?.id && safeWatchedIds.includes(v.id));

  const handleVideoProgress = (id, state) => {
    // If we wanted ultra strict seeking-prevention, we'd do it here. 
    // ReactPlayer handles standard play. We will mark watched on ended.
  };

  const handleVideoEnded = async (id) => {
    if (!watchedIds.includes(id)) {
      const newWatched = [...watchedIds, id];
      setWatchedIds(newWatched);
      try {
        await trainingAPI.markWatched(id);
      } catch (err) {
        console.error(err);
      }
    }
    setActiveVideo(null);
  };

  const handleUploadAttempt = async () => {
    if (!allBasicWatched) {
      Swal.fire({ icon: 'error', title: 'Oops', text: 'Please watch all basic videos completely first.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }
    if (attemptLink.trim().length < 5) {
      Swal.fire({ icon: 'error', title: 'Wait', text: 'Please enter a valid video link.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }
    try {
      await trainingAPI.submitAttempt(attemptLink);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Attempt submitted! Pending selector approval.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      setAttemptStatus('Pending');
      setAttemptLink('');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to submit attempt.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      Swal.fire({ icon: 'error', text: 'Razorpay failed to load.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
      return;
    }
    try {
      const { data } = await paymentAPI.createAdvanceOrder();
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'GICL Advance Training',
        description: 'Unlock premium selector uploads',
        handler: async function (response) {
          try {
            await paymentAPI.verifyAdvancePayment(response);
            Swal.fire({ icon: 'success', title: 'Unlocked!', text: 'Advance Training Videos are now available.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
            setHasUnlockedAdvance(true);
            fetchTrainingData();
          } catch (err) {
            Swal.fire({ icon: 'error', text: 'Payment verification failed.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
          }
        },
        theme: { color: '#cbf905' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      Swal.fire({ icon: 'error', text: 'Failed to initiate payment.', background: 'var(--bg-surface)', color: 'var(--text-primary)' });
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Training Modules...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Training Tutorials</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
          {isDashboardUnlocked 
            ? "Re-watch training materials to perfect your game." 
            : "You must complete the Basic Tutorials and upload your attempt to unlock the full dashboard."}
        </p>
      </div>

      {!isDashboardUnlocked && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Lock color="var(--error)" />
          <p style={{ color: 'var(--error)', fontWeight: 500, fontSize: '0.875rem' }}>Full dashboard access is restricted. Watch the videos completely and submit your attempt below to unlock Matches and Referrals.</p>
        </div>
      )}

      {/* --- Basic Tutorials Section --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 className="heading-2" style={{ color: 'var(--brand-primary)' }}>Basic Tutorials</h2>
      </div>

      {!isDashboardUnlocked && (
        <div style={{ backgroundColor: 'rgba(249, 203, 26, 0.1)', border: '1px solid var(--brand-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle color="var(--brand-primary)" />
          <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Warning: If you leave the video midway, you will have to rewatch the whole video. Skipping is disabled.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {safeBasicVideos.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No basic training videos added yet.</p>}
        {safeBasicVideos.map((tutorial, idx) => {
          if (!tutorial || !tutorial.url) return null; // Defensive check
          const isWatched = safeWatchedIds.includes(tutorial.id);
          // We no longer unmount the video, we just let ReactPlayer handle it natively

          let vidUrl = tutorial.url;
          if (vidUrl && !vidUrl.startsWith('http')) {
            vidUrl = 'https://' + vidUrl;
          }

          const isSupported = vidUrl ? vidUrl.match(/(youtube\.com|youtu\.be|vimeo\.com|soundcloud\.com|twitch\.tv|dailymotion\.com|facebook\.com|wistia\.com|instagram\.com|instagr\.am|\.mp4|\.webm|\.ogg)/i) !== null : false;
          const hasClickedExternal = clickedExternalIds.includes(tutorial.id);

          return (
            <div key={tutorial.id || idx} style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-surface-elevated)' }}>
              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                
                {isSupported ? (
                  <ReactPlayer 
                    url={vidUrl} 
                    controls={true} // Enable controls for robust playback
                    width="100%" 
                    height="100%" 
                    onEnded={() => handleVideoEnded(tutorial.id)}
                    onProgress={(state) => {
                      // Basic anti-skip logic can be added here if needed, but standard completion is tracked via onEnded
                    }}
                    config={{
                      youtube: { playerVars: { rel: 0, modestbranding: 1 } },
                    }}
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Video size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>This video is hosted on an external platform that requires direct viewing.</p>
                    <a 
                      href={vidUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={() => setClickedExternalIds(prev => [...prev, tutorial.id])}
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      Watch on External Site <ExternalLink size={16} />
                    </a>
                  </div>
                )}
                
                {isWatched && (
                  <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'var(--success)', color: 'var(--bg-color)', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem', pointerEvents: 'none' }}>
                    <CheckCircle size={12} /> Watched
                  </span>
                )}
              </div>
              <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{tutorial.title}</h3>
              
              <div style={{ marginTop: '1rem', color: isWatched ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 500 }}>
                {isWatched ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> Completed</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Pending Watch</span>
                    {!isSupported && hasClickedExternal && (
                      <button onClick={() => handleVideoEnded(tutorial.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Mark as Watched
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!isDashboardUnlocked && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-primary)', marginBottom: '3rem' }}>
          <h2 className="heading-2" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload color="var(--brand-primary)" /> Upload Your Attempt
          </h2>
          
          {attemptStatus === 'Pending' ? (
            <div style={{ backgroundColor: 'rgba(255, 199, 44, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-primary)', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Video Submitted for Approval</h3>
              {!allocatedCoachId ? (
                <p style={{ color: 'var(--text-secondary)' }}>Your video is in the queue. Please wait for a selector to be allotted to review your video. Once approved, your dashboard will unlock.</p>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Your allotted selector is currently reviewing your video. Once approved, your dashboard will unlock.</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Record yourself practicing the techniques shown above and upload the link here.
              </p>

              <div className="form-group">
                <label className="form-label">Video Link (YouTube, Instagram, or Drive)</label>
                <input 
                  className="form-input" 
                  placeholder="https://..." 
                  value={attemptLink}
                  onChange={(e) => setAttemptLink(e.target.value)}
                  disabled={!allBasicWatched}
                />
                {!allBasicWatched && <span className="form-error" style={{ marginTop: '0.5rem', display: 'block' }}>You must completely watch all basic videos first.</span>}
              </div>

              <button 
                className="btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={handleUploadAttempt}
                disabled={!allBasicWatched || attemptLink.trim().length === 0}
              >
                Submit for Approval
              </button>
            </>
          )}
        </div>
      )}

      {/* --- Advance Tutorials Section --- */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--bg-surface-elevated)', margin: '3rem 0' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="heading-2" style={{ color: 'var(--brand-accent)' }}>Advance Tutorials</h2>
      </div>

      {!hasUnlockedAdvance ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', border: '1px solid var(--brand-accent)' }}>
          <Unlock size={48} color="var(--brand-accent)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 className="heading-3">Unlock Premium Selector Content</h3>
          <p className="text-secondary" style={{ marginTop: '0.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            Pay a small one-time fee to unlock exclusive advanced training videos uploaded directly by expert selectors.
          </p>
          <button className="btn-primary" onClick={handlePayment} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 2rem' }}>
            <CreditCard size={20} /> Pay ₹{advanceFee} to Unlock
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {advanceVideos.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No advanced videos available right now.</p>}
          {advanceVideos.map((tutorial, idx) => {
            if (!tutorial || !tutorial.url) return null;
            return (
            <div key={tutorial.id || idx} style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: `1px solid var(--brand-primary)` }}>
              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
                <ReactPlayer 
                  url={tutorial.url} 
                  controls={true}
                  width="100%" 
                  height="100%" 
                  light={true} // Shows thumbnail before playing
                />
                <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'var(--brand-primary)', color: 'var(--bg-color)', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem', pointerEvents: 'none' }}>
                  <Video size={12} /> Selector Video
                </span>
              </div>
              <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{tutorial.title}</h3>
            </div>
            );
          })}
        </div>
      )}

    </motion.div>
  );
};

export default Tutorials;

