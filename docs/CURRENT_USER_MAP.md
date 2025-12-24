# TradeSense - Current User Journey Map & System Architecture

**Version:** 1.0
**Date:** December 2024
**Status:** Production Ready

---

## Table of Contents
1. [User Journey Overview](#1-user-journey-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Route Architecture](#3-route-architecture)
4. [Challenge Flow Schema](#4-challenge-flow-schema)
5. [Payment Flow Schema](#5-payment-flow-schema)
6. [Database Schema](#6-database-schema)
7. [API Endpoints Map](#7-api-endpoints-map)
8. [Frontend Architecture](#8-frontend-architecture)
9. [State Management](#9-state-management)

---

## 1. User Journey Overview

### Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           TRADESENSE USER JOURNEY MAP                                │
│                                  (Current State)                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                 ┌──────────────────┐
                                 │    INTERNET      │
                                 │     VISITOR      │
                                 └────────┬─────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  DISCOVERY      │            │   EDUCATION     │            │   SOCIAL PROOF  │
│                 │            │                 │            │                 │
│ • /pricing      │            │ • /academy      │            │ • /leaderboard  │
│ • /how-it-works │            │ • /news         │            │ • /hall-of-fame │
│ • /calendar     │            │ • /faq          │            │ • /about        │
│ • /partners     │            │ • /contact      │            │                 │
└────────┬────────┘            └─────────────────┘            └─────────────────┘
         │
         │ ◄─── User decides to join
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION LAYER                                    │
│                                                                                      │
│  ┌─────────────────────────────┐         ┌─────────────────────────────┐           │
│  │       REGISTRATION          │         │          LOGIN              │           │
│  │        /register            │         │          /login             │           │
│  │                             │         │                             │           │
│  │  Required Fields:           │         │  Required Fields:           │           │
│  │  • username                 │         │  • email                    │           │
│  │  • email                    │         │  • password                 │           │
│  │  • password                 │         │                             │           │
│  │  • preferred_language       │         │  Demo Account:              │           │
│  │    (fr/en/ar)               │         │  • demo@tradesense.com      │           │
│  │                             │         │  • demo123                  │           │
│  └──────────────┬──────────────┘         └──────────────┬──────────────┘           │
│                 │                                       │                           │
│                 └───────────────────┬───────────────────┘                           │
│                                     │                                               │
│                                     ▼                                               │
│                          ┌─────────────────────┐                                    │
│                          │   JWT TOKENS        │                                    │
│                          │   GENERATED         │                                    │
│                          │                     │                                    │
│                          │ • access_token      │                                    │
│                          │ • refresh_token     │                                    │
│                          │ • stored in         │                                    │
│                          │   localStorage      │                                    │
│                          └──────────┬──────────┘                                    │
│                                     │                                               │
└─────────────────────────────────────┼───────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATED USER (No Challenge)                           │
│                                                                                      │
│                    User can access: /home, /masterclass, /community                  │
│                                                                                      │
│                         ┌─────────────────────────────┐                             │
│                         │     CHALLENGE GATE          │                             │
│                         │                             │                             │
│                         │  User must acquire a        │                             │
│                         │  challenge to access        │                             │
│                         │  the trading dashboard      │                             │
│                         └──────────────┬──────────────┘                             │
│                                        │                                            │
│                 ┌──────────────────────┴──────────────────────┐                     │
│                 │                                             │                     │
│                 ▼                                             ▼                     │
│    ┌────────────────────────┐                  ┌────────────────────────┐          │
│    │     FREE TRIAL         │                  │     PAID PLAN          │          │
│    │     /free-trial        │                  │     /plans             │          │
│    │                        │                  │                        │          │
│    │  • $5,000 Demo Capital │                  │  Challenge Models:     │          │
│    │  • 7 Days Duration     │                  │  ┌──────────────────┐  │          │
│    │  • PayPal Authorization│                  │  │ Stellar 1-Step   │  │          │
│    │  • No upfront payment  │                  │  │ • 1 Phase        │  │          │
│    │                        │                  │  │ • 10% Target     │  │          │
│    │  Flow:                 │                  │  │ • 3% Daily Loss  │  │          │
│    │  1. Select plan tier   │                  │  └──────────────────┘  │          │
│    │  2. PayPal auth        │                  │  ┌──────────────────┐  │          │
│    │  3. Confirm trial      │                  │  │ Stellar 2-Step   │  │          │
│    │  4. Start trading      │                  │  │ • 2 Phases       │  │          │
│    │                        │                  │  │ • 8%/5% Targets  │  │          │
│    └───────────┬────────────┘                  │  │ • 5% Daily Loss  │  │          │
│                │                               │  └──────────────────┘  │          │
│                │                               │  ┌──────────────────┐  │          │
│                │                               │  │ Stellar Lite     │  │          │
│                │                               │  │ • 2 Phases       │  │          │
│                │                               │  │ • Budget-friendly│  │          │
│                │                               │  │ • 4% Daily Loss  │  │          │
│                │                               │  └──────────────────┘  │          │
│                │                               │                        │          │
│                │                               │  Account Sizes:        │          │
│                │                               │  $5K → $200K           │          │
│                │                               └───────────┬────────────┘          │
│                │                                           │                       │
│                │                                           ▼                       │
│                │                               ┌────────────────────────┐          │
│                │                               │      CHECKOUT          │          │
│                │                               │  /checkout/:planType   │          │
│                │                               │                        │          │
│                │                               │  Payment Methods:      │          │
│                │                               │  • CMI (Credit Card)   │          │
│                │                               │  • PayPal              │          │
│                │                               │  • Crypto (BTC/ETH)    │          │
│                │                               └───────────┬────────────┘          │
│                │                                           │                       │
│                └─────────────────────┬─────────────────────┘                       │
│                                      │                                             │
└──────────────────────────────────────┼─────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CHALLENGE LIFECYCLE                                        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PHASE PROGRESSION                                    │   │
│  │                                                                              │   │
│  │   ┌─────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────┐  │   │
│  │   │  TRIAL  │ ───► │ EVALUATION  │ ───► │ VERIFICATION │ ───► │ FUNDED  │  │   │
│  │   │         │      │  (Phase 1)  │      │  (Phase 2)   │      │         │  │   │
│  │   └────┬────┘      └──────┬──────┘      └──────┬───────┘      └────┬────┘  │   │
│  │        │                  │                    │                   │       │   │
│  │        ▼                  ▼                    ▼                   ▼       │   │
│  │   ┌─────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────┐  │   │
│  │   │ 7 Days  │      │ Target: 10% │      │ Target: 5%   │      │ No      │  │   │
│  │   │ $5K     │      │ Daily: -5%  │      │ Daily: -5%   │      │ Target  │  │   │
│  │   │ Demo    │      │ Max: -10%   │      │ Max: -10%    │      │         │  │   │
│  │   └─────────┘      └─────────────┘      └──────────────┘      │ 80%     │  │   │
│  │                                                               │ Profit  │  │   │
│  │   Success: Advance to Phase 1                                 │ Split   │  │   │
│  │   Failure: Challenge ends                                     └─────────┘  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│                                       │                                              │
│                                       ▼                                              │
│                          ┌─────────────────────────┐                                │
│                          │    FUNDED TRADER        │                                │
│                          │                         │                                │
│                          │  • Unlimited trading    │                                │
│                          │  • 80% profit split     │                                │
│                          │  • Withdrawal access    │                                │
│                          │  • Same risk rules      │                                │
│                          └────────────┬────────────┘                                │
│                                       │                                              │
│                                       ▼                                              │
│                          ┌─────────────────────────┐                                │
│                          │       PAYOUTS           │                                │
│                          │                         │                                │
│                          │  Methods:               │                                │
│                          │  • PayPal               │                                │
│                          │  • Bank Transfer        │                                │
│                          │  • Crypto               │                                │
│                          │                         │                                │
│                          │  Process:               │                                │
│                          │  1. Request withdrawal  │                                │
│                          │  2. Admin approval      │                                │
│                          │  3. Processing          │                                │
│                          │  4. Funds transferred   │                                │
│                          └─────────────────────────┘                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Roles & Permissions

### Role Hierarchy Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              USER ROLE HIERARCHY                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   SUPERADMIN    │
                              │                 │
                              │ Full system     │
                              │ control         │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     │
           ┌─────────────────┐                           │
           │     ADMIN       │                           │
           │                 │                           │
           │ User & challenge│                           │
           │ management      │                           │
           └────────┬────────┘                           │
                    │                                     │
                    ▼                                     │
           ┌─────────────────┐                           │
           │      USER       │◄──────────────────────────┘
           │                 │
           │ Trading &       │
           │ account access  │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │     GUEST       │
           │                 │
           │ Public pages    │
           │ only            │
           └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PERMISSIONS MATRIX                                         │
├─────────────────────────┬───────┬───────┬───────┬────────────┐                      │
│ Action                  │ Guest │ User  │ Admin │ SuperAdmin │                      │
├─────────────────────────┼───────┼───────┼───────┼────────────┤                      │
│ View public pages       │  ✓    │   ✓   │   ✓   │     ✓      │                      │
│ Register/Login          │  ✓    │   -   │   -   │     -      │                      │
│ View dashboard          │  ✗    │   ✓   │   ✓   │     ✓      │                      │
│ Execute trades          │  ✗    │   ✓   │   ✓   │     ✓      │                      │
│ Request payouts         │  ✗    │   ✓*  │   ✓   │     ✓      │                      │
│ Refer users             │  ✗    │   ✓   │   ✓   │     ✓      │                      │
│ View admin panel        │  ✗    │   ✗   │   ✓   │     ✓      │                      │
│ Manage users            │  ✗    │   ✗   │   ✓   │     ✓      │                      │
│ Approve payouts         │  ✗    │   ✗   │   ✓   │     ✓      │                      │
│ Manage challenges       │  ✗    │   ✗   │   ✓   │     ✓      │                      │
│ View superadmin panel   │  ✗    │   ✗   │   ✗   │     ✓      │                      │
│ Manage settings         │  ✗    │   ✗   │   ✗   │     ✓      │                      │
│ Manage API keys         │  ✗    │   ✗   │   ✗   │     ✓      │                      │
│ Promote/Demote admins   │  ✗    │   ✗   │   ✗   │     ✓      │                      │
├─────────────────────────┴───────┴───────┴───────┴────────────┤                      │
│ * User must be funded to request payouts                      │                      │
└───────────────────────────────────────────────────────────────┘                      │
```

---

## 3. Route Architecture

### Frontend Routes Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ROUTE ARCHITECTURE                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No Authentication Required)
├── /                          → LandingPage (Smart redirect if authenticated)
├── /pricing                   → Pricing (Challenge plans with AI tiers)
├── /leaderboard               → LeaderboardPage (Top traders)
├── /news                      → News (Market updates)
├── /how-it-works              → HowItWorks (Platform guide)
├── /calendar                  → EconomicCalendar (Public version)
├── /academy                   → Academy (Educational content)
├── /partners                  → Partners (Affiliate info)
├── /hall-of-fame              → HallOfFame (Top performers)
├── /about                     → About (Company info)
├── /faq                       → FAQ (Help center)
└── /contact                   → Contact (Support form)

GUEST ROUTES (Redirect to /home if authenticated)
├── /login                     → Login (Email/Password auth)
├── /register                  → Register (Account creation)
└── /free-trial                → FreeTrial (7-day trial signup)

AUTH ROUTES (Authentication required, no challenge needed)
├── /home                      → SmartAuthHomeRedirect
├── /masterclass               → MasterClass (Trading courses)
└── /community                 → Community (Forum)

DASHBOARD ROUTES (Authentication + Active Challenge required)
│
├── MAIN NAVIGATION
│   ├── /accounts              → AccountsPage (Main dashboard)
│   ├── /margin-calculator     → MarginCalculatorPage (Risk calculator)
│   ├── /billing/billing-history → BillingHistoryPage (Transactions)
│   ├── /notifications         → NotificationsPage (User alerts)
│   ├── /support-tickets       → SupportTicketsPage (Help desk)
│   ├── /plans                 → PlansPage (Challenge selection)
│   ├── /profile/default       → ProfilePage (User profile)
│   └── /settings              → SettingsPage (Account settings)
│
├── REWARDS HUB
│   ├── /refer-and-earn        → ReferralPage (Affiliate program)
│   ├── /my-offers             → MyOffersPage (Promotions)
│   ├── /competition           → CompetitionPage (Trading contests)
│   └── /certificates          → CertificatesPage (Achievements)
│
├── INFINITY POINTS
│   ├── /infinity-points       → PointsActivitiesPage (Earn points)
│   ├── /infinity-points/profile → PointsProfilePage (Points balance)
│   └── /infinity-points/history → PointsHistoryPage (Points log)
│
└── HELP & SUPPORT
    ├── /utilities             → UtilitiesPage (Files & tools)
    └── /calendar              → CalendarPage (Economic events)

CHECKOUT ROUTES
├── /checkout/trial            → TrialCheckout (Free trial)
├── /checkout/trial/confirm    → TrialConfirm (Confirmation)
└── /checkout/:planType        → Checkout (Payment)

ADMIN ROUTES
├── /admin                     → AdminPanel (Admin only)
└── /superadmin                → SuperAdmin (Superadmin only)
```

---

## 4. Challenge Flow Schema

### Challenge State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CHALLENGE STATE MACHINE                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   NO CHALLENGE  │
                              │     (null)      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │ Start Trial          │ Purchase Plan │
                    ▼                                      ▼
           ┌─────────────────┐                   ┌─────────────────┐
           │     TRIAL       │                   │   EVALUATION    │
           │                 │                   │    (Phase 1)    │
           │ status: active  │                   │                 │
           │ phase: trial    │                   │ status: active  │
           │ is_trial: true  │                   │ phase: evaluation│
           └────────┬────────┘                   └────────┬────────┘
                    │                                     │
         ┌─────────┬┴─────────┐              ┌───────────┼───────────┐
         │         │          │              │           │           │
         ▼         ▼          ▼              ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ EXPIRED │ │ PASSED  │ │ FAILED  │ │ PASSED  │ │ FAILED  │ │ BREACHED│
    │         │ │         │ │         │ │         │ │         │ │         │
    │ 7 days  │ │ +10%    │ │ -10%    │ │ +10%    │ │ -10%    │ │ Rules   │
    │ elapsed │ │ profit  │ │ loss    │ │ profit  │ │ loss    │ │ violated│
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │          │          │          │          │          │
         ▼          │          ▼          │          ▼          ▼
    ┌─────────┐     │     ┌─────────┐     │     ┌─────────────────┐
    │ ENDED   │     │     │ ENDED   │     │     │     ENDED       │
    │         │     │     │         │     │     │                 │
    │ Can     │     │     │ Can     │     │     │ status: failed  │
    │ purchase│     │     │ restart │     │     │ or breached     │
    │ plan    │     │     │         │     │     │                 │
    └─────────┘     │     └─────────┘     │     └─────────────────┘
                    │                     │
                    ▼                     ▼
           ┌─────────────────┐   ┌─────────────────┐
           │   EVALUATION    │   │  VERIFICATION   │
           │    (Phase 1)    │   │   (Phase 2)     │
           │                 │   │                 │
           │ (from trial)    │   │ status: active  │
           │                 │   │ phase: verify   │
           └────────┬────────┘   └────────┬────────┘
                    │                     │
                    │            ┌────────┼────────┐
                    │            │        │        │
                    │            ▼        ▼        ▼
                    │       ┌─────────┐ ┌─────┐ ┌─────────┐
                    │       │ PASSED  │ │FAIL │ │ BREACHED│
                    │       │ +5%     │ │-10% │ │         │
                    │       └────┬────┘ └──┬──┘ └────┬────┘
                    │            │         │         │
                    │            ▼         ▼         ▼
                    │       ┌─────────┐ ┌─────────────────┐
                    │       │ FUNDED  │ │     ENDED       │
                    │       │         │ └─────────────────┘
                    │       │ status: │
                    │       │ active  │
                    │       │ phase:  │
                    └──────►│ funded  │
                            │         │
                            │ is_funded│
                            │ : true  │
                            └─────────┘
```

### Challenge Rules by Model

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CHALLENGE MODELS COMPARISON                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┐             │
│                 │ Stellar 1-Step  │ Stellar 2-Step  │ Stellar Lite    │             │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤             │
│ Phases          │ 1               │ 2               │ 2               │             │
│ Phase 1 Target  │ 10%             │ 8%              │ 8%              │             │
│ Phase 2 Target  │ -               │ 5%              │ 5%              │             │
│ Max Daily Loss  │ 3%              │ 5%              │ 4%              │             │
│ Max Total Loss  │ 6%              │ 10%             │ 8%              │             │
│ Leverage        │ 1:100           │ 1:100           │ 1:100           │             │
│ Profit Split    │ 80%             │ 80%             │ 80%             │             │
│ News Trading    │ Yes             │ Yes             │ Yes             │             │
│ Weekend Holding │ Yes             │ Yes             │ Yes             │             │
│ EA Allowed      │ Yes             │ Yes             │ Yes             │             │
│ Min Trading Days│ 0               │ 0               │ 0               │             │
│ Time Limit      │ Unlimited       │ Unlimited       │ Unlimited       │             │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┤             │
│                                                                        │             │
│ Account Sizes: $5,000 | $10,000 | $25,000 | $50,000 | $100,000 | $200,000           │
│                                                                        │             │
└────────────────────────────────────────────────────────────────────────┘             │
```

---

## 5. Payment Flow Schema

### Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT PROCESSING FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   User selects  │
                         │   plan & size   │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    /checkout/:plan      │
                    │                         │
                    │  Display:               │
                    │  • Plan details         │
                    │  • Rules & limits       │
                    │  • Price                │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Select Payment Method  │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      CMI        │    │     PayPal      │    │     Crypto      │
│  (Credit Card)  │    │                 │    │                 │
│                 │    │                 │    │                 │
│ • Visa          │    │ • Redirect to   │    │ • BTC           │
│ • Mastercard    │    │   PayPal        │    │ • ETH           │
│ • CMI Morocco   │    │ • Authorize     │    │ • USDT          │
│                 │    │ • Return        │    │                 │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   POST /payments/       │
                    │        checkout         │
                    │                         │
                    │  Request:               │
                    │  • plan_type            │
                    │  • payment_method       │
                    │                         │
                    │  Response:              │
                    │  • payment_id           │
                    │  • redirect_url (if any)│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Payment Processing    │
                    │                         │
                    │  External provider      │
                    │  handles transaction    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   POST /payments/       │
                    │        process          │
                    │                         │
                    │  Request:               │
                    │  • payment_id           │
                    │  • provider_order_id    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
              ▼                                     ▼
    ┌─────────────────┐                   ┌─────────────────┐
    │    SUCCESS      │                   │    FAILURE      │
    │                 │                   │                 │
    │ • Payment saved │                   │ • Error logged  │
    │ • Challenge     │                   │ • User notified │
    │   created       │                   │ • Can retry     │
    │ • Redirect to   │                   │                 │
    │   /accounts     │                   │                 │
    └─────────────────┘                   └─────────────────┘
```

### Payout Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            PAYOUT PROCESSING FLOW                                    │
│                          (Funded Traders Only)                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Funded Trader  │
│  has profits    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  GET /payouts/balance   │
│                         │
│  Returns:               │
│  • available_balance    │
│  • pending_withdrawals  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  POST /payouts/request  │
│                         │
│  Request:               │
│  • amount               │
│  • payment_method       │
│  • paypal_email (opt)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Payout Created       │
│    status: pending      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Admin Review         │
│    /admin panel         │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐     ┌─────────┐
│ APPROVE │     │ REJECT  │
└────┬────┘     └────┬────┘
     │               │
     ▼               ▼
┌─────────┐     ┌─────────────┐
│ PROCESS │     │ User        │
│         │     │ Notified    │
│ Admin   │     │ with reason │
│ executes│     └─────────────┘
│ transfer│
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│      COMPLETED          │
│                         │
│ • Transaction ID saved  │
│ • User balance updated  │
│ • User notified         │
└─────────────────────────┘
```

---

## 6. Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA (ERD)                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│       USERS         │       │   CHALLENGE_MODELS  │       │    ACCOUNT_SIZES    │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │       │ id (PK)             │
│ username            │       │ name                │       │ model_id (FK)       │
│ email               │       │ display_name        │       │ balance             │
│ password_hash       │       │ description         │       │ price               │
│ role                │       │ phases              │       │ sale_price          │
│ avatar              │       │ phase1_profit_target│       │ sale_ends_at        │
│ preferred_language  │       │ phase2_profit_target│       │ is_active           │
│ referral_code       │       │ max_daily_loss      │       │ created_at          │
│ referred_by_code    │       │ max_overall_loss    │       └──────────┬──────────┘
│ created_at          │       │ leverage            │                  │
└──────────┬──────────┘       │ default_profit_split│                  │
           │                  │ badge_color         │                  │
           │                  │ is_popular          │                  │
           │                  │ is_active           │◄─────────────────┘
           │                  └──────────┬──────────┘
           │                             │
           │         ┌───────────────────┘
           │         │
           ▼         ▼
┌─────────────────────────────┐
│      USER_CHALLENGES        │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK)                │
│ model_id (FK)               │
│ plan_type                   │
│ phase                       │
│ status                      │
│ initial_balance             │
│ current_balance             │
│ highest_balance             │
│ is_trial                    │
│ trial_expires_at            │
│ is_funded                   │
│ funded_at                   │
│ created_at                  │
│ updated_at                  │
└──────────┬──────────────────┘
           │
           │
           ▼
┌─────────────────────────────┐       ┌─────────────────────────────┐
│         TRADES              │       │        PAYMENTS             │
├─────────────────────────────┤       ├─────────────────────────────┤
│ id (PK)                     │       │ id (PK)                     │
│ challenge_id (FK)           │       │ user_id (FK)                │
│ user_id (FK)                │       │ challenge_id (FK)           │
│ symbol                      │       │ amount                      │
│ side (buy/sell)             │       │ currency                    │
│ quantity                    │       │ payment_method              │
│ entry_price                 │       │ plan_type                   │
│ exit_price                  │       │ status                      │
│ stop_loss                   │       │ transaction_id              │
│ take_profit                 │       │ created_at                  │
│ status                      │       │ completed_at                │
│ pnl                         │       └─────────────────────────────┘
│ created_at                  │
│ closed_at                   │
└─────────────────────────────┘

┌─────────────────────────────┐       ┌─────────────────────────────┐
│        REFERRALS            │       │      POINTS_BALANCES        │
├─────────────────────────────┤       ├─────────────────────────────┤
│ id (PK)                     │       │ id (PK)                     │
│ referrer_id (FK)            │       │ user_id (FK)                │
│ referred_id (FK)            │       │ total_points                │
│ referral_code               │       │ lifetime_earned             │
│ status                      │       │ level                       │
│ commission_rate             │       │ updated_at                  │
│ commission_amount           │       └─────────────────────────────┘
│ payment_id (FK)             │
│ created_at                  │       ┌─────────────────────────────┐
│ converted_at                │       │   POINTS_TRANSACTIONS       │
│ paid_at                     │       ├─────────────────────────────┤
└─────────────────────────────┘       │ id (PK)                     │
                                      │ user_id (FK)                │
┌─────────────────────────────┐       │ points                      │
│     SUPPORT_TICKETS         │       │ transaction_type            │
├─────────────────────────────┤       │ description                 │
│ id (PK)                     │       │ reference_id                │
│ user_id (FK)                │       │ reference_type              │
│ subject                     │       │ created_at                  │
│ category                    │       └─────────────────────────────┘
│ priority                    │
│ status                      │       ┌─────────────────────────────┐
│ assigned_to (FK)            │       │         OFFERS              │
│ created_at                  │       ├─────────────────────────────┤
│ resolved_at                 │       │ id (PK)                     │
└──────────┬──────────────────┘       │ title                       │
           │                          │ code                        │
           ▼                          │ discount_type               │
┌─────────────────────────────┐       │ discount_value              │
│     TICKET_MESSAGES         │       │ max_uses                    │
├─────────────────────────────┤       │ uses_count                  │
│ id (PK)                     │       │ starts_at                   │
│ ticket_id (FK)              │       │ expires_at                  │
│ sender_id (FK)              │       │ is_active                   │
│ message                     │       └─────────────────────────────┘
│ is_internal                 │
│ attachments                 │       ┌─────────────────────────────┐
│ created_at                  │       │        RESOURCES            │
└─────────────────────────────┘       ├─────────────────────────────┤
                                      │ id (PK)                     │
┌─────────────────────────────┐       │ title                       │
│         PAYOUTS             │       │ description                 │
├─────────────────────────────┤       │ category                    │
│ id (PK)                     │       │ file_type                   │
│ user_id (FK)                │       │ file_url                    │
│ challenge_id (FK)           │       │ download_count              │
│ amount                      │       │ is_active                   │
│ payment_method              │       └─────────────────────────────┘
│ status                      │
│ paypal_email                │
│ transaction_id              │
│ requested_at                │
│ processed_at                │
│ rejected_reason             │
└─────────────────────────────┘
```

---

## 7. API Endpoints Map

### Complete API Reference

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API ENDPOINTS MAP                                       │
│                              Base URL: /api                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

AUTHENTICATION (/api/auth)
├── POST   /login              → Login user, returns tokens
├── POST   /register           → Register new user
├── GET    /me                 → Get current user info
├── PUT    /me                 → Update user profile
└── POST   /refresh            → Refresh access token

CHALLENGES (/api/challenges)
├── GET    /                   → Get all user challenges
├── GET    /active             → Get active challenge
├── GET    /:id                → Get challenge by ID
├── GET    /:id/stats          → Get challenge statistics
├── POST   /activate-trial     → Activate free trial
└── GET    /check-trial        → Check trial eligibility

CHALLENGE MODELS (/api/challenge-models)
├── GET    /                   → Get all active models
├── GET    /:id                → Get model by ID
├── GET    /by-name/:name      → Get model by name
├── GET    /:id/sizes          → Get account sizes
└── GET    /compare            → Compare all models

TRADES (/api/trades)
├── GET    /                   → Get trades (by challenge_id)
├── POST   /open               → Open new trade
├── POST   /:id/close          → Close trade
├── GET    /:id                → Get trade details
└── GET    /open/pnl           → Get open positions P&L

MARKET DATA (/api/market)
├── GET    /price/:symbol      → Get current price
├── GET    /prices             → Get all prices (by category)
├── GET    /history/:symbol    → Get price history
├── GET    /signal/:symbol     → Get AI signal
├── GET    /signals            → Get multiple signals
└── GET    /status             → Get market status

PAYMENTS (/api/payments)
├── GET    /plans              → Get available plans
├── POST   /checkout           → Create checkout session
├── POST   /process            → Process payment
└── GET    /history            → Get payment history

SUBSCRIPTIONS (/api/subscriptions)
├── GET    /plans              → Get subscription plans
├── POST   /trial/start        → Start trial (PayPal auth)
├── POST   /trial/confirm      → Confirm trial
├── POST   /trial/cancel       → Cancel trial
└── GET    /trial/status       → Get trial status

PAYOUTS (/api/payouts)
├── GET    /                   → Get payout history
├── GET    /balance            → Get withdrawable balance
├── POST   /request            → Request withdrawal
├── GET    /admin/pending      → [Admin] Get pending payouts
├── PUT    /admin/:id/approve  → [Admin] Approve payout
├── PUT    /admin/:id/process  → [Admin] Process payout
└── PUT    /admin/:id/reject   → [Admin] Reject payout

REFERRALS (/api/referrals)
├── POST   /generate-code      → Generate referral code
├── GET    /my-code            → Get user's referral code
├── GET    /stats              → Get referral statistics
├── GET    /history            → Get referral history
├── POST   /apply              → Apply referral code
└── GET    /validate/:code     → Validate code

POINTS (/api/points)
├── GET    /balance            → Get points balance
├── GET    /history            → Get points history
├── GET    /activities         → Get earning activities
├── GET    /leaderboard        → Get points leaderboard
├── POST   /award              → Award points
└── POST   /daily-login        → Claim daily login

TICKETS (/api/tickets)
├── POST   /                   → Create ticket
├── GET    /                   → Get user tickets
├── GET    /:id                → Get ticket with messages
├── POST   /:id/messages       → Add message
├── PUT    /:id/close          → Close ticket
├── PUT    /:id/reopen         → Reopen ticket
├── PUT    /:id/assign         → [Admin] Assign ticket
├── PUT    /:id/status         → [Admin] Update status
└── PUT    /:id/priority       → [Admin] Update priority

RESOURCES (/api/resources)
├── GET    /                   → Get all resources
├── GET    /:id                → Get resource
├── POST   /:id/download       → Record download
├── GET    /calendar           → Get economic events
├── GET    /calendar/week      → Get week events
├── POST   /                   → [Admin] Create resource
├── PUT    /:id                → [Admin] Update resource
└── DELETE /:id                → [Admin] Delete resource

OFFERS (/api/offers)
├── GET    /active             → Get active offers
├── GET    /featured           → Get featured offers
├── GET    /validate/:code     → Validate offer code
├── POST   /apply              → Apply offer
├── GET    /my-offers          → Get user's offers
├── GET    /                   → [Admin] Get all offers
├── POST   /                   → [Admin] Create offer
├── PUT    /:id                → [Admin] Update offer
└── DELETE /:id                → [Admin] Delete offer

LEADERBOARD (/api/leaderboard)
├── GET    /                   → Get leaderboard
├── GET    /stats              → Get statistics
└── GET    /user/:id           → Get user rank

ADMIN (/api/admin)
├── GET    /users              → Get all users
├── GET    /users/:id          → Get user details
├── GET    /challenges         → Get all challenges
├── PUT    /challenges/:id/status → Update challenge status
├── GET    /trades             → Get all trades
└── GET    /payments           → Get all payments

SUPERADMIN (/api/admin/superadmin)
├── GET    /settings           → Get system settings
├── PUT    /settings           → Update settings
├── PUT    /settings/paypal    → Update PayPal config
├── PUT    /settings/gemini    → Update Gemini API
├── GET    /admins             → Get admin list
├── POST   /admins/:id/promote → Promote to admin
├── POST   /admins/:id/demote  → Demote admin
└── GET    /stats              → Get system stats
```

---

## 8. Frontend Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND ARCHITECTURE                                       │
│                          React + Vite + Tailwind                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

src/
├── main.jsx                    # App entry point with providers
├── App.jsx                     # Router configuration
│
├── context/                    # Global state management
│   ├── AuthContext.jsx         # Authentication state
│   ├── ChallengeContext.jsx    # Challenge state
│   ├── ThemeContext.jsx        # Dark/Light theme
│   ├── LanguageContext.jsx     # i18n translations
│   └── SocketContext.jsx       # WebSocket connection
│
├── components/                 # Reusable components
│   ├── DashboardLayout.jsx     # Dashboard wrapper with nav
│   ├── Navbar.jsx              # Top navigation
│   ├── Sidebar.jsx             # Side navigation
│   ├── ProtectedRoute.jsx      # Route guards
│   ├── GuestRoute.jsx          # Guest-only routes
│   ├── AuthRoute.jsx           # Auth-only routes
│   │
│   ├── trading/                # Trading components
│   │   ├── PriceChart.jsx      # OHLCV chart
│   │   ├── TradeForm.jsx       # Order entry
│   │   ├── SignalsPanel.jsx    # AI signals
│   │   ├── OpenPositions.jsx   # Active trades
│   │   └── PhaseProgress.jsx   # Challenge progress
│   │
│   └── ui/                     # UI primitives
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       └── ...
│
├── pages/                      # Page components
│   ├── public/                 # Public pages
│   │   ├── Landing.jsx
│   │   ├── Pricing.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   │
│   ├── dashboard/              # Dashboard pages
│   │   ├── AccountsPage.jsx
│   │   ├── PlansPage.jsx
│   │   ├── ReferralPage.jsx
│   │   ├── PointsActivitiesPage.jsx
│   │   └── ...
│   │
│   └── admin/                  # Admin pages
│       ├── AdminPanel.jsx
│       └── SuperAdmin.jsx
│
├── services/                   # API services
│   └── api.js                  # Axios instance + endpoints
│
├── utils/                      # Utilities
│   ├── errorHandler.js
│   └── formatters.js
│
└── i18n/                       # Translations
    ├── fr.json
    ├── en.json
    └── ar.json
```

---

## 9. State Management

### Context Provider Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          STATE MANAGEMENT                                            │
│                          React Context API                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

<BrowserRouter>
  │
  └─► <ThemeProvider>                    # Theme state
        │   └─ isDark, toggleTheme()
        │
        └─► <LanguageProvider>           # i18n state
              │   └─ language, setLanguage(), t()
              │
              └─► <AuthProvider>         # Auth state
                    │   └─ user, isAuthenticated
                    │   └─ login(), logout(), register()
                    │
                    └─► <ChallengeProvider>  # Challenge state
                          │   └─ challenge, hasActiveChallenge
                          │   └─ isFunded, currentPhase
                          │   └─ refetch()
                          │
                          └─► <SocketProvider>  # WebSocket
                                │   └─ Real-time prices
                                │   └─ Live P&L updates
                                │
                                └─► <App />


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT DATA FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │   Login     │ ───► │ AuthContext │ ───► │  Challenge  │
  │   Page      │      │   updates   │      │   Context   │
  └─────────────┘      │   user      │      │   fetches   │
                       └─────────────┘      │   active    │
                                            │   challenge │
                                            └──────┬──────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
           ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
           │   Dashboard     │          │   Trading       │          │   Payouts       │
           │   shows phase   │          │   uses balance  │          │   checks if     │
           │   & progress    │          │   & limits      │          │   funded        │
           └─────────────────┘          └─────────────────┘          └─────────────────┘
```

---

## Summary

This document provides a complete map of the current TradeSense user journey, including:

- **User Flow**: From visitor to funded trader
- **Role System**: Guest → User → Admin → SuperAdmin
- **Routes**: 40+ routes across public, auth, dashboard, and admin areas
- **Challenge System**: Trial → Evaluation → Verification → Funded
- **Payment System**: CMI, PayPal, Crypto support
- **Database**: 15+ tables with full relationships
- **API**: 80+ endpoints across 12 modules
- **Frontend**: React + Context-based state management

---

*Document generated: December 2024*
*Version: 1.0*
