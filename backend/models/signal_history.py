"""
Signal History Model
Tracks trading signal performance and outcomes
"""

from datetime import datetime
from . import db


class SignalHistory(db.Model):
    """
    Trading signal history with performance tracking.
    Records entry, exit, PnL, and outcome for each signal.
    """
    __tablename__ = 'signal_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)

    # Signal details
    symbol = db.Column(db.String(20), nullable=False, index=True)
    signal_type = db.Column(db.String(10), nullable=False)  # BUY, SELL, HOLD
    source = db.Column(db.String(20), nullable=False, default='technical')  # technical, sentiment, combined, ai

    # Price levels
    entry_price = db.Column(db.Numeric(20, 8), nullable=False)
    stop_loss = db.Column(db.Numeric(20, 8), nullable=True)
    take_profit = db.Column(db.Numeric(20, 8), nullable=True)
    exit_price = db.Column(db.Numeric(20, 8), nullable=True)

    # Signal metadata
    confidence = db.Column(db.Integer, default=50)  # 0-100
    reasons = db.Column(db.Text, nullable=True)  # Comma-separated list of reasons

    # Outcome tracking
    status = db.Column(db.String(20), default='active', index=True)  # active, hit_tp, hit_sl, expired, closed
    pnl_percent = db.Column(db.Float, nullable=True)
    pnl_amount = db.Column(db.Numeric(20, 8), nullable=True)

    # Technical indicator values at signal time
    rsi_value = db.Column(db.Float, nullable=True)
    macd_value = db.Column(db.Float, nullable=True)
    sentiment_score = db.Column(db.Integer, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationship
    user = db.relationship('User', backref=db.backref('signals', lazy='dynamic'))

    def __repr__(self):
        return f'<SignalHistory {self.symbol} {self.signal_type} @ {self.entry_price}>'

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'symbol': self.symbol,
            'signal_type': self.signal_type,
            'source': self.source,
            'entry_price': float(self.entry_price) if self.entry_price else None,
            'stop_loss': float(self.stop_loss) if self.stop_loss else None,
            'take_profit': float(self.take_profit) if self.take_profit else None,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'confidence': self.confidence,
            'reasons': self.reasons.split(',') if self.reasons else [],
            'status': self.status,
            'pnl_percent': self.pnl_percent,
            'pnl_amount': float(self.pnl_amount) if self.pnl_amount else None,
            'rsi_value': self.rsi_value,
            'macd_value': self.macd_value,
            'sentiment_score': self.sentiment_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

    @classmethod
    def get_stats(cls, user_id=None, days=30):
        """Get signal statistics"""
        from datetime import timedelta
        from sqlalchemy import func

        cutoff = datetime.utcnow() - timedelta(days=days)
        query = cls.query.filter(cls.created_at >= cutoff)

        if user_id:
            query = query.filter(cls.user_id == user_id)

        total = query.count()
        wins = query.filter(cls.status == 'hit_tp').count()
        losses = query.filter(cls.status == 'hit_sl').count()
        active = query.filter(cls.status == 'active').count()

        win_rate = (wins / (wins + losses) * 100) if (wins + losses) > 0 else 0

        # Average PnL
        avg_pnl = query.with_entities(func.avg(cls.pnl_percent)).scalar() or 0

        return {
            'total': total,
            'wins': wins,
            'losses': losses,
            'active': active,
            'win_rate': round(win_rate, 1),
            'avg_pnl': round(avg_pnl, 2)
        }

    @classmethod
    def create_signal(cls, symbol, signal_type, entry_price, stop_loss=None,
                      take_profit=None, confidence=50, source='technical',
                      reasons=None, user_id=None, indicators=None):
        """Create a new signal record"""
        signal = cls(
            symbol=symbol.upper(),
            signal_type=signal_type.upper(),
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            confidence=confidence,
            source=source,
            reasons=','.join(reasons) if reasons else None,
            user_id=user_id,
            status='active'
        )

        # Store indicator values if provided
        if indicators:
            signal.rsi_value = indicators.get('rsi')
            signal.macd_value = indicators.get('macd')
            signal.sentiment_score = indicators.get('sentiment')

        db.session.add(signal)
        db.session.commit()

        return signal

    def close_signal(self, exit_price, status='closed'):
        """Close the signal with outcome"""
        self.exit_price = exit_price
        self.status = status
        self.closed_at = datetime.utcnow()

        # Calculate PnL
        entry = float(self.entry_price)
        exit_val = float(exit_price)

        if self.signal_type == 'BUY':
            self.pnl_percent = ((exit_val - entry) / entry) * 100
        else:
            self.pnl_percent = ((entry - exit_val) / entry) * 100

        db.session.commit()
        return self

    def check_outcome(self, current_price):
        """Check if signal hit TP or SL"""
        if self.status != 'active':
            return self.status

        current = float(current_price)
        entry = float(self.entry_price)
        tp = float(self.take_profit) if self.take_profit else None
        sl = float(self.stop_loss) if self.stop_loss else None

        if self.signal_type == 'BUY':
            if tp and current >= tp:
                return self.close_signal(current, 'hit_tp')
            if sl and current <= sl:
                return self.close_signal(current, 'hit_sl')
        else:  # SELL
            if tp and current <= tp:
                return self.close_signal(current, 'hit_tp')
            if sl and current >= sl:
                return self.close_signal(current, 'hit_sl')

        return 'active'
