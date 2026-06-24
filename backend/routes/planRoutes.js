const express = require('express');
const router = express.Router();
const { generatePlan, getCurrentPlan, getPlanHistory } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generatePlan);
router.get('/current', protect, getCurrentPlan);
router.get('/history', protect, getPlanHistory);

module.exports = router;
