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

## 1.1 Database Migration (SQLite → PostgreSQL)

### Backend Tasks
- [x] **1.1.1** Install PostgreSQL and create production database
- [x] **1.1.2** Update `backend/config.py` with PostgreSQL connection settings
- [x] **1.1.3** Install `psycopg2-binary` package
- [x] **1.1.4** Create database migration script for all existing tables
- [x] **1.1.5** Migrate existing data from SQLite to PostgreSQL
- [x] **1.1.6** Update all model relationships for PostgreSQL compatibility
- [x] **1.1.7** Test all CRUD operations with PostgreSQL
- [x] **1.1.8** Setup PostgreSQL read replicas for scaling

### Files to Modify
```
backend/config.py
backend/requirements.txt
backend/models/__init__.py
```

---

## 1.2 Redis Cache Setup

### Backend Tasks
- [ ] **1.2.1** Install Redis server
- [ ] **1.2.2** Install `redis` and `flask-caching` packages
- [ ] **1.2.3** Create `backend/services/cache_service.py`
- [ ] **1.2.4** Configure Redis connection in `config.py`
- [ ] **1.2.5** Implement session storage in Redis
- [ ] **1.2.6** Cache market prices (TTL: 5 seconds)
- [ ] **1.2.7** Cache user challenge data (TTL: 30 seconds)
- [ ] **1.2.8** Implement rate limiting with Redis

### Files to Create
```
backend/services/cache_service.py
backend/services/rate_limiter.py
```

### Files to Modify
```
backend/config.py
backend/requirements.txt
backend/app.py
```

---

## 1.3 Celery Task Queue

### Backend Tasks
- [ ] **1.3.1** Install `celery` and `redis` packages
- [ ] **1.3.2** Create `backend/celery_app.py` configuration
- [ ] **1.3.3** Create `backend/tasks/` directory structure
- [ ] **1.3.4** Create `backend/tasks/email_tasks.py`
- [ ] **1.3.5** Create `backend/tasks/payout_tasks.py`
- [ ] **1.3.6** Create `backend/tasks/notification_tasks.py`
- [ ] **1.3.7** Create `backend/tasks/sync_tasks.py`
- [ ] **1.3.8** Setup Celery worker and beat scheduler
- [ ] **1.3.9** Migrate existing scheduler jobs to Celery

### Files to Create
```
backend/celery_app.py
backend/tasks/__init__.py
backend/tasks/email_tasks.py
backend/tasks/payout_tasks.py
backend/tasks/notification_tasks.py
backend/tasks/sync_tasks.py
```

---

## 1.4 Email System (SendGrid Integration)

### Backend Tasks
- [ ] **1.4.1** Create SendGrid account and get API key
- [ ] **1.4.2** Install `sendgrid` package
- [ ] **1.4.3** Create `backend/services/email_service.py`
- [ ] **1.4.4** Create `backend/templates/emails/` directory
- [ ] **1.4.5** Create email template: `welcome.html`
- [ ] **1.4.6** Create email template: `verify_email.html`
- [ ] **1.4.7** Create email template: `password_reset.html`
- [ ] **1.4.8** Create email template: `trade_notification.html`
- [ ] **1.4.9** Create email template: `payout_status.html`
- [ ] **1.4.10** Create email template: `challenge_update.html`
- [ ] **1.4.11** Create `backend/models/email_queue.py` model
- [ ] **1.4.12** Create email queue processing task
- [ ] **1.4.13** Add email sending to registration flow
- [ ] **1.4.14** Add email sending to payout flow

### Files to Create
```
backend/services/email_service.py
backend/models/email_queue.py
backend/templates/emails/welcome.html
backend/templates/emails/verify_email.html
backend/templates/emails/password_reset.html
backend/templates/emails/trade_notification.html
backend/templates/emails/payout_status.html
backend/templates/emails/challenge_update.html
```

### Files to Modify
```
backend/routes/auth.py
backend/routes/payouts.py
backend/models/__init__.py
```

---

## 1.5 Email Verification Flow

