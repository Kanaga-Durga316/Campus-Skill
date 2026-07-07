import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './Navbar';
import ExchangeRequestModal, { SkillExchangeRequest } from './ExchangeRequestModal';
import { fetchJSON } from '../api';

/**
 * SkillSearch Component
 * Allows students to search for skills and find students who offer them
 */

// Type for student offering a skill
interface StudentSkill {
  id: string;
  studentName: string;
  department: string;
  year: string;
  avatar: string;
  skills: string[];
  skillToTeach: string;
  category: string;
  level: string;
  rating: number;
  learners: number;
  available: boolean;
  bio: string;
}

/**
 * SkillSearch Component
 * Main component for searching skills
 */
const SkillSearch: React.FC = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSkill | null>(null);

  // Sample user skills (in real app, this would come from context/API)
  const [userTeachingSkills, setUserTeachingSkills] = useState<{ id: string; title: string }[]>([]);

  // Sample data - students offering skills
  const [studentsData, setStudentsData] = useState<StudentSkill[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchJSON('/skills')
      .then((skills: any[]) => {
        if (!mounted) return;
        const mapped = skills.map(s => ({
          id: s._id,
          studentName: s.owner?.name || 'Unknown',
          department: s.owner?.department || '',
          year: s.owner?.year || '',
          avatar: s.owner?.name ? s.owner.name.charAt(0) : s.title.charAt(0),
          skills: s.tags || [],
          skillToTeach: s.title,
          category: s.category || 'Other',
          level: s.level || 'All Levels',
          rating: s.rating || 4.5,
          learners: s.learners || 0,
          available: s.availability !== undefined ? s.availability : true,
          bio: s.owner?.bio || ''
        }));
        setStudentsData(mapped);
      })
      .catch(() => {
        // ignore
      });
    return () => { mounted = false; };
  }, []);

  // Filter categories
  const categories = ['All', 'Programming', 'Technology', 'Language', 'Music', 'Art & Design', 'Communication', 'Business'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        student.skillToTeach.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        student.studentName.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'All' || student.category === selectedCategory;

      // Level filter
      const matchesLevel = selectedLevel === 'All' || student.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [searchQuery, selectedCategory, selectedLevel]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle request button click
  const handleRequestClick = (student: StudentSkill) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = (request: SkillExchangeRequest) => {
    console.log('Exchange request sent:', request);
    alert(`Request sent to ${request.recipientName}! \n\nYou want to learn: ${request.skillWanted}\nYou offer: ${request.skillOffered}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Find Skills to Learn 🔍
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Search for skills you want to learn and discover students who can teach you.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search for skills (e.g., React, Python, Photography)..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none text-lg"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Level:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white text-sm"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="ml-auto flex items-center">
                <span className="text-sm text-gray-500">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>

          {/* Popular Searches */}
          {searchQuery === '' && selectedCategory === 'All' && selectedLevel === 'All' && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Searches:</h3>
              <div className="flex flex-wrap gap-2">
                {['Python', 'React', 'Photography', 'Guitar', 'French', 'Public Speaking'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <SearchResultCard 
                  key={student.id} 
                  student={student}
                  onRequest={handleRequestClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                }}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Request Modal */}
      <ExchangeRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipientName={selectedStudent?.studentName || ''}
        skillWanted={selectedStudent?.skillToTeach || ''}
        recipientSkills={selectedStudent?.skills || []}
        userTeachingSkills={userTeachingSkills}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

/**
 * SearchResultCard Component
 * Displays a student offering a skill
 */
const SearchResultCard: React.FC<{ student: StudentSkill; onRequest: (student: StudentSkill) => void }> = ({ student, onRequest }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
      {/* Card Header */}
      <div className="p-6 pb-4">
        {/* Student Info */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Avatar */}
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {student.avatar}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{student.studentName}</h3>
            <p className="text-sm text-gray-500">{student.department}</p>
            <p className="text-xs text-gray-400">{student.year}</p>
          </div>

          {/* Availability */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            student.available 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-500'
          }`}>
            {student.available ? '✓ Available' : 'Busy'}
          </span>
        </div>

        {/* Skill Being Offered */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Can Teach
          </span>
          <h4 className="text-xl font-bold text-gray-900 mt-1">{student.skillToTeach}</h4>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
            {student.category}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.level === 'Beginner' ? 'bg-green-50 text-green-700' :
            student.level === 'Intermediate' ? 'bg-blue-50 text-blue-700' :
            student.level === 'Advanced' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {student.level}
          </span>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{student.bio}</p>

        {/* Other Skills */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Also offers:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {student.skills.filter(s => s !== student.skillToTeach).slice(0, 3).map((skill, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500 text-lg">★</span>
            <span className="font-semibold text-gray-900">{student.rating}</span>
            <span className="text-gray-400 text-sm">({student.learners})</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <button 
          disabled={!student.available}
          onClick={() => onRequest(student)}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
            student.available
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {student.available ? 'Request to Learn' : 'Currently Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default SkillSearch;