const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const coachController = require('../controllers/coachController');

const router = express.Router();
router.use(authenticate, authorize('coach'));

router.get('/profile',           coachController.getProfile);
router.get('/players',           coachController.getPlayers);
router.get('/videos',            coachController.getVideos);
router.post('/videos/:id/review', coachController.reviewVideo);
router.post('/uploads',          coachController.addUpload);
router.get('/uploads',           coachController.getMyUploads);
router.get('/matches',           coachController.getMatches);
router.get('/referrals',         coachController.getReferrals);
router.post('/referrals/cashout', coachController.requestCashout);

// Coach Slots
const coachSlotController = require('../controllers/coachSlotController');
const matchBookingController = require('../controllers/matchBookingController');
router.get('/practice-matches',  coachSlotController.getPracticeMatches);
router.get('/available-matches', matchBookingController.getAvailableMatches);
router.post('/squad-matches',    coachSlotController.submitMatchSquad);
router.post('/training-slots',   coachSlotController.submitTrainingSlot);
router.get('/training-slots',    coachSlotController.getTrainingSlots);
module.exports = router;
