import React from 'react';
import Navbar from './Navbar';

/**
 * Messages Component
 * Displays student messages and conversations
 */
const Messages: React.FC = () => {
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