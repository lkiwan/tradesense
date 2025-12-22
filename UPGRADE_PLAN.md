# TradeSense → FundedNext Level Upgrade Plan

## Executive Summary

This document outlines a structured upgrade path to transform TradeSense into a full-featured proprietary trading platform matching FundedNext's capabilities. The plan is organized by priority phases, with each phase building upon the previous.

---

## Current State vs Target State

### What TradeSense Currently Has ✅
| Feature | Status |
|---------|--------|
| User Authentication (JWT) | ✅ Complete |
| Basic Challenge System (Trial/Paid) | ✅ Complete |
| 2-Phase Evaluation (10%/5%) | ✅ Complete |
| Funded Status with 80/20 Split | ✅ Complete |
| PayPal Integration | ✅ Complete |
| Auto-charging Trial System | ✅ Complete |
| Basic Dashboard | ✅ Complete |
| AI Signals (Gemini) | ✅ Complete |
| Real-time Prices | ✅ Complete |
| Leaderboard | ✅ Complete |
| Admin Panel | ✅ Complete |

### What's Missing (FundedNext Features) ❌
| Feature | Priority | Complexity |
|---------|----------|------------|
| Multiple Challenge Models (1-Step, 2-Step, Lite) | 🔴 High | Medium |
| Balance-Based Drawdown Engine | 🔴 High | High |
| Platform Integration (MT4/MT5/cTrader) | 🔴 High | Very High |
| Competition System | 🟡 Medium | High |
| KYC/Identity Verification | 🔴 High | Medium |
| Scaling Plan (GrowthNext) | 🟡 Medium | Medium |
| Certificate Generation | 🟢 Low | Low |
| Affiliate System (4-tier) | 🟡 Medium | Medium |
| Multiple Payment Gateways | 🟡 Medium | Medium |
| Swap/Swap-Free Accounts | 🟢 Low | Low |
| Trading Tools (EA, Indicators) | 🟢 Low | Low |
| Contract Signing (Digital) | 🟡 Medium | Low |

---

## Phase 1: Core Infrastructure Upgrade (Priority: Critical)

### 1.1 Multi-Model Challenge Architecture

**Current:** Single evaluation model (10% → 5% → Funded)
**Target:** Multiple configurable models like FundedNext

#### Database Schema Changes

```sql
-- New table: challenge_models
CREATE TABLE challenge_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,           -- 'stellar_1step', 'stellar_2step', 'stellar_lite'
    display_name VARCHAR(100),           -- 'Stellar 1-Step'
    phases INTEGER DEFAULT 2,            -- 1 or 2

    -- Phase 1 Settings
    phase1_profit_target DECIMAL(5,2),   -- 10.00 for 10%
    phase1_min_days INTEGER,             -- 2 or 5

    -- Phase 2 Settings (null for 1-step)
    phase2_profit_target DECIMAL(5,2),   -- 5.00 for 5%
    phase2_min_days INTEGER,

    -- Risk Parameters
    max_daily_loss DECIMAL(5,2),         -- 3.00, 4.00, or 5.00
    max_overall_loss DECIMAL(5,2),       -- 6.00, 8.00, or 10.00

    -- Trading Settings
    leverage VARCHAR(10),                -- '1:30' or '1:100'

    -- Payout Settings
    first_payout_days INTEGER,           -- 5 or 21
    payout_cycle_days INTEGER,           -- 5 or 14
    default_profit_split DECIMAL(5,2),   -- 80.00

    -- Pricing
    reset_discount DECIMAL(5,2),         -- 5.00 or 10.00

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data for FundedNext Models
INSERT INTO challenge_models (name, display_name, phases, phase1_profit_target, phase1_min_days, phase2_profit_target, phase2_min_days, max_daily_loss, max_overall_loss, leverage, first_payout_days, payout_cycle_days, reset_discount) VALUES
('stellar_1step', 'Stellar 1-Step', 1, 10.00, 2, NULL, NULL, 3.00, 6.00, '1:30', 5, 5, 10.00),
('stellar_2step', 'Stellar 2-Step', 2, 8.00, 5, 5.00, 5, 5.00, 10.00, '1:100', 21, 14, 10.00),
('stellar_lite', 'Stellar Lite', 2, 8.00, 5, 4.00, 5, 4.00, 8.00, '1:100', 21, 14, 5.00);

-- New table: account_sizes
CREATE TABLE account_sizes (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES challenge_models(id),
    balance DECIMAL(15,2),               -- 5000, 10000, 25000, 50000, 100000, 200000
    price DECIMAL(10,2),                 -- Purchase price
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed Account Sizes
INSERT INTO account_sizes (model_id, balance, price) VALUES
-- Stellar 1-Step
(1, 5000, 59),
(1, 10000, 109),
(1, 25000, 199),
(1, 50000, 299),
(1, 100000, 499),
(1, 200000, 999),
-- Stellar 2-Step
(2, 5000, 49),
(2, 10000, 99),
(2, 25000, 179),
(2, 50000, 249),
(2, 100000, 449),
(2, 200000, 899);
```

#### Backend Implementation

**File:** `backend/models/challenge_model.py`
```python
class ChallengeModel(db.Model):
    """Configurable challenge model (Stellar 1-Step, 2-Step, Lite)"""
    __tablename__ = 'challenge_models'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100))
    phases = db.Column(db.Integer, default=2)

    # Phase targets
    phase1_profit_target = db.Column(db.Numeric(5,2))
    phase1_min_days = db.Column(db.Integer)
    phase2_profit_target = db.Column(db.Numeric(5,2))
    phase2_min_days = db.Column(db.Integer)

    # Risk parameters
    max_daily_loss = db.Column(db.Numeric(5,2))
    max_overall_loss = db.Column(db.Numeric(5,2))
    leverage = db.Column(db.String(10))

    # Payout settings
    first_payout_days = db.Column(db.Integer)
    payout_cycle_days = db.Column(db.Integer)
    default_profit_split = db.Column(db.Numeric(5,2), default=80.00)
    reset_discount = db.Column(db.Numeric(5,2), default=10.00)

    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    account_sizes = db.relationship('AccountSize', backref='model', lazy=True)
```

**File:** `backend/models/account_size.py`
```python
class AccountSize(db.Model):
    """Available account sizes for each model"""
    __tablename__ = 'account_sizes'

    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('challenge_models.id'))
    balance = db.Column(db.Numeric(15,2), nullable=False)
    price = db.Column(db.Numeric(10,2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
```

---

### 1.2 Balance-Based Drawdown Engine

**Current:** Simple percentage calculation
**Target:** Daily snapshot-based balance drawdown (FundedNext style)

#### Implementation

