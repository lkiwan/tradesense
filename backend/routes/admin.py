from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from . import admin_bp
from models import db, User, UserChallenge, Trade, Payment, Settings, UserStatus
from utils.decorators import (
    admin_required, superadmin_required,
    permission_required, any_permission_required
)


# ==================== ADMIN ROUTES ====================

@admin_bp.route('/users', methods=['GET'])
@permission_required('view_users')
def get_all_users():
    """Get all users (admin)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')

    query = User.query
    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    # Build users list with status info
    users = []
    for user in pagination.items:
        user_dict = user.to_dict()
        # Add status info
        status_record = UserStatus.query.filter_by(user_id=user.id).first()
        if status_record:
            user_dict['status'] = status_record.to_dict()
        else:
            user_dict['status'] = {
                'is_banned': False,
                'is_frozen': False,
                'can_trade': True
            }
        # Add challenge count
        user_dict['challenges_count'] = len(user.challenges) if user.challenges else 0
        users.append(user_dict)

    return jsonify({
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@permission_required('view_users')
def get_user_details(user_id):
    """Get user details with challenges (admin)"""
    from models.user_status import UserStatus, get_or_create_user_status

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    challenges = UserChallenge.query.filter_by(user_id=user_id).all()
    payments = Payment.query.filter_by(user_id=user_id).all()

    # Get user status
    status = get_or_create_user_status(user_id)

    return jsonify({
        'user': user.to_dict(),
        'status': status.to_dict() if status else {
            'is_banned': False,
            'is_frozen': False,
            'can_trade': True,
            'last_activity_at': None,
            'total_logins': 0
        },
        'challenges': [c.to_dict() for c in challenges],
        'payments': [p.to_dict() for p in payments]
    }), 200


@admin_bp.route('/challenges', methods=['GET'])
@permission_required('view_challenges')
def get_all_challenges():
    """Get all challenges (admin)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')

    query = UserChallenge.query
    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(UserChallenge.start_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    challenges_data = []
    for challenge in pagination.items:
        data = challenge.to_dict()
        data['username'] = challenge.user.username
        challenges_data.append(data)

    return jsonify({
        'challenges': challenges_data,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/challenges/<int:challenge_id>/status', methods=['PUT'])
@permission_required('edit_challenges')
def update_challenge_status(challenge_id):
    """Manually update challenge status (admin)"""
    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['active', 'passed', 'failed']:
        return jsonify({'error': 'Invalid status'}), 400

    challenge = UserChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    challenge.status = new_status
    if new_status == 'failed':
        challenge.failure_reason = data.get('reason', 'Manually failed by admin')
    if new_status in ['passed', 'failed']:
        from datetime import datetime
        challenge.end_date = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': f'Challenge status updated to {new_status}',
        'challenge': challenge.to_dict()
    }), 200


@admin_bp.route('/trades', methods=['GET'])
@permission_required('view_challenges')
def get_all_trades():
    """Get all trades (admin)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    challenge_id = request.args.get('challenge_id', type=int)

    query = Trade.query
    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    pagination = query.order_by(Trade.opened_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'trades': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/payments', methods=['GET'])
@permission_required('view_payments')
def get_all_payments():
    """Get all payments (admin)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')

    query = Payment.query
    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(Payment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'payments': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


# ==================== SUPERADMIN ROUTES ====================

@admin_bp.route('/superadmin/settings', methods=['GET'])
@superadmin_required
def get_settings():
    """Get all settings (superadmin)"""
    settings = Settings.query.all()
    return jsonify({
        'settings': {s.key: s.value for s in settings}
    }), 200


@admin_bp.route('/superadmin/settings', methods=['PUT'])
@superadmin_required
def update_settings():
    """Update settings (superadmin)"""
    data = request.get_json()

    for key, value in data.items():
        Settings.set_setting(key, value)

    return jsonify({
        'message': 'Settings updated successfully'
    }), 200


@admin_bp.route('/superadmin/settings/paypal', methods=['PUT'])
@superadmin_required
def update_paypal_settings():
    """Update PayPal configuration (superadmin)"""
    data = request.get_json()

    if 'client_id' in data:
        Settings.set_setting('paypal_client_id', data['client_id'])
    if 'client_secret' in data:
        Settings.set_setting('paypal_client_secret', data['client_secret'])
    if 'mode' in data:
        Settings.set_setting('paypal_mode', data['mode'])

    return jsonify({
        'message': 'PayPal settings updated'
    }), 200


@admin_bp.route('/superadmin/settings/gemini', methods=['PUT'])
@superadmin_required
def update_gemini_settings():
    """Update Gemini API configuration (superadmin)"""
    data = request.get_json()

    if 'api_key' in data:
        Settings.set_setting('gemini_api_key', data['api_key'])

    return jsonify({
        'message': 'Gemini API settings updated'
    }), 200


@admin_bp.route('/superadmin/admins', methods=['GET'])
@superadmin_required
def get_admins():
    """Get all admin users (superadmin)"""
    admins = User.query.filter(User.role.in_(['admin', 'superadmin'])).all()
    return jsonify({
        'admins': [u.to_dict() for u in admins]
    }), 200


@admin_bp.route('/superadmin/admins/<int:user_id>/promote', methods=['POST'])
@superadmin_required
def promote_to_admin(user_id):
    """Promote user to admin (superadmin)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.role = 'admin'
    db.session.commit()

    return jsonify({
        'message': f'{user.username} promoted to admin',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/superadmin/admins/<int:user_id>/demote', methods=['POST'])
@superadmin_required
def demote_admin(user_id):
    """Demote admin to user (superadmin)"""
    current_user_id = int(get_jwt_identity())
    if user_id == current_user_id:
        return jsonify({'error': 'Cannot demote yourself'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'superadmin':
        return jsonify({'error': 'Cannot demote superadmin'}), 400

    user.role = 'user'
    db.session.commit()

    return jsonify({
        'message': f'{user.username} demoted to user',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/superadmin/stats', methods=['GET'])
@superadmin_required
def get_superadmin_stats():
    """Get comprehensive platform statistics (superadmin)"""
    from sqlalchemy import func

    # Revenue stats
    total_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter_by(status='completed').scalar() or 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    monthly_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter(
        Payment.status == 'completed',
        Payment.created_at >= thirty_days_ago
    ).scalar() or 0

    # User stats
    total_users = User.query.count()
    new_users_month = User.query.filter(
        User.created_at >= thirty_days_ago
    ).count()

    # Challenge stats
    total_challenges = UserChallenge.query.count()
    active_challenges = UserChallenge.query.filter_by(status='active').count()
    passed_challenges = UserChallenge.query.filter_by(status='passed').count()
    failed_challenges = UserChallenge.query.filter_by(status='failed').count()

    # Trade stats
    total_trades = Trade.query.count()
    total_volume = db.session.query(
        func.sum(Trade.entry_price * Trade.quantity)
    ).scalar() or 0

    return jsonify({
        'stats': {
            'revenue': {
                'total': float(total_revenue),
                'monthly': float(monthly_revenue),
                'currency': 'MAD'
            },
            'users': {
                'total': total_users,
                'new_this_month': new_users_month
            },
            'challenges': {
                'total': total_challenges,
                'active': active_challenges,
                'passed': passed_challenges,
                'failed': failed_challenges,
                'success_rate': round(
                    passed_challenges / (passed_challenges + failed_challenges) * 100
                    if (passed_challenges + failed_challenges) > 0 else 0, 2
                )
            },
            'trades': {
                'total': total_trades,
                'total_volume': float(total_volume)
            }
        }
    }), 200


@admin_bp.route('/generate-test-trades/<int:challenge_id>', methods=['POST'])
@superadmin_required
def generate_test_trades(challenge_id):
    """Generate test trades for a challenge (superadmin only)"""
    import random
    from decimal import Decimal

    challenge = UserChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Delete existing trades first (optional based on query param)
    if request.args.get('clear', 'false').lower() == 'true':
        Trade.query.filter_by(challenge_id=challenge_id).delete()
        db.session.commit()

    # Trading pairs with typical prices
    symbols = [
        ('EURUSD', 1.0850, 0.0050),
        ('GBPUSD', 1.2650, 0.0080),
        ('USDJPY', 149.50, 1.50),
        ('XAUUSD', 2050.00, 25.00),
        ('BTCUSD', 95000.00, 2000.00),
        ('ETHUSD', 3400.00, 100.00),
        ('US30', 43500.00, 300.00),
        ('NAS100', 21500.00, 200.00),
    ]

    num_trades = request.json.get('num_trades', 50) if request.json else 50
    win_rate = request.json.get('win_rate', 0.55) if request.json else 0.55

    trades_created = []
    balance = float(challenge.initial_balance)

    for i in range(num_trades):
        symbol, base_price, volatility = random.choice(symbols)
        trade_type = random.choice(['buy', 'sell'])

        # Random entry within volatility
        entry_price = base_price + random.uniform(-volatility, volatility)

        # Determine if this is a win or loss
        is_win = random.random() < win_rate

        # Calculate exit price
        if trade_type == 'buy':
            if is_win:
                exit_price = entry_price + random.uniform(volatility * 0.2, volatility * 0.8)
            else:
                exit_price = entry_price - random.uniform(volatility * 0.1, volatility * 0.5)
        else:
            if is_win:
                exit_price = entry_price - random.uniform(volatility * 0.2, volatility * 0.8)
            else:
                exit_price = entry_price + random.uniform(volatility * 0.1, volatility * 0.5)

        # Calculate quantity based on risk (0.5-2% of balance)
        risk_pct = random.uniform(0.005, 0.02)
        point_value = 1 if 'USD' in symbol and symbol not in ['XAUUSD', 'BTCUSD', 'ETHUSD'] else 1
        quantity = Decimal(str(round(balance * risk_pct / (abs(entry_price - exit_price) * 100 + 1), 2)))
        quantity = max(Decimal('0.01'), min(quantity, Decimal('10.0')))

        # Calculate P&L
        if trade_type == 'buy':
            pnl = float(quantity) * (exit_price - entry_price) * 100
        else:
            pnl = float(quantity) * (entry_price - exit_price) * 100

        # Adjust for crypto/indices
        if symbol in ['BTCUSD', 'ETHUSD']:
            pnl = pnl / 100
        elif symbol in ['US30', 'NAS100']:
            pnl = pnl / 10

        pnl = round(pnl, 2)
        balance += pnl

        # Random date in the last 30 days
        days_ago = random.randint(0, 29)
        hours_ago = random.randint(0, 23)
        trade_time = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
        close_time = trade_time + timedelta(minutes=random.randint(5, 480))

        trade = Trade(
            challenge_id=challenge_id,
            symbol=symbol,
            trade_type=trade_type,
            entry_price=Decimal(str(round(entry_price, 5))),
            exit_price=Decimal(str(round(exit_price, 5))),
            quantity=quantity,
            pnl=Decimal(str(pnl)),
            status='closed',
            opened_at=trade_time,
            closed_at=close_time
        )
        db.session.add(trade)
        trades_created.append({
            'symbol': symbol,
            'type': trade_type,
            'pnl': pnl
        })

    # Update challenge balance
    challenge.current_balance = Decimal(str(round(balance, 2)))
    db.session.commit()

    # Calculate stats
    total_pnl = sum(t['pnl'] for t in trades_created)
    wins = len([t for t in trades_created if t['pnl'] > 0])

    return jsonify({
        'message': f'Created {len(trades_created)} test trades',
        'stats': {
            'total_trades': len(trades_created),
            'wins': wins,
            'losses': len(trades_created) - wins,
            'win_rate': round(wins / len(trades_created) * 100, 1),
            'total_pnl': round(total_pnl, 2),
            'new_balance': float(challenge.current_balance)
        }
    }), 201
