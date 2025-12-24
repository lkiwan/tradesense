"""
Trader Profile routes for social trading features.
Handles profile CRUD, statistics, equity curves, and badges.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from collections import defaultdict
import math

from models import (
    db, User, Trade, UserChallenge, TraderProfile, TraderStatistics,
    TraderBadge, EquitySnapshot, DEFAULT_BADGES
)

profiles_bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')


# ============== Profile Management ==============

@profiles_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get current user's trader profile"""
    user_id = get_jwt_identity()

    profile = TraderProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        # Create default profile
        user = User.query.get(user_id)
        profile = TraderProfile(
            user_id=user_id,
            display_name=user.username
        )
        db.session.add(profile)
        db.session.commit()

    return jsonify({
        'success': True,
        'profile': profile.to_dict(include_private=True)
    })


@profiles_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    """Update current user's trader profile"""
    user_id = get_jwt_identity()
    data = request.get_json()

    profile = TraderProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        profile = TraderProfile(user_id=user_id)
        db.session.add(profile)

    # Updatable fields
    updatable_fields = [
        'display_name', 'bio', 'avatar_url', 'cover_image_url', 'country',
        'trading_since', 'trading_style', 'preferred_markets', 'preferred_pairs',
        'is_public', 'show_trades', 'show_statistics', 'show_equity_curve',
        'allow_copy_trading'
    ]

    for field in updatable_fields:
        if field in data:
            if field == 'trading_since' and data[field]:
                setattr(profile, field, datetime.fromisoformat(data[field]).date())
            else:
                setattr(profile, field, data[field])

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'profile': profile.to_dict(include_private=True)
    })


@profiles_bp.route('/<int:profile_id>', methods=['GET'])
def get_public_profile(profile_id):
    """Get a trader's public profile"""
    profile = TraderProfile.query.get_or_404(profile_id)

    if not profile.is_public:
        return jsonify({'error': 'This profile is private'}), 403

    return jsonify({
        'success': True,
        'profile': profile.to_dict()
    })


@profiles_bp.route('/user/<int:user_id>', methods=['GET'])
def get_profile_by_user(user_id):
    """Get a trader's profile by user ID"""
    profile = TraderProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    if not profile.is_public:
        return jsonify({'error': 'This profile is private'}), 403

    return jsonify({
        'success': True,
        'profile': profile.to_dict()
    })


# ============== Statistics ==============

@profiles_bp.route('/me/statistics', methods=['GET'])
@jwt_required()
def get_my_statistics():
    """Get current user's trading statistics"""
    user_id = get_jwt_identity()

    stats = TraderStatistics.query.filter_by(user_id=user_id).first()

    if not stats:
        # Calculate and create statistics
        stats = calculate_statistics(user_id)

    return jsonify({
        'success': True,
        'statistics': stats.to_dict() if stats else None
    })


@profiles_bp.route('/me/statistics/refresh', methods=['POST'])
@jwt_required()
def refresh_my_statistics():
    """Recalculate user's trading statistics"""
    user_id = get_jwt_identity()

    stats = calculate_statistics(user_id)

    return jsonify({
        'success': True,
        'message': 'Statistics refreshed',
        'statistics': stats.to_dict() if stats else None
    })


@profiles_bp.route('/<int:profile_id>/statistics', methods=['GET'])
def get_profile_statistics(profile_id):
    """Get a trader's public statistics"""
    profile = TraderProfile.query.get_or_404(profile_id)

    if not profile.is_public or not profile.show_statistics:
        return jsonify({'error': 'Statistics not available'}), 403

    stats = TraderStatistics.query.filter_by(user_id=profile.user_id).first()

    return jsonify({
        'success': True,
        'statistics': stats.to_dict() if stats else None
    })


