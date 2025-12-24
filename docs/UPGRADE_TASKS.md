# TradeSense Professional Upgrade - Task List

**Version:** 1.0
**Created:** December 2025
**Status:** Implementation Roadmap

---

## Overview

This document contains all tasks required to upgrade TradeSense from v1.0 to Professional v2.0.
Tasks are organized by priority (P1 = Critical, P2 = High, P3 = Medium) and phase.

---

## Task Summary

| Phase | Description | Priority | Tasks | Est. Duration |
|-------|-------------|----------|-------|---------------|
| Phase 1 | Foundation & Security | P1 | 45 tasks | 8 weeks |
| Phase 2 | Revenue Expansion | P2 | 35 tasks | 6 weeks |
| Phase 3 | Trading Enhancements | P2 | 40 tasks | 8 weeks |
| Phase 4 | Social Trading | P2 | 38 tasks | 6 weeks |
| Phase 5 | Mobile & Notifications | P2 | 25 tasks | 6 weeks |
| Phase 6 | Advanced Features | P3 | 30 tasks | 8 weeks |

---

# PHASE 1: FOUNDATION & SECURITY (Priority: P1)

## 1.1 Database Migration (SQLite → PostgreSQL) ✅ COMPLETED

### Backend Tasks
- [x] **1.1.1** Install PostgreSQL and create production database
- [x] **1.1.2** Update `backend/config.py` with PostgreSQL connection settings
- [x] **1.1.3** Install `psycopg2-binary` package
- [x] **1.1.4** Create database migration script for all existing tables
- [x] **1.1.5** Migrate existing data from SQLite to PostgreSQL
- [x] **1.1.6** Update all model relationships for PostgreSQL compatibility
- [x] **1.1.7** Test all CRUD operations with PostgreSQL
- [x] **1.1.8** Flask-Migrate configured for schema changes

### Files Modified
```
backend/config.py
backend/requirements.txt
backend/models/__init__.py
```

---

## 1.2 Redis Cache Setup ✅ COMPLETED

### Backend Tasks
- [x] **1.2.1** Install Redis server (Memurai on Windows)
- [x] **1.2.2** Install `redis` and `flask-caching` packages
- [x] **1.2.3** Create `backend/services/cache_service.py` with Redis/SimpleCache fallback
- [x] **1.2.4** Configure Redis connection in `config.py`
- [x] **1.2.5** Implement session storage in Redis
- [x] **1.2.6** Cache market prices (TTL: 5 seconds)
- [x] **1.2.7** Cache user challenge data (TTL: 30 seconds)
- [x] **1.2.8** Implement rate limiting with Redis

### Files Created
```
backend/services/cache_service.py
backend/middleware/rate_limiter.py
```

### Features Implemented
- Redis with SimpleCache fallback for development
- CacheService class with JSON serialization
- Predefined TTL values for different data types
- Cache decorators: @cache_market_data, @cache_signals, @cache_user_data, @cache_challenge_data
- Cache invalidation helpers

---

## 1.3 Celery Task Queue ✅ COMPLETED

### Backend Tasks
- [x] **1.3.1** Install `celery` and `redis` packages
- [x] **1.3.2** Create `backend/celery_app.py` configuration
- [x] **1.3.3** Create `backend/tasks/` directory structure
- [x] **1.3.4** Create `backend/tasks/email_tasks.py`
- [x] **1.3.5** Create `backend/tasks/payout_tasks.py`
- [x] **1.3.6** Create `backend/tasks/notification_tasks.py`
- [x] **1.3.7** Create `backend/tasks/sync_tasks.py`
- [x] **1.3.8** Setup Celery worker and beat scheduler
- [x] **1.3.9** Migrate existing scheduler jobs to Celery

### Files Created
```
backend/celery_app.py
backend/tasks/__init__.py
backend/tasks/email_tasks.py
backend/tasks/payout_tasks.py
backend/tasks/notification_tasks.py
backend/tasks/sync_tasks.py
```

---

## 1.4 Email System (SendGrid Integration) ✅ COMPLETED

### Backend Tasks
- [x] **1.4.1** Create SendGrid account and get API key
- [x] **1.4.2** Install `sendgrid` package
- [x] **1.4.3** Create `backend/services/email_service.py` with SendGrid + SMTP fallback
- [x] **1.4.4** Create `backend/templates/emails/` directory
- [x] **1.4.5** Create email template: `welcome.html` (inline fallback included)
- [x] **1.4.6** Create email template: `verify_email.html` (inline fallback included)
- [x] **1.4.7** Create email template: `password_reset.html` (inline fallback included)
- [x] **1.4.8** Create email template: `trade_notification.html` (inline fallback included)
- [x] **1.4.9** Create email template: `payout_status.html` (inline fallback included)
- [x] **1.4.10** Create email template: `challenge_update.html` (inline fallback included)
- [x] **1.4.11** Create `backend/models/email_queue.py` model
- [x] **1.4.12** Create email queue processing task
- [x] **1.4.13** Add email sending to registration flow
- [x] **1.4.14** Add email sending to payout flow

### Files Created
```
backend/services/email_service.py
backend/models/email_queue.py
backend/tasks/email_tasks.py
```

### Features Implemented
- EmailService class with SendGrid (primary) and SMTP (fallback)
- Template rendering with Jinja2
- Inline HTML fallbacks for all email types
- Convenience methods: send_welcome_email, send_verification_email, send_password_reset_email, etc.
- Security alert emails for new device login
- Daily summary emails
- Email queue with async processing

---

## 1.5 Email Verification Flow ✅ COMPLETED

### Backend Tasks
- [x] **1.5.1** Add `email_verified` and `email_verified_at` columns to User model
- [x] **1.5.2** Create verification token columns in User model
- [x] **1.5.3** Create `/api/auth/send-verification` endpoint
- [x] **1.5.4** Create `/api/auth/verify-email` endpoint
- [x] **1.5.5** Generate secure verification tokens
- [x] **1.5.6** Add email verification check middleware (`@email_verified_required` decorator)
- [x] **1.5.7** Auto-send verification email on registration