**File:** `backend/services/drawdown_engine.py`
```python
"""
Balance-Based Drawdown Engine
Calculates drawdown based on START OF DAY balance, not floating equity
"""

from datetime import datetime, time
from decimal import Decimal
from models import db, UserChallenge, DailySnapshot
from apscheduler.schedulers.background import BackgroundScheduler

class DrawdownEngine:
    """
    FundedNext-style Balance-Based Drawdown Logic:

    1. At 00:00 server time, snapshot the BALANCE of every active account
    2. Daily Loss = Starting Balance - Current Equity
    3. If Daily Loss >= Max Daily Loss % → BREACH
    4. Overall Loss = Initial Balance - Current Equity
    5. If Overall Loss >= Max Overall Loss % → BREACH

    Key difference from Equity-Based:
    - If trader profits, their daily loss buffer INCREASES
    - Example: $100k account, 5% daily limit
      - Start of day: $100,000 balance
      - Daily loss limit: $95,000 equity
      - If trader profits to $102,000, limit STAYS at $95,000
      - So they can now lose $7,000 before breach
    """

    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self, app):
        """Initialize the drawdown monitoring system"""
        with app.app_context():
            # Schedule daily snapshot at 00:00 server time
            self.scheduler.add_job(
                self.create_daily_snapshots,
                'cron',
                hour=0,
                minute=0,
                args=[app]
            )

            # Monitor equity every 30 seconds
            self.scheduler.add_job(
                self.monitor_all_accounts,
                'interval',
                seconds=30,
                args=[app]
            )

            self.scheduler.start()

    def create_daily_snapshots(self, app):
        """Create balance snapshots for all active accounts at 00:00"""
        with app.app_context():
            active_accounts = UserChallenge.query.filter(
                UserChallenge.status.in_(['active', 'funded'])
            ).all()

            for account in active_accounts:
                snapshot = DailySnapshot(
                    challenge_id=account.id,
                    date=datetime.utcnow().date(),
                    starting_balance=account.current_balance,
                    starting_equity=account.current_balance  # At day start, balance = equity
                )
                db.session.add(snapshot)

            db.session.commit()
            print(f"Created {len(active_accounts)} daily snapshots")

    def get_todays_snapshot(self, challenge_id):
        """Get today's starting balance snapshot"""
        today = datetime.utcnow().date()
        snapshot = DailySnapshot.query.filter_by(
            challenge_id=challenge_id,
            date=today
        ).first()

        if not snapshot:
            # If no snapshot exists (new account mid-day), use current balance
            challenge = UserChallenge.query.get(challenge_id)
            snapshot = DailySnapshot(
                challenge_id=challenge_id,
                date=today,
                starting_balance=challenge.current_balance,
                starting_equity=challenge.current_balance
            )
            db.session.add(snapshot)
            db.session.commit()

        return snapshot

    def calculate_daily_loss(self, challenge, current_equity):
        """
        Calculate daily loss percentage
        Formula: (Starting Balance - Current Equity) / Starting Balance * 100
        """
        snapshot = self.get_todays_snapshot(challenge.id)
        starting_balance = float(snapshot.starting_balance)

        if starting_balance == 0:
            return 0

        daily_loss = (starting_balance - float(current_equity)) / starting_balance * 100
        return max(0, daily_loss)  # Only positive loss values

    def calculate_overall_loss(self, challenge, current_equity):
        """
        Calculate overall loss percentage from initial balance
        Formula: (Initial Balance - Current Equity) / Initial Balance * 100
        """
        initial = float(challenge.initial_balance)

        if initial == 0:
            return 0

        overall_loss = (initial - float(current_equity)) / initial * 100
        return max(0, overall_loss)

    def check_breach(self, challenge, current_equity):
        """
        Check if account has breached any limits
        Returns: (is_breached, breach_type, breach_details)
        """
        # Get model-specific limits
        model = challenge.challenge_model
        max_daily = float(model.max_daily_loss) if model else 5.0
        max_overall = float(model.max_overall_loss) if model else 10.0

        daily_loss = self.calculate_daily_loss(challenge, current_equity)
        overall_loss = self.calculate_overall_loss(challenge, current_equity)

        # Check daily loss breach
        if daily_loss >= max_daily:
            return (True, 'daily_loss', {
                'limit': max_daily,
                'actual': daily_loss,
                'message': f'Daily loss limit of {max_daily}% exceeded ({daily_loss:.2f}%)'
            })

        # Check overall loss breach
        if overall_loss >= max_overall:
            return (True, 'overall_loss', {
                'limit': max_overall,
                'actual': overall_loss,
                'message': f'Overall loss limit of {max_overall}% exceeded ({overall_loss:.2f}%)'
            })

        return (False, None, None)

    def get_remaining_daily_buffer(self, challenge, current_equity):
        """Calculate how much more the trader can lose today"""
        snapshot = self.get_todays_snapshot(challenge.id)
        model = challenge.challenge_model
        max_daily = float(model.max_daily_loss) if model else 5.0

        starting_balance = float(snapshot.starting_balance)
        breach_level = starting_balance * (1 - max_daily / 100)
        remaining = float(current_equity) - breach_level

        return {
            'starting_balance': starting_balance,
            'current_equity': float(current_equity),
            'breach_level': breach_level,
            'remaining_buffer': max(0, remaining),
            'remaining_percent': max(0, (remaining / starting_balance) * 100) if starting_balance > 0 else 0
        }

    def monitor_all_accounts(self, app):
        """Check all active accounts for breaches"""
        with app.app_context():
            active_accounts = UserChallenge.query.filter(
                UserChallenge.status.in_(['active', 'funded'])
            ).all()

            for account in active_accounts:
                # Get current equity (balance + unrealized PnL)
                current_equity = self.get_current_equity(account)

                is_breached, breach_type, details = self.check_breach(account, current_equity)

                if is_breached:
                    self.handle_breach(account, breach_type, details)

    def get_current_equity(self, challenge):
        """Get current equity (balance + open positions PnL)"""
        from services.trade_service import TradeService
        trade_service = TradeService()

        open_pnl = trade_service.calculate_open_pnl(challenge.id)
        return float(challenge.current_balance) + open_pnl

    def handle_breach(self, challenge, breach_type, details):
        """Handle account breach"""
        from services.email_service import send_breach_notification

        challenge.status = 'failed'
        challenge.failure_reason = details['message']
        challenge.end_date = datetime.utcnow()
        db.session.commit()

        # Close all open positions
        self.force_close_positions(challenge)

        # Notify user
        send_breach_notification(challenge.user, challenge, breach_type, details)

        print(f"Account {challenge.id} BREACHED: {details['message']}")

    def force_close_positions(self, challenge):
        """Force close all open positions on breach"""
        from models import Trade

        open_trades = Trade.query.filter_by(
            challenge_id=challenge.id,
            status='open'
        ).all()

        for trade in open_trades:
            trade.status = 'closed'
            trade.exit_price = trade.current_price  # Close at current price
            trade.closed_at = datetime.utcnow()
            trade.close_reason = 'breach'

        db.session.commit()


# Daily Snapshot Model
class DailySnapshot(db.Model):
    """Stores daily starting balance for drawdown calculation"""
    __tablename__ = 'daily_snapshots'

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'))
    date = db.Column(db.Date, nullable=False)
    starting_balance = db.Column(db.Numeric(15,2), nullable=False)
    starting_equity = db.Column(db.Numeric(15,2), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('challenge_id', 'date', name='unique_daily_snapshot'),
    )
```

