"""
Stripe Service
Handles Stripe integration for recurring subscriptions
"""

import os
import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from models import db, Settings

# Initialize Stripe
_stripe_configured = False


def _configure_stripe():
    """Configure Stripe with API keys from settings or environment"""
    global _stripe_configured

    if _stripe_configured:
        return True

    # Get credentials from database settings first
    api_key = Settings.get_setting('stripe_secret_key')

    # Fallback to environment variables
    if not api_key:
        api_key = os.getenv('STRIPE_SECRET_KEY')

    if not api_key:
        print("Warning: Stripe API key not configured")
        return False

    try:
        stripe.api_key = api_key
        stripe.api_version = "2023-10-16"  # Use stable API version
        _stripe_configured = True
        return True
    except Exception as e:
        print(f"Error configuring Stripe: {e}")
        return False


def get_webhook_secret() -> Optional[str]:
    """Get Stripe webhook signing secret"""
    secret = Settings.get_setting('stripe_webhook_secret')
    if not secret:
        secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    return secret


def is_configured() -> bool:
    """Check if Stripe is properly configured"""
    return _configure_stripe()


# ==================== CUSTOMER MANAGEMENT ====================

def create_customer(email: str, name: Optional[str] = None,
                   metadata: Optional[Dict] = None) -> Optional[Dict]:
    """
    Create a Stripe customer

    Args:
        email: Customer email
        name: Customer name
        metadata: Additional metadata (user_id, etc.)

    Returns:
        Customer data dict or None on failure
    """
    if not _configure_stripe():
        return None

    try:
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=metadata or {}
        )
        return {
            'id': customer.id,
            'email': customer.email,
            'name': customer.name,
            'created': customer.created
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error creating customer: {e}")
        return None


def get_customer(customer_id: str) -> Optional[Dict]:
    """Get customer by ID"""
    if not _configure_stripe():
        return None

    try:
        customer = stripe.Customer.retrieve(customer_id)
        return {
            'id': customer.id,
            'email': customer.email,
            'name': customer.name,
            'default_payment_method': customer.invoice_settings.default_payment_method
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error getting customer: {e}")
        return None


def update_customer(customer_id: str, **kwargs) -> Optional[Dict]:
    """Update customer data"""
    if not _configure_stripe():
        return None

    try:
        customer = stripe.Customer.modify(customer_id, **kwargs)
        return {
            'id': customer.id,
            'email': customer.email,
            'name': customer.name
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error updating customer: {e}")
        return None


# ==================== CHECKOUT SESSIONS ====================

def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    trial_days: int = 0,
    metadata: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Create a Stripe Checkout session for subscription

    Args:
        customer_id: Stripe customer ID
        price_id: Stripe Price ID for the plan
        success_url: URL to redirect after success
        cancel_url: URL to redirect on cancel
        trial_days: Number of trial days (0 for no trial)
        metadata: Additional metadata

    Returns:
        Checkout session data with URL
    """
    if not _configure_stripe():
        return None

    try:
        session_params = {
            'customer': customer_id,
            'payment_method_types': ['card'],
            'mode': 'subscription',
            'line_items': [{
                'price': price_id,
                'quantity': 1
            }],
            'success_url': success_url,
            'cancel_url': cancel_url,
            'metadata': metadata or {},
            'allow_promotion_codes': True
        }

        # Add trial period if specified
        if trial_days > 0:
            session_params['subscription_data'] = {
                'trial_period_days': trial_days,
                'metadata': metadata or {}
            }

        session = stripe.checkout.Session.create(**session_params)

        return {
            'id': session.id,
            'url': session.url,
            'customer': session.customer,
            'subscription': session.subscription,
            'status': session.status
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error creating checkout session: {e}")
        return None


def create_customer_portal_session(
    customer_id: str,
    return_url: str
) -> Optional[Dict]:
    """
    Create a Stripe Customer Portal session
    Allows customer to manage their subscription, update payment, etc.

    Args:
        customer_id: Stripe customer ID
        return_url: URL to return to after portal

    Returns:
        Portal session with URL
    """
    if not _configure_stripe():
        return None

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
        return {
            'id': session.id,
            'url': session.url
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error creating portal session: {e}")
        return None


# ==================== SUBSCRIPTION MANAGEMENT ====================

def create_subscription(
    customer_id: str,
    price_id: str,
    trial_days: int = 0,
    payment_method_id: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Create a subscription directly (for existing payment methods)

    Args:
        customer_id: Stripe customer ID
        price_id: Stripe Price ID
        trial_days: Trial period days
        payment_method_id: Payment method to use
        metadata: Additional metadata

    Returns:
        Subscription data
    """
    if not _configure_stripe():
        return None

    try:
        sub_params = {
            'customer': customer_id,
            'items': [{'price': price_id}],
            'metadata': metadata or {},
            'expand': ['latest_invoice.payment_intent']
        }

        if trial_days > 0:
            sub_params['trial_period_days'] = trial_days

        if payment_method_id:
            sub_params['default_payment_method'] = payment_method_id

        subscription = stripe.Subscription.create(**sub_params)

        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error creating subscription: {e}")
        return None


def get_subscription(subscription_id: str) -> Optional[Dict]:
    """Get subscription by ID"""
    if not _configure_stripe():
        return None

    try:
        subscription = stripe.Subscription.retrieve(
            subscription_id,
            expand=['latest_invoice', 'default_payment_method']
        )
        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error getting subscription: {e}")
        return None


def update_subscription(
    subscription_id: str,
    new_price_id: Optional[str] = None,
    proration_behavior: str = 'create_prorations',
    **kwargs
) -> Optional[Dict]:
    """
    Update a subscription (upgrade/downgrade)

    Args:
        subscription_id: Stripe subscription ID
        new_price_id: New price ID for plan change
        proration_behavior: How to handle proration

    Returns:
        Updated subscription data
    """
    if not _configure_stripe():
        return None

    try:
        update_params = kwargs

        if new_price_id:
            # Get current subscription to find item ID
            current_sub = stripe.Subscription.retrieve(subscription_id)
            item_id = current_sub['items']['data'][0].id

            update_params['items'] = [{
                'id': item_id,
                'price': new_price_id
            }]
            update_params['proration_behavior'] = proration_behavior

        subscription = stripe.Subscription.modify(
            subscription_id,
            **update_params
        )
        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error updating subscription: {e}")
        return None


def cancel_subscription(
    subscription_id: str,
    at_period_end: bool = True,
    cancellation_reason: Optional[str] = None
) -> Optional[Dict]:
    """
    Cancel a subscription

    Args:
        subscription_id: Stripe subscription ID
        at_period_end: If True, cancel at end of billing period
        cancellation_reason: Reason for cancellation

    Returns:
        Cancelled subscription data
    """
    if not _configure_stripe():
        return None

    try:
        if at_period_end:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True,
                cancellation_details={'comment': cancellation_reason} if cancellation_reason else None
            )
        else:
            subscription = stripe.Subscription.cancel(
                subscription_id,
                cancellation_details={'comment': cancellation_reason} if cancellation_reason else None
            )

        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error canceling subscription: {e}")
        return None


def resume_subscription(subscription_id: str) -> Optional[Dict]:
    """Resume a subscription that was set to cancel at period end"""
    if not _configure_stripe():
        return None

    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error resuming subscription: {e}")
        return None


def pause_subscription(subscription_id: str) -> Optional[Dict]:
    """Pause a subscription (pause collection)"""
    if not _configure_stripe():
        return None

    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            pause_collection={'behavior': 'void'}
        )
        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error pausing subscription: {e}")
        return None


def unpause_subscription(subscription_id: str) -> Optional[Dict]:
    """Resume a paused subscription"""
    if not _configure_stripe():
        return None

    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            pause_collection=''  # Empty string clears pause
        )
        return _format_subscription(subscription)
    except stripe.error.StripeError as e:
        print(f"Stripe error unpausing subscription: {e}")
        return None


