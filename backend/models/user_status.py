from datetime import datetime
from . import db


class UserStatus(db.Model):
    """Extended user status tracking for admin management"""
    __tablename__ = 'user_statuses'
    __table_args__ = (
        db.Index('idx_user_status_banned', 'is_banned'),
        db.Index('idx_user_status_frozen', 'is_frozen'),
        db.Index('idx_user_status_trade', 'can_trade'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # Ban status
    is_banned = db.Column(db.Boolean, default=False)
    ban_reason = db.Column(db.String(500), nullable=True)
    banned_at = db.Column(db.DateTime, nullable=True)
    banned_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    ban_expires_at = db.Column(db.DateTime, nullable=True)  # NULL = permanent

    # Freeze status (temporary restriction)
    is_frozen = db.Column(db.Boolean, default=False)
    frozen_until = db.Column(db.DateTime, nullable=True)
    freeze_reason = db.Column(db.String(500), nullable=True)
    frozen_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Trade access control
    can_trade = db.Column(db.Boolean, default=True)
    trade_blocked_reason = db.Column(db.String(500), nullable=True)
    trade_blocked_at = db.Column(db.DateTime, nullable=True)
    trade_blocked_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Activity tracking
    last_activity_at = db.Column(db.DateTime, nullable=True)
    total_logins = db.Column(db.Integer, default=0)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login_at = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('status_record', uselist=False))
    banned_by_user = db.relationship('User', foreign_keys=[banned_by])
    frozen_by_user = db.relationship('User', foreign_keys=[frozen_by])
    trade_blocked_by_user = db.relationship('User', foreign_keys=[trade_blocked_by])

    def is_ban_active(self):
        """Check if ban is currently active"""
        if not self.is_banned:
            return False
        if self.ban_expires_at is None:
            return True  # Permanent ban
        return datetime.utcnow() < self.ban_expires_at

    def is_freeze_active(self):
        """Check if freeze is currently active"""
        if not self.is_frozen:
            return False
        if self.frozen_until is None:
            return False
        return datetime.utcnow() < self.frozen_until

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'is_banned': self.is_banned,
            'ban_active': self.is_ban_active(),
            'ban_reason': self.ban_reason,
            'banned_at': self.banned_at.isoformat() if self.banned_at else None,
            'ban_expires_at': self.ban_expires_at.isoformat() if self.ban_expires_at else None,
            'is_frozen': self.is_frozen,
            'freeze_active': self.is_freeze_active(),
            'frozen_until': self.frozen_until.isoformat() if self.frozen_until else None,
            'freeze_reason': self.freeze_reason,
            'can_trade': self.can_trade,
            'trade_blocked_reason': self.trade_blocked_reason,
            'last_activity_at': self.last_activity_at.isoformat() if self.last_activity_at else None,
            'total_logins': self.total_logins,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<UserStatus user_id={self.user_id} banned={self.is_banned} frozen={self.is_frozen}>'


def get_or_create_user_status(user_id):
    """Get or create UserStatus for a user"""
    status = UserStatus.query.filter_by(user_id=user_id).first()
    if not status:
        status = UserStatus(user_id=user_id)
        db.session.add(status)
        db.session.commit()
    return status


def ban_user(user_id, reason, banned_by_id, expires_at=None):
    """Ban a user"""
    status = get_or_create_user_status(user_id)
    status.is_banned = True
    status.ban_reason = reason
    status.banned_by = banned_by_id
    status.banned_at = datetime.utcnow()
    status.ban_expires_at = expires_at
    db.session.commit()
    return status


def unban_user(user_id):
    """Unban a user"""
    status = get_or_create_user_status(user_id)
    status.is_banned = False
    status.ban_reason = None
    status.banned_at = None
    status.banned_by = None
    status.ban_expires_at = None
    db.session.commit()
    return status


def freeze_user(user_id, hours, reason, frozen_by_id):
    """Freeze a user for a specified number of hours"""
    from datetime import timedelta
    status = get_or_create_user_status(user_id)
    status.is_frozen = True
    status.freeze_reason = reason
    status.frozen_by = frozen_by_id
    status.frozen_until = datetime.utcnow() + timedelta(hours=hours)
    db.session.commit()
    return status


def unfreeze_user(user_id):
    """Unfreeze a user"""
    status = get_or_create_user_status(user_id)
    status.is_frozen = False
    status.freeze_reason = None
    status.frozen_by = None
    status.frozen_until = None
    db.session.commit()
    return status


def block_user_trading(user_id, reason, blocked_by_id):
    """Block a user from trading"""
    status = get_or_create_user_status(user_id)
    status.can_trade = False
    status.trade_blocked_reason = reason
    status.trade_blocked_by = blocked_by_id
    status.trade_blocked_at = datetime.utcnow()
    db.session.commit()
    return status


def unblock_user_trading(user_id):
    """Unblock a user from trading"""
    status = get_or_create_user_status(user_id)
    status.can_trade = True
    status.trade_blocked_reason = None
    status.trade_blocked_by = None
    status.trade_blocked_at = None
    db.session.commit()
    return status
