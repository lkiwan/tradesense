"""
Copy Trading routes for social trading features.
Handles copy relationships, settings, and performance tracking.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import desc

from models import (
    db, User, Trade, TraderProfile, TraderStatistics,
    CopyRelationship, CopiedTrade, MasterTraderSettings,
    CopyStatus, CopyMode, get_copy_relationship, is_copying
)
from services.copy_trading_service import CopyTradingService

copy_trading_bp = Blueprint('copy_trading', __name__, url_prefix='/api/copy-trading')


# ============== Discover Traders ==============

@copy_trading_bp.route('/traders', methods=['GET'])
@jwt_required()
def get_copyable_traders():
    """Get list of traders available for copying"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort', 'win_rate')  # win_rate, profit, copiers

    # Base query
    query = db.session.query(
        TraderProfile, TraderStatistics
    ).join(
        TraderStatistics,
        TraderProfile.user_id == TraderStatistics.user_id
    ).filter(
        TraderProfile.is_public == True,
        TraderProfile.allow_copy_trading == True,
        TraderProfile.user_id != current_user_id,
        TraderStatistics.total_trades >= 10
    )

    # Sorting
    if sort_by == 'win_rate':
        query = query.order_by(desc(TraderStatistics.win_rate))
    elif sort_by == 'profit':
        query = query.order_by(desc(TraderStatistics.net_profit))
    elif sort_by == 'copiers':
        query = query.order_by(desc(TraderProfile.copier_count))

    # Paginate
    results = query.paginate(page=page, per_page=per_page, error_out=False)

    traders = []
    for profile, stats in results.items:
        # Check if current user is already copying
        copying = is_copying(current_user_id, profile.user_id)

        # Get master settings
        master_settings = MasterTraderSettings.query.filter_by(user_id=profile.user_id).first()

        traders.append({
            'profile': profile.to_dict(),
            'statistics': stats.to_dict(),
            'master_settings': master_settings.to_dict() if master_settings else None,
            'is_copying': copying
        })

    return jsonify({
        'success': True,
        'traders': traders,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': results.total,
            'pages': results.pages
        }
    })


@copy_trading_bp.route('/traders/<int:user_id>', methods=['GET'])
@jwt_required()
def get_trader_details(user_id):
    """Get detailed info about a trader for copying"""
    current_user_id = get_jwt_identity()

    profile = TraderProfile.query.filter_by(user_id=user_id).first()
    if not profile or not profile.is_public or not profile.allow_copy_trading:
        return jsonify({'error': 'Trader not available for copying'}), 404

    stats = TraderStatistics.query.filter_by(user_id=user_id).first()
    master_settings = MasterTraderSettings.query.filter_by(user_id=user_id).first()

    # Get recent trades (if allowed)
    recent_trades = []
    if master_settings and master_settings.show_open_trades:
        trades = Trade.query.filter_by(
            user_id=user_id,
            status='closed'
        ).order_by(desc(Trade.closed_at)).limit(10).all()

        recent_trades = [{
            'symbol': t.symbol,
            'direction': t.direction,
            'profit': t.profit,
            'profit_pips': t.profit_pips,
            'closed_at': t.closed_at.isoformat() if t.closed_at else None
        } for t in trades]

    # Check if copying
    relationship = get_copy_relationship(current_user_id, user_id)

    return jsonify({
        'success': True,
        'profile': profile.to_dict(),
        'statistics': stats.to_dict() if stats else None,
        'master_settings': master_settings.to_dict() if master_settings else {
            'performance_fee_percent': 20,
            'minimum_copy_amount': 100
        },
        'recent_trades': recent_trades,
        'copy_relationship': relationship.to_dict(include_stats=True) if relationship else None
    })


# ============== Start/Stop Copying ==============

