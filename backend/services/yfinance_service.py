"""
Yahoo Finance Service
Fetches real-time stock and crypto prices from Yahoo Finance
"""

import yfinance as yf
from functools import lru_cache
from datetime import datetime, timedelta
import threading
import logging

logger = logging.getLogger(__name__)

# Check if eventlet is being used and get tpool for native thread execution
try:
    import eventlet
    from eventlet import tpool
    eventlet.monkey_patch(thread=False)  # Ensure threading works properly
    USE_TPOOL = True
except ImportError:
    USE_TPOOL = False

# Thread pool for timeout support
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
_executor = ThreadPoolExecutor(max_workers=5)

# Cache for prices (simple in-memory cache)
_price_cache = {}
_cache_lock = threading.Lock()
CACHE_DURATION = 3  # seconds (fast updates for real-time feel)
PRICE_FETCH_TIMEOUT = 10  # seconds - timeout for yfinance API calls

# Fallback prices when yfinance is unavailable (updated periodically)
FALLBACK_PRICES = {
    'BTCUSD': 95000.00,
    'BTC-USD': 95000.00,
    'ETHUSD': 3400.00,
    'ETH-USD': 3400.00,
    'EURUSD': 1.04,
    'EURUSD=X': 1.04,
    'GBPUSD': 1.25,
    'GBPUSD=X': 1.25,
    'USDJPY': 157.0,
    'USDJPY=X': 157.0,
    'XAUUSD': 2650.00,
    'GC=F': 2650.00,
    'XAGUSD': 30.00,
    'SI=F': 30.00,
    'AAPL': 250.00,
    'TSLA': 450.00,
    'NVDA': 140.00,
    'GOOGL': 195.00,
    'MSFT': 430.00,
    'US30': 43000.00,
    'US500': 6000.00,
    'NAS100': 21500.00,
}


def normalize_symbol(symbol: str) -> str:
    """
    Convert symbol to Yahoo Finance format
    """
    symbol = symbol.upper().strip()

    # Gold, Silver, Oil - CHECK FIRST before forex
    commodity_map = {
        'XAUUSD': 'GC=F',      # Gold futures
        'XAGUSD': 'SI=F',      # Silver futures
        'USOIL': 'CL=F',       # WTI Crude Oil
        'UKOIL': 'BZ=F',       # Brent Oil
    }
    if symbol in commodity_map:
        return commodity_map[symbol]

    # Crypto - CHECK BEFORE forex pattern
    crypto_map = {
        'BTC': 'BTC-USD', 'BTCUSD': 'BTC-USD',
        'ETH': 'ETH-USD', 'ETHUSD': 'ETH-USD',
        'XRP': 'XRP-USD', 'XRPUSD': 'XRP-USD',
        'SOL': 'SOL-USD', 'SOLUSD': 'SOL-USD',
        'BNB': 'BNB-USD', 'BNBUSD': 'BNB-USD',
        'ADA': 'ADA-USD', 'ADAUSD': 'ADA-USD',
        'DOGE': 'DOGE-USD', 'DOGEUSD': 'DOGE-USD',
        'DOT': 'DOT-USD', 'DOTUSD': 'DOT-USD',
    }
    if symbol in crypto_map:
        return crypto_map[symbol]

    # Indices
    index_map = {
        'US30': 'YM=F',        # Dow Jones futures
        'US500': 'ES=F',       # S&P 500 futures
        'NAS100': 'NQ=F',      # Nasdaq futures
        'GER40': '^GDAXI',     # DAX
        'UK100': '^FTSE',      # FTSE 100
    }
    if symbol in index_map:
        return index_map[symbol]

    # Forex pairs - add =X suffix
    forex_pairs = [
        'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
        'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF', 'GBPCHF', 'AUDCAD', 'AUDCHF',
        'AUDJPY', 'AUDNZD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD',
        'EURNZD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD', 'NZDCAD', 'NZDCHF',
        'NZDJPY', 'USDMAD', 'EURMAD', 'GBPMAD', 'MADCHF'
    ]
    if symbol in forex_pairs:
        return f"{symbol}=X"

    # Moroccan stocks (Casablanca) - Yahoo Finance uses .CS suffix
    moroccan_stocks = ['IAM', 'ATW', 'BCP', 'BOA', 'CIH', 'CDM', 'LBV', 'CMA',
                       'MNG', 'TQM', 'CSR', 'HPS', 'LHM', 'MSA', 'WAA', 'MASI']
    if symbol in moroccan_stocks:
        return f"{symbol}.CS"

    return symbol


