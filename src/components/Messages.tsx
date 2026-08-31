import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Navbar from './Navbar';
import { fetchJSON, API_BASE } from '../api';

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  exchangeStatus?: string;
}

interface ChatMessage {
  _id: string;
  from: { _id: string; name: string };
  to: { _id: string; name: string };
  text: string;
  read: boolean;
  createdAt: string;
}

const SOCKET_URL = API_BASE.replace('/api', '') || 'http://localhost:3001';
const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
};

const Messages: React.FC = () => {
  const storedUser = getStoredUser();
  const userId: string | undefined = storedUser?._id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const [allMessages, unreadRes] = await Promise.all([
        fetchJSON('/messages'),
        fetchJSON('/messages/unread/count'),
      ]);

      const msgs = allMessages as ChatMessage[];
      const unreadData = unreadRes as { count: number };

      const convMap = new Map<string, Conversation>();

      msgs.forEach((msg) => {
        const isFromMe = msg.from._id === userId;
        const partnerId = isFromMe ? msg.to._id : msg.from._id;
        const partnerName = isFromMe ? msg.to.name : msg.from.name;

        const existing = convMap.get(partnerId);
        if (!existing || new Date(msg.createdAt) >= new Date(existing.lastMessageTime || 0)) {
          convMap.set(partnerId, {
            partnerId,
            partnerName,
            partnerAvatar: (partnerName || '?').charAt(0).toUpperCase(),
            lastMessage: msg.text,
            lastMessageTime: msg.createdAt,
            unread: isFromMe ? 0 : (existing ? existing.unread : 0) + (msg.read ? 0 : 1),
          });
        }
      });

      const sorted = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(sorted);
      setTotalUnread(unreadData.count || sorted.reduce((sum, c) => sum + c.unread, 0));
      if (!selectedUser && sorted.length > 0) {
        setSelectedUser(sorted[0].partnerId);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedUser]);

  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      setLoading(true);
      const msgs = await fetchJSON(`/messages/${partnerId}`) as ChatMessage[];
      setMessages(msgs);

      setConversations(prev => prev.map(c =>
        c.partnerId === partnerId ? { ...c, unread: 0 } : c
      ));
      setTotalUnread(prev => Math.max(0, prev - (conversations.find(c => c.partnerId === partnerId)?.unread || 0)));
    } catch (err: any) {
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversations]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !userId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('message', (msg: ChatMessage) => {
      const isCurrent = selectedUser === msg.from._id || selectedUser === msg.to._id;
      if (isCurrent) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
      setConversations(prev => {
        const otherId = msg.from._id === userId ? msg.to._id : msg.from._id;
        const otherName = msg.from._id === userId ? msg.to.name : msg.from.name;
        const existing = prev.find(c => c.partnerId === otherId);
        if (!existing) {
          return [{ partnerId: otherId, partnerName: otherName, partnerAvatar: (otherName || '?').charAt(0).toUpperCase(), lastMessage: msg.text, lastMessageTime: msg.createdAt, unread: msg.from._id !== userId ? 1 : 0 }, ...prev];
        }
        return prev.map(c =>
          c.partnerId === otherId
            ? { ...c, lastMessage: msg.text, lastMessageTime: msg.createdAt, unread: msg.from._id !== userId ? c.unread + 1 : c.unread }
            : c
        ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      });
    });

    socket.on('unread_count', (data: { count: number }) => {
      setTotalUnread(data.count);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, selectedUser, scrollToBottom]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    if (selectedUser) {
      scrollToBottom();
    }
  }, [messages, selectedUser, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await fetchJSON('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: selectedUser, text: newMessage.trim() }),
      });
      setNewMessage('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.partnerId === selectedUser);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            <div className="h-full flex bg-white rounded-t-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="w-80 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                  {totalUnread > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                      {totalUnread} unread
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading && conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <p className="mb-2">No conversations yet</p>
                      <p className="text-sm">Start by finding someone to learn from!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.partnerId}
                        onClick={() => {
                          setSelectedUser(conv.partnerId);
                        }}
                        className={`p-4 cursor-pointer border-b border-gray-100 transition-colors ${
                          selectedUser === conv.partnerId ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        } ${conv.unread > 0 ? 'font-medium' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            }}
                          >
                            {conv.partnerAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className={conv.unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700 font-medium'}>
                                {conv.partnerName}
                              </p>
                              <span className={`text-xs ${conv.unread > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}
                              </span>
                            </div>
                            <p className={`text-sm truncate mt-1 ${conv.unread > 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                              {conv.lastMessage || 'No messages yet...'}
                            </p>
                          </div>
                        </div>
                        {conv.unread > 0 && (
                          <div className="ml-12 mt-1">
                            <span className="inline-block w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unread}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {!selectedUser ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
                      <p>Choose a conversation from the left to start messaging</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          }}
                        >
                          {selectedConv?.partnerAvatar || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedConv?.partnerName || 'Unknown'}</h3>
                          <p className="text-xs text-gray-500">{selectedConv?.partnerId}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {loading && messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg) => {
                            const isOwn = msg.from._id === userId;
                            const showDate =
                              messages.indexOf(msg) === 0 ||
                              formatDate(msg.createdAt) !== formatDate(messages[messages.indexOf(msg) - 1]?.createdAt || msg.createdAt);
                            return (
                              <React.Fragment key={msg._id}>
                                {showDate && (
                                  <div className="text-center text-xs text-gray-400 my-2">
                                    {formatDate(msg.createdAt)}
                                  </div>
                                )}
                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                      isOwn
                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                    }`}
                                  >
                                    <p className="text-sm">{msg.text}</p>
                                    <div className={`flex items-center justify-end mt-1 gap-1 ${
                                      isOwn ? 'text-indigo-200' : 'text-gray-400'
                                    }`}>
                                      <span className="text-xs">
                                        {formatTime(msg.createdAt)}
                                      </span>
                                      {isOwn && (
                                        <span className="text-xs">
                                          {msg.read ? '✓✓' : '✓'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border-t border-red-200 text-red-800 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSend} className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          disabled={sending}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                        >
                          {sending ? '...' : 'Send'}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
