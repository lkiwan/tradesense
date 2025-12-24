"""
Advanced Order Types Model
Supports: Trailing Stop, OCO (One-Cancels-Other), Bracket Orders
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from . import db


class OrderType(str, Enum):
    MARKET = 'market'
    LIMIT = 'limit'
    STOP = 'stop'
    STOP_LIMIT = 'stop_limit'
    TRAILING_STOP = 'trailing_stop'
    OCO = 'oco'
    BRACKET = 'bracket'


class OrderSide(str, Enum):
    BUY = 'buy'
    SELL = 'sell'


class OrderStatus(str, Enum):
    PENDING = 'pending'
    ACTIVE = 'active'
    PARTIALLY_FILLED = 'partially_filled'
    FILLED = 'filled'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'
    REJECTED = 'rejected'
    TRIGGERED = 'triggered'


class TrailingStopOrder(db.Model):
    """
    Trailing Stop Order
    - Follows price movement in favorable direction
    - Triggers when price moves against by trail_amount/trail_percent
    """
    __tablename__ = 'trailing_stop_orders'
    __table_args__ = (
        db.Index('idx_trailing_user', 'user_id'),
        db.Index('idx_trailing_challenge', 'challenge_id'),
        db.Index('idx_trailing_status', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)

    # Order details
    symbol = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # buy/sell
    quantity = db.Column(db.Numeric(15, 5), nullable=False)

    # Trailing configuration
    trail_type = db.Column(db.String(10), default='amount')  # 'amount' or 'percent'
    trail_amount = db.Column(db.Numeric(15, 5), nullable=True)  # Fixed pip/point distance
    trail_percent = db.Column(db.Numeric(5, 2), nullable=True)  # Percentage distance

    # Price tracking
    activation_price = db.Column(db.Numeric(15, 5), nullable=True)  # Price to activate trailing
    current_stop_price = db.Column(db.Numeric(15, 5), nullable=True)  # Current trailing stop level
    highest_price = db.Column(db.Numeric(15, 5), nullable=True)  # Best price seen (for sell)
    lowest_price = db.Column(db.Numeric(15, 5), nullable=True)  # Best price seen (for buy)

    # Status
    status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    triggered_at = db.Column(db.DateTime, nullable=True)
    triggered_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Linked position (if attached to existing position)
    position_id = db.Column(db.Integer, db.ForeignKey('trades.id', ondelete='SET NULL'), nullable=True)

    # Result
    filled_price = db.Column(db.Numeric(15, 5), nullable=True)
    filled_quantity = db.Column(db.Numeric(15, 5), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='trailing_stop_orders')
    challenge = db.relationship('UserChallenge', backref='trailing_stop_orders')

    def update_trailing_stop(self, current_price):
        """Update the trailing stop based on current price"""
        current_price = Decimal(str(current_price))

        # Check if activated
        if self.activation_price and self.status == OrderStatus.PENDING.value:
            if self.side == OrderSide.SELL.value and current_price >= self.activation_price:
                self.status = OrderStatus.ACTIVE.value
            elif self.side == OrderSide.BUY.value and current_price <= self.activation_price:
                self.status = OrderStatus.ACTIVE.value

        if self.status != OrderStatus.ACTIVE.value:
            return False

        # Calculate trail distance
        if self.trail_type == 'percent':
            trail_distance = current_price * (self.trail_percent / Decimal('100'))
        else:
            trail_distance = self.trail_amount

        triggered = False

        if self.side == OrderSide.SELL.value:
            # For sell trailing stop (long position protection)
            if self.highest_price is None or current_price > self.highest_price:
                self.highest_price = current_price
                self.current_stop_price = current_price - trail_distance

            # Check if triggered
            if current_price <= self.current_stop_price:
                triggered = True

        else:  # BUY side
            # For buy trailing stop (short position protection)
            if self.lowest_price is None or current_price < self.lowest_price:
                self.lowest_price = current_price
                self.current_stop_price = current_price + trail_distance

            # Check if triggered
            if current_price >= self.current_stop_price:
                triggered = True

        if triggered:
            self.status = OrderStatus.TRIGGERED.value
            self.triggered_at = datetime.utcnow()
            self.triggered_price = current_price
            return True

        return False

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'symbol': self.symbol,
            'side': self.side,
            'quantity': float(self.quantity),
            'trail_type': self.trail_type,
            'trail_amount': float(self.trail_amount) if self.trail_amount else None,
            'trail_percent': float(self.trail_percent) if self.trail_percent else None,
            'activation_price': float(self.activation_price) if self.activation_price else None,
            'current_stop_price': float(self.current_stop_price) if self.current_stop_price else None,
            'highest_price': float(self.highest_price) if self.highest_price else None,
            'lowest_price': float(self.lowest_price) if self.lowest_price else None,
            'status': self.status,
            'triggered_at': self.triggered_at.isoformat() if self.triggered_at else None,
            'triggered_price': float(self.triggered_price) if self.triggered_price else None,
            'position_id': self.position_id,
            'filled_price': float(self.filled_price) if self.filled_price else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }


class OCOOrder(db.Model):
    """
    One-Cancels-Other Order
    - Two orders linked together
    - When one executes, the other is cancelled
    - Typically: Take Profit + Stop Loss
    """
    __tablename__ = 'oco_orders'
    __table_args__ = (
        db.Index('idx_oco_user', 'user_id'),
        db.Index('idx_oco_challenge', 'challenge_id'),
        db.Index('idx_oco_status', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)

    # Common details
    symbol = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Numeric(15, 5), nullable=False)

    # Order 1 (typically Take Profit - Limit order)
    order1_side = db.Column(db.String(10), nullable=False)
    order1_type = db.Column(db.String(20), default='limit')
    order1_price = db.Column(db.Numeric(15, 5), nullable=False)
    order1_status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    order1_filled_at = db.Column(db.DateTime, nullable=True)
    order1_filled_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Order 2 (typically Stop Loss - Stop order)
    order2_side = db.Column(db.String(10), nullable=False)
    order2_type = db.Column(db.String(20), default='stop')
    order2_price = db.Column(db.Numeric(15, 5), nullable=False)
    order2_stop_limit_price = db.Column(db.Numeric(15, 5), nullable=True)  # For stop-limit
    order2_status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    order2_filled_at = db.Column(db.DateTime, nullable=True)
    order2_filled_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Overall status
    status = db.Column(db.String(20), default=OrderStatus.ACTIVE.value)
    executed_order = db.Column(db.Integer, nullable=True)  # 1 or 2

    # Linked position
    position_id = db.Column(db.Integer, db.ForeignKey('trades.id', ondelete='SET NULL'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='oco_orders')
    challenge = db.relationship('UserChallenge', backref='oco_orders')

    def check_trigger(self, current_price):
        """Check if either order should be triggered"""
        current_price = Decimal(str(current_price))

        if self.status != OrderStatus.ACTIVE.value:
            return None

        # Check Order 1 (Limit - Take Profit)
        if self.order1_status == OrderStatus.PENDING.value:
            if self.order1_type == 'limit':
                if self.order1_side == OrderSide.SELL.value and current_price >= self.order1_price:
                    return 1
                elif self.order1_side == OrderSide.BUY.value and current_price <= self.order1_price:
                    return 1

        # Check Order 2 (Stop - Stop Loss)
        if self.order2_status == OrderStatus.PENDING.value:
            if self.order2_type == 'stop':
                if self.order2_side == OrderSide.SELL.value and current_price <= self.order2_price:
                    return 2
                elif self.order2_side == OrderSide.BUY.value and current_price >= self.order2_price:
                    return 2

        return None

    def execute_order(self, order_num, filled_price):
        """Execute one order and cancel the other"""
        filled_price = Decimal(str(filled_price))
        now = datetime.utcnow()

        if order_num == 1:
            self.order1_status = OrderStatus.FILLED.value
            self.order1_filled_at = now
            self.order1_filled_price = filled_price
            self.order2_status = OrderStatus.CANCELLED.value
        else:
            self.order2_status = OrderStatus.FILLED.value
            self.order2_filled_at = now
            self.order2_filled_price = filled_price
            self.order1_status = OrderStatus.CANCELLED.value

        self.status = OrderStatus.FILLED.value
        self.executed_order = order_num

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'symbol': self.symbol,
            'quantity': float(self.quantity),
            'order1': {
                'side': self.order1_side,
                'type': self.order1_type,
                'price': float(self.order1_price),
                'status': self.order1_status,
                'filled_at': self.order1_filled_at.isoformat() if self.order1_filled_at else None,
                'filled_price': float(self.order1_filled_price) if self.order1_filled_price else None
            },
            'order2': {
                'side': self.order2_side,
                'type': self.order2_type,
                'price': float(self.order2_price),
                'stop_limit_price': float(self.order2_stop_limit_price) if self.order2_stop_limit_price else None,
                'status': self.order2_status,
                'filled_at': self.order2_filled_at.isoformat() if self.order2_filled_at else None,
                'filled_price': float(self.order2_filled_price) if self.order2_filled_price else None
            },
            'status': self.status,
            'executed_order': self.executed_order,
            'position_id': self.position_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }


class BracketOrder(db.Model):
    """
    Bracket Order (Entry + Take Profit + Stop Loss)
    - Entry order that automatically creates TP and SL when filled
    - All three levels defined upfront
    """
    __tablename__ = 'bracket_orders'
    __table_args__ = (
        db.Index('idx_bracket_user', 'user_id'),
        db.Index('idx_bracket_challenge', 'challenge_id'),
        db.Index('idx_bracket_status', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)

    # Entry Order
    symbol = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # Entry side (buy/sell)
    quantity = db.Column(db.Numeric(15, 5), nullable=False)
    entry_type = db.Column(db.String(20), default='market')  # market, limit, stop
    entry_price = db.Column(db.Numeric(15, 5), nullable=True)  # For limit/stop entries
    entry_status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    entry_filled_at = db.Column(db.DateTime, nullable=True)
    entry_filled_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Take Profit
    take_profit_price = db.Column(db.Numeric(15, 5), nullable=False)
    take_profit_status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    take_profit_filled_at = db.Column(db.DateTime, nullable=True)
    take_profit_filled_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Stop Loss
    stop_loss_price = db.Column(db.Numeric(15, 5), nullable=False)
    stop_loss_status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    stop_loss_filled_at = db.Column(db.DateTime, nullable=True)
    stop_loss_filled_price = db.Column(db.Numeric(15, 5), nullable=True)

    # Optional: Trailing stop on TP
    trailing_stop_enabled = db.Column(db.Boolean, default=False)
    trailing_stop_distance = db.Column(db.Numeric(15, 5), nullable=True)

    # Overall status
    status = db.Column(db.String(20), default=OrderStatus.PENDING.value)
    exit_reason = db.Column(db.String(20), nullable=True)  # 'take_profit', 'stop_loss', 'manual'

    # Created position
    position_id = db.Column(db.Integer, db.ForeignKey('trades.id', ondelete='SET NULL'), nullable=True)

    # Risk/Reward calculation
    risk_amount = db.Column(db.Numeric(15, 5), nullable=True)
    reward_amount = db.Column(db.Numeric(15, 5), nullable=True)
    risk_reward_ratio = db.Column(db.Numeric(5, 2), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='bracket_orders')
    challenge = db.relationship('UserChallenge', backref='bracket_orders')

    def calculate_risk_reward(self):
        """Calculate risk/reward ratio"""
        if not self.entry_filled_price:
            entry = self.entry_price or Decimal('0')
        else:
            entry = self.entry_filled_price

        if self.side == OrderSide.BUY.value:
            self.risk_amount = entry - self.stop_loss_price
            self.reward_amount = self.take_profit_price - entry
        else:
            self.risk_amount = self.stop_loss_price - entry
            self.reward_amount = entry - self.take_profit_price

        if self.risk_amount and self.risk_amount > 0:
            self.risk_reward_ratio = self.reward_amount / self.risk_amount

    def check_entry_trigger(self, current_price):
        """Check if entry should be triggered"""
        if self.entry_status != OrderStatus.PENDING.value:
            return False

        current_price = Decimal(str(current_price))

        if self.entry_type == 'market':
            return True
        elif self.entry_type == 'limit':
            if self.side == OrderSide.BUY.value and current_price <= self.entry_price:
                return True
            elif self.side == OrderSide.SELL.value and current_price >= self.entry_price:
                return True
        elif self.entry_type == 'stop':
            if self.side == OrderSide.BUY.value and current_price >= self.entry_price:
                return True
            elif self.side == OrderSide.SELL.value and current_price <= self.entry_price:
                return True

        return False

    def check_exit_trigger(self, current_price):
        """Check if TP or SL should be triggered"""
        if self.entry_status != OrderStatus.FILLED.value:
            return None

        if self.status != OrderStatus.ACTIVE.value:
            return None

        current_price = Decimal(str(current_price))

        if self.side == OrderSide.BUY.value:
            # Long position
            if current_price >= self.take_profit_price:
                return 'take_profit'
            elif current_price <= self.stop_loss_price:
                return 'stop_loss'
        else:
            # Short position
            if current_price <= self.take_profit_price:
                return 'take_profit'
            elif current_price >= self.stop_loss_price:
                return 'stop_loss'

        return None

    def fill_entry(self, filled_price):
        """Mark entry as filled and activate exit orders"""
        self.entry_status = OrderStatus.FILLED.value
        self.entry_filled_at = datetime.utcnow()
        self.entry_filled_price = Decimal(str(filled_price))
        self.status = OrderStatus.ACTIVE.value
        self.calculate_risk_reward()

    def fill_exit(self, exit_type, filled_price):
        """Mark exit as filled"""
        now = datetime.utcnow()
        filled_price = Decimal(str(filled_price))

        if exit_type == 'take_profit':
            self.take_profit_status = OrderStatus.FILLED.value
            self.take_profit_filled_at = now
            self.take_profit_filled_price = filled_price
            self.stop_loss_status = OrderStatus.CANCELLED.value
        else:
            self.stop_loss_status = OrderStatus.FILLED.value
            self.stop_loss_filled_at = now
            self.stop_loss_filled_price = filled_price
            self.take_profit_status = OrderStatus.CANCELLED.value

        self.status = OrderStatus.FILLED.value
        self.exit_reason = exit_type

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'symbol': self.symbol,
            'side': self.side,
            'quantity': float(self.quantity),
            'entry': {
                'type': self.entry_type,
                'price': float(self.entry_price) if self.entry_price else None,
                'status': self.entry_status,
                'filled_at': self.entry_filled_at.isoformat() if self.entry_filled_at else None,
                'filled_price': float(self.entry_filled_price) if self.entry_filled_price else None
            },
            'take_profit': {
                'price': float(self.take_profit_price),
                'status': self.take_profit_status,
                'filled_at': self.take_profit_filled_at.isoformat() if self.take_profit_filled_at else None,
                'filled_price': float(self.take_profit_filled_price) if self.take_profit_filled_price else None
            },
            'stop_loss': {
                'price': float(self.stop_loss_price),
                'status': self.stop_loss_status,
                'filled_at': self.stop_loss_filled_at.isoformat() if self.stop_loss_filled_at else None,
                'filled_price': float(self.stop_loss_filled_price) if self.stop_loss_filled_price else None
            },
            'trailing_stop_enabled': self.trailing_stop_enabled,
            'trailing_stop_distance': float(self.trailing_stop_distance) if self.trailing_stop_distance else None,
            'status': self.status,
            'exit_reason': self.exit_reason,
            'position_id': self.position_id,
            'risk_amount': float(self.risk_amount) if self.risk_amount else None,
            'reward_amount': float(self.reward_amount) if self.reward_amount else None,
            'risk_reward_ratio': float(self.risk_reward_ratio) if self.risk_reward_ratio else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }


# Helper function to get all active orders for a user
def get_active_orders(user_id, challenge_id=None):
    """Get all active advanced orders for a user"""
    filters = {'user_id': user_id}
    if challenge_id:
        filters['challenge_id'] = challenge_id

    trailing_stops = TrailingStopOrder.query.filter_by(
        **filters
    ).filter(
        TrailingStopOrder.status.in_([OrderStatus.PENDING.value, OrderStatus.ACTIVE.value])
    ).all()

    oco_orders = OCOOrder.query.filter_by(
        **filters
    ).filter(
        OCOOrder.status == OrderStatus.ACTIVE.value
    ).all()

    bracket_orders = BracketOrder.query.filter_by(
        **filters
    ).filter(
        BracketOrder.status.in_([OrderStatus.PENDING.value, OrderStatus.ACTIVE.value])
    ).all()

    return {
        'trailing_stops': [o.to_dict() for o in trailing_stops],
        'oco_orders': [o.to_dict() for o in oco_orders],
        'bracket_orders': [o.to_dict() for o in bracket_orders]
    }
