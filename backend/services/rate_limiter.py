"""
Rate Limiter Service for TradeSense
Provides rate limiting decorators for API endpoints.
"""
from functools import wraps
from flask import request, jsonify, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import logging

logger = logging.getLogger(__name__)


def get_user_identifier():
    """
    Get user identifier for rate limiting.
    Uses JWT user ID if authenticated, otherwise falls back to IP address.
    """
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except Exception:
        pass
    return f"ip:{get_remote_address()}"


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Authentication endpoints - strict limits to prevent brute force
    'login': '5 per 15 minutes',
    'register': '3 per hour',
    'password_reset': '3 per hour',

    # Trading endpoints - moderate limits
    'trade_execute': '30 per minute',
    'trade_close': '30 per minute',

    # Market data endpoints - higher limits for real-time data
    'market_prices': '60 per minute',
    'market_signals': '30 per minute',

    # User data endpoints
    'user_profile': '60 per minute',
    'challenge_data': '60 per minute',

    # Admin endpoints - lower limits
    'admin_actions': '30 per minute',

    # AI endpoints - moderate limits due to API costs
    'ai_chat': '20 per minute',
    'ai_signals': '10 per minute',

    # Default for unspecified endpoints
    'default': '100 per minute',
}


def rate_limit_exceeded_handler(e):
    """
    Custom handler for rate limit exceeded errors.
    Returns a user-friendly JSON response.
    """
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': f'Too many requests. Please try again later.',
        'retry_after': e.description
    }), 429


class RateLimitDecorators:
    """
    Class containing rate limit decorators for different endpoint types.

    Usage:
        from services.rate_limiter import rate_limits

        @app.route('/login')
        @rate_limits.login
        def login():
            pass
    """

    def __init__(self, limiter: Limiter):
        self.limiter = limiter

    def login(self, f):
        """Rate limit for login endpoint - 5 attempts per 15 minutes"""
        return self.limiter.limit(RATE_LIMITS['login'], key_func=get_remote_address)(f)

    def register(self, f):
        """Rate limit for registration - 3 attempts per hour"""
        return self.limiter.limit(RATE_LIMITS['register'], key_func=get_remote_address)(f)

    def password_reset(self, f):
        """Rate limit for password reset - 3 attempts per hour"""
        return self.limiter.limit(RATE_LIMITS['password_reset'], key_func=get_remote_address)(f)

    def trade(self, f):
        """Rate limit for trade execution - 30 per minute per user"""
        return self.limiter.limit(RATE_LIMITS['trade_execute'], key_func=get_user_identifier)(f)

    def market(self, f):
        """Rate limit for market data - 60 per minute"""
        return self.limiter.limit(RATE_LIMITS['market_prices'], key_func=get_user_identifier)(f)

    def ai(self, f):
        """Rate limit for AI endpoints - 20 per minute"""
        return self.limiter.limit(RATE_LIMITS['ai_chat'], key_func=get_user_identifier)(f)

    def admin(self, f):
        """Rate limit for admin actions - 30 per minute"""
        return self.limiter.limit(RATE_LIMITS['admin_actions'], key_func=get_user_identifier)(f)

    def default(self, f):
        """Default rate limit - 100 per minute"""
        return self.limiter.limit(RATE_LIMITS['default'], key_func=get_user_identifier)(f)


# Singleton instance - will be initialized in app.py
rate_limits = None


def init_rate_limits(limiter: Limiter):
    """Initialize rate limit decorators with the app's limiter instance"""
    global rate_limits
    rate_limits = RateLimitDecorators(limiter)
    return rate_limits


def require_rate_limit(limit_string: str):
    """
    Custom rate limit decorator for one-off limits.

    Usage:
        @require_rate_limit('10 per minute')
        def my_endpoint():
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Import here to avoid circular imports
            from app import limiter
            limited_func = limiter.limit(limit_string, key_func=get_user_identifier)(f)
            return limited_func(*args, **kwargs)
        return decorated_function
    return decorator
