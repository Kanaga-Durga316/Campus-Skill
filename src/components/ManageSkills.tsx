import React, { useState, useEffect } from 'react';
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

const mapSkill = (s: any): Skill => ({
  id: s._id,
  title: s.title,
  category: s.category || 'Other',
  level: (s.level as Skill['level']) || 'All Levels',
  description: s.description || '',
  type: 'teach',
  createdAt: new Date(s.createdAt || Date.now()),
  status: s.status,
  adminComments: s.adminComments,
  rejectionReason: s.rejectionReason,
});

/**
 * Skill Management Component
 * Allows students to add and manage skills they can teach and want to learn
 */

// Types for skills
export interface Skill {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  description: string;
  type: 'teach' | 'learn';
  createdAt: Date;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';
  adminComments?: string;
  rejectionReason?: string;
}

// Pre-defined categories
const categories = [
  'Programming',
  'Technology',
  'Language',
  'Music',
  'Art & Design',
  'Business',
  'Communication',
  'Academics',
  'Sports',
  'Cooking',
  'Other'
];

// Level options
const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

// Difficulty options for learning resources
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

/**
 * RepeatableInput
 * Renders a list of text inputs the user can add/remove (used for
 * YouTube links, recorded videos, reference links, assignments).
 */
const RepeatableInput: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, values, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {values.map((value, i) => (
      <div key={i} className="flex gap-2 mb-2">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            const next = [...values];
            next[i] = e.target.value;
            onChange(next);
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
        />
        {values.length > 1 && (
          <button
            type="button"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="px-3 text-red-500 hover:text-red-700"
            aria-label="Remove"
          >
            ✕
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={() => onChange([...values, ''])}
      className="text-sm text-indigo-600 font-medium hover:underline"
    >
      + Add another
    </button>
  </div>
);

/**
 * ManageSkills Component
 * Main component for skill management
 */
const ManageSkills: React.FC = () => {
  const navigate = useNavigate();
  // State for skills (loaded from API)
  const [teachingSkills, setTeachingSkills] = useState<Skill[]>([]);
  const [learningSkills, setLearningSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const storedUser = getStoredUser();
  const userId: string | undefined = storedUser?._id;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Teach skills (from the user's own courses, including pending/rejected)
    fetchJSON('/skills/mine')
      .then((skills: any[]) => {
        if (!mounted) return;
        const mapped: Skill[] = skills
          .filter((s: any) => !userId || s.owner?._id === userId || s.owner === userId)
          .map(mapSkill);
        setTeachingSkills(mapped);
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message || 'Failed to load skills');
      })

    // Learn skills (separate "learnSkills" collection)
    fetchJSON('/learn-skills')
      .then((skills: any[]) => {
        if (!mounted) return;
        const mapped: Skill[] = skills.map((s: any) => ({
          id: s._id,
          title: s.title,
          category: s.category || 'Other',
          level: (s.level as Skill['level']) || 'All Levels',
          description: s.description || '',
          type: 'learn' as const,
          createdAt: new Date(s.createdAt || Date.now())
        }));
        setLearningSkills(mapped);
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message || 'Failed to load learn skills');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [userId]);

  const [activeTab, setActiveTab] = useState<'teach' | 'learn'>('teach');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    level: levels[0],
    description: '',
    courseDescription: '',
    notes: '',
    liveClassLink: '',
    githubLink: '',
    difficulty: 'Beginner',
    duration: ''
  });

  // Learning-resource list fields (multi-value)
  const [videoLinks, setVideoLinks] = useState<string[]>(['']);
  const [recordedVideoLinks, setRecordedVideoLinks] = useState<string[]>(['']);
  const [referenceLinks, setReferenceLinks] = useState<string[]>(['']);
  const [assignments, setAssignments] = useState<string[]>(['']);

  // Uploaded notes PDF
  const [notesFile, setNotesFile] = useState<File | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotesFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  };

  const resetResourceFields = () => {
    setFormData({
      title: '',
      category: categories[0],
      level: levels[0],
      description: '',
      courseDescription: '',
      notes: '',
      liveClassLink: '',
      githubLink: '',
      difficulty: 'Beginner',
      duration: ''
    });
    setVideoLinks(['']);
    setRecordedVideoLinks(['']);
    setReferenceLinks(['']);
    setAssignments(['']);
    setNotesFile(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a skill title');
      return;
    }

    if (!userId) {
      setError('Please log in to add skills');
      return;
    }

    try {
      if (activeTab === 'teach') {
        // Build multipart form so we can attach the notes PDF
        const fd = new FormData();
        fd.append('title', formData.title.trim());
        fd.append('category', formData.category);
        fd.append('level', formData.level);
        fd.append('description', formData.description);
        fd.append('courseDescription', formData.courseDescription);
        fd.append('notes', formData.notes);
        fd.append('liveClassLink', formData.liveClassLink);
        fd.append('githubLink', formData.githubLink);
        fd.append('difficulty', formData.difficulty);
        fd.append('duration', formData.duration);
        videoLinks.filter(l => l.trim()).forEach(l => fd.append('videoLinks', l.trim()));
        recordedVideoLinks.filter(l => l.trim()).forEach(l => fd.append('recordedVideoLinks', l.trim()));
        referenceLinks.filter(l => l.trim()).forEach(l => fd.append('referenceLinks', l.trim()));
        assignments.filter(l => l.trim()).forEach(l => fd.append('assignments', l.trim()));
        if (notesFile) fd.append('notesFile', notesFile);

        const created = await fetchJSON('/skills', { method: 'POST', body: fd });
        setTeachingSkills(prev => [mapSkill(created), ...prev]);
      } else {
        // Persist to the separate learnSkills collection
        const created = await fetchJSON('/learn-skills', {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title.trim(),
            category: formData.category,
            level: formData.level,
            description: formData.description
          })
        });
        setLearningSkills(prev => [
          {
            id: created._id,
            title: created.title,
            category: created.category || 'Other',
            level: (created.level as Skill['level']) || 'All Levels',
            description: created.description || '',
            type: 'learn',
            createdAt: new Date(created.createdAt || Date.now())
          },
          ...prev
        ]);
      }

      resetResourceFields();
      if (activeTab === 'teach') {
        alert('Your course has been submitted successfully and is waiting for Admin approval. 🎉');
      } else {
        alert('Learning skill added successfully! 🎉');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add skill');
    }
  };

  // Handle skill deletion
  const handleDelete = async (id: string, type: 'teach' | 'learn') => {
    if (type === 'teach') {
      try {
        await fetchJSON(`/skills/${id}`, { method: 'DELETE' });
      } catch (err: any) {
        setError(err?.message || 'Failed to delete skill');
        return;
      }
      setTeachingSkills(prev => prev.filter(skill => skill.id !== id));
    } else {
      try {
        await fetchJSON(`/learn-skills/${id}`, { method: 'DELETE' });
      } catch (err: any) {
        setError(err?.message || 'Failed to delete learn skill');
        return;
      }
      setLearningSkills(prev => prev.filter(skill => skill.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Manage Your Skills 🎯
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Add skills you can teach to help others, or skills you are learning from your peers.
            </p>
          </div>

          {loading && (
            <div className="text-center text-gray-500">Loading your skills...</div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 inline-flex">
              <button
                onClick={() => setActiveTab('teach')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'teach'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🎓 Skills I Can Teach
              </button>
              <button
                onClick={() => setActiveTab('learn')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'learn'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📚 Skills I Am Learning
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Skill Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {activeTab === 'teach' ? '➕ Add Skill to Teach' : '📝 Add Skill to Learn'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Skill Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder={activeTab === 'teach' ? 'e.g., Python Programming' : 'e.g., Public Speaking'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Level
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white"
                    >
                      {levels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder={activeTab === 'teach' 
                        ? 'Describe what you can teach...' 
                        : 'Describe what you are learning...'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none resize-none"
                    />
                  </div>

                  {/* Learning Resources (teachers only) */}
                  {activeTab === 'teach' && (
                    <div className="pt-6 mt-2 border-t border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <span>📚</span>
                        <span>Learning Resources</span>
                      </h3>
                      <div className="space-y-4">
                        {/* Course Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
                          <textarea
                            name="courseDescription"
                            rows={3}
                            value={formData.courseDescription}
                            onChange={handleChange}
                            placeholder="Describe the course..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none resize-none"
                          />
                        </div>

                        {/* Notes (text) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (text)</label>
                          <textarea
                            name="notes"
                            rows={2}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Optional text notes..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none resize-none"
                          />
                        </div>

                        {/* Notes PDF upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes Upload (PDF)</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          {notesFile && <p className="text-xs text-gray-500 mt-1">Selected: {notesFile.name}</p>}
                        </div>

                        <RepeatableInput label="YouTube Video Links" values={videoLinks} onChange={setVideoLinks} placeholder="https://youtube.com/watch?v=..." />
                        <RepeatableInput label="Recorded Video Links" values={recordedVideoLinks} onChange={setRecordedVideoLinks} placeholder="https://..." />

                        {/* Live Class Link */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Live Class Link (Meet / Zoom / Teams)</label>
                          <input
                            type="url"
                            name="liveClassLink"
                            value={formData.liveClassLink}
                            onChange={handleChange}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
                          />
                        </div>

                        <RepeatableInput label="Reference Website Links" values={referenceLinks} onChange={setReferenceLinks} placeholder="https://..." />
                        <RepeatableInput label="Assignments" values={assignments} onChange={setAssignments} placeholder="e.g. Build a to-do app" />

                        {/* GitHub Repository */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository (optional)</label>
                          <input
                            type="url"
                            name="githubLink"
                            value={formData.githubLink}
                            onChange={handleChange}
                            placeholder="https://github.com/..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
                          />
                        </div>

                        {/* Difficulty Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                          <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white"
                          >
                            {difficulties.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Course Duration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Course Duration</label>
                          <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="e.g. 3 hours"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === 'teach'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                    {activeTab === 'teach' ? '🎓 Add Teaching Skill' : '📚 Add Learning Skill'}
                  </button>
                </form>
              </div>
            </div>

            {/* Skills Display */}
            <div className="lg:col-span-2 space-y-8">
              {/* Teaching Skills */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>🎓</span>
                  <span>Skills I Can Teach</span>
                  <span className="text-sm font-normal text-gray-500">({teachingSkills.length})</span>
                </h2>
                
                {teachingSkills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {teachingSkills.map(skill => (
                       <SkillCard 
                         key={skill.id} 
                         skill={skill} 
                         onDelete={() => handleDelete(skill.id, 'teach')}
                         onOpen={() => navigate('/course/' + skill.id)}
                         onSubmit={async () => {
                           try {
                             await fetchJSON(`/skills/${skill.id}/submit`, { method: 'POST' });
                             alert('Your course has been submitted successfully and is waiting for Admin approval.');
                             // Refresh the list
                             const updated = await fetchJSON('/skills/mine');
                             setTeachingSkills(updated.filter((s: any) => !userId || s.owner?._id === userId || s.owner === userId).map(mapSkill));
                           } catch (err: any) {
                             alert(err.message || 'Failed to submit');
                           }
                         }}
                       />
                     ))}
                  </div>
                ) : (
                  <EmptyState 
                    emoji="🎓" 
                    message="You haven't added any skills to teach yet." 
                  />
                )}
              </div>

              {/* Learning Skills */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>📚</span>
                  <span>Skills I Want to Learn</span>
                  <span className="text-sm font-normal text-gray-500">({learningSkills.length})</span>
                </h2>
                
                {learningSkills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningSkills.map(skill => (
                      <SkillCard 
                        key={skill.id} 
                        skill={skill} 
                        onDelete={() => handleDelete(skill.id, 'learn')}
                        onOpen={() => navigate('/learn-skill/' + skill.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    emoji="📚" 
                    message="You haven't added any skills you are learning yet." 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SkillCard Component
 * Displays a single skill as a card
 */
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: '🕑' },
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  approved: { label: 'Live', color: 'bg-green-100 text-green-700', icon: '🟢' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '🔴' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
};

const SkillCard: React.FC<{
  skill: Skill;
  onDelete: () => void;
  onOpen?: () => void;
  onSubmit?: () => void;
}> = ({ skill, onDelete, onOpen, onSubmit }) => {
  const isTeaching = skill.type === 'teach';
  
  return (
    <div
      onClick={onOpen ? onOpen : undefined}
      className={`bg-white rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-lg group ${
        isTeaching 
          ? 'border-indigo-100 hover:border-indigo-300' 
          : 'border-amber-100 hover:border-amber-300'
      } ${onOpen ? 'cursor-pointer' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isTeaching 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {skill.category}
        </div>
        <div className="flex items-center gap-2">
          {skill.status && skill.status !== 'approved' && skill.status !== 'draft' && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[skill.status]?.color || 'bg-slate-100 text-slate-700'}`}>
              {statusConfig[skill.status]?.icon} {statusConfig[skill.status]?.label}
            </span>
          )}
          {skill.status === 'approved' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {statusConfig.approved.icon} {statusConfig.approved.label}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete skill"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{skill.title}</h3>

      {/* Level */}
      <div className="flex items-center space-x-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          skill.level === 'Beginner' ? 'bg-green-100 text-green-700' :
          skill.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
          skill.level === 'Advanced' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {skill.level}
        </span>
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-gray-600 text-sm line-clamp-2">{skill.description}</p>
      )}

      {/* Admin Comments / Rejection Reason */}
      {skill.adminComments && skill.status && skill.status !== 'approved' && skill.status !== 'pending' && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg">
          <p className="text-xs font-semibold">Admin Feedback:</p>
          <p className="text-xs mt-1">{skill.adminComments}</p>
        </div>
      )}
      {skill.rejectionReason && skill.status === 'rejected' && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <p className="text-xs font-semibold">Rejection Reason:</p>
          <p className="text-xs mt-1">{skill.rejectionReason}</p>
        </div>
      )}

      {/* Submit / Resubmit Button */}
      {isTeaching && skill.status && (skill.status === 'draft' || skill.status === 'changes_requested' || skill.status === 'rejected') && onSubmit && (
        <button
          onClick={(e) => { e.stopPropagation(); onSubmit(); }}
          className="mt-2 w-full py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700"
        >
          {skill.status === 'changes_requested' ? '🔄 Resubmit for Approval' : skill.status === 'rejected' ? '🔄 Resubmit for Approval' : '📤 Submit for Approval'}
        </button>
      )}
      {isTeaching && skill.status === 'pending' && (
        <div className="mt-2 w-full py-2 text-center text-xs text-yellow-700 bg-yellow-50 rounded-xl">
          ⏳ Waiting for admin review
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Added {skill.createdAt.toLocaleDateString()}
        </span>
        <span className={`text-xs font-medium ${isTeaching ? 'text-indigo-600' : 'text-amber-600'}`}>
          {isTeaching ? 'Teaching' : 'Learning'}
        </span>
      </div>
    </div>
  );
};

/**
 * EmptyState Component
 * Shows when no skills are added
 */
const EmptyState: React.FC<{ emoji: string; message: string }> = ({ emoji, message }) => (
  <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-200 text-center">
    <div className="text-5xl mb-4">{emoji}</div>
    <p className="text-gray-500">{message}</p>
  </div>
);

export default ManageSkills;