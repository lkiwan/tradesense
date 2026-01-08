# TradeSense Design System Documentation

## Brand Overview

TradeSense is a proprietary trading firm platform with a futuristic, tech-forward aesthetic. The design emphasizes trust, innovation, and professional trading capabilities.

---

## 1. Brand Colors

### Primary Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Green | `#22c55e` | CTAs, highlights, success states, brand accent |
| Primary Green Light | `#4ade80` | Hover states, gradients |
| Primary Green Dark | `#16a34a` | Active states, dark mode accents |

### Dark Mode Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#060912` | Main background (dark-400) |
| Card Background | `#0f172a` | Cards, modals (dark-300) |
| Surface | `#1e293b` | Elevated surfaces (dark-200) |
| Border | `#334155` | Borders, dividers (dark-100) |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#22c55e` | Positive states, profits |
| Error | `#ef4444` | Errors, losses, warnings |
| Warning | `#f59e0b` | Caution states |
| Info | `#3b82f6` | Information, links |

### Gradient Definitions
```css
/* Primary Gradient - for text and accents */
.text-gradient {
  background: linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #86efac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Background Gradient - for hero sections */
.bg-gradient-hero {
  background: radial-gradient(ellipse at top, rgba(34, 197, 94, 0.15) 0%, transparent 50%);
}

/* Card Gradient - subtle glow effect */
.card-glow {
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%);
}
```

---

## 2. Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for numbers, code)

### Font Scale
| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display XL | 72px | 800 | Hero headlines |
| Display | 48px | 700 | Section headers |
| Heading 1 | 36px | 700 | Page titles |
| Heading 2 | 30px | 600 | Section titles |
| Heading 3 | 24px | 600 | Card headers |
| Heading 4 | 20px | 600 | Subsection titles |
| Body Large | 18px | 400 | Lead text |
| Body | 16px | 400 | Regular text |
| Body Small | 14px | 400 | Secondary text |
| Caption | 12px | 500 | Labels, captions |

---

## 3. Logo Usage

### Primary Logo
The TradeSense logo features a stylized chart/arrow icon in primary green with the wordmark.

### Logo Placement
| Location | Size | Variant |
|----------|------|---------|
| Navbar | 32px height | Full logo (icon + text) |
| Footer | 40px height | Full logo |
| Mobile Navbar | 28px height | Icon only or full |
| Favicon | 32x32px | Icon only |
| Auth Pages | 48px height | Full logo, centered |
| Email Templates | 120px width | Full logo |
| Loading States | 48px | Icon only, animated |

### Logo Spacing
- Minimum clear space: 1x logo height on all sides
- Never place on busy backgrounds without overlay
- Always use on dark backgrounds for best contrast

---

## 4. Animation Specifications

### Core Animations

```css
/* Fade In - for page elements */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Float - for decorative elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Pulse Green - for highlights */
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(34, 197, 94, 0); }
}

/* Shimmer - for loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Glow Pulse - for CTAs */
@keyframes glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.3)); }
  50% { filter: drop-shadow(0 0 40px rgba(34, 197, 94, 0.6)); }
}

/* Slide In - for modals and sidebars */
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### Animation Timing
| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions | 150ms | ease-out |
| Element transitions | 300ms | ease-in-out |
| Page transitions | 500ms | ease-out |
| Loading animations | 1000ms+ | linear |
| Hover effects | 200ms | ease |

### Scroll Animations
- Fade up on scroll for cards and sections
- Parallax for hero backgrounds (0.5x speed)
- Counter animations for statistics
- Staggered reveals for lists (50ms delay between items)

---

## 5. Component Library

### Buttons

#### Primary Button
```jsx
<button className="px-6 py-3 bg-primary text-black font-semibold rounded-lg
  hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25
  transition-all duration-200 transform hover:-translate-y-0.5">
  Get Started
</button>
```

#### Secondary Button
```jsx
<button className="px-6 py-3 border border-primary text-primary font-semibold rounded-lg
  hover:bg-primary/10 transition-all duration-200">
  Learn More
</button>
```

#### Ghost Button
```jsx
<button className="px-6 py-3 text-gray-400 hover:text-white
  transition-colors duration-200">
  Cancel
