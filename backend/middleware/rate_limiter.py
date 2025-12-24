"""
Rate Limiting Middleware for TradeSense

Provides configurable rate limiting with:
- IP-based and user-based limits
- Redis backend with in-memory fallback
- Custom rate limit decorators for specific endpoints
- Proper rate limit headers in responses
"""

import logging
from functools import wraps
from flask import request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

logger = logging.getLogger(__name__)


def get_rate_limit_key():
    """
    Get rate limit key based on user identity or IP address.
    Authenticated users are limited by user ID.
    Anonymous users are limited by IP address.
    """
    try:
        # Try to get JWT identity
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except Exception:
        pass

    # Fallback to IP address
    return get_remote_address()


def get_ip_key():
    """Get rate limit key based on IP address only"""
    # Handle X-Forwarded-For header for proxied requests
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr or '127.0.0.1'


def get_user_key():
    """Get rate limit key based on user ID (requires authentication)"""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except Exception:
        pass
    return get_ip_key()


# Initialize the limiter (will be configured in app factory)
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["500 per minute", "5000 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)


def rate_limit_exceeded_handler(e):
    """Custom handler for rate limit exceeded errors"""
    logger.warning(f"Rate limit exceeded: {get_ip_key()} - {request.path}")

    # Get retry after from the exception
    retry_after = getattr(e, 'retry_after', 60)

    response = jsonify({
        'error': 'Too many requests',
        'message': 'Rate limit exceeded. Please try again later.',
        'retry_after': retry_after,
        'limit_type': 'rate_limit'
    })
    response.status_code = 429
    response.headers['Retry-After'] = str(retry_after)
    response.headers['X-RateLimit-Remaining'] = '0'

    return response


# Rate limit configurations
RATE_LIMITS = {
    'login': '5 per 15 minutes',
    'register': '3 per hour',
    'password_reset': '3 per hour',
    'verification_email': '5 per hour',
    'api_general': '500 per minute',
    'trade_execution': '30 per minute',
    'ai_chat': '20 per minute',
    'admin': '500 per minute'
}


def rate_limit_by_ip(limit_string):
    """
    Decorator to apply rate limiting by IP address.

    Usage:
        @rate_limit_by_ip('5 per 15 minutes')
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # The actual limiting is done by flask-limiter
            return f(*args, **kwargs)
        return limiter.limit(limit_string, key_func=get_ip_key)(decorated_function)
    return decorator


def rate_limit_by_user(limit_string):
    """
    Decorator to apply rate limiting by user ID (authenticated users).
    Falls back to IP for anonymous users.

    Usage:
        @rate_limit_by_user('30 per minute')
        def execute_trade():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)
        return limiter.limit(limit_string, key_func=get_user_key)(decorated_function)
    return decorator


def rate_limit_by_email():
    """
    Rate limit key function based on email in request body.
    Used for login/password reset to prevent brute force on specific accounts.
    """
    data = request.get_json(silent=True)
    if data and 'email' in data:
        return f"email:{data['email'].lower()}"
    return get_ip_key()


def rate_limit_login(f):
    """
    Special rate limiting for login endpoint.
    Limits both by IP and by email to prevent brute force attacks.
    """
    @wraps(f)
    @limiter.limit('5 per 15 minutes', key_func=get_ip_key)
    @limiter.limit('10 per 15 minutes', key_func=rate_limit_by_email)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


def rate_limit_register(f):
    """
    Rate limiting for registration endpoint.
    Stricter limits to prevent account spam.
    """
    @wraps(f)
    @limiter.limit('3 per hour', key_func=get_ip_key)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


def rate_limit_password_reset(f):
    """
    Rate limiting for password reset endpoint.
    Prevents email spam and enumeration attacks.
    """
    @wraps(f)
    @limiter.limit('3 per hour', key_func=get_ip_key)
    @limiter.limit('3 per hour', key_func=rate_limit_by_email)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


