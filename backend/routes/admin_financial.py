"""
Admin Financial Management Routes
Provides endpoints for managing payments, payouts, and financial analytics
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_

from models import db, User, Payment, Payout
from utils.decorators import permission_required, any_permission_required

admin_financial_bp = Blueprint('admin_financial', __name__, url_prefix='/api/admin/financial')


@admin_financial_bp.route('/overview', methods=['GET'])
@any_permission_required('view_payments', 'view_payouts')
def get_financial_overview():
    """Get financial overview statistics"""
    try:
        date_range = request.args.get('dateRange', '30d')

        # Calculate date range
        days = {'7d': 7, '30d': 30, '90d': 90, '1y': 365}.get(date_range, 30)
        start_date = datetime.utcnow() - timedelta(days=days)
        prev_start_date = start_date - timedelta(days=days)

        # Current period revenue
        current_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date
        ).scalar() or 0

        # Previous period revenue (for growth calculation)
        prev_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= prev_start_date,
            Payment.created_at < start_date
        ).scalar() or 0

        # Calculate growth
        revenue_growth = 0
        if prev_revenue > 0:
            revenue_growth = round(((current_revenue - prev_revenue) / prev_revenue) * 100, 1)

        # Pending payouts
        pending_payouts = db.session.query(func.sum(Payout.net_payout)).filter(
            Payout.status == 'pending'
        ).scalar() or 0

        # Completed payouts
        completed_payouts = db.session.query(func.sum(Payout.net_payout)).filter(
            Payout.status == 'paid',
            Payout.processed_at >= start_date
        ).scalar() or 0

        # Total revenue all time
        total_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed'
        ).scalar() or 0

        # Revenue data for chart (daily)
        revenue_data = []
        for i in range(min(days, 30)):
            day = datetime.utcnow() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            day_revenue = db.session.query(func.sum(Payment.amount)).filter(
                Payment.status == 'completed',
                Payment.created_at >= day_start,
                Payment.created_at < day_end
            ).scalar() or 0

            day_payouts = db.session.query(func.sum(Payout.net_payout)).filter(
                Payout.status == 'paid',
                Payout.processed_at >= day_start,
                Payout.processed_at < day_end
            ).scalar() or 0

            revenue_data.insert(0, {
                'date': day_start.strftime('%b %d'),
                'revenue': float(day_revenue),
                'payouts': float(day_payouts)
            })

        # Revenue by source (based on payment type)
        challenge_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date,
            Payment.challenge_id.isnot(None)
        ).scalar() or 0

        subscription_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date,
            Payment.subscription_id.isnot(None)
        ).scalar() or 0

        trial_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date,
            Payment.is_trial_conversion == True
        ).scalar() or 0

        other_revenue = current_revenue - challenge_revenue - subscription_revenue - trial_revenue

        total_for_percent = current_revenue if current_revenue > 0 else 1
        revenue_by_source = [
            {'source': 'Challenge Fees', 'amount': float(challenge_revenue), 'percentage': round(challenge_revenue / total_for_percent * 100, 1)},
            {'source': 'Subscriptions', 'amount': float(subscription_revenue), 'percentage': round(subscription_revenue / total_for_percent * 100, 1)},
            {'source': 'Trial Conversions', 'amount': float(trial_revenue), 'percentage': round(trial_revenue / total_for_percent * 100, 1)},
            {'source': 'Other', 'amount': float(other_revenue), 'percentage': round(other_revenue / total_for_percent * 100, 1)}
        ]

        # Recent transactions
        recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(3).all()
        recent_payouts = Payout.query.order_by(Payout.requested_at.desc()).limit(2).all()

        recent_transactions = []
        for p in recent_payments:
            recent_transactions.append({
                'id': p.id,
                'type': 'payment',
                'user': p.user.username if p.user else 'Unknown',
                'amount': float(p.amount),
                'status': p.status,
                'date': p.created_at.isoformat() if p.created_at else None
            })
        for po in recent_payouts:
            recent_transactions.append({
                'id': po.id,
                'type': 'payout',
                'user': po.user.username if po.user else 'Unknown',
                'amount': float(po.net_payout),
                'status': po.status,
                'date': po.requested_at.isoformat() if po.requested_at else None
            })

        # Sort by date
        recent_transactions.sort(key=lambda x: x['date'] or '', reverse=True)

        return jsonify({
            'stats': {
                'totalRevenue': float(total_revenue),
                'monthlyRevenue': float(current_revenue),
                'pendingPayouts': float(pending_payouts),
                'completedPayouts': float(completed_payouts),
                'revenueGrowth': revenue_growth,
                'payoutsGrowth': 0  # Can implement similar to revenue growth
            },
            'revenueData': revenue_data,
            'revenueBySource': revenue_by_source,
            'recentTransactions': recent_transactions[:5]
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_financial_bp.route('/payments', methods=['GET'])
@permission_required('view_payments')
def get_payments():
    """Get all payments with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        method = request.args.get('method', '')
        date_range = request.args.get('dateRange', '30d')

        query = Payment.query.join(User, Payment.user_id == User.id)

        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    Payment.transaction_id.ilike(f'%{search}%')
                )
            )

        # Status filter
        if status:
            query = query.filter(Payment.status == status)

        # Method filter
        if method:
            query = query.filter(Payment.payment_method == method)

        # Date range filter
        if date_range != 'all':
            days = {'7d': 7, '30d': 30, '90d': 90}.get(date_range, 30)
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Payment.created_at >= start_date)

        # Stats
        total = query.count()
        completed = query.filter(Payment.status == 'completed').count()
        pending = query.filter(Payment.status == 'pending').count()
        failed = query.filter(Payment.status == 'failed').count()
        total_amount = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed'
        ).scalar() or 0

        # Order and paginate
        query = query.order_by(Payment.created_at.desc())
        payments = query.offset((page - 1) * limit).limit(limit).all()

        payments_data = [{
            'id': f'PAY-{p.id:03d}',
            'user': {
                'id': p.user.id if p.user else None,
                'username': p.user.username if p.user else 'Unknown',
                'email': p.user.email if p.user else ''
            },
            'amount': float(p.amount),
            'currency': p.currency or 'USD',
            'method': p.payment_method or 'card',
            'status': p.status,
            'description': p.plan_type or 'Payment',
            'transaction_id': p.transaction_id,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in payments]

        return jsonify({
            'payments': payments_data,
            'stats': {
                'total': total,
                'completed': completed,
                'pending': pending,
                'failed': failed,
                'totalAmount': float(total_amount)
            },
            'total': total,
            'page': page,
            'limit': limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_financial_bp.route('/payouts', methods=['GET'])
@permission_required('view_payouts')
def get_payouts():
    """Get all payout requests with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        date_range = request.args.get('dateRange', '30d')

        query = Payout.query.join(User, Payout.user_id == User.id)

        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )

        # Status filter
        if status:
            query = query.filter(Payout.status == status)

        # Date range filter
        if date_range != 'all':
            days = {'7d': 7, '30d': 30, '90d': 90}.get(date_range, 30)
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Payout.requested_at >= start_date)

        # Stats
        total = Payout.query.count()
        pending = Payout.query.filter_by(status='pending').count()
        processing = Payout.query.filter_by(status='approved').count()
        completed = Payout.query.filter_by(status='paid').count()
        rejected = Payout.query.filter_by(status='rejected').count()
        pending_amount = db.session.query(func.sum(Payout.net_payout)).filter(
            Payout.status == 'pending'
        ).scalar() or 0

        # Order and paginate
        query = query.order_by(Payout.requested_at.desc())
        payouts = query.offset((page - 1) * limit).limit(limit).all()

        payouts_data = [{
            'id': f'PO-{po.id:03d}',
            'user': {
                'id': po.user.id if po.user else None,
                'username': po.user.username if po.user else 'Unknown',
                'email': po.user.email if po.user else ''
            },
            'challenge': {
                'id': po.challenge_id,
                'model': 'Standard Challenge'  # Can be improved with actual model name
            },
            'amount': float(po.net_payout),
            'gross_profit': float(po.gross_profit),
            'platform_fee': float(po.platform_fee),
            'currency': 'USD',
            'method': po.payment_method or 'bank_transfer',
            'status': po.status,
            'profit_split': 80,
            'rejection_reason': po.rejection_reason,
            'processed_at': po.processed_at.isoformat() if po.processed_at else None,
            'requested_at': po.requested_at.isoformat() if po.requested_at else None
        } for po in payouts]

        return jsonify({
            'payouts': payouts_data,
            'stats': {
                'total': total,
                'pending': pending,
                'processing': processing,
                'completed': completed,
                'rejected': rejected,
                'pendingAmount': float(pending_amount)
            },
            'total': query.count(),
            'page': page,
            'limit': limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_financial_bp.route('/payouts/<int:payout_id>/approve', methods=['POST'])
@permission_required('approve_payouts')
def approve_payout(payout_id):
    """Approve a payout request"""
    try:
        payout = Payout.query.get(payout_id)
        if not payout:
            return jsonify({'error': 'Payout not found'}), 404

        if payout.status != 'pending':
            return jsonify({'error': 'Payout is not pending'}), 400

        payout.status = 'processing'
        payout.approved_at = datetime.utcnow()
        payout.approved_by = get_jwt_identity()

        db.session.commit()

        return jsonify({
            'message': 'Payout approved successfully',
            'payout_id': payout_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_financial_bp.route('/payouts/<int:payout_id>/reject', methods=['POST'])
@permission_required('approve_payouts')
def reject_payout(payout_id):
    """Reject a payout request"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Rejected by admin')

        payout = Payout.query.get(payout_id)
        if not payout:
            return jsonify({'error': 'Payout not found'}), 404

        if payout.status not in ['pending', 'processing']:
            return jsonify({'error': 'Payout cannot be rejected'}), 400

        payout.status = 'rejected'
        payout.rejection_reason = reason
        payout.rejected_at = datetime.utcnow()
        payout.rejected_by = get_jwt_identity()

        db.session.commit()

        return jsonify({
            'message': 'Payout rejected',
            'payout_id': payout_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_financial_bp.route('/payouts/<int:payout_id>/complete', methods=['POST'])
@permission_required('process_payouts')
def complete_payout(payout_id):
    """Mark a payout as completed"""
    try:
        data = request.get_json()
        transaction_id = data.get('transaction_id', '')

        payout = Payout.query.get(payout_id)
        if not payout:
            return jsonify({'error': 'Payout not found'}), 404

        if payout.status != 'processing':
            return jsonify({'error': 'Payout must be processing to complete'}), 400

        payout.status = 'completed'
        payout.processed_at = datetime.utcnow()
        payout.transaction_id = transaction_id

        db.session.commit()

        return jsonify({
            'message': 'Payout completed successfully',
            'payout_id': payout_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