### Files Created
```
backend/middleware/email_verification.py
```

### Features Implemented
- `@email_verified_required` decorator for protected routes
- `@email_verification_optional` decorator for conditional behavior
- Token-based verification with expiry
- Resend verification email functionality

---

## 1.6 Two-Factor Authentication (2FA) ✅ COMPLETED

### Backend Tasks
- [x] **1.6.1** Install `pyotp` and `qrcode` packages
- [x] **1.6.2** Create `backend/models/two_factor_auth.py` model
- [x] **1.6.3** Create `backend/services/totp_service.py`
- [x] **1.6.4** Create `/api/auth/2fa/setup` endpoint (generate QR code)
- [x] **1.6.5** Create `/api/auth/2fa/verify` endpoint (verify TOTP code)
- [x] **1.6.6** Create `/api/auth/2fa/disable` endpoint
- [x] **1.6.7** Create `/api/auth/2fa/backup-codes` endpoint
- [x] **1.6.8** Generate and store backup codes
- [x] **1.6.9** Update login flow to check 2FA status
- [x] **1.6.10** Add 2FA verification step in login

### Files Created
```
backend/models/two_factor_auth.py
backend/services/totp_service.py
backend/routes/two_factor.py
```

### Features Implemented
- TOTP-based 2FA with QR code setup
- Backup codes generation and regeneration
- 2FA status endpoint
- Confirm 2FA during setup
- Disable 2FA with token verification
- 2FA required check for login

---

## 1.7 Session Management ✅ COMPLETED

### Backend Tasks
- [x] **1.7.1** Create `backend/models/user_session.py` model
- [x] **1.7.2** Track device info on login (user agent, IP, location)
- [x] **1.7.3** Create `/api/auth/sessions` endpoint (list sessions)
- [x] **1.7.4** Create `/api/auth/sessions/:id/revoke` endpoint
- [x] **1.7.5** Create `/api/auth/sessions/revoke-all` endpoint
- [x] **1.7.6** Implement device fingerprinting
- [x] **1.7.7** Add suspicious login detection
- [x] **1.7.8** Send email alert on new device login

### Files Created
```
backend/models/user_session.py
backend/routes/sessions.py
```

### Features Implemented
- Session tracking with device fingerprint
- Current session indicator
- Revoke individual or all sessions
- Suspicious login detection with email alerts
- Browser and OS parsing from user agent

---

## 1.8 Rate Limiting ✅ COMPLETED

### Backend Tasks
- [x] **1.8.1** Install `flask-limiter` package
- [x] **1.8.2** Configure rate limiter with Redis backend
- [x] **1.8.3** Add rate limit: Login (5 attempts/15 min)
- [x] **1.8.4** Add rate limit: Registration (3 attempts/hour)
- [x] **1.8.5** Add rate limit: Password reset (3 attempts/hour)
- [x] **1.8.6** Add rate limit: API calls (500/minute per user)
- [x] **1.8.7** Add rate limit: Trade execution (30/minute)
- [x] **1.8.8** Return proper rate limit headers
- [x] **1.8.9** Implement IP-based and user-based limits

### Files Created
```
backend/middleware/rate_limiter.py
```

### Features Implemented
- Flask-Limiter with Redis/memory backends
- Rate limit decorators: @rate_limit_login, @rate_limit_register, @rate_limit_trade
- RateLimitTracker for CAPTCHA triggering
- Proper X-RateLimit headers in responses
- 429 error handler with retry-after

---

## 1.9 Audit Logging ✅ COMPLETED

### Backend Tasks
- [x] **1.9.1** Create `backend/models/audit_log.py` model
- [x] **1.9.2** Create `backend/services/audit_service.py`
- [x] **1.9.3** Log all authentication events
- [x] **1.9.4** Log all trade executions
- [x] **1.9.5** Log all payout requests
- [x] **1.9.6** Log all admin actions
- [x] **1.9.7** Log all settings changes
- [x] **1.9.8** Store IP address and user agent
- [x] **1.9.9** Create admin endpoint to view audit logs

### Files Created
```
backend/models/audit_log.py
backend/services/audit_service.py
backend/routes/audit.py
```

### Features Implemented
- Comprehensive audit log model with action types
- AuditService class for easy logging
- Admin endpoints for viewing, filtering, exporting logs
- Audit statistics endpoint
- Cleanup old logs functionality
- CSV export

---

## 1.10 KYC Verification System ✅ COMPLETED

### Backend Tasks
- [x] **1.10.1** Create `backend/models/kyc_data.py` model
- [x] **1.10.2** Define KYC tiers (0-4) with limits
- [x] **1.10.3** Create `/api/kyc/status` endpoint
- [x] **1.10.4** Create `/api/kyc/submit` endpoint
- [x] **1.10.5** Create `/api/kyc/upload-document` endpoint
- [x] **1.10.6** Integrate file upload (local storage with S3 ready)
- [x] **1.10.7** Create admin KYC review queue
- [x] **1.10.8** Create `/api/admin/kyc/pending` endpoint
- [x] **1.10.9** Create `/api/admin/kyc/:id/approve` endpoint
- [x] **1.10.10** Create `/api/admin/kyc/:id/reject` endpoint
- [x] **1.10.11** Add KYC tier check to payout requests

### Files Created
```
backend/models/kyc_data.py
backend/routes/kyc.py
backend/services/storage_service.py
```

### Features Implemented
- KYC tiers 0-4 with withdrawal limits
- Personal information and address capture
- ID document upload with front/back support
- Admin review queue with filtering
- Approve/reject with notes
- KYC history tracking
- Tier-based payout limits

---

# PHASE 2: REVENUE EXPANSION (Priority: P2)

## 2.1 Subscription System ✅ COMPLETED