# ==================== PAYMENT METHODS ====================

def attach_payment_method(
    customer_id: str,
    payment_method_id: str,
    set_default: bool = True
) -> Optional[Dict]:
    """Attach a payment method to a customer"""
    if not _configure_stripe():
        return None

    try:
        # Attach to customer
        payment_method = stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )

        # Set as default if requested
        if set_default:
            stripe.Customer.modify(
                customer_id,
                invoice_settings={'default_payment_method': payment_method_id}
            )

        return {
            'id': payment_method.id,
            'type': payment_method.type,
            'card': {
                'brand': payment_method.card.brand,
                'last4': payment_method.card.last4,
                'exp_month': payment_method.card.exp_month,
                'exp_year': payment_method.card.exp_year
            } if payment_method.type == 'card' else None
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error attaching payment method: {e}")
        return None


def list_payment_methods(customer_id: str, type: str = 'card') -> List[Dict]:
    """List payment methods for a customer"""
    if not _configure_stripe():
        return []

    try:
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type=type
        )

        return [{
            'id': pm.id,
            'type': pm.type,
            'card': {
                'brand': pm.card.brand,
                'last4': pm.card.last4,
                'exp_month': pm.card.exp_month,
                'exp_year': pm.card.exp_year
            } if pm.type == 'card' else None
        } for pm in payment_methods.data]
    except stripe.error.StripeError as e:
        print(f"Stripe error listing payment methods: {e}")
        return []


