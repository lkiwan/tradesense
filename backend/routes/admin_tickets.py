"""
Admin Support Tickets Routes
Routes for managing support tickets and user activity
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, SupportTicket, TicketMessage, UserActivity
from utils.decorators import permission_required, any_permission_required
from datetime import datetime, timedelta
from sqlalchemy import func, or_, desc

admin_tickets_bp = Blueprint('admin_tickets', __name__, url_prefix='/api/admin/tickets')


@admin_tickets_bp.route('', methods=['GET'])
@permission_required('view_tickets')
def get_tickets():
    """Get all support tickets with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        priority = request.args.get('priority', '')
        category = request.args.get('category', '')
        date_range = request.args.get('dateRange', '30d')

        # Build query
        query = SupportTicket.query

        # Apply search filter
        if search:
            query = query.join(User).filter(
                or_(
                    SupportTicket.subject.ilike(f'%{search}%'),
                    SupportTicket.id.cast(db.String).ilike(f'%{search}%'),
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )

        # Apply status filter
        if status:
            query = query.filter(SupportTicket.status == status)

        # Apply priority filter
        if priority:
            query = query.filter(SupportTicket.priority == priority)

        # Apply category filter
        if category:
            query = query.filter(SupportTicket.category == category)

        # Apply date range filter
        if date_range:
            now = datetime.utcnow()
            if date_range == '24h':
                start_date = now - timedelta(hours=24)
            elif date_range == '7d':
                start_date = now - timedelta(days=7)
            elif date_range == '30d':
                start_date = now - timedelta(days=30)
            elif date_range == '90d':
                start_date = now - timedelta(days=90)
            else:
                start_date = None

            if start_date:
                query = query.filter(SupportTicket.created_at >= start_date)

        # Get total count
        total = query.count()

        # Apply pagination and ordering
        tickets = query.order_by(desc(SupportTicket.updated_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        stats = {
            'total': SupportTicket.query.count(),
            'open': SupportTicket.query.filter_by(status='open').count(),
            'inProgress': SupportTicket.query.filter_by(status='in_progress').count(),
            'resolved': SupportTicket.query.filter_by(status='resolved').count(),
            'closed': SupportTicket.query.filter_by(status='closed').count(),
            'avgResponseTime': '2h 15m'  # Calculate actual response time
        }

        return jsonify({
            'tickets': [{
                'id': f'TKT-{str(t.id).zfill(3)}',
                'user': {
                    'id': t.user.id,
                    'username': t.user.username,
                    'email': t.user.email
                } if t.user else None,
                'subject': t.subject,
                'category': t.category,
                'priority': t.priority,
                'status': t.status,
                'messages_count': len(t.messages) if hasattr(t, 'messages') else 0,
                'last_reply': 'admin' if t.messages and t.messages[-1].sender == 'admin' else 'user' if t.messages else None,
                'assigned_to': {
                    'id': t.assigned_to_user.id,
                    'username': t.assigned_to_user.username
                } if hasattr(t, 'assigned_to_user') and t.assigned_to_user else None,
                'created_at': t.created_at.isoformat() if t.created_at else None,
                'updated_at': t.updated_at.isoformat() if t.updated_at else None
            } for t in tickets],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/stats', methods=['GET'])
@permission_required('view_tickets')
def get_ticket_stats():
    """Get ticket statistics"""
    try:
        stats = {
            'total': SupportTicket.query.count(),
            'open': SupportTicket.query.filter_by(status='open').count(),
            'inProgress': SupportTicket.query.filter_by(status='in_progress').count(),
            'resolved': SupportTicket.query.filter_by(status='resolved').count(),
            'closed': SupportTicket.query.filter_by(status='closed').count(),
            'avgResponseTime': '2h 15m'
        }

        # Get tickets by priority
        stats['byPriority'] = {
            'urgent': SupportTicket.query.filter_by(priority='urgent').count(),
            'high': SupportTicket.query.filter_by(priority='high').count(),
            'medium': SupportTicket.query.filter_by(priority='medium').count(),
            'low': SupportTicket.query.filter_by(priority='low').count()
        }

        # Get tickets by category
        stats['byCategory'] = {
            'payout': SupportTicket.query.filter_by(category='payout').count(),
            'challenge': SupportTicket.query.filter_by(category='challenge').count(),
            'account': SupportTicket.query.filter_by(category='account').count(),
            'technical': SupportTicket.query.filter_by(category='technical').count(),
            'billing': SupportTicket.query.filter_by(category='billing').count(),
            'other': SupportTicket.query.filter_by(category='other').count()
        }

        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@permission_required('view_tickets')
def get_ticket_details(ticket_id):
    """Get detailed ticket information"""
    try:
        ticket = SupportTicket.query.get_or_404(ticket_id)

        # Get messages
        messages = TicketMessage.query.filter_by(ticket_id=ticket_id).order_by(TicketMessage.created_at).all()

        return jsonify({
            'ticket': {
                'id': f'TKT-{str(ticket.id).zfill(3)}',
                'user': {
                    'id': ticket.user.id,
                    'username': ticket.user.username,
                    'email': ticket.user.email,
                    'avatar': None
                } if ticket.user else None,
                'subject': ticket.subject,
                'category': ticket.category,
                'priority': ticket.priority,
                'status': ticket.status,
                'assigned_to': {
                    'id': ticket.assigned_to_user.id,
                    'username': ticket.assigned_to_user.username
                } if hasattr(ticket, 'assigned_to_user') and ticket.assigned_to_user else None,
                'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
                'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None
            },
            'messages': [{
                'id': m.id,
                'sender': m.sender,
                'sender_name': m.sender_name or (ticket.user.username if m.sender == 'user' else 'Support Agent'),
                'content': m.content,
                'created_at': m.created_at.isoformat() if m.created_at else None,
                'attachments': m.attachments if hasattr(m, 'attachments') else []
            } for m in messages]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/<int:ticket_id>/reply', methods=['POST'])
@permission_required('respond_tickets')
def reply_to_ticket(ticket_id):
    """Reply to a support ticket"""
    try:
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)

        ticket = SupportTicket.query.get_or_404(ticket_id)
        data = request.get_json()

        content = data.get('content', '').strip()
        if not content:
            return jsonify({'error': 'Reply content is required'}), 400

        # Create message
        message = TicketMessage(
            ticket_id=ticket_id,
            sender='admin',
            sender_name=admin_user.username if admin_user else 'Support Agent',
            content=content
        )
        db.session.add(message)

        # Update ticket status if it was open
        if ticket.status == 'open':
            ticket.status = 'in_progress'

        ticket.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Reply sent successfully',
            'reply': {
                'id': message.id,
                'sender': message.sender,
                'sender_name': message.sender_name,
                'content': message.content,
                'created_at': message.created_at.isoformat() if message.created_at else None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/<int:ticket_id>/status', methods=['PUT'])
@permission_required('close_tickets')
def update_ticket_status(ticket_id):
    """Update ticket status"""
    try:
        ticket = SupportTicket.query.get_or_404(ticket_id)
        data = request.get_json()

        new_status = data.get('status')
        if new_status not in ['open', 'in_progress', 'resolved', 'closed']:
            return jsonify({'error': 'Invalid status'}), 400

        ticket.status = new_status
        ticket.updated_at = datetime.utcnow()

        if new_status == 'resolved':
            ticket.resolved_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': f'Ticket status updated to {new_status}',
            'ticket': {
                'id': ticket.id,
                'status': ticket.status
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/<int:ticket_id>/assign', methods=['PUT'])
@permission_required('assign_tickets')
def assign_ticket(ticket_id):
    """Assign ticket to an admin"""
    try:
        ticket = SupportTicket.query.get_or_404(ticket_id)
        data = request.get_json()

        admin_id = data.get('admin_id')
        if admin_id:
            admin_user = User.query.filter(
                User.id == admin_id,
                User.role.in_(['admin', 'superadmin'])
            ).first()

            if not admin_user:
                return jsonify({'error': 'Invalid admin user'}), 400

            ticket.assigned_to = admin_id
        else:
            ticket.assigned_to = None

        ticket.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Ticket assigned successfully',
            'ticket': {
                'id': ticket.id,
                'assigned_to': {
                    'id': admin_user.id,
                    'username': admin_user.username
                } if admin_id and admin_user else None
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/<int:ticket_id>/priority', methods=['PUT'])
@permission_required('respond_tickets')
def update_ticket_priority(ticket_id):
    """Update ticket priority"""
    try:
        ticket = SupportTicket.query.get_or_404(ticket_id)
        data = request.get_json()

        new_priority = data.get('priority')
        if new_priority not in ['low', 'medium', 'high', 'urgent']:
            return jsonify({'error': 'Invalid priority'}), 400

        ticket.priority = new_priority
        ticket.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': f'Ticket priority updated to {new_priority}',
            'ticket': {
                'id': ticket.id,
                'priority': ticket.priority
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# User Activity Routes
@admin_tickets_bp.route('/activity', methods=['GET'])
@permission_required('view_users')
def get_user_activities():
    """Get user activity log"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', '')
        action = request.args.get('action', '')
        date_range = request.args.get('dateRange', '24h')

        # Build query
        query = UserActivity.query

        # Apply search filter
        if search:
            query = query.join(User).filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    UserActivity.ip_address.ilike(f'%{search}%')
                )
            )

        # Apply action filter
        if action:
            query = query.filter(UserActivity.action == action)

        # Apply date range filter
        if date_range:
            now = datetime.utcnow()
            if date_range == '1h':
                start_date = now - timedelta(hours=1)
            elif date_range == '24h':
                start_date = now - timedelta(hours=24)
            elif date_range == '7d':
                start_date = now - timedelta(days=7)
            elif date_range == '30d':
                start_date = now - timedelta(days=30)
            else:
                start_date = None

            if start_date:
                query = query.filter(UserActivity.created_at >= start_date)

        # Get total count
        total = query.count()

        # Apply pagination and ordering
        activities = query.order_by(desc(UserActivity.created_at)).offset((page - 1) * limit).limit(limit).all()

        # Calculate stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stats = {
            'totalToday': UserActivity.query.filter(UserActivity.created_at >= today_start).count(),
            'logins': UserActivity.query.filter(
                UserActivity.action == 'login',
                UserActivity.created_at >= today_start
            ).count(),
            'trades': UserActivity.query.filter(
                UserActivity.action == 'trade',
                UserActivity.created_at >= today_start
            ).count(),
            'payments': UserActivity.query.filter(
                UserActivity.action == 'payment',
                UserActivity.created_at >= today_start
            ).count()
        }

        return jsonify({
            'activities': [{
                'id': a.id,
                'user': {
                    'id': a.user.id,
                    'username': a.user.username,
                    'email': a.user.email
                } if a.user else None,
                'action': a.action,
                'description': a.description,
                'ip_address': a.ip_address,
                'user_agent': a.user_agent,
                'created_at': a.created_at.isoformat() if a.created_at else None,
                'metadata': a.metadata if hasattr(a, 'metadata') else {}
            } for a in activities],
            'stats': stats,
            'total': total,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_tickets_bp.route('/activity/stats', methods=['GET'])
@permission_required('view_users')
def get_activity_stats():
    """Get activity statistics"""
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        stats = {
            'totalToday': UserActivity.query.filter(UserActivity.created_at >= today_start).count(),
            'logins': UserActivity.query.filter(
                UserActivity.action == 'login',
                UserActivity.created_at >= today_start
            ).count(),
            'logouts': UserActivity.query.filter(
                UserActivity.action == 'logout',
                UserActivity.created_at >= today_start
            ).count(),
            'trades': UserActivity.query.filter(
                UserActivity.action == 'trade',
                UserActivity.created_at >= today_start
            ).count(),
            'payments': UserActivity.query.filter(
                UserActivity.action == 'payment',
                UserActivity.created_at >= today_start
            ).count(),
            'settings': UserActivity.query.filter(
                UserActivity.action == 'settings',
                UserActivity.created_at >= today_start
            ).count(),
            'security': UserActivity.query.filter(
                UserActivity.action == 'security',
                UserActivity.created_at >= today_start
            ).count()
        }

        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
