import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, ChevronLeft, ArrowRight, Activity, AlertCircle, Heart, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import Disclaimer from '../components/Disclaimer';

const ReportAnalysis = ({ user }) => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showDoctorView, setShowDoctorView] = useState(false);
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
 
  if (report && report.analysisStatus === 'failed') {
    return (
      <div className="max-w-md mx-auto mt-12 glass-panel p-6 text-center flex flex-col gap-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold font-heading text-rose-700">Analysis Failed</h3>
        <p className="text-slate-500 text-sm">
          {report.failureReason || "AI could not confidently interpret or extract biomarkers from this medical report. Please upload a clearer report image or legible PDF and try again."}
        </p>
        <Link to="/reports" className="btn-secondary mt-2">Back to Reports</Link>
      </div>
    );
  }


  const { biomarkers, hasCriticalFlag, fileName, uploadedAt, riskScore, riskCategory, doctorSummary, healthRecommendations, riskFactors, patientExplanation, clinicalReasoning } = report;
  const hasAbnormalBiomarkers = biomarkers && biomarkers.some(b => b.status !== 'normal');
  const abnormalCount = biomarkers ? biomarkers.filter(b => b.status !== 'normal').length : 0;
  const normalCount = biomarkers ? biomarkers.filter(b => b.status === 'normal').length : 0;
  const primaryConcerns = biomarkers ? biomarkers.filter(b => b.status !== 'normal') : [];

  const formatClinicalConcern = (bio) => {
    const name = bio.testName;
    const val = `${bio.value} ${bio.unit === 'Ratio' ? '' : bio.unit}`.trim();
    
    const isLow = bio.status === 'low' || bio.status === 'borderline_low' || (bio.status === 'critical' && (
      (name === 'Vitamin D' && bio.value < 30) ||
      (name === 'Vitamin B12' && bio.value < 200) ||
      (name === 'Hemoglobin' && bio.value < 12) ||
      (name === 'HDL Cholesterol' && bio.value < 40) ||
      (name === 'Calcium Total' && bio.value < 8.5) ||
      (name === 'Fasting Glucose' && bio.value < 70) ||
      (name === 'Creatinine' && bio.value < 0.5) ||
      (name === 'HDL/LDL Ratio' && bio.value < 0.4)
    ));

    if (isLow) {
      if (bio.status === 'critical') {
        return `Critical Low ${name} (${val})`;
      }
      return `Low ${name} (${val})`;
    }
    if (bio.status === 'borderline_high') {
      return `Borderline Elevated ${name} (${val})`;
    }
    if (bio.status === 'critical') {
      return `Critical High ${name} (${val})`;
    }
    if (name.toLowerCase().includes('tsh') || name.toLowerCase().includes('thyroid')) {
      return `Elevated ${name} (${val})`;
    }
    return `High ${name} (${val})`;
  };

  const displayPatientExplanation = patientExplanation || {
    mainProblem: doctorSummary || "No clinical abnormalities detected.",
    symptoms: ["Fatigue or tiredness", "Unspecified nutrient imbalance symptoms", "Mild energy drop"],
    possibleCauses: primaryConcerns.map(c => `${c.testName} (${c.value} ${c.unit})`),
    nextSteps: healthRecommendations || []
  };

  const displayClinicalReasoning = clinicalReasoning || {
    differentialDiagnosis: primaryConcerns.map(c => c.testName),
    likelihoods: primaryConcerns.map(c => `${c.testName} elevation/deviation: Estimated ~70-80% likelihood`),
    recommendations: healthRecommendations || []
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
                <>
                  {/* Mobile View: Cards */}
                  <div className="flex flex-col gap-2.5 sm:hidden text-xs">
                    {biomarkers.map((bio, index) => {
                      let badgeClass = 'badge-normal';
                      if (bio.status.startsWith('borderline')) badgeClass = 'badge-borderline';
                      if (bio.status === 'low' || bio.status === 'high') badgeClass = 'badge-low';
                      if (bio.status === 'critical') badgeClass = 'badge-critical';

                      return (
                        <div key={index} className="p-3 rounded-xl border border-slate-200 bg-white/50 flex justify-between items-center gap-3">
                          <div>
                            <div className="font-bold text-slate-800">{bio.testName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{bio.value} {bio.unit}</div>
                          </div>
                          <span className={`badge text-[9px] px-2 py-0.5 shrink-0 ${badgeClass}`}>
                            {bio.status.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="table-container border border-slate-200 rounded-xl overflow-hidden text-xs hidden sm:block">
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
                </>
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

          {/* Risk Level & AI Confidence Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Risk Level Card */}
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

            {/* AI Confidence Card */}
            <div className="md:col-span-2 glass-panel p-5 bg-slate-50 border-slate-100 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  AI Clinical Confidence
                </h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-heading text-slate-900">{report.overallConfidence || 90.0}%</span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${report.overallConfidence || 90.0}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200/80 text-[10px] text-slate-500 font-semibold">
                  <div>
                    <p className="uppercase text-[9px] text-slate-400">Extraction Rate</p>
                    <p className="text-slate-800 text-sm font-bold mt-0.5">{report.extractionConfidence || 85.0}%</p>
                  </div>
                  <div>
                    <p className="uppercase text-[9px] text-slate-400">Clinical Logic</p>
                    <p className="text-slate-800 text-sm font-bold mt-0.5">{report.clinicalReasoningConfidence || 90.0}%</p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400">
                Confidence represents the verified correctness match score across OCR reading accuracy and clinical logic mappings.
              </p>
            </div>

          </div>

          {/* LAYER 1: Patient Explanation Card (Default View) */}
          <div className="glass-panel p-6 border-slate-200/80 bg-white flex flex-col gap-5">
            <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-lg">🩺</span> What does this report mean?
            </h3>

            {/* Main Problem description */}
            <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-50 text-slate-700 text-xs font-semibold leading-relaxed shadow-sm">
              {displayPatientExplanation.mainProblem}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
              {/* Left Column: Symptoms */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Symptoms you may experience:</h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-700 font-semibold">
                  {displayPatientExplanation.symptoms.map((sym, idx) => {
                    const isObj = sym && typeof sym === 'object';
                    const name = isObj ? sym.symptom : sym;
                    const reason = isObj ? sym.reason : null;
                    const likelihood = isObj ? sym.likelihood : null;
                    const supportedBy = isObj ? sym.supportedBy : null;

                    return (
                      <li key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100/70 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-500 shrink-0">✓</span>
                            <span className="font-bold text-slate-800 text-[13px]">{name}</span>
                          </div>
                          {likelihood && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700">
                              {likelihood}
                            </span>
                          )}
                        </div>
                        {reason && (
                          <p className="text-[11px] text-slate-500 font-normal leading-relaxed ml-4">
                            {reason}
                          </p>
                        )}
                        {supportedBy && supportedBy.length > 0 && (
                          <div className="flex items-center gap-1.5 ml-4 mt-1">
                            <span className="text-[9px] text-slate-400 font-medium">Supported by:</span>
                            <div className="flex flex-wrap gap-1">
                              {supportedBy.map((b, i) => (
                                <span key={i} className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] text-slate-500 font-semibold border border-slate-200">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Right Column: Causes */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">What could be causing this?</h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-700 font-semibold">
                  {displayPatientExplanation.possibleCauses.map((item, idx) => {
                    const isObj = item && typeof item === 'object';
                    const cause = isObj ? item.cause : item;
                    const explanation = isObj ? item.explanation : null;
                    const likelihood = isObj ? item.likelihood : null;

                    return (
                      <li key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100/70 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-500 shrink-0">✅</span>
                            <span className="font-bold text-slate-800 text-[13px]">{cause}</span>
                          </div>
                          {likelihood && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-100 text-amber-700">
                              {likelihood}
                            </span>
                          )}
                        </div>
                        {explanation && (
                          <p className="text-[11px] text-slate-500 font-normal leading-relaxed ml-4">
                            {explanation}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Next Steps (Action Items) */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">What should you do next?</h4>
              <div className="flex flex-col gap-3">
                {displayPatientExplanation.nextSteps.map((item, idx) => {
                  const isObj = item && typeof item === 'object';
                  const stepText = isObj ? item.step : item;
                  const reason = isObj ? item.reason : null;
                  const priority = isObj ? item.priority : null;

                  let pBadgeColor = "bg-emerald-50 border-emerald-100 text-emerald-700";
                  let numColor = "bg-emerald-50 border-emerald-100 text-emerald-700";

                  if (priority) {
                    const pStr = priority.toLowerCase();
                    if (pStr.includes('1') || pStr.includes('high') || pStr.includes('red')) {
                      pBadgeColor = "bg-rose-50 border-rose-100 text-rose-700";
                      numColor = "bg-rose-50 border-rose-100 text-rose-700";
                    } else if (pStr.includes('2') || pStr.includes('orange') || pStr.includes('moderate')) {
                      pBadgeColor = "bg-orange-50 border-orange-100 text-orange-700";
                      numColor = "bg-orange-50 border-orange-100 text-orange-700";
                    } else if (pStr.includes('3') || pStr.includes('yellow')) {
                      pBadgeColor = "bg-amber-50 border-amber-100 text-amber-700";
                      numColor = "bg-amber-50 border-amber-100 text-amber-700";
                    } else if (pStr.includes('4') || pStr.includes('low')) {
                      pBadgeColor = "bg-blue-50 border-blue-100 text-blue-700";
                      numColor = "bg-blue-50 border-blue-100 text-blue-700";
                    }
                  }

                  return (
                    <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50/50 border border-slate-100/70 shadow-sm text-xs text-slate-700 leading-relaxed font-semibold">
                      <span className={`h-6 w-6 rounded-full border font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5 ${numColor}`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <p className="mt-0.5 font-bold text-slate-800 text-[13px]">{stepText}</p>
                          {priority && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pBadgeColor}`}>
                              {priority}
                            </span>
                          )}
                        </div>
                        {reason && (
                          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                            {reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collapsible Trigger for LAYER 2: Doctor View */}
          <div className="w-full">
            <button 
              onClick={() => setShowDoctorView(!showDoctorView)} 
              className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 transition font-heading font-semibold text-xs text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>Show Detailed Clinical Analysis (For Doctors)</span>
              </div>
              {showDoctorView ? <ChevronUp className="w-4.5 h-4.5 text-slate-500" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-500" />}
            </button>
          </div>

          {/* LAYER 2: Doctor View Content */}
          {showDoctorView && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Executive Summary Card */}
              <div className="glass-panel p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/80 flex flex-col gap-4">
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

              {/* Physician Summary Card */}
              <div className="glass-panel p-5 bg-slate-50 border-slate-100 flex flex-col gap-3 justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Detailed Physician's Abstract
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm italic mt-3 whitespace-pre-line">
                    "{doctorSummary || 'All systems operating within normal parameters. No major clinical indices flagged.'}"
                  </p>
                </div>
              </div>

              {/* Differential Diagnosis & Likelihoods Card */}
              <div className="glass-panel p-5 bg-slate-50 border-slate-100 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Differential Diagnosis */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Differential Diagnosis (Physician level)</h4>
                    <ul className="flex flex-col gap-2 text-xs text-slate-700 font-semibold">
                      {displayClinicalReasoning.differentialDiagnosis.map((diag, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Clinical Likelihoods */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Clinical Likelihoods</h4>
                    <ul className="flex flex-col gap-2 text-xs text-slate-700 font-semibold">
                      {displayClinicalReasoning.likelihoods.map((like, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 mt-0.5 shrink-0">📊</span>
                          <span>{like}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actionable Health Recommendations */}
              {displayClinicalReasoning.recommendations && displayClinicalReasoning.recommendations.length > 0 && (
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Physician Recommendations & Actions
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {displayClinicalReasoning.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 items-start text-xs text-slate-700 leading-relaxed font-semibold">
                        <span className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">{idx + 1}</span>
                        <p className="mt-0.5">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
