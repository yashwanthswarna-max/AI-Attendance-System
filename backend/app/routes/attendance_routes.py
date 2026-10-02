from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import desc
from app.models import db, User, Student, Attendance, AttendanceSession
from app.recognition import face_engine
from app.utils.security import role_required, faculty_or_admin_required
from app.utils.audit import log_audit

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

@attendance_bp.route('/recognize-frame', methods=['POST'])
@jwt_required()
def recognize_frame():
    data = request.get_json() or {}
    image_bgr_data = data.get('image', '')
    session_id = data.get('session_id')
    enforce_liveness = data.get('enforce_liveness', current_app.config['LIVENESS_DETECTION_ENABLED'])

    if not image_bgr_data:
        return jsonify({'success': False, 'message': 'Image frame data is required'}), 400

    img = face_engine.decode_image_base64(image_bgr_data)
    if img is None:
        return jsonify({'success': False, 'message': 'Failed to decode image frame'}), 400

    # Retrieve candidate students
    if session_id:
        active_session = AttendanceSession.query.get(int(session_id))
        if not active_session:
            return jsonify({'success': False, 'message': 'Specified session not found'}), 404
        if active_session.session_status != 'active':
            return jsonify({'success': False, 'message': 'Attendance session is already closed'}), 400

        # Students belonging to the session's department, year, and section
        candidate_students = Student.query.filter_by(
            department=active_session.department,
            year=active_session.year,
            section=active_session.section,
            is_active=True
        ).all()
        # If class has no enrolled students or for broader testing, include all students with encodings
        if not candidate_students:
            candidate_students = Student.query.filter_by(is_active=True).all()
    else:
        candidate_students = Student.query.filter_by(is_active=True).all()
        active_session = None

    # Prepare known encodings dictionary
    known_encodings = {s.student_id: s.face_encoding for s in candidate_students if s.face_encoding}

    # Run AI Recognition & Liveness Pipeline
    result = face_engine.process_frame(img, known_encodings, enforce_liveness=enforce_liveness)

    if not result.get('face_detected'):
        return jsonify({
            'success': True,
            'face_detected': False,
            'message': 'No face detected in frame. Please look directly at the camera.'
        })

    if enforce_liveness and not result.get('is_live', True):
        return jsonify({
            'success': True,
            'face_detected': True,
            'status': 'spoof_detected',
            'bbox': result.get('bbox'),
            'liveness_score': result.get('liveness_score', 0),
            'message': 'Anti-spoofing alert: Non-live face or screen reflection detected.'
        })

    if not result.get('matched') or not result.get('student_id'):
        return jsonify({
            'success': True,
            'face_detected': True,
            'status': 'unknown_face',
            'bbox': result.get('bbox'),
            'distance': result.get('distance'),
            'confidence': result.get('confidence', 0),
            'message': 'Unknown face. Student not recognized or unregistered.'
        })

    # Student recognized!
    matched_student_id = result['student_id']
    student = Student.query.get(matched_student_id)
    if not student:
        return jsonify({'success': False, 'message': 'Matched student not found in records'}), 404

    today_date = date.today()
    now_time = datetime.now().time()

    # Check for duplicate attendance in this session
    existing_record = None
    if session_id:
        existing_record = Attendance.query.filter_by(
            student_id=student.student_id,
            session_id=int(session_id)
        ).first()
    else:
        existing_record = Attendance.query.filter_by(
            student_id=student.student_id,
            date=today_date
        ).first()

    if existing_record:
        return jsonify({
            'success': True,
            'face_detected': True,
            'status': 'already_marked',
            'bbox': result.get('bbox'),
            'confidence': result.get('confidence'),
            'student': student.to_dict(),
            'attendance_time': existing_record.time.strftime('%H:%M:%S'),
            'message': f"{student.name} ({student.roll_number}) is already marked Present."
        })

    # Mark new attendance record
    new_attendance = Attendance(
        student_id=student.student_id,
        session_id=int(session_id) if session_id else None,
        date=today_date,
        time=now_time,
        status='present',
        recognition_method='face_recognition',
        confidence_score=float(result.get('confidence', 95.0)),
        anti_spoof_verified=True,
        notes=f"Recognized via AI Camera with confidence {result.get('confidence')}%"
    )
    db.session.add(new_attendance)
    db.session.commit()

    log_audit('ATTENDANCE_MARKED', f"Auto-marked attendance for {student.name} ({student.roll_number}) in session #{session_id}")

    return jsonify({
        'success': True,
        'face_detected': True,
        'status': 'marked_success',
        'bbox': result.get('bbox'),
        'confidence': result.get('confidence'),
        'student': student.to_dict(),
        'attendance_time': now_time.strftime('%H:%M:%S'),
        'message': f"Success: Marked attendance for {student.name} ({student.roll_number})!"
    })

