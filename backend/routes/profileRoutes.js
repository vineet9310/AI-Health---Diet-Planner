const express = require('express');
const router = express.Router();
const { saveProfile, getProfile, checkProfileStatus } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/status', protect, checkProfileStatus);

router.route('/')
  .post(protect, saveProfile)
  .get(protect, getProfile);

module.exports = router;
