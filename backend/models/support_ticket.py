from datetime import datetime
from . import db


class SupportTicket(db.Model):
    """Support ticket model"""
    __tablename__ = 'support_tickets'
    __table_args__ = (
        db.Index('idx_tickets_user_status', 'user_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subject = db.Column(db.String(255), nullable=False)

    # Categories: general, technical, billing, challenge, payout, other
    category = db.Column(db.String(50), default='general')

    # Priority: low, medium, high, urgent
    priority = db.Column(db.String(20), default='medium')

    # Status: open, in_progress, waiting_response, resolved, closed
    status = db.Column(db.String(20), default='open')

    # Admin assignment
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='tickets')
    assignee = db.relationship('User', foreign_keys=[assigned_to])
    messages = db.relationship('TicketMessage', backref='ticket', lazy='dynamic', order_by='TicketMessage.created_at')

    def resolve(self):
        """Mark ticket as resolved"""
        self.status = 'resolved'
        self.resolved_at = datetime.utcnow()

    def close(self):
        """Close the ticket"""
        self.status = 'closed'
        if not self.resolved_at:
            self.resolved_at = datetime.utcnow()

    def reopen(self):
        """Reopen a closed ticket"""
        self.status = 'open'
        self.resolved_at = None

    def to_dict(self, include_messages=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'subject': self.subject,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assignee_name': self.assignee.username if self.assignee else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'message_count': self.messages.count()
        }
        if include_messages:
            data['messages'] = [m.to_dict() for m in self.messages.all()]
        return data

    def __repr__(self):
        return f'<SupportTicket {self.id}: {self.subject[:30]}>'


class TicketMessage(db.Model):
    """Messages within a support ticket"""
    __tablename__ = 'ticket_messages'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Whether this is an internal note (only visible to admins)
    is_internal = db.Column(db.Boolean, default=False)

    # Attachments (comma-separated file URLs)
    attachments = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sender = db.relationship('User', backref='ticket_messages')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.username if self.sender else None,
            'sender_role': self.sender.role if self.sender else None,
            'message': self.message,
            'is_internal': self.is_internal,
            'attachments': self.attachments.split(',') if self.attachments else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<TicketMessage {self.id} for Ticket {self.ticket_id}>'
