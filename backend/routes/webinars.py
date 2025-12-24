"""
Webinar Routes for TradeSense
Public and admin endpoints for webinar management
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import or_
from slugify import slugify

from models import db
from models.user import User
from models.webinar import (
    Webinar, WebinarRegistration, WebinarResource, WebinarQuestion,
    WebinarStatus, WebinarType, WebinarCategory, RegistrationStatus,
    get_upcoming_webinars, get_live_webinars, get_past_webinars_with_recordings,
    is_user_registered, get_webinar_by_slug, CATEGORY_NAMES
)

webinars_bp = Blueprint('webinars', __name__, url_prefix='/api/webinars')


# ==================== PUBLIC ENDPOINTS ====================

@webinars_bp.route('', methods=['GET'])
def get_webinars():
    """Get all webinars with filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    status = request.args.get('status')  # upcoming, live, past, all
    category = request.args.get('category')
    search = request.args.get('search')

    query = Webinar.query.filter(
        Webinar.status != WebinarStatus.DRAFT.value,
        Webinar.status != WebinarStatus.CANCELLED.value
    )

    # Filter by status type
    if status == 'upcoming':
        query = query.filter(
            Webinar.status == WebinarStatus.SCHEDULED.value,
            Webinar.scheduled_at > datetime.utcnow()
        ).order_by(Webinar.scheduled_at.asc())
    elif status == 'live':
        query = query.filter(Webinar.status == WebinarStatus.LIVE.value)
    elif status == 'past':
        query = query.filter(
            Webinar.status == WebinarStatus.COMPLETED.value
        ).order_by(Webinar.scheduled_at.desc())
    elif status == 'recordings':
        query = query.filter(
            Webinar.status == WebinarStatus.COMPLETED.value,
            Webinar.has_recording == True
        ).order_by(Webinar.scheduled_at.desc())
    else:
        query = query.order_by(Webinar.scheduled_at.desc())

    # Filter by category
    if category:
        query = query.filter(Webinar.category == category)

    # Search
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            or_(
                Webinar.title.ilike(search_term),
                Webinar.description.ilike(search_term),
                Webinar.host_name.ilike(search_term)
            )
        )

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Check user registration status if authenticated
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        pass

    webinars_data = []
    for webinar in pagination.items:
        data = webinar.to_dict()
        if user_id:
            data['is_registered'] = is_user_registered(int(user_id), webinar.id)
        webinars_data.append(data)

    return jsonify({
        'webinars': webinars_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        },
        'categories': CATEGORY_NAMES
    })


@webinars_bp.route('/upcoming', methods=['GET'])
def get_upcoming():
    """Get upcoming webinars"""
    limit = request.args.get('limit', 6, type=int)
    webinars = get_upcoming_webinars(limit)

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        pass

    webinars_data = []
    for webinar in webinars:
        data = webinar.to_dict()
        if user_id:
            data['is_registered'] = is_user_registered(int(user_id), webinar.id)
        webinars_data.append(data)

    return jsonify({'webinars': webinars_data})


@webinars_bp.route('/live', methods=['GET'])
def get_live():
    """Get currently live webinars"""
    webinars = get_live_webinars()
    return jsonify({
        'webinars': [w.to_dict() for w in webinars]
    })


@webinars_bp.route('/recordings', methods=['GET'])
def get_recordings():
    """Get past webinars with recordings"""
    limit = request.args.get('limit', 20, type=int)
    webinars = get_past_webinars_with_recordings(limit)
    return jsonify({
        'webinars': [w.to_dict() for w in webinars]
    })


@webinars_bp.route('/<slug>', methods=['GET'])
def get_webinar(slug):
    """Get single webinar by slug"""
    webinar = get_webinar_by_slug(slug)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    # Increment view count
    webinar.view_count += 1
    db.session.commit()

    data = webinar.to_dict()

    # Check registration status
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            registration = WebinarRegistration.query.filter_by(
                webinar_id=webinar.id,
                user_id=int(user_id)
            ).first()
            data['is_registered'] = registration is not None
            data['registration'] = registration.to_dict() if registration else None

            # Include join URL if registered and webinar is live/about to start
            if registration and webinar.status in [WebinarStatus.LIVE.value, WebinarStatus.SCHEDULED.value]:
                data['join_url'] = webinar.join_url
    except:
        pass

    # Get resources (if available)
    resources = []
    for resource in webinar.resources:
        if webinar.is_past or resource.available_before:
            resources.append(resource.to_dict())
    data['resources'] = resources

    # Get featured questions
    questions = WebinarQuestion.query.filter_by(
        webinar_id=webinar.id,
        is_hidden=False
    ).order_by(WebinarQuestion.upvotes.desc()).limit(10).all()
    data['featured_questions'] = [q.to_dict() for q in questions if q.is_featured or q.is_answered]

    return jsonify({'webinar': data})


