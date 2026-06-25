import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Signup = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // default is user, can select nutritionist for testing
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });

      onLogin(data, data.token);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/complete-profile'); // Redirect straight to health profile setup on signup!
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div className="glass-panel w-full max-w-2xl p-6 flex flex-col gap-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-heading mb-1 text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-xs">Join VitalPlan to receive personalized health plans.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input 
                type="text"
                required
                className="glass-input py-2 px-3 text-xs"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email"
                required
                className="glass-input py-2 px-3 text-xs"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Join As Role</label>
              <select 
                className="glass-input py-2 px-3 text-xs cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Regular User (Patient)</option>
                <option value="nutritionist">Nutritionist / Doctor</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-3 justify-between">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <input 
                type="password"
                required
                className="glass-input py-2 px-3 text-xs"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <input 
                type="password"
                required
                className="glass-input py-2 px-3 text-xs"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-2 text-xs font-semibold mt-1"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Sign Up
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
