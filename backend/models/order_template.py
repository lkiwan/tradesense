"""
Order Template Model
Allows traders to save and reuse favorite order configurations
"""

from datetime import datetime
from decimal import Decimal
from . import db


class OrderTemplate(db.Model):
    """Saved order configuration template"""
    __tablename__ = 'order_templates'
    __table_args__ = (
        db.Index('idx_template_user', 'user_id'),
        db.Index('idx_template_symbol', 'symbol'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Template Info
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), default='#6366f1')  # For visual identification
    icon = db.Column(db.String(50), default='template')  # Icon name

    # Symbol Configuration
    symbol = db.Column(db.String(20), nullable=True)  # If null, applies to any symbol
    symbol_locked = db.Column(db.Boolean, default=False)  # If true, only use with this symbol

    # Order Type
    order_type = db.Column(db.String(20), default='market')  # market, limit, stop, stop_limit
    order_side = db.Column(db.String(10), nullable=True)  # buy, sell, or null for either

    # Position Sizing
    lot_size = db.Column(db.Numeric(10, 2), nullable=True)
    use_risk_based_sizing = db.Column(db.Boolean, default=False)
    risk_percent = db.Column(db.Numeric(5, 2), nullable=True)  # % of account to risk
    risk_amount = db.Column(db.Numeric(15, 2), nullable=True)  # Fixed $ amount to risk

    # Stop Loss Configuration
    sl_enabled = db.Column(db.Boolean, default=True)
    sl_type = db.Column(db.String(20), default='pips')  # pips, points, percent, price, atr
    sl_value = db.Column(db.Numeric(10, 2), nullable=True)
    sl_atr_multiplier = db.Column(db.Numeric(5, 2), nullable=True)  # For ATR-based SL

    # Take Profit Configuration
    tp_enabled = db.Column(db.Boolean, default=True)
    tp_type = db.Column(db.String(20), default='pips')  # pips, points, percent, price, rr_ratio
    tp_value = db.Column(db.Numeric(10, 2), nullable=True)
    tp_rr_ratio = db.Column(db.Numeric(5, 2), nullable=True)  # Risk:Reward ratio (e.g., 2 for 1:2)

    # Multiple Take Profit Levels (Partial Close)
    tp_partial_enabled = db.Column(db.Boolean, default=False)
    tp_levels = db.Column(db.JSON, nullable=True)  # [{percent: 50, pips: 20}, {percent: 50, pips: 40}]

    # Trailing Stop Configuration
    trailing_stop_enabled = db.Column(db.Boolean, default=False)
    trailing_stop_type = db.Column(db.String(20), default='pips')  # pips, percent, atr
    trailing_stop_value = db.Column(db.Numeric(10, 2), nullable=True)
    trailing_stop_activation = db.Column(db.Numeric(10, 2), nullable=True)  # Activate after X pips profit

    # Break Even Configuration
    break_even_enabled = db.Column(db.Boolean, default=False)
    break_even_trigger = db.Column(db.Numeric(10, 2), nullable=True)  # Move SL to entry after X pips
    break_even_offset = db.Column(db.Numeric(10, 2), default=Decimal('1'))  # Pips above entry

    # Advanced Order Settings
    expiry_type = db.Column(db.String(20), default='gtc')  # gtc, day, custom
    expiry_minutes = db.Column(db.Integer, nullable=True)  # For custom expiry

    # Comment/Note for the trade
    trade_comment = db.Column(db.String(200), nullable=True)

    # Usage Statistics
    times_used = db.Column(db.Integer, default=0)
    last_used_at = db.Column(db.DateTime, nullable=True)
    win_count = db.Column(db.Integer, default=0)
    loss_count = db.Column(db.Integer, default=0)

    # Favorite/Pinned
    is_favorite = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('order_templates', lazy='dynamic'))

    def increment_usage(self):
        """Increment usage counter"""
        self.times_used += 1
        self.last_used_at = datetime.utcnow()

    def record_result(self, won: bool):
        """Record trade result for template statistics"""
        if won:
            self.win_count += 1
        else:
            self.loss_count += 1

    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        total = self.win_count + self.loss_count
        if total == 0:
            return None
        return round((self.win_count / total) * 100, 1)

    def to_dict(self, include_stats=True):
        result = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'symbol': self.symbol,
            'symbol_locked': self.symbol_locked,
            'order_type': self.order_type,
            'order_side': self.order_side,
            'position_sizing': {
                'lot_size': float(self.lot_size) if self.lot_size else None,
                'use_risk_based_sizing': self.use_risk_based_sizing,
                'risk_percent': float(self.risk_percent) if self.risk_percent else None,
                'risk_amount': float(self.risk_amount) if self.risk_amount else None
            },
            'stop_loss': {
                'enabled': self.sl_enabled,
                'type': self.sl_type,
                'value': float(self.sl_value) if self.sl_value else None,
                'atr_multiplier': float(self.sl_atr_multiplier) if self.sl_atr_multiplier else None
            },
            'take_profit': {
                'enabled': self.tp_enabled,
                'type': self.tp_type,
                'value': float(self.tp_value) if self.tp_value else None,
                'rr_ratio': float(self.tp_rr_ratio) if self.tp_rr_ratio else None,
                'partial_enabled': self.tp_partial_enabled,
                'levels': self.tp_levels
            },
            'trailing_stop': {
                'enabled': self.trailing_stop_enabled,
                'type': self.trailing_stop_type,
                'value': float(self.trailing_stop_value) if self.trailing_stop_value else None,
                'activation': float(self.trailing_stop_activation) if self.trailing_stop_activation else None
            },
            'break_even': {
                'enabled': self.break_even_enabled,
                'trigger': float(self.break_even_trigger) if self.break_even_trigger else None,
                'offset': float(self.break_even_offset) if self.break_even_offset else None
            },
            'expiry': {
                'type': self.expiry_type,
                'minutes': self.expiry_minutes
            },
            'trade_comment': self.trade_comment,
            'is_favorite': self.is_favorite,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_stats:
            result['stats'] = {
                'times_used': self.times_used,
                'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
                'win_count': self.win_count,
                'loss_count': self.loss_count,
                'win_rate': self.win_rate
            }

        return result

    @classmethod
    def get_user_templates(cls, user_id, symbol=None, favorites_only=False):
        """Get all templates for a user with optional filtering"""
        query = cls.query.filter_by(user_id=user_id)

        if symbol:
            # Get templates that match this symbol OR are not symbol-locked
            query = query.filter(
                db.or_(
                    cls.symbol == symbol,
                    cls.symbol.is_(None),
                    cls.symbol_locked == False
                )
            )

        if favorites_only:
            query = query.filter_by(is_favorite=True)

        return query.order_by(cls.is_favorite.desc(), cls.sort_order, cls.times_used.desc()).all()


