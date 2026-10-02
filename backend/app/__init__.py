import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db
try:
    from config import Config
except ImportError:
    from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            'success': False,
            'error': 'Missing or invalid authorization token',
            'message': 'Please log in to continue.'
        }), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'error': 'Token expired',
            'message': 'Session expired. Please log in again.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            'success': False,
            'error': 'Invalid token',
            'message': 'Authorization signature is invalid.'
        }), 401

    # Register blueprints
    from app.routes import (
        auth_bp,
        admin_bp,
        student_bp,
        faculty_bp,
        attendance_bp,
        reports_bp,
        settings_bp
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)

    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'AI-Based Smart Student Attendance Management System',
            'version': '1.0.0'
        })

    # Create tables and seed data
    with app.app_context():
        db.create_all()
        from app.services.seed_data import seed_database
        seed_database(app)

    return app
