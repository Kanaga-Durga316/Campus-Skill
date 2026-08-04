import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import RegisterPage from './components/Register';
import LoginPage from './components/Login';
import Dashboard from './components/Dashboard';
import Messages from './components/Messages';
import Settings from './components/Settings';
import ManageSkills from './components/ManageSkills';
import SkillSearch from './components/SkillSearch';
import { ThemeProvider } from './context/ThemeContext';
import Requests from './components/Requests';
import SkillDetail from './components/SkillDetail';
import LearnSkillDetail from './components/LearnSkillDetail';
import TeachDetail from './components/TeachDetail';
import CourseManagement from './components/CourseManagement';
import StudentCourse from './components/StudentCourse';
import StudentProfile from './components/StudentProfile';
import StudentsList from './components/StudentsList';
import AdminDashboard from './components/AdminDashboard';

/**
 * HomePage Component
 * The main landing page with hero, features, and footer
 */
const HomePage: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </>
  );
};

/**
 * Main App Component
 * Uses React Router to handle navigation between pages
 */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          {/* Define routes for different pages */}
          <Routes>
            {/* Home page route */}
            <Route path="/" element={<HomePage />} />
            {/* Register page route */}
            <Route path="/register" element={<RegisterPage />} />
            {/* Login page route */}
            <Route path="/login" element={<LoginPage />} />
            {/* Dashboard page route */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Messages page route */}
            <Route path="/messages" element={<Messages />} />
            {/* Settings page route */}
            <Route path="/settings" element={<Settings />} />
            {/* Manage Skills page route */}
            <Route path="/manage-skills" element={<ManageSkills />} />
            {/* Skill Search page route */}
            <Route path="/search" element={<SkillSearch />} />
            {/* Requests page route */}
            <Route path="/requests" element={<Requests />} />
            {/* Skill Detail page route */}
            <Route path="/skill/:skillId" element={<SkillDetail />} />
            {/* Learn Skill Detail page route (skills the user wants to learn) */}
            <Route path="/learn-skill/:skillId" element={<LearnSkillDetail />} />
            {/* Teach Detail page route */}
            <Route path="/teach/:skillId" element={<TeachDetail />} />
            {/* Course Management page route (teacher, owner only) */}
            <Route path="/course/:skillId" element={<CourseManagement />} />
            {/* Student Course view route (enrolled student, read-only) */}
            <Route path="/learn/:requestId" element={<StudentCourse />} />
            {/* Student Profile page route */}
            <Route path="/student/:studentId" element={<StudentProfile />} />
            {/* Students List page route */}
            <Route path="/students" element={<StudentsList />} />
            {/* Admin Dashboard route */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
