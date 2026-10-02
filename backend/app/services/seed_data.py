import os
import cv2
import numpy as np
from datetime import datetime, date, time, timedelta
from app.models import db, User, Faculty, Student, AttendanceSession, Attendance, AuditLog, Notification, SystemSetting
from app.recognition import face_engine

def generate_sample_face_embedding(seed_int):
    """
    Generates a deterministic 128D normalized vector for seeding purposes.
    """
    np.random.seed(seed_int)
    vec = np.random.randn(128).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tobytes()

def seed_database(app):
    with app.app_context():
        # Check if already seeded
        if User.query.filter_by(username='admin').first():
            print("[Database] Already seeded.")
            return

        print("[Database] Seeding initial database...")

        # 1. Admin User
        admin_user = User(
            username='admin',
            email='admin@attendance.ai',
            role='admin',
            is_active=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.flush()

        # 2. Faculty Members
        faculties_data = [
            {
                'username': 'FAC001',
                'name': 'Dr. Alan Turing',
                'email': 'alan.turing@attendance.ai',
                'department': 'Computer Science',
                'designation': 'Professor & HOD',
                'contact': '+1 555-0101'
            },
            {
                'username': 'FAC002',
                'name': 'Dr. Grace Hopper',
                'email': 'grace.hopper@attendance.ai',
                'department': 'Information Technology',
                'designation': 'Associate Professor',
                'contact': '+1 555-0102'
            }
        ]

        faculty_records = []
        for f_data in faculties_data:
            f_user = User(
                username=f_data['username'],
                email=f_data['email'],
                role='faculty',
                is_active=True
            )
            f_user.set_password('faculty123')
            db.session.add(f_user)
            db.session.flush()

            fac = Faculty(
                user_id=f_user.user_id,
                employee_id=f_data['username'],
                name=f_data['name'],
                email=f_data['email'],
                department=f_data['department'],
                designation=f_data['designation'],
                contact_number=f_data['contact']
            )
            db.session.add(fac)
            db.session.flush()
            faculty_records.append(fac)

        # 3. Students
        students_data = [
            {
                'roll': '21CS001',
                'name': 'Yashwanth Kumar',
                'email': 'yashwanth@attendance.ai',
                'dept': 'Computer Science',
                'year': 4,
                'sec': 'A',
                'contact': '+1 555-0201',
                'seed': 101
            },
            {
                'roll': '21CS002',
                'name': 'Sarah Jenkins',
                'email': 'sarah.j@attendance.ai',
                'dept': 'Computer Science',
                'year': 4,
                'sec': 'A',
                'contact': '+1 555-0202',
                'seed': 102
            },
            {
                'roll': '21CS003',
                'name': 'Alex Rivera',
                'email': 'alex.r@attendance.ai',
                'dept': 'Computer Science',
                'year': 4,
                'sec': 'A',
                'contact': '+1 555-0203',
                'seed': 103
            },
            {
                'roll': '22IT015',
                'name': 'Priya Sharma',
                'email': 'priya.s@attendance.ai',
                'dept': 'Information Technology',
                'year': 3,
                'sec': 'B',
                'contact': '+1 555-0204',
                'seed': 104
            },
            {
                'roll': '22IT016',
                'name': 'David Chen',
                'email': 'david.c@attendance.ai',
                'dept': 'Information Technology',
                'year': 3,
                'sec': 'B',
                'contact': '+1 555-0205',
                'seed': 105
            },
            {
                'roll': '23AI005',
                'name': 'Michael Scott',
                'email': 'michael.s@attendance.ai',
                'dept': 'Artificial Intelligence',
                'year': 2,
                'sec': 'A',
                'contact': '+1 555-0206',
                'seed': 106
            }
        ]

        student_records = []
        for s_data in students_data:
            s_user = User(
                username=s_data['roll'],
                email=s_data['email'],
                role='student',
                is_active=True
            )
            s_user.set_password('student123')
            db.session.add(s_user)
            db.session.flush()

            st = Student(
                user_id=s_user.user_id,
                roll_number=s_data['roll'],
                name=s_data['name'],
                email=s_data['email'],
                department=s_data['dept'],
                year=s_data['year'],
                section=s_data['sec'],
                contact_number=s_data['contact'],
                face_encoding=generate_sample_face_embedding(s_data['seed']),
                is_active=True
            )
            db.session.add(st)
            db.session.flush()
            student_records.append(st)

        # 4. Attendance Sessions
        # Active session for CS Year 4 Sec A
        session_active = AttendanceSession(
            faculty_id=faculty_records[0].faculty_id,
            subject='CS401: Deep Learning & Neural Systems',
            department='Computer Science',
            year=4,
            section='A',
            room_number='Lab 402 - AI Center',
            session_status='active',
            start_time=datetime.utcnow() - timedelta(minutes=45)
        )
        db.session.add(session_active)

        # Closed session from yesterday
        session_past = AttendanceSession(
            faculty_id=faculty_records[0].faculty_id,
            subject='CS402: Distributed Cloud Systems',
            department='Computer Science',
            year=4,
            section='A',
            room_number='Hall B',
            session_status='closed',
            start_time=datetime.utcnow() - timedelta(days=1, hours=2),
            end_time=datetime.utcnow() - timedelta(days=1, hours=1)
        )
        db.session.add(session_past)
        db.session.flush()

        # 5. Historical Attendance Records (Past 7 days)
        today = date.today()
        # Seed attendance for today in active session
        for i, st in enumerate(student_records[:2]):
            att = Attendance(
                student_id=st.student_id,
                session_id=session_active.session_id,
                date=today,
                time=time(10, 15 + i*5, 0),
                status='present',
                recognition_method='face_recognition',
                confidence_score=97.4 - (i * 1.5),
                anti_spoof_verified=True,
                notes='Live camera verified'
            )
            db.session.add(att)

        # Past days attendance records
        for day_offset in range(1, 8):
            past_date = today - timedelta(days=day_offset)
            # Skip Sundays
            if past_date.weekday() == 6:
                continue
            for st in student_records:
                # 85% attendance probability
                is_present = ((st.student_id + day_offset) % 5) != 0
                att_past = Attendance(
                    student_id=st.student_id,
                    session_id=session_past.session_id if day_offset == 1 else None,
                    date=past_date,
                    time=time(9, 30 + (st.student_id % 20), 0),
                    status='present' if is_present else 'absent',
                    recognition_method='face_recognition' if is_present else 'manual',
                    confidence_score=96.2 if is_present else 0.0,
                    anti_spoof_verified=True,
                    notes='Session check-in' if is_present else 'Unexcused Absence'
                )
                db.session.add(att_past)

        # 6. Audit Logs
        audit_entries = [
            ('SYSTEM_INIT', 'System initialized and database configured.', admin_user.user_id, admin_user.username),
            ('USER_LOGIN', 'Administrator logged into the management portal.', admin_user.user_id, admin_user.username),
            ('SESSION_START', 'Dr. Alan Turing started session for CS401 Deep Learning.', faculty_records[0].user_id, 'FAC001'),
            ('ATTENDANCE_MARKED', 'Yashwanth Kumar checked in via AI Face Recognition.', admin_user.user_id, 'SYSTEM')
        ]
        for action, details, uid, uname in audit_entries:
            db.session.add(AuditLog(
                user_id=uid,
                username=uname,
                action=action,
                details=details,
                ip_address='127.0.0.1'
            ))

        # 7. Notifications
        notifications = [
            (admin_user.user_id, 'System Online', 'AI Attendance Recognition System is running with active anti-spoofing.', 'info'),
            (student_records[0].user_id, 'Attendance Marked', 'You have been marked Present for CS401: Deep Learning.', 'success'),
            (student_records[2].user_id, 'Low Attendance Warning', 'Your attendance in Computer Science is 71.4%, which is below the mandatory 75% threshold.', 'warning')
        ]
        for uid, title, msg, n_type in notifications:
            db.session.add(Notification(
                user_id=uid,
                title=title,
                message=msg,
                type=n_type
            ))

        db.session.commit()
        print("[Database] Seeding completed successfully!")
