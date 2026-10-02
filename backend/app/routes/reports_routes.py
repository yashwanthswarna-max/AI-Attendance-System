import csv
import io
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.models import db, Student, Attendance, AttendanceSession

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    days = int(request.args.get('days', 14))
    dept_filter = request.args.get('department')
    start_date = date.today() - timedelta(days=days)

    query = Attendance.query.filter(Attendance.date >= start_date)
    if dept_filter:
        query = query.join(Student).filter(Student.department == dept_filter)

    attendances = query.all()
    total_records = len(attendances)
    present_records = sum(1 for a in attendances if a.status == 'present')
    avg_rate = round((present_records / total_records * 100), 1) if total_records > 0 else 0.0

    # Trend by date
    trend_map = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.strftime('%Y-%m-%d')
        trend_map[d_str] = {'date': d_str, 'day': d.strftime('%b %d'), 'present': 0, 'total': 0}

    for a in attendances:
        d_str = a.date.strftime('%Y-%m-%d')
        if d_str in trend_map:
            trend_map[d_str]['total'] += 1
            if a.status == 'present':
                trend_map[d_str]['present'] += 1

    timeline = list(trend_map.values())
    for item in timeline:
        item['rate'] = round((item['present'] / item['total'] * 100), 1) if item['total'] > 0 else 0

    # Department comparison
    dept_data = []
    departments = db.session.query(Student.department).distinct().all()
    for (dept,) in departments:
        dept_students = Student.query.filter_by(department=dept, is_active=True).count()
        dept_att = Attendance.query.join(Student).filter(
            Student.department == dept,
            Attendance.date >= start_date
        ).all()
        dept_present = sum(1 for a in dept_att if a.status == 'present')
        total_slots = len(dept_att)
        dept_rate = round((dept_present / total_slots * 100), 1) if total_slots > 0 else 0.0
        dept_data.append({
            'department': dept,
            'total_students': dept_students,
            'total_marked': total_slots,
            'present_count': dept_present,
            'rate': dept_rate
        })

    return jsonify({
        'success': True,
        'summary': {
            'total_records': total_records,
            'present_records': present_records,
            'overall_rate': avg_rate,
            'days_covered': days
        },
        'timeline': timeline,
        'department_breakdown': dept_data
    })

@reports_bp.route('/low-attendance-warnings', methods=['GET'])
@jwt_required()
def low_attendance_warnings():
    threshold = float(request.args.get('threshold', 75.0))
    dept_filter = request.args.get('department')

    query = Student.query.filter_by(is_active=True)
    if dept_filter:
        query = query.filter_by(department=dept_filter)

    students = query.all()
    warning_list = []

    for s in students:
        total_conducted = AttendanceSession.query.filter_by(
            department=s.department,
            year=s.year,
            section=s.section
        ).count()

        total_attended = Attendance.query.filter_by(student_id=s.student_id, status='present').count()
        effective_classes = max(total_conducted, total_attended, 1)
        percentage = round((total_attended / effective_classes) * 100, 1)

        if percentage < threshold:
            warning_list.append({
                'student_id': s.student_id,
                'roll_number': s.roll_number,
                'name': s.name,
                'email': s.email,
                'department': s.department,
                'year': s.year,
                'section': s.section,
                'contact_number': s.contact_number,
                'total_conducted': effective_classes,
                'total_attended': total_attended,
                'missed_classes': max(0, effective_classes - total_attended),
                'percentage': percentage,
                'deficit': round(threshold - percentage, 1)
            })

    warning_list.sort(key=lambda x: x['percentage'])

    return jsonify({
        'success': True,
        'threshold': threshold,
        'count': len(warning_list),
        'warnings': warning_list
    })

@reports_bp.route('/export-csv', methods=['GET'])
@jwt_required()
def export_csv():
    dept = request.args.get('department')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = Attendance.query.join(Student)
    if dept:
        query = query.filter(Student.department == dept)
    if start_date_str:
        try:
            d1 = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(Attendance.date >= d1)
        except ValueError:
            pass
    if end_date_str:
        try:
            d2 = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(Attendance.date <= d2)
        except ValueError:
            pass

    records = query.order_by(Attendance.date.desc(), Attendance.time.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Attendance ID', 'Date', 'Time', 'Roll Number', 'Student Name',
        'Department', 'Year', 'Section', 'Subject', 'Status',
        'Method', 'Confidence (%)', 'Notes'
    ])

    for r in records:
        writer.writerow([
            r.attendance_id,
            r.date.isoformat() if r.date else '',
            r.time.strftime('%H:%M:%S') if r.time else '',
            r.student.roll_number if r.student else '',
            r.student.name if r.student else '',
            r.student.department if r.student else '',
            r.student.year if r.student else '',
            r.student.section if r.student else '',
            r.session.subject if r.session else 'General',
            r.status.upper(),
            r.recognition_method,
            r.confidence_score,
            r.notes or ''
        ])

    output.seek(0)
    filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