@webinars_bp.route('/<slug>/register', methods=['POST'])
@jwt_required()
def register_for_webinar(slug):
    """Register for a webinar"""
    user_id = get_jwt_identity()
    webinar = get_webinar_by_slug(slug)

    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    if not webinar.can_register:
        return jsonify({'error': 'Registration is not available for this webinar'}), 400

    # Check if already registered
    existing = WebinarRegistration.query.filter_by(
        webinar_id=webinar.id,
        user_id=int(user_id)
    ).first()

    if existing:
        if existing.status == RegistrationStatus.CANCELLED.value:
            # Re-register
            existing.status = RegistrationStatus.REGISTERED.value
            existing.cancelled_at = None
            existing.registered_at = datetime.utcnow()
            db.session.commit()
            webinar.registration_count += 1
            db.session.commit()
            return jsonify({
                'message': 'Successfully re-registered for webinar',
                'registration': existing.to_dict()
            })
        return jsonify({'error': 'Already registered for this webinar'}), 400

    # Check if webinar is paid
    if not webinar.is_free and webinar.price > 0:
        # TODO: Handle payment flow
        return jsonify({'error': 'Paid webinar - payment required'}), 402

    # Create registration
    registration = WebinarRegistration(
        webinar_id=webinar.id,
        user_id=int(user_id),
        status=RegistrationStatus.REGISTERED.value
    )
    db.session.add(registration)

    # Update registration count
    webinar.registration_count += 1
    db.session.commit()

    return jsonify({
        'message': 'Successfully registered for webinar',
        'registration': registration.to_dict(),
        'join_url': webinar.join_url if webinar.status == WebinarStatus.LIVE.value else None
    }), 201


@webinars_bp.route('/<slug>/unregister', methods=['POST'])
@jwt_required()
def unregister_from_webinar(slug):
    """Cancel webinar registration"""
    user_id = get_jwt_identity()
    webinar = get_webinar_by_slug(slug)

    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    registration = WebinarRegistration.query.filter_by(
        webinar_id=webinar.id,
        user_id=int(user_id)
    ).first()

    if not registration:
        return jsonify({'error': 'Not registered for this webinar'}), 400

    if webinar.is_past:
        return jsonify({'error': 'Cannot unregister from past webinars'}), 400

    registration.status = RegistrationStatus.CANCELLED.value
    registration.cancelled_at = datetime.utcnow()
    webinar.registration_count = max(0, webinar.registration_count - 1)
    db.session.commit()

    return jsonify({'message': 'Successfully unregistered from webinar'})


@webinars_bp.route('/<slug>/questions', methods=['GET'])
def get_questions(slug):
    """Get Q&A questions for a webinar"""
    webinar = get_webinar_by_slug(slug)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    questions = WebinarQuestion.query.filter_by(
        webinar_id=webinar.id,
        is_hidden=False
    ).order_by(WebinarQuestion.upvotes.desc(), WebinarQuestion.asked_at.desc()).all()

    return jsonify({
        'questions': [q.to_dict() for q in questions]
    })