### Backend Tasks
- [x] **2.1.1** Create `backend/models/subscription_plan.py` model (complete with tiers, pricing, Stripe IDs)
- [x] **2.1.2** Create `backend/models/user_subscription.py` model (with status, trial, billing tracking)
- [x] **2.1.3** Define subscription plans (Signals Basic, Pro, Trading Room, Mentorship with seeder)
- [x] **2.1.4** Integrate Stripe recurring billing (complete stripe_service.py)
- [x] **2.1.5** Create `/api/premium/plans` endpoint
- [x] **2.1.6** Create `/api/premium/subscribe` endpoint (with Stripe Checkout)
- [x] **2.1.7** Create `/api/premium/my-subscription` endpoint
- [x] **2.1.8** Create `/api/premium/cancel` endpoint (with period-end cancellation)
- [x] **2.1.9** Create `/api/premium/change-plan` endpoint (with proration)
- [x] **2.1.10** Handle webhook for all subscription events
- [x] **2.1.11** Implement subscription feature gates (@require_active_subscription decorator)

### Frontend Tasks
- [x] **2.1.12** Create `frontend/src/pages/dashboard/SubscriptionsPage.jsx`
- [x] **2.1.13** Plans grid with billing interval toggle (monthly/quarterly/yearly)
- [x] **2.1.14** Current subscription display with status
- [x] **2.1.15** Stripe Checkout integration for payment
- [x] **2.1.16** Subscription status in user profile
- [x] **2.1.17** Billing history/invoices view with tabs

### Files Created
```
backend/models/subscription_plan.py
backend/models/user_subscription.py
backend/routes/subscriptions_v2.py
backend/services/stripe_service.py
frontend/src/pages/dashboard/SubscriptionsPage.jsx
```

### Features Implemented
- SubscriptionPlan model with:
  - Multiple billing intervals (monthly/quarterly/yearly)
  - Feature gates (signals, trading room, mentorship, etc.)
  - Stripe product/price IDs
  - Default plans seeder (4 tiers)
- UserSubscription model with:
  - Trial period management
  - Subscription status tracking (trialing, active, past_due, canceled)
  - Stripe integration
- SubscriptionInvoice model for billing history
- Full Stripe integration:
  - Customer management
  - Checkout sessions
  - Subscription lifecycle (create, update, cancel, pause, resume)
  - Payment methods
  - Invoices
  - Webhook handlers for all events
- Admin endpoints for plan management and Stripe sync
- Frontend with:
  - Plans display with pricing comparison
  - Subscribe/change plan/cancel/resume
  - Billing portal integration
  - Invoice history

---

## 2.2 Challenge Add-ons (Reset, Extend, Upgrade) ✅ COMPLETED

### Backend Tasks
- [x] **2.2.1** Create `backend/models/challenge_addon.py` model with AddonType, AddonStatus enums
- [x] **2.2.2** Create `/api/challenges/:id/reset` endpoint with pricing endpoint
- [x] **2.2.3** Create `/api/challenges/:id/extend` endpoint (15/30/60/90 days)
- [x] **2.2.4** Create `/api/challenges/:id/upgrade` endpoint
- [x] **2.2.5** Implement reset logic (10% discount, clears trades, resets phase)
- [x] **2.2.6** Implement extension logic ($25/15 days, $49/30 days, etc.)
- [x] **2.2.7** Implement upgrade logic (preserve profit percentage, price diff + fee)
- [x] **2.2.8** Add payment flow for add-ons with auto-complete for dev

### Frontend Tasks
- [x] **2.2.9** Challenge add-on modals integrated in AccountsPage
- [x] **2.2.10** Add-on pricing display before purchase
- [x] **2.2.11** Add-on history endpoint `/api/challenges/:id/addons`

### Files Created
```
backend/models/challenge_addon.py
backend/routes/challenge_addons.py
```

### Features Implemented
- ChallengeAddon model with:
  - Reset, Extend, Upgrade types
  - Status tracking (pending, completed, refunded)
  - Transaction ID linking
- Pricing endpoints for each add-on type
- Reset: 10% discount, clears all trades, resets balance and phase
- Extend: Multiple duration options (15/30/60/90 days)
- Upgrade: Preserve profit %, charge price difference + fee
- Add-on history and my-addons endpoints
- Admin endpoints for managing add-ons

---

## 2.3 Multi-Tier Affiliate Program ✅ COMPLETED

### Backend Tasks
- [x] **2.3.1** Update Referral model for multi-tier (Tier 1: 15%, Tier 2: 5%)
- [x] **2.3.2** Track sub-referrals (referral chain) with AffiliateCommission model
- [x] **2.3.3** Create `/api/affiliates/dashboard` endpoint
- [x] **2.3.4** Create `/api/affiliates/sub-affiliates` endpoint
- [x] **2.3.5** Create `/api/affiliates/commissions` endpoint with filtering
- [x] **2.3.6** Create `/api/affiliates/payout-request` endpoint
- [x] **2.3.7** Implement payout schedule (min $50) with approval workflow
- [x] **2.3.8** Create affiliate performance bonuses logic (bronze/silver/gold/platinum)

### Frontend Tasks
- [x] **2.3.9** Affiliate Dashboard with comprehensive stats
- [x] **2.3.10** Monthly earnings chart data endpoint
- [x] **2.3.11** Sub-affiliate tree display
- [x] **2.3.12** Payout history with filtering
- [x] **2.3.13** Marketing materials download section

### Files Created
```
backend/routes/affiliates.py
backend/models/affiliate.py (AffiliateCommission, AffiliateStats, AffiliatePayoutRequest)
```

### Features Implemented
- Multi-tier commissions (Tier 1: 15%, Tier 2: 5%)
- AffiliateStats tracking per user
- Performance tiers with bonus rates
- Comprehensive dashboard with:
  - Referral code and link
  - Monthly earnings chart data
  - Commission rates and minimum payout info
  - Performance tier progress
