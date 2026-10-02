AI-Based Smart Student Attendance Management System Using Face Recognition
A modern, production-ready, full-stack AI attendance management solution that automates attendance logging through facial recognition, incorporates anti-spoofing liveness checks, and provides role-based portals for Administrators, Faculty, and Students.

🚀 Key Highlights & Capabilities
AI Face Biometrics: Vectorized 128-dimensional deep metric embeddings with configurable Euclidean distance matching thresholds.
Fail-Safe Dual-Engine Architecture: Operates with primary face_recognition (dlib) and an automated fallback OpenCV Vision engine with zero binary crash risk on any Windows, macOS, or Linux platform.
Anti-Spoofing & Liveness Guard: Evaluates high-frequency Laplacian texture variance, contrast gradients, and facial features to reject paper prints and digital screen replays.
Per-Session Duplicate Prevention: Guaranteed single attendance record per student within any scheduled class lecture.
Three Distinct Role-Based Portals:
👑 Admin Portal: Institutional KPIs, attendance charts, student & faculty CRUD, user statuses, and immutable security audit logs.
👨‍🏫 Faculty Portal: Schedule and launch lecture sessions, monitor live attendees, inspect absent rosters, and review failure alerts.
🎓 Student Portal: Personal attendance percentage, subject-by-subject progress bars, low attendance (< 75%) warning banner, and printable PDF reports.
Live Camera HUD: Canvas overlay with real-time bounding boxes, match confidence percentage, pleasant Web Audio API chime feedback, and confetti check-in celebration.
Interactive Analytics: Powered by Recharts with daily attendance timeline trends, department-wise breakdowns, and one-click Excel/CSV export.
Modern SaaS Theme: Dark/Light mode toggle, glassmorphism accents, and responsive layout for desktop, tablet, and mobile.
🛠️ Technology Stack
Component	Technologies
Frontend	React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas-Confetti, Axios
Backend	Python 3.11, Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-CORS, Werkzeug
AI & Vision	OpenCV (cv2), Haar Cascades, NumPy, Pillow, 128D Embedding Engine
Database	SQLite3 / SQLAlchemy (Easily switchable to MySQL/PostgreSQL via DATABASE_URI)
Security	Role-Based Access Control (RBAC), bcrypt-compatible password hashing, JWT Bearer tokens
