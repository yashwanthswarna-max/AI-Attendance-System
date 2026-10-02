import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'attendance-secret-system-key-xyz-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-attendance-secret-key-xyz-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    
    # Database
    DATA_DIR = os.path.join(BASE_DIR, 'app', 'data')
    os.makedirs(DATA_DIR, exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', f"sqlite:///{os.path.join(DATA_DIR, 'attendance.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload paths
    UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
    STUDENT_PHOTOS_DIR = os.path.join(UPLOAD_FOLDER, 'students')
    TEMP_DIR = os.path.join(UPLOAD_FOLDER, 'temp')
    os.makedirs(STUDENT_PHOTOS_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Face Recognition & Anti-Spoofing settings
    FACE_MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', '0.55'))
    LIVENESS_DETECTION_ENABLED = os.getenv('LIVENESS_DETECTION_ENABLED', 'True').lower() in ('true', '1', 't')
    ANTI_SPOOF_TEXTURE_THRESHOLD = float(os.getenv('ANTI_SPOOF_TEXTURE_THRESHOLD', '35.0'))
    
    # Attendance policy
    ALLOW_DUPLICATE_PER_DAY = os.getenv('ALLOW_DUPLICATE_PER_DAY', 'False').lower() in ('true', '1', 't')
    MINIMUM_ATTENDANCE_PERCENT = 75.0
