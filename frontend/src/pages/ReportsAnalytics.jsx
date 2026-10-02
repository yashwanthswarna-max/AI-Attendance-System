import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  AlertTriangle,
  TrendingUp,
  Building2,
  FileSpreadsheet,
  Mail,
  Phone
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

export const ReportsAnalytics = () => {
  const [days, setDays] = useState(14);
  const [selectedDept, setSelectedDept] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [days, selectedDept]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anRes, warnRes] = await Promise.all([
        api.get('/reports/analytics', { params: { days, department: selectedDept || undefined } }),
        api.get('/reports/low-attendance-warnings', { params: { department: selectedDept || undefined, threshold: 75.0 } })
      ]);
      if (anRes.data.success) setAnalytics(anRes.data);
      if (warnRes.data.success) setWarnings(warnRes.data.warnings || []);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.append('department', selectedDept);
    window.open(`/api/reports/export-csv?${params.toString()}`, '_blank');
  };

  const summary = analytics?.summary || {};
  const timeline = analytics?.timeline || [];
  const deptBreakdown = analytics?.department_breakdown || [];

  const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Reports & Institutional Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep attendance intelligence, longitudinal trends, and early student intervention alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Time Range:</span>
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  days === d
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Academic Divisions</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={`${summary.overall_rate || 0}%`}
          color={summary.overall_rate >= 75 ? 'emerald' : 'amber'}
          icon={TrendingUp}
          subtext={`Based on ${summary.total_records || 0} logged attendances`}
        />
        <StatCard
          title="Total Student Check-Ins"
          value={summary.present_records || 0}
          color="blue"
          icon={Calendar}
          subtext={`Over past ${summary.days_covered || days} days`}
        />
        <StatCard
          title="At-Risk Students (< 75%)"
          value={warnings.length}
          color={warnings.length > 0 ? 'rose' : 'emerald'}
          icon={AlertTriangle}
          subtext="Requires academic counseling"
        />
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Daily Attendance Rate Trend (%)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Chronological institutional trajectory</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#analyticsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Comparison */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Departmental Attendance Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Aggregated percentage by division</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {deptBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              At-Risk Students List (Below 75% Requirement)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated institutional warning alerts for students subject to examination attendance shortfalls
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs">
            {warnings.length} Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Department & Class</th>
                <th className="py-3 px-4">Conducted / Attended</th>
                <th className="py-3 px-4">Missed</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Shortfall Deficit</th>
                <th className="py-3 px-4 text-right">Student Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {warnings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-emerald-600 dark:text-emerald-400">
                    ✓ Outstanding! All students currently satisfy the 75% attendance threshold.
                  </td>
                </tr>
              ) : (
                warnings.map((w) => (
                  <tr key={w.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{w.name}</div>
                      <div className="text-[10px] text-slate-400">{w.roll_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {w.department} Yr {w.year}-{w.section}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {w.total_conducted} / {w.total_attended}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      {w.missed_classes} lectures
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {w.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                      -{w.deficit}% from min
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`mailto:${w.email}`}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400"
                          title={w.email}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        {w.contact_number && (
                          <a
                            href={`tel:${w.contact_number}`}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                            title={w.contact_number}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
