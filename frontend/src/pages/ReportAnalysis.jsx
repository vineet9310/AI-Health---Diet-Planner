import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, ChevronLeft, ArrowRight, Activity, AlertCircle, Heart } from 'lucide-react';
import api from '../utils/api';
import Disclaimer from '../components/Disclaimer';

const ReportAnalysis = ({ user }) => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    const fetchReport = async () => {
      try {
        const data = await api(`/reports/${id}`);
        setReport(data);
        if (data.analysisStatus !== 'pending') {
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve report data.');
        setLoading(false);
        clearInterval(interval);
      }
    };

    fetchReport();
    interval = setInterval(fetchReport, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const handleGeneratePlan = async () => {
    setError('');
    setGenerating(true);

    try {
      const status = await api('/profile/status');
      if (!status.isComplete) {
        alert('Please complete your health profile first before generating a health plan.');
        navigate('/complete-profile');
        return;
      }

      const response = await api('/plans/generate', {
        method: 'POST'
      });

      if (response.requiresReview) {
        alert('Your plan was generated successfully, but since you have high-risk markers/conditions, it has been routed to our nutritionist for clinical review. We will release it shortly!');
      } else {
        alert('Plan generated successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.status === 422 && err.data?.safetyBlock) {
        setError('Urgent: Your biomarker values are critical. Plan generation is blocked for user safety. Please consult a doctor.');
      } else {
        setError(err.message || 'Failed to generate plan.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <p className="text-slate-400 text-sm">Parsing biometric indicators...</p>
      </div>
    );
  }

  if (loading && report && report.analysisStatus === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <p className="text-slate-700 font-semibold font-heading">Analyzing Laboratory Biomarkers...</p>
        <p className="text-slate-500 text-xs max-w-sm text-center">
          Our clinical parser is reading your report and extracting biological indicators. This will take a moment.
        </p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-md mx-auto mt-12 glass-panel p-6 text-center flex flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold font-heading text-rose-400">Error Loading Analysis</h3>
        <p className="text-slate-400 text-sm">{error}</p>
        <Link to="/reports" className="btn-secondary mt-2">Back to Reports</Link>
      </div>
    );
  }

  const { biomarkers, hasCriticalFlag, fileName, uploadedAt, riskScore, riskCategory, doctorSummary, healthRecommendations, riskFactors } = report;
  const hasAbnormalBiomarkers = biomarkers && biomarkers.some(b => b.status !== 'normal');
  const abnormalCount = biomarkers ? biomarkers.filter(b => b.status !== 'normal').length : 0;
  const normalCount = biomarkers ? biomarkers.filter(b => b.status === 'normal').length : 0;
  const primaryConcerns = biomarkers ? biomarkers.filter(b => b.status !== 'normal') : [];

  const formatClinicalConcern = (bio) => {
    const name = bio.testName;
    const val = `${bio.value} ${bio.unit === 'Ratio' ? '' : bio.unit}`.trim();
    
    if (bio.status === 'low' || bio.status === 'borderline_low') {
      return `Low ${name} (${val})`;
    }
    if (bio.status === 'borderline_high') {
      return `Borderline Elevated ${name} (${val})`;
    }
    if (name.toLowerCase().includes('tsh') || name.toLowerCase().includes('thyroid')) {
      return `Elevated ${name} (${val})`;
    }
    return `High ${name} (${val})`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
      
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/reports" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-semibold">{fileName}</span>
      </div>

      <Disclaimer />

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Biomarker Report (Sticky) */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="glass-panel p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Biomarker Report
                </h3>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Analyzed on {new Date(uploadedAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>

              {hasCriticalFlag ? (
                <span className="badge badge-critical py-1 px-2.5 text-[10px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  CRITICAL
                </span>
              ) : hasAbnormalBiomarkers ? (
                <span className="badge badge-borderline py-1 px-2.5 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  ABNORMAL FINDINGS
                </span>
              ) : (
                <span className="badge badge-normal py-1 px-2.5 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  NORMAL
                </span>
              )}
            </div>

            {/* Biomarkers Table */}
            <div className="flex flex-col gap-3">
              {biomarkers.length === 0 ? (
                <div className="text-center py-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs">
                  We couldn't detect any structured biomarker values in the OCR text.
                </div>
              ) : (
                <div className="table-container border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table>
                    <thead>
                      <tr className="bg-slate-50 text-left text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="p-3">Biomarker</th>
                        <th className="p-3">Value</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biomarkers.map((bio, index) => {
                        let badgeClass = 'badge-normal';
                        if (bio.status.startsWith('borderline')) badgeClass = 'badge-borderline';
                        if (bio.status === 'low' || bio.status === 'high') badgeClass = 'badge-low';
                        if (bio.status === 'critical') badgeClass = 'badge-critical';

                        return (
                          <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">{bio.testName}</td>
                            <td className="p-3 font-semibold text-slate-900">{bio.value}</td>
                            <td className="p-3 text-slate-500">{bio.unit}</td>
                            <td className="p-3">
                              <span className={`badge text-[9px] px-2 py-0.5 ${badgeClass}`}>
                                {bio.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Insights, Recommendations & Regimen generation (Scrollable) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {error && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/5 text-rose-800 text-sm flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-900 mb-0.5">Safety Generation Block</h4>
                <p className="opacity-95">{error}</p>
              </div>
            </div>
          )}

          {/* Top Summary Card */}
          <div className="glass-panel p-5 bg-gradient-to-br from-emerald-50/10 to-slate-50/30 border-slate-200/80 flex flex-col gap-4">
            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Report Executive Summary
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Findings Count */}
              <div className="sm:col-span-4 flex items-center gap-4 sm:border-r sm:border-slate-200/60 pr-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-bold">Findings</span>
                  <div className="flex gap-3 items-center mt-1">
                    <span className="text-sm text-slate-800 font-extrabold"><span className="text-rose-600">{abnormalCount}</span> Abnormal</span>
                    <span className="text-sm text-slate-800 font-extrabold"><span className="text-emerald-600">{normalCount}</span> Normal</span>
                  </div>
                </div>
              </div>

              {/* Primary Concerns */}
              <div className="sm:col-span-8 flex flex-col sm:pl-2">
                <span className="text-xs text-slate-500 font-bold mb-1.5">Primary Clinical Concerns:</span>
                {primaryConcerns.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> All checked biomarkers are within optimal physiological limits.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-700 font-semibold">
                    {primaryConcerns.map((pc, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        <span>{formatClinicalConcern(pc)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Insights Grid */}
          {(riskScore !== undefined || doctorSummary) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Risk Level Card with Breakdown */}
              <div className="md:col-span-1 glass-panel p-5 bg-gradient-to-br from-slate-50 to-teal-50/20 border-slate-100 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Clinical Risk Level
                  </h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-heading text-slate-900">{riskScore || 0}</span>
                    <span className="text-xs text-slate-500 font-medium">/ 100</span>
                  </div>
                  
                  <div className="mt-2">
                    <span className={`badge py-1 text-xs font-bold w-full justify-center ${
                      riskCategory === 'High' 
                        ? 'badge-critical' 
                        : riskCategory === 'Moderate' 
                          ? 'badge-borderline' 
                          : riskCategory === 'Normal'
                            ? 'badge-normal'
                            : 'badge-borderline'
                    }`}>
                      {riskCategory || 'Low'} Risk
                    </span>
                  </div>
                </div>

                {/* Score explainability list */}
                {riskFactors && riskFactors.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Risk Score Breakdown</p>
                    <div className="flex flex-col gap-1.5 font-mono text-[9px] text-slate-700 font-semibold">
                      {riskFactors.map((rf, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="truncate max-w-[100px]">{rf.factor}</span>
                          <span className="flex-1 border-b border-dotted border-slate-300 mx-1.5 self-end h-2.5"></span>
                          <span className={rf.points === 0 ? "text-slate-500 font-normal" : "text-rose-700"}>+{rf.points}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1 font-sans text-[10px] font-bold text-slate-900">
                        <span className="text-[9px] truncate">Total Score</span>
                        <span className="text-emerald-700">{riskScore}/100</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Physician Summary Card */}
              <div className="md:col-span-2 glass-panel p-5 bg-slate-50 border-slate-100 flex flex-col gap-3 justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Physician's Abstract
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm italic mt-3">
                    "{doctorSummary || 'All systems operating within normal parameters. No major clinical indices flagged.'}"
                  </p>
                </div>
                <span className="text-[9px] text-slate-400 leading-normal">
                  This clinical summary provides a structured synthesis of raw biomarker deviations to facilitate communication with your primary care provider.
                </span>
              </div>

            </div>
          )}

          {/* Actionable Health Recommendations */}
          {healthRecommendations && healthRecommendations.length > 0 && (
            <div className="glass-panel p-6 flex flex-col gap-4">
              <h4 className="text-sm font-bold font-heading flex items-center gap-2 border-b border-slate-100 pb-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Biomarker-Targeted Recommendations
              </h4>
              <ul className="flex flex-col gap-3">
                {healthRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-xs text-slate-700 leading-relaxed">
                    <span className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">{idx + 1}</span>
                    <p className="mt-0.5">{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Call to action generation bar */}
          {!user ? (
            <div className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-2 border-dashed border-emerald-500/30 bg-emerald-50/5">
              <div className="text-center sm:text-left max-w-lg">
                <h4 className="font-bold font-heading text-sm text-slate-900">Login to generate your personalized AI Health Dashboard.</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Please sign in or register to complete your health profile and generate a safe, personalized diet and workout plan.
                </p>
              </div>
              <button 
                onClick={() => {
                  localStorage.setItem('generatePlanAfterLogin', 'true');
                  navigate('/login');
                }}
                className="btn-primary min-w-[200px] text-center text-xs py-2.5 px-4 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                <span>Generate Health Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <h4 className="font-bold font-heading text-sm text-slate-900">Next Step: Calculate Custom Regimen</h4>
                <p className="text-xs text-slate-500 mt-0.5">We'll cross-reference these biomarker values with your health profile to yield a safe plan.</p>
              </div>

              {hasCriticalFlag ? (
                <button 
                  disabled
                  className="btn-primary bg-rose-900/50 border border-rose-900/80 cursor-not-allowed opacity-50 flex gap-2 text-xs py-2 px-4"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Generation Blocked
                </button>
              ) : (
                <button 
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="btn-primary min-w-[180px] text-xs py-2.5 px-4"
                >
                  {generating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Generate Health Plan
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ReportAnalysis;