### Backend Tasks
- [ ] **1.5.1** Add `email_verified` and `email_verified_at` columns to User model
- [ ] **1.5.2** Create `backend/models/email_verification.py` model
- [ ] **1.5.3** Create `/api/auth/send-verification` endpoint
- [ ] **1.5.4** Create `/api/auth/verify-email` endpoint
- [ ] **1.5.5** Generate secure verification tokens
- [ ] **1.5.6** Add email verification check middleware
- [ ] **1.5.7** Auto-send verification email on registration

### Frontend Tasks
- [ ] **1.5.8** Create `frontend/src/pages/auth/VerifyEmail.jsx` page
- [ ] **1.5.9** Create `frontend/src/pages/auth/EmailVerificationSent.jsx` page
- [ ] **1.5.10** Update `Register.jsx` to show verification message
- [ ] **1.5.11** Add email verification banner in dashboard
- [ ] **1.5.12** Add resend verification email button

### Files to Create
```
backend/models/email_verification.py
backend/routes/email_verification.py
frontend/src/pages/auth/VerifyEmail.jsx
frontend/src/pages/auth/EmailVerificationSent.jsx
```

### Files to Modify
```
backend/models/user.py
backend/routes/auth.py
frontend/src/App.jsx
frontend/src/pages/public/Register.jsx
frontend/src/services/api.js
```

---

## 1.6 Two-Factor Authentication (2FA)

### Backend Tasks
- [ ] **1.6.1** Install `pyotp` and `qrcode` packages
- [ ] **1.6.2** Create `backend/models/two_factor_auth.py` model
- [ ] **1.6.3** Create `backend/services/totp_service.py`
- [ ] **1.6.4** Create `/api/auth/2fa/setup` endpoint (generate QR code)
- [ ] **1.6.5** Create `/api/auth/2fa/verify` endpoint (verify TOTP code)
- [ ] **1.6.6** Create `/api/auth/2fa/disable` endpoint
- [ ] **1.6.7** Create `/api/auth/2fa/backup-codes` endpoint
- [ ] **1.6.8** Generate and store backup codes
- [ ] **1.6.9** Update login flow to check 2FA status
- [ ] **1.6.10** Add 2FA verification step in login

### Frontend Tasks
- [ ] **1.6.11** Create `frontend/src/pages/auth/TwoFactorSetup.jsx` page
- [ ] **1.6.12** Create `frontend/src/pages/auth/TwoFactorVerify.jsx` page
- [ ] **1.6.13** Create `frontend/src/components/auth/QRCodeDisplay.jsx`
- [ ] **1.6.14** Create `frontend/src/components/auth/BackupCodesDisplay.jsx`
- [ ] **1.6.15** Update `Login.jsx` to handle 2FA flow
- [ ] **1.6.16** Add 2FA settings in `SettingsPage.jsx`
- [ ] **1.6.17** Add 2FA toggle with setup modal

### Files to Create
```
backend/models/two_factor_auth.py
backend/services/totp_service.py
backend/routes/two_factor.py
frontend/src/pages/auth/TwoFactorSetup.jsx
frontend/src/pages/auth/TwoFactorVerify.jsx
frontend/src/components/auth/QRCodeDisplay.jsx
frontend/src/components/auth/BackupCodesDisplay.jsx
```

### Files to Modify
```
backend/routes/auth.py
backend/models/__init__.py
frontend/src/pages/public/Login.jsx
frontend/src/pages/dashboard/SettingsPage.jsx
frontend/src/services/api.js
frontend/src/App.jsx
```

---

## 1.7 Session Management

### Backend Tasks
- [ ] **1.7.1** Create `backend/models/user_session.py` model
- [ ] **1.7.2** Track device info on login (user agent, IP, location)
- [ ] **1.7.3** Create `/api/auth/sessions` endpoint (list sessions)
- [ ] **1.7.4** Create `/api/auth/sessions/:id/revoke` endpoint
- [ ] **1.7.5** Create `/api/auth/sessions/revoke-all` endpoint
- [ ] **1.7.6** Implement device fingerprinting
- [ ] **1.7.7** Add suspicious login detection
- [ ] **1.7.8** Send email alert on new device login

### Frontend Tasks
- [ ] **1.7.9** Create `frontend/src/pages/dashboard/SessionsPage.jsx`
- [ ] **1.7.10** Display active sessions with device info
- [ ] **1.7.11** Add "Revoke" button for each session
- [ ] **1.7.12** Add "Revoke All Other Sessions" button
- [ ] **1.7.13** Add current session indicator

