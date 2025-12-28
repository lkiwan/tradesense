import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from . import trades_bp
from models import db, Trade, UserChallenge, User
from services.challenge_engine import ChallengeEngine
from services.yfinance_service import get_current_price
from middleware.rate_limiter import limiter
from services.audit_service import AuditService

logger = logging.getLogger(__name__)


@trades_bp.route('', methods=['GET'])
@jwt_required()
def get_trades():
    """Get all trades for user's active challenge"""
    current_user_id = int(get_jwt_identity())

    # Get challenge_id from query params or find active challenge
    challenge_id = request.args.get('challenge_id')

    if challenge_id:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge or challenge.user_id != current_user_id:
            return jsonify({'error': 'Challenge not found'}), 404
    else:
        challenge = UserChallenge.query.filter_by(
            user_id=current_user_id,
            status='active'
        ).first()
        if not challenge:
            return jsonify({'error': 'No active challenge'}), 404

    trades = Trade.query.filter_by(challenge_id=challenge.id).order_by(
        Trade.opened_at.desc()
    ).all()

    return jsonify({
        'trades': [t.to_dict() for t in trades],
        'challenge_id': challenge.id
    }), 200


@trades_bp.route('/open', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def open_trade():
    """Open a new trade"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    required_fields = ['symbol', 'trade_type', 'quantity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge. Please purchase a plan first.'}), 404

    # Get current price
    symbol = data['symbol']
    logger.info(f"Fetching price for symbol: {symbol}")
    current_price = get_current_price(symbol)
    logger.info(f"Price result for {symbol}: {current_price}")

    if current_price is None:
        logger.error(f"Failed to get price for symbol: {symbol}")
        return jsonify({'error': f'Could not get price for {symbol}'}), 400

    quantity = Decimal(str(data['quantity']))
    trade_value = quantity * Decimal(str(current_price))

    # Check if user has enough balance
    if trade_value > challenge.current_balance:
        return jsonify({
            'error': 'Insufficient balance',
            'required': float(trade_value),
            'available': float(challenge.current_balance)
        }), 400

    # Create trade
    trade = Trade(
        challenge_id=challenge.id,
        symbol=symbol,
        trade_type=data['trade_type'],
        quantity=quantity,
        entry_price=Decimal(str(current_price)),
        stop_loss=Decimal(str(data['stop_loss'])) if data.get('stop_loss') else None,
        take_profit=Decimal(str(data['take_profit'])) if data.get('take_profit') else None,
        status='open'
    )

    db.session.add(trade)
    db.session.commit()

    # Log trade open
    try:
        user = User.query.get(current_user_id)
        AuditService.log_trade_open(
            user_id=current_user_id,
            username=user.username if user else None,
            trade_id=trade.id,
            symbol=symbol,
            trade_type=data['trade_type'],
            quantity=quantity,
            price=current_price
        )
    except Exception as e:
        logger.warning(f"Failed to log trade open audit: {e}")

    return jsonify({
        'message': 'Trade opened successfully',
        'trade': trade.to_dict(),
        'current_price': current_price
    }), 201


@trades_bp.route('/<int:trade_id>/close', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def close_trade(trade_id):
    """Close an open trade"""
    current_user_id = int(get_jwt_identity())
    trade = Trade.query.get(trade_id)

    if not trade:
        return jsonify({'error': 'Trade not found'}), 404

    challenge = UserChallenge.query.get(trade.challenge_id)
    if challenge.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if trade.status != 'open':
        return jsonify({'error': 'Trade is already closed'}), 400

    # Get current price
    current_price = get_current_price(trade.symbol)
    if current_price is None:
        return jsonify({'error': f'Could not get price for {trade.symbol}'}), 400

    # Close trade and calculate PnL
    pnl = trade.close_trade(current_price)

    # Update challenge balance (preserve decimal precision)
    challenge.current_balance = challenge.current_balance + Decimal(str(pnl))

    # Update highest balance if applicable
    if challenge.current_balance > challenge.highest_balance:
        challenge.highest_balance = challenge.current_balance

    db.session.commit()

    # Log trade close
    try:
        user = User.query.get(current_user_id)
        AuditService.log_trade_close(
            user_id=current_user_id,
            username=user.username if user else None,
            trade_id=trade.id,
            symbol=trade.symbol,
            profit_loss=pnl
        )
    except Exception as e:
        logger.warning(f"Failed to log trade close audit: {e}")

    # Evaluate challenge rules
    engine = ChallengeEngine()
    evaluation_result = engine.evaluate_challenge(challenge)

    return jsonify({
        'message': 'Trade closed successfully',
        'trade': trade.to_dict(),
        'pnl': pnl,
        'current_price': current_price,
        'new_balance': float(challenge.current_balance),
        'challenge_status': evaluation_result
    }), 200


@trades_bp.route('/<int:trade_id>', methods=['GET'])
@jwt_required()
def get_trade(trade_id):
    """Get specific trade details"""
    current_user_id = int(get_jwt_identity())
    trade = Trade.query.get(trade_id)

    if not trade:
        return jsonify({'error': 'Trade not found'}), 404

    challenge = UserChallenge.query.get(trade.challenge_id)
    user = User.query.get(current_user_id)

    if challenge.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get current price for open trades
    response_data = {'trade': trade.to_dict()}

    if trade.status == 'open':
        current_price = get_current_price(trade.symbol)
        if current_price:
            # Calculate unrealized PnL
            if trade.trade_type == 'buy':
                unrealized_pnl = (current_price - float(trade.entry_price)) * float(trade.quantity)
            else:
                unrealized_pnl = (float(trade.entry_price) - current_price) * float(trade.quantity)

            response_data['current_price'] = current_price
            response_data['unrealized_pnl'] = unrealized_pnl

    return jsonify(response_data), 200


@trades_bp.route('/open/pnl', methods=['GET'])
@jwt_required()
def get_open_trades_pnl():
    """Get real-time PnL for all open trades"""
    current_user_id = int(get_jwt_identity())

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge'}), 404

    # Get all open trades
    open_trades = Trade.query.filter_by(
        challenge_id=challenge.id,
        status='open'
    ).all()

    trades_pnl = []
    total_unrealized_pnl = 0
    total_value = 0
    price_errors = []

    for trade in open_trades:
        current_price = get_current_price(trade.symbol)
        price_available = current_price is not None

        # IMPORTANT: Always include trade, use entry price as fallback
        if not price_available:
            current_price = float(trade.entry_price)
            price_errors.append(trade.symbol)
            logger.warning(f"Price unavailable for {trade.symbol}, using entry price as fallback")

        # Calculate unrealized PnL
        entry_price = float(trade.entry_price)
        quantity = float(trade.quantity)

        if trade.trade_type == 'buy':
            unrealized_pnl = (current_price - entry_price) * quantity
        else:
            unrealized_pnl = (entry_price - current_price) * quantity

        trade_value = entry_price * quantity
        pnl_percent = (unrealized_pnl / trade_value) * 100 if trade_value > 0 else 0
        current_value = current_price * quantity

        trades_pnl.append({
            'trade_id': trade.id,
            'symbol': trade.symbol,
            'trade_type': trade.trade_type,
            'quantity': quantity,
            'entry_price': entry_price,
            'current_price': current_price,
            'unrealized_pnl': round(unrealized_pnl, 2),
            'pnl_percent': round(pnl_percent, 2),
            'current_value': round(current_value, 2),
            'price_available': price_available
        })

        total_unrealized_pnl += unrealized_pnl
        total_value += current_value

    return jsonify({
        'trades': trades_pnl,
        'total_unrealized_pnl': round(total_unrealized_pnl, 2),
        'total_value': round(total_value, 2),
        'current_balance': float(challenge.current_balance),
        'effective_balance': round(float(challenge.current_balance) + total_unrealized_pnl, 2),
        'price_errors': price_errors if price_errors else None
    }), 200
