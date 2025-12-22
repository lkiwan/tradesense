from datetime import datetime, timedelta
from decimal import Decimal
from . import db


class UserChallenge(db.Model):
    __tablename__ = 'user_challenges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Challenge Model Reference (new multi-model system)
    model_id = db.Column(db.Integer, db.ForeignKey('challenge_models.id'), nullable=True)
    account_size_id = db.Column(db.Integer, db.ForeignKey('account_sizes.id'), nullable=True)

    # Legacy field for backwards compatibility
    plan_type = db.Column(db.String(20), nullable=True)  # starter, pro, elite, trial (deprecated)

    initial_balance = db.Column(db.Numeric(15, 2), nullable=False)
    current_balance = db.Column(db.Numeric(15, 2), nullable=False)
    highest_balance = db.Column(db.Numeric(15, 2), nullable=False)  # For drawdown calculation
    status = db.Column(db.String(20), default='active')  # active, passed, failed, expired, funded
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, default=None)
    failure_reason = db.Column(db.String(100), default=None)

    # Phase system (FTMO style)
    phase = db.Column(db.String(20), default='evaluation')  # trial, evaluation, verification, funded
    current_phase_number = db.Column(db.Integer, default=1)  # 1 or 2
    profit_target = db.Column(db.Float, default=0.10)  # Dynamic based on model
    is_funded = db.Column(db.Boolean, default=False)

    # Funded account fields
    total_profit_earned = db.Column(db.Numeric(15, 2), default=0)  # Lifetime profit
    withdrawable_profit = db.Column(db.Numeric(15, 2), default=0)  # Available for withdrawal
    profit_split = db.Column(db.Numeric(5, 2), default=80.00)  # Current profit split %

    # Trading account (for MT4/MT5 integration)
    trading_login = db.Column(db.Integer, nullable=True)  # MT4/MT5 login
    trading_password = db.Column(db.String(100), nullable=True)  # Encrypted
    trading_server = db.Column(db.String(100), nullable=True)

    # Trial fields
    is_trial = db.Column(db.Boolean, default=False)
    trial_expires_at = db.Column(db.DateTime, default=None)

    # Subscription reference (for trial-to-paid tracking)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), default=None)

    # Trading days tracking
    trading_days = db.Column(db.Integer, default=0)
    last_trading_day = db.Column(db.Date, nullable=True)

    # Relationships
    trades = db.relationship('Trade', backref='challenge', lazy=True)
    payouts = db.relationship('Payout', backref='challenge', lazy=True)
    account_size = db.relationship('AccountSize', foreign_keys=[account_size_id])

    @property
    def profit_percentage(self):
        """Calculate profit percentage"""
        if self.initial_balance == 0:
            return 0
        return float((self.current_balance - self.initial_balance) / self.initial_balance * 100)

    @property
    def total_drawdown(self):
        """Calculate total drawdown from initial balance"""
        if self.initial_balance == 0:
            return 0
        return float((self.initial_balance - self.current_balance) / self.initial_balance * 100)

    @property
    def max_drawdown(self):
        """Calculate max drawdown from highest balance"""
        if self.highest_balance == 0:
            return 0
        return float((self.highest_balance - self.current_balance) / self.highest_balance * 100)

    @property
    def is_trial_expired(self):
        """Check if trial has expired"""
        if not self.is_trial or not self.trial_expires_at:
            return False
        return datetime.utcnow() > self.trial_expires_at

    @property
    def trial_days_remaining(self):
        """Get remaining trial days"""
        if not self.is_trial or not self.trial_expires_at:
            return None
        remaining = self.trial_expires_at - datetime.utcnow()
        return max(0, remaining.days)

    @property
    def progress_to_target(self):
        """Calculate progress towards profit target as percentage"""
        if not self.profit_target or self.profit_target == 0:
            return 0
        return min(100, max(0, (self.profit_percentage / (self.profit_target * 100)) * 100))

    @property
    def phase_display(self):
        """Get display name for current phase"""
        phases = {
            'trial': 'Essai Gratuit',
            'evaluation': 'Phase 1: Evaluation',
            'verification': 'Phase 2: Verification',
            'funded': 'Compte Funde'
        }
        return phases.get(self.phase, self.phase)

    @property
    def model_name(self):
        """Get challenge model name"""
        if self.challenge_model:
            return self.challenge_model.display_name
        return self.plan_type or 'Standard'

    @property
    def max_daily_loss_limit(self):
        """Get max daily loss limit based on model"""
        if self.challenge_model:
            return float(self.challenge_model.max_daily_loss)
        return 5.0  # Default 5%

    @property
    def max_overall_loss_limit(self):
        """Get max overall loss limit based on model"""
        if self.challenge_model:
            return float(self.challenge_model.max_overall_loss)
        return 10.0  # Default 10%

    @property
    def min_trading_days_required(self):
        """Get minimum trading days required for current phase"""
        if self.challenge_model:
            if self.current_phase_number == 1:
                return self.challenge_model.phase1_min_days
            elif self.current_phase_number == 2:
                return self.challenge_model.phase2_min_days
        return 0

    @property
    def has_met_trading_days(self):
        """Check if minimum trading days requirement is met"""
        return self.trading_days >= self.min_trading_days_required

    def get_rules(self):
        """Get all trading rules for this challenge"""
        if self.challenge_model:
            return self.challenge_model.get_rules_dict()
        # Default rules
        return {
            'phases': 2,
            'phase1_target': '10%',
            'phase2_target': '5%',
            'max_daily_loss': '5%',
            'max_overall_loss': '10%',
            'leverage': '1:100',
            'profit_split': '80%'
        }

    def to_dict(self):
        """Convert challenge to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            # Model info
            'model_id': self.model_id,
            'model_name': self.model_name,
            'account_size_id': self.account_size_id,
            'plan_type': self.plan_type,  # Legacy
            # Balances
            'initial_balance': float(self.initial_balance),
            'current_balance': float(self.current_balance),
            'highest_balance': float(self.highest_balance),
            'profit_percentage': self.profit_percentage,
            'total_drawdown': self.total_drawdown,
            'max_drawdown': self.max_drawdown,
            # Status
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'failure_reason': self.failure_reason,
            # Phase system
            'phase': self.phase,
            'phase_display': self.phase_display,
            'current_phase_number': self.current_phase_number,
            'profit_target': self.profit_target,
            'progress_to_target': self.progress_to_target,
            'is_funded': self.is_funded,
            # Profit tracking
            'total_profit_earned': float(self.total_profit_earned) if self.total_profit_earned else 0,
            'withdrawable_profit': float(self.withdrawable_profit) if self.withdrawable_profit else 0,
            'profit_split': float(self.profit_split) if self.profit_split else 80.0,
            # Trading days
            'trading_days': self.trading_days,
            'min_trading_days': self.min_trading_days_required,
            'has_met_trading_days': self.has_met_trading_days,
            # Risk limits
            'max_daily_loss_limit': self.max_daily_loss_limit,
            'max_overall_loss_limit': self.max_overall_loss_limit,
            # Trial fields
            'is_trial': self.is_trial,
            'trial_expires_at': self.trial_expires_at.isoformat() if self.trial_expires_at else None,
            'is_trial_expired': self.is_trial_expired,
            'trial_days_remaining': self.trial_days_remaining,
            'subscription_id': self.subscription_id,
            # Trading account
            'trading_login': self.trading_login,
            'trading_server': self.trading_server
        }

        # Include model details if available
        if self.challenge_model:
            data['model'] = {
                'name': self.challenge_model.name,
                'display_name': self.challenge_model.display_name,
                'phases': self.challenge_model.phases,
                'leverage': self.challenge_model.leverage
            }
            data['rules'] = self.get_rules()

        return data

    def __repr__(self):
        return f'<UserChallenge {self.id} - {self.status}>'
