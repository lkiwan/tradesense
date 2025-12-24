"""
Events Routes for TradeSense
Handles promotional events, flash sales, and holiday bonuses
"""

import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from slugify import slugify

from models import db
from models.user import User
from models.promotional_event import (
    PromotionalEvent, EventOffer, EventRedemption, HolidayBonus,
    EventType, EventStatus, DiscountType, SEASONAL_TEMPLATES,
    get_active_events, get_active_banners, get_upcoming_events,
    get_event_by_slug, validate_promo_code, apply_best_offer
)

logger = logging.getLogger(__name__)

events_bp = Blueprint('events', __name__, url_prefix='/api/events')


# ==================== PUBLIC ENDPOINTS ====================

@events_bp.route('/active', methods=['GET'])
def get_active():
    """Get all active promotional events"""
    events = get_active_events()
    return jsonify({
        'events': [e.to_dict() for e in events],
        'count': len(events)
    })


@events_bp.route('/banners', methods=['GET'])
def get_banners():
    """Get active event banners for display"""
    banners = get_active_banners()
    return jsonify({
        'banners': [e.to_banner_dict() for e in banners]
    })


@events_bp.route('/upcoming', methods=['GET'])
def get_upcoming():
    """Get upcoming events"""
    limit = request.args.get('limit', 5, type=int)
    events = get_upcoming_events(limit=limit)
    return jsonify({
        'events': [e.to_dict(include_offers=False) for e in events],
        'count': len(events)
    })


@events_bp.route('/<slug>', methods=['GET'])
def get_event(slug):
    """Get event details by slug"""
    event = get_event_by_slug(slug)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Increment view count
    event.views += 1
    db.session.commit()

    return jsonify({
        'event': event.to_dict(),
        'landing_content': event.landing_page_content if event.has_landing_page else None
    })


@events_bp.route('/<slug>/click', methods=['POST'])
def track_click(slug):
    """Track click on event banner/link"""
    event = get_event_by_slug(slug)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    event.clicks += 1
    db.session.commit()

    return jsonify({'success': True})


@events_bp.route('/validate-code', methods=['POST'])
def validate_code():
    """Validate a promo code"""
    data = request.get_json()
    code = data.get('code', '').strip()
    purchase_type = data.get('purchase_type')
    amount = data.get('amount', 0)

    if not code:
        return jsonify({'error': 'Promo code required'}), 400

    offer, message = validate_promo_code(
        code=code,
        purchase_type=purchase_type,
        amount=amount
    )

    if not offer:
        return jsonify({'valid': False, 'error': message}), 400

    # Calculate example discount
    discounted_price = offer.calculate_discount(amount) if amount else None

    return jsonify({
        'valid': True,
        'offer': offer.to_dict(),
        'event': offer.event.to_dict(include_offers=False),
        'original_price': amount,
        'discounted_price': discounted_price,
        'savings': amount - discounted_price if discounted_price else None
    })


@events_bp.route('/best-offer', methods=['POST'])
@jwt_required()
def get_best_offer():
    """Get best available offer for a purchase"""
    user_id = get_jwt_identity()
    data = request.get_json()

    purchase_type = data.get('purchase_type', 'challenge')
    original_price = data.get('price', 0)
    account_size = data.get('account_size')

    offer, best_price = apply_best_offer(
        user_id=int(user_id),
        purchase_type=purchase_type,
        original_price=original_price,
        account_size=account_size
    )

    if offer:
        return jsonify({
            'has_offer': True,
            'offer': offer.to_dict(),
            'event': offer.event.to_dict(include_offers=False),
            'original_price': original_price,
            'discounted_price': best_price,
            'savings': original_price - best_price
        })

    return jsonify({
        'has_offer': False,
        'original_price': original_price,
        'discounted_price': original_price
    })


# ==================== USER ENDPOINTS ====================

@events_bp.route('/my-redemptions', methods=['GET'])
@jwt_required()
def get_my_redemptions():
    """Get user's event redemption history"""
    user_id = get_jwt_identity()

    redemptions = EventRedemption.query.filter_by(
        user_id=int(user_id)
    ).order_by(EventRedemption.redeemed_at.desc()).all()

    return jsonify({
        'redemptions': [r.to_dict() for r in redemptions]
    })


