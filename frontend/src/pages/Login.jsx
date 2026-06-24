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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="glass-panel w-full max-w-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold font-heading mb-1">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to track progress and view your custom health plans.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 border-t border-slate-900 pt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-400 font-semibold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
