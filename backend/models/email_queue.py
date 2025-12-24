"""
Email Queue Model for TradeSense
Stores emails for async processing and retry handling
"""
from datetime import datetime
from . import db


class EmailQueue(db.Model):
    """
    Email queue for async email sending with retry support.

    Emails are added to this queue and processed by Celery workers.
    Failed emails are retried up to max_retries times.
    """
    __tablename__ = 'email_queue'

    __table_args__ = (
        db.Index('idx_email_queue_status', 'status'),
        db.Index('idx_email_queue_priority', 'priority'),
        db.Index('idx_email_queue_scheduled', 'scheduled_at'),
    )

    id = db.Column(db.Integer, primary_key=True)

    # Recipient info
    to_email = db.Column(db.String(255), nullable=False, index=True)
    to_name = db.Column(db.String(255))

    # Email content
    subject = db.Column(db.String(500), nullable=False)
    template_name = db.Column(db.String(100))  # Template to use
    template_data = db.Column(db.JSON)  # Template variables
    html_content = db.Column(db.Text)  # Pre-rendered HTML (if no template)
    text_content = db.Column(db.Text)  # Plain text version

    # Processing status
    status = db.Column(db.String(20), default='pending', index=True)
    # pending, processing, sent, failed, cancelled

    priority = db.Column(db.Integer, default=5)  # 1=highest, 10=lowest

    # Scheduling
    scheduled_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)

    # Retry handling
    attempts = db.Column(db.Integer, default=0)
    max_retries = db.Column(db.Integer, default=3)
    last_attempt_at = db.Column(db.DateTime)
    last_error = db.Column(db.Text)

    # Tracking
    email_type = db.Column(db.String(50))  # welcome, verification, notification, etc.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    reference_id = db.Column(db.String(100))  # Optional reference (order_id, trade_id, etc.)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Provider response
    provider = db.Column(db.String(20))  # sendgrid, smtp
    provider_message_id = db.Column(db.String(255))

    def __repr__(self):
        return f'<EmailQueue {self.id} to={self.to_email} status={self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'to_email': self.to_email,
            'subject': self.subject,
            'template_name': self.template_name,
            'status': self.status,
            'priority': self.priority,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'attempts': self.attempts,
            'email_type': self.email_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def mark_processing(self):
        """Mark email as being processed"""
        self.status = 'processing'
        self.last_attempt_at = datetime.utcnow()
        self.attempts += 1

    def mark_sent(self, provider: str = None, message_id: str = None):
        """Mark email as successfully sent"""
        self.status = 'sent'
        self.sent_at = datetime.utcnow()
        if provider:
            self.provider = provider
        if message_id:
            self.provider_message_id = message_id

    def mark_failed(self, error: str):
        """Mark email as failed"""
        self.last_error = error
        if self.attempts >= self.max_retries:
            self.status = 'failed'
        else:
            self.status = 'pending'  # Will be retried

    def can_retry(self) -> bool:
        """Check if email can be retried"""
        return self.attempts < self.max_retries and self.status != 'sent'

    @classmethod
    def add_email(
        cls,
        to_email: str,
        subject: str,
        template_name: str = None,
        template_data: dict = None,
        html_content: str = None,
        email_type: str = None,
        user_id: int = None,
        priority: int = 5,
        scheduled_at: datetime = None
    ):
        """
        Add email to queue for processing.

        Args:
            to_email: Recipient email
            subject: Email subject
            template_name: Template to use (optional)
            template_data: Template variables (optional)
            html_content: Pre-rendered HTML (optional)
            email_type: Type of email for tracking
            user_id: Associated user ID (optional)
            priority: 1-10 (1=highest)
            scheduled_at: When to send (default: now)

        Returns:
            EmailQueue instance
        """
        email = cls(
            to_email=to_email,
            subject=subject,
            template_name=template_name,
            template_data=template_data,
            html_content=html_content,
            email_type=email_type,
            user_id=user_id,
            priority=priority,
            scheduled_at=scheduled_at or datetime.utcnow()
        )
        db.session.add(email)
        db.session.commit()
        return email

    @classmethod
    def get_pending(cls, limit: int = 100):
        """Get pending emails ready to be sent"""
        now = datetime.utcnow()
        return cls.query.filter(
            cls.status == 'pending',
            cls.scheduled_at <= now
        ).order_by(
            cls.priority.asc(),
            cls.created_at.asc()
        ).limit(limit).all()

    @classmethod
    def cleanup_old(cls, days: int = 30):
        """Delete old sent/failed emails"""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)
        return cls.query.filter(
            cls.status.in_(['sent', 'failed']),
            cls.created_at < cutoff
        ).delete()
