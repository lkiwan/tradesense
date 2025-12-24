"""
Subscription Routes v2
Premium subscription management with Stripe integration
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from functools import wraps

from models import (
    db, User, SubscriptionPlan, UserSubscription, SubscriptionInvoice,
    SubscriptionStatus
)
from services import stripe_service
from services.audit_service import log_audit

subscriptions_v2_bp = Blueprint('subscriptions_v2', __name__)


def require_active_subscription(feature=None):
    """
    Decorator to require an active subscription
    Optionally checks for specific feature access
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()

            subscription = UserSubscription.query.filter_by(
                user_id=user_id
            ).filter(
                UserSubscription.status.in_([
                    SubscriptionStatus.ACTIVE.value,
                    SubscriptionStatus.TRIALING.value
                ])
            ).first()

            if not subscription:
                return jsonify({
                    'error': 'Active subscription required',
                    'code': 'subscription_required'
                }), 403

            if feature and subscription.plan:
                if not getattr(subscription.plan, feature, False):
                    return jsonify({
                        'error': f'Your plan does not include {feature}',
                        'code': 'feature_not_available',
                        'feature': feature
                    }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ==================== PLANS ====================

@subscriptions_v2_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all available subscription plans"""
    plans = SubscriptionPlan.query.filter_by(is_active=True).order_by(
        SubscriptionPlan.display_order
    ).all()

    return jsonify({
        'plans': [plan.to_dict() for plan in plans]
    }), 200


@subscriptions_v2_bp.route('/plans/<slug>', methods=['GET'])
def get_plan(slug):
    """Get a specific plan by slug"""
    plan = SubscriptionPlan.query.filter_by(slug=slug, is_active=True).first()

    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    return jsonify(plan.to_dict()), 200


# ==================== USER SUBSCRIPTION ====================

@subscriptions_v2_bp.route('/my-subscription', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get current user's subscription"""
    user_id = get_jwt_identity()

    subscription = UserSubscription.query.filter_by(user_id=user_id).first()

    if not subscription:
        return jsonify({
            'subscription': None,
            'message': 'No active subscription'
        }), 200

    data = subscription.to_dict()

    # Get upcoming invoice if active
    if subscription.is_active and subscription.stripe_subscription_id:
        upcoming = stripe_service.get_upcoming_invoice(
            subscription.stripe_customer_id,
            subscription.stripe_subscription_id
        )
        if upcoming:
            data['upcoming_invoice'] = upcoming

    return jsonify({'subscription': data}), 200


@subscriptions_v2_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    """
    Subscribe to a plan
    Creates Stripe checkout session for payment
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    plan_slug = data.get('plan_slug')
    interval = data.get('interval', 'monthly')  # monthly, quarterly, yearly

    if not plan_slug:
        return jsonify({'error': 'Plan slug required'}), 400

    # Get plan
    plan = SubscriptionPlan.query.filter_by(slug=plan_slug, is_active=True).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    # Get user
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check for existing active subscription
    existing = UserSubscription.query.filter_by(user_id=user_id).filter(
        UserSubscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ])
    ).first()

    if existing:
        return jsonify({
            'error': 'You already have an active subscription',
            'current_plan': existing.plan.slug if existing.plan else None
        }), 400

    # Get or create Stripe customer
    stripe_customer_id = None
    existing_sub = UserSubscription.query.filter_by(user_id=user_id).first()

    if existing_sub and existing_sub.stripe_customer_id:
        stripe_customer_id = existing_sub.stripe_customer_id
    else:
        customer = stripe_service.create_customer(
            email=user.email,
            name=user.username,
            metadata={'user_id': str(user_id)}
        )
        if customer:
            stripe_customer_id = customer['id']
        else:
            return jsonify({'error': 'Failed to create customer'}), 500

    # Get price ID for interval
    price_id = plan.get_stripe_price_id(interval)
    if not price_id:
        return jsonify({
            'error': f'Stripe price not configured for {interval} billing',
            'message': 'Please contact support'
        }), 500

    # Build success/cancel URLs
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    success_url = f"{frontend_url}/dashboard/subscriptions?success=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/dashboard/subscriptions?canceled=true"

    # Create checkout session
    session = stripe_service.create_checkout_session(
        customer_id=stripe_customer_id,
        price_id=price_id,
        success_url=success_url,
        cancel_url=cancel_url,
        trial_days=plan.trial_days,
        metadata={
            'user_id': str(user_id),
            'plan_id': str(plan.id),
            'plan_slug': plan.slug,
            'interval': interval
        }
    )

    if not session:
        return jsonify({'error': 'Failed to create checkout session'}), 500

    # Create pending subscription record
    subscription = UserSubscription(
        user_id=user_id,
        plan_id=plan.id,
        billing_interval=interval,
        status=SubscriptionStatus.TRIALING.value if plan.trial_days > 0 else 'pending',
        stripe_customer_id=stripe_customer_id
    )
    db.session.add(subscription)
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='subscription_checkout_started',
        resource_type='subscription',
        resource_id=subscription.id,
        details={'plan': plan.slug, 'interval': interval}
    )

    return jsonify({
        'checkout_url': session['url'],
        'session_id': session['id']
    }), 200


@subscriptions_v2_bp.route('/change-plan', methods=['POST'])
@jwt_required()
def change_plan():
    """
    Change subscription plan (upgrade/downgrade)
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    new_plan_slug = data.get('plan_slug')
    new_interval = data.get('interval')

    if not new_plan_slug:
        return jsonify({'error': 'New plan slug required'}), 400

    # Get current subscription
    subscription = UserSubscription.query.filter_by(user_id=user_id).filter(
        UserSubscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ])
    ).first()

    if not subscription:
        return jsonify({'error': 'No active subscription to change'}), 404

    if not subscription.stripe_subscription_id:
        return jsonify({'error': 'Subscription not linked to Stripe'}), 400

    # Get new plan
    new_plan = SubscriptionPlan.query.filter_by(slug=new_plan_slug, is_active=True).first()
    if not new_plan:
        return jsonify({'error': 'Plan not found'}), 404

    interval = new_interval or subscription.billing_interval
    new_price_id = new_plan.get_stripe_price_id(interval)

    if not new_price_id:
        return jsonify({'error': 'Price not configured for this plan'}), 500

    # Update subscription in Stripe
    updated = stripe_service.update_subscription(
        subscription.stripe_subscription_id,
        new_price_id=new_price_id,
        proration_behavior='create_prorations'
    )

    if not updated:
        return jsonify({'error': 'Failed to update subscription'}), 500

    # Update local record
    old_plan_id = subscription.plan_id
    subscription.plan_id = new_plan.id
    subscription.billing_interval = interval
    subscription.updated_at = datetime.utcnow()
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='subscription_plan_changed',
        resource_type='subscription',
        resource_id=subscription.id,
        details={
            'old_plan_id': old_plan_id,
            'new_plan': new_plan.slug,
            'interval': interval
        }
    )

    return jsonify({
        'message': 'Plan changed successfully',
        'subscription': subscription.to_dict()
    }), 200


