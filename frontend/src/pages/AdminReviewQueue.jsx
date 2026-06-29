import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Check, 
  X, 
  AlertCircle, 
  Activity, 
  User, 
  Plus, 
  Minus,
  Save,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import api from '../utils/api';

const AdminReviewQueue = () => {
  const [queue, setQueue] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edited States for expanded plan review
  const [editedMeals, setEditedMeals] = useState([]);
  const [editedWorkout, setEditedWorkout] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchQueue = async () => {
    try {
      const data = await api('/admin/review-queue');
      setQueue(data);
      if (data.length > 0) {
        selectEntry(data[0]);
      } else {
        setSelectedEntry(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const selectEntry = (entry) => {
    setSelectedEntry(entry);
    setShowRejectForm(false);
    setRejectReason('');
    
    // Set editable buffers
    if (entry && entry.dietPlan) {
      setEditedMeals(JSON.parse(JSON.stringify(entry.dietPlan.meals || [])));
      setEditedWorkout(JSON.parse(JSON.stringify(entry.dietPlan.workout || [])));
    }
  };

  // Inline Meal Edit helpers
  const handleMealItemChange = (mealIndex, itemIndex, val) => {
    const updated = [...editedMeals];
    updated[mealIndex].items[itemIndex] = val;
    setEditedMeals(updated);
  };

  const handleMealKcalChange = (mealIndex, val) => {
    const updated = [...editedMeals];
    updated[mealIndex].kcal = parseInt(val) || 0;
    setEditedMeals(updated);
  };

  const addMealItem = (mealIndex) => {
    const updated = [...editedMeals];
    updated[mealIndex].items.push('New Food Item');
    setEditedMeals(updated);
  };

  const removeMealItem = (mealIndex, itemIndex) => {
    const updated = [...editedMeals];
    updated[mealIndex].items.splice(itemIndex, 1);
    setEditedMeals(updated);
  };

  // Inline Workout Edit helpers
  const handleExerciseChange = (dayIndex, exIndex, val) => {
    const updated = [...editedWorkout];
    updated[dayIndex].exercises[exIndex] = val;
    setEditedWorkout(updated);
  };

  const addExercise = (dayIndex) => {
    const updated = [...editedWorkout];
    updated[dayIndex].exercises.push('New Exercise Description');
    setEditedWorkout(updated);
  };

  const removeExercise = (dayIndex, exIndex) => {
    const updated = [...editedWorkout];
    updated[dayIndex].exercises.splice(exIndex, 1);
    setEditedWorkout(updated);
  };

  // Action Submits
  const handleApprove = async () => {
    if (!selectedEntry || !selectedEntry.dietPlan) return;
    setError('');

    try {
      await api(`/admin/plans/${selectedEntry.dietPlan._id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          meals: editedMeals,
          workout: editedWorkout
        })
      });
      alert('Plan approved and active!');
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Failed to approve plan.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedEntry || !selectedEntry.dietPlan || !rejectReason.trim()) return;
    setError('');

    try {
      await api(`/admin/plans/${selectedEntry.dietPlan._id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason })
      });
      alert('Plan rejected and feedback sent to user.');
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Failed to reject plan.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        <p className="text-slate-400 text-sm">Loading clinical queue...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h2 className="text-3xl font-bold font-heading">Plan Review Queue</h2>
        <p className="text-slate-400 text-sm">Inspect health profiles and biomarkers. Edit and sign-off on AI-generated regimens.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-800 text-sm flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {queue.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center gap-4 max-w-lg mx-auto mt-6">
          <ClipboardList className="w-12 h-12 text-slate-600" />
          <h3 className="text-xl font-bold font-heading">Queue Clear</h3>
          <p className="text-slate-400 text-sm">There are no pending plans requiring clinical nutritionist intervention.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Queue List */}
          <div className={`lg:col-span-1 flex flex-col gap-4 ${selectedEntry ? 'hidden lg:flex' : 'flex'}`}>
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Review Pipeline ({queue.length})</h3>
            
            <div className="flex flex-col gap-3">
              {queue.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => selectEntry(item)}
                  className={`glass-panel p-5 cursor-pointer text-left transition-all ${
                    selectedEntry && selectedEntry._id === item._id 
                      ? 'border-amber-500 bg-amber-500/5 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <h4 className="font-bold text-slate-800">{item.user?.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">Hold: {item.reason}</p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Submitted: {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Editor Form */}
          {selectedEntry && (
            <div className={`lg:col-span-2 flex flex-col gap-6 ${selectedEntry ? 'flex' : 'hidden lg:flex'}`}>
              <button 
                onClick={() => setSelectedEntry(null)} 
                className="lg:hidden btn-secondary self-start text-xs flex items-center gap-1.5 mb-2 hover:text-emerald-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Review Pipeline
              </button>
              
              {/* Header Info Panel */}
              <div className="glass-panel p-6 flex flex-col gap-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-200 text-amber-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-slate-900">{selectedEntry.user?.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Email: {selectedEntry.user?.email}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-800 text-xs">
                  <strong>Trigger:</strong> {selectedEntry.reason}
                </div>
              </div>

              {/* Biomarkers Panel */}
              {selectedEntry.dietPlan?.basedOnReport && (
                <div className="glass-panel p-6 flex flex-col gap-3">
                  <h4 className="text-sm font-bold font-heading flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Patient Biomarkers (Lab Findings)
                  </h4>
                  
                  <div className="table-container border border-slate-100 rounded-lg overflow-hidden">
                    <table>
                      <thead>
                        <tr className="bg-slate-50">
                          <th>Test</th>
                          <th>Value</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntry.dietPlan.basedOnReport.biomarkers?.map((bio, index) => (
                          <tr key={index}>
                            <td className="font-semibold text-slate-700 text-xs">{bio.testName}</td>
                            <td className="text-slate-900 font-semibold text-xs">{bio.value} {bio.unit}</td>
                            <td>
                              <span className={`badge ${bio.status === 'normal' ? 'badge-normal' : 'badge-low'}`}>
                                {bio.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Meals Interactive Editor */}
              <div className="glass-panel p-6 flex flex-col gap-5">
                <h4 className="text-lg font-bold font-heading border-b border-slate-200 pb-2">Modify Diet Plan</h4>
                
                <div className="flex flex-col gap-6">
                  {editedMeals.map((meal, mealIdx) => (
                    <div key={mealIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-bold text-slate-800 text-sm font-heading">{meal.type}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            className="glass-input py-1 px-2 text-xs w-20 text-center"
                            value={meal.kcal}
                            onChange={(e) => handleMealKcalChange(mealIdx, e.target.value)}
                          />
                          <span className="text-xs text-slate-500">kcal</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {meal.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-2 items-center">
                            <input 
                              type="text"
                              className="glass-input py-1.5 px-3 text-xs flex-1"
                              value={item}
                              onChange={(e) => handleMealItemChange(mealIdx, itemIdx, e.target.value)}
                            />
                            <button 
                              onClick={() => removeMealItem(mealIdx, itemIdx)}
                              className="btn-secondary p-1.5 text-rose-600 hover:bg-rose-500/10 shrink-0"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addMealItem(mealIdx)}
                          className="btn-secondary py-1 text-xs justify-center flex items-center gap-1 mt-1 text-emerald-700 border-dashed"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Food Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout Interactive Editor */}
              <div className="glass-panel p-6 flex flex-col gap-5">
                <h4 className="text-lg font-bold font-heading border-b border-slate-200 pb-2">Modify Exercise Schedule</h4>
                
                <div className="flex flex-col gap-5">
                  {editedWorkout.map((day, dayIdx) => (
                    <div key={dayIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{day.day}</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-0.5">{day.focus}</h4>
                      </div>

                      <div className="flex flex-col gap-2">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="flex gap-2 items-center">
                            <input 
                              type="text"
                              className="glass-input py-1.5 px-3 text-xs flex-1"
                              value={ex}
                              onChange={(e) => handleExerciseChange(dayIdx, exIdx, e.target.value)}
                            />
                            <button 
                              onClick={() => removeExercise(dayIdx, exIdx)}
                              className="btn-secondary p-1.5 text-rose-600 hover:bg-rose-500/10 shrink-0"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addExercise(dayIdx)}
                          className="btn-secondary py-1 text-xs justify-center flex items-center gap-1 mt-1 text-emerald-700 border-dashed"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Exercise
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign-off Actions Bar */}
              <div className="glass-panel p-6 flex flex-col gap-4 border border-slate-200 bg-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold font-heading text-sm text-slate-900">Clinical Approval Sign-Off</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Please review your changes carefully before approving. These changes modify the active plan.</p>
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50 py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                    >
                      <X className="w-4 h-4" /> Reject Plan
                    </button>
                    <button 
                      onClick={handleApprove}
                      className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                    >
                      <Check className="w-4 h-4" /> Approve & Release
                    </button>
                  </div>
                </div>

                {/* Reject Reason Form Drawer */}
                {showRejectForm && (
                  <form onSubmit={handleReject} className="flex flex-col gap-3 pt-4 border-t border-slate-200 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Rejection & Adjustment Notes</label>
                      <textarea 
                        required
                        className="glass-input min-h-[80px]"
                        placeholder="Explain why this plan was rejected or what modifications are necessary..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn-primary bg-rose-600 hover:bg-rose-700 shadow-rose-500/10 text-xs py-2 self-end px-5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Submit Rejection
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewQueue;
