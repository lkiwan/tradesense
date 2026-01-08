"""
Yahoo Finance Service
Fetches real-time stock and crypto prices from Yahoo Finance
Falls back to Finnhub API when yfinance fails
"""

import yfinance as yf
import requests
import os
from functools import lru_cache
from datetime import datetime, timedelta
import threading
import logging
import urllib3

# Suppress SSL warnings for verify=False requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# Finnhub API configuration - loaded dynamically to get env var after Flask init
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

def get_finnhub_api_key():
    """Get Finnhub API key from environment"""
    return os.environ.get('FINNHUB_API_KEY', '')

# Check if eventlet is being used
try:
    import eventlet
    from eventlet import tpool
    USE_TPOOL = True
except ImportError:
    USE_TPOOL = False

# Thread pool for timeout support
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
_executor = ThreadPoolExecutor(max_workers=5)

# Cache for prices (simple in-memory cache)
_price_cache = {}
_cache_lock = threading.Lock()
CACHE_DURATION = 5  # seconds - reduced for real-time crypto updates (CoinGecko handles rate limiting)
PRICE_FETCH_TIMEOUT = 10  # seconds - timeout for yfinance API calls

# Finnhub symbol mapping (convert our symbols to Finnhub format)
FINNHUB_SYMBOLS = {
    # Forex (Finnhub uses OANDA format)
    'EURUSD': 'OANDA:EUR_USD',
    'GBPUSD': 'OANDA:GBP_USD',
    'USDJPY': 'OANDA:USD_JPY',
    'USDCHF': 'OANDA:USD_CHF',
    'AUDUSD': 'OANDA:AUD_USD',
    'USDCAD': 'OANDA:USD_CAD',
    'NZDUSD': 'OANDA:NZD_USD',
    'EURGBP': 'OANDA:EUR_GBP',
    # Crypto (Finnhub uses exchange:pair format)
    'BTCUSD': 'BINANCE:BTCUSDT',
    'ETHUSD': 'BINANCE:ETHUSDT',
    'XRPUSD': 'BINANCE:XRPUSDT',
    'SOLUSD': 'BINANCE:SOLUSDT',
    'BNBUSD': 'BINANCE:BNBUSDT',
    # Stocks (direct symbol)
    'AAPL': 'AAPL',
    'TSLA': 'TSLA',
    'NVDA': 'NVDA',
    'GOOGL': 'GOOGL',
    'MSFT': 'MSFT',
    'AMZN': 'AMZN',
    # Commodities (Finnhub futures)
    'XAUUSD': 'OANDA:XAU_USD',
    'XAGUSD': 'OANDA:XAG_USD',
}


def _fetch_price_from_finnhub(symbol: str) -> float | None:
    """Fetch price from Finnhub API as fallback"""
    api_key = get_finnhub_api_key()
    if not api_key:
        logger.warning("Finnhub API key not configured")
        return None

    # Convert symbol to Finnhub format
    finnhub_symbol = FINNHUB_SYMBOLS.get(symbol.upper(), symbol.upper())

    try:
        url = f"{FINNHUB_BASE_URL}/quote"
        params = {
            'symbol': finnhub_symbol,
            'token': api_key
        }
        response = requests.get(url, params=params, timeout=5)

        if response.status_code == 200:
            data = response.json()
            # Finnhub returns 'c' for current price
            price = data.get('c')
            if price and price > 0:
                logger.info(f"Finnhub price for {symbol} ({finnhub_symbol}): {price}")
                return float(price)
            else:
                logger.warning(f"Finnhub returned zero/null price for {finnhub_symbol}")
        else:
            logger.warning(f"Finnhub API error: {response.status_code}")
    except Exception as e:
        logger.error(f"Finnhub fetch error for {symbol}: {e}")

    return None


# Dynamic prices - fetched from free APIs every 15 seconds
_live_prices = {}
_live_prices_lock = threading.Lock()
_price_updater_running = False

