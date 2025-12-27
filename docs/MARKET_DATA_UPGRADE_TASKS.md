# TradeSense - Market Data Upgrade Tasks

## Overview

This document contains all tasks required to upgrade the market data system from the current structure to the new architecture.

---

## Phase 1: Moroccan Market Enhancement (Priority: HIGH)

### Task 1.1: Integrate Casablanca Bourse API
**Estimated Complexity:** Medium

**Steps:**
- [ ] Clone and analyze [lahcenkh/casablanca-bourse-api](https://github.com/lahcenkh/casablanca-bourse-api)
- [ ] Create `backend/services/market/moroccan_provider.py`
- [ ] Implement Medias24 API integration
- [ ] Add fallback to current scraper
- [ ] Expand stock list to 50+ symbols
- [ ] Add historical data support for Moroccan stocks
- [ ] Implement 30-second cache with Redis

**Files to Create/Modify:**
```
backend/services/market/
├── __init__.py
├── base_provider.py
└── moroccan_provider.py
```

**API Response Format:**
```json
{
  "symbol": "IAM",
  "name": "Maroc Telecom",
  "price": 118.50,
  "change": 2.30,
  "change_percent": 1.98,
  "volume": 125000,
  "open": 116.20,
  "high": 119.00,
  "low": 115.80,
  "currency": "MAD",
  "market": "moroccan",
  "timestamp": "2024-12-27T10:30:00Z"
}
```

---

### Task 1.2: Add More Moroccan Stocks
**Estimated Complexity:** Low

**Steps:**
- [ ] Research all BVC listed companies
- [ ] Add ISIN codes and metadata
- [ ] Create symbol mapping file
- [ ] Update frontend dropdown/search

**Stocks to Add (40+):**
```python
MOROCCAN_STOCKS = {
    # Banks
    "IAM": {"name": "Maroc Telecom", "isin": "MA0000011488"},
    "ATW": {"name": "Attijariwafa Bank", "isin": "MA0000011512"},
    "BCP": {"name": "Banque Centrale Populaire", "isin": "MA0000010928"},
    "CIH": {"name": "CIH Bank", "isin": "MA0000011058"},
    "BOA": {"name": "Bank of Africa", "isin": "MA0000010787"},
    "CDM": {"name": "Credit du Maroc", "isin": "MA0000010142"},
    "BMCI": {"name": "BMCI", "isin": "MA0000010092"},
    "CFG": {"name": "CFG Bank", "isin": "..."},

    # Insurance
    "WAA": {"name": "Wafa Assurance", "isin": "MA0000011124"},
    "SAH": {"name": "Saham Assurance", "isin": "..."},
    "ATL": {"name": "Atlanta", "isin": "..."},
    "RMA": {"name": "RMA Watanya", "isin": "..."},

    # Energy & Mining
    "TAQA": {"name": "Taqa Morocco", "isin": "MA0000011249"},
    "MNG": {"name": "Managem", "isin": "MA0000011348"},
    "CMT": {"name": "Compagnie Miniere de Touissit", "isin": "..."},
    "SMI": {"name": "SMI", "isin": "..."},

    # Real Estate
    "ADH": {"name": "Addoha", "isin": "MA0000011181"},
    "RDS": {"name": "Residences Dar Saada", "isin": "..."},
    "DLM": {"name": "Alliances Developpement", "isin": "..."},

    # Industry
    "LBV": {"name": "Label Vie", "isin": "MA0000011611"},
    "SNA": {"name": "SNEP", "isin": "..."},
    "HOL": {"name": "Holcim Maroc", "isin": "..."},
    "LAC": {"name": "LafargeHolcim Maroc", "isin": "..."},
    "SID": {"name": "Sonasid", "isin": "..."},
    "NEX": {"name": "Nexans Maroc", "isin": "..."},
    "JET": {"name": "Jet Contractors", "isin": "..."},
    "TIM": {"name": "Timar", "isin": "..."},

    # Telecom & Tech
    "HPS": {"name": "HPS", "isin": "MA0000011553"},
    "M2M": {"name": "M2M Group", "isin": "..."},
    "IBC": {"name": "IB Maroc", "isin": "..."},

    # Consumer
    "LES": {"name": "Lesieur Cristal", "isin": "..."},
    "CSR": {"name": "Cosumar", "isin": "..."},
    "BRA": {"name": "Brasseries du Maroc", "isin": "..."},
    "MUT": {"name": "Mutandis", "isin": "..."},
    "OUL": {"name": "Oulmes", "isin": "..."},
    "SBM": {"name": "Societe des Boissons du Maroc", "isin": "..."},
}
```

---

## Phase 2: Economic Calendar Integration (Priority: HIGH)

### Task 2.1: Integrate JBlanked Calendar API
**Estimated Complexity:** Medium

**Steps:**
- [ ] Sign up for JBlanked API key
- [ ] Create `backend/services/calendar/jblanked_provider.py`
- [ ] Implement daily and weekly event fetching
- [ ] Add automatic sync every 15 minutes
- [ ] Store events in database for offline access
- [ ] Update frontend calendar component

**API Integration:**
```python
class JBlankedCalendar:
    BASE_URL = "https://www.jblanked.com/news/api"

    def get_today_events(self):
        response = requests.get(f"{self.BASE_URL}/calendar/today")
        return self.normalize_events(response.json())

    def get_week_events(self):
        response = requests.get(f"{self.BASE_URL}/calendar/week")
        return self.normalize_events(response.json())

    def normalize_events(self, events):
        return [{
            "title": e["event"],
            "currency": e["currency"],
            "date": e["date"],
            "time": e["time"],
            "impact": self.map_impact(e["impact"]),
            "forecast": e.get("forecast"),
            "previous": e.get("previous"),
            "actual": e.get("actual"),
            "source": "jblanked"
        } for e in events]
```

---

### Task 2.2: Add Forex Factory Scraper (Backup)
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/calendar/forex_factory.py`
- [ ] Implement scraping with BeautifulSoup
- [ ] Add rate limiting (1 request per 5 seconds)
- [ ] Cache results for 1 hour
- [ ] Use as fallback when JBlanked unavailable

---

### Task 2.3: Add Moroccan Economic Events
**Estimated Complexity:** Low

**Steps:**
- [ ] Research Moroccan economic indicators (Bank Al-Maghrib, HCP)
- [ ] Add Morocco-specific events:
  - Bank Al-Maghrib interest rate decisions
  - Morocco CPI/Inflation data
  - Morocco GDP releases
  - Morocco unemployment data
- [ ] Create scraper for Bank Al-Maghrib website

---

## Phase 3: News Feed Integration (Priority: MEDIUM)

### Task 3.1: Integrate Alpha Vantage News API
**Estimated Complexity:** Medium

**Steps:**
- [ ] Get Alpha Vantage API key (free tier)
- [ ] Create `backend/services/news/alpha_vantage.py`
- [ ] Implement news fetching with sentiment scores
- [ ] Filter by topics and symbols
- [ ] Cache for 5 minutes

**API Call:**
```python
def get_market_news(self, topics="financial_markets", limit=50):
    url = f"https://www.alphavantage.co/query"
    params = {
        "function": "NEWS_SENTIMENT",
        "topics": topics,
        "apikey": self.api_key,
        "limit": limit
    }
    return requests.get(url, params=params).json()
```

---

### Task 3.2: Create News Aggregator Service
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/news/news_aggregator.py`
- [ ] Implement multi-source aggregation
- [ ] Add deduplication logic
- [ ] Rank by relevance and recency
- [ ] Filter by market (US, Crypto, Moroccan)

**Aggregator Logic:**
```python
class NewsAggregator:
    def get_news(self, market="all", limit=20):
        news = []

        # Fetch from all sources
        if market in ["all", "us", "crypto"]:
            news.extend(self.alpha_vantage.get_news())
            news.extend(self.finnhub.get_news())

        if market in ["all", "moroccan"]:
            news.extend(self.moroccan_scraper.get_news())

        # Deduplicate by title similarity
        news = self.deduplicate(news)

        # Sort by published date
        news.sort(key=lambda x: x["published_at"], reverse=True)

        return news[:limit]
```

---

### Task 3.3: Create Moroccan News Scraper
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/news/moroccan_news.py`
- [ ] Scrape from:
  - medias24.com (business news)
  - boursenews.ma (market news)
  - lematin.ma (economic section)
  - lavieeco.com (finance section)
- [ ] Extract title, summary, date
- [ ] Detect sentiment with AI

---

### Task 3.4: Build News Feed Frontend
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `frontend/src/components/news/NewsFeed.jsx`
- [ ] Create `frontend/src/components/news/NewsCard.jsx`
- [ ] Add sentiment badges (positive/negative/neutral)
- [ ] Add filtering by market/sentiment
- [ ] Implement infinite scroll
- [ ] Add breaking news banner

---

## Phase 4: Enhanced Signals System (Priority: MEDIUM)

### Task 4.1: Add Technical Analysis Indicators
**Estimated Complexity:** High

**Steps:**
- [ ] Create `backend/services/signals/technical_signals.py`
- [ ] Implement indicators:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Moving Averages (SMA, EMA)
  - Support/Resistance levels
- [ ] Calculate composite technical score
- [ ] Use TA-Lib or pandas-ta library

**Technical Score Calculation:**
```python
def calculate_technical_score(self, symbol):
    data = self.get_historical_data(symbol, period="1mo")

    rsi = self.calculate_rsi(data)
    macd = self.calculate_macd(data)
    bb = self.calculate_bollinger(data)

    score = 0
    signals = []

    # RSI
    if rsi < 30:
        score += 20
        signals.append("RSI oversold")
    elif rsi > 70:
        score -= 20
        signals.append("RSI overbought")

    # MACD
    if macd["histogram"] > 0 and macd["signal_cross"]:
        score += 25
        signals.append("MACD bullish cross")
    elif macd["histogram"] < 0:
        score -= 25
        signals.append("MACD bearish")

    return {"score": score, "signals": signals}
```

---

### Task 4.2: Add Sentiment-Based Signals
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/signals/sentiment_signals.py`
- [ ] Aggregate news sentiment for each symbol
- [ ] Calculate sentiment score (-100 to +100)
- [ ] Weight recent news higher
- [ ] Combine with technical signals

---

### Task 4.3: Signal History & Performance Tracking
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create signal_history database table
- [ ] Track signal outcomes (hit TP, hit SL, expired)
- [ ] Calculate win rate and profit factor
- [ ] Display performance on frontend
- [ ] Add signal leaderboard

---

## Phase 5: Forex Data Integration (Priority: LOW)

### Task 5.1: Add Forex Pairs
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/market/forex_provider.py`
- [ ] Integrate Twelve Data API (free tier)
- [ ] Add major pairs: EUR/USD, GBP/USD, USD/JPY
- [ ] Add MAD pairs: USD/MAD, EUR/MAD
- [ ] Update frontend market selector

**Forex Pairs to Add:**
```python
FOREX_PAIRS = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF",
    "AUD/USD", "USD/CAD", "NZD/USD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY",
    "USD/MAD", "EUR/MAD"  # Morocco
]
```

---

## Phase 6: Infrastructure Improvements (Priority: MEDIUM)

### Task 6.1: Implement Multi-Layer Caching
**Estimated Complexity:** High

**Steps:**
- [ ] Add in-memory LRU cache (Layer 1)
- [ ] Configure Redis with proper TTLs (Layer 2)
- [ ] Implement cache warming on startup
- [ ] Add cache invalidation logic
- [ ] Monitor cache hit rates

---

### Task 6.2: Add Circuit Breakers
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `backend/services/circuit_breaker.py`
- [ ] Implement for each external API
- [ ] Auto-fallback when service fails
- [ ] Add recovery logic
- [ ] Log circuit breaker events

---

### Task 6.3: Add Health Checks & Monitoring
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `/api/health` endpoints
- [ ] Check each data source status
- [ ] Add response time metrics
- [ ] Create admin dashboard for monitoring
- [ ] Set up alerts for failures

---

## Phase 7: Frontend Enhancements (Priority: MEDIUM)

### Task 7.1: Create Market Overview Dashboard
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `frontend/src/pages/dashboard/MarketOverview.jsx`
- [ ] Show all markets in tabs (US, Crypto, Moroccan, Forex)
- [ ] Add price grid with real-time updates
- [ ] Show market status indicators
- [ ] Add search functionality

---

### Task 7.2: Enhance Economic Calendar Page
**Estimated Complexity:** Medium

**Steps:**
- [ ] Update `frontend/src/pages/dashboard/CalendarPage.jsx`
- [ ] Add week view
- [ ] Add impact filtering
- [ ] Add currency filtering (include MAD)
- [ ] Show countdown to next event
- [ ] Add event notifications

---

### Task 7.3: Create Signal Dashboard
**Estimated Complexity:** Medium

**Steps:**
- [ ] Create `frontend/src/pages/dashboard/SignalsDashboard.jsx`
- [ ] Show top signals by market
- [ ] Display signal details (entry, SL, TP)
- [ ] Add technical analysis charts
- [ ] Show signal history and performance

---

## Implementation Timeline

### Week 1-2: Phase 1 (Moroccan Market)
- Task 1.1: Casablanca Bourse API
- Task 1.2: Expand stock list

### Week 3-4: Phase 2 (Economic Calendar)
- Task 2.1: JBlanked API
- Task 2.2: Forex Factory scraper
- Task 2.3: Moroccan events

### Week 5-6: Phase 3 (News Feed)
- Task 3.1: Alpha Vantage
- Task 3.2: News aggregator
- Task 3.3: Moroccan news scraper
- Task 3.4: Frontend news feed

### Week 7-8: Phase 4 (Enhanced Signals)
- Task 4.1: Technical indicators
- Task 4.2: Sentiment signals
- Task 4.3: Signal tracking

### Week 9-10: Phase 5-7 (Polish)
- Forex integration
- Infrastructure improvements
- Frontend enhancements

---

## Dependencies & API Keys Required

| Service | Type | Cost | Purpose |
|---------|------|------|---------|
| JBlanked | API Key | Free | Economic calendar |
| Alpha Vantage | API Key | Free (25/day) | News with sentiment |
| Finnhub | API Key | Free (60/min) | Stock news |
| Twelve Data | API Key | Free (800/day) | Forex data |
| CoinGecko | No key | Free | Crypto data |
| Medias24 | Scraping | Free | Moroccan stocks |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Moroccan stocks covered | 10 | 50+ |
| Data freshness (Morocco) | 60s | 30s |
| Economic events auto-synced | 0% | 100% |
| News sources | 0 | 4+ |
| Signal accuracy tracking | No | Yes |
| Forex pairs | 0 | 12 |
| Cache hit rate | Unknown | >90% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API rate limits | Multi-source fallback, caching |
| Scraping blocked | Multiple scraping sources, mock data fallback |
| Data quality issues | Validation, anomaly detection |
| Service downtime | Circuit breakers, fallback sources |

---

*Task List Created: December 2024*
*Last Updated: December 2024*
