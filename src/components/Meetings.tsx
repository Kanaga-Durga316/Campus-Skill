import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface Meeting {
  _id: string;
  skillId: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  link: string;
  platform: 'google_meet' | 'zoom' | 'teams';
  password?: string;
  reminder: boolean;
}

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    skillId: '',
    title: '',
    date: '',
    time: '',
    duration: '1 hour',
    link: '',
    platform: 'google_meet' as 'google_meet' | 'zoom' | 'teams',
    password: '',
    reminder: true,
  });
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
    fetchJSON(`/skills/${formData.skillId}/meetings`)
      .then((data: Meeting[]) => {
        if (mounted) setMeetings(data);
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
      await fetchJSON(`/skills/${formData.skillId}/meetings`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFormData({ ...formData, title: '', date: '', time: '', link: '', password: '' });
      setShowForm(false);
      const data = await fetchJSON(`/skills/${formData.skillId}/meetings`);
      setMeetings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const platformIcons = {
    google_meet: '🎥',
    zoom: '📹',
    teams: '💼',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meetings 📅</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Schedule and join live sessions</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {showForm ? 'Cancel' : 'Schedule Meeting'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course</label>
                  <select
                    value={formData.skillId}
                    onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Select a course</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meeting Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password (optional)</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.reminder}
                      onChange={(e) => setFormData({ ...formData, reminder: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Set reminder
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No meetings scheduled.</div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{platformIcons[meeting.platform]}</span>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{meeting.title}</h3>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <div>📅 {meeting.date} at {meeting.time}</div>
                        <div>⏱️ {meeting.duration}</div>
                        {meeting.password && <div>🔒 Password: {meeting.password}</div>}
                      </div>
                    </div>
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-sm"
                    >
                      Join
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Meetings;