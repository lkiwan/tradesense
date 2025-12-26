"""
Admin User Management Routes
Provides endpoints for managing users from the admin dashboard.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import or_, and_

from models import (
    db, User, UserChallenge, Payment, UserSession,
    UserStatus, get_or_create_user_status, ban_user, unban_user,
    freeze_user, unfreeze_user, block_user_trading, unblock_user_trading,
    AuditLog
)
from utils.decorators import (
    admin_required, superadmin_required,
    permission_required, any_permission_required
)
from services.audit_service import AuditService

admin_users_bp = Blueprint('admin_users', __name__)


@admin_users_bp.route('', methods=['GET'])
@permission_required('view_users')
def get_users():
    """Get all users with advanced filtering and pagination"""
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)  # Max 100 per page

        # Build query
        query = User.query

        # Search filter
        search = request.args.get('search', '')
        if search:
            search_filter = or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)

        # Role filter
        role = request.args.get('role', '')
        if role:
            query = query.filter(User.role == role)

        # Status filter (requires join with UserStatus)
        status = request.args.get('status', '')
        if status:
            query = query.outerjoin(UserStatus, User.id == UserStatus.user_id)
            if status == 'banned':
                query = query.filter(UserStatus.is_banned == True)
            elif status == 'frozen':
                query = query.filter(UserStatus.is_frozen == True)
            elif status == 'active':
                query = query.filter(
                    or_(
                        UserStatus.id.is_(None),
                        and_(
                            UserStatus.is_banned == False,
                            UserStatus.is_frozen == False
                        )
                    )
                )

        # Email verification filter
        kyc_status = request.args.get('kyc_status', '')
        if kyc_status == 'verified':
            query = query.filter(User.email_verified == True)
        elif kyc_status == 'unverified':
            query = query.filter(User.email_verified == False)

        # Has challenge filter
        has_challenge = request.args.get('has_challenge', '')
        if has_challenge == 'yes':
            query = query.filter(User.challenges.any())
        elif has_challenge == 'no':
            query = query.filter(~User.challenges.any())

        # Date filters
        created_after = request.args.get('created_after')
        if created_after:
            query = query.filter(User.created_at >= datetime.fromisoformat(created_after))

        created_before = request.args.get('created_before')
        if created_before:
            query = query.filter(User.created_at <= datetime.fromisoformat(created_before))

        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        if hasattr(User, sort_by):
            sort_column = getattr(User, sort_by)
            if sort_order == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(User.created_at.desc())

        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        # Format results
        users = []
        for user in pagination.items:
            user_dict = user.to_dict()

            # Add status info
            status_record = UserStatus.query.filter_by(user_id=user.id).first()
            if status_record:
                user_dict['status'] = status_record.to_dict()
            else:
                user_dict['status'] = {
                    'is_banned': False,
                    'is_frozen': False,
                    'can_trade': True
                }

            # Add challenge count
            user_dict['challenges_count'] = len(user.challenges)

            users.append(user_dict)

        return jsonify({
            'users': users,
            'total': pagination.total,
            'pages': pagination.pages,
            'page': page,
            'per_page': per_page
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>', methods=['GET'])
@permission_required('view_users')
def get_user_detail(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_dict = user.to_dict()

        # Add status info
        status_record = UserStatus.query.filter_by(user_id=user.id).first()
        if status_record:
            user_dict['status'] = status_record.to_dict()
        else:
            user_dict['status'] = {
                'is_banned': False,
                'is_frozen': False,
                'can_trade': True,
                'last_activity_at': None,
                'total_logins': 0
            }

        # Add challenges
        challenges = []
        for challenge in user.challenges:
            challenges.append({
                'id': challenge.id,
                'model_name': challenge.model.name if challenge.model else 'Unknown',
                'account_size': float(challenge.initial_balance),
                'status': challenge.status,
                'phase': challenge.phase,
                'current_balance': float(challenge.current_balance),
                'profit_percentage': float(challenge.profit_percentage) if hasattr(challenge, 'profit_percentage') else 0,
                'created_at': challenge.start_date.isoformat() if challenge.start_date else None
            })
        user_dict['challenges'] = challenges

        # Add payments
        payments = []
        for payment in user.payments:
            payments.append({
                'id': payment.id,
                'amount': float(payment.amount),
                'currency': payment.currency if hasattr(payment, 'currency') else 'MAD',
                'status': payment.status,
                'method': payment.payment_method if hasattr(payment, 'payment_method') else 'unknown',
                'created_at': payment.created_at.isoformat() if payment.created_at else None
            })
        user_dict['payments'] = payments

        # Add sessions
        sessions = UserSession.query.filter_by(user_id=user.id, is_active=True).all()
        user_dict['sessions'] = [{
            'id': s.id,
            'device': f"{s.browser} on {s.os}" if hasattr(s, 'browser') else 'Unknown',
            'ip_address': s.ip_address if hasattr(s, 'ip_address') else None,
            'country': s.country if hasattr(s, 'country') else None,
            'is_current': False,  # Would need to check session token
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in sessions]

        return jsonify(user_dict)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>', methods=['PUT'])
@permission_required('edit_users')
def update_user(user_id):
    """Update user details"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        old_values = {
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'preferred_language': user.preferred_language
        }

        # Update allowed fields
        if 'username' in data:
            # Check if username is taken
            existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
            if existing:
                return jsonify({'error': 'Username already taken'}), 400
            user.username = data['username']

        if 'email' in data:
            # Check if email is taken
            existing = User.query.filter(User.email == data['email'], User.id != user_id).first()
            if existing:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = data['email']

        if 'role' in data:
            # Only superadmin can change roles
            admin = User.query.get(current_user_id)
            if admin.role != 'superadmin':
                return jsonify({'error': 'Only superadmin can change roles'}), 403
            user.role = data['role']

        if 'preferred_language' in data:
            user.preferred_language = data['preferred_language']

        db.session.commit()

        # Log the action
        AuditService.log_user_update(
            admin_id=current_user_id,
            target_user_id=user_id,
            old_values=old_values,
            new_values=data
        )

        return jsonify({'message': 'User updated successfully', 'user': user.to_dict()})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/ban', methods=['POST'])
