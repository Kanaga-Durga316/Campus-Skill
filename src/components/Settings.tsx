import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';


/**
 * Settings Component
 * User profile and account settings
 */
const Settings: React.FC = () => {
  const storedUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const userId: string | undefined = storedUser?._id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    location: '',
    preferredMode: 'online',
    experienceLevel: 'beginner',
    sessionDurationHours: 1,
    portfolioLinksText: '',
    verificationStatus: 'unverified'
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
      verificationStatus: storedUser.verificationStatus || 'unverified'
    });
  }, [storedUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

      const payload = {
        name: formData.name,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl || undefined,
        location: formData.location || undefined,
        preferredMode: formData.preferredMode,
        experienceLevel: formData.experienceLevel,
        sessionDurationHours: Number(formData.sessionDurationHours) || 1,
        portfolioLinks,
        verificationStatus: formData.verificationStatus
      };

      const updated = await fetchJSON(`/users/${userId}`, {
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
        <div className="max-w-2xl mx-auto">
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

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferredMode" className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred mode
                    </label>
                    <select
                      id="preferredMode"
                      name="preferredMode"
                      value={formData.preferredMode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience level
                    </label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="sessionDurationHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Session duration (hours)
                  </label>
                  <input
                    type="number"
                    id="sessionDurationHours"
                    name="sessionDurationHours"
                    min={0.5}
                    step={0.5}
                    value={formData.sessionDurationHours}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="portfolioLinksText" className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio links (one per line)
                  </label>
                  <textarea
                    id="portfolioLinksText"
                    name="portfolioLinksText"
                    rows={4}
                    value={formData.portfolioLinksText}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="https://github.com/you\nhttps://your-website.com"
                  />
                </div>

                <div>
                  <label htmlFor="verificationStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification status
                  </label>
                  <select
                    id="verificationStatus"
                    name="verificationStatus"
                    value={formData.verificationStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
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

