from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, SystemSetting, Notification
from app.utils.security import admin_required
from app.recognition import face_engine
from app.utils.audit import log_audit

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

DEFAULT_SETTINGS = {
    'institution_name': 'Apex Institute of Technology & AI',
    'face_match_threshold': '0.55',
    'liveness_detection_enabled': 'true',
    'anti_spoof_threshold': '35.0',
    'minimum_attendance_percent': '75.0',
    'auto_mark_cooldown_seconds': '10',
    'camera_resolution': '720p',
    'notify_low_attendance': 'true'
}

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    settings_records = SystemSetting.query.all()
    settings_dict = {**DEFAULT_SETTINGS}
    for s in settings_records:
        settings_dict[s.setting_key] = s.setting_value

    return jsonify({
        'success': True,
        'settings': settings_dict
    })

@settings_bp.route('', methods=['PUT'])
@admin_required
def update_settings():
    data = request.get_json() or {}

    for key, val in data.items():
        val_str = str(val)
        setting_obj = SystemSetting.query.get(key)
        if not setting_obj:
            setting_obj = SystemSetting(setting_key=key, setting_value=val_str)
            db.session.add(setting_obj)
        else:
            setting_obj.setting_value = val_str

        # Update runtime face_engine configuration if threshold changed
        if key == 'face_match_threshold':
            try:
                face_engine.match_threshold = float(val)
            except ValueError:
                pass
        elif key == 'anti_spoof_threshold':
            try:
                face_engine.anti_spoof_threshold = float(val)
            except ValueError:
                pass

    db.session.commit()
    log_audit('SETTINGS_UPDATE', f"Updated system configuration: {list(data.keys())}")

    return jsonify({'success': True, 'message': 'System settings updated successfully'})

@settings_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': Notification.query.filter_by(user_id=user_id, is_read=False).count()
    })

@settings_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(notification_id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'message': 'Marked as read'})
