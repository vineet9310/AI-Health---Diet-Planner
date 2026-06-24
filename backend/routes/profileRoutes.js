const express = require('express');
const router = express.Router();
const { saveProfile, getProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, saveProfile)
  .get(protect, getProfile);

module.exports = router;
