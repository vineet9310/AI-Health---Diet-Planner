import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  FileText, 
  TrendingUp, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  Menu,
  X
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const isAdmin = user && (user.role === 'admin' || user.role === 'nutritionist');

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, authRequired: true },
    { name: 'Upload Report', path: '/reports', icon: FileText, authRequired: false },
    { name: 'Progress Tracker', path: '/progress', icon: TrendingUp, authRequired: true },
    { name: 'Profile Setup', path: '/profile', icon: UserIcon, authRequired: true },
  ];

  const adminLinks = [
    { name: 'Admin Home', path: '/admin', icon: Activity },
    { name: 'Review Queue', path: '/admin/reviews', icon: ClipboardList },
    { name: 'Manage Ranges', path: '/admin/ranges', icon: Settings },
    { name: 'User Directory', path: '/admin/users', icon: Users },
  ];

  return (
    <nav className="glass-panel rounded-none border-t-0 border-x-0 border-b relative z-50 sticky top-0 px-6 py-4 flex justify-between items-center bg-white/80">
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-2 rounded-lg text-white font-bold flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <Link to="/" className="text-xl font-bold font-heading bg-gradient-to-r from-slate-900 to-teal-800 bg-clip-text text-transparent hover:opacity-90">
          VitalPlan
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => {
          if (link.authRequired && !user) return null;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                isActive(link.path) 
                  ? 'text-emerald-700 font-extrabold' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          );
        })}

        {user && isAdmin && (
          <div className="h-4 w-px bg-slate-200" />
        )}

        {user && isAdmin && adminLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-2 text-sm font-semibold transition-all ${
              isActive(link.path) 
                ? 'text-cyan-700 font-extrabold' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.name}
          </Link>
        ))}
      </div>

      <div className="hidden lg:flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-700 font-medium">
              Hello, <span className="text-emerald-700 font-bold">{user.name}</span>
              {isAdmin && <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">{user.role}</span>}
            </span>
            <button 
              onClick={handleLogoutClick}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-all font-medium">Sign In</Link>
            <Link to="/signup" className="btn-primary py-2 px-4 text-sm">Join VitalPlan</Link>
          </div>
        )}
      </div>

      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute top-[69px] left-0 right-0 glass-panel rounded-none border-x-0 border-b border-t-0 p-6 flex flex-col gap-5 bg-white shadow-2xl lg:hidden">
          {user && (
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Hi, {user.name} 
                {isAdmin && <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">{user.role}</span>}
              </span>
            </div>
          )}

          {navLinks.map((link) => {
            if (link.authRequired && !user) return null;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 text-sm font-medium ${
                  isActive(link.path) ? 'text-emerald-700 font-bold' : 'text-slate-600'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}

          {user && isAdmin && (
            <>
              <div className="border-t border-slate-100 my-1 pt-3">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Admin Portal</p>
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 text-sm font-medium ${
                    isActive(link.path) ? 'text-cyan-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
            </>
          )}

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            {user ? (
              <button 
                onClick={() => { setIsOpen(false); handleLogoutClick(); }}
                className="w-full btn-secondary text-rose-600 hover:bg-rose-500/10 justify-start"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary w-full">Sign In</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-primary w-full">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
