import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, ShieldAlert, Sparkles, FileSpreadsheet, ListChecks } from 'lucide-react';
import Disclaimer from '../components/Disclaimer';

const Landing = ({ user }) => {
  return (
    <div className="flex flex-col gap-16 py-8 items-center text-center">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 max-w-3xl mt-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Health Advisory
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
          Personalized Nutrition & Fitness, Powered by Medical Data
        </h1>
        <p className="text-base md:text-xl text-slate-600 max-w-2xl font-light">
          Upload your blood test or medical report. VitalPlan instantly extracts key biomarkers, maps your risk profile, and crafts an AI-generated diet and exercise schedule reviewed by professionals.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full max-w-5xl flex flex-col gap-10 items-center">
        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-3xl font-bold font-heading">How VitalPlan Works</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-lg">
            Transform raw health documentation into daily actionable plans in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Step 1 */}
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 group">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-heading">1. Upload Report</h3>
            <p className="text-slate-400 text-sm">
              Upload a digital copy (PDF or image) of your blood test, thyroid panel, or lipid test.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 group">
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/20 border border-cyan-500/30 p-4 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-heading">2. Biomarker Extraction</h3>
            <p className="text-slate-400 text-sm">
              Our OCR pipeline analyzes numbers and reference ranges, flagging any low, high, or critical values.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-8 flex flex-col items-center text-center gap-4 group">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/20 border border-purple-500/30 p-4 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <ListChecks className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-heading">3. Custom AI Plan</h3>
            <p className="text-slate-400 text-sm">
              Get calorie targets, macros, a 1-day meal structure, and a 7-day workout schedule, safe for your allergies.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Compliance Grid */}
      <section className="w-full max-w-4xl flex flex-col gap-6 items-center">
        <div className="glass-panel p-8 w-full border border-emerald-500/15">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl shrink-0">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold mb-2 font-heading">Clinical Review & Safety Filters</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Your safety is our priority. If any health conditions (like diabetes, thyroid issues, or heart conditions) or borderline lab markers are detected, your AI plan is automatically held in a clinical queue. Licensed nutritionists inspect, edit, and approve your plans before you ever see them.
              </p>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">
                🛡️ Built-in Clinical Guardrails
              </span>
            </div>
          </div>
        </div>

        <Disclaimer className="w-full text-left" />
      </section>
    </div>
  );
};

export default Landing;
