"""
Challenge Add-on Model
Tracks reset, extend, and upgrade operations for challenges
"""

from datetime import datetime, timedelta
from enum import Enum
from models import db


class AddonType(Enum):
    """Types of challenge add-ons"""
    RESET = 'reset'
    EXTEND = 'extend'
    UPGRADE = 'upgrade'


class AddonStatus(Enum):
    """Status of add-on purchase"""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'


class ChallengeAddon(db.Model):
    """
    Challenge Add-ons - Reset, Extend, Upgrade purchases
    Tracks all modifications made to challenges
    """
    __tablename__ = 'challenge_addons'

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Add-on type
    addon_type = db.Column(db.String(20), nullable=False)  # reset, extend, upgrade

    # Status
    status = db.Column(db.String(20), default=AddonStatus.PENDING.value)

    # Payment info
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    payment_method = db.Column(db.String(50))  # paypal, stripe, etc.
    transaction_id = db.Column(db.String(100))

    # Reset specific fields
    original_balance = db.Column(db.Numeric(15, 2))  # Balance before reset
    reset_balance = db.Column(db.Numeric(15, 2))  # Balance after reset (initial_balance)
    discount_percent = db.Column(db.Numeric(5, 2))  # Discount applied (10%)

    # Extend specific fields
    extension_days = db.Column(db.Integer)  # Days added
    original_end_date = db.Column(db.DateTime)  # End date before extension
    new_end_date = db.Column(db.DateTime)  # End date after extension

    # Upgrade specific fields
    from_model_id = db.Column(db.Integer, db.ForeignKey('challenge_models.id'))
    to_model_id = db.Column(db.Integer, db.ForeignKey('challenge_models.id'))
    from_account_size_id = db.Column(db.Integer, db.ForeignKey('account_sizes.id'))
    to_account_size_id = db.Column(db.Integer, db.ForeignKey('account_sizes.id'))
    price_difference = db.Column(db.Numeric(10, 2))  # Base price difference
    upgrade_fee_percent = db.Column(db.Numeric(5, 2))  # Additional fee (10%)

    # Metadata
    notes = db.Column(db.Text)  # Admin notes
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    # Relationships
    challenge = db.relationship('UserChallenge', backref=db.backref('addons', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('challenge_addons', lazy='dynamic'))
    from_model = db.relationship('ChallengeModel', foreign_keys=[from_model_id])
    to_model = db.relationship('ChallengeModel', foreign_keys=[to_model_id])

    def complete(self):
        """Mark add-on as completed"""
        self.status = AddonStatus.COMPLETED.value
        self.completed_at = datetime.utcnow()

    def fail(self, reason=None):
        """Mark add-on as failed"""
        self.status = AddonStatus.FAILED.value
        if reason:
            self.notes = reason

    def to_dict(self):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'addon_type': self.addon_type,
            'status': self.status,
            'amount': float(self.amount) if self.amount else 0,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

        # Add type-specific fields
        if self.addon_type == AddonType.RESET.value:
            data.update({
                'original_balance': float(self.original_balance) if self.original_balance else None,
                'reset_balance': float(self.reset_balance) if self.reset_balance else None,
                'discount_percent': float(self.discount_percent) if self.discount_percent else None
            })
        elif self.addon_type == AddonType.EXTEND.value:
            data.update({
                'extension_days': self.extension_days,
                'original_end_date': self.original_end_date.isoformat() if self.original_end_date else None,
                'new_end_date': self.new_end_date.isoformat() if self.new_end_date else None
            })
        elif self.addon_type == AddonType.UPGRADE.value:
            data.update({
                'from_model_id': self.from_model_id,
                'to_model_id': self.to_model_id,
                'from_account_size_id': self.from_account_size_id,
                'to_account_size_id': self.to_account_size_id,
                'price_difference': float(self.price_difference) if self.price_difference else None,
                'upgrade_fee_percent': float(self.upgrade_fee_percent) if self.upgrade_fee_percent else None
            })

        return data


# Pricing constants
ADDON_PRICING = {
    'extend': {
        'price_per_30_days': 49.00,
        'currency': 'USD'
    },
    'reset': {
        'discount_percent': 10.00,  # 10% discount from original price
        'currency': 'USD'
    },
    'upgrade': {
        'fee_percent': 10.00,  # 10% additional fee on top of price difference
        'currency': 'USD'
    }
}


def calculate_reset_price(challenge) -> dict:
    """
    Calculate reset price for a challenge
    Reset = Original price - 10% discount
    """
    if not challenge.account_size:
        return {'error': 'Challenge has no account size configured'}

    original_price = float(challenge.account_size.price)
    discount_percent = ADDON_PRICING['reset']['discount_percent']
    discount_amount = original_price * (discount_percent / 100)
    final_price = original_price - discount_amount

    return {
        'original_price': original_price,
        'discount_percent': discount_percent,
        'discount_amount': discount_amount,
        'final_price': round(final_price, 2),
        'currency': ADDON_PRICING['reset']['currency'],
        'description': f'Reset challenge - {int(discount_percent)}% discount applied'
    }


def calculate_extend_price(days: int = 30) -> dict:
    """
    Calculate extension price
    Extension = $49 per 30 days
    """
    price_per_30_days = ADDON_PRICING['extend']['price_per_30_days']
    # Pro-rate for different periods
    price = (days / 30) * price_per_30_days

    return {
        'days': days,
        'price_per_30_days': price_per_30_days,
        'final_price': round(price, 2),
        'currency': ADDON_PRICING['extend']['currency'],
        'description': f'Extend challenge by {days} days'
    }


def calculate_upgrade_price(from_account_size, to_account_size) -> dict:
    """
    Calculate upgrade price
    Upgrade = (New price - Old price) + 10% fee
    """
    if not from_account_size or not to_account_size:
        return {'error': 'Invalid account sizes'}

    from_price = float(from_account_size.price)
    to_price = float(to_account_size.price)

    if to_price <= from_price:
        return {'error': 'Upgrade target must be higher tier than current'}

    price_difference = to_price - from_price
    fee_percent = ADDON_PRICING['upgrade']['fee_percent']
    fee_amount = price_difference * (fee_percent / 100)
    final_price = price_difference + fee_amount

    return {
        'from_price': from_price,
        'to_price': to_price,
        'price_difference': price_difference,
        'fee_percent': fee_percent,
        'fee_amount': fee_amount,
        'final_price': round(final_price, 2),
        'currency': ADDON_PRICING['upgrade']['currency'],
        'from_balance': float(from_account_size.balance),
        'to_balance': float(to_account_size.balance),
        'description': f'Upgrade from ${from_account_size.balance:,.0f} to ${to_account_size.balance:,.0f}'
    }
