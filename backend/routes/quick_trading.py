"""
Quick Trading / One-Click Trading API Routes
Fast order execution with pre-configured settings
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from decimal import Decimal
import time

from models import (
    db, User, UserChallenge, Trade,
    TradingSettings, QuickOrderHistory
)

quick_trading_bp = Blueprint('quick_trading', __name__)


# ==================== TRADING SETTINGS ====================

@quick_trading_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_trading_settings():
    """Get user's trading settings"""
    user_id = get_jwt_identity()

    settings = TradingSettings.get_or_create(user_id)
    return jsonify({'settings': settings.to_dict()})


@quick_trading_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_trading_settings():
    """Update user's trading settings"""
    user_id = get_jwt_identity()
    data = request.get_json()

    settings = TradingSettings.get_or_create(user_id)

    try:
        # One-Click Settings
        if 'one_click_enabled' in data:
            settings.one_click_enabled = data['one_click_enabled']
        if 'confirm_orders' in data:
            settings.confirm_orders = data['confirm_orders']

        # Lot Sizes
        if 'default_lot_size' in data:
            settings.default_lot_size = Decimal(str(data['default_lot_size']))
        if 'quick_lots' in data and len(data['quick_lots']) == 4:
            settings.quick_lot_1 = Decimal(str(data['quick_lots'][0]))
            settings.quick_lot_2 = Decimal(str(data['quick_lots'][1]))
            settings.quick_lot_3 = Decimal(str(data['quick_lots'][2]))
            settings.quick_lot_4 = Decimal(str(data['quick_lots'][3]))

        # Stop Loss Settings
        if 'default_sl' in data:
            sl = data['default_sl']
            if 'enabled' in sl:
                settings.default_sl_enabled = sl['enabled']
            if 'type' in sl:
                settings.default_sl_type = sl['type']
            if 'value' in sl:
                settings.default_sl_value = Decimal(str(sl['value']))

        # Take Profit Settings
        if 'default_tp' in data:
            tp = data['default_tp']
            if 'enabled' in tp:
                settings.default_tp_enabled = tp['enabled']
            if 'type' in tp:
                settings.default_tp_type = tp['type']
            if 'value' in tp:
                settings.default_tp_value = Decimal(str(tp['value']))

        # Risk Management
        if 'risk_management' in data:
            rm = data['risk_management']
            if 'max_lot_size' in rm:
                settings.max_lot_size = Decimal(str(rm['max_lot_size']))
            if 'risk_percent_per_trade' in rm:
                settings.risk_percent_per_trade = Decimal(str(rm['risk_percent_per_trade']))
            if 'use_risk_based_sizing' in rm:
                settings.use_risk_based_sizing = rm['use_risk_based_sizing']

        # Hotkeys
        if 'hotkeys' in data:
            hk = data['hotkeys']
            if 'enabled' in hk:
                settings.hotkeys_enabled = hk['enabled']
            if 'buy' in hk:
                settings.hotkey_buy = hk['buy'].upper()
            if 'sell' in hk:
                settings.hotkey_sell = hk['sell'].upper()
            if 'close_all' in hk:
                settings.hotkey_close_all = hk['close_all'].upper()
            if 'cancel_orders' in hk:
                settings.hotkey_cancel_orders = hk['cancel_orders'].upper()

        # Sounds
        if 'sounds' in data:
            snd = data['sounds']
            if 'on_execution' in snd:
                settings.sound_on_execution = snd['on_execution']
            if 'on_tp_hit' in snd:
                settings.sound_on_tp_hit = snd['on_tp_hit']
            if 'on_sl_hit' in snd:
                settings.sound_on_sl_hit = snd['on_sl_hit']

        # Favorite Symbols
        if 'favorite_symbols' in data:
            settings.favorite_symbols = data['favorite_symbols']

        # Display
        if 'display' in data:
            disp = data['display']
            if 'show_profit_in_pips' in disp:
                settings.show_profit_in_pips = disp['show_profit_in_pips']
            if 'show_profit_in_currency' in disp:
                settings.show_profit_in_currency = disp['show_profit_in_currency']

        db.session.commit()

        return jsonify({
            'message': 'Settings updated successfully',
            'settings': settings.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== QUICK ORDER EXECUTION ====================

@quick_trading_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute_quick_order():
    """
    Execute a one-click/quick order
    Fast market order with optional SL/TP from settings
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    start_time = time.time()

    # Validate required fields
    if 'symbol' not in data or 'side' not in data:
        return jsonify({'error': 'Symbol and side are required'}), 400

    side = data['side'].lower()
    if side not in ['buy', 'sell']:
        return jsonify({'error': 'Side must be buy or sell'}), 400

    # Get user and active challenge
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    # Get trading settings
    settings = TradingSettings.get_or_create(user_id)

    try:
        # Determine lot size
        lot_size = data.get('lot_size')
        if lot_size is None:
            lot_size = float(settings.default_lot_size)
        else:
            lot_size = float(lot_size)

        # Validate lot size
        if lot_size > float(settings.max_lot_size):
            return jsonify({'error': f'Lot size exceeds maximum ({settings.max_lot_size})'}), 400

        if lot_size < 0.01:
            return jsonify({'error': 'Minimum lot size is 0.01'}), 400

        # Get current price (in real system, this would come from market data)
        # For now, use provided price or simulate
        current_price = data.get('price')
        if not current_price:
            # In production, fetch from market data service
            current_price = 1.08500  # Placeholder

        current_price = Decimal(str(current_price))

        # Calculate SL/TP if enabled
        stop_loss = None
        take_profit = None
        pip_value = Decimal('0.0001')  # Standard forex pip

        if data.get('stop_loss'):
            stop_loss = Decimal(str(data['stop_loss']))
        elif settings.default_sl_enabled:
            sl_distance = settings.default_sl_value * pip_value
            if side == 'buy':
                stop_loss = current_price - sl_distance
            else:
                stop_loss = current_price + sl_distance

        if data.get('take_profit'):
            take_profit = Decimal(str(data['take_profit']))
        elif settings.default_tp_enabled:
            tp_distance = settings.default_tp_value * pip_value
            if side == 'buy':
                take_profit = current_price + tp_distance
            else:
                take_profit = current_price - tp_distance

        # Create the trade
        trade = Trade(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            trade_type=side,
            lot_size=Decimal(str(lot_size)),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            status='open',
            opened_at=datetime.utcnow()
        )

        db.session.add(trade)

        # Calculate execution time
        execution_time_ms = int((time.time() - start_time) * 1000)

        # Log quick order
        quick_order = QuickOrderHistory(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            side=side,
            lot_size=Decimal(str(lot_size)),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            execution_time_ms=execution_time_ms,
            executed_via=data.get('executed_via', 'one_click')
        )

        db.session.add(quick_order)
        db.session.commit()

        return jsonify({
            'message': 'Order executed successfully',
            'trade': {
                'id': trade.id,
                'symbol': trade.symbol,
                'side': trade.trade_type,
                'lot_size': float(trade.lot_size),
                'entry_price': float(trade.entry_price),
                'stop_loss': float(trade.stop_loss) if trade.stop_loss else None,
                'take_profit': float(trade.take_profit) if trade.take_profit else None
            },
            'execution_time_ms': execution_time_ms
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quick_trading_bp.route('/close-all', methods=['POST'])
@jwt_required()
def close_all_positions():
    """Close all open positions (one-click close all)"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    try:
        # Get all open trades (Trade model only has challenge_id, not user_id)
        query = Trade.query.filter_by(
            challenge_id=challenge.id,
            status='open'
        )

        # Optionally filter by symbol
        if data.get('symbol'):
            query = query.filter_by(symbol=data['symbol'].upper())

        open_trades = query.all()

        if not open_trades:
            return jsonify({'message': 'No open positions to close', 'closed_count': 0})

        closed_count = 0
        total_profit = Decimal('0')
        errors = []

        for trade in open_trades:
            try:
                # Get current market price for proper closing
                from services.yfinance_service import get_current_price
                current_price = get_current_price(trade.symbol)

                if current_price is None:
                    # Fallback to entry price if market price unavailable
                    current_price = float(trade.entry_price)
                    errors.append(f"Price unavailable for {trade.symbol}, using entry price")

                # Use the Trade model's close_trade method for consistent PnL calculation
                pnl = trade.close_trade(current_price)
                total_profit += Decimal(str(pnl))
                closed_count += 1
            except Exception as e:
                errors.append(f"Failed to close {trade.symbol}: {str(e)}")

        # Update challenge balance
        challenge.current_balance = challenge.current_balance + total_profit
        if challenge.current_balance > challenge.highest_balance:
            challenge.highest_balance = challenge.current_balance

        db.session.commit()

        return jsonify({
            'message': f'Closed {closed_count} positions',
            'closed_count': closed_count,
            'total_profit': float(total_profit),
            'new_balance': float(challenge.current_balance),
            'errors': errors if errors else None
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quick_trading_bp.route('/reverse', methods=['POST'])
@jwt_required()
def reverse_position():
    """Reverse a position (close and open opposite)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'symbol' not in data:
        return jsonify({'error': 'Symbol is required'}), 400

    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 400

    try:
        # Find existing position for symbol
        existing_trade = Trade.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            status='open'
        ).first()

        if not existing_trade:
            return jsonify({'error': 'No open position found for this symbol'}), 404

        # Close existing position
        close_price = Decimal(str(data.get('price', existing_trade.entry_price)))

        if existing_trade.trade_type == 'buy':
            profit = (close_price - existing_trade.entry_price) * existing_trade.lot_size * 100000
            new_side = 'sell'
        else:
            profit = (existing_trade.entry_price - close_price) * existing_trade.lot_size * 100000
            new_side = 'buy'

        existing_trade.exit_price = close_price
        existing_trade.profit_loss = profit
        existing_trade.status = 'closed'
        existing_trade.closed_at = datetime.utcnow()

        # Get settings for new position
        settings = TradingSettings.get_or_create(user_id)

        # Calculate SL/TP for new position
        pip_value = Decimal('0.0001')
        stop_loss = None
        take_profit = None

        if settings.default_sl_enabled:
            sl_distance = settings.default_sl_value * pip_value
            if new_side == 'buy':
                stop_loss = close_price - sl_distance
            else:
                stop_loss = close_price + sl_distance

        if settings.default_tp_enabled:
            tp_distance = settings.default_tp_value * pip_value
            if new_side == 'buy':
                take_profit = close_price + tp_distance
            else:
                take_profit = close_price - tp_distance

        # Open new position in opposite direction
        new_trade = Trade(
            user_id=user_id,
            challenge_id=challenge.id,
            symbol=data['symbol'].upper(),
            trade_type=new_side,
            lot_size=data.get('lot_size', existing_trade.lot_size),
            entry_price=close_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            status='open',
            opened_at=datetime.utcnow()
        )

        db.session.add(new_trade)
        db.session.commit()

        return jsonify({
            'message': 'Position reversed successfully',
            'closed_trade': {
                'id': existing_trade.id,
                'profit_loss': float(profit)
            },
            'new_trade': {
                'id': new_trade.id,
                'symbol': new_trade.symbol,
                'side': new_trade.trade_type,
                'lot_size': float(new_trade.lot_size),
                'entry_price': float(new_trade.entry_price)
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== QUICK ORDER HISTORY ====================

@quick_trading_bp.route('/history', methods=['GET'])
@jwt_required()
def get_quick_order_history():
    """Get one-click order execution history"""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    symbol = request.args.get('symbol')

    query = QuickOrderHistory.query.filter_by(user_id=user_id)

    if symbol:
        query = query.filter_by(symbol=symbol.upper())

    orders = query.order_by(QuickOrderHistory.created_at.desc()).limit(limit).all()

    return jsonify({
        'orders': [o.to_dict() for o in orders],
        'count': len(orders)
    })


@quick_trading_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_quick_trading_stats():
    """Get statistics for one-click trading"""
    user_id = get_jwt_identity()

    # Total quick orders
    total_orders = QuickOrderHistory.query.filter_by(user_id=user_id).count()

    # Average execution time
    from sqlalchemy import func
    avg_execution = db.session.query(
        func.avg(QuickOrderHistory.execution_time_ms)
    ).filter_by(user_id=user_id).scalar() or 0

    # Orders by side
    buy_orders = QuickOrderHistory.query.filter_by(user_id=user_id, side='buy').count()
    sell_orders = QuickOrderHistory.query.filter_by(user_id=user_id, side='sell').count()

    # Orders by symbol (top 5)
    top_symbols = db.session.query(
        QuickOrderHistory.symbol,
        func.count(QuickOrderHistory.id).label('count')
    ).filter_by(user_id=user_id).group_by(
        QuickOrderHistory.symbol
    ).order_by(func.count(QuickOrderHistory.id).desc()).limit(5).all()

    return jsonify({
        'total_orders': total_orders,
        'avg_execution_time_ms': round(float(avg_execution), 2),
        'orders_by_side': {
            'buy': buy_orders,
            'sell': sell_orders
        },
        'top_symbols': [{'symbol': s[0], 'count': s[1]} for s in top_symbols]
    })


# ==================== FAVORITE SYMBOLS ====================

@quick_trading_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorite_symbols():
    """Get user's favorite symbols for quick trading"""
    user_id = get_jwt_identity()
    settings = TradingSettings.get_or_create(user_id)
    return jsonify({'favorites': settings.favorite_symbols or []})


@quick_trading_bp.route('/favorites', methods=['PUT'])
@jwt_required()
def update_favorite_symbols():
    """Update user's favorite symbols"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'symbols' not in data:
        return jsonify({'error': 'Symbols list is required'}), 400

    settings = TradingSettings.get_or_create(user_id)
    settings.favorite_symbols = [s.upper() for s in data['symbols']]
    db.session.commit()

    return jsonify({
        'message': 'Favorites updated',
        'favorites': settings.favorite_symbols
    })


@quick_trading_bp.route('/favorites/add', methods=['POST'])
@jwt_required()
def add_favorite_symbol():
    """Add a symbol to favorites"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'symbol' not in data:
        return jsonify({'error': 'Symbol is required'}), 400

    settings = TradingSettings.get_or_create(user_id)

    if settings.favorite_symbols is None:
        settings.favorite_symbols = []

    symbol = data['symbol'].upper()
    if symbol not in settings.favorite_symbols:
        settings.favorite_symbols = settings.favorite_symbols + [symbol]
        db.session.commit()

    return jsonify({
        'message': f'{symbol} added to favorites',
        'favorites': settings.favorite_symbols
    })


@quick_trading_bp.route('/favorites/remove', methods=['POST'])
@jwt_required()
def remove_favorite_symbol():
    """Remove a symbol from favorites"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'symbol' not in data:
        return jsonify({'error': 'Symbol is required'}), 400

    settings = TradingSettings.get_or_create(user_id)

    if settings.favorite_symbols:
        symbol = data['symbol'].upper()
        settings.favorite_symbols = [s for s in settings.favorite_symbols if s != symbol]
        db.session.commit()

    return jsonify({
        'message': 'Symbol removed from favorites',
        'favorites': settings.favorite_symbols or []
    })