def calculate_statistics(user_id):
    """Calculate and save trading statistics for a user"""
    # Get all closed trades
    trades = Trade.query.filter_by(
        user_id=user_id,
        status='closed'
    ).order_by(Trade.closed_at).all()

    if not trades:
        return None

    # Initialize stats
    stats = TraderStatistics.query.filter_by(user_id=user_id).first()
    if not stats:
        stats = TraderStatistics(user_id=user_id)
        db.session.add(stats)

    # Basic counts
    stats.total_trades = len(trades)
    stats.winning_trades = sum(1 for t in trades if t.profit > 0)
    stats.losing_trades = sum(1 for t in trades if t.profit < 0)
    stats.win_rate = (stats.winning_trades / stats.total_trades * 100) if stats.total_trades > 0 else 0

    # Profit/Loss
    stats.total_profit = sum(t.profit for t in trades if t.profit > 0)
    stats.total_loss = abs(sum(t.profit for t in trades if t.profit < 0))
    stats.net_profit = stats.total_profit - stats.total_loss
    stats.profit_factor = (stats.total_profit / stats.total_loss) if stats.total_loss > 0 else 0

    # Best/Worst trades
    profits = [t.profit for t in trades]
    stats.best_trade = max(profits) if profits else 0
    stats.worst_trade = min(profits) if profits else 0

    # Average metrics
    winning_trades_list = [t for t in trades if t.profit > 0]
    losing_trades_list = [t for t in trades if t.profit < 0]

    stats.avg_profit_per_trade = (stats.total_profit / len(winning_trades_list)) if winning_trades_list else 0
    stats.avg_loss_per_trade = (stats.total_loss / len(losing_trades_list)) if losing_trades_list else 0
    stats.avg_risk_reward = (stats.avg_profit_per_trade / stats.avg_loss_per_trade) if stats.avg_loss_per_trade > 0 else 0

    # Calculate streaks
    current_streak = 0
    longest_win_streak = 0
    longest_lose_streak = 0
    temp_win_streak = 0
    temp_lose_streak = 0

    for trade in trades:
        if trade.profit > 0:
            temp_win_streak += 1
            temp_lose_streak = 0
            longest_win_streak = max(longest_win_streak, temp_win_streak)
        elif trade.profit < 0:
            temp_lose_streak += 1
            temp_win_streak = 0
            longest_lose_streak = max(longest_lose_streak, temp_lose_streak)

    # Current streak (from end)
    for trade in reversed(trades):
        if trade.profit > 0:
            if current_streak >= 0:
                current_streak += 1
            else:
                break
        elif trade.profit < 0:
            if current_streak <= 0:
                current_streak -= 1
            else:
                break

    stats.longest_win_streak = longest_win_streak
    stats.longest_lose_streak = longest_lose_streak
    stats.current_streak = current_streak

    # Trading days and daily profitability
    trading_days = set()
    daily_profits = defaultdict(float)
    for trade in trades:
        if trade.closed_at:
            day = trade.closed_at.date()
            trading_days.add(day)
            daily_profits[day] += trade.profit

    stats.trading_days = len(trading_days)
    stats.profitable_days = sum(1 for p in daily_profits.values() if p > 0)

    # Monthly returns
    monthly_profits = defaultdict(float)
    for trade in trades:
        if trade.closed_at:
            month_key = trade.closed_at.strftime('%Y-%m')
            monthly_profits[month_key] += trade.profit

    stats.monthly_returns = dict(monthly_profits)

    # Most traded and profitable pairs
    pair_counts = defaultdict(int)
    pair_profits = defaultdict(float)
    for trade in trades:
        pair_counts[trade.symbol] += 1
        pair_profits[trade.symbol] += trade.profit

    if pair_counts:
        stats.most_traded_pair = max(pair_counts, key=pair_counts.get)
    if pair_profits:
        stats.most_profitable_pair = max(pair_profits, key=pair_profits.get)

    # Average trades per day
    if stats.trading_days > 0:
        stats.avg_trades_per_day = stats.total_trades / stats.trading_days

    # Calculate max drawdown from equity curve
    equity_snapshots = EquitySnapshot.query.filter_by(user_id=user_id).order_by(EquitySnapshot.timestamp).all()
    if equity_snapshots:
        peak = equity_snapshots[0].equity
        max_dd = 0
        max_dd_amount = 0
        for snapshot in equity_snapshots:
            if snapshot.equity > peak:
                peak = snapshot.equity
            dd = (peak - snapshot.equity) / peak * 100 if peak > 0 else 0
            dd_amount = peak - snapshot.equity
            if dd > max_dd:
                max_dd = dd
                max_dd_amount = dd_amount

        stats.max_drawdown = max_dd
        stats.max_drawdown_amount = max_dd_amount

    # Calculate Sharpe Ratio (simplified)
    if daily_profits:
        daily_returns = list(daily_profits.values())
        avg_return = sum(daily_returns) / len(daily_returns)
        if len(daily_returns) > 1:
            variance = sum((r - avg_return) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
            std_dev = math.sqrt(variance)
            stats.sharpe_ratio = (avg_return / std_dev * math.sqrt(252)) if std_dev > 0 else 0

            # Sortino Ratio (only downside deviation)
            negative_returns = [r for r in daily_returns if r < 0]
            if negative_returns:
                downside_variance = sum(r ** 2 for r in negative_returns) / len(negative_returns)
                downside_dev = math.sqrt(downside_variance)
                stats.sortino_ratio = (avg_return / downside_dev * math.sqrt(252)) if downside_dev > 0 else 0

    stats.last_calculated = datetime.utcnow()
    db.session.commit()

    return stats


# ============== Equity Curve ==============

@profiles_bp.route('/me/equity-curve', methods=['GET'])
@jwt_required()
def get_my_equity_curve():
    """Get current user's equity curve data"""
    user_id = get_jwt_identity()
    challenge_id = request.args.get('challenge_id', type=int)
    period = request.args.get('period', '30d')  # 7d, 30d, 90d, all

    return get_equity_curve_data(user_id, challenge_id, period)


@profiles_bp.route('/<int:profile_id>/equity-curve', methods=['GET'])
def get_profile_equity_curve(profile_id):
    """Get a trader's public equity curve"""
    profile = TraderProfile.query.get_or_404(profile_id)

    if not profile.is_public or not profile.show_equity_curve:
        return jsonify({'error': 'Equity curve not available'}), 403

    challenge_id = request.args.get('challenge_id', type=int)
    period = request.args.get('period', '30d')

    return get_equity_curve_data(profile.user_id, challenge_id, period)


def get_equity_curve_data(user_id, challenge_id=None, period='30d'):
    """Get equity curve data for a user"""
    # Calculate period filter
    now = datetime.utcnow()
    if period == '7d':
        start_date = now - timedelta(days=7)
    elif period == '30d':
        start_date = now - timedelta(days=30)
    elif period == '90d':
        start_date = now - timedelta(days=90)
    else:
        start_date = None

    query = EquitySnapshot.query.filter_by(user_id=user_id)

    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    if start_date:
        query = query.filter(EquitySnapshot.timestamp >= start_date)

    snapshots = query.order_by(EquitySnapshot.timestamp).all()

    # If no snapshots, generate from trades
    if not snapshots:
        snapshots = generate_equity_from_trades(user_id, challenge_id, start_date)

    return jsonify({
        'success': True,
        'equity_curve': [s.to_dict() if hasattr(s, 'to_dict') else s for s in snapshots],
        'period': period
    })


def generate_equity_from_trades(user_id, challenge_id=None, start_date=None):
    """Generate equity curve from trade history"""
    query = Trade.query.filter_by(user_id=user_id, status='closed')

    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    if start_date:
        query = query.filter(Trade.closed_at >= start_date)

    trades = query.order_by(Trade.closed_at).all()

    if not trades:
        return []

    # Get starting balance from challenge
    challenge = UserChallenge.query.filter_by(user_id=user_id).order_by(desc(UserChallenge.created_at)).first()
    starting_balance = challenge.initial_balance if challenge else 100000

    equity_data = []
    running_balance = starting_balance

    for trade in trades:
        running_balance += trade.profit
        equity_data.append({
            'timestamp': trade.closed_at.isoformat() if trade.closed_at else None,
            'equity': round(running_balance, 2),
            'balance': round(running_balance, 2),
            'floating_pl': 0
        })

    return equity_data


# ============== Badges ==============

@profiles_bp.route('/me/badges', methods=['GET'])
@jwt_required()
def get_my_badges():
    """Get current user's earned badges"""
    user_id = get_jwt_identity()

    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    earned_badges = profile.badges if profile else []

    # Get badge details
    all_badges = TraderBadge.query.filter_by(is_active=True).all()
    badges_data = []

    for badge in all_badges:
        badges_data.append({
            **badge.to_dict(),
            'earned': badge.code in (earned_badges or [])
        })

    return jsonify({
        'success': True,
        'badges': badges_data,
        'earned_count': len(earned_badges) if earned_badges else 0
    })


@profiles_bp.route('/me/badges/check', methods=['POST'])
@jwt_required()
def check_badges():
    """Check and award any newly earned badges"""
    user_id = get_jwt_identity()

    stats = TraderStatistics.query.filter_by(user_id=user_id).first()
    if not stats:
        stats = calculate_statistics(user_id)

    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'success': True, 'new_badges': []})

    earned_badges = profile.badges or []
    new_badges = []

    # Check each badge
    badges = TraderBadge.query.filter_by(is_active=True).all()
    for badge in badges:
        if badge.code in earned_badges:
            continue

        earned = False

        if badge.requirement_type == 'trades_count' and stats:
            earned = stats.total_trades >= badge.requirement_value

        elif badge.requirement_type == 'win_rate_30d' and stats:
            earned = stats.win_rate >= badge.requirement_value

        elif badge.requirement_type == 'win_streak' and stats:
            earned = stats.longest_win_streak >= badge.requirement_value

        elif badge.requirement_type == 'funded':
            funded_challenge = UserChallenge.query.filter_by(
                user_id=user_id,
                status='funded'
            ).first()
            earned = funded_challenge is not None

        if earned:
            earned_badges.append(badge.code)
            new_badges.append(badge.to_dict())

    if new_badges:
        profile.badges = earned_badges
        db.session.commit()

    return jsonify({
        'success': True,
        'new_badges': new_badges,
        'total_badges': len(earned_badges)
    })