@permission_required('ban_users')
def ban_user_route(user_id):
    """Ban a user"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Can't ban superadmin
        if user.role == 'superadmin':
            return jsonify({'error': 'Cannot ban a superadmin'}), 403

        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        expires_at = None
        if data.get('expires_at'):
            expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00'))

        ban_user(user_id, reason, current_user_id, expires_at)

        # Log the action
        admin = User.query.get(current_user_id)
        AuditService.log_user_ban(
            admin_user_id=current_user_id,
            admin_username=admin.username if admin else 'Unknown',
            target_user_id=user_id,
            target_username=user.username,
            reason=reason
        )

        return jsonify({'message': 'User banned successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/unban', methods=['POST'])
@permission_required('ban_users')
def unban_user_route(user_id):
    """Unban a user"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        unban_user(user_id)

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_unban',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Unbanned user {user.username}'
        )

        return jsonify({'message': 'User unbanned successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/activity', methods=['GET'])
@permission_required('view_users')
def get_user_activity(user_id):
    """Get user activity log"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        # Get audit logs for this user
        logs = AuditLog.query.filter_by(user_id=user_id)\
            .order_by(AuditLog.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'activities': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'page': page
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/sessions', methods=['GET'])
@permission_required('view_users')
def get_user_sessions(user_id):
    """Get user's active sessions"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()

        return jsonify({
            'sessions': [{
                'id': s.id,
                'device': f"{s.browser} on {s.os}" if hasattr(s, 'browser') else 'Unknown Device',
                'ip_address': s.ip_address if hasattr(s, 'ip_address') else None,
                'country': s.country if hasattr(s, 'country') else None,
                'city': s.city if hasattr(s, 'city') else None,
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'last_activity': s.last_activity.isoformat() if hasattr(s, 'last_activity') and s.last_activity else None
            } for s in sessions]
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/revoke-sessions', methods=['POST'])
@permission_required('ban_users')
def revoke_user_sessions(user_id):
    """Revoke all user sessions"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Deactivate all sessions
        sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
        for session in sessions:
            session.is_active = False

        db.session.commit()

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='SECURITY',
            action='session_revoke_all',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Revoked all sessions for user {user.username}'
        )

        return jsonify({'message': f'{len(sessions)} session(s) revoked successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# SuperAdmin-only routes for advanced user control
@admin_users_bp.route('/<int:user_id>/freeze', methods=['POST'])
@superadmin_required
def freeze_user_route(user_id):
    """Freeze a user temporarily (SuperAdmin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role == 'superadmin':
            return jsonify({'error': 'Cannot freeze a superadmin'}), 403

        data = request.get_json()
        hours = data.get('hours', 24)
        reason = data.get('reason', 'No reason provided')

        freeze_user(user_id, hours, reason, current_user_id)

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_freeze',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Froze user {user.username} for {hours} hours: {reason}'
        )

        return jsonify({'message': f'User frozen for {hours} hours'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/unfreeze', methods=['POST'])
@superadmin_required
def unfreeze_user_route(user_id):
    """Unfreeze a user (SuperAdmin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        unfreeze_user(user_id)

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_unfreeze',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Unfroze user {user.username}'
        )

        return jsonify({'message': 'User unfrozen successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/trade-block', methods=['POST'])
@superadmin_required
def block_trading_route(user_id):
    """Block user from trading (SuperAdmin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        reason = data.get('reason', 'No reason provided')

        block_user_trading(user_id, reason, current_user_id)

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_trade_block',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Blocked trading for user {user.username}: {reason}'
        )

        return jsonify({'message': 'User blocked from trading'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/trade-unblock', methods=['POST'])
@superadmin_required
def unblock_trading_route(user_id):
    """Unblock user trading (SuperAdmin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        unblock_user_trading(user_id)

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_trade_unblock',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Unblocked trading for user {user.username}'
        )

        return jsonify({'message': 'User trading unblocked'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_users_bp.route('/<int:user_id>/password', methods=['PUT'])
@superadmin_required
def change_user_password(user_id):
    """Change user password (SuperAdmin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        new_password = data.get('new_password')

        if not new_password or len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400

        user.set_password(new_password)
        db.session.commit()

        # Log the action
        AuditService.log_action(
            user_id=current_user_id,
            action_type='ADMIN',
            action='user_password_change',
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Changed password for user {user.username}'
        )

        return jsonify({'message': 'Password changed successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
