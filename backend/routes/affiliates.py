"""
Affiliate Program Routes
Multi-tier affiliate system with commissions, sub-affiliates, and payouts
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func, and_, or_
from models import (
    db, User, Referral, AffiliateCommission, AffiliatePayoutRequest,
    AffiliateStats, Payment, COMMISSION_RATES, PERFORMANCE_BONUSES, MINIMUM_PAYOUT
)

affiliates_bp = Blueprint('affiliates', __name__, url_prefix='/api/affiliates')


def get_or_create_affiliate_stats(user_id):
    """Get or create affiliate stats for a user"""
    stats = AffiliateStats.query.filter_by(affiliate_id=user_id).first()
    if not stats:
        stats = AffiliateStats(affiliate_id=user_id)
        db.session.add(stats)
        db.session.commit()
    return stats


def update_affiliate_stats(user_id):
    """Recalculate and update affiliate statistics"""
    stats = get_or_create_affiliate_stats(user_id)

    # Tier 1 stats (direct referrals)
    tier1_referrals = Referral.query.filter_by(referrer_id=user_id, tier=1).all()
    stats.tier1_referrals = len(tier1_referrals)
    stats.tier1_active_referrals = len([r for r in tier1_referrals if r.status == 'active'])

    tier1_commissions = AffiliateCommission.query.filter_by(
        affiliate_id=user_id, tier=1
    ).all()
    stats.tier1_total_revenue = sum(c.source_amount for c in tier1_commissions)
    stats.tier1_total_commissions = sum(c.total_amount for c in tier1_commissions)

    # Tier 2 stats (sub-referrals)
    tier2_commissions = AffiliateCommission.query.filter_by(
        affiliate_id=user_id, tier=2
    ).all()
    stats.tier2_referrals = len(set(c.source_user_id for c in tier2_commissions if c.source_user_id))
    stats.tier2_active_referrals = stats.tier2_referrals  # Simplified
    stats.tier2_total_revenue = sum(c.source_amount for c in tier2_commissions)
    stats.tier2_total_commissions = sum(c.total_amount for c in tier2_commissions)

    # Combined stats
    stats.total_referrals = stats.tier1_referrals + stats.tier2_referrals
    stats.total_revenue = stats.tier1_total_revenue + stats.tier2_total_revenue
    stats.total_commissions = stats.tier1_total_commissions + stats.tier2_total_commissions

    # Calculate paid and pending
    paid_commissions = AffiliateCommission.query.filter_by(
        affiliate_id=user_id, status='paid'
    ).all()
    stats.total_paid = sum(c.total_amount for c in paid_commissions)

    pending_commissions = AffiliateCommission.query.filter(
        AffiliateCommission.affiliate_id == user_id,
        AffiliateCommission.status.in_(['pending', 'approved'])
    ).all()
    stats.pending_balance = sum(c.total_amount for c in pending_commissions)

    # Update performance tier
    stats.calculate_performance_tier()

    db.session.commit()
    return stats


@affiliates_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_affiliate_dashboard():
    """Get comprehensive affiliate dashboard data"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Update and get stats
    stats = update_affiliate_stats(user_id)

    # Get user's referral code
    referral = Referral.query.filter_by(referrer_id=user_id, referred_id=None).first()
    if not referral:
        # Create a referral code if none exists
        import secrets
        code = f"{user.username[:4].upper()}{secrets.token_hex(3).upper()}"
        referral = Referral(
            referrer_id=user_id,
            referral_code=code,
            tier=1,
            commission_rate=COMMISSION_RATES[1]
        )
        db.session.add(referral)
        db.session.commit()

    # Recent commissions
    recent_commissions = AffiliateCommission.query.filter_by(
        affiliate_id=user_id
    ).order_by(AffiliateCommission.created_at.desc()).limit(10).all()

    # Monthly earnings (last 12 months)
    monthly_earnings = []
    for i in range(12):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
        month_end = (month_start + timedelta(days=32)).replace(day=1)

        month_total = db.session.query(func.sum(AffiliateCommission.total_amount)).filter(
            AffiliateCommission.affiliate_id == user_id,
            AffiliateCommission.created_at >= month_start,
            AffiliateCommission.created_at < month_end
        ).scalar() or Decimal('0.00')

        monthly_earnings.append({
            'month': month_start.strftime('%Y-%m'),
            'label': month_start.strftime('%b %Y'),
            'amount': float(month_total)
        })

    monthly_earnings.reverse()

    # Performance bonus info
    current_tier = stats.performance_tier
    next_tier = None
    next_tier_progress = None

    tier_order = ['none', 'bronze', 'silver', 'gold', 'platinum']
    current_idx = tier_order.index(current_tier)
    if current_idx < len(tier_order) - 1:
        next_tier = tier_order[current_idx + 1]
        next_req = PERFORMANCE_BONUSES[next_tier]
        next_tier_progress = {
            'referrals': {
                'current': stats.total_referrals,
                'required': next_req['min_referrals'],
                'percent': min(100, (stats.total_referrals / next_req['min_referrals']) * 100)
            },
            'revenue': {
                'current': float(stats.total_revenue),
                'required': next_req['min_revenue'],
                'percent': min(100, (float(stats.total_revenue) / next_req['min_revenue']) * 100)
            }
        }

    return jsonify({
        'referral_code': referral.referral_code,
        'referral_link': f"https://tradesense.com/signup?ref={referral.referral_code}",
        'stats': stats.to_dict(),
        'commission_rates': {
            'tier1': float(COMMISSION_RATES[1]),
            'tier2': float(COMMISSION_RATES[2])
        },
        'minimum_payout': float(MINIMUM_PAYOUT),
        'recent_commissions': [c.to_dict() for c in recent_commissions],
        'monthly_earnings': monthly_earnings,
        'performance': {
            'current_tier': current_tier,
            'bonus_rate': float(stats.get_bonus_rate()),
            'next_tier': next_tier,
            'next_tier_progress': next_tier_progress,
            'tiers': {
                name: {
                    'min_referrals': data['min_referrals'],
                    'min_revenue': data['min_revenue'],
                    'bonus_percent': float(data['bonus_percent'])
                }
                for name, data in PERFORMANCE_BONUSES.items()
            }
        }
    })


