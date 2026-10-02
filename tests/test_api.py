import sys
import os
import unittest
import json
import numpy as np

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import create_app
from app.models import db, User, Student, AttendanceSession, Attendance
from app.recognition import face_engine

class TestAttendanceSystem(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_health(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')

    def test_admin_login(self):
        response = self.client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['role'], 'admin')
        self.assertIn('token', data)

    def test_admin_dashboard(self):
        # Login
        login_res = self.client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        token = json.loads(login_res.data)['token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/admin/dashboard', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertGreater(data['stats']['total_students'], 0)
        self.assertGreater(data['stats']['total_faculty'], 0)

    def test_student_attendance_summary(self):
        # Login as student
        login_res = self.client.post('/api/auth/login', json={
            'username': '21CS001',
            'password': 'student123'
        })
        token = json.loads(login_res.data)['token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/students/me/attendance', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['student']['roll_number'], '21CS001')
        self.assertIn('attendance_percentage', data['metrics'])

    def test_face_engine_embedding(self):
        # Test synthetic image encoding extraction
        fake_bgr = np.zeros((200, 200, 3), dtype=np.uint8)
        # Draw a synthetic face circle
        import cv2
        cv2.circle(fake_bgr, (100, 100), 50, (200, 200, 200), -1)
        b64 = face_engine.encode_image_base64(fake_bgr)
        decoded = face_engine.decode_image_base64(b64)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.shape, fake_bgr.shape)

if __name__ == '__main__':
    unittest.main()
