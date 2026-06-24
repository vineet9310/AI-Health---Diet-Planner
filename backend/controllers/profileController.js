const HealthProfile = require('../models/HealthProfile');
const { calculateNutrition } = require('../services/calorieService');

// @desc    Create or update health profile
// @route   POST /api/profile
// @access  Private
const saveProfile = async (req, res) => {
  const {
    age,
    gender,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    allergies,
    existingConditions,
    dietaryPreference
  } = req.body;

  try {
    // 1. Prepare raw profile object for BMR/TDEE calculation
    const tempProfile = {
      age: parseInt(age),
      gender,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
      goal,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      existingConditions: Array.isArray(existingConditions) ? existingConditions : (existingConditions ? [existingConditions] : []),
      dietaryPreference
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

module.exports = {
  saveProfile,
  getProfile
};