@events_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_offer():
    """Redeem an event offer"""
    user_id = get_jwt_identity()
    data = request.get_json()

    offer_id = data.get('offer_id')
    promo_code = data.get('promo_code')
    purchase_type = data.get('purchase_type')
    purchase_id = data.get('purchase_id')
    original_price = data.get('original_price', 0)

    # Get offer by ID or promo code
    offer = None
    if offer_id:
        offer = EventOffer.query.get(offer_id)
    elif promo_code:
        offer = EventOffer.query.filter_by(promo_code=promo_code.upper()).first()

    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    event = offer.event

    # Validate redemption
    can_redeem, msg = event.can_redeem(int(user_id))
    if not can_redeem:
        return jsonify({'error': msg}), 400

    # Check offer limits
    if offer.max_redemptions and offer.current_redemptions >= offer.max_redemptions:
        return jsonify({'error': 'This offer has reached its limit'}), 400

    # Calculate discount
    discounted_price = offer.calculate_discount(original_price)
    discount_amount = original_price - discounted_price

    # Create redemption record
    redemption = EventRedemption(
        event_id=event.id,
        offer_id=offer.id,
        user_id=int(user_id),
        promo_code_used=promo_code,
        original_price=original_price,
        discounted_price=discounted_price,
        discount_amount=discount_amount,
        purchase_type=purchase_type,
        purchase_id=purchase_id,
        bonus_points_awarded=offer.bonus_points or 0,
        bonus_days_awarded=offer.bonus_days or 0
    )

    # Update counts
    event.current_redemptions += 1
    offer.current_redemptions += 1

    db.session.add(redemption)
    db.session.commit()

    return jsonify({
        'success': True,
        'redemption': redemption.to_dict(),
        'discounted_price': discounted_price,
        'savings': discount_amount
    })


# ==================== HOLIDAY BONUSES ====================

@events_bp.route('/holiday-bonuses', methods=['GET'])
def get_holiday_bonuses():
    """Get available holiday bonuses"""
    now = datetime.utcnow()

    bonuses = HolidayBonus.query.filter(
        HolidayBonus.is_active == True,
        HolidayBonus.bonus_start <= now,
        HolidayBonus.bonus_end >= now
    ).all()

    return jsonify({
        'bonuses': [b.to_dict() for b in bonuses]
    })


@events_bp.route('/holiday-bonuses/upcoming', methods=['GET'])
def get_upcoming_holiday_bonuses():
    """Get upcoming holiday bonuses"""
    now = datetime.utcnow()

    bonuses = HolidayBonus.query.filter(
        HolidayBonus.is_active == True,
        HolidayBonus.bonus_start > now
    ).order_by(HolidayBonus.bonus_start.asc()).limit(5).all()

    return jsonify({
        'bonuses': [b.to_dict() for b in bonuses]
    })


# ==================== ADMIN ENDPOINTS ====================

@events_bp.route('/admin/list', methods=['GET'])
@jwt_required()
def admin_list_events():
    """Admin: List all events"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    status = request.args.get('status')
    event_type = request.args.get('type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = PromotionalEvent.query

    if status:
        query = query.filter_by(status=status)
    if event_type:
        query = query.filter_by(event_type=event_type)

    query = query.order_by(PromotionalEvent.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'events': [e.to_dict() for e in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@events_bp.route('/admin/create', methods=['POST'])
@jwt_required()
def admin_create_event():
    """Admin: Create a new event"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    # Check required fields
    required = ['name', 'start_date', 'end_date']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Generate slug
    slug = slugify(data['name'])
    base_slug = slug
    counter = 1
    while PromotionalEvent.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    try:
        event = PromotionalEvent(
            name=data['name'],
            slug=slug,
            description=data.get('description'),
            short_description=data.get('short_description'),
            event_type=data.get('event_type', EventType.CUSTOM.value),
            status=data.get('status', EventStatus.DRAFT.value),
            start_date=datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')),
            end_date=datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')),
            timezone=data.get('timezone', 'UTC'),
            banner_image=data.get('banner_image'),
            banner_mobile_image=data.get('banner_mobile_image'),
            background_color=data.get('background_color', '#1a1a2e'),
            accent_color=data.get('accent_color', '#6366f1'),
            text_color=data.get('text_color', '#ffffff'),
            show_banner=data.get('show_banner', True),
            banner_position=data.get('banner_position', 'top'),
            show_countdown=data.get('show_countdown', True),
            has_landing_page=data.get('has_landing_page', False),
            landing_page_content=data.get('landing_page_content'),
            target_all_users=data.get('target_all_users', True),
            target_new_users=data.get('target_new_users', False),
            target_existing_users=data.get('target_existing_users', False),
            min_user_level=data.get('min_user_level'),
            max_redemptions=data.get('max_redemptions'),
            max_per_user=data.get('max_per_user', 1),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description'),
            created_by=int(user_id)
        )

        db.session.add(event)
        db.session.commit()

        logger.info(f"Event created: {event.name} by user {user_id}")

        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating event: {e}")
        return jsonify({'error': str(e)}), 500


