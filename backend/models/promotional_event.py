"""
Promotional Events Model for TradeSense
Handles seasonal events, flash sales, and holiday promotions
"""

from datetime import datetime, timedelta
from enum import Enum
from models import db


class EventType(str, Enum):
    FLASH_SALE = 'flash_sale'
    SEASONAL = 'seasonal'
    HOLIDAY = 'holiday'
    ANNIVERSARY = 'anniversary'
    LAUNCH = 'launch'
    CONTEST = 'contest'
    BONUS = 'bonus'
    CUSTOM = 'custom'


class EventStatus(str, Enum):
    DRAFT = 'draft'
    SCHEDULED = 'scheduled'
    ACTIVE = 'active'
    PAUSED = 'paused'
    ENDED = 'ended'
    CANCELLED = 'cancelled'


class DiscountType(str, Enum):
    PERCENTAGE = 'percentage'
    FIXED_AMOUNT = 'fixed_amount'
    FREE_ADDON = 'free_addon'
    BONUS_POINTS = 'bonus_points'
    EXTRA_TIME = 'extra_time'


class PromotionalEvent(db.Model):
    """Main promotional event model"""
    __tablename__ = 'promotional_events'

    id = db.Column(db.Integer, primary_key=True)

    # Basic info
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))

    # Event type and status
    event_type = db.Column(db.String(20), default=EventType.CUSTOM.value)
    status = db.Column(db.String(20), default=EventStatus.DRAFT.value)

    # Timing
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    timezone = db.Column(db.String(50), default='UTC')

    # Display settings
    banner_image = db.Column(db.String(500))
    banner_mobile_image = db.Column(db.String(500))
    background_color = db.Column(db.String(20), default='#1a1a2e')
    accent_color = db.Column(db.String(20), default='#6366f1')
    text_color = db.Column(db.String(20), default='#ffffff')

    # Banner display options
    show_banner = db.Column(db.Boolean, default=True)
    banner_position = db.Column(db.String(20), default='top')  # top, popup, sidebar
    show_countdown = db.Column(db.Boolean, default=True)

    # Landing page
    has_landing_page = db.Column(db.Boolean, default=False)
    landing_page_content = db.Column(db.Text)  # Rich text/HTML content

    # Targeting
    target_all_users = db.Column(db.Boolean, default=True)
    target_new_users = db.Column(db.Boolean, default=False)
    target_existing_users = db.Column(db.Boolean, default=False)
    min_user_level = db.Column(db.String(20))  # bronze, silver, gold, platinum, diamond

    # Usage limits
    max_redemptions = db.Column(db.Integer)  # Total limit
    max_per_user = db.Column(db.Integer, default=1)
    current_redemptions = db.Column(db.Integer, default=0)

    # SEO
    meta_title = db.Column(db.String(200))
    meta_description = db.Column(db.String(500))

    # Tracking
    views = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    # Relationships
    offers = db.relationship('EventOffer', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    redemptions = db.relationship('EventRedemption', backref='event', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def is_active(self):
        """Check if event is currently active"""
        now = datetime.utcnow()
        return (
            self.status == EventStatus.ACTIVE.value and
            self.start_date <= now <= self.end_date
        )

    @property
    def is_upcoming(self):
        """Check if event is upcoming"""
        return self.start_date > datetime.utcnow()

    @property
    def is_ended(self):
        """Check if event has ended"""
        return self.end_date < datetime.utcnow()

    @property
    def time_remaining(self):
        """Get time remaining until event ends"""
        if self.is_ended:
            return timedelta(0)
        return self.end_date - datetime.utcnow()

    @property
    def time_until_start(self):
        """Get time until event starts"""
        if not self.is_upcoming:
            return timedelta(0)
        return self.start_date - datetime.utcnow()

    @property
    def progress_percentage(self):
        """Get progress through the event duration"""
        if self.is_upcoming:
            return 0
        if self.is_ended:
            return 100
        total = (self.end_date - self.start_date).total_seconds()
        elapsed = (datetime.utcnow() - self.start_date).total_seconds()
        return min(100, int((elapsed / total) * 100))

    @property
    def redemptions_remaining(self):
        """Get remaining redemptions"""
        if self.max_redemptions is None:
            return None
        return max(0, self.max_redemptions - self.current_redemptions)

    def can_redeem(self, user_id):
        """Check if user can redeem this event"""
        if not self.is_active:
            return False, "Event is not active"

        if self.max_redemptions and self.current_redemptions >= self.max_redemptions:
            return False, "Event redemption limit reached"

        # Check per-user limit
        user_redemptions = EventRedemption.query.filter_by(
            event_id=self.id,
            user_id=user_id
        ).count()

        if self.max_per_user and user_redemptions >= self.max_per_user:
            return False, "You have already redeemed this offer"

        return True, "OK"

    def to_dict(self, include_offers=True):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'short_description': self.short_description,
            'event_type': self.event_type,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'timezone': self.timezone,
            'banner_image': self.banner_image,
            'banner_mobile_image': self.banner_mobile_image,
            'background_color': self.background_color,
            'accent_color': self.accent_color,
            'text_color': self.text_color,
            'show_banner': self.show_banner,
            'banner_position': self.banner_position,
            'show_countdown': self.show_countdown,
            'has_landing_page': self.has_landing_page,
            'is_active': self.is_active,
            'is_upcoming': self.is_upcoming,
            'is_ended': self.is_ended,
            'time_remaining_seconds': self.time_remaining.total_seconds(),
            'time_until_start_seconds': self.time_until_start.total_seconds(),
            'progress_percentage': self.progress_percentage,
            'max_redemptions': self.max_redemptions,
            'current_redemptions': self.current_redemptions,
            'redemptions_remaining': self.redemptions_remaining,
            'views': self.views,
            'clicks': self.clicks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_offers:
            data['offers'] = [offer.to_dict() for offer in self.offers.filter_by(is_active=True)]

        return data

    def to_banner_dict(self):
        """Minimal dict for banner display"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'short_description': self.short_description,
            'banner_image': self.banner_image,
            'banner_mobile_image': self.banner_mobile_image,
            'background_color': self.background_color,
            'accent_color': self.accent_color,
            'text_color': self.text_color,
            'banner_position': self.banner_position,
            'show_countdown': self.show_countdown,
            'has_landing_page': self.has_landing_page,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'time_remaining_seconds': self.time_remaining.total_seconds()
        }


class EventOffer(db.Model):
    """Specific offers within an event"""
    __tablename__ = 'event_offers'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('promotional_events.id', ondelete='CASCADE'), nullable=False)

    # Offer details
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    # Discount configuration
    discount_type = db.Column(db.String(20), default=DiscountType.PERCENTAGE.value)
    discount_value = db.Column(db.Float, nullable=False)  # Percentage or fixed amount

    # What the offer applies to
    applies_to = db.Column(db.String(50), default='all')  # all, challenge, subscription, addon
    applicable_items = db.Column(db.JSON)  # List of specific item IDs if not 'all'

    # Promo code (optional)
    promo_code = db.Column(db.String(50), unique=True)
    requires_code = db.Column(db.Boolean, default=False)

    # Minimum requirements
    min_purchase_amount = db.Column(db.Float)
    min_account_size = db.Column(db.Integer)

    # Bonus features
    bonus_points = db.Column(db.Integer)  # Extra points awarded
    bonus_days = db.Column(db.Integer)  # Extra days for challenges
    free_addon_type = db.Column(db.String(50))  # Type of free addon

    # Limits
    max_redemptions = db.Column(db.Integer)
    current_redemptions = db.Column(db.Integer, default=0)

    # Status
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=0)  # Higher = shown first

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def calculate_discount(self, original_price):
        """Calculate discounted price"""
        if self.discount_type == DiscountType.PERCENTAGE.value:
            discount = original_price * (self.discount_value / 100)
            return max(0, original_price - discount)
        elif self.discount_type == DiscountType.FIXED_AMOUNT.value:
            return max(0, original_price - self.discount_value)
        return original_price

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'name': self.name,
            'description': self.description,
            'discount_type': self.discount_type,
            'discount_value': self.discount_value,
            'applies_to': self.applies_to,
            'applicable_items': self.applicable_items,
            'promo_code': self.promo_code if not self.requires_code else None,
            'requires_code': self.requires_code,
            'min_purchase_amount': self.min_purchase_amount,
            'min_account_size': self.min_account_size,
            'bonus_points': self.bonus_points,
            'bonus_days': self.bonus_days,
            'free_addon_type': self.free_addon_type,
            'max_redemptions': self.max_redemptions,
            'current_redemptions': self.current_redemptions,
            'is_active': self.is_active
        }


class EventRedemption(db.Model):
    """Track event/offer redemptions"""
    __tablename__ = 'event_redemptions'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('promotional_events.id', ondelete='CASCADE'), nullable=False)
    offer_id = db.Column(db.Integer, db.ForeignKey('event_offers.id', ondelete='SET NULL'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Redemption details
    promo_code_used = db.Column(db.String(50))
    original_price = db.Column(db.Float)
    discounted_price = db.Column(db.Float)
    discount_amount = db.Column(db.Float)

    # What was purchased
    purchase_type = db.Column(db.String(50))  # challenge, subscription, addon
    purchase_id = db.Column(db.Integer)

    # Bonuses applied
    bonus_points_awarded = db.Column(db.Integer, default=0)
    bonus_days_awarded = db.Column(db.Integer, default=0)

    # Status
    status = db.Column(db.String(20), default='completed')  # pending, completed, refunded

    # Timestamps
    redeemed_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='event_redemptions')
    offer = db.relationship('EventOffer', backref='redemptions')

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'offer_id': self.offer_id,
            'user_id': self.user_id,
            'promo_code_used': self.promo_code_used,
            'original_price': self.original_price,
            'discounted_price': self.discounted_price,
            'discount_amount': self.discount_amount,
            'purchase_type': self.purchase_type,
            'bonus_points_awarded': self.bonus_points_awarded,
            'bonus_days_awarded': self.bonus_days_awarded,
            'status': self.status,
            'redeemed_at': self.redeemed_at.isoformat() if self.redeemed_at else None
        }


class HolidayBonus(db.Model):
    """Special holiday bonuses"""
    __tablename__ = 'holiday_bonuses'

    id = db.Column(db.Integer, primary_key=True)

    # Holiday info
    name = db.Column(db.String(100), nullable=False)
    holiday_date = db.Column(db.Date, nullable=False)

    # Bonus window
    bonus_start = db.Column(db.DateTime, nullable=False)
    bonus_end = db.Column(db.DateTime, nullable=False)

    # Bonus configuration
    bonus_type = db.Column(db.String(20), default='points')  # points, discount, free_item
    bonus_value = db.Column(db.Float, nullable=False)

    # Eligibility
    min_trades = db.Column(db.Integer, default=0)  # Minimum trades to qualify
    min_volume = db.Column(db.Float, default=0)  # Minimum volume to qualify

    # Status
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def is_available(self):
        now = datetime.utcnow()
        return self.is_active and self.bonus_start <= now <= self.bonus_end

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'holiday_date': self.holiday_date.isoformat() if self.holiday_date else None,
            'bonus_start': self.bonus_start.isoformat() if self.bonus_start else None,
            'bonus_end': self.bonus_end.isoformat() if self.bonus_end else None,
            'bonus_type': self.bonus_type,
            'bonus_value': self.bonus_value,
            'min_trades': self.min_trades,
            'min_volume': self.min_volume,
            'is_active': self.is_active,
            'is_available': self.is_available
        }


# Pre-defined seasonal events templates
SEASONAL_TEMPLATES = {
    'new_year': {
        'name': 'New Year Sale',
        'event_type': EventType.HOLIDAY.value,
        'description': 'Start the new year with amazing discounts on all challenges!',
        'background_color': '#1a1a2e',
        'accent_color': '#ffd700'
    },
    'valentines': {
        'name': "Valentine's Day Special",
        'event_type': EventType.HOLIDAY.value,
        'description': 'Share the love of trading with special offers!',
        'background_color': '#2d1f3d',
        'accent_color': '#ff6b6b'
    },
    'easter': {
        'name': 'Easter Trading Hunt',
        'event_type': EventType.HOLIDAY.value,
        'description': 'Hunt for the best deals this Easter!',
        'background_color': '#f0f5e9',
        'accent_color': '#7eb356'
    },
    'summer': {
        'name': 'Summer Trading Festival',
        'event_type': EventType.SEASONAL.value,
        'description': 'Hot summer deals on all trading challenges!',
        'background_color': '#1a365d',
        'accent_color': '#f6ad55'
    },
    'black_friday': {
        'name': 'Black Friday Mega Sale',
        'event_type': EventType.FLASH_SALE.value,
        'description': 'Biggest discounts of the year!',
        'background_color': '#000000',
        'accent_color': '#ff4757'
    },
    'cyber_monday': {
        'name': 'Cyber Monday Deals',
        'event_type': EventType.FLASH_SALE.value,
        'description': 'Extended savings continue!',
        'background_color': '#0a192f',
        'accent_color': '#64ffda'
    },
    'christmas': {
        'name': 'Christmas Trading Bonanza',
        'event_type': EventType.HOLIDAY.value,
        'description': 'Celebrate the season with exclusive offers!',
        'background_color': '#1a472a',
        'accent_color': '#c41e3a'
    },
    'anniversary': {
        'name': 'TradeSense Anniversary',
        'event_type': EventType.ANNIVERSARY.value,
        'description': 'Celebrating another year of successful trading!',
        'background_color': '#1a1a2e',
        'accent_color': '#6366f1'
    }
}


# Helper functions
def get_active_events():
    """Get all currently active events"""
    now = datetime.utcnow()
    return PromotionalEvent.query.filter(
        PromotionalEvent.status == EventStatus.ACTIVE.value,
        PromotionalEvent.start_date <= now,
        PromotionalEvent.end_date >= now
    ).order_by(PromotionalEvent.end_date.asc()).all()


def get_active_banners():
    """Get active events that should show banners"""
    events = get_active_events()
    return [e for e in events if e.show_banner]


def get_upcoming_events(limit=5):
    """Get upcoming events"""
    now = datetime.utcnow()
    return PromotionalEvent.query.filter(
        PromotionalEvent.status == EventStatus.SCHEDULED.value,
        PromotionalEvent.start_date > now
    ).order_by(PromotionalEvent.start_date.asc()).limit(limit).all()


def get_event_by_slug(slug):
    """Get event by slug"""
    return PromotionalEvent.query.filter_by(slug=slug).first()


def validate_promo_code(code, user_id=None, purchase_type=None, amount=None):
    """Validate a promo code and return the offer if valid"""
    offer = EventOffer.query.filter_by(promo_code=code.upper(), is_active=True).first()

    if not offer:
        return None, "Invalid promo code"

    event = offer.event
    if not event.is_active:
        return None, "This promotion has ended"

    # Check offer limits
    if offer.max_redemptions and offer.current_redemptions >= offer.max_redemptions:
        return None, "This promo code has reached its limit"

    # Check user limits
    if user_id:
        can_redeem, msg = event.can_redeem(user_id)
        if not can_redeem:
            return None, msg

    # Check minimum purchase
    if offer.min_purchase_amount and amount and amount < offer.min_purchase_amount:
        return None, f"Minimum purchase of ${offer.min_purchase_amount} required"

    # Check applicable items
    if offer.applies_to != 'all' and purchase_type and offer.applies_to != purchase_type:
        return None, f"This code only applies to {offer.applies_to}"

    return offer, "Valid"


def apply_best_offer(user_id, purchase_type, original_price, account_size=None):
    """Find and apply the best available offer for a purchase"""
    active_events = get_active_events()
    best_offer = None
    best_price = original_price

    for event in active_events:
        can_redeem, _ = event.can_redeem(user_id)
        if not can_redeem:
            continue

        for offer in event.offers.filter_by(is_active=True):
            # Check if offer applies
            if offer.applies_to != 'all' and offer.applies_to != purchase_type:
                continue

            # Check minimum requirements
            if offer.min_purchase_amount and original_price < offer.min_purchase_amount:
                continue
            if offer.min_account_size and account_size and account_size < offer.min_account_size:
                continue

            # Skip code-required offers (user must enter code)
            if offer.requires_code:
                continue

            # Calculate discounted price
            discounted_price = offer.calculate_discount(original_price)

            if discounted_price < best_price:
                best_price = discounted_price
                best_offer = offer

    return best_offer, best_price
