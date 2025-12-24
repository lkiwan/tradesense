from datetime import datetime
from . import db


class Payout(db.Model):
    """Payout model for funded trader withdrawals"""
    __tablename__ = 'payouts'
    __table_args__ = (
        db.Index('idx_payouts_user_status', 'user_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)

    # Payout amounts
    gross_profit = db.Column(db.Numeric(15, 2), nullable=False)  # Total profit requested
    platform_fee = db.Column(db.Numeric(15, 2), nullable=False)  # 20% platform cut
    net_payout = db.Column(db.Numeric(15, 2), nullable=False)    # 80% to trader

    # Status tracking
    status = db.Column(db.String(20), default='pending')  # pending, approved, paid, rejected
    rejection_reason = db.Column(db.String(255), default=None)

    # Timestamps
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, default=None)
    processed_at = db.Column(db.DateTime, default=None)

    # Payment details
    payment_method = db.Column(db.String(50), default='paypal')  # paypal, bank_transfer, crypto
    paypal_email = db.Column(db.String(255), default=None)
    transaction_id = db.Column(db.String(100), default=None)

    # Admin who processed
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), default=None)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='payouts')
    processor = db.relationship('User', foreign_keys=[processed_by])

    @staticmethod
    def calculate_split(gross_profit, trader_percentage=0.80):
        """Calculate profit split"""
        net_payout = float(gross_profit) * trader_percentage
        platform_fee = float(gross_profit) * (1 - trader_percentage)
        return {
            'gross_profit': float(gross_profit),
            'net_payout': round(net_payout, 2),
            'platform_fee': round(platform_fee, 2)
        }

    def to_dict(self):
        """Convert payout to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'gross_profit': float(self.gross_profit),
            'platform_fee': float(self.platform_fee),
            'net_payout': float(self.net_payout),
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'payment_method': self.payment_method,
            'paypal_email': self.paypal_email,
            'transaction_id': self.transaction_id
        }

    def __repr__(self):
        return f'<Payout {self.id} - ${self.net_payout} - {self.status}>'
