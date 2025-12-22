# TradeSense - Complete Project Structure & User Journey

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure](#file-structure)
4. [User Journey & Access Control](#user-journey--access-control)
5. [API Endpoints](#api-endpoints)
6. [Database Models](#database-models)
7. [Frontend Components](#frontend-components)
8. [Features by User State](#features-by-user-state)

---

## Project Overview

TradeSense is a prop trading platform that allows users to:
- Start with a free 7-day trial ($5,000 virtual capital)
- Complete a 2-phase challenge (FTMO style)
- Become a funded trader with 80% profit split
- Trade on real market data with simulated capital

---

## Technology Stack

### Backend
- **Framework:** Flask (Python)
- **Database:** SQLAlchemy with SQLite/PostgreSQL
- **Authentication:** Flask-JWT-Extended
- **Real-time:** Flask-SocketIO
- **Scheduler:** APScheduler (for auto-charging trials)
- **Payment:** PayPal SDK

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **State:** React Context API
- **HTTP:** Axios
- **Real-time:** Socket.IO Client
- **i18n:** react-i18next

---

## File Structure

```
TradeSense/
├── backend/
│   ├── app.py                      # Main Flask application entry point
│   ├── config.py                   # Configuration (plans, rules, secrets)
│   ├── models/
│   │   ├── __init__.py             # SQLAlchemy init & model imports
│   │   ├── user.py                 # User model (auth, roles)
│   │   ├── challenge.py            # UserChallenge model (phases, balance)
│   │   ├── trade.py                # Trade model (positions)
│   │   ├── payment.py              # Payment model (transactions)
│   │   ├── subscription.py         # Subscription model (trial tracking)
│   │   ├── payout.py               # Payout model (withdrawals)
│   │   └── settings.py             # App settings model
│   ├── routes/
│   │   ├── __init__.py             # Blueprint registration
│   │   ├── auth.py                 # Authentication routes
│   │   ├── challenges.py           # Challenge management routes
│   │   ├── trades.py               # Trading routes
│   │   ├── market_data.py          # Market data & prices
│   │   ├── payments.py             # Payment processing
│   │   ├── subscriptions.py        # Trial subscription routes
│   │   ├── payouts.py              # Payout/withdrawal routes
│   │   ├── leaderboard.py          # Leaderboard routes
│   │   └── admin.py                # Admin panel routes
│   └── services/
│       ├── challenge_engine.py     # Challenge evaluation & phase transitions
│       ├── payment_gateway.py      # PayPal integration
│       ├── market_service.py       # Market data fetching
│       ├── ai_signals.py           # AI trading signals (Gemini)
│       ├── email_service.py        # Email notifications
│       ├── scheduler_service.py    # Background jobs (trial charging)
│       └── websocket_service.py    # Real-time price updates
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                # App entry point with providers
│   │   ├── App.jsx                 # Routes & access control
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   ├── ChallengeContext.jsx # Challenge/phase state
│   │   │   ├── ThemeContext.jsx    # Dark/light mode
│   │   │   ├── LanguageContext.jsx # i18n language
│   │   │   └── SocketContext.jsx   # WebSocket connection
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Homepage
│   │   │   ├── Login.jsx           # Login form
│   │   │   ├── Register.jsx        # Registration form
│   │   │   ├── Dashboard.jsx       # Trading dashboard
│   │   │   ├── Pricing.jsx         # Challenge pricing
│   │   │   ├── Checkout.jsx        # Payment checkout
│   │   │   ├── FreeTrial.jsx       # Free trial info
│   │   │   ├── TrialCheckout.jsx   # Trial PayPal authorization
│   │   │   ├── TrialConfirm.jsx    # Trial confirmation
│   │   │   ├── LeaderboardPage.jsx # Top traders
│   │   │   ├── MasterClass.jsx     # Educational content
│   │   │   ├── Community.jsx       # Community forum
│   │   │   ├── News.jsx            # Market news
│   │   │   ├── AdminPanel.jsx      # Admin dashboard
│   │   │   └── SuperAdmin.jsx      # Super admin settings
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation with phase badge
│   │   │   ├── Footer.jsx          # Site footer
│   │   │   ├── PhaseProgress.jsx   # Phase timeline component
│   │   │   ├── PriceChart.jsx      # Trading chart
│   │   │   ├── TradeForm.jsx       # Open position form
│   │   │   ├── SignalsPanel.jsx    # AI signals display
│   │   │   ├── PriceTicker.jsx     # Live prices ticker
│   │   │   └── MarketStatus.jsx    # Market open/closed
│   │   ├── services/
│   │   │   └── api.js              # API client with all endpoints
│   │   └── utils/
│   │       └── errorHandler.js     # Error handling utilities
│   └── public/
│       └── assets/                 # Static assets
│
└── PROJECT_STRUCTURE.md            # This file
```

---

## User Journey & Access Control

### Page Access Matrix

| Page | Visitor | Registered | Has Challenge | Funded | Admin |
|------|:-------:|:----------:|:-------------:|:------:|:-----:|
| Landing `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Login `/login` | ✅ | → Dashboard | → Dashboard | → Dashboard | → Dashboard |
| Register `/register` | ✅ | → Dashboard | → Dashboard | → Dashboard | → Dashboard |
| Pricing `/pricing` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Free Trial `/free-trial` | ✅ | ✅ | → Dashboard | → Dashboard | ✅ |
| Leaderboard `/leaderboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| News `/news` | ✅ | ✅ | ✅ | ✅ | ✅ |
| MasterClass `/masterclass` | → Login | ✅ | ✅ | ✅ | ✅ |
| Community `/community` | → Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard `/dashboard` | → Login | → Pricing | ✅ | ✅ | ✅ |
| Checkout `/checkout/*` | → Login | ✅ | ✅ | ✅ | ✅ |
| Admin `/admin` | ❌ | ❌ | ❌ | ❌ | ✅ |
| SuperAdmin `/superadmin` | ❌ | ❌ | ❌ | ❌ | SuperAdmin |

---

## Features by User State

### 1. VISITOR (Not Logged In)

**What they can SEE:**
```
┌─────────────────────────────────────────────────────────────┐
│                        NAVBAR                                │
│  Logo | Pricing | Essai Gratuit | Leaderboard | News        │
│        MasterClass 🔒 | Community 🔒 | [Login] [Register]   │
└─────────────────────────────────────────────────────────────┘
```

**Pages Accessible:**
| Page | Features |
|------|----------|
| **Landing Page** | Hero section, features overview, testimonials, CTA buttons |
| **Pricing** | View all plans (Starter $200, Pro $500, Elite $1000), compare features |
| **Free Trial** | Learn about 7-day trial, select plan for after trial |
| **Leaderboard** | View top traders, rankings, profits |
| **News** | Read market news articles |

**Actions Available:**
- ✅ View all public pages
- ✅ Read pricing information
- ✅ See leaderboard rankings
- ✅ Read news articles
- ✅ Switch theme (dark/light)
- ✅ Change language (FR/EN/AR)
- ❌ Cannot access Dashboard
- ❌ Cannot access MasterClass (redirects to login)
- ❌ Cannot access Community (redirects to login)
- ❌ Cannot trade

---

### 2. REGISTERED USER (Logged In, No Challenge)

**What they can SEE:**
```
┌─────────────────────────────────────────────────────────────┐
│                        NAVBAR                                │
│  Logo | Dashboard 🔒 | Pricing | Essai Gratuit | Leaderboard │
│        MasterClass | Community | News | [User Menu ▼]       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER MENU                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Acheter un Challenge (highlighted)                     ││
│  │  Admin Panel (if admin)                                 ││
│  │  ─────────────────────────────────────────              ││
│  │  Déconnexion                                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Pages Accessible:**
| Page | Features |
|------|----------|
| **All Visitor Pages** | Same as visitor |
| **MasterClass** | Educational videos, trading strategies, courses |
| **Community** | Forum discussions, trader chat, share ideas |
| **Checkout** | Purchase a challenge plan |
| **Trial Checkout** | Start free trial with PayPal authorization |

**Actions Available:**
- ✅ All visitor actions
- ✅ Access MasterClass content
- ✅ Participate in Community
- ✅ Purchase a challenge ($200-$1000)
- ✅ Start free 7-day trial
- ✅ View/edit profile
- ✅ Logout
- ❌ Cannot access Dashboard (redirected to Pricing)
- ❌ Cannot trade

**API Endpoints Available:**
```
GET  /api/auth/me           - Get user profile
PUT  /api/auth/me           - Update profile
GET  /api/payments/plans    - Get available plans
POST /api/payments/checkout - Create payment
POST /api/subscriptions/trial/start - Start trial
```

---

### 3. TRIAL USER (7-Day Free Trial Active)

**What they can SEE:**
```
┌─────────────────────────────────────────────────────────────┐
│                        NAVBAR                                │
│  Logo | Dashboard | Pricing | Leaderboard | MasterClass     │
│        Community | News | [🔵 Essai 5j] | [User Menu ▼]     │
└─────────────────────────────────────────────────────────────┘
```

**Dashboard View:**
```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🕐 Essai Gratuit          [🔵 Essai] [5j restants]    │ │
│  │ Plan STARTER - Depuis 15 Dec 2024                      │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ACCOUNT OVERVIEW                                            │
│  ┌────────┐ ┌────────┐ ┌────────────┐ ┌──────────┐         │
│  │Balance │ │Equity  │ │Objectif    │ │Drawdown  │         │
│  │$5,000  │ │$5,050  │ │1.0%/10%    │ │0.5%/10%  │         │
│  └────────┘ └────────┘ └────────────┘ └──────────┘         │
├─────────────────────────────────────────────────────────────┤
│  PHASE PROGRESS                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Essai Gratuit - 7 jours pour atteindre 10% de profit   ││
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10%    ││
│  │                                                          ││
│  │ [●Essai]────[○Phase 1]────[○Phase 2]────[○Fundé]       ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  TRADING INTERFACE                                           │
│  ┌─────────────────────────────┐ ┌────────────────────────┐ │
│  │                             │ │   TRADE FORM           │ │
│  │      PRICE CHART            │ │   Symbol: AAPL         │ │
│  │      (TradingView)          │ │   Type: BUY/SELL       │ │
│  │                             │ │   Quantity: 10         │ │
│  │                             │ │   [Open Position]      │ │
│  └─────────────────────────────┘ └────────────────────────┘ │
│  ┌─────────────────────────────┐ ┌────────────────────────┐ │
│  │   OPEN POSITIONS            │ │   AI SIGNALS           │ │
│  │   AAPL LONG +$25.50         │ │   AAPL: BUY 85%       │ │
│  │   [Close]                   │ │   TSLA: SELL 72%      │ │
│  └─────────────────────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Features Available:**
| Feature | Description |
|---------|-------------|
| **Live Trading** | Open/close positions on real market data |
| **Price Charts** | Real-time charts with multiple timeframes |
| **AI Signals** | Gemini-powered buy/sell recommendations |
| **Open Positions** | View and manage current trades |
| **Trade History** | See all closed trades with PnL |
| **Phase Progress** | Visual timeline of challenge phases |
| **Market Status** | See if markets are open/closed |
| **Live Prices** | Real-time ticker with prices |

**Trading Rules (Trial):**
```
┌─────────────────────────────────────────┐
│ TRIAL RULES                             │
│ ─────────────────────────────────────── │
│ Initial Balance: $5,000                 │
│ Profit Target:   +10% ($500)            │
│ Max Daily Loss:  -5% ($250)             │
│ Max Total Loss:  -10% ($500)            │
│ Duration:        7 days                 │
│ ─────────────────────────────────────── │
│ After Trial:                            │
│ - Pass (10% profit) → Phase 1           │
│ - Expire (7 days) → Auto-charge plan    │
│ - Fail (loss limits) → Trial ended      │
└─────────────────────────────────────────┘
```

**API Endpoints Available:**
```
# Challenge
GET  /api/challenges/active     - Get active challenge
GET  /api/challenges/:id/stats  - Get challenge statistics

# Trading
GET  /api/trades                - Get all trades
POST /api/trades/open           - Open new position
POST /api/trades/:id/close      - Close position
GET  /api/trades/open/pnl       - Get open positions PnL

# Market
GET  /api/market/price/:symbol  - Get current price
GET  /api/market/prices         - Get all prices
GET  /api/market/history/:symbol - Get price history
GET  /api/market/signal/:symbol - Get AI signal
GET  /api/market/status         - Get market status

# Subscription
GET  /api/subscriptions/trial/status - Get trial status
POST /api/subscriptions/trial/cancel - Cancel trial
```

---

### 4. PHASE 1: EVALUATION (Paid Challenge)

**Navbar Badge:** `[🟣 Phase 1]`

**Dashboard Changes:**
```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🎯 Phase 1: Evaluation     [🟣 Phase 1] [Actif]        │ │
│  │ Plan PRO - Depuis 20 Dec 2024                          │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  PHASE PROGRESS                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Phase 1: Evaluation - Atteignez 10% pour passer        ││
│  │ ██████████████████████████████░░░░░░░░░░░░░░░░░ 65%    ││
│  │                                                          ││
│  │ [✓Essai]────[●Phase 1]────[○Phase 2]────[○Fundé]       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Phase 1 Rules:**
```
┌─────────────────────────────────────────┐
│ PHASE 1: EVALUATION                     │
│ ─────────────────────────────────────── │
│ Balance:         Plan amount            │
│                  ($5k/$25k/$100k)        │
│ Profit Target:   +10%                   │
│ Max Daily Loss:  -5%                    │
│ Max Total Loss:  -10%                   │
│ Duration:        Unlimited              │
│ ─────────────────────────────────────── │
│ On Success: → Phase 2 (Verification)    │
│ On Failure: → Must repurchase           │
└─────────────────────────────────────────┘
```

---

### 5. PHASE 2: VERIFICATION

**Navbar Badge:** `[🟠 Phase 2]`

**Phase 2 Rules:**
```
┌─────────────────────────────────────────┐
│ PHASE 2: VERIFICATION                   │
│ ─────────────────────────────────────── │
│ Balance:         Same as Phase 1        │
│ Profit Target:   +5% (easier!)          │
│ Max Daily Loss:  -5%                    │
│ Max Total Loss:  -10%                   │
│ Duration:        Unlimited              │
│ ─────────────────────────────────────── │
│ On Success: → FUNDED TRADER! 🎉         │
│ On Failure: → Back to Phase 1           │
└─────────────────────────────────────────┘
```

---

### 6. FUNDED TRADER

**Navbar Badge:** `[🟢 Fundé]` + Star icon on avatar

**Dashboard View:**
```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🏆 Compte Fundé            [⭐ Funded] [Fundé]         │ │
│  │ Plan ELITE                 [Retirer $2,400]            │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  PHASE PROGRESS (Funded)                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Compte Fundé - Tradez et gagnez 80% de vos profits     ││
│  │                                                          ││
│  │ Profits totaux    │    Retirable (80%)                  ││
│  │ $3,000            │    $2,400                           ││
│  │                                                          ││
│  │ [✓Essai]────[✓Phase 1]────[✓Phase 2]────[●Fundé]       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Funded Account Features:**
| Feature | Description |
|---------|-------------|
| **80% Profit Split** | Keep 80% of all profits |
| **Withdrawal Requests** | Request payout anytime |
| **No Profit Target** | Trade freely, no objectives |
| **Same Loss Rules** | Still have -5% daily, -10% total limits |
| **Payout History** | Track all withdrawals |

**Funded API Endpoints:**
```
# Payouts
GET  /api/payouts           - Get payout history
GET  /api/payouts/balance   - Get withdrawable balance
POST /api/payouts/request   - Request withdrawal
```

---

### 7. ADMIN USER

**Additional Navbar Items:**
```
User Menu:
├── Dashboard
├── Admin Panel ← NEW
├── Super Admin (if superadmin)
└── Déconnexion
```

**Admin Panel Features:**
```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN PANEL                                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Users   │ │Challenges│ │ Trades  │ │Payments │           │
│  │  245    │ │   89    │ │  1,234  │ │ $45,600 │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│  TABS                                                        │
│  [Users] [Challenges] [Trades] [Payments] [Payouts]         │
├─────────────────────────────────────────────────────────────┤
│  USER MANAGEMENT                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Search: [________________]                               ││
│  │                                                          ││
│  │ ID │ Username │ Email │ Role │ Status │ Actions         ││
│  │ 1  │ john     │ j@... │ user │ active │ [View] [Edit]  ││
│  │ 2  │ jane     │ j@... │ user │ active │ [View] [Edit]  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Admin API Endpoints:**
```
# Users
GET  /api/admin/users           - List all users
GET  /api/admin/users/:id       - Get user details

# Challenges
GET  /api/admin/challenges      - List all challenges
PUT  /api/admin/challenges/:id/status - Update status

# Trades
GET  /api/admin/trades          - List all trades

# Payments
GET  /api/admin/payments        - List all payments

# Payouts
GET  /api/payouts/admin/pending     - Pending payouts
PUT  /api/payouts/admin/:id/approve - Approve payout
PUT  /api/payouts/admin/:id/process - Mark as paid
PUT  /api/payouts/admin/:id/reject  - Reject payout
```

---

### 8. SUPER ADMIN

**Additional Features:**
```
┌─────────────────────────────────────────────────────────────┐
│  SUPER ADMIN PANEL                                           │
├─────────────────────────────────────────────────────────────┤
│  TABS                                                        │
│  [Settings] [PayPal] [Gemini AI] [Admins] [Stats]           │
├─────────────────────────────────────────────────────────────┤
│  PLATFORM SETTINGS                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Challenge Rules                                          ││
│  │ ├── Max Daily Loss: [5] %                               ││
│  │ ├── Max Total Loss: [10] %                              ││
│  │ └── Profit Target:  [10] %                              ││
│  │                                                          ││
│  │ Profit Split                                             ││
│  │ └── Trader Share: [80] %                                ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  PAYPAL CONFIGURATION                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Client ID:     [••••••••••••••••]                       ││
│  │ Client Secret: [••••••••••••••••]                       ││
│  │ Mode:          [Sandbox ▼]                              ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ADMIN MANAGEMENT                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Current Admins:                                          ││
│  │ ├── admin@tradesense.com (superadmin)                   ││
│  │ └── moderator@tradesense.com (admin) [Demote]           ││
│  │                                                          ││
│  │ Promote User to Admin: [user_id] [Promote]              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Super Admin API Endpoints:**
```
GET  /api/admin/superadmin/settings      - Get settings
PUT  /api/admin/superadmin/settings      - Update settings
PUT  /api/admin/superadmin/settings/paypal - Update PayPal
PUT  /api/admin/superadmin/settings/gemini - Update Gemini
GET  /api/admin/superadmin/admins        - List admins
POST /api/admin/superadmin/admins/:id/promote - Promote to admin
POST /api/admin/superadmin/admins/:id/demote  - Demote admin
GET  /api/admin/superadmin/stats         - Platform statistics
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| POST | `/login` | Login with email/password | ❌ |
| POST | `/register` | Create new account | ❌ |
| GET | `/me` | Get current user | ✅ |
| PUT | `/me` | Update profile | ✅ |
| POST | `/refresh` | Refresh access token | ✅ |

### Challenges (`/api/challenges`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/` | Get all user challenges | ✅ |
| GET | `/active` | Get active challenge | ✅ |
| GET | `/:id` | Get challenge by ID | ✅ |
| GET | `/:id/stats` | Get challenge statistics | ✅ |
| POST | `/activate-trial` | Activate free trial | ✅ |
| GET | `/check-trial` | Check trial eligibility | ✅ |

### Trades (`/api/trades`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/` | Get all trades | ✅ |
| POST | `/open` | Open new position | ✅ |
| POST | `/:id/close` | Close position | ✅ |
| GET | `/:id` | Get trade details | ✅ |
| GET | `/open/pnl` | Get open positions PnL | ✅ |

### Market Data (`/api/market`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/price/:symbol` | Get current price | ✅ |
| GET | `/prices` | Get all prices | ✅ |
| GET | `/history/:symbol` | Get price history | ✅ |
| GET | `/signal/:symbol` | Get AI signal | ✅ |
| GET | `/signals` | Get multiple signals | ✅ |
| GET | `/status` | Get market status | ✅ |

### Payments (`/api/payments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/plans` | Get available plans | ❌ |
| POST | `/checkout` | Create payment | ✅ |
| POST | `/process` | Process PayPal payment | ✅ |
| GET | `/history` | Get payment history | ✅ |

### Subscriptions (`/api/subscriptions`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/plans` | Get plans for trial | ❌ |
| POST | `/trial/start` | Start trial (PayPal) | ✅ |
| POST | `/trial/confirm` | Confirm trial | ✅ |
| POST | `/trial/cancel` | Cancel trial | ✅ |
| GET | `/trial/status` | Get trial status | ✅ |

### Payouts (`/api/payouts`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/` | Get payout history | ✅ |
| GET | `/balance` | Get withdrawable balance | ✅ |
| POST | `/request` | Request withdrawal | ✅ |
| GET | `/admin/pending` | Get pending (admin) | Admin |
| PUT | `/admin/:id/approve` | Approve payout | Admin |
| PUT | `/admin/:id/process` | Mark as paid | Admin |
| PUT | `/admin/:id/reject` | Reject payout | Admin |

### Leaderboard (`/api/leaderboard`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| GET | `/` | Get leaderboard | ❌ |
| GET | `/stats` | Get leaderboard stats | ❌ |
| GET | `/user/:id` | Get user rank | ❌ |

---

## Database Models

### User
```python
User:
  - id: Integer (PK)
  - username: String(50)
  - email: String(120) UNIQUE
  - password_hash: String(256)
  - role: String(20) ['user', 'admin', 'superadmin']
  - created_at: DateTime
  - is_active: Boolean
```

### UserChallenge
```python
UserChallenge:
  - id: Integer (PK)
  - user_id: Integer (FK → User)
  - plan_type: String(20) ['starter', 'pro', 'elite', 'trial']
  - initial_balance: Decimal(15,2)
  - current_balance: Decimal(15,2)
  - highest_balance: Decimal(15,2)
  - status: String(20) ['active', 'passed', 'failed', 'expired', 'funded']
  - phase: String(20) ['trial', 'evaluation', 'verification', 'funded']
  - profit_target: Float
  - is_funded: Boolean
  - is_trial: Boolean
  - trial_expires_at: DateTime
  - total_profit_earned: Decimal(15,2)
  - withdrawable_profit: Decimal(15,2)
  - subscription_id: Integer (FK → Subscription)
  - start_date: DateTime
  - end_date: DateTime
  - failure_reason: String(100)
```

### Trade
```python
Trade:
  - id: Integer (PK)
  - challenge_id: Integer (FK → UserChallenge)
  - symbol: String(20)
  - trade_type: String(10) ['buy', 'sell']
  - quantity: Decimal(15,4)
  - entry_price: Decimal(15,4)
  - exit_price: Decimal(15,4)
  - pnl: Decimal(15,2)
  - status: String(20) ['open', 'closed']
  - opened_at: DateTime
  - closed_at: DateTime
```

### Payment
```python
Payment:
  - id: Integer (PK)
  - user_id: Integer (FK → User)
  - plan_type: String(20)
  - amount: Decimal(10,2)
  - currency: String(3)
  - status: String(20) ['pending', 'completed', 'failed', 'refunded']
  - payment_method: String(50)
  - paypal_order_id: String(100)
  - subscription_id: Integer (FK → Subscription)
  - is_trial_conversion: Boolean
  - created_at: DateTime
  - completed_at: DateTime
```

### Subscription
```python
Subscription:
  - id: Integer (PK)
  - user_id: Integer (FK → User)
  - selected_plan: String(20)
  - paypal_agreement_id: String(100)
  - paypal_payer_id: String(100)
  - paypal_payer_email: String(255)
  - status: String(20) ['pending', 'trial', 'active', 'cancelled', 'expired', 'payment_failed']
  - trial_started_at: DateTime
  - trial_expires_at: DateTime
  - converted_at: DateTime
  - cancelled_at: DateTime
  - failed_at: DateTime
  - failure_reason: String(255)
```

### Payout
```python
Payout:
  - id: Integer (PK)
  - user_id: Integer (FK → User)
  - challenge_id: Integer (FK → UserChallenge)
  - gross_profit: Decimal(15,2)
  - platform_fee: Decimal(15,2) # 20%
  - net_payout: Decimal(15,2)   # 80%
  - status: String(20) ['pending', 'approved', 'paid', 'rejected']
  - payment_method: String(50)
  - paypal_email: String(255)
  - transaction_id: String(100)
  - requested_at: DateTime
  - approved_at: DateTime
  - processed_at: DateTime
  - processed_by: Integer (FK → User)
  - rejection_reason: String(255)
```

---

## Challenge Lifecycle Flowchart

```
                    ┌─────────────┐
                    │   VISITOR   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      ┌───────────────┐         ┌───────────────┐
      │   REGISTER    │         │  FREE TRIAL   │
      └───────┬───────┘         └───────┬───────┘
              │                         │
              │         ┌───────────────┘
              │         │
              ▼         ▼
      ┌─────────────────────────────────┐
      │         REGISTERED USER          │
      │    (No Active Challenge)         │
      └─────────────────┬───────────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
    ┌─────────────┐          ┌─────────────┐
    │ BUY PLAN    │          │ START TRIAL │
    │ $200-$1000  │          │ (7 days)    │
    └──────┬──────┘          └──────┬──────┘
           │                        │
           │                        ▼
           │                 ┌─────────────┐
           │                 │   TRIAL     │
           │                 │  $5,000     │
           │                 │  Target:10% │
           │                 └──────┬──────┘
           │                        │
           │         ┌──────────────┼──────────────┐
           │         │              │              │
           │         ▼              ▼              ▼
           │    ┌─────────┐   ┌──────────┐   ┌─────────┐
           │    │  PASS   │   │  EXPIRE  │   │  FAIL   │
           │    │  (10%)  │   │ (7 days) │   │ (loss)  │
           │    └────┬────┘   └────┬─────┘   └────┬────┘
           │         │             │              │
           │         │      Auto-charge           │
           │         │      selected plan         │
           │         │             │              ▼
           │         └──────┬──────┘         ┌─────────┐
           │                │                │   END   │
           │                │                └─────────┘
           │                ▼
           └───────────────►┌─────────────────────┐
                            │  PHASE 1: EVALUATION │
                            │  Balance: Plan amount │
                            │  Target: +10%         │
                            │  Max Loss: -10%       │
                            └───────────┬───────────┘
                                        │
                       ┌────────────────┼────────────────┐
                       │                                 │
                       ▼                                 ▼
                 ┌───────────┐                    ┌───────────┐
                 │   PASS    │                    │   FAIL    │
                 │  (+10%)   │                    │ (losses)  │
                 └─────┬─────┘                    └─────┬─────┘
                       │                                │
                       ▼                                ▼
            ┌────────────────────────┐          ┌─────────────┐
            │ PHASE 2: VERIFICATION  │          │ Repurchase  │
            │ Balance: Same          │          │ Challenge   │
            │ Target: +5% (easier!)  │          └─────────────┘
            │ Max Loss: -10%         │
            └───────────┬────────────┘
                        │
       ┌────────────────┼────────────────┐
       │                                 │
       ▼                                 ▼
 ┌───────────┐                    ┌───────────┐
 │   PASS    │                    │   FAIL    │
 │  (+5%)    │                    │ (losses)  │
 └─────┬─────┘                    └─────┬─────┘
       │                                │
       ▼                                ▼
┌──────────────────────┐        ┌─────────────┐
│   🏆 FUNDED TRADER    │        │ Back to     │
│ ─────────────────────│        │ Phase 1     │
│ Balance: Plan amount │        └─────────────┘
│ Profit Split: 80/20  │
│ No target, just trade│
│ Withdraw anytime     │
└──────────────────────┘
```

---

## Summary: Complete User Journey

| Stage | Access | Main Actions |
|-------|--------|--------------|
| **1. Visitor** | Public pages only | Browse, view pricing, read news |
| **2. Registered** | + MasterClass, Community | Learn, discuss, buy plan |
| **3. Trial (7 days)** | + Dashboard, Trading | Trade with $5k, hit 10% target |
| **4. Phase 1** | Full trading | Trade with plan balance, hit 10% |
| **5. Phase 2** | Full trading | Trade, hit 5% (easier) |
| **6. Funded** | + Withdrawals | Trade freely, earn 80% profits |
| **7. Admin** | + Admin panel | Manage users, challenges, payouts |
| **8. SuperAdmin** | + Settings | Configure platform, APIs, rules |

---

*Last updated: December 2024*
*TradeSense v1.0*
