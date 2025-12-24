"""
Push Notifications routes for device registration and notification management.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import db
from models.push_device import (
    PushDevice, NotificationPreference, NotificationLog,
    DevicePlatform, get_user_devices, get_or_create_preferences, get_unread_count
)
from services.push_notification_service import PushNotificationService

push_bp = Blueprint('push', __name__, url_prefix='/api/notifications')


# ============== Device Registration ==============

@push_bp.route('/devices', methods=['GET'])
@jwt_required()
def get_devices():
    """Get all registered devices for the current user"""
    current_user_id = get_jwt_identity()

    devices = PushDevice.query.filter_by(user_id=current_user_id).all()

    return jsonify({
        'success': True,
        'devices': [d.to_dict() for d in devices]
    })


@push_bp.route('/devices/register', methods=['POST'])
@jwt_required()
def register_device():
    """Register a device for push notifications"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('device_token') and not data.get('subscription'):
        return jsonify({'error': 'Device token or subscription required'}), 400

    # Check if device already exists
    device_token = data.get('device_token') or data.get('subscription', {}).get('endpoint', '')[:500]

    existing = PushDevice.query.filter_by(
        user_id=current_user_id,
        device_token=device_token
    ).first()

    if existing:
        # Update existing device
        existing.is_active = True
        existing.last_used_at = datetime.utcnow()
        existing.failed_attempts = 0

        if data.get('device_name'):
            existing.device_name = data['device_name']
        if data.get('browser'):
            existing.browser = data['browser']
        if data.get('os'):
            existing.os = data['os']

        # Update Web Push keys if provided
        if data.get('subscription'):
            sub = data['subscription']
            existing.endpoint = sub.get('endpoint')
            if sub.get('keys'):
                existing.p256dh_key = sub['keys'].get('p256dh')
                existing.auth_key = sub['keys'].get('auth')

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Device updated',
            'device': existing.to_dict()
        })

    # Create new device
    device = PushDevice(
        user_id=current_user_id,
        device_token=device_token,
        device_id=data.get('device_id'),
        platform=data.get('platform', DevicePlatform.WEB.value),
        device_name=data.get('device_name'),
        browser=data.get('browser'),
        os=data.get('os'),
        last_used_at=datetime.utcnow()
    )

    # Web Push subscription
    if data.get('subscription'):
        sub = data['subscription']
        device.endpoint = sub.get('endpoint')
        if sub.get('keys'):
            device.p256dh_key = sub['keys'].get('p256dh')
            device.auth_key = sub['keys'].get('auth')

    db.session.add(device)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Device registered',
        'device': device.to_dict()
    }), 201


@push_bp.route('/devices/<int:device_id>', methods=['DELETE'])
@jwt_required()
def unregister_device(device_id):
    """Unregister a device"""
    current_user_id = get_jwt_identity()

    device = PushDevice.query.filter_by(
        id=device_id,
        user_id=current_user_id
    ).first()

    if not device:
        return jsonify({'error': 'Device not found'}), 404

    db.session.delete(device)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Device unregistered'
    })


@push_bp.route('/devices/<int:device_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_device(device_id):
    """Deactivate a device (stop sending notifications)"""
    current_user_id = get_jwt_identity()

    device = PushDevice.query.filter_by(
        id=device_id,
        user_id=current_user_id
    ).first()

    if not device:
        return jsonify({'error': 'Device not found'}), 404

    device.is_active = False
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Device deactivated'
    })


# ============== Notification Preferences ==============

@push_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get notification preferences"""
    current_user_id = get_jwt_identity()

    prefs = get_or_create_preferences(current_user_id)

    return jsonify({
        'success': True,
        'preferences': prefs.to_dict()
    })


@push_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """Update notification preferences"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    prefs = get_or_create_preferences(current_user_id)

    # Updatable fields
    updatable = [
        'push_enabled', 'trade_executed', 'trade_closed', 'price_alerts',
        'challenge_updates', 'challenge_passed', 'challenge_failed',
        'payout_updates', 'new_follower', 'copy_trade', 'idea_interactions',
        'security_alerts', 'system_announcements', 'marketing',
        'email_enabled', 'email_trade_summary', 'email_marketing', 'email_digest_frequency',
        'sound_enabled', 'sound_volume',
        'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end', 'timezone'
    ]

    for field in updatable:
        if field in data:
            setattr(prefs, field, data[field])

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Preferences updated',
        'preferences': prefs.to_dict()
    })


# ============== Notification History ==============

@push_bp.route('/history', methods=['GET'])
@jwt_required()
def get_notification_history():
    """Get notification history"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = NotificationLog.query.filter_by(user_id=current_user_id)

    if unread_only:
        query = query.filter(NotificationLog.read_at.is_(None))

    query = query.filter(
        NotificationLog.status.in_(['sent', 'delivered'])
    ).order_by(NotificationLog.created_at.desc())

    results = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in results.items],
        'unread_count': get_unread_count(current_user_id),
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@push_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    """Mark notifications as read"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    notification_ids = data.get('notification_ids', [])

    if notification_ids:
        # Mark specific notifications as read
        NotificationLog.query.filter(
            NotificationLog.id.in_(notification_ids),
            NotificationLog.user_id == current_user_id
        ).update({NotificationLog.read_at: datetime.utcnow()}, synchronize_session=False)
    else:
        # Mark all as read
        NotificationLog.query.filter_by(
            user_id=current_user_id
        ).filter(
            NotificationLog.read_at.is_(None)
        ).update({NotificationLog.read_at: datetime.utcnow()}, synchronize_session=False)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Notifications marked as read',
        'unread_count': get_unread_count(current_user_id)
    })


@push_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_notification_count():
    """Get unread notification count"""
    current_user_id = get_jwt_identity()

    return jsonify({
        'success': True,
        'unread_count': get_unread_count(current_user_id)
    })


# ============== Test Notification ==============

@push_bp.route('/test', methods=['POST'])
@jwt_required()
def send_test_notification():
    """Send a test notification to verify setup"""
    current_user_id = get_jwt_identity()

    result = PushNotificationService.send_to_user(
        user_id=current_user_id,
        notification_type='system_announcement',
        title='Test Notification 🔔',
        body='Push notifications are working correctly!',
        data={'test': True}
    )

    return jsonify({
        'success': result.get('sent', False),
        'result': result
    })


# ============== VAPID Public Key ==============

@push_bp.route('/vapid-key', methods=['GET'])
def get_vapid_public_key():
    """Get VAPID public key for Web Push subscription"""
    import os
    vapid_public_key = os.getenv('VAPID_PUBLIC_KEY', '')

    return jsonify({
        'success': True,
        'vapid_public_key': vapid_public_key
    })
