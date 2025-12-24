"""
Trading Ideas models for social trading platform.
Allows traders to share ideas, analysis, and trade setups.
"""
from datetime import datetime
from enum import Enum
from models import db


class IdeaType(Enum):
    LONG = 'long'
    SHORT = 'short'
    NEUTRAL = 'neutral'


class IdeaStatus(Enum):
    ACTIVE = 'active'
    REACHED_TARGET = 'reached_target'
    STOPPED_OUT = 'stopped_out'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'


class IdeaTimeframe(Enum):
    SCALP = 'scalp'  # Minutes to hours
    INTRADAY = 'intraday'  # Same day
    SWING = 'swing'  # Days to weeks
    POSITION = 'position'  # Weeks to months


class TradingIdea(db.Model):
    """Trading idea/signal shared by traders"""
    __tablename__ = 'trading_ideas'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Idea details
    title = db.Column(db.String(200), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    idea_type = db.Column(db.String(20), default=IdeaType.LONG.value)
    timeframe = db.Column(db.String(20), default=IdeaTimeframe.SWING.value)

    # Analysis content
    description = db.Column(db.Text, nullable=False)
    technical_analysis = db.Column(db.Text)
    fundamental_analysis = db.Column(db.Text)

    # Trade levels
    entry_price = db.Column(db.Float)
    stop_loss = db.Column(db.Float)
    take_profit_1 = db.Column(db.Float)
    take_profit_2 = db.Column(db.Float)
    take_profit_3 = db.Column(db.Float)

    # Risk/reward
    risk_reward_ratio = db.Column(db.Float)
    confidence_level = db.Column(db.Integer, default=50)  # 0-100

    # Media
    chart_image_url = db.Column(db.String(500))
    chart_image_2_url = db.Column(db.String(500))
    video_url = db.Column(db.String(500))

    # Tags
    tags = db.Column(db.JSON, default=list)  # ['breakout', 'support', 'earnings']

    # Status tracking
    status = db.Column(db.String(20), default=IdeaStatus.ACTIVE.value)
    outcome_notes = db.Column(db.Text)
    actual_result_percent = db.Column(db.Float)

    # Engagement metrics
    view_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)
    comment_count = db.Column(db.Integer, default=0)
    share_count = db.Column(db.Integer, default=0)
    bookmark_count = db.Column(db.Integer, default=0)

    # Visibility
    is_public = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    closed_at = db.Column(db.DateTime)

    # Relationships
    author = db.relationship('User', backref=db.backref('trading_ideas', lazy='dynamic'))
    comments = db.relationship('IdeaComment', backref='idea', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('IdeaLike', backref='idea', lazy='dynamic', cascade='all, delete-orphan')
    bookmarks = db.relationship('IdeaBookmark', backref='idea', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_author=True, current_user_id=None):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'symbol': self.symbol,
            'idea_type': self.idea_type,
            'timeframe': self.timeframe,
            'description': self.description,
            'technical_analysis': self.technical_analysis,
            'fundamental_analysis': self.fundamental_analysis,
            'entry_price': self.entry_price,
            'stop_loss': self.stop_loss,
            'take_profit_1': self.take_profit_1,
            'take_profit_2': self.take_profit_2,
            'take_profit_3': self.take_profit_3,
            'risk_reward_ratio': self.risk_reward_ratio,
            'confidence_level': self.confidence_level,
            'chart_image_url': self.chart_image_url,
            'chart_image_2_url': self.chart_image_2_url,
            'video_url': self.video_url,
            'tags': self.tags or [],
            'status': self.status,
            'outcome_notes': self.outcome_notes,
            'actual_result_percent': self.actual_result_percent,
            'view_count': self.view_count,
            'like_count': self.like_count,
            'comment_count': self.comment_count,
            'share_count': self.share_count,
            'bookmark_count': self.bookmark_count,
            'is_public': self.is_public,
            'is_featured': self.is_featured,
            'is_pinned': self.is_pinned,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None
        }

        if include_author and self.author:
            from models.trader_profile import TraderProfile
            profile = TraderProfile.query.filter_by(user_id=self.user_id).first()
            data['author'] = {
                'id': self.author.id,
                'username': self.author.username,
                'display_name': profile.display_name if profile else self.author.username,
                'avatar_url': profile.avatar_url if profile else None,
                'is_verified': profile.is_verified if profile else False
            }

        if current_user_id:
            data['is_liked'] = IdeaLike.query.filter_by(
                idea_id=self.id, user_id=current_user_id
            ).first() is not None
            data['is_bookmarked'] = IdeaBookmark.query.filter_by(
                idea_id=self.id, user_id=current_user_id
            ).first() is not None

        return data

    def calculate_risk_reward(self):
        """Calculate risk/reward ratio"""
        if not all([self.entry_price, self.stop_loss, self.take_profit_1]):
            return None

        risk = abs(self.entry_price - self.stop_loss)
        reward = abs(self.take_profit_1 - self.entry_price)

        if risk == 0:
            return None

        self.risk_reward_ratio = round(reward / risk, 2)
        return self.risk_reward_ratio


