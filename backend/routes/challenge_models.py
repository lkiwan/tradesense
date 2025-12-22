"""
Challenge Models API Routes
Endpoints for retrieving and managing challenge configurations
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChallengeModel, AccountSize, User

challenge_models_bp = Blueprint('challenge_models', __name__, url_prefix='/api/challenge-models')


@challenge_models_bp.route('', methods=['GET'])
def get_challenge_models():
    """
    Get all active challenge models with their account sizes
    Public endpoint - no authentication required
    """
    models = ChallengeModel.query.filter_by(is_active=True)\
        .order_by(ChallengeModel.display_order).all()

    return jsonify({
        'models': [model.to_dict(include_sizes=True) for model in models]
    }), 200


@challenge_models_bp.route('/<int:model_id>', methods=['GET'])
def get_challenge_model(model_id):
    """Get a specific challenge model by ID"""
    model = ChallengeModel.query.get_or_404(model_id)

    return jsonify(model.to_dict(include_sizes=True)), 200


@challenge_models_bp.route('/by-name/<string:name>', methods=['GET'])
def get_challenge_model_by_name(name):
    """Get a specific challenge model by name"""
    model = ChallengeModel.query.filter_by(name=name, is_active=True).first()

    if not model:
        return jsonify({'error': 'Challenge model not found'}), 404

    return jsonify(model.to_dict(include_sizes=True)), 200


@challenge_models_bp.route('/<int:model_id>/sizes', methods=['GET'])
def get_account_sizes(model_id):
    """Get account sizes for a specific model"""
    model = ChallengeModel.query.get_or_404(model_id)

    sizes = AccountSize.query.filter_by(
        model_id=model_id,
        is_active=True
    ).order_by(AccountSize.balance).all()

    return jsonify({
        'model_id': model_id,
        'model_name': model.display_name,
        'sizes': [size.to_dict() for size in sizes]
    }), 200


@challenge_models_bp.route('/compare', methods=['GET'])
def compare_models():
    """
    Get comparison data for all models
    Returns a structured comparison for the pricing page
    """
    models = ChallengeModel.query.filter_by(is_active=True)\
        .order_by(ChallengeModel.display_order).all()

    comparison = {
        'models': [],
        'features': [
            {'key': 'phases', 'label': 'Phases', 'type': 'number'},
            {'key': 'phase1_profit_target', 'label': 'Phase 1 Target', 'type': 'percent'},
            {'key': 'phase2_profit_target', 'label': 'Phase 2 Target', 'type': 'percent'},
            {'key': 'max_daily_loss', 'label': 'Daily Loss Limit', 'type': 'percent'},
            {'key': 'max_overall_loss', 'label': 'Overall Loss Limit', 'type': 'percent'},
            {'key': 'leverage', 'label': 'Leverage', 'type': 'string'},
            {'key': 'first_payout_days', 'label': 'First Payout', 'type': 'days'},
            {'key': 'payout_cycle_days', 'label': 'Payout Cycle', 'type': 'days'},
            {'key': 'default_profit_split', 'label': 'Profit Split', 'type': 'percent'},
        ]
    }

    for model in models:
        model_data = model.to_dict(include_sizes=True)
        # Get the lowest price for display
        if model_data['account_sizes']:
            model_data['starting_price'] = min(
                size['current_price'] for size in model_data['account_sizes']
            )
        else:
            model_data['starting_price'] = 0
        comparison['models'].append(model_data)

    return jsonify(comparison), 200


# Admin endpoints
@challenge_models_bp.route('/admin', methods=['GET'])
@jwt_required()
def admin_get_all_models():
    """Get all challenge models (including inactive) - Admin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    models = ChallengeModel.query.order_by(ChallengeModel.display_order).all()

    return jsonify({
        'models': [model.to_dict(include_sizes=True) for model in models]
    }), 200


