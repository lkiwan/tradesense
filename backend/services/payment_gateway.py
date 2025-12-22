"""
Payment Gateway Service
Handles PayPal integration and mock payment methods
"""

import os
import paypalrestsdk
from models import Settings

# PayPal configuration flag
_paypal_configured = False


def _configure_paypal():
    """Configure PayPal SDK with credentials from settings or environment"""
    global _paypal_configured

    if _paypal_configured:
        return True

    # Get credentials from database settings first
    client_id = Settings.get_setting('paypal_client_id')
    client_secret = Settings.get_setting('paypal_client_secret')
    mode = Settings.get_setting('paypal_mode', 'sandbox')

    # Fallback to environment variables
    if not client_id:
        client_id = os.getenv('PAYPAL_CLIENT_ID')
    if not client_secret:
        client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
    if not mode:
        mode = os.getenv('PAYPAL_MODE', 'sandbox')

    if not client_id or not client_secret:
        print("Warning: PayPal credentials not configured")
        return False

    try:
        paypalrestsdk.configure({
            'mode': mode,  # 'sandbox' or 'live'
            'client_id': client_id,
            'client_secret': client_secret
        })
        _paypal_configured = True
        return True
    except Exception as e:
        print(f"Error configuring PayPal: {e}")
        return False


def create_paypal_order(amount: float, payment_id: int) -> dict | None:
    """
    Create a PayPal order for the given amount

    Returns PayPal order data with approval URL
    """
    if not _configure_paypal():
        return None

    try:
        # Convert MAD to USD (approximate rate)
        usd_amount = round(amount / 10, 2)  # 1 USD ≈ 10 MAD

        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"/api/payments/paypal/success?payment_id={payment_id}",
                "cancel_url": f"/api/payments/paypal/cancel?payment_id={payment_id}"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "TradeSense Trading Challenge",
                        "sku": f"CHALLENGE-{payment_id}",
                        "price": str(usd_amount),
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(usd_amount),
                    "currency": "USD"
                },
                "description": "TradeSense Prop Trading Challenge Fee"
            }]
        })

        if payment.create():
            # Find approval URL
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    break

            return {
                'id': payment.id,
                'state': payment.state,
                'links': [{'rel': l.rel, 'href': l.href} for l in payment.links],
                'approval_url': approval_url
            }
        else:
            print(f"PayPal payment creation failed: {payment.error}")
            return None

    except Exception as e:
        print(f"Error creating PayPal order: {e}")
        return None


def process_paypal_payment(paypal_order_id: str, payer_id: str = None) -> bool:
    """
    Execute/capture a PayPal payment after user approval

    Returns True if successful
    """
    if not _configure_paypal():
        return False

    try:
        payment = paypalrestsdk.Payment.find(paypal_order_id)

        if payment.execute({"payer_id": payer_id}) if payer_id else True:
            return payment.state == "approved"
        else:
            print(f"PayPal execution failed: {payment.error}")
            return False

    except Exception as e:
        print(f"Error processing PayPal payment: {e}")
        return False


def verify_paypal_webhook(headers: dict, body: str) -> bool:
    """
    Verify PayPal webhook signature
    """
    # Implement webhook verification if needed
    # For now, return True for development
    return True


# ==================== PAYPAL BILLING AGREEMENTS (For Auto-Charge Trials) ====================

def create_billing_agreement_token(plan_type: str, plan_name: str, plan_price: float,
                                    return_url: str, cancel_url: str) -> dict | None:
    """
    Create a PayPal billing agreement token for future charges.
    This authorizes PayPal to charge the user after trial ends.

    Args:
        plan_type: The plan type (starter, pro, elite)
        plan_name: Display name of the plan
        plan_price: Price to charge after trial
        return_url: URL to return after PayPal approval
        cancel_url: URL if user cancels on PayPal

    Returns:
        dict with token and approval_url, or None on failure
    """
    if not _configure_paypal():
        return None

    from datetime import datetime, timedelta

    try:
        # Start date is 7 days from now (after trial ends)
        start_date = (datetime.utcnow() + timedelta(days=7, minutes=5)).strftime('%Y-%m-%dT%H:%M:%SZ')

        billing_agreement = paypalrestsdk.BillingAgreement({
            "name": f"TradeSense {plan_name} Challenge",
            "description": f"After your 7-day free trial, you will be charged ${plan_price:.2f} USD for the {plan_name} challenge. You can cancel anytime before trial ends.",
            "start_date": start_date,
            "plan": {
                "type": "MERCHANT_INITIATED_BILLING",
                "merchant_preferences": {
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                    "auto_bill_amount": "YES",
                    "initial_fail_amount_action": "CANCEL"
                }
            },
            "payer": {
                "payment_method": "paypal"
            }
        })

        if billing_agreement.create():
            # Find approval URL
            approval_url = None
            token = None
            for link in billing_agreement.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    # Extract token from URL
                    if 'token=' in approval_url:
                        token = approval_url.split('token=')[-1].split('&')[0]
                    break

            return {
                'token': token or billing_agreement.id,
                'agreement_id': billing_agreement.id,
                'approval_url': approval_url,
                'links': [{'rel': l.rel, 'href': l.href} for l in billing_agreement.links]
            }
        else:
            print(f"Billing agreement creation failed: {billing_agreement.error}")
            return None

    except Exception as e:
        print(f"Error creating billing agreement: {e}")
        return None


