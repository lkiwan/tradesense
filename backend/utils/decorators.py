"""
Custom decorators for route protection
Includes Role-Based Access Control (RBAC) with granular permissions
"""

from functools import wraps
from flask import jsonify, g
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

        # Store user in flask.g for easy access in routes
        g.current_user = user

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

        # Store user in flask.g for easy access in routes
        g.current_user = user

        return fn(*args, **kwargs)
    return wrapper


def permission_required(*permissions):
    """
    Decorator to require specific permissions.
    Checks both individual permissions and role-based permissions.

    Usage:
        @permission_required('view_users')
        def get_users():
            ...

        @permission_required('edit_users', 'ban_users')  # Requires ALL permissions
        def manage_user():
            ...

    Args:
        *permissions: One or more permission names required

    Note:
        - Superadmins automatically have all permissions
        - Users must have ALL specified permissions to access the route
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            from models import has_permission, get_user_permissions

            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 404

            # Must be at least an admin
            if user.role not in ['admin', 'superadmin']:
                return jsonify({'error': 'Admin access required'}), 403

            # Superadmins have all permissions
            if user.role == 'superadmin':
                g.current_user = user
                g.user_permissions = set(permissions)  # They have all requested
                return fn(*args, **kwargs)

            # Check each required permission
            missing_permissions = []
            for perm in permissions:
                if not has_permission(current_user_id, perm):
                    missing_permissions.append(perm)

            if missing_permissions:
                return jsonify({
                    'error': 'Permission denied',
                    'missing_permissions': missing_permissions,
                    'message': f'Required permissions: {", ".join(permissions)}'
                }), 403

            # Store user and permissions in flask.g
            g.current_user = user
            g.user_permissions = get_user_permissions(current_user_id)

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def any_permission_required(*permissions):
    """
    Decorator to require ANY of the specified permissions.
    User needs at least one of the listed permissions.

    Usage:
        @any_permission_required('view_users', 'edit_users')
        def user_related():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            from models import has_permission, get_user_permissions

            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 404

            if user.role not in ['admin', 'superadmin']:
                return jsonify({'error': 'Admin access required'}), 403

            # Superadmins have all permissions
            if user.role == 'superadmin':
                g.current_user = user
                return fn(*args, **kwargs)

            # Check if user has ANY of the permissions
            has_any = False
            for perm in permissions:
                if has_permission(current_user_id, perm):
                    has_any = True
                    break

            if not has_any:
                return jsonify({
                    'error': 'Permission denied',
                    'message': f'Requires one of: {", ".join(permissions)}'
                }), 403

            g.current_user = user
            g.user_permissions = get_user_permissions(current_user_id)

            return fn(*args, **kwargs)
        return wrapper
    return decorator


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
