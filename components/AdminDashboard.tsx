import React, { useState, useEffect } from 'react';

import { Footer } from './Footer';

interface AdminDeal {
  id: string;
  url: string;
  userEmail: string;
  score: number;
  askingPrice: number;
  revenue: number;
  sde: number;
  multiple: number;
  keywords: string;
  timestamp: number;
  crm?: any;
}

export const AdminDashboard: React.FC = () => {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  type SortField = 'userEmail' | 'keywords' | 'score' | 'askingPrice' | 'revenue' | 'sde' | 'multiple' | 'crm' | 'timestamp';
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'crm') {
      aValue = a.crm?.status || '';
      bValue = b.crm?.status || '';
    }

    if (aValue === bValue) return 0;
    
    if (aValue === undefined || aValue === null) return sortDirection === 'desc' ? 1 : -1;
    if (bValue === undefined || bValue === null) return sortDirection === 'desc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'desc' 
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }

    return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage('Password changed successfully!');
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setPasswordMessage('');
        }, 2000);
      } else {
        setPasswordMessage(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordMessage('Network error');
    }
  };

  const fetchDeals = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/deals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeals(data.sort((a: AdminDeal, b: AdminDeal) => b.timestamp - a.timestamp));
      } else {
        if (res.status === 401) {
          setToken(null);
          localStorage.removeItem('admin_token');
        }
      }
    } catch (err) {
      console.error("Failed to fetch deals", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDeals();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-display font-bold text-white mb-6 text-center tracking-wider uppercase">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded uppercase tracking-widest transition-colors"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 opacity-0 group-hover:opacity-50">↓</span>;
    return <span className="ml-1 text-cyan-400">{sortDirection === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Global view of all user searches and saved deals</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded transition-colors"
            >
              Change Password
            </button>
            <button 
              onClick={fetchDeals}
              className="text-sm text-cyan-400 hover:text-white border border-cyan-700 hover:border-cyan-500 px-4 py-2 rounded transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button 
              onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Change Admin Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                    required
                    minLength={4}
                  />
                </div>
                {passwordMessage && (
                  <p className={`text-sm ${passwordMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMessage}
                  </p>
                )}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 select-none">
                <tr>
                  <th className="p-4 font-semibold cursor-pointer hover:text-white group" onClick={() => handleSort('userEmail')}>
                    User Email <SortIcon field="userEmail" />
                  </th>
                  <th className="p-4 font-semibold cursor-pointer hover:text-white group" onClick={() => handleSort('keywords')}>
                    Deal / URL <SortIcon field="keywords" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('score')}>
                    Score <SortIcon field="score" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('askingPrice')}>
                    Asking Price <SortIcon field="askingPrice" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('revenue')}>
                    Revenue <SortIcon field="revenue" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('sde')}>
                    SDE <SortIcon field="sde" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('multiple')}>
                    Mult. <SortIcon field="multiple" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('crm')}>
                    CRM Status <SortIcon field="crm" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('timestamp')}>
                    Date <SortIcon field="timestamp" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">No deals found in the database.</td>
                  </tr>
                ) : (
                  sortedDeals.map(deal => (
                    <tr key={deal.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-slate-300">{deal.userEmail}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200 truncate max-w-[200px]" title={deal.keywords}>
                          {deal.keywords || 'Unknown Business'}
                        </div>
                        <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 hover:underline truncate max-w-[200px] block mt-1">
                          {deal.url}
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold ${
                          deal.score >= 80 ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                          deal.score >= 60 ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' :
                          'bg-red-900/30 text-red-400 border border-red-500/30'
                        }`}>
                          {deal.score}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">${deal.askingPrice?.toLocaleString() || '-'}</td>
                      <td className="p-4 text-right font-mono text-slate-400">${deal.revenue?.toLocaleString() || '-'}</td>
                      <td className="p-4 text-right font-mono text-slate-400">${deal.sde?.toLocaleString() || '-'}</td>
                      <td className="p-4 text-center font-mono text-slate-400">{deal.multiple ? `${deal.multiple}x` : '-'}</td>
                      <td className="p-4 text-center">
                        {deal.crm?.status ? (
                          <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                            {deal.crm.status}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px] uppercase">None</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-500 text-xs">
                        {new Date(deal.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
