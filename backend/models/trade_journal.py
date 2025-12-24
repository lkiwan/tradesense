"""
Trade Journal Model
Allows traders to document, analyze, and learn from their trades
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from . import db


class EmotionType(str, Enum):
    """Emotional state during trade"""
    CONFIDENT = 'confident'
    FEARFUL = 'fearful'
    GREEDY = 'greedy'
    PATIENT = 'patient'
    IMPATIENT = 'impatient'
    FRUSTRATED = 'frustrated'
    CALM = 'calm'
    EXCITED = 'excited'
    ANXIOUS = 'anxious'
    NEUTRAL = 'neutral'


class SetupQuality(str, Enum):
    """Quality rating of the trade setup"""
    A_PLUS = 'A+'
    A = 'A'
    B = 'B'
    C = 'C'
    D = 'D'


class ExecutionRating(str, Enum):
    """How well the trade was executed"""
    PERFECT = 'perfect'
    GOOD = 'good'
    AVERAGE = 'average'
    POOR = 'poor'
    TERRIBLE = 'terrible'


# Predefined tags for categorization
JOURNAL_TAGS = [
    'trend_following', 'counter_trend', 'breakout', 'pullback', 'reversal',
    'scalp', 'day_trade', 'swing', 'news_trade', 'range_bound',
    'support_resistance', 'fibonacci', 'moving_average', 'rsi', 'macd',
    'volume', 'price_action', 'pattern', 'divergence', 'gap',
    'morning_session', 'afternoon_session', 'london_session', 'ny_session', 'asian_session',
    'high_impact_news', 'earnings', 'fed_announcement', 'economic_data',
    'revenge_trade', 'fomo', 'planned_trade', 'impulse_trade'
]


class JournalEntry(db.Model):
    """Trade journal entry for documenting and analyzing trades"""
    __tablename__ = 'journal_entries'
    __table_args__ = (
        db.Index('idx_journal_user', 'user_id'),
        db.Index('idx_journal_trade', 'trade_id'),
        db.Index('idx_journal_date', 'trade_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    trade_id = db.Column(db.Integer, db.ForeignKey('trades.id', ondelete='SET NULL'), nullable=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='SET NULL'), nullable=True)

    # Trade Details (can be linked to actual trade or manual entry)
    symbol = db.Column(db.String(20), nullable=False)
    trade_type = db.Column(db.String(10), nullable=False)  # buy/sell
    lot_size = db.Column(db.Numeric(10, 2), nullable=True)
    entry_price = db.Column(db.Numeric(15, 5), nullable=True)
    exit_price = db.Column(db.Numeric(15, 5), nullable=True)
    stop_loss = db.Column(db.Numeric(15, 5), nullable=True)
    take_profit = db.Column(db.Numeric(15, 5), nullable=True)

    # Results
    profit_loss = db.Column(db.Numeric(15, 2), nullable=True)
    profit_pips = db.Column(db.Numeric(10, 1), nullable=True)
    risk_reward_actual = db.Column(db.Numeric(5, 2), nullable=True)
    risk_reward_planned = db.Column(db.Numeric(5, 2), nullable=True)

    # Timing
    trade_date = db.Column(db.Date, nullable=False)
    entry_time = db.Column(db.Time, nullable=True)
    exit_time = db.Column(db.Time, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    session = db.Column(db.String(20), nullable=True)  # asian, london, ny, etc.

    # Analysis - Pre-Trade
    setup_description = db.Column(db.Text, nullable=True)
    setup_quality = db.Column(db.String(10), nullable=True)  # A+, A, B, C, D
    entry_reason = db.Column(db.Text, nullable=True)
    market_conditions = db.Column(db.Text, nullable=True)
    timeframe = db.Column(db.String(20), nullable=True)  # M1, M5, M15, H1, H4, D1
    trend_direction = db.Column(db.String(20), nullable=True)  # bullish, bearish, ranging

    # Analysis - Post-Trade
    exit_reason = db.Column(db.Text, nullable=True)
    what_went_well = db.Column(db.Text, nullable=True)
    what_went_wrong = db.Column(db.Text, nullable=True)
    lessons_learned = db.Column(db.Text, nullable=True)
    execution_rating = db.Column(db.String(20), nullable=True)
    followed_plan = db.Column(db.Boolean, nullable=True)

    # Psychology
    emotion_before = db.Column(db.String(20), nullable=True)
    emotion_during = db.Column(db.String(20), nullable=True)
    emotion_after = db.Column(db.String(20), nullable=True)
    confidence_level = db.Column(db.Integer, nullable=True)  # 1-10
    stress_level = db.Column(db.Integer, nullable=True)  # 1-10

    # Tags & Categories
    tags = db.Column(db.JSON, default=list)  # Array of tag strings
    strategy_name = db.Column(db.String(100), nullable=True)
    is_mistake = db.Column(db.Boolean, default=False)
    mistake_type = db.Column(db.String(50), nullable=True)  # early_exit, late_entry, moved_sl, etc.

    # Screenshots/Attachments
    screenshots = db.Column(db.JSON, default=list)  # Array of image URLs
    chart_before = db.Column(db.String(500), nullable=True)  # URL to chart before trade
    chart_after = db.Column(db.String(500), nullable=True)  # URL to chart after trade

    # Notes
    notes = db.Column(db.Text, nullable=True)
    trade_plan = db.Column(db.Text, nullable=True)  # Original plan for the trade

    # Ratings
    overall_rating = db.Column(db.Integer, nullable=True)  # 1-5 stars

    # Metadata
    is_public = db.Column(db.Boolean, default=False)  # Share with community
    is_favorite = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('journal_entries', lazy='dynamic'))
    trade = db.relationship('Trade', backref=db.backref('journal_entry', uselist=False))

    def calculate_metrics(self):
        """Calculate derived metrics from trade data"""
        if self.entry_price and self.exit_price and self.stop_loss:
            entry = float(self.entry_price)
            exit_p = float(self.exit_price)
            sl = float(self.stop_loss)

            # Calculate actual R:R
            if self.trade_type == 'buy':
                risk = entry - sl
                reward = exit_p - entry
            else:
                risk = sl - entry
                reward = entry - exit_p

            if risk > 0:
                self.risk_reward_actual = Decimal(str(round(reward / risk, 2)))

    def to_dict(self, include_full=True):
        result = {
            'id': self.id,
            'trade_id': self.trade_id,
            'symbol': self.symbol,
            'trade_type': self.trade_type,
            'lot_size': float(self.lot_size) if self.lot_size else None,
            'entry_price': float(self.entry_price) if self.entry_price else None,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'profit_loss': float(self.profit_loss) if self.profit_loss else None,
            'profit_pips': float(self.profit_pips) if self.profit_pips else None,
            'trade_date': self.trade_date.isoformat() if self.trade_date else None,
            'setup_quality': self.setup_quality,
            'execution_rating': self.execution_rating,
            'tags': self.tags or [],
            'is_favorite': self.is_favorite,
            'overall_rating': self.overall_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_full:
            result.update({
                'stop_loss': float(self.stop_loss) if self.stop_loss else None,
                'take_profit': float(self.take_profit) if self.take_profit else None,
                'risk_reward_actual': float(self.risk_reward_actual) if self.risk_reward_actual else None,
                'risk_reward_planned': float(self.risk_reward_planned) if self.risk_reward_planned else None,
                'entry_time': self.entry_time.isoformat() if self.entry_time else None,
                'exit_time': self.exit_time.isoformat() if self.exit_time else None,
                'duration_minutes': self.duration_minutes,
                'session': self.session,
                'timeframe': self.timeframe,
                'trend_direction': self.trend_direction,
                'setup_description': self.setup_description,
                'entry_reason': self.entry_reason,
                'market_conditions': self.market_conditions,
                'exit_reason': self.exit_reason,
                'what_went_well': self.what_went_well,
                'what_went_wrong': self.what_went_wrong,
                'lessons_learned': self.lessons_learned,
                'followed_plan': self.followed_plan,
                'emotion_before': self.emotion_before,
                'emotion_during': self.emotion_during,
                'emotion_after': self.emotion_after,
                'confidence_level': self.confidence_level,
                'stress_level': self.stress_level,
                'strategy_name': self.strategy_name,
                'is_mistake': self.is_mistake,
                'mistake_type': self.mistake_type,
                'screenshots': self.screenshots or [],
                'chart_before': self.chart_before,
                'chart_after': self.chart_after,
                'notes': self.notes,
                'trade_plan': self.trade_plan,
                'is_public': self.is_public,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })

        return result

    @classmethod
    def create_from_trade(cls, trade, user_id):
        """Create a journal entry from an existing trade"""
        entry = cls(
            user_id=user_id,
            trade_id=trade.id,
            challenge_id=trade.challenge_id,
            symbol=trade.symbol,
            trade_type=trade.trade_type,
            lot_size=trade.lot_size,
            entry_price=trade.entry_price,
            exit_price=trade.exit_price,
            stop_loss=trade.stop_loss,
            take_profit=trade.take_profit,
            profit_loss=trade.profit_loss,
            trade_date=trade.opened_at.date() if trade.opened_at else datetime.utcnow().date(),
            entry_time=trade.opened_at.time() if trade.opened_at else None,
            exit_time=trade.closed_at.time() if trade.closed_at else None
        )

        # Calculate duration
        if trade.opened_at and trade.closed_at:
            duration = trade.closed_at - trade.opened_at
            entry.duration_minutes = int(duration.total_seconds() / 60)

        # Calculate pips (simplified for forex)
        if trade.entry_price and trade.exit_price:
            pip_diff = float(trade.exit_price) - float(trade.entry_price)
            if trade.trade_type == 'sell':
                pip_diff = -pip_diff
            # Assuming 4-digit pairs (multiply by 10000 for pips)
            entry.profit_pips = Decimal(str(round(pip_diff * 10000, 1)))

        entry.calculate_metrics()
        return entry


class JournalTemplate(db.Model):
    """Templates for quick journal entry creation"""
    __tablename__ = 'journal_templates'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    # Pre-filled fields
    setup_description = db.Column(db.Text, nullable=True)
    strategy_name = db.Column(db.String(100), nullable=True)
    timeframe = db.Column(db.String(20), nullable=True)
    tags = db.Column(db.JSON, default=list)
    trade_plan = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='journal_templates')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'setup_description': self.setup_description,
            'strategy_name': self.strategy_name,
            'timeframe': self.timeframe,
            'tags': self.tags or [],
            'trade_plan': self.trade_plan
        }


# Analytics helper functions
def get_journal_analytics(user_id, start_date=None, end_date=None):
    """Calculate comprehensive journal analytics"""
    from sqlalchemy import func, case

    query = JournalEntry.query.filter_by(user_id=user_id)

    if start_date:
        query = query.filter(JournalEntry.trade_date >= start_date)
    if end_date:
        query = query.filter(JournalEntry.trade_date <= end_date)

    entries = query.all()

    if not entries:
        return {
            'total_entries': 0,
            'win_rate': 0,
            'avg_rr': 0,
            'total_pnl': 0,
            'best_trade': None,
            'worst_trade': None,
            'by_emotion': {},
            'by_setup_quality': {},
            'by_session': {},
            'by_tag': {},
            'by_day': {},
            'streak': {'current': 0, 'best': 0}
        }

    # Basic stats
    total = len(entries)
    wins = sum(1 for e in entries if e.profit_loss and float(e.profit_loss) > 0)
    losses = sum(1 for e in entries if e.profit_loss and float(e.profit_loss) < 0)

    # P&L
    total_pnl = sum(float(e.profit_loss) for e in entries if e.profit_loss)
    total_pips = sum(float(e.profit_pips) for e in entries if e.profit_pips)

    # Best/Worst
    sorted_by_pnl = sorted([e for e in entries if e.profit_loss], key=lambda x: float(x.profit_loss), reverse=True)
    best_trade = sorted_by_pnl[0].to_dict(include_full=False) if sorted_by_pnl else None
    worst_trade = sorted_by_pnl[-1].to_dict(include_full=False) if sorted_by_pnl else None

    # Average R:R
    rr_entries = [float(e.risk_reward_actual) for e in entries if e.risk_reward_actual]
    avg_rr = sum(rr_entries) / len(rr_entries) if rr_entries else 0

    # By emotion (before trade)
    by_emotion = {}
    for e in entries:
        if e.emotion_before:
            if e.emotion_before not in by_emotion:
                by_emotion[e.emotion_before] = {'count': 0, 'wins': 0, 'pnl': 0}
            by_emotion[e.emotion_before]['count'] += 1
            if e.profit_loss and float(e.profit_loss) > 0:
                by_emotion[e.emotion_before]['wins'] += 1
            if e.profit_loss:
                by_emotion[e.emotion_before]['pnl'] += float(e.profit_loss)

    # By setup quality
    by_quality = {}
    for e in entries:
        if e.setup_quality:
            if e.setup_quality not in by_quality:
                by_quality[e.setup_quality] = {'count': 0, 'wins': 0, 'pnl': 0}
            by_quality[e.setup_quality]['count'] += 1
            if e.profit_loss and float(e.profit_loss) > 0:
                by_quality[e.setup_quality]['wins'] += 1
            if e.profit_loss:
                by_quality[e.setup_quality]['pnl'] += float(e.profit_loss)

    # By session
    by_session = {}
    for e in entries:
        if e.session:
            if e.session not in by_session:
                by_session[e.session] = {'count': 0, 'wins': 0, 'pnl': 0}
            by_session[e.session]['count'] += 1
            if e.profit_loss and float(e.profit_loss) > 0:
                by_session[e.session]['wins'] += 1
            if e.profit_loss:
                by_session[e.session]['pnl'] += float(e.profit_loss)

    # By tag
    by_tag = {}
    for e in entries:
        if e.tags:
            for tag in e.tags:
                if tag not in by_tag:
                    by_tag[tag] = {'count': 0, 'wins': 0, 'pnl': 0}
                by_tag[tag]['count'] += 1
                if e.profit_loss and float(e.profit_loss) > 0:
                    by_tag[tag]['wins'] += 1
                if e.profit_loss:
                    by_tag[tag]['pnl'] += float(e.profit_loss)

    # By day of week
    by_day = {i: {'count': 0, 'wins': 0, 'pnl': 0} for i in range(7)}
    for e in entries:
        if e.trade_date:
            day = e.trade_date.weekday()
            by_day[day]['count'] += 1
            if e.profit_loss and float(e.profit_loss) > 0:
                by_day[day]['wins'] += 1
            if e.profit_loss:
                by_day[day]['pnl'] += float(e.profit_loss)

    # Win streak calculation
    sorted_entries = sorted(entries, key=lambda x: x.trade_date or datetime.min.date())
    current_streak = 0
    best_streak = 0
    temp_streak = 0

    for e in sorted_entries:
        if e.profit_loss and float(e.profit_loss) > 0:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0

    # Current streak (from most recent)
    for e in reversed(sorted_entries):
        if e.profit_loss and float(e.profit_loss) > 0:
            current_streak += 1
        else:
            break

    return {
        'total_entries': total,
        'wins': wins,
        'losses': losses,
        'win_rate': round((wins / total) * 100, 1) if total > 0 else 0,
        'avg_rr': round(avg_rr, 2),
        'total_pnl': round(total_pnl, 2),
        'total_pips': round(total_pips, 1),
        'best_trade': best_trade,
        'worst_trade': worst_trade,
        'by_emotion': by_emotion,
        'by_setup_quality': by_quality,
        'by_session': by_session,
        'by_tag': dict(sorted(by_tag.items(), key=lambda x: x[1]['count'], reverse=True)[:10]),
        'by_day': by_day,
        'streak': {'current': current_streak, 'best': best_streak},
        'mistakes_count': sum(1 for e in entries if e.is_mistake),
        'avg_confidence': round(sum(e.confidence_level for e in entries if e.confidence_level) /
                               len([e for e in entries if e.confidence_level]), 1) if any(e.confidence_level for e in entries) else None
    }
