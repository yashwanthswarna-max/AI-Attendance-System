from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.models import db, User, Student, Faculty
from app.utils.audit import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username/email and password required'}), 400

    # Allow login by username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Account is deactivated. Contact admin.'}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    # Determine profile details
    display_name = user.username
    profile_id = None
    department = None

    if user.role == 'student' and user.student_profile:
        display_name = user.student_profile.name
        profile_id = user.student_profile.student_id
        department = user.student_profile.department
    elif user.role == 'faculty' and user.faculty_profile:
        display_name = user.faculty_profile.name
        profile_id = user.faculty_profile.faculty_id
        department = user.faculty_profile.department

    additional_claims = {
        'role': user.role,
        'email': user.email,
        'name': display_name,
        'profile_id': profile_id,
        'department': department
    }

    access_token = create_access_token(identity=str(user.user_id), additional_claims=additional_claims)
    log_audit('USER_LOGIN', f"User {user.username} ({user.role}) logged in", user_id=user.user_id, username=user.username)

    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': access_token,
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'name': display_name,
            'profile_id': profile_id,
            'department': department
        }
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    profile_data = user.to_dict()
    if user.role == 'student' and user.student_profile:
        profile_data['profile'] = user.student_profile.to_dict()
    elif user.role == 'faculty' and user.faculty_profile:
        profile_data['profile'] = user.faculty_profile.to_dict()

    return jsonify({'success': True, 'user': profile_data})

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not user.check_password(current_password):
        return jsonify({'success': False, 'message': 'Incorrect current password'}), 400

    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

    user.set_password(new_password)
    db.session.commit()
    log_audit('PASSWORD_CHANGE', 'Password changed successfully', user_id=user.user_id, username=user.username)

    return jsonify({'success': True, 'message': 'Password updated successfully'})

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user:
        log_audit('USER_LOGOUT', f"User {user.username} logged out", user_id=user.user_id, username=user.username)
    return jsonify({'success': True, 'message': 'Logged out successfully'})
