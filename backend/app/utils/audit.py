from flask import request
from app.models.user import db
from app.models.audit_log import AuditLog

def log_audit(action, details=None, user_id=None, username=None):
    try:
        ip = request.remote_addr if request else '127.0.0.1'
        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            details=details,
            ip_address=ip
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"[Audit] Failed to record audit log: {e}")
        db.session.rollback()
