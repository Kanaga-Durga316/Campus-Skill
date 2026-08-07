import React, { useEffect, useMemo, useState } from 'react';
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

const Settings: React.FC = () => {
  const storedUser = useMemo(() => getStoredUser(), []);
  const userId: string | undefined = storedUser?._id;

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    coverImage: '',
    location: '',
    preferredMode: 'online',
    experienceLevel: 'beginner',
    sessionDurationHours: 1,
    portfolioLinksText: '',
    verificationStatus: 'unverified',
    studentId: '',
    college: '',
    university: '',
    semester: '',
    cgpa: '',
    graduationYear: '',
    careerGoal: '',
    academicInterestsText: '',
    phoneNumber: '',
    twoFactorEnabled: false,
    profileVisibility: 'public',
    showEmail: true,
    showPhone: false,
    showPortfolio: true,
    showCertificates: true,
    showAchievements: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!storedUser) return;
    setFormData({
      name: storedUser.name || '',
      bio: storedUser.bio || '',
      avatarUrl: storedUser.avatarUrl || '',
      coverImage: storedUser.coverImage || '',
      location: storedUser.location || '',
      preferredMode: storedUser.preferredMode || 'online',
      experienceLevel: storedUser.experienceLevel || 'beginner',
      sessionDurationHours:
        typeof storedUser.sessionDurationHours === 'number'
          ? storedUser.sessionDurationHours
          : Number(storedUser.sessionDurationHours) || 1,
      portfolioLinksText: Array.isArray(storedUser.portfolioLinks)
        ? storedUser.portfolioLinks.join('\n')
        : '',
      verificationStatus: storedUser.verificationStatus || 'unverified',
      studentId: storedUser.studentId || '',
      college: storedUser.college || '',
      university: storedUser.university || '',
      semester: storedUser.semester || '',
      cgpa: storedUser.cgpa?.toString() || '',
      graduationYear: storedUser.graduationYear || '',
      careerGoal: storedUser.careerGoal || '',
      academicInterestsText: Array.isArray(storedUser.academicInterests)
        ? storedUser.academicInterests.join(', ')
        : '',
      phoneNumber: storedUser.phoneNumber || '',
      twoFactorEnabled: !!storedUser.twoFactorEnabled,
      profileVisibility: storedUser.profileVisibility || 'public',
      showEmail: !!storedUser.privacySettings?.showEmail,
      showPhone: !!storedUser.privacySettings?.showPhone,
      showPortfolio: !!storedUser.privacySettings?.showPortfolio,
      showCertificates: !!storedUser.privacySettings?.showCertificates,
      showAchievements: !!storedUser.privacySettings?.showAchievements,
    });
  }, [storedUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const profileCompletion = useMemo(() => {
    const fields = [
      formData.name, formData.bio, formData.avatarUrl, formData.coverImage, formData.college, formData.university,
      formData.semester, formData.cgpa, formData.careerGoal, formData.studentId, formData.phoneNumber
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');

      const portfolioLinks = formData.portfolioLinksText
        .split(/\r?\n|,/)
        .map(s => s.trim())
        .filter(Boolean);

      const academicInterests = formData.academicInterestsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: Record<string, any> = {
        name: formData.name,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl || undefined,
        coverImage: formData.coverImage || undefined,
        location: formData.location || undefined,
        preferredMode: formData.preferredMode,
        experienceLevel: formData.experienceLevel,
        sessionDurationHours: Number(formData.sessionDurationHours) || 1,
        portfolioLinks,
        verificationStatus: formData.verificationStatus,
        studentId: formData.studentId,
        college: formData.college,
        university: formData.university,
        semester: formData.semester,
        cgpa: Number(formData.cgpa) || 0,
        graduationYear: formData.graduationYear,
        careerGoal: formData.careerGoal,
        academicInterests,
        phoneNumber: formData.phoneNumber,
        twoFactorEnabled: formData.twoFactorEnabled,
        profileVisibility: formData.profileVisibility,
        privacySettings: {
          showEmail: formData.showEmail,
          showPhone: formData.showPhone,
          showPortfolio: formData.showPortfolio,
          showCertificates: formData.showCertificates,
          showAchievements: formData.showAchievements,
        },
      };

      const updated = await fetchJSON(`/profile/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings ⚙️</h1>
            <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              {success}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completion</h2>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }}></div>
            </div>
            <p className="text-sm text-gray-600">{profileCompletion}% complete</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" required />
                </div>
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea id="bio" name="bio" rows={3} value={formData.bio} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Tell others about yourself..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                    <input type="text" id="avatarUrl" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                    <input type="text" id="coverImage" name="coverImage" value={formData.coverImage} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferredMode" className="block text-sm font-medium text-gray-700 mb-1">Preferred mode</label>
                    <select id="preferredMode" name="preferredMode" value={formData.preferredMode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">Experience level</label>
                    <select id="experienceLevel" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="sessionDurationHours" className="block text-sm font-medium text-gray-700 mb-1">Session duration (hours)</label>
                  <input type="number" id="sessionDurationHours" name="sessionDurationHours" min={0.5} step={0.5} value={formData.sessionDurationHours} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="portfolioLinksText" className="block text-sm font-medium text-gray-700 mb-1">Portfolio links (one per line)</label>
                  <textarea id="portfolioLinksText" name="portfolioLinksText" rows={4} value={formData.portfolioLinksText} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" placeholder="https://github.com/you\nhttps://your-website.com" />
                </div>
                <div>
                  <label htmlFor="verificationStatus" className="block text-sm font-medium text-gray-700 mb-1">Verification status</label>
                  <select id="verificationStatus" name="verificationStatus" value={formData.verificationStatus} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Academic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input type="text" id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <input type="text" id="college" name="college" value={formData.college} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input type="text" id="university" name="university" value={formData.university} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input type="text" id="semester" name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="cgpa" className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                  <input type="number" id="cgpa" name="cgpa" min="0" max="10" step="0.1" value={formData.cgpa} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input type="text" id="graduationYear" name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="careerGoal" className="block text-sm font-medium text-gray-700 mb-1">Career Goal</label>
                  <textarea id="careerGoal" name="careerGoal" rows={2} value={formData.careerGoal} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="academicInterestsText" className="block text-sm font-medium text-gray-700 mb-1">Academic Interests (comma separated)</label>
                  <textarea id="academicInterestsText" name="academicInterestsText" rows={2} value={formData.academicInterestsText} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Visibility</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 mb-1">Profile Visibility</label>
                  <select id="profileVisibility" name="profileVisibility" value={formData.profileVisibility} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                    <option value="public">Public</option>
                    <option value="college">College Only</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="showEmail" checked={formData.showEmail} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Show email
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="showPhone" checked={formData.showPhone} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Show phone
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="showPortfolio" checked={formData.showPortfolio} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Show portfolio
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="showCertificates" checked={formData.showCertificates} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Show certificates
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="showAchievements" checked={formData.showAchievements} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Show achievements
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-500">Add extra security to your account</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="twoFactorEnabled" checked={formData.twoFactorEnabled} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 mt-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
            <p className="text-gray-600 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-6 py-2 border-2 border-red-600 text-red-600 font-semibold rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
