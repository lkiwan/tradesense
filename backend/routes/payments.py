from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
import time
from . import payments_bp
from models import db, Payment, UserChallenge, User, Settings, ChallengeModel, AccountSize
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


@payments_bp.route('/challenge-checkout', methods=['POST'])
@jwt_required()
def create_challenge_checkout():
    """Create a checkout session for challenge model purchase"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    model_id = data.get('model_id')
    size_id = data.get('size_id')
    payment_method = data.get('payment_method', 'cmi')

    # Validate required fields
    if not model_id or not size_id:
        return jsonify({'error': 'model_id and size_id are required'}), 400

    # Get the challenge model
    model = ChallengeModel.query.get(model_id)
    if not model or not model.is_active:
        return jsonify({'error': 'Challenge model not found or inactive'}), 404

    # Get the account size
    size = AccountSize.query.get(size_id)
    if not size or size.model_id != model.id or not size.is_active:
        return jsonify({'error': 'Account size not found or inactive'}), 404

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

    # Calculate price
    price = size.sale_price if size.is_on_sale else size.price

    # Create payment record (plan_type is limited to 20 chars)
    payment = Payment(
        user_id=current_user_id,
        amount=Decimal(str(price)),
        currency='EUR',
        payment_method=payment_method,
        plan_type=f'ch_{model.id}_{size.id}',
        status='pending'
    )
    db.session.add(payment)
    db.session.commit()

    response_data = {
        'payment_id': payment.id,
        'amount': float(price),
        'currency': 'EUR',
        'model': {
            'id': model.id,
            'name': model.display_name,
            'phases': model.phases
        },
        'size': {
            'id': size.id,
            'balance': size.balance,
            'price': float(price)
        }
    }

    # Handle different payment methods
    if payment_method == 'paypal':
        paypal_client_id = Settings.get_setting('paypal_client_id', current_app.config.get('PAYPAL_CLIENT_ID', ''))
        paypal_secret = Settings.get_setting('paypal_client_secret', current_app.config.get('PAYPAL_CLIENT_SECRET', ''))

        if paypal_client_id and paypal_secret:
            paypal_order = create_paypal_order(float(price), payment.id, 'EUR')
            if paypal_order:
                response_data['paypal_order_id'] = paypal_order['id']
                # Get approval URL from PayPal response
                approval_url = paypal_order.get('approval_url') or next(
                    (link['href'] for link in paypal_order.get('links', []) if link['rel'] == 'approval_url'),
                    None
                )
                response_data['paypal_approval_url'] = approval_url
                response_data['payment_url'] = approval_url
        else:
            return jsonify({'error': 'PayPal is not configured. Please use another payment method.'}), 400

    elif payment_method == 'crypto':
        # For crypto, generate a mock payment URL (integrate with real crypto gateway)
        response_data['payment_url'] = f"/crypto-payment/{payment.id}"

    elif payment_method == 'cmi':
        # For CMI (card), process immediately in test mode
        # In production, integrate with CMI gateway
        time.sleep(0.5)  # Simulate processing
        payment.complete_payment(f'cmi_{uuid.uuid4().hex[:8]}')

        # Create challenge for user
        challenge = UserChallenge(
            user_id=current_user_id,
            model_id=model.id,
            account_size_id=size.id,
            plan_type=f'challenge_{model.name}',
            initial_balance=Decimal(str(size.balance)),
            current_balance=Decimal(str(size.balance)),
            highest_balance=Decimal(str(size.balance)),
            status='active',
            profit_target=model.phase1_profit_target / 100 if model.phase1_profit_target else 0.10
        )
        db.session.add(challenge)
        payment.challenge_id = challenge.id
        db.session.commit()

        response_data['success'] = True
        response_data['challenge'] = challenge.to_dict()
        return jsonify(response_data), 201

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


@payments_bp.route('/paypal/success', methods=['GET'])
def paypal_success():
    """Handle PayPal payment success callback"""
    payment_id = request.args.get('payment_id')
    payer_id = request.args.get('PayerID')
    paypal_payment_id = request.args.get('paymentId')

    if not payment_id:
        return jsonify({'error': 'Missing payment_id'}), 400

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    if payment.status == 'completed':
        # Already processed, redirect to success
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return f'''
        <html><head><script>window.location.href="{frontend_url}/accounts?payment=success";</script></head>
        <body>Payment successful! Redirecting...</body></html>
        '''

    try:
        # Execute the PayPal payment
        success = process_paypal_payment(paypal_payment_id, payer_id)

        if success:
            payment.complete_payment(f'paypal_{paypal_payment_id}')

            # Check if this is a challenge checkout (plan_type starts with 'ch_')
            if payment.plan_type and payment.plan_type.startswith('ch_'):
                # Parse model info from plan_type (format: ch_modelId_sizeId)
                parts = payment.plan_type.split('_')
                if len(parts) >= 3:
                    model_id = int(parts[1])
                    size_id = int(parts[2])

                    # Find the model and size
                    model = ChallengeModel.query.get(model_id)
                    size = AccountSize.query.get(size_id)
                    balance = size.balance if size else 5000

                    # Create challenge
                    challenge = UserChallenge(
                        user_id=payment.user_id,
                        model_id=model.id if model else None,
                        account_size_id=size.id if size else None,
                        plan_type=payment.plan_type,
                        initial_balance=Decimal(str(balance)),
                        current_balance=Decimal(str(balance)),
                        highest_balance=Decimal(str(balance)),
                        status='active',
                        profit_target=model.phase1_profit_target / 100 if model else 0.10
                    )
                    db.session.add(challenge)
                    payment.challenge_id = challenge.id
            else:
                # Legacy plan checkout
                plans = current_app.config['PLANS']
                plan = plans.get(payment.plan_type, {})
                initial_balance = plan.get('initial_balance', 5000)

                challenge = UserChallenge(
                    user_id=payment.user_id,
                    plan_type=payment.plan_type,
                    initial_balance=Decimal(str(initial_balance)),
                    current_balance=Decimal(str(initial_balance)),
                    highest_balance=Decimal(str(initial_balance)),
                    status='active'
                )
                db.session.add(challenge)
                payment.challenge_id = challenge.id

            db.session.commit()

            # Redirect to frontend with success
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            return f'''
            <html><head><script>window.location.href="{frontend_url}/accounts?payment=success";</script></head>
            <body>Payment successful! Redirecting...</body></html>
            '''
        else:
            payment.status = 'failed'
            db.session.commit()
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            return f'''
            <html><head><script>window.location.href="{frontend_url}/plans?payment=failed";</script></head>
            <body>Payment failed. Redirecting...</body></html>
            '''

    except Exception as e:
        print(f"PayPal success callback error: {e}")
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return f'''
        <html><head><script>window.location.href="{frontend_url}/plans?payment=error";</script></head>
        <body>An error occurred. Redirecting...</body></html>
        '''


@payments_bp.route('/paypal/cancel', methods=['GET'])
def paypal_cancel():
    """Handle PayPal payment cancellation"""
    payment_id = request.args.get('payment_id')

    if payment_id:
        payment = Payment.query.get(payment_id)
        if payment and payment.status == 'pending':
            payment.status = 'cancelled'
            db.session.commit()

    # Redirect back to plans page
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    return f'''
    <html><head><script>window.location.href="{frontend_url}/plans?payment=cancelled";</script></head>
    <body>Payment cancelled. Redirecting...</body></html>
    '''


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
