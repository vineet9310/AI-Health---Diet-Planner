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
    <div className="max-w-2xl mx-auto py-2">
      <div className="glass-panel p-5 flex flex-col gap-4">
        
        {/* Step Indicator Headers */}
        <div className="flex justify-between items-center relative pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 1 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Step 1</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Physical Profile</h4>
            </div>
          </div>
          
          <div className="w-6 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 2 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Step 2</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Diet & Goals</h4>
            </div>
          </div>

          <div className="w-6 h-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${step >= 3 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Step 3</p>
              <h4 className="text-xs font-bold font-heading text-slate-900">Constraints</h4>
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

        {/* Step 1: Physical Measurements */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Physical Measurements</h3>
            <p className="text-slate-500 text-xs">These measurements calculate your Basal Metabolic Rate (BMR) and caloric limits.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
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
                  <option value="other">Other / Intersex</option>
                </select>
              </div>

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

        {/* Step 2: Goals & Activity */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Activity & Target Goals</h3>
            <p className="text-slate-500 text-xs">We customize caloric splits based on your activity and goals.</p>

            <div className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-1">
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

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Primary Target Goal</label>
                <select 
                  className="glass-input py-2 px-3 text-xs cursor-pointer" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="lose_weight">Lose Weight (Caloric Deficit -500 kcal)</option>
                  <option value="maintain">Maintain Weight (Caloric Equilibrium)</option>
                  <option value="gain_muscle">Gain Muscle / Bulk (Caloric Surplus +300 kcal)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <button type="button" onClick={handleBack} className="btn-secondary py-2 px-4 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={handleNext} className="btn-primary py-2 px-4 text-xs">
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Health Constraints - Split Layout to avoid scrolling */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold font-heading text-slate-900">Safety & Dietary Constraints</h3>
            <p className="text-slate-500 text-xs">Specify medical history and allergies. Safety filters will route items to reviewer pipeline.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              
              {/* Left Portion */}
              <div className="flex flex-col gap-3">
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
                    <option value="non_vegetarian">Non-Vegetarian (Include chicken, fish, meats)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Existing Medical Diagnoses</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    
                    <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-700 h-3.5 w-3.5 rounded" 
                        checked={conditions.diabetes}
                        onChange={() => handleConditionChange('diabetes')}
                      />
                      <span className="text-xs font-semibold text-slate-700">Diabetes</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-700 h-3.5 w-3.5 rounded" 
                        checked={conditions.thyroid}
                        onChange={() => handleConditionChange('thyroid')}
                      />
                      <span className="text-xs font-semibold text-slate-700">Thyroid Panel</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-700 h-3.5 w-3.5 rounded" 
                        checked={conditions.kidney_disease}
                        onChange={() => handleConditionChange('kidney_disease')}
                      />
                      <span className="text-xs font-semibold text-slate-700">Kidney Panel</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        className="accent-emerald-700 h-3.5 w-3.5 rounded" 
                        checked={conditions.heart_disease}
                        onChange={() => handleConditionChange('heart_disease')}
                      />
                      <span className="text-xs font-semibold text-slate-700">Cardiovascular</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Portion */}
              <div className="flex flex-col gap-3 justify-between">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Other Conditions (Comma separated)</label>
                  <input 
                    type="text" 
                    className="glass-input py-2 px-3 text-xs" 
                    placeholder="e.g. Hypertension, Gastritis" 
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Allergies (Comma separated)</label>
                  <input 
                    type="text" 
                    className="glass-input py-2 px-3 text-xs" 
                    placeholder="e.g. Peanuts, Gluten, Lactose" 
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
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