def _fetch_price_from_yfinance(symbol: str) -> float | None:
    """
    Internal function to fetch price from Yahoo Finance.
    This runs in a native thread when eventlet is active.
    """
    price = None
    try:
        ticker = yf.Ticker(symbol)

        # Method 1: Try fast_info
        try:
            fast_info = ticker.fast_info
            if hasattr(fast_info, 'last_price'):
                price = fast_info.last_price
            elif hasattr(fast_info, 'lastPrice'):
                price = fast_info.lastPrice
            elif isinstance(fast_info, dict):
                price = fast_info.get('lastPrice') or fast_info.get('last_price')
        except (KeyError, AttributeError, TypeError):
            pass

        # Method 2: Try regular info if fast_info failed
        if price is None:
            try:
                info = ticker.info
                if info:
                    price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
            except (KeyError, AttributeError, TypeError):
                pass

        # Method 3: Fallback to history
        if price is None:
            try:
                hist = ticker.history(period='1d')
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
            except Exception:
                pass

        # Method 4: Try 5-day history if 1-day is empty
        if price is None:
            try:
                hist = ticker.history(period='5d')
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
            except Exception:
                pass

        if price is not None:
            return float(price)

    except Exception:
        pass

    return None


def get_current_price(symbol: str) -> float | None:
    """
    Get current price for a symbol
    Uses caching to avoid excessive API calls
    Falls back to static prices if yfinance fails
    """
    original_symbol = symbol.upper()
    normalized = normalize_symbol(original_symbol)

    # Check cache (use original symbol as key)
    with _cache_lock:
        if original_symbol in _price_cache:
            cached_data = _price_cache[original_symbol]
            if datetime.now() - cached_data['timestamp'] < timedelta(seconds=CACHE_DURATION):
                logger.debug(f"Cache hit for {original_symbol}")
                return cached_data['price']

    # Fetch price with timeout using ThreadPoolExecutor
    price = None
    try:
        future = _executor.submit(_fetch_price_from_yfinance, normalized)
        price = future.result(timeout=PRICE_FETCH_TIMEOUT)
        logger.info(f"Price fetched for {normalized}: {price}")
    except FuturesTimeoutError:
        logger.warning(f"Price fetch timeout for {normalized} after {PRICE_FETCH_TIMEOUT}s")
        price = None
    except Exception as e:
        logger.error(f"Price fetch error for {normalized}: {e}")
        price = None

    # Use fallback price if yfinance failed
    if price is None:
        fallback = FALLBACK_PRICES.get(original_symbol) or FALLBACK_PRICES.get(normalized)
        if fallback:
            logger.info(f"Using fallback price for {original_symbol}: {fallback}")
            price = fallback

    if price is not None:
        # Update cache
        with _cache_lock:
            _price_cache[original_symbol] = {
                'price': float(price),
                'timestamp': datetime.now()
            }
        return float(price)

    return None


def _safe_get_info_value(info, *keys, default=0):
    """Safely get a value from info dict/object trying multiple keys"""
    for key in keys:
        try:
            if hasattr(info, key):
                val = getattr(info, key)
                if val is not None:
                    return val
            elif isinstance(info, dict) and key in info:
                val = info[key]
                if val is not None:
                    return val
        except (KeyError, AttributeError, TypeError):
            continue
    return default