def detach_payment_method(payment_method_id: str) -> bool:
    """Detach a payment method from customer"""
    if not _configure_stripe():
        return False

    try:
        stripe.PaymentMethod.detach(payment_method_id)
        return True
    except stripe.error.StripeError as e:
        print(f"Stripe error detaching payment method: {e}")
        return False


# ==================== INVOICES ====================

def get_upcoming_invoice(customer_id: str, subscription_id: Optional[str] = None) -> Optional[Dict]:
    """Get upcoming invoice preview"""
    if not _configure_stripe():
        return None

    try:
        params = {'customer': customer_id}
        if subscription_id:
            params['subscription'] = subscription_id

        invoice = stripe.Invoice.upcoming(**params)

        return {
            'amount_due': invoice.amount_due / 100,  # Convert from cents
            'currency': invoice.currency,
            'period_start': datetime.fromtimestamp(invoice.period_start).isoformat(),
            'period_end': datetime.fromtimestamp(invoice.period_end).isoformat(),
            'next_payment_attempt': datetime.fromtimestamp(invoice.next_payment_attempt).isoformat() if invoice.next_payment_attempt else None,
            'lines': [{
                'description': line.description,
                'amount': line.amount / 100,
                'quantity': line.quantity
            } for line in invoice.lines.data]
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error getting upcoming invoice: {e}")
        return None


def list_invoices(customer_id: str, limit: int = 10) -> List[Dict]:
    """List invoices for a customer"""
    if not _configure_stripe():
        return []

    try:
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=limit,
            expand=['data.subscription']
        )

        return [{
            'id': inv.id,
            'number': inv.number,
            'amount_due': inv.amount_due / 100,
            'amount_paid': inv.amount_paid / 100,
            'currency': inv.currency,
            'status': inv.status,
            'paid': inv.paid,
            'created': datetime.fromtimestamp(inv.created).isoformat(),
            'period_start': datetime.fromtimestamp(inv.period_start).isoformat() if inv.period_start else None,
            'period_end': datetime.fromtimestamp(inv.period_end).isoformat() if inv.period_end else None,
            'invoice_pdf': inv.invoice_pdf,
            'hosted_invoice_url': inv.hosted_invoice_url
        } for inv in invoices.data]
    except stripe.error.StripeError as e:
        print(f"Stripe error listing invoices: {e}")
        return []


# ==================== WEBHOOKS ====================

def construct_webhook_event(payload: bytes, sig_header: str) -> Optional[stripe.Event]:
    """
    Construct and verify a webhook event

    Args:
        payload: Raw request body
        sig_header: Stripe-Signature header

    Returns:
        Verified Stripe Event or None
    """
    webhook_secret = get_webhook_secret()
    if not webhook_secret:
        print("Webhook secret not configured")
        return None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        return event
    except ValueError as e:
        print(f"Invalid webhook payload: {e}")
        return None
    except stripe.error.SignatureVerificationError as e:
        print(f"Invalid webhook signature: {e}")
        return None


# ==================== PRODUCTS & PRICES ====================

