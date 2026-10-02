import os
import cv2
import numpy as np
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, User, Student, Attendance, AttendanceSession
from app.recognition import face_engine
from app.utils.security import role_required, admin_required
from app.utils.audit import log_audit

student_bp = Blueprint('students', __name__, url_prefix='/api/students')

@student_bp.route('', methods=['GET'])
@jwt_required()
def list_students():
    dept = request.args.get('department')
    year = request.args.get('year', type=int)
    section = request.args.get('section')
    search = request.args.get('search', '').strip()

    query = Student.query
    if dept:
        query = query.filter_by(department=dept)
    if year:
        query = query.filter_by(year=year)
    if section:
        query = query.filter_by(section=section)
    if search:
        query = query.filter(
            (Student.name.ilike(f'%{search}%')) |
            (Student.roll_number.ilike(f'%{search}%')) |
            (Student.email.ilike(f'%{search}%'))
        )

    students = query.order_by(Student.roll_number.asc()).all()
    return jsonify({
        'success': True,
        'count': len(students),
        'students': [s.to_dict() for s in students]
    })

@student_bp.route('/register', methods=['POST'])
@role_required('admin', 'faculty')
def register_student():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    roll_number = data.get('roll_number', '').strip().upper()
    email = data.get('email', '').strip().lower()
    department = data.get('department', '').strip()
    year = data.get('year')
    section = data.get('section', '').strip().upper()
    contact_number = data.get('contact_number', '').strip()
    image_base64 = data.get('image', '')
    password = data.get('password', 'student123')

    # Basic validations
    if not all([name, roll_number, email, department, year, section]):
        return jsonify({'success': False, 'message': 'All academic fields are required.'}), 400

    if Student.query.filter_by(roll_number=roll_number).first():
        return jsonify({'success': False, 'message': f'Student with Roll Number {roll_number} already exists.'}), 400

    if Student.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': f'Student with Email {email} already registered.'}), 400

    # Face verification & encoding extraction
    face_encoding_bytes = None
    photo_filename = None

    if image_base64:
        img_bgr = face_engine.decode_image_base64(image_base64)
        if img_bgr is None:
            return jsonify({'success': False, 'message': 'Invalid face image data provided.'}), 400

        encoding, bbox, face_crop = face_engine.extract_encoding(img_bgr)
        if encoding is None:
            return jsonify({
                'success': False,
                'message': 'No clear face detected in the image. Please position your face clearly in the camera center with adequate lighting.'
            }), 400

        # Save photo to disk
        photos_dir = current_app.config['STUDENT_PHOTOS_DIR']
        photo_filename = f"{roll_number}.jpg"
        full_photo_path = os.path.join(photos_dir, photo_filename)
        cv2.imwrite(full_photo_path, img_bgr)

        # Store encoding as raw float32 binary
        face_encoding_bytes = encoding.astype(np.float32).tobytes()

    # Create associated user account
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=roll_number, email=email, role='student')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

    student = Student(
        user_id=user.user_id,
        roll_number=roll_number,
        name=name,
        email=email,
        department=department,
        year=int(year),
        section=section,
        contact_number=contact_number,
        photo_path=f"/api/students/photo/{photo_filename}" if photo_filename else None,
        face_encoding=face_encoding_bytes
    )
    db.session.add(student)
    db.session.commit()

    log_audit('STUDENT_REGISTER', f"Registered student {name} ({roll_number}), Dept: {department}")

    return jsonify({
        'success': True,
        'message': f"Student {name} registered successfully with face biometrics.",
        'student': student.to_dict()
    }), 201

@student_bp.route('/photo/<filename>', methods=['GET'])
def get_student_photo(filename):
    photos_dir = current_app.config['STUDENT_PHOTOS_DIR']
    return send_from_directory(photos_dir, filename)

