"""
Blog routes for TradeSense blog system.
Includes public and admin endpoints for posts, categories, tags, and comments.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
from datetime import datetime
from slugify import slugify

from models import db
from models.blog_post import (
    BlogPost, BlogCategory, BlogTag, BlogComment, BlogPostLike,
    PostStatus, get_published_posts, get_featured_posts, get_related_posts,
    get_popular_posts, get_all_categories, get_popular_tags
)

blog_bp = Blueprint('blog', __name__, url_prefix='/api/blog')


# ============== Public Endpoints ==============

@blog_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get published blog posts with pagination and filters"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    tag = request.args.get('tag')
    search = request.args.get('search')

    posts = get_published_posts(
        page=page,
        per_page=per_page,
        category_slug=category,
        tag_slug=tag,
        search=search
    )

    return jsonify({
        'success': True,
        'posts': [p.to_dict() for p in posts.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': posts.total,
            'pages': posts.pages,
            'has_next': posts.has_next,
            'has_prev': posts.has_prev
        }
    })


@blog_bp.route('/posts/featured', methods=['GET'])
def get_featured():
    """Get featured posts"""
    limit = request.args.get('limit', 5, type=int)
    posts = get_featured_posts(limit=limit)

    return jsonify({
        'success': True,
        'posts': [p.to_dict() for p in posts]
    })


@blog_bp.route('/posts/popular', methods=['GET'])
def get_popular():
    """Get popular posts"""
    limit = request.args.get('limit', 5, type=int)
    days = request.args.get('days', 30, type=int)
    posts = get_popular_posts(limit=limit, days=days)

    return jsonify({
        'success': True,
        'posts': [p.to_dict() for p in posts]
    })


@blog_bp.route('/posts/<slug>', methods=['GET'])
def get_post(slug):
    """Get single post by slug"""
    post = BlogPost.query.filter_by(slug=slug).first()

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Only show published posts to public
    if post.status != PostStatus.PUBLISHED.value:
        return jsonify({'error': 'Post not found'}), 404

    # Increment views
    post.increment_views()

    # Get related posts
    related = get_related_posts(post, limit=4)

    return jsonify({
        'success': True,
        'post': post.to_dict(include_content=True),
        'seo': post.to_seo_dict(),
        'related_posts': [p.to_dict() for p in related]
    })


@blog_bp.route('/posts/<slug>/like', methods=['POST'])
@jwt_required()
def like_post(slug):
    """Like a blog post"""
    current_user_id = get_jwt_identity()

    post = BlogPost.query.filter_by(slug=slug).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    existing = BlogPostLike.query.filter_by(
        post_id=post.id,
        user_id=current_user_id
    ).first()

    if existing:
        # Unlike
        db.session.delete(existing)
        post.likes = max(0, (post.likes or 0) - 1)
        liked = False
    else:
        # Like
        like = BlogPostLike(post_id=post.id, user_id=current_user_id)
        db.session.add(like)
        post.likes = (post.likes or 0) + 1
        liked = True

    db.session.commit()

    return jsonify({
        'success': True,
        'liked': liked,
        'likes': post.likes
    })


# ============== Categories ==============

@blog_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = get_all_categories()

    return jsonify({
        'success': True,
        'categories': [c.to_dict() for c in categories]
    })


@blog_bp.route('/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get category by slug"""
    category = BlogCategory.query.filter_by(slug=slug).first()

    if not category:
        return jsonify({'error': 'Category not found'}), 404

    return jsonify({
        'success': True,
        'category': category.to_dict()
    })


# ============== Tags ==============

@blog_bp.route('/tags', methods=['GET'])
def get_tags():
    """Get popular tags"""
    limit = request.args.get('limit', 20, type=int)
    tags = get_popular_tags(limit=limit)

    return jsonify({
        'success': True,
        'tags': [t.to_dict() for t in tags]
    })


# ============== Comments ==============