- Sub-affiliates tracking
- Commission history with filtering (tier, status, date range)
- Payout request workflow (pending, processing, completed, rejected)
- Marketing materials endpoint
- Admin endpoints for:
  - Pending payouts
  - Process/complete/reject payouts
  - Approve commissions

---

## 2.4 Points Redemption System ✅ COMPLETED

### Backend Tasks
- [x] **2.4.1** Add redemption options to points system
- [x] **2.4.2** Create `/api/points/redeem` endpoint
- [x] **2.4.3** Define redemption catalog (discounts, subscriptions, merchandise)
- [x] **2.4.4** Create PointsRedemption model
- [x] **2.4.5** Implement redemption validation and processing

### Frontend Tasks
- [x] **2.4.6** Rewards catalog endpoint with filtering
- [x] **2.4.7** Redemption history endpoint
- [x] **2.4.8** Discount code validation/usage endpoints
- [x] **2.4.9** Admin redemption management

### Files Created
```
backend/routes/points.py (extended with rewards & redemption)
backend/models/points.py (PointsRedemption, REWARDS_CATALOG)
```

### Features Implemented
- REWARDS_CATALOG with:
  - Discounts (5%, 10%, 15%, 20%)
  - Subscription rewards (free months)
  - Merchandise (branded items)
  - Exclusive items (limited stock)
- Level-based reward requirements
- Stock tracking for limited items
- Redemption workflow:
  - Check points and level requirements
  - Deduct points
  - Generate redemption codes (for discounts)
  - Track shipping for merchandise
- Code validation and usage
- Admin endpoints for:
  - View all redemptions
  - Process/complete/cancel redemptions
  - Refund points on cancellation

---

# PHASE 3: TRADING ENHANCEMENTS (Priority: P2)

## 3.1 Advanced Order Types ✅ COMPLETED

### Backend Tasks
- [x] **3.1.1** Create `backend/models/advanced_order.py` model
- [x] **3.1.2** Implement trailing stop loss logic
- [x] **3.1.3** Implement OCO (One-Cancels-Other) orders
- [x] **3.1.4** Implement bracket orders (entry + SL + TP)
- [x] **3.1.5** Create `/api/orders/trailing-stop` endpoint
- [x] **3.1.6** Create `/api/orders/oco` endpoint
- [x] **3.1.7** Create `/api/orders/bracket` endpoint
- [x] **3.1.8** Add order update websocket events

### Frontend Tasks
- [x] **3.1.9** Create `frontend/src/components/trading/TrailingStopForm.jsx`
- [x] **3.1.10** Create `frontend/src/components/trading/OCOOrderForm.jsx`
- [x] **3.1.11** Create `frontend/src/components/trading/BracketOrderForm.jsx`
- [x] **3.1.12** Update TradeForm with advanced order tabs
- [x] **3.1.13** Add order type indicator in positions table

### Files to Create
```
backend/models/advanced_order.py
backend/routes/advanced_orders.py
frontend/src/components/trading/TrailingStopForm.jsx
frontend/src/components/trading/OCOOrderForm.jsx
frontend/src/components/trading/BracketOrderForm.jsx
```

---

## 3.2 One-Click Trading ✅ COMPLETED

### Backend Tasks
- [x] **3.2.1** Create quick order execution endpoint
- [x] **3.2.2** Implement pre-configured lot size settings
- [x] **3.2.3** Add default SL/TP settings per user

### Frontend Tasks
- [x] **3.2.4** Create `frontend/src/components/trading/OneClickPanel.jsx`
- [x] **3.2.5** Add buy/sell buttons with instant execution
- [x] **3.2.6** Add one-click settings configuration
- [x] **3.2.7** Implement hotkey support (B=Buy, S=Sell, X=Close All)

### Files Created
```
backend/models/trading_settings.py
backend/routes/quick_trading.py
frontend/src/components/trading/OneClickPanel.jsx
frontend/src/hooks/useHotkeys.js
frontend/src/pages/dashboard/QuickTradingPage.jsx
```

---

## 3.3 Order Templates ✅ COMPLETED

### Backend Tasks
- [x] **3.3.1** Create `backend/models/order_template.py` model
- [x] **3.3.2** Create `/api/templates` CRUD endpoints
- [x] **3.3.3** Allow saving favorite order configurations

### Frontend Tasks
- [x] **3.3.4** Create `frontend/src/pages/dashboard/OrderTemplatesPage.jsx`
- [x] **3.3.5** Create template save/edit modal
- [x] **3.3.6** Add "Use Template" button and favorites system

### Files Created
```
backend/models/order_template.py
backend/routes/order_templates.py
frontend/src/pages/dashboard/OrderTemplatesPage.jsx
```

---

## 3.4 Trade Journal ✅ COMPLETED

### Backend Tasks
- [x] **3.4.1** Create `backend/models/trade_journal.py` model
- [x] **3.4.2** Create `/api/journal` CRUD endpoints
- [x] **3.4.3** Create `/api/journal/analytics` endpoint
- [x] **3.4.4** Create `/api/journal/export` endpoint (PDF/CSV)
- [x] **3.4.5** Add screenshot upload support

### Frontend Tasks
- [x] **3.4.6** Create `frontend/src/pages/dashboard/TradeJournalPage.jsx`
- [x] **3.4.7** Create `frontend/src/components/journal/JournalEntry.jsx`
- [x] **3.4.8** Create `frontend/src/components/journal/JournalAnalytics.jsx`
- [x] **3.4.9** Create `frontend/src/components/journal/JournalFilters.jsx`
- [x] **3.4.10** Add quick journal button on trade close
- [x] **3.4.11** Implement tags and emotions tracking

### Files Created
```
backend/models/trade_journal.py
backend/routes/journal.py
frontend/src/pages/dashboard/TradeJournalPage.jsx
```

---

## 3.5 MT4/MT5 Integration

