"""
Moroccan Stock Market Scraper
Scrapes prices from Casablanca Stock Exchange (BVC) via public sources
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import threading

# Cache for Moroccan stock prices
_moroccan_cache = {}
_cache_lock = threading.Lock()
CACHE_DURATION = 60  # 60 seconds cache for Moroccan stocks

# Moroccan stock symbols and their names
MOROCCAN_STOCKS = {
    'IAM': {'name': 'Maroc Telecom', 'isin': 'MA0000011488'},
    'ATW': {'name': 'Attijariwafa Bank', 'isin': 'MA0000012445'},
    'BCP': {'name': 'Banque Centrale Populaire', 'isin': 'MA0000011884'},
    'CIH': {'name': 'CIH Bank', 'isin': 'MA0000011819'},
    'TAQA': {'name': 'Taqa Morocco', 'isin': 'MA0000012320'},
    'LBV': {'name': 'Label Vie', 'isin': 'MA0000011058'},
    'MNG': {'name': 'Managem', 'isin': 'MA0000010928'},
    'BOA': {'name': 'Bank of Africa', 'isin': 'MA0000010506'},
    'CSR': {'name': 'Cosumar', 'isin': 'MA0000012247'},
    'HPS': {'name': 'HPS', 'isin': 'MA0000011512'}
}


def get_moroccan_stocks() -> dict:
    """
    Get current prices for Moroccan stocks
    Scrapes from public financial news sites
    """
    import time
    # Check cache first
    with _cache_lock:
        if _moroccan_cache:
            oldest = min(v.get('timestamp', 0) for v in _moroccan_cache.values())
            if time.time() - oldest < CACHE_DURATION:
                return _moroccan_cache.copy()

    prices = {}

    # Try multiple sources
    try:
        prices = _scrape_boursenews()
    except Exception as e:
        print(f"Boursenews scraping failed: {e}")

    if not prices:
        try:
            prices = _scrape_leboursier()
        except Exception as e:
            print(f"Leboursier scraping failed: {e}")

    if not prices:
        # Use mock data as fallback
        prices = _get_mock_prices()

    # Update cache
    with _cache_lock:
        _moroccan_cache.clear()
        _moroccan_cache.update(prices)

    return prices


def _scrape_boursenews() -> dict:
    """
    Scrape from boursenews.ma
    """
    url = "https://www.boursenews.ma/marche/cours-bourse.html"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'lxml')
    prices = {}

    # Find the stock table
    table = soup.find('table', {'class': 'table'})
    if not table:
        return {}

    rows = table.find_all('tr')[1:]  # Skip header

    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 4:
            symbol_elem = cols[0].find('a')
            if symbol_elem:
                symbol = symbol_elem.text.strip().upper()

                # Map to our symbols
                for our_symbol, info in MOROCCAN_STOCKS.items():
                    if our_symbol in symbol or info['name'].upper() in symbol.upper():
                        try:
                            price_text = cols[1].text.strip().replace(',', '.').replace(' ', '')
                            price = float(price_text)

                            change_text = cols[2].text.strip().replace(',', '.').replace(' ', '').replace('%', '')
                            change_pct = float(change_text) if change_text else 0

                            prices[our_symbol] = {
                                'symbol': our_symbol,
                                'name': info['name'],
                                'price': price,
                                'change': round(price * change_pct / 100, 2),
                                'change_percent': change_pct,
                                'timestamp': datetime.now().timestamp(),
                                'source': 'boursenews'
                            }
                        except (ValueError, IndexError):
                            continue

    return prices


def _scrape_leboursier() -> dict:
    """
    Scrape from leboursier.ma
    """
    url = "https://www.leboursier.ma/cours"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'lxml')
    prices = {}

    # Try to find stock data
    stock_items = soup.find_all('div', {'class': 'stock-item'})

    for item in stock_items:
        try:
            name_elem = item.find('span', {'class': 'stock-name'})
            price_elem = item.find('span', {'class': 'stock-price'})
            change_elem = item.find('span', {'class': 'stock-change'})

            if name_elem and price_elem:
                name = name_elem.text.strip()

                for our_symbol, info in MOROCCAN_STOCKS.items():
                    if info['name'].upper() in name.upper():
                        price = float(price_elem.text.strip().replace(',', '.'))
                        change_pct = 0
                        if change_elem:
                            change_text = change_elem.text.strip().replace('%', '').replace(',', '.')
                            change_pct = float(change_text)

                        prices[our_symbol] = {
                            'symbol': our_symbol,
                            'name': info['name'],
                            'price': price,
                            'change': round(price * change_pct / 100, 2),
                            'change_percent': change_pct,
                            'timestamp': datetime.now().timestamp(),
                            'source': 'leboursier'
                        }
        except (ValueError, AttributeError):
            continue

    return prices


def _get_mock_prices() -> dict:
    """
    Return mock prices when scraping fails
    Simulates realistic Moroccan stock prices
    """
    import random

    mock_base_prices = {
        'IAM': 118.50,
        'ATW': 485.00,
        'BCP': 268.00,
        'CIH': 385.00,
        'TAQA': 1180.00,
        'LBV': 4250.00,
        'MNG': 1850.00,
        'BOA': 185.00,
        'CSR': 195.00,
        'HPS': 6800.00
    }

    prices = {}
    for symbol, base_price in mock_base_prices.items():
        # Add small random variation (-2% to +2%)
        variation = random.uniform(-0.02, 0.02)
        price = round(base_price * (1 + variation), 2)
        change_pct = round(variation * 100, 2)

        prices[symbol] = {
            'symbol': symbol,
            'name': MOROCCAN_STOCKS[symbol]['name'],
            'price': price,
            'change': round(base_price * variation, 2),
            'change_percent': change_pct,
            'timestamp': datetime.now().timestamp(),
            'source': 'mock'
        }

    return prices


def get_moroccan_stock(symbol: str) -> dict | None:
    """
    Get single Moroccan stock price
    """
    symbol = symbol.upper()
    if symbol not in MOROCCAN_STOCKS:
        return None

    all_prices = get_moroccan_stocks()
    return all_prices.get(symbol)


def get_supported_moroccan_symbols() -> list:
    """
    Get list of supported Moroccan stock symbols
    """
    return list(MOROCCAN_STOCKS.keys())


def get_moroccan_stock_info() -> dict:
    """
    Get information about supported Moroccan stocks
    """
    return MOROCCAN_STOCKS.copy()
