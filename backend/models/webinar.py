"""
Webinar Models for TradeSense
Supports live webinars, registrations, and replays
"""

from datetime import datetime, timedelta
from enum import Enum
from models import db


class WebinarStatus(str, Enum):
    DRAFT = 'draft'
    SCHEDULED = 'scheduled'
    LIVE = 'live'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'


class WebinarType(str, Enum):
    LIVE = 'live'
    RECORDED = 'recorded'
    HYBRID = 'hybrid'  # Live with recording available after


class WebinarCategory(str, Enum):
    TRADING_BASICS = 'trading_basics'
    TECHNICAL_ANALYSIS = 'technical_analysis'
    FUNDAMENTAL_ANALYSIS = 'fundamental_analysis'
    RISK_MANAGEMENT = 'risk_management'
    PSYCHOLOGY = 'psychology'
    PLATFORM_TUTORIAL = 'platform_tutorial'
    MARKET_ANALYSIS = 'market_analysis'
    QA_SESSION = 'qa_session'
    SPECIAL_EVENT = 'special_event'


class RegistrationStatus(str, Enum):
    REGISTERED = 'registered'
    ATTENDED = 'attended'
    NO_SHOW = 'no_show'
    CANCELLED = 'cancelled'


class Webinar(db.Model):
    """Main webinar model"""
    __tablename__ = 'webinars'

    id = db.Column(db.Integer, primary_key=True)

    # Basic Info
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(250), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))

    # Host/Presenter
    host_name = db.Column(db.String(100), nullable=False)
    host_title = db.Column(db.String(100))  # e.g., "Senior Trading Analyst"
    host_bio = db.Column(db.Text)
    host_avatar = db.Column(db.String(500))

    # Scheduling
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    timezone = db.Column(db.String(50), default='UTC')

    # Status & Type
    status = db.Column(db.String(20), default=WebinarStatus.DRAFT.value)
    webinar_type = db.Column(db.String(20), default=WebinarType.LIVE.value)
    category = db.Column(db.String(50), default=WebinarCategory.TRADING_BASICS.value)

    # Media
    thumbnail = db.Column(db.String(500))
    banner_image = db.Column(db.String(500))

    # Meeting Platform Integration (Zoom/Meet/Custom)
    platform = db.Column(db.String(50), default='zoom')  # zoom, google_meet, youtube_live, custom
    meeting_id = db.Column(db.String(100))
    meeting_password = db.Column(db.String(100))
    join_url = db.Column(db.String(500))
    host_url = db.Column(db.String(500))  # URL for host to start

    # Recording
    has_recording = db.Column(db.Boolean, default=False)
    recording_url = db.Column(db.String(500))
    recording_duration = db.Column(db.Integer)  # Actual recording duration in minutes
    recording_available_at = db.Column(db.DateTime)

    # Access Control
    is_free = db.Column(db.Boolean, default=True)
    required_subscription = db.Column(db.String(50))  # Subscription plan required if not free
    price = db.Column(db.Float, default=0.0)  # One-time price if paid
    max_attendees = db.Column(db.Integer, default=500)

    # Settings
    requires_registration = db.Column(db.Boolean, default=True)
    send_reminder_emails = db.Column(db.Boolean, default=True)
    allow_chat = db.Column(db.Boolean, default=True)
    allow_questions = db.Column(db.Boolean, default=True)

    # SEO
    meta_title = db.Column(db.String(200))
    meta_description = db.Column(db.String(500))

    # Stats
    view_count = db.Column(db.Integer, default=0)
    registration_count = db.Column(db.Integer, default=0)
    attendance_count = db.Column(db.Integer, default=0)
    replay_count = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)

    # Relationships
    registrations = db.relationship('WebinarRegistration', backref='webinar', lazy='dynamic', cascade='all, delete-orphan')
    resources = db.relationship('WebinarResource', backref='webinar', lazy='dynamic', cascade='all, delete-orphan')
    questions = db.relationship('WebinarQuestion', backref='webinar', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'description': self.description,
            'short_description': self.short_description,
            'host': {
                'name': self.host_name,
                'title': self.host_title,
                'bio': self.host_bio,
                'avatar': self.host_avatar
            },
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'timezone': self.timezone,
            'status': self.status,
            'webinar_type': self.webinar_type,
            'category': self.category,
            'thumbnail': self.thumbnail,
            'banner_image': self.banner_image,
            'platform': self.platform,
            'is_free': self.is_free,
            'price': self.price,
            'max_attendees': self.max_attendees,
            'requires_registration': self.requires_registration,
            'has_recording': self.has_recording,
            'recording_available_at': self.recording_available_at.isoformat() if self.recording_available_at else None,
            'view_count': self.view_count,
            'registration_count': self.registration_count,
            'attendance_count': self.attendance_count,
            'replay_count': self.replay_count,
            'is_upcoming': self.is_upcoming,
            'is_live': self.is_live,
            'is_past': self.is_past,
            'can_register': self.can_register,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_private:
            data['meeting_id'] = self.meeting_id
            data['meeting_password'] = self.meeting_password
            data['join_url'] = self.join_url
            data['host_url'] = self.host_url
            data['recording_url'] = self.recording_url
            data['required_subscription'] = self.required_subscription

        return data

    @property
    def is_upcoming(self):
        if not self.scheduled_at:
            return False
        return self.scheduled_at > datetime.utcnow() and self.status == WebinarStatus.SCHEDULED.value

    @property
    def is_live(self):
        return self.status == WebinarStatus.LIVE.value

    @property
    def is_past(self):
        if not self.scheduled_at:
            return False
        end_time = self.scheduled_at + timedelta(minutes=self.duration_minutes or 60)
        return end_time < datetime.utcnow() or self.status == WebinarStatus.COMPLETED.value

    @property
    def can_register(self):
        if self.status not in [WebinarStatus.SCHEDULED.value, WebinarStatus.LIVE.value]:
            return False
        if self.max_attendees and self.registration_count >= self.max_attendees:
            return False
        return True

    @property
    def end_time(self):
        if not self.scheduled_at:
            return None
        return self.scheduled_at + timedelta(minutes=self.duration_minutes or 60)


class WebinarRegistration(db.Model):
    """Track user registrations for webinars"""
    __tablename__ = 'webinar_registrations'

    id = db.Column(db.Integer, primary_key=True)
    webinar_id = db.Column(db.Integer, db.ForeignKey('webinars.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Status
    status = db.Column(db.String(20), default=RegistrationStatus.REGISTERED.value)

    # Attendance tracking
    joined_at = db.Column(db.DateTime)
    left_at = db.Column(db.DateTime)
    watch_duration_minutes = db.Column(db.Integer, default=0)

    # Replay access
    watched_replay = db.Column(db.Boolean, default=False)
    replay_watch_count = db.Column(db.Integer, default=0)
    last_replay_watched_at = db.Column(db.DateTime)

    # Reminders
    reminder_sent_24h = db.Column(db.Boolean, default=False)
    reminder_sent_1h = db.Column(db.Boolean, default=False)

    # Payment (for paid webinars)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'))
    paid_amount = db.Column(db.Float, default=0.0)

    # Timestamps
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('webinar_id', 'user_id', name='unique_webinar_registration'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'webinar_id': self.webinar_id,
            'user_id': self.user_id,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'watch_duration_minutes': self.watch_duration_minutes,
            'watched_replay': self.watched_replay,
            'replay_watch_count': self.replay_watch_count,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None
        }


class WebinarResource(db.Model):
    """Downloadable resources attached to webinars (slides, PDFs, etc.)"""
    __tablename__ = 'webinar_resources'

    id = db.Column(db.Integer, primary_key=True)
    webinar_id = db.Column(db.Integer, db.ForeignKey('webinars.id', ondelete='CASCADE'), nullable=False)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500))
    file_url = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))  # pdf, pptx, xlsx, etc.
    file_size = db.Column(db.Integer)  # Size in bytes

    # Access control
    available_before = db.Column(db.Boolean, default=False)  # Available before webinar
    available_after = db.Column(db.Boolean, default=True)   # Available after webinar

    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'file_url': self.file_url,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'available_before': self.available_before,
            'available_after': self.available_after,
            'download_count': self.download_count
        }


