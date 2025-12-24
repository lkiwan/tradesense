"""
Trading Settings Model
Stores user's one-click trading preferences and quick order settings
"""

from datetime import datetime
from decimal import Decimal
from . import db


class TradingSettings(db.Model):
    """User's trading preferences for one-click trading"""
    __tablename__ = 'trading_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # One-Click Trading Enabled
    one_click_enabled = db.Column(db.Boolean, default=False)
    confirm_orders = db.Column(db.Boolean, default=True)  # Show confirmation before executing

    # Default Lot Sizes (quick select buttons)
    default_lot_size = db.Column(db.Numeric(10, 2), default=Decimal('0.01'))
    quick_lot_1 = db.Column(db.Numeric(10, 2), default=Decimal('0.01'))
    quick_lot_2 = db.Column(db.Numeric(10, 2), default=Decimal('0.05'))
    quick_lot_3 = db.Column(db.Numeric(10, 2), default=Decimal('0.10'))
    quick_lot_4 = db.Column(db.Numeric(10, 2), default=Decimal('0.50'))

    # Default Stop Loss Settings
    default_sl_enabled = db.Column(db.Boolean, default=True)
    default_sl_type = db.Column(db.String(10), default='pips')  # 'pips', 'points', 'percent', 'price'
    default_sl_value = db.Column(db.Numeric(10, 2), default=Decimal('20'))  # 20 pips default

    # Default Take Profit Settings
    default_tp_enabled = db.Column(db.Boolean, default=True)
    default_tp_type = db.Column(db.String(10), default='pips')  # 'pips', 'points', 'percent', 'price'
    default_tp_value = db.Column(db.Numeric(10, 2), default=Decimal('40'))  # 40 pips default

    # Risk Management
    max_lot_size = db.Column(db.Numeric(10, 2), default=Decimal('10.00'))
    risk_percent_per_trade = db.Column(db.Numeric(5, 2), default=Decimal('1.00'))  # 1% risk per trade
    use_risk_based_sizing = db.Column(db.Boolean, default=False)

    # Hotkeys Settings
    hotkeys_enabled = db.Column(db.Boolean, default=False)
    hotkey_buy = db.Column(db.String(10), default='B')
    hotkey_sell = db.Column(db.String(10), default='S')
    hotkey_close_all = db.Column(db.String(10), default='X')
    hotkey_cancel_orders = db.Column(db.String(10), default='C')

    # Sound Settings
    sound_on_execution = db.Column(db.Boolean, default=True)
    sound_on_tp_hit = db.Column(db.Boolean, default=True)
    sound_on_sl_hit = db.Column(db.Boolean, default=True)

    # Favorite Symbols (for quick access)
    favorite_symbols = db.Column(db.JSON, default=list)

    # Chart Settings
    auto_close_chart_on_position_close = db.Column(db.Boolean, default=False)
    show_profit_in_pips = db.Column(db.Boolean, default=True)
    show_profit_in_currency = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('trading_settings', uselist=False))

    @classmethod
    def get_or_create(cls, user_id):
        """Get existing settings or create default ones"""
        settings = cls.query.filter_by(user_id=user_id).first()
        if not settings:
            settings = cls(user_id=user_id)
            db.session.add(settings)
            db.session.commit()
        return settings

    def calculate_lot_size_for_risk(self, account_balance, stop_loss_pips, pip_value=10):
        """
        Calculate lot size based on risk percentage
        pip_value: Value of 1 pip for 1 standard lot (default $10 for forex)
        """
        if not self.use_risk_based_sizing or not stop_loss_pips:
            return float(self.default_lot_size)

        risk_amount = float(account_balance) * (float(self.risk_percent_per_trade) / 100)
        lot_size = risk_amount / (float(stop_loss_pips) * pip_value)

        # Round to 2 decimal places and clamp to max
        lot_size = round(lot_size, 2)
        lot_size = min(lot_size, float(self.max_lot_size))
        lot_size = max(lot_size, 0.01)  # Minimum 0.01 lot

        return lot_size

    def get_quick_lots(self):
        """Get list of quick lot sizes"""
        return [
            float(self.quick_lot_1),
            float(self.quick_lot_2),
            float(self.quick_lot_3),
            float(self.quick_lot_4)
        ]

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'one_click_enabled': self.one_click_enabled,
            'confirm_orders': self.confirm_orders,
            'default_lot_size': float(self.default_lot_size),
            'quick_lots': self.get_quick_lots(),
            'default_sl': {
                'enabled': self.default_sl_enabled,
                'type': self.default_sl_type,
                'value': float(self.default_sl_value)
            },
            'default_tp': {
                'enabled': self.default_tp_enabled,
                'type': self.default_tp_type,
                'value': float(self.default_tp_value)
            },
            'risk_management': {
                'max_lot_size': float(self.max_lot_size),
                'risk_percent_per_trade': float(self.risk_percent_per_trade),
                'use_risk_based_sizing': self.use_risk_based_sizing
            },
            'hotkeys': {
                'enabled': self.hotkeys_enabled,
                'buy': self.hotkey_buy,
                'sell': self.hotkey_sell,
                'close_all': self.hotkey_close_all,
                'cancel_orders': self.hotkey_cancel_orders
            },
            'sounds': {
                'on_execution': self.sound_on_execution,
                'on_tp_hit': self.sound_on_tp_hit,
                'on_sl_hit': self.sound_on_sl_hit
            },
            'favorite_symbols': self.favorite_symbols or [],
            'display': {
                'show_profit_in_pips': self.show_profit_in_pips,
                'show_profit_in_currency': self.show_profit_in_currency
            },
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class QuickOrderHistory(db.Model):
    """Track one-click order executions for analytics"""
    __tablename__ = 'quick_order_history'
    __table_args__ = (
        db.Index('idx_quick_order_user', 'user_id'),
        db.Index('idx_quick_order_symbol', 'symbol'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)

    # Order details
    symbol = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(10), nullable=False)
    lot_size = db.Column(db.Numeric(10, 2), nullable=False)
    entry_price = db.Column(db.Numeric(15, 5), nullable=False)

    # SL/TP
    stop_loss = db.Column(db.Numeric(15, 5), nullable=True)
    take_profit = db.Column(db.Numeric(15, 5), nullable=True)

    # Execution
    execution_time_ms = db.Column(db.Integer)  # Time to execute in milliseconds
    executed_via = db.Column(db.String(20), default='one_click')  # 'one_click', 'hotkey', 'api'

    # Result (filled after position closes)
    exit_price = db.Column(db.Numeric(15, 5), nullable=True)
    profit_loss = db.Column(db.Numeric(15, 2), nullable=True)
    profit_pips = db.Column(db.Numeric(10, 1), nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='quick_orders')
    challenge = db.relationship('UserChallenge', backref='quick_orders')

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'side': self.side,
            'lot_size': float(self.lot_size),
            'entry_price': float(self.entry_price),
            'stop_loss': float(self.stop_loss) if self.stop_loss else None,
            'take_profit': float(self.take_profit) if self.take_profit else None,
            'execution_time_ms': self.execution_time_ms,
            'executed_via': self.executed_via,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'profit_loss': float(self.profit_loss) if self.profit_loss else None,
            'profit_pips': float(self.profit_pips) if self.profit_pips else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