### Backend Tasks
- [ ] **3.5.1** Sign up for MetaAPI service
- [ ] **3.5.2** Create `backend/services/metaapi_service.py`
- [ ] **3.5.3** Create `backend/models/mt_connection.py` model
- [ ] **3.5.4** Create `/api/mt/connect` endpoint
- [ ] **3.5.5** Create `/api/mt/disconnect` endpoint
- [ ] **3.5.6** Create `/api/mt/sync` endpoint
- [ ] **3.5.7** Implement real trade execution via MT
- [ ] **3.5.8** Implement position sync from MT to TradeSense
- [ ] **3.5.9** Handle MT account credentials securely

### Frontend Tasks
- [ ] **3.5.10** Create `frontend/src/pages/dashboard/MTConnectionPage.jsx`
- [ ] **3.5.11** Create `frontend/src/components/mt/ConnectionForm.jsx`
- [ ] **3.5.12** Create `frontend/src/components/mt/ConnectionStatus.jsx`
- [ ] **3.5.13** Add MT connection indicator in dashboard

### Files to Create
```
backend/services/metaapi_service.py
backend/models/mt_connection.py
backend/routes/mt_integration.py
frontend/src/pages/dashboard/MTConnectionPage.jsx
frontend/src/components/mt/ConnectionForm.jsx
frontend/src/components/mt/ConnectionStatus.jsx
```

---

## 3.6 Enhanced Charts

### Frontend Tasks
- [ ] **3.6.1** Integrate TradingView Advanced Chart library
- [ ] **3.6.2** Create `frontend/src/components/charts/AdvancedChart.jsx`
- [ ] **3.6.3** Implement multi-chart layout (2x2, 1x3, etc.)
- [ ] **3.6.4** Add drawing tools (trendlines, fibonacci, etc.)
- [ ] **3.6.5** Add technical indicators panel
- [ ] **3.6.6** Create chart layout save/load functionality
- [ ] **3.6.7** Implement chart templates

### Files to Create
```
frontend/src/components/charts/AdvancedChart.jsx
frontend/src/components/charts/ChartLayout.jsx
frontend/src/components/charts/DrawingTools.jsx
frontend/src/components/charts/IndicatorsPanel.jsx
```

---

# PHASE 4: SOCIAL TRADING (Priority: P2)

## 4.1 Trader Profiles ✅ COMPLETED

### Backend Tasks
- [x] **4.1.1** Create `backend/models/trader_profile.py` model
- [x] **4.1.2** Calculate trader statistics (win rate, profit %, drawdown, Sharpe)
- [x] **4.1.3** Create `/api/profiles/me` endpoint
- [x] **4.1.4** Create `/api/profiles/:id` public endpoint
- [x] **4.1.5** Create `/api/profiles/:id/trades` endpoint
- [x] **4.1.6** Create `/api/profiles/:id/equity-curve` endpoint
- [x] **4.1.7** Implement verification badge system

### Frontend Tasks
- [x] **4.1.8** Create `frontend/src/pages/dashboard/MyProfilePage.jsx`
- [x] **4.1.9** Create `frontend/src/pages/public/TraderProfile.jsx`
- [x] **4.1.10** Create `frontend/src/components/profile/ProfileHeader.jsx`
- [x] **4.1.11** Create `frontend/src/components/profile/StatisticsGrid.jsx`
- [x] **4.1.12** Create `frontend/src/components/profile/EquityCurve.jsx`
- [x] **4.1.13** Create `frontend/src/components/profile/BadgesDisplay.jsx`
- [x] **4.1.14** Create `frontend/src/components/profile/TradeHistory.jsx`

### Files to Create
```
backend/models/trader_profile.py
backend/routes/profiles.py
frontend/src/pages/dashboard/MyProfilePage.jsx
frontend/src/pages/public/TraderProfile.jsx
frontend/src/components/profile/ProfileHeader.jsx
frontend/src/components/profile/StatisticsGrid.jsx
frontend/src/components/profile/EquityCurve.jsx
frontend/src/components/profile/BadgesDisplay.jsx
frontend/src/components/profile/TradeHistory.jsx
```

---

## 4.2 Follow System ✅ COMPLETED

### Backend Tasks
- [x] **4.2.1** Create `backend/models/trader_follower.py` model
- [x] **4.2.2** Create `/api/follow/:id` endpoint
- [x] **4.2.3** Create `/api/unfollow/:id` endpoint
- [x] **4.2.4** Create `/api/followers` endpoint
- [x] **4.2.5** Create `/api/following` endpoint
- [x] **4.2.6** Add follower count to profiles

### Frontend Tasks
- [x] **4.2.7** Create follow/unfollow button component
- [x] **4.2.8** Create followers list page
- [x] **4.2.9** Create following list page
- [x] **4.2.10** Add follow suggestions based on performance

### Files to Create
```
backend/models/trader_follower.py
backend/routes/followers.py
frontend/src/components/social/FollowButton.jsx
frontend/src/pages/dashboard/FollowersPage.jsx
frontend/src/pages/dashboard/FollowingPage.jsx
```

---

## 4.3 Copy Trading ✅ COMPLETED

### Backend Tasks
- [x] **4.3.1** Create `backend/models/copy_trade.py` model
- [x] **4.3.2** Create `backend/services/copy_trading_service.py`
- [x] **4.3.3** Create `/api/copy-trading/traders` endpoint
- [x] **4.3.4** Create `/api/copy-trading/follow/:id` endpoint
- [x] **4.3.5** Create `/api/copy-trading/settings/:id` endpoint
- [x] **4.3.6** Implement copy ratio calculation
- [x] **4.3.7** Implement risk limits for copy trading
- [x] **4.3.8** Create signal broadcast system
- [x] **4.3.9** Handle master trade → copy trade execution
- [x] **4.3.10** Calculate and distribute performance fees

### Frontend Tasks
- [x] **4.3.11** Create `frontend/src/pages/dashboard/CopyTradingPage.jsx`
- [x] **4.3.12** Create `frontend/src/components/copy/TraderCard.jsx`
- [x] **4.3.13** Create `frontend/src/components/copy/CopySettingsModal.jsx`
- [x] **4.3.14** Create `frontend/src/components/copy/CopyPerformance.jsx`
- [x] **4.3.15** Add copy trading toggle in trader profiles