@subscriptions_v2_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel subscription (at period end by default)"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    reason = data.get('reason')
    immediate = data.get('immediate', False)

    subscription = UserSubscription.query.filter_by(user_id=user_id).filter(
        UserSubscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ])
    ).first()

    if not subscription:
        return jsonify({'error': 'No active subscription'}), 404

    if subscription.stripe_subscription_id:
        result = stripe_service.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=not immediate,
            cancellation_reason=reason
        )

        if not result:
            return jsonify({'error': 'Failed to cancel subscription'}), 500

    # Update local record
    subscription.cancel(reason=reason, immediate=immediate)
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='subscription_canceled',
        resource_type='subscription',
        resource_id=subscription.id,
        details={'reason': reason, 'immediate': immediate}
    )

    message = 'Subscription canceled immediately' if immediate else 'Subscription will cancel at period end'

    return jsonify({
        'message': message,
        'subscription': subscription.to_dict()
    }), 200


@subscriptions_v2_bp.route('/resume', methods=['POST'])
@jwt_required()
def resume_subscription():
    """Resume a subscription that was set to cancel"""
    user_id = get_jwt_identity()

    subscription = UserSubscription.query.filter_by(user_id=user_id).first()

    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404

    if not subscription.cancel_at_period_end:
        return jsonify({'error': 'Subscription is not set to cancel'}), 400

    if subscription.stripe_subscription_id:
        result = stripe_service.resume_subscription(subscription.stripe_subscription_id)
        if not result:
            return jsonify({'error': 'Failed to resume subscription'}), 500

    subscription.cancel_at_period_end = False
    subscription.canceled_at = None
    subscription.cancellation_reason = None
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='subscription_resumed',
        resource_type='subscription',
        resource_id=subscription.id
    )

    return jsonify({
        'message': 'Subscription resumed',
        'subscription': subscription.to_dict()
    }), 200


# ==================== BILLING ====================

