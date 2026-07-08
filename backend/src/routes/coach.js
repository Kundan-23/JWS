const express = require('express');
const multer  = require('multer');
const { authenticate, authorize } = require('../middlewares/auth');
const coachController = require('../controllers/coachController');

const router = express.Router();
router.use(authenticate, authorize('coach'));

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

router.get('/profile',           coachController.getProfile);
router.get('/players',           coachController.getPlayers);
router.get('/videos',            coachController.getVideos);
router.post('/videos/:id/review', coachController.reviewVideo);
router.post('/uploads',          coachController.addUpload);
router.get('/uploads',           coachController.getMyUploads);
router.get('/matches',           coachController.getMatches);
router.get('/referrals',         coachController.getReferrals);
router.post('/referrals/cashout', coachController.requestCashout);

// ── Document Upload ──
router.post('/upload/aadhar', upload.single('file'), coachController.uploadAadhar);

// Coach Slots
const coachSlotController = require('../controllers/coachSlotController');
const matchBookingController = require('../controllers/matchBookingController');
router.get('/practice-matches',  coachSlotController.getPracticeMatches);
router.get('/available-matches', matchBookingController.getAvailableMatches);
router.post('/squad-matches',    coachSlotController.submitMatchSquad);
router.post('/training-slots',   coachSlotController.submitTrainingSlot);
router.get('/training-slots',    coachSlotController.getTrainingSlots);
module.exports = router;
