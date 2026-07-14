import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

/**
 * LearnSkillDetail Component
 * Displays the details of a skill the user wants to learn.
 */
const LearnSkillDetail: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<{
    id: string;
    title: string;
    category: string;
    level: string;
    description: string;
    tags: string[];
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skillId) return;
    setLoading(true);
    fetchJSON(`/learn-skills/${skillId}`)
      .then((s: any) => {
        setSkill({
          id: s._id,
          title: s.title,
          category: s.category || 'Other',
          level: s.level || 'All Levels',
          description: s.description || '',
          tags: Array.isArray(s.tags) ? s.tags : []
        });
      })
      .catch((err: any) => setError(err?.message || 'Failed to load skill'))
      .finally(() => setLoading(false));
  }, [skillId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="pt-24 px-4 text-center text-red-600">{error || 'Skill not found'}</div>
      </div>
    );
  }

  const levelClass =
    skill.level === 'Beginner'
      ? 'bg-green-100 text-green-700'
      : skill.level === 'Intermediate'
      ? 'bg-blue-100 text-blue-700'
      : skill.level === 'Advanced'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/manage-skills')}
            className="flex items-center text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Manage Skills
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {skill.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelClass}`}>
                {skill.level}
              </span>
              <span className="text-xs font-medium text-amber-600">Learning</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{skill.title}</h1>

            {skill.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{skill.description}</p>
            )}

            {skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {skill.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnSkillDetail;