@subscriptions_v2_bp.route('/billing-portal', methods=['POST'])
@jwt_required()
def create_billing_portal():
    """Create Stripe billing portal session"""
    user_id = get_jwt_identity()

    subscription = UserSubscription.query.filter_by(user_id=user_id).first()

    if not subscription or not subscription.stripe_customer_id:
        return jsonify({'error': 'No billing information found'}), 404

    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    return_url = f"{frontend_url}/dashboard/subscriptions"

    session = stripe_service.create_customer_portal_session(
        subscription.stripe_customer_id,
        return_url
    )

    if not session:
        return jsonify({'error': 'Failed to create billing portal'}), 500

    return jsonify({'url': session['url']}), 200


@subscriptions_v2_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    """Get user's invoice history"""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)

    # Get from database
    invoices = SubscriptionInvoice.query.filter_by(user_id=user_id).order_by(
        SubscriptionInvoice.created_at.desc()
    ).limit(limit).all()

    # If user has Stripe customer, also fetch from Stripe
    subscription = UserSubscription.query.filter_by(user_id=user_id).first()
    stripe_invoices = []

    if subscription and subscription.stripe_customer_id:
        stripe_invoices = stripe_service.list_invoices(
            subscription.stripe_customer_id,
            limit=limit
        )

    return jsonify({
        'invoices': [inv.to_dict() for inv in invoices],
        'stripe_invoices': stripe_invoices
    }), 200