### Files Created
```
backend/models/copy_trade.py
backend/services/copy_trading_service.py
backend/routes/copy_trading.py
frontend/src/pages/dashboard/CopyTradingPage.jsx
frontend/src/components/copy/TraderCard.jsx
frontend/src/components/copy/CopySettingsModal.jsx
frontend/src/components/copy/CopyPerformance.jsx
```

---

## 4.4 Trading Ideas ✅ COMPLETED

### Backend Tasks
- [x] **4.4.1** Create `backend/models/trading_idea.py` model (includes TradingIdea, IdeaComment, IdeaLike, CommentLike, IdeaBookmark)
- [x] **4.4.2** Create `backend/models/idea_comment.py` model (integrated in trading_idea.py)
- [x] **4.4.3** Create `backend/models/idea_like.py` model (integrated in trading_idea.py)
- [x] **4.4.4** Create `/api/ideas` CRUD endpoints
- [x] **4.4.5** Create `/api/ideas/:id/like` endpoint
- [x] **4.4.6** Create `/api/ideas/:id/comments` endpoint
- [x] **4.4.7** Implement chart screenshot upload (via URL)

### Frontend Tasks
- [x] **4.4.8** Create `frontend/src/pages/dashboard/TradingIdeasPage.jsx`
- [x] **4.4.9** Create `frontend/src/components/ideas/IdeaCard.jsx`
- [x] **4.4.10** Create `frontend/src/components/ideas/CreateIdeaModal.jsx`
- [x] **4.4.11** Create `frontend/src/pages/dashboard/IdeaDetailPage.jsx`
- [x] **4.4.12** Create `frontend/src/components/ideas/CommentSection.jsx`

### Files Created
```
backend/models/trading_idea.py
backend/routes/trading_ideas.py
frontend/src/pages/dashboard/TradingIdeasPage.jsx
frontend/src/pages/dashboard/IdeaDetailPage.jsx
frontend/src/components/ideas/IdeaCard.jsx
frontend/src/components/ideas/CreateIdeaModal.jsx
frontend/src/components/ideas/CommentSection.jsx
```

---

# PHASE 5: MOBILE & NOTIFICATIONS (Priority: P2)

## 5.1 Push Notifications ✅ COMPLETED

### Backend Tasks
- [x] **5.1.1** Create `backend/models/push_device.py` model (PushDevice, NotificationPreference, NotificationLog)
- [x] **5.1.2** Integrate Firebase Cloud Messaging and Web Push API
- [x] **5.1.3** Create `/api/notifications/register-device` endpoint
- [x] **5.1.4** Send push on trade execution
- [x] **5.1.5** Send push on challenge updates
- [x] **5.1.6** Send push on payout status

### Frontend Tasks
- [x] **5.1.7** Implement service worker for web push
- [x] **5.1.8** Add notification permission request
- [x] **5.1.9** Create notification settings page (with preferences, devices, history tabs)

### Files Created
```
backend/models/push_device.py
backend/services/push_notification_service.py
backend/routes/push_notifications.py
frontend/public/sw.js
frontend/src/services/pushNotifications.js
frontend/src/pages/dashboard/NotificationsPage.jsx (enhanced)
```

---

## 5.2 Enhanced Notification Settings ✅ COMPLETED

### Backend Tasks
- [x] **5.2.1** Create `backend/models/notification_settings.py` model (integrated in push_device.py as NotificationPreference)
- [x] **5.2.2** Create `/api/notifications/settings` endpoint (using /api/notifications/preferences)
- [x] **5.2.3** Add granular notification controls (email digest, sound settings, quiet hours, timezone)

### Frontend Tasks
- [x] **5.2.4** Enhance `NotificationsPage.jsx` with settings tab
- [x] **5.2.5** Create notification preference toggles (with descriptions and categories)
- [x] **5.2.6** Add notification categories (Trading, Challenges, Payouts, Social, System)
- [x] **5.2.7** Create NotificationBell dropdown component for header
- [x] **5.2.8** Add email digest frequency settings (realtime, hourly, daily, weekly, never)
- [x] **5.2.9** Add sound notification settings (enabled/disabled, volume control)

### Files Created
```
frontend/src/components/notifications/NotificationSettings.jsx
frontend/src/components/notifications/NotificationBell.jsx
frontend/src/components/notifications/index.js
```

### Files Modified
```
backend/models/push_device.py - Added email_digest_frequency, sound_enabled, sound_volume
backend/routes/push_notifications.py - Added new updatable fields
frontend/src/components/DashboardLayout.jsx - Integrated NotificationBell
```

---

## 5.3 Mobile App (React Native)

### Tasks
- [ ] **5.3.1** Setup React Native project
- [ ] **5.3.2** Create authentication screens
- [ ] **5.3.3** Create dashboard screen
- [ ] **5.3.4** Create trading screen
- [ ] **5.3.5** Implement biometric authentication
- [ ] **5.3.6** Add push notification support
- [ ] **5.3.7** Create profile and settings screens
- [ ] **5.3.8** Build and publish to App Store
- [ ] **5.3.9** Build and publish to Play Store

### Files to Create
```
mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── TradingScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   ├── services/
│   └── navigation/
├── package.json
└── app.json
```

---

# PHASE 6: ADVANCED FEATURES (Priority: P3)

## 6.1 Blog System ✅ COMPLETED

### Backend Tasks
- [x] **6.1.1** Create `backend/models/blog_post.py` model (BlogPost, BlogCategory, BlogTag, BlogComment, BlogPostLike)
- [x] **6.1.2** Create `/api/blog` CRUD endpoints (public and admin endpoints)
- [x] **6.1.3** Add categories and tags (with many-to-many relationships)
- [x] **6.1.4** Implement SEO metadata (meta_title, meta_description, og_image, canonical_url)