class IdeaComment(db.Model):
    """Comments on trading ideas"""
    __tablename__ = 'idea_comments'

    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('trading_ideas.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('idea_comments.id'))  # For replies

    content = db.Column(db.Text, nullable=False)

    # Engagement
    like_count = db.Column(db.Integer, default=0)

    # Moderation
    is_edited = db.Column(db.Boolean, default=False)
    is_hidden = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = db.relationship('User', backref=db.backref('idea_comments', lazy='dynamic'))
    replies = db.relationship('IdeaComment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    comment_likes = db.relationship('CommentLike', backref='comment', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_author=True, current_user_id=None):
        data = {
            'id': self.id,
            'idea_id': self.idea_id,
            'user_id': self.user_id,
            'parent_id': self.parent_id,
            'content': self.content,
            'like_count': self.like_count,
            'is_edited': self.is_edited,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'reply_count': self.replies.count()
        }

        if include_author and self.author:
            from models.trader_profile import TraderProfile
            profile = TraderProfile.query.filter_by(user_id=self.user_id).first()
            data['author'] = {
                'id': self.author.id,
                'username': self.author.username,
                'display_name': profile.display_name if profile else self.author.username,
                'avatar_url': profile.avatar_url if profile else None
            }

        if current_user_id:
            data['is_liked'] = CommentLike.query.filter_by(
                comment_id=self.id, user_id=current_user_id
            ).first() is not None

        return data


class IdeaLike(db.Model):
    """Likes on trading ideas"""
    __tablename__ = 'idea_likes'

    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('trading_ideas.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('idea_id', 'user_id', name='unique_idea_like'),
    )

    # Relationships
    user = db.relationship('User', backref=db.backref('idea_likes', lazy='dynamic'))


class CommentLike(db.Model):
    """Likes on comments"""
    __tablename__ = 'comment_likes'

    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('idea_comments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('comment_id', 'user_id', name='unique_comment_like'),
    )

    # Relationships
    user = db.relationship('User', backref=db.backref('comment_likes', lazy='dynamic'))


class IdeaBookmark(db.Model):
    """Bookmarks for saving ideas"""
    __tablename__ = 'idea_bookmarks'

    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('trading_ideas.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('idea_id', 'user_id', name='unique_idea_bookmark'),
    )

    # Relationships
    user = db.relationship('User', backref=db.backref('idea_bookmarks', lazy='dynamic'))


# Popular tags for trading ideas
IDEA_TAGS = [
    'breakout', 'breakdown', 'support', 'resistance', 'trendline',
    'fibonacci', 'elliott-wave', 'harmonic', 'divergence', 'momentum',
    'reversal', 'continuation', 'double-top', 'double-bottom', 'head-shoulders',
    'triangle', 'wedge', 'flag', 'channel', 'range',
    'earnings', 'news', 'fundamental', 'macro', 'sentiment',
    'scalp', 'day-trade', 'swing', 'position', 'investment'
]


# Helper functions
def get_trending_ideas(limit=10):
    """Get trending ideas based on recent engagement"""
    from datetime import timedelta

    recent = datetime.utcnow() - timedelta(days=7)

    return TradingIdea.query.filter(
        TradingIdea.is_public == True,
        TradingIdea.status == IdeaStatus.ACTIVE.value,
        TradingIdea.created_at >= recent
    ).order_by(
        (TradingIdea.like_count + TradingIdea.comment_count * 2).desc()
    ).limit(limit).all()


def get_ideas_by_symbol(symbol, limit=20):
    """Get ideas for a specific symbol"""
    return TradingIdea.query.filter(
        TradingIdea.is_public == True,
        TradingIdea.symbol.ilike(f'%{symbol}%')
    ).order_by(TradingIdea.created_at.desc()).limit(limit).all()


def get_user_ideas(user_id, include_private=False):
    """Get ideas by a specific user"""
    query = TradingIdea.query.filter_by(user_id=user_id)

    if not include_private:
        query = query.filter_by(is_public=True)

    return query.order_by(TradingIdea.created_at.desc()).all()
