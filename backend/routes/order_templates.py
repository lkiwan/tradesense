"""
Order Templates API Routes
CRUD operations for managing order configuration templates
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal

from models import db, OrderTemplate, create_default_templates

order_templates_bp = Blueprint('order_templates', __name__, url_prefix='/api/templates')


# ==================== LIST & SEARCH ====================

@order_templates_bp.route('', methods=['GET'])
@jwt_required()
def get_templates():
    """Get all templates for the current user"""
    user_id = get_jwt_identity()

    # Query parameters
    symbol = request.args.get('symbol')
    favorites_only = request.args.get('favorites', 'false').lower() == 'true'
    include_stats = request.args.get('stats', 'true').lower() == 'true'

    templates = OrderTemplate.get_user_templates(
        user_id=user_id,
        symbol=symbol,
        favorites_only=favorites_only
    )

    return jsonify({
        'templates': [t.to_dict(include_stats=include_stats) for t in templates],
        'count': len(templates)
    })


@order_templates_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorite_templates():
    """Get only favorite templates"""
    user_id = get_jwt_identity()

    templates = OrderTemplate.query.filter_by(
        user_id=user_id,
        is_favorite=True
    ).order_by(OrderTemplate.sort_order, OrderTemplate.name).all()

    return jsonify({
        'templates': [t.to_dict() for t in templates],
        'count': len(templates)
    })


@order_templates_bp.route('/quick', methods=['GET'])
@jwt_required()
def get_quick_templates():
    """Get templates optimized for quick selection dropdown"""
    user_id = get_jwt_identity()
    symbol = request.args.get('symbol')

    query = OrderTemplate.query.filter_by(user_id=user_id)

    if symbol:
        # Templates matching this symbol or universal templates
        query = query.filter(
            db.or_(
                OrderTemplate.symbol == symbol,
                OrderTemplate.symbol.is_(None),
                OrderTemplate.symbol_locked == False
            )
        )

    templates = query.order_by(
        OrderTemplate.is_favorite.desc(),
        OrderTemplate.times_used.desc()
    ).limit(10).all()

    # Return simplified data for dropdown
    return jsonify({
        'templates': [{
            'id': t.id,
            'name': t.name,
            'color': t.color,
            'icon': t.icon,
            'symbol': t.symbol,
            'lot_size': float(t.lot_size) if t.lot_size else None,
            'sl_pips': float(t.sl_value) if t.sl_enabled and t.sl_type == 'pips' else None,
            'tp_pips': float(t.tp_value) if t.tp_enabled and t.tp_type == 'pips' else None,
            'is_favorite': t.is_favorite
        } for t in templates]
    })


# ==================== CREATE ====================

@order_templates_bp.route('', methods=['POST'])
@jwt_required()
def create_template():
    """Create a new order template"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Template name is required'}), 400

    # Check for duplicate name
    existing = OrderTemplate.query.filter_by(
        user_id=user_id,
        name=data['name']
    ).first()

    if existing:
        return jsonify({'error': 'A template with this name already exists'}), 400

    try:
        template = OrderTemplate(user_id=user_id)

        # Basic info
        template.name = data['name']
        template.description = data.get('description')
        template.color = data.get('color', '#6366f1')
        template.icon = data.get('icon', 'template')

        # Symbol
        template.symbol = data.get('symbol')
        template.symbol_locked = data.get('symbol_locked', False)

        # Order type
        template.order_type = data.get('order_type', 'market')
        template.order_side = data.get('order_side')

        # Position sizing
        if 'position_sizing' in data:
            ps = data['position_sizing']
            if 'lot_size' in ps and ps['lot_size']:
                template.lot_size = Decimal(str(ps['lot_size']))
            template.use_risk_based_sizing = ps.get('use_risk_based_sizing', False)
            if 'risk_percent' in ps and ps['risk_percent']:
                template.risk_percent = Decimal(str(ps['risk_percent']))
            if 'risk_amount' in ps and ps['risk_amount']:
                template.risk_amount = Decimal(str(ps['risk_amount']))
        elif 'lot_size' in data and data['lot_size']:
            template.lot_size = Decimal(str(data['lot_size']))

        # Stop Loss
        if 'stop_loss' in data:
            sl = data['stop_loss']
            template.sl_enabled = sl.get('enabled', True)
            template.sl_type = sl.get('type', 'pips')
            if 'value' in sl and sl['value']:
                template.sl_value = Decimal(str(sl['value']))
            if 'atr_multiplier' in sl and sl['atr_multiplier']:
                template.sl_atr_multiplier = Decimal(str(sl['atr_multiplier']))

        # Take Profit
        if 'take_profit' in data:
            tp = data['take_profit']
            template.tp_enabled = tp.get('enabled', True)
            template.tp_type = tp.get('type', 'pips')
            if 'value' in tp and tp['value']:
                template.tp_value = Decimal(str(tp['value']))
            if 'rr_ratio' in tp and tp['rr_ratio']:
                template.tp_rr_ratio = Decimal(str(tp['rr_ratio']))
            template.tp_partial_enabled = tp.get('partial_enabled', False)
            template.tp_levels = tp.get('levels')

        # Trailing Stop
        if 'trailing_stop' in data:
            ts = data['trailing_stop']
            template.trailing_stop_enabled = ts.get('enabled', False)
            template.trailing_stop_type = ts.get('type', 'pips')
            if 'value' in ts and ts['value']:
                template.trailing_stop_value = Decimal(str(ts['value']))
            if 'activation' in ts and ts['activation']:
                template.trailing_stop_activation = Decimal(str(ts['activation']))

        # Break Even
        if 'break_even' in data:
            be = data['break_even']
            template.break_even_enabled = be.get('enabled', False)
            if 'trigger' in be and be['trigger']:
                template.break_even_trigger = Decimal(str(be['trigger']))
            if 'offset' in be and be['offset']:
                template.break_even_offset = Decimal(str(be['offset']))

        # Expiry
        if 'expiry' in data:
            exp = data['expiry']
            template.expiry_type = exp.get('type', 'gtc')
            template.expiry_minutes = exp.get('minutes')

        # Other
        template.trade_comment = data.get('trade_comment')
        template.is_favorite = data.get('is_favorite', False)

        db.session.add(template)
        db.session.commit()

        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== READ ====================

