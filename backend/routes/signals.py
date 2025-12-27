"""
Enhanced Signals API Routes
Technical analysis, sentiment signals, and signal tracking
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

signals_bp = Blueprint('signals', __name__, url_prefix='/api/signals')


def get_services():
    """Lazy load services to avoid circular imports"""
    from services.signals import (
        get_technical_service,
        get_sentiment_service,
        get_signal_tracker
    )
    return {
        'technical': get_technical_service(),
        'sentiment': get_sentiment_service(),
        'tracker': get_signal_tracker()
    }


def get_price_history(symbol, limit=100):
    """Get historical prices for a symbol"""
    try:
        # Try to get from market data service
        from services.market_data import get_historical_prices
        prices = get_historical_prices(symbol, period='1mo')
        if prices:
            return [p['close'] for p in prices[-limit:]]
    except Exception:
        pass

    # Mock data for demo
    import random
    base_price = {
        'AAPL': 178.50, 'TSLA': 248.30, 'GOOGL': 142.80,
        'NVDA': 485.20, 'MSFT': 378.90, 'AMZN': 178.25,
        'META': 365.40, 'BTC-USD': 43500.00, 'ETH-USD': 2280.00,
        'SOL-USD': 98.50, 'IAM': 118.50, 'ATW': 485.00,
        'BCP': 265.00, 'CIH': 350.00
    }.get(symbol.upper(), 100.0)

    # Generate mock historical data
    prices = []
    current = base_price * 0.85
    for _ in range(limit):
        change = random.uniform(-0.02, 0.025)
        current = current * (1 + change)
        prices.append(round(current, 4))

    return prices


@signals_bp.route('/technical/<symbol>', methods=['GET'])
@jwt_required()
def get_technical_signal(symbol):
    """
    Get technical analysis signal for a symbol.

    Query params:
        period: Data period ('1w', '1mo', '3mo') - default '1mo'
    """
    services = get_services()
    prices = get_price_history(symbol.upper())

    if not prices or len(prices) < 26:
        return jsonify({
            'error': 'Insufficient price data',
            'symbol': symbol.upper()
        }), 400

    current_price = prices[-1]
    signal = services['technical'].get_signal_for_symbol(symbol.upper(), prices, current_price)

    return jsonify(signal), 200


@signals_bp.route('/sentiment/<symbol>', methods=['GET'])
@jwt_required()
def get_sentiment_signal(symbol):
    """Get sentiment-based signal for a symbol."""
    services = get_services()
    sentiment = services['sentiment'].get_symbol_sentiment(symbol.upper())

    return jsonify(sentiment), 200


@signals_bp.route('/combined/<symbol>', methods=['GET'])
@jwt_required()
def get_combined_signal(symbol):
    """Get combined technical + sentiment signal for a symbol."""
    services = get_services()
    prices = get_price_history(symbol.upper())

    combined = services['sentiment'].get_combined_signal(symbol.upper(), prices)

    return jsonify(combined), 200


@signals_bp.route('/market-sentiment', methods=['GET'])
@jwt_required()
def get_market_sentiment():
    """
    Get overall market sentiment.

    Query params:
        market: 'all', 'us', 'crypto', 'forex', 'moroccan'
    """
    market = request.args.get('market', 'all')
    services = get_services()
    sentiment = services['sentiment'].get_market_sentiment(market)

    return jsonify(sentiment), 200


@signals_bp.route('/indicators/<symbol>', methods=['GET'])
@jwt_required()
def get_indicators(symbol):
    """
    Get all technical indicators for a symbol.
    Returns RSI, MACD, Bollinger Bands, Moving Averages, Support/Resistance.
    """
    services = get_services()
    prices = get_price_history(symbol.upper())

    if not prices or len(prices) < 26:
        return jsonify({
            'error': 'Insufficient price data',
            'symbol': symbol.upper()
        }), 400

    tech = services['technical']

    indicators = {
        'symbol': symbol.upper(),
        'current_price': prices[-1],
        'rsi': tech.calculate_rsi(prices),
        'macd': tech.calculate_macd(prices),
        'bollinger': tech.calculate_bollinger_bands(prices),
        'moving_averages': tech.calculate_moving_averages(prices),
        'support_resistance': tech.calculate_support_resistance(prices)
    }

    return jsonify(indicators), 200


@signals_bp.route('/batch', methods=['POST'])
@jwt_required()
def get_batch_signals():
    """
    Get signals for multiple symbols at once.

    Request body:
        {"symbols": ["AAPL", "TSLA", "BTC-USD"]}
    """
    data = request.get_json()
    symbols = data.get('symbols', [])

    if not symbols or len(symbols) > 20:
        return jsonify({
            'error': 'Provide 1-20 symbols'
        }), 400

    services = get_services()
    results = []

    for symbol in symbols:
        prices = get_price_history(symbol.upper())
        if prices and len(prices) >= 26:
            signal = services['technical'].get_signal_for_symbol(
                symbol.upper(), prices, prices[-1]
            )
            results.append(signal)
        else:
            results.append({
                'symbol': symbol.upper(),
                'error': 'Insufficient data'
            })

    return jsonify({
        'signals': results,
        'count': len(results)
    }), 200


# Signal History Endpoints

@signals_bp.route('/history', methods=['GET'])
@jwt_required()
def get_signal_history():
    """
    Get signal history.

    Query params:
        limit: Max signals (default 20)
        status: Filter by status ('active', 'hit_tp', 'hit_sl', 'expired')
        symbol: Filter by symbol
    """
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    symbol = request.args.get('symbol')

    services = get_services()
    signals = services['tracker'].get_recent_signals(
        limit=limit,
        status=status,
        symbol=symbol,
        user_id=int(user_id) if user_id else None
    )

    return jsonify({
        'signals': signals,
        'count': len(signals)
    }), 200


@signals_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_signals():
    """Get all active (open) signals."""
    user_id = get_jwt_identity()
    services = get_services()
    signals = services['tracker'].get_active_signals(
        user_id=int(user_id) if user_id else None
    )

    return jsonify({
        'signals': signals,
        'count': len(signals)
    }), 200


@signals_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_signal_stats():
    """
    Get signal performance statistics.

    Query params:
        days: Period in days (default 30)
    """
    user_id = get_jwt_identity()
    days = request.args.get('days', 30, type=int)

    services = get_services()
    stats = services['tracker'].get_performance_stats(
        user_id=int(user_id) if user_id else None,
        days=days
    )

    return jsonify(stats), 200


@signals_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_signal_leaderboard():
    """
    Get top performing signals.

    Query params:
        days: Period in days (default 30)
        limit: Max signals (default 10)
    """
    days = request.args.get('days', 30, type=int)
    limit = request.args.get('limit', 10, type=int)

    services = get_services()
    leaderboard = services['tracker'].get_signal_leaderboard(days=days, limit=limit)

    return jsonify({
        'leaderboard': leaderboard,
        'period_days': days
    }), 200


@signals_bp.route('/record', methods=['POST'])
@jwt_required()
def record_signal():
    """
    Record a new trading signal.

    Request body:
        {
            "symbol": "AAPL",
            "signal_type": "BUY",
            "entry_price": 178.50,
            "stop_loss": 170.00,
            "take_profit": 195.00,
            "confidence": 85,
            "source": "technical",
            "reasons": ["RSI oversold", "MACD bullish"]
        }
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ['symbol', 'signal_type', 'entry_price']
    if not all(k in data for k in required):
        return jsonify({
            'error': 'Missing required fields: symbol, signal_type, entry_price'
        }), 400

    services = get_services()
    signal = services['tracker'].record_signal(
        symbol=data['symbol'],
        signal_type=data['signal_type'],
        entry_price=data['entry_price'],
        stop_loss=data.get('stop_loss'),
        take_profit=data.get('take_profit'),
        confidence=data.get('confidence', 50),
        source=data.get('source', 'manual'),
        reasons=data.get('reasons', []),
        user_id=int(user_id) if user_id else None
    )

    return jsonify(signal), 201


