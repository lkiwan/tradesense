"""
Trader Follower model for social trading follow system.
Tracks follower relationships between traders.
"""
from datetime import datetime
from . import db


class TraderFollower(db.Model):
    """Follower relationship between traders"""
    __tablename__ = 'trader_followers'

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Notification settings
    notify_trades = db.Column(db.Boolean, default=True)
    notify_ideas = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    follower = db.relationship('User', foreign_keys=[follower_id], backref='following_relations')
    following = db.relationship('User', foreign_keys=[following_id], backref='follower_relations')

    # Ensure unique follower-following pairs
    __table_args__ = (
        db.UniqueConstraint('follower_id', 'following_id', name='unique_follow_relationship'),
    )

    def to_dict(self, include_user=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'follower_id': self.follower_id,
            'following_id': self.following_id,
            'notify_trades': self.notify_trades,
            'notify_ideas': self.notify_ideas,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_user:
            from .trader_profile import TraderProfile

            # Include follower profile info
            follower_profile = TraderProfile.query.filter_by(user_id=self.follower_id).first()
            if follower_profile:
                data['follower_profile'] = {
                    'user_id': self.follower_id,
                    'display_name': follower_profile.display_name or self.follower.username,
                    'avatar_url': follower_profile.avatar_url,
                    'is_verified': follower_profile.is_verified,
                    'trading_style': follower_profile.trading_style
                }
            else:
                data['follower_profile'] = {
                    'user_id': self.follower_id,
                    'display_name': self.follower.username,
                    'avatar_url': None,
                    'is_verified': False,
                    'trading_style': None
                }

            # Include following profile info
            following_profile = TraderProfile.query.filter_by(user_id=self.following_id).first()
            if following_profile:
                data['following_profile'] = {
                    'user_id': self.following_id,
                    'display_name': following_profile.display_name or self.following.username,
                    'avatar_url': following_profile.avatar_url,
                    'is_verified': following_profile.is_verified,
                    'trading_style': following_profile.trading_style
                }
            else:
                data['following_profile'] = {
                    'user_id': self.following_id,
                    'display_name': self.following.username,
                    'avatar_url': None,
                    'is_verified': False,
                    'trading_style': None
                }

        return data


class FollowSuggestion(db.Model):
    """Suggested traders to follow based on performance"""
    __tablename__ = 'follow_suggestions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    suggested_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Suggestion metadata
    reason = db.Column(db.String(100))  # 'top_performer', 'similar_style', 'popular'
    score = db.Column(db.Float, default=0.0)  # Relevance score

    # Tracking
    is_dismissed = db.Column(db.Boolean, default=False)
    dismissed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    suggested_user = db.relationship('User', foreign_keys=[suggested_user_id])

    __table_args__ = (
        db.UniqueConstraint('user_id', 'suggested_user_id', name='unique_suggestion'),
    )

    def to_dict(self):
        from .trader_profile import TraderProfile, TraderStatistics

        profile = TraderProfile.query.filter_by(user_id=self.suggested_user_id).first()
        stats = TraderStatistics.query.filter_by(user_id=self.suggested_user_id).first()

        return {
            'id': self.id,
            'suggested_user_id': self.suggested_user_id,
            'reason': self.reason,
            'score': self.score,
            'profile': {
                'display_name': profile.display_name if profile else self.suggested_user.username,
                'avatar_url': profile.avatar_url if profile else None,
                'is_verified': profile.is_verified if profile else False,
                'trading_style': profile.trading_style if profile else None,
                'follower_count': profile.follower_count if profile else 0
            } if profile else None,
            'statistics': {
                'win_rate': stats.win_rate if stats else 0,
                'net_profit': stats.net_profit if stats else 0,
                'total_trades': stats.total_trades if stats else 0
            } if stats else None
        }


# Helper functions
def is_following(follower_id, following_id):
    """Check if user is following another user"""
    return TraderFollower.query.filter_by(
        follower_id=follower_id,
        following_id=following_id
    ).first() is not None


def get_follower_count(user_id):
    """Get number of followers for a user"""
    return TraderFollower.query.filter_by(following_id=user_id).count()


def get_following_count(user_id):
    """Get number of users a user is following"""
    return TraderFollower.query.filter_by(follower_id=user_id).count()


def get_mutual_follows(user_id_1, user_id_2):
    """Check if two users follow each other"""
    follows_1 = is_following(user_id_1, user_id_2)
    follows_2 = is_following(user_id_2, user_id_1)
    return follows_1 and follows_2
