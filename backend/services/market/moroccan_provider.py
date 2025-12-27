"""
Moroccan Market Provider - Data provider for Casablanca Stock Exchange (BVC)

Data Sources (in priority order):
1. Medias24 API (via proxy endpoint)
2. BourseNews.ma scraping
3. LeBousier.ma scraping
4. Mock data (fallback)
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import random
import logging
from typing import Dict, List, Optional, Any
from .base_provider import BaseMarketProvider

logger = logging.getLogger(__name__)


# Complete list of Moroccan stocks (78 companies from Casablanca Bourse)
MOROCCAN_STOCKS = {
    # Banks (Banques)
    "ATW": {"name": "Attijariwafa Bank", "sector": "Banks", "isin": "MA0000012445", "mock_price": 485.00},
    "BCP": {"name": "Banque Centrale Populaire", "sector": "Banks", "isin": "MA0000010928", "mock_price": 268.00},
    "BOA": {"name": "Bank of Africa", "sector": "Banks", "isin": "MA0000010787", "mock_price": 185.00},
    "CIH": {"name": "CIH Bank", "sector": "Banks", "isin": "MA0000011058", "mock_price": 385.00},
    "CDM": {"name": "Credit du Maroc", "sector": "Banks", "isin": "MA0000010142", "mock_price": 580.00},
    "BMCI": {"name": "BMCI", "sector": "Banks", "isin": "MA0000010092", "mock_price": 475.00},
    "CFG": {"name": "CFG Bank", "sector": "Banks", "isin": "MA0000012486", "mock_price": 105.00},

    # Telecom & Technology
    "IAM": {"name": "Maroc Telecom", "sector": "Telecom", "isin": "MA0000011488", "mock_price": 118.50},
    "HPS": {"name": "HPS", "sector": "Technology", "isin": "MA0000011553", "mock_price": 6800.00},
    "M2M": {"name": "M2M Group", "sector": "Technology", "isin": "MA0000012361", "mock_price": 580.00},
    "IBC": {"name": "IB Maroc", "sector": "Technology", "isin": "MA0000011876", "mock_price": 42.00},
    "DIS": {"name": "Disway", "sector": "Technology", "isin": "MA0000011629", "mock_price": 295.00},
    "MTD": {"name": "Microdata", "sector": "Technology", "isin": "MA0000012312", "mock_price": 460.00},

    # Insurance (Assurances)
    "WAA": {"name": "Wafa Assurance", "sector": "Insurance", "isin": "MA0000011124", "mock_price": 3950.00},
    "SAH": {"name": "Saham Assurance", "sector": "Insurance", "isin": "MA0000010969", "mock_price": 1340.00},
    "ATL": {"name": "Atlanta", "sector": "Insurance", "isin": "MA0000010019", "mock_price": 95.00},
    "MAB": {"name": "Maghrebail", "sector": "Insurance", "isin": "MA0000010654", "mock_price": 805.00},
    "MAR": {"name": "Maroc Leasing", "sector": "Insurance", "isin": "MA0000010647", "mock_price": 335.00},
    "AXA": {"name": "Axa Credit", "sector": "Insurance", "isin": "MA0000011926", "mock_price": 245.00},

    # Energy & Mining
    "TAQA": {"name": "Taqa Morocco", "sector": "Energy", "isin": "MA0000011249", "mock_price": 1180.00},
    "MNG": {"name": "Managem", "sector": "Mining", "isin": "MA0000011348", "mock_price": 1850.00},
    "CMT": {"name": "Cie Miniere de Touissit", "sector": "Mining", "isin": "MA0000010357", "mock_price": 1850.00},
    "SMI": {"name": "SMI", "sector": "Mining", "isin": "MA0000010985", "mock_price": 3150.00},

    # Real Estate (Immobilier)
    "ADH": {"name": "Addoha", "sector": "Real Estate", "isin": "MA0000011181", "mock_price": 6.20},
    "RDS": {"name": "Residences Dar Saada", "sector": "Real Estate", "isin": "MA0000012296", "mock_price": 30.50},
    "DLM": {"name": "Alliances Developpement", "sector": "Real Estate", "isin": "MA0000012015", "mock_price": 68.50},

    # Consumer & Retail
    "LBV": {"name": "Label Vie", "sector": "Retail", "isin": "MA0000011611", "mock_price": 4250.00},
    "SNA": {"name": "SNEP", "sector": "Chemicals", "isin": "MA0000010977", "mock_price": 670.00},
    "LES": {"name": "Lesieur Cristal", "sector": "Food", "isin": "MA0000010571", "mock_price": 195.00},
    "CSR": {"name": "Cosumar", "sector": "Food", "isin": "MA0000010399", "mock_price": 195.00},
    "BRA": {"name": "Brasseries du Maroc", "sector": "Beverages", "isin": "MA0000010076", "mock_price": 2550.00},
    "MUT": {"name": "Mutandis", "sector": "Consumer", "isin": "MA0000012379", "mock_price": 265.00},
    "OUL": {"name": "Oulmes", "sector": "Beverages", "isin": "MA0000010803", "mock_price": 1400.00},
    "SBM": {"name": "Soc des Boissons du Maroc", "sector": "Beverages", "isin": "MA0000010951", "mock_price": 2650.00},
    "UMR": {"name": "Unimer", "sector": "Food", "isin": "MA0000011082", "mock_price": 180.00},
    "CAR": {"name": "Cartier Saada", "sector": "Food", "isin": "MA0000011934", "mock_price": 33.00},
    "AFI": {"name": "Afriquia Gaz", "sector": "Energy", "isin": "MA0000012197", "mock_price": 4700.00},

    # Industry & Construction
    "HOL": {"name": "LafargeHolcim Maroc", "sector": "Construction", "isin": "MA0000010597", "mock_price": 1750.00},
    "SID": {"name": "Sonasid", "sector": "Steel", "isin": "MA0000010548", "mock_price": 610.00},
    "NEX": {"name": "Nexans Maroc", "sector": "Industry", "isin": "MA0000010795", "mock_price": 230.00},
    "JET": {"name": "Jet Contractors", "sector": "Construction", "isin": "MA0000011892", "mock_price": 1320.00},
    "TIM": {"name": "Timar", "sector": "Logistics", "isin": "MA0000011066", "mock_price": 195.00},
    "MED": {"name": "Med Paper", "sector": "Paper", "isin": "MA0000012064", "mock_price": 29.00},
    "ALM": {"name": "Aluminium du Maroc", "sector": "Industry", "isin": "MA0000010035", "mock_price": 1550.00},
    "SNP": {"name": "Snep", "sector": "Chemicals", "isin": "MA0000010977", "mock_price": 670.00},
    "COL": {"name": "Colorado", "sector": "Paints", "isin": "MA0000010381", "mock_price": 72.00},
    "STR": {"name": "Stroc Industrie", "sector": "Industry", "isin": "MA0000012239", "mock_price": 36.00},
    "FBR": {"name": "Fenie Brossette", "sector": "Industry", "isin": "MA0000010449", "mock_price": 185.00},
    "DEL": {"name": "Delta Holding", "sector": "Industry", "isin": "MA0000010423", "mock_price": 36.00},
    "ZDJ": {"name": "Zellidja", "sector": "Mining", "isin": "MA0000011108", "mock_price": 105.00},
    "TQM": {"name": "Totalenergies Marketing Maroc", "sector": "Energy", "isin": "MA0000011041", "mock_price": 1650.00},
    "PRO": {"name": "Promopharm", "sector": "Pharma", "isin": "MA0000012247", "mock_price": 1100.00},
    "SOT": {"name": "Sothema", "sector": "Pharma", "isin": "MA0000012056", "mock_price": 1350.00},
    "LYD": {"name": "Lydec", "sector": "Utilities", "isin": "MA0000010621", "mock_price": 350.00},

    # Auto & Transport
    "AUT": {"name": "Auto Hall", "sector": "Auto", "isin": "MA0000010050", "mock_price": 88.00},
    "NJS": {"name": "Auto Nejma", "sector": "Auto", "isin": "MA0000010043", "mock_price": 2500.00},
    "CTM": {"name": "CTM", "sector": "Transport", "isin": "MA0000010407", "mock_price": 765.00},

    # Finance & Holdings
    "ONA": {"name": "Ona", "sector": "Holdings", "isin": "MA0000010811", "mock_price": 1580.00},
    "AGM": {"name": "Agma", "sector": "Finance", "isin": "MA0000010027", "mock_price": 4280.00},
    "GCL": {"name": "Rebab Company", "sector": "Finance", "isin": "MA0000011769", "mock_price": 247.00},

    # Hotels & Tourism
    "RIS": {"name": "Risma", "sector": "Hotels", "isin": "MA0000011900", "mock_price": 145.00},

    # Media & Entertainment
    "S2M": {"name": "S2M", "sector": "IT Services", "isin": "MA0000010936", "mock_price": 390.00},
    "INV": {"name": "Involys", "sector": "IT Services", "isin": "MA0000011504", "mock_price": 150.00},

    # Others
    "CDA": {"name": "Credit Agricole Maroc", "sector": "Banks", "isin": "MA0000010118", "mock_price": 59.00},
    "SAM": {"name": "Samir", "sector": "Oil", "isin": "MA0000010910", "mock_price": 22.50},
    "TGC": {"name": "Tgcc", "sector": "Construction", "isin": "MA0000012478", "mock_price": 215.00},
    "IMO": {"name": "Immorente Invest", "sector": "Real Estate", "isin": "MA0000012403", "mock_price": 105.00},
    "BCI": {"name": "Bcp Invest", "sector": "Investment", "isin": "MA0000012494", "mock_price": 10.50},
    "AFM": {"name": "Afma", "sector": "Consulting", "isin": "MA0000012098", "mock_price": 1500.00},
    "DAR": {"name": "Dari Couspate", "sector": "Food", "isin": "MA0000012148", "mock_price": 3950.00},
    "EQD": {"name": "Eqdom", "sector": "Finance", "isin": "MA0000010431", "mock_price": 1080.00},
    "SLF": {"name": "Salafin", "sector": "Finance", "isin": "MA0000011595", "mock_price": 620.00},
    "DRI": {"name": "Douja Prom Addoha", "sector": "Real Estate", "isin": "MA0000011181", "mock_price": 6.20},
    "MSA": {"name": "Miniere Hajar", "sector": "Mining", "isin": "MA0000012205", "mock_price": 750.00},
    "SRM": {"name": "Smi", "sector": "Mining", "isin": "MA0000010985", "mock_price": 3150.00},
    "MLE": {"name": "Maroc Leasing", "sector": "Leasing", "isin": "MA0000010647", "mock_price": 335.00},
    "SAB": {"name": "Saham Assurance", "sector": "Insurance", "isin": "MA0000010969", "mock_price": 1340.00},
}


class MoroccanMarketProvider(BaseMarketProvider):
    """
    Provider for Moroccan stock market data from Casablanca Bourse (BVC).
    Uses multiple data sources with fallback strategy.
    """

    # Data source URLs
    MEDIAS24_API = "https://www.medias24.com/api/bourse/data"
    BOURSENEWS_URL = "https://www.boursenews.ma/marche/cours"
    LEBOURSIER_URL = "https://www.leboursier.ma/cours-bourse"
    CASABLANCA_API = "http://casablanca-bourse-api.herokuapp.com/api/v1/companies/"

    def __init__(self, cache_service=None):
        super().__init__(cache_service)
        self.stocks = MOROCCAN_STOCKS
        self.default_cache_ttl = 30  # 30 seconds for real-time data
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_symbols(self) -> List[str]:
        """Get all supported Moroccan stock symbols."""
        return list(self.stocks.keys())

    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a symbol."""
        symbol = symbol.upper()
        if symbol in self.stocks:
            info = self.stocks[symbol].copy()
            info["symbol"] = symbol
            info["market"] = "moroccan"
            info["currency"] = "MAD"
            return info
        return None

    def get_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get current price for a single Moroccan stock.
        Tries multiple sources with fallback.
        """
        symbol = symbol.upper()
        if symbol not in self.stocks:
            logger.warning(f"Symbol {symbol} not found in Moroccan stocks")
            return None

        cache_key = f"moroccan_price_{symbol}"

        # Check cache first
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                return cached

        # Try data sources in order
        price_data = None

        # Source 1: Try Casablanca Bourse API (Herokuapp)
        try:
            price_data = self._fetch_from_casablanca_api(symbol)
        except Exception as e:
            logger.debug(f"Casablanca API failed for {symbol}: {e}")

        # Source 2: Try BourseNews scraping
        if not price_data:
            try:
                price_data = self._scrape_boursenews(symbol)
            except Exception as e:
                logger.debug(f"BourseNews scraping failed for {symbol}: {e}")

        # Source 3: Try LeBousier scraping
        if not price_data:
            try:
                price_data = self._scrape_leboursier(symbol)
            except Exception as e:
                logger.debug(f"LeBousier scraping failed for {symbol}: {e}")

        # Fallback: Use mock data with realistic variation
        if not price_data:
            price_data = self._get_mock_price(symbol)

        # Cache the result
        if self.cache and price_data:
            self.cache.set(cache_key, price_data, ex=self.default_cache_ttl)

        return price_data

    def get_all_prices(self) -> List[Dict[str, Any]]:
        """Get current prices for all Moroccan stocks."""
        cache_key = "moroccan_all_prices"

        # Check cache
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                return cached

        # Try bulk fetch first
        all_prices = self._fetch_all_from_api()

        # If bulk fetch failed, fetch individually
        if not all_prices:
            all_prices = []
            for symbol in self.stocks.keys():
                price = self.get_price(symbol)
                if price:
                    all_prices.append(price)

        # Cache results
        if self.cache and all_prices:
            self.cache.set(cache_key, all_prices, ex=self.default_cache_ttl)

        return all_prices

    def _fetch_from_casablanca_api(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch price from Casablanca Bourse API (Herokuapp)."""
        try:
            response = self.session.get(
                self.CASABLANCA_API,
                timeout=5
            )
            if response.status_code == 200:
                companies = response.json()
                stock_info = self.stocks[symbol]

                # Find the company by name (API uses names, not symbols)
                for company in companies:
                    company_name = company.get("name", "").lower()
                    if stock_info["name"].lower() in company_name or \
                       company_name in stock_info["name"].lower():
                        return self._normalize_casablanca_response(company, symbol)
        except Exception as e:
            logger.debug(f"Casablanca API error: {e}")
        return None

    def _normalize_casablanca_response(self, data: Dict, symbol: str) -> Dict[str, Any]:
        """Normalize Casablanca API response."""
        stock_info = self.stocks[symbol]
        last_price = float(data.get("lastPrice", 0))
        ref_price = float(data.get("referencePrice", last_price))
        change = last_price - ref_price if ref_price else 0
        change_pct = (change / ref_price * 100) if ref_price else 0

        return {
            "symbol": symbol,
            "name": stock_info["name"],
            "price": last_price,
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "volume": int(data.get("numberOfSharesTraded", 0)),
            "open": float(data.get("open", 0)),
            "high": float(data.get("intradayHigh", last_price)),
            "low": float(data.get("intradayLow", last_price)),
            "currency": "MAD",
            "market": "moroccan",
            "sector": stock_info.get("sector", ""),
            "isin": stock_info.get("isin", ""),
            "source": "casablanca_api",
            "timestamp": datetime.now().isoformat()
        }

    def _scrape_boursenews(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Scrape price from boursenews.ma."""
        try:
            response = self.session.get(self.BOURSENEWS_URL, timeout=10)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            stock_info = self.stocks[symbol]

            # Find stock row by name
            rows = soup.select('table tr') or soup.select('.stock-row')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 4:
                    name = cells[0].get_text(strip=True).lower()
                    if symbol.lower() in name or stock_info["name"].lower() in name:
                        price = self._parse_price(cells[1].get_text(strip=True))
                        change = self._parse_price(cells[2].get_text(strip=True))
                        change_pct = self._parse_price(cells[3].get_text(strip=True))

                        return {
                            "symbol": symbol,
                            "name": stock_info["name"],
                            "price": price,
                            "change": change,
                            "change_percent": change_pct,
                            "volume": 0,
                            "open": price,
                            "high": price,
                            "low": price,
                            "currency": "MAD",
                            "market": "moroccan",
                            "sector": stock_info.get("sector", ""),
                            "source": "boursenews",
                            "timestamp": datetime.now().isoformat()
                        }
        except Exception as e:
            logger.debug(f"BourseNews scraping error: {e}")
        return None

    def _scrape_leboursier(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Scrape price from leboursier.ma."""
        try:
            response = self.session.get(self.LEBOURSIER_URL, timeout=10)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            stock_info = self.stocks[symbol]

            # Find stock data
            rows = soup.select('.stock-item') or soup.select('tr[data-symbol]')
            for row in rows:
                text = row.get_text().lower()
                if symbol.lower() in text or stock_info["name"].lower() in text:
                    price_elem = row.select_one('.price, .cours, [class*="price"]')
                    if price_elem:
                        price = self._parse_price(price_elem.get_text())
                        return {
                            "symbol": symbol,
                            "name": stock_info["name"],
                            "price": price,
                            "change": 0,
                            "change_percent": 0,
                            "volume": 0,
                            "currency": "MAD",
                            "market": "moroccan",
                            "sector": stock_info.get("sector", ""),
                            "source": "leboursier",
                            "timestamp": datetime.now().isoformat()
                        }
        except Exception as e:
            logger.debug(f"LeBousier scraping error: {e}")
        return None

    def _fetch_all_from_api(self) -> Optional[List[Dict[str, Any]]]:
        """Fetch all prices from Casablanca API in one request."""
        try:
            response = self.session.get(self.CASABLANCA_API, timeout=10)
            if response.status_code == 200:
                companies = response.json()
                results = []

                # Build a name lookup for faster matching
                name_to_symbol = {}
                for symbol, info in self.stocks.items():
                    name_lower = info["name"].lower()
                    name_to_symbol[name_lower] = symbol
                    # Also add partial matches
                    for word in name_lower.split():
                        if len(word) > 3:
                            name_to_symbol[word] = symbol

                for company in companies:
                    company_name = company.get("name", "").lower()
                    matched_symbol = None

                    # Try to match company name to our symbol
                    for name_key, symbol in name_to_symbol.items():
                        if name_key in company_name or company_name in name_key:
                            matched_symbol = symbol
                            break

                    if matched_symbol:
                        results.append(
                            self._normalize_casablanca_response(company, matched_symbol)
                        )

                return results if results else None
        except Exception as e:
            logger.debug(f"Bulk API fetch error: {e}")
        return None

    def _get_mock_price(self, symbol: str) -> Dict[str, Any]:
        """Generate mock price data with realistic variation."""
        stock_info = self.stocks[symbol]
        base_price = stock_info["mock_price"]

        # Add random variation (-2% to +2%)
        variation = random.uniform(-0.02, 0.02)
        price = round(base_price * (1 + variation), 2)
        change = round(price - base_price, 2)
        change_pct = round(variation * 100, 2)

        return {
            "symbol": symbol,
            "name": stock_info["name"],
            "price": price,
            "change": change,
            "change_percent": change_pct,
            "volume": random.randint(10000, 500000),
            "open": round(base_price * (1 + random.uniform(-0.01, 0.01)), 2),
            "high": round(price * (1 + random.uniform(0, 0.02)), 2),
            "low": round(price * (1 - random.uniform(0, 0.02)), 2),
            "currency": "MAD",
            "market": "moroccan",
            "sector": stock_info.get("sector", ""),
            "isin": stock_info.get("isin", ""),
            "source": "mock",
            "timestamp": datetime.now().isoformat()
        }

    def _parse_price(self, text: str) -> float:
        """Parse price string to float."""
        try:
            # Remove currency symbols, spaces, and handle comma decimals
            clean = text.replace('MAD', '').replace(' ', '').replace('%', '')
            clean = clean.replace(',', '.').strip()
            return float(clean)
        except (ValueError, AttributeError):
            return 0.0

    def is_market_open(self) -> bool:
        """Check if Casablanca Bourse is open (Mon-Fri 9:30-15:30 Morocco time)."""
        now = datetime.now()
        if now.weekday() >= 5:  # Weekend
            return False
        hour = now.hour + now.minute / 60
        return 9.5 <= hour <= 15.5

    def get_sectors(self) -> List[str]:
        """Get list of all sectors."""
        sectors = set()
        for stock in self.stocks.values():
            if "sector" in stock:
                sectors.add(stock["sector"])
        return sorted(list(sectors))

    def get_stocks_by_sector(self, sector: str) -> List[str]:
        """Get symbols filtered by sector."""
        return [
            symbol for symbol, info in self.stocks.items()
            if info.get("sector", "").lower() == sector.lower()
        ]


# Singleton instance
_provider_instance = None


def get_moroccan_provider(cache_service=None) -> MoroccanMarketProvider:
    """Get or create singleton MoroccanMarketProvider instance."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = MoroccanMarketProvider(cache_service)
    return _provider_instance
