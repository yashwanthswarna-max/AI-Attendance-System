import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Lock, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'faculty') navigate('/faculty');
        else navigate('/student');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    // Instant submission
    setTimeout(() => {
      login(userVal, passVal).then((res) => {
        if (res.success) {
          if (res.user.role === 'admin') navigate('/admin');
          else if (res.user.role === 'faculty') navigate('/faculty');
          else navigate('/student');
        } else {
          setError(res.message);
        }
      });
    }, 50);
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-12">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/25 mb-4">
            <Camera className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            AttendAI <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400" />
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            AI-Based Smart Student Attendance Management System
          </p>
        </div>

        {/* Login form card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or Roll No / Employee ID"
                  required
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all duration-150 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-center text-xs font-medium text-slate-400 mb-3 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" /> Quick Demo Role Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all hover:scale-[1.02] text-center"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('FAC001', 'faculty123')}
                className="px-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all hover:scale-[1.02] text-center"
              >
                👨‍🏫 Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('21CS001', 'student123')}
                className="px-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all hover:scale-[1.02] text-center"
              >
                🎓 Student
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Biometric Data Encrypted & Liveness Verified
        </p>
      </div>
    </div>
  );
};
