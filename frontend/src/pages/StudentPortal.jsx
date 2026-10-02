import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  BookOpen,
  Clock,
  Printer
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const StudentPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStudentAttendance();
  }, []);

  const fetchStudentAttendance = async () => {
    try {
      const res = await api.get('/students/me/attendance');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Error fetching student portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const student = data?.student || {};
  const metrics = data?.metrics || {};
  const subjects = data?.subject_breakdown || [];
  const records = data?.records || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Student Attendance Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personal biometric attendance records for {student.name || user?.name} ({student.roll_number})
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save PDF Report</span>
        </button>
      </div>

      {/* Low Attendance Warning Alert Banner */}
      {metrics.is_low_attendance && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start space-x-3 text-xs sm:text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Low Attendance Warning: {metrics.attendance_percentage}%
            </h4>
            <p className="text-amber-700 dark:text-amber-300">
              Your overall attendance is below the mandatory institutional requirement of 75.0%. Please attend upcoming scheduled lectures to prevent examination debarment.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${metrics.attendance_percentage || 0}%`}
          color={metrics.attendance_percentage >= 75 ? 'emerald' : 'rose'}
          icon={CalendarCheck}
          subtext="Institutional standard: 75%"
        />
        <StatCard
          title="Total Lectures Conducted"
          value={metrics.total_classes || 0}
          color="blue"
          icon={BookOpen}
          subtext={`${student.department} Yr ${student.year}-${student.section}`}
        />
        <StatCard
          title="Lectures Attended"
          value={metrics.classes_attended || 0}
          color="emerald"
          icon={CheckCircle2}
          subtext="Face verified check-ins"
        />
        <StatCard
          title="Lectures Missed"
          value={metrics.classes_missed || 0}
          color="amber"
          icon={AlertTriangle}
          subtext="Absences recorded"
        />
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-500" /> Subject-Wise Attendance Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 col-span-2 text-center">
              No course subject breakdown available yet.
            </p>
          ) : (
            subjects.map((sub, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{sub.subject}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${
                      sub.percentage >= 75
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {sub.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, sub.percentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Attended: {sub.attended} / {sub.total} Classes</span>
                  <span>{sub.percentage >= 75 ? 'Satisfactory' : 'Action Required'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historical Chronological Records */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Personal Attendance Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every lecture verified and recorded via AI Face Biometrics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Match Confidence</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No attendance records logged yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.date}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{r.time}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{r.subject}</td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                      {r.recognition_method.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand-600 dark:text-brand-400">
                      {r.confidence_score > 0 ? `${r.confidence_score}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={r.status} />
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
