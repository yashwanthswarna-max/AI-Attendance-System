from datetime import datetime
from .user import db

class Student(db.Model):
    __tablename__ = 'students'

    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'), unique=True, nullable=True)
    roll_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    contact_number = db.Column(db.String(20), nullable=True)
    photo_path = db.Column(db.String(255), nullable=True)
    face_encoding = db.Column(db.LargeBinary, nullable=True) # Pickle or bytes of numpy float32 array
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    attendances = db.relationship('Attendance', backref='student', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_encoding=False):
        data = {
            'student_id': self.student_id,
            'user_id': self.user_id,
            'roll_number': self.roll_number,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'year': self.year,
            'section': self.section,
            'contact_number': self.contact_number,
            'photo_path': self.photo_path,
            'has_face_encoding': bool(self.face_encoding is not None),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_encoding:
            data['face_encoding'] = self.face_encoding
        return data
