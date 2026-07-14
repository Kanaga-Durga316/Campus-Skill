import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

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

interface MyLearningItem {
  id: string;
  courseTitle: string;
  teacherName: string;
  progress: number;
  status: string;
}

interface TeacherStudentItem {
  id: string;
  studentId: string;
  studentName: string;
  skillName: string;
  status: string;
  progress: number;
  quizScore: number;
  quizTotal: number;
  assignmentStatus: string;
}

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const getEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'Programming': '🐍',
    'Technology': '🌐',
    'Language': '🗣️',
    'Music': '🎵',
    'Art & Design': '🎨',
    'Business': '💼',
    'Communication': '🎤',
    'Academics': '📐',
    'Sports': '⚽',
    'Cooking': '🍳',
    'Other': '📚',
    'Creative': '📷'
  };
  return emojis[category] || '📚';
};

const formatTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
};

const mapStatus = (status: string): Request['status'] => {
  switch (status) {
    case 'open':
    case 'pending':
      return 'pending';
    case 'accepted':
    case 'completed':
      return 'accepted';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    default:
      return 'pending';
  }
};

interface CurrentUser {
  name: string;
  avatar: string;
  department: string;
  year: string;
  joinDate: string;
  skillsTeaching: number;
  skillsLearning: number;
  rating: number;
  preferredMode: string;
  experienceLevel: string;
  sessionDurationHours: number;
  portfolioLinks: string[];
  verificationStatus: string;
}

