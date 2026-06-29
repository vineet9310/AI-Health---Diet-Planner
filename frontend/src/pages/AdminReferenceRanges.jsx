import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Save, Trash, AlertCircle, RefreshCw, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const AdminReferenceRanges = () => {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [testName, setTestName] = useState('');
  const [unit, setUnit] = useState('');
  const [minNormal, setMinNormal] = useState('');
  const [maxNormal, setMaxNormal] = useState('');
  const [criticalLow, setCriticalLow] = useState('');
  const [criticalHigh, setCriticalHigh] = useState('');
  const [borderlineLowThreshold, setBorderlineLowThreshold] = useState('');
  const [borderlineHighThreshold, setBorderlineHighThreshold] = useState('');
  const [category, setCategory] = useState('lipid profile');
  const [aliases, setAliases] = useState('');

  const fetchRanges = async () => {
    try {
      const data = await api('/admin/reference-ranges');
      setRanges(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve reference ranges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const handleEditSelect = (range) => {
    setError('');
    setSuccess('');
    setEditingId(range._id);
    
    setTestName(range.testName);
    setUnit(range.unit);
    setMinNormal(range.minNormal);
    setMaxNormal(range.maxNormal);
    setCriticalLow(range.criticalLow || '');
    setCriticalHigh(range.criticalHigh || '');
    setBorderlineLowThreshold(range.borderlineLowThreshold || '');
    setBorderlineHighThreshold(range.borderlineHighThreshold || '');
    setCategory(range.category || 'lipid profile');
    setAliases(range.aliases ? range.aliases.join(', ') : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    clearForm();
  };

  const clearForm = () => {
    setTestName('');
    setUnit('');
    setMinNormal('');
    setMaxNormal('');
    setCriticalLow('');
    setCriticalHigh('');
    setBorderlineLowThreshold('');
    setBorderlineHighThreshold('');
    setCategory('lipid profile');
    setAliases('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reference range?')) return;
    setError('');
    setSuccess('');
    try {
      await api(`/admin/reference-ranges/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Reference range deleted successfully!');
      fetchRanges();
    } catch (err) {
      setError(err.message || 'Failed to delete reference range.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!testName || !unit || minNormal === '' || maxNormal === '') {
      return setError('Please fill in all required fields.');
    }

    const payload = {
      testName,
      unit,
      minNormal: parseFloat(minNormal),
      maxNormal: parseFloat(maxNormal),
      criticalLow: criticalLow !== '' ? parseFloat(criticalLow) : undefined,
      criticalHigh: criticalHigh !== '' ? parseFloat(criticalHigh) : undefined,
      borderlineLowThreshold: borderlineLowThreshold !== '' ? parseFloat(borderlineLowThreshold) : undefined,
      borderlineHighThreshold: borderlineHighThreshold !== '' ? parseFloat(borderlineHighThreshold) : undefined,
      category,
      aliases: aliases.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      if (editingId) {
        // Update
        await api(`/admin/reference-ranges/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccess('Reference range updated successfully!');
      } else {
        // Create
        await api('/admin/reference-ranges', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Reference range added successfully!');
      }
      setEditingId(null);
      clearForm();
      fetchRanges();
    } catch (err) {
      setError(err.message || 'Failed to save reference range.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        <p className="text-slate-500 text-sm">Synchronizing biomarker limits...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-heading">Biomarker Indexes</h2>
          <p className="text-slate-500 text-sm">Configure minimum, maximum, and critical levels of blood tests, lipid levels, and thyroid profiles.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-500/5 text-rose-700 text-sm flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-500/5 text-emerald-700 text-sm flex gap-2 items-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Lab Ranges Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading">Existing Indicators</h3>

            <>
              {/* Mobile Cards List (hidden on larger screens) */}
              <div className="flex flex-col gap-3 sm:hidden">
                {ranges.map((range) => (
                  <div key={range._id} className="glass-panel p-4 flex flex-col gap-3 border border-slate-200">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{range.testName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Aliases: {range.aliases?.join(', ') || 'None'}</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0 font-semibold">
                        {range.category}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5 font-semibold">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-450 uppercase font-bold">Optimal Range</span>
                        <span className="text-emerald-700">{range.minNormal} - {range.maxNormal} {range.unit}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-455 uppercase font-bold">Critical Limits</span>
                        <span className="text-rose-700">
                          Low: {range.criticalLow || 'N/A'} | High: {range.criticalHigh || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {(range.borderlineLowThreshold || range.borderlineHighThreshold) && (
                      <div className="text-[10px] text-teal-700 font-semibold bg-teal-500/5 border border-teal-100 p-2 rounded-lg leading-normal mt-0.5">
                        Custom Borders: Low={range.borderlineLowThreshold || '0.80'}x, High={range.borderlineHighThreshold || '1.20'}x
                      </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-2.5 mt-0.5">
                      <button 
                        onClick={() => {
                          handleEditSelect(range);
                          setTimeout(() => {
                            const formElement = document.getElementById('range-form-container');
                            if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 hover:text-teal-750"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(range._id)}
                        className="btn-secondary py-1.5 px-3 text-xs text-rose-500 hover:bg-rose-50 flex items-center gap-1 hover:border-rose-200"
                      >
                        <Trash className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (hidden on small screens) */}
              <div className="table-container hidden sm:block">
                <table>
                  <thead>
                    <tr className="bg-slate-50">
                      <th>Marker Name</th>
                      <th>Optimal Range</th>
                      <th>Crit Low</th>
                      <th>Crit High</th>
                      <th>Category</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranges.map((range) => (
                      <tr key={range._id} className="hover:bg-slate-50">
                        <td>
                          <div className="font-bold text-slate-800">{range.testName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Aliases: {range.aliases?.join(', ') || 'None'}</div>
                          {(range.borderlineLowThreshold || range.borderlineHighThreshold) && (
                            <div className="text-[10px] text-teal-700 mt-0.5 font-semibold">
                              Custom Borders: Low={range.borderlineLowThreshold || '0.80'}x, High={range.borderlineHighThreshold || '1.20'}x
                            </div>
                          )}
                        </td>
                        <td className="font-semibold text-emerald-700 text-xs">
                          {range.minNormal} - {range.maxNormal} <span className="text-[10px] text-slate-500">{range.unit}</span>
                        </td>
                        <td className="text-rose-700 text-xs">{range.criticalLow || 'N/A'}</td>
                        <td className="text-rose-700 text-xs">{range.criticalHigh || 'N/A'}</td>
                        <td>
                          <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                            {range.category}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditSelect(range)}
                              className="btn-secondary p-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit Range"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(range._id)}
                              className="btn-secondary p-1.5 text-xs text-rose-600 hover:bg-rose-50"
                              title="Delete Range"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          </div>
        </div>

        {/* Right Column: Add/Edit Panel Form */}
        <div id="range-form-container" className="lg:col-span-1">
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-5">
              <h3 className="text-lg font-bold font-heading flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-teal-700" />
                {editingId ? 'Edit Range' : 'Add New Range'}
              </h3>
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Test Name *</label>
                <input 
                  type="text"
                  required
                  className="glass-input text-xs"
                  placeholder="e.g. Fasting Glucose"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Measurement Unit *</label>
                <input 
                  type="text"
                  required
                  className="glass-input text-xs"
                  placeholder="e.g. mg/dL, g/dL, %"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Min Optimal *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="glass-input text-xs"
                    placeholder="70"
                    value={minNormal}
                    onChange={(e) => setMinNormal(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Optimal *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="glass-input text-xs"
                    placeholder="100"
                    value={maxNormal}
                    onChange={(e) => setMaxNormal(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Critical Low</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="glass-input text-xs"
                    placeholder="e.g. 40"
                    value={criticalLow}
                    onChange={(e) => setCriticalLow(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Critical High</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="glass-input text-xs"
                    placeholder="e.g. 250"
                    value={criticalHigh}
                    onChange={(e) => setCriticalHigh(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Borderline Custom Threshold Ratios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Borderline Low Ratio</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="glass-input text-xs"
                    placeholder="e.g. 0.80"
                    value={borderlineLowThreshold}
                    onChange={(e) => setBorderlineLowThreshold(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Borderline High Ratio</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="glass-input text-xs"
                    placeholder="e.g. 1.20"
                    value={borderlineHighThreshold}
                    onChange={(e) => setBorderlineHighThreshold(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</label>
                <select 
                  className="glass-input text-xs cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="blood sugar">Blood Sugar</option>
                  <option value="lipid profile">Lipid Profile</option>
                  <option value="thyroid">Thyroid Panel</option>
                  <option value="vitamins">Vitamins</option>
                  <option value="kidney panel">Kidney Panel</option>
                  <option value="blood count">Blood Count</option>
                  <option value="liver panel">Liver Panel</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">OCR Aliases (Comma separated)</label>
                <input 
                  type="text"
                  className="glass-input text-xs"
                  placeholder="e.g. FBS, glucose"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="btn-primary w-full mt-2"
              >
                {editingId ? (
                  <>
                    <Save className="w-4 h-4" /> Save Range
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add Range
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReferenceRanges;