@blog_bp.route('/posts/<slug>/comments', methods=['GET'])
def get_comments(slug):
    """Get comments for a post"""
    post = BlogPost.query.filter_by(slug=slug).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Get top-level comments only (no parent)
    comments = BlogComment.query.filter_by(
        post_id=post.id,
        parent_id=None,
        is_approved=True
    ).order_by(BlogComment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'comments': [c.to_dict() for c in comments.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': comments.total,
            'pages': comments.pages
        }
    })


@blog_bp.route('/posts/<slug>/comments', methods=['POST'])
@jwt_required(optional=True)
def add_comment(slug):
    """Add comment to a post"""
    post = BlogPost.query.filter_by(slug=slug).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    if not post.comments_enabled:
        return jsonify({'error': 'Comments are disabled for this post'}), 400

    data = request.get_json()
    content = data.get('content', '').strip()

    if not content:
        return jsonify({'error': 'Comment content is required'}), 400

    current_user_id = get_jwt_identity()

    comment = BlogComment(
        post_id=post.id,
        content=content,
        parent_id=data.get('parent_id')
    )

    if current_user_id:
        comment.user_id = current_user_id
    else:
        # Guest comment
        guest_name = data.get('name', '').strip()
        guest_email = data.get('email', '').strip()
        if not guest_name:
            return jsonify({'error': 'Name is required for guest comments'}), 400
        comment.guest_name = guest_name
        comment.guest_email = guest_email
        # Guest comments may require moderation
        comment.is_approved = False

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'success': True,
        'comment': comment.to_dict(),
        'message': 'Comment added' if comment.is_approved else 'Comment submitted for moderation'
    }), 201


# ============== Admin Endpoints ==============

@blog_bp.route('/admin/posts', methods=['GET'])
@jwt_required()
def admin_get_posts():
    """Get all posts (admin)"""
    current_user_id = get_jwt_identity()

    # Check admin role (simplified - you may have a proper role check)
    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = BlogPost.query

    if status:
        query = query.filter_by(status=status)

    posts = query.order_by(BlogPost.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'posts': [p.to_dict(include_content=True) for p in posts.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': posts.total,
            'pages': posts.pages
        }
    })


@blog_bp.route('/admin/posts', methods=['POST'])
@jwt_required()
def admin_create_post():
    """Create a new post (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400

    post = BlogPost(
        title=data['title'],
        content=data['content'],
        excerpt=data.get('excerpt'),
        content_format=data.get('content_format', 'markdown'),
        featured_image=data.get('featured_image'),
        featured_image_alt=data.get('featured_image_alt'),
        thumbnail=data.get('thumbnail'),
        author_id=current_user_id,
        status=data.get('status', PostStatus.DRAFT.value),
        meta_title=data.get('meta_title'),
        meta_description=data.get('meta_description'),
        meta_keywords=data.get('meta_keywords'),
        canonical_url=data.get('canonical_url'),
        og_image=data.get('og_image'),
        is_featured=data.get('is_featured', False),
        is_pinned=data.get('is_pinned', False),
        comments_enabled=data.get('comments_enabled', True)
    )

    # Handle slug
    if data.get('slug'):
        post.slug = slugify(data['slug'])
    else:
        post.slug = post.generate_unique_slug()

    # Calculate reading time
    post.reading_time = post.calculate_reading_time()

    # Handle categories
    category_ids = data.get('category_ids', [])
    if category_ids:
        categories = BlogCategory.query.filter(BlogCategory.id.in_(category_ids)).all()
        post.categories = categories

    # Handle tags
    tag_names = data.get('tags', [])
    tags = []
    for tag_name in tag_names:
        tag = BlogTag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = BlogTag(name=tag_name, slug=slugify(tag_name))
            db.session.add(tag)
        tags.append(tag)
    post.tags = tags

    # Handle publish
    if post.status == PostStatus.PUBLISHED.value:
        post.published_at = datetime.utcnow()

    db.session.add(post)
    db.session.commit()

    return jsonify({
        'success': True,
        'post': post.to_dict(include_content=True)
    }), 201


@blog_bp.route('/admin/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def admin_update_post(post_id):
    """Update a post (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    data = request.get_json()

    # Update fields
    updatable = [
        'title', 'content', 'excerpt', 'content_format',
        'featured_image', 'featured_image_alt', 'thumbnail',
        'status', 'meta_title', 'meta_description', 'meta_keywords',
        'canonical_url', 'og_image', 'is_featured', 'is_pinned',
        'comments_enabled'
    ]

    for field in updatable:
        if field in data:
            setattr(post, field, data[field])

    # Handle slug change
    if data.get('slug') and data['slug'] != post.slug:
        new_slug = slugify(data['slug'])
        existing = BlogPost.query.filter_by(slug=new_slug).first()
        if existing and existing.id != post_id:
            return jsonify({'error': 'Slug already exists'}), 400
        post.slug = new_slug

    # Recalculate reading time
    post.reading_time = post.calculate_reading_time()

    # Handle categories
    if 'category_ids' in data:
        categories = BlogCategory.query.filter(BlogCategory.id.in_(data['category_ids'])).all()
        post.categories = categories

    # Handle tags
    if 'tags' in data:
        tags = []
        for tag_name in data['tags']:
            tag = BlogTag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = BlogTag(name=tag_name, slug=slugify(tag_name))
                db.session.add(tag)
            tags.append(tag)
        post.tags = tags

    # Handle publish
    if data.get('status') == PostStatus.PUBLISHED.value and not post.published_at:
        post.published_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'success': True,
        'post': post.to_dict(include_content=True)
    })


