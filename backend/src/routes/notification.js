const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

// Helper to authenticate request and populate user/coach
const { authenticate } = require('../middlewares/auth');

// We use a custom middleware to allow either player/admin (authenticate) or coach (from another auth logic if separated)
// Actually, in `auth.js` middlewares, `authenticate` handles both 'player' and 'admin' via `req.user`.
// Coach uses `req.coach`. We will just use `authenticate` and if it fails, try coach auth?
// Let's look at how coach auth works in `src/routes/coach.js` ... wait, `authenticate` works for all.
// I will apply `authenticate` to protect the routes.

router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.put('/read-all', ctrl.markAllAsRead);
router.put('/:id/read', ctrl.markAsRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
