import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface Enrollment {
  _id: string;
  skillRequested: {
    _id: string;
    title: string;
    category?: string;
    level?: string;
    courseDescription?: string;
    difficulty?: string;
    duration?: string;
    modules: any[];
  };
  responder: { _id: string; name: string };
  status: string;
  progress: number;
  quizScore: number;
  quizTotal: number;
  quizStatus: string;
  assignmentStatus: string;
  completedModules: string[];
  completedExercises: string[];
  updatedAt: string;
}

const MyLearning: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!storedUser?._id) {
      navigate('/login');
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchJSON('/my-learning');
        if (mounted) {
          setEnrollments(res.enrollments || []);
          setStats(res.stats || null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load learning data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate, storedUser]);

  const filtered = enrollments.filter((e) => {
    if (filter === 'in-progress') return e.status === 'accepted' && e.progress < 100;
    if (filter === 'completed') return e.status === 'completed' || e.progress >= 100;
    return true;
  });

  if (!storedUser?._id) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Learning</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Track your enrolled courses and progress.</p>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Enrolled</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            {(['all', 'in-progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-48" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No courses found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((enrollment) => {
                const course = enrollment.skillRequested;
                const isCompleted = enrollment.status === 'completed' || enrollment.progress >= 100;
                return (
                  <div key={enrollment._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">{course.category}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Instructor: {enrollment.responder?.name || 'Unknown'}</p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${enrollment.progress}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/learn/${enrollment._id}`)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      {isCompleted ? 'Review Course' : 'Continue Learning'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;
