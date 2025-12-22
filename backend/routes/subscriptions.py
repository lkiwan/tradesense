"""
Subscription Routes for Auto-Charge Trial System

Handles:
- Trial signup with plan selection and PayPal billing agreement
- PayPal return/confirmation after approval
- Trial cancellation
- Trial status checking
"""

from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from datetime import datetime, timedelta

from . import subscriptions_bp
from models import db, Subscription, UserChallenge, Payment, User
from services.payment_gateway import (
    create_billing_agreement_token,
    execute_billing_agreement,
    cancel_billing_agreement
)
from services.email_service import send_trial_started_email


@subscriptions_bp.route('/trial/start', methods=['POST'])
@jwt_required()
def start_trial_with_payment():
    """
    Start trial with plan selection and PayPal billing agreement.

    Creates a PayPal billing agreement for future charges after trial ends.
    User is redirected to PayPal for approval.

    Request body:
    {
        "selected_plan": "starter" | "pro" | "elite",
        "return_url": "https://yoursite.com/checkout/trial/confirm",
        "cancel_url": "https://yoursite.com/checkout/trial?cancelled=true"
    }

    Returns:
    {
        "approval_url": "https://paypal.com/...",  # Redirect user here
        "subscription_id": 123
    }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    selected_plan = data.get('selected_plan')
    return_url = data.get('return_url')
    cancel_url = data.get('cancel_url')

    # Validate required fields
    if not selected_plan or not return_url or not cancel_url:
        return jsonify({
            'error': 'Missing required fields',
            'required': ['selected_plan', 'return_url', 'cancel_url']
        }), 400

    # Validate plan
    plans = current_app.config['PLANS']
    if selected_plan not in ['starter', 'pro', 'elite']:
        return jsonify({
            'error': 'Invalid plan selected',
            'valid_plans': ['starter', 'pro', 'elite']
        }), 400

    plan = plans[selected_plan]

    # Check if user already has a subscription
    existing_sub = Subscription.query.filter_by(user_id=current_user_id).first()
    if existing_sub:
        if existing_sub.status == 'trial':
            return jsonify({
                'error': 'You already have an active trial',
                'subscription': existing_sub.to_dict()
            }), 400
        elif existing_sub.status in ['active', 'pending']:
            return jsonify({
                'error': 'You already have an active subscription',
                'subscription': existing_sub.to_dict()
            }), 400
        # For cancelled/expired/failed, allow new subscription
        # Delete the old one to allow fresh start
        db.session.delete(existing_sub)
        db.session.commit()

    # Check if user already has an active challenge
    active_challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if active_challenge:
        return jsonify({
            'error': 'You already have an active challenge',
            'challenge_id': active_challenge.id
        }), 400

    # Check if user already used a trial before (via old system)
    previous_trial = UserChallenge.query.filter_by(
        user_id=current_user_id,
        is_trial=True
    ).first()

    if previous_trial:
        return jsonify({
            'error': 'Trial already used',
            'message': 'You have already used your free trial. Please purchase a challenge directly.'
        }), 400

    # Create PayPal billing agreement
    agreement_result = create_billing_agreement_token(
        plan_type=selected_plan,
        plan_name=plan['name'],
        plan_price=plan['price'],
        return_url=return_url,
        cancel_url=cancel_url
    )

    if not agreement_result:
        return jsonify({
            'error': 'Failed to create PayPal billing agreement',
            'message': 'Please try again or contact support'
        }), 500

    # Create pending subscription record
    subscription = Subscription(
        user_id=current_user_id,
        selected_plan=selected_plan,
        status='pending'  # Will become 'trial' after PayPal approval
    )
    db.session.add(subscription)
    db.session.commit()

    return jsonify({
        'message': 'Redirect to PayPal for authorization',
        'approval_url': agreement_result['approval_url'],
        'subscription_id': subscription.id,
        'selected_plan': selected_plan,
        'plan_price': plan['price']
    }), 201


@subscriptions_bp.route('/trial/confirm', methods=['POST'])
@jwt_required()
def confirm_trial_agreement():
    """
    Confirm billing agreement after PayPal approval.
    Called when user returns from PayPal.

    This endpoint:
    1. Executes the billing agreement
    2. Activates the 7-day trial
    3. Creates trial challenge with $5,000 balance
    4. Sends confirmation email

    Request body:
    {
        "token": "EC-xxx"  # PayPal approval token from return URL
    }

    Returns:
    {
        "message": "Trial activated successfully",
        "subscription": {...},
        "challenge": {...}
    }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    token = data.get('token')
    if not token:
        return jsonify({'error': 'PayPal token required'}), 400

    # Find pending subscription for this user
    subscription = Subscription.query.filter_by(
        user_id=current_user_id,
        status='pending'
    ).first()

    if not subscription:
        return jsonify({
            'error': 'No pending subscription found',
            'message': 'Please start the trial process again'
        }), 404

    # Execute the billing agreement
    agreement_result = execute_billing_agreement(token)

    if not agreement_result:
        return jsonify({
            'error': 'Failed to execute PayPal billing agreement',
            'message': 'PayPal authorization may have expired. Please try again.'
        }), 400

    # Get plan details
    plans = current_app.config['PLANS']
    plan = plans[subscription.selected_plan]

    # Update subscription with agreement details
    subscription.paypal_agreement_id = agreement_result['agreement_id']
    subscription.paypal_payer_id = agreement_result.get('payer_id')
    subscription.paypal_payer_email = agreement_result.get('payer_email')
    subscription.activate_trial(trial_days=7)

    # Create trial challenge
    challenge = UserChallenge(
        user_id=current_user_id,
        plan_type='trial',
        initial_balance=Decimal('5000'),
        current_balance=Decimal('5000'),
        highest_balance=Decimal('5000'),
        status='active',
        is_trial=True,
        trial_expires_at=subscription.trial_expires_at,
        subscription_id=subscription.id
    )
    db.session.add(challenge)

    # Create $0 payment record for trial
    payment = Payment(
        user_id=current_user_id,
        subscription_id=subscription.id,
        amount=Decimal('0'),
        currency='USD',
        payment_method='paypal',
        plan_type='trial',
        status='completed',
        transaction_id=f'trial_{subscription.id}',
        is_trial_conversion=False,
        paypal_agreement_id=agreement_result['agreement_id']
    )
    payment.complete_payment(f'trial_{subscription.id}')
    db.session.add(payment)

    db.session.commit()

    # Link challenge to payment
    payment.challenge_id = challenge.id
    db.session.commit()

    # Send confirmation email
    user = User.query.get(current_user_id)
    if user:
        send_trial_started_email(
            to_email=user.email,
            username=user.username,
            selected_plan=plan['name'],
            plan_price=plan['price'],
            trial_end_date=subscription.trial_expires_at
        )

    return jsonify({
        'message': 'Trial activated successfully!',
        'subscription': subscription.to_dict(),
        'challenge': challenge.to_dict(),
        'trial_days': 7,
        'trial_expires_at': subscription.trial_expires_at.isoformat(),
        'selected_plan': subscription.selected_plan,
        'plan_price': plan['price'],
        'payer_email': agreement_result.get('payer_email')
    }), 200


