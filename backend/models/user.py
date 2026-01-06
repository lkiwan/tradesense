from datetime import datetime
from . import db
import bcrypt


class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = (
        db.Index('idx_users_role', 'role'),
        db.Index('idx_users_created_at', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, admin, superadmin
    avatar = db.Column(db.String(255), default=None)
    preferred_language = db.Column(db.String(5), default='fr')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Email verification
    email_verified = db.Column(db.Boolean, default=False)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    verification_token = db.Column(db.String(100), nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)

    # Password reset
    reset_token = db.Column(db.String(100), nullable=True, index=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    # Referral fields
    referral_code = db.Column(db.String(20), unique=True, nullable=True, index=True)
    referred_by_code = db.Column(db.String(20), nullable=True, index=True)

    # Profile completion fields
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(30), nullable=True)  # Increased for international formats
    country = db.Column(db.String(50), nullable=True)

    # Login attempt tracking
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    # Relationships with cascade delete for PostgreSQL
    challenges = db.relationship('UserChallenge', backref='user', lazy=True,
                                 cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', lazy=True,
                              cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set the password"""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        """Check if password matches"""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    @property
    def profile_complete(self):
        """Check if user has completed their profile"""
        return bool(self.full_name and self.phone and self.country)

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'avatar': self.avatar,
            'preferred_language': self.preferred_language,
            'email_verified': self.email_verified,
            'email_verified_at': self.email_verified_at.isoformat() if self.email_verified_at else None,
            'referral_code': self.referral_code,
            'referred_by_code': self.referred_by_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'full_name': self.full_name,
            'phone': self.phone,
            'country': self.country,
            'profile_complete': self.profile_complete
        }

    def __repr__(self):
        return f'<User {self.username}>'
