"""
Trading Ideas routes for social trading platform.
Handles CRUD operations, likes, comments, and bookmarks.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import desc, or_

from models import db, User
from models.trading_idea import (
    TradingIdea, IdeaComment, IdeaLike, CommentLike, IdeaBookmark,
    IdeaStatus, IdeaType, IdeaTimeframe, IDEA_TAGS,
    get_trending_ideas, get_ideas_by_symbol
)
from models.trader_profile import TraderProfile

ideas_bp = Blueprint('ideas', __name__, url_prefix='/api/ideas')


# ============== CRUD Operations ==============

@ideas_bp.route('', methods=['GET'])
@jwt_required()
def get_ideas():
    """Get paginated list of trading ideas with filters"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Filters
    symbol = request.args.get('symbol')
    idea_type = request.args.get('type')  # long, short, neutral
    timeframe = request.args.get('timeframe')
    tag = request.args.get('tag')
    author_id = request.args.get('author_id', type=int)
    status = request.args.get('status', 'active')
    sort_by = request.args.get('sort', 'recent')  # recent, popular, trending

    # Base query
    query = TradingIdea.query.filter(TradingIdea.is_public == True)

    # Apply filters
    if symbol:
        query = query.filter(TradingIdea.symbol.ilike(f'%{symbol}%'))

    if idea_type:
        query = query.filter(TradingIdea.idea_type == idea_type)

    if timeframe:
        query = query.filter(TradingIdea.timeframe == timeframe)

    if tag:
        query = query.filter(TradingIdea.tags.contains([tag]))

    if author_id:
        query = query.filter(TradingIdea.user_id == author_id)

    if status and status != 'all':
        query = query.filter(TradingIdea.status == status)

    # Sorting
    if sort_by == 'popular':
        query = query.order_by(desc(TradingIdea.like_count))
    elif sort_by == 'trending':
        query = query.order_by(desc(TradingIdea.like_count + TradingIdea.comment_count * 2))
    elif sort_by == 'most_commented':
        query = query.order_by(desc(TradingIdea.comment_count))
    else:  # recent
        query = query.order_by(desc(TradingIdea.created_at))

    # Paginate
    results = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in results.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@ideas_bp.route('/trending', methods=['GET'])
@jwt_required()
def get_trending():
    """Get trending ideas"""
    current_user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)

    ideas = get_trending_ideas(limit=limit)

    return jsonify({
        'success': True,
        'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in ideas]
    })


@ideas_bp.route('/feed', methods=['GET'])
@jwt_required()
def get_feed():
    """Get personalized feed based on followed traders"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Get IDs of traders the user follows
    from models.trader_follower import TraderFollower
    following = TraderFollower.query.filter_by(follower_id=current_user_id).all()
    following_ids = [f.trader_id for f in following]

    if not following_ids:
        # If not following anyone, return trending
        ideas = get_trending_ideas(limit=per_page)
        return jsonify({
            'success': True,
            'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in ideas],
            'message': 'Follow traders to personalize your feed'
        })

    # Get ideas from followed traders
    query = TradingIdea.query.filter(
        TradingIdea.user_id.in_(following_ids),
        TradingIdea.is_public == True
    ).order_by(desc(TradingIdea.created_at))

    results = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in results.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@ideas_bp.route('/my-ideas', methods=['GET'])
@jwt_required()
def get_my_ideas():
    """Get current user's ideas"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = TradingIdea.query.filter_by(user_id=current_user_id)

    if status:
        query = query.filter_by(status=status)

    results = query.order_by(desc(TradingIdea.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in results.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@ideas_bp.route('/bookmarks', methods=['GET'])
@jwt_required()
def get_bookmarked_ideas():
    """Get user's bookmarked ideas"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Get bookmarked idea IDs
    bookmarks = IdeaBookmark.query.filter_by(user_id=current_user_id).all()
    idea_ids = [b.idea_id for b in bookmarks]

    if not idea_ids:
        return jsonify({
            'success': True,
            'ideas': [],
            'pagination': {'page': 1, 'per_page': per_page, 'total': 0, 'pages': 0}
        })

    query = TradingIdea.query.filter(TradingIdea.id.in_(idea_ids))
    results = query.order_by(desc(TradingIdea.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'ideas': [idea.to_dict(current_user_id=current_user_id) for idea in results.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@ideas_bp.route('/<int:idea_id>', methods=['GET'])
@jwt_required()
def get_idea(idea_id):
    """Get single idea details"""
    current_user_id = get_jwt_identity()

    idea = TradingIdea.query.get_or_404(idea_id)

    # Check visibility
    if not idea.is_public and idea.user_id != int(current_user_id):
        return jsonify({'error': 'Idea not found'}), 404

    # Increment view count
    idea.view_count += 1
    db.session.commit()

    return jsonify({
        'success': True,
        'idea': idea.to_dict(current_user_id=current_user_id)
    })


@ideas_bp.route('', methods=['POST'])
@jwt_required()
def create_idea():
    """Create a new trading idea"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    if not data.get('title') or not data.get('symbol') or not data.get('description'):
        return jsonify({'error': 'Title, symbol, and description are required'}), 400

    idea = TradingIdea(
        user_id=current_user_id,
        title=data['title'],
        symbol=data['symbol'].upper(),
        idea_type=data.get('idea_type', IdeaType.LONG.value),
        timeframe=data.get('timeframe', IdeaTimeframe.SWING.value),
        description=data['description'],
        technical_analysis=data.get('technical_analysis'),
        fundamental_analysis=data.get('fundamental_analysis'),
        entry_price=data.get('entry_price'),
        stop_loss=data.get('stop_loss'),
        take_profit_1=data.get('take_profit_1'),
        take_profit_2=data.get('take_profit_2'),
        take_profit_3=data.get('take_profit_3'),
        confidence_level=data.get('confidence_level', 50),
        chart_image_url=data.get('chart_image_url'),
        chart_image_2_url=data.get('chart_image_2_url'),
        video_url=data.get('video_url'),
        tags=data.get('tags', []),
        is_public=data.get('is_public', True)
    )

    # Calculate risk/reward
    idea.calculate_risk_reward()

    db.session.add(idea)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Idea published successfully',
        'idea': idea.to_dict(current_user_id=current_user_id)
    }), 201


