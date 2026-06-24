const ReviewQueue = require('../models/ReviewQueue');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const ReferenceRange = require('../models/ReferenceRange');

// @desc    Get review queue entries
// @route   GET /api/admin/review-queue
// @access  Private (Admin/Nutritionist)
const getReviewQueue = async (req, res) => {
  try {
    const queue = await ReviewQueue.find({ status: 'pending' })
      .populate({
        path: 'dietPlan',
        populate: { path: 'basedOnReport' }
      })
      .populate('user')
      .sort({ createdAt: -1 });
    res.json(queue);
  } catch (error) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a diet plan
// @route   PUT /api/admin/plans/:id/approve
// @access  Private (Admin/Nutritionist)
const approvePlan = async (req, res) => {
  const { meals, workout } = req.body;
  try {
    const plan = await DietPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    if (meals) plan.meals = meals;
    if (workout) plan.workout = workout;

    plan.status = 'approved';
    plan.reviewedBy = req.user._id;
    await plan.save();

    // Mark corresponding review queue entries as resolved
    await ReviewQueue.updateMany(
      { dietPlan: plan._id, status: 'pending' },
      { status: 'resolved' }
    );

    res.json({ message: 'Diet plan approved successfully', plan });
  } catch (error) {
    console.error('Error approving plan:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a diet plan with reason
// @route   PUT /api/admin/plans/:id/reject
// @access  Private (Admin/Nutritionist)
const rejectPlan = async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  try {
    const plan = await DietPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    plan.status = 'rejected';
    plan.rejectionReason = reason;
    plan.reviewedBy = req.user._id;
    await plan.save();

    // Resolve queue entry
    await ReviewQueue.updateMany(
      { dietPlan: plan._id, status: 'pending' },
      { status: 'resolved' }
    );

    res.json({ message: 'Diet plan rejected successfully', plan });
  } catch (error) {
    console.error('Error rejecting plan:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin/Nutritionist)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reference ranges
// @route   GET /api/admin/reference-ranges
// @access  Private (Admin/Nutritionist)
const getReferenceRanges = async (req, res) => {
  try {
    const ranges = await ReferenceRange.find({});
    res.json(ranges);
  } catch (error) {
    console.error('Error fetching reference ranges:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new reference range
// @route   POST /api/admin/reference-ranges
// @access  Private (Admin only)
const createReferenceRange = async (req, res) => {
  const { testName, unit, minNormal, maxNormal, criticalLow, criticalHigh, category, aliases } = req.body;

  try {
    const range = new ReferenceRange({
      testName,
      unit,
      minNormal: parseFloat(minNormal),
      maxNormal: parseFloat(maxNormal),
      criticalLow: criticalLow ? parseFloat(criticalLow) : undefined,
      criticalHigh: criticalHigh ? parseFloat(criticalHigh) : undefined,
      category,
      aliases: Array.isArray(aliases) ? aliases : (aliases ? aliases.split(',').map(s => s.trim()) : [])
    });

    await range.save();
    res.status(201).json({ message: 'Reference range created successfully', range });
  } catch (error) {
    console.error('Error creating reference range:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a reference range
// @route   PUT /api/admin/reference-ranges/:id
// @access  Private (Admin only)
const updateReferenceRange = async (req, res) => {
  const { testName, unit, minNormal, maxNormal, criticalLow, criticalHigh, category, aliases } = req.body;

  try {
    const range = await ReferenceRange.findById(req.params.id);
    if (!range) {
      return res.status(404).json({ message: 'Reference range not found' });
    }

    range.testName = testName || range.testName;
    range.unit = unit || range.unit;
    if (minNormal !== undefined) range.minNormal = parseFloat(minNormal);
    if (maxNormal !== undefined) range.maxNormal = parseFloat(maxNormal);
    range.criticalLow = criticalLow !== undefined ? parseFloat(criticalLow) : range.criticalLow;
    range.criticalHigh = criticalHigh !== undefined ? parseFloat(criticalHigh) : range.criticalHigh;
    range.category = category || range.category;
    if (aliases !== undefined) {
      range.aliases = Array.isArray(aliases) ? aliases : aliases.split(',').map(s => s.trim());
    }

    await range.save();
    res.json({ message: 'Reference range updated successfully', range });
  } catch (error) {
    console.error('Error updating reference range:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReviewQueue,
  approvePlan,
  rejectPlan,
  getUsers,
  getReferenceRanges,
  createReferenceRange,
  updateReferenceRange
};
