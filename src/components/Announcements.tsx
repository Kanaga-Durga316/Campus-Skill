import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface Announcement {
  _id: string;
  skillId: string;
  title: string;
  message: string;
  type: 'general' | 'assignment' | 'quiz' | 'live_session' | 'holiday';
  createdAt: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ skillId: '', title: '', message: '', type: 'general' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchJSON('/skills/mine')
      .then((skills: any[]) => {
        if (!mounted) return;
        if (skills.length > 0 && !formData.skillId) {
          setFormData((prev) => ({ ...prev, skillId: skills[0]._id }));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!formData.skillId) return;
    let mounted = true;
    setLoading(true);
    fetchJSON(`/skills/${formData.skillId}/announcements`)
      .then((data: Announcement[]) => {
        if (mounted) setAnnouncements(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [formData.skillId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchJSON(`/skills/${formData.skillId}/announcements`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFormData({ ...formData, title: '', message: '' });
      setShowForm(false);
      const data = await fetchJSON(`/skills/${formData.skillId}/announcements`);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const typeConfig = {
    general: { label: 'General', color: 'bg-slate-500', icon: '📢' },
    assignment: { label: 'Assignment', color: 'bg-blue-500', icon: '📝' },
    quiz: { label: 'Quiz', color: 'bg-purple-500', icon: '❓' },
    live_session: { label: 'Live Session', color: 'bg-red-500', icon: '🔴' },
    holiday: { label: 'Holiday', color: 'bg-green-500', icon: '🎉' },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Announcements 📢</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Stay updated with course news</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {showForm ? 'Cancel' : 'New Announcement'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course</label>
                  <select
                    value={formData.skillId}
                    onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Select a course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="live_session">Live Session</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No announcements yet.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => {
                const config = typeConfig[ann.type] || typeConfig.general;
                return (
                  <div key={ann._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600">
                        {config.icon} {config.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(ann.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{ann.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{ann.message}</p>
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

export default Announcements;