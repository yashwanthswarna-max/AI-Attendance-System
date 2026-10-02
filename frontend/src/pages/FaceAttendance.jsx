import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const FaceAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [enforceLiveness, setEnforceLiveness] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [detectionResult, setDetectionResult] = useState(null);
  const [recentAttendees, setRecentAttendees] = useState([]);
  const [fps, setFps] = useState(0);
  const [processing, setProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play pleasant check-in chime using Web Audio API
  const playChime = useCallback((success = true) => {
    if (!audioFeedback) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        // High pleasant ding
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Low double buzz
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio autoplay restriction fallback
    }
  }, [audioFeedback]);

  // Load active sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/faculty/sessions');
      if (res.data.success && res.data.sessions.length > 0) {
        setSessions(res.data.sessions);
        const active = res.data.sessions.find((s) => s.session_status === 'active');
        if (active) {
          setSelectedSessionId(active.session_id.toString());
          loadRecentAttendees(active.session_id);
        } else {
          setSelectedSessionId(res.data.sessions[0].session_id.toString());
          loadRecentAttendees(res.data.sessions[0].session_id);
        }
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  const loadRecentAttendees = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/attendance/live-session-feed/${sessionId}`);
      if (res.data.success) {
        setRecentAttendees(res.data.records);
      }
    } catch (e) {
      // ignore
    }
  };

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      alert('Camera access denied. Please grant camera permission.');
      console.error(err);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (loopRef.current) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    clearOverlay();
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const clearOverlay = () => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  };

  // Draw face bounding box on overlay canvas
  const drawOverlay = (bbox, name, status, confidence) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!bbox) return;

    // Scale coordinates between native video frame and displayed canvas
    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);

    const x = bbox.x * scaleX;
    const y = bbox.y * scaleY;
    const w = bbox.width * scaleX;
    const h = bbox.height * scaleY;

    let strokeColor = '#3b82f6'; // blue default
    let label = name || 'Face Detected';

    if (status === 'marked_success') {
      strokeColor = '#10b981'; // green
      label = `✓ ${name} (${confidence}%)`;
    } else if (status === 'already_marked') {
      strokeColor = '#f59e0b'; // amber
      label = `Already Checked: ${name}`;
    } else if (status === 'spoof_detected') {
      strokeColor = '#ef4444'; // red
      label = '⚠ Spoof Warning';
    } else if (status === 'unknown_face') {
      strokeColor = '#8b5cf6'; // purple
      label = 'Unknown Student';
    }

    // Draw box
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.stroke();

    // Draw label pill
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.roundRect(x, Math.max(0, y - 26), textWidth + 16, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 8, Math.max(15, y - 11));
  };

  // Process live frame
  const captureAndRecognize = useCallback(async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current || processing) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      loopRef.current = setTimeout(captureAndRecognize, 500);
      return;
    }

    setProcessing(true);
    const startTime = performance.now();

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await api.post('/attendance/recognize-frame', {
        image: frameBase64,
        session_id: selectedSessionId ? parseInt(selectedSessionId) : null,
        enforce_liveness: enforceLiveness,
      });

      const dur = performance.now() - startTime;
      setFps(Math.round(1000 / Math.max(dur, 100)));

      if (res.data.success) {
        setDetectionResult(res.data);
        const st = res.data.student;
        const name = st ? st.name : null;

        drawOverlay(res.data.bbox, name, res.data.status, res.data.confidence);

        if (res.data.status === 'marked_success') {
          playChime(true);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
          // Update live attendees list
          loadRecentAttendees(selectedSessionId);
        } else if (res.data.status === 'spoof_detected') {
          playChime(false);
        }
      } else {
        clearOverlay();
      }
    } catch (err) {
      console.error('Frame recognition error:', err);
    } finally {
      setProcessing(false);
      if (isScanning) {
        // Continuous scan loop every 1.1 seconds for responsive real-time recognition
        loopRef.current = setTimeout(captureAndRecognize, 1100);
      }
    }
  }, [isScanning, selectedSessionId, enforceLiveness, processing, playChime]);

  useEffect(() => {
    if (isScanning) {
      loopRef.current = setTimeout(captureAndRecognize, 800);
    } else {
      if (loopRef.current) clearTimeout(loopRef.current);
    }
    return () => {
      if (loopRef.current) clearTimeout(loopRef.current);
    };
  }, [isScanning, captureAndRecognize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            AI Facial Recognition Attendance <Sparkles className="h-5 w-5 text-brand-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated student identification, anti-spoof verification, and real-time attendance marking
          </p>
        </div>

        {/* Audio feedback & Liveness Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              audioFeedback
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
            title="Audio check-in chime"
          >
            {audioFeedback ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">Chime</span>
          </button>

          <button
            onClick={() => setEnforceLiveness(!enforceLiveness)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              enforceLiveness
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Anti-Spoof: {enforceLiveness ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Camera Viewfinder & Live Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera HUD & Controls */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          {/* Session Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Session:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  loadRecentAttendees(e.target.value);
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                {sessions.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.subject} ({s.department} Yr {s.year}-{s.section}) - {s.session_status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Switcher Button */}
            {!isScanning ? (
              <button
                onClick={startCamera}
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start AI Scanner</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-colors"
              >
                <Square className="h-4 w-4 fill-white" />
                <span>Stop Scanner</span>
              </button>
            )}
          </div>

          {/* Camera Viewfinder Box with HUD Overlay */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center border border-slate-800">
            {/* Native Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
            />

            {/* Canvas for HUD Bounding Boxes */}
            <canvas
              ref={overlayCanvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${isScanning ? 'block' : 'hidden'}`}
            />

            {/* Offline Idle State */}
            {!isScanning && (
              <div className="text-center p-8 text-slate-400">
                <Camera className="h-16 w-16 mx-auto mb-3 opacity-40 text-brand-400" />
                <h3 className="text-base font-semibold text-white mb-1">Camera Stream Standby</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click "Start AI Scanner" above to activate the camera. Look straight into the lens for automated attendance marking.
                </p>
              </div>
            )}

            {/* Real-time HUD Status Pill (Top Center) */}
            {isScanning && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-semibold text-white border border-slate-700/80 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>AI Scanning Active</span>
                  {fps > 0 && <span className="text-slate-400 font-normal">| {fps} FPS</span>}
                </div>

                {detectionResult?.is_live && (
                  <div className="px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-semibold text-white border border-emerald-400/50 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Liveness Verified</span>
                  </div>
                )}
              </div>
            )}

            {/* Radar Sweep Effect */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.9)] animate-radar"></div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Real-time Result Banner */}
          {detectionResult && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
                detectionResult.status === 'marked_success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : detectionResult.status === 'already_marked'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : detectionResult.status === 'spoof_detected'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : detectionResult.status === 'unknown_face'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {detectionResult.status === 'marked_success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                {detectionResult.status === 'already_marked' && <Clock className="h-5 w-5 shrink-0 text-amber-500" />}
                {detectionResult.status === 'spoof_detected' && <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />}
                {detectionResult.status === 'unknown_face' && <Info className="h-5 w-5 shrink-0 text-purple-500" />}
                <span>{detectionResult.message}</span>
              </div>

              {detectionResult.confidence > 0 && (
                <span className="font-bold px-2 py-0.5 rounded bg-black/30 text-xs">
                  Confidence: {detectionResult.confidence}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Session Attendance Roster */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-brand-500" /> Session Check-Ins
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Marked attendees in real time</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold text-xs border border-brand-200 dark:border-brand-800">
                {recentAttendees.length} Present
              </span>
            </div>

            {/* Scrollable Attendees List */}
            <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
              {recentAttendees.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No students recorded yet in this session. Start scanning faces to begin.
                </div>
              ) : (
                recentAttendees.map((att) => (
                  <div
                    key={att.attendance_id}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {(att.student_name || 'S')[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {att.student_name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {att.roll_number} • {att.time}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <StatusBadge status={att.status} />
                      <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">
                        {att.confidence_score}% match
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Duplicate attendance prevented automatically per session.
          </div>
        </div>
      </div>
    </div>
  );
};