@student_bp.route('/<int:student_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def manage_student(student_id):
    student = Student.query.get_or_404(student_id)

    if request.method == 'GET':
        return jsonify({'success': True, 'student': student.to_dict()})

    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin privilege required.'}), 403

    if request.method == 'DELETE':
        name = student.name
        roll = student.roll_number
        if student.user:
            db.session.delete(student.user)
        db.session.delete(student)
        db.session.commit()
        log_audit('STUDENT_DELETE', f"Deleted student {name} ({roll})")
        return jsonify({'success': True, 'message': f'Student {name} deleted successfully.'})

    # PUT: Update student
    data = request.get_json() or {}
    student.name = data.get('name', student.name).strip()
    student.department = data.get('department', student.department).strip()
    student.year = int(data.get('year', student.year))
    student.section = data.get('section', student.section).strip().upper()
    student.contact_number = data.get('contact_number', student.contact_number)
    student.is_active = data.get('is_active', student.is_active)

    # Optional new face capture
    if data.get('image'):
        img_bgr = face_engine.decode_image_base64(data['image'])
        if img_bgr is not None:
            encoding, _, _ = face_engine.extract_encoding(img_bgr)
            if encoding is not None:
                student.face_encoding = encoding.astype(np.float32).tobytes()
                photos_dir = current_app.config['STUDENT_PHOTOS_DIR']
                photo_filename = f"{student.roll_number}.jpg"
                cv2.imwrite(os.path.join(photos_dir, photo_filename), img_bgr)
                student.photo_path = f"/api/students/photo/{photo_filename}"

    db.session.commit()
    log_audit('STUDENT_UPDATE', f"Updated details for student {student.name} ({student.roll_number})")
    return jsonify({'success': True, 'message': 'Student updated', 'student': student.to_dict()})

@student_bp.route('/me/attendance', methods=['GET'])
@jwt_required()
def get_my_attendance():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        # Check if student_id was passed via query by admin/faculty
        if claims.get('role') in ('admin', 'faculty') and request.args.get('student_id'):
            student = Student.query.get(int(request.args.get('student_id')))
    
    if not student:
        return jsonify({'success': False, 'message': 'Student profile not found'}), 404

    # Total sessions conducted for student's department, year, section
    total_sessions = AttendanceSession.query.filter_by(
        department=student.department,
        year=student.year,
        section=student.section
    ).count()

    # My attendances
    attendances = Attendance.query.filter_by(student_id=student.student_id).order_by(Attendance.date.desc(), Attendance.time.desc()).all()
    present_count = sum(1 for a in attendances if a.status == 'present')
    absent_count = sum(1 for a in attendances if a.status == 'absent')
    
    # Total effective classes: max(total_sessions, len(attendances))
    effective_classes = max(total_sessions, len(attendances), 1)
    overall_percentage = round((present_count / effective_classes) * 100, 1)

    # Subject-wise breakdown
    subject_map = {}
    for att in attendances:
        subj = att.session.subject if att.session else 'General'
        if subj not in subject_map:
            subject_map[subj] = {'total': 0, 'present': 0}
        subject_map[subj]['total'] += 1
        if att.status == 'present':
            subject_map[subj]['present'] += 1

    subject_breakdown = []
    for subj, counts in subject_map.items():
        pct = round((counts['present'] / counts['total']) * 100, 1) if counts['total'] > 0 else 0
        subject_breakdown.append({
            'subject': subj,
            'attended': counts['present'],
            'total': counts['total'],
            'percentage': pct,
            'status': 'Good' if pct >= 75.0 else 'Warning'
        })

    is_low_attendance = overall_percentage < 75.0

    return jsonify({
        'success': True,
        'student': student.to_dict(),
        'metrics': {
            'total_classes': effective_classes,
            'classes_attended': present_count,
            'classes_missed': max(0, effective_classes - present_count),
            'attendance_percentage': overall_percentage,
            'is_low_attendance': is_low_attendance,
            'low_attendance_threshold': 75.0
        },
        'subject_breakdown': subject_breakdown,
        'records': [a.to_dict() for a in attendances]
    })
