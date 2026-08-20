import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/skills', label: 'Skills', icon: '📚' },
    { to: '/admin/courses', label: 'Courses', icon: '🎓' },
    { to: '/admin/requests', label: 'Requests', icon: '📬' },
    { to: '/admin/import', label: 'CSV Import', icon: '📥' },
    { to: '/admin/import-history', label: 'Import History', icon: '📋' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-100 flex-shrink-0 hidden md:flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <p className="text-xs text-slate-400 mt-1">Campus Skill Exchange</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
