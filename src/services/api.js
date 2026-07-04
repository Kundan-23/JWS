import axios from 'axios';

// Determine the correct API base URL:
// 1. Use the VITE_API_URL environment variable if explicitly set
// 2. If running on localhost, use local backend
// 3. Otherwise (production Vercel deploy), never fall back to localhost
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  // Fallback for production if env var was not set — warn developer
  console.error('[api.js] VITE_API_URL is not set! Please configure it in Vercel environment variables.');
  return '/api'; // relative path as last resort
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jws_token');
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// Response interceptor — handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — force logout
      localStorage.removeItem('jws_token');
      localStorage.removeItem('jws_refresh_token');
      localStorage.removeItem('jws_user');
      // Only redirect if not already on a login/landing page
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/admin-login') && path !== '/') {
        window.location.href = '/login';
      }
    }
    // 403 = wrong role — do NOT logout, just reject so the caller can show an error
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────
export const authAPI = {
  sendOTP:       (email, purpose)                          => API.post('/auth/send-otp',       { email, purpose }),
  verifyOTP:     (email, code, purpose)                    => API.post('/auth/verify-otp',     { email, code, purpose }),
  setPassword:   (sessionToken, password, confirmPassword) => API.post('/auth/set-password',   { sessionToken, password, confirmPassword }),
  login:         (email, password)                         => API.post('/auth/login',           { email, password }),
  resetPassword: (resetToken, newPassword, confirmPassword)=> API.post('/auth/reset-password', { resetToken, newPassword, confirmPassword }),
  refresh:       (refreshToken)                            => API.post('/auth/refresh',         { refreshToken }),
  logout:        ()                                        => API.post('/auth/logout'),
  me:            ()                                        => API.get('/auth/me'),
};

