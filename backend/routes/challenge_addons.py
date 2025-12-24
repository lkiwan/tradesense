"""
Challenge Add-ons Routes
Reset, Extend, and Upgrade endpoints for challenges
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from decimal import Decimal

from models import (
    db, User, UserChallenge, ChallengeModel, ChallengeAddon,
    AddonType, AddonStatus, Payment,
    calculate_reset_price, calculate_extend_price, calculate_upgrade_price
)
from models.challenge_model import AccountSize
from services.audit_service import log_audit

challenge_addons_bp = Blueprint('challenge_addons', __name__, url_prefix='/api/challenges')


# ==================== PRICING ENDPOINTS ====================

@challenge_addons_bp.route('/<int:challenge_id>/reset/price', methods=['GET'])
@jwt_required()
def get_reset_price(challenge_id):
    """Get reset price for a challenge"""
    user_id = get_jwt_identity()

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status not in ['failed', 'active']:
        return jsonify({'error': 'Only active or failed challenges can be reset'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts cannot be reset'}), 400

    pricing = calculate_reset_price(challenge)
    if 'error' in pricing:
        return jsonify({'error': pricing['error']}), 400

    return jsonify({
        'challenge_id': challenge_id,
        'addon_type': 'reset',
        'pricing': pricing,
        'current_balance': float(challenge.current_balance),
        'initial_balance': float(challenge.initial_balance),
        'phase': challenge.phase,
        'status': challenge.status
    }), 200


@challenge_addons_bp.route('/<int:challenge_id>/extend/price', methods=['GET'])
@jwt_required()
def get_extend_price(challenge_id):
    """Get extension price for a challenge"""
    user_id = get_jwt_identity()
    days = request.args.get('days', 30, type=int)

    # Validate days
    if days not in [15, 30, 60, 90]:
        return jsonify({'error': 'Extension must be 15, 30, 60, or 90 days'}), 400

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status != 'active':
        return jsonify({'error': 'Only active challenges can be extended'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts do not need extension'}), 400

    pricing = calculate_extend_price(days)

    # Calculate new end date
    current_end = challenge.trial_expires_at or (challenge.start_date + timedelta(days=30))
    new_end = current_end + timedelta(days=days)

    return jsonify({
        'challenge_id': challenge_id,
        'addon_type': 'extend',
        'pricing': pricing,
        'current_end_date': current_end.isoformat() if current_end else None,
        'new_end_date': new_end.isoformat() if new_end else None,
        'extension_options': [
            {'days': 15, 'price': calculate_extend_price(15)['final_price']},
            {'days': 30, 'price': calculate_extend_price(30)['final_price']},
            {'days': 60, 'price': calculate_extend_price(60)['final_price']},
            {'days': 90, 'price': calculate_extend_price(90)['final_price']}
        ]
    }), 200


@challenge_addons_bp.route('/<int:challenge_id>/upgrade/price', methods=['GET'])
@jwt_required()
def get_upgrade_price(challenge_id):
    """Get upgrade options and prices for a challenge"""
    user_id = get_jwt_identity()
    target_size_id = request.args.get('target_size_id', type=int)

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status != 'active':
        return jsonify({'error': 'Only active challenges can be upgraded'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts cannot be upgraded'}), 400

    if not challenge.account_size_id:
        return jsonify({'error': 'Challenge has no account size configured'}), 400

    current_size = AccountSize.query.get(challenge.account_size_id)
    if not current_size:
        return jsonify({'error': 'Current account size not found'}), 404

    # Get available upgrade options (same model, larger sizes)
    upgrade_options = AccountSize.query.filter(
        AccountSize.model_id == current_size.model_id,
        AccountSize.balance > current_size.balance,
        AccountSize.is_active == True
    ).order_by(AccountSize.balance).all()

    options = []
    for size in upgrade_options:
        pricing = calculate_upgrade_price(current_size, size)
        if 'error' not in pricing:
            options.append({
                'account_size_id': size.id,
                'balance': float(size.balance),
                'pricing': pricing
            })

    # If specific target requested, return detailed pricing
    selected_pricing = None
    if target_size_id:
        target_size = AccountSize.query.get(target_size_id)
        if target_size and target_size.model_id == current_size.model_id:
            selected_pricing = calculate_upgrade_price(current_size, target_size)

    return jsonify({
        'challenge_id': challenge_id,
        'addon_type': 'upgrade',
        'current_balance': float(challenge.initial_balance),
        'current_account_size_id': current_size.id,
        'upgrade_options': options,
        'selected_pricing': selected_pricing
    }), 200


# ==================== ACTION ENDPOINTS ====================

@challenge_addons_bp.route('/<int:challenge_id>/reset', methods=['POST'])
@jwt_required()
def reset_challenge(challenge_id):
    """
    Reset a challenge
    - Resets balance to initial
    - Clears all trades
    - Resets phase to evaluation
    - Charges discounted price
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status not in ['failed', 'active']:
        return jsonify({'error': 'Only active or failed challenges can be reset'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts cannot be reset'}), 400

    # Calculate pricing
    pricing = calculate_reset_price(challenge)
    if 'error' in pricing:
        return jsonify({'error': pricing['error']}), 400

    # Create add-on record
    addon = ChallengeAddon(
        challenge_id=challenge_id,
        user_id=user_id,
        addon_type=AddonType.RESET.value,
        status=AddonStatus.PENDING.value,
        amount=pricing['final_price'],
        original_balance=challenge.current_balance,
        reset_balance=challenge.initial_balance,
        discount_percent=pricing['discount_percent'],
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500]
    )
    db.session.add(addon)
    db.session.flush()

    # Create payment record
    payment = Payment(
        user_id=user_id,
        challenge_id=challenge_id,
        amount=Decimal(str(pricing['final_price'])),
        currency='USD',
        payment_type='addon_reset',
        status='pending'
    )
    db.session.add(payment)
    db.session.flush()

    # For demo/development: auto-complete the payment
    # In production, this would redirect to payment gateway
    if data.get('auto_complete', True):
        # Process as completed
        payment.status = 'completed'
        payment.transaction_id = f'RESET-{addon.id}-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'
        payment.paid_at = datetime.utcnow()

        # Execute reset
        original_balance = challenge.current_balance

        # Clear trades
        from models import Trade
        Trade.query.filter_by(challenge_id=challenge_id).delete()

        # Reset challenge
        challenge.current_balance = challenge.initial_balance
        challenge.highest_balance = challenge.initial_balance
        challenge.status = 'active'
        challenge.phase = 'evaluation'
        challenge.current_phase_number = 1
        challenge.trading_days = 0
        challenge.last_trading_day = None
        challenge.failure_reason = None
        challenge.end_date = None
        challenge.profit_target = float(challenge.challenge_model.phase1_profit_target) / 100 if challenge.challenge_model else 0.10

        # Complete addon
        addon.complete()
        addon.transaction_id = payment.transaction_id

        db.session.commit()

        log_audit(
            user_id=user_id,
            action='challenge_reset',
            resource_type='challenge',
            resource_id=challenge_id,
            details={
                'original_balance': float(original_balance),
                'reset_balance': float(challenge.initial_balance),
                'amount_paid': pricing['final_price']
            }
        )

        return jsonify({
            'message': 'Challenge reset successfully',
            'addon': addon.to_dict(),
            'challenge': challenge.to_dict()
        }), 200

    db.session.commit()

    # Return payment URL for production
    return jsonify({
        'message': 'Reset initiated - complete payment to proceed',
        'addon_id': addon.id,
        'payment_id': payment.id,
        'amount': pricing['final_price'],
        'currency': 'USD'
    }), 200


@challenge_addons_bp.route('/<int:challenge_id>/extend', methods=['POST'])
@jwt_required()
def extend_challenge(challenge_id):
    """
    Extend a challenge duration
    - Adds days to challenge
    - $49 per 30 days
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    days = data.get('days', 30)
    if days not in [15, 30, 60, 90]:
        return jsonify({'error': 'Extension must be 15, 30, 60, or 90 days'}), 400

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status != 'active':
        return jsonify({'error': 'Only active challenges can be extended'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts do not need extension'}), 400

    # Calculate pricing
    pricing = calculate_extend_price(days)

    # Calculate dates
    current_end = challenge.trial_expires_at or (challenge.start_date + timedelta(days=30))
    new_end = current_end + timedelta(days=days)

    # Create add-on record
    addon = ChallengeAddon(
        challenge_id=challenge_id,
        user_id=user_id,
        addon_type=AddonType.EXTEND.value,
        status=AddonStatus.PENDING.value,
        amount=pricing['final_price'],
        extension_days=days,
        original_end_date=current_end,
        new_end_date=new_end,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500]
    )
    db.session.add(addon)
    db.session.flush()

    # Create payment record
    payment = Payment(
        user_id=user_id,
        challenge_id=challenge_id,
        amount=Decimal(str(pricing['final_price'])),
        currency='USD',
        payment_type='addon_extend',
        status='pending'
    )
    db.session.add(payment)
    db.session.flush()

    # For demo/development: auto-complete
    if data.get('auto_complete', True):
        payment.status = 'completed'
        payment.transaction_id = f'EXTEND-{addon.id}-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'
        payment.paid_at = datetime.utcnow()

        # Execute extension
        challenge.trial_expires_at = new_end

        # Complete addon
        addon.complete()
        addon.transaction_id = payment.transaction_id

        db.session.commit()

        log_audit(
            user_id=user_id,
            action='challenge_extended',
            resource_type='challenge',
            resource_id=challenge_id,
            details={
                'days_added': days,
                'original_end': current_end.isoformat() if current_end else None,
                'new_end': new_end.isoformat(),
                'amount_paid': pricing['final_price']
            }
        )

        return jsonify({
            'message': f'Challenge extended by {days} days',
            'addon': addon.to_dict(),
            'challenge': challenge.to_dict()
        }), 200

    db.session.commit()

    return jsonify({
        'message': 'Extension initiated - complete payment to proceed',
        'addon_id': addon.id,
        'payment_id': payment.id,
        'amount': pricing['final_price'],
        'currency': 'USD'
    }), 200


@challenge_addons_bp.route('/<int:challenge_id>/upgrade', methods=['POST'])
@jwt_required()
def upgrade_challenge(challenge_id):
    """
    Upgrade challenge to larger account size
    - Keeps current progress percentage
    - Charges price difference + 10%
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    target_size_id = data.get('target_size_id')
    if not target_size_id:
        return jsonify({'error': 'target_size_id is required'}), 400

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.status != 'active':
        return jsonify({'error': 'Only active challenges can be upgraded'}), 400

    if challenge.is_funded:
        return jsonify({'error': 'Funded accounts cannot be upgraded'}), 400

    if not challenge.account_size_id:
        return jsonify({'error': 'Challenge has no account size configured'}), 400

    current_size = AccountSize.query.get(challenge.account_size_id)
    target_size = AccountSize.query.get(target_size_id)

    if not current_size or not target_size:
        return jsonify({'error': 'Invalid account size'}), 404

    if target_size.model_id != current_size.model_id:
        return jsonify({'error': 'Cannot upgrade to different model'}), 400

    if target_size.balance <= current_size.balance:
        return jsonify({'error': 'Target must be larger than current size'}), 400

    # Calculate pricing
    pricing = calculate_upgrade_price(current_size, target_size)
    if 'error' in pricing:
        return jsonify({'error': pricing['error']}), 400

    # Calculate new balance (preserve profit percentage)
    profit_percentage = (float(challenge.current_balance) - float(challenge.initial_balance)) / float(challenge.initial_balance)
    new_initial = float(target_size.balance)
    new_current = new_initial * (1 + profit_percentage)

    # Create add-on record
    addon = ChallengeAddon(
        challenge_id=challenge_id,
        user_id=user_id,
        addon_type=AddonType.UPGRADE.value,
        status=AddonStatus.PENDING.value,
        amount=pricing['final_price'],
        from_model_id=current_size.model_id,
        to_model_id=target_size.model_id,
        from_account_size_id=current_size.id,
        to_account_size_id=target_size.id,
        price_difference=pricing['price_difference'],
        upgrade_fee_percent=pricing['fee_percent'],
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500]
    )
    db.session.add(addon)
    db.session.flush()

    # Create payment record
    payment = Payment(
        user_id=user_id,
        challenge_id=challenge_id,
        amount=Decimal(str(pricing['final_price'])),
        currency='USD',
        payment_type='addon_upgrade',
        status='pending'
    )
    db.session.add(payment)
    db.session.flush()

    # For demo/development: auto-complete
    if data.get('auto_complete', True):
        payment.status = 'completed'
        payment.transaction_id = f'UPGRADE-{addon.id}-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'
        payment.paid_at = datetime.utcnow()

        # Execute upgrade
        old_initial = float(challenge.initial_balance)
        old_current = float(challenge.current_balance)

        challenge.account_size_id = target_size.id
        challenge.initial_balance = Decimal(str(new_initial))
        challenge.current_balance = Decimal(str(new_current))
        challenge.highest_balance = Decimal(str(max(new_current, new_initial)))

        # Complete addon
        addon.complete()
        addon.transaction_id = payment.transaction_id

        db.session.commit()

        log_audit(
            user_id=user_id,
            action='challenge_upgraded',
            resource_type='challenge',
            resource_id=challenge_id,
            details={
                'from_balance': old_initial,
                'to_balance': new_initial,
                'profit_preserved': profit_percentage * 100,
                'amount_paid': pricing['final_price']
            }
        )

        return jsonify({
            'message': f'Challenge upgraded to ${new_initial:,.0f}',
            'addon': addon.to_dict(),
            'challenge': challenge.to_dict()
        }), 200

    db.session.commit()

    return jsonify({
        'message': 'Upgrade initiated - complete payment to proceed',
        'addon_id': addon.id,
        'payment_id': payment.id,
        'amount': pricing['final_price'],
        'currency': 'USD'
    }), 200


