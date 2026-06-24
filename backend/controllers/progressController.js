const ProgressLog = require('../models/ProgressLog');

// @desc    Log daily progress (weight, meals, workout)
// @route   POST /api/progress/log
// @access  Private
const logProgress = async (req, res) => {
  const { weightKg, mealsFollowed, workoutCompleted, notes, date } = req.body;

  try {
    const logDate = date ? new Date(date) : new Date();
    
    // Calculate start and end of the specified day
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if progress already logged for this day
    let progress = await ProgressLog.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const progressData = {
      user: req.user._id,
      date: logDate,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      mealsFollowed: mealsFollowed !== undefined ? parseInt(mealsFollowed) : undefined,
      workoutCompleted: workoutCompleted === 'true' || workoutCompleted === true,
      notes: notes || ''
    };

    if (progress) {
      // Update existing log
      if (weightKg) progress.weightKg = progressData.weightKg;
      if (mealsFollowed !== undefined) progress.mealsFollowed = progressData.mealsFollowed;
      if (workoutCompleted !== undefined) progress.workoutCompleted = progressData.workoutCompleted;
      if (notes !== undefined) progress.notes = progressData.notes;
      
      await progress.save();
      res.json({ message: 'Progress log updated successfully', progress });
    } else {
      // Create new log
      progress = new ProgressLog(progressData);
      await progress.save();
      res.status(201).json({ message: 'Progress logged successfully', progress });
    }
  } catch (error) {
    console.error('Error logging progress:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get progress logs history
// @route   GET /api/progress
// @access  Private
const getProgressHistory = async (req, res) => {
  try {
    const logs = await ProgressLog.find({ user: req.user._id }).sort({ date: 1 }); // Sort chronologically for charting
    res.json(logs);
  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logProgress,
  getProgressHistory
};