def execute_billing_agreement(token: str) -> dict | None:
    """
    Execute/finalize billing agreement after user approval.
    Called when user returns from PayPal.

    Args:
        token: The PayPal approval token from the return URL

    Returns:
        dict with agreement_id and payer info, or None on failure
    """
    if not _configure_paypal():
        return None

    try:
        # Execute the billing agreement
        billing_agreement = paypalrestsdk.BillingAgreement.execute(token)

        if billing_agreement and billing_agreement.id:
            payer_info = {}
            if hasattr(billing_agreement, 'payer') and billing_agreement.payer:
                payer = billing_agreement.payer
                if hasattr(payer, 'payer_info') and payer.payer_info:
                    payer_info = {
                        'payer_id': getattr(payer.payer_info, 'payer_id', None),
                        'email': getattr(payer.payer_info, 'email', None),
                        'first_name': getattr(payer.payer_info, 'first_name', None),
                        'last_name': getattr(payer.payer_info, 'last_name', None)
                    }

            return {
                'agreement_id': billing_agreement.id,
                'state': billing_agreement.state,
                'payer_id': payer_info.get('payer_id'),
                'payer_email': payer_info.get('email'),
                'payer_name': f"{payer_info.get('first_name', '')} {payer_info.get('last_name', '')}".strip()
            }

        print(f"Failed to execute billing agreement")
        return None

    except Exception as e:
        print(f"Error executing billing agreement: {e}")
        return None


