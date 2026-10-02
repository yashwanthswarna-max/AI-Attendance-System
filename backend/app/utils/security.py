from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models.user import User

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', '')
            if user_role not in allowed_roles and 'admin' not in allowed_roles:
                return jsonify({
                    'success': False,
                    'error': 'Forbidden: Insufficient privileges',
                    'required_roles': list(allowed_roles),
                    'user_role': user_role
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Admin privilege required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def faculty_or_admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        role = claims.get('role')
        if role not in ('admin', 'faculty'):
            return jsonify({'success': False, 'error': 'Faculty or Admin privilege required'}), 403
        return fn(*args, **kwargs)
    return wrapper