@subscriptions_bp.route('/trial/cancel', methods=['POST'])
@jwt_required()
def cancel_trial():
    """
    Cancel trial before it ends.
    Cancels PayPal billing agreement and marks trial as cancelled.

    Returns:
    {
        "message": "Trial cancelled successfully",
        "subscription": {...}
    }
    """
    current_user_id = int(get_jwt_identity())

    # Find active trial subscription
    subscription = Subscription.query.filter_by(
        user_id=current_user_id,
        status='trial'
    ).first()

    if not subscription:
        return jsonify({
            'error': 'No active trial found',
            'message': 'You do not have an active trial to cancel'
        }), 404

    # Cancel PayPal billing agreement
    if subscription.paypal_agreement_id:
        cancel_success = cancel_billing_agreement(
            agreement_id=subscription.paypal_agreement_id,
            reason="User cancelled trial before completion"
        )
        if not cancel_success:
            print(f"Warning: Failed to cancel PayPal agreement {subscription.paypal_agreement_id}")
            # Continue anyway - we'll mark as cancelled locally

    # Update subscription status
    subscription.mark_cancelled()

    # Optionally expire the trial challenge (user can still see their stats)
    trial_challenge = UserChallenge.query.filter_by(
        subscription_id=subscription.id,
        is_trial=True,
        status='active'
    ).first()

    if trial_challenge:
        trial_challenge.status = 'expired'
        trial_challenge.end_date = datetime.utcnow()
        trial_challenge.failure_reason = 'Trial cancelled by user'

    db.session.commit()

    return jsonify({
        'message': 'Trial cancelled successfully. You will not be charged.',
        'subscription': subscription.to_dict()
    }), 200


