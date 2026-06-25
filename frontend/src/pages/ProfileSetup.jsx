import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Dumbbell, ShieldAlert, Check, ChevronRight, ChevronLeft, AlertCircle, Heart, Shield } from 'lucide-react';
import api from '../utils/api';

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sleepDuration, setSleepDuration] = useState('');
  const [stressLevel, setStressLevel] = useState('low');

  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPercent, setBodyFatPercent] = useState('');
  const [waistCircumference, setWaistCircumference] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Goals Checkboxes
  const [goals, setGoals] = useState({
    weight_loss: false,
    weight_gain: false,
    muscle_gain: false,
    maintenance: false,
    improve_cholesterol: false,
    improve_thyroid: false,
    improve_blood_sugar: false,
    general_wellness: false
  });

  const [dietaryPreference, setDietaryPreference] = useState('vegetarian');
  const [cuisinePreference, setCuisinePreference] = useState('Indian');

  // Restrictions & History
  const [allergiesText, setAllergiesText] = useState('');
  const [religiousRestrictions, setReligiousRestrictions] = useState('');
  const [foodsToAvoid, setFoodsToAvoid] = useState('');
  const [foodsPreferred, setFoodsPreferred] = useState('');
  
  // Medical
  const [conditions, setConditions] = useState({
    diabetes: false,
    thyroid: false,
    kidney_disease: false,
    heart_disease: false,
  });
  const [customCondition, setCustomCondition] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [previousSurgeries, setPreviousSurgeries] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');

  // Habits
  const [smoking, setSmoking] = useState('never');
  const [alcohol, setAlcohol] = useState('never');
  const [exerciseExperience, setExerciseExperience] = useState('beginner');

  // Claim guest report if one exists
  useEffect(() => {
    const claimGuestReport = async () => {
      const reportId = localStorage.getItem('lastUploadedReportId');
      if (reportId) {
        try {
          await api('/reports/claim', {
            method: 'PUT',
            body: JSON.stringify({ reportId })
          });
          localStorage.removeItem('lastUploadedReportId');
          console.log('Successfully claimed guest report:', reportId);
        } catch (err) {
          console.error('Failed to claim guest report:', err);
        }
      }
    };
    claimGuestReport();
  }, []);

  // Fetch current profile if exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api('/profile');
        if (data) {
          setFullName(data.fullName || '');
          setAge(data.age || '');
          setGender(data.gender || 'male');
          setCountry(data.country || 'India');
          setState(data.state || '');
          setCity(data.city || '');
          setOccupation(data.occupation || '');
          setSleepDuration(data.sleepDuration || '');
          setStressLevel(data.stressLevel || 'low');

          setHeightCm(data.heightCm || '');
          setWeightKg(data.weightKg || '');
          setBodyFatPercent(data.bodyFatPercent || '');
          setWaistCircumference(data.waistCircumference || '');
          setActivityLevel(data.activityLevel || 'moderate');

          if (data.goals) {
            const updatedGoals = {
              weight_loss: false,
              weight_gain: false,
              muscle_gain: false,
              maintenance: false,
              improve_cholesterol: false,
              improve_thyroid: false,
              improve_blood_sugar: false,
              general_wellness: false
            };
            data.goals.forEach(g => {
              if (g in updatedGoals) updatedGoals[g] = true;
            });
            setGoals(updatedGoals);
          }
          
          setDietaryPreference(data.dietaryPreference || 'vegetarian');
          setCuisinePreference(data.cuisinePreference || 'Indian');
          
          setAllergiesText(data.allergies ? data.allergies.join(', ') : '');
          setReligiousRestrictions(data.religiousRestrictions ? data.religiousRestrictions.join(', ') : '');
          setFoodsToAvoid(data.foodsToAvoid ? data.foodsToAvoid.join(', ') : '');
          setFoodsPreferred(data.foodsPreferred ? data.foodsPreferred.join(', ') : '');
          setCurrentMedications(data.currentMedications ? data.currentMedications.join(', ') : '');
          setPreviousSurgeries(data.previousSurgeries ? data.previousSurgeries.join(', ') : '');
          setFamilyHistory(data.familyHistory ? data.familyHistory.join(', ') : '');
          
          setSmoking(data.smoking || 'never');
          setAlcohol(data.alcohol || 'never');
          setExerciseExperience(data.exerciseExperience || 'beginner');

          if (data.existingConditions) {
            const conds = {
              diabetes: false,
              thyroid: false,
              kidney_disease: false,
              heart_disease: false,
            };
            const customList = [];
            data.existingConditions.forEach(c => {
              const lower = c.toLowerCase();
              if (lower in conds) {
                conds[lower] = true;
              } else {
                customList.push(c);
              }
            });
            setConditions(conds);
            setCustomCondition(customList.join(', '));
          }
        }
      } catch (err) {
        console.log('No health profile found yet. Creating a new one.');
      }
    };

    fetchProfile();
  }, []);

  const handleConditionChange = (key) => {
    setConditions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGoalChange = (key) => {
    setGoals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!fullName || !age || !country || !state || !city || !occupation || !sleepDuration || !stressLevel) {
        return setError('Please fill in all personal, location, and lifestyle fields (Name, Age, Country, State, City, Occupation, Sleep, Stress).');
      }
    } else if (step === 2) {
      if (!heightCm || !weightKg || !activityLevel) {
        return setError('Please fill in height, weight, and activity level.');
      }
    } else if (step === 3) {
      const selectedGoals = Object.keys(goals).filter(k => goals[k]);
      if (selectedGoals.length === 0) {
        return setError('Please select at least one health goal.');
      }
      if (!dietaryPreference || !cuisinePreference) {
        return setError('Please select your dietary and cuisine preference.');
      }
    }
    setStep(prev => prev + 1);
  };
 
  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!smoking || !alcohol || !exerciseExperience) {
      setLoading(false);
      return setError('Please fill in all safety and habit fields (Smoking, Alcohol, and Exercise Experience).');
    }
 
    // Map checked conditions + custom conditions
    const finalConditions = Object.keys(conditions).filter(k => conditions[k]);
    if (customCondition.trim()) {
      customCondition.split(',').forEach(c => {
        const clean = c.trim();
        if (clean && !finalConditions.includes(clean)) {
          finalConditions.push(clean);
        }
      });
    }
 
    const selectedGoals = Object.keys(goals).filter(k => goals[k]);
    
    // Map a primary singular goal for BMR equations
    let singularGoal = 'maintain';
    if (goals.weight_loss) {
      singularGoal = 'lose_weight';
    } else if (goals.muscle_gain || goals.weight_gain) {
      singularGoal = 'gain_muscle';
    }

    const payload = {
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
      goal: singularGoal,
      goals: selectedGoals,
      cuisinePreference,
      dietaryPreference,
      allergies: allergiesText,
      religiousRestrictions,
      foodsToAvoid,
      foodsPreferred,
      existingConditions: finalConditions,
      currentMedications,
      previousSurgeries,
      familyHistory,
      smoking,
      alcohol,
      exerciseExperience
    };

    try {
      await api('/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccess('Health Profile saved successfully! Initiating AI safety verification and plan generation...');
      
      // AI verification pipeline
      const genResponse = await api('/plans/generate', {
        method: 'POST'
      });
      
      if (genResponse.requiresReview) {
        setSuccess('Health plan generated successfully, but routed to nutritionist for clinical review.');
      } else {
        setSuccess('Health plan verified and dashboard generated successfully!');
      }
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save health profile or verify health plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      <div className="glass-panel p-6 flex flex-col gap-5">
        
        {/* Step Indicator Headers */}
        <div className="flex justify-between items-center relative pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 1 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Step 1</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Personal Info</h4>
            </div>
          </div>
          
          <div className="w-4 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 2 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Step 2</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Body Metrics</h4>
            </div>
          </div>

          <div className="w-4 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 3 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Step 3</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Goals & Diet</h4>
            </div>
          </div>

          <div className="w-4 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 4 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Step 4</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Clinical & Habits</h4>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex gap-2 items-center">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Personal & Lifestyle Details</h3>
            <p className="text-slate-500 text-xs">Let's start with your location, occupation, and daily rhythm.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. Jane Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120"
                  required
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 28" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Biological Gender</label>
                <select 
                  className="glass-input py-2 px-3 text-xs cursor-pointer" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Country</label>
                <select
                  className="glass-input py-2 px-3 text-xs cursor-pointer"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="India">India</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="USA">USA</option>
                  <option value="Japan">Japan</option>
                  <option value="Italy">Italy</option>
                  <option value="Greece">Greece</option>
                  <option value="Spain">Spain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">State</label>
                <input 
                  type="text" 
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. Maharashtra" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. Mumbai" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Occupation</label>
                <input 
                  type="text" 
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. Software Engineer" 
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sleep Duration (Hours)</label>
                <input 
                  type="number" 
                  min="2" 
                  max="18"
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 7" 
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stress Level</label>
                <select 
                  className="glass-input py-2 px-3 text-xs cursor-pointer" 
                  value={stressLevel}
                  onChange={(e) => setStressLevel(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleNext} 
              className="btn-primary self-end py-2 px-4 text-xs font-semibold mt-3"
            >
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Physical & Body Metrics */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Physical & Body Metrics</h3>
            <p className="text-slate-500 text-xs">These values determine calorie limits and metabolic targets.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Height (cm)</label>
                <input 
                  type="number" 
                  min="50" 
                  max="250"
                  required
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 175" 
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  min="10" 
                  max="300"
                  step="0.1"
                  required
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 72.5" 
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Body Fat % (Optional)</label>
                <input 
                  type="number" 
                  min="2" 
                  max="70"
                  step="0.1"
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 18.5" 
                  value={bodyFatPercent}
                  onChange={(e) => setBodyFatPercent(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Waist Circumference (cm) (Optional)</label>
                <input 
                  type="number" 
                  min="30" 
                  max="200"
                  className="glass-input py-2 px-3 text-xs" 
                  placeholder="e.g. 84" 
                  value={waistCircumference}
                  onChange={(e) => setWaistCircumference(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Lifestyle Multiplier</label>
                <select 
                  className="glass-input py-2 px-3 text-xs cursor-pointer" 
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                >
                  <option value="sedentary">Sedentary (Little/no exercise, desk job)</option>
                  <option value="light">Lightly Active (Light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderately Active (Moderate exercise 3-5 days/week)</option>
                  <option value="active">Very Active (Hard exercise 6-7 days/week)</option>
                  <option value="very_active">Super Active (Physical job or heavy training twice/day)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <button type="button" onClick={handleBack} className="btn-secondary py-2 px-4 text-xs font-semibold">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={handleNext} className="btn-primary py-2 px-4 text-xs font-semibold">
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Health Goals & Diet */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Health Goals & Diet Preferences</h3>
            <p className="text-slate-500 text-xs">Choose the dietary preferences and target goals to adapt food selection.</p>

            <div className="flex flex-col gap-4 mt-1">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Select Your Health Goals (Select all that apply)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.weight_loss} onChange={() => handleGoalChange('weight_loss')} />
                    Weight Loss
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.weight_gain} onChange={() => handleGoalChange('weight_gain')} />
                    Weight Gain
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.muscle_gain} onChange={() => handleGoalChange('muscle_gain')} />
                    Muscle Gain
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.maintenance} onChange={() => handleGoalChange('maintenance')} />
                    Weight Maintenance
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.improve_cholesterol} onChange={() => handleGoalChange('improve_cholesterol')} />
                    Improve Lipid/Cholesterol
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.improve_thyroid} onChange={() => handleGoalChange('improve_thyroid')} />
                    Improve Thyroid Health
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.improve_blood_sugar} onChange={() => handleGoalChange('improve_blood_sugar')} />
                    Improve Blood Sugar
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    <input type="checkbox" className="accent-emerald-700 h-3.5 w-3.5 rounded" checked={goals.general_wellness} onChange={() => handleGoalChange('general_wellness')} />
                    General Wellness
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dietary Preferences</label>
                  <select 
                    className="glass-input py-2 px-3 text-xs cursor-pointer" 
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                  >
                    <option value="vegetarian">Vegetarian (No meat/fish)</option>
                    <option value="vegan">Vegan (100% plant-based, no dairy/eggs)</option>
                    <option value="eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                    <option value="non_vegetarian">Non-Vegetarian (Chicken, meat, seafood)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cuisine Preference</label>
                  <input 
                    type="text" 
                    className="glass-input py-2 px-3 text-xs" 
                    placeholder="e.g. Indian, Pakistani, Mediterranean, Japanese" 
                    value={cuisinePreference}
                    onChange={(e) => setCuisinePreference(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <button type="button" onClick={handleBack} className="btn-secondary py-2 px-4 text-xs font-semibold">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={handleNext} className="btn-primary py-2 px-4 text-xs font-semibold">
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Safety, History, & Habits */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Safety, Clinical History & Habits</h3>
            <p className="text-slate-500 text-xs">These clinical details enable AI verification of contraindications and safety concerns.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              
              {/* Left Column */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Existing Medical Diagnoses</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 bg-slate-50 text-[10px] cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" checked={conditions.diabetes} onChange={() => handleConditionChange('diabetes')} className="h-3 w-3 accent-emerald-600" />
                      Diabetes
                    </label>
                    <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 bg-slate-50 text-[10px] cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" checked={conditions.thyroid} onChange={() => handleConditionChange('thyroid')} className="h-3 w-3 accent-emerald-600" />
                      Thyroid Panel
                    </label>
                    <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 bg-slate-50 text-[10px] cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" checked={conditions.kidney_disease} onChange={() => handleConditionChange('kidney_disease')} className="h-3 w-3 accent-emerald-600" />
                      Kidney Panel
                    </label>
                    <label className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 bg-slate-50 text-[10px] cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" checked={conditions.heart_disease} onChange={() => handleConditionChange('heart_disease')} className="h-3 w-3 accent-emerald-600" />
                      Cardiovascular
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Other Conditions (Comma separated)</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Hypertension, Gout" value={customCondition} onChange={(e) => setCustomCondition(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Medications</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Metformin 500mg, Levothyroxine" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Previous Surgeries / Family History</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="Surgeries" value={previousSurgeries} onChange={(e) => setPreviousSurgeries(e.target.value)} />
                    <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="Family diseases" value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lifestyle Habits</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-400 block mb-0.5">Smoking</span>
                      <select value={smoking} onChange={(e) => setSmoking(e.target.value)} className="glass-input py-1 px-1.5 text-[10px] w-full cursor-pointer">
                        <option value="never">Never</option>
                        <option value="former">Former</option>
                        <option value="occasional">Occasional</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block mb-0.5">Alcohol</span>
                      <select value={alcohol} onChange={(e) => setAlcohol(e.target.value)} className="glass-input py-1 px-1.5 text-[10px] w-full cursor-pointer">
                        <option value="never">Never</option>
                        <option value="occasional">Occasional</option>
                        <option value="regular">Regular</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block mb-0.5">Exercise Exp</span>
                      <select value={exerciseExperience} onChange={(e) => setExerciseExperience(e.target.value)} className="glass-input py-1 px-1.5 text-[10px] w-full cursor-pointer">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-3 justify-between">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Allergies (Comma separated)</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Peanuts, Gluten" value={allergiesText} onChange={(e) => setAllergiesText(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Religious Food Restrictions</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Halal, Kosher" value={religiousRestrictions} onChange={(e) => setReligiousRestrictions(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Foods to Avoid</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Eggplant, Soy milk" value={foodsToAvoid} onChange={(e) => setFoodsToAvoid(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Foods Preferred</label>
                  <input type="text" className="glass-input py-2 px-3 text-xs" placeholder="e.g. Salmon, Oats, Broccoli" value={foodsPreferred} onChange={(e) => setFoodsPreferred(e.target.value)} />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <button type="button" onClick={handleBack} className="btn-secondary py-2 px-4 text-xs font-semibold">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary py-2 px-4 text-xs font-semibold">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save Health Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileSetup;