@profiles_bp.route('/badges', methods=['GET'])
def get_all_badges():
    """Get all available badges"""
    badges = TraderBadge.query.filter_by(is_active=True).all()

    return jsonify({
        'success': True,
        'badges': [b.to_dict() for b in badges]
    })


# ============== Trade History (Public) ==============

@profiles_bp.route('/<int:profile_id>/trades', methods=['GET'])
def get_profile_trades(profile_id):
    """Get a trader's public trade history"""
    profile = TraderProfile.query.get_or_404(profile_id)

    if not profile.is_public or not profile.show_trades:
        return jsonify({'error': 'Trade history not available'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    trades = Trade.query.filter_by(
        user_id=profile.user_id,
        status='closed'
    ).order_by(desc(Trade.closed_at)).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return jsonify({
        'success': True,
        'trades': [{
            'symbol': t.symbol,
            'direction': t.direction,
            'lot_size': t.lot_size,
            'entry_price': t.entry_price,
            'exit_price': t.exit_price,
            'profit': round(t.profit, 2),
            'profit_pips': t.profit_pips,
            'closed_at': t.closed_at.isoformat() if t.closed_at else None
        } for t in trades.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': trades.total,
            'pages': trades.pages
        }
    })


# ============== Leaderboard ==============

@profiles_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top traders leaderboard"""
    period = request.args.get('period', 'all')  # month, week, all
    metric = request.args.get('metric', 'profit')  # profit, win_rate, trades
    limit = request.args.get('limit', 20, type=int)

    # Get public profiles with stats
    query = db.session.query(
        TraderProfile, TraderStatistics
    ).join(
        TraderStatistics,
        TraderProfile.user_id == TraderStatistics.user_id
    ).filter(
        TraderProfile.is_public == True
    )

    if metric == 'profit':
        query = query.order_by(desc(TraderStatistics.net_profit))
    elif metric == 'win_rate':
        query = query.filter(TraderStatistics.total_trades >= 10)
        query = query.order_by(desc(TraderStatistics.win_rate))
    elif metric == 'trades':
        query = query.order_by(desc(TraderStatistics.total_trades))

    results = query.limit(limit).all()

    leaderboard = []
    for rank, (profile, stats) in enumerate(results, 1):
        leaderboard.append({
            'rank': rank,
            'profile': profile.to_dict(),
            'statistics': {
                'win_rate': stats.win_rate,
                'net_profit': stats.net_profit,
                'total_trades': stats.total_trades,
                'profit_factor': stats.profit_factor
            }
        })

    return jsonify({
        'success': True,
        'leaderboard': leaderboard,
        'period': period,
        'metric': metric
    })


# ============== Search Profiles ==============

@profiles_bp.route('/search', methods=['GET'])
def search_profiles():
    """Search for public trader profiles"""
    query_str = request.args.get('q', '')
    trading_style = request.args.get('style')
    min_win_rate = request.args.get('min_win_rate', type=float)
    verified_only = request.args.get('verified', type=bool, default=False)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = TraderProfile.query.filter_by(is_public=True)

    if query_str:
        query = query.filter(
            (TraderProfile.display_name.ilike(f'%{query_str}%')) |
            (TraderProfile.bio.ilike(f'%{query_str}%'))
        )

    if trading_style:
        query = query.filter_by(trading_style=trading_style)

    if verified_only:
        query = query.filter_by(is_verified=True)

    # Join with stats for filtering
    if min_win_rate:
        query = query.join(
            TraderStatistics,
            TraderProfile.user_id == TraderStatistics.user_id
        ).filter(TraderStatistics.win_rate >= min_win_rate)

    profiles = query.order_by(desc(TraderProfile.follower_count)).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return jsonify({
        'success': True,
        'profiles': [p.to_dict() for p in profiles.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': profiles.total,
            'pages': profiles.pages
        }
    })


# ============== Initialize Badges ==============

@profiles_bp.route('/admin/init-badges', methods=['POST'])
@jwt_required()
def init_badges():
    """Initialize default badges (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    created = 0
    for badge_data in DEFAULT_BADGES:
        existing = TraderBadge.query.filter_by(code=badge_data['code']).first()
        if not existing:
            badge = TraderBadge(**badge_data)
            db.session.add(badge)
            created += 1

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Created {created} badges',
        'total_badges': TraderBadge.query.count()
    })
