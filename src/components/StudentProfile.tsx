import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

/**
 * StudentProfile Component
 * Displays a student's profile with their skills, rating, and details
 */

interface Student {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  skills: string[];
  rating: number;
  available: boolean;
  bio: string;
  email: string;
}

// Sample students database
const studentsDatabase: Record<string, Student> = {
  '1': {
    id: '1',
    name: 'Sarah Williams',
    avatar: 'S',
    department: 'Business Administration',
    year: 'Senior',
    skills: ['Public Speaking', 'Presentation Skills', 'Leadership'],
    rating: 4.9,
    available: true,
    bio: 'Passionate about helping others communicate effectively. I believe public speaking is a skill that can transform lives.',
    email: 'sarah.williams@campus.edu'
  },
  '2': {
    id: '2',
    name: 'Mike Chen',
    avatar: 'M',
    department: 'Electrical Engineering',
    year: 'Junior',
    skills: ['Guitar', 'Music Theory', 'Piano'],
    rating: 4.7,
    available: true,
    bio: 'Professional musician with 5 years of teaching experience. Love sharing music with others.',
    email: 'mike.chen@campus.edu'
  },
  '3': {
    id: '3',
    name: 'Emily Davis',
    avatar: 'E',
    department: 'Visual Arts',
    year: 'Sophomore',
    skills: ['Photography', 'Photo Editing', 'Visual Design'],
    rating: 4.6,
    available: true,
    bio: 'Love capturing moments and teaching others to see the world through a lens.',
    email: 'emily.davis@campus.edu'
  },
  '4': {
    id: '4',
    name: 'David Kim',
    avatar: 'D',
    department: 'Computer Science',
    year: 'Senior',
    skills: ['Machine Learning', 'AI', 'Python'],
    rating: 5.0,
    available: false,
    bio: 'AI researcher passionate about teaching programming fundamentals.',
    email: 'david.kim@campus.edu'
  }
};

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!studentId) {
      // try to load first user from API
      fetchJSON('/users').then((users: any[]) => {
        if (!mounted) return;
        if (users && users.length > 0) {
          const u = users[0];
          setStudent({
            id: u._id,
            name: u.name,
            avatar: u.name ? u.name.charAt(0) : 'U',
            department: u.department || '',
            year: u.year || '',
            skills: u.skills?.map((s: any) => s.title || s) || [],
            rating: u.rating || 4.5,
            available: true,
            bio: u.bio || '',
            email: u.email || ''
          });
        } else {
          navigate('/dashboard');
        }
      }).catch(() => navigate('/dashboard'));
    } else if (studentId && studentsDatabase[studentId]) {
      setStudent(studentsDatabase[studentId]);
    } else {
      // Real student id (e.g. from "Students You May Know") -> load from API
      fetchJSON(`/users/${studentId}`)
        .then((u: any) => {
          if (!mounted) return;
          setStudent({
            id: u._id,
            name: u.name,
            avatar: u.name ? u.name.charAt(0) : 'U',
            department: u.department || '',
            year: u.year || '',
            skills: u.skills?.map((s: any) => s.title || s) || [],
            rating: u.rating || 4.5,
            available: true,
            bio: u.bio || '',
            email: u.email || ''
          });
        })
        .catch(() => navigate('/dashboard'));
    }
    return () => { mounted = false; };
  }, [studentId, navigate]);

  if (!student) {
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
        <div className="max-w-4xl mx-auto">
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

          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
            <div className="px-6 pb-6 -mt-16">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex items-end space-x-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-white dark:border-slate-800">
                    {student.avatar}
                  </div>
                  <div className="pb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{student.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{student.department} • {student.year} Year</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl">
                    <span className="text-amber-500 text-xl">★</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.rating}</span>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    student.available 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {student.available ? '✓ Available' : 'Busy'}
                  </span>
                </div>
              </div>
              
              {/* Bio */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <p className="text-slate-700 dark:text-slate-300">{student.bio}</p>
              </div>

              {/* Contact */}
              <div className="mt-4 flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{student.email}</span>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🎯</span> Skills They Can Teach
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {student.skills.map((skill, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{skill}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Available for exchange</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate(`/requests`)}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>📬</span>
              <span>Send Exchange Request</span>
            </button>
            <button 
              onClick={() => navigate(`/messages`)}
              className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>💬</span>
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