@subscriptions_v2_bp.route('/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    """Get user's saved payment methods"""
    user_id = get_jwt_identity()

    subscription = UserSubscription.query.filter_by(user_id=user_id).first()

    if not subscription or not subscription.stripe_customer_id:
        return jsonify({'payment_methods': []}), 200

    methods = stripe_service.list_payment_methods(subscription.stripe_customer_id)

    return jsonify({'payment_methods': methods}), 200


# ==================== WEBHOOKS ====================

@subscriptions_v2_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    event = stripe_service.construct_webhook_event(payload, sig_header)

    if not event:
        return jsonify({'error': 'Invalid webhook'}), 400

    event_type = event['type']
    event_data = event['data']['object']

    try:
        if event_type == 'checkout.session.completed':
            handle_checkout_completed(event_data)
        elif event_type == 'customer.subscription.created':
            handle_subscription_created(event_data)
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data)
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event_data)
        elif event_type == 'invoice.paid':
            handle_invoice_paid(event_data)
        elif event_type == 'invoice.payment_failed':
            handle_invoice_failed(event_data)
        elif event_type == 'customer.subscription.trial_will_end':
            handle_trial_ending(event_data)
    except Exception as e:
        print(f"Webhook handler error: {e}")
        return jsonify({'error': str(e)}), 500

    return jsonify({'received': True}), 200


def handle_checkout_completed(session):
    """Handle successful checkout"""
    metadata = session.get('metadata', {})
    user_id = metadata.get('user_id')
    subscription_id = session.get('subscription')
    customer_id = session.get('customer')

    if not user_id:
        return

    # Update subscription record
    subscription = UserSubscription.query.filter_by(user_id=int(user_id)).first()

    if subscription:
        subscription.stripe_subscription_id = subscription_id
        subscription.stripe_customer_id = customer_id
        subscription.status = SubscriptionStatus.ACTIVE.value
        subscription.current_period_start = datetime.utcnow()

        # Get subscription details from Stripe
        if subscription_id:
            stripe_sub = stripe_service.get_subscription(subscription_id)
            if stripe_sub:
                subscription.current_period_end = datetime.fromisoformat(
                    stripe_sub['current_period_end'].replace('Z', '+00:00')
                ).replace(tzinfo=None)
                if stripe_sub.get('trial_end'):
                    subscription.trial_end = datetime.fromisoformat(
                        stripe_sub['trial_end'].replace('Z', '+00:00')
                    ).replace(tzinfo=None)
                    subscription.status = SubscriptionStatus.TRIALING.value

        db.session.commit()

    log_audit(
        user_id=int(user_id),
        action='subscription_checkout_completed',
        resource_type='subscription',
        resource_id=subscription.id if subscription else None,
        details={'stripe_subscription': subscription_id}
    )


def handle_subscription_created(subscription_data):
    """Handle new subscription created"""
    customer_id = subscription_data.get('customer')
    metadata = subscription_data.get('metadata', {})
    user_id = metadata.get('user_id')

    if not user_id:
        # Try to find by customer ID
        sub = UserSubscription.query.filter_by(stripe_customer_id=customer_id).first()
        if sub:
            user_id = sub.user_id

    if user_id:
        subscription = UserSubscription.query.filter_by(user_id=int(user_id)).first()
        if subscription:
            subscription.stripe_subscription_id = subscription_data['id']
            subscription.status = subscription_data['status']
            db.session.commit()


def handle_subscription_updated(subscription_data):
    """Handle subscription updates"""
    subscription_id = subscription_data['id']

    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=subscription_id
    ).first()

    if subscription:
        subscription.status = subscription_data['status']
        subscription.cancel_at_period_end = subscription_data.get('cancel_at_period_end', False)

        if subscription_data.get('current_period_start'):
            subscription.current_period_start = datetime.fromtimestamp(
                subscription_data['current_period_start']
            )
        if subscription_data.get('current_period_end'):
            subscription.current_period_end = datetime.fromtimestamp(
                subscription_data['current_period_end']
            )
        if subscription_data.get('canceled_at'):
            subscription.canceled_at = datetime.fromtimestamp(
                subscription_data['canceled_at']
            )

        db.session.commit()


def handle_subscription_deleted(subscription_data):
    """Handle subscription cancellation/deletion"""
    subscription_id = subscription_data['id']

    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=subscription_id
    ).first()

    if subscription:
        subscription.status = SubscriptionStatus.CANCELED.value
        subscription.canceled_at = datetime.utcnow()
        db.session.commit()

        log_audit(
            user_id=subscription.user_id,
            action='subscription_deleted',
            resource_type='subscription',
            resource_id=subscription.id,
            details={'stripe_subscription': subscription_id}
        )


def handle_invoice_paid(invoice_data):
    """Handle successful invoice payment"""
    subscription_id = invoice_data.get('subscription')
    customer_id = invoice_data.get('customer')

    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=subscription_id
    ).first()

    if not subscription and customer_id:
        subscription = UserSubscription.query.filter_by(
            stripe_customer_id=customer_id
        ).first()

    if subscription:
        # Create invoice record
        invoice = SubscriptionInvoice(
            subscription_id=subscription.id,
            user_id=subscription.user_id,
            stripe_invoice_id=invoice_data['id'],
            invoice_number=invoice_data.get('number'),
            amount=invoice_data['amount_paid'] / 100,
            currency=invoice_data['currency'].upper(),
            status='paid',
            period_start=datetime.fromtimestamp(invoice_data['period_start']) if invoice_data.get('period_start') else None,
            period_end=datetime.fromtimestamp(invoice_data['period_end']) if invoice_data.get('period_end') else None,
            invoice_pdf_url=invoice_data.get('invoice_pdf'),
            receipt_url=invoice_data.get('hosted_invoice_url'),
            paid_at=datetime.utcnow()
        )

        # Update subscription payment info
        subscription.last_payment_date = datetime.utcnow()
        subscription.last_payment_amount = invoice_data['amount_paid'] / 100
        subscription.payment_failed_count = 0
        subscription.last_payment_error = None

        # Ensure subscription is active
        if subscription.status == SubscriptionStatus.PAST_DUE.value:
            subscription.status = SubscriptionStatus.ACTIVE.value

        db.session.add(invoice)
        db.session.commit()


def handle_invoice_failed(invoice_data):
    """Handle failed invoice payment"""
    subscription_id = invoice_data.get('subscription')

    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=subscription_id
    ).first()

    if subscription:
        error = invoice_data.get('last_payment_error', {}).get('message', 'Payment failed')
        subscription.mark_past_due(error)

        # Create failed invoice record
        invoice = SubscriptionInvoice(
            subscription_id=subscription.id,
            user_id=subscription.user_id,
            stripe_invoice_id=invoice_data['id'],
            invoice_number=invoice_data.get('number'),
            amount=invoice_data['amount_due'] / 100,
            currency=invoice_data['currency'].upper(),
            status='failed',
            failure_reason=error
        )

        db.session.add(invoice)
        db.session.commit()

        log_audit(
            user_id=subscription.user_id,
            action='payment_failed',
            resource_type='subscription',
            resource_id=subscription.id,
            details={'error': error, 'invoice': invoice_data['id']}
        )


def handle_trial_ending(subscription_data):
    """Handle trial ending notification (3 days before)"""
    subscription_id = subscription_data['id']

    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=subscription_id
    ).first()

    if subscription:
        # Could send email notification here
        log_audit(
            user_id=subscription.user_id,
            action='trial_ending_soon',
            resource_type='subscription',
            resource_id=subscription.id,
            details={
                'trial_end': subscription_data.get('trial_end'),
                'days_remaining': 3
            }
        )


# ==================== ADMIN ENDPOINTS ====================

@subscriptions_v2_bp.route('/admin/subscriptions', methods=['GET'])
@jwt_required()
def admin_list_subscriptions():
    """Admin: List all subscriptions"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')

    query = UserSubscription.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    subscriptions = query.order_by(
        UserSubscription.created_at.desc()
    ).paginate(page=page, per_page=per_page)

    return jsonify({
        'subscriptions': [sub.to_dict() for sub in subscriptions.items],
        'total': subscriptions.total,
        'pages': subscriptions.pages,
        'current_page': page
    }), 200


@subscriptions_v2_bp.route('/admin/plans', methods=['POST'])
@jwt_required()
def admin_create_plan():
    """Admin: Create a new subscription plan"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403

    data = request.get_json()

    required = ['slug', 'name', 'price_monthly']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check slug uniqueness
    if SubscriptionPlan.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Plan slug already exists'}), 400

    plan = SubscriptionPlan(
        slug=data['slug'],
        name=data['name'],
        description=data.get('description'),
        price_monthly=data['price_monthly'],
        price_quarterly=data.get('price_quarterly'),
        price_yearly=data.get('price_yearly'),
        features=data.get('features'),
        has_signals=data.get('has_signals', False),
        has_trading_room=data.get('has_trading_room', False),
        has_mentorship=data.get('has_mentorship', False),
        has_premium_indicators=data.get('has_premium_indicators', False),
        has_priority_support=data.get('has_priority_support', False),
        has_advanced_analytics=data.get('has_advanced_analytics', False),
        signals_per_day=data.get('signals_per_day', 0),
        tier=data.get('tier', 0),
        trial_days=data.get('trial_days', 0),
        display_order=data.get('display_order', 0)
    )

    db.session.add(plan)
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='plan_created',
        resource_type='subscription_plan',
        resource_id=plan.id,
        details={'slug': plan.slug}
    )

    return jsonify({
        'message': 'Plan created',
        'plan': plan.to_dict()
    }), 201


@subscriptions_v2_bp.route('/admin/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def admin_update_plan(plan_id):
    """Admin: Update a subscription plan"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    data = request.get_json()

    # Update allowed fields
    updateable = [
        'name', 'description', 'price_monthly', 'price_quarterly', 'price_yearly',
        'features', 'has_signals', 'has_trading_room', 'has_mentorship',
        'has_premium_indicators', 'has_priority_support', 'has_advanced_analytics',
        'signals_per_day', 'tier', 'trial_days', 'display_order', 'is_active', 'is_featured'
    ]

    for field in updateable:
        if field in data:
            setattr(plan, field, data[field])

    plan.updated_at = datetime.utcnow()
    db.session.commit()

    log_audit(
        user_id=user_id,
        action='plan_updated',
        resource_type='subscription_plan',
        resource_id=plan.id,
        details={'changes': list(data.keys())}
    )

    return jsonify({
        'message': 'Plan updated',
        'plan': plan.to_dict()
    }), 200


@subscriptions_v2_bp.route('/admin/sync-stripe', methods=['POST'])
@jwt_required()
def admin_sync_stripe():
    """Admin: Sync plans to Stripe (create products/prices)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403

    if not stripe_service.is_configured():
        return jsonify({'error': 'Stripe not configured'}), 400

    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    plan_data = [
        {
            'slug': p.slug,
            'name': p.name,
            'description': p.description,
            'price_monthly': float(p.price_monthly) if p.price_monthly else None,
            'price_quarterly': float(p.price_quarterly) if p.price_quarterly else None,
            'price_yearly': float(p.price_yearly) if p.price_yearly else None,
            'stripe_product_id': p.stripe_product_id
        }
        for p in plans
    ]

    results = stripe_service.sync_plans_to_stripe(plan_data)

    # Update plans with Stripe IDs
    for plan in plans:
        if plan.slug in results:
            plan.stripe_product_id = results[plan.slug]['product_id']
            prices = results[plan.slug].get('prices', {})
            plan.stripe_price_monthly_id = prices.get('monthly')
            plan.stripe_price_quarterly_id = prices.get('quarterly')
            plan.stripe_price_yearly_id = prices.get('yearly')

    db.session.commit()

    log_audit(
        user_id=user_id,
        action='stripe_sync',
        resource_type='subscription_plan',
        details={'synced_plans': list(results.keys())}
    )

    return jsonify({
        'message': 'Plans synced to Stripe',
        'results': results
    }), 200


@subscriptions_v2_bp.route('/admin/seed-plans', methods=['POST'])
@jwt_required()
def admin_seed_plans():
    """Admin: Seed default subscription plans"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403

    SubscriptionPlan.seed_default_plans()

    log_audit(
        user_id=user_id,
        action='plans_seeded',
        resource_type='subscription_plan'
    )

    return jsonify({'message': 'Default plans seeded'}), 200
