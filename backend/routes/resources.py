from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from models import db, User, Resource, EconomicEvent
from services.calendar import get_calendar_service

resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')

# Initialize calendar service
calendar_service = get_calendar_service(db=db)


# ============ Resources Endpoints ============

@resources_bp.route('', methods=['GET'])
@jwt_required()
def get_resources():
    """Get all resources with optional filtering"""
    # Filters
    category = request.args.get('category')
    file_type = request.args.get('file_type')
    search = request.args.get('search')
    featured_only = request.args.get('featured', 'false').lower() == 'true'

    query = Resource.query.filter_by(is_active=True)

    if category and category != 'all':
        query = query.filter_by(category=category)
    if file_type:
        query = query.filter_by(file_type=file_type)
    if featured_only:
        query = query.filter_by(is_featured=True)
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                Resource.title.ilike(search_term),
                Resource.description.ilike(search_term)
            )
        )

    # Order by featured first, then by creation date
    resources = query.order_by(Resource.is_featured.desc(), Resource.created_at.desc()).all()

    # Get categories with counts
    categories = db.session.query(
        Resource.category,
        db.func.count(Resource.id)
    ).filter_by(is_active=True).group_by(Resource.category).all()

    category_counts = {cat: count for cat, count in categories}

    return jsonify({
        'resources': [r.to_dict() for r in resources],
        'total': len(resources),
        'categories': category_counts
    }), 200


@resources_bp.route('/<int:resource_id>', methods=['GET'])
@jwt_required()
def get_resource(resource_id):
    """Get a specific resource"""
    resource = Resource.query.get(resource_id)
    if not resource or not resource.is_active:
        return jsonify({'error': 'Resource not found'}), 404

    # Increment view count
    resource.increment_view()
    db.session.commit()

    return jsonify({'resource': resource.to_dict()}), 200


@resources_bp.route('/<int:resource_id>/download', methods=['POST'])
@jwt_required()
def download_resource(resource_id):
    """Record a download and return the file URL"""
    resource = Resource.query.get(resource_id)
    if not resource or not resource.is_active:
        return jsonify({'error': 'Resource not found'}), 404

    # Increment download count
    resource.increment_download()
    db.session.commit()

    return jsonify({
        'message': 'Download recorded',
        'file_url': resource.file_url,
        'download_count': resource.download_count
    }), 200


