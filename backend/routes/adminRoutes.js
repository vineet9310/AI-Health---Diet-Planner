const express = require('express');
const router = express.Router();
const {
  getReviewQueue,
  approvePlan,
  rejectPlan,
  getUsers,
  getReferenceRanges,
  createReferenceRange,
  updateReferenceRange
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, nutritionistOrAdmin } = require('../middleware/adminMiddleware');

// Nutritionist or Admin routes
router.get('/review-queue', protect, nutritionistOrAdmin, getReviewQueue);
router.put('/plans/:id/approve', protect, nutritionistOrAdmin, approvePlan);
router.put('/plans/:id/reject', protect, nutritionistOrAdmin, rejectPlan);
router.get('/users', protect, nutritionistOrAdmin, getUsers);
router.get('/reference-ranges', protect, nutritionistOrAdmin, getReferenceRanges);

// Admin-only master range management routes
router.post('/reference-ranges', protect, adminOnly, createReferenceRange);
router.put('/reference-ranges/:id', protect, adminOnly, updateReferenceRange);

module.exports = router;
