import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Dashboard Component
 * A professional, modern dashboard for Campus Skill Exchange Platform
 */

// Types
interface Skill {
  id: string;
  title: string;
  category: string;
  level: string;
  emoji: string;
  learners?: number;
  rating?: number;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  skills: string[];
  rating: number;
  available: boolean;
}

interface Request {
  id: string;
  fromName: string;
  avatar: string;
  skillWanted: string;
  skillOffered: string;
  status: 'pending' | 'accepted' | 'rejected';
  time: string;
}

// Current user data
const currentUser = {
  name: 'Alex Johnson',
  avatar: 'A',
  department: 'Computer Science',
  year: 'Junior',
  joinDate: 'September 2024',
  skillsTeaching: 3,
  skillsLearning: 2,
  rating: 4.8
};

// Sample skills user can teach
const mySkills: Skill[] = [
  { id: '1', title: 'Python Programming', category: 'Programming', level: 'Beginner', emoji: '🐍', learners: 12, rating: 4.8 },
  { id: '2', title: 'Web Development', category: 'Technology', level: 'Intermediate', emoji: '🌐', learners: 8, rating: 4.9 },
  { id: '3', title: 'Math Tutoring', category: 'Academics', level: 'All Levels', emoji: '📐', learners: 15, rating: 4.7 }
];

// Skills user wants to learn
const skillsToLearn: Skill[] = [
  { id: '1', title: 'Public Speaking', category: 'Communication', level: 'Beginner', emoji: '🎤' },
  { id: '2', title: 'Photography', category: 'Creative', level: 'Beginner', emoji: '📷' }
];

// Suggested students
const suggestedStudents: Student[] = [
  { id: '1', name: 'Sarah Williams', avatar: 'S', department: 'Business', year: 'Senior', skills: ['Public Speaking', 'Leadership'], rating: 4.9, available: true },
  { id: '2', name: 'Mike Chen', avatar: 'M', department: 'Engineering', year: 'Junior', skills: ['Guitar', 'Piano'], rating: 4.7, available: true },
  { id: '3', name: 'Emily Davis', avatar: 'E', department: 'Arts', year: 'Sophomore', skills: ['Photography', 'Design'], rating: 4.6, available: true },
  { id: '4', name: 'David Kim', avatar: 'D', department: 'CS', year: 'Senior', skills: ['Machine Learning', 'AI'], rating: 5.0, available: false }
];

