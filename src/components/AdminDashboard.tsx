import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface CsvPreviewRow {
  name: string;
  email: string;
  collegeName: string;
  department: string;
  year: string;
  skills: string;
  offerSkills: string;
  wantedSkills: string;
}

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

interface AdminSkill {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  tags: string[];
  owner: { _id: string; name: string };
  courseDescription: string;
  notes: string;
  notesFile: string;
  videoLinks: string[];
  recordedVideoLinks: string[];
  liveClassLink: string;
  referenceLinks: string[];
  assignments: string[];
  githubLink: string;
  difficulty: string;
  duration: string;
  modules: any[];
  thumbnail: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submittedAt: string;
  approvedAt: string;
  approvedBy: { name: string } | string;
  rejectionReason: string;
  adminComments: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-500', icon: '🕑' },
  pending: { label: 'Pending Review', color: 'bg-amber-500', icon: '⏳' },
  approved: { label: 'Approved', color: 'bg-emerald-500', icon: '✅' },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: '❌' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-500', icon: '📝' },
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [courses, setCourses] = useState<AdminSkill[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCourse, setSelectedCourse] = useState<AdminSkill | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComments, setAdminComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const parseCsvPreview = (file: File): Promise<CsvPreviewRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          resolve([]);
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const rows: CsvPreviewRow[] = [];
        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          rows.push(row as CsvPreviewRow);
        }
        resolve(rows);
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const handleCsvFile = async (file: File) => {
    setCsvError('');
    setImportSummary(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Only CSV files are allowed');
      return;
    }
    setCsvFile(file);
    try {
      const preview = await parseCsvPreview(file);
      setCsvPreview(preview);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to parse CSV');
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCsvFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCsvFile(file);
  };

  const handleImportCsv = async () => {
    if (!csvFile) return;
    setImporting(true);
    setCsvError('');
    setImportSummary(null);
    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      const result = await fetchJSON('/admin/import-csv', {
        method: 'POST',
        body: formData,
      });
      setImportSummary(result);
      const [statsRes, coursesRes] = await Promise.all([
        fetchJSON('/admin/stats'),
        fetchJSON('/admin/courses'),
      ]);
      setStats(statsRes);
      setCourses(coursesRes as AdminSkill[]);
      const cats = Array.from(new Set<string>(coursesRes.map((c: AdminSkill) => c.category))).sort();
      setCategories(cats);
    } catch (err: any) {
      setCsvError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          fetchJSON('/admin/stats'),
          fetchJSON('/admin/courses'),
        ]);

        const courseList = coursesRes as AdminSkill[];
        const cats = Array.from(new Set(courseList.map((c) => c.category))).sort();

        if (mounted) {
          setStats(statsRes);
          setCourses(courseList);
          setCategories(cats);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load data');
      }
    };

    load();
    return () => { mounted = false; };
  }, [storedUser, navigate]);

  const filtered = useMemo(() => {
    let items = [...courses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.owner.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      items = items.filter((c) => c.category === categoryFilter);
    }

    if (sortBy === 'date') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return items;
  }, [courses, searchQuery, statusFilter, categoryFilter, sortBy]);

  const handleAction = async () => {
    if (!selectedCourse || !actionType) return;

    setProcessing(true);
    setError('');

    try {
      if (actionType === 'approve') {
        await fetchJSON(`/admin/courses/${selectedCourse._id}/approve`, { method: 'POST' });
      } else if (actionType === 'reject') {
        if (!rejectionReason.trim()) {
          setError('Rejection reason is required');
          setProcessing(false);
          return;
        }
        await fetchJSON(`/admin/courses/${selectedCourse._id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ rejectionReason, adminComments }),
        });
      } else if (actionType === 'changes') {
        if (!adminComments.trim()) {
          setError('Comments are required');
          setProcessing(false);
          return;
        }
        await fetchJSON(`/admin/courses/${selectedCourse._id}/request-changes`, {
          method: 'POST',
          body: JSON.stringify({ adminComments }),
        });
      }

      const [statsRes, coursesRes] = await Promise.all([
        fetchJSON('/admin/stats'),
        fetchJSON('/admin/courses'),
      ]);
      setStats(statsRes);
      setCourses(coursesRes as AdminSkill[]);
      setSelectedCourse(null);
      setActionType(null);
      setRejectionReason('');
      setAdminComments('');
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const openAction = (course: AdminSkill, action: 'approve' | 'reject' | 'changes') => {
    setSelectedCourse(course);
    setActionType(action);
    setRejectionReason('');
    setAdminComments('');
    setError('');
  };

  if (!storedUser || storedUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-slate-100 overflow-hidden">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10 animate-fadeIn">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🛠️ Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-2 text-lg">Verify and manage course submissions</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl hover:bg-slate-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-2xl backdrop-blur-sm animate-pulse">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <StatCard label="Total Courses" value={stats.totalCourses} icon="📚" color="from-indigo-500 to-indigo-600" />
              <StatCard label="Pending" value={stats.pendingApprovals} icon="⏳" color="from-amber-500 to-amber-600" />
              <StatCard label="Approved" value={stats.approvedCourses} icon="✅" color="from-emerald-500 to-emerald-600" />
              <StatCard label="Rejected" value={stats.rejectedCourses} icon="❌" color="from-red-500 to-red-600" />
               <StatCard label="Change Requests" value={stats.changeRequests} icon="📝" color="from-orange-500 to-orange-600" />
            </div>
          )}

          {/* CSV Import Section */}
          <div className="mb-8">
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-left hover:bg-slate-800 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📥</span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Import Students from CSV</h3>
                  <p className="text-sm text-slate-400">Bulk import users, skills, and courses</p>
                </div>
              </div>
              <span className={`text-slate-400 transition-transform duration-300 ${showImport ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showImport && (
              <div className="mt-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl animate-fadeIn">
                {!csvFile ? (
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                      dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-5xl mb-4">📁</div>
                    <p className="text-lg font-medium text-slate-200 mb-2">Drag and drop your CSV file here</p>
                    <p className="text-sm text-slate-400 mb-4">or click to browse</p>
                    <p className="text-xs text-slate-500">Supported format: .csv (max 5MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="font-medium text-slate-200">{csvFile.name}</p>
                          <p className="text-xs text-slate-400">{(csvFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setCsvFile(null); setCsvPreview([]); setImportSummary(null); setCsvError(''); }}
                        className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-all"
                      >
                        Remove
                      </button>
                    </div>

                    {csvPreview.length > 0 && (
                      <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden">
                        <p className="text-xs font-semibold text-slate-400 uppercase px-4 py-2 border-b border-slate-700/30">
                          Preview (first {csvPreview.length} records)
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-900/50">
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Name</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Email</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">College</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Department</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Year</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Offer Skills</th>
                                <th className="px-4 py-2 text-left text-slate-400 font-medium">Wanted Skills</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.map((row, idx) => (
                                <tr key={idx} className="border-t border-slate-700/20">
                                  <td className="px-4 py-2 text-slate-200">{row.name}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.email}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.collegeName}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.department}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.year}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.offerSkills}</td>
                                  <td className="px-4 py-2 text-slate-300">{row.wantedSkills}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {csvError && (
                      <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl">
                        {csvError}
                      </div>
                    )}

                    {importSummary && (
                      <div className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl space-y-2">
                        <h4 className="font-semibold text-slate-200">Import Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-indigo-400">{importSummary.usersCreated}</p>
                            <p className="text-xs text-slate-400">Users Created</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-amber-400">{importSummary.usersSkipped}</p>
                            <p className="text-xs text-slate-400">Users Skipped</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{importSummary.skillsCreated + importSummary.coursesCreated}</p>
                            <p className="text-xs text-slate-400">Skills/Courses Created</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-slate-300">{importSummary.totalRecords}</p>
                            <p className="text-xs text-slate-400">Total Records</p>
                          </div>
                        </div>
                        {importSummary.errors.length > 0 && (
                          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                            {importSummary.errors.map((err: string, idx: number) => (
                              <p key={idx} className="text-xs text-red-300 bg-red-500/10 rounded px-2 py-1">{err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleImportCsv}
                      disabled={importing}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <span>📥</span>
                          <span>Import CSV</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xl hover:shadow-indigo-500/20 transition-shadow duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-2 border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-100 placeholder-slate-500 transition-all duration-300 group-hover:border-slate-600"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/60 border-2 border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-100 transition-all duration-300 hover:border-slate-600"
              >
                <option value="all" className="bg-slate-800">All Statuses</option>
                <option value="pending" className="bg-slate-800">Pending</option>
                <option value="approved" className="bg-slate-800">Approved</option>
                <option value="rejected" className="bg-slate-800">Rejected</option>
                <option value="changes_requested" className="bg-slate-800">Needs Changes</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/60 border-2 border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-100 transition-all duration-300 hover:border-slate-600"
              >
                <option value="all" className="bg-slate-800">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-slate-800/60 border-2 border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-100 transition-all duration-300 hover:border-slate-600"
              >
                <option value="date" className="bg-slate-800">Sort by Date</option>
                <option value="name" className="bg-slate-800">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 animate-fadeIn">
                <div className="text-6xl mb-4">🔍</div>
                <p>No courses found matching your filters.</p>
              </div>
            ) : (
              filtered.map((course, idx) => (
                <div
                  key={course._id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CourseCard course={course} onAction={openAction} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {selectedCourse && actionType && (
        <ActionModal
          course={selectedCourse}
          actionType={actionType}
          rejectionReason={rejectionReason}
          adminComments={adminComments}
          processing={processing}
          error={error}
          onRejectionReasonChange={setRejectionReason}
          onAdminCommentsChange={setAdminComments}
          onSubmit={handleAction}
          onCancel={() => {
            setSelectedCourse(null);
            setActionType(null);
            setError('');
          }}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div
    className="relative group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:border-slate-600 overflow-hidden"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
    <div className="relative z-10">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{label}</p>
    </div>
  </div>
);

const CourseCard: React.FC<{
  course: AdminSkill;
  onAction: (course: AdminSkill, action: 'approve' | 'reject' | 'changes') => void;
}> = ({ course, onAction }) => {
  const status = course.status as keyof typeof statusConfig;
  const statusInfo = statusConfig[status] || statusConfig.draft;
  const isPending = course.status === 'pending';

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-slate-800/30 backdrop-blur-xl border border-slate-700/50
        shadow-xl
        transition-all duration-300
        hover:scale-[1.01] hover:border-slate-600
        ${isPending ? 'ring-1 ring-amber-500/30' : 'hover:ring-1 hover:ring-slate-600/50'}
      `}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusInfo.color.replace('bg-', 'from-')}-500 to-transparent`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-2xl font-bold text-white">{course.title}</h3>
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                bg-slate-900/50 text-slate-200 border border-slate-700
                ${isPending ? 'animate-pulse' : ''}
              `}>
                <span className="text-xs">{statusInfo.icon}</span>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{course.description || course.courseDescription}</p>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <InfoItem label="Teacher" value={course.owner.name} icon="👨‍🏫" />
          <InfoItem label="Category" value={course.category} icon="🏷️" />
          <InfoItem label="Level" value={course.level} icon="📊" />
          <InfoItem label="Difficulty" value={course.difficulty || 'N/A'} icon="⭐" />
          <InfoItem label="Duration" value={course.duration || 'N/A'} icon="⏱️" />
          <InfoItem label="Submitted" value={course.submittedAt ? new Date(course.submittedAt).toLocaleDateString() : 'N/A'} icon="📅" />
        </div>

        {/* Documents & Resources */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-3">📎 Uploaded Documents & Resources</h4>

          <div className="space-y-2 mb-3">
            {course.notesFile && (
              <DocumentItem icon="📄" label="Course Notes PDF" fileName={course.notesFile} href={`/uploads/${course.notesFile}`} />
            )}
            {course.thumbnail && (
              <DocumentItem icon="🖼️" label="Course Thumbnail" fileName={course.thumbnail} href={course.thumbnail.startsWith('http') ? course.thumbnail : `/uploads/${course.thumbnail}`} />
            )}
          </div>

          <div className="space-y-2 mb-3">
            {course.videoLinks && course.videoLinks.length > 0 && (
              <LinkRow label="🎥 YouTube Videos" items={course.videoLinks} />
            )}
            {course.recordedVideoLinks && course.recordedVideoLinks.length > 0 && (
              <LinkRow label="📹 Recorded Videos" items={course.recordedVideoLinks} />
            )}
            {course.referenceLinks && course.referenceLinks.length > 0 && (
              <LinkRow label="🔗 Reference Links" items={course.referenceLinks} />
            )}
            {course.githubLink && (
              <LinkRow label="💻 GitHub Repository" items={[course.githubLink]} />
            )}
            {course.liveClassLink && (
              <LinkRow label="📲 Live Class Link" items={[course.liveClassLink]} />
            )}
          </div>

          <div className="space-y-3 mb-3">
            {course.notes && (
              <div>
                <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">📝 Course Notes (text)</span>
                <div className="text-sm text-slate-300 bg-slate-900/20 border border-slate-700/30 rounded-xl p-3 line-clamp-3">{course.notes}</div>
              </div>
            )}
            {course.courseDescription && (
              <div>
                <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">📋 Course Description</span>
                <div className="text-sm text-slate-300 bg-slate-900/20 border border-slate-700/30 rounded-xl p-3 line-clamp-3">{course.courseDescription}</div>
              </div>
            )}
            {course.assignments && course.assignments.length > 0 && (
              <div>
                <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">📋 Assignments</span>
                <ul className="list-disc list-inside space-y-1">
                  {course.assignments.map((a, i) => (
                    <li key={i} className="text-sm text-slate-300">{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {course.tags && course.tags.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">🏷️ Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Comments / Rejection Reason */}
        {course.rejectionReason && (
          <div className="mb-3 p-4 bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl animate-fadeIn">
            <span className="font-semibold">❌ Rejection Reason:</span> {course.rejectionReason}
          </div>
        )}
        {course.adminComments && (
          <div className="mb-3 p-4 bg-orange-900/20 border border-orange-500/30 text-orange-300 rounded-xl animate-fadeIn">
            <span className="font-semibold">📝 Admin Comments:</span> {course.adminComments}
          </div>
        )}

        {/* Module-level documents */}
        {course.modules && course.modules.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-3">📂 Module Documents</h4>
            <div className="space-y-3">
              {course.modules.map((mod: any) => (
                <div key={mod._id} className="bg-slate-900/20 border border-slate-700/30 rounded-xl p-3 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-200">{mod.title}</span>
                    {mod.quizzes && mod.quizzes.length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                        {mod.quizzes.length} quiz{mod.quizzes.length > 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 ml-2">
                    {mod.notesFile && (
                      <DocumentItem icon="📄" label="Module Notes PDF" fileName={mod.notesFile} href={`/uploads/${mod.notesFile}`} small />
                    )}
                    {mod.notes && (
                      <p className="text-xs text-slate-400 line-clamp-1">Notes: {mod.notes.substring(0, 80)}{mod.notes.length > 80 && '...'}</p>
                    )}
                    {mod.videoLinks && mod.videoLinks.length > 0 && (
                      <LinkRow label="🎥 Videos" items={mod.videoLinks} small />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
          <button
            onClick={() => onAction(course, 'approve')}
            disabled={course.status === 'approved'}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-emerald-500 to-emerald-600
              hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
            `}
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onAction(course, 'changes')}
            disabled={course.status === 'approved'}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-orange-600
              hover:from-orange-400 hover:to-orange-500 hover:shadow-lg hover:shadow-orange-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
            `}
          >
            Request Changes
          </button>
          <button
            onClick={() => onAction(course, 'reject')}
            disabled={course.status === 'approved'}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-red-500 to-red-600
              hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
            `}
          >
            ✕ Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="flex items-center gap-2 p-2 bg-slate-900/20 rounded-lg border border-slate-700/30 transition-all duration-300 hover:bg-slate-900/40">
    <span className="text-slate-400">{icon}</span>
    <div>
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-sm font-medium text-slate-200 ml-1">{value}</span>
    </div>
  </div>
);

const DocumentItem: React.FC<{
  icon: string;
  label: string;
  fileName: string;
  href: string;
  small?: boolean;
}> = ({ icon, label, fileName, href, small }) => (
  <div className={`flex items-center gap-3 p-3 bg-slate-900/20 border border-slate-700/30 rounded-xl transition-all duration-300 hover:bg-slate-900/40 hover:border-slate-600`}>
    <span className="text-lg">{icon}</span>
    <div className="flex-1 min-w-0">
      <span className={`text-slate-400 ${small ? 'text-xs' : 'text-sm'}`}>{label}:</span>
      <span className={`text-slate-300 font-medium ${small ? 'text-xs' : 'text-sm'} block truncate`}>{fileName}</span>
    </div>
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`
        text-xs px-3 py-1.5 rounded-lg font-medium
        bg-gradient-to-r from-indigo-500 to-purple-500 text-white
        hover:from-indigo-400 hover:to-purple-400
        hover:shadow-lg hover:shadow-indigo-500/30
        transition-all duration-300
      `}
    >
      Preview
    </a>
  </div>
);

const LinkRow: React.FC<{
  label: string;
  items: string[];
  small?: boolean;
}> = ({ label, items, small }) => (
  <div>
    <span className={`text-slate-500 flex items-center gap-1 mb-1 ${small ? 'text-xs' : 'text-xs'}`}>{label}</span>
    <div className="space-y-1">
      {items.map((item, i) => (
        <a
          key={i}
          href={item}
          target="_blank"
          rel="noreferrer"
          className={`
            text-indigo-400 underline truncate max-w-xs block
            hover:text-indigo-300 hover:underline
            transition-all duration-300
            ${small ? 'text-xs' : 'text-xs'}
          `}
        >
          {item}
        </a>
      ))}
    </div>
  </div>
);

const ActionModal: React.FC<{
  course: AdminSkill;
  actionType: 'approve' | 'reject' | 'changes';
  rejectionReason: string;
  adminComments: string;
  processing: boolean;
  error: string;
  onRejectionReasonChange: (v: string) => void;
  onAdminCommentsChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({ course, actionType, rejectionReason, adminComments, processing, error, onRejectionReasonChange, onAdminCommentsChange, onSubmit, onCancel }) => {
  const title = actionType === 'approve' ? 'Approve Course' : actionType === 'reject' ? 'Reject Course' : 'Request Changes';
  const gradientClass =
    actionType === 'approve'
      ? 'from-emerald-500 to-emerald-600'
      : actionType === 'reject'
      ? 'from-red-500 to-red-600'
      : 'from-orange-500 to-orange-600';

  const icon = actionType === 'approve' ? '✅' : actionType === 'reject' ? '❌' : '📝';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl p-8 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradientClass} flex items-center justify-center text-2xl`}>
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-slate-400 mt-1">"{course.title}" by {course.owner.name}</p>
          </div>
        </div>

        {actionType === 'reject' && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/30 border-2 border-slate-700 rounded-xl focus:border-red-500 outline-none resize-none text-slate-100 placeholder-slate-500 transition-all duration-300"
              placeholder="Explain why this course is being rejected..."
            />
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            {actionType === 'changes' ? 'Change Requested Comments *' : 'Optional Admin Comments'}
          </label>
          <textarea
            rows={3}
            value={adminComments}
            onChange={(e) => onAdminCommentsChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/30 border-2 border-slate-700 rounded-xl focus:border-indigo-500 outline-none resize-none text-slate-100 placeholder-slate-500 transition-all duration-300"
            placeholder={actionType === 'changes' ? 'Describe the changes needed...' : 'Add any additional notes (optional)...'}
          />
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={processing}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r ${gradientClass}
              hover:shadow-lg hover:shadow-indigo-500/30
              disabled:opacity-50
              transition-all duration-300
            `}
          >
            {processing ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="text-lg">{icon}</span>
                <span>{title}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
