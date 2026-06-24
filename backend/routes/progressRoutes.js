const express = require('express');
const router = express.Router();
const { logProgress, getProgressHistory } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.post('/log', protect, logProgress);
router.get('/', protect, getProgressHistory);

module.exports = router;
