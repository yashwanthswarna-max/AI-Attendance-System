from datetime import datetime
from .user import db

class AttendanceSession(db.Model):
    __tablename__ = 'attendance_sessions'

    session_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id', ondelete='CASCADE'), nullable=False)
    subject = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    room_number = db.Column(db.String(50), nullable=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    session_status = db.Column(db.String(20), default='active') # 'active', 'closed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    attendances = db.relationship('Attendance', backref='session', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.name if self.faculty else 'Unknown',
            'subject': self.subject,
            'department': self.department,
            'year': self.year,
            'section': self.section,
            'room_number': self.room_number,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'session_status': self.session_status,
            'total_marked': self.attendances.count() if hasattr(self, 'attendances') else 0
        }
