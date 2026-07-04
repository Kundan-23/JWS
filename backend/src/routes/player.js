const express = require('express');
const multer  = require('multer');
const { z }   = require('zod');
const { authenticate, authorize } = require('../middlewares/auth');
const validate       = require('../middlewares/validate');
const playerController = require('../controllers/playerController');
const trainingController = require('../controllers/trainingController');

const router = express.Router();

// All player routes require authentication + player role
router.use(authenticate, authorize('player'));

// ─── Training Routes ───
router.get('/training', trainingController.getTrainingData);
router.post('/training/watch', trainingController.markVideoWatched);
router.post('/training/submit-attempt', trainingController.submitAttempt);

// Multer: memory storage for Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, WebP) and PDFs are allowed.'));
  },
});

const profileUpdateSchema = z.object({
  firstName:        z.string().optional(),
  lastName:         z.string().optional(),
  dob:              z.string().optional(),
  gender:           z.string().optional(),
  whatsapp:         z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup:       z.string().optional(),
  parentName:       z.string().optional(),
  addressLine1:     z.string().optional(),
  addressLine2:     z.string().optional(),
  city:             z.string().optional(),
  country:          z.string().optional(),
  zipCode:          z.string().optional(),
  jerseySize:       z.string().optional(),
  instagramLink:    z.string().optional(),
  middleName:       z.string().optional(),
  height:           z.union([z.number(), z.string()]).optional(),
  weight:           z.union([z.number(), z.string()]).optional(),
  battingStyle:     z.string().optional(),
  bowlingStyle:     z.string().optional(),
  fieldPositions:   z.array(z.string()).optional(),
  ballsSelected:    z.array(z.string()).optional(),
  cricketHistory:   z.array(z.object({
    level:   z.string(),
    matches: z.coerce.number().int().min(0).default(0),
  })).optional(),
  clubAssociated:   z.string().optional(),
  clubsDetails:     z.array(z.object({ name: z.string(), allowedOutside: z.string() })).optional(),
  gameplayLinks:    z.object({
    batting:  z.array(z.string()).optional(),
    bowling:  z.array(z.string()).optional(),
    fielding: z.array(z.string()).optional(),
    wk:       z.array(z.string()).optional(),
  }).optional(),
  galleryUrls:      z.array(z.string()).optional(),
}); // No .strict() — allow any extra fields gracefully


router.get('/profile',                          playerController.getProfile);
router.put('/profile',    validate(profileUpdateSchema), playerController.updateProfile);
router.post('/upload/photo',         upload.single('file'), playerController.uploadPhoto);
router.post('/upload/address-proof', upload.single('file'), playerController.uploadAddressProof);
router.post('/upload/aadhar',        upload.single('file'), playerController.uploadAadhar);
router.get('/matches',                          playerController.getMatches);
router.get('/id-card',                          playerController.downloadIdCard);
router.post('/unlock-dashboard',                playerController.unlockDashboard);
// Match Bookings
const matchBookingController = require('../controllers/matchBookingController');
router.get('/available-matches',              matchBookingController.getAvailableMatches);
router.get('/my-bookings',                    matchBookingController.getMyBookings);
router.post('/book-match/order',              matchBookingController.createBookingOrder);
router.post('/book-match/verify',             matchBookingController.verifyBookingPayment);

module.exports = router;
