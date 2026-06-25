import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import ReportUpload from './pages/ReportUpload';
import ReportAnalysis from './pages/ReportAnalysis';
import Dashboard from './pages/Dashboard';
import ProgressTracker from './pages/ProgressTracker';
import AdminDashboard from './pages/AdminDashboard';
import AdminReviewQueue from './pages/AdminReviewQueue';
import AdminUsers from './pages/AdminUsers';
import AdminReferenceRanges from './pages/AdminReferenceRanges';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state
  const syncAuth = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    syncAuth();
    window.addEventListener('auth-change', syncAuth);
    return () => {
      window.removeEventListener('auth-change', syncAuth);
    };
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-height-screen flex items-center justify-center text-emerald-400 font-heading text-lg">
        <div className="flex flex-col items-center gap-3 mt-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
          Initializing VitalPlan...
        </div>
      </div>
    );
  }

  // Route Guards
  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />;
  };

  const AdminRoute = ({ children }) => {
    const isAdmin = user && (user.role === 'admin' || user.role === 'nutritionist');
    return isAdmin ? children : <Navigate to="/dashboard" replace />;
  };

  const SuperAdminOnlyRoute = ({ children }) => {
    const isSuperAdmin = user && user.role === 'admin';
    return isSuperAdmin ? children : <Navigate to="/admin" replace />;
  };

  return (
    <Router>
      <div className="bg-glow-container">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-3 max-w-7xl">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing user={user} />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" replace /> : <Signup onLogin={handleLogin} />} 
          />

          {/* Client Routes */}
          <Route path="/profile" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
          <Route path="/complete-profile" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
          <Route path="/reports" element={<ReportUpload user={user} />} />
          <Route path="/reports/:id" element={<ReportAnalysis user={user} />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard user={user} /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><ProgressTracker /></PrivateRoute>} />

          {/* Admin / Nutritionist Routes */}
          <Route path="/admin" element={<PrivateRoute><AdminRoute><AdminDashboard /></AdminRoute></PrivateRoute>} />
          <Route path="/admin/reviews" element={<PrivateRoute><AdminRoute><AdminReviewQueue /></AdminRoute></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute><AdminRoute><AdminUsers /></AdminRoute></PrivateRoute>} />
          
          {/* Admin-only Reference Ranges */}
          <Route path="/admin/ranges" element={<PrivateRoute><SuperAdminOnlyRoute><AdminReferenceRanges /></SuperAdminOnlyRoute></PrivateRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
