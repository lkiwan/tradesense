from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import (
    db, User, PointsBalance, PointsTransaction, POINT_VALUES, POINT_LEVELS,
    PointsRedemption, REWARDS_CATALOG, RewardCategory, RedemptionStatus,
    LEVEL_HIERARCHY, can_redeem_reward
)

points_bp = Blueprint('points', __name__, url_prefix='/api/points')


@points_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    """Get current user's points balance"""
    current_user_id = int(get_jwt_identity())

    # Get or create balance
    balance = PointsBalance.query.filter_by(user_id=current_user_id).first()
    if not balance:
        balance = PointsBalance(user_id=current_user_id)
        db.session.add(balance)
        db.session.commit()

    return jsonify({
        'balance': balance.to_dict(),
        'levels': POINT_LEVELS
    }), 200


@points_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get points transaction history"""
    current_user_id = int(get_jwt_identity())

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Filter by type
    transaction_type = request.args.get('type')

    query = PointsTransaction.query.filter_by(user_id=current_user_id)

    if transaction_type:
        query = query.filter_by(transaction_type=transaction_type)

    query = query.order_by(PointsTransaction.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    # Calculate totals
    earned = db.session.query(db.func.sum(PointsTransaction.points))\
        .filter(PointsTransaction.user_id == current_user_id)\
        .filter(PointsTransaction.points > 0).scalar() or 0

    spent = db.session.query(db.func.sum(db.func.abs(PointsTransaction.points)))\
        .filter(PointsTransaction.user_id == current_user_id)\
        .filter(PointsTransaction.points < 0).scalar() or 0

    return jsonify({
        'transactions': [t.to_dict() for t in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'total_earned': earned,
        'total_spent': spent
    }), 200


@points_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_activities():
    """Get available point-earning activities"""
    current_user_id = int(get_jwt_identity())

    # Check which one-time activities are completed
    completed_activities = set()

    # Check profile completion
    profile_complete = PointsTransaction.query.filter_by(
        user_id=current_user_id,
        transaction_type='profile_complete'
    ).first()
    if profile_complete:
        completed_activities.add('profile_complete')

    activities = [
        {
            'type': 'trade_complete',
            'title': 'Complete a Trade',
            'points': POINT_VALUES['trade_complete'],
            'description': 'Open and close any trade',
            'repeatable': True
        },
        {
            'type': 'profitable_day',
            'title': 'Profitable Trading Day',
            'points': POINT_VALUES['profitable_day'],
            'description': 'End the day in profit',
            'repeatable': True
        },
        {
            'type': 'phase1_passed',
            'title': 'Pass Phase 1',
            'points': POINT_VALUES['phase1_passed'],
            'description': 'Complete evaluation phase',
            'repeatable': True
        },
        {
            'type': 'phase2_passed',
            'title': 'Pass Phase 2',
            'points': POINT_VALUES['phase2_passed'],
            'description': 'Complete verification phase',
            'repeatable': True
        },
        {
            'type': 'funded',
            'title': 'Get Funded',
            'points': POINT_VALUES['funded'],
            'description': 'Become a funded trader',
            'repeatable': True
        },
        {
            'type': 'referral',
            'title': 'Refer a Friend',
            'points': POINT_VALUES['referral'],
            'description': 'When they make a purchase',
            'repeatable': True
        },
        {
            'type': 'profile_complete',
            'title': 'Complete Profile',
            'points': POINT_VALUES['profile_complete'],
            'description': 'Fill in all profile details',
            'repeatable': False,
            'completed': 'profile_complete' in completed_activities
        },
        {
            'type': 'trading_streak',
            'title': 'Trading Streak',
            'points': POINT_VALUES['trading_streak'],
            'description': '5 consecutive trading days',
            'repeatable': True
        },
        {
            'type': 'daily_login',
            'title': 'Daily Login',
            'points': POINT_VALUES['daily_login'],
            'description': 'Log in daily to earn',
            'repeatable': True
        }
    ]

    return jsonify({
        'activities': activities,
        'completed': list(completed_activities)
    }), 200


@points_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Get points leaderboard"""
    # Get time period
    period = request.args.get('period', 'all')  # all, month, week

    query = db.session.query(
        PointsBalance.user_id,
        PointsBalance.lifetime_earned,
        PointsBalance.level,
        User.username
    ).join(User, PointsBalance.user_id == User.id)

    if period == 'month':
        # For monthly, we need to sum transactions from this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_query = db.session.query(
            PointsTransaction.user_id,
            db.func.sum(PointsTransaction.points).label('points')
        ).filter(
            PointsTransaction.created_at >= start_of_month,
            PointsTransaction.points > 0
        ).group_by(PointsTransaction.user_id)\
         .order_by(db.desc('points'))\
         .limit(20).all()

        leaderboard = []
        for i, (user_id, points) in enumerate(monthly_query, 1):
            user = User.query.get(user_id)
            if user:
                leaderboard.append({
                    'rank': i,
                    'user_id': user_id,
                    'username': user.username,
                    'points': int(points) if points else 0
                })
        return jsonify({'leaderboard': leaderboard, 'period': 'month'}), 200

    elif period == 'week':
        start_of_week = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        weekly_query = db.session.query(
            PointsTransaction.user_id,
            db.func.sum(PointsTransaction.points).label('points')
        ).filter(
            PointsTransaction.created_at >= start_of_week,
            PointsTransaction.points > 0
        ).group_by(PointsTransaction.user_id)\
         .order_by(db.desc('points'))\
         .limit(20).all()

        leaderboard = []
        for i, (user_id, points) in enumerate(weekly_query, 1):
            user = User.query.get(user_id)
            if user:
                leaderboard.append({
                    'rank': i,
                    'user_id': user_id,
                    'username': user.username,
                    'points': int(points) if points else 0
                })
        return jsonify({'leaderboard': leaderboard, 'period': 'week'}), 200

    # All time
    results = query.order_by(PointsBalance.lifetime_earned.desc()).limit(20).all()

    leaderboard = []
    for i, (user_id, lifetime_earned, level, username) in enumerate(results, 1):
        leaderboard.append({
            'rank': i,
            'user_id': user_id,
            'username': username,
            'points': lifetime_earned,
            'level': level
        })

    return jsonify({'leaderboard': leaderboard, 'period': 'all'}), 200


