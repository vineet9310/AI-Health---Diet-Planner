import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      onLogin(data, data.token);
      window.dispatchEvent(new Event('auth-change'));
      
      try {
        const status = await api('/profile/status');
        if (status.isComplete) {
          if (localStorage.getItem('generatePlanAfterLogin') === 'true') {
            localStorage.removeItem('generatePlanAfterLogin');
            try {
              await api('/plans/generate', { method: 'POST' });
            } catch (genErr) {
              console.error('Auto-generation failed after login:', genErr);
            }
          }
          navigate('/dashboard');
        } else {
          navigate('/complete-profile');
        }
      } catch (profileErr) {
        console.error('Failed to retrieve profile status:', profileErr);
        navigate('/complete-profile');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-4">
      <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-heading mb-1 text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-xs">Sign in to track progress and view your custom health plans.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-2 text-xs font-semibold mt-1"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-3">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-700 font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