/**
 * Dashboard Component
 * Fetches real data from the backend API
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    name: storedUser?.name || 'Guest',
    avatar: storedUser?.name ? storedUser.name.charAt(0).toUpperCase() : '?',
    department: '',
    year: '',
    joinDate: storedUser?.createdAt ? new Date(storedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    skillsTeaching: 0,
    skillsLearning: 0,
    rating: 0,
    preferredMode: 'online',
    experienceLevel: 'beginner',
    sessionDurationHours: 1,
    portfolioLinks: [],
    verificationStatus: 'unverified'
  });

  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<Skill[]>([]);
  const [myLearning, setMyLearning] = useState<MyLearningItem[]>([]);
  const [teachingRequests, setTeachingRequests] = useState<TeacherStudentItem[]>([]);

  const reloadTeaching = async () => {
    try {
      const tr = (await fetchJSON('/requests/teacher').catch(() => [])) as any[];
      setTeachingRequests(
        tr.map((r: any) => ({
          id: r._id,
          studentId: r.requester?._id || '',
          studentName: r.requester?.name || 'Unknown Student',
          skillName: r.skillRequested?.title || 'Unknown Skill',
          status: r.status,
          progress: r.progress || 0,
          quizScore: r.quizScore || 0,
          quizTotal: r.quizTotal || 0,
          assignmentStatus: r.assignmentStatus || 'not_started'
        }))
      );
    } catch (err) {
      // ignore
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await fetchJSON('/requests/' + id, { method: 'PUT', body: JSON.stringify({ status: 'accepted' }) });
      await reloadTeaching();
    } catch (err: any) {
      setError(err.message || 'Failed to accept');
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      await fetchJSON('/requests/' + id, { method: 'PUT', body: JSON.stringify({ status: 'rejected' }) });
      await reloadTeaching();
    } catch (err: any) {
      setError(err.message || 'Failed to reject');
    }
  };
  const [suggestedStudents, setSuggestedStudents] = useState<Student[]>([]);
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!storedUser?._id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const [skills, users, requests, enrollments, teacherRequests, currentProfile] = await Promise.all([
          fetchJSON('/skills'),
          fetchJSON('/users'),
          fetchJSON('/requests'),
          fetchJSON('/requests/enrollments').catch(() => []),
          fetchJSON('/requests/teacher').catch(() => []),
          storedUser._id ? fetchJSON(`/users/${storedUser._id}`).catch(() => null) : Promise.resolve(null)
        ]);

        if (!mounted) return;

        const userId = storedUser._id;

        const mySkillsList: Skill[] = (skills as any[])
          .filter((s: any) => s.owner?._id === userId || s.owner === userId)
          .map((s: any) => ({
            id: s._id,
            title: s.title,
            category: s.category || 'Other',
            level: s.level || 'All Levels',
            emoji: getEmoji(s.category || 'Other'),
            learners: 0,
            rating: s.rating || 0
          }));

        const otherUsers: Student[] = (users as any[])
          .filter((u: any) => u._id !== userId)
          .slice(0, 4)
          .map((u: any) => ({
            id: u._id,
            name: u.name,
            avatar: u.name ? u.name.charAt(0).toUpperCase() : '?',
            department: (u as any).department || '',
            year: String((u as any).year || ''),
            skills: u.skills?.map((s: any) => s.title || s) || [],
            rating: (u as any).rating || 0,
            available: true
          }));

        const myRequests: Request[] = (requests as any[])
          .filter((r: any) =>
            r.requester?._id === userId || r.requester === userId ||
            r.responder?._id === userId || r.responder === userId
          )
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map((r: any) => ({
            id: r._id,
            fromName: typeof r.requester === 'object' && r.requester?.name ? r.requester.name : 'Unknown',
            avatar: typeof r.requester === 'object' && r.requester?.name ? r.requester.name.charAt(0).toUpperCase() : '?',
            skillWanted: typeof r.skillRequested === 'object' && r.skillRequested?.title ? r.skillRequested.title : 'Unknown Skill',
            skillOffered: typeof r.skillOffered === 'object' && r.skillOffered?.title ? r.skillOffered.title : '',
            status: mapStatus(r.status),
            time: formatTime(r.createdAt)
          }));

        setMySkills(mySkillsList);
        setSkillsToLearn([]);
        setMyLearning(
          (enrollments as any[]).map((r: any) => ({
            id: r._id,
            courseTitle: r.skillRequested?.title || 'Unknown Course',
            teacherName: r.responder?.name || 'Unknown Teacher',
            progress: r.progress || 0,
            status: r.status
          }))
        );
        setTeachingRequests(
          (teacherRequests as any[]).map((r: any) => ({
            id: r._id,
            studentId: r.requester?._id || '',
            studentName: r.requester?.name || 'Unknown Student',
            skillName: r.skillRequested?.title || 'Unknown Skill',
            status: r.status,
            progress: r.progress || 0,
            quizScore: r.quizScore || 0,
            quizTotal: r.quizTotal || 0,
            assignmentStatus: r.assignmentStatus || 'not_started'
          }))
        );
        setSuggestedStudents(otherUsers);
        setRecentRequests(myRequests);

        const avgRating = mySkillsList.length > 0
          ? (mySkillsList.reduce((sum, s) => sum + (s.rating || 0), 0) / mySkillsList.length).toFixed(1)
          : '0.0';

        const profile = currentProfile as any;

        setCurrentUser({
          name: storedUser.name,
          avatar: storedUser.name ? storedUser.name.charAt(0).toUpperCase() : '?',
          department: (profile?.department || storedUser.department || '').toString(),
          year: String(profile?.year || storedUser.year || ''),
          joinDate: storedUser.createdAt ? new Date(storedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
          skillsTeaching: mySkillsList.length,
          skillsLearning: 0,
          rating: parseFloat(avgRating),
          preferredMode: profile?.preferredMode || 'online',
          experienceLevel: profile?.experienceLevel || 'beginner',
          sessionDurationHours: typeof profile?.sessionDurationHours === 'number' ? profile.sessionDurationHours : 1,
          portfolioLinks: Array.isArray(profile?.portfolioLinks) ? profile.portfolioLinks : [],
          verificationStatus: profile?.verificationStatus || 'unverified'
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (mounted) setError('Failed to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [storedUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>
        </div>
      </div>
    );
  }

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
              {myLearning.length > 0 && (
                <MyLearningSection items={myLearning} onOpenCourse={(id) => navigate('/learn/' + id)} />
              )}
              <SkillsToLearnSection skills={skillsToLearn} onContinue={(skillId) => navigate(`/skill/${skillId}`)} />

              {teachingRequests.length > 0 && (
                <TeacherStudentsSection
                  items={teachingRequests}
                  onAccept={(id) => acceptRequest(id)}
                  onReject={(id) => rejectRequest(id)}
                  onViewProgress={(sid) => navigate('/student/' + sid)}
                  onSendMessage={() => navigate('/messages')}
                />
              )}

              {/* Suggested Students */}
              <SuggestedStudentsSection students={suggestedStudents} onViewAll={() => navigate('/search')} onViewProfile={(studentId) => navigate(`/student/${studentId}`)} />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <QuickStatsSection user={currentUser} />

              {/* Profile Details */}
              <ProfileDetailsSection user={currentUser} userId={storedUser?._id} />

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
  user: CurrentUser;
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
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.department ? `${user.department} • ${user.year} Year` : 'Student'}</p>
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
            <span>{skill.learners ?? 0} learners</span>
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
 * TeacherStudentsSection Component
 * Teacher's view of students learning their skills (accept/reject + track progress)
 */
