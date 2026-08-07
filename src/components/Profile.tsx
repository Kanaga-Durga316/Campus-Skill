import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const currentUserId = storedUser?._id;
  const isOwnProfile = currentUserId === userId;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('about');

  const [reviews, setReviews] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [teachingSkills, setTeachingSkills] = useState<any[]>([]);
  const [learningSkills, setLearningSkills] = useState<any[]>([]);

  const [reviewSort, setReviewSort] = useState<'latest' | 'highest' | 'oldest'>('latest');
  const [following, setFollowing] = useState(false);

  const [calendarForm, setCalendarForm] = useState({ title: '', date: '', type: 'event', description: '' });
  const [calendarSubmitting, setCalendarSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, reviewsRes, activityRes, teachRes, learnRes] = await Promise.all([
          fetchJSON(`/profile/${userId}`),
          fetchJSON(`/users/${userId}/reviews`),
          fetchJSON(`/users/${userId}/activity`),
          fetchJSON(`/users/${userId}/skills`),
          fetchJSON(`/users/${userId}/learn-skills`),
        ]);

        if (!mounted) return;
        setUser(profileRes);
        setReviews(reviewsRes || []);
        setActivity(activityRes || []);
        setTeachingSkills(teachRes || []);
        setLearningSkills(learnRes || []);

        if (isOwnProfile) {
          const [bmRes, calRes] = await Promise.all([
            fetchJSON(`/users/${userId}/bookmarks`),
            fetchJSON(`/users/${userId}/calendar`),
          ]);
          if (!mounted) return;
          setBookmarks(bmRes || []);
          setCalendarEvents(calRes || []);
        }

        if (!mounted) return;
        setFollowing((profileRes?.followers || []).includes(currentUserId));
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [userId, currentUserId, isOwnProfile]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (reviewSort === 'highest') arr.sort((a, b) => b.rating - a.rating);
    else if (reviewSort === 'oldest') arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return arr;
  }, [reviews, reviewSort]);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.name, user.bio, user.avatarUrl, user.coverImage, user.college, user.university,
      user.semester, user.cgpa, user.careerGoal, user.skillsTeaching?.length > 0,
      user.skillsLearning?.length > 0, user.socialLinks?.github || user.socialLinks?.linkedin,
      user.portfolioLinks?.length > 0, user.studentId
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  const handleFollow = async () => {
    try {
      await fetchJSON(`/profile/${userId}/follow`, { method: 'POST' });
      setFollowing(!following);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarForm.title || !calendarForm.date) return;
    setCalendarSubmitting(true);
    try {
      const updated = await fetchJSON(`/users/${userId}/calendar`, {
        method: 'POST',
        body: JSON.stringify(calendarForm),
      });
      setCalendarEvents(updated.calendarEvents || []);
      setCalendarForm({ title: '', date: '', type: 'event', description: '' });
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setCalendarSubmitting(false);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    try {
      const updated = await fetchJSON(`/users/${userId}/calendar/${eventId}`, { method: 'DELETE' });
      setCalendarEvents(updated.calendarEvents || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleRemoveBookmark = async (skillId: string) => {
    try {
      await fetchJSON(`/users/${userId}/bookmarks/${skillId}`, { method: 'DELETE' });
      setBookmarks((prev) => prev.filter((s: any) => s._id !== skillId));
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const sections = [
    { id: 'about', label: 'About' },
    { id: 'academic', label: 'Academic' },
    { id: 'teaching', label: 'Teaching' },
    { id: 'learning', label: 'Learning' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'activity', label: 'Activity' },
    { id: 'bookmarks', label: 'Bookmarks' },
    { id: 'calendar', label: 'Calendar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-slate-100">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-slate-100">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="p-6 bg-red-500/20 border border-red-500/30 text-red-300 rounded-2xl">{error || 'Profile not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-slate-100 overflow-hidden">
      <Navbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Profile Header */}
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className="h-48 sm:h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
              {user.coverImage && (
                <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="px-6 pb-6 -mt-16 sm:-mt-20">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-end space-x-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-slate-800 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.name}</h1>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {user.role}
                      </span>
                      {user.verificationStatus === 'verified' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-1">
                      {user.college || user.university || 'Student'} {user.year ? `• ${user.year} Year` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{user.followers?.length || 0}</div>
                      <div className="text-xs text-slate-400">Followers</div>
                    </div>
                    <div className="w-px h-8 bg-slate-700"></div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{user.following?.length || 0}</div>
                      <div className="text-xs text-slate-400">Following</div>
                    </div>
                    <div className="w-px h-8 bg-slate-700"></div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">★ {avgRating}</div>
                      <div className="text-xs text-slate-400">Rating</div>
                    </div>
                  </div>

                  {!isOwnProfile && (
                    <button
                      onClick={handleFollow}
                      className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 ${
                        following
                          ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30'
                      }`}
                    >
                      {following ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/settings?tab=profile')}
                      className="px-5 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 rounded-xl hover:bg-slate-600 transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Profile link copied to clipboard!');
                    }}
                    className="px-5 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 rounded-xl hover:bg-slate-600 transition-all duration-300"
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="mt-6 p-4 bg-slate-900/30 border border-slate-700/30 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Profile Completion</span>
                  <span className="text-sm font-bold text-indigo-400">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }}></div>
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {!user.bio && '• Add a bio '}
                    {!user.college && !user.university && '• Add academic info '}
                    {!user.avatarUrl && !user.coverImage && '• Upload images '}
                    {user.skillsTeaching?.length === 0 && '• Add skills you teach '}
                    Complete your profile to earn the 🏆 Pro Profile badge!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 mb-8 overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeSection === sec.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {activeSection === 'about' && (
              <SectionCard title="About" icon="👤">
                {user.bio ? (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                ) : (
                  <p className="text-slate-500 italic">No bio added yet.</p>
                )}
                {user.academicInterests?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Academic Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.academicInterests.map((interest: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-full border border-indigo-500/20">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.careerGoal && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">Career Goal</h4>
                    <p className="text-slate-300">{user.careerGoal}</p>
                  </div>
                )}
              </SectionCard>
            )}

            {activeSection === 'academic' && (
              <SectionCard title="Academic Information" icon="🎓">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoField label="Student ID" value={user.studentId} />
                  <InfoField label="College" value={user.college} />
                  <InfoField label="University" value={user.university} />
                  <InfoField label="Department" value={user.department} />
                  <InfoField label="Year" value={user.year} />
                  <InfoField label="Semester" value={user.semester} />
                  <InfoField label="CGPA" value={user.cgpa?.toString()} />
                  <InfoField label="Graduation Year" value={user.graduationYear} />
                </div>
              </SectionCard>
            )}

            {activeSection === 'teaching' && (
              <SectionCard title="Skills You Teach" icon="🎓">
                {teachingSkills.length === 0 ? (
                  <p className="text-slate-500 italic">No skills being taught yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachingSkills.map((skill: any) => (
                      <div key={skill._id} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded-full border border-emerald-500/20">
                            {skill.level}
                          </span>
                          <span className={`px-3 py-1 text-xs rounded-full border ${
                            skill.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            skill.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                            'bg-red-500/10 text-red-300 border-red-500/20'
                          }`}>
                            {skill.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-white mb-1">{skill.title}</h3>
                        <p className="text-sm text-slate-400 mb-3">{skill.category}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                          <span className="flex items-center gap-1">⭐ {skill.rating || 0}</span>
                          <span className="flex items-center gap-1">👥 {skill.learners || 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/skill/${skill._id}`)} className="flex-1 px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-all text-xs font-medium">
                            View Course
                          </button>
                          {isOwnProfile && (
                            <button onClick={() => navigate(`/course/${skill._id}`)} className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all text-xs font-medium">
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {activeSection === 'learning' && (
              <SectionCard title="Skills You're Learning" icon="📖">
                {learningSkills.length === 0 ? (
                  <p className="text-slate-500 italic">No learning goals yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {learningSkills.map((skill: any) => (
                      <div key={skill._id} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-500/50 transition-all duration-300">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-full border border-amber-500/20">
                          {skill.level}
                        </span>
                        <h3 className="font-bold text-white mt-3 mb-1">{skill.title}</h3>
                        <p className="text-sm text-slate-400 mb-3">{skill.category}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{skill.description}</p>
                        {isOwnProfile && (
                          <button onClick={() => navigate(`/learn-skill/${skill._id}`)} className="w-full px-3 py-2 bg-amber-500/20 text-amber-300 rounded-xl hover:bg-amber-500/30 transition-all text-xs font-medium">
                            Continue Learning
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {activeSection === 'certificates' && (
              <SectionCard title="Certificates" icon="🏆">
                {user.certificates?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.certificates.map((cert: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="text-3xl mb-3">🏆</div>
                        <h3 className="font-bold text-white mb-1">{cert.title || 'Certificate'}</h3>
                        <p className="text-sm text-slate-400">{cert.skill}</p>
                        <p className="text-xs text-slate-500 mt-1">Issued: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-xs text-slate-500">By: {cert.issuedBy || 'Platform'}</p>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => alert('View certificate')} className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-all text-xs font-medium">
                            View
                          </button>
                          <button onClick={() => alert('Download PDF')} className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all text-xs font-medium">
                            PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No certificates earned yet. Complete courses to earn certificates!</p>
                )}
              </SectionCard>
            )}

            {activeSection === 'achievements' && (
              <SectionCard title="Achievements" icon="⭐">
                {user.achievements?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.achievements.map((ach: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-500/50 transition-all duration-300 text-center">
                        <div className="text-4xl mb-3">{ach.icon || '🏅'}</div>
                        <h3 className="font-bold text-white mb-1">{ach.title}</h3>
                        <p className="text-sm text-slate-400">{ach.description}</p>
                        {ach.date && <p className="text-xs text-slate-500 mt-2">{new Date(ach.date).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No achievements yet. Keep learning!</p>
                )}
              </SectionCard>
            )}

            {activeSection === 'portfolio' && (
              <SectionCard title="Portfolio" icon="💼">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {user.socialLinks?.github && <PortfolioLink href={user.socialLinks.github} label="GitHub" icon="🐙" />}
                  {user.socialLinks?.linkedin && <PortfolioLink href={user.socialLinks.linkedin} label="LinkedIn" icon="💼" />}
                  {user.socialLinks?.portfolio && <PortfolioLink href={user.socialLinks.portfolio} label="Portfolio" icon="🌐" />}
                  {user.socialLinks?.resume && <PortfolioLink href={user.socialLinks.resume} label="Resume" icon="📄" />}
                  {user.socialLinks?.leetcode && <PortfolioLink href={user.socialLinks.leetcode} label="LeetCode" icon="⚡" />}
                  {user.socialLinks?.hackerrank && <PortfolioLink href={user.socialLinks.hackerrank} label="HackerRank" icon="🏆" />}
                  {user.socialLinks?.codechef && <PortfolioLink href={user.socialLinks.codechef} label="CodeChef" icon="🍳" />}
                  {user.socialLinks?.kaggle && <PortfolioLink href={user.socialLinks.kaggle} label="Kaggle" icon="📊" />}
                </div>
                {user.portfolioLinks?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Additional Links</h4>
                    <div className="space-y-2">
                      {user.portfolioLinks.map((link: string, idx: number) => (
                        <a key={idx} href={link} target="_blank" rel="noreferrer" className="block text-sm text-indigo-400 hover:text-indigo-300 truncate">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {!user.socialLinks && !user.portfolioLinks?.length && (
                  <p className="text-slate-500 italic">No portfolio links added yet.</p>
                )}
              </SectionCard>
            )}

            {activeSection === 'analytics' && (
              <div className="space-y-8">
                <SectionCard title="Teaching Analytics" icon="📊">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Courses', value: user.teachingAnalytics?.totalCourses || 0, icon: '📚' },
                      { label: 'Students Enrolled', value: user.teachingAnalytics?.studentsEnrolled || 0, icon: '👥' },
                      { label: 'Completed Courses', value: user.teachingAnalytics?.completedCourses || 0, icon: '✅' },
                      { label: 'Average Rating', value: user.teachingAnalytics?.averageRating || 0, icon: '⭐' },
                      { label: 'Teaching Hours', value: user.teachingAnalytics?.teachingHours || 0, icon: '⏱️' },
                      { label: 'Assignments', value: user.teachingAnalytics?.assignmentsCreated || 0, icon: '📝' },
                      { label: 'Quizzes', value: user.teachingAnalytics?.quizzesCreated || 0, icon: '❓' },
                      { label: 'Certificates Issued', value: user.teachingAnalytics?.certificatesIssued || 0, icon: '🏆' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-all duration-300">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                        <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Learning Analytics" icon="📈">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Learning Hours', value: user.learningAnalytics?.learningHours || 0, icon: '⏰' },
                      { label: 'Courses Completed', value: user.learningAnalytics?.coursesCompleted || 0, icon: '🎓' },
                      { label: 'In Progress', value: user.learningAnalytics?.coursesInProgress || 0, icon: '🔄' },
                      { label: 'Assignments Submitted', value: user.learningAnalytics?.assignmentsSubmitted || 0, icon: '📤' },
                      { label: 'Quiz Average', value: user.learningAnalytics?.quizAverage || 0, icon: '📊' },
                      { label: 'Current Streak', value: user.learningAnalytics?.currentStreak || 0, icon: '🔥' },
                      { label: 'Longest Streak', value: user.learningAnalytics?.longestStreak || 0, icon: '🏅' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-4 text-center hover:border-amber-500/50 transition-all duration-300">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                        <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {activeSection === 'reviews' && (
              <SectionCard title={`Reviews & Ratings (${reviews.length})`} icon="⭐">
                {reviews.length === 0 ? (
                  <p className="text-slate-500 italic">No reviews yet.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-extrabold text-white">★ {avgRating}</div>
                      <div className="text-sm text-slate-400">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                      <div className="ml-auto flex gap-2">
                        {(['latest', 'highest', 'oldest'] as const).map((sort) => (
                          <button
                            key={sort}
                            onClick={() => setReviewSort(sort)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              reviewSort === sort ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {sort === 'latest' ? 'Latest' : sort === 'highest' ? 'Highest' : 'Oldest'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {sortedReviews.map((review: any) => (
                        <div key={review._id} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {review.reviewer?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{review.reviewer?.name || 'Anonymous'}</div>
                                <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex text-amber-400 text-sm">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300">{review.comment || ''}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            )}

            {activeSection === 'activity' && (
              <SectionCard title="Activity Timeline" icon="🕒">
                {activity.length === 0 ? (
                  <p className="text-slate-500 italic">No activity yet.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-700 ml-4 space-y-6">
                    {activity.map((item: any) => (
                      <div key={item.id} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900"></div>
                        <div className="text-sm text-slate-300">{item.message}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(item.date).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {activeSection === 'bookmarks' && isOwnProfile && (
              <SectionCard title="Bookmarks" icon="🔖">
                {bookmarks.length === 0 ? (
                  <p className="text-slate-500 italic">No bookmarks yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map((skill: any) => (
                      <div key={skill._id} className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-all duration-300">
                        <h3 className="font-bold text-white mb-1">{skill.title}</h3>
                        <p className="text-sm text-slate-400 mb-3">{skill.category}</p>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/skill/${skill._id}`)} className="flex-1 px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-all text-xs font-medium">
                            View
                          </button>
                          <button onClick={() => handleRemoveBookmark(skill._id)} className="px-3 py-2 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all text-xs font-medium">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {activeSection === 'calendar' && isOwnProfile && (
              <SectionCard title="Calendar Events" icon="📅">
                <form onSubmit={handleAddCalendarEvent} className="mb-6 bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Event title"
                      value={calendarForm.title}
                      onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                      required
                    />
                    <input
                      type="date"
                      value={calendarForm.date}
                      onChange={(e) => setCalendarForm({ ...calendarForm, date: e.target.value })}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500 transition-all"
                      required
                    />
                    <select
                      value={calendarForm.type}
                      onChange={(e) => setCalendarForm({ ...calendarForm, type: e.target.value })}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="event">Event</option>
                      <option value="deadline">Deadline</option>
                      <option value="session">Session</option>
                      <option value="exam">Exam</option>
                    </select>
                    <button type="submit" disabled={calendarSubmitting} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50">
                      {calendarSubmitting ? 'Adding...' : 'Add Event'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    className="w-full mt-3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                  />
                </form>

                {calendarEvents.length === 0 ? (
                  <p className="text-slate-500 italic">No calendar events.</p>
                ) : (
                  <div className="space-y-3">
                    {calendarEvents.map((evt: any) => (
                      <div key={evt._id} className="flex items-center justify-between bg-slate-900/30 border border-slate-700/50 rounded-2xl p-4">
                        <div>
                          <div className="font-semibold text-white">{evt.title}</div>
                          <div className="text-xs text-slate-500">{evt.date} • {evt.type}</div>
                          {evt.description && <div className="text-sm text-slate-400 mt-1">{evt.description}</div>}
                        </div>
                        <button onClick={() => handleDeleteCalendarEvent(evt._id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all text-xs font-medium">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-6 sm:p-8">
    <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

const InfoField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-4">
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-sm font-medium text-slate-200">{value || 'N/A'}</div>
  </div>
);

const PortfolioLink: React.FC<{ href: string; label: string; icon: string }> = ({ href, label, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="flex flex-col items-center gap-2 p-4 bg-slate-900/30 border border-slate-700/50 rounded-2xl hover:border-indigo-500/50 transition-all duration-300 hover:scale-105"
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-xs text-slate-400">{label}</span>
  </a>
);

export default Profile;
