import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface Skill {
  _id: string;
  title: string;
  category: string;
  level: string;
  status: string;
  owner: { _id: string; name: string };
  createdAt: string;
}

const AdminSkills: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetchJSON(`/admin/courses?${params.toString()}`);
        if (mounted) {
          setSkills(res || []);
          const cats = Array.from(new Set<string>((res || []).map((s: Skill) => s.category).filter(Boolean))).sort();
          setCategories(cats);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load skills');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [search, categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setProcessing(true);
    try {
      await fetchJSON(`/admin/skills/${deleteId}`, { method: 'DELETE' });
      setSkills((prev) => prev.filter((s) => s._id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete skill');
    } finally {
      setProcessing(false);
    }
  };

  if (!storedUser || storedUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Skill Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">View and manage all skills.</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Skill Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>}
                    {!loading && skills.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No skills found.</td></tr>}
                    {!loading && skills.map((skill) => (
                      <tr key={skill._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{skill.title}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{skill.category || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{skill.level || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{skill.owner?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${skill.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : skill.status === 'pending' ? 'bg-amber-100 text-amber-700' : skill.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {skill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(skill.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => setDeleteId(skill._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Skill</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Are you sure? This will update related exchange requests. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={processing} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm">
                {processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkills;
