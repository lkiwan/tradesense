"""
Blog Post models for the TradeSense blog system.
Includes posts, categories, tags, and comments.
"""
from datetime import datetime
from enum import Enum
from slugify import slugify
from models import db


class PostStatus(Enum):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    SCHEDULED = 'scheduled'
    ARCHIVED = 'archived'


# Association tables for many-to-many relationships
post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('blog_posts.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('blog_tags.id'), primary_key=True)
)

post_categories = db.Table('post_categories',
    db.Column('post_id', db.Integer, db.ForeignKey('blog_posts.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('blog_categories.id'), primary_key=True)
)


class BlogCategory(db.Model):
    """Blog categories for organizing posts"""
    __tablename__ = 'blog_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(120), nullable=False, unique=True)
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default='#6366f1')  # Hex color for UI
    icon = db.Column(db.String(50))  # Icon name
    parent_id = db.Column(db.Integer, db.ForeignKey('blog_categories.id'))
    order = db.Column(db.Integer, default=0)

    # SEO
    meta_title = db.Column(db.String(70))
    meta_description = db.Column(db.String(160))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential relationship for subcategories
    children = db.relationship('BlogCategory', backref=db.backref('parent', remote_side=[id]))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.slug and self.name:
            self.slug = slugify(self.name)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'parent_id': self.parent_id,
            'order': self.order,
            'post_count': len(self.posts) if hasattr(self, 'posts') else 0
        }


class BlogTag(db.Model):
    """Tags for blog posts"""
    __tablename__ = 'blog_tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    slug = db.Column(db.String(60), nullable=False, unique=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.slug and self.name:
            self.slug = slugify(self.name)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'post_count': len(self.posts) if hasattr(self, 'posts') else 0
        }


class BlogPost(db.Model):
    """Blog posts"""
    __tablename__ = 'blog_posts'

    id = db.Column(db.Integer, primary_key=True)

    # Content
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(250), nullable=False, unique=True)
    excerpt = db.Column(db.Text)  # Short summary
    content = db.Column(db.Text, nullable=False)  # Full content (HTML or Markdown)
    content_format = db.Column(db.String(20), default='markdown')  # markdown or html

    # Media
    featured_image = db.Column(db.String(500))  # URL to featured image
    featured_image_alt = db.Column(db.String(200))  # Alt text for accessibility
    thumbnail = db.Column(db.String(500))  # Smaller thumbnail URL

    # Author
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Status
    status = db.Column(db.String(20), default=PostStatus.DRAFT.value)
    published_at = db.Column(db.DateTime)
    scheduled_at = db.Column(db.DateTime)  # For scheduled posts

    # Engagement
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    comments_enabled = db.Column(db.Boolean, default=True)

    # SEO
    meta_title = db.Column(db.String(70))  # SEO title (max 70 chars)
    meta_description = db.Column(db.String(160))  # SEO description (max 160 chars)
    meta_keywords = db.Column(db.String(500))  # Comma-separated keywords
    canonical_url = db.Column(db.String(500))  # Canonical URL if different
    og_image = db.Column(db.String(500))  # Open Graph image

    # Reading
    reading_time = db.Column(db.Integer)  # Estimated reading time in minutes

    # Featured
    is_featured = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)  # Pin to top

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = db.relationship('User', backref=db.backref('blog_posts', lazy='dynamic'))
    categories = db.relationship('BlogCategory', secondary=post_categories,
                                  backref=db.backref('posts', lazy='dynamic'))
    tags = db.relationship('BlogTag', secondary=post_tags,
                           backref=db.backref('posts', lazy='dynamic'))
    comments = db.relationship('BlogComment', backref='post', lazy='dynamic',
                               cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.slug and self.title:
            self.slug = self.generate_unique_slug()
        if not self.reading_time and self.content:
            self.reading_time = self.calculate_reading_time()

    def generate_unique_slug(self):
        """Generate a unique slug from title"""
        base_slug = slugify(self.title)
        slug = base_slug
        counter = 1
        while BlogPost.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def calculate_reading_time(self):
        """Calculate estimated reading time based on word count"""
        if not self.content:
            return 1
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))  # Assume 200 words per minute

    def increment_views(self):
        """Increment view count"""
        self.views = (self.views or 0) + 1
        db.session.commit()

    def publish(self):
        """Publish the post"""
        self.status = PostStatus.PUBLISHED.value
        self.published_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self, include_content=False):
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'featured_image': self.featured_image,
            'featured_image_alt': self.featured_image_alt,
            'thumbnail': self.thumbnail,
            'author': {
                'id': self.author.id,
                'username': self.author.username,
                'avatar': getattr(self.author, 'avatar', None)
            } if self.author else None,
            'status': self.status,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'views': self.views,
            'likes': self.likes,
            'comments_count': self.comments.count() if self.comments else 0,
            'reading_time': self.reading_time,
            'is_featured': self.is_featured,
            'is_pinned': self.is_pinned,
            'categories': [c.to_dict() for c in self.categories],
            'tags': [t.to_dict() for t in self.tags],
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_content:
            data['content'] = self.content
            data['content_format'] = self.content_format
            data['comments_enabled'] = self.comments_enabled
            data['meta_keywords'] = self.meta_keywords
            data['canonical_url'] = self.canonical_url
            data['og_image'] = self.og_image

        return data

    def to_seo_dict(self):
        """Return SEO-specific data"""
        return {
            'title': self.meta_title or self.title,
            'description': self.meta_description or self.excerpt,
            'keywords': self.meta_keywords,
            'canonical_url': self.canonical_url,
            'og_image': self.og_image or self.featured_image,
            'og_type': 'article',
            'article_published_time': self.published_at.isoformat() if self.published_at else None,
            'article_modified_time': self.updated_at.isoformat() if self.updated_at else None,
            'article_author': self.author.username if self.author else None
        }


