import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface StudyGroup {
  _id: string;
  name: string;
  description: string;
  skillId: string;
  members: { _id: string; name: string }[];
  createdAt: string;
}

const StudyGroups: React.FC = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ skillId: '', name: '', description: '', memberIds: '' });
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
    fetchJSON(`/skills/${formData.skillId}/study-groups`)
      .then((data: StudyGroup[]) => {
        if (mounted) setGroups(data);
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
      const memberIds = formData.memberIds.split(',').map((s) => s.trim()).filter(Boolean);
      await fetchJSON(`/skills/${formData.skillId}/study-groups`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, memberIds }),
      });
      setFormData({ ...formData, name: '', description: '', memberIds: '' });
      setShowForm(false);
      const data = await fetchJSON(`/skills/${formData.skillId}/study-groups`);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = await fetchJSON(`/study-groups/${groupId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ memberId: storedUser._id }),
      });
      setGroups((prev) => prev.map((g) => (g._id === groupId ? updated : g)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Study Groups 👥</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Collaborate with peers</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {showForm ? 'Cancel' : 'Create Group'}
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Member IDs (comma separated)</label>
                  <input
                    type="text"
                    value={formData.memberIds}
                    onChange={(e) => setFormData({ ...formData, memberIds: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="user_id_1, user_id_2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading study groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No study groups yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div key={group._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-500/50 transition-all">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{group.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{group.members.length} members</span>
                    <button
                      onClick={() => handleJoin(group._id)}
                      className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-all"
                    >
                      Join
                    </button>
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

export default StudyGroups;