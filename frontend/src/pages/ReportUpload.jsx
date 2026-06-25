import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, Clock, XCircle, Trash2, Eye, AlertCircle } from 'lucide-react';
import api, { API_URL } from '../utils/api';

const ReportUpload = ({ user }) => {
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const fetchReports = async () => {
    if (!user) return;
    try {
      const data = await api('/reports');
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Poll for status updates every 5 seconds if there are reports in 'pending' status
    const interval = setInterval(() => {
      const hasPending = reports.some(r => r.analysisStatus === 'pending');
      if (hasPending) {
        fetchReports();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [reports, user]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const filename = selectedFile.name.toLowerCase();
    const hasAllowedExt = allowedExtensions.some(ext => filename.endsWith(ext));

    if (!hasAllowedExt) {
      return setError('Only PDF and Image files (PNG, JPG, JPEG, WEBP) are allowed.');
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      return setError('File is too large. Max limit is 10MB.');
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api('/reports/upload', {
        method: 'POST',
        body: formData
      });
      setFile(null);
      if (response.report && response.report._id) {
        localStorage.setItem('lastUploadedReportId', response.report._id);
        navigate(`/reports/${response.report._id}`);
      } else {
        fetchReports();
      }
    } catch (err) {
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this medical report?')) return;

    try {
      await api(`/reports/${id}`, {
        method: 'DELETE'
      });
      fetchReports();
    } catch (err) {
      setError(err.message || 'Failed to delete report.');
    }
  };

  const getStatusIconAndClass = (status, hasCritical) => {
    if (status === 'pending') {
      return { 
        icon: Clock, 
        text: 'Processing OCR...', 
        badgeClass: 'badge-borderline',
        bg: 'border-amber-500/20 bg-amber-500/5 text-amber-400' 
      };
    }
    if (status === 'failed') {
      return { 
        icon: XCircle, 
        text: 'OCR Failed', 
        badgeClass: 'badge-low',
        bg: 'border-rose-500/20 bg-rose-500/5 text-rose-400' 
      };
    }
    // Processed
    if (hasCritical) {
      return { 
        icon: AlertCircle, 
        text: 'Critical Flag', 
        badgeClass: 'badge-critical',
        bg: 'border-rose-500/40 bg-rose-500/10 text-rose-800' 
      };
    }
    return { 
      icon: CheckCircle, 
      text: 'Analyzed', 
      badgeClass: 'badge-normal',
      bg: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700' 
    };
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold font-heading">Medical Reports</h2>
          <p className="text-slate-400 text-sm">Upload medical files to extract biomarkers and analyze health indices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col gap-5">
            <h3 className="text-lg font-bold font-heading">Upload New Report</h3>
            
            {error && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-800 text-sm flex gap-2 items-center">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input 
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                />
                
                <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : 'Drag & drop your report here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, PNG, JPG, JPEG, or WEBP up to 10MB'}
                  </p>
                </div>
              </div>

              {file && (
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn-primary w-full"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Analyze Report'
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Reports History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading">Upload History</h3>

            {!user ? (
              <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center gap-3">
                <AlertCircle className="w-12 h-12 text-slate-500" />
                <p className="text-slate-700 text-sm font-semibold">Track Your Health Over Time</p>
                <p className="text-slate-500 text-xs max-w-sm">
                  Create a profile to save your uploaded reports, view historical trends, and get a complete clinical analysis.
                </p>
                <Link to="/signup" className="btn-primary mt-2 py-1.5 px-4 text-xs">
                  Create Account
                </Link>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50/50">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No reports uploaded yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Upload Date</th>
                      <th>Filename</th>
                      <th>Analysis Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => {
                      const status = getStatusIconAndClass(report.analysisStatus, report.hasCriticalFlag);
                      return (
                        <tr key={report._id}>
                          <td className="text-slate-500">
                            {new Date(report.uploadedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="font-semibold text-slate-800">{report.fileName}</td>
                          <td>
                            <span className={`badge ${status.badgeClass}`}>
                              <status.icon className="w-3 h-3" />
                              {status.text}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex gap-2 justify-end">
                              {report.analysisStatus === 'processed' && (
                                <Link 
                                  to={`/reports/${report._id}`}
                                  className="btn-secondary p-2 py-1 text-xs flex items-center gap-1.5 hover:text-emerald-400"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Link>
                              )}
                              <button 
                                onClick={(e) => handleDelete(report._id, e)}
                                className="btn-secondary p-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
    </div>
  );
};

export default ReportUpload;