class BlogComment(db.Model):
    """Comments on blog posts"""
    __tablename__ = 'blog_comments'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # Nullable for guest comments
    parent_id = db.Column(db.Integer, db.ForeignKey('blog_comments.id'))  # For replies

    # Content
    content = db.Column(db.Text, nullable=False)

    # Guest info (if not logged in)
    guest_name = db.Column(db.String(100))
    guest_email = db.Column(db.String(200))

    # Moderation
    is_approved = db.Column(db.Boolean, default=True)  # Auto-approve or require moderation
    is_spam = db.Column(db.Boolean, default=False)

    # Engagement
    likes = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('blog_comments', lazy='dynamic'))
    replies = db.relationship('BlogComment', backref=db.backref('parent', remote_side=[id]),
                              lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'parent_id': self.parent_id,
            'content': self.content,
            'author': {
                'id': self.user.id,
                'username': self.user.username,
                'avatar': getattr(self.user, 'avatar', None)
            } if self.user else {
                'name': self.guest_name,
                'is_guest': True
            },
            'is_approved': self.is_approved,
            'likes': self.likes,
            'replies_count': self.replies.count() if self.replies else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BlogPostLike(db.Model):
    """Likes on blog posts"""
    __tablename__ = 'blog_post_likes'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('post_id', 'user_id', name='unique_post_like'),
    )


# Helper functions
def get_published_posts(page=1, per_page=10, category_slug=None, tag_slug=None, search=None):
    """Get paginated published posts with optional filters"""
    query = BlogPost.query.filter_by(status=PostStatus.PUBLISHED.value)

    if category_slug:
        query = query.join(BlogPost.categories).filter(BlogCategory.slug == category_slug)

    if tag_slug:
        query = query.join(BlogPost.tags).filter(BlogTag.slug == tag_slug)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                BlogPost.title.ilike(search_term),
                BlogPost.excerpt.ilike(search_term),
                BlogPost.content.ilike(search_term)
            )
        )

    # Order by pinned first, then by published date
    query = query.order_by(
        BlogPost.is_pinned.desc(),
        BlogPost.published_at.desc()
    )

    return query.paginate(page=page, per_page=per_page, error_out=False)


def get_featured_posts(limit=5):
    """Get featured posts"""
    return BlogPost.query.filter_by(
        status=PostStatus.PUBLISHED.value,
        is_featured=True
    ).order_by(BlogPost.published_at.desc()).limit(limit).all()


def get_related_posts(post, limit=4):
    """Get related posts based on categories and tags"""
    category_ids = [c.id for c in post.categories]
    tag_ids = [t.id for t in post.tags]

    query = BlogPost.query.filter(
        BlogPost.id != post.id,
        BlogPost.status == PostStatus.PUBLISHED.value
    )

    if category_ids:
        query = query.join(BlogPost.categories).filter(
            BlogCategory.id.in_(category_ids)
        )
    elif tag_ids:
        query = query.join(BlogPost.tags).filter(
            BlogTag.id.in_(tag_ids)
        )

    return query.order_by(BlogPost.published_at.desc()).limit(limit).all()


def get_popular_posts(limit=5, days=30):
    """Get most viewed posts in the last N days"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)

    return BlogPost.query.filter(
        BlogPost.status == PostStatus.PUBLISHED.value,
        BlogPost.published_at >= cutoff
    ).order_by(BlogPost.views.desc()).limit(limit).all()


def get_all_categories():
    """Get all categories with post counts"""
    return BlogCategory.query.order_by(BlogCategory.order, BlogCategory.name).all()


def get_popular_tags(limit=20):
    """Get most used tags"""
    return db.session.query(BlogTag).join(post_tags).group_by(BlogTag.id).order_by(
        db.func.count(post_tags.c.post_id).desc()
    ).limit(limit).all()
