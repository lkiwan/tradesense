"""
Forex API Routes - Currency pair data endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

forex_bp = Blueprint('forex', __name__, url_prefix='/api/forex')


def get_forex_provider():
    """Lazy load forex provider"""
    from services.market import get_forex_provider as get_provider
    return get_provider()


@forex_bp.route('/pairs', methods=['GET'])
@jwt_required()
def get_all_pairs():
    """
    Get all forex pairs with current prices.

    Query params:
        type: 'all', 'major', 'cross', 'mad', 'exotic'
    """
    pair_type = request.args.get('type', 'all')
    provider = get_forex_provider()

    if pair_type == 'all':
        pairs = provider.get_all_prices()
    else:
        pairs = provider.get_pairs_by_type(pair_type)

    return jsonify({
        'pairs': pairs,
        'count': len(pairs),
        'type': pair_type,
        'market_open': provider.is_market_open()
    }), 200


@forex_bp.route('/rates', methods=['GET'])
@jwt_required()
def get_rates():
    """
    Get simplified exchange rates for all pairs.

    Query params:
        base: Base currency for rates (default: USD)
    """
    base = request.args.get('base', 'USD').upper()
    provider = get_forex_provider()
    all_pairs = provider.get_all_prices()

    rates = {}
    for pair in all_pairs:
        symbol = pair['symbol']
        base_currency = pair.get('base', symbol.split('/')[0])
        quote_currency = pair.get('quote', symbol.split('/')[1])

        # Add both directions for flexibility
        if base_currency == base:
            rates[quote_currency] = pair['price']
        elif quote_currency == base:
            rates[base_currency] = round(1 / pair['price'], 6) if pair['price'] else None

    return jsonify({
        'status': 'success',
        'base': base,
        'rates': rates,
        'count': len(rates),
        'timestamp': all_pairs[0]['timestamp'] if all_pairs else None
    }), 200


@forex_bp.route('/pair/<symbol>', methods=['GET'])
@jwt_required()
def get_pair(symbol):
    """Get current price for a specific forex pair."""
    provider = get_forex_provider()
    price = provider.get_price(symbol)

    if not price:
        return jsonify({
            'error': f'Pair {symbol} not found'
        }), 404

    return jsonify(price), 200


@forex_bp.route('/pair/<symbol>/info', methods=['GET'])
@jwt_required()
def get_pair_info(symbol):
    """Get metadata about a forex pair."""
    provider = get_forex_provider()
    info = provider.get_symbol_info(symbol)

    if not info:
        return jsonify({
            'error': f'Pair {symbol} not found'
        }), 404

    return jsonify(info), 200


@forex_bp.route('/pair/<symbol>/history', methods=['GET'])
@jwt_required()
def get_pair_history(symbol):
    """
    Get historical data for a forex pair.

    Query params:
        period: '1w', '1mo', '3mo', '1y' (default '1mo')
    """
    period = request.args.get('period', '1mo')
    provider = get_forex_provider()

    history = provider.get_historical(symbol, period)

    if not history:
        return jsonify({
            'error': f'Historical data not available for {symbol}'
        }), 404

    return jsonify({
        'symbol': symbol.upper().replace('_', '/'),
        'period': period,
        'data': history,
        'count': len(history)
    }), 200


@forex_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_market_summary():
    """Get forex market summary with top gainers/losers."""
    provider = get_forex_provider()
    summary = provider.get_market_summary()

    return jsonify(summary), 200


@forex_bp.route('/mad', methods=['GET'])
@jwt_required()
def get_mad_pairs():
    """Get all MAD (Moroccan Dirham) pairs."""
    provider = get_forex_provider()
    pairs = provider.get_pairs_by_type('mad')

    return jsonify({
        'pairs': pairs,
        'count': len(pairs),
        'currency': 'MAD'
    }), 200


@forex_bp.route('/majors', methods=['GET'])
@jwt_required()
def get_major_pairs():
    """Get major forex pairs only."""
    provider = get_forex_provider()
    pairs = provider.get_pairs_by_type('major')

    return jsonify({
        'pairs': pairs,
        'count': len(pairs),
        'type': 'major'
    }), 200


@forex_bp.route('/convert', methods=['GET'])
@jwt_required()
def convert_currency():
    """
    Convert amount between currencies.

    Query params:
        from: Source currency (e.g., 'USD')
        to: Target currency (e.g., 'MAD')
        amount: Amount to convert (default 1)
    """
    from_currency = request.args.get('from', 'USD').upper()
    to_currency = request.args.get('to', 'MAD').upper()
    amount = request.args.get('amount', 1, type=float)

    provider = get_forex_provider()

    # Build the pair symbol
    pair = f'{from_currency}/{to_currency}'
    inverse_pair = f'{to_currency}/{from_currency}'

    price = provider.get_price(pair)
    if price:
        rate = price['price']
        converted = amount * rate
    else:
        # Try inverse pair
        price = provider.get_price(inverse_pair)
        if price:
            rate = 1 / price['price']
            converted = amount * rate
        else:
            return jsonify({
                'error': f'Conversion not available for {from_currency} to {to_currency}'
            }), 400

    return jsonify({
        'from': from_currency,
        'to': to_currency,
        'amount': amount,
        'rate': round(rate, 6),
        'converted': round(converted, 2),
        'timestamp': price['timestamp'] if price else None
    }), 200


@forex_bp.route('/symbols', methods=['GET'])
def get_available_symbols():
    """Get list of available forex pairs (public endpoint)."""
    provider = get_forex_provider()
    symbols = provider.get_symbols()

    pairs_info = []
    for symbol in symbols:
        info = provider.get_symbol_info(symbol)
        if info:
            pairs_info.append({
                'symbol': symbol,
                'name': info['name'],
                'type': info['type']
            })

    return jsonify({
        'symbols': pairs_info,
        'count': len(pairs_info)
    }), 200


@forex_bp.route('/status', methods=['GET'])
def get_market_status():
    """Get forex market status (public endpoint)."""
    provider = get_forex_provider()

    return jsonify({
        'market_open': provider.is_market_open(),
        'trading_hours': '24/5 (Sunday 5 PM - Friday 5 PM EST)',
        'timestamp': provider.get_market_summary()['timestamp']
    }), 200
