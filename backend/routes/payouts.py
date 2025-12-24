"""
Payout routes for funded trader withdrawals
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from decimal import Decimal
from models import db, User, UserChallenge, Payout, KYCData, KYC_TIER_LIMITS
from flask import current_app

logger = logging.getLogger(__name__)
payouts_bp = Blueprint('payouts', __name__, url_prefix='/api/payouts')


def get_monthly_payout_total(user_id: int) -> float:
    """Get total payouts for current month"""
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    total = db.session.query(
        db.func.coalesce(db.func.sum(Payout.net_payout), 0)
    ).filter(
        Payout.user_id == user_id,
        Payout.status.in_(['pending', 'approved', 'paid']),
        Payout.requested_at >= month_start
    ).scalar()

    return float(total or 0)


def check_kyc_payout_limit(user_id: int, amount: float) -> tuple:
    """
    Check if user can request payout based on KYC tier

    Returns:
        (bool, str | None): (can_request, error_message)
    """
    kyc = KYCData.query.filter_by(user_id=user_id).first()

    if not kyc:
        # No KYC record - treat as tier 0
        return False, 'KYC verification required before requesting payouts. Please complete identity verification.'

    # Get tier limit
    tier_limit = KYC_TIER_LIMITS.get(kyc.current_tier, 0)

    if tier_limit == 0:
        return False, 'KYC verification required before requesting payouts. Please complete identity verification.'

    if tier_limit == float('inf'):
        return True, None  # Unlimited

    # Check monthly total
    monthly_total = get_monthly_payout_total(user_id)
    remaining = tier_limit - monthly_total

    if amount > remaining:
        return False, f'Payout exceeds monthly limit. Your KYC Tier {kyc.current_tier} allows ${tier_limit:,.0f}/month. Remaining this month: ${remaining:,.2f}. Upgrade your KYC tier for higher limits.'

    return True, None


def send_payout_email(user_id: int, payout_data: dict):
    """Send payout status email to user (async or sync fallback)"""
    try:
        from tasks.email_tasks import send_payout_status_email
        send_payout_status_email.delay(user_id, payout_data)
        logger.info(f"Payout email queued for user {user_id}")
    except Exception as e:
        logger.warning(f"Celery not available, trying sync email: {e}")
        try:
            user = User.query.get(user_id)
            if user:
                from services.email_service import EmailService
                EmailService.send_payout_status_email(user.email, payout_data)
        except Exception as email_error:
            logger.error(f"Failed to send payout email: {email_error}")


@payouts_bp.route('', methods=['GET'])
@jwt_required()
def get_payouts():
    """Get user's payout history"""
    user_id = get_jwt_identity()

    payouts = Payout.query.filter_by(user_id=user_id).order_by(
        Payout.requested_at.desc()
    ).all()

    return jsonify({
        'payouts': [p.to_dict() for p in payouts]
    }), 200


@payouts_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    """Get available balance for withdrawal"""
    user_id = int(get_jwt_identity())

    # Get funded challenge
    funded_challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        is_funded=True,
        status='funded'
    ).first()

    if not funded_challenge:
        return jsonify({
            'error': 'No funded account found',
            'available_balance': 0,
            'pending_payouts': 0
        }), 404

    # Calculate pending payout amount
    pending_payouts = db.session.query(
        db.func.coalesce(db.func.sum(Payout.net_payout), 0)
    ).filter(
        Payout.user_id == user_id,
        Payout.status.in_(['pending', 'approved'])
    ).scalar()

    available = float(funded_challenge.withdrawable_profit or 0) - float(pending_payouts or 0)

    # Get KYC info
    kyc = KYCData.query.filter_by(user_id=user_id).first()
    kyc_tier = kyc.current_tier if kyc else 0
    kyc_limit = KYC_TIER_LIMITS.get(kyc_tier, 0)
    monthly_used = get_monthly_payout_total(user_id)

    return jsonify({
        'total_profit': float(funded_challenge.total_profit_earned or 0),
        'withdrawable_profit': float(funded_challenge.withdrawable_profit or 0),
        'pending_payouts': float(pending_payouts or 0),
        'available_balance': max(0, available),
        'platform_fee_percentage': 20,
        'trader_percentage': 80,
        'kyc': {
            'tier': kyc_tier,
            'status': kyc.status if kyc else 'not_started',
            'monthly_limit': None if kyc_limit == float('inf') else kyc_limit,
            'monthly_used': monthly_used,
            'monthly_remaining': None if kyc_limit == float('inf') else max(0, kyc_limit - monthly_used)
        }
    }), 200