def get_stock_info(symbol: str) -> dict:
    """
    Get detailed stock information
    """
    original_symbol = symbol.upper()
    symbol = normalize_symbol(original_symbol)

    try:
        ticker = yf.Ticker(symbol)

        # Try to get info from multiple sources
        price = 0
        volume = 0
        market_cap = 0
        day_high = 0
        day_low = 0
        fifty_two_week_high = 0
        fifty_two_week_low = 0

        # Try fast_info first (with error handling for yfinance API changes)
        try:
            fast_info = ticker.fast_info
            price = _safe_get_info_value(fast_info, 'last_price', 'lastPrice', default=0)
            volume = _safe_get_info_value(fast_info, 'last_volume', 'lastVolume', default=0)
            market_cap = _safe_get_info_value(fast_info, 'market_cap', 'marketCap', default=0)
            day_high = _safe_get_info_value(fast_info, 'day_high', 'dayHigh', default=0)
            day_low = _safe_get_info_value(fast_info, 'day_low', 'dayLow', default=0)
            fifty_two_week_high = _safe_get_info_value(fast_info, 'fifty_two_week_high', 'fiftyTwoWeekHigh', 'year_high', default=0)
            fifty_two_week_low = _safe_get_info_value(fast_info, 'fifty_two_week_low', 'fiftyTwoWeekLow', 'year_low', default=0)
        except (KeyError, AttributeError, TypeError):
            pass

        # Fallback to regular info if fast_info failed
        if price == 0:
            try:
                info = ticker.info
                if info:
                    price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose') or 0
                    volume = info.get('volume') or info.get('regularMarketVolume') or 0
                    market_cap = info.get('marketCap') or 0
                    day_high = info.get('dayHigh') or info.get('regularMarketDayHigh') or 0
                    day_low = info.get('dayLow') or info.get('regularMarketDayLow') or 0
                    fifty_two_week_high = info.get('fiftyTwoWeekHigh') or 0
                    fifty_two_week_low = info.get('fiftyTwoWeekLow') or 0
            except (KeyError, AttributeError, TypeError):
                pass

        # Get price change from history
        change = 0
        change_percent = 0
        try:
            hist = ticker.history(period='2d')
            if len(hist) >= 2:
                prev_close = hist['Close'].iloc[-2]
                current = hist['Close'].iloc[-1]
                if price == 0:
                    price = current
                change = current - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
            elif len(hist) == 1:
                if price == 0:
                    price = hist['Close'].iloc[-1]
        except Exception:
            pass

        return {
            'symbol': original_symbol,
            'price': price,
            'change': round(change, 4),
            'change_percent': round(change_percent, 2),
            'volume': volume,
            'market_cap': market_cap,
            'day_high': day_high,
            'day_low': day_low,
            'fifty_two_week_high': fifty_two_week_high,
            'fifty_two_week_low': fifty_two_week_low
        }

    except Exception as e:
        print(f"Error fetching info for {symbol} (original: {original_symbol}): {e}")
        return {
            'symbol': original_symbol,
            'price': get_current_price(original_symbol) or 0,
            'change': 0,
            'change_percent': 0
        }


def get_historical_data(symbol: str, period: str = '1mo', interval: str = '1d') -> list:
    """
    Get historical price data for charts
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
    interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
    """
    original_symbol = symbol.upper()
    symbol = normalize_symbol(original_symbol)

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return []

        data = []
        for index, row in hist.iterrows():
            data.append({
                'time': int(index.timestamp()),
                'open': round(row['Open'], 4),
                'high': round(row['High'], 4),
                'low': round(row['Low'], 4),
                'close': round(row['Close'], 4),
                'volume': int(row['Volume'])
            })

        return data

    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return []


def get_multiple_prices(symbols: list) -> dict:
    """
    Get prices for multiple symbols at once
    More efficient than calling get_current_price multiple times
    """
    results = {}

    for symbol in symbols:
        try:
            price = get_current_price(symbol)
            info = get_stock_info(symbol)

            results[symbol] = {
                'price': price,
                'change': info.get('change', 0),
                'change_percent': info.get('change_percent', 0),
                'volume': info.get('volume', 0)
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            results[symbol] = {
                'price': None,
                'error': str(e)
            }

    return results


def get_crypto_prices() -> dict:
    """
    Get prices for major cryptocurrencies
    """
    crypto_symbols = [
        'BTC-USD', 'ETH-USD', 'XRP-USD', 'SOL-USD', 'ADA-USD',
        'DOGE-USD', 'DOT-USD', 'LINK-USD', 'AVAX-USD',
        'SHIB-USD', 'LTC-USD', 'UNI-USD', 'ATOM-USD', 'XLM-USD'
    ]
    return get_multiple_prices(crypto_symbols)


def get_us_stock_prices() -> dict:
    """
    Get prices for major US stocks
    """
    stock_symbols = [
        'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA',
        'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL',
        'JPM', 'BAC', 'GS', 'V', 'MA',
        'JNJ', 'PFE', 'UNH',
        'XOM', 'CVX',
        'WMT', 'KO', 'PEP', 'MCD', 'NKE', 'DIS'
    ]
    return get_multiple_prices(stock_symbols)


def format_price(price: float, symbol: str) -> str:
    """
    Format price based on asset type
    Crypto gets more decimals, stocks get 2 decimals
    """
    if price is None:
        return "N/A"

    if symbol.endswith('-USD'):
        # Crypto - use appropriate precision
        if price < 0.01:
            return f"${price:.8f}"
        elif price < 1:
            return f"${price:.6f}"
        elif price < 100:
            return f"${price:.4f}"
        else:
            return f"${price:.2f}"
    else:
        # Stock - 2 decimals
        return f"${price:.2f}"


def get_price_precision(symbol: str) -> int:
    """
    Get the number of decimal places for a symbol
    """
    if symbol.endswith('-USD'):
        return 8  # Crypto needs more precision
    return 4  # Stocks use 4 decimal places
