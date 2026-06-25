const HealthProfile = require('../models/HealthProfile');
const { calculateNutrition } = require('../services/calorieService');

// @desc    Create or update health profile
// @route   POST /api/profile
// @access  Private
const saveProfile = async (req, res) => {
  const {
    fullName,
    age,
    gender,
    country,
    state,
    city,
    heightCm,
    weightKg,
    bodyFatPercent,
    waistCircumference,
    activityLevel,
    sleepDuration,
    stressLevel,
    occupation,
    goal,
    goals,
    cuisinePreference,
    dietaryPreference,
    allergies,
    religiousRestrictions,
    foodsToAvoid,
    foodsPreferred,
    existingConditions,
    currentMedications,
    previousSurgeries,
    familyHistory,
    smoking,
    alcohol,
    exerciseExperience
  } = req.body;

  const toArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  try {
    // Sync User name if full name is provided
    const User = require('../models/User');
    if (fullName && fullName.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: fullName.trim() });
    }

    // 1. Prepare raw profile object for BMR/TDEE calculation
    const tempProfile = {
      fullName,
      age: parseInt(age),
      gender,
      country,
      state,
      city,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
      waistCircumference: waistCircumference ? parseFloat(waistCircumference) : undefined,
      activityLevel,
      sleepDuration: sleepDuration ? parseInt(sleepDuration) : undefined,
      stressLevel,
      occupation,
      goal,
      goals: toArray(goals),
      cuisinePreference,
      dietaryPreference,
      allergies: toArray(allergies),
      religiousRestrictions: toArray(religiousRestrictions),
      foodsToAvoid: toArray(foodsToAvoid),
      foodsPreferred: toArray(foodsPreferred),
      existingConditions: toArray(existingConditions),
      currentMedications: toArray(currentMedications),
      previousSurgeries: toArray(previousSurgeries),
      familyHistory: toArray(familyHistory),
      smoking,
      alcohol,
      exerciseExperience
    };

    // 2. Perform calculations
    const calculations = calculateNutrition(tempProfile);

    // 3. Find existing profile or construct a new one
    let profile = await HealthProfile.findOne({ user: req.user._id });

    const profileData = {
      user: req.user._id,
      ...tempProfile,
      ...calculations,
      updatedAt: Date.now()
    };

    if (profile) {
      // Update existing
      profile = await HealthProfile.findOneAndUpdate(
        { user: req.user._id },
        profileData,
        { new: true, runValidators: true }
      );
      res.json({ message: 'Profile updated successfully', profile });
    } else {
      // Create new
      profile = new HealthProfile(profileData);
      await profile.save();
      res.status(201).json({ message: 'Profile created successfully', profile });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's health profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Health profile not found. Please complete the setup.' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: error.message });
  }
};

const checkProfileStatus = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.json({ exists: false, isComplete: false, missingFields: [] });
    }
    
    // Check required fields
    const required = [
      'fullName', 'age', 'gender', 'country', 'state', 'city',
      'heightCm', 'weightKg', 'activityLevel', 'occupation',
      'sleepDuration', 'stressLevel', 'goals', 'dietaryPreference',
      'cuisinePreference', 'smoking', 'alcohol', 'exerciseExperience',
      'allergies', 'existingConditions', 'currentMedications'
    ];
    let isComplete = true;
    const missingFields = [];
    for (const field of required) {
      const val = profile[field];
      if (val === undefined || val === null || val === '') {
        isComplete = false;
        missingFields.push(field);
      } else if (Array.isArray(val) && val.length === 0 && field === 'goals') {
        isComplete = false;
        missingFields.push(field);
      }
    }
    res.json({ exists: true, isComplete, missingFields, profile });
  } catch (error) {
    console.error('Error checking profile status:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveProfile,
  getProfile,
  checkProfileStatus
};