@points_bp.route('/award', methods=['POST'])
@jwt_required()
def award_points():
    """Award points for an activity (internal use or admin)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    user = User.query.get(current_user_id)

    # Only admins can award arbitrary points to others
    target_user_id = data.get('user_id', current_user_id)
    if target_user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    transaction_type = data.get('transaction_type')
    if not transaction_type or transaction_type not in POINT_VALUES:
        return jsonify({'error': 'Invalid transaction_type'}), 400

    description = data.get('description')
    reference_id = data.get('reference_id')
    reference_type = data.get('reference_type')

    # Check for one-time activities
    if transaction_type == 'profile_complete':
        existing = PointsTransaction.query.filter_by(
            user_id=target_user_id,
            transaction_type='profile_complete'
        ).first()
        if existing:
            return jsonify({'error': 'Profile completion points already awarded'}), 400

    # Check daily login (once per day)
    if transaction_type == 'daily_login':
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = PointsTransaction.query.filter(
            PointsTransaction.user_id == target_user_id,
            PointsTransaction.transaction_type == 'daily_login',
            PointsTransaction.created_at >= today_start
        ).first()
        if existing:
            return jsonify({'error': 'Daily login already claimed today'}), 400

    transaction = PointsTransaction.award_points(
        user_id=target_user_id,
        transaction_type=transaction_type,
        description=description,
        reference_id=reference_id,
        reference_type=reference_type
    )

    if not transaction:
        return jsonify({'error': 'Failed to award points'}), 500

    # Get updated balance
    balance = PointsBalance.query.filter_by(user_id=target_user_id).first()

    return jsonify({
        'message': f'Awarded {POINT_VALUES[transaction_type]} points',
        'transaction': transaction.to_dict(),
        'balance': balance.to_dict() if balance else None
    }), 201


@points_bp.route('/daily-login', methods=['POST'])
@jwt_required()
def claim_daily_login():
    """Claim daily login points"""
    current_user_id = int(get_jwt_identity())

    # Check if already claimed today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = PointsTransaction.query.filter(
        PointsTransaction.user_id == current_user_id,
        PointsTransaction.transaction_type == 'daily_login',
        PointsTransaction.created_at >= today_start
    ).first()

    if existing:
        return jsonify({
            'message': 'Daily login already claimed',
            'already_claimed': True
        }), 200

    transaction = PointsTransaction.award_points(
        user_id=current_user_id,
        transaction_type='daily_login',
        description='Daily login bonus'
    )

    balance = PointsBalance.query.filter_by(user_id=current_user_id).first()

    return jsonify({
        'message': f'Claimed {POINT_VALUES["daily_login"]} points for daily login!',
        'already_claimed': False,
        'transaction': transaction.to_dict() if transaction else None,
        'balance': balance.to_dict() if balance else None
    }), 201


# ============================================
# REWARDS & REDEMPTION ENDPOINTS
# ============================================

@points_bp.route('/rewards', methods=['GET'])
@jwt_required()
def get_rewards_catalog():
    """Get available rewards catalog"""
    current_user_id = int(get_jwt_identity())

    # Get user's current balance and level
    balance = PointsBalance.query.filter_by(user_id=current_user_id).first()
    if not balance:
        balance = PointsBalance(user_id=current_user_id)
        db.session.add(balance)
        db.session.commit()

    user_level = balance.level
    user_points = balance.total_points

    # Optional filters
    category = request.args.get('category')
    affordable_only = request.args.get('affordable') == 'true'
    featured_only = request.args.get('featured') == 'true'

    rewards = []
    for reward_id, reward in REWARDS_CATALOG.items():
        if not reward.get('active', False):
            continue

        if category and reward['category'].value != category:
            continue

        if featured_only and not reward.get('featured', False):
            continue

        # Check if user can afford
        can_afford = user_points >= reward['points_cost']
        if affordable_only and not can_afford:
            continue

        # Check level requirement
        level_met = can_redeem_reward(user_level, reward['level_required'])

        # Get remaining stock
        remaining_stock = None
        if reward.get('stock') is not None:
            remaining_stock = PointsRedemption.get_remaining_stock(reward_id)

        rewards.append({
            **reward,
            'category': reward['category'].value if isinstance(reward['category'], RewardCategory) else reward['category'],
            'can_afford': can_afford,
            'level_met': level_met,
            'can_redeem': can_afford and level_met and (remaining_stock is None or remaining_stock > 0),
            'remaining_stock': remaining_stock
        })

    # Sort by featured first, then by points cost
    rewards.sort(key=lambda x: (not x.get('featured', False), x['points_cost']))

    # Group by category for frontend
    categories = {}
    for reward in rewards:
        cat = reward['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(reward)

    return jsonify({
        'rewards': rewards,
        'categories': categories,
        'user_balance': balance.to_dict(),
        'level_hierarchy': LEVEL_HIERARCHY
    }), 200


@points_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_reward():
    """Redeem points for a reward"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    reward_id = data.get('reward_id')
    shipping_address = data.get('shipping_address')

    if not reward_id:
        return jsonify({'error': 'Reward ID is required'}), 400

    # Get reward info
    reward = REWARDS_CATALOG.get(reward_id)
    if not reward:
        return jsonify({'error': 'Invalid reward ID'}), 400

    if not reward.get('active', False):
        return jsonify({'error': 'This reward is no longer available'}), 400

    # Get user's balance
    balance = PointsBalance.query.filter_by(user_id=current_user_id).first()
    if not balance:
        return jsonify({'error': 'No points balance found'}), 400

    # Check points
    if balance.total_points < reward['points_cost']:
        return jsonify({
            'error': 'Insufficient points',
            'required': reward['points_cost'],
            'available': balance.total_points
        }), 400

    # Check level requirement
    if not can_redeem_reward(balance.level, reward['level_required']):
        return jsonify({
            'error': f'This reward requires {reward["level_required"]} level or higher',
            'your_level': balance.level
        }), 400

    # Check stock
    if reward.get('stock') is not None:
        remaining = PointsRedemption.get_remaining_stock(reward_id)
        if remaining is not None and remaining <= 0:
            return jsonify({'error': 'This reward is out of stock'}), 400

    # Check shipping address for merchandise
    if reward.get('requires_shipping') and not shipping_address:
        return jsonify({'error': 'Shipping address is required for this reward'}), 400

    try:
        # Create redemption
        redemption = PointsRedemption.create_redemption(
            user_id=current_user_id,
            reward_id=reward_id,
            shipping_address=shipping_address
        )
        db.session.add(redemption)

        # Deduct points
        if not balance.spend_points(reward['points_cost']):
            return jsonify({'error': 'Failed to deduct points'}), 500

        # Create transaction record
        transaction = PointsTransaction(
            user_id=current_user_id,
            points=-reward['points_cost'],
            transaction_type='redemption',
            description=f'Redeemed: {reward["name"]}',
            reference_id=redemption.id,
            reference_type='redemption'
        )
        db.session.add(transaction)

        # Auto-complete for digital rewards (discounts, subscriptions)
        if reward['category'] in [RewardCategory.DISCOUNT, RewardCategory.SUBSCRIPTION]:
            redemption.status = RedemptionStatus.COMPLETED.value
            redemption.completed_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': f'Successfully redeemed {reward["name"]}!',
            'redemption': redemption.to_dict(),
            'new_balance': balance.to_dict(),
            'redemption_code': redemption.redemption_code
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process redemption'}), 500


