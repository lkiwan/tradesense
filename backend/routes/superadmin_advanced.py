"""
SuperAdmin Advanced Features Routes
Bulk actions, user control, and notifications
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models import db, User, UserStatus, AdminNotification
from datetime import datetime, timedelta
import logging
from services.push_notification_service import PushNotificationService
from services.email_service import EmailService

logger = logging.getLogger(__name__)

superadmin_advanced_bp = Blueprint('superadmin_advanced', __name__, url_prefix='/api/superadmin/advanced')


def superadmin_required(fn):
    """Decorator to require superadmin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'superadmin':
            return jsonify({'error': 'Superadmin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ==================== BULK ACTIONS ====================

@superadmin_advanced_bp.route('/bulk-action', methods=['POST'])
@superadmin_required
def execute_bulk_action():
    """Execute bulk action on multiple users"""
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        action = data.get('action')
        params = data.get('params', {})

        if not user_ids or not action:
            return jsonify({'error': 'user_ids and action are required'}), 400

        users = User.query.filter(User.id.in_(user_ids)).all()
        if not users:
            return jsonify({'error': 'No users found'}), 404

        affected_count = 0
        current_user_id = get_jwt_identity()

        for user in users:
            try:
                if action == 'ban':
                    user.status = 'banned'
                    # Create user status record
                    status = UserStatus(
                        user_id=user.id,
                        status_type='ban',
                        reason=params.get('reason', 'Bulk ban action'),
                        created_by=current_user_id
                    )
                    db.session.add(status)
                    affected_count += 1

                elif action == 'unban':
                    user.status = 'active'
                    affected_count += 1

                elif action == 'freeze':
                    user.status = 'frozen'
                    hours = params.get('hours', 24)
                    status = UserStatus(
                        user_id=user.id,
                        status_type='freeze',
                        reason=params.get('reason', f'Bulk freeze for {hours} hours'),
                        expires_at=datetime.utcnow() + timedelta(hours=hours),
                        created_by=current_user_id
                    )
                    db.session.add(status)
                    affected_count += 1

                elif action == 'unfreeze':
                    user.status = 'active'
                    affected_count += 1

                elif action == 'block_trading':
                    user.status = 'trade_blocked'
                    status = UserStatus(
                        user_id=user.id,
                        status_type='trade_block',
                        reason=params.get('reason', 'Bulk trade block'),
                        created_by=current_user_id
                    )
                    db.session.add(status)
                    affected_count += 1

                elif action == 'unblock_trading':
                    if user.status == 'trade_blocked':
                        user.status = 'active'
                    affected_count += 1

                elif action == 'send_notification':
                    # Create notification record
                    notification = AdminNotification(
                        user_id=user.id,
                        title=params.get('title', 'Notification'),
                        message=params.get('message', ''),
                        notification_type='push',
                        created_by=current_user_id
                    )
                    db.session.add(notification)
                    # Actually send push notification
                    PushNotificationService.send_to_user(
                        user_id=user.id,
                        notification_type='system_announcement',
                        title=params.get('title', 'Notification'),
                        body=params.get('message', ''),
                        save_log=True
                    )
                    affected_count += 1

                elif action == 'send_email':
                    # Send email notification
                    email_html = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #3B82F6; padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">{params.get('title', 'Notification')}</h1>
                        </div>
                        <div style="padding: 30px;">
                            <p>{params.get('message', '')}</p>
                        </div>
                    </body>
                    </html>
                    """
                    EmailService.send(user.email, params.get('title', 'TradeSense Notification'), email_html)
                    affected_count += 1

            except Exception as e:
                logger.error(f"Error processing user {user.id}: {str(e)}")
                continue

        db.session.commit()

        logger.info(f"Bulk action '{action}' executed on {affected_count} users by admin {current_user_id}")

        return jsonify({
            'success': True,
            'message': f'{action} completed for {affected_count} users',
            'affected_count': affected_count
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Bulk action error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ==================== USER CONTROL ====================

@superadmin_advanced_bp.route('/users/search', methods=['GET'])
@superadmin_required
def search_users():
    """Search users by username, email, or ID"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'users': []})

        users = User.query.filter(
            db.or_(
                User.username.ilike(f'%{query}%'),
                User.email.ilike(f'%{query}%'),
                User.id == query if query.isdigit() else False
            )
        ).limit(20).all()

        return jsonify({
            'users': [{
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'status': u.status or 'active',
                'role': u.role,
                'created_at': u.created_at.isoformat() if u.created_at else None,
                'last_login': u.last_login.isoformat() if hasattr(u, 'last_login') and u.last_login else None,
                'has_2fa': getattr(u, 'two_factor_enabled', False),
                'email_verified': getattr(u, 'email_verified', True)
            } for u in users]
        })

    except Exception as e:
        logger.error(f"User search error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/details', methods=['GET'])
@superadmin_required
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'status': user.status or 'active',
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None,
            'has_2fa': getattr(user, 'two_factor_enabled', False),
            'email_verified': getattr(user, 'email_verified', True),
            'phone': getattr(user, 'phone', None),
            'country': getattr(user, 'country', None)
        })

    except Exception as e:
        logger.error(f"Get user details error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/password', methods=['PUT'])
@superadmin_required
def change_user_password(user_id):
    """Change user's password"""
    try:
        data = request.get_json()
        new_password = data.get('password')

        if not new_password or len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.set_password(new_password)
        db.session.commit()

        logger.info(f"Password changed for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Change password error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/username', methods=['PUT'])
@superadmin_required
def change_user_username(user_id):
    """Change user's username"""
    try:
        data = request.get_json()
        new_username = data.get('username')

        if not new_username or len(new_username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400

        # Check if username is already taken
        existing = User.query.filter(User.username == new_username, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Username is already taken'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        old_username = user.username
        user.username = new_username
        db.session.commit()

        logger.info(f"Username changed for user {user_id} from '{old_username}' to '{new_username}' by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Username changed successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Change username error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/email', methods=['PUT'])
@superadmin_required
def change_user_email(user_id):
    """Change user's email"""
    try:
        data = request.get_json()
        new_email = data.get('email')

        if not new_email or '@' not in new_email:
            return jsonify({'error': 'Invalid email address'}), 400

        # Check if email is already taken
        existing = User.query.filter(User.email == new_email, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Email is already taken'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        old_email = user.email
        user.email = new_email
        db.session.commit()

        logger.info(f"Email changed for user {user_id} from '{old_email}' to '{new_email}' by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Email changed successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Change email error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/reset-2fa', methods=['POST'])
@superadmin_required
def reset_user_2fa(user_id):
    """Reset user's two-factor authentication"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if hasattr(user, 'two_factor_enabled'):
            user.two_factor_enabled = False
        if hasattr(user, 'two_factor_secret'):
            user.two_factor_secret = None
        if hasattr(user, 'backup_codes'):
            user.backup_codes = None

        db.session.commit()

        logger.info(f"2FA reset for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': '2FA has been reset'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Reset 2FA error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/verify-email', methods=['POST'])
@superadmin_required
def verify_user_email(user_id):
    """Manually verify user's email"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if hasattr(user, 'email_verified'):
            user.email_verified = True
        if hasattr(user, 'email_verified_at'):
            user.email_verified_at = datetime.utcnow()

        db.session.commit()

        logger.info(f"Email verified for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Email has been verified'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Verify email error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/revoke-sessions', methods=['POST'])
@superadmin_required
def revoke_user_sessions(user_id):
    """Revoke all user sessions"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Increment token version to invalidate all existing tokens
        if hasattr(user, 'token_version'):
            user.token_version = (user.token_version or 0) + 1

        db.session.commit()

        logger.info(f"Sessions revoked for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'All sessions have been revoked'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Revoke sessions error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/unlock', methods=['POST'])
@superadmin_required
def unlock_user_account(user_id):
    """Unlock user account"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.status = 'active'
        if hasattr(user, 'failed_login_attempts'):
            user.failed_login_attempts = 0
        if hasattr(user, 'locked_until'):
            user.locked_until = None

        db.session.commit()

        logger.info(f"Account unlocked for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Account has been unlocked'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Unlock account error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/users/<int:user_id>/reset-failed-logins', methods=['POST'])
@superadmin_required
def reset_failed_logins(user_id):
    """Reset failed login attempts counter"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if hasattr(user, 'failed_login_attempts'):
            user.failed_login_attempts = 0

        db.session.commit()

        logger.info(f"Failed login attempts reset for user {user_id} by admin {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Failed login attempts have been reset'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Reset failed logins error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ==================== NOTIFICATIONS ====================

@superadmin_advanced_bp.route('/notifications/send', methods=['POST'])
@superadmin_required
def send_notification():
    """Send notification to users"""
    try:
        data = request.get_json()
        notification_type = data.get('type', 'push')
        target_type = data.get('targetType', 'all')
        target_user_ids = data.get('targetUserIds', [])
        title = data.get('title')
        message = data.get('message')
        category = data.get('category', 'general')
        priority = data.get('priority', 'normal')
        action_url = data.get('actionUrl')
        scheduled_at = data.get('scheduledAt')

        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400

        current_user_id = get_jwt_identity()

        # Determine target users
        if target_type == 'specific':
            users = User.query.filter(User.id.in_(target_user_ids)).all()
        elif target_type == 'active':
            # Users who logged in within last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            users = User.query.filter(
                User.role == 'user',
                User.last_login >= week_ago if hasattr(User, 'last_login') else True
            ).all()
        elif target_type == 'inactive':
            # Users who haven't logged in for 30+ days
            month_ago = datetime.utcnow() - timedelta(days=30)
            users = User.query.filter(
                User.role == 'user',
                User.last_login < month_ago if hasattr(User, 'last_login') else True
            ).all()
        elif target_type == 'new_users':
            # Users registered in last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            users = User.query.filter(
                User.role == 'user',
                User.created_at >= week_ago
            ).all()
        else:
            # All users
            users = User.query.filter(User.role == 'user').all()

        # Create notification records
        notifications_created = 0
        for user in users:
            notification = AdminNotification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                category=category,
                priority=priority,
                action_url=action_url,
                scheduled_at=datetime.fromisoformat(scheduled_at) if scheduled_at else None,
                created_by=current_user_id
            )
            db.session.add(notification)
            notifications_created += 1

        db.session.commit()

        # Actually send notifications
        push_sent = 0
        email_sent = 0

        for user in users:
            try:
                # Send push notification
                if notification_type in ['push', 'both']:
                    result = PushNotificationService.send_to_user(
                        user_id=user.id,
                        notification_type='system_announcement' if category == 'general' else category,
                        title=title,
                        body=message,
                        data={
                            'category': category,
                            'priority': priority,
                            'action_url': action_url
                        },
                        save_log=True
                    )
                    if result.get('sent'):
                        push_sent += 1

                # Send email notification
                if notification_type in ['email', 'both']:
                    # Build email HTML
                    email_html = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">{title}</h1>
                        </div>
                        <div style="padding: 30px;">
                            <p>{message}</p>
                            {'<p><a href="' + action_url + '" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Learn More</a></p>' if action_url else ''}
                            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
                                You received this message from TradeSense admin team.
                            </p>
                        </div>
                    </body>
                    </html>
                    """
                    if EmailService.send(user.email, title, email_html):
                        email_sent += 1

            except Exception as e:
                logger.warning(f"Error sending notification to user {user.id}: {e}")
                continue

        logger.info(f"Notification sent to {notifications_created} users (push: {push_sent}, email: {email_sent}) by admin {current_user_id}")

        return jsonify({
            'success': True,
            'message': f'Notification sent to {notifications_created} users (push: {push_sent}, email: {email_sent})',
            'recipients': notifications_created,
            'push_sent': push_sent,
            'email_sent': email_sent
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Send notification error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/notifications/history', methods=['GET'])
@superadmin_required
def get_notification_history():
    """Get notification history"""
    try:
        notification_type = request.args.get('type')
        status = request.args.get('status')
        date_from = request.args.get('dateFrom')
        date_to = request.args.get('dateTo')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))

        query = AdminNotification.query

        if notification_type:
            query = query.filter(AdminNotification.notification_type == notification_type)
        if status:
            query = query.filter(AdminNotification.status == status)
        if date_from:
            query = query.filter(AdminNotification.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(AdminNotification.created_at <= datetime.fromisoformat(date_to))

        # Group by title and created_at to get unique notifications
        # For simplicity, just get all and count
        notifications = query.order_by(AdminNotification.created_at.desc()).limit(limit).offset((page - 1) * limit).all()

        return jsonify({
            'notifications': [{
                'id': n.id,
                'type': n.notification_type,
                'title': n.title,
                'message': n.message,
                'target': 'all',  # Simplified
                'recipients': 1,  # Would need aggregation
                'sent_at': n.created_at.isoformat() if n.created_at else None,
                'status': n.status or 'delivered',
                'category': n.category or 'general'
            } for n in notifications]
        })

    except Exception as e:
        logger.error(f"Get notification history error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@superadmin_advanced_bp.route('/notifications/<int:notification_id>', methods=['GET'])
@superadmin_required
def get_notification_detail(notification_id):
    """Get notification detail"""
    try:
        notification = AdminNotification.query.get(notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404

        return jsonify({
            'id': notification.id,
            'type': notification.notification_type,
            'title': notification.title,
            'message': notification.message,
            'category': notification.category,
            'priority': notification.priority,
            'action_url': notification.action_url,
            'status': notification.status,
            'created_at': notification.created_at.isoformat() if notification.created_at else None,
            'sent_at': notification.sent_at.isoformat() if notification.sent_at else None
        })

    except Exception as e:
        logger.error(f"Get notification detail error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ==================== DATA EXPORT ====================

@superadmin_advanced_bp.route('/export/users', methods=['GET'])
@superadmin_required
def export_users():
    """Export users data"""
    try:
        format_type = request.args.get('format', 'json')
        role = request.args.get('role', '')
        status = request.args.get('status', '')
        date_from = request.args.get('dateFrom', '')
        date_to = request.args.get('dateTo', '')

        query = User.query

        # Apply filters
        if role:
            query = query.filter(User.role == role)
        if status and hasattr(User, 'status'):
            query = query.filter(User.status == status)
        if date_from:
            query = query.filter(User.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(User.created_at <= datetime.fromisoformat(date_to))

        users = query.order_by(User.created_at.desc()).all()

        # Build export data
        export_data = [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'email_verified': getattr(u, 'email_verified', False),
            'created_at': u.created_at.isoformat() if u.created_at else None,
            'referral_code': getattr(u, 'referral_code', None),
            'referred_by_code': getattr(u, 'referred_by_code', None)
        } for u in users]

        logger.info(f"User export requested by admin {get_jwt_identity()}: {len(export_data)} users")

        return jsonify({
            'success': True,
            'format': format_type,
            'count': len(export_data),
            'data': export_data
        })

    except Exception as e:
        logger.error(f"Export users error: {str(e)}")
        return jsonify({'error': str(e)}), 500
