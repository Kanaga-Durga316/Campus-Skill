import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import { fetchJSON } from '../api';

interface ImportRecord {
  _id: string;
  adminName: string;
  fileName: string;
  totalRows: number;
  usersCreated: number;
  usersSkipped: number;
  skillsCreated: number;
  coursesCreated: number;
  errorCount: number;
  status: string;
  errors: string[];
  createdAt: string;
}

const AdminImportHistory: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        const res = await fetchJSON(`/admin/import-history?page=${page}&limit=20`);
        if (mounted) {
          setRecords(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load import history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page]);

  if (!storedUser || storedUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Import History</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Track all CSV import operations.</p>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Imported By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Rows</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Skills</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Errors</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading && <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>}
                    {!loading && records.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">No import history found.</td></tr>}
                    {!loading && records.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{record.fileName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.adminName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.totalRows}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.usersCreated}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.skillsCreated + record.coursesCreated}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.errorCount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : record.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(record.createdAt).toLocaleDateString()}</td>
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
    </div>
  );
};

export default AdminImportHistory;
