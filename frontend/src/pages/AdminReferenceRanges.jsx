import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Save, Trash, AlertCircle, RefreshCw, X } from 'lucide-react';
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
    setCategory('lipid profile');
    setAliases('');
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
      clearForm();
      setEditingId(null);
      await fetchRanges();
    } catch (err) {
      setError(err.message || 'Failed to save reference range.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <p className="text-slate-400 text-sm">Synchronizing biomarker limits...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h2 className="text-3xl font-bold font-heading">Master Lab Indexes</h2>
        <p className="text-slate-400 text-sm">Configure minimum, maximum, and critical levels of blood tests, lipid levels, and thyroid profiles.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-sm flex gap-2 items-center">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Lab Ranges Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold font-heading">Existing Indicators</h3>

            <div className="table-container">
              <table>
                <thead>
                  <tr className="bg-slate-900/40">
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
                    <tr key={range._id} className="hover:bg-slate-900/10">
                      <td>
                        <div className="font-bold text-slate-200">{range.testName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Aliases: {range.aliases?.join(', ') || 'None'}</div>
                      </td>
                      <td className="font-semibold text-emerald-400 text-xs">
                        {range.minNormal} - {range.maxNormal} <span className="text-[10px] text-slate-500">{range.unit}</span>
                      </td>
                      <td className="text-rose-400 text-xs">{range.criticalLow || 'N/A'}</td>
                      <td className="text-rose-400 text-xs">{range.criticalHigh || 'N/A'}</td>
                      <td>
                        <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {range.category}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleEditSelect(range)}
                          className="btn-secondary p-1.5 hover:text-emerald-400"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Manage Range Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                {editingId ? 'Edit Range' : 'Add New Marker'}
              </h3>
              {editingId && (
                <button onClick={handleCancelEdit} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Test Name *</label>
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
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Measurement Unit *</label>
                <input 
                  type="text"
                  required
                  className="glass-input text-xs"
                  placeholder="e.g. mg/dL, %"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Optimal *</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Optimal *</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Low</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical High</label>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
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
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OCR Aliases (Comma separated)</label>
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
