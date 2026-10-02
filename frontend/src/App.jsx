import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentRegistration } from './pages/StudentRegistration';
import { FaceAttendance } from './pages/FaceAttendance';
import { AttendanceManagement } from './pages/AttendanceManagement';
import { StudentPortal } from './pages/StudentPortal';
import { FacultyPortal } from './pages/FacultyPortal';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';

// Role-based Root Redirect
const RoleRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes inside Dashboard Shell */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<RoleRedirect />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="faculty" element={<FacultyPortal />} />
            <Route path="student" element={<StudentPortal />} />
            <Route path="students/register" element={<StudentRegistration />} />
            <Route path="attendance/camera" element={<FaceAttendance />} />
            <Route path="attendance/manage" element={<AttendanceManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