</button>
```

### Cards

#### Feature Card
```jsx
<div className="bg-dark-200/50 backdrop-blur-sm border border-dark-100 rounded-2xl p-6
  hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5
  transition-all duration-300 group">
  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4
    group-hover:scale-110 transition-transform duration-300">
    <Icon className="text-primary" size={24} />
  </div>
  <h3 className="text-xl font-semibold text-white mb-2">Feature Title</h3>
  <p className="text-gray-400">Feature description goes here.</p>
</div>
```

#### Stats Card
```jsx
<div className="bg-gradient-to-br from-dark-200 to-dark-300 rounded-2xl p-6 border border-dark-100">
  <p className="text-gray-400 text-sm mb-1">Metric Name</p>
  <p className="text-3xl font-bold text-white">$1,234,567</p>
  <p className="text-green-500 text-sm mt-2">+12.5% vs last month</p>
</div>
```

### Glass Effect
```jsx
<div className="bg-dark-200/30 backdrop-blur-xl border border-white/10 rounded-2xl">
  {/* Content */}
</div>
```

---

## 6. Page-by-Page Design Specifications

### PUBLIC PAGES (Rich Animations + AI Images)

---

#### 6.1 Landing Page (HomePage.jsx)
**Status**: Reference Design

**Hero Section**
- Full viewport height
- Animated gradient background with floating particles
- Large headline with text-gradient effect
- Animated trading chart preview
- Two CTAs: "Start Trading" (primary) + "Learn More" (secondary)
- Trust indicators row (animated counters)

**AI Image Requirements**:
1. Hero background: Abstract futuristic trading visualization, dark with green accents, data streams
2. Trading interface mockup: Modern terminal with charts and green highlights
3. Globe/network: Connected global trading network visualization

**Animations**:
- Parallax scrolling on background
- Floating chart elements
- Number counter animations for stats
- Scroll-triggered fade-in for sections
- Hover glow on feature cards

---

#### 6.2 About Page (AboutPage.jsx)
**Layout**: Story-driven with full-width sections

**Sections**:
1. Hero with company vision
2. Timeline of company milestones
3. Team section with hover cards
4. Values/mission cards
5. Office/culture gallery

**AI Image Requirements**:
1. Team working: Diverse team in modern trading floor environment
2. Technology: Futuristic server room with green lighting
3. Growth: Abstract representation of financial growth and innovation
4. Global presence: World map with connection points

**Animations**:
- Timeline reveals on scroll
- Team cards flip effect
- Parallax on background images
- Stats counter animation

---

#### 6.3 Challenges Page (ChallengesPage.jsx)
**Layout**: Pricing table focus with comparison

**Sections**:
1. Hero explaining challenge concept
2. Challenge type comparison table
3. Account size options with pricing
4. Rules and requirements accordion
5. Success stories carousel
6. FAQ section

**AI Image Requirements**:
1. Challenge trophy: Golden/green trophy with trading elements
2. Account tiers: Abstract representation of account growth levels
3. Trading desk: Professional trader at multi-monitor setup

**Animations**:
- Pricing cards hover with scale and glow
- Selected plan pulse effect
- Accordion smooth open/close
- Carousel auto-slide with manual controls

---

#### 6.4 How It Works (HowItWorksPage.jsx)
**Layout**: Step-by-step process visualization

**Sections**:
1. Hero with process overview
2. 4-step process with connecting lines
3. Each step has detailed explanation card
4. Demo video embed
5. Ready to start CTA

**AI Image Requirements**:
1. Step 1 (Register): Person onboarding on futuristic interface
2. Step 2 (Challenge): Trading competition visualization
3. Step 3 (Funded): Money/capital flowing illustration
4. Step 4 (Profit): Success celebration with financial graphics

**Animations**:
- Step-by-step reveal on scroll
- Connecting lines animate between steps
- Illustration animations per step
- Video player custom controls

---

#### 6.5 Pricing Page (PricingPage.jsx)
**Layout**: Clear pricing comparison

**Sections**:
1. Header with value proposition
2. Toggle: Monthly/Annual (if applicable)
3. Pricing cards (3-4 tiers)
4. Feature comparison table
5. Money-back guarantee section
6. FAQ

**AI Image Requirements**:
1. Background: Abstract financial growth patterns
2. Value icons: Custom icons for each feature

**Animations**:
- Price cards stagger entrance
- Popular plan has glow pulse
- Toggle smooth transition
- Feature checkmarks appear on scroll

---

#### 6.6 FAQ Page (FAQPage.jsx)
**Layout**: Clean accordion style

**Sections**:
1. Search bar
2. Category filters
3. Accordion questions grouped by category
4. Still have questions CTA

**Animations**:
- Search bar focus effect
- Accordion smooth expand/collapse
- Category filter transition
- Question hover highlight

---

#### 6.7 Contact Page (ContactPage.jsx)
**Layout**: Form + Info split

**Sections**:
1. Hero with contact options
2. Contact form (left) + Office info (right)
3. Map embed
4. Social links

**AI Image Requirements**:
1. Support team: Friendly support agents with headsets
2. Office: Modern tech office interior

**Animations**:
- Form field focus effects
- Send button loading state
- Success message animation
- Map fade-in on scroll

---

#### 6.8 Affiliate Page (AffiliatePage.jsx)
**Layout**: Partnership landing page

**Sections**:
1. Hero with earnings potential
2. How affiliate works
3. Commission structure
4. Partner benefits
5. Sign up CTA

**AI Image Requirements**:
1. Partnership: Two hands shaking with digital overlay
2. Earnings: Money growth visualization
3. Network: Referral network diagram

**Animations**:
- Commission calculator interactive
- Stats counter animation
- Partner logos scroll

---

#### 6.9 Articles/Blog Page (ArticlesPage.jsx)
**Layout**: Blog grid with filters

**Sections**:
1. Featured article hero
2. Category filters
3. Article grid (3 columns)
4. Pagination
5. Newsletter signup

**AI Image Requirements**:
1. Featured article thumbnails: Various trading/finance themes
2. Category icons

**Animations**:
- Card hover lift effect
- Image zoom on hover
- Filter transition
- Infinite scroll loading

---

#### 6.10 Legal Pages (Terms, Privacy, Cookies, Refund)
**Layout**: Clean document style

**Design**:
- Wide content area with sidebar navigation
- Table of contents sticky sidebar
- Print-friendly formatting
- Last updated timestamp

**Animations**:
- Smooth scroll to sections
- Active section highlight in sidebar

---

### AUTHENTICATION PAGES (Clean + Focused)

---

#### 6.11 Login Page (Login.jsx)
**Layout**: Centered card on dark background

**Design**:
- Logo at top (48px)
- Email/password fields with icons
- Remember me checkbox
- Submit button with loading state
- Social login options (optional)
- Links: Forgot password, Register

**AI Image Requirements**:
1. Side illustration: Abstract secure login visualization (half-screen on desktop)

**Animations**:
- Card fade-in on load
- Field focus effects
- Button loading spinner
- Error shake animation

---

#### 6.12 Register Page (Register.jsx)
**Layout**: Multi-step form or single page

**Design**:
- Logo at top
- Step indicator (if multi-step)
- Form fields with validation
- Password strength indicator
- Terms acceptance checkbox

**AI Image Requirements**:
1. Side illustration: New user welcome/onboarding theme

**Animations**:
- Step transitions
- Password strength bar
- Validation feedback
- Success redirect

---

#### 6.13 Two-Factor Auth (TwoFactorSetup.jsx, TwoFactorVerify.jsx)
**Layout**: Minimal centered card

**Design**:
- QR code display (setup)
- 6-digit input with auto-focus
- Backup codes display
- Recovery options

**Animations**:
- Code input auto-focus
- Success checkmark
- QR code fade-in

---

#### 6.14 Forgot/Reset Password
**Layout**: Simple centered form

**Design**:
- Clear instructions
- Email input (forgot)
- New password inputs (reset)
- Success confirmation

**Animations**:
- Email sent animation
- Password match indicator

---

### USER DASHBOARD PAGES (Functional + Clean)

---

#### 6.15 Dashboard Home (Dashboard.jsx)
**Layout**: Grid-based overview

**Sections**:
1. Welcome header with user name
2. Active challenge card (prominent)
3. Quick stats row (4 cards)
4. Recent trades table
5. Performance chart
6. Notifications sidebar

**Design Principles**:
- Information density balanced with whitespace
- Critical metrics at top
- Action buttons easily accessible
- Clean data visualization

**Animations**:
- Cards stagger load
- Charts animate in
- Numbers count up
- Refresh button spin

---

#### 6.16 Trading Page (TradingPage.jsx)
**Layout**: Trading terminal style

**Sections**:
1. Instrument selector
2. Price chart (TradingView)
3. Order entry panel
4. Open positions table
5. Account metrics bar

**Design Principles**:
- Dark theme for eye comfort
- High contrast for numbers
- Green/red for buy/sell
- Minimal distractions

**Animations**:
- Live price updates flash
- Order confirmation popup
- Position updates smooth

---

#### 6.17 Challenges Overview (UserChallenges.jsx)
**Layout**: Card grid with filters

**Design**:
- Status filters (active, passed, failed)
- Challenge cards with progress
- Start new challenge CTA

**Animations**:
- Progress bar animation
- Status badge pulse (active)
- Filter transition

---

#### 6.18 Challenge Details (ChallengeDetail.jsx)
**Layout**: Full challenge dashboard

**Sections**:
1. Challenge header with status
2. Metrics grid (balance, P&L, drawdown)
3. Rules compliance indicators
4. Trade history table
5. Performance chart
6. Daily breakdown

**Animations**:
- Metric updates
- Chart transitions
- Rule status changes

---

#### 6.19 Trade History (TradeHistory.jsx)
**Layout**: Data table with filters

**Design**:
- Date range picker
- Symbol/status filters
- Sortable columns
- Pagination
- Export button

**Animations**:
- Table row transitions
- Sort indicator
- Export loading

---

#### 6.20 Payouts Page (Payouts.jsx)
**Layout**: Payout management

**Sections**:
1. Available balance
2. Request payout form
3. Payout history table
4. Payment methods

**Animations**:
- Request form validation
- Status badge updates
- Success confirmation

---

#### 6.21 AI Assistant (AiAssistant.jsx)
**Layout**: Chat interface

**Design**:
- Message list with bubbles
- Input bar at bottom
- Suggested prompts
- Analysis cards inline

**Animations**:
- Typing indicator
- Message slide-in
- Analysis card expand

---

#### 6.22 Settings Pages (Settings.jsx, Security.jsx, etc.)
**Layout**: Sidebar nav with content

**Design**:
- Section tabs/nav
- Form fields with save buttons
- Toggle switches
- Danger zone at bottom

**Animations**:
- Tab transitions
- Toggle animations
- Save confirmation

---

#### 6.23 Profile Page (ProfilePage.jsx)
**Layout**: Profile card with tabs

**Design**:
- Avatar with upload
- User info card
- Edit mode toggle
- Activity timeline

**Animations**:
- Avatar upload preview
- Edit mode transition
- Save feedback

---

### ADMIN DASHBOARD PAGES (Functional + Data-Dense)

---

#### 6.24 Admin Dashboard (AdminDashboard.jsx)
**Layout**: Overview with widgets

**Sections**:
1. Quick stats row
2. Recent activity feed
3. Pending actions list
4. Charts (users, revenue)
5. System health

**Design Principles**:
- Data-first approach
- Quick action buttons
- Clear hierarchies
- Efficient layouts

**Animations**:
- Stats count up
- Feed auto-update
- Chart transitions

---

#### 6.25 User Management (UsersListPage.jsx, UserDetailPage.jsx)
**Layout**: Master-detail pattern

**Design**:
- Searchable table
- Quick actions column
- Detail drawer/page
- Bulk actions toolbar

**Animations**:
- Table row selection
- Drawer slide-in
- Action confirmations

---

#### 6.26 Challenge Management (AdminChallenges.jsx, ChallengeDetailPage.jsx)
**Layout**: Similar to user management

**Design**:
- Status-based filters
- Detailed view with all metrics
- Manual override controls

---

#### 6.27 Financial Pages (FinancialOverview.jsx, PayoutManagement.jsx)
**Layout**: Financial dashboard

**Design**:
- Revenue charts
- Transaction tables
- Payout queue
- Approval workflows

---

#### 6.28 Support Tickets (SupportTickets.jsx, TicketDetail.jsx)
**Layout**: Inbox style

**Design**:
- Priority indicators
- Status columns
- Reply interface
- Assignment dropdown

---

#### 6.29 Audit Logs (AuditLogs.jsx)
**Layout**: Log viewer

**Design**:
- Filters sidebar
- Log entries list
- Detail expansion
- Export options

---

### SUPERADMIN PAGES (Maximum Control)

---

#### 6.30 SuperAdmin Dashboard (SuperAdminDashboard.jsx)
**Layout**: System overview

**Design**:
- Platform health metrics
- Critical alerts
- Quick actions
- Revenue overview

---

#### 6.31 User Control (UserControlPage.jsx)
**Layout**: Full user control panel

**Design**:
- All user fields editable
- Action history
- Advanced controls

---

#### 6.32 System Config (SystemConfigPage.jsx)
**Layout**: Settings categories

**Design**:
- Grouped settings
- API key management
- Feature flags
- Environment display

---

#### 6.33 Security Center (SecurityDashboard.jsx)
**Layout**: Security monitoring

**Design**:
- Threat indicators
- IP blocking
- Login attempts
- Active sessions

---

#### 6.34 Analytics (AnalyticsDashboard.jsx)
**Layout**: Full analytics suite

**Design**:
- Multiple chart types
- Date range comparison
- Export capabilities
- Drill-down views

---

## 7. AI Image Generation Prompts

For consistent AI-generated images, use these prompt templates:

### Hero/Background Images
```
"Futuristic trading floor visualization, dark background with green (#22c55e)
glowing data streams, abstract financial charts floating in 3D space,
minimal and clean, high-tech aesthetic, 8K resolution, no text"
```

### Feature Illustrations
```
"Minimalist icon illustration of [CONCEPT], geometric style,
dark background (#0f172a), primary green (#22c55e) accents,
clean lines, modern tech aesthetic, isolated element"
```

### Section Backgrounds
```
"Abstract digital pattern, subtle gradient from dark (#060912) to slightly lighter,
faint geometric grid, occasional green (#22c55e) accent points,
seamless tileable texture, modern fintech style"
```

### Trading/Chart Visuals
```
"Professional trading terminal interface, multiple monitors showing
green candlestick charts, dark theme, futuristic UI elements,
clean data visualization, cinematic lighting"
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked nav, simplified charts |
| Tablet | 640-1024px | 2 columns, sidebar collapsible |
| Desktop | 1024-1440px | Full layout, all features |
| Large | > 1440px | Wider content, more breathing room |

---

## 9. Accessibility Guidelines

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators: 2px green outline
- Touch targets: Minimum 44x44px
- Alt text for all images
- ARIA labels for interactive elements
- Keyboard navigation support
- Reduced motion preference support

---

## 10. Implementation Priority

### Phase 1: Foundation (Week 1)
1. Update Tailwind config with all design tokens
2. Create reusable animation utilities
3. Update component library (buttons, cards, inputs)
4. Implement glass effect and gradients

### Phase 2: Public Pages (Week 2-3)
1. Landing page complete redesign
2. About, Challenges, How It Works pages
3. Pricing and FAQ pages
4. Contact and Affiliate pages

### Phase 3: Auth Pages (Week 3)
1. Login page with side illustration
2. Register with steps
3. 2FA pages
4. Password reset flow

### Phase 4: User Dashboard (Week 4-5)
1. Dashboard home
2. Trading page
3. Challenge pages
4. Settings and profile

### Phase 5: Admin Dashboard (Week 5-6)
1. Admin overview
2. User management
3. Challenge management
4. Financial pages

### Phase 6: SuperAdmin (Week 6)
1. Complete all superadmin pages
2. System configuration UI
3. Security dashboard

---

## 11. File Structure for Design Assets

```
frontend/
├── public/
│   ├── images/
│   │   ├── hero/
│   │   │   ├── trading-visualization.webp
│   │   │   ├── globe-network.webp
│   │   │   └── data-streams.webp
│   │   ├── illustrations/
│   │   │   ├── step-1-register.svg
│   │   │   ├── step-2-challenge.svg
│   │   │   ├── step-3-funded.svg
│   │   │   └── step-4-profit.svg
│   │   ├── icons/
│   │   │   └── feature-icons/
│   │   ├── team/
│   │   └── backgrounds/
│   │       ├── pattern-dark.svg
│   │       └── gradient-mesh.webp
│   └── logo/
│       ├── logo-full.svg
│       ├── logo-icon.svg
│       ├── logo-white.svg
│       └── favicon.ico
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       └── animations/
│   │           ├── FadeIn.jsx
│   │           ├── Counter.jsx
│   │           └── Parallax.jsx
│   └── styles/
│       ├── animations.css
│       └── components.css
```

---

## 12. Quality Checklist

Before launching each page, verify:

- [ ] All colors match design system
- [ ] Typography follows scale
- [ ] Animations are smooth (60fps)
- [ ] Responsive on all breakpoints
- [ ] Accessible (keyboard, screen reader)
- [ ] Images optimized (WebP, lazy load)
- [ ] Loading states implemented
- [ ] Error states styled
- [ ] Dark mode consistent
- [ ] Logo placement correct
- [ ] CTAs prominent and clear

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Created for TradeSense Platform*
