"""
Audit Log Routes for TradeSense Admin

Provides endpoints for viewing and exporting audit logs.
"""

import csv
import io
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, AuditLog, User

audit_bp = Blueprint('audit', __name__, url_prefix='/api/admin/audit')


def admin_required(f):
    """Decorator to require admin or superadmin role"""
    from functools import wraps

    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403

        return f(*args, **kwargs)
    return decorated_function


@audit_bp.route('', methods=['GET'])
@admin_required
def get_audit_logs():
    """
    Get paginated audit logs with filtering.

    Query params:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 50, max: 100)
    - user_id: Filter by user ID
    - action_type: Filter by action type (AUTH, TRADE, PAYOUT, etc.)
    - action: Filter by specific action
    - status: Filter by status (success, failure, warning)
    - start_date: Filter from date (ISO format)
    - end_date: Filter to date (ISO format)
    - search: Search in username, description, IP, etc.
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)

    user_id = request.args.get('user_id', type=int)
    action_type = request.args.get('action_type')
    action = request.args.get('action')
    status = request.args.get('status')
    search = request.args.get('search')

    start_date = None
    end_date = None

    if request.args.get('start_date'):
        try:
            start_date = datetime.fromisoformat(request.args.get('start_date').replace('Z', '+00:00'))
        except ValueError:
            pass

    if request.args.get('end_date'):
        try:
            end_date = datetime.fromisoformat(request.args.get('end_date').replace('Z', '+00:00'))
        except ValueError:
            pass

    logs, total = AuditLog.get_logs(
        user_id=user_id,
        action_type=action_type,
        action=action,
        status=status,
        start_date=start_date,
        end_date=end_date,
        page=page,
        per_page=per_page,
        search=search
    )

    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }), 200


@audit_bp.route('/stats', methods=['GET'])
@admin_required
def get_audit_stats():
    """Get audit log statistics"""
    # Time range
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Total counts
    total_logs = AuditLog.query.count()
    today_logs = AuditLog.query.filter(AuditLog.created_at >= today).count()
    week_logs = AuditLog.query.filter(AuditLog.created_at >= week_ago).count()

    # By action type
    action_type_stats = db.session.query(
        AuditLog.action_type,
        db.func.count(AuditLog.id)
    ).group_by(AuditLog.action_type).all()

    # By status
    status_stats = db.session.query(
        AuditLog.status,
        db.func.count(AuditLog.id)
    ).group_by(AuditLog.status).all()

    # Recent security events
    security_events = AuditLog.query.filter(
        AuditLog.action_type.in_([AuditLog.ACTION_TYPE_AUTH, AuditLog.ACTION_TYPE_SECURITY]),
        AuditLog.status != 'success',
        AuditLog.created_at >= week_ago
    ).count()

    # Most active users (last 7 days)
    active_users = db.session.query(
        AuditLog.user_id,
        AuditLog.username,
        db.func.count(AuditLog.id).label('action_count')
    ).filter(
        AuditLog.created_at >= week_ago,
        AuditLog.user_id.isnot(None)
    ).group_by(
        AuditLog.user_id, AuditLog.username
    ).order_by(
        db.desc('action_count')
    ).limit(10).all()

    return jsonify({
        'total_logs': total_logs,
        'today_logs': today_logs,
        'week_logs': week_logs,
        'by_action_type': {at: count for at, count in action_type_stats},
        'by_status': {status: count for status, count in status_stats},
        'security_warnings': security_events,
        'most_active_users': [
            {'user_id': u[0], 'username': u[1], 'actions': u[2]}
            for u in active_users
        ]
    }), 200


@audit_bp.route('/user/<int:user_id>', methods=['GET'])
@admin_required
def get_user_audit_logs(user_id):
    """Get audit logs for a specific user"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)

    logs, total = AuditLog.get_logs(
        user_id=user_id,
        page=page,
        per_page=per_page
    )

    return jsonify({
        'logs': [log.to_dict() for log in logs],
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200


@audit_bp.route('/export', methods=['GET'])
@admin_required
def export_audit_logs():
    """
    Export audit logs to CSV.

    Query params same as get_audit_logs, plus:
    - format: Export format (csv only for now)
    """
    # Get filters
    user_id = request.args.get('user_id', type=int)
    action_type = request.args.get('action_type')
    action = request.args.get('action')
    status = request.args.get('status')
    search = request.args.get('search')

    start_date = None
    end_date = None

    if request.args.get('start_date'):
        try:
            start_date = datetime.fromisoformat(request.args.get('start_date').replace('Z', '+00:00'))
        except ValueError:
            pass

    if request.args.get('end_date'):
        try:
            end_date = datetime.fromisoformat(request.args.get('end_date').replace('Z', '+00:00'))
        except ValueError:
            pass

    # Get all matching logs (up to 10000)
    logs, _ = AuditLog.get_logs(
        user_id=user_id,
        action_type=action_type,
        action=action,
        status=status,
        start_date=start_date,
        end_date=end_date,
        page=1,
        per_page=10000,
        search=search
    )

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        'ID', 'Timestamp', 'User ID', 'Username', 'Action Type', 'Action',
        'Target Type', 'Target ID', 'Target Name', 'IP Address',
        'Description', 'Status', 'Error Message'
    ])

    # Data
    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat() if log.created_at else '',
            log.user_id or '',
            log.username or '',
            log.action_type,
            log.action,
            log.target_type or '',
            log.target_id or '',
            log.target_name or '',
            log.ip_address or '',
            log.description or '',
            log.status,
            log.error_message or ''
        ])

    output.seek(0)

    # Generate filename with timestamp
    filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename={filename}',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )


@audit_bp.route('/action-types', methods=['GET'])
@admin_required
def get_action_types():
    """Get list of all action types and actions for filtering"""
    action_types = db.session.query(
        AuditLog.action_type
    ).distinct().all()

    actions = db.session.query(
        AuditLog.action_type,
        AuditLog.action
    ).distinct().all()

    # Group actions by type
    actions_by_type = {}
    for action_type, action in actions:
        if action_type not in actions_by_type:
            actions_by_type[action_type] = []
        actions_by_type[action_type].append(action)

    return jsonify({
        'action_types': [at[0] for at in action_types],
        'actions_by_type': actions_by_type
    }), 200


@audit_bp.route('/cleanup', methods=['POST'])
@admin_required
def cleanup_old_logs():
    """Delete old audit logs (superadmin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Superadmin access required'}), 403

    data = request.get_json()
    days = data.get('days', 90)

    if days < 30:
        return jsonify({'error': 'Cannot delete logs newer than 30 days'}), 400

    deleted = AuditLog.cleanup_old_logs(days)

    # Log the cleanup action
    from services.audit_service import AuditService
    AuditService.log_settings_update(
        admin_user_id=current_user_id,
        admin_username=user.username,
        setting_name='audit_log_cleanup',
        old_value=None,
        new_value={'deleted_count': deleted, 'older_than_days': days}
    )

    return jsonify({
        'message': f'Deleted {deleted} audit logs older than {days} days',
        'deleted_count': deleted
    }), 200