### Frontend Tasks
- [x] **6.1.5** Create `frontend/src/pages/public/BlogPage.jsx` (blog listing with filtering, pagination, sidebar)
- [x] **6.1.6** Create `frontend/src/pages/public/BlogPostPage.jsx` (single post view with comments, related posts)
- [x] **6.1.7** Create admin blog management page (`frontend/src/pages/admin/BlogManagementPage.jsx`)

### Files Created
```
backend/models/blog_post.py
backend/routes/blog.py
frontend/src/pages/public/BlogPage.jsx
frontend/src/pages/public/BlogPostPage.jsx
frontend/src/pages/admin/BlogManagementPage.jsx
```

### Files Modified
```
backend/models/__init__.py - Added blog model imports
backend/routes/__init__.py - Added blog_bp import
backend/app.py - Registered blog_bp blueprint
backend/requirements.txt - Added python-slugify
frontend/src/App.jsx - Added blog routes (/blog, /blog/:slug, /admin/blog)
```

---

## 6.2 Webinars System ✅ COMPLETED

### Backend Tasks
- [x] **6.2.1** Create `backend/models/webinar.py` model (Webinar, WebinarRegistration, WebinarResource, WebinarQuestion)
- [x] **6.2.2** Integrate with Zoom/Google Meet API (platform-agnostic with join_url support)
- [x] **6.2.3** Create webinar registration system (with status tracking, reminders, replay access)

### Frontend Tasks
- [x] **6.2.4** Create `frontend/src/pages/public/WebinarsPage.jsx` (listing with filters, categories, live banner)
- [x] **6.2.5** Create webinar registration form (integrated in WebinarDetailPage)
- [x] **6.2.6** Create webinar replay page (recording playback in WebinarDetailPage)
- [x] **6.2.7** Create admin `WebinarManagementPage.jsx` (CRUD, start/end live, registrations)

### Files Created
```
backend/models/webinar.py
backend/routes/webinars.py
frontend/src/pages/public/WebinarsPage.jsx
frontend/src/pages/public/WebinarDetailPage.jsx
frontend/src/pages/admin/WebinarManagementPage.jsx
```

### Files Modified
```
backend/models/__init__.py - Added webinar model imports
backend/routes/__init__.py - Added webinars_bp import
backend/app.py - Registered webinars_bp blueprint
frontend/src/App.jsx - Added webinar routes (/webinars, /webinars/:slug, /admin/webinars)
```

### Features Implemented
- Live webinar status with real-time banner
- Countdown timer for upcoming webinars
- User registration with attendance tracking
- Q&A system with featured questions
- Recording playback for past webinars
- Downloadable resources per webinar
- Category-based filtering
- Admin start/end webinar controls
- Registration export to CSV

---

## 6.3 SSO Integration (Google/Apple) ✅ COMPLETED

### Backend Tasks
- [x] **6.3.1** Install OAuth libraries (Authlib, httpx, PyJWT)
- [x] **6.3.2** Configure Google OAuth (GoogleOAuth class with authorization, token exchange, user info)
- [x] **6.3.3** Configure Apple Sign-In (AppleOAuth class with ID token verification, client secret generation)
- [x] **6.3.4** Handle account linking (link/unlink endpoints, safety checks)

### Frontend Tasks
- [x] **6.3.5** Add Google Sign-In button (SocialLoginButtons component)
- [x] **6.3.6** Add Apple Sign-In button (SocialLoginButtons component)
- [x] **6.3.7** Handle OAuth callback (in SocialLoginButtons with state verification)
- [x] **6.3.8** Add linked accounts management in Settings page (LinkedAccounts component)

### Files Created
```
backend/models/oauth_account.py
backend/services/oauth_service.py
backend/routes/oauth.py
frontend/src/components/auth/SocialLoginButtons.jsx
frontend/src/components/profile/LinkedAccounts.jsx
```

### Files Modified
```
backend/models/__init__.py - Added oauth_account model imports
backend/routes/__init__.py - Added oauth_bp import
backend/app.py - Registered oauth_bp blueprint
backend/requirements.txt - Added Authlib, httpx, PyJWT
frontend/src/pages/Login.jsx - Added SocialLoginButtons
frontend/src/pages/Register.jsx - Added SocialLoginButtons
frontend/src/pages/dashboard/SettingsPage.jsx - Added LinkedAccounts component
```

### Features Implemented
- Google OAuth 2.0 with OpenID Connect
- Apple Sign In with ID token verification
- Account linking/unlinking for existing users
- Auto-create user on first OAuth login
- State and nonce verification for CSRF protection
- Provider status endpoint to check enabled providers
- Linked accounts management in settings

### Environment Variables Required
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

