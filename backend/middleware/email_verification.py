"""
Email Verification Middleware for TradeSense
Decorator to require email verification on specific routes
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User


def email_verified_required(f):
    """
    Decorator that requires the user's email to be verified.
    Must be used after @jwt_required() decorator.

    Usage:
        @app.route('/api/protected')
        @jwt_required()
        @email_verified_required
        def protected_route():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()

        if not current_user_id:
            return jsonify({'error': 'Authentication required'}), 401

        user = User.query.get(int(current_user_id))

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.email_verified:
            return jsonify({
                'error': 'Email verification required',
                'code': 'EMAIL_NOT_VERIFIED',
                'message': 'Please verify your email address to access this feature'
            }), 403

        return f(*args, **kwargs)

    return decorated_function


def email_verification_optional(f):
    """
    Decorator that adds email verification status to the request context.
    Useful for routes that have different behavior based on verification.

    Usage:
        @app.route('/api/optional')
        @jwt_required()
        @email_verification_optional
        def optional_route():
            from flask import g
            if g.email_verified:
                # Full access
            else:
                # Limited access
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import g

        current_user_id = get_jwt_identity()

        if current_user_id:
            user = User.query.get(int(current_user_id))
            g.email_verified = user.email_verified if user else False
        else:
            g.email_verified = False

        return f(*args, **kwargs)

    return decorated_function
