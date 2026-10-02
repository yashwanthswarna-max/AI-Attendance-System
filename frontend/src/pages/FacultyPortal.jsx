import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  School,
  Play,
  Square,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Camera,
  Calendar,
  Clock,
  Download,
  X,
  FileSpreadsheet
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const FacultyPortal = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New session modal
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    subject: '',
    department: 'Computer Science',
    year: '4',
    section: 'A',
    room_number: 'Hall 401',
  });
  const [creating, setCreating] = useState(false);

  // Summary Modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/faculty/sessions');
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/faculty/sessions/start', {
        ...newSessionData,
        year: parseInt(newSessionData.year),
      });
      if (res.data.success) {
        setShowNewSessionModal(false);
        setNewSessionData({
          subject: '',
          department: 'Computer Science',
          year: '4',
          section: 'A',
          room_number: 'Hall 401',
        });
        fetchSessions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start session');
    } finally {
      setCreating(false);
    }
  };

  const handleStopSession = async (sessionId) => {
    if (!confirm('Are you sure you want to stop and close this attendance session?')) return;
    try {
      const res = await api.post(`/faculty/sessions/${sessionId}/stop`);
      if (res.data.success) {
        fetchSessions();
        if (selectedSession?.session_id === sessionId) {
          fetchSessionSummary(sessionId);
        }
      }
    } catch (e) {
      alert('Failed to close session');
    }
  };

  const fetchSessionSummary = async (sessionId) => {
    setSummaryLoading(true);
    try {
      const res = await api.get(`/faculty/sessions/${sessionId}/summary`);
      if (res.data.success) {
        setSessionSummary(res.data);
      }
    } catch (e) {
      console.error('Error fetching session summary:', e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const openSummaryModal = (session) => {
    setSelectedSession(session);
    fetchSessionSummary(session.session_id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Faculty Teaching & Session Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create attendance sessions, supervise AI check-ins, and inspect class attendance rosters
          </p>
        </div>

        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>Launch New Session</span>
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Loading faculty class sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 p-12 text-center border border-slate-200 dark:border-slate-800">
            <School className="h-12 w-12 mx-auto mb-3 text-slate-400 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Sessions Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click "Launch New Session" above to begin taking attendance for your class.
            </p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.session_id}
              className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {s.department} Yr {s.year}-{s.section}
                  </span>
                  <StatusBadge status={s.session_status} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {s.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Started {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {s.room_number && <span>• {s.room_number}</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Students Checked In</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                    {s.total_marked || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openSummaryModal(s)}
                  className="w-full py-2 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center transition-colors"
                >
                  Class Roster
                </button>

                {s.session_status === 'active' ? (
                  <div className="flex gap-1.5">
                    <Link
                      to="/attendance/camera"
                      className="flex-1 py-2 px-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs"
                      title="Open Live Scanner"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Scanner</span>
                    </Link>
                    <button
                      onClick={() => handleStopSession(s.session_id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      title="End Session"
                    >
                      <Square className="h-3.5 w-3.5 fill-rose-500" />
                    </button>
                  </div>
                ) : (
                  <span className="py-2 px-2 text-center text-xs font-medium text-slate-400">
                    Session Closed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Start New Attendance Session</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS403: Artificial Intelligence"
                  value={newSessionData.subject}
                  onChange={(e) => setNewSessionData({ ...newSessionData, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newSessionData.department}
                    onChange={(e) => setNewSessionData({ ...newSessionData, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    value={newSessionData.room_number}
                    onChange={(e) => setNewSessionData({ ...newSessionData, room_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={newSessionData.year}
                    onChange={(e) => setNewSessionData({ ...newSessionData, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 focus:outline-none focus:border-brand-500"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newSessionData.section}
                    onChange={(e) => setNewSessionData({ ...newSessionData, section: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                >
                  {creating ? 'Starting...' : 'Activate Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Roster & Summary Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {selectedSession.subject} — Roster
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSession.department} Yr {selectedSession.year}-{selectedSession.section}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {summaryLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Loading class attendance roster...
                </div>
              ) : sessionSummary ? (
                <div className="mt-4 space-y-4">
                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                      <p className="text-[11px] text-slate-500">Total Enrolled</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {sessionSummary.metrics.total_enrolled}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Present</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {sessionSummary.metrics.present_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-center">
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">Absent</p>
                      <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {sessionSummary.metrics.absent_count}
                      </p>
                    </div>
                  </div>

                  {/* Student Lists Tabbed / Combined */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Present Students ({sessionSummary.present_students.length})
                    </p>
                    {sessionSummary.present_students.map((st) => (
                      <div
                        key={st.student_id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{st.name}</span>
                          <span className="text-slate-400 text-[10px] ml-2">{st.roll_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{st.time_marked}</span>
                          <StatusBadge status="present" />
                        </div>
                      </div>
                    ))}

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
                      Absent Students ({sessionSummary.absent_students.length})
                    </p>
                    {sessionSummary.absent_students.map((st) => (
                      <div
                        key={st.student_id}
                        className="p-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{st.name}</span>
                          <span className="text-slate-400 text-[10px] ml-2">{st.roll_number}</span>
                        </div>
                        <StatusBadge status="absent" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
