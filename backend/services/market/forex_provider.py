"""
Forex Market Provider - Currency pair data from multiple sources
Supports major pairs + MAD (Moroccan Dirham) pairs
"""

import os
import requests
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from .base_provider import BaseMarketProvider

# Singleton instance
_forex_provider = None
_provider_lock = threading.Lock()


def get_forex_provider():
    """Get singleton instance of ForexProvider"""
    global _forex_provider
    if _forex_provider is None:
        with _provider_lock:
            if _forex_provider is None:
                _forex_provider = ForexProvider()
    return _forex_provider


class ForexProvider(BaseMarketProvider):
    """
    Forex data provider with multiple data sources:
    1. ExchangeRate-API (free tier - 1500 requests/month)
    2. Frankfurter API (free, no key required)
    3. Mock data fallback
    """

    # Forex pairs to track
    FOREX_PAIRS = {
        # Major pairs
        'EUR/USD': {'name': 'Euro / US Dollar', 'base': 'EUR', 'quote': 'USD'},
        'GBP/USD': {'name': 'British Pound / US Dollar', 'base': 'GBP', 'quote': 'USD'},
        'USD/JPY': {'name': 'US Dollar / Japanese Yen', 'base': 'USD', 'quote': 'JPY'},
        'USD/CHF': {'name': 'US Dollar / Swiss Franc', 'base': 'USD', 'quote': 'CHF'},
        'AUD/USD': {'name': 'Australian Dollar / US Dollar', 'base': 'AUD', 'quote': 'USD'},
        'USD/CAD': {'name': 'US Dollar / Canadian Dollar', 'base': 'USD', 'quote': 'CAD'},
        'NZD/USD': {'name': 'New Zealand Dollar / US Dollar', 'base': 'NZD', 'quote': 'USD'},

        # Cross pairs
        'EUR/GBP': {'name': 'Euro / British Pound', 'base': 'EUR', 'quote': 'GBP'},
        'EUR/JPY': {'name': 'Euro / Japanese Yen', 'base': 'EUR', 'quote': 'JPY'},
        'GBP/JPY': {'name': 'British Pound / Japanese Yen', 'base': 'GBP', 'quote': 'JPY'},
        'EUR/CHF': {'name': 'Euro / Swiss Franc', 'base': 'EUR', 'quote': 'CHF'},
        'AUD/JPY': {'name': 'Australian Dollar / Japanese Yen', 'base': 'AUD', 'quote': 'JPY'},

        # MAD pairs (Moroccan Dirham)
        'USD/MAD': {'name': 'US Dollar / Moroccan Dirham', 'base': 'USD', 'quote': 'MAD'},
        'EUR/MAD': {'name': 'Euro / Moroccan Dirham', 'base': 'EUR', 'quote': 'MAD'},
        'GBP/MAD': {'name': 'British Pound / Moroccan Dirham', 'base': 'GBP', 'quote': 'MAD'},
        'CHF/MAD': {'name': 'Swiss Franc / Moroccan Dirham', 'base': 'CHF', 'quote': 'MAD'},

        # Exotic pairs
        'USD/ZAR': {'name': 'US Dollar / South African Rand', 'base': 'USD', 'quote': 'ZAR'},
        'USD/MXN': {'name': 'US Dollar / Mexican Peso', 'base': 'USD', 'quote': 'MXN'},
        'USD/TRY': {'name': 'US Dollar / Turkish Lira', 'base': 'USD', 'quote': 'TRY'},
        'EUR/TRY': {'name': 'Euro / Turkish Lira', 'base': 'EUR', 'quote': 'TRY'},
    }

    # Mock rates for fallback (approximate rates as of late 2024)
    MOCK_RATES = {
        'EUR/USD': 1.0850,
        'GBP/USD': 1.2650,
        'USD/JPY': 149.50,
        'USD/CHF': 0.8820,
        'AUD/USD': 0.6520,
        'USD/CAD': 1.3580,
        'NZD/USD': 0.5980,
        'EUR/GBP': 0.8580,
        'EUR/JPY': 162.20,
        'GBP/JPY': 189.10,
        'EUR/CHF': 0.9570,
        'AUD/JPY': 97.50,
        'USD/MAD': 10.05,
        'EUR/MAD': 10.90,
        'GBP/MAD': 12.72,
        'CHF/MAD': 11.40,
        'USD/ZAR': 18.50,
        'USD/MXN': 17.20,
        'USD/TRY': 32.50,
        'EUR/TRY': 35.26,
    }

    def __init__(self, cache_service=None):
        super().__init__(cache_service)
        self.default_cache_ttl = 60  # 1 minute for forex
        self._rates_cache = {}
        self._cache_timestamp = None
        self._cache_duration = timedelta(minutes=5)

        # API configuration
        self.exchangerate_api_key = os.getenv('EXCHANGERATE_API_KEY')
        self.frankfurter_url = 'https://api.frankfurter.app'

    def _get_live_rates(self) -> Dict[str, float]:
        """Fetch live exchange rates from API sources"""
        # Check cache first
        if self._cache_timestamp and datetime.now() - self._cache_timestamp < self._cache_duration:
            if self._rates_cache:
                return self._rates_cache

        rates = {}

        # Try Frankfurter API first (free, no key needed)
        try:
            rates = self._fetch_frankfurter_rates()
            if rates:
                self._rates_cache = rates
                self._cache_timestamp = datetime.now()
                return rates
        except Exception as e:
            print(f"Frankfurter API error: {e}")

        # Try ExchangeRate-API if key is available
        if self.exchangerate_api_key:
            try:
                rates = self._fetch_exchangerate_api_rates()
                if rates:
                    self._rates_cache = rates
                    self._cache_timestamp = datetime.now()
                    return rates
            except Exception as e:
                print(f"ExchangeRate-API error: {e}")

        # Fallback to mock rates
        return self.MOCK_RATES.copy()

    def _fetch_frankfurter_rates(self) -> Dict[str, float]:
        """Fetch rates from Frankfurter API"""
        rates = {}

        # Get USD-based rates
        try:
            response = requests.get(
                f'{self.frankfurter_url}/latest',
                params={'from': 'USD'},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                usd_rates = data.get('rates', {})

                # Build pair rates
                for pair, info in self.FOREX_PAIRS.items():
                    base = info['base']
                    quote = info['quote']

                    if base == 'USD':
                        if quote in usd_rates:
                            rates[pair] = usd_rates[quote]
                    elif quote == 'USD':
                        if base in usd_rates:
                            rates[pair] = 1 / usd_rates[base]

            # Get EUR-based rates for cross pairs
            response_eur = requests.get(
                f'{self.frankfurter_url}/latest',
                params={'from': 'EUR'},
                timeout=10
            )
            if response_eur.status_code == 200:
                data = response_eur.json()
                eur_rates = data.get('rates', {})

                for pair, info in self.FOREX_PAIRS.items():
                    if pair in rates:
                        continue

                    base = info['base']
                    quote = info['quote']

                    if base == 'EUR':
                        if quote in eur_rates:
                            rates[pair] = eur_rates[quote]
                    elif quote == 'EUR':
                        if base in eur_rates:
                            rates[pair] = 1 / eur_rates[base]

            # Fill any missing with mock rates
            for pair in self.FOREX_PAIRS:
                if pair not in rates:
                    rates[pair] = self.MOCK_RATES.get(pair, 1.0)

        except Exception as e:
            print(f"Error fetching Frankfurter rates: {e}")

        return rates

    def _fetch_exchangerate_api_rates(self) -> Dict[str, float]:
        """Fetch rates from ExchangeRate-API"""
        if not self.exchangerate_api_key:
            return {}

        rates = {}

        try:
            # Get USD rates
            response = requests.get(
                f'https://v6.exchangerate-api.com/v6/{self.exchangerate_api_key}/latest/USD',
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('result') == 'success':
                    conversion_rates = data.get('conversion_rates', {})

                    for pair, info in self.FOREX_PAIRS.items():
                        base = info['base']
                        quote = info['quote']

                        if base == 'USD':
                            if quote in conversion_rates:
                                rates[pair] = conversion_rates[quote]
                        elif quote == 'USD':
                            if base in conversion_rates:
                                rates[pair] = 1 / conversion_rates[base]

        except Exception as e:
            print(f"Error fetching ExchangeRate-API rates: {e}")

        return rates

    def _generate_mock_change(self, pair: str) -> tuple:
        """Generate realistic mock price changes"""
        import random
        base_rate = self.MOCK_RATES.get(pair, 1.0)

        # Generate small random change (-0.5% to +0.5%)
        change_percent = random.uniform(-0.5, 0.5)
        change = base_rate * (change_percent / 100)

        return round(change, 6), round(change_percent, 4)

    def get_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get current price for a forex pair"""
        # Normalize symbol format
        symbol = symbol.upper().replace('_', '/').replace('-', '/')

        if symbol not in self.FOREX_PAIRS:
            return None

        rates = self._get_live_rates()
        rate = rates.get(symbol)

        if rate is None:
            rate = self.MOCK_RATES.get(symbol, 1.0)

        info = self.FOREX_PAIRS[symbol]
        change, change_percent = self._generate_mock_change(symbol)

        # Calculate pip value and daily range
        if 'JPY' in symbol:
            pip_size = 0.01
            decimals = 3
        else:
            pip_size = 0.0001
            decimals = 5

        daily_high = rate * 1.003
        daily_low = rate * 0.997

        return {
            'symbol': symbol,
            'name': info['name'],
            'base': info['base'],
            'quote': info['quote'],
            'price': round(rate, decimals),
            'bid': round(rate - pip_size * 2, decimals),
            'ask': round(rate + pip_size * 2, decimals),
            'spread': round(pip_size * 4 * (10000 if 'JPY' not in symbol else 100), 2),
            'change': round(change, decimals),
            'change_percent': round(change_percent, 2),
            'high': round(daily_high, decimals),
            'low': round(daily_low, decimals),
            'currency': info['quote'],
            'market': 'forex',
            'pip_size': pip_size,
            'timestamp': datetime.now().isoformat(),
            'source': 'frankfurter' if self._rates_cache else 'mock'
        }

    def get_all_prices(self) -> List[Dict[str, Any]]:
        """Get current prices for all forex pairs"""
        prices = []
        for symbol in self.FOREX_PAIRS:
            price = self.get_price(symbol)
            if price:
                prices.append(price)
        return prices

    def get_symbols(self) -> List[str]:
        """Get list of all supported forex pairs"""
        return list(self.FOREX_PAIRS.keys())

    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get metadata about a forex pair"""
        symbol = symbol.upper().replace('_', '/').replace('-', '/')

        if symbol not in self.FOREX_PAIRS:
            return None

        info = self.FOREX_PAIRS[symbol]
        return {
            'symbol': symbol,
            'name': info['name'],
            'base': info['base'],
            'quote': info['quote'],
            'market': 'forex',
            'type': 'major' if symbol in ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'] else
                    'cross' if 'MAD' not in symbol else 'mad',
            'pip_size': 0.01 if 'JPY' in symbol else 0.0001,
            'trading_hours': '24/5 (Sunday 5PM - Friday 5PM EST)'
        }

    def get_pairs_by_type(self, pair_type: str = 'all') -> List[Dict[str, Any]]:
        """Get forex pairs by type (major, cross, mad, exotic)"""
        major_pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD']
        mad_pairs = ['USD/MAD', 'EUR/MAD', 'GBP/MAD', 'CHF/MAD']
        exotic_pairs = ['USD/ZAR', 'USD/MXN', 'USD/TRY', 'EUR/TRY']

        if pair_type == 'major':
            symbols = major_pairs
        elif pair_type == 'cross':
            symbols = [p for p in self.FOREX_PAIRS if p not in major_pairs and p not in mad_pairs and p not in exotic_pairs]
        elif pair_type == 'mad':
            symbols = mad_pairs
        elif pair_type == 'exotic':
            symbols = exotic_pairs
        else:
            symbols = list(self.FOREX_PAIRS.keys())

        return [self.get_price(s) for s in symbols if s in self.FOREX_PAIRS]

    def get_historical(self, symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[List[Dict]]:
        """Get historical forex data"""
        symbol = symbol.upper().replace('_', '/').replace('-', '/')

        if symbol not in self.FOREX_PAIRS:
            return None

        # Try Frankfurter historical API
        try:
            end_date = datetime.now()

            if period == "1w":
                start_date = end_date - timedelta(days=7)
            elif period == "1mo":
                start_date = end_date - timedelta(days=30)
            elif period == "3mo":
                start_date = end_date - timedelta(days=90)
            elif period == "1y":
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=30)

            info = self.FOREX_PAIRS[symbol]
            base = info['base']
            quote = info['quote']

            response = requests.get(
                f'{self.frankfurter_url}/{start_date.strftime("%Y-%m-%d")}..{end_date.strftime("%Y-%m-%d")}',
                params={'from': base, 'to': quote},
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', {})

                historical = []
                for date_str, rate_data in sorted(rates.items()):
                    rate = rate_data.get(quote)
                    if rate:
                        historical.append({
                            'date': date_str,
                            'open': rate,
                            'high': rate * 1.002,
                            'low': rate * 0.998,
                            'close': rate,
                            'volume': 0  # Forex doesn't have volume like stocks
                        })

                return historical

        except Exception as e:
            print(f"Error fetching historical forex data: {e}")

        # Return mock historical data
        return self._generate_mock_historical(symbol, period)

    def _generate_mock_historical(self, symbol: str, period: str) -> List[Dict]:
        """Generate mock historical data"""
        import random

        base_rate = self.MOCK_RATES.get(symbol, 1.0)

        if period == "1w":
            days = 7
        elif period == "1mo":
            days = 30
        elif period == "3mo":
            days = 90
        elif period == "1y":
            days = 365
        else:
            days = 30

        historical = []
        current_rate = base_rate * 0.98  # Start slightly lower

        for i in range(days):
            date = (datetime.now() - timedelta(days=days - i)).strftime('%Y-%m-%d')

            # Random walk
            change = random.uniform(-0.005, 0.006)
            current_rate = current_rate * (1 + change)

            daily_range = current_rate * 0.003
            high = current_rate + random.uniform(0, daily_range)
            low = current_rate - random.uniform(0, daily_range)
            open_price = current_rate + random.uniform(-daily_range/2, daily_range/2)

            historical.append({
                'date': date,
                'open': round(open_price, 5),
                'high': round(high, 5),
                'low': round(low, 5),
                'close': round(current_rate, 5),
                'volume': 0
            })

        return historical

    def is_market_open(self) -> bool:
        """
        Check if forex market is open.
        Forex trades 24/5 (Sunday 5 PM EST - Friday 5 PM EST)
        """
        now = datetime.utcnow()
        weekday = now.weekday()

        # Market closed on weekends (Saturday and Sunday before 22:00 UTC)
        if weekday == 5:  # Saturday
            return False
        if weekday == 6 and now.hour < 22:  # Sunday before market opens
            return False
        if weekday == 4 and now.hour >= 22:  # Friday after market closes
            return False

        return True

    def get_market_summary(self) -> Dict[str, Any]:
        """Get forex market summary"""
        prices = self.get_all_prices()

        gainers = sorted([p for p in prices if p['change_percent'] > 0],
                         key=lambda x: x['change_percent'], reverse=True)[:5]
        losers = sorted([p for p in prices if p['change_percent'] < 0],
                        key=lambda x: x['change_percent'])[:5]

        # Calculate average movement
        avg_change = sum(abs(p['change_percent']) for p in prices) / len(prices) if prices else 0

        return {
            'total_pairs': len(prices),
            'market_open': self.is_market_open(),
            'gainers': gainers,
            'losers': losers,
            'avg_volatility': round(avg_change, 2),
            'mad_pairs': [p for p in prices if 'MAD' in p['symbol']],
            'timestamp': datetime.now().isoformat()
        }
