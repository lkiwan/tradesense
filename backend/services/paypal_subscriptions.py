"""
PayPal Subscriptions API Service
Uses PayPal's Subscriptions API for recurring payments with trial periods
"""

import os
import requests
import logging
from datetime import datetime, timedelta
from functools import lru_cache

logger = logging.getLogger(__name__)

# Cache for PayPal access token
_access_token = None
_token_expires = None


def _get_paypal_config():
    """Get PayPal configuration from environment"""
    from models import Settings

    client_id = Settings.get_setting('paypal_client_id') or os.getenv('PAYPAL_CLIENT_ID')
    client_secret = Settings.get_setting('paypal_client_secret') or os.getenv('PAYPAL_CLIENT_SECRET')
    mode = Settings.get_setting('paypal_mode') or os.getenv('PAYPAL_MODE', 'sandbox')

    if mode == 'live':
        base_url = 'https://api-m.paypal.com'
    else:
        base_url = 'https://api-m.sandbox.paypal.com'

    return {
        'client_id': client_id,
        'client_secret': client_secret,
        'base_url': base_url,
        'mode': mode
    }


def _get_access_token():
    """Get PayPal OAuth access token"""
    global _access_token, _token_expires

    # Return cached token if still valid
    if _access_token and _token_expires and datetime.utcnow() < _token_expires:
        return _access_token

    config = _get_paypal_config()

    if not config['client_id'] or not config['client_secret']:
        logger.error("PayPal credentials not configured")
        return None

    try:
        response = requests.post(
            f"{config['base_url']}/v1/oauth2/token",
            auth=(config['client_id'], config['client_secret']),
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={'grant_type': 'client_credentials'},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            _access_token = data['access_token']
            # Token expires in `expires_in` seconds, subtract 60 for safety
            _token_expires = datetime.utcnow() + timedelta(seconds=data.get('expires_in', 3600) - 60)
            return _access_token
        else:
            logger.error(f"Failed to get PayPal token: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        logger.error(f"Error getting PayPal access token: {e}")
        return None


def _paypal_request(method, endpoint, data=None):
    """Make authenticated request to PayPal API"""
    token = _get_access_token()
    if not token:
        return None

    config = _get_paypal_config()
    url = f"{config['base_url']}{endpoint}"

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == 'PATCH':
            response = requests.patch(url, headers=headers, json=data, timeout=30)
        else:
            return None

        if response.status_code in [200, 201, 204]:
            return response.json() if response.text else {}
        else:
            logger.error(f"PayPal API error: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        logger.error(f"PayPal request error: {e}")
        return None


def create_product(name, description, product_type="SERVICE"):
    """
    Create a PayPal product (catalog item)
    Products are reusable and should be created once per challenge type
    """
    data = {
        "name": name,
        "description": description,
        "type": product_type,
        "category": "SOFTWARE"
    }

    result = _paypal_request('POST', '/v1/catalogs/products', data)
    if result:
        logger.info(f"Created PayPal product: {result.get('id')}")
        return result
    return None


def create_plan(product_id, plan_name, price, currency="USD", trial_days=7):
    """
    Create a subscription plan with trial period
    """
    data = {
        "product_id": product_id,
        "name": plan_name,
        "description": f"{plan_name} with {trial_days}-day free trial",
        "status": "ACTIVE",
        "billing_cycles": [
            {
                "frequency": {
                    "interval_unit": "DAY",
                    "interval_count": trial_days
                },
                "tenure_type": "TRIAL",
                "sequence": 1,
                "total_cycles": 1,
                "pricing_scheme": {
                    "fixed_price": {
                        "value": "0",
                        "currency_code": currency
                    }
                }
            },
            {
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "REGULAR",
                "sequence": 2,
                "total_cycles": 1,  # One-time charge after trial
                "pricing_scheme": {
                    "fixed_price": {
                        "value": str(price),
                        "currency_code": currency
                    }
                }
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "payment_failure_threshold": 3
        }
    }

    result = _paypal_request('POST', '/v1/billing/plans', data)
    if result:
        logger.info(f"Created PayPal plan: {result.get('id')}")
        return result
    return None


def get_or_create_plan(plan_type, plan_name, price, currency="USD", trial_days=7):
    """
    Get existing plan or create a new one
    Stores plan IDs in database settings for reuse
    """
    from models import Settings, db

    # Generate a unique key for this plan configuration
    plan_key = f"paypal_plan_{plan_type}_{price}_{currency}"

    # Check if we already have a plan ID
    existing_plan_id = Settings.get_setting(plan_key)
    if existing_plan_id:
        logger.info(f"Using existing PayPal plan: {existing_plan_id}")
        return existing_plan_id

    # Create product first
    product_key = f"paypal_product_{plan_type}"
    product_id = Settings.get_setting(product_key)

    if not product_id:
        product = create_product(
            f"TradeSense {plan_name} Challenge",
            f"Trading challenge subscription for {plan_name} plan"
        )
        if not product:
            logger.error("Failed to create PayPal product")
            return None
        product_id = product['id']
        Settings.set_setting(product_key, product_id)
        db.session.commit()

    # Create plan
    plan = create_plan(product_id, plan_name, price, currency, trial_days)
    if not plan:
        logger.error("Failed to create PayPal plan")
        return None

    # Store plan ID for reuse
    Settings.set_setting(plan_key, plan['id'])
    db.session.commit()

    return plan['id']


def create_subscription(plan_id, return_url, cancel_url, custom_id=None):
    """
    Create a subscription for user to approve
    Returns approval URL to redirect user to PayPal
    """
    data = {
        "plan_id": plan_id,
        "application_context": {
            "brand_name": "TradeSense",
            "locale": "en-US",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "SUBSCRIBE_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url
        }
    }

    if custom_id:
        data["custom_id"] = str(custom_id)

    result = _paypal_request('POST', '/v1/billing/subscriptions', data)

    if result:
        # Find approval URL
        approval_url = None
        for link in result.get('links', []):
            if link.get('rel') == 'approve':
                approval_url = link.get('href')
                break

        return {
            'subscription_id': result.get('id'),
            'status': result.get('status'),
            'approval_url': approval_url,
            'links': result.get('links', [])
        }

    return None


def get_subscription(subscription_id):
    """Get subscription details"""
    return _paypal_request('GET', f'/v1/billing/subscriptions/{subscription_id}')


def activate_subscription(subscription_id):
    """Activate a subscription after approval"""
    result = _paypal_request('POST', f'/v1/billing/subscriptions/{subscription_id}/activate', {
        "reason": "User approved subscription"
    })
    return result is not None


def cancel_subscription(subscription_id, reason="User requested cancellation"):
    """Cancel a subscription"""
    result = _paypal_request('POST', f'/v1/billing/subscriptions/{subscription_id}/cancel', {
        "reason": reason[:128]
    })
    return result is not None or result == {}


def suspend_subscription(subscription_id, reason="Suspended by system"):
    """Suspend a subscription temporarily"""
    result = _paypal_request('POST', f'/v1/billing/subscriptions/{subscription_id}/suspend', {
        "reason": reason[:128]
    })
    return result is not None or result == {}


def capture_subscription_payment(subscription_id, amount, currency="USD", note=""):
    """Capture an outstanding payment for a subscription"""
    data = {
        "note": note[:255] if note else "Payment capture",
        "capture_type": "OUTSTANDING_BALANCE",
        "amount": {
            "currency_code": currency,
            "value": str(round(amount, 2))
        }
    }

    return _paypal_request('POST', f'/v1/billing/subscriptions/{subscription_id}/capture', data)


# ==================== SUBSCRIPTION FLOW FOR TRIALS ====================

def create_trial_subscription(plan_type: str, plan_name: str, plan_price: float,
                              return_url: str, cancel_url: str, user_id: int = None) -> dict:
    """
    Create a PayPal subscription with 7-day free trial

    Args:
        plan_type: The plan type (starter, pro, elite)
        plan_name: Display name of the plan
        plan_price: Price after trial
        return_url: URL to return after PayPal approval
        cancel_url: URL if user cancels
        user_id: Optional user ID to track

    Returns:
        dict with subscription_id and approval_url
    """
    # Get or create the plan
    plan_id = get_or_create_plan(plan_type, plan_name, plan_price)

    if not plan_id:
        logger.error("Failed to get/create PayPal plan")
        return None

    # Create subscription
    result = create_subscription(
        plan_id=plan_id,
        return_url=return_url,
        cancel_url=cancel_url,
        custom_id=f"user_{user_id}" if user_id else None
    )

    if result:
        logger.info(f"Created PayPal subscription: {result.get('subscription_id')}")
        return {
            'subscription_id': result.get('subscription_id'),
            'approval_url': result.get('approval_url'),
            'plan_id': plan_id
        }

    return None


def verify_subscription_approved(subscription_id: str) -> dict:
    """
    Verify a subscription was approved and is active
    Called after user returns from PayPal

    Returns subscription details or None if not approved
    """
    subscription = get_subscription(subscription_id)

    if not subscription:
        return None

    status = subscription.get('status', '').upper()

    if status in ['ACTIVE', 'APPROVED']:
        subscriber = subscription.get('subscriber', {})

        return {
            'subscription_id': subscription.get('id'),
            'status': status,
            'plan_id': subscription.get('plan_id'),
            'payer_email': subscriber.get('email_address'),
            'payer_id': subscriber.get('payer_id'),
            'payer_name': f"{subscriber.get('name', {}).get('given_name', '')} {subscriber.get('name', {}).get('surname', '')}".strip(),
            'start_time': subscription.get('start_time'),
            'billing_info': subscription.get('billing_info', {})
        }

    logger.warning(f"Subscription {subscription_id} not approved. Status: {status}")
    return None


def is_paypal_configured() -> bool:
    """Check if PayPal is properly configured"""
    config = _get_paypal_config()
    return bool(config['client_id'] and config['client_secret'])