@events_bp.route('/admin/<int:event_id>', methods=['PUT'])
@jwt_required()
def admin_update_event(event_id):
    """Admin: Update an event"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    event = PromotionalEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()

    # Update fields
    updatable = [
        'name', 'description', 'short_description', 'event_type', 'status',
        'banner_image', 'banner_mobile_image', 'background_color', 'accent_color',
        'text_color', 'show_banner', 'banner_position', 'show_countdown',
        'has_landing_page', 'landing_page_content', 'target_all_users',
        'target_new_users', 'target_existing_users', 'min_user_level',
        'max_redemptions', 'max_per_user', 'meta_title', 'meta_description',
        'timezone'
    ]

    for field in updatable:
        if field in data:
            setattr(event, field, data[field])

    # Handle date fields
    if 'start_date' in data:
        event.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
    if 'end_date' in data:
        event.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))

    db.session.commit()

    return jsonify({
        'message': 'Event updated successfully',
        'event': event.to_dict()
    })


@events_bp.route('/admin/<int:event_id>/status', methods=['PATCH'])
@jwt_required()
def admin_update_status(event_id):
    """Admin: Update event status"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    event = PromotionalEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in [s.value for s in EventStatus]:
        return jsonify({'error': 'Invalid status'}), 400

    event.status = new_status
    db.session.commit()

    return jsonify({
        'message': f'Event status updated to {new_status}',
        'event': event.to_dict()
    })


