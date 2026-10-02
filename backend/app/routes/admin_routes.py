from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc
from app.models import db, User, Student, Faculty, Attendance, AttendanceSession, AuditLog
from app.utils.security import admin_required
from app.utils.audit import log_audit

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    today = date.today()
    total_students = Student.query.filter_by(is_active=True).count()
    total_faculty = Faculty.query.count()

    # Today's attendance
    today_attendances = Attendance.query.filter(Attendance.date == today).all()
    today_count = len(today_attendances)
    present_count = sum(1 for a in today_attendances if a.status == 'present')
    absent_count = max(0, total_students - present_count) if total_students > 0 else 0
    attendance_rate = round((present_count / total_students * 100), 1) if total_students > 0 else 0.0

    # Active sessions
    active_sessions_count = AttendanceSession.query.filter_by(session_status='active').count()

    # Weekly attendance trends (Last 7 days)
    weekly_trends = []
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_str = day_date.strftime('%a') # Mon, Tue, etc.
        day_present = Attendance.query.filter(Attendance.date == day_date, Attendance.status == 'present').count()
        total_active = total_students or 1
        rate = round((day_present / total_active) * 100, 1)
        weekly_trends.append({
            'day': day_str,
            'date': day_date.strftime('%Y-%m-%d'),
            'present': day_present,
            'rate': min(100.0, rate)
        })

    # Department-wise distribution
    dept_stats = []
    departments = db.session.query(Student.department).distinct().all()
    for (dept,) in departments:
        dept_total = Student.query.filter_by(department=dept, is_active=True).count()
        # Today present in this department
        dept_present = db.session.query(Attendance).join(Student).filter(
            Attendance.date == today,
            Attendance.status == 'present',
            Student.department == dept
        ).count()
        dept_rate = round((dept_present / dept_total * 100), 1) if dept_total > 0 else 0.0
        dept_stats.append({
            'department': dept,
            'total_students': dept_total,
            'present': dept_present,
            'rate': dept_rate
        })

    # Recent attendance records
    recent_records = Attendance.query.order_by(Attendance.created_at.desc()).limit(8).all()
    recent_list = [r.to_dict() for r in recent_records]

    # Recent audit logs
    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(6).all()
    logs_list = [l.to_dict() for l in recent_logs]

    return jsonify({
        'success': True,
        'stats': {
            'total_students': total_students,
            'total_faculty': total_faculty,
            'today_attendance_count': today_count,
            'today_present': present_count,
            'today_absent': absent_count,
            'attendance_percentage': attendance_rate,
            'active_sessions': active_sessions_count
        },
        'weekly_trends': weekly_trends,
        'department_stats': dept_stats,
        'recent_records': recent_list,
        'recent_logs': logs_list
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    role_filter = request.args.get('role')
    search = request.args.get('search', '').strip()

    query = User.query
    if role_filter:
        query = query.filter(User.role == role_filter)
    if search:
        query = query.filter((User.username.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%')))

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users]
    })

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'student')

    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'success': False, 'message': 'Username or Email already exists'}), 400

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    log_audit('USER_CREATE', f"Created user {username} with role {role}")
    return jsonify({'success': True, 'message': 'User created successfully', 'user': user.to_dict()}), 201

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_status = data.get('is_active', not user.is_active)
    user.is_active = new_status
    db.session.commit()
    log_audit('USER_STATUS_CHANGE', f"Changed status of user {user.username} to active={new_status}")
    return jsonify({'success': True, 'message': f"User status updated to {'Active' if new_status else 'Inactive'}"})

@admin_bp.route('/faculty', methods=['GET', 'POST'])
@admin_required
def manage_faculty():
    if request.method == 'GET':
        faculty_list = Faculty.query.all()
        return jsonify({'success': True, 'faculty': [f.to_dict() for f in faculty_list]})

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    employee_id = data.get('employee_id', '').strip()
    department = data.get('department', '').strip()
    designation = data.get('designation', 'Assistant Professor')
    contact_number = data.get('contact_number', '')
    password = data.get('password', 'faculty123')

    if not all([name, email, employee_id, department]):
        return jsonify({'success': False, 'message': 'All faculty fields are required'}), 400

    if Faculty.query.filter((Faculty.employee_id == employee_id) | (Faculty.email == email)).first():
        return jsonify({'success': False, 'message': 'Employee ID or email already registered'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=employee_id, email=email, role='faculty')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

    fac = Faculty(
        user_id=user.user_id,
        employee_id=employee_id,
        name=name,
        email=email,
        department=department,
        designation=designation,
        contact_number=contact_number
    )
    db.session.add(fac)
    db.session.commit()
    log_audit('FACULTY_CREATE', f"Added faculty {name} ({employee_id})")

    return jsonify({'success': True, 'message': 'Faculty member added', 'faculty': fac.to_dict()}), 201

@admin_bp.route('/faculty/<int:faculty_id>', methods=['DELETE'])
@admin_required
def delete_faculty(faculty_id):
    fac = Faculty.query.get_or_404(faculty_id)
    name = fac.name
    if fac.user:
        db.session.delete(fac.user)
    db.session.delete(fac)
    db.session.commit()
    log_audit('FACULTY_DELETE', f"Deleted faculty {name}")
    return jsonify({'success': True, 'message': f'Faculty {name} deleted successfully'})

@admin_bp.route('/audit-logs', methods=['GET'])
@admin_required
def get_audit_logs():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'success': True,
        'logs': [l.to_dict() for l in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': logs.page
    })
