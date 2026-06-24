import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Dumbbell, ShieldAlert, Check, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form Fields State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');

  const [dietaryPreference, setDietaryPreference] = useState('vegetarian');
  const [allergiesText, setAllergiesText] = useState('');
  
  // Checkboxes for conditions
  const [conditions, setConditions] = useState({
    diabetes: false,
    thyroid: false,
    kidney_disease: false,
    heart_disease: false,
  });
  const [customCondition, setCustomCondition] = useState('');

  // Fetch current profile if exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api('/profile');
        if (data) {
          setAge(data.age || '');
          setGender(data.gender || 'male');
          setHeightCm(data.heightCm || '');
          setWeightKg(data.weightKg || '');
          setActivityLevel(data.activityLevel || 'moderate');
          setGoal(data.goal || 'maintain');
          setDietaryPreference(data.dietaryPreference || 'vegetarian');
          setAllergiesText(data.allergies ? data.allergies.join(', ') : '');
          
          // Map conditions back
          if (data.existingConditions) {
            const conds = { ...conditions };
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
        // Safe to ignore if profile doesn't exist yet
        console.log('No health profile found yet. Creating a new one.');
      }
    };

    fetchProfile();
  }, []);

  const handleConditionChange = (key) => {
    setConditions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNext = () => {
    // Basic validation
    if (step === 1) {
      if (!age || !heightCm || !weightKg) {
        return setError('Please fill in all physical measurements.');
      }
      setError('');
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

    const allergies = allergiesText.split(',').map(s => s.trim()).filter(s => s);

    const payload = {
      age: parseInt(age),
      gender,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
      goal,
      allergies,
      existingConditions: finalConditions,
      dietaryPreference
    };

    try {
      await api('/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccess('Health Profile saved successfully!');
      
      // Auto redirect to report upload after initial setup!
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save health profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="glass-panel p-8 flex flex-col gap-8">
        
        {/* Step Indicator Headers */}
        <div className="flex justify-between items-center relative pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${step >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1</p>
              <h4 className="text-sm font-bold font-heading">Physical Profile</h4>
            </div>
          </div>
          
          <div className="w-8 h-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${step >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 2</p>
              <h4 className="text-sm font-bold font-heading">Diet & Fitness Goals</h4>
            </div>
          </div>

          <div className="w-8 h-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${step >= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 3</p>
              <h4 className="text-sm font-bold font-heading">Health Constraints</h4>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-sm flex gap-2 items-center">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Physical Measurements */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-2xl font-bold font-heading">Tell us about your physical profile</h3>
            <p className="text-slate-400 text-sm">These measurements are used to accurately calculate your Basal Metabolic Rate (BMR) and daily energy expenditure targets.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age (Years)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120"
                  required
                  className="glass-input" 
                  placeholder="e.g. 28" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biological Gender</label>
                <select 
                  className="glass-input cursor-pointer" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male" className="bg-slate-950 text-white">Male</option>
                  <option value="female" className="bg-slate-950 text-white">Female</option>
                  <option value="other" className="bg-slate-950 text-white">Other / Intersex</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                <input 
                  type="number" 
                  min="50" 
                  max="250"
                  required
                  className="glass-input" 
                  placeholder="e.g. 175" 
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  min="10" 
                  max="300"
                  step="0.1"
                  required
                  className="glass-input" 
                  placeholder="e.g. 72.5" 
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleNext} 
              className="btn-primary self-end mt-4"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Goals & Activity */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-2xl font-bold font-heading">Activity & Fitness Goals</h3>
            <p className="text-slate-400 text-sm">We configure your macro nutrient targets based on your active lifestyle and immediate weight targets.</p>

            <div className="flex flex-col gap-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Lifestyle Multiplier</label>
                <select 
                  className="glass-input cursor-pointer" 
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                >
                  <option value="sedentary" className="bg-slate-950">Sedentary (Little/no exercise, desk job)</option>
                  <option value="light" className="bg-slate-950">Lightly Active (Light exercise 1-3 days/week)</option>
                  <option value="moderate" className="bg-slate-950">Moderately Active (Moderate exercise 3-5 days/week)</option>
                  <option value="active" className="bg-slate-950">Very Active (Hard exercise 6-7 days/week)</option>
                  <option value="very_active" className="bg-slate-950">Super Active (Physical job or heavy training twice/day)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Target Goal</label>
                <select 
                  className="glass-input cursor-pointer" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="lose_weight" className="bg-slate-950">Lose Weight (Caloric Deficit -500 kcal)</option>
                  <option value="maintain" className="bg-slate-950">Maintain Weight (Caloric Equilibrium)</option>
                  <option value="gain_muscle" className="bg-slate-950">Gain Muscle / Bulk (Caloric Surplus +300 kcal)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button type="button" onClick={handleBack} className="btn-secondary">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={handleNext} className="btn-primary">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Health Constraints */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-2xl font-bold font-heading">Safety & Dietary Constraints</h3>
            <p className="text-slate-400 text-sm">Please let us know about any existing diagnoses, allergies, and lifestyle eating choices. Any flagged items routing to this list will trigger nutritionist review safeguards.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dietary Preferences</label>
                <select 
                  className="glass-input cursor-pointer" 
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                >
                  <option value="vegetarian" className="bg-slate-950">Vegetarian (No meat/fish)</option>
                  <option value="vegan" className="bg-slate-950">Vegan (100% plant-based, no dairy/eggs)</option>
                  <option value="eggetarian" className="bg-slate-950">Eggetarian (Vegetarian + Eggs)</option>
                  <option value="non_vegetarian" className="bg-slate-950">Non-Vegetarian (Include chicken, fish, meats)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Existing Medical Diagnoses</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer hover:border-slate-700 transition-all">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-500 h-4 w-4 rounded" 
                      checked={conditions.diabetes}
                      onChange={() => handleConditionChange('diabetes')}
                    />
                    <span className="text-sm font-medium text-slate-200">Diabetes / High Blood Sugar</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer hover:border-slate-700 transition-all">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-500 h-4 w-4 rounded" 
                      checked={conditions.thyroid}
                      onChange={() => handleConditionChange('thyroid')}
                    />
                    <span className="text-sm font-medium text-slate-200">Thyroid (Hypo/Hyperthyroidism)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer hover:border-slate-700 transition-all">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-500 h-4 w-4 rounded" 
                      checked={conditions.kidney_disease}
                      onChange={() => handleConditionChange('kidney_disease')}
                    />
                    <span className="text-sm font-medium text-slate-200">Kidney / Renal Disease</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer hover:border-slate-700 transition-all">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-500 h-4 w-4 rounded" 
                      checked={conditions.heart_disease}
                      onChange={() => handleConditionChange('heart_disease')}
                    />
                    <span className="text-sm font-medium text-slate-200">Heart / Cardiovascular Disease</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Other / Custom Conditions (Comma separated)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Hypertension, Gastritis" 
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allergies & Intolerances (Comma separated)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Peanuts, Gluten, Lactose, Eggs" 
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={handleBack} className="btn-secondary">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Health Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileSetup;
