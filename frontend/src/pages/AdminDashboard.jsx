import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ClipboardList, 
  Settings, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [rangesCount, setRangesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [users, queue, ranges] = await Promise.all([
          api('/admin/users'),
          api('/admin/review-queue'),
          api('/admin/reference-ranges')
        ]);
        
        setUsersCount(users.length);
        setQueueCount(queue.length);
        setRangesCount(ranges.length);
        setRecentReviews(queue.slice(0, 3)); // show top 3 recent reviews
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <p className="text-slate-400 text-sm">Aggregating system telemetry...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h2 className="text-3xl font-bold font-heading">Clinical Management</h2>
        <p className="text-slate-400 text-sm">Welcome to the back-office panel. Review plans, configure range indices, and audit users.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Reviews */}
        <div className="glass-panel p-6 flex justify-between items-center bg-gradient-to-br from-slate-900 to-amber-950/10 border-amber-900/30">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Clinical Reviews Pending</span>
            <h3 className="text-3xl font-extrabold font-heading text-amber-400">{queueCount}</h3>
            <Link to="/admin/reviews" className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-2">
              Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 text-amber-400">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Total Users */}
        <div className="glass-panel p-6 flex justify-between items-center bg-gradient-to-br from-slate-900 to-cyan-950/10 border-cyan-900/30">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Registered Patients</span>
            <h3 className="text-3xl font-extrabold font-heading text-cyan-400">{usersCount}</h3>
            <Link to="/admin/users" className="text-xs font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 mt-2">
              User Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Reference Ranges */}
        <div className="glass-panel p-6 flex justify-between items-center bg-gradient-to-br from-slate-900 to-emerald-950/10 border-emerald-900/30">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Biomarker Indexes</span>
            <h3 className="text-3xl font-extrabold font-heading text-emerald-400">{rangesCount}</h3>
            <Link to="/admin/ranges" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mt-2">
              Manage Ranges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Settings className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Review List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Latest Review Requests
              </h3>
              <Link to="/admin/reviews" className="text-xs text-slate-400 hover:text-white">View All</Link>
            </div>

            {recentReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No active pending reviews. High-risk diet plans are clear.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentReviews.map((item) => (
                  <div key={item._id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-slate-200">{item.user?.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Reason: <span className="text-amber-400 font-semibold">{item.reason}</span></p>
                    </div>
                    <Link to="/admin/reviews" className="btn-primary py-2 px-4 text-xs">Review Plan</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clinical Guardrails Info */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Safety Guardrails
            </h3>
            
            <div className="text-slate-400 text-xs flex flex-col gap-3 leading-relaxed">
              <p>
                <strong>Safeguard 1: Critical Biomarkers</strong>
                <br />
                Biomarkers measured at &gt;2x outside boundaries block automatic AI plan generations, forcing users to consult clinical staff directly.
              </p>
              <p>
                <strong>Safeguard 2: Clinical Hold</strong>
                <br />
                Diagnoses of high-risk diseases (diabetes, thyroid panel issues, etc.) redirect generated plans to the clinical queue. Users see a clinical loader instead of raw plans.
              </p>
              <p>
                <strong>Safeguard 3: Allergen Filter</strong>
                <br />
                Allergy terms are audited. If the AI generator breaches allergies, the plan is held in the queue.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