def _fetch_crypto_prices_binance():
    """Fetch crypto prices from Binance API (same source as TradingView)"""
    try:
        # Binance symbols mapping
        binance_symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'BNBUSDT']
        symbols_param = '["' + '","'.join(binance_symbols) + '"]'

        url = f"https://api.binance.com/api/v3/ticker/price?symbols={symbols_param}"
        resp = requests.get(url, timeout=(2, 5), verify=False)

        if resp.status_code == 200:
            data = resp.json()
            prices = {}

            # Map Binance symbols to our format
            mapping = {
                'BTCUSDT': ['BTC-USD', 'BTCUSD'],
                'ETHUSDT': ['ETH-USD', 'ETHUSD'],
                'SOLUSDT': ['SOL-USD', 'SOLUSD'],
                'XRPUSDT': ['XRP-USD', 'XRPUSD'],
                'ADAUSDT': ['ADA-USD', 'ADAUSD'],
                'DOGEUSDT': ['DOGE-USD', 'DOGEUSD'],
                'BNBUSDT': ['BNB-USD', 'BNBUSD']
            }

            for item in data:
                binance_sym = item.get('symbol')
                price = float(item.get('price', 0))
                if binance_sym in mapping and price > 0:
                    for sym in mapping[binance_sym]:
                        prices[sym] = {'price': price, 'change_percent': 0}

            if prices:
                logger.info(f"Binance: {len(prices)} crypto prices fetched")
                return prices
        else:
            logger.warning(f"Binance returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"Binance fetch error: {e}")
    return {}

def _fetch_crypto_prices():
    """Fetch crypto prices - Binance first (real-time), CoinGecko fallback"""
    # Try Binance first (same source as TradingView)
    prices = _fetch_crypto_prices_binance()
    if prices:
        return prices

    # Fallback to CoinGecko
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin,ethereum,solana,ripple,cardano,dogecoin",
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        resp = requests.get(url, params=params, timeout=(3, 5), verify=False)
        if resp.status_code == 200:
            data = resp.json()
            prices = {}
            mapping = {
                'bitcoin': ['BTC-USD', 'BTCUSD'],
                'ethereum': ['ETH-USD', 'ETHUSD'],
                'solana': ['SOL-USD', 'SOLUSD'],
                'ripple': ['XRP-USD', 'XRPUSD'],
                'cardano': ['ADA-USD', 'ADAUSD'],
                'dogecoin': ['DOGE-USD', 'DOGEUSD']
            }
            for coin, symbols in mapping.items():
                if coin in data:
                    price = data[coin].get('usd')
                    change = data[coin].get('usd_24h_change', 0)
                    if price:
                        for sym in symbols:
                            prices[sym] = {'price': price, 'change_percent': change}
            logger.info(f"CoinGecko fallback: {len(prices)} prices")
            return prices
        else:
            logger.warning(f"CoinGecko returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"CoinGecko fetch error: {e}")
    return {}

def _fetch_stock_prices_finnhub():
    """Fetch US stock prices from Finnhub (free tier)"""
    api_key = get_finnhub_api_key()
    if not api_key:
        return {}

    prices = {}
    symbols = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT']

    for symbol in symbols:
        try:
            url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={api_key}"
            resp = requests.get(url, timeout=5, verify=False)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get('c', 0)
                prev_close = data.get('pc', 0)
                if current > 0:
                    change_pct = ((current - prev_close) / prev_close * 100) if prev_close > 0 else 0
                    prices[symbol] = {'price': current, 'change_percent': round(change_pct, 2)}
        except Exception as e:
            logger.debug(f"Finnhub error for {symbol}: {e}")
    return prices

def _fetch_stock_prices_yahoo_batch():
    """Fetch US stock prices from Yahoo Finance using fast batch method"""
    prices = {}
    symbols = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META']

    try:
        # Use Yahoo Finance v7 API for batch quotes
        symbols_str = ','.join(symbols)
        url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbols_str}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
        resp = requests.get(url, headers=headers, timeout=(3, 8), verify=False)

        if resp.status_code == 200:
            data = resp.json()
            results = data.get('quoteResponse', {}).get('result', [])
            for quote in results:
                symbol = quote.get('symbol')
                price = quote.get('regularMarketPrice')
                change_pct = quote.get('regularMarketChangePercent', 0)
                if symbol and price:
                    prices[symbol] = {'price': price, 'change_percent': round(change_pct, 2)}
            if prices:
                logger.info(f"Yahoo batch: {len(prices)} US stocks fetched")
    except Exception as e:
        logger.debug(f"Yahoo batch fetch error: {e}")

    return prices

def _extract_span_values(html_row):
    """Extract values from <span dir="ltr">VALUE</span> tags without regex (eventlet-safe)"""
    values = []
    search_str = '<span dir="ltr">'
    end_str = '</span>'
    pos = 0
    while True:
        start = html_row.find(search_str, pos)
        if start == -1:
            break
        start += len(search_str)
        end = html_row.find(end_str, start)
        if end == -1:
            break
        values.append(html_row[start:end])
        pos = end + len(end_str)
    return values

def _fetch_moroccan_prices():
    """Fetch ALL Moroccan stock prices from official Casablanca Bourse"""
    url = "https://www.casablanca-bourse.com/fr/live-market/marche-actions-groupement"
    prices = {}

    try:
        resp = requests.get(url, timeout=(5, 15), verify=False,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'})

        if resp.status_code == 200:
            html = resp.text

            # Find all stock symbols dynamically from the page
            symbols = []
            search_str = 'instruments/'
            pos = 0
            while True:
                idx = html.find(search_str, pos)
                if idx == -1:
                    break
                start = idx + len(search_str)
                end = html.find('"', start)
                if end > start:
                    symbol = html[start:end]
                    if symbol and symbol not in symbols and len(symbol) <= 10:
                        symbols.append(symbol)
                pos = end + 1

            # Extract price data for each symbol
            for symbol in symbols:
                idx = html.find(f'instruments/{symbol}"')
                if idx > 0:
                    start = html.rfind('<tr', 0, idx)
                    end = html.find('</tr>', idx) + 5
                    row = html[start:end]

                    # Extract numbers without regex (eventlet-safe)
                    numbers = _extract_span_values(row)
                    if len(numbers) >= 2:
                        try:
                            # numbers[0] = current price, numbers[1] = prev close
                            price = float(numbers[0].replace(' ', '').replace(',', '.'))
                            prev_close = float(numbers[1].replace(' ', '').replace(',', '.'))
                            change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0

                            prices[symbol] = {
                                'price': price,
                                'change_percent': round(change_pct, 2)
                            }
                        except (ValueError, IndexError):
                            continue

            if prices:
                logger.info(f"Casablanca Bourse: {len(prices)} Moroccan stocks")
    except Exception as e:
        logger.warning(f"Casablanca Bourse fetch error: {e}")

    return prices

def _update_live_prices():
    """Update all live prices from various sources"""
    global _live_prices

    new_prices = {}
    logger.info("Fetching live prices...")

    # Fetch crypto prices from CoinGecko (main source - fast and reliable)
    try:
        crypto = _fetch_crypto_prices()
        new_prices.update(crypto)
        if crypto:
            logger.info(f"CoinGecko: {len(crypto)} crypto prices")
    except Exception as e:
        logger.error(f"Crypto fetch error: {e}")

    # Update the global prices dict immediately after crypto
    with _live_prices_lock:
        _live_prices.update(new_prices)
        total_prices = len(_live_prices)

    if new_prices:
        btc = new_prices.get('BTC-USD', {}).get('price', 'N/A')
        logger.info(f"Live prices updated: {len(new_prices)} symbols, BTC=${btc}")

    # Fetch Moroccan stocks from Casablanca Bourse (PRIORITY - fast and reliable)
    try:
        logger.info("Fetching Moroccan stock prices...")
        moroccan = _fetch_moroccan_prices()
        if moroccan:
            with _live_prices_lock:
                _live_prices.update(moroccan)
            logger.info(f"Moroccan: {len(moroccan)} stock prices added")
        else:
            logger.warning("Moroccan fetch returned empty/None")
    except Exception as e:
        logger.warning(f"Moroccan fetch error: {e}")

    # Try to fetch stock prices in background (optional, may timeout)
    try:
        if get_finnhub_api_key():
            stocks = _fetch_stock_prices_finnhub()
            if stocks:
                with _live_prices_lock:
                    _live_prices.update(stocks)
                logger.info(f"Finnhub: {len(stocks)} stock prices added")
    except Exception as e:
        logger.debug(f"Finnhub error: {e}")

def _price_updater_thread():
    """Background thread to update prices every 3 seconds"""
    global _price_updater_running

    # Use eventlet.sleep for green thread compatibility
    try:
        import eventlet
        sleep_func = eventlet.sleep
    except ImportError:
        import time
        sleep_func = time.sleep

    # Wait 3 seconds for first iteration (initial fetch already done in start_price_updater)
    sleep_func(3)

    while _price_updater_running:
        try:
            _update_live_prices()
        except Exception as e:
            logger.error(f"Price updater error: {e}")

        # Wait 3 seconds before next update
        sleep_func(3)

def start_price_updater():
    """Start the background price updater"""
    global _price_updater_running
    if not _price_updater_running:
        _price_updater_running = True

        # Do IMMEDIATE first fetch before starting background loop
        # This ensures prices are available before serving requests
        logger.info("Doing initial price fetch...")
        try:
            _update_live_prices()
            logger.info("Initial price fetch complete")
        except Exception as e:
            logger.warning(f"Initial price fetch failed: {e}")

        # Use eventlet.spawn_n for fire-and-forget green thread
        try:
            import eventlet
            eventlet.spawn_n(_price_updater_thread)
            logger.info("Price updater started with eventlet.spawn_n (3s interval)")
        except ImportError:
            # Fallback to threading if eventlet not available
            thread = threading.Thread(target=_price_updater_thread, daemon=True)
            thread.start()
            logger.info("Price updater started with threading (3s interval)")

def stop_price_updater():
    """Stop the background price updater"""
    global _price_updater_running
    _price_updater_running = False

def get_fallback_price(symbol: str) -> float | None:
    """Get live price for a symbol from the price updater"""
    with _live_prices_lock:
        data = _live_prices.get(symbol) or _live_prices.get(symbol.upper())
        if data:
            return data.get('price') if isinstance(data, dict) else data
    return None

def get_live_price_data(symbol: str) -> dict | None:
    """Get full price data (price + change) for a symbol"""
    with _live_prices_lock:
        return _live_prices.get(symbol) or _live_prices.get(symbol.upper())

# Note: Call start_price_updater() from app.py after Flask is initialized
# Don't auto-start here to avoid blocking during eventlet monkey patching


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

    # Try Finnhub if yfinance failed
    if price is None:
        logger.info(f"Trying Finnhub for {original_symbol}...")
        price = _fetch_price_from_finnhub(original_symbol)

    # Use dynamic fallback price if both yfinance and Finnhub failed
    if price is None:
        fallback = get_fallback_price(original_symbol) or get_fallback_price(normalized)
        if fallback:
            logger.warning(f"Using fallback price for {original_symbol}: {fallback}")
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
