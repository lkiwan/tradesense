# TradeSense - Current Market Data Structure

## Overview

This document describes the current architecture for market data, news, signals, and trading functionality in the TradeSense platform.

---

## 1. Data Sources & Services

### 1.1 US Stocks & Crypto - Yahoo Finance
**Service:** `backend/services/yfinance_service.py`

| Feature | Implementation | Cache TTL |
|---------|---------------|-----------|
| Real-time Prices | yfinance library | 3 seconds |
| Historical Data | yfinance library | 5 minutes |
| Stock Info | yfinance library | 5 minutes |

**Supported US Stocks (31):**
```
AAPL, TSLA, GOOGL, MSFT, AMZN, META, NVDA, NFLX, AMD, INTC,
CRM, ORCL, ADBE, PYPL, JPM, BAC, GS, V, MA, JNJ, PFE, UNH,
XOM, CVX, WMT, KO, PEP, MCD, NKE, DIS
```

**Supported Cryptocurrencies (14):**
```
BTC-USD, ETH-USD, XRP-USD, SOL-USD, ADA-USD, DOGE-USD,
DOT-USD, LINK-USD, AVAX-USD, SHIB-USD, LTC-USD, UNI-USD,
ATOM-USD, XLM-USD
```

### 1.2 Moroccan Stocks - Web Scraping
**Service:** `backend/services/market_scraper.py`

| Feature | Implementation | Cache TTL |
|---------|---------------|-----------|
| Current Prices | BeautifulSoup scraping | 60 seconds |
| Fallback | Mock data with ±2% variation | N/A |

**Data Sources:**
1. boursenews.ma (Primary)
2. leboursier.ma (Secondary)
3. Mock data (Fallback)

**Supported Moroccan Stocks (10):**
| Symbol | Company | Mock Price (MAD) |
|--------|---------|------------------|
| IAM | Maroc Telecom | 118.50 |
| ATW | Attijariwafa Bank | 485.00 |
| BCP | Banque Centrale Populaire | 268.00 |
| CIH | CIH Bank | 385.00 |
| TAQA | Taqa Morocco | 1,180.00 |
| LBV | Label Vie | 4,250.00 |
| MNG | Managem | 1,850.00 |
| BOA | Bank of Africa | 185.00 |
| CSR | Cosumar | 195.00 |
| HPS | HPS | 6,800.00 |

**Limitations:**
- No historical data for Moroccan stocks
- Prices are scraped (not real-time)
- No technical indicators
- Scraping can fail (falls back to mock)

### 1.3 AI Trading Signals - Google Gemini
**Service:** `backend/services/gemini_signals.py`

| Feature | Implementation | Cache TTL |
|---------|---------------|-----------|
| AI Signals | Gemini-pro API | 5 minutes |
| Fallback | Technical analysis logic | 5 minutes |

**Signal Response:**
```json
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "reason": "Analysis explanation",
  "entry_price": 150.00,
  "stop_loss": 145.00,
  "take_profit": 160.00,
  "ai_powered": true
}
```

**Technical Analysis Fallback Rules:**
- BUY: Price change > +3% (65% confidence) or > +1% (55%)
- SELL: Price change < -3% (65% confidence) or < -1% (55%)
- HOLD: Price change between -1% and +1%

---

## 2. API Endpoints

### 2.1 Market Data Routes
**File:** `backend/routes/market_data.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/price/<symbol>` | GET | Single symbol price |
| `/api/market/prices?category=` | GET | All prices by category |
| `/api/market/history/<symbol>` | GET | Historical OHLCV data |
| `/api/market/status` | GET | Market open/closed status |
| `/api/market/signal/<symbol>` | GET | AI signal for symbol |
| `/api/market/signals` | GET | Multiple signals |

### 2.2 Economic Calendar Routes
**File:** `backend/routes/resources.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resources/calendar` | GET | Events by date/impact |
| `/api/resources/calendar/week` | GET | Week's events |
| `/api/resources/calendar` | POST | Create event (admin) |

**Current Implementation:**
- Database-stored events (manual entry)
- No automatic sync with external calendars
- Mock data for demo purposes

---

## 3. Real-Time Data - WebSocket

