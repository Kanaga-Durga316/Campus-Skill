import React, { useState } from 'react';
import Navbar from './Navbar';

/**
 * Requests Component
 * Displays incoming and outgoing skill exchange requests
 */

// Types for requests
interface ExchangeRequest {
  id: string;
  fromName: string;
  fromAvatar: string;
  fromDepartment: string;
  skillWanted: string; // Skill they want to learn from you
  skillOffered: string; // Skill they're offering in exchange
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
  type: 'incoming' | 'outgoing';
}

/**
 * Requests Component
 */
const Requests: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Sample incoming requests (requests FROM others TO you)
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([
    {
      id: '1',
      fromName: 'Sarah Williams',
      fromAvatar: 'S',
      fromDepartment: 'Business Administration',
      skillWanted: 'Python Programming',
      skillOffered: 'Public Speaking',
      message: 'Hi! I would love to learn Python from you. I can teach you Public Speaking in exchange!',
      status: 'pending',
      date: '2 hours ago',
      type: 'incoming'
    },
    {
      id: '2',
      fromName: 'Mike Chen',
      fromAvatar: 'M',
      fromDepartment: 'Electrical Engineering',
      skillWanted: 'Web Development',
      skillOffered: 'Guitar',
      message: 'Hey! I saw you offer Web Development. I can teach you Guitar!',
      status: 'accepted',
      date: '1 day ago',
      type: 'incoming'
    },
    {
      id: '3',
      fromName: 'Emily Davis',
      fromAvatar: 'E',
      fromDepartment: 'Visual Arts',
      skillWanted: 'Python Programming',
      skillOffered: 'Photography',
      message: 'I would love to exchange skills with you!',
      status: 'rejected',
      date: '3 days ago',
      type: 'incoming'
    }
  ]);

  // Sample outgoing requests (requests YOU sent TO others)
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([
    {
      id: '4',
      fromName: 'David Kim',
      fromAvatar: 'D',
      fromDepartment: 'Computer Science',
      skillWanted: 'Machine Learning',
      skillOffered: 'Python Programming',
      message: 'Hi David! I would love to learn Machine Learning from you. I can teach you Python!',
      status: 'pending',
      date: '1 hour ago',
      type: 'outgoing'
    },
    {
      id: '5',
      fromName: 'Marie Laurent',
      fromAvatar: 'M',
      fromDepartment: 'Languages',
      skillWanted: 'French',
      skillOffered: 'Web Development',
      message: 'Hello! I am interested in learning French. Let me know if you are interested!',
      status: 'accepted',
      date: '2 days ago',
      type: 'outgoing'
    }
  ]);

  // Handle accept request
  const handleAccept = (id: string) => {
    setIncomingRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: 'accepted' } : req
      )
    );
    alert('Request accepted! You can now connect with the student. 🎉');
  };

  // Handle reject request
  const handleReject = (id: string) => {
    setIncomingRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: 'rejected' } : req
      )
    );
  };

  // Handle cancel outgoing request
  const handleCancel = (id: string) => {
    setOutgoingRequests(prev => prev.filter(req => req.id !== id));
    alert('Request cancelled.');
  };

  // Get counts
  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending').length;
  const pendingOutgoing = outgoingRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Skill Exchange Requests 📬
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Manage your incoming and outgoing skill exchange requests
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 inline-flex">
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'incoming'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>📥</span>
                <span>Incoming</span>
                {pendingIncoming > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingIncoming}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'outgoing'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>📤</span>
                <span>Outgoing</span>
                {pendingOutgoing > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingOutgoing}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Incoming Requests */}
          {activeTab === 'incoming' && (
            <div className="space-y-4">
              {incomingRequests.length > 0 ? (
                incomingRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                    onAccept={() => handleAccept(request.id)}
                    onReject={() => handleReject(request.id)}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="📥" 
                  title="No incoming requests" 
                  description="When students want to exchange skills with you, they'll appear here."
                />
              )}
            </div>
          )}

          {/* Outgoing Requests */}
          {activeTab === 'outgoing' && (
            <div className="space-y-4">
              {outgoingRequests.length > 0 ? (
                outgoingRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                    onCancel={() => handleCancel(request.id)}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="📤" 
                  title="No outgoing requests" 
                  description="Your sent requests will appear here. Start by browsing skills!"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * RequestCard Component
 * Displays a single request as a card
 */
const RequestCard: React.FC<{
  request: ExchangeRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}> = ({ request, type, onAccept, onReject, onCancel }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white">
              {request.fromAvatar}
            </div>
            
            {/* Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {type === 'incoming' ? request.fromName : `To: ${request.fromName}`}
              </h3>
              <p className="text-sm text-gray-500">{request.fromDepartment}</p>
              <p className="text-xs text-gray-400">{request.date}</p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
            {statusLabels[request.status]}
          </span>
        </div>

        {/* Exchange Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Skill Wanted */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {type === 'incoming' ? 'They want to learn:' : 'You want to learn:'}
              </p>
              <p className="text-lg font-bold text-indigo-600">
                {request.skillWanted}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>

            {/* Skill Offered */}
            <div className="flex-1 min-w-[200px] text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {type === 'incoming' ? 'They offer:' : 'You offer:'}
              </p>
              <p className="text-lg font-bold text-green-600">
                {request.skillOffered}
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Message:</p>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              "{request.message}"
            </p>
          </div>
        )}

        {/* Actions */}
        {type === 'incoming' && request.status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Accept</span>
            </button>
            <button
              onClick={onReject}
              className="flex-1 px-6 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Reject</span>
            </button>
          </div>
        )}

        {type === 'outgoing' && request.status === 'pending' && (
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * EmptyState Component
 */
const EmptyState: React.FC<{ icon: string; title: string; description: string }> = ({ 
  icon, 
  title, 
  description 
}) => (
  <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-sm mx-auto">{description}</p>
  </div>
);

export default Requests;