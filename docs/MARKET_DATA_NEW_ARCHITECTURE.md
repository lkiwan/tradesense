# TradeSense - New Market Data Architecture

## Overview

This document outlines the proposed new architecture for a robust, scalable market data system with real Moroccan market integration, live news feeds, and enhanced trading signals.

---

## 1. Data Sources Strategy

### 1.1 Moroccan Market Data (Priority: HIGH)

#### Option A: Casablanca Bourse API (Recommended)
**GitHub Projects:**
- [lahcenkh/casablanca-bourse-api](https://github.com/lahcenkh/casablanca-bourse-api) - Python script fetching from Medias24 API
- [AmineDaou/casablanca-bourse-api](https://github.com/AmineDaou/casablanca-bourse-api) - Spring Boot REST API with Jsoup

**Implementation Strategy:**
```
┌─────────────────────────────────────────────────────────┐
│              MOROCCAN DATA PIPELINE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Primary    │    │   Backup     │    │  Fallback │ │
│  │  Medias24    │───▶│  BVC Website │───▶│   Mock    │ │
│  │    API       │    │  Scraping    │    │   Data    │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │       │
│         └───────────────────┴───────────────────┘       │
│                             │                           │
│                    ┌────────▼────────┐                  │
│                    │   Data Validator │                 │
│                    │   & Normalizer   │                 │
│                    └────────┬────────┘                  │
│                             │                           │
│                    ┌────────▼────────┐                  │
│                    │   Redis Cache   │                  │
│                    │   (30s TTL)     │                  │
│                    └─────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

**Expanded Moroccan Stocks (50+):**
| Category | Stocks |
|----------|--------|
| Banks | IAM, ATW, BCP, CIH, BOA, CDM, BMCI, CFG |
| Insurance | WAA, SAH, ATL, RMA, AFMA |
| Energy | TAQA, MNG, CMT, SMI |
| Real Estate | ADH, RDS, DLM, ALL |
| Industry | LBV, SNA, HOL, NEX, JET, SID, OUL |
| Telecom/Tech | HPS, M2M, DIS, IBC |
| Consumer | LES, MUT, TIM, SBM, BRA |

### 1.2 Economic Calendar & News

#### Primary: JBlanked News API (FREE)
**URL:** https://www.jblanked.com/news/api/docs/calendar/

**Features:**
- Real-time forex news from MQL5, Forex Factory, FxStreet
- JSON responses with event details
- Daily and weekly event endpoints
- 1 request/second rate limit

**Endpoints:**
```
GET /api/news/calendar/today
GET /api/news/calendar/week
GET /api/news/calendar?currency=USD&impact=high
```

#### Secondary: Finnhub (FREE tier)
**URL:** https://finnhub.io/docs/api/economic-calendar

**Features:**
- Economic calendar with 60 API calls/minute
- Market news aggregation
- Earnings calendar
- Company news

#### Backup: Custom Scraper
- Forex Factory scraping (when APIs unavailable)
- Investing.com calendar scraping

### 1.3 Financial News Feed

#### Alpha Vantage News API (FREE)
**URL:** https://www.alphavantage.co/

**Features:**
- Market news with sentiment scores
- AI-powered sentiment analysis
- Topic filtering
- 25 requests/day (free tier)

#### Implementation:
```python
# News aggregation service
class NewsAggregator:
    sources = [
        AlphaVantageNews(),
        FinnhubNews(),
        ForexFactoryNews(),
        MoroccanNewsScaper()  # Local news
    ]

    def get_news(self, category, limit=20):
        # Aggregate from all sources
        # Deduplicate and rank by relevance
        # Return unified format
```

### 1.4 Enhanced US/Crypto Data

#### Keep: Yahoo Finance (yfinance)
- Reliable for US stocks
- Good crypto coverage
- Free with no API key

#### Add: Twelve Data API (FREE tier)
- Real-time quotes
- Technical indicators (RSI, MACD, etc.)
- 800 API calls/day free

#### Add: CoinGecko API (FREE)
- Comprehensive crypto data
- Market cap rankings
- Historical data
- No API key required

### 1.5 Forex Data (NEW)

#### Primary: Twelve Data
```
EUR/USD, GBP/USD, USD/JPY, USD/MAD, EUR/MAD
```

#### Backup: Alpha Vantage
- Currency exchange rates
- Forex daily/weekly data

---

## 2. New Service Architecture

### 2.1 Backend Services Structure

```
backend/services/
├── market/
│   ├── __init__.py
│   ├── base_provider.py        # Abstract base class
│   ├── us_stocks_provider.py   # Yahoo Finance
│   ├── crypto_provider.py      # CoinGecko + Yahoo
│   ├── moroccan_provider.py    # Medias24 + Scraper
│   ├── forex_provider.py       # Twelve Data
│   └── commodities_provider.py # Gold, Oil, etc.
│
├── news/
│   ├── __init__.py
│   ├── news_aggregator.py      # Main aggregator
│   ├── alpha_vantage.py        # Alpha Vantage news
│   ├── finnhub_news.py         # Finnhub news
│   ├── moroccan_news.py        # Local news scraper
│   └── sentiment_analyzer.py   # AI sentiment
│
├── calendar/
│   ├── __init__.py
│   ├── economic_calendar.py    # Main calendar service
│   ├── jblanked_provider.py    # JBlanked API
│   ├── forex_factory.py        # FF scraper
│   └── earnings_calendar.py    # Earnings dates
│
├── signals/
│   ├── __init__.py
│   ├── signal_engine.py        # Main signal generator
│   ├── ai_signals.py           # Gemini AI signals
│   ├── technical_signals.py    # Technical analysis
│   └── sentiment_signals.py    # News sentiment signals
│
└── cache/
    ├── __init__.py
    ├── redis_cache.py          # Redis implementation
    └── cache_manager.py        # Unified cache interface
```

### 2.2 Data Models

#### Unified Price Model
```python
@dataclass
class MarketPrice:
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float]
    high_24h: float
    low_24h: float
    open: float
    previous_close: float
    timestamp: datetime
    source: str  # 'yahoo', 'medias24', 'coingecko'
    market: str  # 'us', 'crypto', 'moroccan', 'forex'
    currency: str  # 'USD', 'MAD', 'EUR'
```

#### Economic Event Model
```python
@dataclass
class EconomicEvent:
    id: str
    title: str
    country: str
    currency: str
    date: datetime
    time: str
    impact: str  # 'high', 'medium', 'low'
    forecast: Optional[str]
    previous: Optional[str]
    actual: Optional[str]
    source: str
    category: str  # 'interest_rate', 'employment', 'gdp', etc.
```

#### News Article Model
```python
@dataclass
class NewsArticle:
    id: str
    title: str
    summary: str
    content: str
    source: str
    url: str
    published_at: datetime
    symbols: List[str]  # Related symbols
    sentiment: str  # 'positive', 'negative', 'neutral'
    sentiment_score: float  # -1 to 1
    categories: List[str]
    image_url: Optional[str]
```

#### Enhanced Signal Model
```python
@dataclass
class TradingSignal:
    symbol: str
    signal: str  # 'BUY', 'SELL', 'HOLD'
    confidence: int  # 0-100

    # Price levels
    entry_price: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    take_profit_3: float

    # Analysis
    technical_score: int
    sentiment_score: int
    ai_score: int

    # Metadata
    timeframe: str  # '15m', '1h', '4h', '1d'
    risk_reward_ratio: float
    analysis: str
    indicators: Dict[str, Any]  # RSI, MACD, etc.

    timestamp: datetime
    expires_at: datetime
```

---

## 3. API Endpoints (New)

### 3.1 Market Data API v2

```
# Prices
GET /api/v2/market/price/{symbol}
GET /api/v2/market/prices?market=us|crypto|moroccan|forex
GET /api/v2/market/prices/batch?symbols=AAPL,IAM,BTC-USD

# Historical
GET /api/v2/market/history/{symbol}?period=1d|1w|1m|3m|1y&interval=1m|5m|1h|1d

# Market Status
GET /api/v2/market/status
GET /api/v2/market/hours

# Search
GET /api/v2/market/search?q=maroc&market=moroccan
```

### 3.2 News API

```
# News Feed
GET /api/v2/news/feed?category=all|stocks|crypto|forex|moroccan
GET /api/v2/news/feed?symbols=AAPL,IAM
GET /api/v2/news/feed?sentiment=positive|negative

# Single Article
GET /api/v2/news/article/{id}

# Trending
GET /api/v2/news/trending
```

### 3.3 Economic Calendar API

```
# Calendar
GET /api/v2/calendar/events?date=2024-12-27
GET /api/v2/calendar/events/today
GET /api/v2/calendar/events/week
GET /api/v2/calendar/events?impact=high&currency=USD,EUR,MAD

# Earnings
GET /api/v2/calendar/earnings?date=2024-12-27
GET /api/v2/calendar/earnings/week
```

### 3.4 Signals API

```
# Signals
GET /api/v2/signals/{symbol}
GET /api/v2/signals?symbols=AAPL,IAM,BTC-USD
GET /api/v2/signals/top?market=all|us|crypto|moroccan

# Signal History
GET /api/v2/signals/{symbol}/history?period=7d
GET /api/v2/signals/performance
```

---

## 4. Real-Time Architecture

### 4.1 WebSocket Events (Enhanced)

```javascript
// Price Streaming
socket.on('price_update', { symbol, price, change, volume })
socket.on('prices_batch', [{ symbol, price, ... }, ...])

// News Streaming
socket.on('news_alert', { title, sentiment, symbols })
socket.on('breaking_news', { title, impact, ... })

// Calendar Events
socket.on('event_released', { event, actual, impact })
socket.on('event_upcoming', { event, time_until })

// Signal Alerts
socket.on('signal_new', { symbol, signal, confidence })
socket.on('signal_update', { symbol, signal, reason })

// Trade Updates
socket.on('trade_executed', { ... })
socket.on('trade_closed', { ... })
```

### 4.2 Push Notifications

```python
class NotificationService:
    def send_signal_alert(user_id, signal):
        # Push notification for new signals

    def send_news_alert(user_id, news):
        # Alert for breaking news

    def send_event_reminder(user_id, event):
        # Reminder before high-impact events
```

---

## 5. Caching Strategy (Enhanced)

### 5.1 Multi-Layer Cache

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: In-Memory (LRU Cache)                         │
│  ├── Hot data (most requested symbols)                  │
│  ├── TTL: 1-3 seconds                                   │
│  └── Size: 1000 items                                   │
│                                                          │
│  Layer 2: Redis                                          │
│  ├── All prices, signals, news                          │
│  ├── TTL: 5-60 seconds (by data type)                   │
│  └── Pub/Sub for real-time updates                      │
│                                                          │
│  Layer 3: Database (PostgreSQL)                         │
│  ├── Historical data                                     │
│  ├── User watchlists                                     │
│  └── Signal history                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Cache TTL by Data Type

| Data Type | L1 (Memory) | L2 (Redis) | Notes |
|-----------|-------------|------------|-------|
| US Prices | 1s | 3s | Real-time critical |
| Crypto Prices | 1s | 3s | 24/7 market |
| Moroccan Prices | 5s | 30s | Market hours only |
| Forex Prices | 1s | 5s | Real-time critical |
| AI Signals | 30s | 5m | Computationally expensive |
| Tech Signals | 10s | 1m | Fast calculation |
| News Feed | 30s | 5m | Updates frequently |
| Economic Events | 1m | 10m | Updates on release |

---

## 6. Frontend Architecture

### 6.1 New Components

```
frontend/src/
├── components/
│   ├── market/
│   │   ├── PriceCard.jsx
│   │   ├── PriceTable.jsx
│   │   ├── MarketOverview.jsx
│   │   └── MoroccanMarket.jsx
│   │
│   ├── news/
│   │   ├── NewsFeed.jsx
│   │   ├── NewsCard.jsx
│   │   ├── BreakingNews.jsx
│   │   └── SentimentBadge.jsx
│   │
│   ├── calendar/
│   │   ├── EconomicCalendar.jsx
│   │   ├── EventCard.jsx
│   │   ├── EarningsCalendar.jsx
│   │   └── EventCountdown.jsx
│   │
│   └── signals/
│       ├── SignalCard.jsx
│       ├── SignalPanel.jsx
│       ├── SignalHistory.jsx
│       └── SignalPerformance.jsx
│
├── hooks/
│   ├── useMarketData.js
│   ├── useNews.js
│   ├── useCalendar.js
│   └── useSignals.js
│
└── context/
    ├── MarketContext.jsx
    ├── NewsContext.jsx
    └── SignalContext.jsx
```

### 6.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  TRADESENSE TRADING DASHBOARD                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Market Status  │  │      Breaking News Banner    │  │
│  │  US: Open       │  │  "Fed announces rate hold"   │  │
│  │  Crypto: 24/7   │  └─────────────────────────────┘  │
│  │  Morocco: Closed│                                    │
│  └─────────────────┘                                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │            MARKET TABS                           │   │
│  │  [US Stocks] [Crypto] [Moroccan] [Forex] [All]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────┬──────────────────────────┐   │
│  │    PRICE GRID        │    TOP SIGNALS           │   │
│  │  ┌────┬────┬────┐   │  ┌──────────────────┐    │   │
│  │  │AAPL│TSLA│NVDA│   │  │ BUY IAM 85%     │    │   │
│  │  │+2.1│-1.2│+3.4│   │  │ SELL TSLA 72%   │    │   │
│  │  └────┴────┴────┘   │  │ BUY BTC 68%     │    │   │
│  │  ┌────┬────┬────┐   │  └──────────────────┘    │   │
│  │  │BTC │ETH │SOL │   │                          │   │
│  │  │+5.2│+3.1│+8.4│   │  UPCOMING EVENTS         │   │
│  │  └────┴────┴────┘   │  ┌──────────────────┐    │   │
│  │  ┌────┬────┬────┐   │  │ NFP in 2h 30m   │    │   │
│  │  │IAM │ATW │BCP │   │  │ ECB Rate 3:00pm │    │   │
│  │  │118 │485 │268 │   │  └──────────────────┘    │   │
│  │  └────┴────┴────┘   │                          │   │
│  └──────────────────────┴──────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              NEWS FEED (Scrollable)              │   │
│  │  📈 Apple beats earnings expectations [+]       │   │
│  │  📉 Morocco inflation rises to 4.2% [-]         │   │
│  │  🔄 Bitcoin consolidates near $100K [neutral]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Database Schema Updates

### New Tables

```sql
-- News articles
CREATE TABLE news_articles (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT,
    source VARCHAR(100),
    url VARCHAR(500),
    published_at TIMESTAMP,
    sentiment VARCHAR(20),
    sentiment_score DECIMAL(3,2),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- News-Symbol relation
CREATE TABLE news_symbols (
    news_id UUID REFERENCES news_articles(id),
    symbol VARCHAR(20),
    PRIMARY KEY (news_id, symbol)
);

-- Signal history
CREATE TABLE signal_history (
    id UUID PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    signal VARCHAR(10) NOT NULL,
    confidence INTEGER,
    entry_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    technical_score INTEGER,
    sentiment_score INTEGER,
    ai_score INTEGER,
    analysis TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expired_at TIMESTAMP,
    outcome VARCHAR(20)  -- 'hit_tp', 'hit_sl', 'expired'
);

-- User watchlists
CREATE TABLE user_watchlists (
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20),
    market VARCHAR(20),
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, symbol)
);

-- Price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20),
    condition VARCHAR(20),  -- 'above', 'below'
    price DECIMAL(20,8),
    triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Security Considerations

### API Rate Limiting (per user)
| Endpoint | Rate Limit |
|----------|------------|
| /market/price | 60/min |
| /market/prices | 30/min |
| /signals | 20/min |
| /news | 30/min |
| WebSocket | 100 events/min |

### Data Validation
- Sanitize all scraped data
- Validate price ranges (detect anomalies)
- Rate limit external API calls
- Implement circuit breakers

---

## 9. Monitoring & Alerts

### Health Checks
```
GET /api/health/market     # Market data sources
GET /api/health/news       # News sources
GET /api/health/calendar   # Calendar sources
GET /api/health/cache      # Cache status
```

### Metrics to Track
- API response times
- Cache hit/miss ratios
- Data freshness
- Error rates by source
- WebSocket connection count

---

*Proposed Architecture - December 2024*
