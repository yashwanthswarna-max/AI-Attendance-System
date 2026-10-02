from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, User, Faculty, Student, AttendanceSession, Attendance
from app.utils.security import faculty_or_admin_required
from app.utils.audit import log_audit

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')

@faculty_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    query = AttendanceSession.query
    if claims.get('role') == 'faculty':
        fac = Faculty.query.filter_by(user_id=user_id).first()
        if fac:
            query = query.filter_by(faculty_id=fac.faculty_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(session_status=status)

    sessions = query.order_by(AttendanceSession.start_time.desc()).all()
    return jsonify({
        'success': True,
        'sessions': [s.to_dict() for s in sessions]
    })

@faculty_bp.route('/sessions/start', methods=['POST'])
@faculty_or_admin_required
def start_session():
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    faculty_id = data.get('faculty_id')
    if not faculty_id:
        fac = Faculty.query.filter_by(user_id=user_id).first()
        if fac:
            faculty_id = fac.faculty_id
        else:
            # First faculty fallback
            first_fac = Faculty.query.first()
            faculty_id = first_fac.faculty_id if first_fac else 1

    subject = data.get('subject', '').strip()
    department = data.get('department', '').strip()
    year = data.get('year')
    section = data.get('section', '').strip().upper()
    room_number = data.get('room_number', 'Hall A')

    if not all([subject, department, year, section]):
        return jsonify({'success': False, 'message': 'Subject, Department, Year, and Section are required.'}), 400

    new_session = AttendanceSession(
        faculty_id=faculty_id,
        subject=subject,
        department=department,
        year=int(year),
        section=section,
        room_number=room_number,
        session_status='active',
        start_time=datetime.utcnow()
    )
    db.session.add(new_session)
    db.session.commit()

    log_audit('SESSION_START', f"Started attendance session {subject} ({department} Yr {year}-{section})")
    return jsonify({
        'success': True,
        'message': f"Attendance session for {subject} is now active.",
        'session': new_session.to_dict()
    }), 201

@faculty_bp.route('/sessions/<int:session_id>/stop', methods=['POST'])
@faculty_or_admin_required
def stop_session(session_id):
    session_obj = AttendanceSession.query.get_or_404(session_id)
    session_obj.session_status = 'closed'
    session_obj.end_time = datetime.utcnow()
    db.session.commit()

    log_audit('SESSION_STOP', f"Closed attendance session #{session_id} ({session_obj.subject})")
    return jsonify({
        'success': True,
        'message': f"Session for {session_obj.subject} has been closed.",
        'session': session_obj.to_dict()
    })

@faculty_bp.route('/sessions/<int:session_id>/summary', methods=['GET'])
@jwt_required()
def session_summary(session_id):
    session_obj = AttendanceSession.query.get_or_404(session_id)

    # Class roster
    enrolled_students = Student.query.filter_by(
        department=session_obj.department,
        year=session_obj.year,
        section=session_obj.section,
        is_active=True
    ).order_by(Student.roll_number.asc()).all()

    # Marked attendance records for this session
    marked_records = Attendance.query.filter_by(session_id=session_id).all()
    marked_student_ids = {a.student_id: a for a in marked_records}

    present_list = []
    absent_list = []

    for s in enrolled_students:
        s_dict = s.to_dict()
        if s.student_id in marked_student_ids:
            att = marked_student_ids[s.student_id]
            s_dict['attendance_status'] = att.status
            s_dict['time_marked'] = att.time.strftime('%H:%M:%S') if att.time else None
            s_dict['confidence_score'] = att.confidence_score
            present_list.append(s_dict)
        else:
            s_dict['attendance_status'] = 'absent'
            absent_list.append(s_dict)

    total_enrolled = len(enrolled_students)
    total_present = len(present_list)
    percentage = round((total_present / total_enrolled * 100), 1) if total_enrolled > 0 else 0

    return jsonify({
        'success': True,
        'session': session_obj.to_dict(),
        'metrics': {
            'total_enrolled': total_enrolled,
            'present_count': total_present,
            'absent_count': len(absent_list),
            'attendance_percentage': percentage
        },
        'present_students': present_list,
        'absent_students': absent_list
    })
