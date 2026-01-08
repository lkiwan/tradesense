# TradeSense Admin Dashboard - Upgrade Tasks

> Complete task list for upgrading the admin dashboard with professional, detailed functionality.
> SuperAdmin will have complete control over every aspect of the platform.

--- 

## Table of Contents

1. [User Management](#1-user-management)
2. [Challenge Management](#2-challenge-management)
3. [Financial Management](#3-financial-management)
4. [Platform Configuration](#4-platform-configuration)
5. [Security & Monitoring](#5-security--monitoring)
6. [UI/UX Improvements](#6-uiux-improvements)

---

## 1. User Management

### 1.1 Email Verification (Admin/SuperAdmin)
**Status:** Backend exists, Frontend needs UI

| Task | Type | File | Priority |
|------|------|------|----------|
| Add "Verify Email" button to user detail page | Frontend | `UserDetailPage.jsx` | HIGH |
| Add verifyEmail function to admin API | Frontend | `adminApi.js` | HIGH |
| Create endpoint for admin-level email verification | Backend | `admin_users.py` | HIGH |

**Endpoint:** `POST /api/admin/users/<id>/verify-email`

**Functionality:**
- One-click email verification
- Updates `email_verified = True` and `email_verified_at = now()`
- Clears any pending verification tokens
- Audit logs the action

---

### 1.2 2FA Reset (Admin/SuperAdmin)
**Status:** Backend exists at superadmin level

| Task | Type | File | Priority |
|------|------|------|----------|
| Add "Reset 2FA" button to user detail page | Frontend | `UserDetailPage.jsx` | HIGH |
| Create confirmation modal for 2FA reset | Frontend | `Reset2FAModal.jsx` | MEDIUM |
| Add endpoint for admin-level 2FA reset | Backend | `admin_users.py` | HIGH |

**Endpoint:** `POST /api/admin/users/<id>/reset-2fa`

**Functionality:**
- Clears all 2FA settings for user
- Deletes TwoFactorAuth record
- Sends notification email to user
- Audit logs the action

---

### 1.3 Complete User Editing (SuperAdmin)
**Status:** Partial implementation

| Task | Type | File | Priority |
|------|------|------|----------|
| Expand UserEditModal with all fields | Frontend | `UserEditModal.jsx` | HIGH |
| Add role change capability | Backend | `admin_users.py` | HIGH |
| Add avatar upload/change | Frontend | `UserEditModal.jsx` | MEDIUM |
| Add referral code management | Backend | `admin_users.py` | MEDIUM |

**Editable Fields:**
- `username` - Validate uniqueness
- `email` - Validate uniqueness, optionally auto-verify
- `role` - user, admin, superadmin (SuperAdmin only)
- `email_verified` - Toggle
- `preferred_language` - fr, en, ar
- `avatar` - URL or upload
- `referral_code` - Custom code
- `referred_by_code` - Link to referrer

---

### 1.4 User Status Management
**Status:** Implemented but needs UI polish

| Task | Type | File | Priority |
|------|------|------|----------|
| Create unified status dashboard widget | Frontend | `UserStatusWidget.jsx` | MEDIUM |
| Add status history timeline | Frontend | `UserDetailPage.jsx` | LOW |
| Add quick status change dropdown | Frontend | `UserDetailPage.jsx` | MEDIUM |

**Status Types:**
- Active (default)
- Banned (permanent or temporary)
- Frozen (temporary, hours-based)
- Trading Blocked (can login but not trade)

---

### 1.5 Bulk User Operations
**Status:** Backend exists, Frontend incomplete

| Task | Type | File | Priority |
|------|------|------|----------|
| Implement checkbox selection | Frontend | `UsersListPage.jsx` | HIGH |
| Create bulk action dropdown | Frontend | `UsersListPage.jsx` | HIGH |
| Wire up bulk ban/unban | Frontend | `UsersListPage.jsx` | HIGH |
| Wire up bulk freeze/unfreeze | Frontend | `UsersListPage.jsx` | MEDIUM |
| Wire up bulk notification | Frontend | `UsersListPage.jsx` | MEDIUM |
| Add bulk export selected | Frontend | `UsersListPage.jsx` | MEDIUM |

**Bulk Actions Available:**
- Ban selected users (with reason)
- Unban selected users
- Freeze selected users (with hours + reason)
- Unfreeze selected users
- Block trading for selected
- Unblock trading for selected
- Send notification to selected
- Export selected to CSV/JSON

---

## 2. Challenge Management

### 2.1 Grant Challenge Access (Admin/SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create grant challenge endpoint | Backend | `admin_challenges.py` | HIGH |
| Create GrantChallengeModal | Frontend | `GrantChallengeModal.jsx` | HIGH |
| Add "Grant Challenge" button to user detail | Frontend | `UserDetailPage.jsx` | HIGH |
| Fetch challenge models for dropdown | Frontend | `adminApi.js` | HIGH |

**Endpoint:** `POST /api/admin/challenges/grant`

**Request Body:**
```json
{
  "user_id": 123,
  "model_id": 1,
  "account_size_id": 2,
  "custom_profit_target": 0.10,
  "custom_max_drawdown": 0.05,
  "skip_trial": false,
  "start_funded": false,
  "notes": "VIP customer - free challenge"
}
```

**Functionality:**
- Creates new UserChallenge for user
- Optionally skips trial phase
- Optionally starts as funded account
- Custom profit/drawdown targets
- Admin notes for audit
- Creates associated trading account (if MT integration)

---

### 2.2 Challenge Edit Capabilities (SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create challenge edit endpoint | Backend | `admin_challenges.py` | HIGH |
| Create ChallengeEditModal | Frontend | `ChallengeEditModal.jsx` | HIGH |
| Add "Edit Challenge" button to detail page | Frontend | `ChallengeDetailPage.jsx` | HIGH |

**Endpoint:** `PUT /api/admin/challenges/<id>/edit`

**Editable Fields:**
```json
{
  "current_balance": 105000.00,
  "initial_balance": 100000.00,
  "status": "active",
  "phase": "verification",
  "current_phase_number": 2,
  "profit_target": 0.10,
  "trading_days": 5,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": null,
  "is_funded": false,
  "profit_split": 80.00
}
```

**Validation Rules:**
- current_balance >= 0
- status in ['active', 'passed', 'failed', 'funded', 'expired']
- phase in ['trial', 'evaluation', 'verification', 'funded']
- profit_target between 0.01 and 1.00
- trading_days >= 0
- profit_split between 0 and 100

---

### 2.3 Balance Adjustment
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create balance adjustment endpoint | Backend | `admin_challenges.py` | HIGH |
| Create BalanceAdjustModal | Frontend | `BalanceAdjustModal.jsx` | HIGH |
| Add adjustment history to challenge detail | Frontend | `ChallengeDetailPage.jsx` | MEDIUM |

**Endpoint:** `POST /api/admin/challenges/<id>/adjust-balance`

**Request Body:**
```json
{
  "amount": 5000.00,
  "type": "credit",
  "reason": "Compensation for platform error"
}
```

**Types:** credit, debit, reset

**Creates audit record with:**
- Previous balance
- New balance
- Amount
- Reason
- Admin who made adjustment

---

### 2.4 Trading Account Management
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create trading account management endpoint | Backend | `admin_challenges.py` | MEDIUM |
| Create TradingAccountModal | Frontend | `TradingAccountModal.jsx` | MEDIUM |
| Display trading account info on challenge detail | Frontend | `ChallengeDetailPage.jsx` | MEDIUM |

**Endpoint:** `PUT /api/admin/challenges/<id>/trading-account`

**Functionality:**
- View MT4/MT5 login credentials
- Reset trading password
- Change trading server
- Force sync with MT server
- View connection status

---

### 2.5 Trade Management
**Status:** Partial (view only)

| Task | Type | File | Priority |
|------|------|------|----------|
| Add manual trade entry endpoint | Backend | `admin_challenges.py` | LOW |
| Add trade deletion endpoint | Backend | `admin_challenges.py` | MEDIUM |
| Create ManualTradeModal | Frontend | `ManualTradeModal.jsx` | LOW |
| Add delete trade button with confirmation | Frontend | `ChallengeDetailPage.jsx` | MEDIUM |

**Functionality:**
- View all trades for challenge
- Delete suspicious/erroneous trades
- Add manual trade entries (for corrections)
- Recalculate metrics after changes

---

## 3. Financial Management

### 3.1 Manual Payment Creation (SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create manual payment endpoint | Backend | `admin_financial.py` | MEDIUM |
| Create ManualPaymentModal | Frontend | `ManualPaymentModal.jsx` | MEDIUM |
| Add "Create Payment" button to financial page | Frontend | `FinancialOverviewPage.jsx` | MEDIUM |

**Endpoint:** `POST /api/admin/payments/create`

**Request Body:**
```json
{
  "user_id": 123,
  "amount": 499.00,
  "currency": "USD",
  "payment_method": "manual",
  "status": "completed",
  "reference": "BANK-TRF-12345",
  "challenge_id": 456,
  "notes": "Wire transfer received"
}
```

---

### 3.2 Payment Editing (SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create payment edit endpoint | Backend | `admin_financial.py` | LOW |
| Add edit button to payments list | Frontend | `PaymentsListPage.jsx` | LOW |

**Editable Fields:**
- status (pending, completed, failed, refunded)
- reference
- notes

---

### 3.3 Refund Processing
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create refund endpoint | Backend | `admin_financial.py` | MEDIUM |
| Create RefundModal | Frontend | `RefundModal.jsx` | MEDIUM |
| Add refund button to payment detail | Frontend | `PaymentsListPage.jsx` | MEDIUM |

**Endpoint:** `POST /api/admin/payments/<id>/refund`

**Functionality:**
- Full or partial refund
- Links to original payment
- Updates payment status
- Optionally revokes associated challenge
- Sends notification to user

---

### 3.4 Payout Bulk Actions
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Add bulk selection to payouts | Frontend | `PayoutsManagementPage.jsx` | MEDIUM |
| Add bulk approve button | Frontend | `PayoutsManagementPage.jsx` | MEDIUM |
| Add bulk reject button | Frontend | `PayoutsManagementPage.jsx` | MEDIUM |
| Create bulk payout endpoint | Backend | `admin_financial.py` | MEDIUM |

---

## 4. Platform Configuration

### 4.1 System Settings UI (SuperAdmin)
**Status:** Backend exists, Frontend incomplete

| Task | Type | File | Priority |
|------|------|------|----------|
| Complete SystemConfigPage | Frontend | `SystemConfigPage.jsx` | HIGH |
| Add Stripe configuration section | Frontend | `SystemConfigPage.jsx` | HIGH |
| Add email provider section | Frontend | `SystemConfigPage.jsx` | MEDIUM |
| Add SMS provider section | Frontend | `SystemConfigPage.jsx` | LOW |

**Configurable Items:**
- **Payment Gateways:** Stripe, PayPal, Crypto
- **Email:** Provider (SendGrid, SES, SMTP), API keys
- **SMS:** Provider (Twilio), API keys
- **AI:** Gemini API key
- **Monitoring:** Sentry DSN
- **Analytics:** Google Analytics ID

---

### 4.2 Trading Configuration UI (SuperAdmin)
**Status:** Backend exists, Frontend incomplete

| Task | Type | File | Priority |
|------|------|------|----------|
| Complete TradingConfigPage | Frontend | `TradingConfigPage.jsx` | HIGH |
| Add trading hours editor | Frontend | `TradingConfigPage.jsx` | MEDIUM |
| Add spread configuration | Frontend | `TradingConfigPage.jsx` | MEDIUM |
| Add risk rules editor | Frontend | `TradingConfigPage.jsx` | MEDIUM |

**Configurable Items:**
- **Trading Hours:** Per session (Asia, London, NY)
- **Spreads:** Per instrument, dynamic multiplier
- **Risk Rules:** Max daily loss, max total drawdown, profit targets
- **Restrictions:** News trading, hedging, scalping, EA usage

---

### 4.3 Challenge Model Management (SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create ChallengeModelsPage | Frontend | `ChallengeModelsPage.jsx` | HIGH |
| Create challenge model CRUD endpoints | Backend | `admin_challenges.py` | HIGH |
| Create model editor UI | Frontend | `ChallengeModelEditor.jsx` | HIGH |

**CRUD Operations:**
- List all challenge models
- Create new model with phases
- Edit existing model
- Duplicate model
- Deactivate model (soft delete)

**Model Fields:**
- Name, description
- Account sizes with pricing
- Phase requirements (profit target, max DD, min days)
- Profit split percentages
- Trial settings

---

### 4.4 Pricing Management (SuperAdmin)
**Status:** NOT IMPLEMENTED

| Task | Type | File | Priority |
|------|------|------|----------|
| Create PricingManagementPage | Frontend | `PricingManagementPage.jsx` | MEDIUM |
| Create discount code CRUD | Backend | `admin_offers.py` | MEDIUM |
| Create promotional offers UI | Frontend | `PricingManagementPage.jsx` | MEDIUM |

---

## 5. Security & Monitoring

### 5.1 Enhanced Audit Logs
**Status:** Implemented, needs polish

| Task | Type | File | Priority |
|------|------|------|----------|
| Add real-time log streaming | Frontend | `AuditLogsPage.jsx` | LOW |
| Add PDF export | Frontend | `AuditLogsPage.jsx` | MEDIUM |
| Add retention settings UI | Frontend | `AuditLogsPage.jsx` | LOW |

---

### 5.2 Login Monitoring Dashboard
**Status:** Backend exists, Frontend needs completion

| Task | Type | File | Priority |
|------|------|------|----------|
| Complete LoginMonitoringPage | Frontend | `LoginMonitoringPage.jsx` | MEDIUM |
| Add failed login heatmap | Frontend | `LoginMonitoringPage.jsx` | LOW |
| Add geographic map | Frontend | `LoginMonitoringPage.jsx` | LOW |

---

### 5.3 IP Block Management
**Status:** Implemented

| Task | Type | File | Priority |
|------|------|------|----------|
| Complete BlockedIPsPage | Frontend | `BlockedIPsPage.jsx` | MEDIUM |
| Add IP whitelist feature | Backend | `superadmin_security.py` | LOW |

---

## 6. UI/UX Improvements

### 6.1 Complete Placeholder Pages
**Status:** Pages exist as stubs

| Page | Priority | Notes |
|------|----------|-------|
| BlogManagementPage | LOW | Content management |
| WebinarManagementPage | LOW | Webinar CRUD |
| EventsManagementPage | LOW | Promotional events |
| AnalyticsDashboardPage | MEDIUM | Advanced charts |
| KYCReviewPage | HIGH | Identity verification |

---

### 6.2 General UI Improvements

| Task | Priority |
|------|----------|
| Add loading skeletons to all pages | MEDIUM |
| Add toast notifications for all actions | HIGH |
| Add keyboard shortcuts | LOW |
| Improve mobile responsiveness | MEDIUM |
| Add dark mode toggle | LOW |
| Add export functionality to all tables | MEDIUM |

---

## Implementation Priority Order

### Phase 1 (Immediate - This Sprint)
1. Email verification button + endpoint
2. 2FA reset button + endpoint
3. Grant challenge endpoint + modal
4. Challenge edit endpoint + modal
5. Update UserDetailPage with all new buttons

### Phase 2 (Next Sprint)
6. Balance adjustment feature
7. Bulk user operations (frontend)
8. Complete system config page
9. Complete trading config page
10. Challenge model management

### Phase 3 (Future)
11. Manual payment creation
12. Refund processing
13. Enhanced audit logs
14. Complete all placeholder pages
15. Advanced analytics

---

## Testing Checklist

- [ ] All new endpoints return proper error codes
- [ ] All actions are audit logged
- [ ] Permission checks work correctly
- [ ] SuperAdmin can access all features
- [ ] Admin restrictions work correctly
- [ ] UI shows loading states
- [ ] UI shows error states
- [ ] Confirmation modals work
- [ ] Toast notifications appear
- [ ] Responsive on mobile

---

## Notes

- All SuperAdmin actions should be double-confirmed with password
- Critical actions (delete, reset) need confirmation modal
- All changes must be audit logged with before/after values
- Consider rate limiting on sensitive endpoints
- Add email notifications for critical admin actions