# ==================== HISTORY ENDPOINTS ====================

@challenge_addons_bp.route('/<int:challenge_id>/addons', methods=['GET'])
@jwt_required()
def get_challenge_addons(challenge_id):
    """Get add-on history for a challenge"""
    user_id = get_jwt_identity()

    challenge = UserChallenge.query.filter_by(id=challenge_id, user_id=user_id).first()
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    addons = ChallengeAddon.query.filter_by(
        challenge_id=challenge_id
    ).order_by(ChallengeAddon.created_at.desc()).all()

    return jsonify({
        'challenge_id': challenge_id,
        'addons': [addon.to_dict() for addon in addons],
        'total_spent': sum(float(a.amount) for a in addons if a.status == AddonStatus.COMPLETED.value)
    }), 200


@challenge_addons_bp.route('/my-addons', methods=['GET'])
@jwt_required()
def get_my_addons():
    """Get all add-ons for current user"""
    user_id = get_jwt_identity()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    addon_type = request.args.get('type')

    query = ChallengeAddon.query.filter_by(user_id=user_id)

    if addon_type:
        query = query.filter_by(addon_type=addon_type)

    addons = query.order_by(
        ChallengeAddon.created_at.desc()
    ).paginate(page=page, per_page=per_page)

    return jsonify({
        'addons': [addon.to_dict() for addon in addons.items],
        'total': addons.total,
        'pages': addons.pages,
        'current_page': page
    }), 200


# ==================== ADMIN ENDPOINTS ====================

@challenge_addons_bp.route('/admin/addons', methods=['GET'])
@jwt_required()
def admin_list_addons():
    """Admin: List all add-ons"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    addon_type = request.args.get('type')
    status = request.args.get('status')

    query = ChallengeAddon.query

    if addon_type:
        query = query.filter_by(addon_type=addon_type)
    if status:
        query = query.filter_by(status=status)

    addons = query.order_by(
        ChallengeAddon.created_at.desc()
    ).paginate(page=page, per_page=per_page)

    # Calculate stats
    total_revenue = db.session.query(
        db.func.sum(ChallengeAddon.amount)
    ).filter(
        ChallengeAddon.status == AddonStatus.COMPLETED.value
    ).scalar() or 0

    return jsonify({
        'addons': [addon.to_dict() for addon in addons.items],
        'total': addons.total,
        'pages': addons.pages,
        'current_page': page,
        'stats': {
            'total_revenue': float(total_revenue),
            'total_completed': ChallengeAddon.query.filter_by(status=AddonStatus.COMPLETED.value).count(),
            'total_pending': ChallengeAddon.query.filter_by(status=AddonStatus.PENDING.value).count()
        }
    }), 200
