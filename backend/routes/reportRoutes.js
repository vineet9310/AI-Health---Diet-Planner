const express = require('express');
const router = express.Router();
const { uploadReport, getReports, getReportById, deleteReport, claimReport } = require('../controllers/reportController');
const { protect, protectOptional } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protectOptional, upload.single('file'), uploadReport);
router.put('/claim', protect, claimReport);
router.get('/', protect, getReports);
router.route('/:id')
  .get(protectOptional, getReportById)
  .delete(protect, deleteReport);

module.exports = router;
