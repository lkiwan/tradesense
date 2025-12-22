"""
Challenge Engine - The "Killer" Logic
Evaluates user trading performance against prop firm rules
Supports 2-phase system: Evaluation → Verification → Funded
"""

from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import func
from flask import current_app
from models import db, UserChallenge, Trade


class ChallengeEngine:
    """
    The heart of the Prop Firm - evaluates challenges against rules:
    - Trial: 10% target, same rules as evaluation
    - Phase 1 (Evaluation): 10% profit target
    - Phase 2 (Verification): 5% profit target
    - Funded: No target, just maintain loss limits

    Loss limits for all phases:
    - Max Daily Loss: 5%
    - Max Total Loss: 10%
    """

    def get_phase_rules(self, phase: str) -> dict:
        """Get rules for specific phase from config"""
        try:
            phase_rules = current_app.config.get('PHASE_RULES', {})
            return phase_rules.get(phase, {
                'profit_target': 0.10,
                'max_loss': 0.10,
                'daily_loss': 0.05
            })
        except RuntimeError:
            # Outside app context, use defaults
            defaults = {
                'trial': {'profit_target': 0.10, 'max_loss': 0.10, 'daily_loss': 0.05},
                'evaluation': {'profit_target': 0.10, 'max_loss': 0.10, 'daily_loss': 0.05},
                'verification': {'profit_target': 0.05, 'max_loss': 0.10, 'daily_loss': 0.05},
                'funded': {'profit_target': None, 'max_loss': 0.10, 'daily_loss': 0.05}
            }
            return defaults.get(phase, defaults['evaluation'])

    def evaluate_challenge(self, challenge: UserChallenge) -> dict:
        """
        Evaluate a challenge against phase-specific rules
        Returns: dict with status and details
        """
        if challenge.status not in ['active', 'funded']:
            return {
                'status': challenge.status,
                'message': f'Challenge already {challenge.status}',
                'changed': False
            }

        initial = challenge.initial_balance
        current = challenge.current_balance
        highest = challenge.highest_balance
        phase = challenge.phase or 'evaluation'
        rules = self.get_phase_rules(phase)

        # Calculate metrics
        total_pnl_pct = (current - initial) / initial
        max_drawdown_pct = (highest - current) / highest if highest > 0 else Decimal('0')
        daily_pnl_pct = self._calculate_daily_pnl_percentage(challenge)

        profit_target = Decimal(str(rules['profit_target'])) if rules['profit_target'] else None
        max_loss = Decimal(str(rules['max_loss']))
        daily_loss = Decimal(str(rules['daily_loss']))

        result = {
            'status': challenge.status,
            'phase': phase,
            'message': 'Challenge is ongoing',
            'changed': False,
            'metrics': {
                'total_pnl_percentage': float(total_pnl_pct * 100),
                'max_drawdown_percentage': float(max_drawdown_pct * 100),
                'daily_pnl_percentage': float(daily_pnl_pct * 100),
                'current_balance': float(current),
                'initial_balance': float(initial),
                'highest_balance': float(highest),
                'profit_target': float(profit_target * 100) if profit_target else None,
                'progress_to_target': float(total_pnl_pct / profit_target * 100) if profit_target else None
            }
        }

        # For funded accounts, track profits but don't check target
        if phase == 'funded':
            # Update profit tracking for funded accounts
            if total_pnl_pct > 0:
                profit = current - initial
                challenge.total_profit_earned = max(challenge.total_profit_earned or 0, profit)
                challenge.withdrawable_profit = profit * Decimal('0.80')  # 80% to trader
                db.session.commit()

        # Rule 1: Check Profit Target (if applicable)
        if profit_target and total_pnl_pct >= profit_target:
            return self._handle_phase_completion(challenge, result, rules)

        # Rule 2: Check Max Total Loss
        total_loss_pct = (initial - current) / initial
        if total_loss_pct >= max_loss:
            return self._handle_failure(challenge, result, 'max_total_loss',
                f'Maximum total loss of {int(max_loss * 100)}% exceeded')

        # Rule 3: Check Max Daily Loss
        if daily_pnl_pct <= -daily_loss:
            return self._handle_failure(challenge, result, 'max_daily_loss',
                f'Maximum daily loss of {int(daily_loss * 100)}% exceeded')

        return result

    def _handle_phase_completion(self, challenge: UserChallenge, result: dict, rules: dict) -> dict:
        """Handle successful phase completion with transition logic"""
        phase = challenge.phase

        if phase == 'trial':
            # Trial passed - advance to Phase 1 (Evaluation)
            challenge.status = 'passed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()

            # Create new evaluation challenge
            new_challenge = self._create_next_phase_challenge(challenge, 'evaluation')

            result.update({
                'status': 'passed',
                'message': 'Trial completed! Advancing to Phase 1: Evaluation',
                'next_phase': 'evaluation',
                'new_challenge_id': new_challenge.id if new_challenge else None,
                'changed': True
            })

        elif phase == 'evaluation':
            # Phase 1 passed - advance to Phase 2 (Verification)
            challenge.status = 'passed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()

            # Create verification challenge
            new_challenge = self._create_next_phase_challenge(challenge, 'verification')

            result.update({
                'status': 'passed',
                'message': 'Phase 1 completed! Advancing to Phase 2: Verification',
                'next_phase': 'verification',
                'new_challenge_id': new_challenge.id if new_challenge else None,
                'changed': True
            })

        elif phase == 'verification':
            # Phase 2 passed - User is now FUNDED!
            challenge.status = 'passed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()

            # Create funded account
            funded_challenge = self._create_funded_account(challenge)

            result.update({
                'status': 'funded',
                'message': 'Congratulations! You are now a Funded Trader!',
                'next_phase': 'funded',
                'new_challenge_id': funded_challenge.id if funded_challenge else None,
                'changed': True
            })

        return result

    def _handle_failure(self, challenge: UserChallenge, result: dict,
                       failure_type: str, message: str) -> dict:
        """Handle challenge failure"""
        phase = challenge.phase

        if phase == 'funded':
            # Funded account failure - reset to Phase 1
            challenge.status = 'failed'
            challenge.failure_reason = message
            challenge.end_date = datetime.utcnow()
            challenge.is_funded = False
            db.session.commit()

            result.update({
                'status': 'failed',
                'message': f'Funded account failed: {message}. You can repurchase a challenge.',
                'failure_reason': failure_type,
                'changed': True
            })
        else:
            # Regular phase failure
            challenge.status = 'failed'
            challenge.failure_reason = message
            challenge.end_date = datetime.utcnow()
            db.session.commit()

            result.update({
                'status': 'failed',
                'message': f'Challenge failed: {message}',
                'failure_reason': failure_type,
                'changed': True
            })

        return result

    def _create_next_phase_challenge(self, current_challenge: UserChallenge, next_phase: str) -> UserChallenge:
        """Create a new challenge for the next phase"""
        rules = self.get_phase_rules(next_phase)

        # Get plan balance from config
        try:
            plans = current_app.config.get('PLANS', {})
            plan_data = plans.get(current_challenge.plan_type, {})
            initial_balance = plan_data.get('initial_balance', 5000)
        except RuntimeError:
            initial_balance = float(current_challenge.initial_balance)

        new_challenge = UserChallenge(
            user_id=current_challenge.user_id,
            plan_type=current_challenge.plan_type,
            initial_balance=Decimal(str(initial_balance)),
            current_balance=Decimal(str(initial_balance)),
            highest_balance=Decimal(str(initial_balance)),
            status='active',
            phase=next_phase,
            profit_target=rules['profit_target'],
            is_trial=False,
            is_funded=False,
            subscription_id=current_challenge.subscription_id
        )

        db.session.add(new_challenge)
        db.session.commit()

        return new_challenge

    def _create_funded_account(self, current_challenge: UserChallenge) -> UserChallenge:
        """Create a funded trading account"""
        # Get plan balance from config
        try:
            plans = current_app.config.get('PLANS', {})
            plan_data = plans.get(current_challenge.plan_type, {})
            initial_balance = plan_data.get('initial_balance', 5000)
        except RuntimeError:
            initial_balance = float(current_challenge.initial_balance)

        funded_challenge = UserChallenge(
            user_id=current_challenge.user_id,
            plan_type=current_challenge.plan_type,
            initial_balance=Decimal(str(initial_balance)),
            current_balance=Decimal(str(initial_balance)),
            highest_balance=Decimal(str(initial_balance)),
            status='funded',
            phase='funded',
            profit_target=None,  # No target for funded
            is_trial=False,
            is_funded=True,
            total_profit_earned=Decimal('0'),
            withdrawable_profit=Decimal('0'),
            subscription_id=current_challenge.subscription_id
        )

        db.session.add(funded_challenge)
        db.session.commit()

        return funded_challenge

    def _calculate_daily_pnl_percentage(self, challenge: UserChallenge) -> Decimal:
        """Calculate today's PnL percentage based on closed trades"""
        today = date.today()

        # Get today's closed trades
        daily_pnl = db.session.query(
            func.coalesce(func.sum(Trade.pnl), 0)
        ).filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed',
            func.date(Trade.closed_at) == today
        ).scalar()

        if daily_pnl is None or challenge.initial_balance == 0:
            return Decimal('0')

        return Decimal(str(daily_pnl)) / challenge.initial_balance

    def get_challenge_stats(self, challenge: UserChallenge) -> dict:
        """Get comprehensive statistics for a challenge"""
        phase = challenge.phase or 'evaluation'
        rules = self.get_phase_rules(phase)

        # Total trades
        total_trades = Trade.query.filter_by(challenge_id=challenge.id).count()
        open_trades = Trade.query.filter_by(challenge_id=challenge.id, status='open').count()
        closed_trades = Trade.query.filter_by(challenge_id=challenge.id, status='closed').count()

        # Winning/Losing trades
        winning_trades = Trade.query.filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed',
            Trade.pnl > 0
        ).count()

        losing_trades = Trade.query.filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed',
            Trade.pnl < 0
        ).count()

        # Win rate
        win_rate = (winning_trades / closed_trades * 100) if closed_trades > 0 else 0

        # Total PnL
        total_pnl = db.session.query(
            func.coalesce(func.sum(Trade.pnl), 0)
        ).filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed'
        ).scalar()

        # Average win/loss
        avg_win = db.session.query(
            func.coalesce(func.avg(Trade.pnl), 0)
        ).filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed',
            Trade.pnl > 0
        ).scalar()

        avg_loss = db.session.query(
            func.coalesce(func.avg(Trade.pnl), 0)
        ).filter(
            Trade.challenge_id == challenge.id,
            Trade.status == 'closed',
            Trade.pnl < 0
        ).scalar()

        # Most traded symbols
        popular_symbols = db.session.query(
            Trade.symbol,
            func.count(Trade.id).label('count')
        ).filter(
            Trade.challenge_id == challenge.id
        ).group_by(Trade.symbol).order_by(
            func.count(Trade.id).desc()
        ).limit(5).all()

        # Calculate remaining margins based on phase rules
        initial = float(challenge.initial_balance)
        current = float(challenge.current_balance)
        max_loss = rules['max_loss']
        daily_loss = rules['daily_loss']
        profit_target = rules['profit_target']

        remaining_daily_loss = initial * daily_loss + float(self._calculate_daily_pnl_percentage(challenge) * challenge.initial_balance)
        remaining_total_loss = current - (initial * (1 - max_loss))

        if profit_target:
            needed_for_target = (initial * (1 + profit_target)) - current
        else:
            needed_for_target = None  # Funded accounts have no target

        return {
            'trades': {
                'total': total_trades,
                'open': open_trades,
                'closed': closed_trades,
                'winning': winning_trades,
                'losing': losing_trades,
                'win_rate': round(win_rate, 2)
            },
            'pnl': {
                'total': float(total_pnl or 0),
                'average_win': float(avg_win or 0),
                'average_loss': float(avg_loss or 0),
                'profit_factor': round(abs(float(avg_win or 0) / float(avg_loss or 1)), 2) if avg_loss else 0
            },
            'risk': {
                'remaining_daily_loss': round(remaining_daily_loss, 2),
                'remaining_total_loss': round(remaining_total_loss, 2),
                'needed_for_target': round(needed_for_target, 2) if needed_for_target else None
            },
            'popular_symbols': [
                {'symbol': s[0], 'count': s[1]} for s in popular_symbols
            ],
            'balance': {
                'initial': initial,
                'current': current,
                'highest': float(challenge.highest_balance),
                'profit_percentage': challenge.profit_percentage
            },
            'phase': {
                'current': phase,
                'display': challenge.phase_display,
                'profit_target': profit_target * 100 if profit_target else None,
                'progress': challenge.progress_to_target,
                'is_funded': challenge.is_funded
            },
            'funded': {
                'total_profit_earned': float(challenge.total_profit_earned or 0),
                'withdrawable_profit': float(challenge.withdrawable_profit or 0),
                'platform_fee': float((challenge.total_profit_earned or 0) * Decimal('0.20'))
            } if challenge.is_funded else None
        }

    def check_after_trade(self, trade: Trade) -> dict:
        """
        Called after every trade to check rules
        This is the background task trigger
        """
        challenge = UserChallenge.query.get(trade.challenge_id)
        if not challenge:
            return {'error': 'Challenge not found'}

        return self.evaluate_challenge(challenge)

    def get_user_journey_status(self, user_id: int) -> dict:
        """Get user's current position in the trading journey"""
        # Get active challenge
        active_challenge = UserChallenge.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        # Get funded challenge
        funded_challenge = UserChallenge.query.filter_by(
            user_id=user_id,
            status='funded'
        ).first()

        # Get all challenges for history
        all_challenges = UserChallenge.query.filter_by(
            user_id=user_id
        ).order_by(UserChallenge.start_date.desc()).all()

        current_challenge = funded_challenge or active_challenge

        return {
            'has_active_challenge': active_challenge is not None,
            'is_funded': funded_challenge is not None,
            'current_challenge': current_challenge.to_dict() if current_challenge else None,
            'current_phase': current_challenge.phase if current_challenge else None,
            'journey_history': [c.to_dict() for c in all_challenges],
            'can_start_trial': not any(c.is_trial for c in all_challenges),
            'can_access_dashboard': current_challenge is not None
        }
