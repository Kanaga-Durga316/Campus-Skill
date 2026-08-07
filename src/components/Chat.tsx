import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ChatRoom {
  _id: string;
  name: string;
  type: 'private' | 'group';
  participants: { _id: string; name: string }[];
  lastMessage?: string;
}

interface Message {
  _id: string;
  from: { _id: string; name: string };
  to: { _id: string; name: string };
  text: string;
  read: boolean;
  createdAt: string;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const userId = storedUser?._id;
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    let mounted = true;
    fetchJSON('/chatrooms')
      .then((data: ChatRoom[]) => {
        if (mounted) {
          setRooms(data);
          if (data.length > 0) setSelectedRoom(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [userId, navigate]);

  useEffect(() => {
    if (!selectedRoom) return;
    let mounted = true;
    fetchJSON(`/chatrooms/${selectedRoom._id}`)
      .then(() => {
        if (!mounted || !selectedRoom) return;
        const otherId = selectedRoom.participants.find((p) => p._id !== userId)?._id;
        if (otherId) {
          fetchJSON(`/messages/${otherId}`)
            .then((data: Message[]) => {
              if (mounted) setMessages(data);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [selectedRoom, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedRoom) return;
    setSending(true);
    try {
      const recipient = selectedRoom.participants.find((p) => p._id !== userId);
      if (!recipient) return;
      await fetchJSON('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: recipient._id, text: text.trim() }),
      });
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Messages 💬</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Chat with your teachers and peers</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
              {/* Rooms List */}
              <div className="md:col-span-1 max-h-[600px] overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Conversations</h2>
                </div>
                {rooms.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No conversations yet.</div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedRoom?._id === room._id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {room.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">{room.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{room.lastMessage || 'No messages yet'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Messages */}
              <div className="md:col-span-2 flex flex-col max-h-[600px]">
                {selectedRoom ? (
                  <>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{selectedRoom.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedRoom.type === 'private' ? 'Private chat' : 'Group chat'}
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 && (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                      {messages.map((msg) => {
                        const isMe = msg.from._id === userId;
                        return (
                          <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-br-sm'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                              }`}
                            >
                              {!isMe && <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{msg.from.name}</div>}
                              <div className="text-sm">{msg.text}</div>
                              <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <button
                          type="submit"
                          disabled={sending || !text.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                          {sending ? '...' : 'Send'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;