"""
Points Redemption System
Allows users to redeem accumulated points for rewards
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from . import db


class RewardCategory(str, Enum):
    DISCOUNT = 'discount'           # Percentage discount on purchases
    FREE_EXTENSION = 'free_extension'  # Free challenge extension
    FREE_RESET = 'free_reset'       # Free challenge reset
    MERCHANDISE = 'merchandise'     # Physical items
    SUBSCRIPTION = 'subscription'   # Free subscription months
    CASH_BONUS = 'cash_bonus'       # Cash added to account
    EXCLUSIVE = 'exclusive'         # Special perks


class RedemptionStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    FAILED = 'failed'


# Reward Catalog - Define all available rewards
REWARDS_CATALOG = {
    # Discounts
    'discount_5': {
        'id': 'discount_5',
        'name': '5% Discount',
        'description': 'Get 5% off your next challenge purchase',
        'category': RewardCategory.DISCOUNT,
        'points_cost': 250,
        'value': 5,  # 5% discount
        'value_type': 'percent',
        'stock': None,  # Unlimited
        'active': True,
        'level_required': 'Bronze',
        'icon': 'percent',
        'featured': False
    },
    'discount_10': {
        'id': 'discount_10',
        'name': '10% Discount',
        'description': 'Get 10% off your next challenge purchase',
        'category': RewardCategory.DISCOUNT,
        'points_cost': 450,
        'value': 10,
        'value_type': 'percent',
        'stock': None,
        'active': True,
        'level_required': 'Bronze',
        'icon': 'percent',
        'featured': True
    },
    'discount_15': {
        'id': 'discount_15',
        'name': '15% Discount',
        'description': 'Get 15% off your next challenge purchase',
        'category': RewardCategory.DISCOUNT,
        'points_cost': 650,
        'value': 15,
        'value_type': 'percent',
        'stock': None,
        'active': True,
        'level_required': 'Silver',
        'icon': 'percent',
        'featured': False
    },
    'discount_20': {
        'id': 'discount_20',
        'name': '20% Discount',
        'description': 'Get 20% off your next challenge purchase',
        'category': RewardCategory.DISCOUNT,
        'points_cost': 800,
        'value': 20,
        'value_type': 'percent',
        'stock': None,
        'active': True,
        'level_required': 'Gold',
        'icon': 'percent',
        'featured': True
    },

    # Free Extensions
    'extension_7_days': {
        'id': 'extension_7_days',
        'name': '7-Day Extension',
        'description': 'Add 7 extra days to your active challenge',
        'category': RewardCategory.FREE_EXTENSION,
        'points_cost': 300,
        'value': 7,
        'value_type': 'days',
        'stock': None,
        'active': True,
        'level_required': 'Bronze',
        'icon': 'clock',
        'featured': False
    },
    'extension_15_days': {
        'id': 'extension_15_days',
        'name': '15-Day Extension',
        'description': 'Add 15 extra days to your active challenge',
        'category': RewardCategory.FREE_EXTENSION,
        'points_cost': 550,
        'value': 15,
        'value_type': 'days',
        'stock': None,
        'active': True,
        'level_required': 'Silver',
        'icon': 'clock',
        'featured': True
    },
    'extension_30_days': {
        'id': 'extension_30_days',
        'name': '30-Day Extension',
        'description': 'Add 30 extra days to your active challenge',
        'category': RewardCategory.FREE_EXTENSION,
        'points_cost': 900,
        'value': 30,
        'value_type': 'days',
        'stock': None,
        'active': True,
        'level_required': 'Gold',
        'icon': 'clock',
        'featured': False
    },

    # Free Reset
    'free_reset': {
        'id': 'free_reset',
        'name': 'Free Challenge Reset',
        'description': 'Reset your challenge for free (normally 10% of price)',
        'category': RewardCategory.FREE_RESET,
        'points_cost': 1500,
        'value': 1,
        'value_type': 'reset',
        'stock': None,
        'active': True,
        'level_required': 'Gold',
        'icon': 'refresh-cw',
        'featured': True
    },

    # Subscription Rewards
    'subscription_1_month': {
        'id': 'subscription_1_month',
        'name': '1 Month Pro Subscription',
        'description': 'Get 1 month of Pro subscription for free',
        'category': RewardCategory.SUBSCRIPTION,
        'points_cost': 2000,
        'value': 1,
        'value_type': 'months',
        'stock': None,
        'active': True,
        'level_required': 'Gold',
        'icon': 'crown',
        'featured': True
    },
    'subscription_3_months': {
        'id': 'subscription_3_months',
        'name': '3 Months Pro Subscription',
        'description': 'Get 3 months of Pro subscription for free',
        'category': RewardCategory.SUBSCRIPTION,
        'points_cost': 5000,
        'value': 3,
        'value_type': 'months',
        'stock': None,
        'active': True,
        'level_required': 'Platinum',
        'icon': 'crown',
        'featured': False
    },

    # Cash Bonus
    'cash_bonus_25': {
        'id': 'cash_bonus_25',
        'name': '$25 Account Credit',
        'description': 'Add $25 to your account balance',
        'category': RewardCategory.CASH_BONUS,
        'points_cost': 2500,
        'value': 25,
        'value_type': 'usd',
        'stock': None,
        'active': True,
        'level_required': 'Platinum',
        'icon': 'dollar-sign',
        'featured': False
    },
    'cash_bonus_50': {
        'id': 'cash_bonus_50',
        'name': '$50 Account Credit',
        'description': 'Add $50 to your account balance',
        'category': RewardCategory.CASH_BONUS,
        'points_cost': 4500,
        'value': 50,
        'value_type': 'usd',
        'stock': None,
        'active': True,
        'level_required': 'Platinum',
        'icon': 'dollar-sign',
        'featured': True
    },

    # Merchandise
    'merch_tshirt': {
        'id': 'merch_tshirt',
        'name': 'TradeSense T-Shirt',
        'description': 'Official TradeSense branded t-shirt',
        'category': RewardCategory.MERCHANDISE,
        'points_cost': 1000,
        'value': 1,
        'value_type': 'item',
        'stock': 100,
        'active': True,
        'level_required': 'Silver',
        'icon': 'shirt',
        'featured': False,
        'requires_shipping': True
    },
    'merch_hoodie': {
        'id': 'merch_hoodie',
        'name': 'TradeSense Hoodie',
        'description': 'Premium TradeSense branded hoodie',
        'category': RewardCategory.MERCHANDISE,
        'points_cost': 2000,
        'value': 1,
        'value_type': 'item',
        'stock': 50,
        'active': True,
        'level_required': 'Gold',
        'icon': 'shirt',
        'featured': True,
        'requires_shipping': True
    },
    'merch_mug': {
        'id': 'merch_mug',
        'name': 'TradeSense Mug',
        'description': 'Ceramic trading mug with TradeSense logo',
        'category': RewardCategory.MERCHANDISE,
        'points_cost': 500,
        'value': 1,
        'value_type': 'item',
        'stock': 200,
        'active': True,
        'level_required': 'Bronze',
        'icon': 'coffee',
        'featured': False,
        'requires_shipping': True
    },

    # Exclusive Perks
    'vip_support': {
        'id': 'vip_support',
        'name': 'VIP Support (30 days)',
        'description': 'Priority support with dedicated account manager for 30 days',
        'category': RewardCategory.EXCLUSIVE,
        'points_cost': 3000,
        'value': 30,
        'value_type': 'days',
        'stock': None,
        'active': True,
        'level_required': 'Platinum',
        'icon': 'headphones',
        'featured': True
    },
    'trading_session': {
        'id': 'trading_session',
        'name': '1-on-1 Trading Session',
        'description': '60-minute private session with a senior trader',
        'category': RewardCategory.EXCLUSIVE,
        'points_cost': 5000,
        'value': 60,
        'value_type': 'minutes',
        'stock': 20,
        'active': True,
        'level_required': 'Diamond',
        'icon': 'video',
        'featured': True
    }
}

# Level hierarchy for validation
LEVEL_HIERARCHY = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']


def get_level_index(level):
    """Get numeric index of level for comparison"""
    try:
        return LEVEL_HIERARCHY.index(level)
    except ValueError:
        return 0


def can_redeem_reward(user_level, required_level):
    """Check if user's level meets the requirement"""
    return get_level_index(user_level) >= get_level_index(required_level)