// ─── Player ────────────────────────────────────────────────
export const playerAPI = {
  getProfile:         ()       => API.get('/player/profile'),
  updateProfile:      (data)   => API.put('/player/profile', data),
  uploadPhoto:        (file)   => { const f = new FormData(); f.append('file', file); return API.post('/player/upload/photo',    f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadAadhar:       (file)   => { const f = new FormData(); f.append('file', file); return API.post('/player/upload/aadhar',   f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  unlockDashboard:    ()       => API.post('/player/unlock-dashboard'),
  getMatches:         ()       => API.get('/player/matches'),
  getReferrals:       ()       => API.get('/player/referrals'),
  downloadIdCard:     ()       => API.get('/player/id-card'),
  
  // Match Bookings
  getAvailableMatches:  ()     => API.get('/player/available-matches'),
  getMyBookings:        ()     => API.get('/player/my-bookings'),
  createBookingOrder:   (data) => API.post('/player/book-match/order', data),
  verifyBookingPayment: (data) => API.post('/player/book-match/verify', data),
};

// ─── Coach ─────────────────────────────────────────────────
export const coachAPI = {
  getProfile:   ()           => API.get('/coach/profile'),
  getPlayers:   ()           => API.get('/coach/players'),
  getVideos:    ()           => API.get('/coach/videos'),
  reviewVideo:  (id, data)   => API.post(`/coach/videos/${id}/review`, data),
  addUpload:    (data)       => API.post('/coach/uploads', data),
  getMyUploads: ()           => API.get('/coach/uploads'),
  getMatches:   ()           => API.get('/coach/matches'),
  getAvailableMatches: ()      => API.get('/coach/available-matches'),
  getReferrals: ()           => API.get('/coach/referrals'),
  requestCashout: (data)     => API.post('/coach/referrals/cashout', data),
  // Slots & Scheduling
  getPracticeMatches: ()         => API.get('/coach/practice-matches'),
  submitMatchSquad:   (data)     => API.post('/coach/squad-matches', data),
  submitTrainingSlot: (data)     => API.post('/coach/training-slots', data),
  getTrainingSlots:   ()         => API.get('/coach/training-slots'),
};

// ─── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getStats:           ()           => API.get('/admin/stats'),
  // Players
  listPlayers:        (params)     => API.get('/admin/players', { params }),
  getPlayer:          (id)         => API.get(`/admin/players/${id}`),
  updatePlayer:       (id, data)   => API.put(`/admin/players/${id}`, data),
  approveDocs:        (id)         => API.put(`/admin/players/${id}/approve-docs`),
  togglePlayerStatus: (id, data)   => API.put(`/admin/players/${id}/toggle-status`, data),
  deletePlayer:       (id)         => API.delete(`/admin/players/${id}`),
  assignCoach:        (id, coachId)=> API.put(`/admin/players/${id}/assign-coach`, { coachId }),
  exportPlayers:      ()           => API.get('/admin/players/export', { responseType: 'blob' }),
  importPlayers:      (file)       => { const f = new FormData(); f.append('file', file); return API.post('/admin/players/import', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  // Coaches
  listCoaches:        ()           => API.get('/admin/coaches'),
  getCoach:           (id)         => API.get(`/admin/coaches/${id}`),
  updateCoach:        (id, data)   => API.put(`/admin/coaches/${id}`, data),
  toggleCoachStatus:  (id)         => API.put(`/admin/coaches/${id}/toggle-status`),
  exportCoaches:      ()           => API.get('/admin/coaches/export', { responseType: 'blob' }),
  importCoaches:      (file)       => { const f = new FormData(); f.append('file', file); return API.post('/admin/coaches/import', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  // Matches
  createMatch:        (data)       => API.post('/admin/matches', data),
  updateMatch:        (id, data)   => API.put(`/admin/matches/${id}`, data),
  deleteMatch:        (id)         => API.delete(`/admin/matches/${id}`),
  assignMatch:        (id, data)   => API.put(`/admin/matches/${id}/assign`, data),
  // Config
  getConfig:          ()           => API.get('/admin/config'),
  updateConfig:       (data)       => API.put('/admin/config', data),
  uploadBanner:       (file)       => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/banner/upload',    f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadAdBanner:     (file)       => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/ad-banner/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  // Coach uploads moderation
  listCoachUploads:   ()               => API.get('/admin/coach-uploads'),
  approveCoachUpload: (id, coachId)    => API.put(`/admin/coach-uploads/${id}/approve`, { coachId }),
  rejectCoachUpload:  (id, coachId, reason) => API.put(`/admin/coach-uploads/${id}/reject`, { coachId, reason }),
};

// ─── Payment ───────────────────────────────────────────────
export const paymentAPI = {
  createOrder:   (planId) => API.post('/payment/create-order', { planId }),
  verifyPayment: (data)   => API.post('/payment/verify', data),
  createAdvanceOrder: () => API.post('/payment/create-advance-order'),
  verifyAdvancePayment: (data) => API.post('/payment/verify-advance', data)
};

export const trainingAPI = {
  getTraining: () => API.get('/player/training'),
  markWatched: (videoId) => API.post('/player/training/watch', { videoId }),
  submitAttempt: (url) => API.post('/player/training/submit-attempt', { url })
};

// ─── Public ────────────────────────────────────────────────
export const publicAPI = {
  getConfig:       ()     => API.get('/config'),
  validateReferral:(code) => API.post('/referral/validate-code', { code }),
};

// ─── Referral ──────────────────────────────────────────────
export const referralAPI = {
  getStats:       ()     => API.get('/referral/stats'),
  getCashouts:    ()     => API.get('/referral/cashouts'),
  requestCashout: (data) => API.post('/referral/cashout', data),
  validateCode:   (code) => API.post('/referral/validate-code', { code }),
};

// ─── Notifications ─────────────────────────────────────────
export const notificationAPI = {
  getAll:        ()  => API.get('/notifications'),
  markAsRead:    (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: ()  => API.put('/notifications/read-all'),
  delete:        (id) => API.delete(`/notifications/${id}`),
};

export default API;
