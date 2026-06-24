const DietPlan = require('../models/DietPlan');
const HealthProfile = require('../models/HealthProfile');
const MedicalReport = require('../models/MedicalReport');
const ReviewQueue = require('../models/ReviewQueue');
const { generateAIPlan } = require('../services/aiPlanService');

// Helper to check if a biomarker matches specific names and is not normal
const hasRiskFlag = (biomarkers, testNames) => {
  return biomarkers.some(b => 
    testNames.some(name => b.testName.toLowerCase().includes(name.toLowerCase())) &&
    b.status !== 'normal'
  );
};

// Helper to filter allergies from meals
const containsAllergen = (meals, allergies) => {
  if (!allergies || allergies.length === 0) return false;
  
  for (const meal of meals) {
    for (const item of meal.items) {
      for (const allergy of allergies) {
        if (item.toLowerCase().includes(allergy.toLowerCase())) {
          return true;
        }
      }
    }
  }
  return false;
};

// @desc    Generate personalized diet & exercise plan using AI
// @route   POST /api/plans/generate
// @access  Private
const generatePlan = async (req, res) => {
  try {
    // 1. Fetch latest health profile
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({ message: 'Please set up your health profile first.' });
    }

    // 2. Fetch latest processed medical report (if any)
    const latestReport = await MedicalReport.findOne({ 
      user: req.user._id,
      analysisStatus: 'processed'
    }).sort({ uploadedAt: -1 });

    const flaggedBiomarkers = latestReport ? latestReport.biomarkers.filter(b => b.status !== 'normal') : [];

    // 3. Safety Filter Layer (Rule 1: Critical Biomarker)
    if (latestReport && latestReport.hasCriticalFlag) {
      // Create a blocked ReviewQueue entry for safety tracing
      const blockedPlan = new DietPlan({
        user: req.user._id,
        basedOnReport: latestReport._id,
        dailyCalories: profile.dailyCalories,
        macros: profile.macros,
        meals: [],
        workout: [],
        flagsConsidered: ['CRITICAL_BIOMARKER_FLAG'],
        status: 'rejected',
        rejectionReason: 'Urgent medical attention required due to critical biomarker values.'
      });
      await blockedPlan.save();

      await ReviewQueue.create({
        dietPlan: blockedPlan._id,
        user: req.user._id,
        reason: 'CRITICAL VALUE DETECTED - Generation blocked for user safety.',
        status: 'resolved' // auto-marked as resolved since it is blocked
      });

      return res.status(422).json({
        safetyBlock: true,
        message: 'One or more of your results need urgent medical attention. Please consult a doctor before we can generate a plan for you.'
      });
    }

    const reportDetails = latestReport ? {
      riskScore: latestReport.riskScore,
      riskCategory: latestReport.riskCategory,
      doctorSummary: latestReport.doctorSummary,
      healthRecommendations: latestReport.healthRecommendations
    } : null;

    // 4. Generate plan using AI Service
    const aiPlanResult = await generateAIPlan(profile, flaggedBiomarkers, reportDetails);

    // 5. Determine plan status based on conditions and biomarker flags
    let planStatus = 'ai_generated';
    let reviewReason = '';

    // Check conditions: diabetes, thyroid, kidney_disease, heart_disease
    const highRiskConditions = ['diabetes', 'thyroid', 'kidney_disease', 'heart_disease', 'renal', 'cardiovascular'];
    const hasHighRiskCondition = profile.existingConditions.some(c => 
      highRiskConditions.some(hr => c.toLowerCase().includes(hr))
    );

    // Check biomarker flags for blood sugar, cholesterol, or TSH
    const hasLabFlags = latestReport && hasRiskFlag(latestReport.biomarkers, ['glucose', 'sugar', 'cholesterol', 'ldl', 'triglycerides', 'tsh', 'thyroid']);

    if (hasHighRiskCondition) {
      planStatus = 'pending_review';
      reviewReason = `User has high-risk health condition (${profile.existingConditions.join(', ')}) — requires nutritionist review.`;
    } else if (hasLabFlags) {
      planStatus = 'pending_review';
      reviewReason = 'Abnormal biomarker values (glucose/cholesterol/thyroid) detected — requires nutritionist review.';
    }

    // 6. Verify allergies are strictly respected
    const hasAllergen = containsAllergen(aiPlanResult.meals, profile.allergies);
    if (hasAllergen) {
      planStatus = 'pending_review';
      reviewReason = (reviewReason ? reviewReason + ' | ' : '') + 'AI generated meal contains suspected allergen — flagged for manual check.';
    }

    // 7. Save DietPlan
    const dietPlan = new DietPlan({
      user: req.user._id,
      basedOnReport: latestReport ? latestReport._id : null,
      dailyCalories: profile.dailyCalories,
      macros: profile.macros,
      meals: aiPlanResult.meals,
      workout: aiPlanResult.workout,
      flagsConsidered: aiPlanResult.flagsConsidered || [],
      status: planStatus,
      rejectionReason: null
    });

    await dietPlan.save();

    // 8. Add to ReviewQueue if pending review
    if (planStatus === 'pending_review') {
      await ReviewQueue.create({
        dietPlan: dietPlan._id,
        user: req.user._id,
        reason: reviewReason
      });

      return res.status(201).json({
        message: 'Plan generated but requires review by our nutritionist due to safety triggers. You will be notified once it is approved.',
        requiresReview: true,
        dietPlan
      });
    }

    res.status(201).json({
      message: 'Diet and exercise plan generated successfully!',
      requiresReview: false,
      dietPlan
    });
  } catch (error) {
    console.error('Error generating diet plan:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active approved plan
// @route   GET /api/plans/current
// @access  Private
const getCurrentPlan = async (req, res) => {
  try {
    // Find the latest approved plan, or fallback to any generated plan if they have no conditions
    // Actually let's return the latest active plan.
    // If they have pending review plans, let the client know.
    const plan = await DietPlan.findOne({ 
      user: req.user._id,
      status: { $in: ['approved', 'ai_generated'] }
    }).sort({ createdAt: -1 });

    const pendingPlan = await DietPlan.findOne({
      user: req.user._id,
      status: 'pending_review'
    }).sort({ createdAt: -1 });

    res.json({
      activePlan: plan || null,
      pendingPlan: pendingPlan || null
    });
  } catch (error) {
    console.error('Error fetching current plan:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's complete plan history
// @route   GET /api/plans/history
// @access  Private
const getPlanHistory = async (req, res) => {
  try {
    const plans = await DietPlan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plan history:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePlan,
  getCurrentPlan,
  getPlanHistory
};
