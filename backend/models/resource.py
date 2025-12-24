from datetime import datetime
from . import db


class Resource(db.Model):
    """Resource/file model for utilities page"""
    __tablename__ = 'resources'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Categories: trading_guide, platform_setup, brand_assets, video, tool
    category = db.Column(db.String(50), nullable=False)

    # File info
    file_type = db.Column(db.String(20), nullable=False)  # pdf, video, zip, xlsx, exe
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.String(20), nullable=True)  # Human readable size like "2.5 MB"
    duration = db.Column(db.String(10), nullable=True)  # For videos: "15:30"

    # Stats
    download_count = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)

    # Visibility
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def increment_download(self):
        """Increment download count"""
        self.download_count += 1

    def increment_view(self):
        """Increment view count"""
        self.view_count += 1

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'file_type': self.file_type,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'duration': self.duration,
            'download_count': self.download_count,
            'view_count': self.view_count,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Resource {self.id}: {self.title}>'


class EconomicEvent(db.Model):
    """Economic calendar event model"""
    __tablename__ = 'economic_events'

    id = db.Column(db.Integer, primary_key=True)
    event_date = db.Column(db.Date, nullable=False)
    event_time = db.Column(db.String(10), nullable=False)  # HH:MM format
    currency = db.Column(db.String(5), nullable=False)  # USD, EUR, GBP, etc.
    event = db.Column(db.String(255), nullable=False)

    # Impact: high, medium, low
    impact = db.Column(db.String(10), nullable=False)

    # Values
    forecast = db.Column(db.String(50), nullable=True)
    previous = db.Column(db.String(50), nullable=True)
    actual = db.Column(db.String(50), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'event_time': self.event_time,
            'currency': self.currency,
            'event': self.event,
            'impact': self.impact,
            'forecast': self.forecast,
            'previous': self.previous,
            'actual': self.actual,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<EconomicEvent {self.id}: {self.event}>'