@affiliates_bp.route('/sub-affiliates', methods=['GET'])
@jwt_required()
def get_sub_affiliates():
    """Get list of sub-affiliates (Tier 2 - referrals made by your referrals)"""
    user_id = get_jwt_identity()

    # Get direct referrals
    direct_referrals = Referral.query.filter_by(
        referrer_id=user_id,
        tier=1
    ).filter(Referral.referred_id.isnot(None)).all()

    sub_affiliates = []
    for direct_ref in direct_referrals:
        # Get sub-referrals made by this direct referral
        sub_refs = Referral.query.filter_by(
            referrer_id=direct_ref.referred_id,
            tier=1
        ).filter(Referral.referred_id.isnot(None)).all()

        # Get tier 2 commissions from this sub-affiliate tree
        tier2_commissions = AffiliateCommission.query.filter_by(
            affiliate_id=user_id,
            tier=2
        ).filter(
            AffiliateCommission.source_user_id.in_([s.referred_id for s in sub_refs if s.referred_id])
        ).all()

        sub_affiliates.append({
            'direct_referral': {
                'id': direct_ref.referred_id,
                'username': direct_ref.referred.username if direct_ref.referred else 'Unknown',
                'joined_at': direct_ref.converted_at.isoformat() if direct_ref.converted_at else None,
                'status': direct_ref.status
            },
            'sub_referrals_count': len(sub_refs),
            'sub_referrals': [
                {
                    'id': sr.referred_id,
                    'username': sr.referred.username if sr.referred else 'Unknown',
                    'joined_at': sr.converted_at.isoformat() if sr.converted_at else None,
                    'status': sr.status
                }
                for sr in sub_refs[:5]  # Limit to 5 per direct referral
            ],
            'tier2_revenue': float(sum(c.source_amount for c in tier2_commissions)),
            'tier2_commissions': float(sum(c.total_amount for c in tier2_commissions))
        })

    return jsonify({
        'sub_affiliates': sub_affiliates,
        'total_direct_referrals': len(direct_referrals),
        'total_sub_referrals': sum(s['sub_referrals_count'] for s in sub_affiliates)
    })