# Default templates that can be cloned for new users
DEFAULT_TEMPLATES = [
    {
        'name': 'Scalping - Quick Trade',
        'description': 'Small lot, tight SL/TP for quick scalps',
        'color': '#22c55e',
        'icon': 'zap',
        'lot_size': Decimal('0.05'),
        'sl_enabled': True,
        'sl_type': 'pips',
        'sl_value': Decimal('10'),
        'tp_enabled': True,
        'tp_type': 'pips',
        'tp_value': Decimal('15'),
    },
    {
        'name': 'Day Trade - Standard',
        'description': '1:2 Risk/Reward day trade setup',
        'color': '#3b82f6',
        'icon': 'trending-up',
        'lot_size': Decimal('0.10'),
        'sl_enabled': True,
        'sl_type': 'pips',
        'sl_value': Decimal('25'),
        'tp_enabled': True,
        'tp_type': 'rr_ratio',
        'tp_rr_ratio': Decimal('2'),
    },
    {
        'name': 'Swing Trade - Wide Stops',
        'description': 'Larger position with wider stops for swings',
        'color': '#8b5cf6',
        'icon': 'activity',
        'lot_size': Decimal('0.20'),
        'sl_enabled': True,
        'sl_type': 'pips',
        'sl_value': Decimal('50'),
        'tp_enabled': True,
        'tp_type': 'pips',
        'tp_value': Decimal('150'),
        'trailing_stop_enabled': True,
        'trailing_stop_type': 'pips',
        'trailing_stop_value': Decimal('30'),
        'trailing_stop_activation': Decimal('50'),
    },
    {
        'name': 'Risk-Based 1%',
        'description': 'Risk 1% of account per trade',
        'color': '#f59e0b',
        'icon': 'shield',
        'use_risk_based_sizing': True,
        'risk_percent': Decimal('1'),
        'sl_enabled': True,
        'sl_type': 'pips',
        'sl_value': Decimal('30'),
        'tp_enabled': True,
        'tp_type': 'rr_ratio',
        'tp_rr_ratio': Decimal('2'),
    },
]


def create_default_templates(user_id):
    """Create default templates for a new user"""
    templates = []
    for template_data in DEFAULT_TEMPLATES:
        template = OrderTemplate(user_id=user_id, **template_data)
        templates.append(template)
    return templates
