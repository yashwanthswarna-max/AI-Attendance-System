from .auth_routes import auth_bp
from .admin_routes import admin_bp
from .student_routes import student_bp
from .faculty_routes import faculty_bp
from .attendance_routes import attendance_bp
from .reports_routes import reports_bp
from .settings_routes import settings_bp

__all__ = [
    'auth_bp',
    'admin_bp',
    'student_bp',
    'faculty_bp',
    'attendance_bp',
    'reports_bp',
    'settings_bp'
]
