"""
Trader Profile models for social trading features.
Tracks trader statistics, badges, and public profile data.
"""
from datetime import datetime
from . import db


class TraderProfile(db.Model):
    """Extended trader profile for social features"""
    __tablename__ = 'trader_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)

    # Profile Info
    display_name = db.Column(db.String(50))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    cover_image_url = db.Column(db.String(500))
    country = db.Column(db.String(50))
    trading_since = db.Column(db.Date)

    # Trading Style
    trading_style = db.Column(db.String(50))  # scalper, day_trader, swing_trader, position_trader
    preferred_markets = db.Column(db.JSON)  # ['forex', 'crypto', 'indices']
    preferred_pairs = db.Column(db.JSON)  # ['EURUSD', 'XAUUSD']

    # Visibility Settings
    is_public = db.Column(db.Boolean, default=False)
    show_trades = db.Column(db.Boolean, default=True)
    show_statistics = db.Column(db.Boolean, default=True)
    show_equity_curve = db.Column(db.Boolean, default=True)
    allow_copy_trading = db.Column(db.Boolean, default=False)

    # Verification & Badges
    is_verified = db.Column(db.Boolean, default=False)
    verification_date = db.Column(db.DateTime)
    badges = db.Column(db.JSON, default=list)  # ['funded_trader', 'top_10', 'consistent']

    # Social Stats
    follower_count = db.Column(db.Integer, default=0)
    following_count = db.Column(db.Integer, default=0)
    copier_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('trader_profile', uselist=False))

    def to_dict(self, include_private=False):
        """Convert profile to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'display_name': self.display_name or self.user.username,
            'avatar_url': self.avatar_url,
            'cover_image_url': self.cover_image_url,
            'bio': self.bio,
            'country': self.country,
            'trading_since': self.trading_since.isoformat() if self.trading_since else None,
            'trading_style': self.trading_style,
            'preferred_markets': self.preferred_markets or [],
            'preferred_pairs': self.preferred_pairs or [],
            'is_public': self.is_public,
            'is_verified': self.is_verified,
            'badges': self.badges or [],
            'follower_count': self.follower_count,
            'following_count': self.following_count,
            'copier_count': self.copier_count,
            'allow_copy_trading': self.allow_copy_trading,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_private:
            data.update({
                'show_trades': self.show_trades,
                'show_statistics': self.show_statistics,
                'show_equity_curve': self.show_equity_curve
            })

        return data


class TraderStatistics(db.Model):
    """Cached trader statistics for quick access"""
    __tablename__ = 'trader_statistics'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)

    # Overall Performance
    total_trades = db.Column(db.Integer, default=0)
    winning_trades = db.Column(db.Integer, default=0)
    losing_trades = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Float, default=0.0)  # Percentage

    # Profit/Loss
    total_profit = db.Column(db.Float, default=0.0)
    total_loss = db.Column(db.Float, default=0.0)
    net_profit = db.Column(db.Float, default=0.0)
    profit_factor = db.Column(db.Float, default=0.0)  # Gross Profit / Gross Loss

    # Risk Metrics
    max_drawdown = db.Column(db.Float, default=0.0)  # Percentage
    max_drawdown_amount = db.Column(db.Float, default=0.0)
    sharpe_ratio = db.Column(db.Float, default=0.0)
    sortino_ratio = db.Column(db.Float, default=0.0)

    # Average Metrics
    avg_trade_duration = db.Column(db.Float, default=0.0)  # In minutes
    avg_profit_per_trade = db.Column(db.Float, default=0.0)
    avg_loss_per_trade = db.Column(db.Float, default=0.0)
    avg_risk_reward = db.Column(db.Float, default=0.0)

    # Best/Worst
    best_trade = db.Column(db.Float, default=0.0)
    worst_trade = db.Column(db.Float, default=0.0)
    longest_win_streak = db.Column(db.Integer, default=0)
    longest_lose_streak = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)  # Positive = wins, negative = losses

    # Monthly Performance
    monthly_returns = db.Column(db.JSON, default=dict)  # {'2024-01': 5.2, '2024-02': -1.3}

    # Trading Patterns
    most_traded_pair = db.Column(db.String(20))
    most_profitable_pair = db.Column(db.String(20))
    avg_trades_per_day = db.Column(db.Float, default=0.0)

    # Time-based Stats
    trading_days = db.Column(db.Integer, default=0)
    profitable_days = db.Column(db.Integer, default=0)

    # Timestamps
    last_calculated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('trader_statistics', uselist=False))

    def to_dict(self):
        """Convert statistics to dictionary"""
        return {
            'user_id': self.user_id,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate': round(self.win_rate, 2),
            'total_profit': round(self.total_profit, 2),
            'total_loss': round(self.total_loss, 2),
            'net_profit': round(self.net_profit, 2),
            'profit_factor': round(self.profit_factor, 2),
            'max_drawdown': round(self.max_drawdown, 2),
            'sharpe_ratio': round(self.sharpe_ratio, 2),
            'sortino_ratio': round(self.sortino_ratio, 2),
            'avg_trade_duration': round(self.avg_trade_duration, 0),
            'avg_profit_per_trade': round(self.avg_profit_per_trade, 2),
            'avg_loss_per_trade': round(self.avg_loss_per_trade, 2),
            'avg_risk_reward': round(self.avg_risk_reward, 2),
            'best_trade': round(self.best_trade, 2),
            'worst_trade': round(self.worst_trade, 2),
            'longest_win_streak': self.longest_win_streak,
            'longest_lose_streak': self.longest_lose_streak,
            'current_streak': self.current_streak,
            'monthly_returns': self.monthly_returns or {},
            'most_traded_pair': self.most_traded_pair,
            'most_profitable_pair': self.most_profitable_pair,
            'avg_trades_per_day': round(self.avg_trades_per_day, 1),
            'trading_days': self.trading_days,
            'profitable_days': self.profitable_days,
            'profitable_days_rate': round((self.profitable_days / self.trading_days * 100) if self.trading_days > 0 else 0, 1),
            'last_calculated': self.last_calculated.isoformat() if self.last_calculated else None
        }


class TraderBadge(db.Model):
    """Available badges for traders"""
    __tablename__ = 'trader_badges'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  # Icon name or emoji
    color = db.Column(db.String(20))  # Tailwind color class
    category = db.Column(db.String(50))  # achievement, milestone, special

    # Requirements for automatic awarding
    requirement_type = db.Column(db.String(50))  # trades_count, win_rate, profit, etc.
    requirement_value = db.Column(db.Float)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'category': self.category
        }


class EquitySnapshot(db.Model):
    """Equity curve snapshots for charting"""
    __tablename__ = 'equity_snapshots'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'), nullable=True)

    timestamp = db.Column(db.DateTime, nullable=False)
    equity = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, nullable=False)
    floating_pl = db.Column(db.Float, default=0.0)

    # Daily aggregates
    day_high = db.Column(db.Float)
    day_low = db.Column(db.Float)
    day_open = db.Column(db.Float)
    day_close = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='equity_snapshots')

    def to_dict(self):
        return {
            'timestamp': self.timestamp.isoformat(),
            'equity': round(self.equity, 2),
            'balance': round(self.balance, 2),
            'floating_pl': round(self.floating_pl, 2)
        }


# Default badges to seed
DEFAULT_BADGES = [
    {
        'code': 'first_trade',
        'name': 'First Trade',
        'description': 'Completed your first trade',
        'icon': '🎯',
        'color': 'blue',
        'category': 'milestone',
        'requirement_type': 'trades_count',
        'requirement_value': 1
    },
    {
        'code': 'hundred_trades',
        'name': 'Century Trader',
        'description': 'Completed 100 trades',
        'icon': '💯',
        'color': 'green',
        'category': 'milestone',
        'requirement_type': 'trades_count',
        'requirement_value': 100
    },
    {
        'code': 'funded_trader',
        'name': 'Funded Trader',
        'description': 'Passed evaluation and became funded',
        'icon': '🏆',
        'color': 'gold',
        'category': 'achievement',
        'requirement_type': 'funded',
        'requirement_value': 1
    },
    {
        'code': 'consistent',
        'name': 'Consistent Performer',
        'description': 'Maintained 60%+ win rate for 30 days',
        'icon': '📈',
        'color': 'cyan',
        'category': 'achievement',
        'requirement_type': 'win_rate_30d',
        'requirement_value': 60
    },
    {
        'code': 'risk_manager',
        'name': 'Risk Manager',
        'description': 'Kept max drawdown under 3% for 30 days',
        'icon': '🛡️',
        'color': 'purple',
        'category': 'achievement',
        'requirement_type': 'max_drawdown_30d',
        'requirement_value': 3
    },
    {
        'code': 'profit_master',
        'name': 'Profit Master',
        'description': 'Achieved 10% profit in a single month',
        'icon': '💰',
        'color': 'emerald',
        'category': 'achievement',
        'requirement_type': 'monthly_profit',
        'requirement_value': 10
    },
    {
        'code': 'top_10',
        'name': 'Top 10 Trader',
        'description': 'Ranked in the top 10 traders',
        'icon': '🥇',
        'color': 'amber',
        'category': 'special',
        'requirement_type': 'leaderboard_rank',
        'requirement_value': 10
    },
    {
        'code': 'streak_master',
        'name': 'Streak Master',
        'description': 'Achieved a 10-trade winning streak',
        'icon': '🔥',
        'color': 'orange',
        'category': 'achievement',
        'requirement_type': 'win_streak',
        'requirement_value': 10
    }
]