**Service:** `backend/services/websocket_service.py`

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client→Server | Connection init |
| `authenticate` | Client→Server | JWT auth |
| `subscribe_prices` | Client→Server | Subscribe to symbols |
| `unsubscribe_prices` | Client→Server | Unsubscribe |
| `price_update` | Server→Client | Price broadcast |
| `prices_batch` | Server→Client | Batch updates |
| `trade_update` | Server→Client | Trade notifications |

### Price Update Interval
- **Frequency:** Every 3 seconds
- **Pre-cached Symbols:** AAPL, GOOGL, MSFT, TSLA, AMZN, META, NVDA, BTC-USD, ETH-USD

---

## 4. Caching Strategy

**Service:** `backend/services/cache_service.py`

| Cache Backend | Priority | Use Case |
|---------------|----------|----------|
| Redis | Primary | Production |
| SimpleCache | Fallback | Development/No Redis |

### Cache TTL by Data Type
| Data Type | TTL |
|-----------|-----|
| Real-time prices | 3-5 seconds |
| Signals | 30 seconds |
| Moroccan stocks | 60 seconds |
| AI signals | 5 minutes |
| Historical data | 5 minutes |

---

## 5. MT4/MT5 Integration

**Service:** `backend/services/metaapi_service.py`

| Feature | Status |
|---------|--------|
| Account Connection | Implemented |
| Real-time Sync | Implemented |
| Trade Execution | Implemented |
| Position Management | Implemented |

**Provider:** MetaAPI.cloud

---

## 6. Frontend Integration

### API Client
**File:** `frontend/src/services/api.js`

```javascript
marketAPI.getPrice(symbol)
marketAPI.getAllPrices(category)
marketAPI.getHistory(symbol, period, interval)
marketAPI.getSignal(symbol)
marketAPI.getAllSignals(symbols)
marketAPI.getMarketStatus()
```

### WebSocket Context
**File:** `frontend/src/context/SocketContext.jsx`

- Auto-reconnection with exponential backoff
- Price listener callbacks
- Real-time trade updates

---

## 7. Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   REST API   │  │  WebSocket   │  │   Components     │  │
│  │   (Axios)    │  │ (Socket.IO)  │  │   SignalsPanel   │  │
│  └──────┬───────┘  └──────┬───────┘  │   CalendarPage   │  │
│         │                 │          │   TradingView    │  │
└─────────┼─────────────────┼──────────┴──────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (market_data.py)             │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┼───────────────────────────────┐  │
│  │                 SERVICES LAYER                        │  │
│  ├──────────────┬───────┴──────┬──────────────┬────────┤  │
│  │  YFinance    │  Market      │  Gemini      │ MetaAPI │  │
│  │  Service     │  Scraper     │  Signals     │ Service │  │
│  │  (US/Crypto) │  (Morocco)   │  (AI)        │ (MT4/5) │  │
│  └──────┬───────┴──────┬───────┴──────┬───────┴────┬───┘  │
│         │              │              │            │       │
│  ┌──────┴──────────────┴──────────────┴────────────┴───┐  │
│  │                  CACHE LAYER (Redis)                 │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │              │              │            │
          ▼              ▼              ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Yahoo   │  │ Bourse   │  │  Google  │  │ MetaAPI  │
    │ Finance  │  │ News.ma  │  │  Gemini  │  │  Cloud   │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 8. Known Issues & Limitations

### Data Quality
1. **Moroccan Data:** Unreliable scraping, often falls back to mock data
2. **No Historical Data:** For Moroccan stocks
3. **Economic Calendar:** Manual entry, no auto-sync

### Performance
1. **Rate Limits:** Yahoo Finance has request limits
2. **Scraping Delays:** Moroccan data can be 1-5 minutes delayed
3. **AI Signals:** 5-minute cache may be stale for fast markets

### Missing Features
1. No real-time news feed
2. No sentiment analysis
3. No forex data (EUR/USD, GBP/USD, etc.)
4. No commodities (Gold, Oil, etc.)
5. No advanced technical indicators
6. No dividend calendar
7. No earnings calendar

---

## 9. Environment Variables

```env
# Market Data
GEMINI_API_KEY=xxx        # Google Gemini for AI signals

# MT4/MT5
METAAPI_TOKEN=xxx         # MetaAPI.cloud token
MT_ENCRYPTION_KEY=xxx     # Password encryption

# Cache
REDIS_URL=redis://localhost:6379/0
```

---

*Last Updated: December 2024*
