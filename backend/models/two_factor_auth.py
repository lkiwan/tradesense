"""
Two-Factor Authentication Model for TradeSense
Stores 2FA secrets and backup codes
"""
import secrets
import hashlib
from datetime import datetime
from . import db


class TwoFactorAuth(db.Model):
    """
    Two-Factor Authentication settings for users.
    Stores TOTP secret and backup codes.
    """
    __tablename__ = 'two_factor_auth'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),
                        unique=True, nullable=False, index=True)

    # TOTP Secret (encrypted in production)
    secret = db.Column(db.String(64), nullable=False)

    # Status
    is_enabled = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime, nullable=True)

    # Backup codes (hashed, comma-separated)
    backup_codes_hash = db.Column(db.Text, nullable=True)
    backup_codes_used = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Last used for rate limiting
    last_used_at = db.Column(db.DateTime, nullable=True)
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    # Relationship
    user = db.relationship('User', backref=db.backref('two_factor', uselist=False, cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<TwoFactorAuth user_id={self.user_id} enabled={self.is_enabled}>'

    def to_dict(self):
        return {
            'is_enabled': self.is_enabled,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'backup_codes_remaining': self.get_backup_codes_remaining(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    @staticmethod
    def generate_backup_codes(count: int = 10) -> list:
        """Generate a list of backup codes"""
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()
            # Format as XXXX-XXXX for readability
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes

    @staticmethod
    def hash_code(code: str) -> str:
        """Hash a backup code"""
        # Normalize the code (remove dashes, uppercase)
        normalized = code.replace('-', '').upper()
        return hashlib.sha256(normalized.encode()).hexdigest()

    def set_backup_codes(self, codes: list):
        """Store hashed backup codes"""
        hashed = [self.hash_code(code) for code in codes]
        self.backup_codes_hash = ','.join(hashed)
        self.backup_codes_used = 0

    def verify_backup_code(self, code: str) -> bool:
        """Verify and consume a backup code"""
        if not self.backup_codes_hash:
            return False

        code_hash = self.hash_code(code)
        codes = self.backup_codes_hash.split(',')

        if code_hash in codes:
            # Remove the used code
            codes.remove(code_hash)
            self.backup_codes_hash = ','.join(codes) if codes else None
            self.backup_codes_used += 1
            return True

        return False

    def get_backup_codes_remaining(self) -> int:
        """Get number of remaining backup codes"""
        if not self.backup_codes_hash:
            return 0
        return len(self.backup_codes_hash.split(','))

    def record_failed_attempt(self):
        """Record a failed 2FA attempt"""
        self.failed_attempts += 1

        # Lock after 5 failed attempts
        if self.failed_attempts >= 5:
            from datetime import timedelta
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)

    def reset_failed_attempts(self):
        """Reset failed attempts after successful verification"""
        self.failed_attempts = 0
        self.locked_until = None
        self.last_used_at = datetime.utcnow()

    def is_locked(self) -> bool:
        """Check if 2FA is temporarily locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True

        # Auto-unlock if time has passed
        if self.locked_until:
            self.locked_until = None
            self.failed_attempts = 0

        return False

    @classmethod
    def get_or_create(cls, user_id: int, secret: str = None):
        """Get existing 2FA record or create a new one"""
        record = cls.query.filter_by(user_id=user_id).first()

        if not record:
            import pyotp
            record = cls(
                user_id=user_id,
                secret=secret or pyotp.random_base32()
            )
            db.session.add(record)
            db.session.commit()

        return record