@blog_bp.route('/admin/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_post(post_id):
    """Delete a post (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    db.session.delete(post)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Post deleted'
    })


# ============== Admin Categories ==============

@blog_bp.route('/admin/categories', methods=['POST'])
@jwt_required()
def admin_create_category():
    """Create a category (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    category = BlogCategory(
        name=data['name'],
        slug=slugify(data.get('slug') or data['name']),
        description=data.get('description'),
        color=data.get('color', '#6366f1'),
        icon=data.get('icon'),
        parent_id=data.get('parent_id'),
        order=data.get('order', 0),
        meta_title=data.get('meta_title'),
        meta_description=data.get('meta_description')
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'success': True,
        'category': category.to_dict()
    }), 201


@blog_bp.route('/admin/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def admin_update_category(category_id):
    """Update a category (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    category = BlogCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()

    updatable = ['name', 'description', 'color', 'icon', 'parent_id', 'order',
                 'meta_title', 'meta_description']

    for field in updatable:
        if field in data:
            setattr(category, field, data[field])

    if data.get('slug'):
        category.slug = slugify(data['slug'])

    db.session.commit()

    return jsonify({
        'success': True,
        'category': category.to_dict()
    })


@blog_bp.route('/admin/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_category(category_id):
    """Delete a category (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    category = BlogCategory.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Category deleted'
    })


# ============== Admin Comments ==============

@blog_bp.route('/admin/comments', methods=['GET'])
@jwt_required()
def admin_get_comments():
    """Get all comments for moderation (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pending_only = request.args.get('pending_only', 'false').lower() == 'true'

    query = BlogComment.query

    if pending_only:
        query = query.filter_by(is_approved=False)

    comments = query.order_by(BlogComment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'comments': [c.to_dict() for c in comments.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': comments.total,
            'pages': comments.pages
        }
    })


@blog_bp.route('/admin/comments/<int:comment_id>/approve', methods=['POST'])
@jwt_required()
def admin_approve_comment(comment_id):
    """Approve a comment (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    comment = BlogComment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    comment.is_approved = True
    db.session.commit()

    return jsonify({
        'success': True,
        'comment': comment.to_dict()
    })


@blog_bp.route('/admin/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_comment(comment_id):
    """Delete a comment (admin)"""
    current_user_id = get_jwt_identity()

    from models import User
    user = User.query.get(current_user_id)
    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    comment = BlogComment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    db.session.delete(comment)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Comment deleted'
    })
