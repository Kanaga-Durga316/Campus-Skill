import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      style={{
        backgroundColor: theme === 'dark' ? '#4f46e5' : '#e5e7eb',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span
        className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300"
        style={{
          transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(4px)',
        }}
      >
        {theme === 'dark' ? (
          <span className="text-xs">🌙</span>
        ) : (
          <span className="text-xs">☀️</span>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
