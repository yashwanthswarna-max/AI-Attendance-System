from datetime import datetime
from .user import db

class Faculty(db.Model):
    __tablename__ = 'faculty'

    faculty_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'), unique=True, nullable=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100), default='Assistant Professor')
    contact_number = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sessions = db.relationship('AttendanceSession', backref='faculty', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'faculty_id': self.faculty_id,
            'user_id': self.user_id,
            'employee_id': self.employee_id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'designation': self.designation,
            'contact_number': self.contact_number,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
