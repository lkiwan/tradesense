"""
SuperAdmin Configuration Routes
Routes for managing system configuration, trading settings, and platform control
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, PlatformConfig
from middleware.auth_middleware import superadmin_required
from datetime import datetime
from sqlalchemy import text
import json
import os

superadmin_config_bp = Blueprint('superadmin_config', __name__, url_prefix='/api/superadmin/config')


# ==================== SYSTEM CONFIGURATION ====================

@superadmin_config_bp.route('/system', methods=['GET'])
@jwt_required()
@superadmin_required
def get_system_config():
    """Get system configuration (API keys, email settings, etc.)"""
    try:
        # Get config from database or environment
        config = PlatformConfig.query.filter_by(config_type='system').first()

        if config:
            return jsonify(config.config_data)

        # Return default config structure (without sensitive data)
        return jsonify({
            'stripe': {
                'enabled': bool(os.getenv('STRIPE_SECRET_KEY')),
                'publicKey': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
                'secretKey': '••••••••' if os.getenv('STRIPE_SECRET_KEY') else '',
                'webhookSecret': '••••••••' if os.getenv('STRIPE_WEBHOOK_SECRET') else '',
                'testMode': True
            },
            'paypal': {
                'enabled': bool(os.getenv('PAYPAL_CLIENT_ID')),
                'clientId': os.getenv('PAYPAL_CLIENT_ID', ''),
                'clientSecret': '••••••••' if os.getenv('PAYPAL_CLIENT_SECRET') else '',
                'testMode': True
            },
            'crypto': {
                'enabled': False,
                'walletAddress': '',
                'network': 'ethereum'
            },
            'email': {
                'provider': os.getenv('EMAIL_PROVIDER', 'smtp'),
                'smtpHost': os.getenv('SMTP_HOST', ''),
                'smtpPort': int(os.getenv('SMTP_PORT', 587)),
                'smtpUser': os.getenv('SMTP_USER', ''),
                'smtpPassword': '••••••••' if os.getenv('SMTP_PASSWORD') else '',
                'smtpSecure': True,
                'fromEmail': os.getenv('FROM_EMAIL', 'noreply@tradesense.com'),
                'fromName': os.getenv('FROM_NAME', 'TradeSense'),
                'sendgridApiKey': '••••••••' if os.getenv('SENDGRID_API_KEY') else '',
                'mailgunApiKey': '••••••••' if os.getenv('MAILGUN_API_KEY') else '',
                'mailgunDomain': os.getenv('MAILGUN_DOMAIN', '')
            },
            'services': {
                'sentryDsn': '••••••••' if os.getenv('SENTRY_DSN') else '',
                'googleAnalyticsId': os.getenv('GA_TRACKING_ID', ''),
                'recaptchaSiteKey': os.getenv('RECAPTCHA_SITE_KEY', ''),
                'recaptchaSecretKey': '••••••••' if os.getenv('RECAPTCHA_SECRET_KEY') else '',
                'twilioAccountSid': os.getenv('TWILIO_ACCOUNT_SID', ''),
                'twilioAuthToken': '••••••••' if os.getenv('TWILIO_AUTH_TOKEN') else '',
                'twilioPhoneNumber': os.getenv('TWILIO_PHONE_NUMBER', '')
            },
            'infrastructure': {
                'redisUrl': '••••••••' if os.getenv('REDIS_URL') else '',
                'databaseUrl': '••••••••',
                's3Bucket': os.getenv('S3_BUCKET', ''),
                's3AccessKey': '••••••••' if os.getenv('S3_ACCESS_KEY') else '',
                's3SecretKey': '••••••••' if os.getenv('S3_SECRET_KEY') else '',
                'cdnUrl': os.getenv('CDN_URL', '')
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/system', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_system_config():
    """Update system configuration"""
    try:
        data = request.get_json()

        # Get or create config
        config = PlatformConfig.query.filter_by(config_type='system').first()
        if not config:
            config = PlatformConfig(config_type='system')
            db.session.add(config)

        # Don't store masked values
        clean_data = {}
        for section, values in data.items():
            clean_data[section] = {}
            for key, value in values.items():
                if value and value != '••••••••':
                    clean_data[section][key] = value

        config.config_data = clean_data
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'System configuration updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== TRADING CONFIGURATION ====================

@superadmin_config_bp.route('/trading', methods=['GET'])
@jwt_required()
@superadmin_required
def get_trading_config():
    """Get trading configuration"""
    try:
        config = PlatformConfig.query.filter_by(config_type='trading').first()

        if config and config.config_data:
            return jsonify(config.config_data)

        # Return default trading config
        return jsonify({
            'tradingHours': {
                'enabled': True,
                'timezone': 'UTC',
                'sessions': [
                    {'name': 'Sydney', 'start': '22:00', 'end': '07:00', 'days': [0, 1, 2, 3, 4]},
                    {'name': 'Tokyo', 'start': '00:00', 'end': '09:00', 'days': [0, 1, 2, 3, 4]},
                    {'name': 'London', 'start': '08:00', 'end': '17:00', 'days': [0, 1, 2, 3, 4]},
                    {'name': 'New York', 'start': '13:00', 'end': '22:00', 'days': [0, 1, 2, 3, 4]}
                ],
                'weekendTrading': False,
                'holidayTrading': False
            },
            'spreads': {
                'defaultMarkup': 0.5,
                'dynamicSpread': True,
                'maxSpreadMultiplier': 3.0,
                'instruments': [
                    {'symbol': 'EURUSD', 'baseSpread': 0.8, 'markup': 0.3, 'minSpread': 0.5, 'maxSpread': 5.0, 'enabled': True},
                    {'symbol': 'GBPUSD', 'baseSpread': 1.2, 'markup': 0.4, 'minSpread': 0.8, 'maxSpread': 8.0, 'enabled': True},
                    {'symbol': 'USDJPY', 'baseSpread': 1.0, 'markup': 0.3, 'minSpread': 0.6, 'maxSpread': 6.0, 'enabled': True},
                    {'symbol': 'XAUUSD', 'baseSpread': 25.0, 'markup': 5.0, 'minSpread': 15.0, 'maxSpread': 100.0, 'enabled': True},
                    {'symbol': 'BTCUSD', 'baseSpread': 50.0, 'markup': 10.0, 'minSpread': 30.0, 'maxSpread': 200.0, 'enabled': True}
                ]
            },
            'riskManagement': {
                'maxDailyLoss': 5.0,
                'maxTotalLoss': 10.0,
                'profitTarget': 10.0,
                'maxPositionSize': 10.0,
                'maxOpenTrades': 10,
                'maxLotSize': 100,
                'minLotSize': 0.01,
                'leverageLimit': 100,
                'marginCallLevel': 100,
                'stopOutLevel': 50
            },
            'restrictions': {
                'newsTrading': True,
                'newsBlackoutMinutes': 5,
                'weekendHolding': False,
                'hedgingAllowed': True,
                'scalpingAllowed': True,
                'minHoldingTime': 60,
                'maxHoldingDays': 30,
                'expertAdvisorsAllowed': True,
                'copyTradingAllowed': True
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/trading', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_trading_config():
    """Update trading configuration"""
    try:
        data = request.get_json()

        config = PlatformConfig.query.filter_by(config_type='trading').first()
        if not config:
            config = PlatformConfig(config_type='trading')
            db.session.add(config)

        config.config_data = data
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Trading configuration updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== PLATFORM CONTROL ====================

@superadmin_config_bp.route('/platform', methods=['GET'])
@jwt_required()
@superadmin_required
def get_platform_status():
    """Get platform status and controls"""
    try:
        config = PlatformConfig.query.filter_by(config_type='platform').first()

        if config and config.config_data:
            return jsonify(config.config_data)

        # Return default platform config
        return jsonify({
            'maintenance': {
                'enabled': False,
                'message': 'We are currently performing scheduled maintenance. Please check back soon.',
                'estimatedEnd': None,
                'allowAdminAccess': True
            },
            'controls': {
                'registrationEnabled': True,
                'loginEnabled': True,
                'tradingEnabled': True,
                'paymentsEnabled': True,
                'payoutsEnabled': True,
                'newChallengesEnabled': True,
                'apiAccessEnabled': True
            },
            'announcement': {
                'enabled': False,
                'type': 'info',
                'title': '',
                'message': '',
                'dismissible': True,
                'showOnPages': ['dashboard', 'trading']
            },
            'features': {
                'socialTrading': True,
                'copyTrading': True,
                'expertAdvisors': True,
                'referralProgram': True,
                'infinityPoints': True,
                'premiumSubscriptions': True,
                'advancedCharts': True,
                'mobileApp': True
            },
            'rateLimiting': {
                'enabled': True,
                'requestsPerMinute': 60,
                'loginAttemptsPerHour': 10,
                'apiRequestsPerMinute': 100
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/platform', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_platform_status():
    """Update platform status and controls"""
    try:
        data = request.get_json()

        config = PlatformConfig.query.filter_by(config_type='platform').first()
        if not config:
            config = PlatformConfig(config_type='platform')
            db.session.add(config)

        config.config_data = data
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Platform settings updated successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/health', methods=['GET'])
@jwt_required()
@superadmin_required
def get_system_health():
    """Get system health status"""
    try:
        import time
        from services.cache_service import cache

        health = {}

        # Check database
        try:
            start = time.time()
            db.session.execute(text('SELECT 1'))
            health['database'] = {
                'status': 'healthy',
                'latency': int((time.time() - start) * 1000)
            }
        except Exception as e:
            import logging
            logging.error(f"Database health check failed: {str(e)}")
            health['database'] = {'status': 'unhealthy', 'latency': 0}

        # Check Redis/Cache
        try:
            start = time.time()
            cache.set('health_check', 'ok', timeout=1)
            cache.get('health_check')
            health['redis'] = {
                'status': 'healthy',
                'latency': int((time.time() - start) * 1000)
            }
        except Exception:
            health['redis'] = {'status': 'degraded', 'latency': 0}

        # API status (always healthy if we reach here)
        health['api'] = {'status': 'healthy', 'latency': 45}

        # WebSocket status (mock for now)
        health['websocket'] = {'status': 'healthy', 'connections': 1250}

        # Queue status (mock for now)
        health['queue'] = {'status': 'healthy', 'pending': 23}

        return jsonify(health)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== MAINTENANCE MODE ====================

@superadmin_config_bp.route('/maintenance', methods=['POST'])
@jwt_required()
@superadmin_required
def toggle_maintenance():
    """Toggle maintenance mode"""
    try:
        data = request.get_json()
        enabled = data.get('enabled', False)
        message = data.get('message', 'We are currently performing scheduled maintenance.')

        config = PlatformConfig.query.filter_by(config_type='platform').first()
        if not config:
            config = PlatformConfig(config_type='platform', config_data={})
            db.session.add(config)

        if not config.config_data:
            config.config_data = {}

        config.config_data['maintenance'] = {
            'enabled': enabled,
            'message': message,
            'estimatedEnd': data.get('estimatedEnd'),
            'allowAdminAccess': data.get('allowAdminAccess', True),
            'enabledAt': datetime.utcnow().isoformat() if enabled else None
        }
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': f'Maintenance mode {"enabled" if enabled else "disabled"}',
            'maintenance': config.config_data['maintenance']
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== FEATURE FLAGS ====================

@superadmin_config_bp.route('/features', methods=['GET'])
@jwt_required()
@superadmin_required
def get_feature_flags():
    """Get all feature flags"""
    try:
        config = PlatformConfig.query.filter_by(config_type='platform').first()

        if config and config.config_data and 'features' in config.config_data:
            return jsonify(config.config_data['features'])

        return jsonify({
            'socialTrading': True,
            'copyTrading': True,
            'expertAdvisors': True,
            'referralProgram': True,
            'infinityPoints': True,
            'premiumSubscriptions': True,
            'advancedCharts': True,
            'mobileApp': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/features/<feature>', methods=['PUT'])
@jwt_required()
@superadmin_required
def toggle_feature(feature):
    """Toggle a specific feature flag"""
    try:
        data = request.get_json()
        enabled = data.get('enabled', False)

        config = PlatformConfig.query.filter_by(config_type='platform').first()
        if not config:
            config = PlatformConfig(config_type='platform', config_data={})
            db.session.add(config)

        if not config.config_data:
            config.config_data = {}

        if 'features' not in config.config_data:
            config.config_data['features'] = {}

        config.config_data['features'][feature] = enabled
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': f'Feature {feature} {"enabled" if enabled else "disabled"}',
            'feature': feature,
            'enabled': enabled
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ANNOUNCEMENT ====================

@superadmin_config_bp.route('/announcement', methods=['GET'])
@jwt_required()
@superadmin_required
def get_announcement():
    """Get current platform announcement"""
    try:
        config = PlatformConfig.query.filter_by(config_type='platform').first()

        if config and config.config_data and 'announcement' in config.config_data:
            return jsonify(config.config_data['announcement'])

        return jsonify({
            'enabled': False,
            'type': 'info',
            'title': '',
            'message': '',
            'dismissible': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_config_bp.route('/announcement', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_announcement():
    """Update platform announcement"""
    try:
        data = request.get_json()

        config = PlatformConfig.query.filter_by(config_type='platform').first()
        if not config:
            config = PlatformConfig(config_type='platform', config_data={})
            db.session.add(config)

        if not config.config_data:
            config.config_data = {}

        config.config_data['announcement'] = {
            'enabled': data.get('enabled', False),
            'type': data.get('type', 'info'),
            'title': data.get('title', ''),
            'message': data.get('message', ''),
            'dismissible': data.get('dismissible', True),
            'showOnPages': data.get('showOnPages', ['dashboard']),
            'updatedAt': datetime.utcnow().isoformat()
        }
        config.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Announcement updated successfully',
            'announcement': config.config_data['announcement']
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