def charge_billing_agreement(agreement_id: str, amount: float, description: str) -> dict:
    """
    Charge a billing agreement (reference transaction).
    Used by scheduler for auto-charging after trial ends.

    Args:
        agreement_id: The PayPal billing agreement ID
        amount: Amount to charge in USD
        description: Transaction description

    Returns:
        dict with success status and transaction details
    """
    if not _configure_paypal():
        return {
            'success': False,
            'error': 'PayPal not configured'
        }

    try:
        # Find the billing agreement to verify it's active
        billing_agreement = paypalrestsdk.BillingAgreement.find(agreement_id)

        if not billing_agreement or billing_agreement.state.lower() != 'active':
            return {
                'success': False,
                'error': f'Billing agreement not active: {billing_agreement.state if billing_agreement else "not found"}'
            }

        # Create a payment using the billing agreement
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal",
                "payer_info": {
                    "email": getattr(billing_agreement.payer.payer_info, 'email', '') if hasattr(billing_agreement, 'payer') else ''
                }
            },
            "transactions": [{
                "amount": {
                    "total": str(round(amount, 2)),
                    "currency": "USD"
                },
                "description": description,
                "related_resources": [{
                    "billing_agreement_id": agreement_id
                }]
            }]
        })

        # For reference transactions, we may need to use a different approach
        # Try the agreement.bill() method if available, otherwise use sale
        try:
            # Attempt to bill using agreement
            bill_result = billing_agreement.bill({
                "note": description,
                "amount": {
                    "currency": "USD",
                    "value": str(round(amount, 2))
                }
            })

            if bill_result:
                return {
                    'success': True,
                    'transaction_id': f'BA-{agreement_id}-{bill_result.get("id", "auto")}',
                    'state': 'completed',
                    'amount': amount
                }
        except Exception as bill_error:
            print(f"Direct billing failed, trying payment creation: {bill_error}")

        # Fallback: Create a sale payment linked to the agreement
        if payment.create():
            # Execute the payment
            payer_id = getattr(billing_agreement.payer.payer_info, 'payer_id', None) if hasattr(billing_agreement, 'payer') else None

            if payer_id and payment.execute({"payer_id": payer_id}):
                return {
                    'success': True,
                    'transaction_id': payment.id,
                    'state': payment.state,
                    'amount': amount
                }
            elif payment.state == 'approved':
                return {
                    'success': True,
                    'transaction_id': payment.id,
                    'state': payment.state,
                    'amount': amount
                }

        return {
            'success': False,
            'error': payment.error if hasattr(payment, 'error') else 'Payment failed'
        }

    except Exception as e:
        print(f"Error charging billing agreement: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def cancel_billing_agreement(agreement_id: str, reason: str = "User cancelled trial") -> bool:
    """
    Cancel a PayPal billing agreement.
    Called when user cancels their trial before it ends.

    Args:
        agreement_id: The PayPal billing agreement ID
        reason: Reason for cancellation

    Returns:
        True if successfully cancelled, False otherwise
    """
    if not _configure_paypal():
        return False

    try:
        billing_agreement = paypalrestsdk.BillingAgreement.find(agreement_id)

        if not billing_agreement:
            print(f"Billing agreement not found: {agreement_id}")
            return False

        # Cancel the agreement
        if billing_agreement.cancel({"note": reason[:128]}):  # Note has 128 char limit
            return True
        else:
            print(f"Failed to cancel agreement: {billing_agreement.error if hasattr(billing_agreement, 'error') else 'Unknown error'}")
            return False

    except Exception as e:
        print(f"Error cancelling billing agreement: {e}")
        return False


def get_billing_agreement_status(agreement_id: str) -> dict | None:
    """
    Get the current status of a billing agreement.

    Args:
        agreement_id: The PayPal billing agreement ID

    Returns:
        dict with agreement status info, or None on failure
    """
    if not _configure_paypal():
        return None

    try:
        billing_agreement = paypalrestsdk.BillingAgreement.find(agreement_id)

        if billing_agreement:
            return {
                'id': billing_agreement.id,
                'state': billing_agreement.state,
                'description': billing_agreement.description,
                'start_date': billing_agreement.start_date if hasattr(billing_agreement, 'start_date') else None
            }
        return None

    except Exception as e:
        print(f"Error getting billing agreement status: {e}")
        return None


# ==================== MOCK PAYMENT METHODS ====================

def process_mock_cmi_payment(card_number: str, expiry: str, cvv: str, amount: float) -> dict:
    """
    Mock CMI (Centre Monétique Interbancaire) payment
    Simulates Moroccan card payment

    Returns:
    {
        'success': bool,
        'transaction_id': str,
        'message': str
    }
    """
    import uuid
    import time

    # Simulate processing time
    time.sleep(1.5)

    # Simple validation
    if not card_number or len(card_number.replace(' ', '')) != 16:
        return {
            'success': False,
            'transaction_id': None,
            'message': 'Invalid card number'
        }

    if not expiry or '/' not in expiry:
        return {
            'success': False,
            'transaction_id': None,
            'message': 'Invalid expiry date'
        }

    if not cvv or len(cvv) != 3:
        return {
            'success': False,
            'transaction_id': None,
            'message': 'Invalid CVV'
        }

    # Simulate success (90% success rate for testing)
    import random
    if random.random() > 0.1:
        return {
            'success': True,
            'transaction_id': f'CMI-{uuid.uuid4().hex[:12].upper()}',
            'message': 'Payment successful',
            'amount': amount,
            'currency': 'MAD'
        }
    else:
        return {
            'success': False,
            'transaction_id': None,
            'message': 'Payment declined by bank'
        }


def process_mock_crypto_payment(wallet_address: str, crypto_type: str, amount_mad: float) -> dict:
    """
    Mock cryptocurrency payment
    Simulates BTC/USDT payment

    Returns:
    {
        'success': bool,
        'transaction_id': str,
        'crypto_amount': float,
        'message': str
    }
    """
    import uuid
    import time

    # Simulate blockchain confirmation time
    time.sleep(2)

    # Mock conversion rates
    rates = {
        'BTC': 1000000,  # 1 BTC = 1,000,000 MAD (approximate)
        'USDT': 10,      # 1 USDT = 10 MAD (approximate)
        'ETH': 35000     # 1 ETH = 35,000 MAD (approximate)
    }

    crypto_type = crypto_type.upper()
    if crypto_type not in rates:
        return {
            'success': False,
            'transaction_id': None,
            'message': f'Unsupported cryptocurrency: {crypto_type}'
        }

    crypto_amount = amount_mad / rates[crypto_type]

    # Simulate blockchain transaction
    return {
        'success': True,
        'transaction_id': f'0x{uuid.uuid4().hex}',
        'crypto_amount': round(crypto_amount, 8),
        'crypto_type': crypto_type,
        'exchange_rate': rates[crypto_type],
        'message': 'Transaction confirmed on blockchain',
        'confirmations': 3
    }


def get_payment_methods() -> list:
    """
    Get available payment methods
    """
    methods = [
        {
            'id': 'cmi',
            'name': 'CMI (Carte Bancaire)',
            'description': 'Pay with Moroccan bank card',
            'icon': 'credit-card',
            'available': True
        },
        {
            'id': 'crypto',
            'name': 'Cryptocurrency',
            'description': 'Pay with BTC, ETH, or USDT',
            'icon': 'bitcoin',
            'available': True
        }
    ]

    # Add PayPal if configured
    if _configure_paypal():
        methods.insert(0, {
            'id': 'paypal',
            'name': 'PayPal',
            'description': 'Pay securely with PayPal',
            'icon': 'paypal',
            'available': True
        })
    else:
        methods.insert(0, {
            'id': 'paypal',
            'name': 'PayPal',
            'description': 'PayPal (Configure in SuperAdmin)',
            'icon': 'paypal',
            'available': False
        })

    return methods
