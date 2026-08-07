import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface DiscussionPost {
  _id: string;
  skillId: string;
  authorName: string;
  title: string;
  content: string;
  pinned: boolean;
  bestAnswerId?: string;
  reported: boolean;
  createdAt: string;
}

interface DiscussionReply {
  _id: string;
  authorName: string;
  content: string;
  likes: string[];
  highlighted: boolean;
  createdAt: string;
}

const Discussions: React.FC = () => {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [formData, setFormData] = useState({ skillId: '', title: '', content: '' });
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
    fetchJSON(`/skills/${formData.skillId}/discussions`)
      .then((data: DiscussionPost[]) => {
        if (mounted) setPosts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [formData.skillId]);

  const loadReplies = async (postId: string) => {
    try {
      const data = await fetchJSON(`/discussions/${postId}/replies`);
      setReplies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchJSON(`/skills/${formData.skillId}/discussions`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFormData({ ...formData, title: '', content: '' });
      setShowForm(false);
      const data = await fetchJSON(`/skills/${formData.skillId}/discussions`);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await fetchJSON(`/discussions/${selectedPost._id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText }),
      });
      setReplyText('');
      await loadReplies(selectedPost._id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (replyId: string) => {
    try {
      const updated = await fetchJSON(`/replies/${replyId}/like`, { method: 'PUT' });
      setReplies((prev) => prev.map((r) => (r._id === replyId ? updated : r)));
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Discussions 💡</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Ask questions and share knowledge</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {showForm ? 'Cancel' : 'New Discussion'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitPost} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  {submitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          )}

          {selectedPost ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <button onClick={() => setSelectedPost(null)} className="text-sm text-indigo-600 dark:text-indigo-400 mb-4 hover:underline">
                ← Back to discussions
              </button>
              <div className="flex items-center gap-2 mb-2">
                {selectedPost.pinned && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">📌 Pinned</span>}
                {selectedPost.bestAnswerId && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">✅ Best Answer</span>}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedPost.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">by {selectedPost.authorName} • {new Date(selectedPost.createdAt).toLocaleString()}</p>
              <p className="text-slate-700 dark:text-slate-300 mb-6">{selectedPost.content}</p>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Replies</h3>
                <div className="space-y-4 mb-6">
                  {replies.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No replies yet.</p>}
                  {replies.map((reply) => (
                    <div key={reply._id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{reply.authorName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{reply.content}</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleLike(reply._id)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                          👍 {reply.likes.length}
                        </button>
                        {reply.highlighted && <span className="text-xs text-amber-600 dark:text-amber-400">⭐ Highlighted</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !replyText.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading discussions...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">No discussions yet.</div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() => {
                        setSelectedPost(post);
                        loadReplies(post._id);
                      }}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {post.pinned && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">📌 Pinned</span>}
                        {post.bestAnswerId && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">✅ Best Answer</span>}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{post.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{post.content}</p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">by {post.authorName} • {new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussions;