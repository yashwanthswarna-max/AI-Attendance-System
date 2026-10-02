import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  ShieldCheck,
  Building,
  Bell,
  Save,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../api/client';

export const Settings = () => {
  const [settings, setSettings] = useState({
    institution_name: 'Apex Institute of Technology & AI',
    face_match_threshold: '0.55',
    liveness_detection_enabled: 'true',
    anti_spoof_threshold: '35.0',
    minimum_attendance_percent: '75.0',
    auto_mark_cooldown_seconds: '10',
    camera_resolution: '720p',
    notify_low_attendance: 'true',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          System & AI Biometric Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tune facial recognition sensitivity, anti-spoofing parameters, and institutional attendance thresholds
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>System configuration updated successfully and applied to active AI vision pipeline!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Identity */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Building className="h-4 w-4 text-brand-500" /> Institutional Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Institution / University Name
              </label>
              <input
                type="text"
                value={settings.institution_name}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Mandatory Attendance (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={settings.minimum_attendance_percent}
                onChange={(e) => setSettings({ ...settings, minimum_attendance_percent: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Students falling below this score receive automated warning flags.</p>
            </div>
          </div>
        </div>

        {/* AI Face Recognition Tuning */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-500" /> Face Recognition & Distance Tuning
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Recognition Euclidean Match Threshold ({settings.face_match_threshold})
                </label>
                <span className="text-slate-400 text-[11px]">
                  Lower = Strict (0.45), Higher = Permissive (0.65)
                </span>
              </div>
              <input
                type="range"
                min="0.35"
                max="0.75"
                step="0.01"
                value={settings.face_match_threshold}
                onChange={(e) => setSettings({ ...settings, face_match_threshold: e.target.value })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.35 (Very Strict)</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">0.55 (Recommended Default)</span>
                <span>0.75 (High Tolerance)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Camera Frame Target Resolution
                </label>
              </div>
              <select
                value={settings.camera_resolution}
                onChange={(e) => setSettings({ ...settings, camera_resolution: e.target.value })}
                className="w-full sm:w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="480p">480p (Standard, Fastest Processing)</option>
                <option value="720p">720p (High Definition, Recommended)</option>
                <option value="1080p">1080p (Full HD, High Quality)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anti-Spoofing & Liveness Safeguards */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Anti-Spoofing & Liveness Safeguards
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Enforce Biometric Liveness Verification
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Rejects printed photos, tablet screens, and video replays using high-frequency Laplacian texture analysis.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.liveness_detection_enabled === 'true'}
                onChange={(e) => setSettings({ ...settings, liveness_detection_enabled: e.target.checked ? 'true' : 'false' })}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
            </div>

            {settings.liveness_detection_enabled === 'true' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Texture Variance Threshold ({settings.anti_spoof_threshold})
                  </label>
                  <span className="text-slate-400 text-[11px]">Recommended: 35.0</span>
                </div>
                <input
                  type="range"
                  min="15.0"
                  max="80.0"
                  step="1.0"
                  value={settings.anti_spoof_threshold}
                  onChange={(e) => setSettings({ ...settings, anti_spoof_threshold: e.target.value })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notifications Config */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" /> Notifications & Alerts
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Send Low Attendance Alerts
                </p>
                <p className="text-slate-400 text-[11px]">
                  Automatically push in-app warnings when student attendance drops below 75%.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notify_low_attendance === 'true'}
                onChange={(e) => setSettings({ ...settings, notify_low_attendance: e.target.checked ? 'true' : 'false' })}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Configuration...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
