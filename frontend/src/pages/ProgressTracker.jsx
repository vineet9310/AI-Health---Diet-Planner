import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Scale, CheckSquare, Calendar, Award, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import api from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProgressTracker = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [weightKg, setWeightKg] = useState('');
  const [mealsFollowed, setMealsFollowed] = useState(4);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchProgress = async () => {
    try {
      const data = await api('/progress');
      setLogs(data);
      
      // Auto-prefill weight with latest log if exists
      if (data.length > 0) {
        const latest = data[data.length - 1];
        setWeightKg(latest.weightKg || '');
      }
    } catch (err) {
      console.error('Failed to retrieve progress logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api('/progress/log', {
        method: 'POST',
        body: JSON.stringify({
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          mealsFollowed: parseInt(mealsFollowed),
          workoutCompleted,
          notes,
          date: logDate
        })
      });
      setSuccess('Progress logged successfully!');
      setNotes('');
      await fetchProgress();
    } catch (err) {
      setError(err.message || 'Failed to submit progress log.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare weight chart data
  const weightChartData = {
    labels: logs.map(log => new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Weight (kg)',
        data: logs.map(log => log.weightKg),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#10b981',
        fill: true,
      }
    ]
  };

  // Prepare meal compliance chart data
  const mealChartData = {
    labels: logs.map(log => new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Meals Followed (out of 4)',
        data: logs.map(log => log.mealsFollowed),
        backgroundColor: '#06b6d4',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b' }
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h2 className="text-3xl font-bold font-heading">Progress Tracker</h2>
        <p className="text-slate-400 text-sm">Log daily biometric data and track nutritional & physical adherence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Log Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Daily Check-in
            </h3>

            {error && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-800 text-sm flex gap-2 items-center">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 text-sm flex gap-2 items-center">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLog} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Check-in Date</label>
                <input 
                  type="date"
                  className="glass-input"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Weight (kg)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    className="glass-input pr-12"
                    placeholder="e.g. 70.4"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                  <Scale className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meals Followed Today</label>
                <select 
                  className="glass-input cursor-pointer"
                  value={mealsFollowed}
                  onChange={(e) => setMealsFollowed(e.target.value)}
                >
                  <option value={4}>All 4 Meals (100% adherence)</option>
                  <option value={3}>3 Meals (75% adherence)</option>
                  <option value={2}>2 Meals (50% adherence)</option>
                  <option value={1}>1 Meal (25% adherence)</option>
                  <option value={0}>0 Meals (Cheated / Off-track)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:border-slate-300 transition-all">
                <input 
                  type="checkbox" 
                  className="accent-emerald-500 h-4 w-4 rounded" 
                  checked={workoutCompleted}
                  onChange={(e) => setWorkoutCompleted(e.target.checked)}
                />
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Workout Completed</span>
                </div>
              </label>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes & Comments</label>
                <textarea 
                  className="glass-input min-h-[80px]"
                  placeholder="How did you feel today? Any custom foods?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Log Entry'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Charts & Trends Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Weight Line Chart */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Weight Progress Trend
            </h3>
            
            {logs.length < 2 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                Log progress for at least 2 days to render weight trajectory charts.
              </div>
            ) : (
              <div className="h-[250px] relative w-full">
                <Line data={weightChartData} options={chartOptions} />
              </div>
            )}
          </div>

          {/* Meals Compliance Bar Chart */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Nutritional Plan Adherence
            </h3>
            
            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No logs recorded. Log check-ins to track compliance charts.
              </div>
            ) : (
              <div className="h-[200px] relative w-full">
                <Bar data={mealChartData} options={chartOptions} />
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProgressTracker;