### Files to Create
```
backend/models/user_session.py
backend/routes/sessions.py
frontend/src/pages/dashboard/SessionsPage.jsx
```

### Files to Modify
```
backend/routes/auth.py
backend/models/__init__.py
frontend/src/App.jsx
frontend/src/services/api.js
```

---

## 1.8 Rate Limiting

### Backend Tasks
- [ ] **1.8.1** Install `flask-limiter` package
- [ ] **1.8.2** Configure rate limiter with Redis backend
- [ ] **1.8.3** Add rate limit: Login (5 attempts/15 min)
- [ ] **1.8.4** Add rate limit: Registration (3 attempts/hour)
- [ ] **1.8.5** Add rate limit: Password reset (3 attempts/hour)
- [ ] **1.8.6** Add rate limit: API calls (100/minute per user)
- [ ] **1.8.7** Add rate limit: Trade execution (30/minute)
- [ ] **1.8.8** Return proper rate limit headers
- [ ] **1.8.9** Implement IP-based and user-based limits

### Frontend Tasks
- [ ] **1.8.10** Handle 429 (Too Many Requests) errors
- [ ] **1.8.11** Display rate limit countdown in UI
- [ ] **1.8.12** Add CAPTCHA after failed attempts

### Files to Create
```
backend/middleware/rate_limiter.py
```

### Files to Modify
```
backend/app.py
backend/routes/auth.py
frontend/src/services/api.js
```

---

## 1.9 Audit Logging

### Backend Tasks
- [ ] **1.9.1** Create `backend/models/audit_log.py` model
- [ ] **1.9.2** Create `backend/services/audit_service.py`
- [ ] **1.9.3** Log all authentication events
- [ ] **1.9.4** Log all trade executions
- [ ] **1.9.5** Log all payout requests
- [ ] **1.9.6** Log all admin actions
- [ ] **1.9.7** Log all settings changes
- [ ] **1.9.8** Store IP address and user agent
- [ ] **1.9.9** Create admin endpoint to view audit logs

### Frontend Tasks (Admin)
- [ ] **1.9.10** Create `frontend/src/pages/admin/AuditLogsPage.jsx`
- [ ] **1.9.11** Add filtering by user, action type, date
- [ ] **1.9.12** Add export to CSV functionality

### Files to Create
```
backend/models/audit_log.py
backend/services/audit_service.py
frontend/src/pages/admin/AuditLogsPage.jsx
```

---

## 1.10 KYC Verification System

### Backend Tasks
- [ ] **1.10.1** Create `backend/models/kyc_data.py` model
- [ ] **1.10.2** Define KYC tiers (0-4) with limits
- [ ] **1.10.3** Create `/api/kyc/status` endpoint
- [ ] **1.10.4** Create `/api/kyc/submit` endpoint
- [ ] **1.10.5** Create `/api/kyc/upload-document` endpoint
- [ ] **1.10.6** Integrate file upload (S3/CloudStorage)
- [ ] **1.10.7** Create admin KYC review queue
- [ ] **1.10.8** Create `/api/admin/kyc/pending` endpoint
- [ ] **1.10.9** Create `/api/admin/kyc/:id/approve` endpoint
- [ ] **1.10.10** Create `/api/admin/kyc/:id/reject` endpoint
- [ ] **1.10.11** Add KYC tier check to payout requests

### Frontend Tasks
- [ ] **1.10.12** Create `frontend/src/pages/dashboard/KYCPage.jsx`
- [ ] **1.10.13** Create `frontend/src/components/kyc/DocumentUpload.jsx`
- [ ] **1.10.14** Create `frontend/src/components/kyc/KYCStatus.jsx`
- [ ] **1.10.15** Create `frontend/src/components/kyc/TierInfo.jsx`
- [ ] **1.10.16** Add KYC banner for unverified users
- [ ] **1.10.17** Create admin KYC review page
- [ ] **1.10.18** Add document viewer for admin

