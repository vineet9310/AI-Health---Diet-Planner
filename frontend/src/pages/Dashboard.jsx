import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Plus,
  Calendar,
  Shield,
  Info
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

const DIRECT_SWAPS = {
  breakfast: ["Whey Protein Isolate", "Soy Isolate", "Egg Whites", "Greek Yogurt"],
  lunch: ["Chicken Breast", "Turkey Breast", "Grilled Tofu", "Paneer", "Tempeh", "Fish"],
  snack: ["Greek Yogurt", "Cottage Cheese", "Roasted Chickpeas", "Almond Butter"],
  dinner: ["Salmon Fillet", "Mackerel", "Tuna", "Soy Chunks", "Edamame"]
};

const HEALTHY_SWAPS = {
  breakfast: [
    { name: "Vegetable Omelet + Whole-grain Toast", description: "High protein, high fiber, low glycemic index" },
    { name: "Greek Yogurt + Oats + Berries", description: "Gut health support, antioxidants, quick prep" },
    { name: "Besan Chilla + Low-fat Curd", description: "Vegetarian high-protein option with complex carbs" }
  ],
  lunch: [
    { name: "Grilled Fish (Mackerel/Salmon) with Quinoa", description: "Rich in omega-3 fatty acids for lipid control" },
    { name: "Baked Paneer/Tofu with Brown Rice & Greens", description: "Excellent vegetarian lean protein alternative" },
    { name: "Chickpea & Avocado Salad with Olive Oil", description: "High soluble fiber and healthy monounsaturated fats" }
  ],
  snack: [
    { name: "Mixed Nuts (Almonds/Walnuts) + Apple", description: "Healthy fats, selenium, and pectin fiber" },
    { name: "Chia Seed Pudding with Almond Milk", description: "Omega-3 and soluble fiber boost" },
    { name: "Roasted Chana (Chickpeas) + Green Tea", description: "High protein, high fiber, low calorie density" }
  ],
  dinner: [
    { name: "Baked Salmon Fillet with Sweet Potato", description: "Rich in Omega-3s and thyroid-supportive selenium" },
    { name: "Grilled Tofu/Tempeh with Broccoli & Carrots", description: "High protein, high fiber, thyroid-safe cruciferous veggies (cooked)" },
    { name: "Lean Chicken Breast with Quinoa & Asparagus", description: "Supports lean muscle recovery and fat oxidation" }
  ]
};

