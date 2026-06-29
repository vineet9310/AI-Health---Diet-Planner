import React, { useState, useEffect } from 'react';
import { Users, Search, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api('/admin/users');
        setUsers(data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve users list.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 mt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        <p className="text-slate-500 text-sm">Compiling user database...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h2 className="text-3xl font-bold font-heading">User Directory</h2>
        <p className="text-slate-500 text-sm">Manage system permissions, assign roles, and view patient activity logs.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-500/5 text-rose-700 text-sm flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            className="glass-input pl-11"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
        </div>

        {/* Filter Selection */}
        <div className="flex gap-2 items-center w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:inline">Role:</span>
          <select 
            className="glass-input py-2.5 px-4 text-xs cursor-pointer w-full md:w-44"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Regular Users</option>
            <option value="nutritionist">Nutritionists</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

      </div>

      {/* Users Database list */}
      <div className="glass-panel p-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No matching users found in directory.
          </div>
        ) : (
          <>
            {/* Mobile Cards List (hidden on larger screens) */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filteredUsers.map((u) => (
                <div key={u._id} className="glass-panel p-4 flex flex-col gap-2 border border-slate-200">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-850 text-sm">{u.name}</span>
                    <span className={`badge ${
                      u.role === 'admin' 
                        ? 'badge-critical' 
                        : u.role === 'nutritionist' 
                          ? 'badge-borderline' 
                          : 'badge-normal'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-mono break-all">{u.email}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-2.5 mt-0.5">
                    <span>
                      Joined: {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-emerald-750 flex items-center gap-1 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="table-container hidden sm:block">
              <table>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th>Registration Date</th>
                    <th>Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="font-bold text-slate-800">{u.name}</div>
                      </td>
                      <td className="text-slate-600 font-mono text-xs">{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'admin' 
                            ? 'badge-critical' 
                            : u.role === 'nutritionist' 
                              ? 'badge-borderline' 
                              : 'badge-normal'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-slate-600">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td>
                        <span className="text-xs text-emerald-700 flex items-center gap-1.5 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default AdminUsers;
