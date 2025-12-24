"""
Push Device and Notification models for web push notifications.
Supports Firebase Cloud Messaging (FCM) and Web Push API.
"""
from datetime import datetime
from enum import Enum
from models import db


class DevicePlatform(Enum):
    WEB = 'web'
    ANDROID = 'android'
    IOS = 'ios'


class NotificationType(Enum):
    TRADE_EXECUTED = 'trade_executed'
    TRADE_CLOSED = 'trade_closed'
    CHALLENGE_UPDATE = 'challenge_update'
    CHALLENGE_PASSED = 'challenge_passed'
    CHALLENGE_FAILED = 'challenge_failed'
    PAYOUT_REQUESTED = 'payout_requested'
    PAYOUT_APPROVED = 'payout_approved'
    PAYOUT_REJECTED = 'payout_rejected'
    NEW_FOLLOWER = 'new_follower'
    COPY_TRADE = 'copy_trade'
    NEW_IDEA_COMMENT = 'new_idea_comment'
    IDEA_LIKED = 'idea_liked'
    PRICE_ALERT = 'price_alert'
    SYSTEM_ANNOUNCEMENT = 'system_announcement'
    SECURITY_ALERT = 'security_alert'
    MARKETING = 'marketing'


class PushDevice(db.Model):
    """Registered push notification devices"""
    __tablename__ = 'push_devices'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Device identification
    device_token = db.Column(db.String(500), nullable=False)  # FCM token or Web Push subscription
    device_id = db.Column(db.String(100))  # Unique device identifier
    platform = db.Column(db.String(20), default=DevicePlatform.WEB.value)

    # Web Push specific (for browsers without FCM)
    endpoint = db.Column(db.Text)  # Push subscription endpoint
    p256dh_key = db.Column(db.String(200))  # Public key
    auth_key = db.Column(db.String(100))  # Auth secret

    # Device info
    device_name = db.Column(db.String(100))  # e.g., "Chrome on Windows"
    browser = db.Column(db.String(50))
    os = db.Column(db.String(50))

    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_used_at = db.Column(db.DateTime)
    failed_attempts = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('push_devices', lazy='dynamic'))

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'device_token', name='unique_user_device'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'platform': self.platform,
            'device_name': self.device_name,
            'browser': self.browser,
            'os': self.os,
            'is_active': self.is_active,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class NotificationPreference(db.Model):
    """User notification preferences"""
    __tablename__ = 'notification_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # Push notification toggles
    push_enabled = db.Column(db.Boolean, default=True)

    # Trading notifications
    trade_executed = db.Column(db.Boolean, default=True)
    trade_closed = db.Column(db.Boolean, default=True)
    price_alerts = db.Column(db.Boolean, default=True)

    # Challenge notifications
    challenge_updates = db.Column(db.Boolean, default=True)
    challenge_passed = db.Column(db.Boolean, default=True)
    challenge_failed = db.Column(db.Boolean, default=True)

    # Payout notifications
    payout_updates = db.Column(db.Boolean, default=True)

    # Social notifications
    new_follower = db.Column(db.Boolean, default=True)
    copy_trade = db.Column(db.Boolean, default=True)
    idea_interactions = db.Column(db.Boolean, default=True)

    # System notifications
    security_alerts = db.Column(db.Boolean, default=True)
    system_announcements = db.Column(db.Boolean, default=True)
    marketing = db.Column(db.Boolean, default=False)

    # Email notification toggles
    email_enabled = db.Column(db.Boolean, default=True)
    email_trade_summary = db.Column(db.Boolean, default=True)  # Daily/weekly summary
    email_marketing = db.Column(db.Boolean, default=False)
    email_digest_frequency = db.Column(db.String(20), default='daily')  # realtime, hourly, daily, weekly, never

    # Sound settings
    sound_enabled = db.Column(db.Boolean, default=True)
    sound_volume = db.Column(db.Integer, default=50)  # 0-100

    # Quiet hours (don't send push during these hours)
    quiet_hours_enabled = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.Integer, default=22)  # 10 PM
    quiet_hours_end = db.Column(db.Integer, default=8)  # 8 AM
    timezone = db.Column(db.String(50), default='UTC')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('notification_preferences', uselist=False))

    def to_dict(self):
        return {
            'push_enabled': self.push_enabled,
            'trade_executed': self.trade_executed,
            'trade_closed': self.trade_closed,
            'price_alerts': self.price_alerts,
            'challenge_updates': self.challenge_updates,
            'challenge_passed': self.challenge_passed,
            'challenge_failed': self.challenge_failed,
            'payout_updates': self.payout_updates,
            'new_follower': self.new_follower,
            'copy_trade': self.copy_trade,
            'idea_interactions': self.idea_interactions,
            'security_alerts': self.security_alerts,
            'system_announcements': self.system_announcements,
            'marketing': self.marketing,
            'email_enabled': self.email_enabled,
            'email_trade_summary': self.email_trade_summary,
            'email_marketing': self.email_marketing,
            'email_digest_frequency': self.email_digest_frequency,
            'sound_enabled': self.sound_enabled,
            'sound_volume': self.sound_volume,
            'quiet_hours_enabled': self.quiet_hours_enabled,
            'quiet_hours_start': self.quiet_hours_start,
            'quiet_hours_end': self.quiet_hours_end,
            'timezone': self.timezone
        }

    def should_send_push(self, notification_type):
        """Check if push should be sent for this notification type"""
        if not self.push_enabled:
            return False

        type_map = {
            NotificationType.TRADE_EXECUTED.value: self.trade_executed,
            NotificationType.TRADE_CLOSED.value: self.trade_closed,
            NotificationType.CHALLENGE_UPDATE.value: self.challenge_updates,
            NotificationType.CHALLENGE_PASSED.value: self.challenge_passed,
            NotificationType.CHALLENGE_FAILED.value: self.challenge_failed,
            NotificationType.PAYOUT_REQUESTED.value: self.payout_updates,
            NotificationType.PAYOUT_APPROVED.value: self.payout_updates,
            NotificationType.PAYOUT_REJECTED.value: self.payout_updates,
            NotificationType.NEW_FOLLOWER.value: self.new_follower,
            NotificationType.COPY_TRADE.value: self.copy_trade,
            NotificationType.NEW_IDEA_COMMENT.value: self.idea_interactions,
            NotificationType.IDEA_LIKED.value: self.idea_interactions,
            NotificationType.PRICE_ALERT.value: self.price_alerts,
            NotificationType.SYSTEM_ANNOUNCEMENT.value: self.system_announcements,
            NotificationType.SECURITY_ALERT.value: self.security_alerts,
            NotificationType.MARKETING.value: self.marketing
        }

        return type_map.get(notification_type, True)


