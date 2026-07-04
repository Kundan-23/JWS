const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Rate limit OTP sends: max 5 per IP per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit login: max 10 per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod schemas
const sendOtpSchema = z.object({
  email:   z.string().email('Invalid email address'),
  purpose: z.enum(['register', 'reset_password']),
});

const verifyOtpSchema = z.object({
  email:   z.string().email(),
  code:    z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  purpose: z.enum(['register', 'reset_password']),
});

const setPasswordSchema = z.object({
  sessionToken:    z.string().min(1, 'Session token is required'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  resetToken:      z.string().min(1, 'Reset token is required'),
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// Routes
router.post('/send-otp',       otpLimiter,   validate(sendOtpSchema),       authController.sendOTP);
router.post('/verify-otp',     otpLimiter,   validate(verifyOtpSchema),     authController.verifyOTP);
router.post('/set-password',                 validate(setPasswordSchema),   authController.setPassword);
router.post('/login',          loginLimiter, validate(loginSchema),         authController.login);
router.post('/reset-password',               validate(resetPasswordSchema), authController.resetPassword);
router.post('/refresh',                      validate(refreshSchema),       authController.refresh);
router.post('/logout',         authenticate,                                authController.logout);
router.get ('/me',             authenticate,                                authController.me);

module.exports = router;