---

### 1.3 KYC/Identity Verification System

**Current:** No KYC
**Target:** Deferred KYC (only after passing challenge)

#### Integration Options
1. **Sumsub** (Recommended) - Best for global coverage
2. **Veriff** - Good for EU compliance
3. **Onfido** - Strong biometric checks

#### Database Schema

```sql
-- KYC Verification Table
CREATE TABLE kyc_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, approved, rejected

    -- Provider Data
    provider VARCHAR(50) DEFAULT 'sumsub',
    provider_applicant_id VARCHAR(100),
    provider_verification_id VARCHAR(100),

    -- Document Info
    document_type VARCHAR(50),            -- passport, national_id, driving_license
    document_country VARCHAR(2),
    document_number_hash VARCHAR(256),    -- Hashed for privacy

    -- Address Verification
    address_verified BOOLEAN DEFAULT FALSE,
    address_document_type VARCHAR(50),    -- utility_bill, bank_statement

    -- Biometric
    liveness_check_passed BOOLEAN DEFAULT FALSE,
    face_match_score DECIMAL(5,2),

    -- Review
    rejection_reason TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,

    -- Timestamps
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prohibited Countries
CREATE TABLE prohibited_countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO prohibited_countries (country_code, country_name, reason) VALUES
('KP', 'North Korea', 'Sanctions'),
('IR', 'Iran', 'Sanctions'),
('CU', 'Cuba', 'Sanctions'),
('SY', 'Syria', 'Sanctions'),
('MM', 'Myanmar', 'Sanctions'),
('US', 'United States', 'Regulatory');
```

#### Backend Implementation

**File:** `backend/services/kyc_service.py`
```python
"""
KYC Service - Integration with Sumsub
Triggered only after user passes challenge (Deferred KYC model)
"""

import hashlib
import hmac
import time
import requests
from flask import current_app
from models import db, User, KYCVerification

class KYCService:
    """Sumsub KYC Integration"""

    def __init__(self):
        self.app_token = current_app.config.get('SUMSUB_APP_TOKEN')
        self.secret_key = current_app.config.get('SUMSUB_SECRET_KEY')
        self.base_url = 'https://api.sumsub.com'

    def _generate_signature(self, method, url, timestamp, body=''):
        """Generate HMAC signature for Sumsub API"""
        message = f"{timestamp}{method}{url}{body}"
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _get_headers(self, method, url, body=''):
        """Generate headers with signature"""
        timestamp = str(int(time.time()))
        signature = self._generate_signature(method, url, timestamp, body)

        return {
            'X-App-Token': self.app_token,
            'X-App-Access-Ts': timestamp,
            'X-App-Access-Sig': signature,
            'Content-Type': 'application/json'
        }

    def create_applicant(self, user):
        """Create applicant in Sumsub"""
        url = '/resources/applicants?levelName=basic-kyc-level'

        body = {
            'externalUserId': str(user.id),
            'email': user.email,
            'info': {
                'firstName': user.first_name,
                'lastName': user.last_name,
                'country': user.country
            }
        }

        response = requests.post(
            f"{self.base_url}{url}",
            headers=self._get_headers('POST', url, str(body)),
            json=body
        )

        if response.status_code == 201:
            data = response.json()

            # Create KYC record
            kyc = KYCVerification(
                user_id=user.id,
                status='pending',
                provider='sumsub',
                provider_applicant_id=data['id']
            )
            db.session.add(kyc)
            db.session.commit()

            return data['id']

        return None

    def get_access_token(self, user):
        """Get access token for SDK"""
        kyc = KYCVerification.query.filter_by(user_id=user.id).first()

        if not kyc or not kyc.provider_applicant_id:
            applicant_id = self.create_applicant(user)
        else:
            applicant_id = kyc.provider_applicant_id

        url = f'/resources/accessTokens?userId={user.id}&levelName=basic-kyc-level'

        response = requests.post(
            f"{self.base_url}{url}",
            headers=self._get_headers('POST', url)
        )

        if response.status_code == 200:
            return response.json()['token']

        return None

    def handle_webhook(self, payload):
        """Process Sumsub webhook"""
        applicant_id = payload.get('applicantId')
        review_result = payload.get('reviewResult', {})
        review_answer = review_result.get('reviewAnswer')

        kyc = KYCVerification.query.filter_by(
            provider_applicant_id=applicant_id
        ).first()

        if not kyc:
            return False

        if review_answer == 'GREEN':
            kyc.status = 'approved'
            kyc.approved_at = datetime.utcnow()
            kyc.liveness_check_passed = True

            # Trigger funded account creation
            self.activate_funded_account(kyc.user_id)

        elif review_answer == 'RED':
            kyc.status = 'rejected'
            kyc.rejection_reason = review_result.get('rejectLabels', [])

        db.session.commit()
        return True

    def activate_funded_account(self, user_id):
        """After KYC approval, activate the funded account"""
        from services.challenge_engine import ChallengeEngine

        # Find the passed challenge awaiting KYC
        challenge = UserChallenge.query.filter_by(
            user_id=user_id,
            status='pending_kyc'
        ).first()

        if challenge:
            engine = ChallengeEngine()
            engine.provision_funded_account(challenge)

    def is_country_prohibited(self, country_code):
        """Check if country is on prohibited list"""
        from models import ProhibitedCountry
        return ProhibitedCountry.query.filter_by(
            country_code=country_code.upper()
        ).first() is not None
```

---

## Phase 2: Product Expansion

### 2.1 Competition System

**Target:** Monthly trading competitions with leaderboards

#### Database Schema

```sql
-- Competitions
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Timing
    registration_start DATE,
    registration_end DATE,
    competition_start DATE,
    competition_end DATE,

    -- Settings
    initial_balance DECIMAL(15,2) DEFAULT 100000,
    max_participants INTEGER,
    entry_fee DECIMAL(10,2) DEFAULT 0,

    -- Rules
    max_daily_trades INTEGER DEFAULT 50,
    max_lot_size_forex DECIMAL(5,2) DEFAULT 5.00,
    max_lot_size_indices DECIMAL(5,2) DEFAULT 3.00,

    -- Prizes
    prize_pool DECIMAL(15,2),
    prize_distribution JSONB,  -- {"1": 5000, "2": 2500, "3": 1000}

    -- Status
    status VARCHAR(20) DEFAULT 'upcoming',  -- upcoming, registration, active, ended
    created_at TIMESTAMP DEFAULT NOW()
);

-- Competition Entries
CREATE TABLE competition_entries (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id),
    user_id INTEGER REFERENCES users(id),

    -- Account
    trading_login INTEGER,
    current_balance DECIMAL(15,2),
    current_equity DECIMAL(15,2),

    -- Performance
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    roi DECIMAL(10,4) DEFAULT 0,  -- Return on Investment %

    -- Ranking
    current_rank INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, disqualified
    registered_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(competition_id, user_id)
);

-- Competition Leaderboard Cache (updated every minute)
CREATE TABLE competition_leaderboard (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id),
    entry_id INTEGER REFERENCES competition_entries(id),
    user_id INTEGER REFERENCES users(id),

    rank INTEGER,
    username VARCHAR(50),
    roi DECIMAL(10,4),
    total_pnl DECIMAL(15,2),

    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Backend Implementation

**File:** `backend/services/competition_service.py`
```python
"""
Competition Service - Monthly Trading Competitions
"""