@order_templates_bp.route('/<int:template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    """Get a specific template"""
    user_id = get_jwt_identity()

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    return jsonify({'template': template.to_dict()})


# ==================== UPDATE ====================

@order_templates_bp.route('/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Update an existing template"""
    user_id = get_jwt_identity()
    data = request.get_json()

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    try:
        # Basic info
        if 'name' in data:
            # Check for duplicate name (excluding current template)
            existing = OrderTemplate.query.filter(
                OrderTemplate.user_id == user_id,
                OrderTemplate.name == data['name'],
                OrderTemplate.id != template_id
            ).first()
            if existing:
                return jsonify({'error': 'A template with this name already exists'}), 400
            template.name = data['name']

        if 'description' in data:
            template.description = data['description']
        if 'color' in data:
            template.color = data['color']
        if 'icon' in data:
            template.icon = data['icon']
        if 'symbol' in data:
            template.symbol = data['symbol']
        if 'symbol_locked' in data:
            template.symbol_locked = data['symbol_locked']
        if 'order_type' in data:
            template.order_type = data['order_type']
        if 'order_side' in data:
            template.order_side = data['order_side']

        # Position sizing
        if 'position_sizing' in data:
            ps = data['position_sizing']
            if 'lot_size' in ps:
                template.lot_size = Decimal(str(ps['lot_size'])) if ps['lot_size'] else None
            if 'use_risk_based_sizing' in ps:
                template.use_risk_based_sizing = ps['use_risk_based_sizing']
            if 'risk_percent' in ps:
                template.risk_percent = Decimal(str(ps['risk_percent'])) if ps['risk_percent'] else None
            if 'risk_amount' in ps:
                template.risk_amount = Decimal(str(ps['risk_amount'])) if ps['risk_amount'] else None

        # Stop Loss
        if 'stop_loss' in data:
            sl = data['stop_loss']
            if 'enabled' in sl:
                template.sl_enabled = sl['enabled']
            if 'type' in sl:
                template.sl_type = sl['type']
            if 'value' in sl:
                template.sl_value = Decimal(str(sl['value'])) if sl['value'] else None
            if 'atr_multiplier' in sl:
                template.sl_atr_multiplier = Decimal(str(sl['atr_multiplier'])) if sl['atr_multiplier'] else None

        # Take Profit
        if 'take_profit' in data:
            tp = data['take_profit']
            if 'enabled' in tp:
                template.tp_enabled = tp['enabled']
            if 'type' in tp:
                template.tp_type = tp['type']
            if 'value' in tp:
                template.tp_value = Decimal(str(tp['value'])) if tp['value'] else None
            if 'rr_ratio' in tp:
                template.tp_rr_ratio = Decimal(str(tp['rr_ratio'])) if tp['rr_ratio'] else None
            if 'partial_enabled' in tp:
                template.tp_partial_enabled = tp['partial_enabled']
            if 'levels' in tp:
                template.tp_levels = tp['levels']

        # Trailing Stop
        if 'trailing_stop' in data:
            ts = data['trailing_stop']
            if 'enabled' in ts:
                template.trailing_stop_enabled = ts['enabled']
            if 'type' in ts:
                template.trailing_stop_type = ts['type']
            if 'value' in ts:
                template.trailing_stop_value = Decimal(str(ts['value'])) if ts['value'] else None
            if 'activation' in ts:
                template.trailing_stop_activation = Decimal(str(ts['activation'])) if ts['activation'] else None

        # Break Even
        if 'break_even' in data:
            be = data['break_even']
            if 'enabled' in be:
                template.break_even_enabled = be['enabled']
            if 'trigger' in be:
                template.break_even_trigger = Decimal(str(be['trigger'])) if be['trigger'] else None
            if 'offset' in be:
                template.break_even_offset = Decimal(str(be['offset'])) if be['offset'] else None

        # Expiry
        if 'expiry' in data:
            exp = data['expiry']
            if 'type' in exp:
                template.expiry_type = exp['type']
            if 'minutes' in exp:
                template.expiry_minutes = exp['minutes']

        # Other
        if 'trade_comment' in data:
            template.trade_comment = data['trade_comment']
        if 'is_favorite' in data:
            template.is_favorite = data['is_favorite']
        if 'sort_order' in data:
            template.sort_order = data['sort_order']

        db.session.commit()

        return jsonify({
            'message': 'Template updated successfully',
            'template': template.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== DELETE ====================

@order_templates_bp.route('/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Delete a template"""
    user_id = get_jwt_identity()

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    try:
        db.session.delete(template)
        db.session.commit()

        return jsonify({'message': 'Template deleted successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SPECIAL ACTIONS ====================

@order_templates_bp.route('/<int:template_id>/toggle-favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(template_id):
    """Toggle favorite status"""
    user_id = get_jwt_identity()

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    template.is_favorite = not template.is_favorite
    db.session.commit()

    return jsonify({
        'message': f'Template {"added to" if template.is_favorite else "removed from"} favorites',
        'is_favorite': template.is_favorite
    })


@order_templates_bp.route('/<int:template_id>/use', methods=['POST'])
@jwt_required()
def use_template(template_id):
    """Mark template as used and return configuration"""
    user_id = get_jwt_identity()

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    # Increment usage counter
    template.increment_usage()
    db.session.commit()

    # Return the template configuration for use
    return jsonify({
        'message': 'Template loaded',
        'config': template.to_dict(include_stats=False)
    })


@order_templates_bp.route('/<int:template_id>/record-result', methods=['POST'])
@jwt_required()
def record_trade_result(template_id):
    """Record trade result for template statistics"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'won' not in data:
        return jsonify({'error': 'Result (won: true/false) is required'}), 400

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    template.record_result(data['won'])
    db.session.commit()

    return jsonify({
        'message': 'Result recorded',
        'stats': {
            'win_count': template.win_count,
            'loss_count': template.loss_count,
            'win_rate': template.win_rate
        }
    })


@order_templates_bp.route('/<int:template_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_template(template_id):
    """Create a copy of a template"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    template = OrderTemplate.query.filter_by(
        id=template_id,
        user_id=user_id
    ).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    try:
        # Create new template with same settings
        new_name = data.get('name', f"{template.name} (Copy)")

        # Check for duplicate name
        existing = OrderTemplate.query.filter_by(user_id=user_id, name=new_name).first()
        if existing:
            new_name = f"{template.name} (Copy {datetime.utcnow().strftime('%H%M%S')})"

        new_template = OrderTemplate(
            user_id=user_id,
            name=new_name,
            description=template.description,
            color=template.color,
            icon=template.icon,
            symbol=template.symbol,
            symbol_locked=template.symbol_locked,
            order_type=template.order_type,
            order_side=template.order_side,
            lot_size=template.lot_size,
            use_risk_based_sizing=template.use_risk_based_sizing,
            risk_percent=template.risk_percent,
            risk_amount=template.risk_amount,
            sl_enabled=template.sl_enabled,
            sl_type=template.sl_type,
            sl_value=template.sl_value,
            sl_atr_multiplier=template.sl_atr_multiplier,
            tp_enabled=template.tp_enabled,
            tp_type=template.tp_type,
            tp_value=template.tp_value,
            tp_rr_ratio=template.tp_rr_ratio,
            tp_partial_enabled=template.tp_partial_enabled,
            tp_levels=template.tp_levels,
            trailing_stop_enabled=template.trailing_stop_enabled,
            trailing_stop_type=template.trailing_stop_type,
            trailing_stop_value=template.trailing_stop_value,
            trailing_stop_activation=template.trailing_stop_activation,
            break_even_enabled=template.break_even_enabled,
            break_even_trigger=template.break_even_trigger,
            break_even_offset=template.break_even_offset,
            expiry_type=template.expiry_type,
            expiry_minutes=template.expiry_minutes,
            trade_comment=template.trade_comment,
            is_favorite=False  # Don't copy favorite status
        )

        db.session.add(new_template)
        db.session.commit()

        return jsonify({
            'message': 'Template duplicated successfully',
            'template': new_template.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@order_templates_bp.route('/reorder', methods=['POST'])
@jwt_required()
def reorder_templates():
    """Reorder templates (update sort_order)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'order' not in data or not isinstance(data['order'], list):
        return jsonify({'error': 'Order array is required'}), 400

    try:
        for index, template_id in enumerate(data['order']):
            template = OrderTemplate.query.filter_by(
                id=template_id,
                user_id=user_id
            ).first()
            if template:
                template.sort_order = index

        db.session.commit()

        return jsonify({'message': 'Templates reordered successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@order_templates_bp.route('/init-defaults', methods=['POST'])
@jwt_required()
def initialize_default_templates():
    """Create default templates for a user"""
    user_id = get_jwt_identity()

    # Check if user already has templates
    existing_count = OrderTemplate.query.filter_by(user_id=user_id).count()
    if existing_count > 0:
        return jsonify({
            'message': 'User already has templates',
            'count': existing_count
        })

    try:
        templates = create_default_templates(user_id)
        for template in templates:
            db.session.add(template)

        db.session.commit()

        return jsonify({
            'message': f'Created {len(templates)} default templates',
            'templates': [t.to_dict() for t in templates]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
