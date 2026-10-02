from datetime import datetime, date
from .user import db

class Attendance(db.Model):
    __tablename__ = 'attendance'

    attendance_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('attendance_sessions.session_id', ondelete='SET NULL'), nullable=True, index=True)
    date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='present') # 'present', 'absent', 'late', 'excused'
    recognition_method = db.Column(db.String(50), default='face_recognition') # 'face_recognition', 'manual'
    confidence_score = db.Column(db.Float, default=0.0)
    anti_spoof_verified = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('session_id', 'student_id', name='uq_session_student'),
    )

    def to_dict(self):
        return {
            'attendance_id': self.attendance_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else 'Unknown',
            'roll_number': self.student.roll_number if self.student else 'Unknown',
            'department': self.student.department if self.student else None,
            'year': self.student.year if self.student else None,
            'section': self.student.section if self.student else None,
            'session_id': self.session_id,
            'subject': self.session.subject if self.session else 'General',
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M:%S') if self.time else None,
            'status': self.status,
            'recognition_method': self.recognition_method,
            'confidence_score': round(self.confidence_score, 2),
            'anti_spoof_verified': self.anti_spoof_verified,
            'notes': self.notes
        }
