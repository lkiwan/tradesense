"""
Subscription Plan Model
Defines available subscription plans for recurring billing
"""

from datetime import datetime
from enum import Enum
from models import db


class BillingInterval(Enum):
    """Billing interval options"""
    MONTHLY = 'monthly'
    QUARTERLY = 'quarterly'
    YEARLY = 'yearly'


class SubscriptionPlan(db.Model):
    """
    Subscription Plans for premium features
    These are separate from challenge purchases - they provide ongoing access to:
    - Trading signals
    - Trading room access
    - Mentorship programs
    - Premium features
    """
    __tablename__ = 'subscription_plans'

    id = db.Column(db.Integer, primary_key=True)

    # Plan identification
    slug = db.Column(db.String(50), unique=True, nullable=False)  # e.g., 'signals-basic', 'trading-room'
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # Pricing
    price_monthly = db.Column(db.Numeric(10, 2), nullable=False)
    price_quarterly = db.Column(db.Numeric(10, 2))  # Usually discounted
    price_yearly = db.Column(db.Numeric(10, 2))  # Usually more discounted
    currency = db.Column(db.String(3), default='USD')

    # Stripe Product/Price IDs (for Stripe integration)
    stripe_product_id = db.Column(db.String(100))
    stripe_price_monthly_id = db.Column(db.String(100))
    stripe_price_quarterly_id = db.Column(db.String(100))
    stripe_price_yearly_id = db.Column(db.String(100))

    # Features (JSON list of feature strings)
    features = db.Column(db.Text)  # JSON array of features

    # Feature gates (what this plan unlocks)
    has_signals = db.Column(db.Boolean, default=False)
    has_trading_room = db.Column(db.Boolean, default=False)
    has_mentorship = db.Column(db.Boolean, default=False)
    has_premium_indicators = db.Column(db.Boolean, default=False)
    has_priority_support = db.Column(db.Boolean, default=False)
    has_advanced_analytics = db.Column(db.Boolean, default=False)
    signals_per_day = db.Column(db.Integer, default=0)  # 0 = unlimited

    # Plan tier for ordering/comparison
    tier = db.Column(db.Integer, default=0)  # Higher = more features

    # Visibility
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)

    # Trial
    trial_days = db.Column(db.Integer, default=0)  # 0 = no trial

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_price(self, interval='monthly'):
        """Get price for a specific billing interval"""
        if interval == 'quarterly' and self.price_quarterly:
            return float(self.price_quarterly)
        elif interval == 'yearly' and self.price_yearly:
            return float(self.price_yearly)
        return float(self.price_monthly)

    def get_stripe_price_id(self, interval='monthly'):
        """Get Stripe price ID for a specific billing interval"""
        if interval == 'quarterly' and self.stripe_price_quarterly_id:
            return self.stripe_price_quarterly_id
        elif interval == 'yearly' and self.stripe_price_yearly_id:
            return self.stripe_price_yearly_id
        return self.stripe_price_monthly_id

    def get_features_list(self):
        """Get features as a list"""
        import json
        if self.features:
            try:
                return json.loads(self.features)
            except:
                return []
        return []

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'pricing': {
                'monthly': float(self.price_monthly) if self.price_monthly else None,
                'quarterly': float(self.price_quarterly) if self.price_quarterly else None,
                'yearly': float(self.price_yearly) if self.price_yearly else None,
                'currency': self.currency
            },
            'features': self.get_features_list(),
            'feature_gates': {
                'has_signals': self.has_signals,
                'has_trading_room': self.has_trading_room,
                'has_mentorship': self.has_mentorship,
                'has_premium_indicators': self.has_premium_indicators,
                'has_priority_support': self.has_priority_support,
                'has_advanced_analytics': self.has_advanced_analytics,
                'signals_per_day': self.signals_per_day
            },
            'tier': self.tier,
            'is_featured': self.is_featured,
            'trial_days': self.trial_days,
            'display_order': self.display_order
        }

    @staticmethod
    def seed_default_plans():
        """Seed default subscription plans"""
        import json

        plans = [
            {
                'slug': 'signals-basic',
                'name': 'Signals Basic',
                'description': 'Get daily trading signals from our expert analysts',
                'price_monthly': 29.99,
                'price_quarterly': 74.99,
                'price_yearly': 249.99,
                'features': json.dumps([
                    '5 Trading signals per day',
                    'Entry, SL & TP levels',
                    'Signal notifications',
                    'Basic market analysis'
                ]),
                'has_signals': True,
                'signals_per_day': 5,
                'tier': 1,
                'display_order': 1,
                'trial_days': 7
            },
            {
                'slug': 'signals-pro',
                'name': 'Signals Pro',
                'description': 'Unlimited signals with premium indicators',
                'price_monthly': 79.99,
                'price_quarterly': 199.99,
                'price_yearly': 699.99,
                'features': json.dumps([
                    'Unlimited trading signals',
                    'Premium indicators access',
                    'Priority signal alerts',
                    'In-depth market analysis',
                    'Weekly market outlook'
                ]),
                'has_signals': True,
                'has_premium_indicators': True,
                'signals_per_day': 0,  # Unlimited
                'tier': 2,
                'is_featured': True,
                'display_order': 2,
                'trial_days': 7
            },
            {
                'slug': 'trading-room',
                'name': 'Trading Room',
                'description': 'Live trading sessions with professional traders',
                'price_monthly': 149.99,
                'price_quarterly': 399.99,
                'price_yearly': 1299.99,
                'features': json.dumps([
                    'Live trading room access',
                    'Real-time trade alerts',
                    'Q&A with pro traders',
                    'Daily market briefings',
                    'Exclusive Discord community',
                    'All Signals Pro features'
                ]),
                'has_signals': True,
                'has_trading_room': True,
                'has_premium_indicators': True,
                'has_priority_support': True,
                'signals_per_day': 0,
                'tier': 3,
                'display_order': 3,
                'trial_days': 3
            },
            {
                'slug': 'mentorship',
                'name': 'Elite Mentorship',
                'description': '1-on-1 mentorship with master traders',
                'price_monthly': 499.99,
                'price_quarterly': 1299.99,
                'price_yearly': 4499.99,
                'features': json.dumps([
                    'Weekly 1-on-1 sessions',
                    'Personalized trading plan',
                    'Portfolio review',
                    'Direct mentor access',
                    'All Trading Room features',
                    'Advanced analytics dashboard',
                    'Lifetime community access'
                ]),
                'has_signals': True,
                'has_trading_room': True,
                'has_mentorship': True,
                'has_premium_indicators': True,
                'has_priority_support': True,
                'has_advanced_analytics': True,
                'signals_per_day': 0,
                'tier': 4,
                'display_order': 4,
                'trial_days': 0  # No trial for mentorship
            }
        ]

        for plan_data in plans:
            existing = SubscriptionPlan.query.filter_by(slug=plan_data['slug']).first()
            if not existing:
                plan = SubscriptionPlan(**plan_data)
                db.session.add(plan)

        db.session.commit()
