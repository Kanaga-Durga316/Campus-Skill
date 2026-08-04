import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

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

        {/* Resources */}
        <div className="space-y-3 mb-5">
          {course.tags && course.tags.length > 0 && (
            <ResourceRow label="🏷️ Tags" items={course.tags} variant="tags" />
          )}

          {course.notesFile && (
            <ResourceRow label="📄 Notes File" items={[course.notesFile]} variant="link" prefix="/uploads/" />
          )}

          {course.notes && (
            <div>
              <span className="text-xs text-slate-500">📝 Notes:</span>
              <p className="text-sm text-slate-300 mt-1 line-clamp-2">{course.notes}</p>
            </div>
          )}

          {course.videoLinks && course.videoLinks.length > 0 && (
            <ResourceRow label="🎥 YouTube Links" items={course.videoLinks} variant="link" />
          )}

          {course.referenceLinks && course.referenceLinks.length > 0 && (
            <ResourceRow label="🔗 Reference Links" items={course.referenceLinks} variant="link" />
          )}

          {course.githubLink && (
            <ResourceRow label="💻 GitHub" items={[course.githubLink]} variant="link" />
          )}

          {course.liveClassLink && (
            <ResourceRow label="📹 Live Class" items={[course.liveClassLink]} variant="link" />
          )}

          {course.assignments && course.assignments.length > 0 && (
            <ResourceRow label="📋 Assignments" items={course.assignments} variant="text" />
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

        {/* Modules */}
        {course.modules && course.modules.length > 0 && (
          <div className="mb-5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2">
              📂 Modules ({course.modules.length})
            </span>
            <div className="mt-1 space-y-2">
              {course.modules.map((mod: any) => (
                <div key={mod._id} className="text-sm text-slate-300 bg-slate-900/30 border border-slate-700/50 rounded-lg p-3 transition-all duration-300">
                  <span className="font-medium text-slate-200">{mod.title}</span>
                  {mod.notes && <p className="mt-1 text-slate-400 line-clamp-1">Notes: {mod.notes.substring(0, 100)}{mod.notes.length > 100 && '...'}</p>}
                  {mod.notesFile && (
                    <a href={`/uploads/${mod.notesFile}`} target="_blank" rel="noreferrer" className="text-indigo-400 underline text-xs block mt-1 hover:text-indigo-300">
                      Preview notes file
                    </a>
                  )}
                  {mod.videoLinks && mod.videoLinks.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {mod.videoLinks.map((v: string, i: number) => (
                        <a key={i} href={v} target="_blank" rel="noreferrer" className="text-indigo-400 underline text-xs block truncate hover:text-indigo-300">
                          {v}
                        </a>
                      ))}
                    </div>
                  )}
                  {mod.quizzes && mod.quizzes.length > 0 && (
                    <span className="text-slate-500 text-xs">Quiz questions: {mod.quizzes.length}</span>
                  )}
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

const ResourceRow: React.FC<{
  label: string;
  items: string[];
  variant: 'link' | 'text' | 'tags';
  prefix?: string;
}> = ({ label, items, variant, prefix }) => (
  <div>
    <span className="text-xs text-slate-500 flex items-center gap-1">{label}</span>
    <div className="mt-1 space-y-1">
      {items.map((item, i) => {
        const displayText = prefix ? item : item;
        if (variant === 'link') {
          return (
            <a
              key={i}
              href={prefix ? `${prefix}${item}` : item}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 underline truncate max-w-xs block hover:text-indigo-300 transition-colors"
            >
              {displayText}
            </a>
          );
        }
        if (variant === 'tags') {
          return (
            <span key={i} className="inline-block px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full mr-1 mb-1">
              {item}
            </span>
          );
        }
        return (
          <p key={i} className="text-xs text-slate-300 ml-1 line-clamp-1">
            {item}
          </p>
        );
      })}
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