const statusBadge = (status: string): string => {
  const map: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700'
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const TeacherStudentsSection: React.FC<{
  items: TeacherStudentItem[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewProgress: (studentId: string) => void;
  onSendMessage: (studentId: string) => void;
}> = ({ items, onAccept, onReject, onViewProgress, onSendMessage }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👥 Students Learning My Skills</h2>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{item.studentName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">📚 {item.skillName}</p>
            </div>
            <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + statusBadge(item.status)}>{item.status}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Progress</p>
              <p className="font-bold text-slate-900 dark:text-white">{item.progress}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quiz</p>
              <p className="font-bold text-slate-900 dark:text-white">{item.quizScore}/{item.quizTotal}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assignment</p>
              <p className="font-bold text-slate-900 dark:text-white capitalize">{item.assignmentStatus.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {item.status === 'open' || item.status === 'pending' ? (
              <>
                <button onClick={() => onAccept(item.id)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Accept</button>
                <button onClick={() => onReject(item.id)} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
              </>
            ) : (
              <>
                <button onClick={() => onViewProgress(item.studentId)} className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">View Progress</button>
                <button onClick={() => onSendMessage(item.studentId)} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Send Message</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * MyLearningSection Component
 * Shows courses the student is enrolled in (auto-appears after a teacher accepts a request)
 */
const MyLearningSection: React.FC<{ items: MyLearningItem[]; onOpenCourse: (requestId: string) => void }> = ({ items, onOpenCourse }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🎓 My Learning</h2>
    </div>

    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{item.courseTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">👨‍🏫 {item.teacherName}</p>
            <div className="flex items-center mt-1 max-w-[200px]">
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: item.progress + '%' }}></div>
              </div>
              <span className="text-xs text-slate-500 ml-2">{item.progress}%</span>
            </div>
          </div>
          <button
            onClick={() => onOpenCourse(item.id)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Open Course
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
const QuickStatsSection: React.FC<{ user: CurrentUser }> = ({ user }) => (
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
 * ProfileDetailsSection Component
 * Displays user profile fields
 */
const ProfileDetailsSection: React.FC<{ user: CurrentUser; userId?: string }> = ({ user, userId }) => {
  const modeColors: Record<string, string> = {
    'online': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'offline': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'hybrid': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const verificationColors: Record<string, string> = {
    'unverified': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'verified': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Details</h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">ID</span>
          <span className="text-sm font-mono font-medium text-slate-900 dark:text-white truncate ml-2">{userId || 'N/A'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Preferred Mode</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${modeColors[user.preferredMode] || 'bg-gray-100 text-gray-700'}`}>
            {user.preferredMode}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Experience Level</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{user.experienceLevel}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Session Duration</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{user.sessionDurationHours} hour{user.sessionDurationHours !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Portfolio</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{user.portfolioLinks.length} link{user.portfolioLinks.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Verification</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${verificationColors[user.verificationStatus] || 'bg-gray-100 text-gray-700'}`}>
            {user.verificationStatus}
          </span>
        </div>
      </div>
      
      {user.portfolioLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Latest link</p>
          <a 
            href={user.portfolioLinks[0]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
          >
            {user.portfolioLinks[0]}
          </a>
        </div>
      )}
    </div>
  );
};

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
