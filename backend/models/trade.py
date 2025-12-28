from datetime import datetime
from decimal import Decimal
from . import db


class Trade(db.Model):
    __tablename__ = 'trades'
    __table_args__ = (
        db.Index('idx_trades_challenge_status', 'challenge_id', 'status'),
        db.Index('idx_trades_symbol', 'symbol'),
        db.Index('idx_trades_opened_at', 'opened_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='CASCADE'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    trade_type = db.Column(db.String(10), nullable=False)  # buy, sell
    quantity = db.Column(db.Numeric(15, 8), nullable=False)
    entry_price = db.Column(db.Numeric(15, 4), nullable=False)
    exit_price = db.Column(db.Numeric(15, 4), default=None)
    stop_loss = db.Column(db.Numeric(15, 5), nullable=True)
    take_profit = db.Column(db.Numeric(15, 5), nullable=True)
    pnl = db.Column(db.Numeric(15, 2), default=None)
    status = db.Column(db.String(20), default='open', index=True)  # open, closed
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, default=None)

    @property
    def trade_value(self):
        """Calculate total trade value"""
        return float(self.quantity * self.entry_price)

    def close_trade(self, exit_price):
        """Close the trade and calculate PnL"""
        self.exit_price = Decimal(str(exit_price))
        self.closed_at = datetime.utcnow()
        self.status = 'closed'

        # Calculate PnL
        if self.trade_type == 'buy':
            self.pnl = (self.exit_price - self.entry_price) * self.quantity
        else:  # sell (short)
            self.pnl = (self.entry_price - self.exit_price) * self.quantity

        return float(self.pnl)

    def to_dict(self):
        """Convert trade to dictionary"""
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'symbol': self.symbol,
            'trade_type': self.trade_type,
            'quantity': float(self.quantity),
            'entry_price': float(self.entry_price),
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'stop_loss': float(self.stop_loss) if self.stop_loss else None,
            'take_profit': float(self.take_profit) if self.take_profit else None,
            'pnl': float(self.pnl) if self.pnl else None,
            'status': self.status,
            'trade_value': self.trade_value,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None
        }

    def __repr__(self):
        return f'<Trade {self.id} - {self.symbol} {self.trade_type}>'
