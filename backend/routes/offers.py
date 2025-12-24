from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal
from models import db, User, Offer, OfferUsage

offers_bp = Blueprint('offers', __name__, url_prefix='/api/offers')


@offers_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_offers():
    """Get all currently active and valid offers"""
    current_user_id = int(get_jwt_identity())

    now = datetime.utcnow()
    offers = Offer.query.filter(
        Offer.is_active == True,
        Offer.starts_at <= now,
        db.or_(Offer.expires_at == None, Offer.expires_at > now)
    ).order_by(Offer.is_featured.desc(), Offer.expires_at.asc()).all()

    # Filter to only valid offers and add user-specific info
    valid_offers = []
    for offer in offers:
        if offer.is_valid():
            offer_dict = offer.to_dict()
            # Check if user has used this offer
            user_usage = OfferUsage.query.filter_by(
                offer_id=offer.id,
                user_id=current_user_id
            ).count()
            offer_dict['user_usage_count'] = user_usage
            offer_dict['can_use'] = user_usage < offer.max_uses_per_user
            valid_offers.append(offer_dict)

    return jsonify({
        'offers': valid_offers,
        'total': len(valid_offers)
    }), 200


@offers_bp.route('/featured', methods=['GET'])
@jwt_required()
def get_featured_offers():
    """Get featured promotional offers"""
    now = datetime.utcnow()
    offers = Offer.query.filter(
        Offer.is_active == True,
        Offer.is_featured == True,
        Offer.starts_at <= now,
        db.or_(Offer.expires_at == None, Offer.expires_at > now)
    ).order_by(Offer.expires_at.asc()).limit(5).all()

    return jsonify({
        'offers': [o.to_dict() for o in offers if o.is_valid()]
    }), 200


@offers_bp.route('/validate/<code>', methods=['GET'])
@jwt_required()
def validate_code(code):
    """Validate an offer code"""
    current_user_id = int(get_jwt_identity())
    purchase_amount = request.args.get('amount', 0, type=float)

    offer = Offer.query.filter_by(code=code.upper()).first()
    if not offer:
        return jsonify({
            'valid': False,
            'error': 'Invalid offer code'
        }), 404

    can_use, message = offer.can_use(current_user_id, purchase_amount)

    if not can_use:
        return jsonify({
            'valid': False,
            'error': message
        }), 400

    discount = offer.calculate_discount(purchase_amount) if purchase_amount else 0

    return jsonify({
        'valid': True,
        'offer': offer.to_dict(),
        'discount_amount': float(discount),
        'final_amount': float(Decimal(str(purchase_amount)) - discount) if purchase_amount else None
    }), 200


