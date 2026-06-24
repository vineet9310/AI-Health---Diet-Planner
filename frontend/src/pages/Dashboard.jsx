import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Apple, 
  Dumbbell, 
  AlertTriangle, 
  Clock, 
  RotateCw,
  TrendingUp,
  FileText,
  User,
  Utensils,
  Plus
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import Disclaimer from '../components/Disclaimer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ user }) => {
  const [activePlan, setActivePlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('lipids'); // 'lipids', 'thyroid', 'risk'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const fetchPlans = async () => {
    try {
      const data = await api('/plans/current');
      setActivePlan(data.activePlan);
      setPendingPlan(data.pendingPlan);
    } catch (err) {
      setError(err.message || 'Failed to retrieve active plan.');
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api('/reports');
      setReports(data || []);
    } catch (err) {
      console.error('Failed to retrieve medical reports history:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchReports()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure you want to regenerate your AI plan? This will replace your current plan.')) return;
    
    setError('');
    setRegenerating(true);

    try {
      const response = await api('/plans/generate', {
        method: 'POST'
      });

      if (response.requiresReview) {
        alert('Your plan was generated successfully, but since you have high-risk markers/conditions, it has been routed to our nutritionist for clinical review.');
      } else {
        alert('Plan generated successfully!');
      }
      await fetchPlans();
    } catch (err) {
      if (err.status === 422 && err.data?.safetyBlock) {
        setError('Safety Block: Your medical biomarkers are flagged as critical. Please seek professional medical attention before proceeding.');
      } else {
        setError(err.message || 'Failed to regenerate plan.');
      }
    } finally {
      setRegenerating(false);
    }
  };

  // Helper to extract value
  const getBiomarkerValue = (report, testName) => {
    const marker = report.biomarkers?.find(
      b => b.testName.toLowerCase() === testName.toLowerCase()
    );
    return marker ? marker.value : null;
  };

  // Filter and sort reports chronologically
  const sortedReports = [...reports]
    .filter(r => r.analysisStatus === 'processed')
    .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

  const chartLabels = sortedReports.map(r => 
    new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
  );

  let datasets = [];

  if (activeTab === 'lipids') {
    datasets = [
      {
        label: 'LDL Cholesterol (mg/dL)',
        data: sortedReports.map(r => getBiomarkerValue(r, 'LDL Cholesterol')),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#f43f5e',
        fill: false,
      },
      {
        label: 'HDL Cholesterol (mg/dL)',
        data: sortedReports.map(r => getBiomarkerValue(r, 'HDL Cholesterol')),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#10b981',
        fill: false,
      },
      {
        label: 'Total Cholesterol (mg/dL)',
        data: sortedReports.map(r => getBiomarkerValue(r, 'Total Cholesterol')),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#6366f1',
        fill: false,
      }
    ];
  } else if (activeTab === 'thyroid') {
    datasets = [
      {
        label: 'TSH (mIU/L)',
        data: sortedReports.map(r => getBiomarkerValue(r, 'TSH')),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#a855f7',
        fill: true,
      }
    ];
  } else if (activeTab === 'risk') {
    datasets = [
      {
        label: 'Clinical Risk Score (0-100)',
        data: sortedReports.map(r => r.riskScore || 0),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#f97316',
        fill: true,
      }
    ];
  }

  const biomarkerChartData = {
    labels: chartLabels,
    datasets: datasets.filter(ds => ds.data.some(val => val !== null))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#475569',
          font: { family: 'Plus Jakarta Sans', weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        padding: 12,
        borderRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500 text-sm">Building dashboard interface...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      
      {/* Welcome Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-heading">Health Dashboard</h2>
          <p className="text-slate-500 text-sm">Welcome back, <span className="text-emerald-700 font-semibold">{user.name}</span>. Here is your active daily regimen.</p>
        </div>

        {activePlan && (
          <button 
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-2 hover:border-emerald-600 hover:text-emerald-700"
          >
            <RotateCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate Plan
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-500/5 text-rose-700 text-sm flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Review Safeguard Banner */}
      {pendingPlan && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-500/5 text-amber-800 text-sm flex gap-3 items-start">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="font-bold text-amber-950 mb-0.5">Clinical Review In Progress</h4>
            <p className="opacity-95 leading-relaxed">
              Your latest diet/exercise adjustments have triggered safety flags (e.g. medical history or abnormal biomarkers) and are currently queued for verification by a licensed dietitian/nutritionist. Your active plan will update immediately upon approval.
            </p>
          </div>
        </div>
      )}

      {!activePlan && !pendingPlan ? (
        /* Empty State */
        <div className="glass-panel p-12 text-center flex flex-col items-center gap-6 max-w-2xl mx-auto mt-6">
          <Apple className="w-16 h-16 text-slate-400 animate-pulse" />
          <div>
            <h3 className="text-2xl font-bold font-heading mb-2">No Active Health Plan</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
              To formulate calorie ceilings, macro breakdowns, meals, and exercise plans, you need to configure your health profile and analyze a clinical medical report.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
            <Link to="/profile" className="btn-secondary py-3 px-6 text-sm flex items-center gap-2">
              <User className="w-4 h-4" /> Setup Profile
            </Link>
            <Link to="/reports" className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Report
            </Link>
          </div>
        </div>
      ) : (
        /* Active Plan View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Summary Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Calories Card */}
            <div className="glass-panel p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-100">
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-200 text-emerald-700">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Daily Target Energy</p>
                <h3 className="text-3xl font-extrabold font-heading text-slate-900">{activePlan.dailyCalories || 2000} <span className="text-sm font-normal text-slate-500">kcal</span></h3>
              </div>
            </div>

            {/* Macros Card */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold font-heading flex items-center gap-2 pb-3 border-b border-slate-100">
                <Utensils className="w-5 h-5 text-emerald-700" />
                Macronutrient Balance
              </h3>
              
              <div className="flex flex-col gap-4">
                {/* Protein */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Protein Target</span>
                    <span className="text-slate-900">{activePlan.macros?.protein || 0}g</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                {/* Carbs */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Carbohydrates Target</span>
                    <span className="text-slate-900">{activePlan.macros?.carbs || 0}g</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                {/* Fats */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Dietary Fats Target</span>
                    <span className="text-slate-900">{activePlan.macros?.fat || 0}g</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flags Considered */}
            {activePlan.flagsConsidered && activePlan.flagsConsidered.length > 0 && (
              <div className="glass-panel p-6 flex flex-col gap-3">
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Health Considerations Integrated</h4>
                <div className="flex flex-wrap gap-2">
                  {activePlan.flagsConsidered.map((flag, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Disclaimer />
          </div>

          {/* Right/Middle: Meal Plans & Workouts */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Meal Schedule */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                <Apple className="w-5 h-5 text-emerald-600" />
                Custom Daily Meal Plan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlan.meals?.map((meal, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 font-heading">{meal.type}</span>
                      <span className="text-xs font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/50">{meal.kcal} kcal</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-600 flex flex-col gap-1.5 mt-1">
                      {meal.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout Routine */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-600" />
                Weekly Workout Schedule
              </h3>
              
              <div className="flex flex-col gap-4">
                {activePlan.workout?.map((work, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-3">
                    <div className="min-w-[120px]">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">{work.day}</span>
                      <h4 className="font-bold text-slate-800 font-heading text-sm mt-0.5">{work.focus}</h4>
                    </div>
                    <div className="flex-1">
                      <ul className="text-xs text-slate-600 flex flex-wrap gap-2">
                        {work.exercises.map((ex, exIdx) => (
                          <li key={exIdx} className="bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Historical Biomarker Trends */}
      {sortedReports && sortedReports.length > 0 && (
        <div className="glass-panel p-6 flex flex-col gap-5 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xl font-bold font-heading flex items-center gap-2 text-slate-900">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Historical Biomarker Trends
              </h3>
              <p className="text-slate-500 text-xs">Track your biometric markers and risk trajectory chronologically across reports.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('lipids')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeTab === 'lipids'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Lipids
              </button>
              <button
                onClick={() => setActiveTab('thyroid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeTab === 'thyroid'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thyroid (TSH)
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeTab === 'risk'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Risk Index
              </button>
            </div>
          </div>

          {sortedReports.length < 2 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center gap-2">
              <p className="text-slate-500 text-sm font-medium">Single report uploaded ({sortedReports[0].fileName || 'unnamed'})</p>
              <p className="text-slate-400 text-xs max-w-sm">
                To visualize lines showing cholesterol trends and risk improvements, upload more reports over time under the <Link to="/reports" className="text-emerald-700 underline font-semibold">Reports</Link> tab.
              </p>
            </div>
          ) : (
            <div className="h-[280px] relative w-full mt-2">
              <Line data={biomarkerChartData} options={chartOptions} />
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
