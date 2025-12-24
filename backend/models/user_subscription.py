"""
User Subscription Model
Tracks user's active subscriptions and billing history
"""

from datetime import datetime, timedelta
from enum import Enum
from models import db


class SubscriptionStatus(Enum):
    """Subscription status options"""
    TRIALING = 'trialing'
    ACTIVE = 'active'
    PAST_DUE = 'past_due'
    CANCELED = 'canceled'
    EXPIRED = 'expired'
    PAUSED = 'paused'


class UserSubscription(db.Model):
    """
    User's active subscription record
    Tracks billing, status, and Stripe integration
    """
    __tablename__ = 'user_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id', ondelete='SET NULL'), nullable=True)

    # Billing interval
    billing_interval = db.Column(db.String(20), default='monthly')  # monthly, quarterly, yearly

    # Status
    status = db.Column(db.String(20), default=SubscriptionStatus.TRIALING.value)

    # Stripe integration
    stripe_customer_id = db.Column(db.String(100))
    stripe_subscription_id = db.Column(db.String(100))
    stripe_payment_method_id = db.Column(db.String(100))

    # Billing dates
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    trial_start = db.Column(db.DateTime)
    trial_end = db.Column(db.DateTime)

    # Cancellation
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    canceled_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)

    # Payment tracking
    last_payment_date = db.Column(db.DateTime)
    last_payment_amount = db.Column(db.Numeric(10, 2))
    next_payment_date = db.Column(db.DateTime)
    next_payment_amount = db.Column(db.Numeric(10, 2))

    # Failure tracking
    payment_failed_count = db.Column(db.Integer, default=0)
    last_payment_error = db.Column(db.Text)

    # Extra data
    extra_data = db.Column(db.Text)  # JSON for additional data

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('premium_subscriptions', lazy='dynamic'))
    plan = db.relationship('SubscriptionPlan', backref=db.backref('subscriptions', lazy='dynamic'))

    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in [
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ]

    @property
    def is_trialing(self):
        """Check if in trial period"""
        if self.status != SubscriptionStatus.TRIALING.value:
            return False
        if self.trial_end and datetime.utcnow() > self.trial_end:
            return False
        return True

    @property
    def trial_days_remaining(self):
        """Get remaining trial days"""
        if not self.is_trialing or not self.trial_end:
            return 0
        remaining = self.trial_end - datetime.utcnow()
        return max(0, remaining.days)

    @property
    def days_until_renewal(self):
        """Get days until next billing"""
        if not self.current_period_end:
            return None
        remaining = self.current_period_end - datetime.utcnow()
        return max(0, remaining.days)

    def activate(self, period_days=30):
        """Activate the subscription"""
        self.status = SubscriptionStatus.ACTIVE.value
        self.current_period_start = datetime.utcnow()
        self.current_period_end = datetime.utcnow() + timedelta(days=period_days)
        self.next_payment_date = self.current_period_end

    def start_trial(self, trial_days=7):
        """Start trial period"""
        self.status = SubscriptionStatus.TRIALING.value
        self.trial_start = datetime.utcnow()
        self.trial_end = datetime.utcnow() + timedelta(days=trial_days)
        self.current_period_start = self.trial_start
        self.current_period_end = self.trial_end

    def cancel(self, reason=None, immediate=False):
        """Cancel the subscription"""
        self.canceled_at = datetime.utcnow()
        self.cancellation_reason = reason

        if immediate:
            self.status = SubscriptionStatus.CANCELED.value
        else:
            self.cancel_at_period_end = True

    def renew(self, period_days=30, amount=None):
        """Renew the subscription for another period"""
        self.status = SubscriptionStatus.ACTIVE.value
        self.current_period_start = self.current_period_end or datetime.utcnow()
        self.current_period_end = self.current_period_start + timedelta(days=period_days)
        self.next_payment_date = self.current_period_end
        self.last_payment_date = datetime.utcnow()
        if amount:
            self.last_payment_amount = amount
        self.payment_failed_count = 0
        self.last_payment_error = None

    def mark_past_due(self, error=None):
        """Mark subscription as past due"""
        self.status = SubscriptionStatus.PAST_DUE.value
        self.payment_failed_count += 1
        self.last_payment_error = error

    def expire(self):
        """Expire the subscription"""
        self.status = SubscriptionStatus.EXPIRED.value

    def pause(self):
        """Pause the subscription"""
        self.status = SubscriptionStatus.PAUSED.value

    def resume(self):
        """Resume a paused subscription"""
        if self.status == SubscriptionStatus.PAUSED.value:
            self.status = SubscriptionStatus.ACTIVE.value

    def has_feature(self, feature_name):
        """Check if subscription plan has a specific feature"""
        if not self.plan or not self.is_active:
            return False
        return getattr(self.plan, feature_name, False)

    def to_dict(self, include_plan=True):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'billing_interval': self.billing_interval,
            'status': self.status,
            'is_active': self.is_active,
            'is_trialing': self.is_trialing,
            'trial_days_remaining': self.trial_days_remaining,
            'days_until_renewal': self.days_until_renewal,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'trial_start': self.trial_start.isoformat() if self.trial_start else None,
            'trial_end': self.trial_end.isoformat() if self.trial_end else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'canceled_at': self.canceled_at.isoformat() if self.canceled_at else None,
            'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None,
            'last_payment_amount': float(self.last_payment_amount) if self.last_payment_amount else None,
            'next_payment_date': self.next_payment_date.isoformat() if self.next_payment_date else None,
            'next_payment_amount': float(self.next_payment_amount) if self.next_payment_amount else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_plan and self.plan:
            data['plan'] = self.plan.to_dict()

        return data


class SubscriptionInvoice(db.Model):
    """
    Invoice/Payment history for subscriptions
    """
    __tablename__ = 'subscription_invoices'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('user_subscriptions.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))

    # Stripe integration
    stripe_invoice_id = db.Column(db.String(100))
    stripe_payment_intent_id = db.Column(db.String(100))
    stripe_charge_id = db.Column(db.String(100))

    # Invoice details
    invoice_number = db.Column(db.String(50))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    status = db.Column(db.String(20), default='pending')  # pending, paid, failed, refunded

    # Billing period
    period_start = db.Column(db.DateTime)
    period_end = db.Column(db.DateTime)

    # Payment details
    payment_method = db.Column(db.String(50))
    card_last4 = db.Column(db.String(4))
    card_brand = db.Column(db.String(20))

    # Failure info
    failure_reason = db.Column(db.Text)

    # PDF/Receipt URL
    invoice_pdf_url = db.Column(db.String(500))
    receipt_url = db.Column(db.String(500))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)

    # Relationships
    subscription = db.relationship('UserSubscription', backref=db.backref('invoices', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('subscription_invoices', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'invoice_number': self.invoice_number,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'status': self.status,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'payment_method': self.payment_method,
            'card_last4': self.card_last4,
            'card_brand': self.card_brand,
            'invoice_pdf_url': self.invoice_pdf_url,
            'receipt_url': self.receipt_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