class NotificationLog(db.Model):
    """Log of sent notifications for tracking and debugging"""
    __tablename__ = 'notification_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_id = db.Column(db.Integer, db.ForeignKey('push_devices.id'))

    notification_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200))
    body = db.Column(db.Text)
    data = db.Column(db.JSON)  # Additional payload

    # Delivery status
    status = db.Column(db.String(20), default='pending')  # pending, sent, delivered, failed
    error_message = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', backref=db.backref('notification_logs', lazy='dynamic'))
    device = db.relationship('PushDevice', backref=db.backref('notifications', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'notification_type': self.notification_type,
            'title': self.title,
            'body': self.body,
            'data': self.data,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }


# Helper functions
def get_user_devices(user_id, active_only=True):
    """Get all devices for a user"""
    query = PushDevice.query.filter_by(user_id=user_id)
    if active_only:
        query = query.filter_by(is_active=True)
    return query.all()


def get_or_create_preferences(user_id):
    """Get or create notification preferences for a user"""
    prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.session.add(prefs)
        db.session.commit()
    return prefs


def get_unread_count(user_id):
    """Get count of unread notifications"""
    return NotificationLog.query.filter_by(
        user_id=user_id,
        read_at=None
    ).filter(
        NotificationLog.status.in_(['sent', 'delivered'])
    ).count()
