"""
Challenge Model - Configurable challenge types (Stellar 1-Step, 2-Step, Lite)
Allows multiple challenge configurations like FundedNext
"""

from datetime import datetime
from . import db


class ChallengeModel(db.Model):
    """Configurable challenge model (Stellar 1-Step, 2-Step, Lite)"""
    __tablename__ = 'challenge_models'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # stellar_1step, stellar_2step, stellar_lite
    display_name = db.Column(db.String(100), nullable=False)  # Stellar 1-Step
    description = db.Column(db.Text)
    phases = db.Column(db.Integer, default=2)  # 1 or 2

    # Phase 1 Settings
    phase1_profit_target = db.Column(db.Numeric(5, 2), default=10.00)  # 10% default
    phase1_min_days = db.Column(db.Integer, default=0)  # Minimum trading days

    # Phase 2 Settings (null for 1-step)
    phase2_profit_target = db.Column(db.Numeric(5, 2), default=5.00)  # 5% default
    phase2_min_days = db.Column(db.Integer, default=0)

    # Risk Parameters
    max_daily_loss = db.Column(db.Numeric(5, 2), default=5.00)  # 3%, 4%, or 5%
    max_overall_loss = db.Column(db.Numeric(5, 2), default=10.00)  # 6%, 8%, or 10%

    # Trading Settings
    leverage = db.Column(db.String(10), default='1:100')  # 1:30 or 1:100
    news_trading_allowed = db.Column(db.Boolean, default=True)
    weekend_holding_allowed = db.Column(db.Boolean, default=True)
    ea_allowed = db.Column(db.Boolean, default=True)

    # Payout Settings
    first_payout_days = db.Column(db.Integer, default=14)  # Days until first payout
    payout_cycle_days = db.Column(db.Integer, default=14)  # Payout frequency
    default_profit_split = db.Column(db.Numeric(5, 2), default=80.00)  # 80% to trader
    max_profit_split = db.Column(db.Numeric(5, 2), default=90.00)  # Can scale up to 90%

    # Pricing & Discounts
    reset_discount = db.Column(db.Numeric(5, 2), default=10.00)  # 10% discount on reset

    # Display
    badge_color = db.Column(db.String(20), default='blue')  # For UI styling
    icon = db.Column(db.String(50), default='star')  # Icon name
    is_popular = db.Column(db.Boolean, default=False)  # Show "Popular" badge
    is_new = db.Column(db.Boolean, default=False)  # Show "New" badge

    # Status
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    account_sizes = db.relationship('AccountSize', backref='model', lazy=True, order_by='AccountSize.balance')
    challenges = db.relationship('UserChallenge', backref='challenge_model', lazy=True)

    def get_phase_target(self, phase):
        """Get profit target for specific phase"""
        if phase == 1 or phase == 'evaluation':
            return float(self.phase1_profit_target) / 100
        elif phase == 2 or phase == 'verification':
            return float(self.phase2_profit_target) / 100 if self.phase2_profit_target else None
        return None

    def get_rules_dict(self):
        """Get all rules as dictionary for display"""
        return {
            'phases': self.phases,
            'phase1_target': f"{self.phase1_profit_target}%",
            'phase2_target': f"{self.phase2_profit_target}%" if self.phases > 1 else None,
            'phase1_min_days': self.phase1_min_days,
            'phase2_min_days': self.phase2_min_days if self.phases > 1 else None,
            'max_daily_loss': f"{self.max_daily_loss}%",
            'max_overall_loss': f"{self.max_overall_loss}%",
            'leverage': self.leverage,
            'news_trading': self.news_trading_allowed,
            'weekend_holding': self.weekend_holding_allowed,
            'ea_allowed': self.ea_allowed,
            'first_payout': f"{self.first_payout_days} days",
            'payout_cycle': f"{self.payout_cycle_days} days",
            'profit_split': f"{self.default_profit_split}%"
        }

    def to_dict(self, include_sizes=True):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'phases': self.phases,
            # Phase targets
            'phase1_profit_target': float(self.phase1_profit_target),
            'phase1_min_days': self.phase1_min_days,
            'phase2_profit_target': float(self.phase2_profit_target) if self.phase2_profit_target else None,
            'phase2_min_days': self.phase2_min_days,
            # Risk
            'max_daily_loss': float(self.max_daily_loss),
            'max_overall_loss': float(self.max_overall_loss),
            'leverage': self.leverage,
            # Trading rules
            'news_trading_allowed': self.news_trading_allowed,
            'weekend_holding_allowed': self.weekend_holding_allowed,
            'ea_allowed': self.ea_allowed,
            # Payout
            'first_payout_days': self.first_payout_days,
            'payout_cycle_days': self.payout_cycle_days,
            'default_profit_split': float(self.default_profit_split),
            'max_profit_split': float(self.max_profit_split),
            'reset_discount': float(self.reset_discount),
            # Display
            'badge_color': self.badge_color,
            'icon': self.icon,
            'is_popular': self.is_popular,
            'is_new': self.is_new,
            'is_active': self.is_active,
            'display_order': self.display_order
        }

        if include_sizes:
            data['account_sizes'] = [size.to_dict() for size in self.account_sizes if size.is_active]

        return data

    def __repr__(self):
        return f'<ChallengeModel {self.name}>'


class AccountSize(db.Model):
    """Available account sizes for each challenge model"""
    __tablename__ = 'account_sizes'

    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('challenge_models.id'), nullable=False)
    balance = db.Column(db.Numeric(15, 2), nullable=False)  # 5000, 10000, 25000, etc.
    price = db.Column(db.Numeric(10, 2), nullable=False)  # Purchase price in USD

    # Optional override pricing for promotions
    sale_price = db.Column(db.Numeric(10, 2), default=None)
    sale_ends_at = db.Column(db.DateTime, default=None)

    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def current_price(self):
        """Get current price (sale price if active, otherwise regular)"""
        if self.sale_price and self.sale_ends_at:
            if datetime.utcnow() < self.sale_ends_at:
                return float(self.sale_price)
        return float(self.price)

    @property
    def is_on_sale(self):
        """Check if currently on sale"""
        if self.sale_price and self.sale_ends_at:
            return datetime.utcnow() < self.sale_ends_at
        return False

    @property
    def discount_percent(self):
        """Calculate discount percentage if on sale"""
        if self.is_on_sale and self.price > 0:
            return round((1 - float(self.sale_price) / float(self.price)) * 100)
        return 0

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'model_id': self.model_id,
            'balance': float(self.balance),
            'price': float(self.price),
            'current_price': self.current_price,
            'is_on_sale': self.is_on_sale,
            'sale_price': float(self.sale_price) if self.sale_price else None,
            'sale_ends_at': self.sale_ends_at.isoformat() if self.sale_ends_at else None,
            'discount_percent': self.discount_percent,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<AccountSize ${self.balance} for model {self.model_id}>'
