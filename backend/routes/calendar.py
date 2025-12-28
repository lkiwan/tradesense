"""
Calendar API Routes - Economic calendar endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, datetime, timedelta

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')


def get_calendar_service():
    """Lazy load calendar service with dependencies."""
    from services.calendar.calendar_service import get_calendar_service as get_service
    from services.cache_service import cache
    return get_service(cache_service=cache)


@calendar_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    """
    Get economic events for a specific date.

    Query params:
        date: Target date in YYYY-MM-DD format (default: today)
        impact: 'all', 'high', 'medium', 'low' (default: all)
        currency: Filter by currency code (e.g., 'USD', 'EUR', 'MAD')
    """
    # Parse date parameter
    date_str = request.args.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today()

    impact = request.args.get('impact', 'all')
    currency = request.args.get('currency')

    service = get_calendar_service()
    events = service.get_events(target_date, impact=impact, currency=currency)

    return jsonify({
        'status': 'success',
        'date': target_date.isoformat(),
        'events': events,
        'count': len(events),
        'filters': {
            'impact': impact,
            'currency': currency
        }
    }), 200


@calendar_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_events():
    """Get today's economic events."""
    impact = request.args.get('impact')
    currency = request.args.get('currency')

    service = get_calendar_service()
    events = service.get_events(date.today(), impact=impact, currency=currency)

    return jsonify({
        'status': 'success',
        'date': date.today().isoformat(),
        'events': events,
        'count': len(events)
    }), 200


@calendar_bp.route('/week', methods=['GET'])
@jwt_required()
def get_week_events():
    """
    Get economic events for the current week grouped by date.

    Query params:
        impact: 'all', 'high', 'medium', 'low' (default: all)
    """
    impact = request.args.get('impact')

    service = get_calendar_service()
    events_by_date = service.get_week_events(impact=impact)

    # Calculate week range
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    # Count total events
    total_events = sum(len(events) for events in events_by_date.values())

    return jsonify({
        'status': 'success',
        'week_start': start_of_week.isoformat(),
        'week_end': end_of_week.isoformat(),
        'events_by_date': events_by_date,
        'total_events': total_events
    }), 200


@calendar_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_events():
    """
    Get upcoming economic events.

    Query params:
        hours: Number of hours to look ahead (default: 24)
        limit: Maximum number of events to return (default: 10)
    """
    try:
        hours = int(request.args.get('hours', 24))
        limit = int(request.args.get('limit', 10))
    except ValueError:
        return jsonify({'error': 'Invalid hours or limit parameter'}), 400

    # Cap hours at 168 (1 week)
    hours = min(hours, 168)

    service = get_calendar_service()
    events = service.get_upcoming_high_impact(hours=hours)

    # Apply limit
    events = events[:limit]

    return jsonify({
        'status': 'success',
        'hours': hours,
        'events': events,
        'count': len(events)
    }), 200


@calendar_bp.route('/high-impact', methods=['GET'])
@jwt_required()
def get_high_impact_events():
    """Get upcoming high-impact events for the next 24 hours."""
    service = get_calendar_service()
    events = service.get_upcoming_high_impact(hours=24)

    return jsonify({
        'status': 'success',
        'events': events,
        'count': len(events)
    }), 200


@calendar_bp.route('/currencies', methods=['GET'])
@jwt_required()
def get_currencies():
    """Get list of available currencies for filtering."""
    from services.calendar.calendar_service import CalendarService

    currencies = list(CalendarService.CURRENCY_FLAGS.keys())
    flags = CalendarService.CURRENCY_FLAGS

    return jsonify({
        'status': 'success',
        'currencies': [
            {'code': code, 'flag': flags.get(code, '')}
            for code in sorted(currencies)
        ]
    }), 200


@calendar_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_calendar():
    """
    Sync economic events to database.
    Admin only endpoint.
    """
    from models import User

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    # Parse optional date parameter
    date_str = request.json.get('date') if request.is_json else None
    target_date = None
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    try:
        service = get_calendar_service()
        service.sync_to_database(target_date)

        return jsonify({
            'status': 'success',
            'message': f'Calendar synced for {"next 7 days" if not target_date else target_date.isoformat()}'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@calendar_bp.route('/moroccan', methods=['GET'])
@jwt_required()
def get_moroccan_events():
    """Get Moroccan-specific economic events."""
    date_str = request.args.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        target_date = date.today()

    service = get_calendar_service()
    events = service.get_events(target_date, currency='MAD')

    return jsonify({
        'status': 'success',
        'date': target_date.isoformat(),
        'events': events,
        'count': len(events)
    }), 200
