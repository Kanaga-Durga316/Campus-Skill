import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo/skillx-logo.png';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar Component - Modern & Responsive
 * 
 * Design Improvements:
 * - Glassmorphism effect with backdrop blur
 * - Smooth hover animations
 * - Clear active state indicators
 * - Mobile-friendly hamburger menu
 * - Student-friendly branding
 * - Dark/Light mode toggle
 */
const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })() as { role?: string } | null;

  const isAdmin = storedUser?.role === 'admin';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname === '/admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3" aria-label="Campus Skill Exchange Platform - Home">
            <img
              src={logo}
              alt="Campus Skill Exchange Platform"
              className="h-9 w-9 md:h-[42px] md:w-[42px] lg:h-12 lg:w-12 rounded-full object-contain transition-transform duration-300 hover:scale-105 cursor-pointer"
              decoding="async"
            />
            <span className="min-w-0 truncate whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              Campus Skill Exchange Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Home Link */}
            <NavLink to="/" active={location.pathname === '/'}>
              Home
            </NavLink>

            {/* Conditional rendering based on current page */}
            {!isAuthPage && !isDashboardPage && (
              <>
                <NavLink to="/login" active={false}>
                  Sign In
                </NavLink>
                <Link
                  to="/register"
                  className="ml-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95"
                >
                  Join Free
                </Link>
              </>
            )}

            {isDashboardPage && (
              <>
                <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" active={location.pathname === '/admin'}>
                    Admin Panel
                  </NavLink>
                )}
                <button 
                  onClick={() => navigate('/')}
                  className="ml-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
            <div className="flex flex-col space-y-2">
              <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname === '/'}>
                🏠 Home
              </MobileNavLink>
              <div className="mx-4 py-2">
                <ThemeToggle />
              </div>
              
              {!isAuthPage && !isDashboardPage && (
                <>
                  <MobileNavLink to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    🔐 Sign In
                  </MobileNavLink>
                  <Link
                    to="/register"
                    className="mx-4 mt-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl text-center hover:from-indigo-600 hover:to-purple-700 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🚀 Join Free
                  </Link>
                </>
              )}

              {isDashboardPage && (
                <>
                  <MobileNavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname === '/dashboard'}>
                    📊 Dashboard
                  </MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} active={location.pathname === '/admin'}>
                      🛠️ Admin Panel
                    </MobileNavLink>
                  )}
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="mx-4 mt-2 px-5 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    🚪 Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/**
 * Desktop NavLink Component
 * Features smooth underline animation on hover/active
 */
const NavLink: React.FC<{ to: string; active: boolean; children: React.ReactNode }> = ({ 
  to, 
  active, 
  children 
}) => (
  <Link
    to={to}
    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 relative ${
      active 
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' 
        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    {children}
  </Link>
);

/**
 * Mobile NavLink Component
 * Touch-friendly sizing with icons
 */
const MobileNavLink: React.FC<{ to: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({ 
  to, 
  onClick, 
  active,
  children 
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-3 rounded-xl transition-colors ${
      active 
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 font-medium' 
        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;
