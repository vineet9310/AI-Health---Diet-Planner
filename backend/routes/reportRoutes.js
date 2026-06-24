const express = require('express');
const router = express.Router();
const { uploadReport, getReports, getReportById, deleteReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadReport);
router.get('/', protect, getReports);
router.route('/:id')
  .get(protect, getReportById)
  .delete(protect, deleteReport);

module.exports = router;