from datetime import datetime, date
from decimal import Decimal
from models import db, Competition, CompetitionEntry, User
from apscheduler.schedulers.background import BackgroundScheduler

class CompetitionService:

    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self, app):
        """Start competition scheduler"""
        # Update leaderboard every minute
        self.scheduler.add_job(
            self.update_leaderboards,
            'interval',
            minutes=1,
            args=[app]
        )

        # Check competition status changes daily
        self.scheduler.add_job(
            self.check_competition_phases,
            'cron',
            hour=0,
            minute=1,
            args=[app]
        )

        self.scheduler.start()

    def create_competition(self, data):
        """Create a new competition"""
        competition = Competition(
            name=data['name'],
            description=data.get('description'),
            registration_start=data['registration_start'],
            registration_end=data['registration_end'],
            competition_start=data['competition_start'],
            competition_end=data['competition_end'],
            initial_balance=data.get('initial_balance', 100000),
            max_participants=data.get('max_participants'),
            entry_fee=data.get('entry_fee', 0),
            prize_pool=data.get('prize_pool', 0),
            prize_distribution=data.get('prize_distribution', {})
        )

        db.session.add(competition)
        db.session.commit()
        return competition

    def register_user(self, competition_id, user_id):
        """Register user for competition"""
        competition = Competition.query.get(competition_id)

        if not competition:
            return {'error': 'Competition not found'}

        if competition.status != 'registration':
            return {'error': 'Registration is not open'}

        # Check if already registered
        existing = CompetitionEntry.query.filter_by(
            competition_id=competition_id,
            user_id=user_id
        ).first()

        if existing:
            return {'error': 'Already registered'}

        # Check max participants
        if competition.max_participants:
            count = CompetitionEntry.query.filter_by(
                competition_id=competition_id
            ).count()
            if count >= competition.max_participants:
                return {'error': 'Competition is full'}

        # Create entry
        entry = CompetitionEntry(
            competition_id=competition_id,
            user_id=user_id,
            current_balance=competition.initial_balance,
            current_equity=competition.initial_balance
        )

        db.session.add(entry)
        db.session.commit()

        # Provision competition trading account
        self.provision_competition_account(entry, competition)

        return {'success': True, 'entry_id': entry.id}

    def provision_competition_account(self, entry, competition):
        """Create trading account for competition"""
        from services.bridge_service import BridgeService

        bridge = BridgeService()
        account = bridge.create_account(
            user_id=entry.user_id,
            balance=float(competition.initial_balance),
            group='competition',
            leverage='1:100'
        )

        entry.trading_login = account['login']
        db.session.commit()

    def update_leaderboards(self, app):
        """Update all active competition leaderboards"""
        with app.app_context():
            active_competitions = Competition.query.filter_by(
                status='active'
            ).all()

            for competition in active_competitions:
                self.update_competition_leaderboard(competition)

    def update_competition_leaderboard(self, competition):
        """Update leaderboard for specific competition"""
        entries = CompetitionEntry.query.filter_by(
            competition_id=competition.id,
            status='active'
        ).all()

        # Calculate ROI for each entry
        for entry in entries:
            equity = self.get_current_equity(entry)
            entry.current_equity = equity
            entry.roi = ((equity - competition.initial_balance) / competition.initial_balance) * 100
            entry.total_pnl = equity - competition.initial_balance

        # Sort by ROI
        entries.sort(key=lambda x: x.roi, reverse=True)

        # Update ranks
        for rank, entry in enumerate(entries, 1):
            entry.current_rank = rank

        db.session.commit()

        # Update cache table
        self.update_leaderboard_cache(competition, entries)

    def get_current_equity(self, entry):
        """Get current equity from trading server"""
        from services.bridge_service import BridgeService

        bridge = BridgeService()
        account_info = bridge.get_account_info(entry.trading_login)
        return Decimal(str(account_info.get('equity', entry.current_balance)))

    def get_leaderboard(self, competition_id, limit=100):
        """Get competition leaderboard"""
        from models import CompetitionLeaderboard

        return CompetitionLeaderboard.query.filter_by(
            competition_id=competition_id
        ).order_by(CompetitionLeaderboard.rank).limit(limit).all()

    def check_competition_phases(self, app):
        """Check and update competition phases"""
        with app.app_context():
            today = date.today()

            # Start registration
            Competition.query.filter(
                Competition.status == 'upcoming',
                Competition.registration_start <= today
            ).update({'status': 'registration'})

            # Start competition
            Competition.query.filter(
                Competition.status == 'registration',
                Competition.competition_start <= today
            ).update({'status': 'active'})

            # End competition
            ended = Competition.query.filter(
                Competition.status == 'active',
                Competition.competition_end < today
            ).all()

            for competition in ended:
                self.end_competition(competition)

            db.session.commit()

    def end_competition(self, competition):
        """End competition and distribute prizes"""
        competition.status = 'ended'

        # Get final rankings
        entries = CompetitionEntry.query.filter_by(
            competition_id=competition.id,
            status='active'
        ).order_by(CompetitionEntry.current_rank).all()

        # Distribute prizes
        prize_dist = competition.prize_distribution or {}
        for entry in entries:
            rank_str = str(entry.current_rank)
            if rank_str in prize_dist:
                prize = prize_dist[rank_str]
                self.award_prize(entry, prize)

    def award_prize(self, entry, amount):
        """Award prize to winner"""
        from services.email_service import send_competition_prize_email

        user = User.query.get(entry.user_id)

        # Credit prize (as challenge credit or direct payout)
        # Implementation depends on business logic

        send_competition_prize_email(user, amount, entry.current_rank)
```

---

### 2.2 Scaling Plan (GrowthNext)

**Target:** Automatic account scaling based on consistent performance

#### Database Schema

```sql
-- Scaling History
CREATE TABLE scaling_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    challenge_id INTEGER REFERENCES user_challenges(id),

    -- Before/After
    previous_balance DECIMAL(15,2),
    new_balance DECIMAL(15,2),
    scale_factor DECIMAL(5,2),  -- 1.40 for 40% increase

    -- Criteria Met
    consecutive_months INTEGER,
    total_profit_percent DECIMAL(10,2),
    payouts_claimed INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Implementation

