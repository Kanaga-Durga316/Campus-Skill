import React, { useState, useEffect } from 'react';
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

/**
 * Messages Component
 * Displays student messages and conversations
 */
const Messages: React.FC = () => {
  const storedUser = getStoredUser();
  const userId: string | undefined = storedUser?._id;

  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [recipient, setRecipient] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchJSON('/users')
      .then((us: any[]) => {
        if (!mounted) return;
        const others = us
          .filter((u: any) => u._id !== userId)
          .map((u: any) => ({ _id: u._id, name: u.name }));
        if (!mounted) return;
        setUsers(others);
        if (others.length > 0) setRecipient(others[0]._id);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [userId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!recipient) {
      setError('Select a recipient');
      return;
    }
    if (!text.trim()) {
      setError('Please type a message');
      return;
    }
    setSending(true);
    try {
      await fetchJSON('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: recipient, text: text.trim() })
      });
      setSuccess('Message sent! 🎉');
      setText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Sample conversation data
  const conversations = [
    {
      id: 1,
      name: 'Sarah Williams',
      avatar: 'S',
      lastMessage: 'Hi! I would love to learn Python from you...',
      time: '2 min ago',
      unread: true,
      skills: ['Python']
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: 'M',
      lastMessage: 'Thanks for the guitar lesson yesterday!',
      time: '1 hour ago',
      unread: false,
      skills: ['Guitar']
    },
    {
      id: 3,
      name: 'Emily Davis',
      avatar: 'E',
      lastMessage: 'Are you available for a session this weekend?',
      time: 'Yesterday',
      unread: false,
      skills: ['Photography']
    },
    {
      id: 4,
      name: 'David Kim',
      avatar: 'D',
      lastMessage: 'Great progress on Machine Learning!',
      time: '2 days ago',
      unread: false,
      skills: ['Machine Learning']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Messages 💬</h1>
            <p className="text-gray-600 mt-2">Chat with students about skill exchanges</p>
          </div>

          {/* Compose new message */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send a new message ✍️</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-3">
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={sending || users.length === 0}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none bg-white"
              >
                {users.length === 0 ? (
                  <option value="">No other users yet</option>
                ) : (
                  users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))
                )}
              </select>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Type your message..."
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none resize-none"
              />

              <button
                type="submit"
                disabled={sending || !recipient || !text.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Conversations List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {conversations.map((conversation, index) => (
              <div 
                key={conversation.id}
                className={`p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index !== conversations.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                  conversation.unread 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {conversation.avatar}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${conversation.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-400">{conversation.time}</span>
                  </div>
                  <p className={`text-sm truncate ${conversation.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {conversation.lastMessage}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {conversation.skills.map((skill) => (
                      <span key={skill} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Unread Indicator */}
                {conversation.unread && (
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State (if no conversations) */}
          {conversations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start a conversation by requesting to learn a skill!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;