@webinars_bp.route('/<slug>/questions', methods=['POST'])
@jwt_required()
def submit_question(slug):
    """Submit a question for a webinar"""
    user_id = get_jwt_identity()
    webinar = get_webinar_by_slug(slug)

    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    if not webinar.allow_questions:
        return jsonify({'error': 'Questions are not allowed for this webinar'}), 400

    data = request.get_json()
    question_text = data.get('question', '').strip()

    if not question_text:
        return jsonify({'error': 'Question is required'}), 400

    if len(question_text) > 1000:
        return jsonify({'error': 'Question is too long (max 1000 characters)'}), 400

    question = WebinarQuestion(
        webinar_id=webinar.id,
        user_id=int(user_id),
        question=question_text
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({
        'message': 'Question submitted successfully',
        'question': question.to_dict()
    }), 201


@webinars_bp.route('/my-registrations', methods=['GET'])
@jwt_required()
def get_my_registrations():
    """Get current user's webinar registrations"""
    user_id = get_jwt_identity()

    registrations = WebinarRegistration.query.filter_by(
        user_id=int(user_id)
    ).order_by(WebinarRegistration.registered_at.desc()).all()

    result = []
    for reg in registrations:
        data = reg.to_dict()
        data['webinar'] = reg.webinar.to_dict() if reg.webinar else None
        result.append(data)

    return jsonify({'registrations': result})


@webinars_bp.route('/<slug>/recording', methods=['GET'])
@jwt_required()
def get_recording(slug):
    """Get webinar recording (if registered)"""
    user_id = get_jwt_identity()
    webinar = get_webinar_by_slug(slug)

    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    if not webinar.has_recording:
        return jsonify({'error': 'Recording not available'}), 404

    # Check if user is registered
    registration = WebinarRegistration.query.filter_by(
        webinar_id=webinar.id,
        user_id=int(user_id)
    ).first()

    if not registration and not webinar.is_free:
        return jsonify({'error': 'Must be registered to access recording'}), 403

    # Update replay stats
    if registration:
        registration.watched_replay = True
        registration.replay_watch_count += 1
        registration.last_replay_watched_at = datetime.utcnow()

    webinar.replay_count += 1
    db.session.commit()

    return jsonify({
        'recording_url': webinar.recording_url,
        'duration': webinar.recording_duration,
        'resources': [r.to_dict() for r in webinar.resources]
    })


# ==================== ADMIN ENDPOINTS ====================

@webinars_bp.route('/admin/webinars', methods=['GET'])
@jwt_required()
def admin_get_webinars():
    """Admin: Get all webinars including drafts"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = Webinar.query

    if status:
        query = query.filter(Webinar.status == status)

    query = query.order_by(Webinar.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'webinars': [w.to_dict(include_private=True) for w in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@webinars_bp.route('/admin/webinars', methods=['POST'])
@jwt_required()
def admin_create_webinar():
    """Admin: Create a new webinar"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    # Validate required fields
    required = ['title', 'scheduled_at', 'host_name']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Generate slug
    slug = data.get('slug') or slugify(data['title'])
    base_slug = slug
    counter = 1
    while Webinar.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Parse scheduled time
    try:
        scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
    except:
        return jsonify({'error': 'Invalid scheduled_at format'}), 400

    webinar = Webinar(
        title=data['title'],
        slug=slug,
        description=data.get('description'),
        short_description=data.get('short_description'),
        host_name=data['host_name'],
        host_title=data.get('host_title'),
        host_bio=data.get('host_bio'),
        host_avatar=data.get('host_avatar'),
        scheduled_at=scheduled_at,
        duration_minutes=data.get('duration_minutes', 60),
        timezone=data.get('timezone', 'UTC'),
        status=data.get('status', WebinarStatus.DRAFT.value),
        webinar_type=data.get('webinar_type', WebinarType.LIVE.value),
        category=data.get('category', WebinarCategory.TRADING_BASICS.value),
        thumbnail=data.get('thumbnail'),
        banner_image=data.get('banner_image'),
        platform=data.get('platform', 'zoom'),
        meeting_id=data.get('meeting_id'),
        meeting_password=data.get('meeting_password'),
        join_url=data.get('join_url'),
        host_url=data.get('host_url'),
        is_free=data.get('is_free', True),
        price=data.get('price', 0.0),
        max_attendees=data.get('max_attendees', 500),
        requires_registration=data.get('requires_registration', True),
        send_reminder_emails=data.get('send_reminder_emails', True),
        allow_chat=data.get('allow_chat', True),
        allow_questions=data.get('allow_questions', True),
        meta_title=data.get('meta_title'),
        meta_description=data.get('meta_description')
    )

    db.session.add(webinar)
    db.session.commit()

    return jsonify({
        'message': 'Webinar created successfully',
        'webinar': webinar.to_dict(include_private=True)
    }), 201


@webinars_bp.route('/admin/webinars/<int:webinar_id>', methods=['PUT'])
@jwt_required()
def admin_update_webinar(webinar_id):
    """Admin: Update a webinar"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    data = request.get_json()

    # Update fields
    updatable_fields = [
        'title', 'description', 'short_description',
        'host_name', 'host_title', 'host_bio', 'host_avatar',
        'duration_minutes', 'timezone', 'status', 'webinar_type', 'category',
        'thumbnail', 'banner_image', 'platform',
        'meeting_id', 'meeting_password', 'join_url', 'host_url',
        'is_free', 'price', 'max_attendees',
        'requires_registration', 'send_reminder_emails', 'allow_chat', 'allow_questions',
        'has_recording', 'recording_url', 'recording_duration',
        'meta_title', 'meta_description'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(webinar, field, data[field])

    # Handle scheduled_at separately
    if 'scheduled_at' in data:
        try:
            webinar.scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid scheduled_at format'}), 400

    # Handle recording_available_at
    if 'recording_available_at' in data and data['recording_available_at']:
        try:
            webinar.recording_available_at = datetime.fromisoformat(data['recording_available_at'].replace('Z', '+00:00'))
        except:
            pass

    db.session.commit()

    return jsonify({
        'message': 'Webinar updated successfully',
        'webinar': webinar.to_dict(include_private=True)
    })


@webinars_bp.route('/admin/webinars/<int:webinar_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_webinar(webinar_id):
    """Admin: Delete a webinar"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    # Don't allow deleting live or completed webinars with registrations
    if webinar.status == WebinarStatus.LIVE.value:
        return jsonify({'error': 'Cannot delete a live webinar'}), 400

    if webinar.registration_count > 0 and webinar.status == WebinarStatus.COMPLETED.value:
        return jsonify({'error': 'Cannot delete completed webinar with registrations'}), 400

    db.session.delete(webinar)
    db.session.commit()

    return jsonify({'message': 'Webinar deleted successfully'})


@webinars_bp.route('/admin/webinars/<int:webinar_id>/start', methods=['POST'])
@jwt_required()
def admin_start_webinar(webinar_id):
    """Admin: Mark webinar as live"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    webinar.status = WebinarStatus.LIVE.value
    webinar.started_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Webinar started',
        'webinar': webinar.to_dict(include_private=True)
    })


@webinars_bp.route('/admin/webinars/<int:webinar_id>/end', methods=['POST'])
@jwt_required()
def admin_end_webinar(webinar_id):
    """Admin: Mark webinar as completed"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    data = request.get_json() or {}

    webinar.status = WebinarStatus.COMPLETED.value
    webinar.ended_at = datetime.utcnow()

    # Add recording info if provided
    if data.get('recording_url'):
        webinar.has_recording = True
        webinar.recording_url = data['recording_url']
        webinar.recording_duration = data.get('recording_duration')
        webinar.recording_available_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Webinar ended',
        'webinar': webinar.to_dict(include_private=True)
    })