@points_bp.route('/redemptions', methods=['GET'])
@jwt_required()
def get_redemption_history():
    """Get user's redemption history"""
    current_user_id = int(get_jwt_identity())

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    category = request.args.get('category')

    query = PointsRedemption.query.filter_by(user_id=current_user_id)

    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(reward_category=category)

    query = query.order_by(PointsRedemption.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    # Summary stats
    total_redeemed = db.session.query(db.func.sum(PointsRedemption.points_spent))\
        .filter(PointsRedemption.user_id == current_user_id)\
        .filter(PointsRedemption.status != RedemptionStatus.CANCELLED.value).scalar() or 0

    active_codes = PointsRedemption.query.filter(
        PointsRedemption.user_id == current_user_id,
        PointsRedemption.redemption_code.isnot(None),
        PointsRedemption.code_used == False,
        PointsRedemption.status == RedemptionStatus.COMPLETED.value
    ).count()

    return jsonify({
        'redemptions': [r.to_dict() for r in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'summary': {
            'total_points_redeemed': total_redeemed,
            'active_discount_codes': active_codes,
            'total_redemptions': paginated.total
        }
    }), 200


@points_bp.route('/redemptions/<int:redemption_id>', methods=['GET'])
@jwt_required()
def get_redemption_detail(redemption_id):
    """Get single redemption details"""
    current_user_id = int(get_jwt_identity())

    redemption = PointsRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404

    if redemption.user_id != current_user_id:
        user = User.query.get(current_user_id)
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({
        'redemption': redemption.to_dict()
    }), 200


@points_bp.route('/validate-code', methods=['POST'])
@jwt_required()
def validate_discount_code():
    """Validate a discount redemption code"""
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({'error': 'Code is required'}), 400

    redemption = PointsRedemption.query.filter_by(
        redemption_code=code.upper()
    ).first()

    if not redemption:
        return jsonify({'valid': False, 'error': 'Invalid code'}), 200

    if redemption.code_used:
        return jsonify({'valid': False, 'error': 'Code already used'}), 200

    if redemption.is_expired():
        return jsonify({'valid': False, 'error': 'Code has expired'}), 200

    if redemption.status != RedemptionStatus.COMPLETED.value:
        return jsonify({'valid': False, 'error': 'Code is not active'}), 200

    return jsonify({
        'valid': True,
        'discount_percent': float(redemption.reward_value),
        'reward_name': redemption.reward_name,
        'expires_at': redemption.expires_at.isoformat() if redemption.expires_at else None
    }), 200


@points_bp.route('/use-code', methods=['POST'])
@jwt_required()
def use_discount_code():
    """Mark a discount code as used"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({'error': 'Code is required'}), 400

    redemption = PointsRedemption.query.filter_by(
        redemption_code=code.upper()
    ).first()

    if not redemption:
        return jsonify({'error': 'Invalid code'}), 400

    if redemption.code_used:
        return jsonify({'error': 'Code already used'}), 400

    if redemption.is_expired():
        return jsonify({'error': 'Code has expired'}), 400

    # Mark as used
    redemption.use_code()
    db.session.commit()

    return jsonify({
        'message': 'Code applied successfully',
        'discount_percent': float(redemption.reward_value)
    }), 200


# Admin endpoints
@points_bp.route('/admin/redemptions', methods=['GET'])
@jwt_required()
def admin_get_all_redemptions():
    """Admin: Get all redemptions"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = PointsRedemption.query

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(PointsRedemption.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    redemptions = []
    for r in paginated.items:
        data = r.to_dict()
        data['user'] = {
            'id': r.user.id,
            'username': r.user.username,
            'email': r.user.email
        }
        redemptions.append(data)

    return jsonify({
        'redemptions': redemptions,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@points_bp.route('/admin/redemptions/<int:redemption_id>/process', methods=['POST'])
@jwt_required()
def admin_process_redemption(redemption_id):
    """Admin: Mark redemption as processing"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    notes = data.get('notes')

    redemption = PointsRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404

    redemption.process(processed_by_id=current_user_id, notes=notes)
    db.session.commit()

    return jsonify({
        'message': 'Redemption marked as processing',
        'redemption': redemption.to_dict()
    }), 200


@points_bp.route('/admin/redemptions/<int:redemption_id>/complete', methods=['POST'])
@jwt_required()
def admin_complete_redemption(redemption_id):
    """Admin: Complete a redemption"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    tracking_number = data.get('tracking_number')
    notes = data.get('notes')

    redemption = PointsRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404

    redemption.complete(tracking_number=tracking_number, notes=notes)
    db.session.commit()

    return jsonify({
        'message': 'Redemption completed',
        'redemption': redemption.to_dict()
    }), 200


@points_bp.route('/admin/redemptions/<int:redemption_id>/cancel', methods=['POST'])
@jwt_required()
def admin_cancel_redemption(redemption_id):
    """Admin: Cancel a redemption and refund points"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    notes = data.get('notes', 'Cancelled by admin')

    redemption = PointsRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404

    if redemption.status == RedemptionStatus.COMPLETED.value:
        return jsonify({'error': 'Cannot cancel completed redemption'}), 400

    # Refund points
    points_to_refund = redemption.cancel(notes=notes)

    # Add points back to user
    balance = PointsBalance.query.filter_by(user_id=redemption.user_id).first()
    if balance:
        balance.add_points(points_to_refund)

        # Create refund transaction
        transaction = PointsTransaction(
            user_id=redemption.user_id,
            points=points_to_refund,
            transaction_type='refund',
            description=f'Refund for cancelled redemption: {redemption.reward_name}',
            reference_id=redemption.id,
            reference_type='redemption'
        )
        db.session.add(transaction)

    db.session.commit()

    return jsonify({
        'message': f'Redemption cancelled. {points_to_refund} points refunded.',
        'redemption': redemption.to_dict()
    }), 200