### Files to Create
```
backend/models/kyc_data.py
backend/routes/kyc.py
backend/services/storage_service.py
frontend/src/pages/dashboard/KYCPage.jsx
frontend/src/components/kyc/DocumentUpload.jsx
frontend/src/components/kyc/KYCStatus.jsx
frontend/src/components/kyc/TierInfo.jsx
frontend/src/pages/admin/KYCReviewPage.jsx
```

### Files to Modify
```
backend/routes/payouts.py
backend/models/__init__.py
frontend/src/App.jsx
frontend/src/services/api.js
```

---

# PHASE 2: REVENUE EXPANSION (Priority: P2)

## 2.1 Subscription System

### Backend Tasks
- [ ] **2.1.1** Create `backend/models/subscription_plan.py` model
- [ ] **2.1.2** Create `backend/models/user_subscription.py` model
- [ ] **2.1.3** Define subscription plans (Signal Basic, Pro, Trading Room, Mentorship)
- [ ] **2.1.4** Integrate Stripe recurring billing
- [ ] **2.1.5** Create `/api/subscriptions/plans` endpoint
- [ ] **2.1.6** Create `/api/subscriptions/subscribe` endpoint
- [ ] **2.1.7** Create `/api/subscriptions/my-subscription` endpoint
- [ ] **2.1.8** Create `/api/subscriptions/cancel` endpoint
- [ ] **2.1.9** Create `/api/subscriptions/change-plan` endpoint
- [ ] **2.1.10** Handle webhook for subscription events
- [ ] **2.1.11** Implement subscription feature gates

### Frontend Tasks
- [ ] **2.1.12** Create `frontend/src/pages/dashboard/SubscriptionsPage.jsx`
- [ ] **2.1.13** Create `frontend/src/components/subscription/PlanCard.jsx`
- [ ] **2.1.14** Create `frontend/src/components/subscription/CurrentPlan.jsx`
- [ ] **2.1.15** Create `frontend/src/pages/checkout/SubscriptionCheckout.jsx`
- [ ] **2.1.16** Add subscription status in user profile
- [ ] **2.1.17** Create billing history view

### Files to Create
```
backend/models/subscription_plan.py
backend/models/user_subscription.py
backend/routes/subscriptions_v2.py
backend/services/stripe_service.py
frontend/src/pages/dashboard/SubscriptionsPage.jsx
frontend/src/components/subscription/PlanCard.jsx
frontend/src/components/subscription/CurrentPlan.jsx
frontend/src/pages/checkout/SubscriptionCheckout.jsx
```

---

## 2.2 Challenge Add-ons (Reset, Extend, Upgrade)

### Backend Tasks
- [ ] **2.2.1** Create `backend/models/challenge_addon.py` model
- [ ] **2.2.2** Create `/api/challenges/:id/reset` endpoint
- [ ] **2.2.3** Create `/api/challenges/:id/extend` endpoint
- [ ] **2.2.4** Create `/api/challenges/:id/upgrade` endpoint
- [ ] **2.2.5** Implement reset logic (10% discount, balance reset)
- [ ] **2.2.6** Implement extension logic ($49/30 days)
- [ ] **2.2.7** Implement upgrade logic (pay difference + 10%)
- [ ] **2.2.8** Add payment flow for add-ons

### Frontend Tasks
- [ ] **2.2.9** Create `frontend/src/components/challenge/ResetModal.jsx`
- [ ] **2.2.10** Create `frontend/src/components/challenge/ExtendModal.jsx`
- [ ] **2.2.11** Create `frontend/src/components/challenge/UpgradeModal.jsx`
- [ ] **2.2.12** Add add-on buttons in AccountsPage
- [ ] **2.2.13** Show add-on history in challenge details

### Files to Create
```
backend/models/challenge_addon.py
backend/routes/challenge_addons.py
frontend/src/components/challenge/ResetModal.jsx
frontend/src/components/challenge/ExtendModal.jsx
frontend/src/components/challenge/UpgradeModal.jsx
```

### Files to Modify
```
backend/models/__init__.py
frontend/src/pages/dashboard/AccountsPage.jsx
frontend/src/services/api.js
```

---

## 2.3 Multi-Tier Affiliate Program

