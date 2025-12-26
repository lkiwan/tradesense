"""
Admin Challenge Management Routes
Provides endpoints for admins to manage user challenges
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_

from models import db, User, UserChallenge, Trade, ChallengeModel, AccountSize
from utils.decorators import permission_required, any_permission_required, superadmin_required
from services.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)

admin_challenges_bp = Blueprint('admin_challenges', __name__, url_prefix='/api/admin/challenges')


@admin_challenges_bp.route('', methods=['GET'])
@permission_required('view_challenges')
def get_challenges():
    """Get all challenges with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        phase = request.args.get('phase', '')
        date_range = request.args.get('dateRange', '30d')

        query = UserChallenge.query.join(User).join(ChallengeModel)

        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )

        # Status filter
        if status:
            query = query.filter(UserChallenge.status == status)

        # Phase filter
        if phase:
            if phase == 'funded':
                query = query.filter(UserChallenge.is_funded == True)
            else:
                query = query.filter(UserChallenge.phase == int(phase))

        # Date range filter
        if date_range != 'all':
            days = {'7d': 7, '30d': 30, '90d': 90}.get(date_range, 30)
            filter_start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(UserChallenge.start_date >= filter_start_date)

        # Order by most recent
        query = query.order_by(UserChallenge.start_date.desc())

        # Paginate
        total = query.count()
        challenges = query.offset((page - 1) * limit).limit(limit).all()

        # Format response
        challenges_data = []
        for ch in challenges:
            user = ch.user
            model = ch.challenge_model

            # Calculate profit
            profit = ch.current_balance - ch.initial_balance if ch.current_balance and ch.initial_balance else 0
            profit_percent = (profit / ch.initial_balance * 100) if ch.initial_balance else 0

            # Get trade count
            trades_count = Trade.query.filter_by(challenge_id=ch.id).count()

            challenges_data.append({
                'id': ch.id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'model': {
                    'name': model.name if model else 'Unknown',
                    'display_name': model.display_name if model else 'Unknown'
                },
                'status': ch.status,
                'phase': 'funded' if ch.is_funded else ch.phase,
                'current_balance': ch.current_balance,
                'profit': profit,
                'profit_percent': round(profit_percent, 2),
                'max_drawdown': ch.max_drawdown or 0,
                'trades_count': trades_count,
                'start_date': ch.start_date.isoformat() if ch.start_date else None,
                'end_date': ch.end_date.isoformat() if ch.end_date else None
            })

        return jsonify({
            'challenges': challenges_data,
            'total': total,
            'page': page,
            'limit': limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/stats', methods=['GET'])
@permission_required('view_challenges')
def get_challenge_stats():
    """Get challenge statistics"""
    try:
        total = UserChallenge.query.count()
        active = UserChallenge.query.filter_by(status='active').count()
        passed = UserChallenge.query.filter_by(status='passed').count()
        failed = UserChallenge.query.filter_by(status='failed').count()
        funded = UserChallenge.query.filter_by(is_funded=True).count()

        return jsonify({
            'total': total,
            'active': active,
            'passed': passed,
            'failed': failed,
            'funded': funded
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/models', methods=['GET'])
@permission_required('view_challenges')
def get_challenge_models():
    """Get all challenge models with account sizes for dropdown selection"""
    try:
        models = ChallengeModel.query.filter_by(is_active=True).order_by(ChallengeModel.display_order).all()

        return jsonify({
            'models': [model.to_dict(include_sizes=True) for model in models]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/<int:challenge_id>', methods=['GET'])
@permission_required('view_challenges')
def get_challenge_details(challenge_id):
    """Get detailed information about a specific challenge"""
    try:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404

        user = challenge.user
        model = challenge.challenge_model

        # Calculate stats
        current_bal = float(challenge.current_balance) if challenge.current_balance else 0
        initial_bal_calc = float(challenge.initial_balance) if challenge.initial_balance else 0
        profit = current_bal - initial_bal_calc
        profit_percent = (profit / initial_bal_calc * 100) if initial_bal_calc else 0

        # Get trades
        trades = Trade.query.filter_by(challenge_id=challenge.id).order_by(Trade.opened_at.desc()).limit(50).all()

        winning_trades = sum(1 for t in trades if t.pnl and t.pnl > 0)
        losing_trades = sum(1 for t in trades if t.pnl and t.pnl < 0)

        # Generate equity curve from trades (simplified)
        initial_bal = float(challenge.initial_balance) if challenge.initial_balance else 0
        equity_curve = [initial_bal]
        running_balance = initial_bal
        for trade in reversed(trades):
            if trade.pnl:
                running_balance += float(trade.pnl)
                equity_curve.append(running_balance)

        challenge_data = {
            'id': challenge.id,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'model': {
                'name': model.name if model else 'Unknown',
                'display_name': model.display_name if model else 'Unknown',
                'profit_target': float(model.phase1_profit_target) if model and model.phase1_profit_target else 10,
                'max_daily_drawdown': float(model.max_daily_loss) if model and model.max_daily_loss else 5,
                'max_total_drawdown': float(model.max_overall_loss) if model and model.max_overall_loss else 10,
                'min_trading_days': model.phase1_min_days if model else 0
            },
            'status': challenge.status,
            'phase': 'funded' if challenge.is_funded else challenge.phase,
            'current_balance': challenge.current_balance,
            'initial_balance': challenge.initial_balance,
            'profit': profit,
            'profit_percent': round(profit_percent, 2),
            'max_drawdown': challenge.max_drawdown or 0,
            'daily_drawdown': challenge.total_drawdown or 0,
            'trades_count': len(trades),
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round((winning_trades / len(trades) * 100) if trades else 0, 1),
            'trading_days': challenge.trading_days or 0,
            'start_date': challenge.start_date.isoformat() if challenge.start_date else None,
            'end_date': challenge.end_date.isoformat() if challenge.end_date else None,
            'created_at': challenge.start_date.isoformat() if challenge.start_date else None,
            'equity_curve': equity_curve[-12:] if len(equity_curve) > 12 else equity_curve  # Last 12 points
        }

        trades_data = [{
            'id': t.id,
            'symbol': t.symbol,
            'type': t.trade_type,
            'size': float(t.quantity) if t.quantity else 0,
            'entry_price': float(t.entry_price) if t.entry_price else 0,
            'exit_price': float(t.exit_price) if t.exit_price else None,
            'current_price': float(t.exit_price or t.entry_price) if t.exit_price or t.entry_price else None,
            'profit': float(t.pnl) if t.pnl else 0,
            'status': t.status,
            'opened_at': t.opened_at.isoformat() if t.opened_at else None,
            'closed_at': t.closed_at.isoformat() if hasattr(t, 'closed_at') and t.closed_at else None
        } for t in trades]

        return jsonify({
            'challenge': challenge_data,
            'trades': trades_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/<int:challenge_id>/status', methods=['PUT'])
@permission_required('edit_challenges')
def update_challenge_status(challenge_id):
    """Manually update challenge status (pass/fail)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        reason = data.get('reason', 'Admin action')

        if new_status not in ['passed', 'failed', 'active']:
            return jsonify({'error': 'Invalid status'}), 400

        challenge = UserChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404

        challenge.status = new_status

        if new_status == 'failed':
            challenge.failed_at = datetime.utcnow()
            challenge.failure_reason = reason
        elif new_status == 'passed':
            challenge.passed_at = datetime.utcnow()
            # Move to next phase or funded
            if challenge.phase < 2:
                challenge.phase += 1
            else:
                challenge.is_funded = True

        db.session.commit()

        return jsonify({
            'message': f'Challenge status updated to {new_status}',
            'challenge_id': challenge_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/<int:challenge_id>/reset', methods=['POST'])
@permission_required('edit_challenges')
def reset_challenge(challenge_id):
    """Reset a challenge to initial state"""
    try:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404

        # Reset challenge stats
        challenge.current_balance = challenge.initial_balance
        challenge.status = 'active'
        challenge.trading_days = 0
        challenge.start_date = datetime.utcnow()
        challenge.end_date = None
        challenge.failed_at = None
        challenge.passed_at = None
        challenge.failure_reason = None

        db.session.commit()

        return jsonify({
            'message': 'Challenge reset successfully',
            'challenge_id': challenge_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/grant', methods=['POST'])
@permission_required('edit_challenges')
def grant_challenge():
    """Grant a challenge to a user (admin creates challenge for user)"""
    try:
        data = request.get_json()
        admin_id = int(get_jwt_identity())

        # Required fields
        user_id = data.get('user_id')
        model_id = data.get('model_id')
        account_size_id = data.get('account_size_id')

        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        if not model_id:
            return jsonify({'error': 'model_id is required'}), 400
        if not account_size_id:
            return jsonify({'error': 'account_size_id is required'}), 400

        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify challenge model exists
        challenge_model = ChallengeModel.query.get(model_id)
        if not challenge_model:
            return jsonify({'error': 'Challenge model not found'}), 404

        # Verify account size exists and belongs to model
        account_size = AccountSize.query.get(account_size_id)
        if not account_size or account_size.model_id != model_id:
            return jsonify({'error': 'Invalid account size for this model'}), 400

        # Optional parameters
        skip_trial = data.get('skip_trial', False)
        start_funded = data.get('start_funded', False)
        custom_profit_target = data.get('custom_profit_target')
        custom_max_drawdown = data.get('custom_max_drawdown')
        notes = data.get('notes', 'Granted by admin')

        # Determine initial phase
        if start_funded:
            phase = 'funded'
            is_funded = True
        elif skip_trial:
            phase = 'evaluation'
            is_funded = False
        else:
            phase = 'trial' if challenge_model.phases > 0 else 'evaluation'
            is_funded = False

        # Create the challenge
        initial_balance = float(account_size.balance)
        profit_target = custom_profit_target if custom_profit_target else float(challenge_model.phase1_profit_target) / 100

        new_challenge = UserChallenge(
            user_id=user_id,
            model_id=model_id,
            account_size_id=account_size_id,
            initial_balance=initial_balance,
            current_balance=initial_balance,
            highest_balance=initial_balance,
            status='active',
            phase=phase,
            current_phase_number=1,
            profit_target=profit_target,
            is_funded=is_funded,
            profit_split=float(challenge_model.default_profit_split),
            start_date=datetime.utcnow(),
            trading_days=0
        )

        db.session.add(new_challenge)
        db.session.commit()

        # Audit log
        try:
            AuditService.log_action(
                user_id=admin_id,
                action_type='ADMIN',
                action='challenge_grant',
                target_type='challenge',
                target_id=new_challenge.id,
                description=f'Granted {challenge_model.display_name} challenge to user {user.username}',
                extra_data={
                    'notes': notes,
                    'skip_trial': skip_trial,
                    'start_funded': start_funded,
                    'initial_balance': initial_balance
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log audit: {e}")

        return jsonify({
            'message': 'Challenge granted successfully',
            'challenge': {
                'id': new_challenge.id,
                'user_id': user_id,
                'model': challenge_model.display_name,
                'initial_balance': initial_balance,
                'phase': phase,
                'is_funded': is_funded
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error granting challenge: {e}")
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/<int:challenge_id>/edit', methods=['PUT'])
@superadmin_required
def edit_challenge(challenge_id):
    """Edit challenge fields (SuperAdmin only)"""
    try:
        data = request.get_json()
        admin_id = int(get_jwt_identity())

        challenge = UserChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404

        # Store old values for audit
        old_values = {
            'current_balance': float(challenge.current_balance) if challenge.current_balance else 0,
            'initial_balance': float(challenge.initial_balance) if challenge.initial_balance else 0,
            'status': challenge.status,
            'phase': challenge.phase,
            'is_funded': challenge.is_funded,
            'profit_target': challenge.profit_target,
            'trading_days': challenge.trading_days,
            'profit_split': float(challenge.profit_split) if challenge.profit_split else 80
        }

        # Update allowed fields
        updated_fields = []

        if 'current_balance' in data:
            challenge.current_balance = data['current_balance']
            if data['current_balance'] > float(challenge.highest_balance or 0):
                challenge.highest_balance = data['current_balance']
            updated_fields.append('current_balance')

        if 'initial_balance' in data:
            challenge.initial_balance = data['initial_balance']
            updated_fields.append('initial_balance')

        if 'status' in data:
            if data['status'] not in ['active', 'passed', 'failed', 'funded', 'expired']:
                return jsonify({'error': 'Invalid status'}), 400
            challenge.status = data['status']
            updated_fields.append('status')

        if 'phase' in data:
            if data['phase'] not in ['trial', 'evaluation', 'verification', 'funded']:
                return jsonify({'error': 'Invalid phase'}), 400
            challenge.phase = data['phase']
            updated_fields.append('phase')

        if 'current_phase_number' in data:
            challenge.current_phase_number = data['current_phase_number']
            updated_fields.append('current_phase_number')

        if 'is_funded' in data:
            challenge.is_funded = data['is_funded']
            if data['is_funded']:
                challenge.phase = 'funded'
                challenge.status = 'funded'
            updated_fields.append('is_funded')

        if 'profit_target' in data:
            challenge.profit_target = data['profit_target']
            updated_fields.append('profit_target')

        if 'profit_split' in data:
            challenge.profit_split = data['profit_split']
            updated_fields.append('profit_split')

        if 'trading_days' in data:
            challenge.trading_days = data['trading_days']
            updated_fields.append('trading_days')

        if 'start_date' in data:
            challenge.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            updated_fields.append('start_date')

        if 'end_date' in data:
            if data['end_date']:
                challenge.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            else:
                challenge.end_date = None
            updated_fields.append('end_date')

        if 'failure_reason' in data:
            challenge.failure_reason = data['failure_reason']
            updated_fields.append('failure_reason')

        # Trading account fields
        if 'trading_login' in data:
            challenge.trading_login = data['trading_login']
            updated_fields.append('trading_login')

        if 'trading_server' in data:
            challenge.trading_server = data['trading_server']
            updated_fields.append('trading_server')

        db.session.commit()

        # Store new values for audit
        new_values = {
            'current_balance': float(challenge.current_balance) if challenge.current_balance else 0,
            'initial_balance': float(challenge.initial_balance) if challenge.initial_balance else 0,
            'status': challenge.status,
            'phase': challenge.phase,
            'is_funded': challenge.is_funded,
            'profit_target': challenge.profit_target,
            'trading_days': challenge.trading_days,
            'profit_split': float(challenge.profit_split) if challenge.profit_split else 80
        }

        # Audit log
        try:
            AuditService.log_action(
                user_id=admin_id,
                action_type='ADMIN',
                action='challenge_edit',
                target_type='challenge',
                target_id=challenge_id,
                description=f'Edited challenge {challenge_id}: {", ".join(updated_fields)}',
                old_value=old_values,
                new_value=new_values
            )
        except Exception as e:
            logger.warning(f"Failed to log audit: {e}")

        return jsonify({
            'message': 'Challenge updated successfully',
            'updated_fields': updated_fields,
            'challenge_id': challenge_id
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error editing challenge: {e}")
        return jsonify({'error': str(e)}), 500


@admin_challenges_bp.route('/<int:challenge_id>/adjust-balance', methods=['POST'])
@permission_required('edit_challenges')
def adjust_challenge_balance(challenge_id):
    """Adjust challenge balance with audit trail"""
    try:
        data = request.get_json()
        admin_id = int(get_jwt_identity())

        challenge = UserChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404

        amount = data.get('amount')
        adjustment_type = data.get('type', 'credit')  # credit, debit, reset
        reason = data.get('reason', 'Admin adjustment')

        if amount is None:
            return jsonify({'error': 'amount is required'}), 400

        amount = float(amount)
        old_balance = float(challenge.current_balance)

        if adjustment_type == 'credit':
            new_balance = old_balance + amount
        elif adjustment_type == 'debit':
            new_balance = old_balance - amount
            if new_balance < 0:
                return jsonify({'error': 'Cannot debit more than current balance'}), 400
        elif adjustment_type == 'reset':
            new_balance = float(challenge.initial_balance)
        else:
            return jsonify({'error': 'Invalid adjustment type. Use: credit, debit, or reset'}), 400

        # Update balance
        challenge.current_balance = new_balance

        # Update highest balance if needed
        if new_balance > float(challenge.highest_balance or 0):
            challenge.highest_balance = new_balance

        db.session.commit()

        # Audit log
        try:
            AuditService.log_action(
                user_id=admin_id,
                action_type='ADMIN',
                action='balance_adjustment',
                target_type='challenge',
                target_id=challenge_id,
                description=f'Balance {adjustment_type}: {amount} ({reason})',
                old_value={'balance': old_balance},
                new_value={'balance': new_balance},
                extra_data={
                    'adjustment_type': adjustment_type,
                    'amount': amount,
                    'reason': reason
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log audit: {e}")

        return jsonify({
            'message': 'Balance adjusted successfully',
            'old_balance': old_balance,
            'new_balance': new_balance,
            'adjustment': {
                'type': adjustment_type,
                'amount': amount,
                'reason': reason
            }
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adjusting balance: {e}")
        return jsonify({'error': str(e)}), 500