@challenge_models_bp.route('/admin', methods=['POST'])
@jwt_required()
def admin_create_model():
    """Create a new challenge model - SuperAdmin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    # Validate required fields
    required = ['name', 'display_name']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Check for duplicate name
    if ChallengeModel.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Model name already exists'}), 400

    model = ChallengeModel(
        name=data['name'],
        display_name=data['display_name'],
        description=data.get('description'),
        phases=data.get('phases', 2),
        phase1_profit_target=data.get('phase1_profit_target', 10.00),
        phase1_min_days=data.get('phase1_min_days', 0),
        phase2_profit_target=data.get('phase2_profit_target', 5.00),
        phase2_min_days=data.get('phase2_min_days', 0),
        max_daily_loss=data.get('max_daily_loss', 5.00),
        max_overall_loss=data.get('max_overall_loss', 10.00),
        leverage=data.get('leverage', '1:100'),
        news_trading_allowed=data.get('news_trading_allowed', True),
        weekend_holding_allowed=data.get('weekend_holding_allowed', True),
        ea_allowed=data.get('ea_allowed', True),
        first_payout_days=data.get('first_payout_days', 14),
        payout_cycle_days=data.get('payout_cycle_days', 14),
        default_profit_split=data.get('default_profit_split', 80.00),
        max_profit_split=data.get('max_profit_split', 90.00),
        reset_discount=data.get('reset_discount', 10.00),
        badge_color=data.get('badge_color', 'blue'),
        icon=data.get('icon', 'star'),
        is_popular=data.get('is_popular', False),
        is_new=data.get('is_new', False),
        is_active=data.get('is_active', True),
        display_order=data.get('display_order', 0)
    )

    db.session.add(model)
    db.session.commit()

    return jsonify({
        'message': 'Challenge model created successfully',
        'model': model.to_dict()
    }), 201


@challenge_models_bp.route('/admin/<int:model_id>', methods=['PUT'])
@jwt_required()
def admin_update_model(model_id):
    """Update a challenge model - SuperAdmin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Unauthorized'}), 403

    model = ChallengeModel.query.get_or_404(model_id)
    data = request.get_json()

    # Update allowed fields
    updatable_fields = [
        'display_name', 'description', 'phases',
        'phase1_profit_target', 'phase1_min_days',
        'phase2_profit_target', 'phase2_min_days',
        'max_daily_loss', 'max_overall_loss', 'leverage',
        'news_trading_allowed', 'weekend_holding_allowed', 'ea_allowed',
        'first_payout_days', 'payout_cycle_days',
        'default_profit_split', 'max_profit_split', 'reset_discount',
        'badge_color', 'icon', 'is_popular', 'is_new',
        'is_active', 'display_order'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(model, field, data[field])

    db.session.commit()

    return jsonify({
        'message': 'Challenge model updated successfully',
        'model': model.to_dict()
    }), 200


@challenge_models_bp.route('/admin/<int:model_id>/sizes', methods=['POST'])
@jwt_required()
def admin_add_account_size(model_id):
    """Add account size to a model - SuperAdmin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Unauthorized'}), 403

    model = ChallengeModel.query.get_or_404(model_id)
    data = request.get_json()

    if 'balance' not in data or 'price' not in data:
        return jsonify({'error': 'Missing balance or price'}), 400

    # Check for duplicate
    existing = AccountSize.query.filter_by(
        model_id=model_id,
        balance=data['balance']
    ).first()

    if existing:
        return jsonify({'error': 'Account size already exists for this model'}), 400

    size = AccountSize(
        model_id=model_id,
        balance=data['balance'],
        price=data['price'],
        sale_price=data.get('sale_price'),
        sale_ends_at=data.get('sale_ends_at'),
        is_active=data.get('is_active', True)
    )

    db.session.add(size)
    db.session.commit()

    return jsonify({
        'message': 'Account size added successfully',
        'size': size.to_dict()
    }), 201


@challenge_models_bp.route('/admin/sizes/<int:size_id>', methods=['PUT'])
@jwt_required()
def admin_update_account_size(size_id):
    """Update an account size - SuperAdmin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Unauthorized'}), 403

    size = AccountSize.query.get_or_404(size_id)
    data = request.get_json()

    if 'balance' in data:
        size.balance = data['balance']
    if 'price' in data:
        size.price = data['price']
    if 'sale_price' in data:
        size.sale_price = data['sale_price']
    if 'sale_ends_at' in data:
        size.sale_ends_at = data['sale_ends_at']
    if 'is_active' in data:
        size.is_active = data['is_active']

    db.session.commit()

    return jsonify({
        'message': 'Account size updated successfully',
        'size': size.to_dict()
    }), 200


@challenge_models_bp.route('/admin/sizes/<int:size_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_account_size(size_id):
    """Delete an account size - SuperAdmin only"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'superadmin':
        return jsonify({'error': 'Unauthorized'}), 403

    size = AccountSize.query.get_or_404(size_id)
    db.session.delete(size)
    db.session.commit()

    return jsonify({'message': 'Account size deleted successfully'}), 200
