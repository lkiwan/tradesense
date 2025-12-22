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

    try:
        ticker = yf.Ticker(symbol)
        # Try to get the fast info first
        price = ticker.fast_info.get('lastPrice')

        if price is None:
            # Fallback to history
            hist = ticker.history(period='1d')
            if not hist.empty:
                price = hist['Close'].iloc[-1]

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


def get_stock_info(symbol: str) -> dict:
    """
    Get detailed stock information
    """
    symbol = symbol.upper()

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info

        # Get price change
        hist = ticker.history(period='2d')
        if len(hist) >= 2:
            prev_close = hist['Close'].iloc[-2]
            current = hist['Close'].iloc[-1]
            change = current - prev_close
            change_percent = (change / prev_close) * 100
        else:
            change = 0
            change_percent = 0

        return {
            'symbol': symbol,
            'price': info.get('lastPrice', 0),
            'change': round(change, 4),
            'change_percent': round(change_percent, 2),
            'volume': info.get('lastVolume', 0),
            'market_cap': info.get('marketCap', 0),
            'day_high': info.get('dayHigh', 0),
            'day_low': info.get('dayLow', 0),
            'fifty_two_week_high': info.get('fiftyTwoWeekHigh', 0),
            'fifty_two_week_low': info.get('fiftyTwoWeekLow', 0)
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
