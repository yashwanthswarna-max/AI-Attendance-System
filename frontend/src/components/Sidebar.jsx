import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Camera,
  CalendarCheck,
  GraduationCap,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin, isFaculty, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    ...(isAdmin ? [
      { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    ] : []),
    ...(isFaculty ? [
      { name: 'Faculty Portal', path: '/faculty', icon: School },
    ] : []),
    ...(isStudent ? [
      { name: 'Student Portal', path: '/student', icon: GraduationCap },
    ] : []),
    ...(isAdmin || isFaculty ? [
      { name: 'Live Face Attendance', path: '/attendance/camera', icon: Camera, badge: 'AI' },
      { name: 'Register Student', path: '/students/register', icon: UserPlus },
      { name: 'Attendance Records', path: '/attendance/manage', icon: CalendarCheck },
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ] : []),
    ...(isAdmin ? [
      { name: 'Faculty Portal', path: '/faculty', icon: School },
      { name: 'User Management', path: '/users', icon: Users },
      { name: 'Settings', path: '/settings', icon: Settings },
    ] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 lg:static ${
          collapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className={`flex items-center space-x-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <Camera className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  AttendAI <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-300">
                  Smart Vision System
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center' : 'justify-between'}`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-gradient-to-r from-brand-600 to-indigo-600 text-white uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          {!collapsed && (
            <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {(user?.name || user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || user?.username}
                </span>
                <span className="text-[10px] capitalize text-slate-500 dark:text-slate-400 truncate">
                  {user?.role} {user?.department ? `• ${user.department}` : ''}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center py-2 px-3 text-sm font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${
              collapsed ? 'justify-center' : 'space-x-3'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
