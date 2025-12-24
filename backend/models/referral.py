from datetime import datetime
from decimal import Decimal
from enum import Enum
from . import db


# Commission rates for multi-tier affiliate program
COMMISSION_RATES = {
    1: Decimal('15.00'),  # Tier 1: 15% - Direct referrals
    2: Decimal('5.00'),   # Tier 2: 5% - Sub-referrals (referrals of your referrals)
}

# Performance bonus thresholds
PERFORMANCE_BONUSES = {
    'bronze': {'min_referrals': 5, 'min_revenue': 500, 'bonus_percent': Decimal('2.00')},
    'silver': {'min_referrals': 15, 'min_revenue': 2000, 'bonus_percent': Decimal('3.00')},
    'gold': {'min_referrals': 30, 'min_revenue': 5000, 'bonus_percent': Decimal('5.00')},
    'platinum': {'min_referrals': 50, 'min_revenue': 10000, 'bonus_percent': Decimal('7.00')},
}

MINIMUM_PAYOUT = Decimal('100.00')  # Minimum payout threshold


class Referral(db.Model):
    """Referral model for tracking user referrals and commissions"""
    __tablename__ = 'referrals'
    __table_args__ = (
        db.Index('idx_referrals_referrer', 'referrer_id'),
        db.Index('idx_referrals_status', 'status'),
        db.Index('idx_referrals_referred', 'referred_id'),
    )

    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    referral_code = db.Column(db.String(20), unique=True, nullable=False)

    # Multi-tier tracking
    tier = db.Column(db.Integer, default=1)  # 1 = direct, 2 = sub-referral
    parent_referral_id = db.Column(db.Integer, db.ForeignKey('referrals.id'), nullable=True)

    # Status: pending (link created), converted (user signed up), active (making purchases)
    status = db.Column(db.String(20), default='pending')

    # Commission details (legacy - now tracked in AffiliateCommission)
    commission_rate = db.Column(db.Numeric(5, 2), default=Decimal('15.00'))  # Tier 1 default
    commission_amount = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    converted_at = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_made')
    referred = db.relationship('User', foreign_keys=[referred_id], backref='referred_by')
    parent_referral = db.relationship('Referral', remote_side=[id], backref='sub_referrals')

    def convert(self, referred_user_id, payment_amount=None):
        """Mark referral as converted when referred user signs up"""
        self.referred_id = referred_user_id
        self.status = 'converted'
        self.converted_at = datetime.utcnow()
        if payment_amount:
            self.commission_amount = Decimal(str(payment_amount)) * (self.commission_rate / Decimal('100'))

    def mark_active(self):
        """Mark referral as active (user made a purchase)"""
        self.status = 'active'

    def mark_paid(self):
        """Mark commission as paid"""
        self.status = 'paid'
        self.paid_at = datetime.utcnow()

    def to_dict(self):
        """Convert referral to dictionary"""
        return {
            'id': self.id,
            'referrer_id': self.referrer_id,
            'referred_id': self.referred_id,
            'referral_code': self.referral_code,
            'tier': self.tier,
            'status': self.status,
            'commission_rate': float(self.commission_rate) if self.commission_rate else 15.0,
            'commission_amount': float(self.commission_amount) if self.commission_amount else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'converted_at': self.converted_at.isoformat() if self.converted_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'referred_user': {
                'id': self.referred.id,
                'username': self.referred.username,
                'email': self.referred.email
            } if self.referred else None,
            'sub_referrals_count': len(self.sub_referrals) if self.sub_referrals else 0
        }

    def __repr__(self):
        return f'<Referral {self.referral_code} by User {self.referrer_id} (Tier {self.tier})>'


