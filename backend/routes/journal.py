"""
Trade Journal API Routes
CRUD operations for managing trade journal entries and analytics
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from decimal import Decimal
import csv
import io

from models import (
    db, JournalEntry, JournalTemplate, Trade, JOURNAL_TAGS, get_journal_analytics
)

journal_bp = Blueprint('journal', __name__, url_prefix='/api/journal')


# ==================== JOURNAL ENTRIES ====================

@journal_bp.route('', methods=['GET'])
@jwt_required()
def get_journal_entries():
    """Get all journal entries with optional filtering"""
    user_id = get_jwt_identity()

    # Query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    symbol = request.args.get('symbol')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    setup_quality = request.args.get('setup_quality')
    tag = request.args.get('tag')
    is_win = request.args.get('is_win')
    is_favorite = request.args.get('is_favorite')
    search = request.args.get('search')

    query = JournalEntry.query.filter_by(user_id=user_id)

    # Apply filters
    if symbol:
        query = query.filter(JournalEntry.symbol == symbol.upper())

    if start_date:
        query = query.filter(JournalEntry.trade_date >= datetime.strptime(start_date, '%Y-%m-%d').date())

    if end_date:
        query = query.filter(JournalEntry.trade_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    if setup_quality:
        query = query.filter(JournalEntry.setup_quality == setup_quality)

    if tag:
        query = query.filter(JournalEntry.tags.contains([tag]))

    if is_win == 'true':
        query = query.filter(JournalEntry.profit_loss > 0)
    elif is_win == 'false':
        query = query.filter(JournalEntry.profit_loss < 0)

    if is_favorite == 'true':
        query = query.filter(JournalEntry.is_favorite == True)

    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                JournalEntry.notes.ilike(search_term),
                JournalEntry.setup_description.ilike(search_term),
                JournalEntry.lessons_learned.ilike(search_term),
                JournalEntry.strategy_name.ilike(search_term)
            )
        )

    # Order by date descending
    query = query.order_by(JournalEntry.trade_date.desc(), JournalEntry.created_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'entries': [e.to_dict(include_full=False) for e in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@journal_bp.route('/<int:entry_id>', methods=['GET'])
@jwt_required()
def get_journal_entry(entry_id):
    """Get a specific journal entry"""
    user_id = get_jwt_identity()

    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'error': 'Journal entry not found'}), 404

    return jsonify({'entry': entry.to_dict()})


@journal_bp.route('', methods=['POST'])
@jwt_required()
def create_journal_entry():
    """Create a new journal entry"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    if 'symbol' not in data:
        return jsonify({'error': 'Symbol is required'}), 400
    if 'trade_type' not in data:
        return jsonify({'error': 'Trade type (buy/sell) is required'}), 400

    try:
        entry = JournalEntry(user_id=user_id)

        # Basic trade info
        entry.symbol = data['symbol'].upper()
        entry.trade_type = data['trade_type'].lower()
        entry.trade_id = data.get('trade_id')
        entry.challenge_id = data.get('challenge_id')

        # Trade details
        if 'lot_size' in data and data['lot_size']:
            entry.lot_size = Decimal(str(data['lot_size']))
        if 'entry_price' in data and data['entry_price']:
            entry.entry_price = Decimal(str(data['entry_price']))
        if 'exit_price' in data and data['exit_price']:
            entry.exit_price = Decimal(str(data['exit_price']))
        if 'stop_loss' in data and data['stop_loss']:
            entry.stop_loss = Decimal(str(data['stop_loss']))
        if 'take_profit' in data and data['take_profit']:
            entry.take_profit = Decimal(str(data['take_profit']))

        # Results
        if 'profit_loss' in data and data['profit_loss'] is not None:
            entry.profit_loss = Decimal(str(data['profit_loss']))
        if 'profit_pips' in data and data['profit_pips'] is not None:
            entry.profit_pips = Decimal(str(data['profit_pips']))
        if 'risk_reward_planned' in data and data['risk_reward_planned']:
            entry.risk_reward_planned = Decimal(str(data['risk_reward_planned']))

        # Timing
        entry.trade_date = datetime.strptime(data.get('trade_date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        if 'entry_time' in data and data['entry_time']:
            entry.entry_time = datetime.strptime(data['entry_time'], '%H:%M').time()
        if 'exit_time' in data and data['exit_time']:
            entry.exit_time = datetime.strptime(data['exit_time'], '%H:%M').time()
        entry.duration_minutes = data.get('duration_minutes')
        entry.session = data.get('session')

        # Analysis - Pre-Trade
        entry.setup_description = data.get('setup_description')
        entry.setup_quality = data.get('setup_quality')
        entry.entry_reason = data.get('entry_reason')
        entry.market_conditions = data.get('market_conditions')
        entry.timeframe = data.get('timeframe')
        entry.trend_direction = data.get('trend_direction')

        # Analysis - Post-Trade
        entry.exit_reason = data.get('exit_reason')
        entry.what_went_well = data.get('what_went_well')
        entry.what_went_wrong = data.get('what_went_wrong')
        entry.lessons_learned = data.get('lessons_learned')
        entry.execution_rating = data.get('execution_rating')
        entry.followed_plan = data.get('followed_plan')

        # Psychology
        entry.emotion_before = data.get('emotion_before')
        entry.emotion_during = data.get('emotion_during')
        entry.emotion_after = data.get('emotion_after')
        entry.confidence_level = data.get('confidence_level')
        entry.stress_level = data.get('stress_level')

        # Tags & Categories
        entry.tags = data.get('tags', [])
        entry.strategy_name = data.get('strategy_name')
        entry.is_mistake = data.get('is_mistake', False)
        entry.mistake_type = data.get('mistake_type')

        # Screenshots
        entry.screenshots = data.get('screenshots', [])
        entry.chart_before = data.get('chart_before')
        entry.chart_after = data.get('chart_after')

        # Notes
        entry.notes = data.get('notes')
        entry.trade_plan = data.get('trade_plan')

        # Ratings
        entry.overall_rating = data.get('overall_rating')
        entry.is_favorite = data.get('is_favorite', False)

        # Calculate derived metrics
        entry.calculate_metrics()

        db.session.add(entry)
        db.session.commit()

        return jsonify({
            'message': 'Journal entry created successfully',
            'entry': entry.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_journal_entry(entry_id):
    """Update a journal entry"""
    user_id = get_jwt_identity()
    data = request.get_json()

    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'error': 'Journal entry not found'}), 404

    try:
        # Update fields if provided
        updatable_fields = [
            'symbol', 'trade_type', 'lot_size', 'entry_price', 'exit_price',
            'stop_loss', 'take_profit', 'profit_loss', 'profit_pips',
            'risk_reward_planned', 'trade_date', 'entry_time', 'exit_time',
            'duration_minutes', 'session', 'setup_description', 'setup_quality',
            'entry_reason', 'market_conditions', 'timeframe', 'trend_direction',
            'exit_reason', 'what_went_well', 'what_went_wrong', 'lessons_learned',
            'execution_rating', 'followed_plan', 'emotion_before', 'emotion_during',
            'emotion_after', 'confidence_level', 'stress_level', 'tags',
            'strategy_name', 'is_mistake', 'mistake_type', 'screenshots',
            'chart_before', 'chart_after', 'notes', 'trade_plan',
            'overall_rating', 'is_favorite', 'is_public'
        ]

        decimal_fields = ['lot_size', 'entry_price', 'exit_price', 'stop_loss',
                         'take_profit', 'profit_loss', 'profit_pips', 'risk_reward_planned']

        for field in updatable_fields:
            if field in data:
                value = data[field]
                if field in decimal_fields and value is not None:
                    value = Decimal(str(value))
                elif field == 'trade_date' and value:
                    value = datetime.strptime(value, '%Y-%m-%d').date()
                elif field in ['entry_time', 'exit_time'] and value:
                    value = datetime.strptime(value, '%H:%M').time()
                elif field == 'symbol' and value:
                    value = value.upper()
                elif field == 'trade_type' and value:
                    value = value.lower()

                setattr(entry, field, value)

        # Recalculate metrics
        entry.calculate_metrics()

        db.session.commit()

        return jsonify({
            'message': 'Journal entry updated successfully',
            'entry': entry.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_entry(entry_id):
    """Delete a journal entry"""
    user_id = get_jwt_identity()

    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'error': 'Journal entry not found'}), 404

    try:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Journal entry deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== QUICK ACTIONS ====================

@journal_bp.route('/<int:entry_id>/toggle-favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(entry_id):
    """Toggle favorite status"""
    user_id = get_jwt_identity()

    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'error': 'Journal entry not found'}), 404

    entry.is_favorite = not entry.is_favorite
    db.session.commit()

    return jsonify({
        'message': f'Entry {"added to" if entry.is_favorite else "removed from"} favorites',
        'is_favorite': entry.is_favorite
    })


@journal_bp.route('/from-trade/<int:trade_id>', methods=['POST'])
@jwt_required()
def create_from_trade(trade_id):
    """Create a journal entry from an existing trade"""
    user_id = get_jwt_identity()

    trade = Trade.query.filter_by(id=trade_id, user_id=user_id).first()

    if not trade:
        return jsonify({'error': 'Trade not found'}), 404

    # Check if entry already exists for this trade
    existing = JournalEntry.query.filter_by(trade_id=trade_id, user_id=user_id).first()
    if existing:
        return jsonify({
            'message': 'Journal entry already exists for this trade',
            'entry': existing.to_dict()
        })

    try:
        entry = JournalEntry.create_from_trade(trade, user_id)
        db.session.add(entry)
        db.session.commit()

        return jsonify({
            'message': 'Journal entry created from trade',
            'entry': entry.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ANALYTICS ====================

@journal_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get comprehensive journal analytics"""
    user_id = get_jwt_identity()

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

    analytics = get_journal_analytics(user_id, start_date, end_date)

    return jsonify(analytics)


@journal_bp.route('/analytics/symbols', methods=['GET'])
@jwt_required()
def get_symbol_analytics():
    """Get analytics broken down by symbol"""
    user_id = get_jwt_identity()

    entries = JournalEntry.query.filter_by(user_id=user_id).all()

    by_symbol = {}
    for e in entries:
        if e.symbol not in by_symbol:
            by_symbol[e.symbol] = {
                'count': 0,
                'wins': 0,
                'losses': 0,
                'total_pnl': 0,
                'total_pips': 0
            }
        by_symbol[e.symbol]['count'] += 1
        if e.profit_loss:
            if float(e.profit_loss) > 0:
                by_symbol[e.symbol]['wins'] += 1
            else:
                by_symbol[e.symbol]['losses'] += 1
            by_symbol[e.symbol]['total_pnl'] += float(e.profit_loss)
        if e.profit_pips:
            by_symbol[e.symbol]['total_pips'] += float(e.profit_pips)

    # Calculate win rates
    for symbol in by_symbol:
        total = by_symbol[symbol]['wins'] + by_symbol[symbol]['losses']
        by_symbol[symbol]['win_rate'] = round((by_symbol[symbol]['wins'] / total) * 100, 1) if total > 0 else 0

    return jsonify({'by_symbol': by_symbol})


@journal_bp.route('/analytics/calendar', methods=['GET'])
@jwt_required()
def get_calendar_data():
    """Get journal data formatted for calendar view"""
    user_id = get_jwt_identity()
    year = request.args.get('year', datetime.utcnow().year, type=int)
    month = request.args.get('month', datetime.utcnow().month, type=int)

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    entries = JournalEntry.query.filter(
        JournalEntry.user_id == user_id,
        JournalEntry.trade_date >= start_date,
        JournalEntry.trade_date < end_date
    ).all()

    # Group by date
    by_date = {}
    for e in entries:
        date_str = e.trade_date.isoformat()
        if date_str not in by_date:
            by_date[date_str] = {
                'trades': 0,
                'wins': 0,
                'losses': 0,
                'pnl': 0
            }
        by_date[date_str]['trades'] += 1
        if e.profit_loss:
            if float(e.profit_loss) > 0:
                by_date[date_str]['wins'] += 1
            else:
                by_date[date_str]['losses'] += 1
            by_date[date_str]['pnl'] += float(e.profit_loss)

    return jsonify({'calendar_data': by_date})


# ==================== EXPORT ====================

@journal_bp.route('/export/csv', methods=['GET'])
@jwt_required()
def export_csv():
    """Export journal entries to CSV"""
    user_id = get_jwt_identity()

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = JournalEntry.query.filter_by(user_id=user_id)

    if start_date:
        query = query.filter(JournalEntry.trade_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(JournalEntry.trade_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    entries = query.order_by(JournalEntry.trade_date.desc()).all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        'Date', 'Symbol', 'Type', 'Lot Size', 'Entry Price', 'Exit Price',
        'Stop Loss', 'Take Profit', 'P/L ($)', 'P/L (pips)', 'R:R',
        'Setup Quality', 'Execution', 'Session', 'Timeframe',
        'Strategy', 'Tags', 'Emotion Before', 'Emotion After',
        'Followed Plan', 'Is Mistake', 'Lessons Learned', 'Notes'
    ])

    # Data rows
    for e in entries:
        writer.writerow([
            e.trade_date.isoformat() if e.trade_date else '',
            e.symbol,
            e.trade_type,
            float(e.lot_size) if e.lot_size else '',
            float(e.entry_price) if e.entry_price else '',
            float(e.exit_price) if e.exit_price else '',
            float(e.stop_loss) if e.stop_loss else '',
            float(e.take_profit) if e.take_profit else '',
            float(e.profit_loss) if e.profit_loss else '',
            float(e.profit_pips) if e.profit_pips else '',
            float(e.risk_reward_actual) if e.risk_reward_actual else '',
            e.setup_quality or '',
            e.execution_rating or '',
            e.session or '',
            e.timeframe or '',
            e.strategy_name or '',
            ','.join(e.tags) if e.tags else '',
            e.emotion_before or '',
            e.emotion_after or '',
            'Yes' if e.followed_plan else 'No' if e.followed_plan is False else '',
            'Yes' if e.is_mistake else 'No',
            e.lessons_learned or '',
            e.notes or ''
        ])

    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'trade_journal_{datetime.utcnow().strftime("%Y%m%d")}.csv'
    )


# ==================== TAGS ====================

@journal_bp.route('/tags', methods=['GET'])
@jwt_required()
def get_available_tags():
    """Get list of available tags"""
    user_id = get_jwt_identity()

    # Get user's custom tags
    entries = JournalEntry.query.filter_by(user_id=user_id).all()
    custom_tags = set()
    for e in entries:
        if e.tags:
            custom_tags.update(e.tags)

    # Combine with predefined tags
    all_tags = list(set(JOURNAL_TAGS) | custom_tags)
    all_tags.sort()

    return jsonify({
        'predefined': JOURNAL_TAGS,
        'custom': list(custom_tags - set(JOURNAL_TAGS)),
        'all': all_tags
    })


# ==================== TEMPLATES ====================

@journal_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_journal_templates():
    """Get user's journal templates"""
    user_id = get_jwt_identity()

    templates = JournalTemplate.query.filter_by(user_id=user_id).all()

    return jsonify({
        'templates': [t.to_dict() for t in templates]
    })


@journal_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_journal_template():
    """Create a journal template"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if 'name' not in data:
        return jsonify({'error': 'Template name is required'}), 400

    try:
        template = JournalTemplate(
            user_id=user_id,
            name=data['name'],
            setup_description=data.get('setup_description'),
            strategy_name=data.get('strategy_name'),
            timeframe=data.get('timeframe'),
            tags=data.get('tags', []),
            trade_plan=data.get('trade_plan')
        )

        db.session.add(template)
        db.session.commit()

        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_template(template_id):
    """Delete a journal template"""
    user_id = get_jwt_identity()

    template = JournalTemplate.query.filter_by(id=template_id, user_id=user_id).first()

    if not template:
        return jsonify({'error': 'Template not found'}), 404

    db.session.delete(template)
    db.session.commit()

    return jsonify({'message': 'Template deleted successfully'})
