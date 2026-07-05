import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoachStore } from '../../store/useCoachStore';
import { Video, CheckCircle, MessageSquare, ExternalLink } from 'lucide-react';
import ReactPlayerRaw from 'react-player';
const ReactPlayer = ReactPlayerRaw.default || ReactPlayerRaw;

const VideoScrutiny = () => {
  const { videos = [], submitVideoReview } = useCoachStore();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewFlag, setReviewFlag] = useState(''); // 'red', 'yellow', 'green'

  const pendingVideos = videos.filter(v => v.status === 'Pending');
  const reviewedVideos = videos.filter(v => v.status === 'Reviewed');

  const isInstagram = selectedVideo?.url && (selectedVideo.url.includes('instagram.com') || selectedVideo.url.includes('instagr.am'));

  const getInstagramEmbedUrl = (url) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    cleanUrl = cleanUrl.split('?')[0];
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/';
    }
    if (!cleanUrl.endsWith('/embed/')) {
      cleanUrl += 'embed/';
    }
    return cleanUrl;
  };

  const handleReviewSubmit = () => {
    if (!reviewText.trim() || !reviewFlag) {
      alert("Please enter feedback and select a tag.");
      return;
    }
    submitVideoReview(selectedVideo.id, reviewFlag, reviewText);
    setSelectedVideo(null);
    setReviewText('');
    setReviewFlag('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Video Scrutiny</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Review batting & bowling videos uploaded by your allocated players.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Pending Reviews */}
        <div>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video size={20} color="var(--brand-accent)" /> Pending ({pendingVideos.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingVideos.map(video => (
              <div key={video.id} onClick={() => setSelectedVideo(video)} style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--brand-accent)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <img src={video.thumbnail} alt="thumbnail" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{video.playerName}</p>
                    <p className="text-small" style={{ opacity: 0.8 }}>{video.title}</p>
                    <p className="text-small" style={{ color: 'var(--brand-accent)', marginTop: '0.25rem' }}>Needs Review</p>
                  </div>
                </div>
              </div>
            ))}
            {pendingVideos.length === 0 && <p className="text-secondary text-small">No pending videos.</p>}
          </div>
        </div>

        {/* Reviewed */}
        <div>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" /> Reviewed ({reviewedVideos.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviewedVideos.map(video => (
              <div key={video.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <img src={video.thumbnail} alt="thumbnail" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{video.playerName}</p>
                      {video.review_flag && (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: video.review_flag === 'poor' ? '#ef4444' : video.review_flag === 'good' ? '#eab308' : '#10b981' }} />
                      )}
                    </div>
                    <p className="text-small" style={{ opacity: 0.8 }}>{video.title}</p>
                    <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontStyle: 'italic', borderLeft: `3px solid ${video.review_flag === 'poor' ? '#ef4444' : video.review_flag === 'good' ? '#eab308' : '#10b981'}` }}>
                      "{video.review_comment}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ maxWidth: '600px', width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="heading-2">Reviewing: {selectedVideo.playerName}</h3>
                <button onClick={() => setSelectedVideo(null)} style={{ background: 'none', color: 'var(--text-secondary)' }}>Close</button>
              </div>

              {/* Actual Video Player */}
              <div style={{ 
                width: '100%', 
                aspectRatio: isInstagram ? '4/5' : '16/9', 
                maxHeight: isInstagram ? '450px' : 'none', 
                backgroundColor: '#000', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem', 
                overflow: 'hidden', 
                position: 'relative' 
              }}>
                {isInstagram ? (
                  <iframe 
                    src={getInstagramEmbedUrl(selectedVideo.url)} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowTransparency="true"
                    allow="encrypted-media"
                    style={{ position: 'absolute', top: 0, left: 0, border: 0 }}
                  />
                ) : selectedVideo.url && selectedVideo.url.match(/(youtube\.com|youtu\.be|vimeo\.com|soundcloud\.com|twitch\.tv|dailymotion\.com|facebook\.com|wistia\.com|\.mp4|\.webm|\.ogg)/i) ? (
                  <ReactPlayer 
                    url={selectedVideo.url.startsWith('http') ? selectedVideo.url : `https://${selectedVideo.url}`} 
                    controls 
                    width="100%" 
                    height="100%" 
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Video size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>This video is hosted externally (e.g. Google Drive) and cannot be embedded.</p>
                    <a 
                      href={selectedVideo.url?.startsWith('http') ? selectedVideo.url : `https://${selectedVideo.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      Watch on External Site <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} /> Selector Feedback
                </label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  placeholder="Leave detailed text feedback regarding footwork, bat speed, or general technique..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Video Tag</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setReviewFlag('poor')} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${reviewFlag === 'poor' ? '#ef4444' : 'transparent'}`, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600, transition: 'all 0.2s' }}>Poor</button>
                  <button onClick={() => setReviewFlag('good')} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${reviewFlag === 'good' ? '#eab308' : 'transparent'}`, backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontWeight: 600, transition: 'all 0.2s' }}>Good</button>
                  <button onClick={() => setReviewFlag('best')} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${reviewFlag === 'best' ? '#10b981' : 'transparent'}`, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600, transition: 'all 0.2s' }}>Best</button>
                </div>
              </div>

              <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleReviewSubmit} disabled={!reviewText.trim() || !reviewFlag}>
                {reviewFlag === 'poor' ? 'Reject & Submit Scrutiny' : 'Approve & Submit Scrutiny'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoScrutiny;