**File:** `backend/services/scaling_service.py`
```python
"""
GrowthNext Scaling Service
Auto-scale funded accounts based on performance
"""

from datetime import datetime, timedelta
from decimal import Decimal
from models import db, UserChallenge, Payout, ScalingEvent

class ScalingService:
    """
    GrowthNext Scaling Logic:

    Criteria for 40% scale:
    1. 4 consecutive profitable months
    2. Accumulated 10% profit
    3. At least 2 payouts claimed
    4. Last month was profitable

    Maximum: $4,000,000 account size
    """

    MAX_ACCOUNT_SIZE = Decimal('4000000')
    SCALE_FACTOR = Decimal('1.40')  # 40% increase
    REQUIRED_MONTHS = 4
    REQUIRED_PROFIT_PERCENT = Decimal('10.0')
    REQUIRED_PAYOUTS = 2

    def check_scaling_eligibility(self, challenge):
        """Check if account is eligible for scaling"""
        if challenge.status != 'funded':
            return {'eligible': False, 'reason': 'Account not funded'}

        if challenge.current_balance >= self.MAX_ACCOUNT_SIZE:
            return {'eligible': False, 'reason': 'Maximum size reached'}

        # Check consecutive profitable months
        monthly_profits = self.get_monthly_profits(challenge, self.REQUIRED_MONTHS)

        if len(monthly_profits) < self.REQUIRED_MONTHS:
            return {
                'eligible': False,
                'reason': f'Need {self.REQUIRED_MONTHS} months of data',
                'months_completed': len(monthly_profits)
            }

        # All months must be profitable
        if not all(p > 0 for p in monthly_profits):
            return {
                'eligible': False,
                'reason': 'Not all months were profitable',
                'monthly_profits': monthly_profits
            }

        # Check total accumulated profit
        total_profit_percent = sum(monthly_profits)
        if total_profit_percent < float(self.REQUIRED_PROFIT_PERCENT):
            return {
                'eligible': False,
                'reason': f'Need {self.REQUIRED_PROFIT_PERCENT}% total profit',
                'current_profit': total_profit_percent
            }

        # Check payouts claimed
        payouts = Payout.query.filter_by(
            challenge_id=challenge.id,
            status='paid'
        ).count()

        if payouts < self.REQUIRED_PAYOUTS:
            return {
                'eligible': False,
                'reason': f'Need {self.REQUIRED_PAYOUTS} payouts claimed',
                'payouts_claimed': payouts
            }

        return {
            'eligible': True,
            'monthly_profits': monthly_profits,
            'total_profit': total_profit_percent,
            'payouts_claimed': payouts,
            'new_balance': min(
                challenge.current_balance * self.SCALE_FACTOR,
                self.MAX_ACCOUNT_SIZE
            )
        }

    def get_monthly_profits(self, challenge, months):
        """Get profit percentages for last N months"""
        from sqlalchemy import func, extract
        from models import Trade

        profits = []
        today = datetime.utcnow().date()

        for i in range(months):
            month_start = (today.replace(day=1) - timedelta(days=30*i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            monthly_pnl = db.session.query(
                func.coalesce(func.sum(Trade.pnl), 0)
            ).filter(
                Trade.challenge_id == challenge.id,
                Trade.status == 'closed',
                Trade.closed_at >= month_start,
                Trade.closed_at <= month_end
            ).scalar()

            profit_percent = (float(monthly_pnl) / float(challenge.initial_balance)) * 100
            profits.append(profit_percent)

        return profits

    def execute_scaling(self, challenge):
        """Execute account scaling"""
        eligibility = self.check_scaling_eligibility(challenge)

        if not eligibility['eligible']:
            return {'success': False, 'error': eligibility['reason']}

        new_balance = eligibility['new_balance']
        previous_balance = challenge.initial_balance

        # Log scaling event
        event = ScalingEvent(
            user_id=challenge.user_id,
            challenge_id=challenge.id,
            previous_balance=previous_balance,
            new_balance=new_balance,
            scale_factor=self.SCALE_FACTOR,
            consecutive_months=self.REQUIRED_MONTHS,
            total_profit_percent=eligibility['total_profit'],
            payouts_claimed=eligibility['payouts_claimed']
        )
        db.session.add(event)

        # Update challenge balances
        challenge.initial_balance = new_balance
        challenge.current_balance = new_balance
        challenge.highest_balance = new_balance

        db.session.commit()

        # Notify user
        from services.email_service import send_scaling_notification
        send_scaling_notification(challenge.user, previous_balance, new_balance)

        return {
            'success': True,
            'previous_balance': float(previous_balance),
            'new_balance': float(new_balance),
            'scale_factor': float(self.SCALE_FACTOR)
        }
```

---

### 2.3 Affiliate System (4-Tier)

**Target:** Multi-tier affiliate commission system

#### Database Schema

```sql
-- Affiliate Tiers
CREATE TABLE affiliate_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,           -- star, galactic, cosmic, infinity
    display_name VARCHAR(100),
    commission_rate DECIMAL(5,2),        -- 8, 12, 15, 18
    monthly_requirement DECIMAL(10,2),   -- 0, 1000, 2500, 6000
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO affiliate_tiers (name, display_name, commission_rate, monthly_requirement) VALUES
('star', 'Star', 8.00, 0),
('galactic', 'Galactic', 12.00, 1000),
('cosmic', 'Cosmic', 15.00, 2500),
('infinity', 'Infinity', 18.00, 6000);

-- User Affiliate Data
CREATE TABLE affiliates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,

    -- Tier
    tier_id INTEGER REFERENCES affiliate_tiers(id) DEFAULT 1,

    -- Tracking
    referral_code VARCHAR(20) UNIQUE,
    referral_link VARCHAR(255),

    -- Stats
    total_clicks INTEGER DEFAULT 0,
    total_signups INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0,

    -- Current Month
    current_month_earnings DECIMAL(15,2) DEFAULT 0,

    -- Payment
    payout_method VARCHAR(50),           -- paypal, crypto, bank
    payout_email VARCHAR(255),
    payout_wallet VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Referral Tracking
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER REFERENCES affiliates(id),
    referred_user_id INTEGER REFERENCES users(id),

    -- Tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    landing_page VARCHAR(255),

    -- Cookie
    cookie_id VARCHAR(100),
    cookie_expires_at TIMESTAMP,

    -- Conversion
    converted BOOLEAN DEFAULT FALSE,
    conversion_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    commission_paid BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    converted_at TIMESTAMP
);
```

#### Implementation