@events_bp.route('/admin/<int:event_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_event(event_id):
    """Admin: Delete an event"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    event = PromotionalEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    db.session.delete(event)
    db.session.commit()

    return jsonify({'message': 'Event deleted successfully'})


# ==================== OFFER MANAGEMENT ====================

@events_bp.route('/admin/<int:event_id>/offers', methods=['POST'])
@jwt_required()
def admin_create_offer(event_id):
    """Admin: Add an offer to an event"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    event = PromotionalEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    data = request.get_json()

    # Generate unique promo code if provided
    promo_code = data.get('promo_code')
    if promo_code:
        promo_code = promo_code.upper()
        if EventOffer.query.filter_by(promo_code=promo_code).first():
            return jsonify({'error': 'Promo code already exists'}), 400

    offer = EventOffer(
        event_id=event_id,
        name=data.get('name', f"{event.name} Offer"),
        description=data.get('description'),
        discount_type=data.get('discount_type', DiscountType.PERCENTAGE.value),
        discount_value=data.get('discount_value', 0),
        applies_to=data.get('applies_to', 'all'),
        applicable_items=data.get('applicable_items'),
        promo_code=promo_code,
        requires_code=data.get('requires_code', False),
        min_purchase_amount=data.get('min_purchase_amount'),
        min_account_size=data.get('min_account_size'),
        bonus_points=data.get('bonus_points'),
        bonus_days=data.get('bonus_days'),
        free_addon_type=data.get('free_addon_type'),
        max_redemptions=data.get('max_redemptions'),
        is_active=data.get('is_active', True),
        priority=data.get('priority', 0)
    )

    db.session.add(offer)
    db.session.commit()

    return jsonify({
        'message': 'Offer created successfully',
        'offer': offer.to_dict()
    }), 201


@events_bp.route('/admin/offers/<int:offer_id>', methods=['PUT'])
@jwt_required()
def admin_update_offer(offer_id):
    """Admin: Update an offer"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    offer = EventOffer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    data = request.get_json()

    updatable = [
        'name', 'description', 'discount_type', 'discount_value',
        'applies_to', 'applicable_items', 'requires_code',
        'min_purchase_amount', 'min_account_size', 'bonus_points',
        'bonus_days', 'free_addon_type', 'max_redemptions',
        'is_active', 'priority'
    ]

    for field in updatable:
        if field in data:
            setattr(offer, field, data[field])

    # Handle promo code update
    if 'promo_code' in data and data['promo_code'] != offer.promo_code:
        new_code = data['promo_code'].upper() if data['promo_code'] else None
        if new_code and EventOffer.query.filter(
            EventOffer.id != offer_id,
            EventOffer.promo_code == new_code
        ).first():
            return jsonify({'error': 'Promo code already exists'}), 400
        offer.promo_code = new_code

    db.session.commit()

    return jsonify({
        'message': 'Offer updated successfully',
        'offer': offer.to_dict()
    })


@events_bp.route('/admin/offers/<int:offer_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_offer(offer_id):
    """Admin: Delete an offer"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    offer = EventOffer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    db.session.delete(offer)
    db.session.commit()

    return jsonify({'message': 'Offer deleted successfully'})


# ==================== HOLIDAY BONUS MANAGEMENT ====================

@events_bp.route('/admin/holiday-bonuses', methods=['POST'])
@jwt_required()
def admin_create_holiday_bonus():
    """Admin: Create a holiday bonus"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()

    bonus = HolidayBonus(
        name=data['name'],
        holiday_date=datetime.strptime(data['holiday_date'], '%Y-%m-%d').date(),
        bonus_start=datetime.fromisoformat(data['bonus_start'].replace('Z', '+00:00')),
        bonus_end=datetime.fromisoformat(data['bonus_end'].replace('Z', '+00:00')),
        bonus_type=data.get('bonus_type', 'points'),
        bonus_value=data['bonus_value'],
        min_trades=data.get('min_trades', 0),
        min_volume=data.get('min_volume', 0),
        is_active=data.get('is_active', True)
    )

    db.session.add(bonus)
    db.session.commit()

    return jsonify({
        'message': 'Holiday bonus created successfully',
        'bonus': bonus.to_dict()
    }), 201


@events_bp.route('/admin/holiday-bonuses/<int:bonus_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_holiday_bonus(bonus_id):
    """Admin: Delete a holiday bonus"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    bonus = HolidayBonus.query.get(bonus_id)
    if not bonus:
        return jsonify({'error': 'Holiday bonus not found'}), 404

    db.session.delete(bonus)
    db.session.commit()

    return jsonify({'message': 'Holiday bonus deleted successfully'})


# ==================== TEMPLATES ====================

@events_bp.route('/admin/templates', methods=['GET'])
@jwt_required()
def get_event_templates():
    """Get seasonal event templates"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    return jsonify({
        'templates': SEASONAL_TEMPLATES
    })


# ==================== ANALYTICS ====================

@events_bp.route('/admin/<int:event_id>/analytics', methods=['GET'])
@jwt_required()
def get_event_analytics(event_id):
    """Get analytics for an event"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Admin access required'}), 403

    event = PromotionalEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Get redemption stats
    redemptions = EventRedemption.query.filter_by(event_id=event_id).all()

    total_revenue = sum(r.discounted_price or 0 for r in redemptions)
    total_savings = sum(r.discount_amount or 0 for r in redemptions)
    total_bonus_points = sum(r.bonus_points_awarded or 0 for r in redemptions)

    # Get offer breakdown
    offer_stats = {}
    for offer in event.offers:
        offer_redemptions = [r for r in redemptions if r.offer_id == offer.id]
        offer_stats[offer.id] = {
            'name': offer.name,
            'redemptions': len(offer_redemptions),
            'revenue': sum(r.discounted_price or 0 for r in offer_redemptions)
        }

    return jsonify({
        'event_id': event_id,
        'views': event.views,
        'clicks': event.clicks,
        'click_rate': round((event.clicks / event.views * 100), 2) if event.views > 0 else 0,
        'total_redemptions': len(redemptions),
        'unique_users': len(set(r.user_id for r in redemptions)),
        'total_revenue': total_revenue,
        'total_savings_given': total_savings,
        'total_bonus_points_awarded': total_bonus_points,
        'conversion_rate': round((len(redemptions) / event.clicks * 100), 2) if event.clicks > 0 else 0,
        'offer_breakdown': offer_stats
    })