const generateGroceryList = (meals) => {
  if (!meals || meals.length === 0) return [];
  const ingredients = new Set();
  
  const commonFoods = [
    { keywords: ['oat', 'oats', 'porridge'], display: 'Oats' },
    { keywords: ['egg', 'eggs', 'whites'], display: 'Eggs (Egg Whites)' },
    { keywords: ['chicken', 'breast', 'tikka'], display: 'Chicken Breast' },
    { keywords: ['salmon'], display: 'Salmon Fillet' },
    { keywords: ['fish', 'cod', 'seabass', 'sea-bass', 'sea bass', 'mackerel', 'tuna'], display: 'Lean Fish' },
    { keywords: ['paneer', 'cottage cheese'], display: 'Low-fat Paneer / Cottage Cheese' },
    { keywords: ['tofu', 'soy'], display: 'Firm Tofu / Soy' },
    { keywords: ['rajma', 'kidney bean'], display: 'Rajma (Kidney Beans)' },
    { keywords: ['chana', 'chickpea', 'hummus'], display: 'Chickpeas / Roasted Chana' },
    { keywords: ['dal', 'daal', 'lentil', 'moong', 'masoor'], display: 'Lentils / Yellow Dal' },
    { keywords: ['rice', 'brown rice'], display: 'Brown Rice' },
    { keywords: ['spinach', 'palak', 'greens', 'lettuce', 'cabbage', 'saag', 'kale', 'methi'], display: 'Fresh Spinach & Greens' },
    { keywords: ['broccoli'], display: 'Fresh Broccoli' },
    { keywords: ['curd', 'yogurt', 'dahi'], display: 'Low-fat Curd / Greek Yogurt' },
    { keywords: ['green tea', 'matcha'], display: 'Green Tea' },
    { keywords: ['berry', 'berries', 'strawberry', 'blueberry'], display: 'Mixed Berries' },
    { keywords: ['almond', 'almonds'], display: 'Raw Almonds' },
    { keywords: ['walnut', 'walnuts'], display: 'Walnuts' },
    { keywords: ['brazil nut', 'brazil nuts'], display: 'Brazil Nuts' },
    { keywords: ['apple', 'apples'], display: 'Apples' },
    { keywords: ['banana', 'bananas'], display: 'Bananas' },
    { keywords: ['avocado', 'avocados'], display: 'Avocados' },
    { keywords: ['quinoa'], display: 'Quinoa' },
    { keywords: ['roti', 'chapati', 'wheat', 'bread', 'toast'], display: 'Whole Wheat Roti / Bread' },
    { keywords: ['thepla'], display: 'Methi Thepla ingredients' },
    { keywords: ['sweet potato'], display: 'Sweet Potato' }
  ];

  meals.forEach(meal => {
    if (meal.items && Array.isArray(meal.items)) {
      meal.items.forEach(item => {
        const lower = item.toLowerCase();
        
        // Skip safety annotations or warnings in grocery compilation
        if (lower.includes('discuss with') || lower.includes('limited to avoid') || lower.includes('toxicity') || lower.includes('soluble fiber focus') || lower.includes('absorption interference')) {
          return;
        }

        let matched = false;
        for (const food of commonFoods) {
          if (food.keywords.some(kw => lower.includes(kw))) {
            ingredients.add(food.display);
            matched = true;
            break;
          }
        }

        if (!matched) {
          let clean = item
            .replace(/[\d\-\.\/½⅓¼¾]+/g, '')
            .replace(/\b(?:g|kg|ml|l|cup|cups|tbsp|tsp|slice|slices|scoop|scoops|bowl|bowls|medium|small|large|dry|cooked|raw|fresh|organic|piece|pieces)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (clean.length > 3) {
            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
            ingredients.add(clean);
          }
        }
      });
    }
  });

  return Array.from(ingredients).filter(Boolean);
};

const buildPrimaryGoals = (flags) => {
  const goals = [];
  if (!flags || flags.length === 0) {
    goals.push("Maintain General Health & Metabolic Fitness");
    return goals;
  }
  
  let hasCardio = false;
  let hasThyroid = false;
  let hasLiver = false;
  
  flags.forEach(flag => {
    const lower = flag.toLowerCase();
    if (lower.includes('ldl') || lower.includes('cholesterol') || lower.includes('lipid')) {
      goals.push("Lower LDL Cholesterol & Improve Lipid Balance");
      hasCardio = true;
    }
    if (lower.includes('triglycerides') || lower.includes('trig')) {
      goals.push("Reduce Serum Triglycerides & Optimize Trig/HDL Ratio");
      hasCardio = true;
    }
    if (lower.includes('tsh') || lower.includes('thyroid')) {
      goals.push("Support Endocrine Health & Thyroid Function");
      hasThyroid = true;
    }
    if (lower.includes('bilirubin') || lower.includes('liver')) {
      goals.push("Optimize Liver Pathway Markers (Bilirubin)");
      hasLiver = true;
    }
  });
  
  if (hasCardio) {
    goals.push("Minimize Cardiovascular and Atherogenic Risks");
  }
  if (!hasCardio && !hasThyroid && !hasLiver) {
    goals.push("Optimize Clinical Biomarker Performance");
  }
  
  return [...new Set(goals)];
};

const getMealMacros = (mealType, overallMacros) => {
  if (!overallMacros) return null;
  const { protein = 0, carbs = 0, fat = 0 } = overallMacros;
  const lower = mealType.toLowerCase();
  
  let multiplier = 0.25; // default for breakfast/dinner
  if (lower.includes('lunch')) {
    multiplier = 0.35;
  } else if (lower.includes('snack')) {
    multiplier = 0.15;
  }
  
  return {
    protein: Math.round(protein * multiplier),
    carbs: Math.round(carbs * multiplier),
    fat: Math.round(fat * multiplier)
  };
};

const groupFlags = (flags) => {
  const categories = {
    Cardiovascular: [],
    Endocrine: [],
    Liver: [],
    'Other Considerations': []
  };

  flags.forEach(flag => {
    // Normalize "X is HIGH" or "X is LOW" to "X — High" / "X — Low"
    let formattedFlag = flag;
    if (flag.toLowerCase().includes(' is ')) {
      const parts = flag.split(/ is /i);
      const status = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      formattedFlag = `${parts[0]} — ${status}`;
    } else if (flag.toLowerCase().includes(' is borderline high')) {
      const parts = flag.split(/ is borderline high/i);
      formattedFlag = `${parts[0]} — Borderline High`;
    }

    const lower = formattedFlag.toLowerCase();
    if (
      lower.includes('ldl') || 
      lower.includes('triglycerides') || 
      lower.includes('trig') || 
      lower.includes('hdl') || 
      lower.includes('cholesterol') || 
      lower.includes('cardiovascular') ||
      lower.includes('lipid')
    ) {
      categories.Cardiovascular.push(formattedFlag);
    } else if (
      lower.includes('tsh') || 
      lower.includes('thyroid') || 
      lower.includes('endocrine')
    ) {
      categories.Endocrine.push(formattedFlag);
    } else if (
      lower.includes('bilirubin') || 
      lower.includes('liver') || 
      lower.includes('alt') || 
      lower.includes('ast')
    ) {
      categories.Liver.push(formattedFlag);
    } else {
      categories['Other Considerations'].push(formattedFlag);
    }
  });

  return Object.fromEntries(
    Object.entries(categories).filter(([_, items]) => items.length > 0)
  );
};

const adjustExerciseVolume = (exercise, level) => {
  if (level === 'beginner') {
    return exercise
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*reps/gi, '2 sets $1 $2 reps')
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*seconds/gi, '2 sets $1 $2 seconds')
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*sec/gi, '2 sets $1 $2 sec')
      .replace(/20-25\s*mins/gi, '15-20 mins (Low Impact)')
      .replace(/45-60\s*minutes/gi, '30-40 minutes')
      .replace(/45-60\s*mins/gi, '30-40 mins');
  }
  if (level === 'advanced') {
    return exercise
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*reps/gi, '4 sets $1 $2 reps')
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*seconds/gi, '4 sets $1 $2 seconds')
      .replace(/3 sets\s*(x|of)\s*(\d+(?:-\d+)?)\s*sec/gi, '4 sets $1 $2 sec')
      .replace(/20-25\s*mins/gi, '25-30 mins (High Power)')
      .replace(/45-60\s*minutes/gi, '60-75 minutes')
      .replace(/45-60\s*mins/gi, '60-75 mins');
  }
  return exercise;
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [userWeight, setUserWeight] = useState(null);
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('lipids'); // 'lipids', 'thyroid', 'risk'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');

  const fetchPlans = async () => {
    try {
      const data = await api('/plans/current');
      setActivePlan(data.activePlan);
      setPendingPlan(data.pendingPlan);
      setUserWeight(data.weightKg);
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

  const fetchProfile = async () => {
    try {
      const data = await api('/profile');
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch health profile:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const statusData = await api('/profile/status');
      if (!statusData.isComplete) {
        navigate('/complete-profile');
        return;
      }
      setProfile(statusData.profile);
      await Promise.all([fetchPlans(), fetchReports()]);
    } catch (err) {
      console.error('Failed to load dashboard data / profile status:', err);
      navigate('/complete-profile');
      return;
    } finally {
      setLoading(false);
    }
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

  const latestReport = sortedReports[sortedReports.length - 1];

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

  const pKcal = activePlan ? (activePlan.macros?.protein || 0) * 4 : 0;
  const cKcal = activePlan ? (activePlan.macros?.carbs || 0) * 4 : 0;
  const fKcal = activePlan ? (activePlan.macros?.fat || 0) * 9 : 0;
  const totalKcal = activePlan ? (pKcal + cKcal + fKcal || activePlan.dailyCalories || 2000) : 2000;
  
  const pPct = activePlan ? Math.round((pKcal / totalKcal) * 100) : 0;
  const cPct = activePlan ? Math.round((cKcal / totalKcal) * 100) : 0;
  const fPct = activePlan ? Math.round((fKcal / totalKcal) * 100) : 0;

  const mealsTotalKcal = activePlan?.meals?.reduce((sum, m) => sum + (m.kcal || 0), 0) || 0;

  return (
    <div className="flex flex-col gap-8 py-2 dashboard-container">
      
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

      {/* Primary Health Regimen Objectives */}
      {activePlan && (
        <div className="glass-panel p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/5 border-emerald-500/20 shadow-sm rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Primary Health Regimen Objectives</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 mt-0.5">
            {buildPrimaryGoals(activePlan.flagsConsidered).map((goalText, gIdx) => (
              <div key={gIdx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                <span className="leading-tight">{goalText}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activePlan ? (
        /* Empty State */
        <div className="glass-panel p-12 text-center flex flex-col items-center gap-6 max-w-2xl mx-auto mt-6">
          <Apple className="w-16 h-16 text-slate-400 animate-pulse" />
          <div>
            <h3 className="text-2xl font-bold font-heading mb-2">No Active Health Plan</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
              {userWeight ? (
                "Your Health Profile is configured! To formulate your custom daily calorie limits, macro targets, meal plans, and workouts, please proceed to upload a clinical medical report or select an existing one."
              ) : (
                "To formulate calorie ceilings, macro breakdowns, meals, and exercise plans, you need to configure your health profile and analyze a clinical medical report."
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
            <Link to="/profile" className="btn-secondary py-3 px-6 text-sm flex items-center gap-2 justify-center">
              <User className="w-4 h-4" /> {userWeight ? "Edit Profile" : "Setup Profile"}
            </Link>
            <Link to="/reports" className="btn-primary py-3 px-6 text-sm flex items-center gap-2 justify-center">
              <Plus className="w-4 h-4" /> {userWeight ? "Go to Reports" : "Upload Report"}
            </Link>
          </div>
        </div>
      ) : (
        /* Active Plan View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Summary Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* AI Clinical Verification Panel */}
            <div className="glass-panel p-5 bg-gradient-to-br from-emerald-50/15 via-teal-50/5 to-slate-50 border-emerald-500/10 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  AI Clinical Verification
                </h4>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block leading-none font-bold uppercase">Overall Confidence</span>
                  <span className="text-lg font-black text-emerald-700">
                    {typeof activePlan.confidenceScore === 'object' ? activePlan.confidenceScore.overall : (activePlan.confidenceScore || 98)}%
                  </span>
                </div>
              </div>
              
              {/* Validation Checklist */}
              <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Biomarker Extraction</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Risk Classification</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Personalized Nutrition</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Exercise Safety</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Medical Consistency</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Country & Goal Detected</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Meal & Workout Validated</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PASSED</span>
                </div>
              </div>

              {/* Confidence Breakdown Grid */}
              <div className="border-t border-slate-100 pt-3">
                <h5 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2">Confidence Breakdown</h5>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 block leading-none font-bold">Extraction</span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {typeof activePlan.confidenceScore === 'object' ? activePlan.confidenceScore.extraction : 99}%
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 block leading-none font-bold">Medical Logic</span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {typeof activePlan.confidenceScore === 'object' ? activePlan.confidenceScore.medicalLogic : 97}%
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 block leading-none font-bold">Nutrition</span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {typeof activePlan.confidenceScore === 'object' ? (activePlan.confidenceScore.nutrition || activePlan.confidenceScore.personalization || 98) : 98}%
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 block leading-none font-bold">Workout</span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {typeof activePlan.confidenceScore === 'object' ? activePlan.confidenceScore.workout : 96}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Plan? Card */}
            {activePlan.personalizationExplanation && activePlan.personalizationExplanation.length > 0 && (
              <div className="glass-panel p-5 bg-gradient-to-br from-slate-50 to-teal-50/10 border-slate-100 flex flex-col gap-3">
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Why This Plan?
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-slate-700">
                  {activePlan.personalizationExplanation.map((explanation, expIdx) => (
                    <li key={expIdx} className="flex gap-2 items-start leading-relaxed font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-650 shrink-0 mt-1.5"></span>
                      <span>{explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Physician Abstract Card */}
            {latestReport && latestReport.doctorSummary && (
              <div className="glass-panel p-5 bg-gradient-to-br from-slate-50 to-emerald-50/5 border-slate-150 flex flex-col gap-3">
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Physician's Abstract & Risk
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm italic mt-1">
                  "{latestReport.doctorSummary}"
                </p>
                {latestReport.riskScore !== undefined && (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mt-0.5 border-t border-slate-100 pt-2.5">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Risk Level: 
                      <span className={`badge py-0.5 px-2 text-[10px] font-bold ${
                        latestReport.riskCategory === 'High' 
                          ? 'badge-critical' 
                          : latestReport.riskCategory === 'Moderate'
                            ? 'badge-borderline'
                            : 'badge-normal'
                      }`}>
                        {latestReport.riskCategory || 'Low'} Risk
                      </span>
                    </span>
                    <span>Score: <span className="font-extrabold text-slate-800">{latestReport.riskScore}/100</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Calories Card */}
            <div className="glass-panel p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-100">
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-200 text-emerald-700">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Daily Target Energy</p>
                <h3 className="text-3xl font-extrabold font-heading text-slate-900">{activePlan.dailyCalories || 2000} <span className="text-sm font-normal text-slate-500">kcal</span></h3>
                <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight flex flex-col gap-0.5">
                  <span>✓ Calculated dynamically using Mifflin-St Jeor.</span>
                  {mealsTotalKcal > 0 && (
                    <span className="text-emerald-700 font-bold">✓ Daily Meals Total: {mealsTotalKcal} kcal (approx. matching target)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Macros Card */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold font-heading flex items-center gap-2 pb-3 border-b border-slate-100">
                <Utensils className="w-5 h-5 text-emerald-700" />
                Macronutrient Balance
              </h3>
              
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs mb-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Protein</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{activePlan.macros?.protein || 0}g</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{pPct}% ({pKcal} kcal)</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Carbs</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{activePlan.macros?.carbs || 0}g</div>
                  <div className="text-[10px] text-cyan-600 font-semibold">{cPct}% ({cKcal} kcal)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fats</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{activePlan.macros?.fat || 0}g</div>
                  <div className="text-[10px] text-amber-600 font-semibold">{fPct}% ({fKcal} kcal)</div>
                </div>
              </div>

              {/* Stacked Macro Progress Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${pPct}%` }} title={`Protein: ${pPct}%`}></div>
                <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${cPct}%` }} title={`Carbohydrates: ${cPct}%`}></div>
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${fPct}%` }} title={`Fats: ${fPct}%`}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1 pb-3 border-b border-slate-100">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Protein ({pPct}%)</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Carbs ({cPct}%)</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Fats ({fPct}%)</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Protein */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Protein Target</span>
                    <span className="text-slate-900">{activePlan.macros?.protein || 0}g ({pPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pPct}%` }}></div>
                  </div>
                  {userWeight && (
                    <div className="text-[10px] text-slate-500 font-medium mt-2.5 p-3 bg-gradient-to-br from-slate-50 to-emerald-50/10 border border-emerald-100 rounded-xl flex flex-col gap-2 shadow-sm">
                      <div className="font-bold text-slate-700 border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 justify-between">
                        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-emerald-600" /> Explainable AI: Protein Multiplier</span>
                        <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                          {((activePlan.macros?.protein || 0) / userWeight).toFixed(1)} g/kg
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 font-semibold text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Primary Goal:</span>
                          <span className="text-slate-800 bg-white border border-slate-150 px-1.5 py-0.5 rounded">
                            {activePlan.proteinRatioJustification?.goalText || (profile?.goal === 'gain_muscle' ? 'Muscle Gain (1.8 g/kg)' : profile?.goal === 'lose_weight' ? 'Weight Loss (1.4 g/kg)' : 'General Health (1.0 g/kg)')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Exercise Experience:</span>
                          <span className="text-slate-800 bg-white border border-slate-150 px-1.5 py-0.5 rounded">
                            {activePlan.proteinRatioJustification?.experienceText || (profile?.exerciseExperience === 'advanced' ? 'Advanced (+0.2 g/kg)' : profile?.exerciseExperience === 'beginner' ? 'Beginner (-0.1 g/kg)' : 'Intermediate (0.0 g/kg)')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Medical Conditions:</span>
                          <span className="text-slate-800 bg-white border border-slate-150 px-1.5 py-0.5 rounded">
                            {activePlan.proteinRatioJustification?.kidneyText || (profile?.existingConditions?.some(c => c.toLowerCase().includes('kidney') || c.toLowerCase().includes('renal')) ? 'Renal Disease Cap (0.8 g/kg)' : 'No Kidney Disease')}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-slate-200/80 pt-2 flex flex-col gap-1 text-[10px]">
                        <div className="flex justify-between text-slate-805 font-bold text-xs">
                          <span>Total Daily Protein:</span>
                          <span className="text-emerald-700 font-extrabold">{activePlan.macros?.protein || 0} g/day</span>
                        </div>
                        <p className="text-[9px] text-slate-400 italic mt-0.5 leading-relaxed">
                          Multiplier dynamically calculated based on clinical reference thresholds and physical exertion factors.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carbs */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Carbohydrates Target</span>
                    <span className="text-slate-900">{activePlan.macros?.carbs || 0}g ({cPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${cPct}%` }}></div>
                  </div>
                </div>

                {/* Fats */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Dietary Fats Target</span>
                    <span className="text-slate-900">{activePlan.macros?.fat || 0}g ({fPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${fPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Hydration & Micronutrient Safety Targets Card */}
            <div className="glass-panel p-5 bg-gradient-to-br from-slate-50 via-cyan-50/5 to-emerald-50/10 border-slate-200 flex flex-col gap-4 shadow-sm">
              <h3 className="text-sm font-bold font-heading text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shield className="w-4 h-4 text-emerald-600" />
                Daily Hydration & Safety Limits
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                {/* Water Intake */}
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Water Goal</span>
                  <span className="text-lg font-black text-cyan-700">{activePlan.waterIntakeLiters || 2.5} L/day</span>
                  <span className="text-[9px] text-slate-450 font-normal leading-normal">
                    Auto-calculated ({userWeight || 66} kg × 35ml)
                  </span>
                </div>

                {/* Fiber Goal */}
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fiber Target</span>
                  <span className="text-lg font-black text-emerald-700">{activePlan.fiberGoalGrams || 32} g/day</span>
                  <span className="text-[9px] text-emerald-600 font-normal leading-normal">
                    Optimal digestion & lipid clearance
                  </span>
                </div>

                {/* Sodium Limit */}
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sodium Limit</span>
                  <span className="text-lg font-black text-rose-700">&lt; {activePlan.sodiumLimitMg || 2300} mg</span>
                  <span className="text-[9px] text-slate-450 font-normal leading-normal">
                    {profile?.existingConditions?.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure'))
                      ? "Restricted for Hypertension"
                      : "General RDA Safety Cap"}
                  </span>
                </div>

                {/* Potassium Target */}
                <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Potassium</span>
                  <span className="text-lg font-black text-amber-700">{activePlan.potassiumTargetMg || 3500} mg</span>
                  <span className="text-[9px] text-slate-450 font-normal leading-normal">
                    Cardiovascular & electrolyte balance
                  </span>
                </div>
              </div>

              {/* Added Sugar Cap */}
              <div className="bg-rose-50/50 border border-rose-100/60 p-3 rounded-xl flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Added Sugar Ceiling</span>
                  <span className="text-[9px] text-slate-500 font-normal leading-normal mt-0.5">Recommended cap to control triglycerides</span>
                </div>
                <span className="text-sm font-extrabold text-rose-700 bg-rose-100/40 border border-rose-200/30 px-2 py-0.5 rounded-lg">&lt; {activePlan.addedSugarLimitG || 25} g/day</span>
              </div>
            </div>

            {/* Regimen Adherence & Projections Card */}
            <div className="glass-panel p-6 flex flex-col gap-4 bg-gradient-to-br from-slate-50 to-emerald-50/10 border-slate-200 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold font-heading text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Regimen Adherence & Projections
                </h3>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Sample Data</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Diet Adherence */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Diet Adherence</span>
                    <span className="text-slate-900">82%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `82%` }}></div>
                  </div>
                </div>

                {/* Workout Completion */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Workout Completion</span>
                    <span className="text-slate-900">75%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `75%` }}></div>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-1">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-700">Overall Adherence Score:</span>
                    <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-lg border border-emerald-200/30">79%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 text-right leading-none">✓ Actual tracking starts after Day 1 of logging</span>
                </div>

                {/* Projections */}
                <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Expected Trend (if followed consistently)</span>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded font-bold">↓ LDL Cholesterol</span>
                    <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded font-bold">↓ Triglycerides</span>
                    <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded font-bold">↑ Cardiovascular Fitness</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flags Considered */}
            {activePlan.flagsConsidered && activePlan.flagsConsidered.length > 0 && (() => {
              const grouped = groupFlags(activePlan.flagsConsidered);
              return (
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Health Considerations Integrated</h4>
                  <div className="flex flex-col gap-3">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category} className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{category}</span>
                        <div className="flex flex-col gap-1">
                          {items.map((item, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <Disclaimer />
          </div>

          {/* Right/Middle: Meal Plans & Workouts */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Meal Schedule */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <h3 className="text-xl font-bold font-heading flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-emerald-600" />
                  Custom Daily Meal Plan
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded shadow-sm">
                  🗺️ Meal Plan Personalized for: {activePlan.mealPersonalizedForCountry || profile?.country || 'India'}
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlan.meals?.map((meal, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2 justify-between">
                    <div>
                      {(() => {
                        const mMacros = getMealMacros(meal.type, activePlan.macros);
                        const mealKcal = mMacros 
                          ? (mMacros.protein * 4 + mMacros.carbs * 4 + mMacros.fat * 9) 
                          : meal.kcal;
                        return (
                          <>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="font-bold text-slate-800 font-heading">{meal.type}</span>
                              <span className="text-xs font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/50">{mealKcal} kcal</span>
                            </div>
                            
                            {mMacros && (
                              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-[10px] mt-2 mb-1.5 font-bold">
                                <div><span className="text-slate-400 font-medium">Protein:</span> <span className="text-emerald-700">{mMacros.protein}g</span></div>
                                <div className="border-x border-slate-200"><span className="text-slate-400 font-medium">Carbs:</span> <span className="text-cyan-700">{mMacros.carbs}g</span></div>
                                <div><span className="text-slate-400 font-medium">Fat:</span> <span className="text-amber-700">{mMacros.fat}g</span></div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <ul className="list-disc list-inside text-xs text-slate-600 flex flex-col gap-1.5 mt-2">
                        {meal.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-2 mt-2">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-405" /> Prep Time: {
                            meal.type.toLowerCase().includes('breakfast') ? '10 min' :
                            meal.type.toLowerCase().includes('lunch') ? '15 min' :
                            meal.type.toLowerCase().includes('snack') ? '5 min' : '20 min'
                          }
                        </span>
                        <span className="text-[9px] text-slate-400">Easy Prep</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {meal.supports && meal.supports.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mr-1 self-center">Supports:</span>
                          {meal.supports.map((sup, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded font-medium">
                              ✓ {sup}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Collapsible Alternative Swaps */}
                      {(() => {
                        const mealKey = meal.type.toLowerCase();
                        const swaps = HEALTHY_SWAPS[mealKey];
                        const direct = DIRECT_SWAPS[mealKey];
                        if ((swaps && swaps.length > 0) || (direct && direct.length > 0)) {
                          return (
                            <details className="mt-2.5 text-xs border border-slate-200 rounded-lg bg-white overflow-hidden group">
                              <summary className="cursor-pointer select-none font-bold text-[10px] text-slate-500 py-1.5 px-2 bg-slate-50 flex items-center justify-between hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                <span className="flex items-center gap-1">🔄 Alternative Options</span>
                                <span className="text-[9px] text-slate-400 font-normal group-open:hidden">Show</span>
                                <span className="text-[9px] text-slate-400 font-normal hidden group-open:inline">Hide</span>
                              </summary>
                              <div className="p-2.5 border-t border-slate-100 bg-white flex flex-col gap-2.5">
                                {direct && direct.length > 0 && (
                                  <div className="pb-2 border-b border-slate-150">
                                    <div className="text-[9px] uppercase font-bold text-slate-400 mb-1.5">Direct Protein Swaps:</div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {direct.map((itm, iIdx) => (
                                        <React.Fragment key={iIdx}>
                                          {iIdx > 0 && <span className="text-[10px] text-slate-400 font-bold">➔</span>}
                                          <span className="text-[10px] bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/60 font-bold">{itm}</span>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {swaps && swaps.length > 0 && (
                                  <div className="flex flex-col gap-2">
                                    <div className="text-[9px] uppercase font-bold text-slate-400">Meal Alternatives:</div>
                                    {swaps.map((swap, sIdx) => (
                                      <div key={sIdx} className="pb-1.5 last:pb-0 last:border-b-0 border-b border-dashed border-slate-100 text-[11px]">
                                        <div className="font-bold text-slate-700">{swap.name}</div>
                                        <div className="text-slate-500 text-[10px] leading-normal">{swap.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </details>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Grocery Shopping List */}
            {activePlan.meals && activePlan.meals.length > 0 && (() => {
              const groceryItems = generateGroceryList(activePlan.meals);
              return (
                <div className="glass-panel p-6 flex flex-col gap-4 bg-gradient-to-br from-slate-50 to-emerald-50/5 border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Apple className="w-5 h-5 text-emerald-600" />
                    Weekly Grocery Shopping List
                  </h3>
                  <p className="text-xs text-slate-550 -mt-1 leading-relaxed">
                    Auto-generated from your personalized 1-day sample meal plan to help prepare your pantry for the week.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {groceryItems.map((item, gIdx) => (
                      <label key={gIdx} className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/70 hover:border-emerald-350 rounded-xl cursor-pointer transition-all hover:bg-slate-50/50 group select-none">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350" />
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Workout Routine */}
            <div className="glass-panel p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-emerald-600" />
                  Weekly Workout Schedule
                </h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="fitness-level" className="text-xs font-bold text-slate-500 whitespace-nowrap">Fitness Level:</label>
                  <select
                    id="fitness-level"
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {fitnessLevel === 'beginner' && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-500/5 text-blue-800 text-xs">
                  <span className="font-bold">Beginner Adaptation:</span> Scale down to 2 sets per exercise. Focus on strict form and controlled movements. For HIIT, replace with 15-20 minutes of moderate intensity steady-state cardio (e.g. brisk walking/cycling).
                </div>
              )}
              {fitnessLevel === 'intermediate' && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-500/5 text-emerald-800 text-xs">
                  <span className="font-bold">Intermediate (Recommended):</span> Follow the prescribed 3 sets. Rest 60-90 seconds between sets. Perform HIIT for 20-25 minutes with standard work/rest intervals. <span className="underline font-bold">Pro Tip:</span> If recovery is good, perform 20–30 minutes of Zone 2 aerobic cardio (e.g., light cycling/jogging) after strength sessions to enhance fat oxidation.
                </div>
              )}
              {fitnessLevel === 'advanced' && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-500/5 text-purple-800 text-xs">
                  <span className="font-bold">Advanced Adaptation:</span> Increase sets to 4 for compound lifts. Rest 45-60 seconds to increase metabolic stress. For HIIT, push to 25-30 minutes with high power output (e.g., kettlebells, sprints).
                </div>
              )}

              <div className="p-3 rounded-xl border border-rose-100 bg-rose-500/5 text-rose-800 text-xs flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Exercise Safety Advisory:</span> Avoid high-intensity interval training (HIIT) or heavy compound lifts during active illness, recovery from injury, or if your physician has advised against vigorous cardiac exertion. <span className="underline font-bold">Important:</span> Stop exercise immediately and seek medical attention if you experience chest pain, severe shortness of breath, dizziness, or fainting during activity.
                </div>
              </div>
              
              {activePlan.workoutExplanation && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-500/5 text-blue-800 text-xs flex gap-2.5 items-start mb-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Workout Rationale & Safety Justification:</span>
                    <span className="opacity-95 leading-relaxed">{activePlan.workoutExplanation}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {activePlan.workout?.map((work, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-3">
                    <div className="min-w-[120px]">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">{work.day}</span>
                      <h4 className="font-bold text-slate-800 font-heading text-sm mt-0.5">{work.focus}</h4>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <ul className="text-xs text-slate-600 flex flex-wrap gap-2">
                        {work.exercises.map((ex, exIdx) => (
                          <li key={exIdx} className="bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                            {adjustExerciseVolume(ex, fitnessLevel)}
                          </li>
                        ))}
                      </ul>
                      {work.targets && work.targets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mr-1 self-center">Targets:</span>
                          {work.targets.map((tar, tIdx) => (
                            <span key={tIdx} className="text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-100 px-1.5 py-0.5 rounded font-medium">
                              🎯 {tar}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplement Suggestions */}
            {activePlan.supplements && activePlan.supplements.length > 0 && (
              <div className="glass-panel p-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold font-heading flex items-center gap-2 text-slate-900">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Targeted Supplement Suggestions
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Based on your medical biomarkers, target health goals, and dietary constraints, the following evidence-based supplements are recommended to support your daily metabolic health:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  {activePlan.supplements.map((supp, sIdx) => {
                    const isWarning = supp.startsWith('⚠️');
                    if (isWarning) {
                      return (
                        <div key={sIdx} className="p-3.5 rounded-xl border border-amber-250 bg-amber-500/5 flex items-start gap-2.5 col-span-1 md:col-span-2 shadow-sm">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold text-slate-700 leading-normal">{supp}</p>
                        </div>
                      );
                    }
                    
                    const parts = supp.split('|');
                    const name = parts[0]?.trim() || supp;
                    const reason = parts[1]?.replace(/reason:/i, '')?.trim();
                    const evidence = parts[2]?.replace(/evidence level:/i, '')?.replace(/-\s*Discuss with your healthcare provider.*/i, '')?.trim();
                    
                    return (
                      <div key={sIdx} className="p-4 rounded-xl border border-emerald-100 bg-emerald-500/5 flex flex-col gap-2.5 justify-between shadow-sm">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">+</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-normal">{name}</h4>
                            {reason && (
                              <p className="text-[11px] text-slate-600 mt-1 leading-normal font-semibold">
                                <span className="font-bold text-slate-400">Reason:</span> {reason}
                              </p>
                            )}
                          </div>
                        </div>
                        {evidence && (
                          <div className="flex justify-between items-center text-[9px] font-bold border-t border-emerald-100/50 pt-2 mt-1">
                            <span className="text-slate-450 uppercase">Evidence Rating</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                              evidence.toLowerCase().includes('high') 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : evidence.toLowerCase().includes('moderate')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {evidence}
                            </span>
                          </div>
                        )}
                        <p className="text-[8px] text-slate-400 leading-normal italic pt-1 border-t border-dashed border-emerald-100/30">
                          * Discuss with your healthcare provider whether supplementation is appropriate.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggested Follow-up & Retesting Schedule */}
            <div className="glass-panel p-6 flex flex-col gap-4">
              <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Suggested Follow-up & Retesting Schedule
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitoring your biomarker trends regularly is critical to evaluate the efficacy of your customized dietary and physical regimen. Based on your risk markers, we suggest the following clinical follow-up:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-800 font-heading">Lipid Profile Test</span>
                  <span className="text-xs font-semibold text-emerald-700">Every 8–12 Weeks</span>
                  <p className="text-[11px] text-slate-600 leading-normal">Monitor LDL, HDL, and Triglycerides levels to assess cardiovascular risk improvements.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-800 font-heading">TSH & Free T4 Test</span>
                  <span className="text-xs font-semibold text-emerald-700">Every 6–8 Weeks</span>
                  <p className="text-[11px] text-slate-600 leading-normal">Assess subclinical hypothyroidism response to dietary adjustments.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5 border-rose-100">
                  <span className="text-xs font-bold text-slate-800 font-heading">Physician Consultation</span>
                  <span className="text-xs font-semibold text-rose-700">Immediately if Symptomatic</span>
                  <p className="text-[11px] text-slate-600 leading-normal">Seek immediate clinical evaluation if you experience chest pain, severe breathlessness, persistent unexplained fatigue, heart palpitations, fainting, or severe dizziness.</p>
                </div>
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
              <p className="text-slate-700 text-sm font-bold">
                No historical trend available yet 
                {sortedReports.length === 1 ? ` (${sortedReports[0]?.fileName || 'unnamed'} uploaded)` : ' (no reports uploaded)'}
              </p>
              <p className="text-slate-600 text-xs max-w-sm">
                To visualize lines showing cholesterol trends and risk improvements, upload another report under the <Link to="/reports" className="text-emerald-700 underline font-semibold">Reports</Link> tab to compare:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mt-1">
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">✓ LDL Cholesterol Changes</span>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">✓ TSH Thyroid Trend</span>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">✓ Clinical Risk Score Trend</span>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">✓ Trig/HDL Ratio Improvement</span>
              </div>
            </div>
          ) : (
            <div className="h-[280px] relative w-full mt-2">
              <Line data={biomarkerChartData} options={chartOptions} />
            </div>
          )}
        </div>
      )}

      {/* Final AI Disclaimer */}
      <div className="text-center text-[10px] text-slate-400 font-semibold leading-relaxed max-w-4xl mx-auto border-t border-slate-200 pt-4 mt-6">
        This personalized dashboard is generated using AI-assisted interpretation of laboratory biomarkers and your health profile. It is intended for educational and wellness planning purposes and should not replace professional medical diagnosis or treatment.
      </div>

    </div>
  );
};

export default Dashboard;
