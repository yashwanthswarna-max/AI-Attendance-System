# 🤖 NeuralAttend — AI Student Attendance System

A modern, full-stack Academic Attendance Management System featuring **Teacher Authentication**, an interactive **Weekly Attendance Timetable (Mon–Fri)**, **AI Facial Biometrics Scanner Simulation**, **Predictive Risk & Absenteeism Analytics**, and a dedicated **Student Weekly Portal**.

---

## 🌟 Key Features

1. **Teacher Access & Authentication**:
   - Institutional Teacher Login portal with role verification.
   - Built-in **1-Click Demo Login** (`teacher@school.edu` / `password123`).
   - Teacher profile status and secure logout.

2. **Weekly Attendance System for Students**:
   - Interactive **Monday through Friday** daily attendance matrix.
   - Week-by-week navigation (Previous, Current, Next Week) with date indicators.
   - 1-click status cycling:
     - 🟢 **Present (P)** — Full attendance (100%)
     - 🔴 **Absent (A)** — Unexcused absence (0%)
     - 🟡 **Late (L)** — Tardy check-in (50% credit)
     - 🔵 **Excused (E)** — Authorized medical leave
   - Real-time weekly percentage calculation per student.
   - Semester overall attendance meter with **&lt; 75% attendance shortage warning alerts**.

3. **Student Face Biometric Registration (Self-Service)**:
   - Students can register and calibrate their facial biometrics directly from the Student Portal.
   - Dual enrollment methods:
     - **Live Webcam Capture**: Oval face guide, real-time lighting/alignment checks, and snapshot preview.
     - **Photo Upload**: Supports uploading portrait photos from the student's device.
   - AI calibration sequence: 68 contour landmarks, 128-D biometric vector extraction, anti-spoofing verification, and database sync.
   - Live enrollment badges: `Face Enrolled (99.8%)` vs `Biometric Face Pending Enrollment`.

4. **AI Biometric Face Recognition Check-In**:
   - Live camera scanner using browser `getUserMedia`.
   - Visual AI face detection bounding box, 68-point facial landmark telemetry, and anti-spoofing verification.
   - Fallback simulation mode for devices without physical webcam hardware.
   - Automated check-in logging with timestamp and confidence score.

5. **AI Attendance Insights & Pattern Analytics**:
   - Instant cohort analysis identifying at-risk students falling below the mandatory 75% threshold.
   - Day-of-the-week absenteeism trend detector (e.g. identifying Friday or Monday dips).
   - Pedagogical suggestions and one-click warning notices.

6. **Student Portal (Self-Service View)**:
   - Dedicated portal for students to inspect their weekly attendance calendar.
   - Semester exam eligibility gauge (&ge; 75% threshold).
   - Chronological check-in activity history.

7. **Quick Bulk Actions & Reports**:
   - "Mark All Present Today" in one click with celebratory feedback.
   - Export weekly attendance roster to formatted CSV.
   - Class selector (CS301 AI & ML, CS302 Web Systems, CS303 Deep Learning).


---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Run Development Server (Both Backend & Frontend)
```bash
node start-dev.js
```
or run separately:
```bash
# Terminal 1 (Backend API on http://localhost:5000)
cd server
npm start

# Terminal 2 (Vite Frontend on http://localhost:5173)
cd client
npm run dev
```

### 2. Access the Application
- Open your browser at: **[http://localhost:5173](http://localhost:5173)**
- Or the production server build at: **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Default Credentials

| Role | Email | Password | Quick Login |
|------|-------|----------|-------------|
| **Teacher** | `teacher@school.edu` | `password123` | Click **"Autofill & Sign In"** button on login screen |
| **Student** | N/A (Direct Access) | N/A | Click **"Student Weekly View"** tab in top navbar |

---

## 📁 Project Structure

```
AI Attendance System/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header & mode switcher
│   │   │   ├── LoginPage.jsx            # Teacher login with demo autofill
│   │   │   ├── WeeklyAttendanceGrid.jsx # Interactive weekly timetable (Mon-Fri)
│   │   │   ├── StudentWeeklyView.jsx    # Student personal attendance portal
│   │   │   ├── AIFaceScanner.jsx        # Webcam & simulated biometric scanner
│   │   │   ├── AIInsightsModal.jsx      # Predictive at-risk analytics
│   │   │   └── StudentDetailModal.jsx   # Student cumulative history modal
│   │   ├── services/
│   │   │   └── api.js                   # API client service
│   │   ├── App.jsx                      # Main application shell
│   │   └── index.css                    # Tailwind CSS v4 styling
│   └── package.json
├── server/                     # Node.js Express Backend
│   ├── data/
│   │   ├── store.js                     # In-memory & JSON file persistent store
│   │   └── attendance_db.json           # Seeded student & attendance database
│   ├── server.js                        # Express REST API routes
│   └── package.json
├── package.json                # Root package configuration
├── start-dev.js                # Concurrent launcher script
└── README.md
```
