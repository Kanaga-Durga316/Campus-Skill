import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface AnalyticsData {
  userGrowth: { _id: string; count: number }[];
  skillDistribution: { _id: string; count: number }[];
  requestStatusDistribution: { _id: string; count: number }[];
  departmentDistribution: { _id: string; count: number }[];
}

const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [data, setData] = useState<AnalyticsData | null>(null);
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
        const res = await fetchJSON('/admin/analytics');
        if (mounted) setData(res);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate, storedUser]);

  if (!storedUser || storedUser.role !== 'admin') return null;

  const maxCount = (arr: { count: number }[]) => Math.max(...arr.map((i) => i.count), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Platform insights and trends.</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            {loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-64" />
                ))}
              </div>
            )}

            {!loading && data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Growth</h3>
                  {data.userGrowth.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
                    <div className="space-y-2">
                      {data.userGrowth.slice(-10).map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-24">{item._id}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.count / maxCount(data.userGrowth)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Skill Categories</h3>
                  {data.skillDistribution.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
                    <div className="space-y-2">
                      {data.skillDistribution.map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-32 truncate">{item._id}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(item.count / maxCount(data.skillDistribution)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Request Status Distribution</h3>
                  {data.requestStatusDistribution.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
                    <div className="space-y-2">
                      {data.requestStatusDistribution.map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-32">{item._id}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.count / maxCount(data.requestStatusDistribution)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Department Distribution</h3>
                  {data.departmentDistribution.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
                    <div className="space-y-2">
                      {data.departmentDistribution.map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-32 truncate">{item._id}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(item.count / maxCount(data.departmentDistribution)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
