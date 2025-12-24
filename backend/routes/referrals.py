from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
import string
import random
from models import db, User, Referral, Payment

referrals_bp = Blueprint('referrals', __name__, url_prefix='/api/referrals')


def generate_referral_code(username):
    """Generate a unique referral code based on username"""
    # Use first 4 chars of username + 4 random alphanumeric
    prefix = ''.join(c for c in username[:4].upper() if c.isalnum())
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{suffix}"


@referrals_bp.route('/generate-code', methods=['POST'])
@jwt_required()
def generate_code():
    """Generate a referral code for the current user"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if user already has a referral code
    if user.referral_code:
        return jsonify({
            'message': 'Referral code already exists',
            'referral_code': user.referral_code
        }), 200

    # Generate unique code
    max_attempts = 10
    for _ in range(max_attempts):
        code = generate_referral_code(user.username)
        existing = User.query.filter_by(referral_code=code).first()
        if not existing:
            user.referral_code = code
            db.session.commit()
            return jsonify({
                'message': 'Referral code generated successfully',
                'referral_code': code
            }), 201

    return jsonify({'error': 'Failed to generate unique code'}), 500


@referrals_bp.route('/my-code', methods=['GET'])
@jwt_required()
def get_my_code():
    """Get current user's referral code"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Auto-generate if not exists
    if not user.referral_code:
        code = generate_referral_code(user.username)
        user.referral_code = code
        db.session.commit()

    return jsonify({
        'referral_code': user.referral_code,
        'referral_link': f'https://tradesense.com/register?ref={user.referral_code}'
    }), 200


@referrals_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get referral statistics for current user"""
    current_user_id = int(get_jwt_identity())

    # Get all referrals made by this user
    referrals = Referral.query.filter_by(referrer_id=current_user_id).all()

    total_referrals = len(referrals)
    pending_referrals = len([r for r in referrals if r.status == 'pending'])
    converted_referrals = len([r for r in referrals if r.status in ['converted', 'paid']])
    paid_referrals = len([r for r in referrals if r.status == 'paid'])

    total_earned = sum(float(r.commission_amount) for r in referrals if r.status == 'paid')
    pending_earnings = sum(float(r.commission_amount) for r in referrals if r.status == 'converted')

    return jsonify({
        'total_referrals': total_referrals,
        'pending_referrals': pending_referrals,
        'converted_referrals': converted_referrals,
        'paid_referrals': paid_referrals,
        'total_earned': total_earned,
        'pending_earnings': pending_earnings,
        'commission_rate': 10.0  # Default 10%
    }), 200


@referrals_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get referral history for current user"""
    current_user_id = int(get_jwt_identity())

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Get referrals with pagination
    referrals_query = Referral.query.filter_by(referrer_id=current_user_id)\
        .order_by(Referral.created_at.desc())

    paginated = referrals_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'referrals': [r.to_dict() for r in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@referrals_bp.route('/apply', methods=['POST'])
def apply_referral():
    """Apply a referral code during registration (called without auth)"""
    data = request.get_json()
    referral_code = data.get('referral_code')
    new_user_id = data.get('user_id')

    if not referral_code or not new_user_id:
        return jsonify({'error': 'referral_code and user_id required'}), 400

    # Find the referrer by code
    referrer = User.query.filter_by(referral_code=referral_code).first()
    if not referrer:
        return jsonify({'error': 'Invalid referral code'}), 404

    # Get the new user
    new_user = User.query.get(new_user_id)
    if not new_user:
        return jsonify({'error': 'User not found'}), 404

    # Don't allow self-referral
    if referrer.id == new_user_id:
        return jsonify({'error': 'Cannot use your own referral code'}), 400

    # Check if already referred
    if new_user.referred_by_code:
        return jsonify({'error': 'User already has a referral code applied'}), 400

    # Apply the referral
    new_user.referred_by_code = referral_code

    # Create referral record
    referral = Referral(
        referrer_id=referrer.id,
        referred_id=new_user.id,
        referral_code=referral_code,
        status='converted',
        converted_at=datetime.utcnow()
    )
    db.session.add(referral)
    db.session.commit()

    return jsonify({
        'message': 'Referral code applied successfully',
        'referral': referral.to_dict()
    }), 200


@referrals_bp.route('/validate/<code>', methods=['GET'])
def validate_code(code):
    """Validate if a referral code exists"""
    referrer = User.query.filter_by(referral_code=code).first()

    if not referrer:
        return jsonify({
            'valid': False,
            'message': 'Invalid referral code'
        }), 404

    return jsonify({
        'valid': True,
        'referrer_name': referrer.username[:2] + '***'  # Partial name for privacy
    }), 200


@referrals_bp.route('/process-commission', methods=['POST'])
@jwt_required()
def process_commission():
    """Process commission when a referred user makes a payment (internal use)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    payment_id = data.get('payment_id')
    if not payment_id:
        return jsonify({'error': 'payment_id required'}), 400

    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    # Get the user who made the payment
    payer = User.query.get(payment.user_id)
    if not payer or not payer.referred_by_code:
        return jsonify({'message': 'No referral to process'}), 200

    # Find the referrer
    referrer = User.query.filter_by(referral_code=payer.referred_by_code).first()
    if not referrer:
        return jsonify({'message': 'Referrer not found'}), 200

    # Check if commission already processed for this referral
    existing_referral = Referral.query.filter_by(
        referred_id=payer.id,
        payment_id=payment_id
    ).first()

    if existing_referral:
        return jsonify({'message': 'Commission already processed'}), 200

    # Create or update referral with commission
    referral = Referral.query.filter_by(
        referrer_id=referrer.id,
        referred_id=payer.id
    ).first()

    if referral:
        referral.convert(payer.id, float(payment.amount))
        referral.payment_id = payment_id
    else:
        referral = Referral(
            referrer_id=referrer.id,
            referred_id=payer.id,
            referral_code=payer.referred_by_code,
            status='converted',
            payment_id=payment_id,
            converted_at=datetime.utcnow()
        )
        referral.convert(payer.id, float(payment.amount))
        db.session.add(referral)

    db.session.commit()

    return jsonify({
        'message': 'Commission processed',
        'referral': referral.to_dict()
    }), 200