@signals_bp.route('/<int:signal_id>/update', methods=['PUT'])
@jwt_required()
def update_signal(signal_id):
    """
    Update signal outcome.

    Request body:
        {
            "current_price": 185.50,
            "status": "hit_tp" (optional, auto-detected if not provided)
        }
    """
    data = request.get_json()
    current_price = data.get('current_price')
    status = data.get('status')

    if not current_price:
        return jsonify({
            'error': 'current_price is required'
        }), 400

    services = get_services()
    result = services['tracker'].update_signal_outcome(
        signal_id=signal_id,
        current_price=current_price,
        status=status
    )

    if 'error' in result:
        return jsonify(result), 404

    return jsonify(result), 200


# Public endpoints (no auth required for demo)

@signals_bp.route('/demo/technical/<symbol>', methods=['GET'])
def demo_technical_signal(symbol):
    """Demo endpoint for technical signals (no auth)."""
    services = get_services()
    prices = get_price_history(symbol.upper())

    if not prices or len(prices) < 26:
        return jsonify({
            'error': 'Insufficient price data',
            'symbol': symbol.upper()
        }), 400

    signal = services['technical'].get_signal_for_symbol(
        symbol.upper(), prices, prices[-1]
    )
    signal['demo'] = True

    return jsonify(signal), 200


@signals_bp.route('/demo/indicators/<symbol>', methods=['GET'])
def demo_indicators(symbol):
    """Demo endpoint for indicators (no auth)."""
    services = get_services()
    prices = get_price_history(symbol.upper())

    if not prices or len(prices) < 26:
        return jsonify({
            'error': 'Insufficient price data',
            'symbol': symbol.upper()
        }), 400

    tech = services['technical']

    indicators = {
        'symbol': symbol.upper(),
        'current_price': prices[-1],
        'rsi': tech.calculate_rsi(prices),
        'macd': tech.calculate_macd(prices),
        'bollinger': tech.calculate_bollinger_bands(prices),
        'moving_averages': tech.calculate_moving_averages(prices),
        'demo': True
    }

    return jsonify(indicators), 200
