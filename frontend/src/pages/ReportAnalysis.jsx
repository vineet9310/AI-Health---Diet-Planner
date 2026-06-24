import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, ChevronLeft, ArrowRight, Activity, AlertCircle, Heart } from 'lucide-react';
import api from '../utils/api';
import Disclaimer from '../components/Disclaimer';

const ReportAnalysis = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api(`/reports/${id}`);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleGeneratePlan = async () => {
    setError('');
    setGenerating(true);

    try {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <p className="text-slate-400 text-sm">Parsing biometric indicators...</p>
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

  const { biomarkers, hasCriticalFlag, fileName, uploadedAt } = report;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/reports" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-300 font-semibold">{fileName}</span>
      </div>

      <Disclaimer />

      {/* Main Analysis Panel */}
      <div className="glass-panel p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
          <div>
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              Biomarker Lab Analysis
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Analyzed on {new Date(uploadedAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {hasCriticalFlag ? (
            <span className="badge badge-critical py-1.5 px-4 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Urgent Review Required
            </span>
          ) : (
            <span className="badge badge-normal py-1.5 px-4 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Standard Profile
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-400 mb-0.5">Safety Generation Block</h4>
              <p className="opacity-95">{error}</p>
            </div>
          </div>
        )}

        {/* Biomarkers Table */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold font-heading">Extracted Indicators</h3>
          
          {biomarkers.length === 0 ? (
            <div className="text-center py-12 border border-slate-900 rounded-xl bg-slate-900/5 text-slate-400 text-sm">
              We couldn't detect any structured biomarker values in the OCR text.
              Please upload a clearer lab sheet or check your reference range aliases in the Admin panel.
            </div>
          ) : (
            <div className="table-container border border-slate-900 rounded-xl overflow-hidden">
              <table>
                <thead>
                  <tr className="bg-slate-900/40">
                    <th>Biomarker Test</th>
                    <th>Measured Value</th>
                    <th>Reference Unit</th>
                    <th>Risk Category</th>
                  </tr>
                </thead>
                <tbody>
                  {biomarkers.map((bio, index) => {
                    let badgeClass = 'badge-normal';
                    if (bio.status.startsWith('borderline')) badgeClass = 'badge-borderline';
                    if (bio.status === 'low' || bio.status === 'high') badgeClass = 'badge-low';
                    if (bio.status === 'critical') badgeClass = 'badge-critical';

                    return (
                      <tr key={index}>
                        <td className="font-bold text-slate-200">{bio.testName}</td>
                        <td className="font-semibold text-white">{bio.value}</td>
                        <td className="text-slate-400">{bio.unit}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
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

        {/* Call to action generation bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-bold font-heading text-sm">Next Step: Calculate Custom Regimen</h4>
            <p className="text-xs text-slate-400 mt-0.5">We'll cross-reference these biomarker values with your health profile to yield a safe plan.</p>
          </div>

          {hasCriticalFlag ? (
            <button 
              disabled
              className="btn-primary bg-rose-900/50 border border-rose-900/80 cursor-not-allowed opacity-50 flex gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Generation Blocked
            </button>
          ) : (
            <button 
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary min-w-[200px]"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Generate Health Plan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReportAnalysis;
