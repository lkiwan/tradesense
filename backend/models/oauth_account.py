"""
OAuth Account Model for TradeSense
Stores social login connections (Google, Apple, etc.)
"""

from datetime import datetime
from enum import Enum
from models import db


class OAuthProvider(str, Enum):
    GOOGLE = 'google'
    APPLE = 'apple'


class OAuthAccount(db.Model):
    """Stores OAuth provider connections for users"""
    __tablename__ = 'oauth_accounts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Provider info
    provider = db.Column(db.String(20), nullable=False)  # google, apple
    provider_user_id = db.Column(db.String(255), nullable=False)  # User ID from provider

    # User info from provider
    email = db.Column(db.String(255))
    name = db.Column(db.String(255))
    picture = db.Column(db.String(500))  # Profile picture URL

    # Token storage (encrypted in production)
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    token_expires_at = db.Column(db.DateTime)

    # Metadata
    raw_data = db.Column(db.JSON)  # Store full provider response

    # Status
    is_primary = db.Column(db.Boolean, default=False)  # Primary login method
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = db.Column(db.DateTime)

    # Unique constraint - one provider account per user
    __table_args__ = (
        db.UniqueConstraint('provider', 'provider_user_id', name='unique_oauth_provider_user'),
    )

    # Relationship
    user = db.relationship('User', backref=db.backref('oauth_accounts', lazy='dynamic'))

    def to_dict(self, include_tokens=False):
        data = {
            'id': self.id,
            'provider': self.provider,
            'email': self.email,
            'name': self.name,
            'picture': self.picture,
            'is_primary': self.is_primary,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }

        if include_tokens:
            data['access_token'] = self.access_token
            data['refresh_token'] = self.refresh_token
            data['token_expires_at'] = self.token_expires_at.isoformat() if self.token_expires_at else None

        return data

    def update_tokens(self, access_token, refresh_token=None, expires_at=None):
        """Update OAuth tokens"""
        self.access_token = access_token
        if refresh_token:
            self.refresh_token = refresh_token
        if expires_at:
            self.token_expires_at = expires_at
        self.last_used_at = datetime.utcnow()
        db.session.commit()


# Helper functions

def get_oauth_account(provider, provider_user_id):
    """Get OAuth account by provider and provider user ID"""
    return OAuthAccount.query.filter_by(
        provider=provider,
        provider_user_id=provider_user_id,
        is_active=True
    ).first()


def get_user_oauth_accounts(user_id):
    """Get all OAuth accounts for a user"""
    return OAuthAccount.query.filter_by(
        user_id=user_id,
        is_active=True
    ).all()


def create_oauth_account(user_id, provider, provider_user_id, email=None, name=None,
                         picture=None, access_token=None, refresh_token=None,
                         token_expires_at=None, raw_data=None):
    """Create a new OAuth account connection"""
    oauth_account = OAuthAccount(
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        email=email,
        name=name,
        picture=picture,
        access_token=access_token,
        refresh_token=refresh_token,
        token_expires_at=token_expires_at,
        raw_data=raw_data,
        last_used_at=datetime.utcnow()
    )
    db.session.add(oauth_account)
    db.session.commit()
    return oauth_account


def link_oauth_to_user(user_id, provider, provider_user_id, **kwargs):
    """Link an OAuth account to an existing user"""
    # Check if this OAuth account is already linked to another user
    existing = OAuthAccount.query.filter_by(
        provider=provider,
        provider_user_id=provider_user_id
    ).first()

    if existing:
        if existing.user_id != user_id:
            raise ValueError(f"This {provider} account is already linked to another user")
        # Update existing
        for key, value in kwargs.items():
            if hasattr(existing, key) and value is not None:
                setattr(existing, key, value)
        existing.last_used_at = datetime.utcnow()
        db.session.commit()
        return existing

    # Create new
    return create_oauth_account(user_id, provider, provider_user_id, **kwargs)


def unlink_oauth_account(user_id, provider):
    """Unlink an OAuth account from a user"""
    oauth_account = OAuthAccount.query.filter_by(
        user_id=user_id,
        provider=provider,
        is_active=True
    ).first()

    if not oauth_account:
        return False

    # Soft delete
    oauth_account.is_active = False
    db.session.commit()
    return True


def find_user_by_oauth(provider, provider_user_id):
    """Find a user by their OAuth provider account"""
    oauth_account = get_oauth_account(provider, provider_user_id)
    if oauth_account:
        return oauth_account.user
    return None


def find_user_by_oauth_email(provider, email):
    """Find a user by OAuth email (for account linking suggestions)"""
    oauth_account = OAuthAccount.query.filter_by(
        provider=provider,
        email=email,
        is_active=True
    ).first()
    if oauth_account:
        return oauth_account.user
    return None
