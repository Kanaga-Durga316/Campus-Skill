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
import AdminDashboardOverview from './components/AdminDashboardOverview';
import AdminLoginPage from './components/AdminLogin';
import AdminImport from './components/AdminImport';
import AdminUsers from './components/AdminUsers';
import AdminSkills from './components/AdminSkills';
import AdminCourses from './components/AdminCourses';
import AdminRequests from './components/AdminRequests';
import AdminImportHistory from './components/AdminImportHistory';
import AdminAnalytics from './components/AdminAnalytics';
import Courses from './components/Courses';
import MyLearning from './components/MyLearning';
import Profile from './components/Profile';
import Chat from './components/Chat';
import Announcements from './components/Announcements';
import Meetings from './components/Meetings';
import Polls from './components/Polls';
import Discussions from './components/Discussions';
import StudyGroups from './components/StudyGroups';
import Files from './components/Files';

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
            {/* Courses page route */}
            <Route path="/courses" element={<Courses />} />
            {/* My Learning page route */}
            <Route path="/my-learning" element={<MyLearning />} />
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
            {/* Profile page route */}
            <Route path="/profile/:userId" element={<Profile />} />
            {/* Students List page route */}
            <Route path="/students" element={<StudentsList />} />
            {/* Admin Dashboard route */}
            <Route path="/admin" element={<AdminDashboardOverview />} />
            {/* Admin Dashboard route */}
            <Route path="/admin/dashboard" element={<AdminDashboardOverview />} />
            {/* Admin Login route */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            {/* Admin Import route */}
            <Route path="/admin/import" element={<AdminImport />} />
            {/* Admin Users route */}
            <Route path="/admin/users" element={<AdminUsers />} />
            {/* Admin Skills route */}
            <Route path="/admin/skills" element={<AdminSkills />} />
            {/* Admin Courses route */}
            <Route path="/admin/courses" element={<AdminCourses />} />
            {/* Admin Requests route */}
            <Route path="/admin/requests" element={<AdminRequests />} />
            {/* Admin Import History route */}
            <Route path="/admin/import-history" element={<AdminImportHistory />} />
            {/* Admin Analytics route */}
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            {/* Chat route */}
            <Route path="/chat" element={<Chat />} />
            {/* Announcements route */}
            <Route path="/announcements" element={<Announcements />} />
            {/* Meetings route */}
            <Route path="/meetings" element={<Meetings />} />
            {/* Polls route */}
            <Route path="/polls" element={<Polls />} />
            {/* Discussions route */}
            <Route path="/discussions" element={<Discussions />} />
            {/* Study Groups route */}
            <Route path="/study-groups" element={<StudyGroups />} />
            {/* Files route */}
            <Route path="/files" element={<Files />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
