from datetime import datetime
from . import db


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'), default=None)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), default=None)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='USD')
    payment_method = db.Column(db.String(50), nullable=False)  # paypal, cmi, crypto, free
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    transaction_id = db.Column(db.String(100), default=None)
    plan_type = db.Column(db.String(20), nullable=False)  # starter, pro, elite, trial
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, default=None)

    # Trial conversion tracking
    is_trial_conversion = db.Column(db.Boolean, default=False)
    paypal_agreement_id = db.Column(db.String(100), default=None)

    def complete_payment(self, transaction_id):
        """Mark payment as completed"""
        self.status = 'completed'
        self.transaction_id = transaction_id
        self.completed_at = datetime.utcnow()

    def fail_payment(self, reason=None):
        """Mark payment as failed"""
        self.status = 'failed'
        self.transaction_id = reason

    def to_dict(self):
        """Convert payment to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'subscription_id': self.subscription_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'payment_method': self.payment_method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'plan_type': self.plan_type,
            'is_trial_conversion': self.is_trial_conversion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

    def __repr__(self):
        return f'<Payment {self.id} - {self.status}>'
