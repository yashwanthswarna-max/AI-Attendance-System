import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Edit2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const AttendanceManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Correction Modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('present');
  const [correctionNote, setCorrectionNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Manual Mark Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualSessionId, setManualSessionId] = useState('');
  const [manualStatus, setManualStatus] = useState('present');
  const [manualNote, setManualNote] = useState('');

  const { isAdmin, isFaculty } = useAuth();

  useEffect(() => {
    fetchRecords();
    fetchMetadata();
  }, [dateFilter, deptFilter, statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (deptFilter) params.department = deptFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/attendance/records', { params });
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (e) {
      console.error('Error fetching attendance records:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [stRes, sessRes] = await Promise.all([
        api.get('/students'),
        api.get('/faculty/sessions'),
      ]);
      if (stRes.data.success) setStudents(stRes.data.students || []);
      if (sessRes.data.success) setSessions(sessRes.data.sessions || []);
    } catch (e) {
      // ignore
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleSaveCorrection = async () => {
    if (!editingRecord) return;
    setModalLoading(true);
    try {
      const res = await api.put(`/attendance/records/${editingRecord.attendance_id}`, {
        status: newStatus,
        notes: correctionNote,
      });
      if (res.data.success) {
        setEditingRecord(null);
        fetchRecords();
      }
    } catch (e) {
      alert('Failed to update record');
    } finally {
      setModalLoading(false);
    }
  };

  const handleManualMark = async () => {
    if (!manualStudentId) {
      alert('Please select a student');
      return;
    }
    setModalLoading(true);
    try {
      const res = await api.post('/attendance/manual-mark', {
        student_id: parseInt(manualStudentId),
        session_id: manualSessionId ? parseInt(manualSessionId) : null,
        status: manualStatus,
        notes: manualNote || 'Manual instructor adjustment',
      });
      if (res.data.success) {
        setShowManualModal(false);
        fetchRecords();
      }
    } catch (e) {
      alert('Failed to mark manual attendance');
    } finally {
      setModalLoading(false);
    }
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    if (deptFilter) params.append('department', deptFilter);
    if (dateFilter) params.append('start_date', dateFilter);
    window.open(`/api/reports/export-csv?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Record Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, audit, and correct student attendance entries with full provenance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {(isAdmin || isFaculty) && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Manual Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </form>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>

          <button
            onClick={() => {
              setDateFilter('');
              setDeptFilter('');
              setStatusFilter('');
              setSearch('');
            }}
            title="Reset Filters"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Department & Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Method & Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                {(isAdmin || isFaculty) && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No attendance records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.attendance_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.time}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.student_name}</div>
                      <div className="text-[10px] text-slate-400">{r.roll_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {r.department} Yr {r.year}-{r.section}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {r.subject}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.recognition_method === 'face_recognition'
                            ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {r.recognition_method === 'face_recognition' ? 'AI Face' : 'Manual'}
                        </span>
                        {r.confidence_score > 0 && (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {r.confidence_score}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-[140px] truncate">
                      {r.notes || '—'}
                    </td>
                    {(isAdmin || isFaculty) && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setNewStatus(r.status);
                            setCorrectionNote(r.notes || '');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Correct Attendance"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Correct Attendance Record #{editingRecord.attendance_id}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{editingRecord.student_name} ({editingRecord.roll_number})</p>
                <p className="text-slate-500">{editingRecord.subject} • {editingRecord.date}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjusted Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 font-medium focus:outline-none focus:border-brand-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment / Note *
                </label>
                <textarea
                  rows={3}
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="e.g. Verified medical certificate or instructor authorized override"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                disabled={modalLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
              >
                {modalLoading ? 'Saving...' : 'Save Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Mark Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Manual Attendance Entry</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student *
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 font-medium focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((st) => (
                    <option key={st.student_id} value={st.student_id}>
                      {st.name} ({st.roll_number}) - {st.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session
                </label>
                <select
                  value={manualSessionId}
                  onChange={(e) => setManualSessionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 font-medium focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- General / Today --</option>
                  {sessions.map((s) => (
                    <option key={s.session_id} value={s.session_id}>
                      {s.subject} ({s.department} Yr {s.year}-{s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 font-medium focus:outline-none focus:border-brand-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Manual override during network issue"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleManualMark}
                disabled={modalLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
              >
                {modalLoading ? 'Submitting...' : 'Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