**File:** `backend/services/affiliate_service.py`
```python
"""
4-Tier Affiliate System
"""

from datetime import datetime, timedelta
from decimal import Decimal
from models import db, User, Affiliate, AffiliateTier, Referral, Payment
import uuid

class AffiliateService:

    COOKIE_LIFETIME_DAYS = 90

    def register_affiliate(self, user_id):
        """Register user as affiliate"""
        existing = Affiliate.query.filter_by(user_id=user_id).first()
        if existing:
            return existing

        referral_code = self.generate_referral_code(user_id)

        affiliate = Affiliate(
            user_id=user_id,
            tier_id=1,  # Start at Star tier
            referral_code=referral_code,
            referral_link=f"https://tradesense.com/?ref={referral_code}"
        )

        db.session.add(affiliate)
        db.session.commit()
        return affiliate

    def generate_referral_code(self, user_id):
        """Generate unique referral code"""
        user = User.query.get(user_id)
        base = user.username[:4].upper() if user.username else 'USER'
        unique = str(uuid.uuid4())[:4].upper()
        return f"{base}{unique}"

    def track_click(self, referral_code, ip_address, user_agent, landing_page):
        """Track affiliate link click"""
        affiliate = Affiliate.query.filter_by(referral_code=referral_code).first()

        if not affiliate:
            return None

        # Increment click count
        affiliate.total_clicks += 1

        # Create tracking record
        cookie_id = str(uuid.uuid4())
        referral = Referral(
            affiliate_id=affiliate.id,
            ip_address=ip_address,
            user_agent=user_agent,
            landing_page=landing_page,
            cookie_id=cookie_id,
            cookie_expires_at=datetime.utcnow() + timedelta(days=self.COOKIE_LIFETIME_DAYS)
        )

        db.session.add(referral)
        db.session.commit()

        return cookie_id

    def track_signup(self, new_user_id, cookie_id):
        """Track user signup from referral"""
        referral = Referral.query.filter_by(
            cookie_id=cookie_id,
            referred_user_id=None
        ).first()

        if not referral:
            return False

        if referral.cookie_expires_at < datetime.utcnow():
            return False

        referral.referred_user_id = new_user_id

        affiliate = Affiliate.query.get(referral.affiliate_id)
        affiliate.total_signups += 1

        db.session.commit()
        return True

    def process_conversion(self, payment):
        """Process affiliate commission on payment"""
        user_id = payment.user_id

        # Find referral for this user
        referral = Referral.query.filter_by(
            referred_user_id=user_id,
            converted=False
        ).first()

        if not referral:
            return None

        affiliate = Affiliate.query.get(referral.affiliate_id)
        tier = AffiliateTier.query.get(affiliate.tier_id)

        # Calculate commission
        commission_rate = Decimal(str(tier.commission_rate)) / 100
        commission = payment.amount * commission_rate

        # Update referral
        referral.converted = True
        referral.converted_at = datetime.utcnow()
        referral.conversion_amount = payment.amount
        referral.commission_amount = commission

        # Update affiliate stats
        affiliate.total_conversions += 1
        affiliate.total_earnings += commission
        affiliate.current_month_earnings += commission

        db.session.commit()

        # Check for tier upgrade
        self.check_tier_upgrade(affiliate)

        return {
            'affiliate_id': affiliate.id,
            'commission': float(commission),
            'tier': tier.name
        }

    def check_tier_upgrade(self, affiliate):
        """Check if affiliate qualifies for tier upgrade"""
        current_tier = AffiliateTier.query.get(affiliate.tier_id)
        next_tier = AffiliateTier.query.filter(
            AffiliateTier.id > affiliate.tier_id
        ).order_by(AffiliateTier.id).first()

        if not next_tier:
            return  # Already at max tier

        if affiliate.current_month_earnings >= next_tier.monthly_requirement:
            affiliate.tier_id = next_tier.id
            db.session.commit()

            # Notify affiliate of upgrade
            from services.email_service import send_tier_upgrade_email
            send_tier_upgrade_email(affiliate, next_tier)

    def reset_monthly_earnings(self):
        """Reset monthly earnings (run on 1st of each month)"""
        Affiliate.query.update({'current_month_earnings': 0})
        db.session.commit()

    def get_affiliate_dashboard(self, user_id):
        """Get affiliate dashboard data"""
        affiliate = Affiliate.query.filter_by(user_id=user_id).first()

        if not affiliate:
            return None

        tier = AffiliateTier.query.get(affiliate.tier_id)
        next_tier = AffiliateTier.query.filter(
            AffiliateTier.id > affiliate.tier_id
        ).order_by(AffiliateTier.id).first()

        # Recent referrals
        recent_referrals = Referral.query.filter_by(
            affiliate_id=affiliate.id
        ).order_by(Referral.created_at.desc()).limit(10).all()

        return {
            'affiliate': affiliate.to_dict(),
            'tier': tier.to_dict(),
            'next_tier': next_tier.to_dict() if next_tier else None,
            'progress_to_next': (
                float(affiliate.current_month_earnings) / float(next_tier.monthly_requirement) * 100
                if next_tier else 100
            ),
            'recent_referrals': [r.to_dict() for r in recent_referrals],
            'stats': {
                'clicks': affiliate.total_clicks,
                'signups': affiliate.total_signups,
                'conversions': affiliate.total_conversions,
                'conversion_rate': (
                    affiliate.total_conversions / affiliate.total_clicks * 100
                    if affiliate.total_clicks > 0 else 0
                ),
                'total_earnings': float(affiliate.total_earnings),
                'this_month': float(affiliate.current_month_earnings)
            }
        }
```

---

## Phase 3: Trading Infrastructure

### 3.1 MetaTrader Bridge Service

**Target:** Integration with MT4/MT5 Manager API

#### Implementation