class PointsRedemption(db.Model):
    """Track points redemption history"""
    __tablename__ = 'points_redemptions'
    __table_args__ = (
        db.Index('idx_redemption_user', 'user_id'),
        db.Index('idx_redemption_status', 'status'),
        db.Index('idx_redemption_reward', 'reward_id'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Reward info
    reward_id = db.Column(db.String(50), nullable=False)
    reward_name = db.Column(db.String(100), nullable=False)
    reward_category = db.Column(db.String(50), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    reward_value = db.Column(db.Numeric(10, 2), nullable=False)
    reward_value_type = db.Column(db.String(20), nullable=False)

    # Status tracking
    status = db.Column(db.String(20), default=RedemptionStatus.PENDING.value)

    # Redemption code for discounts
    redemption_code = db.Column(db.String(20), unique=True, nullable=True)
    code_used = db.Column(db.Boolean, default=False)
    code_used_at = db.Column(db.DateTime, nullable=True)

    # For merchandise - shipping info
    shipping_address = db.Column(db.JSON, nullable=True)
    tracking_number = db.Column(db.String(100), nullable=True)

    # Notes and admin
    notes = db.Column(db.Text, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='redemptions')
    processor = db.relationship('User', foreign_keys=[processed_by])

    @classmethod
    def create_redemption(cls, user_id, reward_id, shipping_address=None):
        """Create a new redemption"""
        import secrets

        reward = REWARDS_CATALOG.get(reward_id)
        if not reward:
            raise ValueError(f'Invalid reward ID: {reward_id}')

        if not reward.get('active', False):
            raise ValueError('This reward is no longer available')

        # Check stock
        if reward.get('stock') is not None:
            current_stock = cls.get_remaining_stock(reward_id)
            if current_stock <= 0:
                raise ValueError('This reward is out of stock')

        # Generate redemption code for discounts
        redemption_code = None
        if reward['category'] == RewardCategory.DISCOUNT:
            redemption_code = f"TS{secrets.token_hex(4).upper()}"

        # Set expiration (90 days for most rewards)
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=90)

        redemption = cls(
            user_id=user_id,
            reward_id=reward_id,
            reward_name=reward['name'],
            reward_category=reward['category'].value if isinstance(reward['category'], RewardCategory) else reward['category'],
            points_spent=reward['points_cost'],
            reward_value=Decimal(str(reward['value'])),
            reward_value_type=reward['value_type'],
            redemption_code=redemption_code,
            shipping_address=shipping_address,
            expires_at=expires_at
        )

        return redemption

    @classmethod
    def get_remaining_stock(cls, reward_id):
        """Get remaining stock for a limited reward"""
        reward = REWARDS_CATALOG.get(reward_id)
        if not reward or reward.get('stock') is None:
            return None

        redeemed_count = cls.query.filter(
            cls.reward_id == reward_id,
            cls.status.in_([
                RedemptionStatus.PENDING.value,
                RedemptionStatus.PROCESSING.value,
                RedemptionStatus.COMPLETED.value
            ])
        ).count()

        return reward['stock'] - redeemed_count

    def process(self, processed_by_id=None, notes=None):
        """Mark redemption as processing"""
        self.status = RedemptionStatus.PROCESSING.value
        self.processed_at = datetime.utcnow()
        self.processed_by = processed_by_id
        if notes:
            self.notes = notes

    def complete(self, tracking_number=None, notes=None):
        """Mark redemption as completed"""
        self.status = RedemptionStatus.COMPLETED.value
        self.completed_at = datetime.utcnow()
        if tracking_number:
            self.tracking_number = tracking_number
        if notes:
            self.notes = notes

    def cancel(self, notes=None):
        """Cancel redemption and refund points"""
        self.status = RedemptionStatus.CANCELLED.value
        if notes:
            self.notes = notes
        return self.points_spent  # Return points to refund

    def use_code(self):
        """Mark redemption code as used"""
        if self.redemption_code:
            self.code_used = True
            self.code_used_at = datetime.utcnow()

    def is_expired(self):
        """Check if redemption has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'reward_id': self.reward_id,
            'reward_name': self.reward_name,
            'reward_category': self.reward_category,
            'points_spent': self.points_spent,
            'reward_value': float(self.reward_value),
            'reward_value_type': self.reward_value_type,
            'status': self.status,
            'redemption_code': self.redemption_code if not self.code_used else None,
            'code_used': self.code_used,
            'tracking_number': self.tracking_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_expired': self.is_expired()
        }


class RewardStock(db.Model):
    """Track stock levels for limited rewards"""
    __tablename__ = 'reward_stock'

    id = db.Column(db.Integer, primary_key=True)
    reward_id = db.Column(db.String(50), unique=True, nullable=False)
    total_stock = db.Column(db.Integer, default=0)
    reserved = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def available(self):
        return self.total_stock - self.reserved

    def reserve(self, quantity=1):
        """Reserve stock for pending redemption"""
        if self.available >= quantity:
            self.reserved += quantity
            return True
        return False

    def release(self, quantity=1):
        """Release reserved stock (cancelled redemption)"""
        self.reserved = max(0, self.reserved - quantity)

    def fulfill(self, quantity=1):
        """Fulfill reserved stock (completed redemption)"""
        self.total_stock -= quantity
        self.reserved -= quantity
