import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface Course {
  _id: string;
  title: string;
  category: string;
  level: string;
  status: string;
  owner: { _id: string; name: string };
  modules: any[];
  createdAt: string;
}

const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [storedUser, navigate]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetchJSON(`/admin/courses?${params.toString()}`);
        if (mounted) setCourses(res || []);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load courses');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [search, statusFilter]);

  if (!storedUser || storedUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Course Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">View and manage all courses.</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Course Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Instructor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Modules</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>}
                    {!loading && courses.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No courses found.</td></tr>}
                    {!loading && courses.map((course) => (
                      <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{course.title}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{course.category || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{course.level || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{course.owner?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{course.modules?.length || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : course.status === 'pending' ? 'bg-amber-100 text-amber-700' : course.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(course.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
