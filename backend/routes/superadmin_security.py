"""
SuperAdmin Security Routes
Routes for managing admin users, audit logs, login monitoring, and blocked IPs
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, BlockedIP, AuditLog, UserActivity
from middleware.auth_middleware import superadmin_required
from datetime import datetime, timedelta
from sqlalchemy import func, or_, desc, and_

superadmin_security_bp = Blueprint('superadmin_security', __name__, url_prefix='/api/superadmin')


# ==================== ADMIN MANAGEMENT ====================

@superadmin_security_bp.route('/admins', methods=['GET'])
@jwt_required()
@superadmin_required
def get_admins():
    """Get all admin users"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')

        # Build query
        query = User.query.filter(User.role.in_(['admin', 'superadmin']))

        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )

        # Apply role filter
        if role:
            query = query.filter(User.role == role)

        # Get total count
        total = query.count()

        # Apply pagination
        admins = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stats = {
            'totalAdmins': User.query.filter(User.role.in_(['admin', 'superadmin'])).count(),
            'superAdmins': User.query.filter_by(role='superadmin').count(),
            'activeToday': User.query.filter(
                User.role.in_(['admin', 'superadmin']),
                User.last_login >= today_start
            ).count() if hasattr(User, 'last_login') else 0,
            'pendingActions': 0  # Would track pending approvals
        }

        return jsonify({
            'admins': [{
                'id': a.id,
                'username': a.username,
                'email': a.email,
                'role': a.role,
                'status': 'active',  # Default to active (User model doesn't have is_active)
                'last_login': None,  # User model doesn't track last_login yet
                'created_at': a.created_at.isoformat() if a.created_at else None,
                'actions_today': 0,  # Would count from audit logs
                'permissions': ['all'] if a.role == 'superadmin' else ['users', 'tickets', 'challenges']
            } for a in admins],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/admins/<int:user_id>/promote', methods=['POST'])
@jwt_required()
@superadmin_required
def promote_to_admin(user_id):
    """Promote a user to admin"""
    try:
        user = User.query.get_or_404(user_id)

        if user.role in ['admin', 'superadmin']:
            return jsonify({'error': 'User is already an admin'}), 400

        user.role = 'admin'
        db.session.commit()

        # Log the action
        log_audit_action('admin.promote', user_id, f'Promoted {user.username} to admin')

        return jsonify({
            'message': f'{user.username} has been promoted to admin',
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/admins/<int:user_id>/demote', methods=['POST'])
@jwt_required()
@superadmin_required
def demote_admin(user_id):
    """Demote an admin to regular user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        if user.id == current_user_id:
            return jsonify({'error': 'Cannot demote yourself'}), 400

        if user.role == 'superadmin':
            return jsonify({'error': 'Cannot demote a superadmin'}), 400

        if user.role != 'admin':
            return jsonify({'error': 'User is not an admin'}), 400

        user.role = 'user'
        db.session.commit()

        # Log the action
        log_audit_action('admin.demote', user_id, f'Demoted {user.username} to regular user')

        return jsonify({
            'message': f'{user.username} has been demoted to regular user',
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/admins/<int:admin_id>/activity', methods=['GET'])
@jwt_required()
@superadmin_required
def get_admin_activity(admin_id):
    """Get activity log for a specific admin"""
    try:
        limit = request.args.get('limit', 20, type=int)

        # Get audit logs for this admin
        activities = AuditLog.query.filter_by(actor_id=admin_id).order_by(
            desc(AuditLog.created_at)
        ).limit(limit).all() if hasattr(AuditLog, 'actor_id') else []

        return jsonify({
            'activities': [{
                'id': a.id,
                'action': a.action,
                'target': a.target_id,
                'description': a.description,
                'created_at': a.created_at.isoformat() if a.created_at else None
            } for a in activities]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/admins/activity', methods=['GET'])
@jwt_required()
@superadmin_required
def get_all_admin_activities():
    """Get activity log for all admins"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)

        # Get all admin audit logs
        query = AuditLog.query.order_by(desc(AuditLog.created_at))
        total = query.count()
        activities = query.offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            'activities': [{
                'id': a.id,
                'actor': {
                    'id': a.actor_id,
                    'username': User.query.get(a.actor_id).username if a.actor_id else 'system'
                } if hasattr(a, 'actor_id') else None,
                'action': a.action,
                'target': a.target_id if hasattr(a, 'target_id') else None,
                'description': a.description,
                'created_at': a.created_at.isoformat() if a.created_at else None
            } for a in activities],
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== AUDIT LOGS ====================

@superadmin_security_bp.route('/security/audit-logs', methods=['GET'])
@jwt_required()
@superadmin_required
def get_audit_logs():
    """Get audit logs with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', '')
        action = request.args.get('action', '')
        severity = request.args.get('severity', '')
        date_from = request.args.get('dateFrom', '')
        date_to = request.args.get('dateTo', '')

        # Build query
        query = AuditLog.query

        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    AuditLog.description.ilike(f'%{search}%'),
                    AuditLog.action.ilike(f'%{search}%')
                )
            )

        # Apply action filter
        if action:
            query = query.filter(AuditLog.action == action)

        # Apply severity filter
        if severity and hasattr(AuditLog, 'severity'):
            query = query.filter(AuditLog.severity == severity)

        # Apply date filters
        if date_from:
            query = query.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(AuditLog.created_at <= datetime.fromisoformat(date_to))

        # Get total count
        total = query.count()

        # Apply pagination
        logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        stats = {
            'totalLogs': AuditLog.query.count(),
            'criticalEvents': AuditLog.query.filter_by(severity='critical').count() if hasattr(AuditLog, 'severity') else 0,
            'warningEvents': AuditLog.query.filter_by(severity='warning').count() if hasattr(AuditLog, 'severity') else 0,
            'infoEvents': AuditLog.query.filter_by(severity='info').count() if hasattr(AuditLog, 'severity') else 0
        }

        import json as json_lib
        return jsonify({
            'logs': [{
                'id': log.id,
                'timestamp': log.created_at.isoformat() if log.created_at else None,
                'actor': {
                    'id': log.user_id or 0,
                    'username': log.username or 'system',
                    'role': User.query.get(log.user_id).role if log.user_id else 'system'
                },
                'action': log.action,
                'action_type': log.action_type,
                'target': {
                    'type': log.target_type or 'unknown',
                    'id': log.target_id,
                    'name': log.target_name or str(log.target_id) if log.target_id else None
                },
                'description': log.description,
                'ip_address': log.ip_address or 'unknown',
                'status': log.status or 'info',
                'extra_data': json_lib.loads(log.extra_data) if log.extra_data else {}
            } for log in logs],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== LOGIN MONITORING ====================

@superadmin_security_bp.route('/security/login-activity', methods=['GET'])
@jwt_required()
@superadmin_required
def get_login_activity():
    """Get login activity logs"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        date_range = request.args.get('dateRange', '24h')

        # Build query for login activities
        query = UserActivity.query.filter(
            UserActivity.action.in_(['login', 'logout', 'login_failed', 'login_blocked'])
        )

        # Apply search filter
        if search:
            query = query.join(User).filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    UserActivity.ip_address.ilike(f'%{search}%')
                )
            )

        # Apply status filter
        if status:
            if status == 'success':
                query = query.filter(UserActivity.action == 'login')
            elif status == 'failed':
                query = query.filter(UserActivity.action == 'login_failed')
            elif status == 'blocked':
                query = query.filter(UserActivity.action == 'login_blocked')

        # Apply date range filter
        if date_range:
            now = datetime.utcnow()
            if date_range == '1h':
                start_date = now - timedelta(hours=1)
            elif date_range == '24h':
                start_date = now - timedelta(hours=24)
            elif date_range == '7d':
                start_date = now - timedelta(days=7)
            elif date_range == '30d':
                start_date = now - timedelta(days=30)
            else:
                start_date = None

            if start_date:
                query = query.filter(UserActivity.created_at >= start_date)

        # Get total count
        total = query.count()

        # Apply pagination
        attempts = query.order_by(desc(UserActivity.created_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stats = {
            'totalLogins': UserActivity.query.filter(
                UserActivity.action.in_(['login', 'login_failed', 'login_blocked']),
                UserActivity.created_at >= today_start
            ).count(),
            'successfulLogins': UserActivity.query.filter(
                UserActivity.action == 'login',
                UserActivity.created_at >= today_start
            ).count(),
            'failedLogins': UserActivity.query.filter(
                UserActivity.action == 'login_failed',
                UserActivity.created_at >= today_start
            ).count(),
            'suspiciousAttempts': 0,  # Would track based on patterns
            'uniqueIPs': db.session.query(func.count(func.distinct(UserActivity.ip_address))).filter(
                UserActivity.created_at >= today_start
            ).scalar() or 0
        }

        return jsonify({
            'attempts': [{
                'id': a.id,
                'user': {
                    'id': a.user.id if a.user else None,
                    'username': a.user.username if a.user else 'unknown',
                    'email': a.user.email if a.user else None
                },
                'status': 'success' if a.action == 'login' else 'failed' if a.action == 'login_failed' else 'blocked',
                'ip_address': a.ip_address,
                'location': {
                    'country': a.metadata.get('country', 'Unknown') if a.metadata else 'Unknown',
                    'city': a.metadata.get('city', 'Unknown') if a.metadata else 'Unknown'
                } if hasattr(a, 'metadata') else {'country': 'Unknown', 'city': 'Unknown'},
                'device': a.user_agent,
                'timestamp': a.created_at.isoformat() if a.created_at else None,
                'suspicious': False,  # Would analyze patterns
                'reason': a.metadata.get('reason') if hasattr(a, 'metadata') and a.metadata else None
            } for a in attempts],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== BLOCKED IPs ====================

@superadmin_security_bp.route('/security/blocked-ips', methods=['GET'])
@jwt_required()
@superadmin_required
def get_blocked_ips():
    """Get all blocked IP addresses"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')

        # Build query
        query = BlockedIP.query

        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    BlockedIP.ip_address.ilike(f'%{search}%'),
                    BlockedIP.reason.ilike(f'%{search}%')
                )
            )

        # Get total count
        total = query.count()

        # Apply pagination
        blocked_ips = query.order_by(desc(BlockedIP.blocked_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        now = datetime.utcnow()
        stats = {
            'totalBlocked': BlockedIP.query.count(),
            'permanent': BlockedIP.query.filter(BlockedIP.expires_at.is_(None)).count(),
            'temporary': BlockedIP.query.filter(BlockedIP.expires_at.isnot(None)).count(),
            'expiringSoon': BlockedIP.query.filter(
                BlockedIP.expires_at.isnot(None),
                BlockedIP.expires_at <= now + timedelta(hours=24),
                BlockedIP.expires_at > now
            ).count()
        }

        return jsonify({
            'blocked_ips': [{
                'id': ip.id,
                'ip_address': ip.ip_address,
                'reason': ip.reason,
                'block_type': ip.block_type,
                'blocked_by': {
                    'id': ip.blocked_by,
                    'username': User.query.get(ip.blocked_by).username if ip.blocked_by else 'system'
                },
                'blocked_at': ip.blocked_at.isoformat() if ip.blocked_at else None,
                'expires_at': ip.expires_at.isoformat() if ip.expires_at else None,
                'permanent': ip.expires_at is None,
                'blocked_requests_count': ip.blocked_requests_count or 0
            } for ip in blocked_ips],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/security/ip-block', methods=['POST'])
@jwt_required()
@superadmin_required
def block_ip():
    """Block an IP address"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        ip_address = data.get('ip_address')
        reason = data.get('reason', 'Manual block')
        expires_at = data.get('expires_at')

        if not ip_address:
            return jsonify({'error': 'IP address is required'}), 400

        # Check if IP is already blocked
        existing = BlockedIP.query.filter_by(ip_address=ip_address).first()
        if existing:
            return jsonify({'error': 'IP is already blocked'}), 400

        # Create blocked IP record
        blocked_ip = BlockedIP(
            ip_address=ip_address,
            reason=reason,
            blocked_by_id=current_user_id,
            expires_at=datetime.fromisoformat(expires_at) if expires_at else None
        )
        db.session.add(blocked_ip)
        db.session.commit()

        # Log the action
        log_audit_action('security.ip_block', None, f'Blocked IP {ip_address}: {reason}')

        return jsonify({
            'message': f'IP {ip_address} has been blocked',
            'blocked_ip': {
                'id': blocked_ip.id,
                'ip_address': blocked_ip.ip_address,
                'reason': blocked_ip.reason,
                'permanent': blocked_ip.expires_at is None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_security_bp.route('/security/ip-block/<ip_address>', methods=['DELETE'])
@jwt_required()
@superadmin_required
def unblock_ip(ip_address):
    """Unblock an IP address"""
    try:
        blocked_ip = BlockedIP.query.filter_by(ip_address=ip_address).first()

        if not blocked_ip:
            return jsonify({'error': 'IP is not blocked'}), 404

        db.session.delete(blocked_ip)
        db.session.commit()

        # Log the action
        log_audit_action('security.ip_unblock', None, f'Unblocked IP {ip_address}')

        return jsonify({
            'message': f'IP {ip_address} has been unblocked'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== HELPER FUNCTIONS ====================

def log_audit_action(action, target_id, description, severity='info'):
    """Helper function to log audit actions"""
    try:
        current_user_id = get_jwt_identity()
        log = AuditLog(
            actor_id=current_user_id,
            action=action,
            target_id=target_id,
            description=description,
            severity=severity,
            ip_address=request.remote_addr,
            created_at=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging audit action: {e}")