def rate_limit_trade(f):
    """
    Rate limiting for trade execution.
    Limits by user to prevent rapid-fire trading.
    """
    @wraps(f)
    @limiter.limit('30 per minute', key_func=get_user_key)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


def rate_limit_api(f):
    """
    General API rate limiting.
    Applied to most authenticated endpoints.
    """
    @wraps(f)
    @limiter.limit('500 per minute', key_func=get_user_key)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


class RateLimitTracker:
    """
    Track failed login attempts for CAPTCHA triggering.
    Stores in Redis or memory.
    """

    FAILED_ATTEMPT_KEY = "failed_login:{}"
    CAPTCHA_THRESHOLD = 3
    LOCKOUT_DURATION = 900  # 15 minutes

    @classmethod
    def record_failed_attempt(cls, identifier):
        """Record a failed login attempt"""
        try:
            from services.cache_service import cache
            key = cls.FAILED_ATTEMPT_KEY.format(identifier)
            attempts = cache.get(key) or 0
            cache.set(key, attempts + 1, timeout=cls.LOCKOUT_DURATION)
            return attempts + 1
        except Exception as e:
            logger.warning(f"Failed to record attempt: {e}")
            return 0

    @classmethod
    def get_failed_attempts(cls, identifier):
        """Get number of failed attempts"""
        try:
            from services.cache_service import cache
            key = cls.FAILED_ATTEMPT_KEY.format(identifier)
            return cache.get(key) or 0
        except Exception as e:
            logger.warning(f"Failed to get attempts: {e}")
            return 0

    @classmethod
    def clear_failed_attempts(cls, identifier):
        """Clear failed attempts after successful login"""
        try:
            from services.cache_service import cache
            key = cls.FAILED_ATTEMPT_KEY.format(identifier)
            cache.delete(key)
        except Exception as e:
            logger.warning(f"Failed to clear attempts: {e}")

    @classmethod
    def requires_captcha(cls, identifier):
        """Check if CAPTCHA is required based on failed attempts"""
        attempts = cls.get_failed_attempts(identifier)
        return attempts >= cls.CAPTCHA_THRESHOLD

    @classmethod
    def get_lockout_remaining(cls, identifier):
        """Get remaining lockout time in seconds"""
        try:
            from services.cache_service import cache
            key = cls.FAILED_ATTEMPT_KEY.format(identifier)
            # Redis doesn't have TTL in flask-caching, so we estimate
            attempts = cache.get(key)
            if attempts and attempts >= 5:
                return cls.LOCKOUT_DURATION
            return 0
        except Exception:
            return 0


def init_rate_limiter(app):
    """Initialize rate limiter with app configuration"""
    try:
        redis_url = app.config.get('REDIS_URL')
        if redis_url:
            limiter._storage_uri = redis_url
            logger.info(f"Rate limiter initialized with Redis: {redis_url}")
        else:
            logger.info("Rate limiter using in-memory storage")
    except Exception as e:
        logger.warning(f"Rate limiter init warning: {e}")

    limiter.init_app(app)

    # Exempt OPTIONS requests from rate limiting
    @limiter.request_filter
    def exempt_options():
        """Exempt OPTIONS (CORS preflight) and health check from rate limiting"""
        if request.method == 'OPTIONS':
            return True
        if request.path == '/api/health':
            return True
        return False

    # Register error handler
    app.register_error_handler(429, rate_limit_exceeded_handler)

    # Add rate limit headers to all responses
    @app.after_request
    def add_rate_limit_headers(response):
        """Add rate limit headers to responses"""
        try:
            if hasattr(g, 'view_rate_limit'):
                limit = g.view_rate_limit
                response.headers['X-RateLimit-Limit'] = str(limit.limit.amount)
                response.headers['X-RateLimit-Remaining'] = str(limit.remaining)
                response.headers['X-RateLimit-Reset'] = str(limit.reset_at)
        except Exception:
            pass
        return response

    return limiter