@offers_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_offer():
    """Apply an offer code to a purchase"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    code = data.get('code')
    purchase_amount = data.get('amount')
    payment_id = data.get('payment_id')

    if not code or not purchase_amount:
        return jsonify({'error': 'code and amount are required'}), 400

    offer = Offer.query.filter_by(code=code.upper()).first()
    if not offer:
        return jsonify({'error': 'Invalid offer code'}), 404

    can_use, message = offer.can_use(current_user_id, purchase_amount)
    if not can_use:
        return jsonify({'error': message}), 400

    discount = offer.calculate_discount(purchase_amount)

    # Record usage
    offer.use(current_user_id, payment_id)
    db.session.commit()

    return jsonify({
        'message': 'Offer applied successfully',
        'discount_amount': float(discount),
        'original_amount': float(purchase_amount),
        'final_amount': float(Decimal(str(purchase_amount)) - discount),
        'offer': offer.to_dict()
    }), 200


@offers_bp.route('/my-offers', methods=['GET'])
@jwt_required()
def get_my_offers():
    """Get offers available to the current user"""
    current_user_id = int(get_jwt_identity())

    now = datetime.utcnow()
    # Get all active offers
    offers = Offer.query.filter(
        Offer.is_active == True,
        Offer.starts_at <= now,
        db.or_(Offer.expires_at == None, Offer.expires_at > now)
    ).order_by(Offer.expires_at.asc()).all()

    available = []
    used = []

    for offer in offers:
        user_usage = OfferUsage.query.filter_by(
            offer_id=offer.id,
            user_id=current_user_id
        ).all()

        offer_dict = offer.to_dict()
        offer_dict['user_usage_count'] = len(user_usage)

        if len(user_usage) >= offer.max_uses_per_user:
            offer_dict['used_at'] = user_usage[0].used_at.isoformat() if user_usage else None
            used.append(offer_dict)
        elif offer.is_valid():
            available.append(offer_dict)

    return jsonify({
        'available': available,
        'used': used,
        'total_available': len(available),
        'total_used': len(used)
    }), 200


# Admin endpoints
@offers_bp.route('', methods=['GET'])
@jwt_required()
def get_all_offers():
    """Get all offers (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    query = Offer.query
    if not include_inactive:
        query = query.filter_by(is_active=True)

    offers = query.order_by(Offer.created_at.desc()).all()

    return jsonify({
        'offers': [o.to_dict() for o in offers],
        'total': len(offers)
    }), 200


@offers_bp.route('', methods=['POST'])
@jwt_required()
def create_offer():
    """Create a new offer (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['title', 'code', 'discount_value']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    # Check if code already exists
    existing = Offer.query.filter_by(code=data['code'].upper()).first()
    if existing:
        return jsonify({'error': 'Offer code already exists'}), 400

    offer = Offer(
        title=data['title'],
        description=data.get('description'),
        code=data['code'].upper(),
        discount_type=data.get('discount_type', 'percentage'),
        discount_value=Decimal(str(data['discount_value'])),
        max_uses=data.get('max_uses'),
        max_uses_per_user=data.get('max_uses_per_user', 1),
        min_purchase=Decimal(str(data.get('min_purchase', 0))),
        applicable_plans=data.get('applicable_plans', 'all'),
        is_featured=data.get('is_featured', False)
    )

    # Set dates
    if data.get('starts_at'):
        offer.starts_at = datetime.fromisoformat(data['starts_at'])
    if data.get('expires_at'):
        offer.expires_at = datetime.fromisoformat(data['expires_at'])

    db.session.add(offer)
    db.session.commit()

    return jsonify({
        'message': 'Offer created successfully',
        'offer': offer.to_dict()
    }), 201


@offers_bp.route('/<int:offer_id>', methods=['PUT'])
@jwt_required()
def update_offer(offer_id):
    """Update an offer (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    offer = Offer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    data = request.get_json()

    if 'title' in data:
        offer.title = data['title']
    if 'description' in data:
        offer.description = data['description']
    if 'discount_type' in data:
        offer.discount_type = data['discount_type']
    if 'discount_value' in data:
        offer.discount_value = Decimal(str(data['discount_value']))
    if 'max_uses' in data:
        offer.max_uses = data['max_uses']
    if 'max_uses_per_user' in data:
        offer.max_uses_per_user = data['max_uses_per_user']
    if 'min_purchase' in data:
        offer.min_purchase = Decimal(str(data['min_purchase']))
    if 'applicable_plans' in data:
        offer.applicable_plans = data['applicable_plans']
    if 'is_active' in data:
        offer.is_active = data['is_active']
    if 'is_featured' in data:
        offer.is_featured = data['is_featured']
    if 'starts_at' in data:
        offer.starts_at = datetime.fromisoformat(data['starts_at']) if data['starts_at'] else None
    if 'expires_at' in data:
        offer.expires_at = datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None

    db.session.commit()

    return jsonify({
        'message': 'Offer updated successfully',
        'offer': offer.to_dict()
    }), 200


@offers_bp.route('/<int:offer_id>', methods=['DELETE'])
@jwt_required()
def delete_offer(offer_id):
    """Deactivate an offer (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    offer = Offer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    # Soft delete
    offer.is_active = False
    db.session.commit()

    return jsonify({'message': 'Offer deactivated successfully'}), 200


@offers_bp.route('/<int:offer_id>/stats', methods=['GET'])
@jwt_required()
def get_offer_stats(offer_id):
    """Get usage statistics for an offer (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    offer = Offer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    usages = OfferUsage.query.filter_by(offer_id=offer_id)\
        .order_by(OfferUsage.used_at.desc()).all()

    return jsonify({
        'offer': offer.to_dict(),
        'total_uses': len(usages),
        'usages': [u.to_dict() for u in usages]
    }), 200
