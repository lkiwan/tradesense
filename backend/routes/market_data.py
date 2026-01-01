from flask import request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
import pytz
import logging
from . import market_data_bp
from services.yfinance_service import (
    get_current_price,
    get_stock_info,
    get_historical_data,
    get_multiple_prices,
    get_live_price_data
)
from services.market_scraper import get_moroccan_stocks  # Legacy import for backward compatibility
from services.market.moroccan_provider import get_moroccan_provider, MOROCCAN_STOCKS
from services.gemini_signals import get_ai_signal
from services.cache_service import CacheService, cache

logger = logging.getLogger(__name__)

# Initialize enhanced Moroccan market provider
moroccan_provider = get_moroccan_provider()


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

# Moroccan stocks (Casablanca Stock Exchange) - Now using 78 stocks from MoroccanMarketProvider
SUPPORTED_MOROCCAN = list(MOROCCAN_STOCKS.keys())


@market_data_bp.route('/price/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get current price for a symbol (cached for 30 seconds)"""
    symbol = symbol.upper()
    cache_key = CacheService.market_key(symbol)

    # Try cache first
    cached_data = CacheService.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for price: {symbol}")
        return jsonify(cached_data), 200

    # Try live prices from background updater FIRST (includes Moroccan from Casablanca Bourse)
    live_data = get_live_price_data(symbol)
    if live_data:
        result = {
            'symbol': symbol,
            'name': MOROCCAN_STOCKS.get(symbol, {}).get('name', symbol) if symbol in SUPPORTED_MOROCCAN else symbol,
            'price': live_data.get('price'),
            'change': 0,
            'change_percent': live_data.get('change_percent', 0),
            'volume': 0,
            'currency': 'MAD' if symbol in SUPPORTED_MOROCCAN else 'USD',
            'market': 'MOROCCO' if symbol in SUPPORTED_MOROCCAN else 'US',
            'source': 'casablanca_bourse' if symbol in SUPPORTED_MOROCCAN else 'live',
            'timestamp': datetime.now().isoformat()
        }
        CacheService.set(cache_key, result, timeout=15)
        logger.info(f"Live price for {symbol}: {result['price']}")
        return jsonify(result), 200

    # Fallback: Check if Moroccan stock - use enhanced provider (mock data)
    # NOTE: We do NOT cache mock data to avoid race conditions on startup
    if symbol in SUPPORTED_MOROCCAN:
        price_data = moroccan_provider.get_price(symbol)
        if price_data:
            result = {
                'symbol': symbol,
                'name': price_data.get('name', symbol),
                'price': price_data['price'],
                'change': price_data.get('change', 0),
                'change_percent': price_data.get('change_percent', 0),
                'volume': price_data.get('volume', 0),
                'open': price_data.get('open', 0),
                'high': price_data.get('high', 0),
                'low': price_data.get('low', 0),
                'sector': price_data.get('sector', ''),
                'currency': 'MAD',
                'market': 'MOROCCO',
                'source': price_data.get('source', 'unknown'),
                'timestamp': price_data.get('timestamp', '')
            }
            # Do NOT cache mock data - real prices will be available shortly
            return jsonify(result), 200
        return jsonify({'error': f'Moroccan stock {symbol} not found'}), 404

    # International stock
    price = get_current_price(symbol)
    if price is None:
        return jsonify({'error': f'Could not get price for {symbol}'}), 404

    info = get_stock_info(symbol)

    result = {
        'symbol': symbol,
        'price': price,
        'change': info.get('change', 0),
        'change_percent': info.get('change_percent', 0),
        'market': 'US' if not symbol.endswith('-USD') else 'CRYPTO'
    }
    CacheService.set(cache_key, result, timeout=CacheService.TTL['market_prices'])
    return jsonify(result), 200


@market_data_bp.route('/prices', methods=['GET'])
def get_all_prices():
    """Get prices for all supported symbols"""
    # Get category filter from query params
    category = request.args.get('category', 'all')
    sector = request.args.get('sector', None)  # Optional sector filter for Moroccan stocks

    result = {
        'supported_symbols': {
            'us_stocks': SUPPORTED_US_STOCKS,
            'crypto': SUPPORTED_CRYPTO,
            'moroccan': SUPPORTED_MOROCCAN
        },
        'moroccan_sectors': moroccan_provider.get_sectors()
    }

    if category in ['all', 'us']:
        result['us_stocks'] = get_multiple_prices(SUPPORTED_US_STOCKS)

    if category in ['all', 'crypto']:
        result['crypto'] = get_multiple_prices(SUPPORTED_CRYPTO)

    if category in ['all', 'moroccan']:
        # Use enhanced provider for Moroccan stocks
        all_moroccan = moroccan_provider.get_all_prices()

        # Filter by sector if specified
        if sector:
            all_moroccan = [p for p in all_moroccan if p.get('sector', '').lower() == sector.lower()]

        # Convert to dictionary format for backward compatibility
        moroccan_dict = {}
        for stock in all_moroccan:
            moroccan_dict[stock['symbol']] = stock
        result['moroccan'] = moroccan_dict
        result['moroccan_list'] = all_moroccan  # Also provide as list for easier frontend iteration

    # Keep backward compatibility
    if category == 'all':
        result['international'] = {**result.get('us_stocks', {}), **result.get('crypto', {})}

    return jsonify(result), 200


@market_data_bp.route('/moroccan/sectors', methods=['GET'])
def get_moroccan_sectors():
    """Get all available sectors for Moroccan stocks"""
    sectors = moroccan_provider.get_sectors()
    sector_stocks = {}
    for sector in sectors:
        sector_stocks[sector] = moroccan_provider.get_stocks_by_sector(sector)

    return jsonify({
        'sectors': sectors,
        'sector_stocks': sector_stocks,
        'total_stocks': len(SUPPORTED_MOROCCAN)
    }), 200


@market_data_bp.route('/moroccan/info/<symbol>', methods=['GET'])
def get_moroccan_info(symbol):
    """Get detailed info for a Moroccan stock"""
    symbol = symbol.upper()
    info = moroccan_provider.get_symbol_info(symbol)
    if not info:
        return jsonify({'error': f'Symbol {symbol} not found'}), 404
    return jsonify(info), 200


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
        price_data = moroccan_provider.get_price(symbol)
        if not price_data:
            return jsonify({'error': f'Symbol {symbol} not found'}), 404
        price = price_data['price']
        change_percent = price_data.get('change_percent', 0)
        name = price_data.get('name', symbol)
    else:
        price = get_current_price(symbol)
        if price is None:
            return jsonify({'error': f'Could not get price for {symbol}'}), 404
        info = get_stock_info(symbol)
        change_percent = info.get('change_percent', 0)
        name = info.get('name', symbol)

    # Get AI signal
    signal = get_ai_signal(symbol, price, change_percent)

    return jsonify({
        'symbol': symbol,
        'name': name,
        'current_price': price,
        'change_percent': change_percent,
        'signal': signal
    }), 200


@market_data_bp.route('/signals', methods=['GET'])
def get_all_signals():
    """Get AI signals for multiple symbols (cached for 30 seconds)"""
    from services.yfinance_service import get_live_price_data

    symbols = request.args.get('symbols', '')
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'

    if not symbols:
        # Default to top symbols including more Moroccan stocks
        symbols_list = ['AAPL', 'TSLA', 'BTC-USD', 'IAM', 'ATW', 'BCP', 'HPS', 'TAQA']
    else:
        symbols_list = [s.strip().upper() for s in symbols.split(',')]

    # Create cache key from sorted symbols
    cache_key = f"signals:{','.join(sorted(symbols_list))}"

    # Try cache first (skip if force_refresh)
    if not force_refresh:
        cached_data = CacheService.get(cache_key)
        if cached_data:
            logger.debug(f"Cache hit for signals: {cache_key}")
            return jsonify(cached_data), 200

    signals = []

    for symbol in symbols_list:
        try:
            price = None
            change_percent = 0
            name = symbol

            # Try live prices from background updater FIRST (fast, includes Moroccan stocks)
            live_data = get_live_price_data(symbol)
            if live_data:
                price = live_data.get('price')
                change_percent = live_data.get('change_percent', 0)
                logger.info(f"Using live price for {symbol}: ${price}")

            # Fallback to moroccan_provider for Moroccan stocks if no live price
            if price is None and symbol in SUPPORTED_MOROCCAN:
                price_data = moroccan_provider.get_price(symbol)
                if price_data:
                    price = price_data['price']
                    change_percent = price_data.get('change_percent', 0)
                    name = price_data.get('name', symbol)

            # Skip symbols without live prices (don't fallback to slow yfinance)
            if price is None:
                logger.debug(f"Skipping {symbol} - no live price available")
                continue

            signal = get_ai_signal(symbol, price, change_percent, force_refresh=force_refresh)
            signals.append({
                'symbol': symbol,
                'name': name,
                'price': price,
                'change_percent': change_percent,
                'signal': signal
            })
        except Exception as e:
            logger.warning(f"Error getting signal for {symbol}: {e}")
            continue

    result = {'signals': signals}
    CacheService.set(cache_key, result, timeout=CacheService.TTL['market_signals'])
    return jsonify(result), 200