**File:** `backend/services/bridge_service.py`
```python
"""
Trading Platform Bridge Service
Integrates with MT4/MT5 Manager API
"""

import socket
import struct
from datetime import datetime
from decimal import Decimal

class MTManagerAPI:
    """
    MetaTrader Manager API Client

    This requires the MT4/MT5 Manager API library
    Typically provided by MetaQuotes or third-party bridges like:
    - PrimeXM
    - oneZero
    - Gold-i
    """

    def __init__(self, server, port, login, password):
        self.server = server
        self.port = port
        self.login = login
        self.password = password
        self.connected = False

    def connect(self):
        """Connect to MT Manager"""
        # Implementation depends on specific API library
        # This is a placeholder for the actual implementation
        pass

    def disconnect(self):
        """Disconnect from MT Manager"""
        pass

    def create_account(self, user_data, group, leverage, balance):
        """
        Create new trading account

        Returns:
        {
            'login': 12345678,
            'password': 'abc123',
            'investor_password': 'xyz789',
            'server': 'TradeSense-Live'
        }
        """
        pass

    def get_account_info(self, login):
        """
        Get account information

        Returns:
        {
            'login': 12345678,
            'balance': 10000.00,
            'equity': 10250.50,
            'margin': 500.00,
            'free_margin': 9750.50,
            'margin_level': 2050.10,
            'profit': 250.50
        }
        """
        pass

    def get_open_positions(self, login):
        """Get open positions for account"""
        pass

    def get_trade_history(self, login, from_date, to_date):
        """Get closed trades history"""
        pass

    def change_group(self, login, new_group):
        """Change account group (for leverage, conditions)"""
        pass

    def change_balance(self, login, amount, comment):
        """Credit/Debit account balance"""
        pass

    def disable_account(self, login):
        """Disable trading account"""
        pass

    def enable_account(self, login):
        """Enable trading account"""
        pass


class BridgeService:
    """
    High-level bridge service for trading operations
    """

    def __init__(self):
        from flask import current_app

        self.mt_api = MTManagerAPI(
            server=current_app.config.get('MT_SERVER'),
            port=current_app.config.get('MT_PORT'),
            login=current_app.config.get('MT_MANAGER_LOGIN'),
            password=current_app.config.get('MT_MANAGER_PASSWORD')
        )

    # Account Groups
    GROUPS = {
        'trial': 'TradeSense-Trial',
        'stellar_1step_phase1': 'TradeSense-Stellar1-P1',
        'stellar_2step_phase1': 'TradeSense-Stellar2-P1',
        'stellar_2step_phase2': 'TradeSense-Stellar2-P2',
        'stellar_lite_phase1': 'TradeSense-Lite-P1',
        'stellar_lite_phase2': 'TradeSense-Lite-P2',
        'funded': 'TradeSense-Funded',
        'competition': 'TradeSense-Competition'
    }

    def create_challenge_account(self, user, challenge_model, account_size, phase=1):
        """Create trading account for challenge"""

        # Determine group
        if challenge_model.name == 'stellar_1step':
            group = self.GROUPS['stellar_1step_phase1']
        elif challenge_model.name == 'stellar_2step':
            group = self.GROUPS[f'stellar_2step_phase{phase}']
        else:
            group = self.GROUPS[f'stellar_lite_phase{phase}']

        # Parse leverage
        leverage = int(challenge_model.leverage.split(':')[1])

        # Create account
        account = self.mt_api.create_account(
            user_data={
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'country': user.country
            },
            group=group,
            leverage=leverage,
            balance=float(account_size.balance)
        )

        return account

    def create_funded_account(self, user, challenge):
        """Create funded trading account"""

        account = self.mt_api.create_account(
            user_data={
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'country': user.country
            },
            group=self.GROUPS['funded'],
            leverage=100,
            balance=float(challenge.initial_balance)
        )

        return account

    def get_account_equity(self, login):
        """Get current account equity"""
        info = self.mt_api.get_account_info(login)
        return Decimal(str(info['equity']))

    def get_account_balance(self, login):
        """Get current account balance"""
        info = self.mt_api.get_account_info(login)
        return Decimal(str(info['balance']))

    def sync_trades(self, challenge):
        """Sync trades from MT to database"""
        from models import Trade

        # Get trades from MT
        trades = self.mt_api.get_trade_history(
            login=challenge.trading_login,
            from_date=challenge.start_date,
            to_date=datetime.utcnow()
        )

        for mt_trade in trades:
            # Check if trade already exists
            existing = Trade.query.filter_by(
                challenge_id=challenge.id,
                external_id=mt_trade['ticket']
            ).first()

            if not existing:
                trade = Trade(
                    challenge_id=challenge.id,
                    external_id=mt_trade['ticket'],
                    symbol=mt_trade['symbol'],
                    trade_type='buy' if mt_trade['type'] == 0 else 'sell',
                    quantity=mt_trade['volume'],
                    entry_price=mt_trade['open_price'],
                    exit_price=mt_trade['close_price'],
                    pnl=mt_trade['profit'],
                    status='closed',
                    opened_at=mt_trade['open_time'],
                    closed_at=mt_trade['close_time']
                )
                db.session.add(trade)

        db.session.commit()

    def disable_trading(self, login):
        """Disable trading on breach"""
        self.mt_api.disable_account(login)

    def process_payout(self, challenge, amount):
        """Deduct payout from trading account"""
        self.mt_api.change_balance(
            login=challenge.trading_login,
            amount=-float(amount),
            comment=f"Payout withdrawal"
        )
```

---

## Phase 4: Payment Infrastructure

### 4.1 Multi-Gateway Payment System

#### Database Schema

```sql
-- Payment Gateways
CREATE TABLE payment_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    type VARCHAR(20),              -- card, crypto, wallet, local

    -- Configuration (encrypted)
    config JSONB,

    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    countries_allowed TEXT[],      -- NULL = all
    countries_blocked TEXT[],

    -- Time restrictions
    available_from TIME,
    available_until TIME,
    timezone VARCHAR(50),

    -- Fees
    fee_percent DECIMAL(5,2) DEFAULT 0,
    fee_fixed DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO payment_gateways (name, display_name, type) VALUES
('stripe', 'Credit/Debit Card', 'card'),
('paypal', 'PayPal', 'wallet'),
('coinbase', 'Cryptocurrency', 'crypto'),
('upi', 'UPI (India)', 'local'),
('tc_pay', 'TC Pay', 'local');
```

#### Implementation

**File:** `backend/services/payment_orchestrator.py`
```python
"""
Payment Orchestrator - Multi-Gateway Support
"""

from abc import ABC, abstractmethod
from datetime import datetime, time
import pytz

class PaymentGateway(ABC):
    @abstractmethod
    def create_payment(self, amount, currency, metadata):
        pass

    @abstractmethod
    def verify_payment(self, payment_id):
        pass

    @abstractmethod
    def process_webhook(self, payload, signature):
        pass


class StripeGateway(PaymentGateway):
    def __init__(self, api_key):
        import stripe
        stripe.api_key = api_key
        self.stripe = stripe

    def create_payment(self, amount, currency, metadata):
        session = self.stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'unit_amount': int(amount * 100),
                    'product_data': {
                        'name': metadata.get('product_name', 'Challenge')
                    }
                },
                'quantity': 1
            }],
            mode='payment',
            success_url=metadata.get('success_url'),
            cancel_url=metadata.get('cancel_url'),
            metadata=metadata
        )
        return {'session_id': session.id, 'url': session.url}


class CryptoGateway(PaymentGateway):
    def __init__(self, api_key):
        self.api_key = api_key
        self.supported_coins = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'LTC', 'DOGE']

    def create_payment(self, amount, currency, metadata):
        # Integration with Coinbase Commerce or similar
        pass


class PaymentOrchestrator:
    """
    Central payment orchestrator
    Routes payments to appropriate gateway based on:
    - User's country
    - Selected payment method
    - Time of day (for gated methods like UPI)
    """

    def __init__(self):
        self.gateways = {}
        self._init_gateways()

    def _init_gateways(self):
        from flask import current_app

        self.gateways['stripe'] = StripeGateway(
            current_app.config.get('STRIPE_SECRET_KEY')
        )
        self.gateways['paypal'] = PayPalGateway(
            current_app.config.get('PAYPAL_CLIENT_ID'),
            current_app.config.get('PAYPAL_SECRET')
        )
        self.gateways['crypto'] = CryptoGateway(
            current_app.config.get('COINBASE_API_KEY')
        )

    def get_available_gateways(self, country_code):
        """Get available payment methods for country"""
        from models import PaymentGatewayConfig

        available = []
        configs = PaymentGatewayConfig.query.filter_by(is_active=True).all()

        for config in configs:
            # Check country restrictions
            if config.countries_blocked and country_code in config.countries_blocked:
                continue
            if config.countries_allowed and country_code not in config.countries_allowed:
                continue

            # Check time restrictions
            if config.available_from and config.available_until:
                tz = pytz.timezone(config.timezone or 'UTC')
                now = datetime.now(tz).time()
                if not (config.available_from <= now <= config.available_until):
                    continue

            available.append({
                'id': config.name,
                'name': config.display_name,
                'type': config.type,
                'fee': float(config.fee_percent)
            })

        return available

    def create_payment(self, gateway_name, amount, currency, metadata):
        """Create payment through specified gateway"""
        if gateway_name not in self.gateways:
            raise ValueError(f"Unknown gateway: {gateway_name}")

        gateway = self.gateways[gateway_name]
        return gateway.create_payment(amount, currency, metadata)

    def process_webhook(self, gateway_name, payload, signature):
        """Process webhook from gateway"""
        if gateway_name not in self.gateways:
            return False

        gateway = self.gateways[gateway_name]
        return gateway.process_webhook(payload, signature)
```

