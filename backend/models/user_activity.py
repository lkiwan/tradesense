"""
UserActivity Model
Tracks user actions and activity for admin monitoring
"""
from datetime import datetime
from . import db


class UserActivity(db.Model):
    """Track user activities for admin dashboard monitoring"""
    __tablename__ = 'user_activities'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    # Activity details
    activity_type = db.Column(db.String(50), nullable=False, index=True)  # login, trade, payment, etc.
    action = db.Column(db.String(100), nullable=False)  # specific action taken
    description = db.Column(db.Text, nullable=True)  # human-readable description

    # Context data
    extra_data = db.Column(db.JSON, nullable=True)  # Additional context (JSON)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    user_agent = db.Column(db.String(500), nullable=True)

    # Related entities
    related_entity_type = db.Column(db.String(50), nullable=True)  # challenge, payment, ticket, etc.
    related_entity_id = db.Column(db.Integer, nullable=True)

    # Status
    status = db.Column(db.String(20), default='success')  # success, failed, pending

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('activities', lazy='dynamic', cascade='all, delete-orphan'))

    # Indexes for common queries
    __table_args__ = (
        db.Index('idx_user_activity_type', 'user_id', 'activity_type'),
        db.Index('idx_activity_created', 'created_at'),
        db.Index('idx_activity_type_created', 'activity_type', 'created_at'),
    )

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'action': self.action,
            'description': self.description,
            'extra_data': self.extra_data,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<UserActivity {self.id} user={self.user_id} type={self.activity_type}>'


# Activity type constants
class ActivityType:
    LOGIN = 'login'
    LOGOUT = 'logout'
    TRADE = 'trade'
    PAYMENT = 'payment'
    CHALLENGE = 'challenge'
    PROFILE = 'profile'
    SETTINGS = 'settings'
    SUPPORT = 'support'
    KYC = 'kyc'
    PAYOUT = 'payout'
    REFERRAL = 'referral'
    SECURITY = 'security'


def log_user_activity(user_id, activity_type, action, description=None, extra_data=None,
                      ip_address=None, user_agent=None, related_entity_type=None,
                      related_entity_id=None, status='success'):
    """
    Helper function to log user activity

    Args:
        user_id: The user's ID
        activity_type: Type of activity (from ActivityType constants)
        action: Specific action taken
        description: Human-readable description
        extra_data: Additional context as dict
        ip_address: User's IP address
        user_agent: User's browser/client info
        related_entity_type: Type of related entity (challenge, payment, etc.)
        related_entity_id: ID of related entity
        status: Activity status (success, failed, pending)

    Returns:
        UserActivity: The created activity record
    """
    activity = UserActivity(
        user_id=user_id,
        activity_type=activity_type,
        action=action,
        description=description,
        extra_data=extra_data,
        ip_address=ip_address,
        user_agent=user_agent,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        status=status
    )
    db.session.add(activity)
    db.session.commit()
    return activity


def get_user_activities(user_id, activity_type=None, limit=50, offset=0):
    """
    Get activities for a specific user

    Args:
        user_id: The user's ID
        activity_type: Optional filter by activity type
        limit: Max number of results
        offset: Offset for pagination

    Returns:
        List of UserActivity records
    """
    query = UserActivity.query.filter_by(user_id=user_id)

    if activity_type:
        query = query.filter_by(activity_type=activity_type)

    return query.order_by(UserActivity.created_at.desc()).offset(offset).limit(limit).all()


def get_recent_activities(hours=24, activity_type=None, limit=100):
    """
    Get recent activities across all users

    Args:
        hours: Look back this many hours
        activity_type: Optional filter by activity type
        limit: Max number of results

    Returns:
        List of UserActivity records
    """
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(hours=hours)

    query = UserActivity.query.filter(UserActivity.created_at >= since)

    if activity_type:
        query = query.filter_by(activity_type=activity_type)

    return query.order_by(UserActivity.created_at.desc()).limit(limit).all()


def get_activity_stats(user_id=None, days=30):
    """
    Get activity statistics

    Args:
        user_id: Optional user ID to filter
        days: Number of days to look back

    Returns:
        Dict with activity counts by type
    """
    from datetime import timedelta
    from sqlalchemy import func

    since = datetime.utcnow() - timedelta(days=days)

    query = db.session.query(
        UserActivity.activity_type,
        func.count(UserActivity.id).label('count')
    ).filter(UserActivity.created_at >= since)

    if user_id:
        query = query.filter_by(user_id=user_id)

    results = query.group_by(UserActivity.activity_type).all()

    return {r.activity_type: r.count for r in results}