@subscriptions_bp.route('/trial/status', methods=['GET'])
@jwt_required()
def get_trial_status():
    """
    Get current trial/subscription status.

    Returns:
    {
        "has_subscription": true/false,
        "subscription": {...} or null,
        "active_challenge": {...} or null,
        "can_start_trial": true/false
    }
    """
    current_user_id = int(get_jwt_identity())

    # Get subscription
    subscription = Subscription.query.filter_by(user_id=current_user_id).first()

    # Get active challenge
    active_challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    # Check if user can start a trial
    can_start_trial = True
    trial_blocked_reason = None

    if subscription and subscription.status in ['trial', 'active', 'pending']:
        can_start_trial = False
        trial_blocked_reason = 'You already have an active subscription'
    elif active_challenge:
        can_start_trial = False
        trial_blocked_reason = 'You already have an active challenge'
    else:
        # Check for previous trial usage
        previous_trial = UserChallenge.query.filter_by(
            user_id=current_user_id,
            is_trial=True
        ).first()
        if previous_trial:
            can_start_trial = False
            trial_blocked_reason = 'You have already used your free trial'

    # Get plan details if subscription exists
    plan_details = None
    if subscription:
        plans = current_app.config['PLANS']
        if subscription.selected_plan in plans:
            plan_details = {
                'name': plans[subscription.selected_plan]['name'],
                'price': plans[subscription.selected_plan]['price'],
                'initial_balance': plans[subscription.selected_plan]['initial_balance']
            }

    return jsonify({
        'has_subscription': subscription is not None,
        'subscription': subscription.to_dict() if subscription else None,
        'active_challenge': active_challenge.to_dict() if active_challenge else None,
        'can_start_trial': can_start_trial,
        'trial_blocked_reason': trial_blocked_reason,
        'selected_plan_details': plan_details
    }), 200


@subscriptions_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """
    Get available plans for trial signup.
    Returns only paid plans (not trial plan itself).

    Returns:
    {
        "plans": [
            {"key": "starter", "name": "Starter", "price": 200, ...},
            {"key": "pro", "name": "Pro", "price": 500, ...},
            {"key": "elite", "name": "Elite", "price": 1000, ...}
        ]
    }
    """
    plans = current_app.config['PLANS']

    available_plans = []
    for key, plan in plans.items():
        if key != 'trial':  # Exclude trial from selectable plans
            available_plans.append({
                'key': key,
                'name': plan['name'],
                'price': plan['price'],
                'initial_balance': plan['initial_balance'],
                'description': plan.get('description', '')
            })

    # Sort by price
    available_plans.sort(key=lambda x: x['price'])

    return jsonify({'plans': available_plans}), 200
