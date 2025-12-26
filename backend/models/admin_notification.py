from datetime import datetime
from . import db
import json


class NotificationType:
    INFO = 'info'
    WARNING = 'warning'
    SUCCESS = 'success'
    URGENT = 'urgent'
    ANNOUNCEMENT = 'announcement'


class NotificationChannel:
    IN_APP = 'in_app'
    PUSH = 'push'
    EMAIL = 'email'
    ALL = 'all'


class AdminNotification(db.Model):
    """Admin-sent notifications to users"""
    __tablename__ = 'admin_notifications'
    __table_args__ = (
        db.Index('idx_admin_notif_sent_by', 'sent_by'),
        db.Index('idx_admin_notif_created', 'created_at'),
        db.Index('idx_admin_notif_type', 'target_type'),
    )

    id = db.Column(db.Integer, primary_key=True)

    # Sender
    sent_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Target
    target_type = db.Column(db.String(20), nullable=False)  # 'user', 'all', 'filtered', 'role'
    target_user_ids = db.Column(db.Text, nullable=True)  # JSON array of user IDs
    target_filters = db.Column(db.Text, nullable=True)   # JSON filters used
    target_role = db.Column(db.String(20), nullable=True)  # For role-based targeting

    # Content
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default=NotificationType.INFO)

    # Optional action
    action_url = db.Column(db.String(500), nullable=True)
    action_text = db.Column(db.String(100), nullable=True)

    # Channel
    channel = db.Column(db.String(20), default=NotificationChannel.IN_APP)

    # Scheduling
    scheduled_at = db.Column(db.DateTime, nullable=True)  # NULL = send immediately
    sent_at = db.Column(db.DateTime, nullable=True)
    is_sent = db.Column(db.Boolean, default=False)

    # Stats
    sent_count = db.Column(db.Integer, default=0)
    delivered_count = db.Column(db.Integer, default=0)
    read_count = db.Column(db.Integer, default=0)
    clicked_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    sender = db.relationship('User', foreign_keys=[sent_by])

    def get_target_user_ids(self):
        """Get list of target user IDs"""
        if self.target_user_ids:
            return json.loads(self.target_user_ids)
        return []

    def set_target_user_ids(self, user_ids):
        """Set target user IDs"""
        self.target_user_ids = json.dumps(user_ids)

    def get_target_filters(self):
        """Get target filters"""
        if self.target_filters:
            return json.loads(self.target_filters)
        return {}

    def set_target_filters(self, filters):
        """Set target filters"""
        self.target_filters = json.dumps(filters)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'sent_by': self.sent_by,
            'sender_name': self.sender.username if self.sender else None,
            'target_type': self.target_type,
            'target_user_ids': self.get_target_user_ids(),
            'target_filters': self.get_target_filters(),
            'target_role': self.target_role,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'action_url': self.action_url,
            'action_text': self.action_text,
            'channel': self.channel,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'is_sent': self.is_sent,
            'sent_count': self.sent_count,
            'delivered_count': self.delivered_count,
            'read_count': self.read_count,
            'clicked_count': self.clicked_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AdminNotification {self.id} to {self.target_type}>'


class NotificationTemplate(db.Model):
    """Reusable notification templates"""
    __tablename__ = 'notification_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default=NotificationType.INFO)
    channel = db.Column(db.String(20), default=NotificationChannel.IN_APP)

    # Variables in template (e.g., {{username}}, {{amount}})
    variables = db.Column(db.Text, nullable=True)  # JSON array of variable names

    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_variables(self):
        """Get template variables"""
        if self.variables:
            return json.loads(self.variables)
        return []

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'channel': self.channel,
            'variables': self.get_variables(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def create_admin_notification(sent_by_id, title, message, target_type='all',
                              target_user_ids=None, target_filters=None, target_role=None,
                              notification_type=NotificationType.INFO,
                              channel=NotificationChannel.IN_APP,
                              action_url=None, action_text=None,
                              scheduled_at=None):
    """Create a new admin notification"""
    notification = AdminNotification(
        sent_by=sent_by_id,
        title=title,
        message=message,
        target_type=target_type,
        target_role=target_role,
        notification_type=notification_type,
        channel=channel,
        action_url=action_url,
        action_text=action_text,
        scheduled_at=scheduled_at
    )

    if target_user_ids:
        notification.set_target_user_ids(target_user_ids)
    if target_filters:
        notification.set_target_filters(target_filters)

    db.session.add(notification)
    db.session.commit()
    return notification


def get_notification_history(page=1, per_page=20, sent_by=None):
    """Get notification history with pagination"""
    query = AdminNotification.query.order_by(AdminNotification.created_at.desc())

    if sent_by:
        query = query.filter_by(sent_by=sent_by)

    return query.paginate(page=page, per_page=per_page, error_out=False)
