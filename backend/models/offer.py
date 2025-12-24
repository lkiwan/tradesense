from datetime import datetime
from decimal import Decimal
from . import db


class Offer(db.Model):
    """Promotional offer/discount model"""
    __tablename__ = 'offers'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    code = db.Column(db.String(50), unique=True, nullable=False)

    # Discount type: percentage, fixed
    discount_type = db.Column(db.String(20), default='percentage')
    discount_value = db.Column(db.Numeric(10, 2), nullable=False)  # 10 for 10%, or 50 for $50 off

    # Usage limits
    max_uses = db.Column(db.Integer, nullable=True)  # None = unlimited
    uses_count = db.Column(db.Integer, default=0)
    max_uses_per_user = db.Column(db.Integer, default=1)

    # Minimum purchase
    min_purchase = db.Column(db.Numeric(10, 2), default=Decimal('0'))

    # Applicable plans (comma-separated list, or 'all')
    applicable_plans = db.Column(db.String(255), default='all')

    # Validity
    starts_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_valid(self):
        """Check if offer is currently valid"""
        if not self.is_active:
            return False
        now = datetime.utcnow()
        if self.starts_at and now < self.starts_at:
            return False
        if self.expires_at and now > self.expires_at:
            return False
        if self.max_uses and self.uses_count >= self.max_uses:
            return False
        return True

    def can_use(self, user_id, purchase_amount):
        """Check if user can use this offer"""
        if not self.is_valid():
            return False, 'Offer is not valid'

        if self.min_purchase and Decimal(str(purchase_amount)) < self.min_purchase:
            return False, f'Minimum purchase of ${self.min_purchase} required'

        # Check user usage
        user_usage = OfferUsage.query.filter_by(
            offer_id=self.id,
            user_id=user_id
        ).count()

        if user_usage >= self.max_uses_per_user:
            return False, 'You have already used this offer'

        return True, 'Offer can be applied'

    def calculate_discount(self, original_amount):
        """Calculate discount amount"""
        original = Decimal(str(original_amount))
        if self.discount_type == 'percentage':
            discount = original * (self.discount_value / Decimal('100'))
        else:  # fixed
            discount = self.discount_value

        # Don't exceed original amount
        return min(discount, original)

    def use(self, user_id, payment_id):
        """Record usage of this offer"""
        usage = OfferUsage(
            offer_id=self.id,
            user_id=user_id,
            payment_id=payment_id
        )
        db.session.add(usage)
        self.uses_count += 1

    def get_time_remaining(self):
        """Get remaining time until expiry"""
        if not self.expires_at:
            return None
        remaining = self.expires_at - datetime.utcnow()
        if remaining.total_seconds() <= 0:
            return None
        return {
            'days': remaining.days,
            'hours': remaining.seconds // 3600,
            'minutes': (remaining.seconds % 3600) // 60
        }

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'code': self.code,
            'discount_type': self.discount_type,
            'discount_value': float(self.discount_value) if self.discount_value else 0,
            'max_uses': self.max_uses,
            'uses_count': self.uses_count,
            'max_uses_per_user': self.max_uses_per_user,
            'min_purchase': float(self.min_purchase) if self.min_purchase else 0,
            'applicable_plans': self.applicable_plans.split(',') if self.applicable_plans != 'all' else 'all',
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_valid': self.is_valid(),
            'time_remaining': self.get_time_remaining(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Offer {self.code}: {self.title}>'


class OfferUsage(db.Model):
    """Track which users have used which offers"""
    __tablename__ = 'offer_usages'

    id = db.Column(db.Integer, primary_key=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id', ondelete='SET NULL'), nullable=True)
    used_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    offer = db.relationship('Offer', backref='usages')
    user = db.relationship('User', backref='offer_usages')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'offer_id': self.offer_id,
            'user_id': self.user_id,
            'payment_id': self.payment_id,
            'used_at': self.used_at.isoformat() if self.used_at else None,
            'offer': self.offer.to_dict() if self.offer else None
        }

    def __repr__(self):
        return f'<OfferUsage {self.id}: User {self.user_id} used Offer {self.offer_id}>'
