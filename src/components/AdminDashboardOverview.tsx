import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

const AdminDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, requestsRes] = await Promise.all([
          fetchJSON('/admin/dashboard/stats'),
          fetchJSON('/admin/requests?limit=5'),
        ]);
        if (mounted) {
          setStats(statsRes);
          setRecentActivity((requestsRes.data || []).slice(0, 5));
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate, storedUser]);

  if (!storedUser || storedUser.role !== 'admin') return null;

  const statCards: StatCard[] = stats
    ? [
        { label: 'Total Students', value: stats.totalUsers || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },
        { label: 'Total Skills', value: stats.totalSkills || 0, icon: '📚', color: 'from-indigo-500 to-indigo-600' },
        { label: 'Total Courses', value: stats.totalCourses || 0, icon: '🎓', color: 'from-emerald-500 to-emerald-600' },
        { label: 'Pending Requests', value: stats.pendingRequests || 0, icon: '⏳', color: 'from-amber-500 to-amber-600' },
        { label: 'Completed Exchanges', value: stats.completedExchanges || 0, icon: '✅', color: 'from-teal-500 to-teal-600' },
        { label: 'Total Messages', value: stats.totalMessages || 0, icon: '💬', color: 'from-purple-500 to-purple-600' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard Overview</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Welcome back, {storedUser.name?.split(' ')[0] || 'Admin'}</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-32" />
                ))}
              </div>
            )}

            {!loading && stats && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {statCards.map((card) => (
                    <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}>
                          {card.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => navigate('/admin/users')} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left">
                        <span className="text-2xl mb-2 block">👥</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Manage Users</span>
                      </button>
                      <button onClick={() => navigate('/admin/skills')} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left">
                        <span className="text-2xl mb-2 block">📚</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Manage Skills</span>
                      </button>
                      <button onClick={() => navigate('/admin/requests')} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left">
                        <span className="text-2xl mb-2 block">📬</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">View Requests</span>
                      </button>
                      <button onClick={() => navigate('/admin/import')} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left">
                        <span className="text-2xl mb-2 block">📥</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Import CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Requests</h3>
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentActivity.map((req: any) => (
                          <div key={req._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {req.requester?.name || 'Unknown'} → {req.responder?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {req.skillRequested?.title || 'Unknown skill'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