# Admin endpoints
@resources_bp.route('', methods=['POST'])
@jwt_required()
def create_resource():
    """Create a new resource (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['title', 'category', 'file_type', 'file_url']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    resource = Resource(
        title=data['title'],
        description=data.get('description'),
        category=data['category'],
        file_type=data['file_type'],
        file_url=data['file_url'],
        file_size=data.get('file_size'),
        duration=data.get('duration'),
        is_featured=data.get('is_featured', False)
    )
    db.session.add(resource)
    db.session.commit()

    return jsonify({
        'message': 'Resource created successfully',
        'resource': resource.to_dict()
    }), 201


@resources_bp.route('/<int:resource_id>', methods=['PUT'])
@jwt_required()
def update_resource(resource_id):
    """Update a resource (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404

    data = request.get_json()

    if 'title' in data:
        resource.title = data['title']
    if 'description' in data:
        resource.description = data['description']
    if 'category' in data:
        resource.category = data['category']
    if 'file_type' in data:
        resource.file_type = data['file_type']
    if 'file_url' in data:
        resource.file_url = data['file_url']
    if 'file_size' in data:
        resource.file_size = data['file_size']
    if 'duration' in data:
        resource.duration = data['duration']
    if 'is_featured' in data:
        resource.is_featured = data['is_featured']
    if 'is_active' in data:
        resource.is_active = data['is_active']

    db.session.commit()

    return jsonify({
        'message': 'Resource updated successfully',
        'resource': resource.to_dict()
    }), 200


@resources_bp.route('/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    """Delete a resource (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404

    # Soft delete
    resource.is_active = False
    db.session.commit()

    return jsonify({'message': 'Resource deleted successfully'}), 200


# ============ Economic Calendar Endpoints ============

@resources_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_events():
    """
    Get economic calendar events from multiple sources.
    Sources: Investing.com, ForexFactory, Moroccan events, Database
    """
    # Date range
    date_str = request.args.get('date')
    if date_str:
        try:
            event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            event_date = date.today()
    else:
        event_date = date.today()

    # Filters
    impact = request.args.get('impact')
    currency = request.args.get('currency')

    # Get events from calendar service (multi-source)
    events = calendar_service.get_events(event_date, impact, currency)

    return jsonify({
        'events': events,
        'date': event_date.isoformat(),
        'total': len(events),
        'sources': ['investing', 'forexfactory', 'moroccan', 'database']
    }), 200


@resources_bp.route('/calendar/week', methods=['GET'])
@jwt_required()
def get_week_events():
    """Get economic events for the current week from multiple sources"""
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    impact = request.args.get('impact')

    # Get week events from calendar service
    events_by_date = calendar_service.get_week_events(impact)

    # Count total events
    total = sum(len(events) for events in events_by_date.values())

    return jsonify({
        'events_by_date': events_by_date,
        'start_date': start_of_week.isoformat(),
        'end_date': end_of_week.isoformat(),
        'total': total,
        'sources': ['investing', 'forexfactory', 'moroccan', 'database']
    }), 200


@resources_bp.route('/calendar/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_events():
    """Get upcoming high-impact events within specified hours"""
    hours = request.args.get('hours', 24, type=int)
    events = calendar_service.get_upcoming_high_impact(hours)

    return jsonify({
        'events': events,
        'hours': hours,
        'total': len(events)
    }), 200


@resources_bp.route('/calendar/sync', methods=['POST'])
@jwt_required()
def sync_calendar():
    """Sync calendar events to database (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Sync next 7 days
    calendar_service.sync_to_database()

    return jsonify({
        'message': 'Calendar sync completed',
        'days_synced': 7
    }), 200


@resources_bp.route('/calendar/currencies', methods=['GET'])
def get_calendar_currencies():
    """Get available currencies/countries for calendar filtering"""
    currencies = [
        {"code": "USD", "name": "United States Dollar", "flag": "🇺🇸"},
        {"code": "EUR", "name": "Euro", "flag": "🇪🇺"},
        {"code": "GBP", "name": "British Pound", "flag": "🇬🇧"},
        {"code": "JPY", "name": "Japanese Yen", "flag": "🇯🇵"},
        {"code": "AUD", "name": "Australian Dollar", "flag": "🇦🇺"},
        {"code": "CAD", "name": "Canadian Dollar", "flag": "🇨🇦"},
        {"code": "CHF", "name": "Swiss Franc", "flag": "🇨🇭"},
        {"code": "CNY", "name": "Chinese Yuan", "flag": "🇨🇳"},
        {"code": "NZD", "name": "New Zealand Dollar", "flag": "🇳🇿"},
        {"code": "MAD", "name": "Moroccan Dirham", "flag": "🇲🇦"},
    ]
    return jsonify({'currencies': currencies}), 200


# Admin calendar endpoints
@resources_bp.route('/calendar', methods=['POST'])
@jwt_required()
def create_calendar_event():
    """Create an economic event (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    required_fields = ['event_date', 'event_time', 'currency', 'event', 'impact']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    try:
        event_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    event = EconomicEvent(
        event_date=event_date,
        event_time=data['event_time'],
        currency=data['currency'],
        event=data['event'],
        impact=data['impact'],
        forecast=data.get('forecast'),
        previous=data.get('previous'),
        actual=data.get('actual')
    )
    db.session.add(event)
    db.session.commit()

    return jsonify({
        'message': 'Economic event created successfully',
        'event': event.to_dict()
    }), 201


@resources_bp.route('/calendar/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_calendar_event(event_id):
    """Update an economic event (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    event = EconomicEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()

    if 'actual' in data:
        event.actual = data['actual']
    if 'forecast' in data:
        event.forecast = data['forecast']
    if 'previous' in data:
        event.previous = data['previous']

    db.session.commit()

    return jsonify({
        'message': 'Economic event updated successfully',
        'event': event.to_dict()
    }), 200
