"""
Payout routes for funded trader withdrawals
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal
from models import db, User, UserChallenge, Payout
from flask import current_app

payouts_bp = Blueprint('payouts', __name__, url_prefix='/api/payouts')


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
    user_id = get_jwt_identity()

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

    return jsonify({
        'total_profit': float(funded_challenge.total_profit_earned or 0),
        'withdrawable_profit': float(funded_challenge.withdrawable_profit or 0),
        'pending_payouts': float(pending_payouts or 0),
        'available_balance': max(0, available),
        'platform_fee_percentage': 20,
        'trader_percentage': 80
    }), 200


@payouts_bp.route('/request', methods=['POST'])
@jwt_required()
def request_payout():
    """Request a withdrawal from funded account"""
    user_id = get_jwt_identity()
    data = request.get_json()

    amount = data.get('amount')
    payment_method = data.get('payment_method', 'paypal')
    paypal_email = data.get('paypal_email')

    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

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

    return jsonify({
        'message': 'Payout rejected',
        'payout': payout.to_dict()
    }), 200
