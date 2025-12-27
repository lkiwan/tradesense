"""
Base Market Provider - Abstract base class for market data providers
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime


class BaseMarketProvider(ABC):
    """
    Abstract base class for market data providers.
    All market providers should inherit from this class.
    """

    def __init__(self, cache_service=None):
        self.cache = cache_service
        self.default_cache_ttl = 30  # seconds

    @abstractmethod
    def get_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get current price for a single symbol.

        Returns:
            Dict with keys: symbol, name, price, change, change_percent,
            volume, open, high, low, currency, market, timestamp
        """
        pass

    @abstractmethod
    def get_all_prices(self) -> List[Dict[str, Any]]:
        """
        Get current prices for all supported symbols.

        Returns:
            List of price dictionaries
        """
        pass

    @abstractmethod
    def get_symbols(self) -> List[str]:
        """
        Get list of all supported symbols.
        """
        pass

    @abstractmethod
    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata about a symbol (name, sector, isin, etc.)
        """
        pass

    def get_historical(self, symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[List[Dict]]:
        """
        Get historical OHLCV data for a symbol.
        Override in subclass if historical data is available.
        """
        return None

    def is_market_open(self) -> bool:
        """
        Check if the market is currently open.
        Override in subclass for specific market hours.
        """
        now = datetime.now()
        # Default: open weekdays 9:00-17:30
        if now.weekday() >= 5:  # Saturday, Sunday
            return False
        hour = now.hour + now.minute / 60
        return 9.0 <= hour <= 17.5

    def normalize_response(self, data: Dict, symbol: str) -> Dict[str, Any]:
        """
        Normalize API response to standard format.
        """
        return {
            "symbol": symbol,
            "name": data.get("name", symbol),
            "price": float(data.get("price", data.get("lastPrice", 0))),
            "change": float(data.get("change", 0)),
            "change_percent": float(data.get("change_percent", data.get("changePercent", 0))),
            "volume": int(data.get("volume", 0)),
            "open": float(data.get("open", 0)),
            "high": float(data.get("high", data.get("intradayHigh", 0))),
            "low": float(data.get("low", data.get("intradayLow", 0))),
            "currency": data.get("currency", "MAD"),
            "market": data.get("market", "moroccan"),
            "timestamp": data.get("timestamp", datetime.now().isoformat())
        }
