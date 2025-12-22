from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
import time
from . import payments_bp
from models import db, Payment, UserChallenge, User, Settings
from services.payment_gateway import process_paypal_payment, create_paypal_order


@payments_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get available pricing plans"""
    plans = current_app.config['PLANS']
    return jsonify({'plans': plans}), 200


@payments_bp.route('/checkout', methods=['POST'])
@jwt_required()
def create_checkout():
    """Create a checkout session"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    plan_type = data.get('plan_type')
    payment_method = data.get('payment_method', 'free')  # Default to 'free' for trial

    # Validate plan
    plans = current_app.config['PLANS']
    if plan_type not in plans:
        return jsonify({'error': 'Invalid plan type'}), 400

    plan = plans[plan_type]

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

    # Special handling for trial plan
    if plan_type == 'trial' or plan.get('is_trial'):
        # Check if user already used their free trial
        previous_trial = UserChallenge.query.filter_by(
            user_id=current_user_id,
            is_trial=True
        ).first()

        if previous_trial:
            return jsonify({
                'error': 'Trial already used',
                'message': 'You have already used your free trial. Please purchase a challenge to continue trading.'
            }), 400

        # For trial, process immediately (no payment needed)
        payment = Payment(
            user_id=current_user_id,
            amount=Decimal('0'),
            currency='USD',
            payment_method='free',
            plan_type=plan_type,
            status='completed',
            transaction_id=f'trial_{uuid.uuid4().hex[:8]}'
        )
        db.session.add(payment)

        # Create trial challenge
        trial_days = plan.get('trial_days', 7)
        challenge = UserChallenge(
            user_id=current_user_id,
            plan_type=plan_type,
            initial_balance=Decimal(str(plan['initial_balance'])),
            current_balance=Decimal(str(plan['initial_balance'])),
            highest_balance=Decimal(str(plan['initial_balance'])),
            status='active',
            is_trial=True,
            trial_expires_at=datetime.utcnow() + timedelta(days=trial_days)
        )
        db.session.add(challenge)
        payment.challenge_id = challenge.id
        db.session.commit()

        return jsonify({
            'message': 'Free trial activated successfully!',
            'payment': payment.to_dict(),
            'challenge': challenge.to_dict(),
            'is_trial': True,
            'trial_days': trial_days
        }), 201

    # Regular paid plans - require payment method
    if not payment_method or payment_method == 'free':
        return jsonify({'error': 'payment_method required for paid plans'}), 400

    # Create payment record
    payment = Payment(
        user_id=current_user_id,
        amount=Decimal(str(plan['price'])),
        currency='USD',
        payment_method=payment_method,
        plan_type=plan_type,
        status='pending'
    )

    db.session.add(payment)
    db.session.commit()

    response_data = {
        'payment_id': payment.id,
        'amount': plan['price'],
        'currency': 'USD',
        'plan': plan
    }

    # Handle different payment methods
    if payment_method == 'paypal':
        # Create PayPal order
        paypal_client_id = Settings.get_setting('paypal_client_id', current_app.config['PAYPAL_CLIENT_ID'])
        paypal_secret = Settings.get_setting('paypal_client_secret', current_app.config['PAYPAL_CLIENT_SECRET'])

        if paypal_client_id and paypal_secret:
            paypal_order = create_paypal_order(plan['price'], payment.id)
            if paypal_order:
                response_data['paypal_order_id'] = paypal_order['id']
                response_data['paypal_approval_url'] = next(
                    (link['href'] for link in paypal_order['links'] if link['rel'] == 'approve'),
                    None
                )

    return jsonify(response_data), 201


@payments_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    """Process and complete payment"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    payment_id = data.get('payment_id')
    if not payment_id:
        return jsonify({'error': 'payment_id required'}), 400

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    if payment.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if payment.status == 'completed':
        return jsonify({'error': 'Payment already processed'}), 400

    payment_method = payment.payment_method
    plans = current_app.config['PLANS']
    plan = plans[payment.plan_type]

    # Process based on payment method
    if payment_method == 'paypal':
        paypal_order_id = data.get('paypal_order_id')
        if paypal_order_id:
            success = process_paypal_payment(paypal_order_id)
            if not success:
                payment.fail_payment('PayPal payment failed')
                db.session.commit()
                return jsonify({'error': 'PayPal payment failed'}), 400
            payment.complete_payment(f'paypal_{paypal_order_id}')
        else:
            # Mock PayPal for testing
            time.sleep(1)  # Simulate processing
            payment.complete_payment(f'paypal_mock_{uuid.uuid4().hex[:8]}')

    elif payment_method == 'cmi':
        # Mock CMI (Moroccan card payment)
        time.sleep(1.5)  # Simulate processing
        payment.complete_payment(f'cmi_{uuid.uuid4().hex[:8]}')

    elif payment_method == 'crypto':
        # Mock crypto payment
        time.sleep(2)  # Simulate blockchain confirmation
        payment.complete_payment(f'crypto_{uuid.uuid4().hex[:16]}')

    else:
        return jsonify({'error': 'Invalid payment method'}), 400

    # Create challenge for user
    challenge = UserChallenge(
        user_id=current_user_id,
        plan_type=payment.plan_type,
        initial_balance=Decimal(str(plan['initial_balance'])),
        current_balance=Decimal(str(plan['initial_balance'])),
        highest_balance=Decimal(str(plan['initial_balance'])),
        status='active'
    )

    db.session.add(challenge)
    payment.challenge_id = challenge.id
    db.session.commit()

    return jsonify({
        'message': 'Payment successful! Your challenge has been activated.',
        'payment': payment.to_dict(),
        'challenge': challenge.to_dict()
    }), 200


@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    """Get payment history for current user"""
    current_user_id = int(get_jwt_identity())

    payments = Payment.query.filter_by(user_id=current_user_id).order_by(
        Payment.created_at.desc()
    ).all()

    return jsonify({
        'payments': [p.to_dict() for p in payments]
    }), 200


@payments_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get specific payment details"""
    current_user_id = int(get_jwt_identity())
    payment = Payment.query.get(payment_id)

    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    user = User.query.get(current_user_id)
    if payment.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'payment': payment.to_dict()}), 200
