import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

/**
 * CourseManagement Component (Teacher, owner-only)
 * Manage a skill's course: overview, unlimited modules, notes (PDF),
 * YouTube/recorded videos, live class link, assignments, quizzes and
 * view student feedback. Students cannot access this page.
 */

interface Quiz {
  _id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  notesFile?: string;
  videoLinks: string[];
  recordedVideoLinks: string[];
  liveClassLink?: string;
  assignments: string[];
  quizzes: Quiz[];
}

interface Skill {
  _id: string;
  title: string;
  category?: string;
  level?: string;
  owner: { _id: string } | string;
  courseDescription?: string;
  difficulty?: string;
  duration?: string;
  liveClassLink?: string;
  published: boolean;
  modules: Module[];
  rating?: number;
  notes?: string;
  notesFile?: string;
  videoLinks: string[];
  recordedVideoLinks: string[];
  referenceLinks: string[];
  githubLink?: string;
  assignments: string[];
}

interface FeedbackItem {
  _id: string;
  studentName: string;
  rating: number;
  comment: string;
}

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const CourseManagement: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);

  const [skill, setSkill] = useState<Skill | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'modules' | 'feedback'>('overview');
  const [saving, setSaving] = useState(false);

  // Overview draft
  const [overview, setOverview] = useState({
    courseDescription: '',
    difficulty: '',
    duration: '',
    liveClassLink: ''
  });

  // Module modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  // Quiz modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModuleId, setQuizModuleId] = useState('');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({ question: '', options: ['', ''], correctIndex: 0 });

  // Expanded module ids
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadSkill = useCallback(async () => {
    if (!skillId) return;
    const data = (await fetchJSON(`/skills/${skillId}`)) as Skill;
    setSkill(data);
    setOverview({
      courseDescription: data.courseDescription || '',
      difficulty: data.difficulty || '',
      duration: data.duration || '',
      liveClassLink: data.liveClassLink || ''
    });
  }, [skillId]);

  const loadFeedback = useCallback(async () => {
    if (!storedUser?._id) return;
    const all = (await fetchJSON('/requests/teacher')) as any[];
    const items: FeedbackItem[] = all
      .filter(
        (r) =>
          (r.skillRequested?._id === skillId || r.skillRequested === skillId) &&
          r.feedback &&
          r.feedback.rating > 0
      )
      .map((r) => ({
        _id: r._id,
        studentName: r.requester?.name || 'Student',
        rating: r.feedback.rating,
        comment: r.feedback.comment || ''
      }));
    setFeedback(items);
  }, [skillId, storedUser]);

  const loadStudents = useCallback(async () => {
    if (!storedUser?._id || !skillId) return;
    try {
      const all = (await fetchJSON('/requests/teacher')) as any[];
      const items = all.filter(
        (r) => r.skillRequested?._id === skillId || r.skillRequested === skillId
      );
      setStudents(items);
    } catch {
      // ignore
    }
  }, [skillId, storedUser]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!storedUser?._id) {
        if (mounted) {
          setError('Please log in');
          setLoading(false);
        }
        return;
      }
      try {
        const data = (await fetchJSON(`/skills/${skillId}`)) as Skill;
        if (!mounted) return;
        const ownerId = typeof data.owner === 'object' ? data.owner._id : data.owner;
        if (ownerId !== storedUser._id) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        setSkill(data);
        setOverview({
          courseDescription: data.courseDescription || '',
          difficulty: data.difficulty || '',
          duration: data.duration || '',
          liveClassLink: data.liveClassLink || ''
        });
        await loadFeedback();
        await loadStudents();
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [skillId, storedUser, loadFeedback, loadStudents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading course...</div>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">You are not authorized to manage this course.</div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error || 'Course not found'}</div>
        </div>
      </div>
    );
  }

  // ===== Overview handlers =====
  const saveOverview = async () => {
    setSaving(true);
    try {
      await fetchJSON(`/skills/${skillId}/publish`, {
        method: 'PATCH',
        body: JSON.stringify(overview)
      });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    setSaving(true);
    try {
      await fetchJSON(`/skills/${skillId}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ published: !skill.published })
      });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  // ===== Module handlers =====
  const openModuleModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setModuleForm({ title: mod.title, description: mod.description || '' });
    } else {
      setEditingModule(null);
      setModuleForm({ title: '', description: '' });
    }
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingModule) {
        await fetchJSON(`/skills/${skillId}/modules/${editingModule._id}`, {
          method: 'PUT',
          body: JSON.stringify(moduleForm)
        });
      } else {
        await fetchJSON(`/skills/${skillId}/modules`, {
          method: 'POST',
          body: JSON.stringify(moduleForm)
        });
      }
      setShowModuleModal(false);
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its content?')) return;
    try {
      await fetchJSON(`/skills/${skillId}/modules/${moduleId}`, { method: 'DELETE' });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to delete module');
    }
  };

  const uploadNotes = async (moduleId: string, file: File) => {
    const form = new FormData();
    form.append('notesFile', file);
    try {
      await fetchJSON(`/skills/${skillId}/modules/${moduleId}`, { method: 'PUT', body: form });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to upload notes');
    }
  };

  // Generic PATCH for a module's array/text fields
  const patchModule = async (moduleId: string, payload: any) => {
    try {
      await fetchJSON(`/skills/${skillId}/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    }
  };

  // ===== Quiz handlers =====
  const openQuizModal = (moduleId: string, quiz?: Quiz) => {
    setQuizModuleId(moduleId);
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({ question: quiz.question, options: [...quiz.options], correctIndex: quiz.correctIndex });
    } else {
      setEditingQuiz(null);
      setQuizForm({ question: '', options: ['', ''], correctIndex: 0 });
    }
    setShowQuizModal(true);
  };

  const saveQuiz = async () => {
    if (!quizForm.question.trim()) return;
    const options = quizForm.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    const payload = {
      question: quizForm.question,
      options,
      correctIndex: Math.min(quizForm.correctIndex, options.length - 1)
    };
    setSaving(true);
    try {
      if (editingQuiz) {
        await fetchJSON(`/skills/${skillId}/modules/${quizModuleId}/quizzes/${editingQuiz._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchJSON(`/skills/${skillId}/modules/${quizModuleId}/quizzes`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowQuizModal(false);
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (moduleId: string, quizId: string) => {
    try {
      await fetchJSON(`/skills/${skillId}/modules/${moduleId}/quizzes/${quizId}`, { method: 'DELETE' });
      await loadSkill();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
    }
  };

  const setExpandedState = (id: string, val: boolean) =>
    setExpanded((prev) => ({ ...prev, [id]: val }));

  const toggle = (id: string) => setExpandedState(id, !expanded[id]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/manage-skills')}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Manage Skills
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
            <div className="px-6 pb-6 -mt-12">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{skill.title}</h1>
                  <p className="text-slate-500 dark:text-slate-400">{skill.category} • {skill.level}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${skill.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {skill.published ? '✓ Published' : 'Draft'}
                  </span>
                  <button
                    onClick={togglePublish}
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl font-medium text-sm text-white ${skill.published ? 'bg-slate-500 hover:bg-slate-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {skill.published ? 'Unpublish' : 'Publish Course'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">{error}</div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
            {(['overview', 'students', 'modules', 'feedback'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 rounded-xl font-semibold capitalize transition-all ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {t === 'overview' ? '📖 Course Overview' : t === 'students' ? '👥 Students' : t === 'modules' ? '📂 Modules' : '⭐ Feedback'}
              </button>
            ))}
          </div>

          {/* ===== Overview Tab ===== */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course Description</label>
                <textarea
                  rows={4}
                  value={overview.courseDescription}
                  onChange={(e) => setOverview({ ...overview, courseDescription: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none resize-none dark:bg-slate-700 dark:text-white"
                  placeholder="Describe what students will learn in this course..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={overview.difficulty}
                    onChange={(e) => setOverview({ ...overview, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                  <input
                    value={overview.duration}
                    onChange={(e) => setOverview({ ...overview, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                    placeholder="e.g. 4 weeks"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Live Class Link (Google Meet / Zoom)</label>
                <input
                  value={overview.liveClassLink}
                  onChange={(e) => setOverview({ ...overview, liveClassLink: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Course Materials */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📚 Course Materials</h3>
                <div className="space-y-4">
                  {skill.notes && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                      <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-xl p-3">{skill.notes}</p>
                    </div>
                  )}
                  {skill.notesFile && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes PDF</label>
                      <a href={`/uploads/${skill.notesFile}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">View PDF</a>
                    </div>
                  )}
                  {skill.videoLinks && skill.videoLinks.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">YouTube Videos</label>
                      <div className="space-y-2">
                        {skill.videoLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="block text-sm text-indigo-600 underline truncate">{link}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {skill.recordedVideoLinks && skill.recordedVideoLinks.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recorded Videos</label>
                      <div className="space-y-2">
                        {skill.recordedVideoLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="block text-sm text-indigo-600 underline truncate">{link}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {skill.referenceLinks && skill.referenceLinks.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Reference Links</label>
                      <div className="space-y-2">
                        {skill.referenceLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" className="block text-sm text-indigo-600 underline truncate">{link}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {skill.githubLink && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">GitHub Repository</label>
                      <a href={skill.githubLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">{skill.githubLink}</a>
                    </div>
                  )}
                  {skill.assignments && skill.assignments.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Assignments</label>
                      <ul className="list-disc list-inside space-y-1">
                        {skill.assignments.map((a, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-300">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={saveOverview}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Overview'}
              </button>
            </div>
          )}

          {/* ===== Students Tab ===== */}
          {activeTab === 'students' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">👥 Students Enrolled ({students.length})</h2>
              {students.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">No students enrolled yet.</div>
              ) : (
                <div className="space-y-3">
                  {students.map((s) => {
                    const status = s.status || 'open';
                    const statusColors: Record<string, string> = {
                      open: 'bg-yellow-100 text-yellow-700',
                      pending: 'bg-yellow-100 text-yellow-700',
                      accepted: 'bg-green-100 text-green-700',
                      completed: 'bg-blue-100 text-blue-700',
                      rejected: 'bg-red-100 text-red-700',
                      cancelled: 'bg-gray-100 text-gray-700'
                    };
                    return (
                      <div key={s._id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{s.requester?.name || 'Student'}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Requested: {new Date(s.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                            {status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Progress</p>
                            <p className="font-bold text-slate-900 dark:text-white">{s.progress || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Quiz</p>
                            <p className="font-bold text-slate-900 dark:text-white">{s.quizScore || 0}/{s.quizTotal || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Assignment</p>
                            <p className="font-bold text-slate-900 dark:text-white capitalize">{(s.assignmentStatus || 'not_started').replace('_', ' ')}</p>
                          </div>
                        </div>
                        {s.feedback?.rating > 0 && (
                          <div className="mt-2 text-sm text-amber-600">⭐ {s.feedback.rating}/5 - {s.feedback.comment}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== Modules Tab ===== */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <button
                onClick={() => openModuleModal()}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                + Add Module
              </button>

              {skill.modules.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">No modules yet. Add your first module.</div>
              )}

              {skill.modules.map((mod) => (
                <div key={mod._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => toggle(mod._id)}>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📂</span>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{mod.title}</h3>
                        {mod.description && <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openModuleModal(mod)} className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">Edit</button>
                      <button onClick={() => deleteModule(mod._id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
                      <span className="text-slate-400">{expanded[mod._id] ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expanded[mod._id] && (
                    <div className="px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-700">
                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📄 Notes</label>
                        <textarea
                          rows={3}
                          defaultValue={mod.notes || ''}
                          onBlur={(e) => patchModule(mod._id, { notes: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none resize-none dark:bg-slate-700 dark:text-white"
                          placeholder="Write text notes for this module..."
                        />
                        <div className="flex items-center space-x-3 mt-2">
                          {mod.notesFile && (
                            <a href={`/uploads/${mod.notesFile}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">View PDF</a>
                          )}
                          <label className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200">
                            Upload PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadNotes(mod._id, f);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Live class link */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">💻 Live Class Link</label>
                        <input
                          defaultValue={mod.liveClassLink || ''}
                          onBlur={(e) => patchModule(mod._id, { liveClassLink: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none dark:bg-slate-700 dark:text-white"
                          placeholder="https://meet.google.com/..."
                        />
                      </div>

                      {/* String list editor for videos/assignments */}
                      <StringList
                        label="🎥 YouTube Videos"
                        items={mod.videoLinks}
                        placeholder="Paste YouTube URL"
                        onSave={(items) => patchModule(mod._id, { videoLinks: items })}
                      />
                      <StringList
                        label="🎥 Recorded Videos"
                        items={mod.recordedVideoLinks}
                        placeholder="Paste recorded video URL"
                        onSave={(items) => patchModule(mod._id, { recordedVideoLinks: items })}
                      />
                      <StringList
                        label="📝 Assignments"
                        items={mod.assignments}
                        placeholder="Describe an assignment"
                        textarea
                        onSave={(items) => patchModule(mod._id, { assignments: items })}
                      />

                      {/* Quizzes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">📝 Quizzes</label>
                          <button onClick={() => openQuizModal(mod._id)} className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">+ Add Quiz</button>
                        </div>
                        <div className="space-y-2">
                          {mod.quizzes.map((q) => (
                            <div key={q._id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-800 dark:text-slate-200">{q.question}</span>
                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => openQuizModal(mod._id, q)} className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">Edit</button>
                                  <button onClick={() => deleteQuiz(mod._id, q._id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {q.options.map((o, i) => (
                                  <span key={i} className={i === q.correctIndex ? 'font-semibold text-green-600 mr-2' : 'mr-2'}>
                                    {i === q.correctIndex ? '✓ ' : ''}{o}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                          {mod.quizzes.length === 0 && <p className="text-sm text-slate-400">No quizzes yet.</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ===== Feedback Tab ===== */}
          {activeTab === 'feedback' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              {feedback.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">No feedback yet from students.</div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((f) => (
                    <div key={f._id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{f.studentName}</h4>
                        <span className="text-amber-500 font-bold">★ {f.rating}/5</span>
                      </div>
                      {f.comment && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{f.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <Modal title={editingModule ? 'Edit Module' : 'Add Module'} onClose={() => setShowModuleModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
              <input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                placeholder="Module title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none resize-none"
                placeholder="Short description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
              <button onClick={saveModule} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
                {editingModule ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <Modal title={editingQuiz ? 'Edit Quiz' : 'Add Quiz'} onClose={() => setShowQuizModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Question</label>
              <input
                value={quizForm.question}
                onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
                placeholder="Enter question"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Options (select the correct one)</label>
              {quizForm.options.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={quizForm.correctIndex === i}
                    onChange={() => setQuizForm({ ...quizForm, correctIndex: i })}
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const opts = [...quizForm.options];
                      opts[i] = e.target.value;
                      setQuizForm({ ...quizForm, options: opts });
                    }}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                    placeholder={`Option ${i + 1}`}
                  />
                  {quizForm.options.length > 2 && (
                    <button onClick={() => setQuizForm({ ...quizForm, options: quizForm.options.filter((_, idx) => idx !== i) })} className="text-red-500">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setQuizForm({ ...quizForm, options: [...quizForm.options, ''] })} className="text-sm text-indigo-600 font-medium">+ Add option</button>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowQuizModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
              <button onClick={saveQuiz} disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-xl disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  // ===== helpers that mutate module quizzes optimistically through API =====
};

/**
 * Modal wrapper
 */
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      {children}
    </div>
  </div>
);

/**
 * StringList - manage an array of strings (videos / assignments) with add & remove
 */
const StringList: React.FC<{
  label: string;
  items: string[];
  placeholder: string;
  textarea?: boolean;
  onSave: (items: string[]) => void;
}> = ({ label, items, placeholder, textarea, onSave }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onSave([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <span className="text-xs text-slate-400">{items.length} added</span>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 truncate">{it}</span>
            <button onClick={() => onSave(items.filter((_, idx) => idx !== i))} className="text-red-500 px-2">✕</button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          {textarea ? (
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-indigo-500 resize-none dark:bg-slate-700 dark:text-white"
              placeholder={placeholder}
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder={placeholder}
            />
          )}
          <button onClick={add} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Add</button>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
