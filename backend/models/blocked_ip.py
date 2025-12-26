from datetime import datetime
from . import db


class BlockedIP(db.Model):
    """Blocked IP addresses for security"""
    __tablename__ = 'blocked_ips'
    __table_args__ = (
        db.Index('idx_blocked_ip_address', 'ip_address'),
        db.Index('idx_blocked_ip_expires', 'expires_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False)  # Supports IPv6
    reason = db.Column(db.String(500), nullable=True)
    block_type = db.Column(db.String(50), default='manual')  # manual, auto_rate_limit, auto_suspicious

    # Who blocked it
    blocked_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Timestamps
    blocked_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # NULL = permanent

    # Stats
    blocked_requests_count = db.Column(db.Integer, default=0)
    last_blocked_request_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    blocked_by_user = db.relationship('User', foreign_keys=[blocked_by])

    def is_active(self):
        """Check if block is currently active"""
        if self.expires_at is None:
            return True  # Permanent block
        return datetime.utcnow() < self.expires_at

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'reason': self.reason,
            'block_type': self.block_type,
            'blocked_by': self.blocked_by,
            'blocked_by_username': self.blocked_by_user.username if self.blocked_by_user else None,
            'blocked_at': self.blocked_at.isoformat() if self.blocked_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_permanent': self.expires_at is None,
            'is_active': self.is_active(),
            'blocked_requests_count': self.blocked_requests_count,
            'last_blocked_request_at': self.last_blocked_request_at.isoformat() if self.last_blocked_request_at else None
        }

    def __repr__(self):
        return f'<BlockedIP {self.ip_address}>'


def is_ip_blocked(ip_address):
    """Check if an IP address is blocked"""
    blocked = BlockedIP.query.filter_by(ip_address=ip_address).first()
    if not blocked:
        return False
    return blocked.is_active()


def block_ip(ip_address, reason=None, blocked_by_id=None, expires_at=None, block_type='manual'):
    """Block an IP address"""
    existing = BlockedIP.query.filter_by(ip_address=ip_address).first()
    if existing:
        # Update existing block
        existing.reason = reason
        existing.blocked_by = blocked_by_id
        existing.blocked_at = datetime.utcnow()
        existing.expires_at = expires_at
        existing.block_type = block_type
        db.session.commit()
        return existing

    blocked = BlockedIP(
        ip_address=ip_address,
        reason=reason,
        blocked_by=blocked_by_id,
        expires_at=expires_at,
        block_type=block_type
    )
    db.session.add(blocked)
    db.session.commit()
    return blocked


def unblock_ip(ip_address):
    """Unblock an IP address"""
    blocked = BlockedIP.query.filter_by(ip_address=ip_address).first()
    if blocked:
        db.session.delete(blocked)
        db.session.commit()
        return True
    return False


def get_blocked_ips(page=1, per_page=20, active_only=True):
    """Get list of blocked IPs with pagination"""
    query = BlockedIP.query.order_by(BlockedIP.blocked_at.desc())

    if active_only:
        query = query.filter(
            db.or_(
                BlockedIP.expires_at.is_(None),
                BlockedIP.expires_at > datetime.utcnow()
            )
        )

    return query.paginate(page=page, per_page=per_page, error_out=False)


def increment_blocked_request(ip_address):
    """Increment the blocked requests counter for an IP"""
    blocked = BlockedIP.query.filter_by(ip_address=ip_address).first()
    if blocked:
        blocked.blocked_requests_count += 1
        blocked.last_blocked_request_at = datetime.utcnow()
        db.session.commit()


def cleanup_expired_blocks():
    """Remove expired IP blocks"""
    expired = BlockedIP.query.filter(
        BlockedIP.expires_at.isnot(None),
        BlockedIP.expires_at < datetime.utcnow()
    ).all()

    count = len(expired)
    for block in expired:
        db.session.delete(block)
    db.session.commit()
    return count
