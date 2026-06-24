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
      navigate('/profile'); // Redirect straight to health profile setup on signup!
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="glass-panel w-full max-w-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold font-heading mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm">Join VitalPlan to receive personalized health plans.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input 
              type="text"
              required
              className="glass-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email"
              required
              className="glass-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Join As Role (For Testing)</label>
            <select 
              className="glass-input cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user" className="bg-slate-900 text-white">Regular User (Patient)</option>
              <option value="nutritionist" className="bg-slate-900 text-white">Nutritionist / Doctor</option>
              <option value="admin" className="bg-slate-900 text-white">System Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <input 
              type="password"
              required
              className="glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <input 
              type="password"
              required
              className="glass-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 border-t border-slate-900 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
