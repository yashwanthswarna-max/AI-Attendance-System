import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Camera,
  UserPlus,
  ArrowUpRight,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../api/client';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const weeklyTrends = data?.weekly_trends || [];
  const departmentStats = data?.department_stats || [];
  const recentRecords = data?.recent_records || [];
  const recentLogs = data?.recent_logs || [];

  const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric monitoring, attendance analytics, and institutional metrics
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/attendance/camera"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <Camera className="h-4 w-4" />
            <span>Launch Face AI</span>
          </Link>
          <Link
            to="/students/register"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Enroll Student</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={stats.total_students || 0}
          icon={GraduationCap}
          color="blue"
          subtext="Active biometric profiles"
        />
        <StatCard
          title="Today's Attendance Rate"
          value={`${stats.attendance_percentage || 0}%`}
          icon={TrendingUp}
          color="emerald"
          subtext={`${stats.today_present || 0} Present / ${stats.today_absent || 0} Absent`}
        />
        <StatCard
          title="Total Faculty Members"
          value={stats.total_faculty || 0}
          icon={Users}
          color="indigo"
          subtext="Managing class sessions"
        />
        <StatCard
          title="Active Live Sessions"
          value={stats.active_sessions || 0}
          icon={CalendarCheck}
          color="amber"
          subtext="Conducted right now"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Weekly Attendance Trend (%)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Past 7 days institutional average</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8fe9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8fe9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Attendance Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#0c8fe9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rateGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Department Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Today's present rate by academic division</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Present Rate']}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables: Recent Live Attendance & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Activity */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Recent Attendance Check-Ins
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Auto-logged by Face Recognition Engine</p>
            </div>
            <Link
              to="/attendance/manage"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Dept & Class</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No attendance marked yet today. Launch Face AI to start session.
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r) => (
                    <tr key={r.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        <div>{r.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{r.roll_number}</div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {r.department} Yr {r.year}-{r.section}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{r.subject}</td>
                      <td className="py-3">
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {r.confidence_score}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{r.time}</td>
                      <td className="py-3 text-right">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> System Audit Trail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security & admin logs</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.log_id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