@webinars_bp.route('/admin/webinars/<int:webinar_id>/registrations', methods=['GET'])
@jwt_required()
def admin_get_registrations(webinar_id):
    """Admin: Get registrations for a webinar"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    registrations = WebinarRegistration.query.filter_by(webinar_id=webinar_id).all()

    result = []
    for reg in registrations:
        data = reg.to_dict()
        data['user'] = {
            'id': reg.user_id,
            'username': User.query.get(reg.user_id).username if User.query.get(reg.user_id) else None,
            'email': User.query.get(reg.user_id).email if User.query.get(reg.user_id) else None
        }
        result.append(data)

    return jsonify({
        'registrations': result,
        'total': len(result),
        'attended': len([r for r in registrations if r.status == RegistrationStatus.ATTENDED.value]),
        'no_show': len([r for r in registrations if r.status == RegistrationStatus.NO_SHOW.value])
    })


@webinars_bp.route('/admin/webinars/<int:webinar_id>/resources', methods=['POST'])
@jwt_required()
def admin_add_resource(webinar_id):
    """Admin: Add a resource to a webinar"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    webinar = Webinar.query.get(webinar_id)
    if not webinar:
        return jsonify({'error': 'Webinar not found'}), 404

    data = request.get_json()

    if not data.get('title') or not data.get('file_url'):
        return jsonify({'error': 'Title and file_url are required'}), 400

    resource = WebinarResource(
        webinar_id=webinar_id,
        title=data['title'],
        description=data.get('description'),
        file_url=data['file_url'],
        file_type=data.get('file_type'),
        file_size=data.get('file_size'),
        available_before=data.get('available_before', False),
        available_after=data.get('available_after', True)
    )

    db.session.add(resource)
    db.session.commit()

    return jsonify({
        'message': 'Resource added successfully',
        'resource': resource.to_dict()
    }), 201


@webinars_bp.route('/admin/questions/<int:question_id>/answer', methods=['POST'])
@jwt_required()
def admin_answer_question(question_id):
    """Admin: Answer a question"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    question = WebinarQuestion.query.get(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404

    data = request.get_json()
    answer = data.get('answer', '').strip()

    if not answer:
        return jsonify({'error': 'Answer is required'}), 400

    question.answer = answer
    question.is_answered = True
    question.answered_at = datetime.utcnow()

    if data.get('is_featured'):
        question.is_featured = True

    db.session.commit()

    return jsonify({
        'message': 'Question answered',
        'question': question.to_dict()
    })
