import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

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

/**
 * ManageSkills Component
 * Main component for skill management
 */
const ManageSkills: React.FC = () => {
  // State for skills (loaded from API)
  const [teachingSkills, setTeachingSkills] = useState<Skill[]>([]);
  const [learningSkills, setLearningSkills] = useState<Skill[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchJSON('/skills')
      .then((skills: any[]) => {
        if (!mounted) return;
        // Map backend skills to ManageSkills.Skill structure
        const mapped: Skill[] = skills.map(s => ({
          id: s._id,
          title: s.title,
          category: s.category || 'Other',
          level: s.level || 'All Levels',
          description: s.description || '',
          type: 'teach',
          createdAt: new Date(s.createdAt || Date.now())
        }));
        setTeachingSkills(mapped);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Form state
  const [activeTab, setActiveTab] = useState<'teach' | 'learn'>('teach');
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    level: levels[0],
    description: ''
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a skill title');
      return;
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      title: formData.title,
      category: formData.category,
      level: formData.level as Skill['level'],
      description: formData.description,
      type: activeTab,
      createdAt: new Date()
    };

    if (activeTab === 'teach') {
      setTeachingSkills(prev => [...prev, newSkill]);
    } else {
      setLearningSkills(prev => [...prev, newSkill]);
    }

    // Reset form
    setFormData({
      title: '',
      category: categories[0],
      level: levels[0],
      description: ''
    });

    alert(`${activeTab === 'teach' ? 'Teaching' : 'Learning'} skill added successfully! 🎉`);
  };

  // Handle skill deletion
  const handleDelete = (id: string, type: 'teach' | 'learn') => {
    if (type === 'teach') {
      setTeachingSkills(prev => prev.filter(skill => skill.id !== id));
    } else {
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
              Add skills you can teach to help others, or skills you want to learn from your peers.
            </p>
          </div>

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
                📚 Skills I Want to Learn
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
                        : 'Describe what you want to learn...'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none resize-none"
                    />
                  </div>

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
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    emoji="📚" 
                    message="You haven't added any skills you want to learn yet." 
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
const SkillCard: React.FC<{
  skill: Skill;
  onDelete: () => void;
}> = ({ skill, onDelete }) => {
  const isTeaching = skill.type === 'teach';
  
  return (
    <div className={`bg-white rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-lg group ${
      isTeaching 
        ? 'border-indigo-100 hover:border-indigo-300' 
        : 'border-amber-100 hover:border-amber-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isTeaching 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {skill.category}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete skill"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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