@ideas_bp.route('/<int:idea_id>', methods=['PUT'])
@jwt_required()
def update_idea(idea_id):
    """Update a trading idea"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    idea = TradingIdea.query.get_or_404(idea_id)

    # Check ownership
    if idea.user_id != int(current_user_id):
        return jsonify({'error': 'Not authorized'}), 403

    # Updatable fields
    updatable = [
        'title', 'description', 'technical_analysis', 'fundamental_analysis',
        'entry_price', 'stop_loss', 'take_profit_1', 'take_profit_2', 'take_profit_3',
        'confidence_level', 'chart_image_url', 'chart_image_2_url', 'video_url',
        'tags', 'is_public', 'status', 'outcome_notes', 'actual_result_percent'
    ]

    for field in updatable:
        if field in data:
            setattr(idea, field, data[field])

    # Recalculate risk/reward if prices changed
    if any(f in data for f in ['entry_price', 'stop_loss', 'take_profit_1']):
        idea.calculate_risk_reward()

    # If status changed to closed states, set closed_at
    if data.get('status') in ['reached_target', 'stopped_out', 'cancelled']:
        idea.closed_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Idea updated',
        'idea': idea.to_dict(current_user_id=current_user_id)
    })


@ideas_bp.route('/<int:idea_id>', methods=['DELETE'])
@jwt_required()
def delete_idea(idea_id):
    """Delete a trading idea"""
    current_user_id = get_jwt_identity()

    idea = TradingIdea.query.get_or_404(idea_id)

    # Check ownership
    if idea.user_id != int(current_user_id):
        return jsonify({'error': 'Not authorized'}), 403

    db.session.delete(idea)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Idea deleted'
    })


# ============== Like/Unlike ==============

@ideas_bp.route('/<int:idea_id>/like', methods=['POST'])
@jwt_required()
def like_idea(idea_id):
    """Like or unlike an idea"""
    current_user_id = get_jwt_identity()

    idea = TradingIdea.query.get_or_404(idea_id)

    existing = IdeaLike.query.filter_by(
        idea_id=idea_id,
        user_id=current_user_id
    ).first()

    if existing:
        # Unlike
        db.session.delete(existing)
        idea.like_count = max(0, idea.like_count - 1)
        action = 'unliked'
    else:
        # Like
        like = IdeaLike(idea_id=idea_id, user_id=current_user_id)
        db.session.add(like)
        idea.like_count += 1
        action = 'liked'

    db.session.commit()

    return jsonify({
        'success': True,
        'action': action,
        'like_count': idea.like_count
    })


# ============== Bookmark ==============

@ideas_bp.route('/<int:idea_id>/bookmark', methods=['POST'])
@jwt_required()
def bookmark_idea(idea_id):
    """Bookmark or unbookmark an idea"""
    current_user_id = get_jwt_identity()

    idea = TradingIdea.query.get_or_404(idea_id)

    existing = IdeaBookmark.query.filter_by(
        idea_id=idea_id,
        user_id=current_user_id
    ).first()

    if existing:
        # Unbookmark
        db.session.delete(existing)
        idea.bookmark_count = max(0, idea.bookmark_count - 1)
        action = 'unbookmarked'
    else:
        # Bookmark
        bookmark = IdeaBookmark(idea_id=idea_id, user_id=current_user_id)
        db.session.add(bookmark)
        idea.bookmark_count += 1
        action = 'bookmarked'

    db.session.commit()

    return jsonify({
        'success': True,
        'action': action,
        'bookmark_count': idea.bookmark_count
    })


# ============== Comments ==============

@ideas_bp.route('/<int:idea_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(idea_id):
    """Get comments for an idea"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    idea = TradingIdea.query.get_or_404(idea_id)

    # Get top-level comments only (not replies)
    query = IdeaComment.query.filter_by(
        idea_id=idea_id,
        parent_id=None,
        is_hidden=False
    ).order_by(desc(IdeaComment.created_at))

    results = query.paginate(page=page, per_page=per_page, error_out=False)

    comments_data = []
    for comment in results.items:
        comment_dict = comment.to_dict(current_user_id=current_user_id)

        # Include replies (limited)
        replies = IdeaComment.query.filter_by(
            parent_id=comment.id,
            is_hidden=False
        ).order_by(IdeaComment.created_at).limit(3).all()

        comment_dict['replies'] = [r.to_dict(current_user_id=current_user_id) for r in replies]
        comments_data.append(comment_dict)

    return jsonify({
        'success': True,
        'comments': comments_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@ideas_bp.route('/<int:idea_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(idea_id):
    """Add a comment to an idea"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    idea = TradingIdea.query.get_or_404(idea_id)

    if not data.get('content'):
        return jsonify({'error': 'Comment content is required'}), 400

    comment = IdeaComment(
        idea_id=idea_id,
        user_id=current_user_id,
        parent_id=data.get('parent_id'),
        content=data['content']
    )

    db.session.add(comment)
    idea.comment_count += 1
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Comment added',
        'comment': comment.to_dict(current_user_id=current_user_id)
    }), 201


@ideas_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Edit a comment"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    comment = IdeaComment.query.get_or_404(comment_id)

    # Check ownership
    if comment.user_id != int(current_user_id):
        return jsonify({'error': 'Not authorized'}), 403

    comment.content = data.get('content', comment.content)
    comment.is_edited = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Comment updated',
        'comment': comment.to_dict(current_user_id=current_user_id)
    })


@ideas_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete a comment"""
    current_user_id = get_jwt_identity()

    comment = IdeaComment.query.get_or_404(comment_id)

    # Check ownership
    if comment.user_id != int(current_user_id):
        return jsonify({'error': 'Not authorized'}), 403

    # Update idea comment count
    idea = TradingIdea.query.get(comment.idea_id)
    if idea:
        idea.comment_count = max(0, idea.comment_count - 1)

    db.session.delete(comment)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Comment deleted'
    })


@ideas_bp.route('/comments/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def like_comment(comment_id):
    """Like or unlike a comment"""
    current_user_id = get_jwt_identity()

    comment = IdeaComment.query.get_or_404(comment_id)

    existing = CommentLike.query.filter_by(
        comment_id=comment_id,
        user_id=current_user_id
    ).first()

    if existing:
        db.session.delete(existing)
        comment.like_count = max(0, comment.like_count - 1)
        action = 'unliked'
    else:
        like = CommentLike(comment_id=comment_id, user_id=current_user_id)
        db.session.add(like)
        comment.like_count += 1
        action = 'liked'

    db.session.commit()

    return jsonify({
        'success': True,
        'action': action,
        'like_count': comment.like_count
    })


# ============== Tags ==============

@ideas_bp.route('/tags', methods=['GET'])
@jwt_required()
def get_tags():
    """Get available tags"""
    return jsonify({
        'success': True,
        'tags': IDEA_TAGS
    })


@ideas_bp.route('/tags/popular', methods=['GET'])
@jwt_required()
def get_popular_tags():
    """Get most used tags"""
    # This would require more complex query in production
    # For now return predefined popular tags
    popular = ['breakout', 'support', 'resistance', 'swing', 'reversal', 'momentum']
    return jsonify({
        'success': True,
        'tags': popular
    })