### Backend Tasks
- [ ] **2.3.1** Update Referral model for multi-tier (Tier 1: 15%, Tier 2: 5%)
- [ ] **2.3.2** Track sub-referrals (referral chain)
- [ ] **2.3.3** Create `/api/affiliates/dashboard` endpoint
- [ ] **2.3.4** Create `/api/affiliates/sub-affiliates` endpoint
- [ ] **2.3.5** Create `/api/affiliates/commissions` endpoint
- [ ] **2.3.6** Create `/api/affiliates/payout-request` endpoint
- [ ] **2.3.7** Implement weekly payout schedule (min $100)
- [ ] **2.3.8** Create affiliate performance bonuses logic

### Frontend Tasks
- [ ] **2.3.9** Redesign `ReferralPage.jsx` as Affiliate Dashboard
- [ ] **2.3.10** Create `frontend/src/components/affiliate/CommissionChart.jsx`
- [ ] **2.3.11** Create `frontend/src/components/affiliate/SubAffiliateTree.jsx`
- [ ] **2.3.12** Create `frontend/src/components/affiliate/PayoutHistory.jsx`
- [ ] **2.3.13** Add marketing materials download section

### Files to Modify
```
backend/models/referral.py
backend/routes/referrals.py
frontend/src/pages/dashboard/ReferralPage.jsx
frontend/src/services/api.js
```

---

## 2.4 Points Redemption System

### Backend Tasks
- [ ] **2.4.1** Add redemption options to points system
- [ ] **2.4.2** Create `/api/points/redeem` endpoint
- [ ] **2.4.3** Define redemption catalog (discounts, free months, merch)
- [ ] **2.4.4** Create `backend/models/points_redemption.py`
- [ ] **2.4.5** Implement redemption validation and processing

### Frontend Tasks
- [ ] **2.4.6** Create `frontend/src/pages/dashboard/PointsRewardsPage.jsx`
- [ ] **2.4.7** Create reward catalog display
- [ ] **2.4.8** Add redemption confirmation modal
- [ ] **2.4.9** Show redemption history

### Files to Create
```
backend/models/points_redemption.py
frontend/src/pages/dashboard/PointsRewardsPage.jsx
```

---

# PHASE 3: TRADING ENHANCEMENTS (Priority: P2)

## 3.1 Advanced Order Types

### Backend Tasks
- [ ] **3.1.1** Create `backend/models/advanced_order.py` model
- [ ] **3.1.2** Implement trailing stop loss logic
- [ ] **3.1.3** Implement OCO (One-Cancels-Other) orders
- [ ] **3.1.4** Implement bracket orders (entry + SL + TP)
- [ ] **3.1.5** Create `/api/orders/trailing-stop` endpoint
- [ ] **3.1.6** Create `/api/orders/oco` endpoint
- [ ] **3.1.7** Create `/api/orders/bracket` endpoint
- [ ] **3.1.8** Add order update websocket events

### Frontend Tasks
- [ ] **3.1.9** Create `frontend/src/components/trading/TrailingStopForm.jsx`
- [ ] **3.1.10** Create `frontend/src/components/trading/OCOOrderForm.jsx`
- [ ] **3.1.11** Create `frontend/src/components/trading/BracketOrderForm.jsx`
- [ ] **3.1.12** Update TradeForm with advanced order tabs
- [ ] **3.1.13** Add order type indicator in positions table

### Files to Create
```
backend/models/advanced_order.py
backend/routes/advanced_orders.py
frontend/src/components/trading/TrailingStopForm.jsx
frontend/src/components/trading/OCOOrderForm.jsx
frontend/src/components/trading/BracketOrderForm.jsx
```

---

## 3.2 One-Click Trading

### Backend Tasks
- [ ] **3.2.1** Create quick order execution endpoint
- [ ] **3.2.2** Implement pre-configured lot size settings
- [ ] **3.2.3** Add default SL/TP settings per user

### Frontend Tasks
- [ ] **3.2.4** Create `frontend/src/components/trading/OneClickPanel.jsx`
- [ ] **3.2.5** Add buy/sell buttons with instant execution
- [ ] **3.2.6** Add one-click settings configuration
- [ ] **3.2.7** Implement hotkey support (B=Buy, S=Sell)

### Files to Create
```
frontend/src/components/trading/OneClickPanel.jsx
frontend/src/hooks/useHotkeys.js
```

---

## 3.3 Order Templates

