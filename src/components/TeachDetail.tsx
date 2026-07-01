import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * TeachDetail Component
 * Displays details about a skill the user teaches - what others can learn and key features
 */

// Types
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Learner {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  rating: number;
  progress: number;
}

interface TeachDetail {
  id: string;
  title: string;
  category: string;
  level: string;
  emoji: string;
  description: string;
  whatYouWillLearn: string[];
  keyFeatures: Feature[];
  prerequisites: string[];
  totalLearners: number;
  rating: number;
  learners: Learner[];
}

// Sample teaching skills data
const teachSkillsDatabase: Record<string, TeachDetail> = {
  '1': {
    id: '1',
    title: 'Python Programming',
    category: 'Programming',
    level: 'Beginner',
    emoji: '🐍',
    description: 'Learn Python programming from scratch. Perfect for beginners who want to start their programming journey.',
    whatYouWillLearn: [
      'Fundamentals of Python programming',
      'Variables, data types, and operators',
      'Control flow and loops',
      'Functions and modules',
      'Working with files',
      'Basic data structures'
    ],
    keyFeatures: [
      { id: 'f1', title: 'Step-by-Step Lessons', description: 'Easy to follow lessons designed for absolute beginners', icon: '📚' },
      { id: 'f2', title: 'Hands-on Projects', description: 'Practice with real-world coding exercises', icon: '💻' },
      { id: 'f3', title: 'Code Examples', description: 'Detailed code examples with explanations', icon: '📝' },
      { id: 'f4', title: 'Quiz & Assessments', description: 'Test your knowledge with interactive quizzes', icon: '✅' }
    ],
    prerequisites: ['No prior programming experience needed', 'Basic computer skills', 'Eagerness to learn'],
    learners: [
      { id: '5', name: 'John Smith', avatar: 'J', department: 'Data Science', year: 'Sophomore', rating: 4.5, progress: 75 },
      { id: '6', name: 'Lisa Anderson', avatar: 'L', department: 'Web Development', year: 'Senior', rating: 4.8, progress: 45 },
    ],
    totalLearners: 12,
    rating: 4.8
  },
  '2': {
    id: '2',
    title: 'Web Development',
    category: 'Technology',
    level: 'Intermediate',
    emoji: '🌐',
    description: 'Master web development with HTML, CSS, and JavaScript. Build modern, responsive websites.',
    whatYouWillLearn: [
      'HTML5 fundamentals and semantic markup',
      'CSS3 styling and responsive design',
      'JavaScript programming basics',
      'DOM manipulation',
      'Building responsive layouts',
      'Web development best practices'
    ],
    keyFeatures: [
      { id: 'f1', title: 'Modern Technologies', description: 'Learn the latest web development standards', icon: '🚀' },
      { id: 'f2', title: 'Portfolio Projects', description: 'Build real websites for your portfolio', icon: '📁' },
      { id: 'f3', title: 'Code Reviews', description: 'Get feedback on your code', icon: '👀' },
      { id: 'f4', title: 'Flexible Schedule', description: 'Learn at your own pace', icon: '⏰' }
    ],
    prerequisites: ['Basic computer knowledge', 'Understanding of how the web works', 'Text editor installed'],
    learners: [
      { id: '6', name: 'Lisa Anderson', avatar: 'L', department: 'Web Development', year: 'Senior', rating: 4.8, progress: 60 },
      { id: '8', name: 'Tom Baker', avatar: 'T', department: 'Business', year: 'Senior', rating: 4.7, progress: 30 },
    ],
    totalLearners: 8,
    rating: 4.9
  },
  '3': {
    id: '3',
    title: 'Math Tutoring',
    category: 'Academics',
    level: 'All Levels',
    emoji: '📐',
    description: 'Get help with math at any level. From basic algebra to calculus, I will help you understand and excel.',
    whatYouWillLearn: [
      'Problem-solving techniques',
      'Mathematical concepts and formulas',
      'Step-by-step solutions',
      'Exam preparation strategies',
      'Practical applications',
      'Critical thinking skills'
    ],
    keyFeatures: [
      { id: 'f1', title: 'Personalized Learning', description: 'Tailored lessons based on your level', icon: '🎯' },
      { id: 'f2', title: 'Patient Teaching', description: 'Learn at your own pace without pressure', icon: '🤝' },
      { id: 'f3', title: 'Practice Problems', description: 'Extensive practice with various difficulty levels', icon: '📊' },
      { id: 'f4', title: 'Exam Prep', description: 'Specialized preparation for tests and exams', icon: '📋' }
    ],
    prerequisites: ['Basic math knowledge', 'Willingness to practice', 'Notebook for taking notes'],
    learners: [
      { id: '7', name: 'Tom Wilson', avatar: 'T', department: 'Mathematics', year: 'Junior', rating: 4.6, progress: 80 },
    ],
    totalLearners: 15,
    rating: 4.7
  }
};

const TeachDetail: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<TeachDetail | null>(null);

  useEffect(() => {
    if (skillId && teachSkillsDatabase[skillId]) {
      setSkill(teachSkillsDatabase[skillId]);
    } else {
      // If skill not found, navigate back to dashboard
      navigate('/dashboard');
    }
  }, [skillId, navigate]);

  if (!skill) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500"></div>
            <div className="px-6 pb-6 -mt-16">
              <div className="flex items-end space-x-4">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-slate-800">
                  {skill.emoji}
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{skill.title}</h1>
                  <p className="text-slate-500 dark:text-slate-400">{skill.category} • {skill.level}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-amber-500 text-xl">★</span>
                    <span className="font-bold text-slate-900 dark:text-white">{skill.rating}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{skill.totalLearners} learners</p>
                </div>
              </div>
              
              <p className="mt-4 text-slate-600 dark:text-slate-300">{skill.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* What You Will Learn */}
            <div className="lg:col-span-2 space-y-6">
              {/* Your Learners */}
              {skill.learners && skill.learners.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <span className="mr-2">👨‍🎓</span> Students Learning This Skill ({skill.learners.length})
                  </h2>
                  <div className="space-y-3">
                    {skill.learners.map((learner) => (
                      <div 
                        key={learner.id}
                        onClick={() => navigate(`/student/${learner.id}`)}
                        className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                            {learner.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{learner.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{learner.department} • {learner.year}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-amber-500">★</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{learner.rating}</span>
                          </div>
                          <div className="w-20">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <span>Progress</span>
                              <span>{learner.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${learner.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* What Learners Will Learn */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📚</span> What Learners Will Learn
                </h2>
                <ul className="space-y-3">
                  {skill.whatYouWillLearn.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📋</span> Prerequisites
                </h2>
                <ul className="space-y-2">
                  {skill.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                      <span className="text-indigo-500">•</span>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key Features */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">⭐</span> Key Features
                </h2>
                <div className="space-y-4">
                  {skill.keyFeatures.map((feature) => (
                    <div key={feature.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{feature.icon}</span>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  ✏️ Edit Skill Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachDetail;
