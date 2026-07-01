import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

/**
 * SkillDetail Component
 * Displays course content, lessons, and materials for a specific skill
 */

// Types
interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'article' | 'quiz';
}

interface SkillDetail {
  id: string;
  title: string;
  category: string;
  level: string;
  emoji: string;
  description: string;
  instructor: string;
  rating: number;
  learners: number;
  totalDuration: string;
  lessons: Lesson[];
}

// Sample skill details data (in a real app, this would come from an API)
const skillsDatabase: Record<string, SkillDetail> = {
  '1': {
    id: '1',
    title: 'Public Speaking',
    category: 'Communication',
    level: 'Beginner',
    emoji: '🎤',
    description: 'Master the art of public speaking and presentations. Learn techniques to overcome stage fright, structure your speeches, and engage any audience.',
    instructor: 'Sarah Williams',
    rating: 4.9,
    learners: 18,
    totalDuration: '4 hours',
    lessons: [
      { id: '1-1', title: 'Introduction to Public Speaking', duration: '15 min', completed: true, type: 'video' },
      { id: '1-2', title: 'Overcoming Stage Fright', duration: '20 min', completed: true, type: 'video' },
      { id: '1-3', title: 'Structuring Your Speech', duration: '25 min', completed: false, type: 'video' },
      { id: '1-4', title: 'Body Language Basics', duration: '15 min', completed: false, type: 'article' },
      { id: '1-5', title: 'Engaging Your Audience', duration: '20 min', completed: false, type: 'video' },
      { id: '1-6', title: 'Practice Session', duration: '30 min', completed: false, type: 'quiz' },
    ]
  },
  '2': {
    id: '2',
    title: 'Photography',
    category: 'Creative',
    level: 'Beginner',
    emoji: '📷',
    description: 'Learn the fundamentals of photography, from camera settings to composition techniques. Capture stunning photos with your phone or camera.',
    instructor: 'Emily Davis',
    rating: 4.6,
    learners: 20,
    totalDuration: '5 hours',
    lessons: [
      { id: '2-1', title: 'Camera Basics', duration: '20 min', completed: true, type: 'video' },
      { id: '2-2', title: 'Understanding Exposure', duration: '25 min', completed: true, type: 'video' },
      { id: '2-3', title: 'Composition Rules', duration: '20 min', completed: false, type: 'article' },
      { id: '2-4', title: 'Lighting Fundamentals', duration: '25 min', completed: false, type: 'video' },
      { id: '2-5', title: 'Portrait Photography', duration: '30 min', completed: false, type: 'video' },
      { id: '2-6', title: 'Photo Editing Basics', duration: '20 min', completed: false, type: 'video' },
    ]
  }
};

const SkillDetail: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!skillId) return;
    // Try backend first
    fetchJSON(`/skills/${skillId}`)
      .then((s: any) => {
        if (!mounted) return;
        const mapped: SkillDetail = {
          id: s._id,
          title: s.title,
          category: s.category || 'General',
          level: s.level || 'All Levels',
          emoji: '📘',
          description: s.description || '',
          instructor: s.owner?.name || 'Instructor',
          rating: s.rating || 4.5,
          learners: s.learners || 0,
          totalDuration: '—',
          lessons: []
        };
        setSkill(mapped);
      })
      .catch(() => {
        // fallback to local sample
        if (skillId && skillsDatabase[skillId]) {
          setSkill(skillsDatabase[skillId]);
          const firstIncomplete = skillsDatabase[skillId].lessons.find(l => !l.completed);
          if (firstIncomplete) setActiveLesson(firstIncomplete.id);
        } else {
          navigate('/dashboard');
        }
      });
    return () => { mounted = false; };
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

  const completedLessons = skill.lessons.filter(l => l.completed).length;
  const progress = Math.round((completedLessons / skill.lessons.length) * 100);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'article': return '📄';
      case 'quiz': return '✅';
      default: return '📚';
    }
  };

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
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
            <div className="px-6 pb-6 -mt-16">
              <div className="flex items-end space-x-4">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-slate-800">
                  {skill.emoji}
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{skill.title}</h1>
                  <p className="text-slate-500 dark:text-slate-400">{skill.category} • {skill.level} • {skill.instructor}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-amber-500 text-xl">★</span>
                    <span className="font-bold text-slate-900 dark:text-white">{skill.rating}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{skill.learners} learners</p>
                </div>
              </div>
              
              <p className="mt-4 text-slate-600 dark:text-slate-300">{skill.description}</p>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Progress</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{completedLessons} of {skill.lessons.length} lessons completed • {skill.totalDuration} total</p>
              </div>
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons List */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Course Content</h2>
              <div className="space-y-3">
                {skill.lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson.id)}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-center space-x-4 ${
                      activeLesson === lesson.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      lesson.completed
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {lesson.completed ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        lesson.completed 
                          ? 'text-slate-500 dark:text-slate-400 line-through' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {lesson.title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-2xl">{getLessonIcon(lesson.type)}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">{lesson.type}</span>
                        <span className="text-sm text-slate-400 dark:text-slate-500">• {lesson.duration}</span>
                      </div>
                    </div>
                    {lesson.completed && (
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Content Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Current Lesson</h3>
                {activeLesson && (
                  <div>
                    {(() => {
                      const lesson = skill.lessons.find(l => l.id === activeLesson);
                      if (!lesson) return null;
                      return (
                        <div>
                          <div className="text-4xl mb-4 text-center py-8 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            {getLessonIcon(lesson.type)}
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{lesson.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{lesson.duration} • {lesson.type}</p>
                          
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              {lesson.type === 'video' && 'Watch this video to learn the key concepts.'}
                              {lesson.type === 'article' && 'Read through this article for detailed information.'}
                              {lesson.type === 'quiz' && 'Test your knowledge with this quiz!'}
                            </p>
                          </div>

                          <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            {lesson.completed ? 'Review Lesson' : 'Start Lesson'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
