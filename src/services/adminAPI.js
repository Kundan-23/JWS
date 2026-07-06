import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('jws_token');
  if (token) cfg.headers.set('Authorization', `Bearer ${token}`);
  return cfg;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jws_token');
      localStorage.removeItem('jws_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Dashboard
  getStats:             ()            => API.get('/admin/stats'),

  // Players
  getPlayers:           (params)      => API.get('/admin/players', { params }),
  exportPlayers:        (params)      => API.get('/admin/players/export', { params, responseType: 'blob' }),
  getPlayerDetail:      (id)          => API.get(`/admin/players/${id}`),
  updatePlayer:         (id, data)    => API.put(`/admin/players/${id}`, data),
  updatePlayerStatus:   (id, status, reason) => API.put(`/admin/players/${id}/status`, { status, reason }),
  approveDocs:          (id)          => API.put(`/admin/players/${id}/approve-docs`),
  assignCoach:          (id, coachId) => API.put(`/admin/players/${id}/assign-coach`, { coachId }),
  deletePlayer:         (id)          => API.delete(`/admin/players/${id}`),
  uploadPlayerIdCard:   (id, file)    => { const f = new FormData(); f.append('file', file); return API.post(`/admin/players/${id}/id-card`, f); },
  uploadCoachDocument:  (id, type, file) => { const f = new FormData(); f.append('file', file); return API.post(`/admin/coaches/${id}/upload/${type}`, f); },

  // Payments
  getPayments:          ()            => API.get('/admin/payments'),

  // Referrals
  getReferrals:         ()            => API.get('/admin/referrals'),

  // Cashouts
  getCashouts:          (status)      => API.get('/admin/cashouts', { params: { status } }),
  approveCashout:       (id, note)    => API.put(`/admin/cashouts/${id}/approve`, { adminNote: note }),
  rejectCashout:        (id, note)    => API.put(`/admin/cashouts/${id}/reject`, { adminNote: note }),

  // Coaches
  getCoaches:           ()            => API.get('/admin/coaches'),
  createCoach:          (data)        => API.post('/admin/coaches', data),
  updateCoach:          (id, data)    => API.put(`/admin/coaches/${id}`, data),
  deleteCoach:          (id)          => API.delete(`/admin/coaches/${id}`),

  // Matches
  getMatches:           ()            => API.get('/admin/matches'),
  createMatch:          (data)        => API.post('/admin/matches', data),
  updateMatch:          (id, data)    => API.put(`/admin/matches/${id}`, data),
  deleteMatch:          (id)          => API.delete(`/admin/matches/${id}`),
  getMatchSquads:       (matchId)     => API.get(`/admin/matches/${matchId}/squads`),
  approveSquad:         (squadId)     => API.put(`/admin/squads/${squadId}/approve`),
  rejectSquad:          (squadId)     => API.put(`/admin/squads/${squadId}/reject`),
  getMatchBookings:     (matchId)     => API.get(`/admin/matches/${matchId}/bookings`),

  // Training Slots
  getTrainingSlots:     ()            => API.get('/admin/training-slots'),
  approveTrainingSlot:  (id)          => API.put(`/admin/training-slots/${id}/approve`),
  rejectTrainingSlot:   (id)          => API.put(`/admin/training-slots/${id}/reject`),

  // Config
  getConfig:            ()            => API.get('/admin/config'),
  updateConfig:         (data)        => API.put('/admin/config', data),
  uploadBanner:         (file)        => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/banner/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadAdBanner:       (file)        => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/ad-banner/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadSponsorLogo:    (file, slot)  => { const f = new FormData(); f.append('file', file); return API.post(`/admin/config/sponsor-logo/upload/${slot}`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadAppLogo:        (file)        => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/app-logo/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadJerseyMeasure:  (file)        => { const f = new FormData(); f.append('file', file); return API.post('/admin/config/jersey-measure/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }); },

  // Coach Video Uploads
  getCoachUploads:      (status)      => API.get('/admin/coach-uploads', { params: { status } }),
  approveCoachUpload:   (id)          => API.put(`/admin/coach-uploads/${id}/approve`),
  rejectCoachUpload:    (id, note)    => API.put(`/admin/coach-uploads/${id}/reject`, { adminNote: note }),
};

export default API;
