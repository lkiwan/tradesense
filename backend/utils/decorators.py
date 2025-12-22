"""
Custom decorators for route protection
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User


def admin_required(fn):
    """
    Decorator to require admin or superadmin role
    Must be used after @jwt_required()
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403

        return fn(*args, **kwargs)
    return wrapper


def superadmin_required(fn):
    """
    Decorator to require superadmin role
    Must be used after @jwt_required()
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403

        return fn(*args, **kwargs)
    return wrapper


def active_challenge_required(fn):
    """
    Decorator to require an active challenge
    Must be used after @jwt_required()
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        from models import UserChallenge

        current_user_id = int(get_jwt_identity())
        challenge = UserChallenge.query.filter_by(
            user_id=current_user_id,
            status='active'
        ).first()

        if not challenge:
            return jsonify({
                'error': 'No active challenge',
                'message': 'Please purchase a trading challenge to continue'
            }), 403

        return fn(*args, **kwargs)
    return wrapper
