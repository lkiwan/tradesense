"""
User Session Model for TradeSense
Tracks active login sessions across devices
"""
from datetime import datetime, timedelta
from models import db
import hashlib
import secrets


class UserSession(db.Model):
    """Model to track user login sessions across devices"""
    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Session identification
    session_token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    device_fingerprint = db.Column(db.String(64), nullable=True, index=True)

    # Device information
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = db.Column(db.String(500), nullable=True)
    device_type = db.Column(db.String(50), nullable=True)  # desktop, mobile, tablet
    browser = db.Column(db.String(100), nullable=True)
    os = db.Column(db.String(100), nullable=True)

    # Location (from IP geolocation)
    country = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)

    # Session metadata
    is_current = db.Column(db.Boolean, default=False)  # Mark current session
    is_active = db.Column(db.Boolean, default=True)
    is_suspicious = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)

    # Relationship
    user = db.relationship('User', backref=db.backref('sessions', lazy='dynamic', cascade='all, delete-orphan'))

    def __init__(self, user_id, ip_address=None, user_agent=None, **kwargs):
        self.user_id = user_id
        self.session_token = self.generate_session_token()
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.expires_at = datetime.utcnow() + timedelta(days=30)  # 30-day session

        # Parse user agent
        if user_agent:
            self._parse_user_agent(user_agent)

        # Set additional attributes
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    @staticmethod
    def generate_session_token():
        """Generate a secure session token"""
        return secrets.token_hex(32)

    @staticmethod
    def generate_device_fingerprint(user_agent, ip_address, accept_language=None):
        """Generate a device fingerprint from available data"""
        fingerprint_data = f"{user_agent}:{ip_address}:{accept_language or ''}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]

    def _parse_user_agent(self, user_agent):
        """Parse user agent string to extract device, browser, and OS info"""
        ua_lower = user_agent.lower()

        # Detect device type
        if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
            self.device_type = 'mobile'
        elif 'tablet' in ua_lower or 'ipad' in ua_lower:
            self.device_type = 'tablet'
        else:
            self.device_type = 'desktop'

        # Detect browser
        if 'chrome' in ua_lower and 'edg' not in ua_lower:
            self.browser = 'Chrome'
        elif 'firefox' in ua_lower:
            self.browser = 'Firefox'
        elif 'safari' in ua_lower and 'chrome' not in ua_lower:
            self.browser = 'Safari'
        elif 'edg' in ua_lower:
            self.browser = 'Edge'
        elif 'opera' in ua_lower or 'opr' in ua_lower:
            self.browser = 'Opera'
        else:
            self.browser = 'Unknown'

        # Detect OS
        if 'windows' in ua_lower:
            self.os = 'Windows'
        elif 'mac os' in ua_lower or 'macintosh' in ua_lower:
            self.os = 'macOS'
        elif 'linux' in ua_lower:
            self.os = 'Linux'
        elif 'android' in ua_lower:
            self.os = 'Android'
        elif 'iphone' in ua_lower or 'ipad' in ua_lower:
            self.os = 'iOS'
        else:
            self.os = 'Unknown'

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()

    def revoke(self):
        """Revoke/invalidate this session"""
        self.is_active = False
        self.revoked_at = datetime.utcnow()

    def is_expired(self):
        """Check if session has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False

    def is_valid(self):
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

    def to_dict(self, include_token=False):
        """Convert session to dictionary"""
        data = {
            'id': self.id,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'ip_address': self.ip_address,
            'country': self.country,
            'city': self.city,
            'is_current': self.is_current,
            'is_active': self.is_active,
            'is_suspicious': self.is_suspicious,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

        if include_token:
            data['session_token'] = self.session_token

        return data

    @classmethod
    def get_active_sessions(cls, user_id):
        """Get all active sessions for a user"""
        return cls.query.filter_by(
            user_id=user_id,
            is_active=True
        ).filter(
            cls.expires_at > datetime.utcnow()
        ).order_by(cls.last_activity.desc()).all()

    @classmethod
    def revoke_all_except(cls, user_id, current_session_id):
        """Revoke all sessions except the current one"""
        sessions = cls.query.filter(
            cls.user_id == user_id,
            cls.id != current_session_id,
            cls.is_active == True
        ).all()

        for session in sessions:
            session.revoke()

        db.session.commit()
        return len(sessions)

    @classmethod
    def revoke_all(cls, user_id):
        """Revoke all sessions for a user"""
        sessions = cls.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()

        for session in sessions:
            session.revoke()

        db.session.commit()
        return len(sessions)

    @classmethod
    def cleanup_expired(cls):
        """Clean up expired sessions (run periodically)"""
        expired = cls.query.filter(
            cls.expires_at < datetime.utcnow()
        ).all()

        for session in expired:
            db.session.delete(session)

        db.session.commit()
        return len(expired)

    @classmethod
    def check_suspicious_login(cls, user_id, ip_address, device_fingerprint):
        """
        Check if this login attempt is suspicious.
        Returns tuple (is_suspicious, reason)
        """
        # Get recent sessions for this user
        recent_sessions = cls.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(cls.created_at.desc()).limit(10).all()

        if not recent_sessions:
            return False, None

        # Check if this is a new device
        known_fingerprints = {s.device_fingerprint for s in recent_sessions if s.device_fingerprint}
        is_new_device = device_fingerprint and device_fingerprint not in known_fingerprints

        # Check if this is a new IP
        known_ips = {s.ip_address for s in recent_sessions if s.ip_address}
        is_new_ip = ip_address and ip_address not in known_ips

        # Check for rapid location change (potential account sharing or VPN)
        last_session = recent_sessions[0] if recent_sessions else None
        if last_session and last_session.last_activity:
            time_since_last = datetime.utcnow() - last_session.last_activity
            # If there was activity in the last 5 minutes from a different IP
            if time_since_last < timedelta(minutes=5) and is_new_ip:
                return True, "Rapid IP change detected"

        # New device is suspicious but not blocking
        if is_new_device:
            return True, "New device login"

        return False, None

    def __repr__(self):
        return f'<UserSession {self.id} user={self.user_id} device={self.device_type}>'