class AffiliateCommission(db.Model):
    """Track individual commission earnings for affiliates"""
    __tablename__ = 'affiliate_commissions'
    __table_args__ = (
        db.Index('idx_affiliate_comm_affiliate', 'affiliate_id'),
        db.Index('idx_affiliate_comm_status', 'status'),
        db.Index('idx_affiliate_comm_created', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    affiliate_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    referral_id = db.Column(db.Integer, db.ForeignKey('referrals.id', ondelete='SET NULL'), nullable=True)

    # Source of commission
    source_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    source_payment_id = db.Column(db.Integer, db.ForeignKey('payments.id', ondelete='SET NULL'), nullable=True)

    # Commission details
    tier = db.Column(db.Integer, nullable=False)  # 1 or 2
    commission_rate = db.Column(db.Numeric(5, 2), nullable=False)
    source_amount = db.Column(db.Numeric(10, 2), nullable=False)  # Original purchase amount
    commission_amount = db.Column(db.Numeric(10, 2), nullable=False)  # Earned commission
    bonus_amount = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))  # Performance bonus
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)  # commission + bonus

    # Status: pending, approved, paid, cancelled
    status = db.Column(db.String(20), default='pending')
    payout_request_id = db.Column(db.Integer, db.ForeignKey('affiliate_payout_requests.id'), nullable=True)

    # Description
    description = db.Column(db.String(255), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    affiliate = db.relationship('User', foreign_keys=[affiliate_id], backref='affiliate_commissions')
    source_user = db.relationship('User', foreign_keys=[source_user_id])
    referral = db.relationship('Referral', backref='commissions')

    @classmethod
    def create_commission(cls, affiliate_id, referral_id, source_user_id, source_payment_id,
                         tier, source_amount, description=None):
        """Create a new commission record"""
        rate = COMMISSION_RATES.get(tier, COMMISSION_RATES[1])
        commission = Decimal(str(source_amount)) * (rate / Decimal('100'))

        return cls(
            affiliate_id=affiliate_id,
            referral_id=referral_id,
            source_user_id=source_user_id,
            source_payment_id=source_payment_id,
            tier=tier,
            commission_rate=rate,
            source_amount=Decimal(str(source_amount)),
            commission_amount=commission,
            bonus_amount=Decimal('0.00'),
            total_amount=commission,
            description=description or f'Tier {tier} commission'
        )

    def approve(self):
        """Approve the commission"""
        self.status = 'approved'
        self.approved_at = datetime.utcnow()

    def mark_paid(self, payout_request_id):
        """Mark as paid"""
        self.status = 'paid'
        self.paid_at = datetime.utcnow()
        self.payout_request_id = payout_request_id

    def to_dict(self):
        return {
            'id': self.id,
            'affiliate_id': self.affiliate_id,
            'tier': self.tier,
            'commission_rate': float(self.commission_rate),
            'source_amount': float(self.source_amount),
            'commission_amount': float(self.commission_amount),
            'bonus_amount': float(self.bonus_amount),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'source_user': {
                'id': self.source_user.id,
                'username': self.source_user.username
            } if self.source_user else None
        }


class AffiliatePayoutRequest(db.Model):
    """Payout requests for affiliate commissions"""
    __tablename__ = 'affiliate_payout_requests'
    __table_args__ = (
        db.Index('idx_affiliate_payout_affiliate', 'affiliate_id'),
        db.Index('idx_affiliate_payout_status', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    affiliate_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Payout details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')

    # Payment method
    payment_method = db.Column(db.String(50), nullable=False)  # bank_transfer, paypal, crypto
    payment_details = db.Column(db.JSON, nullable=True)  # Store payment info

    # Status: pending, processing, completed, rejected
    status = db.Column(db.String(20), default='pending')
    rejection_reason = db.Column(db.Text, nullable=True)

    # Transaction reference
    transaction_id = db.Column(db.String(100), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    affiliate = db.relationship('User', backref='affiliate_payouts')
    commissions = db.relationship('AffiliateCommission', backref='payout_request')

    def process(self):
        """Mark as processing"""
        self.status = 'processing'
        self.processed_at = datetime.utcnow()

    def complete(self, transaction_id=None):
        """Mark as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        if transaction_id:
            self.transaction_id = transaction_id

    def reject(self, reason):
        """Reject the payout request"""
        self.status = 'rejected'
        self.rejection_reason = reason
        self.processed_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'affiliate_id': self.affiliate_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'payment_method': self.payment_method,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'commissions_count': len(self.commissions) if self.commissions else 0
        }


class AffiliateStats(db.Model):
    """Cached affiliate statistics for dashboard performance"""
    __tablename__ = 'affiliate_stats'

    id = db.Column(db.Integer, primary_key=True)
    affiliate_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # Tier 1 stats
    tier1_referrals = db.Column(db.Integer, default=0)
    tier1_active_referrals = db.Column(db.Integer, default=0)
    tier1_total_revenue = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    tier1_total_commissions = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))

    # Tier 2 stats
    tier2_referrals = db.Column(db.Integer, default=0)
    tier2_active_referrals = db.Column(db.Integer, default=0)
    tier2_total_revenue = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    tier2_total_commissions = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))

    # Combined stats
    total_referrals = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(12, 2), default=Decimal('0.00'))
    total_commissions = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))
    total_paid = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))
    pending_balance = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))

    # Performance tier
    performance_tier = db.Column(db.String(20), default='none')  # none, bronze, silver, gold, platinum

    # Timestamps
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    affiliate = db.relationship('User', backref='affiliate_stats')

    def calculate_performance_tier(self):
        """Calculate performance tier based on stats"""
        for tier_name in ['platinum', 'gold', 'silver', 'bronze']:
            tier_req = PERFORMANCE_BONUSES[tier_name]
            if (self.total_referrals >= tier_req['min_referrals'] and
                float(self.total_revenue) >= tier_req['min_revenue']):
                self.performance_tier = tier_name
                return tier_name
        self.performance_tier = 'none'
        return 'none'

    def get_bonus_rate(self):
        """Get current bonus rate based on performance tier"""
        if self.performance_tier in PERFORMANCE_BONUSES:
            return PERFORMANCE_BONUSES[self.performance_tier]['bonus_percent']
        return Decimal('0.00')

    def to_dict(self):
        return {
            'affiliate_id': self.affiliate_id,
            'tier1': {
                'referrals': self.tier1_referrals,
                'active_referrals': self.tier1_active_referrals,
                'total_revenue': float(self.tier1_total_revenue),
                'total_commissions': float(self.tier1_total_commissions)
            },
            'tier2': {
                'referrals': self.tier2_referrals,
                'active_referrals': self.tier2_active_referrals,
                'total_revenue': float(self.tier2_total_revenue),
                'total_commissions': float(self.tier2_total_commissions)
            },
            'totals': {
                'referrals': self.total_referrals,
                'revenue': float(self.total_revenue),
                'commissions': float(self.total_commissions),
                'paid': float(self.total_paid),
                'pending_balance': float(self.pending_balance)
            },
            'performance_tier': self.performance_tier,
            'bonus_rate': float(self.get_bonus_rate()),
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