class WebinarQuestion(db.Model):
    """Q&A questions submitted during webinars"""
    __tablename__ = 'webinar_questions'

    id = db.Column(db.Integer, primary_key=True)
    webinar_id = db.Column(db.Integer, db.ForeignKey('webinars.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text)

    is_answered = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)  # Highlighted by host
    is_hidden = db.Column(db.Boolean, default=False)    # Moderated out

    upvotes = db.Column(db.Integer, default=0)

    asked_at = db.Column(db.DateTime, default=datetime.utcnow)
    answered_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', backref='webinar_questions')

    def to_dict(self):
        return {
            'id': self.id,
            'webinar_id': self.webinar_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username
            } if self.user else None,
            'question': self.question,
            'answer': self.answer,
            'is_answered': self.is_answered,
            'is_featured': self.is_featured,
            'upvotes': self.upvotes,
            'asked_at': self.asked_at.isoformat() if self.asked_at else None,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None
        }


# Helper functions

def get_upcoming_webinars(limit=10):
    """Get upcoming scheduled webinars"""
    return Webinar.query.filter(
        Webinar.status == WebinarStatus.SCHEDULED.value,
        Webinar.scheduled_at > datetime.utcnow()
    ).order_by(Webinar.scheduled_at.asc()).limit(limit).all()


def get_live_webinars():
    """Get currently live webinars"""
    return Webinar.query.filter(
        Webinar.status == WebinarStatus.LIVE.value
    ).all()


def get_past_webinars_with_recordings(limit=20):
    """Get completed webinars that have recordings"""
    return Webinar.query.filter(
        Webinar.status == WebinarStatus.COMPLETED.value,
        Webinar.has_recording == True
    ).order_by(Webinar.scheduled_at.desc()).limit(limit).all()


def get_user_registrations(user_id):
    """Get all webinar registrations for a user"""
    return WebinarRegistration.query.filter_by(user_id=user_id).all()


def is_user_registered(user_id, webinar_id):
    """Check if user is registered for a webinar"""
    return WebinarRegistration.query.filter_by(
        user_id=user_id,
        webinar_id=webinar_id,
        status=RegistrationStatus.REGISTERED.value
    ).first() is not None


def get_webinar_by_slug(slug):
    """Get webinar by slug"""
    return Webinar.query.filter_by(slug=slug).first()


# Category display names
CATEGORY_NAMES = {
    WebinarCategory.TRADING_BASICS.value: 'Trading Basics',
    WebinarCategory.TECHNICAL_ANALYSIS.value: 'Technical Analysis',
    WebinarCategory.FUNDAMENTAL_ANALYSIS.value: 'Fundamental Analysis',
    WebinarCategory.RISK_MANAGEMENT.value: 'Risk Management',
    WebinarCategory.PSYCHOLOGY.value: 'Trading Psychology',
    WebinarCategory.PLATFORM_TUTORIAL.value: 'Platform Tutorial',
    WebinarCategory.MARKET_ANALYSIS.value: 'Market Analysis',
    WebinarCategory.QA_SESSION.value: 'Q&A Session',
    WebinarCategory.SPECIAL_EVENT.value: 'Special Event'
}
