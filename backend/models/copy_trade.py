"""
Copy Trading models for social trading features.
Allows traders to automatically copy trades from other traders.
"""
from datetime import datetime
from enum import Enum
from . import db


class CopyStatus(str, Enum):
    ACTIVE = 'active'
    PAUSED = 'paused'
    STOPPED = 'stopped'


class CopyMode(str, Enum):
    PROPORTIONAL = 'proportional'  # Copy based on ratio
    FIXED_LOT = 'fixed_lot'  # Fixed lot size
    FIXED_AMOUNT = 'fixed_amount'  # Fixed dollar amount per trade


class CopyRelationship(db.Model):
    """Relationship between copier and master trader"""
    __tablename__ = 'copy_relationships'

    id = db.Column(db.Integer, primary_key=True)
    copier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    master_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Status
    status = db.Column(db.String(20), default=CopyStatus.ACTIVE.value)

    # Copy Settings
    copy_mode = db.Column(db.String(20), default=CopyMode.PROPORTIONAL.value)
    copy_ratio = db.Column(db.Float, default=1.0)  # For proportional mode
    fixed_lot_size = db.Column(db.Float, default=0.01)  # For fixed lot mode
    fixed_amount = db.Column(db.Float, default=100.0)  # For fixed amount mode

    # Risk Management
    max_lot_size = db.Column(db.Float, default=1.0)
    max_open_trades = db.Column(db.Integer, default=10)
    max_daily_trades = db.Column(db.Integer, default=20)
    max_drawdown_percent = db.Column(db.Float, default=10.0)  # Auto-stop if exceeded
    stop_loss_adjustment = db.Column(db.Float, default=0.0)  # Additional pips to SL
    take_profit_adjustment = db.Column(db.Float, default=0.0)  # Additional pips to TP

    # Filters
    copy_buy = db.Column(db.Boolean, default=True)
    copy_sell = db.Column(db.Boolean, default=True)
    allowed_symbols = db.Column(db.JSON)  # None = all symbols, or ['EURUSD', 'GBPUSD']
    excluded_symbols = db.Column(db.JSON)  # Symbols to exclude

    # Performance Tracking
    total_copied_trades = db.Column(db.Integer, default=0)
    total_profit = db.Column(db.Float, default=0.0)
    total_loss = db.Column(db.Float, default=0.0)
    current_drawdown = db.Column(db.Float, default=0.0)

    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    paused_at = db.Column(db.DateTime)
    stopped_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    copier = db.relationship('User', foreign_keys=[copier_id], backref='copy_relationships_as_copier')
    master = db.relationship('User', foreign_keys=[master_id], backref='copy_relationships_as_master')

    __table_args__ = (
        db.UniqueConstraint('copier_id', 'master_id', name='unique_copy_relationship'),
    )

    def to_dict(self, include_stats=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'copier_id': self.copier_id,
            'master_id': self.master_id,
            'status': self.status,
            'copy_mode': self.copy_mode,
            'copy_ratio': self.copy_ratio,
            'fixed_lot_size': self.fixed_lot_size,
            'fixed_amount': self.fixed_amount,
            'max_lot_size': self.max_lot_size,
            'max_open_trades': self.max_open_trades,
            'max_daily_trades': self.max_daily_trades,
            'max_drawdown_percent': self.max_drawdown_percent,
            'copy_buy': self.copy_buy,
            'copy_sell': self.copy_sell,
            'allowed_symbols': self.allowed_symbols,
            'excluded_symbols': self.excluded_symbols,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_stats:
            data['stats'] = {
                'total_copied_trades': self.total_copied_trades,
                'total_profit': round(self.total_profit, 2),
                'total_loss': round(self.total_loss, 2),
                'net_profit': round(self.total_profit - self.total_loss, 2),
                'current_drawdown': round(self.current_drawdown, 2)
            }

        return data


class CopiedTrade(db.Model):
    """Record of a copied trade"""
    __tablename__ = 'copied_trades'

    id = db.Column(db.Integer, primary_key=True)
    copy_relationship_id = db.Column(db.Integer, db.ForeignKey('copy_relationships.id'), nullable=False)
    master_trade_id = db.Column(db.Integer, db.ForeignKey('trades.id'), nullable=False)
    copier_trade_id = db.Column(db.Integer, db.ForeignKey('trades.id'), nullable=True)

    # Copy Details
    original_lot_size = db.Column(db.Float)
    copied_lot_size = db.Column(db.Float)
    original_entry_price = db.Column(db.Float)
    copied_entry_price = db.Column(db.Float)

    # Status
    status = db.Column(db.String(20), default='pending')  # pending, executed, failed, skipped
    skip_reason = db.Column(db.String(200))  # If skipped, why
    error_message = db.Column(db.String(500))  # If failed, error details

    # Performance
    master_profit = db.Column(db.Float, default=0.0)
    copier_profit = db.Column(db.Float, default=0.0)
    slippage_pips = db.Column(db.Float, default=0.0)

    # Timestamps
    master_opened_at = db.Column(db.DateTime)
    copier_opened_at = db.Column(db.DateTime)
    master_closed_at = db.Column(db.DateTime)
    copier_closed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    copy_relationship = db.relationship('CopyRelationship', backref='copied_trades')
    master_trade = db.relationship('Trade', foreign_keys=[master_trade_id])
    copier_trade = db.relationship('Trade', foreign_keys=[copier_trade_id])

    def to_dict(self):
        return {
            'id': self.id,
            'copy_relationship_id': self.copy_relationship_id,
            'master_trade_id': self.master_trade_id,
            'copier_trade_id': self.copier_trade_id,
            'original_lot_size': self.original_lot_size,
            'copied_lot_size': self.copied_lot_size,
            'status': self.status,
            'skip_reason': self.skip_reason,
            'master_profit': round(self.master_profit, 2) if self.master_profit else 0,
            'copier_profit': round(self.copier_profit, 2) if self.copier_profit else 0,
            'slippage_pips': round(self.slippage_pips, 2) if self.slippage_pips else 0,
            'master_opened_at': self.master_opened_at.isoformat() if self.master_opened_at else None,
            'copier_opened_at': self.copier_opened_at.isoformat() if self.copier_opened_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MasterTraderSettings(db.Model):
    """Settings for traders who allow copying"""
    __tablename__ = 'master_trader_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)

    # Availability
    is_available = db.Column(db.Boolean, default=True)
    max_copiers = db.Column(db.Integer, default=100)

    # Performance Fee
    performance_fee_percent = db.Column(db.Float, default=20.0)  # % of copier profits
    minimum_copy_amount = db.Column(db.Float, default=100.0)

    # Requirements for copiers
    min_account_balance = db.Column(db.Float, default=0.0)
    require_kyc = db.Column(db.Boolean, default=False)

    # Visibility
    show_open_trades = db.Column(db.Boolean, default=False)  # Show current positions
    trade_delay_seconds = db.Column(db.Integer, default=0)  # Delay before broadcasting

    # Stats
    total_copiers = db.Column(db.Integer, default=0)
    total_earnings = db.Column(db.Float, default=0.0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('master_trader_settings', uselist=False))

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'is_available': self.is_available,
            'max_copiers': self.max_copiers,
            'performance_fee_percent': self.performance_fee_percent,
            'minimum_copy_amount': self.minimum_copy_amount,
            'min_account_balance': self.min_account_balance,
            'require_kyc': self.require_kyc,
            'show_open_trades': self.show_open_trades,
            'trade_delay_seconds': self.trade_delay_seconds,
            'total_copiers': self.total_copiers,
            'total_earnings': round(self.total_earnings, 2)
        }


# Helper functions
def get_active_copiers(master_id):
    """Get all active copiers for a master trader"""
    return CopyRelationship.query.filter_by(
        master_id=master_id,
        status=CopyStatus.ACTIVE.value
    ).all()


def get_copy_relationship(copier_id, master_id):
    """Get copy relationship between two users"""
    return CopyRelationship.query.filter_by(
        copier_id=copier_id,
        master_id=master_id
    ).first()


def is_copying(copier_id, master_id):
    """Check if user is copying another trader"""
    rel = get_copy_relationship(copier_id, master_id)
    return rel is not None and rel.status == CopyStatus.ACTIVE.value