### Backend Tasks
- [ ] **3.3.1** Create `backend/models/order_template.py` model
- [ ] **3.3.2** Create `/api/templates` CRUD endpoints
- [ ] **3.3.3** Allow saving favorite order configurations

### Frontend Tasks
- [ ] **3.3.4** Create `frontend/src/pages/dashboard/OrderTemplatesPage.jsx`
- [ ] **3.3.5** Create template save modal
- [ ] **3.3.6** Add "Use Template" dropdown in TradeForm

### Files to Create
```
backend/models/order_template.py
backend/routes/order_templates.py
frontend/src/pages/dashboard/OrderTemplatesPage.jsx
```

---

## 3.4 Trade Journal

### Backend Tasks
- [ ] **3.4.1** Create `backend/models/trade_journal.py` model
- [ ] **3.4.2** Create `/api/journal` CRUD endpoints
- [ ] **3.4.3** Create `/api/journal/analytics` endpoint
- [ ] **3.4.4** Create `/api/journal/export` endpoint (PDF/CSV)
- [ ] **3.4.5** Add screenshot upload support

### Frontend Tasks
- [ ] **3.4.6** Create `frontend/src/pages/dashboard/TradeJournalPage.jsx`
- [ ] **3.4.7** Create `frontend/src/components/journal/JournalEntry.jsx`
- [ ] **3.4.8** Create `frontend/src/components/journal/JournalAnalytics.jsx`
- [ ] **3.4.9** Create `frontend/src/components/journal/JournalFilters.jsx`
- [ ] **3.4.10** Add quick journal button on trade close
- [ ] **3.4.11** Implement tags and emotions tracking