@attendance_bp.route('/records', methods=['GET'])
@jwt_required()
def get_attendance_records():
    date_str = request.args.get('date')
    student_id = request.args.get('student_id', type=int)
    session_id = request.args.get('session_id', type=int)
    dept = request.args.get('department')
    year = request.args.get('year', type=int)
    section = request.args.get('section')
    status = request.args.get('status')
    search = request.args.get('search', '').strip()

    query = Attendance.query.join(Student)

    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(Attendance.date == target_date)
        except ValueError:
            pass

    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if session_id:
        query = query.filter(Attendance.session_id == session_id)
    if dept:
        query = query.filter(Student.department == dept)
    if year:
        query = query.filter(Student.year == year)
    if section:
        query = query.filter(Student.section == section)
    if status:
        query = query.filter(Attendance.status == status)
    if search:
        query = query.filter(
            (Student.name.ilike(f'%{search}%')) |
            (Student.roll_number.ilike(f'%{search}%'))
        )

    records = query.order_by(Attendance.date.desc(), Attendance.time.desc()).limit(200).all()
    return jsonify({
        'success': True,
        'total': len(records),
        'records': [r.to_dict() for r in records]
    })

@attendance_bp.route('/records/<int:attendance_id>', methods=['PUT'])
@faculty_or_admin_required
def update_attendance(attendance_id):
    att = Attendance.query.get_or_404(attendance_id)
    data = request.get_json() or {}
    new_status = data.get('status', att.status)
    notes = data.get('notes', att.notes)

    old_status = att.status
    att.status = new_status
    att.notes = f"{notes} (Updated from {old_status} to {new_status})"
    att.recognition_method = 'manual'
    db.session.commit()

    log_audit('ATTENDANCE_CORRECTION', f"Corrected record #{attendance_id} for student #{att.student_id} from {old_status} to {new_status}")
    return jsonify({'success': True, 'message': 'Attendance updated successfully', 'record': att.to_dict()})

@attendance_bp.route('/manual-mark', methods=['POST'])
@faculty_or_admin_required
def manual_mark():
    data = request.get_json() or {}
    student_id = data.get('student_id')
    session_id = data.get('session_id')
    status = data.get('status', 'present')
    notes = data.get('notes', 'Marked manually by instructor')

    if not student_id:
        return jsonify({'success': False, 'message': 'student_id is required'}), 400

    student = Student.query.get_or_404(student_id)
    today_date = date.today()
    now_time = datetime.now().time()

    # Check if duplicate
    existing = Attendance.query.filter_by(student_id=student_id, session_id=session_id).first()
    if existing:
        existing.status = status
        existing.notes = notes
        db.session.commit()
        return jsonify({'success': True, 'message': 'Attendance status updated', 'record': existing.to_dict()})

    att = Attendance(
        student_id=student_id,
        session_id=session_id,
        date=today_date,
        time=now_time,
        status=status,
        recognition_method='manual',
        confidence_score=100.0,
        anti_spoof_verified=True,
        notes=notes
    )
    db.session.add(att)
    db.session.commit()

    log_audit('MANUAL_ATTENDANCE', f"Manually marked {student.name} as {status}")
    return jsonify({'success': True, 'message': f'Attendance marked as {status}', 'record': att.to_dict()}), 201

@attendance_bp.route('/live-session-feed/<int:session_id>', methods=['GET'])
@jwt_required()
def live_session_feed(session_id):
    records = Attendance.query.filter_by(session_id=session_id).order_by(Attendance.time.desc()).limit(15).all()
    return jsonify({
        'success': True,
        'records': [r.to_dict() for r in records],
        'total_marked': Attendance.query.filter_by(session_id=session_id).count()
    })
