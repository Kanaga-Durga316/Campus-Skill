import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  role: string;
  isActive: boolean;
  college: string;
  semester: string;
  studentId: string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('search', search);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetchJSON(`/admin/users?${params.toString()}`);
        if (mounted) {
          setUsers(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page, roleFilter, statusFilter, search]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    setProcessing(true);
    try {
      await fetchJSON(`/admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)));
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser({ ...user, isActive: !user.isActive });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await fetchJSON(`/admin/users/${selectedUser._id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      setShowDelete(false);
      setShowModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">User Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">View and manage all registered users.</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading && (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                    )}
                    {!loading && users.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
                    )}
                    {!loading && users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.department || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.year || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleView(user)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                            <button onClick={() => handleToggleStatus(user)} disabled={processing} className="text-amber-600 hover:text-amber-800 text-xs font-medium">
                              {user.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => { setSelectedUser(user); setShowDelete(true); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-slate-300 rounded-xl disabled:opacity-50 text-sm">Previous</button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-slate-300 rounded-xl disabled:opacity-50 text-sm">Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Details</h3>
              <button onClick={() => { setShowModal(false); setSelectedUser(null); setShowDelete(false); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Name</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.name}</p></div>
                <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.email}</p></div>
                <div><p className="text-xs text-slate-500">Department</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.department || '—'}</p></div>
                <div><p className="text-xs text-slate-500">Year</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.year || '—'}</p></div>
                <div><p className="text-xs text-slate-500">College</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.college || '—'}</p></div>
                <div><p className="text-xs text-slate-500">Student ID</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.studentId || '—'}</p></div>
                <div><p className="text-xs text-slate-500">Role</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.role}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.isActive ? 'Active' : 'Disabled'}</p></div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              <button onClick={() => setShowDelete(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm">Delete User</button>
              <button onClick={() => { setShowModal(false); setSelectedUser(null); }} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone and may affect related records.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Cancel</button>
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

export default AdminUsers;
