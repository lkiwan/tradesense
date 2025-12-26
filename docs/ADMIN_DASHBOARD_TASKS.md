# Admin & SuperAdmin Dashboard - Implementation Tasks

## Overview
This document outlines all tasks required to build a comprehensive Admin and SuperAdmin dashboard for TradeSense with statistics, graphs, user management, and full platform control.

**Chart Library**: ApexCharts
**Roles**: admin, superadmin (superadmin has all admin permissions + extras)

---

## Table of Contents
1. [Phase 1: Foundation](#phase-1-foundation)
2. [Phase 2: Admin Dashboard Core](#phase-2-admin-dashboard-core)
3. [Phase 3: Challenge & Financial Management](#phase-3-challenge--financial-management)
4. [Phase 4: Support & Activity Monitoring](#phase-4-support--activity-monitoring)
5. [Phase 5: SuperAdmin Dashboard](#phase-5-superadmin-dashboard)
6. [Phase 6: Admin Management & Security](#phase-6-admin-management--security)
7. [Phase 7: Advanced User Control](#phase-7-advanced-user-control)
8. [Phase 8: Analytics & Notifications](#phase-8-analytics--notifications)
9. [Phase 9: Polish & Integration](#phase-9-polish--integration)

---

## Phase 1: Foundation

### Backend Tasks
- [ ] **1.1** Create `backend/models/user_status.py` - UserStatus model
  - Fields: is_banned, ban_reason, banned_at, banned_by, ban_expires_at
  - Fields: is_frozen, frozen_until, freeze_reason
  - Fields: can_trade, trade_blocked_reason, trade_blocked_at
  - Fields: last_activity_at, total_logins

- [ ] **1.2** Create `backend/models/platform_config.py` - PlatformConfig model
  - Fields: maintenance_mode, maintenance_message
  - Fields: trading_enabled, trading_disabled_message
  - Fields: default_spread_pips, spread_multiplier
  - Fields: updated_at, updated_by

- [ ] **1.3** Update `backend/models/user.py` - Add UserStatus relationship
  - Add: status_record relationship
  - Add: is_banned, is_frozen, can_trade properties

- [ ] **1.4** Create database migration for new models

### Frontend Tasks
- [ ] **1.5** Install ApexCharts: `npm install apexcharts react-apexcharts`

- [ ] **1.6** Create `frontend/src/components/admin/common/AdminLayout.jsx`
  - Admin-specific layout wrapper
  - Props: isSuperAdmin (boolean)

- [ ] **1.7** Create `frontend/src/components/admin/common/AdminSidebar.jsx`
  - Navigation sections: Dashboard, Users, Challenges, Financial, Support
  - SuperAdmin sections: System, Admins, Analytics, Security, Notifications
  - Active route highlighting
  - Collapsible sections

- [ ] **1.8** Create `frontend/src/components/admin/common/AdminHeader.jsx`
  - Breadcrumb navigation
  - Quick actions dropdown
  - User profile menu

- [ ] **1.9** Create `frontend/src/components/admin/stats/StatCard.jsx`
  - Props: title, value, icon, trend, trendValue, color
  - Trend indicator (up/down arrow with color)

- [ ] **1.10** Create `frontend/src/components/admin/stats/StatCardGrid.jsx`
  - Responsive grid of StatCards
  - Props: stats (array of stat objects)

- [ ] **1.11** Create `frontend/src/components/admin/tables/DataTable.jsx`
  - Sortable columns
  - Pagination
  - Row selection (checkboxes)
  - Search input
  - Loading skeleton
  - Empty state

- [ ] **1.12** Create `frontend/src/components/admin/filters/DateRangeFilter.jsx`
  - Preset ranges: Today, Yesterday, Last 7 days, Last 30 days, Custom
  - Date picker for custom range

- [ ] **1.13** Create `frontend/src/components/admin/filters/AdvancedFilters.jsx`
  - Expandable filter panel
  - Multiple filter inputs
  - Apply/Reset buttons

- [ ] **1.14** Create `frontend/src/components/admin/modals/ConfirmationModal.jsx`
  - Props: title, message, confirmText, cancelText, onConfirm, variant (danger/warning/info)

- [ ] **1.15** Create `frontend/src/services/adminApi.js`
  - Base admin API service
  - Error handling
  - Request interceptors

- [ ] **1.16** Create `frontend/src/services/superAdminApi.js`
  - SuperAdmin-specific API service

- [ ] **1.17** Update `frontend/src/App.jsx` - Add admin/superadmin routes
  - /admin/* routes with AdminLayout
  - /superadmin/* routes with AdminLayout (isSuperAdmin=true)

---

## Phase 2: Admin Dashboard Core

### Backend Tasks
- [ ] **2.1** Create `backend/routes/admin_users.py`
  - GET /api/admin/users - List users with filters (search, status, role, kyc_status, has_challenge, date range, sort)
  - GET /api/admin/users/<id> - User details with challenges, payments, activity
  - PUT /api/admin/users/<id> - Update user details
  - POST /api/admin/users/<id>/ban - Ban user (reason, duration optional)
  - POST /api/admin/users/<id>/unban - Unban user
  - GET /api/admin/users/<id>/activity - User activity log
  - GET /api/admin/users/<id>/sessions - User active sessions
  - POST /api/admin/users/<id>/revoke-sessions - Revoke all sessions

- [ ] **2.2** Update `backend/routes/__init__.py` - Register new blueprints

- [ ] **2.3** Create `backend/services/admin_stats_service.py`
  - get_dashboard_stats() - Total users, new users, revenue, challenges stats
  - get_user_growth_data(period) - User registration trend
  - get_revenue_data(period) - Revenue trend

### Frontend Tasks
- [ ] **2.4** Create `frontend/src/pages/admin/AdminDashboard.jsx`
  - Stats cards: Total Users, New Users (30d), Total Revenue, Active Challenges
  - Charts: User Growth, Revenue Trend, Challenge Status Distribution
  - Recent Activity widget
  - Quick Actions widget

- [ ] **2.5** Create `frontend/src/components/admin/charts/RevenueChart.jsx`
  - ApexCharts area/line chart
  - Props: data, period
  - Tooltip with formatted currency

- [ ] **2.6** Create `frontend/src/components/admin/charts/UsersChart.jsx`
  - ApexCharts line chart for user growth
  - Props: data, period

- [ ] **2.7** Create `frontend/src/components/admin/charts/ChallengesChart.jsx`
  - ApexCharts donut/pie chart
  - Challenge status distribution (active, passed, failed)

- [ ] **2.8** Create `frontend/src/pages/admin/users/UsersListPage.jsx`
  - DataTable with user list
  - Advanced filters: search, role, KYC status, has challenge, date range
  - Bulk selection for actions
  - Row actions: View, Edit, Ban/Unban

- [ ] **2.9** Create `frontend/src/pages/admin/users/UserDetailPage.jsx`
  - User info card (avatar, name, email, role, status)
  - Tabs: Overview, Challenges, Trades, Payments, Activity, Sessions
  - Action buttons: Edit, Ban/Unban, Reset Password (superadmin)

- [ ] **2.10** Create `frontend/src/components/admin/tables/UsersTable.jsx`
  - Columns: Avatar, Username, Email, Role, KYC Status, Challenges, Status, Actions
  - Status badges with colors
  - Quick action buttons

- [ ] **2.11** Create `frontend/src/components/admin/modals/UserEditModal.jsx`
  - Edit: username, email, role, preferred_language
  - Validation with error messages

- [ ] **2.12** Create `frontend/src/components/admin/modals/UserBanModal.jsx`
  - Ban reason input (required)
  - Duration options: Permanent, 24h, 7 days, 30 days, Custom
  - Confirmation warning

- [ ] **2.13** Create `frontend/src/hooks/admin/useUsers.js`
  - Fetch users with pagination and filters
  - Mutation functions: updateUser, banUser, unbanUser
  - Loading and error states

- [ ] **2.14** Create `frontend/src/hooks/admin/useAdminStats.js`
  - Fetch dashboard statistics
  - Refresh interval option

---

## Phase 3: Challenge & Financial Management

### Backend Tasks
- [ ] **3.1** Create `backend/routes/admin_challenges.py`
  - GET /api/admin/challenges - List challenges with filters (status, phase, model, user, balance range)
  - GET /api/admin/challenges/<id> - Challenge details with trades
  - PUT /api/admin/challenges/<id>/status - Update status (pass/fail/reset)
  - POST /api/admin/challenges/<id>/reset - Reset challenge
  - GET /api/admin/challenges/<id>/trades - Get all trades
  - DELETE /api/admin/challenges/<id>/trades/<trade_id> - Delete trade (with audit)

- [ ] **3.2** Create `backend/routes/admin_financial.py`
  - GET /api/admin/financial/overview - Revenue overview (total, monthly, by plan, by method)
  - GET /api/admin/financial/payments - List payments with filters
  - GET /api/admin/financial/revenue-by-plan - Revenue breakdown by plan
  - GET /api/admin/financial/revenue-trends - Daily/weekly/monthly trends
  - GET /api/admin/payouts - List payouts
  - PUT /api/admin/payouts/<id>/approve - Approve payout
  - PUT /api/admin/payouts/<id>/process - Mark as paid
  - PUT /api/admin/payouts/<id>/reject - Reject payout with reason

### Frontend Tasks
- [ ] **3.3** Create `frontend/src/pages/admin/challenges/ChallengesListPage.jsx`
  - DataTable with challenge list
  - Filters: status, phase, model type, user search, balance range
  - Status badges with colors
  - Row actions: View, Pass, Fail, Reset

- [ ] **3.4** Create `frontend/src/pages/admin/challenges/ChallengeDetailPage.jsx`
  - Challenge info card (model, user, balance, phase, status)
  - Progress bars: profit target, drawdown limits
  - Trades table with P&L
  - Equity curve chart
  - Action buttons: Pass, Fail, Reset

- [ ] **3.5** Create `frontend/src/components/admin/tables/ChallengesTable.jsx`
  - Columns: ID, User, Model, Phase, Balance, Profit%, Status, Actions

- [ ] **3.6** Create `frontend/src/components/admin/modals/ChallengeStatusModal.jsx`
  - Status selection: Pass, Fail
  - Reason input for fail
  - Confirmation

- [ ] **3.7** Create `frontend/src/pages/admin/financial/FinancialOverviewPage.jsx`
  - Stats: Total Revenue, Monthly Revenue, Avg Order Value, Pending Payouts
  - Revenue chart (line/area)
  - Revenue by plan (bar chart)
  - Revenue by payment method (pie chart)
  - Quick filters: Today, 7d, 30d, 90d, Year, Custom

- [ ] **3.8** Create `frontend/src/pages/admin/financial/PaymentsListPage.jsx`
  - DataTable with payments
  - Filters: status, method, amount range, date range
  - Export to CSV

- [ ] **3.9** Create `frontend/src/pages/admin/financial/PayoutsManagementPage.jsx`
  - Tabs: Pending, Approved, Paid, Rejected
  - DataTable with payouts
  - Quick approve/reject buttons
  - Bulk actions

- [ ] **3.10** Create `frontend/src/components/admin/charts/PayoutsChart.jsx`
  - Payout trends over time
  - Stacked by status

- [ ] **3.11** Create `frontend/src/components/admin/modals/PayoutApproveModal.jsx`
  - Payout details display
  - Approve/Reject buttons
  - Rejection reason input

---

## Phase 4: Support & Activity Monitoring

### Backend Tasks
- [ ] **4.1** Create `backend/routes/admin_tickets.py`
  - GET /api/admin/tickets - List tickets with filters (status, priority, category, assigned_to)
  - GET /api/admin/tickets/<id> - Ticket with messages
  - PUT /api/admin/tickets/<id>/assign - Assign to admin
  - PUT /api/admin/tickets/<id>/status - Update status
  - PUT /api/admin/tickets/<id>/priority - Update priority
  - POST /api/admin/tickets/<id>/respond - Admin response
  - GET /api/admin/tickets/stats - Ticket statistics (open, avg resolution time, by category)

- [ ] **4.2** Add user activity tracking
  - Track page views, actions in audit logs
  - GET /api/admin/users/<id>/activity endpoint

### Frontend Tasks
- [ ] **4.3** Create `frontend/src/pages/admin/support/TicketsListPage.jsx`
  - DataTable with tickets
  - Filters: status, priority, category, assigned admin
  - Priority badges with colors
  - Quick status update

- [ ] **4.4** Create `frontend/src/pages/admin/support/TicketDetailPage.jsx`
  - Ticket info (user, category, priority, status, created)
  - Message thread
  - Reply form
  - Assign dropdown
  - Status/Priority update

- [ ] **4.5** Create `frontend/src/components/admin/tables/TicketsTable.jsx`
  - Columns: ID, Subject, User, Category, Priority, Status, Created, Assigned, Actions

- [ ] **4.6** Create `frontend/src/pages/admin/users/UserActivityPage.jsx`
  - Activity timeline (logins, trades, payments, etc.)
  - Filters: action type, date range
  - Activity heatmap (optional)

- [ ] **4.7** Create `frontend/src/components/admin/widgets/RecentActivityWidget.jsx`
  - Real-time activity feed
  - Action icons
  - Relative timestamps
  - "View all" link

---

## Phase 5: SuperAdmin Dashboard

### Backend Tasks
- [ ] **5.1** Create `backend/routes/superadmin_system.py`
  - GET /api/superadmin/config - Get all system configuration
  - PUT /api/superadmin/config - Update system configuration
  - GET /api/superadmin/config/payment-gateways - Get payment settings
  - PUT /api/superadmin/config/payment-gateways - Update payment settings
  - GET /api/superadmin/config/api-keys - Get API keys (masked)
  - PUT /api/superadmin/config/api-keys - Update API keys
  - GET /api/superadmin/trading/spread-config - Get spread settings
  - PUT /api/superadmin/trading/spread-config - Update spread settings
  - GET /api/superadmin/trading/access-control - Get trade access settings
  - PUT /api/superadmin/trading/access-control - Update trade access
  - POST /api/superadmin/platform/maintenance - Toggle maintenance mode
  - POST /api/superadmin/platform/block-all-trades - Block all trading
  - POST /api/superadmin/platform/unblock-trades - Unblock trading

- [ ] **5.2** Create middleware to check maintenance mode and trading enabled

### Frontend Tasks
- [ ] **5.3** Create `frontend/src/pages/superadmin/SuperAdminDashboard.jsx`
  - All admin stats PLUS:
  - System health indicators
  - Platform status (maintenance, trading)
  - Admin activity summary
  - Security alerts

- [ ] **5.4** Create `frontend/src/pages/superadmin/system/SystemConfigPage.jsx`
  - API Keys section (Gemini, PayPal, SendGrid) - masked display
  - Payment Gateway settings
  - Email configuration
  - Save/Reset buttons

- [ ] **5.5** Create `frontend/src/pages/superadmin/system/TradingConfigPage.jsx`
  - Spread control settings
  - Default leverage
  - Trade access toggle (enable/disable all trading)
  - Per-symbol settings (optional)

- [ ] **5.6** Create `frontend/src/pages/superadmin/system/PlatformControlPage.jsx`
  - Maintenance mode toggle with message
  - Trading enabled toggle
  - Emergency shutdown button
  - System restart (if applicable)

- [ ] **5.7** Create `frontend/src/components/admin/forms/SettingsForm.jsx`
  - Dynamic form generation from config schema
  - Validation
  - Dirty state tracking

- [ ] **5.8** Create `frontend/src/components/admin/forms/SpreadControlForm.jsx`
  - Base spread input
  - Spread multiplier
  - Per-symbol overrides

---

## Phase 6: Admin Management & Security

### Backend Tasks
- [ ] **6.1** Create `backend/routes/superadmin_admins.py`
  - GET /api/superadmin/admins - List all admins
  - POST /api/superadmin/admins/<id>/promote - Promote user to admin
  - POST /api/superadmin/admins/<id>/demote - Demote admin to user
  - GET /api/superadmin/admins/<id>/activity - Admin's action log

- [ ] **6.2** Create `backend/routes/superadmin_security.py`
  - GET /api/superadmin/security/audit-logs - Extended audit logs
  - GET /api/superadmin/security/login-activity - Login monitoring
  - GET /api/superadmin/security/suspicious - Suspicious activity
  - GET /api/superadmin/security/events - Security events timeline
  - POST /api/superadmin/security/ip-block - Block IP
  - DELETE /api/superadmin/security/ip-block/<ip> - Unblock IP
  - GET /api/superadmin/security/blocked-ips - List blocked IPs

- [ ] **6.3** Create `backend/models/blocked_ip.py` - BlockedIP model
  - Fields: ip_address, reason, blocked_by, blocked_at, expires_at

- [ ] **6.4** Create IP blocking middleware

### Frontend Tasks
- [ ] **6.5** Create `frontend/src/pages/superadmin/admins/AdminManagementPage.jsx`
  - List of admins and superadmins
  - Promote/Demote buttons
  - User search to promote
  - Activity summary per admin

- [ ] **6.6** Create `frontend/src/pages/superadmin/admins/AdminActivityPage.jsx`
  - Select admin dropdown
  - Activity timeline
  - Action statistics

- [ ] **6.7** Create `frontend/src/pages/superadmin/security/AuditSecurityPage.jsx`
  - Full audit log table
  - Advanced filters: action type, user, date range, IP, status
  - Export functionality

- [ ] **6.8** Create `frontend/src/pages/superadmin/security/LoginMonitoringPage.jsx`
  - Recent logins table
  - Failed login attempts
  - Suspicious login alerts
  - Geographic distribution (optional)

- [ ] **6.9** Create `frontend/src/components/admin/tables/AuditLogsTable.jsx`
  - Columns: Timestamp, User, Action, Target, IP, Status, Details
  - Expandable rows for full details

---

## Phase 7: Advanced User Control

### Backend Tasks
- [ ] **7.1** Create `backend/routes/superadmin_users.py`
  - PUT /api/superadmin/users/<id>/password - Change user password
  - PUT /api/superadmin/users/<id>/username - Change username
  - POST /api/superadmin/users/<id>/challenge-access - Grant challenge access
  - DELETE /api/superadmin/users/<id>/challenge-access - Revoke challenge access
  - POST /api/superadmin/users/<id>/freeze - Freeze user (duration in hours)
  - POST /api/superadmin/users/<id>/unfreeze - Unfreeze user
  - POST /api/superadmin/users/<id>/trade-block - Block user from trading
  - POST /api/superadmin/users/<id>/trade-unblock - Unblock user trading
  - POST /api/superadmin/users/bulk - Bulk action (ban/unban/delete/freeze)
    - Body: { user_ids: [], action: string, params: {} }
  - DELETE /api/superadmin/users/<id> - Delete user (soft delete)

- [ ] **7.2** Add freeze check middleware - Block frozen users from actions

### Frontend Tasks
- [ ] **7.3** Create `frontend/src/pages/superadmin/users/BulkActionsPage.jsx`
  - User selection table with checkboxes
  - Action dropdown: Ban, Unban, Delete, Freeze, Block Trading
  - Confirmation modal with affected users list
  - Progress indicator for bulk operations

- [ ] **7.4** Create `frontend/src/pages/superadmin/users/UserControlPage.jsx`
  - User search
  - Quick actions: Change Password, Change Username, Freeze, Block Trading
  - Challenge access management

- [ ] **7.5** Create `frontend/src/components/admin/modals/BulkActionModal.jsx`
  - Action type display
  - List of affected users
  - Parameters input (duration for freeze, reason for ban)
  - Confirm/Cancel buttons

- [ ] **7.6** Create `frontend/src/components/admin/modals/FreezeUserModal.jsx`
  - Duration input (hours)
  - Reason input
  - Expiry preview

- [ ] **7.7** Create `frontend/src/components/admin/modals/PasswordChangeModal.jsx`
  - New password input
  - Confirm password input
  - Password strength indicator
  - Force password reset on login option

- [ ] **7.8** Update UserDetailPage.jsx - Add superadmin actions
  - Change Password button (superadmin only)
  - Change Username button (superadmin only)
  - Freeze button with duration
  - Block Trading button
  - Grant/Revoke Challenge buttons

---

## Phase 8: Analytics & Notifications

### Backend Tasks
- [ ] **8.1** Create `backend/routes/superadmin_analytics.py`
  - GET /api/superadmin/analytics/revenue - Deep revenue analytics
  - GET /api/superadmin/analytics/cohorts - User cohort analysis
  - GET /api/superadmin/analytics/retention - Retention metrics
  - GET /api/superadmin/analytics/ltv - Lifetime value analysis
  - GET /api/superadmin/analytics/funnel - Conversion funnel
  - GET /api/superadmin/analytics/churn - Churn analysis

- [ ] **8.2** Create `backend/models/admin_notification.py` - AdminNotification model
  - Fields: sent_by, target_type (user/all/filtered), target_user_ids
  - Fields: title, message, notification_type, channel
  - Fields: sent_count, read_count, created_at

- [ ] **8.3** Create `backend/routes/superadmin_notifications.py`
  - GET /api/superadmin/notifications/templates - Get templates
  - POST /api/superadmin/notifications/templates - Create template
  - POST /api/superadmin/notifications/send - Send to specific users
  - POST /api/superadmin/notifications/broadcast - Send to all users
  - GET /api/superadmin/notifications/history - Sent notifications history

- [ ] **8.4** Create `backend/services/notification_sender_service.py`
  - send_to_users(user_ids, notification)
  - broadcast_to_all(notification, filters)
  - Channels: in_app, push, email

### Frontend Tasks
- [ ] **8.5** Create `frontend/src/pages/superadmin/analytics/AdvancedAnalyticsPage.jsx`
  - Revenue deep dive with multiple charts
  - Filters: date range, plan type, payment method
  - Comparison (this period vs last period)
  - Export to CSV/PDF

- [ ] **8.6** Create `frontend/src/pages/superadmin/analytics/UserCohortsPage.jsx`
  - Cohort selection (by registration month)
  - Retention heatmap
  - Cohort comparison

- [ ] **8.7** Create `frontend/src/components/admin/charts/CohortChart.jsx`
  - ApexCharts heatmap for retention
  - Tooltips with percentages

- [ ] **8.8** Create `frontend/src/pages/superadmin/notifications/NotificationCenterPage.jsx`
  - Compose notification section
  - Target selection: All Users, Specific Users, Filtered Users
  - Channel selection: In-App, Push, Email, All
  - Send history table
  - Templates management

- [ ] **8.9** Create `frontend/src/components/admin/modals/NotificationModal.jsx`
  - Target type selection
  - User search (for specific users)
  - Filter builder (for filtered)
  - Message composer
  - Preview
  - Send button

- [ ] **8.10** Create `frontend/src/components/admin/forms/NotificationForm.jsx`
  - Title input
  - Message textarea (rich text optional)
  - Type selection (info, warning, success, urgent)
  - Channel checkboxes
  - Schedule option (optional)

---

## Phase 9: Polish & Integration

### Tasks
- [ ] **9.1** Add real-time updates via WebSocket
  - New user registrations
  - New payments
  - Payout requests
  - Support tickets
  - System alerts

- [ ] **9.2** Add export functionality
  - CSV export for all tables
  - PDF reports for analytics
  - Excel export option

- [ ] **9.3** Add loading states
  - Skeleton components for all pages
  - Loading spinners for actions
  - Optimistic updates where appropriate

- [ ] **9.4** Add comprehensive error handling
  - Error boundaries
  - Toast notifications
  - Retry mechanisms
  - Offline indicator

- [ ] **9.5** Performance optimization
  - Lazy loading for routes
  - Component memoization
  - API response caching
  - Pagination optimization

- [ ] **9.6** Add keyboard shortcuts
  - Navigation shortcuts
  - Quick actions
  - Search focus

- [ ] **9.7** Add comprehensive audit logging
  - Log all admin actions
  - Include before/after values
  - IP and user agent tracking

- [ ] **9.8** Integration testing
  - Test all admin endpoints
  - Test all superadmin endpoints
  - Test role-based access
  - Test bulk operations

- [ ] **9.9** Create admin user guide documentation

---

## Folder Structure Summary

```
frontend/src/
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── users/
│   │   │   ├── UsersListPage.jsx
│   │   │   ├── UserDetailPage.jsx
│   │   │   └── UserActivityPage.jsx
│   │   ├── challenges/
│   │   │   ├── ChallengesListPage.jsx
│   │   │   └── ChallengeDetailPage.jsx
│   │   ├── financial/
│   │   │   ├── FinancialOverviewPage.jsx
│   │   │   ├── PaymentsListPage.jsx
│   │   │   └── PayoutsManagementPage.jsx
│   │   └── support/
│   │       ├── TicketsListPage.jsx
│   │       └── TicketDetailPage.jsx
│   │
│   └── superadmin/
│       ├── SuperAdminDashboard.jsx
│       ├── system/
│       │   ├── SystemConfigPage.jsx
│       │   ├── TradingConfigPage.jsx
│       │   └── PlatformControlPage.jsx
│       ├── admins/
│       │   ├── AdminManagementPage.jsx
│       │   └── AdminActivityPage.jsx
│       ├── analytics/
│       │   ├── AdvancedAnalyticsPage.jsx
│       │   └── UserCohortsPage.jsx
│       ├── security/
│       │   ├── AuditSecurityPage.jsx
│       │   └── LoginMonitoringPage.jsx
│       ├── users/
│       │   ├── BulkActionsPage.jsx
│       │   └── UserControlPage.jsx
│       └── notifications/
│           └── NotificationCenterPage.jsx
│
├── components/admin/
│   ├── common/
│   │   ├── AdminLayout.jsx
│   │   ├── AdminSidebar.jsx
│   │   └── AdminHeader.jsx
│   ├── stats/
│   │   ├── StatCard.jsx
│   │   └── StatCardGrid.jsx
│   ├── charts/
│   │   ├── RevenueChart.jsx
│   │   ├── UsersChart.jsx
│   │   ├── ChallengesChart.jsx
│   │   ├── PayoutsChart.jsx
│   │   └── CohortChart.jsx
│   ├── tables/
│   │   ├── DataTable.jsx
│   │   ├── UsersTable.jsx
│   │   ├── ChallengesTable.jsx
│   │   ├── PaymentsTable.jsx
│   │   ├── PayoutsTable.jsx
│   │   ├── TicketsTable.jsx
│   │   └── AuditLogsTable.jsx
│   ├── filters/
│   │   ├── DateRangeFilter.jsx
│   │   ├── AdvancedFilters.jsx
│   │   └── SearchFilter.jsx
│   ├── modals/
│   │   ├── ConfirmationModal.jsx
│   │   ├── UserEditModal.jsx
│   │   ├── UserBanModal.jsx
│   │   ├── BulkActionModal.jsx
│   │   ├── ChallengeStatusModal.jsx
│   │   ├── PayoutApproveModal.jsx
│   │   ├── FreezeUserModal.jsx
│   │   ├── PasswordChangeModal.jsx
│   │   └── NotificationModal.jsx
│   ├── forms/
│   │   ├── SettingsForm.jsx
│   │   ├── SpreadControlForm.jsx
│   │   └── NotificationForm.jsx
│   └── widgets/
│       ├── RecentActivityWidget.jsx
│       ├── QuickActionsWidget.jsx
│       └── AlertsWidget.jsx
│
└── services/
    ├── adminApi.js
    └── superAdminApi.js

backend/
├── models/
│   ├── user_status.py (NEW)
│   ├── platform_config.py (NEW)
│   ├── admin_notification.py (NEW)
│   └── blocked_ip.py (NEW)
│
└── routes/
    ├── admin_users.py (NEW)
    ├── admin_challenges.py (NEW)
    ├── admin_financial.py (NEW)
    ├── admin_tickets.py (NEW)
    ├── superadmin_system.py (NEW)
    ├── superadmin_admins.py (NEW)
    ├── superadmin_users.py (NEW)
    ├── superadmin_analytics.py (NEW)
    ├── superadmin_notifications.py (NEW)
    └── superadmin_security.py (NEW)
```

---

## Priority Order

1. **Phase 1** - Foundation (required for all other phases)
2. **Phase 2** - Admin Dashboard Core (most used features)
3. **Phase 5** - SuperAdmin Dashboard (enables superadmin access)
4. **Phase 3** - Challenge & Financial (core business operations)
5. **Phase 6** - Admin Management & Security (security critical)
6. **Phase 4** - Support & Activity (customer support)
7. **Phase 7** - Advanced User Control (power features)
8. **Phase 8** - Analytics & Notifications (enhancements)
9. **Phase 9** - Polish & Integration (final touches)

---

## Notes

- All admin actions must be logged in AuditLog
- All destructive actions require confirmation modal
- SuperAdmin has access to all Admin features plus extras
- Use existing decorators: @admin_required, @superadmin_required
- Follow existing code patterns in the codebase
- Use ApexCharts for all graphs and statistics