@copy_trading_bp.route('/start/<int:master_id>', methods=['POST'])
@jwt_required()
def start_copying(master_id):
    """Start copying a trader"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    # Can't copy yourself
    if int(current_user_id) == master_id:
        return jsonify({'error': 'Cannot copy yourself'}), 400

    # Check if trader allows copying
    profile = TraderProfile.query.filter_by(user_id=master_id).first()
    if not profile or not profile.allow_copy_trading:
        return jsonify({'error': 'This trader does not allow copying'}), 400

    # Check if already copying
    existing = get_copy_relationship(current_user_id, master_id)
    if existing and existing.status == CopyStatus.ACTIVE.value:
        return jsonify({'error': 'Already copying this trader'}), 400

    # Create or reactivate relationship
    if existing:
        existing.status = CopyStatus.ACTIVE.value
        existing.started_at = datetime.utcnow()
        relationship = existing
    else:
        relationship = CopyRelationship(
            copier_id=current_user_id,
            master_id=master_id,
            status=CopyStatus.ACTIVE.value
        )
        db.session.add(relationship)

    # Apply settings from request
    if 'copy_mode' in data:
        relationship.copy_mode = data['copy_mode']
    if 'copy_ratio' in data:
        relationship.copy_ratio = data['copy_ratio']
    if 'fixed_lot_size' in data:
        relationship.fixed_lot_size = data['fixed_lot_size']
    if 'max_lot_size' in data:
        relationship.max_lot_size = data['max_lot_size']
    if 'max_open_trades' in data:
        relationship.max_open_trades = data['max_open_trades']
    if 'max_drawdown_percent' in data:
        relationship.max_drawdown_percent = data['max_drawdown_percent']

    # Update copier count
    profile.copier_count = CopyRelationship.query.filter_by(
        master_id=master_id,
        status=CopyStatus.ACTIVE.value
    ).count() + 1

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Started copying trader',
        'relationship': relationship.to_dict()
    })


@copy_trading_bp.route('/stop/<int:master_id>', methods=['POST'])
@jwt_required()
def stop_copying(master_id):
    """Stop copying a trader"""
    current_user_id = get_jwt_identity()

    relationship = get_copy_relationship(current_user_id, master_id)
    if not relationship:
        return jsonify({'error': 'Not copying this trader'}), 400

    relationship.status = CopyStatus.STOPPED.value
    relationship.stopped_at = datetime.utcnow()

    # Update copier count
    profile = TraderProfile.query.filter_by(user_id=master_id).first()
    if profile:
        profile.copier_count = max(0, profile.copier_count - 1)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Stopped copying trader'
    })


@copy_trading_bp.route('/pause/<int:master_id>', methods=['POST'])
@jwt_required()
def pause_copying(master_id):
    """Pause copying a trader"""
    current_user_id = get_jwt_identity()

    relationship = get_copy_relationship(current_user_id, master_id)
    if not relationship or relationship.status != CopyStatus.ACTIVE.value:
        return jsonify({'error': 'Not actively copying this trader'}), 400

    relationship.status = CopyStatus.PAUSED.value
    relationship.paused_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Paused copying'
    })


@copy_trading_bp.route('/resume/<int:master_id>', methods=['POST'])
@jwt_required()
def resume_copying(master_id):
    """Resume copying a trader"""
    current_user_id = get_jwt_identity()

    relationship = get_copy_relationship(current_user_id, master_id)
    if not relationship or relationship.status != CopyStatus.PAUSED.value:
        return jsonify({'error': 'Copy relationship is not paused'}), 400

    relationship.status = CopyStatus.ACTIVE.value
    relationship.paused_at = None

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Resumed copying'
    })


# ============== Copy Settings ==============

@copy_trading_bp.route('/settings/<int:master_id>', methods=['GET'])
@jwt_required()
def get_copy_settings(master_id):
    """Get copy settings for a relationship"""
    current_user_id = get_jwt_identity()

    relationship = get_copy_relationship(current_user_id, master_id)
    if not relationship:
        return jsonify({'error': 'Not copying this trader'}), 404

    return jsonify({
        'success': True,
        'settings': relationship.to_dict(include_stats=True)
    })


@copy_trading_bp.route('/settings/<int:master_id>', methods=['PUT'])
@jwt_required()
def update_copy_settings(master_id):
    """Update copy settings for a relationship"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    relationship = get_copy_relationship(current_user_id, master_id)
    if not relationship:
        return jsonify({'error': 'Not copying this trader'}), 404

    # Updatable fields
    updatable = [
        'copy_mode', 'copy_ratio', 'fixed_lot_size', 'fixed_amount',
        'max_lot_size', 'max_open_trades', 'max_daily_trades',
        'max_drawdown_percent', 'stop_loss_adjustment', 'take_profit_adjustment',
        'copy_buy', 'copy_sell', 'allowed_symbols', 'excluded_symbols'
    ]

    for field in updatable:
        if field in data:
            setattr(relationship, field, data[field])

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Settings updated',
        'settings': relationship.to_dict(include_stats=True)
    })


# ============== My Copying Activity ==============

