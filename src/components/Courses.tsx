import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  difficulty?: string;
  duration?: string;
  modules: any[];
  owner: { _id: string; name: string };
  rating?: number;
  learners?: number;
  status: string;
  createdAt: string;
}

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (search) params.set('search', search);
        if (categoryFilter !== 'All') params.set('category', categoryFilter);
        if (levelFilter !== 'All') params.set('level', levelFilter);
        const res = await fetchJSON(`/skills?${params.toString()}`);
        if (mounted) {
          const approved = (res || []).filter((c: Course) => c.status === 'approved');
          setCourses(approved);
          const cats = Array.from(new Set<string>((approved || []).map((c: Course) => c.category).filter(Boolean))).sort();
          setCategories(cats);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load courses');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [search, categoryFilter, levelFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Courses</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Browse approved courses from instructors.</p>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-48" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No courses found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/skill/${course._id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">{course.category}</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">{course.level}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{course.owner?.name || 'Unknown'}</span>
                    <span>{course.modules?.length || 0} modules</span>
                  </div>
                  {(course.duration || course.difficulty) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {course.difficulty && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{course.difficulty}</span>}
                      {course.duration && <span>⏱ {course.duration}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;
