import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface Poll {
  _id: string;
  skillId: string;
  question: string;
  options: { text: string; votes: number }[];
  active: boolean;
}

const Polls: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ skillId: '', question: '', options: '' });
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
    fetchJSON(`/skills/${formData.skillId}/polls`)
      .then((data: Poll[]) => {
        if (mounted) setPolls(data);
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
      const options = formData.options.split('\n').filter((s) => s.trim());
      await fetchJSON(`/skills/${formData.skillId}/polls`, {
        method: 'POST',
        body: JSON.stringify({ question: formData.question, options }),
      });
      setFormData({ ...formData, question: '', options: '' });
      setShowForm(false);
      const data = await fetchJSON(`/skills/${formData.skillId}/polls`);
      setPolls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      const updated = await fetchJSON(`/polls/${pollId}/vote`, {
        method: 'PUT',
        body: JSON.stringify({ optionIndex }),
      });
      setPolls((prev) => prev.map((p) => (p._id === pollId ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const totalVotes = (poll: Poll) => poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Polls 📊</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Vote on course-related topics</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {showForm ? 'Cancel' : 'Create Poll'}
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Question</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options (one per line)</label>
                  <textarea
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading polls...</div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No polls yet.</div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => {
                const total = totalVotes(poll);
                return (
                  <div key={poll._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{poll.question}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${poll.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {poll.active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {poll.options.map((opt, idx) => {
                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-700 dark:text-slate-300">{opt.text}</span>
                              <span className="text-slate-500 dark:text-slate-400">{opt.votes} votes ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                            {poll.active && (
                              <button
                                onClick={() => handleVote(poll._id, idx)}
                                className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
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

export default Polls;