from flask import request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
import pytz
from . import market_data_bp
from services.yfinance_service import (
    get_current_price,
    get_stock_info,
    get_historical_data,
    get_multiple_prices
)
from services.market_scraper import get_moroccan_stocks
from services.gemini_signals import get_ai_signal


def get_market_status():
    """Get current market status for different exchanges"""
    now = datetime.now()

    # US Market (NYSE/NASDAQ) - EST timezone
    try:
        est = pytz.timezone('America/New_York')
        us_time = datetime.now(est)
        us_hour = us_time.hour
        us_minute = us_time.minute
        us_weekday = us_time.weekday()

        # Market open: 9:30 AM - 4:00 PM EST, Mon-Fri
        if us_weekday < 5:  # Monday to Friday
            if (us_hour == 9 and us_minute >= 30) or (10 <= us_hour < 16):
                us_status = 'open'
            elif us_hour < 9 or (us_hour == 9 and us_minute < 30):
                us_status = 'pre-market'
            elif 16 <= us_hour < 20:
                us_status = 'after-hours'
            else:
                us_status = 'closed'
        else:
            us_status = 'closed'
    except Exception:
        us_status = 'unknown'

    # Crypto - 24/7
    crypto_status = 'open'

    # Morocco (Casablanca Stock Exchange) - WET/WEST timezone
    try:
        morocco_tz = pytz.timezone('Africa/Casablanca')
        morocco_time = datetime.now(morocco_tz)
        morocco_hour = morocco_time.hour
        morocco_weekday = morocco_time.weekday()

        # Market open: 9:30 AM - 3:30 PM, Mon-Fri
        if morocco_weekday < 5:
            if (morocco_hour == 9 and morocco_time.minute >= 30) or (10 <= morocco_hour < 15) or (morocco_hour == 15 and morocco_time.minute <= 30):
                morocco_status = 'open'
            else:
                morocco_status = 'closed'
        else:
            morocco_status = 'closed'
    except Exception:
        morocco_status = 'unknown'

    return {
        'us': {'status': us_status, 'exchange': 'NYSE/NASDAQ'},
        'crypto': {'status': crypto_status, 'exchange': '24/7'},
        'morocco': {'status': morocco_status, 'exchange': 'Casablanca SE'},
        'timestamp': now.isoformat()
    }


# International stocks (US markets)
SUPPORTED_US_STOCKS = [
    # Tech Giants
    'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA',
    # More Tech
    'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL',
    # Finance
    'JPM', 'BAC', 'GS', 'V', 'MA',
    # Healthcare
    'JNJ', 'PFE', 'UNH',
    # Energy
    'XOM', 'CVX',
    # Consumer
    'WMT', 'KO', 'PEP', 'MCD', 'NKE', 'DIS'
]

# Cryptocurrencies
SUPPORTED_CRYPTO = [
    'BTC-USD', 'ETH-USD', 'XRP-USD', 'SOL-USD', 'ADA-USD',
    'DOGE-USD', 'DOT-USD', 'LINK-USD', 'AVAX-USD',
    'SHIB-USD', 'LTC-USD', 'UNI-USD', 'ATOM-USD', 'XLM-USD'
]

# Combined international list
SUPPORTED_INTERNATIONAL = SUPPORTED_US_STOCKS + SUPPORTED_CRYPTO

# Moroccan stocks (Casablanca Stock Exchange)
SUPPORTED_MOROCCAN = [
    # Banks
    'IAM', 'ATW', 'BCP', 'CIH', 'BOA', 'CDM', 'BMCI',
    # Insurance
    'WAA', 'SAH', 'ATL',
    # Energy & Mining
    'TAQA', 'MNG', 'CMT', 'SMI',
    # Real Estate
    'ADH', 'RDS', 'DLM',
    # Industry
    'LBV', 'SNA', 'HOL', 'NEX', 'JET',
    # Telecom & Tech
    'HPS', 'M2M', 'DIS',
    # Consumer
    'LES', 'SID', 'OUL', 'MUT'
]