def create_product(name: str, description: Optional[str] = None, metadata: Optional[Dict] = None) -> Optional[Dict]:
    """Create a Stripe Product"""
    if not _configure_stripe():
        return None

    try:
        product = stripe.Product.create(
            name=name,
            description=description,
            metadata=metadata or {}
        )
        return {
            'id': product.id,
            'name': product.name,
            'description': product.description
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error creating product: {e}")
        return None


def create_price(
    product_id: str,
    unit_amount: int,  # In cents
    currency: str = 'usd',
    interval: str = 'month',
    interval_count: int = 1
) -> Optional[Dict]:
    """Create a Stripe Price for recurring billing"""
    if not _configure_stripe():
        return None

    try:
        price = stripe.Price.create(
            product=product_id,
            unit_amount=unit_amount,
            currency=currency,
            recurring={
                'interval': interval,
                'interval_count': interval_count
            }
        )
        return {
            'id': price.id,
            'unit_amount': price.unit_amount,
            'currency': price.currency,
            'recurring': {
                'interval': price.recurring.interval,
                'interval_count': price.recurring.interval_count
            }
        }
    except stripe.error.StripeError as e:
        print(f"Stripe error creating price: {e}")
        return None


def list_prices(product_id: Optional[str] = None, active: bool = True) -> List[Dict]:
    """List prices, optionally filtered by product"""
    if not _configure_stripe():
        return []

    try:
        params = {'active': active, 'expand': ['data.product']}
        if product_id:
            params['product'] = product_id

        prices = stripe.Price.list(**params)

        return [{
            'id': price.id,
            'product_id': price.product.id if hasattr(price.product, 'id') else price.product,
            'unit_amount': price.unit_amount,
            'currency': price.currency,
            'recurring': {
                'interval': price.recurring.interval,
                'interval_count': price.recurring.interval_count
            } if price.recurring else None
        } for price in prices.data]
    except stripe.error.StripeError as e:
        print(f"Stripe error listing prices: {e}")
        return []


# ==================== HELPERS ====================

def _format_subscription(subscription: stripe.Subscription) -> Dict:
    """Format subscription object to dict"""
    return {
        'id': subscription.id,
        'customer': subscription.customer,
        'status': subscription.status,
        'current_period_start': datetime.fromtimestamp(subscription.current_period_start).isoformat(),
        'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat(),
        'cancel_at_period_end': subscription.cancel_at_period_end,
        'canceled_at': datetime.fromtimestamp(subscription.canceled_at).isoformat() if subscription.canceled_at else None,
        'trial_start': datetime.fromtimestamp(subscription.trial_start).isoformat() if subscription.trial_start else None,
        'trial_end': datetime.fromtimestamp(subscription.trial_end).isoformat() if subscription.trial_end else None,
        'default_payment_method': subscription.default_payment_method,
        'items': [{
            'id': item.id,
            'price_id': item.price.id,
            'product_id': item.price.product,
            'quantity': item.quantity
        } for item in subscription['items']['data']],
        'latest_invoice': subscription.latest_invoice if isinstance(subscription.latest_invoice, str) else {
            'id': subscription.latest_invoice.id,
            'status': subscription.latest_invoice.status,
            'amount_due': subscription.latest_invoice.amount_due / 100,
            'hosted_invoice_url': subscription.latest_invoice.hosted_invoice_url
        } if subscription.latest_invoice else None,
        'metadata': dict(subscription.metadata)
    }


def sync_plans_to_stripe(plans: List[Dict]) -> Dict[str, Dict]:
    """
    Sync subscription plans to Stripe
    Creates products and prices if they don't exist

    Args:
        plans: List of plan dicts with name, prices, etc.

    Returns:
        Dict mapping plan slug to Stripe IDs
    """
    if not _configure_stripe():
        return {}

    results = {}

    for plan in plans:
        try:
            # Check if product exists
            product_id = plan.get('stripe_product_id')

            if not product_id:
                # Create product
                product = stripe.Product.create(
                    name=plan['name'],
                    description=plan.get('description', ''),
                    metadata={'slug': plan['slug']}
                )
                product_id = product.id

            results[plan['slug']] = {
                'product_id': product_id,
                'prices': {}
            }

            # Create prices for each interval
            intervals = [
                ('monthly', plan.get('price_monthly'), 'month', 1),
                ('quarterly', plan.get('price_quarterly'), 'month', 3),
                ('yearly', plan.get('price_yearly'), 'year', 1)
            ]

            for interval_name, amount, stripe_interval, interval_count in intervals:
                if amount:
                    price = stripe.Price.create(
                        product=product_id,
                        unit_amount=int(float(amount) * 100),  # Convert to cents
                        currency='usd',
                        recurring={
                            'interval': stripe_interval,
                            'interval_count': interval_count
                        },
                        metadata={
                            'slug': plan['slug'],
                            'interval': interval_name
                        }
                    )
                    results[plan['slug']]['prices'][interval_name] = price.id

        except stripe.error.StripeError as e:
            print(f"Error syncing plan {plan.get('slug')}: {e}")
            continue

    return results
