"""
TradeSense - Prop Trading Platform
Main Flask Application Entry Point
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import config
from models import db, User
from services.websocket_service import init_socketio, price_updater, socketio


def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    # Allow all origins for development to prevent CORS issues
    CORS(app, resources={r"/*": {"origins": "*"}})

    jwt = JWTManager(app)

    # Initialize SocketIO
    init_socketio(app)

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'message': 'Please log in again'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Invalid token',
            'message': 'Token verification failed'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization required',
            'message': 'Please provide a valid access token'
        }), 401

    # Register blueprints
    from routes import (
        auth_bp, challenges_bp, trades_bp,
        market_data_bp, payments_bp, leaderboard_bp, admin_bp, subscriptions_bp,
        payouts_bp, challenge_models_bp
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(challenges_bp)
    app.register_blueprint(trades_bp)
    app.register_blueprint(market_data_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(subscriptions_bp)
    app.register_blueprint(payouts_bp)
    app.register_blueprint(challenge_models_bp)
    
    # AI Chat Blueprint
    from routes.ai_chat import ai_bp
    app.register_blueprint(ai_bp)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'TradeSense API is running',
            'version': '1.0.0',
            'websocket': 'enabled'
        }), 200

    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'name': 'TradeSense API',
            'description': 'Prop Trading Platform Backend',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'challenges': '/api/challenges',
                'trades': '/api/trades',
                'market': '/api/market',
                'payments': '/api/payments',
                'leaderboard': '/api/leaderboard',
                'admin': '/api/admin',
                'subscriptions': '/api/subscriptions'
            }
        }), 200

    # Create database tables
    with app.app_context():
        db.create_all()

        # Create default superadmin if not exists
        if not User.query.filter_by(role='superadmin').first():
            superadmin = User(
                username='admin',
                email='admin@tradesense.com',
                role='superadmin'
            )
            superadmin.set_password('admin123')  # Change in production!
            db.session.add(superadmin)
            db.session.commit()
            print("Default superadmin created: admin@tradesense.com / admin123")

        # Seed challenge models if not exists
        from models import ChallengeModel
        if not ChallengeModel.query.first():
            print("Seeding challenge models...")
            from scripts.seed_challenge_models import seed_challenge_models
            seed_challenge_models()

    # Initialize APScheduler for trial auto-charging
    from services.scheduler_service import init_scheduler
    init_scheduler(app)

    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    # Start the price updater background task
    # price_updater.start()

    # Run with SocketIO instead of Flask's default server
    # Disable reloader to ensure price updater runs consistently
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False, allow_unsafe_werkzeug=True)
