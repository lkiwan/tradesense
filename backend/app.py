"""
TradeSense - Prop Trading Platform
Main Flask Application Entry Point
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

# Initialize Sentry for error tracking (before any other imports)
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_dsn = os.getenv('SENTRY_DSN')
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        profiles_sample_rate=float(os.getenv('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
        environment=os.getenv('FLASK_ENV', 'development'),
        send_default_pii=False,  # Don't send personally identifiable information
    )

from config import config
from models import db, User
from services.websocket_service import init_socketio, price_updater, socketio
from services.cache_service import init_cache, cache
from middleware.rate_limiter import limiter, init_rate_limiter, rate_limit_exceeded_handler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask-Migrate
migrate = Migrate()


def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)  # Flask-Migrate for database migrations
    # Allow all origins for development to prevent CORS issues
    CORS(app, resources={r"/*": {"origins": "*"}})

    jwt = JWTManager(app)

    # Initialize Cache (Redis with SimpleCache fallback)
    init_cache(app)
    logger.info(f"Cache backend: {app.config.get('CACHE_BACKEND', 'unknown')}")

    # Initialize Rate Limiter with Redis backend
    try:
        init_rate_limiter(app)
        logger.info("Rate limiter initialized successfully")
    except Exception as e:
        logger.warning(f"Rate limiter initialization warning: {e}")
        # Fallback: initialize with in-memory storage
        limiter.init_app(app)
        app.register_error_handler(429, rate_limit_exceeded_handler)

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
        payouts_bp, challenge_models_bp, referrals_bp, points_bp, tickets_bp,
        resources_bp, offers_bp, two_factor_bp, sessions_bp, audit_bp, kyc_bp,
        subscriptions_v2_bp, challenge_addons_bp, affiliates_bp, advanced_orders_bp,
        quick_trading_bp, order_templates_bp, journal_bp, mt_bp, charts_bp,
        profiles_bp, followers_bp, copy_trading_bp, ideas_bp, push_bp, blog_bp,
        webinars_bp, oauth_bp, events_bp, monitoring_bp
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
    app.register_blueprint(referrals_bp)
    app.register_blueprint(points_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(offers_bp)
    app.register_blueprint(two_factor_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(kyc_bp)
    app.register_blueprint(subscriptions_v2_bp, url_prefix='/api/premium')
    app.register_blueprint(challenge_addons_bp)
    app.register_blueprint(affiliates_bp)
    app.register_blueprint(advanced_orders_bp, url_prefix='/api/orders')
    app.register_blueprint(quick_trading_bp, url_prefix='/api/quick-trading')
    app.register_blueprint(order_templates_bp)
    app.register_blueprint(journal_bp)
    app.register_blueprint(mt_bp)
    app.register_blueprint(charts_bp)
    app.register_blueprint(profiles_bp)
    app.register_blueprint(followers_bp)
    app.register_blueprint(copy_trading_bp)
    app.register_blueprint(ideas_bp)
    app.register_blueprint(push_bp)
    app.register_blueprint(blog_bp)
    app.register_blueprint(webinars_bp)
    app.register_blueprint(oauth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(monitoring_bp)

    # Setup request tracking for metrics
    from services.metrics_service import setup_request_tracking
    setup_request_tracking(app)
    logger.info("Request tracking initialized")

    # AI Chat Blueprint
    from routes.ai_chat import ai_bp
    app.register_blueprint(ai_bp)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'TradeSense API is running',
            'version': '2.0.0',
            'websocket': 'enabled',
            'cache_backend': app.config.get('CACHE_BACKEND', 'none'),
            'rate_limiting': 'enabled'
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


# Create app instance for WSGI servers (Gunicorn)
# Don't create during pytest imports to allow test configuration
import sys
if 'pytest' not in sys.modules:
    app = create_app()
else:
    app = None


if __name__ == '__main__':
    # Start the price updater background task
    # price_updater.start()

    # Run with SocketIO instead of Flask's default server
    # Disable reloader to ensure price updater runs consistently
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False, allow_unsafe_werkzeug=True)