// Recent requests
const recentRequests: Request[] = [
  { id: '1', fromName: 'Sarah Williams', avatar: 'S', skillWanted: 'Python Programming', skillOffered: 'Public Speaking', status: 'pending', time: '2h ago' },
  { id: '2', fromName: 'Mike Chen', avatar: 'M', skillWanted: 'Web Development', skillOffered: 'Guitar', status: 'accepted', time: '1d ago' },
  { id: '3', fromName: 'Emily Davis', avatar: 'E', skillWanted: 'Python', skillOffered: 'Photography', status: 'pending', time: '3d ago' }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* ========================================
              SECTION 1: WELCOME HEADER
              ======================================== */}
          <WelcomeSection 
            user={currentUser} 
            onAddSkill={() => navigate('/manage-skills')}
            onBrowse={() => navigate('/search')}
            onRequests={() => navigate('/requests')}
            onSettings={() => navigate('/settings')}
          />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Your Skills Section */}
              <YourSkillsSection skills={mySkills} onManage={() => navigate('/manage-skills')} onViewDetails={(skillId) => navigate(`/teach/${skillId}`)} />
              
              {/* Skills You Want to Learn */}
              <SkillsToLearnSection skills={skillsToLearn} onContinue={(skillId) => navigate(`/skill/${skillId}`)} />
              
              {/* Suggested Students */}
              <SuggestedStudentsSection students={suggestedStudents} onViewAll={() => navigate('/search')} onViewProfile={(studentId) => navigate(`/student/${studentId}`)} />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <QuickStatsSection user={currentUser} />
              
              {/* Recent Requests */}
              <RecentRequestsSection requests={recentRequests} onViewAll={() => navigate('/requests')} onViewRequest={(requestId) => navigate(`/requests?highlight=${requestId}`)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * WelcomeSection Component
 * Professional header with user info and action buttons
 */
const WelcomeSection: React.FC<{
  user: typeof currentUser;
  onAddSkill: () => void;
  onBrowse: () => void;
  onRequests: () => void;
  onSettings: () => void;
}> = ({ user, onAddSkill, onBrowse, onRequests, onSettings }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    {/* Gradient Header */}
    <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
    
    <div className="px-6 pb-6 -mt-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* User Info */}
        <div className="flex items-end space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white dark:border-slate-800">
            {user.avatar}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.department} • {user.year} Year</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <ActionButton icon="➕" label="Add Skill" primary onClick={onAddSkill} />
          <ActionButton icon="🔍" label="Browse" onClick={onBrowse} />
          <ActionButton icon="📬" label="Requests" onClick={onRequests} />
          <ActionButton icon="⚙️" label="Settings" onClick={onSettings} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * ActionButton Component
 */
const ActionButton: React.FC<{ icon: string; label: string; primary?: boolean; onClick?: () => void }> = ({ 
  icon, label, primary, onClick 
}) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center space-x-1.5 ${
      primary 
        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg' 
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

/**
 * YourSkillsSection Component
 * Displays skills the user can teach
 */
const YourSkillsSection: React.FC<{ skills: Skill[]; onManage: () => void; onViewDetails?: (skillId: string) => void }> = ({ skills, onManage, onViewDetails }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🎓 Skills You Teach</h2>
      <button onClick={onManage} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
        Manage →
      </button>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <div 
            key={skill.id} 
            onClick={() => onViewDetails?.(skill.id)}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{skill.emoji}</span>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
              {skill.level}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{skill.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{skill.category}</p>
          <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-amber-500 mr-1">★</span>
            <span>{skill.rating}</span>
            <span className="mx-1">•</span>
            <span>{skill.learners} learners</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * SkillsToLearnSection Component
 * Displays skills user wants to learn
 */
const SkillsToLearnSection: React.FC<{ skills: Skill[]; onContinue?: (skillId: string) => void }> = ({ skills, onContinue }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📚 Skills You Want to Learn</h2>
    </div>
    
    <div className="space-y-3">
      {skills.map((skill) => (
        <div key={skill.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{skill.emoji}</span>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{skill.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{skill.category} • {skill.level}</p>
            </div>
          </div>
          <button 
            onClick={() => onContinue?.(skill.id)}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continue
          </button>
        </div>
      ))}
    </div>
  </div>
);

/**
 * SuggestedStudentsSection Component
 * Shows recommended students to connect with
 */
const SuggestedStudentsSection: React.FC<{ students: Student[]; onViewAll: () => void; onViewProfile?: (studentId: string) => void }> = ({ students, onViewAll, onViewProfile }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">👥 Students You May Know</h2>
      <button onClick={onViewAll} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
        View All →
      </button>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {students.slice(0, 4).map((student) => (
        <div 
            key={student.id} 
            onClick={() => onViewProfile?.(student.id)}
            className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
            student.available 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
              : 'bg-slate-400'
          }`}>
            {student.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{student.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.department} • {student.year}</p>
            <div className="flex items-center mt-1">
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 ml-0.5">{student.rating}</span>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${student.available ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * QuickStatsSection Component
 * Side panel with user stats
 */
const QuickStatsSection: React.FC<{ user: typeof currentUser }> = ({ user }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Stats</h2>
    
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📚</span>
          <span className="text-slate-700 dark:text-slate-300">Teaching</span>
        </div>
        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{user.skillsTeaching}</span>
      </div>
      
      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🎯</span>
          <span className="text-slate-700 dark:text-slate-300">Learning</span>
        </div>
        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{user.skillsLearning}</span>
      </div>
      
      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">⭐</span>
          <span className="text-slate-700 dark:text-slate-300">Rating</span>
        </div>
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{user.rating}</span>
      </div>
    </div>
  </div>
);

/**
 * RecentRequestsSection Component
 * Shows recent skill exchange requests
 */
const RecentRequestsSection: React.FC<{ requests: Request[]; onViewAll: () => void; onViewRequest?: (requestId: string) => void }> = ({ requests, onViewAll, onViewRequest }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📬 Recent Requests</h2>
        <button onClick={onViewAll} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
          View All →
        </button>
      </div>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <div 
          key={request.id} 
          onClick={() => onViewRequest?.(request.id)}
          className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 cursor-pointer"
        >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {request.avatar}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm">{request.fromName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{request.time}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                {request.status}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="text-indigo-600 dark:text-indigo-400">{request.skillWanted}</span>
              <span className="mx-1">←</span>
              <span className="text-green-600 dark:text-green-400">{request.skillOffered}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
