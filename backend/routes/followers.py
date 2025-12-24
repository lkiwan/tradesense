"""
Follower routes for social trading follow system.
Handles follow/unfollow, followers list, following list, and suggestions.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import desc, func

from models import (
    db, User, TraderProfile, TraderStatistics, TraderFollower, FollowSuggestion,
    is_following, get_follower_count, get_following_count
)

followers_bp = Blueprint('followers', __name__, url_prefix='/api/follow')


# ============== Follow/Unfollow ==============

@followers_bp.route('/<int:user_id>', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Follow a trader"""
    current_user_id = get_jwt_identity()

    # Can't follow yourself
    if int(current_user_id) == user_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400

    # Check if user exists
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404

    # Check if profile is public
    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if profile and not profile.is_public:
        return jsonify({'error': 'Cannot follow a private profile'}), 403

    # Check if already following
    existing = TraderFollower.query.filter_by(
        follower_id=current_user_id,
        following_id=user_id
    ).first()

    if existing:
        return jsonify({'error': 'Already following this user'}), 400

    # Create follow relationship
    follow = TraderFollower(
        follower_id=current_user_id,
        following_id=user_id
    )
    db.session.add(follow)

    # Update follower counts in profiles
    if profile:
        profile.follower_count = get_follower_count(user_id) + 1

    current_profile = TraderProfile.query.filter_by(user_id=current_user_id).first()
    if current_profile:
        current_profile.following_count = get_following_count(current_user_id) + 1

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Successfully followed user',
        'is_following': True,
        'follower_count': profile.follower_count if profile else get_follower_count(user_id)
    })


@followers_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def unfollow_user(user_id):
    """Unfollow a trader"""
    current_user_id = get_jwt_identity()

    # Find the follow relationship
    follow = TraderFollower.query.filter_by(
        follower_id=current_user_id,
        following_id=user_id
    ).first()

    if not follow:
        return jsonify({'error': 'Not following this user'}), 400

    db.session.delete(follow)

    # Update follower counts
    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if profile:
        profile.follower_count = max(0, get_follower_count(user_id) - 1)

    current_profile = TraderProfile.query.filter_by(user_id=current_user_id).first()
    if current_profile:
        current_profile.following_count = max(0, get_following_count(current_user_id) - 1)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Successfully unfollowed user',
        'is_following': False,
        'follower_count': profile.follower_count if profile else get_follower_count(user_id)
    })


@followers_bp.route('/check/<int:user_id>', methods=['GET'])
@jwt_required()
def check_following(user_id):
    """Check if current user is following a specific user"""
    current_user_id = get_jwt_identity()

    following = is_following(current_user_id, user_id)

    return jsonify({
        'success': True,
        'is_following': following
    })


# ============== Followers List ==============

@followers_bp.route('/followers', methods=['GET'])
@jwt_required()
def get_my_followers():
    """Get list of users following the current user"""
    current_user_id = get_jwt_identity()
    return get_followers_for_user(current_user_id)


@followers_bp.route('/followers/<int:user_id>', methods=['GET'])
def get_user_followers(user_id):
    """Get list of followers for a specific user"""
    # Check if profile is public
    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if profile and not profile.is_public:
        return jsonify({'error': 'Profile is private'}), 403

    return get_followers_for_user(user_id)


def get_followers_for_user(user_id):
    """Helper to get followers list"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    followers = TraderFollower.query.filter_by(
        following_id=user_id
    ).order_by(desc(TraderFollower.created_at)).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return jsonify({
        'success': True,
        'followers': [f.to_dict(include_user=True) for f in followers.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': followers.total,
            'pages': followers.pages
        }
    })


# ============== Following List ==============

@followers_bp.route('/following', methods=['GET'])
@jwt_required()
def get_my_following():
    """Get list of users the current user is following"""
    current_user_id = get_jwt_identity()
    return get_following_for_user(current_user_id)


@followers_bp.route('/following/<int:user_id>', methods=['GET'])
def get_user_following(user_id):
    """Get list of users a specific user is following"""
    # Check if profile is public
    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if profile and not profile.is_public:
        return jsonify({'error': 'Profile is private'}), 403

    return get_following_for_user(user_id)


def get_following_for_user(user_id):
    """Helper to get following list"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    following = TraderFollower.query.filter_by(
        follower_id=user_id
    ).order_by(desc(TraderFollower.created_at)).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return jsonify({
        'success': True,
        'following': [f.to_dict(include_user=True) for f in following.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': following.total,
            'pages': following.pages
        }
    })


