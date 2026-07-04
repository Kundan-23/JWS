const express = require('express');
const router  = express.Router();
const configController = require('../controllers/configController');

// Public route - no auth needed
router.get('/', configController.getPublicConfig);

module.exports = router;