@copy_trading_bp.route('/my-copies', methods=['GET'])
@jwt_required()
def get_my_copies():
    """Get all traders I'm copying"""
    current_user_id = get_jwt_identity()
    status_filter = request.args.get('status', 'all')

    query = CopyRelationship.query.filter_by(copier_id=current_user_id)

    if status_filter != 'all':
        query = query.filter_by(status=status_filter)

    relationships = query.order_by(desc(CopyRelationship.created_at)).all()

    result = []
    for rel in relationships:
        profile = TraderProfile.query.filter_by(user_id=rel.master_id).first()
        stats = TraderStatistics.query.filter_by(user_id=rel.master_id).first()

        result.append({
            'relationship': rel.to_dict(include_stats=True),
            'master_profile': profile.to_dict() if profile else None,
            'master_stats': stats.to_dict() if stats else None
        })

    return jsonify({
        'success': True,
        'copies': result
    })


@copy_trading_bp.route('/my-copiers', methods=['GET'])
@jwt_required()
def get_my_copiers():
    """Get all traders copying me"""
    current_user_id = get_jwt_identity()

    relationships = CopyRelationship.query.filter_by(
        master_id=current_user_id,
        status=CopyStatus.ACTIVE.value
    ).order_by(desc(CopyRelationship.created_at)).all()

    result = []
    for rel in relationships:
        profile = TraderProfile.query.filter_by(user_id=rel.copier_id).first()

        result.append({
            'relationship': rel.to_dict(include_stats=True),
            'copier_profile': profile.to_dict() if profile else {
                'display_name': rel.copier.username,
                'avatar_url': None
            }
        })

    return jsonify({
        'success': True,
        'copiers': result,
        'total': len(result)
    })


# ============== Copied Trades History ==============

@copy_trading_bp.route('/trades', methods=['GET'])
@jwt_required()
def get_copied_trades():
    """Get history of copied trades"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    master_id = request.args.get('master_id', type=int)

    query = CopiedTrade.query.join(
        CopyRelationship
    ).filter(
        CopyRelationship.copier_id == current_user_id
    )

    if master_id:
        query = query.filter(CopyRelationship.master_id == master_id)

    trades = query.order_by(desc(CopiedTrade.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'trades': [t.to_dict() for t in trades.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': trades.total,
            'pages': trades.pages
        }
    })


# ============== Master Trader Settings ==============

@copy_trading_bp.route('/master-settings', methods=['GET'])
@jwt_required()
def get_master_settings():
    """Get my master trader settings"""
    current_user_id = get_jwt_identity()

    settings = MasterTraderSettings.query.filter_by(user_id=current_user_id).first()

    return jsonify({
        'success': True,
        'settings': settings.to_dict() if settings else None
    })


@copy_trading_bp.route('/master-settings', methods=['PUT'])
@jwt_required()
def update_master_settings():
    """Update my master trader settings"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    settings = MasterTraderSettings.query.filter_by(user_id=current_user_id).first()

    if not settings:
        settings = MasterTraderSettings(user_id=current_user_id)
        db.session.add(settings)

    # Updatable fields
    updatable = [
        'is_available', 'max_copiers', 'performance_fee_percent',
        'minimum_copy_amount', 'min_account_balance', 'require_kyc',
        'show_open_trades', 'trade_delay_seconds'
    ]

    for field in updatable:
        if field in data:
            setattr(settings, field, data[field])

    # Also update profile's allow_copy_trading
    profile = TraderProfile.query.filter_by(user_id=current_user_id).first()
    if profile and 'is_available' in data:
        profile.allow_copy_trading = data['is_available']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Settings updated',
        'settings': settings.to_dict()
    })


# ============== Performance Summary ==============

@copy_trading_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_copy_performance():
    """Get overall copy trading performance"""
    current_user_id = get_jwt_identity()

    # Get all my copy relationships
    relationships = CopyRelationship.query.filter_by(copier_id=current_user_id).all()

    total_profit = sum(r.total_profit for r in relationships)
    total_loss = sum(r.total_loss for r in relationships)
    total_trades = sum(r.total_copied_trades for r in relationships)

    # Get performance by master
    by_master = []
    for rel in relationships:
        profile = TraderProfile.query.filter_by(user_id=rel.master_id).first()
        by_master.append({
            'master_id': rel.master_id,
            'display_name': profile.display_name if profile else 'Unknown',
            'status': rel.status,
            'total_trades': rel.total_copied_trades,
            'profit': rel.total_profit,
            'loss': rel.total_loss,
            'net': rel.total_profit - rel.total_loss
        })

    return jsonify({
        'success': True,
        'performance': {
            'total_profit': round(total_profit, 2),
            'total_loss': round(total_loss, 2),
            'net_profit': round(total_profit - total_loss, 2),
            'total_trades': total_trades,
            'active_copies': len([r for r in relationships if r.status == CopyStatus.ACTIVE.value])
        },
        'by_master': by_master
    })