# ============== Notification Settings ==============

@followers_bp.route('/settings/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_follow_settings(user_id):
    """Update notification settings for a followed user"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    follow = TraderFollower.query.filter_by(
        follower_id=current_user_id,
        following_id=user_id
    ).first()

    if not follow:
        return jsonify({'error': 'Not following this user'}), 400

    if 'notify_trades' in data:
        follow.notify_trades = data['notify_trades']
    if 'notify_ideas' in data:
        follow.notify_ideas = data['notify_ideas']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Settings updated',
        'settings': {
            'notify_trades': follow.notify_trades,
            'notify_ideas': follow.notify_ideas
        }
    })


# ============== Suggestions ==============

@followers_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_follow_suggestions():
    """Get suggested traders to follow"""
    current_user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)

    # Get IDs of users already being followed
    following_ids = db.session.query(TraderFollower.following_id).filter_by(
        follower_id=current_user_id
    ).subquery()

    # Get top performers with public profiles that user is not already following
    suggestions = db.session.query(TraderProfile, TraderStatistics).join(
        TraderStatistics,
        TraderProfile.user_id == TraderStatistics.user_id
    ).filter(
        TraderProfile.is_public == True,
        TraderProfile.user_id != current_user_id,
        ~TraderProfile.user_id.in_(following_ids),
        TraderStatistics.total_trades >= 10  # Minimum activity
    ).order_by(
        desc(TraderStatistics.win_rate)
    ).limit(limit).all()

    result = []
    for profile, stats in suggestions:
        result.append({
            'user_id': profile.user_id,
            'reason': 'top_performer',
            'profile': profile.to_dict(),
            'statistics': {
                'win_rate': stats.win_rate,
                'net_profit': stats.net_profit,
                'total_trades': stats.total_trades,
                'profit_factor': stats.profit_factor
            }
        })

    return jsonify({
        'success': True,
        'suggestions': result
    })


@followers_bp.route('/suggestions/<int:suggestion_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_suggestion(suggestion_id):
    """Dismiss a follow suggestion"""
    current_user_id = get_jwt_identity()

    suggestion = FollowSuggestion.query.filter_by(
        id=suggestion_id,
        user_id=current_user_id
    ).first()

    if suggestion:
        suggestion.is_dismissed = True
        suggestion.dismissed_at = datetime.utcnow()
        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Suggestion dismissed'
    })


# ============== Activity Feed ==============

@followers_bp.route('/feed', methods=['GET'])
@jwt_required()
def get_follow_feed():
    """Get activity feed from followed traders"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Get IDs of users being followed
    following_ids = [f.following_id for f in TraderFollower.query.filter_by(
        follower_id=current_user_id
    ).all()]

    if not following_ids:
        return jsonify({
            'success': True,
            'feed': [],
            'message': 'Follow some traders to see their activity'
        })

    # Get recent trades from followed users
    from models import Trade

    trades = Trade.query.filter(
        Trade.user_id.in_(following_ids),
        Trade.status == 'closed'
    ).order_by(desc(Trade.closed_at)).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    feed_items = []
    for trade in trades.items:
        profile = TraderProfile.query.filter_by(user_id=trade.user_id).first()
        feed_items.append({
            'type': 'trade',
            'user_id': trade.user_id,
            'display_name': profile.display_name if profile else 'Trader',
            'avatar_url': profile.avatar_url if profile else None,
            'trade': {
                'symbol': trade.symbol,
                'direction': trade.direction,
                'profit': trade.profit,
                'profit_pips': trade.profit_pips,
                'closed_at': trade.closed_at.isoformat() if trade.closed_at else None
            },
            'timestamp': trade.closed_at.isoformat() if trade.closed_at else None
        })

    return jsonify({
        'success': True,
        'feed': feed_items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': trades.total,
            'pages': trades.pages
        }
    })


# ============== Stats ==============

@followers_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_follow_stats():
    """Get follow statistics for current user"""
    current_user_id = get_jwt_identity()

    return jsonify({
        'success': True,
        'stats': {
            'follower_count': get_follower_count(current_user_id),
            'following_count': get_following_count(current_user_id)
        }
    })
