"""
Audit Log Model for TradeSense

Tracks all important actions in the system for security and compliance.
"""

from datetime import datetime
from . import db


class AuditLog(db.Model):
    """
    Audit log entry for tracking system actions.

    Action Types:
    - AUTH: login, logout, register, password_reset, 2fa_enable, 2fa_disable
    - TRADE: trade_open, trade_close, trade_modify
    - PAYOUT: payout_request, payout_approve, payout_reject, payout_process
    - ADMIN: user_update, user_ban, user_unban, challenge_update, settings_update
    - SECURITY: session_revoke, suspicious_login, rate_limit_exceeded
    - SYSTEM: config_change, maintenance_mode
    """

    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)

    # Who performed the action
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    username = db.Column(db.String(100), nullable=True)  # Cached for when user is deleted

    # What action was performed
    action_type = db.Column(db.String(50), nullable=False, index=True)  # Category: AUTH, TRADE, PAYOUT, etc.
    action = db.Column(db.String(100), nullable=False, index=True)  # Specific action: login, trade_open, etc.

    # Target of the action (if applicable)
    target_type = db.Column(db.String(50), nullable=True)  # user, trade, challenge, payout, etc.
    target_id = db.Column(db.Integer, nullable=True, index=True)
    target_name = db.Column(db.String(200), nullable=True)  # Human-readable identifier

    # Request details
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)

    # Action details
    description = db.Column(db.Text, nullable=True)
    old_value = db.Column(db.Text, nullable=True)  # JSON string of previous state
    new_value = db.Column(db.Text, nullable=True)  # JSON string of new state
    extra_data = db.Column(db.Text, nullable=True)  # Additional JSON data

    # Result
    status = db.Column(db.String(20), default='success')  # success, failure, warning
    error_message = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))

    # Action type constants
    ACTION_TYPE_AUTH = 'AUTH'
    ACTION_TYPE_TRADE = 'TRADE'
    ACTION_TYPE_PAYOUT = 'PAYOUT'
    ACTION_TYPE_ADMIN = 'ADMIN'
    ACTION_TYPE_SECURITY = 'SECURITY'
    ACTION_TYPE_SYSTEM = 'SYSTEM'
    ACTION_TYPE_CHALLENGE = 'CHALLENGE'
    ACTION_TYPE_PAYMENT = 'PAYMENT'

    # Status constants
    STATUS_SUCCESS = 'success'
    STATUS_FAILURE = 'failure'
    STATUS_WARNING = 'warning'

    def __repr__(self):
        return f'<AuditLog {self.id}: {self.action_type}/{self.action} by user {self.user_id}>'

    def to_dict(self):
        """Convert to dictionary for API responses"""
        import json

        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'action_type': self.action_type,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_name': self.target_name,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'description': self.description,
            'old_value': json.loads(self.old_value) if self.old_value else None,
            'new_value': json.loads(self.new_value) if self.new_value else None,
            'extra_data': json.loads(self.extra_data) if self.extra_data else None,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def log(cls, action_type, action, user_id=None, username=None,
            target_type=None, target_id=None, target_name=None,
            ip_address=None, user_agent=None, description=None,
            old_value=None, new_value=None, extra_data=None,
            status='success', error_message=None):
        """
        Create a new audit log entry.

        Args:
            action_type: Category of action (AUTH, TRADE, etc.)
            action: Specific action performed
            user_id: ID of user performing the action
            username: Username (cached)
            target_type: Type of target entity
            target_id: ID of target entity
            target_name: Human-readable name of target
            ip_address: IP address of request
            user_agent: User agent string
            description: Human-readable description
            old_value: Previous state (dict, will be JSON-encoded)
            new_value: New state (dict, will be JSON-encoded)
            extra_data: Additional data (dict, will be JSON-encoded)
            status: Result status (success, failure, warning)
            error_message: Error message if status is failure

        Returns:
            AuditLog: The created audit log entry
        """
        import json

        log_entry = cls(
            user_id=user_id,
            username=username,
            action_type=action_type,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            extra_data=json.dumps(extra_data) if extra_data else None,
            status=status,
            error_message=error_message
        )

        db.session.add(log_entry)
        db.session.commit()

        return log_entry

    @classmethod
    def get_logs(cls, user_id=None, action_type=None, action=None,
                 target_type=None, target_id=None, status=None,
                 start_date=None, end_date=None,
                 page=1, per_page=50, search=None):
        """
        Query audit logs with filters.

        Returns:
            tuple: (logs, total_count)
        """
        query = cls.query

        if user_id:
            query = query.filter(cls.user_id == user_id)
        if action_type:
            query = query.filter(cls.action_type == action_type)
        if action:
            query = query.filter(cls.action == action)
        if target_type:
            query = query.filter(cls.target_type == target_type)
        if target_id:
            query = query.filter(cls.target_id == target_id)
        if status:
            query = query.filter(cls.status == status)
        if start_date:
            query = query.filter(cls.created_at >= start_date)
        if end_date:
            query = query.filter(cls.created_at <= end_date)
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    cls.username.ilike(search_term),
                    cls.description.ilike(search_term),
                    cls.action.ilike(search_term),
                    cls.target_name.ilike(search_term),
                    cls.ip_address.ilike(search_term)
                )
            )

        total = query.count()
        logs = query.order_by(cls.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return logs.items, total

    @classmethod
    def get_user_activity(cls, user_id, limit=50):
        """Get recent activity for a specific user"""
        return cls.query.filter(cls.user_id == user_id)\
            .order_by(cls.created_at.desc())\
            .limit(limit)\
            .all()

    @classmethod
    def get_recent_security_events(cls, limit=100):
        """Get recent security-related events"""
        return cls.query.filter(
            cls.action_type.in_([cls.ACTION_TYPE_AUTH, cls.ACTION_TYPE_SECURITY])
        ).order_by(cls.created_at.desc()).limit(limit).all()

    @classmethod
    def cleanup_old_logs(cls, days=90):
        """Delete logs older than specified days"""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = cls.query.filter(cls.created_at < cutoff).delete()
        db.session.commit()
        return deleted