---

## Phase 5: Gamification & Retention

### 5.1 Certificate Generation System

**File:** `backend/services/certificate_service.py`
```python
"""
Certificate Generation Service
Generates PDF certificates for achievements
"""

from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from PIL import Image

class CertificateService:

    CERTIFICATE_TYPES = {
        'elite_trader': {
            'title': 'Elite Trader Certificate',
            'description': 'Successfully completed Phase 1 Evaluation',
            'template': 'templates/certificates/elite.png'
        },
        'crown_trader': {
            'title': 'Crown Trader Certificate',
            'description': 'Achieved first payout as a Funded Trader',
            'template': 'templates/certificates/crown.png'
        },
        'max_allocation': {
            'title': 'Maximum Allocation Certificate',
            'description': 'Reached $300,000 in active funding',
            'template': 'templates/certificates/max.png'
        }
    }

    def generate_certificate(self, user, certificate_type, challenge=None):
        """Generate PDF certificate"""
        if certificate_type not in self.CERTIFICATE_TYPES:
            raise ValueError(f"Unknown certificate type: {certificate_type}")

        config = self.CERTIFICATE_TYPES[certificate_type]

        # Create PDF
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(A4))
        width, height = landscape(A4)

        # Load template background
        # p.drawImage(config['template'], 0, 0, width, height)

        # Add gold background
        p.setFillColor(HexColor('#1a1a2e'))
        p.rect(0, 0, width, height, fill=True)

        # Add border
        p.setStrokeColor(HexColor('#d4af37'))
        p.setLineWidth(3)
        p.rect(20, 20, width-40, height-40)

        # Title
        p.setFillColor(HexColor('#d4af37'))
        p.setFont('Helvetica-Bold', 36)
        p.drawCentredString(width/2, height - 100, config['title'])

        # This certifies that
        p.setFillColor(HexColor('#ffffff'))
        p.setFont('Helvetica', 16)
        p.drawCentredString(width/2, height - 160, 'This certifies that')

        # User name
        p.setFillColor(HexColor('#d4af37'))
        p.setFont('Helvetica-Bold', 28)
        p.drawCentredString(width/2, height - 200, f"{user.first_name} {user.last_name}")

        # Description
        p.setFillColor(HexColor('#ffffff'))
        p.setFont('Helvetica', 14)
        p.drawCentredString(width/2, height - 250, config['description'])

        # Date
        p.setFont('Helvetica', 12)
        p.drawCentredString(width/2, height - 300,
            f"Issued on {datetime.utcnow().strftime('%B %d, %Y')}")

        # Certificate ID
        cert_id = f"CERT-{user.id}-{certificate_type.upper()}-{datetime.utcnow().strftime('%Y%m%d')}"
        p.drawCentredString(width/2, 50, f"Certificate ID: {cert_id}")

        p.showPage()
        p.save()

        buffer.seek(0)
        return buffer, cert_id

    def check_and_award_certificates(self, user, challenge):
        """Check if user qualifies for any new certificates"""
        from models import UserCertificate

        awarded = []

        # Elite Trader - Passed Phase 1
        if challenge.phase == 'verification' and challenge.status == 'active':
            if not UserCertificate.query.filter_by(
                user_id=user.id,
                type='elite_trader'
            ).first():
                self._award_certificate(user, 'elite_trader', challenge)
                awarded.append('elite_trader')

        # Crown Trader - First Payout
        from models import Payout
        payouts = Payout.query.filter_by(user_id=user.id, status='paid').count()
        if payouts == 1:
            if not UserCertificate.query.filter_by(
                user_id=user.id,
                type='crown_trader'
            ).first():
                self._award_certificate(user, 'crown_trader', challenge)
                awarded.append('crown_trader')

        # Max Allocation - $300k funding
        total_funding = db.session.query(
            func.sum(UserChallenge.initial_balance)
        ).filter(
            UserChallenge.user_id == user.id,
            UserChallenge.status == 'funded'
        ).scalar() or 0

        if total_funding >= 300000:
            if not UserCertificate.query.filter_by(
                user_id=user.id,
                type='max_allocation'
            ).first():
                self._award_certificate(user, 'max_allocation', challenge)
                awarded.append('max_allocation')

        return awarded

    def _award_certificate(self, user, cert_type, challenge):
        """Award and store certificate"""
        from models import UserCertificate

        # Generate PDF
        pdf_buffer, cert_id = self.generate_certificate(user, cert_type, challenge)

        # Store certificate record
        cert = UserCertificate(
            user_id=user.id,
            type=cert_type,
            certificate_id=cert_id,
            challenge_id=challenge.id if challenge else None
        )
        db.session.add(cert)
        db.session.commit()

        # Store PDF (S3 or local)
        self._store_pdf(cert_id, pdf_buffer)

        # Notify user
        from services.email_service import send_certificate_email
        send_certificate_email(user, cert_type, cert_id)
```

---

## Implementation Priority Order

### Week 1-2: Core Challenge Infrastructure
1. ✅ Multi-model challenge database schema
2. ✅ Balance-based drawdown engine
3. ✅ Daily snapshot system
4. ✅ Model-specific rule enforcement

### Week 3-4: Payment & KYC
1. Payment orchestrator with multi-gateway
2. Stripe integration
3. Crypto payment integration
4. KYC service with Sumsub
5. Deferred verification workflow

### Week 5-6: Competition System
1. Competition database models
2. Registration and provisioning
3. Real-time leaderboard
4. Prize distribution

### Week 7-8: Scaling & Affiliates
1. GrowthNext scaling logic
2. 4-tier affiliate system
3. Referral tracking
4. Commission processing

### Week 9-10: Trading Infrastructure
1. MT Manager API integration
2. Bridge service
3. Trade synchronization
4. Account group management

### Week 11-12: Gamification & Polish
1. Certificate generation
2. Achievement system
3. Email notifications
4. Dashboard enhancements

---

## Technical Debt to Address

1. **Current simulated trading** → Real MT4/MT5 integration
2. **Single payment gateway** → Multi-gateway orchestrator
3. **No KYC** → Full identity verification
4. **Basic leaderboard** → Real-time competition leaderboard
5. **Fixed challenge rules** → Configurable challenge models
6. **No affiliate system** → 4-tier commission structure

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Challenge Models | 1 | 3+ |
| Payment Gateways | 1 (PayPal) | 5+ |
| Max Account Size | $100k | $4M |
| Payout Speed | Manual | 24h Guarantee |
| KYC | None | Full Verification |
| Affiliate Tiers | None | 4 Tiers |
| Competitions | None | Monthly |

---

*This upgrade plan transforms TradeSense into a full-featured prop trading platform matching FundedNext's capabilities.*