@market_data_bp.route('/price/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get current price for a symbol"""
    symbol = symbol.upper()

    # Check if Moroccan stock
    if symbol in SUPPORTED_MOROCCAN:
        moroccan_data = get_moroccan_stocks()
        if symbol in moroccan_data:
            return jsonify({
                'symbol': symbol,
                'price': moroccan_data[symbol]['price'],
                'change': moroccan_data[symbol].get('change', 0),
                'change_percent': moroccan_data[symbol].get('change_percent', 0),
                'market': 'MOROCCO'
            }), 200
        return jsonify({'error': f'Moroccan stock {symbol} not found'}), 404

    # International stock
    price = get_current_price(symbol)
    if price is None:
        return jsonify({'error': f'Could not get price for {symbol}'}), 404

    info = get_stock_info(symbol)

    return jsonify({
        'symbol': symbol,
        'price': price,
        'change': info.get('change', 0),
        'change_percent': info.get('change_percent', 0),
        'market': 'US' if not symbol.endswith('-USD') else 'CRYPTO'
    }), 200


@market_data_bp.route('/prices', methods=['GET'])
def get_all_prices():
    """Get prices for all supported symbols"""
    # Get category filter from query params
    category = request.args.get('category', 'all')

    result = {
        'supported_symbols': {
            'us_stocks': SUPPORTED_US_STOCKS,
            'crypto': SUPPORTED_CRYPTO,
            'moroccan': SUPPORTED_MOROCCAN
        }
    }

    if category in ['all', 'us']:
        result['us_stocks'] = get_multiple_prices(SUPPORTED_US_STOCKS)

    if category in ['all', 'crypto']:
        result['crypto'] = get_multiple_prices(SUPPORTED_CRYPTO)

    if category in ['all', 'moroccan']:
        result['moroccan'] = get_moroccan_stocks()

    # Keep backward compatibility
    if category == 'all':
        result['international'] = {**result.get('us_stocks', {}), **result.get('crypto', {})}

    return jsonify(result), 200


@market_data_bp.route('/history/<symbol>', methods=['GET'])
@jwt_required()
def get_history(symbol):
    """Get historical data for a symbol"""
    symbol = symbol.upper()
    period = request.args.get('period', '1mo')  # 1d, 5d, 1mo, 3mo, 6mo, 1y
    interval = request.args.get('interval', '1d')  # 1m, 5m, 15m, 1h, 1d

    if symbol in SUPPORTED_MOROCCAN:
        return jsonify({
            'error': 'Historical data not available for Moroccan stocks'
        }), 400

    data = get_historical_data(symbol, period, interval)

    if not data:
        return jsonify({'error': f'Could not get history for {symbol}'}), 404

    return jsonify({
        'symbol': symbol,
        'period': period,
        'interval': interval,
        'data': data
    }), 200


@market_data_bp.route('/status', methods=['GET'])
def market_status():
    """Get current market status for all exchanges"""
    return jsonify(get_market_status()), 200


@market_data_bp.route('/signal/<symbol>', methods=['GET'])
def get_signal(symbol):
    """Get AI trading signal for a symbol"""
    symbol = symbol.upper()

    # Get current price and info
    if symbol in SUPPORTED_MOROCCAN:
        moroccan_data = get_moroccan_stocks()
        if symbol not in moroccan_data:
            return jsonify({'error': f'Symbol {symbol} not found'}), 404
        price = moroccan_data[symbol]['price']
        change_percent = moroccan_data[symbol].get('change_percent', 0)
    else:
        price = get_current_price(symbol)
        if price is None:
            return jsonify({'error': f'Could not get price for {symbol}'}), 404
        info = get_stock_info(symbol)
        change_percent = info.get('change_percent', 0)

    # Get AI signal
    signal = get_ai_signal(symbol, price, change_percent)

    return jsonify({
        'symbol': symbol,
        'current_price': price,
        'change_percent': change_percent,
        'signal': signal
    }), 200


@market_data_bp.route('/signals', methods=['GET'])
def get_all_signals():
    """Get AI signals for multiple symbols"""
    symbols = request.args.get('symbols', '')

    if not symbols:
        # Default to top symbols
        symbols = ['AAPL', 'TSLA', 'BTC-USD', 'IAM', 'ATW']
    else:
        symbols = [s.strip().upper() for s in symbols.split(',')]

    signals = []
    moroccan_data = get_moroccan_stocks()

    for symbol in symbols:
        try:
            if symbol in SUPPORTED_MOROCCAN:
                if symbol in moroccan_data:
                    price = moroccan_data[symbol]['price']
                    change_percent = moroccan_data[symbol].get('change_percent', 0)
                else:
                    continue
            else:
                price = get_current_price(symbol)
                if price is None:
                    continue
                info = get_stock_info(symbol)
                change_percent = info.get('change_percent', 0)

            signal = get_ai_signal(symbol, price, change_percent)
            signals.append({
                'symbol': symbol,
                'price': price,
                'change_percent': change_percent,
                'signal': signal
            })
        except Exception as e:
            print(f"Error getting signal for {symbol}: {e}")
            continue

    return jsonify({'signals': signals}), 200