### Files to Create
```
backend/models/trade_journal.py
backend/routes/journal.py
frontend/src/pages/dashboard/TradeJournalPage.jsx
frontend/src/components/journal/JournalEntry.jsx
frontend/src/components/journal/JournalAnalytics.jsx
frontend/src/components/journal/JournalFilters.jsx
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

## 4.1 Trader Profiles

### Backend Tasks
- [ ] **4.1.1** Create `backend/models/trader_profile.py` model
- [ ] **4.1.2** Calculate trader statistics (win rate, profit %, drawdown, Sharpe)
- [ ] **4.1.3** Create `/api/profiles/me` endpoint
- [ ] **4.1.4** Create `/api/profiles/:id` public endpoint
- [ ] **4.1.5** Create `/api/profiles/:id/trades` endpoint
- [ ] **4.1.6** Create `/api/profiles/:id/equity-curve` endpoint
- [ ] **4.1.7** Implement verification badge system

### Frontend Tasks
- [ ] **4.1.8** Create `frontend/src/pages/dashboard/MyProfilePage.jsx`
- [ ] **4.1.9** Create `frontend/src/pages/public/TraderProfile.jsx`
- [ ] **4.1.10** Create `frontend/src/components/profile/ProfileHeader.jsx`
- [ ] **4.1.11** Create `frontend/src/components/profile/StatisticsGrid.jsx`
- [ ] **4.1.12** Create `frontend/src/components/profile/EquityCurve.jsx`
- [ ] **4.1.13** Create `frontend/src/components/profile/BadgesDisplay.jsx`
- [ ] **4.1.14** Create `frontend/src/components/profile/TradeHistory.jsx`

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

## 4.2 Follow System

### Backend Tasks
- [ ] **4.2.1** Create `backend/models/trader_follower.py` model
- [ ] **4.2.2** Create `/api/follow/:id` endpoint
- [ ] **4.2.3** Create `/api/unfollow/:id` endpoint
- [ ] **4.2.4** Create `/api/followers` endpoint
- [ ] **4.2.5** Create `/api/following` endpoint
- [ ] **4.2.6** Add follower count to profiles

### Frontend Tasks
- [ ] **4.2.7** Create follow/unfollow button component
- [ ] **4.2.8** Create followers list page
- [ ] **4.2.9** Create following list page
- [ ] **4.2.10** Add follow suggestions based on performance

### Files to Create
```
backend/models/trader_follower.py
backend/routes/followers.py
frontend/src/components/social/FollowButton.jsx
frontend/src/pages/dashboard/FollowersPage.jsx
frontend/src/pages/dashboard/FollowingPage.jsx
```

---

## 4.3 Copy Trading

### Backend Tasks
- [ ] **4.3.1** Create `backend/models/copy_trade.py` model
- [ ] **4.3.2** Create `backend/services/copy_trading_service.py`
- [ ] **4.3.3** Create `/api/copy-trading/traders` endpoint
- [ ] **4.3.4** Create `/api/copy-trading/follow/:id` endpoint
- [ ] **4.3.5** Create `/api/copy-trading/settings/:id` endpoint
- [ ] **4.3.6** Implement copy ratio calculation
- [ ] **4.3.7** Implement risk limits for copy trading
- [ ] **4.3.8** Create signal broadcast system
- [ ] **4.3.9** Handle master trade → copy trade execution
- [ ] **4.3.10** Calculate and distribute performance fees

### Frontend Tasks
- [ ] **4.3.11** Create `frontend/src/pages/dashboard/CopyTradingPage.jsx`
- [ ] **4.3.12** Create `frontend/src/components/copy/TraderCard.jsx`
- [ ] **4.3.13** Create `frontend/src/components/copy/CopySettingsModal.jsx`
- [ ] **4.3.14** Create `frontend/src/components/copy/CopyPerformance.jsx`
- [ ] **4.3.15** Add copy trading toggle in trader profiles

### Files to Create
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

## 4.4 Trading Ideas

### Backend Tasks
- [ ] **4.4.1** Create `backend/models/trading_idea.py` model
- [ ] **4.4.2** Create `backend/models/idea_comment.py` model
- [ ] **4.4.3** Create `backend/models/idea_like.py` model
- [ ] **4.4.4** Create `/api/ideas` CRUD endpoints
- [ ] **4.4.5** Create `/api/ideas/:id/like` endpoint
- [ ] **4.4.6** Create `/api/ideas/:id/comments` endpoint
- [ ] **4.4.7** Implement chart screenshot upload

### Frontend Tasks
- [ ] **4.4.8** Create `frontend/src/pages/dashboard/TradingIdeasPage.jsx`
- [ ] **4.4.9** Create `frontend/src/components/ideas/IdeaCard.jsx`
- [ ] **4.4.10** Create `frontend/src/components/ideas/CreateIdeaModal.jsx`
- [ ] **4.4.11** Create `frontend/src/components/ideas/IdeaDetail.jsx`
- [ ] **4.4.12** Create `frontend/src/components/ideas/CommentSection.jsx`

### Files to Create
```
backend/models/trading_idea.py
backend/models/idea_comment.py
backend/models/idea_like.py
backend/routes/trading_ideas.py
frontend/src/pages/dashboard/TradingIdeasPage.jsx
frontend/src/components/ideas/IdeaCard.jsx
frontend/src/components/ideas/CreateIdeaModal.jsx
frontend/src/components/ideas/IdeaDetail.jsx
frontend/src/components/ideas/CommentSection.jsx
```

---

# PHASE 5: MOBILE & NOTIFICATIONS (Priority: P2)

## 5.1 Push Notifications

### Backend Tasks
- [ ] **5.1.1** Create `backend/models/push_device.py` model
- [ ] **5.1.2** Integrate Firebase Cloud Messaging
- [ ] **5.1.3** Create `/api/notifications/register-device` endpoint
- [ ] **5.1.4** Send push on trade execution
- [ ] **5.1.5** Send push on challenge updates
- [ ] **5.1.6** Send push on payout status

### Frontend Tasks
- [ ] **5.1.7** Implement service worker for web push
- [ ] **5.1.8** Add notification permission request
- [ ] **5.1.9** Create notification settings page

### Files to Create
```
backend/models/push_device.py
backend/services/push_notification_service.py
frontend/public/firebase-messaging-sw.js
frontend/src/services/pushNotifications.js
```

---

## 5.2 Enhanced Notification Settings

### Backend Tasks
- [ ] **5.2.1** Create `backend/models/notification_settings.py` model
- [ ] **5.2.2** Create `/api/notifications/settings` endpoint
- [ ] **5.2.3** Add granular notification controls

### Frontend Tasks
- [ ] **5.2.4** Enhance `NotificationsPage.jsx` with settings tab
- [ ] **5.2.5** Create notification preference toggles
- [ ] **5.2.6** Add notification categories (Trade, Account, Marketing)

### Files to Create
```
backend/models/notification_settings.py
frontend/src/components/notifications/NotificationSettings.jsx
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