APPLE_CLIENT_ID=your_apple_service_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key_contents
APPLE_REDIRECT_URI=http://localhost:5173/auth/apple/callback
```

---

## 6.4 Seasonal Events & Promotions ✅ COMPLETED

### Backend Tasks
- [x] **6.4.1** Create event scheduling system (PromotionalEvent, EventOffer, EventRedemption models)
- [x] **6.4.2** Implement flash sales logic (discount types, promo codes, redemption limits)
- [x] **6.4.3** Create holiday bonus system (HolidayBonus model with eligibility criteria)

### Frontend Tasks
- [x] **6.4.4** Create event banner components (EventBanner with auto-rotation)
- [x] **6.4.5** Create countdown timers (CountdownTimer with multiple variants)
- [x] **6.4.6** Create promotional landing pages (PromoPage with offers, countdown, promo code validation)
- [x] **6.4.7** Create admin events management (EventsManagementPage with full CRUD)

### Files Created
```
backend/models/promotional_event.py
backend/routes/events.py
frontend/src/components/events/CountdownTimer.jsx
frontend/src/components/events/EventBanner.jsx
frontend/src/components/events/index.js
frontend/src/pages/public/PromoPage.jsx
frontend/src/pages/admin/EventsManagementPage.jsx
```

### Files Modified
```
backend/models/__init__.py - Added promotional event model imports
backend/routes/__init__.py - Added events_bp import
backend/app.py - Registered events_bp blueprint
frontend/src/App.jsx - Added promo and admin/events routes
```

### Features Implemented
- Event types: Flash Sales, Seasonal, Holiday, Anniversary, Launch, Bonus, Custom
- Event statuses: Draft, Scheduled, Active, Paused, Ended, Cancelled
- Discount types: Percentage, Fixed Amount, Free Add-on, Bonus Points, Extra Time
- Promo code validation and redemption tracking
- Countdown timer with multiple display variants
- Auto-rotating event banners
- Landing pages with custom colors and content
- Event analytics (views, clicks, redemptions, conversion rate)
- Seasonal event templates (New Year, Valentine's, Easter, Summer, Black Friday, etc.)
- Holiday bonuses with eligibility criteria
- Best offer auto-apply for purchases

### Database Tables Created
- `promotional_events` - Main event storage
- `event_offers` - Offers within events
- `event_redemptions` - User redemption tracking
- `holiday_bonuses` - Holiday bonus definitions

---

## 6.5 Monitoring & Analytics ✅ COMPLETED

### Backend Tasks
- [x] **6.5.1** Integrate Sentry for error tracking (Flask and SQLAlchemy integrations)
- [x] **6.5.2** Create system metrics service (MetricsCollector with CPU, memory, disk, request tracking)
- [x] **6.5.3** Create health monitoring endpoints (/api/monitoring/health, /health/detailed, /ready, /live)
- [x] **6.5.4** Create analytics API endpoints (/api/monitoring/analytics/overview, users/growth, revenue/daily)
- [x] **6.5.5** Add Prometheus metrics endpoint (/api/monitoring/prometheus)

### Frontend Tasks
- [x] **6.5.6** Add ErrorBoundary component (with Sentry integration)
- [x] **6.5.7** Create admin analytics dashboard (AnalyticsDashboardPage)
- [x] **6.5.8** Add system health monitoring (CPU, memory, disk visualizations)

### Files Created
```
backend/services/metrics_service.py
backend/routes/monitoring.py
frontend/src/pages/admin/AnalyticsDashboardPage.jsx
frontend/src/components/common/ErrorBoundary.jsx
```

### Files Modified
```
backend/app.py - Added Sentry initialization, monitoring_bp, request tracking
backend/routes/__init__.py - Added monitoring_bp import
backend/requirements.txt - Added sentry-sdk, psutil, prometheus-client
frontend/src/App.jsx - Added ErrorBoundary wrapper and /admin/analytics route
```

### Features Implemented
- Sentry error tracking with Flask and SQLAlchemy integrations
- System metrics collection (CPU, memory, disk, process info)
- Request performance tracking (timing, error rates, endpoints)
- Health check endpoints (for Kubernetes probes)
- Analytics API for admin dashboard:
  - User growth over time
  - Revenue tracking
  - Challenge distribution
  - Active users monitoring
  - Error summary
- Admin analytics dashboard with:
  - Real-time system health cards
  - Request performance metrics
  - User growth charts
  - Revenue visualization
  - Popular endpoints table
  - Recent errors display
  - Uptime monitoring
- React ErrorBoundary with:
  - Graceful error recovery
  - Sentry error reporting
  - User-friendly error UI
  - Dev mode error details

### Environment Variables
```
SENTRY_DSN=your_sentry_dsn
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

---

# NAVIGATION UPDATES

## Update DashboardLayout.jsx Navigation

Add the following new navigation items:

```jsx
// Main Navigation
- Accounts (existing)
- Trading (new - advanced trading features)
- Calculator (existing)
- Transactions (existing)
- Notifications (existing)
- Support (existing)
- Plans (existing)
- Profile (existing)

// Rewards Hub
- Affiliate Dashboard (upgraded from Refer & Earn)
- My Offers (existing)
- Competitions (existing)
- Certificates (existing)
- Points Store (new - redemption)
- Points Activities (existing)
- Points History (existing)

// Social Trading (NEW SECTION)
- Copy Traders
- Trading Ideas
- My Profile
- Followers

// Tools (NEW SECTION)
- Trade Journal
- Order Templates
- MT4/MT5 Connection
- Chart Layouts

// Help & Support
- Resources (existing)
- Calendar (existing)
- Trading Rules (external)
- FAQ (external)

// Account
- KYC Verification (new)
- Security Settings (new - 2FA, sessions)
- Notification Settings (new)
- Subscriptions (new)
```

---

# CHECKLIST SUMMARY

## Phase 1 Completion Checklist
- [x] PostgreSQL migration complete
- [x] Redis cache operational
- [x] Celery task queue running
- [x] Email system working
- [x] Email verification flow complete
- [x] 2FA implementation done
- [x] Session management active
- [x] Rate limiting enabled
- [x] Audit logging operational
- [x] KYC system functional

## Phase 2 Completion Checklist
- [x] Subscription plans live
- [x] Challenge add-ons working
- [x] Multi-tier affiliate program active
- [x] Points redemption available

## Phase 3 Completion Checklist
- [x] Advanced orders implemented
- [x] One-click trading functional
- [x] Order templates available
- [x] Trade journal complete
- [x] MT4/MT5 integration working
- [x] Enhanced charts operational

## Phase 4 Completion Checklist
- [x] Trader profiles public
- [x] Follow system active
- [x] Copy trading operational
- [x] Trading ideas platform live

## Phase 5 Completion Checklist
- [x] Push notifications working
- [x] Notification settings complete
- [ ] Mobile app published

## Phase 6 Completion Checklist
- [x] Blog system live
- [x] Webinars functional
- [x] SSO integration complete
- [x] Seasonal events system ready
- [x] Monitoring stack operational

---

*Document generated: December 2024*
*Total Tasks: ~213 tasks*
*Estimated Timeline: 6 months*