@affiliates_bp.route('/commissions', methods=['GET'])
@jwt_required()
def get_commissions():
    """Get detailed commission history with filtering"""
    user_id = get_jwt_identity()

    # Query params
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tier = request.args.get('tier', type=int)
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = AffiliateCommission.query.filter_by(affiliate_id=user_id)

    if tier:
        query = query.filter_by(tier=tier)
    if status:
        query = query.filter_by(status=status)
    if start_date:
        query = query.filter(AffiliateCommission.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AffiliateCommission.created_at <= datetime.fromisoformat(end_date))

    query = query.order_by(AffiliateCommission.created_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Summary stats
    total_tier1 = db.session.query(func.sum(AffiliateCommission.total_amount)).filter(
        AffiliateCommission.affiliate_id == user_id,
        AffiliateCommission.tier == 1
    ).scalar() or Decimal('0.00')

    total_tier2 = db.session.query(func.sum(AffiliateCommission.total_amount)).filter(
        AffiliateCommission.affiliate_id == user_id,
        AffiliateCommission.tier == 2
    ).scalar() or Decimal('0.00')

    pending_total = db.session.query(func.sum(AffiliateCommission.total_amount)).filter(
        AffiliateCommission.affiliate_id == user_id,
        AffiliateCommission.status.in_(['pending', 'approved'])
    ).scalar() or Decimal('0.00')

    return jsonify({
        'commissions': [c.to_dict() for c in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        },
        'summary': {
            'total_tier1': float(total_tier1),
            'total_tier2': float(total_tier2),
            'pending_balance': float(pending_total),
            'total_all_time': float(total_tier1 + total_tier2)
        }
    })


@affiliates_bp.route('/payout-request', methods=['POST'])
@jwt_required()
def create_payout_request():
    """Create a payout request for approved commissions"""
    user_id = get_jwt_identity()
    data = request.get_json()

    payment_method = data.get('payment_method')
    payment_details = data.get('payment_details', {})

    if not payment_method:
        return jsonify({'error': 'Payment method is required'}), 400

    valid_methods = ['bank_transfer', 'paypal', 'crypto', 'wise']
    if payment_method not in valid_methods:
        return jsonify({'error': f'Invalid payment method. Choose from: {", ".join(valid_methods)}'}), 400

    # Check for pending payout request
    pending_request = AffiliatePayoutRequest.query.filter_by(
        affiliate_id=user_id,
        status='pending'
    ).first()

    if pending_request:
        return jsonify({
            'error': 'You already have a pending payout request',
            'pending_request': pending_request.to_dict()
        }), 400

    # Get approved commissions not yet paid
    approved_commissions = AffiliateCommission.query.filter(
        AffiliateCommission.affiliate_id == user_id,
        AffiliateCommission.status == 'approved',
        AffiliateCommission.payout_request_id.is_(None)
    ).all()

    if not approved_commissions:
        return jsonify({'error': 'No approved commissions available for payout'}), 400

    total_amount = sum(c.total_amount for c in approved_commissions)

    if total_amount < MINIMUM_PAYOUT:
        return jsonify({
            'error': f'Minimum payout is ${float(MINIMUM_PAYOUT)}. Current balance: ${float(total_amount)}'
        }), 400

    # Create payout request
    payout_request = AffiliatePayoutRequest(
        affiliate_id=user_id,
        amount=total_amount,
        payment_method=payment_method,
        payment_details=payment_details
    )
    db.session.add(payout_request)
    db.session.flush()

    # Link commissions to payout request
    for commission in approved_commissions:
        commission.payout_request_id = payout_request.id

    db.session.commit()

    return jsonify({
        'message': 'Payout request created successfully',
        'payout_request': payout_request.to_dict(),
        'commissions_count': len(approved_commissions),
        'total_amount': float(total_amount)
    }), 201


@affiliates_bp.route('/payouts', methods=['GET'])
@jwt_required()
def get_payout_history():
    """Get payout request history"""
    user_id = get_jwt_identity()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')

    query = AffiliatePayoutRequest.query.filter_by(affiliate_id=user_id)

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(AffiliatePayoutRequest.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Summary
    total_paid = db.session.query(func.sum(AffiliatePayoutRequest.amount)).filter(
        AffiliatePayoutRequest.affiliate_id == user_id,
        AffiliatePayoutRequest.status == 'completed'
    ).scalar() or Decimal('0.00')

    pending_amount = db.session.query(func.sum(AffiliatePayoutRequest.amount)).filter(
        AffiliatePayoutRequest.affiliate_id == user_id,
        AffiliatePayoutRequest.status.in_(['pending', 'processing'])
    ).scalar() or Decimal('0.00')

    return jsonify({
        'payouts': [p.to_dict() for p in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        },
        'summary': {
            'total_paid': float(total_paid),
            'pending_amount': float(pending_amount)
        }
    })


@affiliates_bp.route('/marketing-materials', methods=['GET'])
@jwt_required()
def get_marketing_materials():
    """Get downloadable marketing materials for affiliates"""
    user_id = get_jwt_identity()

    # In production, these would be actual URLs to marketing assets
    materials = [
        {
            'id': 1,
            'name': 'TradeSense Banner 728x90',
            'type': 'banner',
            'format': 'PNG',
            'size': '728x90',
            'url': '/api/affiliates/materials/banner-728x90.png',
            'preview': '/api/affiliates/materials/preview/banner-728x90.png'
        },
        {
            'id': 2,
            'name': 'TradeSense Banner 300x250',
            'type': 'banner',
            'format': 'PNG',
            'size': '300x250',
            'url': '/api/affiliates/materials/banner-300x250.png',
            'preview': '/api/affiliates/materials/preview/banner-300x250.png'
        },
        {
            'id': 3,
            'name': 'Social Media Kit',
            'type': 'kit',
            'format': 'ZIP',
            'description': 'Instagram, Facebook, Twitter sized images',
            'url': '/api/affiliates/materials/social-media-kit.zip'
        },
        {
            'id': 4,
            'name': 'Email Templates',
            'type': 'templates',
            'format': 'HTML',
            'description': '5 pre-written email templates',
            'url': '/api/affiliates/materials/email-templates.zip'
        },
        {
            'id': 5,
            'name': 'Promotional Video',
            'type': 'video',
            'format': 'MP4',
            'duration': '60s',
            'url': '/api/affiliates/materials/promo-video.mp4'
        }
    ]

    return jsonify({
        'materials': materials,
        'guidelines': {
            'title': 'Affiliate Marketing Guidelines',
            'rules': [
                'Always disclose affiliate relationship',
                'Do not make false claims about earnings',
                'Do not spam or use deceptive marketing',
                'Do not bid on TradeSense branded keywords',
                'Keep marketing materials up to date'
            ],
            'document_url': '/api/affiliates/guidelines.pdf'
        }
    })


@affiliates_bp.route('/referrals', methods=['GET'])
@jwt_required()
def get_referrals():
    """Get list of direct referrals"""
    user_id = get_jwt_identity()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = Referral.query.filter_by(referrer_id=user_id, tier=1)
    query = query.filter(Referral.referred_id.isnot(None))

    if status:
        query = query.filter_by(status=status)

    query = query.order_by(Referral.converted_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Enrich with commission data
    referrals_data = []
    for ref in pagination.items:
        # Get commissions from this referral
        commissions = AffiliateCommission.query.filter_by(
            affiliate_id=user_id,
            source_user_id=ref.referred_id,
            tier=1
        ).all()

        referrals_data.append({
            **ref.to_dict(),
            'total_revenue': float(sum(c.source_amount for c in commissions)),
            'total_commissions': float(sum(c.total_amount for c in commissions)),
            'commissions_count': len(commissions)
        })

    return jsonify({
        'referrals': referrals_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


# Admin routes for managing affiliate program
@affiliates_bp.route('/admin/pending-payouts', methods=['GET'])
@jwt_required()
def admin_get_pending_payouts():
    """Admin: Get all pending payout requests"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = AffiliatePayoutRequest.query.filter(
        AffiliatePayoutRequest.status.in_(['pending', 'processing'])
    ).order_by(AffiliatePayoutRequest.created_at.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    payouts_data = []
    for payout in pagination.items:
        payouts_data.append({
            **payout.to_dict(),
            'affiliate': {
                'id': payout.affiliate.id,
                'username': payout.affiliate.username,
                'email': payout.affiliate.email
            }
        })

    return jsonify({
        'payouts': payouts_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


@affiliates_bp.route('/admin/payouts/<int:payout_id>/process', methods=['POST'])
@jwt_required()
def admin_process_payout(payout_id):
    """Admin: Process a payout request"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    payout = AffiliatePayoutRequest.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout request not found'}), 404

    if payout.status != 'pending':
        return jsonify({'error': f'Payout is already {payout.status}'}), 400

    payout.process()
    db.session.commit()

    return jsonify({
        'message': 'Payout marked as processing',
        'payout': payout.to_dict()
    })


@affiliates_bp.route('/admin/payouts/<int:payout_id>/complete', methods=['POST'])
@jwt_required()
def admin_complete_payout(payout_id):
    """Admin: Complete a payout request"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    transaction_id = data.get('transaction_id')

    payout = AffiliatePayoutRequest.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout request not found'}), 404

    if payout.status not in ['pending', 'processing']:
        return jsonify({'error': f'Cannot complete payout with status: {payout.status}'}), 400

    # Mark payout as complete
    payout.complete(transaction_id)

    # Mark all associated commissions as paid
    for commission in payout.commissions:
        commission.mark_paid(payout.id)

    # Update affiliate stats
    update_affiliate_stats(payout.affiliate_id)

    db.session.commit()

    return jsonify({
        'message': 'Payout completed successfully',
        'payout': payout.to_dict()
    })


@affiliates_bp.route('/admin/payouts/<int:payout_id>/reject', methods=['POST'])
@jwt_required()
def admin_reject_payout(payout_id):
    """Admin: Reject a payout request"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    reason = data.get('reason')

    if not reason:
        return jsonify({'error': 'Rejection reason is required'}), 400

    payout = AffiliatePayoutRequest.query.get(payout_id)
    if not payout:
        return jsonify({'error': 'Payout request not found'}), 404

    if payout.status not in ['pending', 'processing']:
        return jsonify({'error': f'Cannot reject payout with status: {payout.status}'}), 400

    # Reject payout
    payout.reject(reason)

    # Unlink commissions so they can be included in future payouts
    for commission in payout.commissions:
        commission.payout_request_id = None
        commission.status = 'approved'

    db.session.commit()

    return jsonify({
        'message': 'Payout rejected',
        'payout': payout.to_dict()
    })


@affiliates_bp.route('/admin/commissions/approve', methods=['POST'])
@jwt_required()
def admin_approve_commissions():
    """Admin: Approve pending commissions"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    commission_ids = data.get('commission_ids', [])

    if not commission_ids:
        # Approve all pending commissions older than 7 days (holding period)
        holding_period = datetime.utcnow() - timedelta(days=7)
        commissions = AffiliateCommission.query.filter(
            AffiliateCommission.status == 'pending',
            AffiliateCommission.created_at < holding_period
        ).all()
    else:
        commissions = AffiliateCommission.query.filter(
            AffiliateCommission.id.in_(commission_ids),
            AffiliateCommission.status == 'pending'
        ).all()

    approved_count = 0
    for commission in commissions:
        commission.approve()
        approved_count += 1

    db.session.commit()

    return jsonify({
        'message': f'Approved {approved_count} commissions',
        'approved_count': approved_count
    })
