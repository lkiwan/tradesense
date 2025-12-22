from flask import request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import desc
from . import leaderboard_bp
from models import db, UserChallenge, User


@leaderboard_bp.route('', methods=['GET'])
def get_leaderboard():
    """Get top traders leaderboard"""
    limit = request.args.get('limit', 10, type=int)
    period = request.args.get('period', 'all')  # all, month, week

    # Build query for top traders by profit percentage
    query = db.session.query(
        User.id,
        User.username,
        User.avatar,
        UserChallenge.initial_balance,
        UserChallenge.current_balance,
        UserChallenge.plan_type,
        UserChallenge.status,
        UserChallenge.start_date,
        (
            (UserChallenge.current_balance - UserChallenge.initial_balance) /
            UserChallenge.initial_balance * 100
        ).label('profit_pct')
    ).join(
        UserChallenge, User.id == UserChallenge.user_id
    ).filter(
        UserChallenge.status.in_(['active', 'passed'])
    )

    # Filter by period
    if period == 'month':
        from datetime import datetime, timedelta
        month_ago = datetime.utcnow() - timedelta(days=30)
        query = query.filter(UserChallenge.start_date >= month_ago)
    elif period == 'week':
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(UserChallenge.start_date >= week_ago)

    # Order by profit percentage descending
    results = query.order_by(desc('profit_pct')).limit(limit).all()

    leaderboard = []
    for i, row in enumerate(results):
        leaderboard.append({
            'rank': i + 1,
            'user_id': row.id,
            'username': row.username,
            'avatar': row.avatar,
            'initial_balance': float(row.initial_balance),
            'current_balance': float(row.current_balance),
            'profit_percentage': round(float(row.profit_pct), 2),
            'plan_type': row.plan_type,
            'status': row.status,
            'start_date': row.start_date.isoformat() if row.start_date else None
        })

    return jsonify({
        'leaderboard': leaderboard,
        'period': period,
        'total': len(leaderboard)
    }), 200


@leaderboard_bp.route('/stats', methods=['GET'])
def get_global_stats():
    """Get global platform statistics"""
    # Total challenges
    total_challenges = UserChallenge.query.count()

    # Active challenges
    active_challenges = UserChallenge.query.filter_by(status='active').count()

    # Passed challenges
    passed_challenges = UserChallenge.query.filter_by(status='passed').count()

    # Failed challenges
    failed_challenges = UserChallenge.query.filter_by(status='failed').count()

    # Total users
    total_users = User.query.filter_by(role='user').count()

    # Average profit (for active/passed)
    avg_profit_result = db.session.query(
        db.func.avg(
            (UserChallenge.current_balance - UserChallenge.initial_balance) /
            UserChallenge.initial_balance * 100
        )
    ).filter(
        UserChallenge.status.in_(['active', 'passed'])
    ).scalar()

    avg_profit = round(float(avg_profit_result or 0), 2)

    # Success rate
    completed_challenges = passed_challenges + failed_challenges
    success_rate = round((passed_challenges / completed_challenges * 100) if completed_challenges > 0 else 0, 2)

    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_challenges': total_challenges,
            'active_challenges': active_challenges,
            'passed_challenges': passed_challenges,
            'failed_challenges': failed_challenges,
            'average_profit_percentage': avg_profit,
            'success_rate': success_rate
        }
    }), 200


@leaderboard_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_rank(user_id):
    """Get specific user's rank"""
    # Get user's best challenge
    best_challenge = UserChallenge.query.filter_by(
        user_id=user_id
    ).filter(
        UserChallenge.status.in_(['active', 'passed'])
    ).order_by(
        ((UserChallenge.current_balance - UserChallenge.initial_balance) /
         UserChallenge.initial_balance).desc()
    ).first()

    if not best_challenge:
        return jsonify({
            'error': 'User has no active or passed challenges'
        }), 404

    user = User.query.get(user_id)
    profit_pct = best_challenge.profit_percentage

    # Count users with higher profit percentage
    higher_ranked = db.session.query(
        db.func.count(UserChallenge.id)
    ).filter(
        UserChallenge.status.in_(['active', 'passed']),
        ((UserChallenge.current_balance - UserChallenge.initial_balance) /
         UserChallenge.initial_balance * 100) > profit_pct
    ).scalar()

    rank = higher_ranked + 1

    return jsonify({
        'user_id': user_id,
        'username': user.username,
        'rank': rank,
        'profit_percentage': round(profit_pct, 2),
        'challenge': best_challenge.to_dict()
    }), 200