## 6.1 Blog System

### Backend Tasks
- [ ] **6.1.1** Create `backend/models/blog_post.py` model
- [ ] **6.1.2** Create `/api/blog` CRUD endpoints
- [ ] **6.1.3** Add categories and tags
- [ ] **6.1.4** Implement SEO metadata

### Frontend Tasks
- [ ] **6.1.5** Create `frontend/src/pages/public/BlogPage.jsx`
- [ ] **6.1.6** Create `frontend/src/pages/public/BlogPost.jsx`
- [ ] **6.1.7** Create admin blog management page

---

## 6.2 Webinars System

### Backend Tasks
- [ ] **6.2.1** Create `backend/models/webinar.py` model
- [ ] **6.2.2** Integrate with Zoom/Google Meet API
- [ ] **6.2.3** Create webinar registration system

### Frontend Tasks
- [ ] **6.2.4** Create `frontend/src/pages/public/WebinarsPage.jsx`
- [ ] **6.2.5** Create webinar registration form
- [ ] **6.2.6** Create webinar replay page

---

## 6.3 SSO Integration (Google/Apple)

### Backend Tasks
- [ ] **6.3.1** Install `flask-dance` or OAuth libraries
- [ ] **6.3.2** Configure Google OAuth
- [ ] **6.3.3** Configure Apple Sign-In
- [ ] **6.3.4** Handle account linking

### Frontend Tasks
- [ ] **6.3.5** Add Google Sign-In button
- [ ] **6.3.6** Add Apple Sign-In button
- [ ] **6.3.7** Handle OAuth callback

---

## 6.4 Seasonal Events & Promotions

### Backend Tasks
- [ ] **6.4.1** Create event scheduling system
- [ ] **6.4.2** Implement flash sales logic
- [ ] **6.4.3** Create holiday bonus system

### Frontend Tasks
- [ ] **6.4.4** Create event banner components
- [ ] **6.4.5** Create countdown timers
- [ ] **6.4.6** Create promotional landing pages

---

## 6.5 Monitoring & Analytics

### Backend Tasks
- [ ] **6.5.1** Integrate Sentry for error tracking
- [ ] **6.5.2** Setup Datadog for APM
- [ ] **6.5.3** Configure ELK stack for logs
- [ ] **6.5.4** Create Grafana dashboards
- [ ] **6.5.5** Setup PagerDuty alerts

### Frontend Tasks
- [ ] **6.5.6** Add Sentry browser SDK
- [ ] **6.5.7** Add performance monitoring
- [ ] **6.5.8** Create admin analytics dashboard

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
- [ ] PostgreSQL migration complete
- [ ] Redis cache operational
- [ ] Celery task queue running
- [ ] Email system working
- [ ] Email verification flow complete
- [ ] 2FA implementation done
- [ ] Session management active
- [ ] Rate limiting enabled
- [ ] Audit logging operational
- [ ] KYC system functional

## Phase 2 Completion Checklist
- [ ] Subscription plans live
- [ ] Challenge add-ons working
- [ ] Multi-tier affiliate program active
- [ ] Points redemption available

## Phase 3 Completion Checklist
- [ ] Advanced orders implemented
- [ ] One-click trading functional
- [ ] Order templates available
- [ ] Trade journal complete
- [ ] MT4/MT5 integration working
- [ ] Enhanced charts operational

## Phase 4 Completion Checklist
- [ ] Trader profiles public
- [ ] Follow system active
- [ ] Copy trading operational
- [ ] Trading ideas platform live

## Phase 5 Completion Checklist
- [ ] Push notifications working
- [ ] Notification settings complete
- [ ] Mobile app published

## Phase 6 Completion Checklist
- [ ] Blog system live
- [ ] Webinars functional
- [ ] SSO integration complete
- [ ] Seasonal events system ready
- [ ] Monitoring stack operational

---

*Document generated: December 2024*
*Total Tasks: ~213 tasks*
*Estimated Timeline: 6 months*
