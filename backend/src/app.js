const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes     = require('./routes/auth');
const playerRoutes   = require('./routes/player');
const adminRoutes    = require('./routes/admin');
const coachRoutes    = require('./routes/coach');
const paymentRoutes  = require('./routes/payment');

const configRoutes   = require('./routes/config');
const notificationRoutes = require('./routes/notification');
const errorHandler   = require('./middlewares/errorHandler');

const app = express();

// ─── Security Middleware ───────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'JWS Sports Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health:   'GET  /health',
      auth:     'POST /api/auth/send-otp | /api/auth/verify-otp | /api/auth/set-password | /api/auth/login | /api/auth/reset-password | /api/auth/refresh | /api/auth/logout | GET /api/auth/me',
      player:   'GET|PUT /api/player/profile | POST /api/player/upload/* | GET /api/player/trials | GET /api/player/id-card',
      admin:    '/api/admin/stats | /api/admin/players | /api/admin/selectors | /api/admin/trials | /api/admin/config',
      selector: '/api/coach/profile | /api/coach/players | /api/coach/videos | /api/coach/trials',
      payment:  'POST /api/payment/create-order | POST /api/payment/verify',
      config:   'GET  /api/config',
    },
  });
});

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'JWS Backend API', timestamp: new Date().toISOString() });
});

// ─── Debug: Practice Matches (temporary, no auth) ─────────
app.get('/debug/practice-matches', async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    const { data, error } = await supabase.from('matches').select('id, title, type, match_type').order('date', { ascending: true });
    if (error) return res.json({ error: error.message, data: null });
    const practice = (data || []).filter(m =>
      (m.match_type || '').toLowerCase() === 'practice' ||
      (m.type || '').toLowerCase() === 'practice'
    );
    res.json({ total: data.length, practice_count: practice.length, practice, all: data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/player',   playerRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/coach',    coachRoutes);
app.use('/api/payment',  paymentRoutes);

app.use('/api/config',   configRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
