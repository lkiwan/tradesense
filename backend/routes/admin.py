from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from . import admin_bp
from models import db, User, UserChallenge, Trade, Payment, Settings


def admin_required(fn):
    """Decorator to require admin or superadmin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def superadmin_required(fn):
    """Decorator to require superadmin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        if not user or user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ==================== ADMIN ROUTES ====================

@admin_bp.route('/users', methods=['GET'])
@admin_required
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

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get user details with challenges (admin)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    challenges = UserChallenge.query.filter_by(user_id=user_id).all()
    payments = Payment.query.filter_by(user_id=user_id).all()

    return jsonify({
        'user': user.to_dict(),
        'challenges': [c.to_dict() for c in challenges],
        'payments': [p.to_dict() for p in payments]
    }), 200


@admin_bp.route('/challenges', methods=['GET'])
@admin_required
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
@admin_required
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
@admin_required
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
@admin_required
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

    monthly_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter(
        Payment.status == 'completed',
        Payment.created_at >= func.date('now', '-30 days')
    ).scalar() or 0

    # User stats
    total_users = User.query.count()
    new_users_month = User.query.filter(
        User.created_at >= func.date('now', '-30 days')
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
