from datetime import datetime
from .user import db

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'

    setting_key = db.Column(db.String(100), primary_key=True)
    setting_value = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
