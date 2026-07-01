import React from 'react';

/**
 * SkillCard Component
 * A reusable card component for displaying student skill exchange information
 * 
 * Usage:
 * <SkillCard 
 *   studentName="Alex Johnson"
 *   skillsCanTeach={['Python', 'Web Development']}
 *   skillsWantToLearn={['Public Speaking', 'Photography']}
 *   onRequestExchange={() => handleRequest()}
 * />
 * 
 * Props:
 * - studentName: The name of the student
 * - skillsCanTeach: Array of skills the student can teach
 * - skillsWantToLearn: Array of skills the student wants to learn
 * - onRequestExchange: Callback function when request button is clicked
 * - avatar?: Optional avatar initials or image URL
 * - department?: Student's department
 * - year?: Student's year
 * - rating?: Student's rating score
 * - available?: Whether student is available for exchange
 */

export interface SkillCardProps {
  studentName: string;
  skillsCanTeach: string[];
  skillsWantToLearn: string[];
  onRequestExchange: () => void;
  avatar?: string;
  department?: string;
  year?: string;
  rating?: number;
  available?: boolean;
  className?: string;
}

/**
 * SkillCard Component
 * Displays student information with their teaching and learning skills
 */
const SkillCard: React.FC<SkillCardProps> = ({
  studentName,
  skillsCanTeach,
  skillsWantToLearn,
  onRequestExchange,
  avatar,
  department,
  year,
  rating,
  available = true,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 ${className}`}>
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {avatar || studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{studentName}</h3>
              {department && (
                <p className="text-sm text-gray-500">{department}{year && ` • ${year}`}</p>
              )}
            </div>
          </div>
          
          {/* Availability Badge */}
          <AvailabilityBadge available={available} />
        </div>

        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-yellow-500 text-lg">★</span>
            <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">rating</span>
          </div>
        )}
      </div>

      {/* Skills They Can Teach */}
      <div className="px-6 pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">🎓</span>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Can Teach
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsCanTeach.map((skill, index) => (
            <SkillTag key={index} skill={skill} type="teach" />
          ))}
        </div>
      </div>

      {/* Skills They Want to Learn */}
      <div className="px-6 pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">📚</span>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            Wants to Learn
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillsWantToLearn.map((skill, index) => (
            <SkillTag key={index} skill={skill} type="learn" />
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <button 
          onClick={onRequestExchange}
          disabled={!available}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
            available
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>🤝</span>
          <span>{available ? 'Send Exchange Request' : 'Currently Unavailable'}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * SkillTag Component
 * Reusable tag for displaying individual skills
 */
const SkillTag: React.FC<{ skill: string; type: 'teach' | 'learn' }> = ({ skill, type }) => {
  const styles = type === 'teach'
    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
    : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${styles}`}>
      {skill}
    </span>
  );
};

/**
 * AvailabilityBadge Component
 * Shows whether the student is available for skill exchange
 */
const AvailabilityBadge: React.FC<{ available: boolean }> = ({ available }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
    available 
      ? 'bg-emerald-100 text-emerald-700' 
      : 'bg-gray-100 text-gray-500'
  }`}>
    {available ? '✓ Available' : '✕ Busy'}
  </span>
);

export default SkillCard;