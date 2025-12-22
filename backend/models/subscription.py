from datetime import datetime, timedelta
from . import db


class Subscription(db.Model):
    """
    Subscription model for tracking trial subscriptions and PayPal billing agreements.
    Handles the trial-to-paid conversion flow with auto-charging.
    """
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)

    # Plan selection (what user will be charged after trial)
    selected_plan = db.Column(db.String(20), nullable=False)  # starter, pro, elite

    # PayPal Billing Agreement
    paypal_agreement_id = db.Column(db.String(100), nullable=True)
    paypal_payer_id = db.Column(db.String(100), nullable=True)
    paypal_payer_email = db.Column(db.String(255), nullable=True)

    # Subscription/Trial status
    status = db.Column(db.String(20), default='pending')
    # pending - awaiting PayPal approval
    # trial - active trial period
    # active - paid and active (after successful charge)
    # cancelled - user cancelled before trial end
    # expired - trial ended without successful charge
    # payment_failed - charge attempt failed

    # Trial timing
    trial_started_at = db.Column(db.DateTime, nullable=True)
    trial_expires_at = db.Column(db.DateTime, nullable=True)

    # Conversion tracking
    converted_at = db.Column(db.DateTime, nullable=True)  # When successfully charged
    cancelled_at = db.Column(db.DateTime, nullable=True)  # When user cancelled
    failed_at = db.Column(db.DateTime, nullable=True)  # When payment failed
    failure_reason = db.Column(db.String(255), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    challenges = db.relationship('UserChallenge', backref='subscription', lazy=True)
    payments = db.relationship('Payment', backref='subscription', lazy=True)

    @property
    def is_trial_active(self):
        """Check if trial is currently active"""
        if self.status != 'trial':
            return False
        if not self.trial_expires_at:
            return False
        return datetime.utcnow() < self.trial_expires_at

    @property
    def is_trial_expired(self):
        """Check if trial has expired (but not yet processed)"""
        if self.status != 'trial':
            return False
        if not self.trial_expires_at:
            return False
        return datetime.utcnow() >= self.trial_expires_at

    @property
    def trial_days_remaining(self):
        """Get remaining trial days"""
        if self.status != 'trial' or not self.trial_expires_at:
            return None
        remaining = self.trial_expires_at - datetime.utcnow()
        return max(0, remaining.days)

    @property
    def hours_until_charge(self):
        """Get hours until auto-charge"""
        if self.status != 'trial' or not self.trial_expires_at:
            return None
        remaining = self.trial_expires_at - datetime.utcnow()
        return max(0, int(remaining.total_seconds() / 3600))

    def activate_trial(self, trial_days=7):
        """Activate the trial period"""
        self.status = 'trial'
        self.trial_started_at = datetime.utcnow()
        self.trial_expires_at = datetime.utcnow() + timedelta(days=trial_days)

    def mark_converted(self, transaction_id=None):
        """Mark subscription as successfully converted (paid)"""
        self.status = 'active'
        self.converted_at = datetime.utcnow()

    def mark_cancelled(self):
        """Mark subscription as cancelled by user"""
        self.status = 'cancelled'
        self.cancelled_at = datetime.utcnow()

    def mark_failed(self, reason='Payment failed'):
        """Mark subscription as failed (charge unsuccessful)"""
        self.status = 'payment_failed'
        self.failed_at = datetime.utcnow()
        self.failure_reason = reason[:255] if reason else 'Unknown error'

    def mark_expired(self):
        """Mark subscription as expired"""
        self.status = 'expired'
        self.failed_at = datetime.utcnow()

    def to_dict(self):
        """Convert subscription to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'selected_plan': self.selected_plan,
            'status': self.status,
            'paypal_payer_email': self.paypal_payer_email,
            'trial_started_at': self.trial_started_at.isoformat() if self.trial_started_at else None,
            'trial_expires_at': self.trial_expires_at.isoformat() if self.trial_expires_at else None,
            'is_trial_active': self.is_trial_active,
            'is_trial_expired': self.is_trial_expired,
            'trial_days_remaining': self.trial_days_remaining,
            'hours_until_charge': self.hours_until_charge,
            'converted_at': self.converted_at.isoformat() if self.converted_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'failed_at': self.failed_at.isoformat() if self.failed_at else None,
            'failure_reason': self.failure_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Subscription {self.id} - {self.status} ({self.selected_plan})>'