@payouts_bp.route('/request', methods=['POST'])
@jwt_required()
def request_payout():
    """Request a withdrawal from funded account"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    amount = data.get('amount')
    payment_method = data.get('payment_method', 'paypal')
    paypal_email = data.get('paypal_email')

    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    # Check KYC tier limits
    can_payout, kyc_error = check_kyc_payout_limit(user_id, float(amount))
    if not can_payout:
        # Get KYC info for response
        kyc = KYCData.query.filter_by(user_id=user_id).first()
        return jsonify({
            'error': kyc_error,
            'kyc_required': True,
            'current_tier': kyc.current_tier if kyc else 0,
            'monthly_limit': KYC_TIER_LIMITS.get(kyc.current_tier, 0) if kyc else 0,
            'monthly_used': get_monthly_payout_total(user_id)
        }), 400

    # Get funded challenge
    funded_challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        is_funded=True,
        status='funded'
    ).first()

    if not funded_challenge:
        return jsonify({'error': 'No funded account found'}), 404

    # Calculate available balance
    pending_payouts = db.session.query(
        db.func.coalesce(db.func.sum(Payout.net_payout), 0)
    ).filter(
        Payout.user_id == user_id,
        Payout.status.in_(['pending', 'approved'])
    ).scalar()

    available = float(funded_challenge.withdrawable_profit or 0) - float(pending_payouts or 0)

    if float(amount) > available:
        return jsonify({
            'error': 'Insufficient balance',
            'available': available,
            'requested': float(amount)
        }), 400

    # Calculate split (amount is the gross profit to withdraw)
    gross_profit = Decimal(str(amount))
    split = Payout.calculate_split(gross_profit)

    # Create payout request
    payout = Payout(
        user_id=user_id,
        challenge_id=funded_challenge.id,
        gross_profit=gross_profit,
        platform_fee=Decimal(str(split['platform_fee'])),
        net_payout=Decimal(str(split['net_payout'])),
        status='pending',
        payment_method=payment_method,
        paypal_email=paypal_email
    )

    db.session.add(payout)
    db.session.commit()

    # Send confirmation email
    send_payout_email(user_id, {
        'status': 'pending',
        'amount': float(payout.net_payout),
        'method': payment_method
    })

    return jsonify({
        'message': 'Payout request submitted successfully',
        'payout': payout.to_dict()
    }), 201


# Admin routes for payout management
@payouts_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def admin_get_pending():
    """Get all pending payouts (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    payouts = Payout.query.filter_by(status='pending').order_by(
        Payout.requested_at.asc()
    ).paginate(page=page, per_page=per_page)

    return jsonify({
        'payouts': [p.to_dict() for p in payouts.items],
        'total': payouts.total,
        'pages': payouts.pages,
        'current_page': page
    }), 200


@payouts_bp.route('/admin/<int:payout_id>/approve', methods=['PUT'])
@jwt_required()
def admin_approve_payout(payout_id):
    """Approve a payout request (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    payout = Payout.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404

    if payout.status != 'pending':
        return jsonify({'error': f'Payout already {payout.status}'}), 400

    payout.status = 'approved'
    payout.approved_at = datetime.utcnow()
    payout.processed_by = user_id
    db.session.commit()

    # Send email notification
    send_payout_email(payout.user_id, {
        'status': 'approved',
        'amount': float(payout.net_payout),
        'method': payout.payment_method
    })

    return jsonify({
        'message': 'Payout approved',
        'payout': payout.to_dict()
    }), 200


@payouts_bp.route('/admin/<int:payout_id>/process', methods=['PUT'])
@jwt_required()
def admin_process_payout(payout_id):
    """Mark payout as paid (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    transaction_id = data.get('transaction_id')

    payout = Payout.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404

    if payout.status not in ['pending', 'approved']:
        return jsonify({'error': f'Payout already {payout.status}'}), 400

    # Update payout status
    payout.status = 'paid'
    payout.processed_at = datetime.utcnow()
    payout.transaction_id = transaction_id
    payout.processed_by = user_id

    # Update challenge withdrawable profit
    challenge = UserChallenge.query.get(payout.challenge_id)
    if challenge:
        challenge.withdrawable_profit = max(
            0,
            (challenge.withdrawable_profit or 0) - payout.net_payout
        )

    db.session.commit()

    # Send email notification
    send_payout_email(payout.user_id, {
        'status': 'completed',
        'amount': float(payout.net_payout),
        'method': payout.payment_method,
        'transaction_id': transaction_id
    })

    return jsonify({
        'message': 'Payout processed successfully',
        'payout': payout.to_dict()
    }), 200


@payouts_bp.route('/admin/<int:payout_id>/reject', methods=['PUT'])
@jwt_required()
def admin_reject_payout(payout_id):
    """Reject a payout request (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    reason = data.get('reason', 'Request rejected by admin')

    payout = Payout.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404

    if payout.status not in ['pending', 'approved']:
        return jsonify({'error': f'Payout already {payout.status}'}), 400

    payout.status = 'rejected'
    payout.rejection_reason = reason
    payout.processed_at = datetime.utcnow()
    payout.processed_by = user_id
    db.session.commit()

    # Send email notification
    send_payout_email(payout.user_id, {
        'status': 'rejected',
        'amount': float(payout.net_payout),
        'method': payout.payment_method,
        'reason': reason
    })

    return jsonify({
        'message': 'Payout rejected',
        'payout': payout.to_dict()
    }), 200
