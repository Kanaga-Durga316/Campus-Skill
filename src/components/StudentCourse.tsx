import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

/**
 * StudentCourse Component (enrolled student, READ-ONLY course content)
 * Enhanced with module navigation, secure quiz submission, exercise tracking,
 * module completion, and progress tracking.
 */

interface Quiz {
  _id: string;
  question: string;
  options: string[];
}

interface Exercise {
  _id: string;
  title: string;
  description: string;
  difficulty?: string;
  expectedOutcome?: string;
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
  exercises: Exercise[];
}

interface Enrollment {
  _id: string;
  requester: { _id: string; name: string };
  responder: { _id: string; name: string };
  skillRequested: {
    _id: string;
    title: string;
    category?: string;
    level?: string;
    courseDescription?: string;
    difficulty?: string;
    duration?: string;
    liveClassLink?: string;
    modules: Module[];
  };
  status: string;
  progress: number;
  quizScore: number;
  quizTotal: number;
  quizStatus: string;
  assignmentStatus: string;
  assignmentText?: string;
  completedModules: string[];
  completedExercises: string[];
  feedback: { rating: number; comment: string };
}

interface ChatMessage {
  _id: string;
  from: { _id: string; name: string };
  to: { _id: string; name: string };
  text: string;
  createdAt: string;
}

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const StudentCourse: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'discussion' | 'feedback'>('content');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Quiz taking state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; status: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Exercise state
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Assignment + feedback drafts
  const [assignmentDraft, setAssignmentDraft] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Discussion draft
  const [chatDraft, setChatDraft] = useState('');

  const loadMessages = useCallback(async () => {
    if (!enrollment || !storedUser?._id) return;
    try {
      const teacherId = enrollment.responder._id;
      const msgs = (await fetchJSON(`/messages/${teacherId}`)) as ChatMessage[];
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, [enrollment, storedUser]);

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
        const data = (await fetchJSON(`/requests/${requestId}`)) as Enrollment;
        if (!mounted) return;
        const studentId = data.requester._id;
        if (studentId !== storedUser._id) {
          setError('You are not enrolled in this course');
          setLoading(false);
          return;
        }
        setEnrollment(data);
        setAssignmentDraft(data.assignmentText || '');
        setRating(data.feedback?.rating || 0);
        setComment(data.feedback?.comment || '');
        setCompletedExercises(new Set(data.completedExercises || []));
        if (data.quizTotal > 0) {
          setQuizResult({ score: data.quizScore, total: data.quizTotal, status: data.quizStatus });
        }
        if (data.skillRequested.modules.length > 0 && !activeModuleId) {
          setActiveModuleId(data.skillRequested.modules[0]._id);
        }
        try {
          const msgs = (await fetchJSON(`/messages/${data.responder._id}`)) as ChatMessage[];
          if (mounted) setMessages(msgs);
        } catch {
          if (mounted) setMessages([]);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [requestId, storedUser, activeModuleId]);

  const submitQuiz = async () => {
    if (!requestId) return;
    setSubmitting(true);
    setError('');
    try {
      const quizResultData = await fetchJSON(`/requests/${requestId}/quiz/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
      setQuizResult({ score: quizResultData.quizScore, total: quizResultData.quizTotal, status: quizResultData.quizStatus });
      setEnrollment((prev) => prev ? { ...prev, ...quizResultData } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const completeExercise = async (exerciseId: string) => {
    if (!requestId) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await fetchJSON(`/requests/${requestId}/exercises/${exerciseId}/complete`, {
        method: 'POST',
      });
      setCompletedExercises((prev) => new Set([...prev, exerciseId]));
      setEnrollment((prev) => prev ? { ...prev, ...result } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to mark exercise complete');
    } finally {
      setSubmitting(false);
    }
  };

  const completeModule = async (moduleId: string) => {
    if (!requestId) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await fetchJSON(`/requests/${requestId}/modules/${moduleId}/complete`, {
        method: 'POST',
      });
      setEnrollment((prev) => prev ? { ...prev, ...result } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to mark module complete');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssignment = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await fetchJSON(`/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ assignmentText: assignmentDraft })
      });
      setEnrollment((prev) => prev ? { ...prev, ...result } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      setError('Please select a rating before submitting feedback');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await fetchJSON(`/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ feedback: { rating, comment } })
      });
      setEnrollment((prev) => prev ? { ...prev, feedback: { rating, comment } } : prev);
      setComment('');
      setRating(0);
      setError('Feedback submitted successfully');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    const text = chatDraft.trim();
    if (!text) return;
    try {
      await fetchJSON('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: teacher._id, text })
      });
      setChatDraft('');
      await loadMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'content', label: '📚 Course Content' },
    { key: 'discussion', label: '💬 Discussion' },
    { key: 'feedback', label: '⭐ Feedback' }
  ];

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

  if (error || !enrollment) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error || 'Course not found'}</div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const skill = enrollment.skillRequested;
  const teacher = enrollment.responder;
  const modules = skill.modules || [];
  const activeModule = modules.find((m) => m._id === activeModuleId) || modules[0];
  const isModuleCompleted = (moduleId: string) => enrollment.completedModules.includes(moduleId);
  const isExerciseCompleted = (exerciseId: string) => completedExercises.has(exerciseId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500"></div>
            <div className="px-6 pb-6 -mt-12">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{skill.title}</h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span>👨‍🏫 {teacher.name}</span>
                <span>•</span>
                <span>{skill.category} • {skill.level}</span>
              </div>
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Course Progress</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${enrollment.progress}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">{error}</div>}

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === t.key ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ===== Course Content Tab ===== */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Module Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sticky top-24">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Modules</h3>
                  <div className="space-y-2">
                    {modules.map((mod, idx) => {
                      const completed = isModuleCompleted(mod._id);
                      const isActive = mod._id === activeModuleId;
                      return (
                        <button
                          key={mod._id}
                          onClick={() => setActiveModuleId(mod._id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{completed ? '✅' : '○'}</span>
                          <span className="truncate">{idx + 1}. {mod.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Module Content */}
              <div className="lg:col-span-3 space-y-5">
                {!activeModule ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-12">No modules published yet.</div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">📂 {activeModule.title}</h3>
                        {activeModule.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeModule.description}</p>}
                      </div>
                      {!isModuleCompleted(activeModule._id) && (
                        <button
                          onClick={() => completeModule(activeModule._id)}
                          disabled={submitting}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      )}
                      {isModuleCompleted(activeModule._id) && (
                        <span className="px-3 py-1.5 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 rounded-full font-medium">✓ Completed</span>
                      )}
                    </div>

                    {/* Notes */}
                    {(activeModule.notes || activeModule.notesFile) && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📄 Notes</h4>
                        {activeModule.notes && <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{activeModule.notes}</p>}
                        {activeModule.notesFile && (
                          <a href={`/uploads/${activeModule.notesFile}`} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                            📄 Download Notes PDF
                          </a>
                        )}
                      </div>
                    )}

                    {/* Videos */}
                    {activeModule.videoLinks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🎥 Video Lectures</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeModule.videoLinks.filter(Boolean).map((v, i) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                              <iframe src={v.replace('watch?v=', 'embed/')} title={`video-${i}`} className="w-full h-56" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeModule.recordedVideoLinks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🎞️ Recorded Sessions</h4>
                        <ul className="space-y-1">
                          {activeModule.recordedVideoLinks.filter(Boolean).map((v, i) => (
                            <li key={i}><a href={v} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-sm hover:text-indigo-500">{v}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Live class */}
                    {activeModule.liveClassLink && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">💻 Live Class</h4>
                        <a href={activeModule.liveClassLink} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm">
                          🔴 Join Live Class
                        </a>
                      </div>
                    )}

                    {/* Exercises */}
                    {activeModule.exercises.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🏋️ Practice Exercises</h4>
                        <div className="space-y-3">
                          {activeModule.exercises.map((ex) => {
                            const done = isExerciseCompleted(ex._id);
                            return (
                              <div key={ex._id} className={`p-4 rounded-xl border ${done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-semibold text-slate-900 dark:text-white">{ex.title}</h5>
                                    {ex.difficulty && <span className="text-xs text-slate-500 dark:text-slate-400">Difficulty: {ex.difficulty}</span>}
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{ex.description}</p>
                                    {ex.expectedOutcome && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Expected: {ex.expectedOutcome}</p>}
                                  </div>
                                  {!done && (
                                    <button
                                      onClick={() => completeExercise(ex._id)}
                                      disabled={submitting}
                                      className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 ml-3"
                                    >
                                      Mark Done
                                    </button>
                                  )}
                                </div>
                                {done && <span className="text-xs text-emerald-600 font-medium mt-2 inline-block">✓ Completed</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Assignments */}
                    {activeModule.assignments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📝 Assignments</h4>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-sm space-y-1 mb-3">
                          {activeModule.assignments.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Quizzes */}
                    {activeModule.quizzes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">📝 Quiz</h4>
                        <div className="space-y-3">
                          {activeModule.quizzes.map((q) => (
                            <div key={q._id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">{q.question}</p>
                              <div className="space-y-1">
                                {q.options.map((opt, i) => (
                                  <label key={i} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`q-${q._id}`}
                                      checked={answers[q._id] === i}
                                      onChange={() => setAnswers((p) => ({ ...p, [q._id]: i }))}
                                      className="accent-emerald-600"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz submit + result */}
                {modules.flatMap((m) => m.quizzes).length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Quiz</span>
                      {quizResult && (
                        <span className="ml-3 text-emerald-600 font-bold">
                          Score: {quizResult.score}/{quizResult.total} ({quizResult.status})
                        </span>
                      )}
                    </div>
                    <button onClick={submitQuiz} disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl disabled:opacity-50 hover:bg-purple-700 transition-colors">
                      {quizResult ? 'Retake & Submit' : 'Submit Quiz'}
                    </button>
                  </div>
                )}

                {/* Assignment submission */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white">📝 Your Assignment Submission</h3>
                  <textarea
                    rows={4}
                    value={assignmentDraft}
                    onChange={(e) => setAssignmentDraft(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none resize-none dark:bg-slate-700 dark:text-white"
                    placeholder="Write your assignment answer here..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Status: {enrollment.assignmentStatus}</span>
                    <button onClick={submitAssignment} disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors">Submit Assignment</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Discussion Tab ===== */}
          {activeTab === 'discussion' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">💬 Discussion with {teacher.name}</h3>
              <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>}
                {messages.map((m) => {
                  const mine = m.from._id === storedUser?._id;
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${mine ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Send</button>
              </div>
            </div>
          )}

          {/* ===== Feedback Tab ===== */}
          {activeTab === 'feedback' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">⭐ Rate this course</h3>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className={`text-3xl transition-colors ${n <= rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}>★</button>
                ))}
                <span className="text-sm text-slate-500 ml-2">{rating}/5</span>
              </div>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none dark:bg-slate-700 dark:text-white"
                placeholder="Share your feedback..."
              />
              <button onClick={submitFeedback} disabled={submitting} className="px-5 py-2 bg-amber-500 text-white rounded-xl disabled:opacity-50 hover:bg-amber-600 transition-colors">Submit Feedback</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCourse;
