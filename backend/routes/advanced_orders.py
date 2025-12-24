"""
Advanced Orders API Routes
Supports: Trailing Stop, OCO, Bracket Orders
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from decimal import Decimal

from models import (
    db, User, UserChallenge, Trade,
    TrailingStopOrder, OCOOrder, BracketOrder,
    OrderStatus, OrderSide, get_active_orders
)

advanced_orders_bp = Blueprint('advanced_orders', __name__)


def get_user_and_challenge(user_id, challenge_id=None):
    """Helper to get user and optionally validate challenge ownership"""
    user = User.query.get(user_id)
    if not user:
        return None, None, {'error': 'User not found'}, 404

    if challenge_id:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge or challenge.user_id != user_id:
            return None, None, {'error': 'Challenge not found or access denied'}, 404
        return user, challenge, None, None

    # Get active challenge if not specified
    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    return user, challenge, None, None


# ==================== TRAILING STOP ORDERS ====================

@advanced_orders_bp.route('/trailing-stop', methods=['POST'])
@jwt_required()
def create_trailing_stop():
    """Create a new trailing stop order"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required = ['symbol', 'side', 'quantity']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Must have either trail_amount or trail_percent
    if not data.get('trail_amount') and not data.get('trail_percent'):
        return jsonify({'error': 'Must specify trail_amount or trail_percent'}), 400

    user, challenge, error, status = get_user_and_challenge(
        user_id,
        data.get('challenge_id')
    )
    if error:
        return jsonify(error), status

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    try:
        # Determine trail type
        trail_type = 'percent' if data.get('trail_percent') else 'amount'

        order = TrailingStopOrder(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            side=data['side'].lower(),
            quantity=Decimal(str(data['quantity'])),
            trail_type=trail_type,
            trail_amount=Decimal(str(data['trail_amount'])) if data.get('trail_amount') else None,
            trail_percent=Decimal(str(data['trail_percent'])) if data.get('trail_percent') else None,
            activation_price=Decimal(str(data['activation_price'])) if data.get('activation_price') else None,
            position_id=data.get('position_id'),
            status=OrderStatus.PENDING.value if data.get('activation_price') else OrderStatus.ACTIVE.value
        )

        # Set expiration if provided
        if data.get('expires_in_hours'):
            order.expires_at = datetime.utcnow() + timedelta(hours=int(data['expires_in_hours']))

        db.session.add(order)
        db.session.commit()

        return jsonify({
            'message': 'Trailing stop order created successfully',
            'order': order.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/trailing-stop', methods=['GET'])
@jwt_required()
def get_trailing_stops():
    """Get all trailing stop orders for user"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)
    status_filter = request.args.get('status')

    query = TrailingStopOrder.query.filter_by(user_id=user_id)

    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    if status_filter:
        query = query.filter_by(status=status_filter)
    else:
        # Default: show pending and active
        query = query.filter(
            TrailingStopOrder.status.in_([
                OrderStatus.PENDING.value,
                OrderStatus.ACTIVE.value
            ])
        )

    orders = query.order_by(TrailingStopOrder.created_at.desc()).all()

    return jsonify({
        'orders': [o.to_dict() for o in orders],
        'count': len(orders)
    })


@advanced_orders_bp.route('/trailing-stop/<int:order_id>', methods=['GET'])
@jwt_required()
def get_trailing_stop(order_id):
    """Get a specific trailing stop order"""
    user_id = get_jwt_identity()

    order = TrailingStopOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'order': order.to_dict()})


@advanced_orders_bp.route('/trailing-stop/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_trailing_stop(order_id):
    """Update a trailing stop order"""
    user_id = get_jwt_identity()
    data = request.get_json()

    order = TrailingStopOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status not in [OrderStatus.PENDING.value, OrderStatus.ACTIVE.value]:
        return jsonify({'error': 'Cannot modify completed order'}), 400

    try:
        # Update allowed fields
        if 'trail_amount' in data:
            order.trail_amount = Decimal(str(data['trail_amount']))
            order.trail_type = 'amount'
        if 'trail_percent' in data:
            order.trail_percent = Decimal(str(data['trail_percent']))
            order.trail_type = 'percent'
        if 'activation_price' in data:
            order.activation_price = Decimal(str(data['activation_price'])) if data['activation_price'] else None
        if 'quantity' in data:
            order.quantity = Decimal(str(data['quantity']))

        db.session.commit()

        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/trailing-stop/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_trailing_stop(order_id):
    """Cancel a trailing stop order"""
    user_id = get_jwt_identity()

    order = TrailingStopOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status not in [OrderStatus.PENDING.value, OrderStatus.ACTIVE.value]:
        return jsonify({'error': 'Order already completed'}), 400

    order.status = OrderStatus.CANCELLED.value
    db.session.commit()

    return jsonify({'message': 'Order cancelled successfully'})


# ==================== OCO ORDERS ====================

@advanced_orders_bp.route('/oco', methods=['POST'])
@jwt_required()
def create_oco_order():
    """Create a new OCO (One-Cancels-Other) order"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required = ['symbol', 'quantity', 'order1_price', 'order2_price']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    user, challenge, error, status = get_user_and_challenge(
        user_id,
        data.get('challenge_id')
    )
    if error:
        return jsonify(error), status

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    try:
        # Determine sides based on position or explicit input
        # For a long position: Order1 = Sell TP (limit), Order2 = Sell SL (stop)
        # For a short position: Order1 = Buy TP (limit), Order2 = Buy SL (stop)
        position_side = data.get('position_side', 'long')

        if position_side == 'long':
            order1_side = OrderSide.SELL.value
            order2_side = OrderSide.SELL.value
        else:
            order1_side = OrderSide.BUY.value
            order2_side = OrderSide.BUY.value

        order = OCOOrder(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            quantity=Decimal(str(data['quantity'])),
            order1_side=data.get('order1_side', order1_side),
            order1_type=data.get('order1_type', 'limit'),
            order1_price=Decimal(str(data['order1_price'])),
            order2_side=data.get('order2_side', order2_side),
            order2_type=data.get('order2_type', 'stop'),
            order2_price=Decimal(str(data['order2_price'])),
            order2_stop_limit_price=Decimal(str(data['order2_stop_limit_price'])) if data.get('order2_stop_limit_price') else None,
            position_id=data.get('position_id'),
            status=OrderStatus.ACTIVE.value
        )

        # Set expiration if provided
        if data.get('expires_in_hours'):
            order.expires_at = datetime.utcnow() + timedelta(hours=int(data['expires_in_hours']))

        db.session.add(order)
        db.session.commit()

        return jsonify({
            'message': 'OCO order created successfully',
            'order': order.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/oco', methods=['GET'])
@jwt_required()
def get_oco_orders():
    """Get all OCO orders for user"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)
    status_filter = request.args.get('status')

    query = OCOOrder.query.filter_by(user_id=user_id)

    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    if status_filter:
        query = query.filter_by(status=status_filter)
    else:
        query = query.filter_by(status=OrderStatus.ACTIVE.value)

    orders = query.order_by(OCOOrder.created_at.desc()).all()

    return jsonify({
        'orders': [o.to_dict() for o in orders],
        'count': len(orders)
    })


@advanced_orders_bp.route('/oco/<int:order_id>', methods=['GET'])
@jwt_required()
def get_oco_order(order_id):
    """Get a specific OCO order"""
    user_id = get_jwt_identity()

    order = OCOOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'order': order.to_dict()})


@advanced_orders_bp.route('/oco/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_oco_order(order_id):
    """Update an OCO order"""
    user_id = get_jwt_identity()
    data = request.get_json()

    order = OCOOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status != OrderStatus.ACTIVE.value:
        return jsonify({'error': 'Cannot modify completed order'}), 400

    try:
        if 'order1_price' in data:
            order.order1_price = Decimal(str(data['order1_price']))
        if 'order2_price' in data:
            order.order2_price = Decimal(str(data['order2_price']))
        if 'quantity' in data:
            order.quantity = Decimal(str(data['quantity']))

        db.session.commit()

        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/oco/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_oco_order(order_id):
    """Cancel an OCO order"""
    user_id = get_jwt_identity()

    order = OCOOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status != OrderStatus.ACTIVE.value:
        return jsonify({'error': 'Order already completed'}), 400

    order.status = OrderStatus.CANCELLED.value
    order.order1_status = OrderStatus.CANCELLED.value
    order.order2_status = OrderStatus.CANCELLED.value
    db.session.commit()

    return jsonify({'message': 'OCO order cancelled successfully'})


# ==================== BRACKET ORDERS ====================

@advanced_orders_bp.route('/bracket', methods=['POST'])
@jwt_required()
def create_bracket_order():
    """Create a new bracket order (Entry + TP + SL)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required = ['symbol', 'side', 'quantity', 'take_profit_price', 'stop_loss_price']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    user, challenge, error, status = get_user_and_challenge(
        user_id,
        data.get('challenge_id')
    )
    if error:
        return jsonify(error), status

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    try:
        order = BracketOrder(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            side=data['side'].lower(),
            quantity=Decimal(str(data['quantity'])),
            entry_type=data.get('entry_type', 'market'),
            entry_price=Decimal(str(data['entry_price'])) if data.get('entry_price') else None,
            take_profit_price=Decimal(str(data['take_profit_price'])),
            stop_loss_price=Decimal(str(data['stop_loss_price'])),
            trailing_stop_enabled=data.get('trailing_stop_enabled', False),
            trailing_stop_distance=Decimal(str(data['trailing_stop_distance'])) if data.get('trailing_stop_distance') else None,
            status=OrderStatus.PENDING.value
        )

        # Calculate risk/reward if entry price provided
        if data.get('entry_price'):
            order.calculate_risk_reward()

        # Set expiration if provided
        if data.get('expires_in_hours'):
            order.expires_at = datetime.utcnow() + timedelta(hours=int(data['expires_in_hours']))

        db.session.add(order)
        db.session.commit()

        return jsonify({
            'message': 'Bracket order created successfully',
            'order': order.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/bracket', methods=['GET'])
@jwt_required()
def get_bracket_orders():
    """Get all bracket orders for user"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)
    status_filter = request.args.get('status')

    query = BracketOrder.query.filter_by(user_id=user_id)

    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    if status_filter:
        query = query.filter_by(status=status_filter)
    else:
        query = query.filter(
            BracketOrder.status.in_([
                OrderStatus.PENDING.value,
                OrderStatus.ACTIVE.value
            ])
        )

    orders = query.order_by(BracketOrder.created_at.desc()).all()

    return jsonify({
        'orders': [o.to_dict() for o in orders],
        'count': len(orders)
    })


@advanced_orders_bp.route('/bracket/<int:order_id>', methods=['GET'])
@jwt_required()
def get_bracket_order(order_id):
    """Get a specific bracket order"""
    user_id = get_jwt_identity()

    order = BracketOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'order': order.to_dict()})


@advanced_orders_bp.route('/bracket/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_bracket_order(order_id):
    """Update a bracket order"""
    user_id = get_jwt_identity()
    data = request.get_json()

    order = BracketOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status not in [OrderStatus.PENDING.value, OrderStatus.ACTIVE.value]:
        return jsonify({'error': 'Cannot modify completed order'}), 400

    try:
        # Can only modify certain fields based on status
        if order.status == OrderStatus.PENDING.value:
            # Entry not yet filled - can modify everything
            if 'entry_price' in data:
                order.entry_price = Decimal(str(data['entry_price'])) if data['entry_price'] else None
            if 'entry_type' in data:
                order.entry_type = data['entry_type']
            if 'quantity' in data:
                order.quantity = Decimal(str(data['quantity']))

        # Can always modify TP/SL if order is active
        if 'take_profit_price' in data:
            order.take_profit_price = Decimal(str(data['take_profit_price']))
        if 'stop_loss_price' in data:
            order.stop_loss_price = Decimal(str(data['stop_loss_price']))
        if 'trailing_stop_enabled' in data:
            order.trailing_stop_enabled = data['trailing_stop_enabled']
        if 'trailing_stop_distance' in data:
            order.trailing_stop_distance = Decimal(str(data['trailing_stop_distance'])) if data['trailing_stop_distance'] else None

        # Recalculate risk/reward
        order.calculate_risk_reward()

        db.session.commit()

        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@advanced_orders_bp.route('/bracket/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_bracket_order(order_id):
    """Cancel a bracket order"""
    user_id = get_jwt_identity()

    order = BracketOrder.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.status not in [OrderStatus.PENDING.value, OrderStatus.ACTIVE.value]:
        return jsonify({'error': 'Order already completed'}), 400

    order.status = OrderStatus.CANCELLED.value
    order.entry_status = OrderStatus.CANCELLED.value
    order.take_profit_status = OrderStatus.CANCELLED.value
    order.stop_loss_status = OrderStatus.CANCELLED.value
    db.session.commit()

    return jsonify({'message': 'Bracket order cancelled successfully'})


# ==================== COMBINED ENDPOINTS ====================

@advanced_orders_bp.route('/active', methods=['GET'])
@jwt_required()
def get_all_active_orders():
    """Get all active advanced orders for user"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)

    orders = get_active_orders(user_id, challenge_id)

    return jsonify({
        'orders': orders,
        'total_count': (
            len(orders['trailing_stops']) +
            len(orders['oco_orders']) +
            len(orders['bracket_orders'])
        )
    })


@advanced_orders_bp.route('/history', methods=['GET'])
@jwt_required()
def get_order_history():
    """Get historical orders (filled, cancelled, expired)"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)
    order_type = request.args.get('type')  # trailing_stop, oco, bracket
    limit = request.args.get('limit', 50, type=int)

    result = {
        'trailing_stops': [],
        'oco_orders': [],
        'bracket_orders': []
    }

    completed_statuses = [
        OrderStatus.FILLED.value,
        OrderStatus.CANCELLED.value,
        OrderStatus.EXPIRED.value,
        OrderStatus.TRIGGERED.value
    ]

    # Trailing stops
    if not order_type or order_type == 'trailing_stop':
        query = TrailingStopOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        query = query.filter(TrailingStopOrder.status.in_(completed_statuses))
        orders = query.order_by(TrailingStopOrder.updated_at.desc()).limit(limit).all()
        result['trailing_stops'] = [o.to_dict() for o in orders]

    # OCO orders
    if not order_type or order_type == 'oco':
        query = OCOOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        query = query.filter(OCOOrder.status.in_(completed_statuses))
        orders = query.order_by(OCOOrder.updated_at.desc()).limit(limit).all()
        result['oco_orders'] = [o.to_dict() for o in orders]

    # Bracket orders
    if not order_type or order_type == 'bracket':
        query = BracketOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        query = query.filter(BracketOrder.status.in_(completed_statuses))
        orders = query.order_by(BracketOrder.updated_at.desc()).limit(limit).all()
        result['bracket_orders'] = [o.to_dict() for o in orders]

    return jsonify(result)


@advanced_orders_bp.route('/cancel-all', methods=['POST'])
@jwt_required()
def cancel_all_orders():
    """Cancel all active advanced orders"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    challenge_id = data.get('challenge_id')
    symbol = data.get('symbol')

    cancelled_count = 0

    try:
        # Cancel trailing stops
        query = TrailingStopOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        if symbol:
            query = query.filter_by(symbol=symbol.upper())
        query = query.filter(
            TrailingStopOrder.status.in_([OrderStatus.PENDING.value, OrderStatus.ACTIVE.value])
        )
        for order in query.all():
            order.status = OrderStatus.CANCELLED.value
            cancelled_count += 1

        # Cancel OCO orders
        query = OCOOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        if symbol:
            query = query.filter_by(symbol=symbol.upper())
        query = query.filter_by(status=OrderStatus.ACTIVE.value)
        for order in query.all():
            order.status = OrderStatus.CANCELLED.value
            order.order1_status = OrderStatus.CANCELLED.value
            order.order2_status = OrderStatus.CANCELLED.value
            cancelled_count += 1

        # Cancel bracket orders
        query = BracketOrder.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        if symbol:
            query = query.filter_by(symbol=symbol.upper())
        query = query.filter(
            BracketOrder.status.in_([OrderStatus.PENDING.value, OrderStatus.ACTIVE.value])
        )
        for order in query.all():
            order.status = OrderStatus.CANCELLED.value
            order.entry_status = OrderStatus.CANCELLED.value
            order.take_profit_status = OrderStatus.CANCELLED.value
            order.stop_loss_status = OrderStatus.CANCELLED.value
            cancelled_count += 1

        db.session.commit()

        return jsonify({
            'message': f'Cancelled {cancelled_count} orders',
            'cancelled_count': cancelled_count
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
