"""
Yahoo Finance Service
Fetches real-time stock and crypto prices from Yahoo Finance
"""

import yfinance as yf
from functools import lru_cache
from datetime import datetime, timedelta
import threading

# Cache for prices (simple in-memory cache)
_price_cache = {}
_cache_lock = threading.Lock()
CACHE_DURATION = 3  # seconds (fast updates for real-time feel)


def get_current_price(symbol: str) -> float | None:
    """
    Get current price for a symbol
    Uses caching to avoid excessive API calls
    """
    symbol = symbol.upper()

    # Check cache
    with _cache_lock:
        if symbol in _price_cache:
            cached_data = _price_cache[symbol]
            if datetime.now() - cached_data['timestamp'] < timedelta(seconds=CACHE_DURATION):
                return cached_data['price']

    price = None

    try:
        ticker = yf.Ticker(symbol)

        # Method 1: Try fast_info (wrapped in try-except due to yfinance API changes)
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
            # Update cache
            with _cache_lock:
                _price_cache[symbol] = {
                    'price': float(price),
                    'timestamp': datetime.now()
                }
            return float(price)

    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")

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
    symbol = symbol.upper()

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
            'symbol': symbol,
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
        print(f"Error fetching info for {symbol}: {e}")
        return {
            'symbol': symbol,
            'price': get_current_price(symbol) or 0,
            'change': 0,
            'change_percent': 0
        }


def get_historical_data(symbol: str, period: str = '1mo', interval: str = '1d') -> list:
    """
    Get historical price data for charts
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
    interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
    """
    symbol = symbol.upper()

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
