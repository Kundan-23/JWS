const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const ctrl       = require('../controllers/adminController');
const { protect, restrictTo, checkReadOnlyAdmin } = require('../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All admin routes require auth + admin role
// checkReadOnlyAdmin enforces read-only restrictions for the viewer account
router.use(protect);
router.use(restrictTo('admin'));
router.use(checkReadOnlyAdmin);

// Stats
router.get('/stats',                                    ctrl.getStats);

// Players
router.get('/players',                                  ctrl.getPlayers);
router.get('/players/export',                           ctrl.exportPlayers);
router.get('/players/:id',                              ctrl.getPlayerDetail);
router.put('/players/:id',                              ctrl.updatePlayer);
router.put('/players/:id/status',                       ctrl.updatePlayerStatus);
router.put('/players/:id/approve-docs',                 ctrl.approveDocs);
router.put('/players/:id/assign-coach',                 ctrl.assignCoach);

// Payments
router.get('/payments',                                 ctrl.getPayments);

// Referrals
router.get('/referrals',                                ctrl.getReferrals);

// Cashouts
router.get('/cashouts',                                 ctrl.getCashouts);
router.put('/cashouts/:id/approve',                     ctrl.approveCashout);
router.put('/cashouts/:id/reject',                      ctrl.rejectCashout);

// Coaches
router.get('/coaches',                                  ctrl.getCoaches);
router.post('/coaches',                                 ctrl.createCoach);
router.put('/coaches/:id',                              ctrl.updateCoach);
router.delete('/coaches/:id',                           ctrl.deleteCoach);
router.post('/coaches/:id/upload/:type', upload.single('file'), ctrl.uploadCoachDocument);

// Matches
router.get('/matches',                                  ctrl.getMatches);
router.post('/matches',                                 ctrl.createMatch);
router.put('/matches/:id',                              ctrl.updateMatch);
router.delete('/matches/:id',                           ctrl.deleteMatch);

// Match Squad Submissions (coach → admin approval)
router.get('/matches/:id/squads',                       ctrl.getMatchSquads);
router.put('/squads/:squadId/approve',                  ctrl.approveSquad);
router.put('/squads/:squadId/reject',                   ctrl.rejectSquad);

// Match Player Bookings (League / Friendly / Tournament)
const { getMatchBookings } = require('../controllers/matchBookingController');
router.get('/matches/:id/bookings',                     getMatchBookings);


// Config
router.get('/config',                                   ctrl.getConfig);
router.put('/config',                                   ctrl.updateConfig);
router.post('/config/banner/upload',    upload.single('file'), ctrl.uploadBanner);
router.post('/config/ad-banner/upload', upload.single('file'), ctrl.uploadAdBanner);
router.post('/config/app-logo/upload', upload.single('file'), ctrl.uploadAppLogo);
router.post('/config/jersey-measure/upload', upload.single('file'), ctrl.uploadJerseyMeasure);
router.post('/config/sponsor-logo/upload/:slot', upload.single('file'), ctrl.uploadSponsorLogo);

// Manual ID Card Upload
router.post('/players/:id/id-card', upload.single('file'), ctrl.uploadPlayerIdCard);

// Coach Video Uploads
router.get('/coach-uploads',                            ctrl.listCoachUploads);
router.put('/coach-uploads/:id/approve',                ctrl.approveCoachUpload);
router.put('/coach-uploads/:id/reject',                 ctrl.rejectCoachUpload);

// Training Slots Approvals
router.get('/training-slots',                           ctrl.getTrainingSlots);
router.put('/training-slots/:id/approve',               ctrl.approveTrainingSlot);
router.put('/training-slots/:id/reject',                ctrl.rejectTrainingSlot);

module.exports = router;
