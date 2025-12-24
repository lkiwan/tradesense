from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, User, SupportTicket, TicketMessage

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')


@tickets_bp.route('', methods=['POST'])
@jwt_required()
def create_ticket():
    """Create a new support ticket"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    subject = data.get('subject')
    message = data.get('message')
    category = data.get('category', 'general')
    priority = data.get('priority', 'medium')

    if not subject or not message:
        return jsonify({'error': 'subject and message are required'}), 400

    # Create ticket
    ticket = SupportTicket(
        user_id=current_user_id,
        subject=subject,
        category=category,
        priority=priority,
        status='open'
    )
    db.session.add(ticket)
    db.session.flush()  # Get ticket ID

    # Create initial message
    initial_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user_id,
        message=message
    )
    db.session.add(initial_message)
    db.session.commit()

    return jsonify({
        'message': 'Ticket created successfully',
        'ticket': ticket.to_dict(include_messages=True)
    }), 201


@tickets_bp.route('', methods=['GET'])
@jwt_required()
def get_tickets():
    """Get user's tickets (or all tickets for admin)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Filters
    status = request.args.get('status')
    category = request.args.get('category')

    # Base query
    if user.role in ['admin', 'superadmin']:
        query = SupportTicket.query
    else:
        query = SupportTicket.query.filter_by(user_id=current_user_id)

    # Apply filters
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)

    # Order by most recent
    query = query.order_by(SupportTicket.updated_at.desc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    # Get counts by status
    if user.role in ['admin', 'superadmin']:
        base_query = SupportTicket.query
    else:
        base_query = SupportTicket.query.filter_by(user_id=current_user_id)

    counts = {
        'all': base_query.count(),
        'open': base_query.filter_by(status='open').count(),
        'in_progress': base_query.filter_by(status='in_progress').count(),
        'waiting_response': base_query.filter_by(status='waiting_response').count(),
        'resolved': base_query.filter_by(status='resolved').count(),
        'closed': base_query.filter_by(status='closed').count()
    }

    return jsonify({
        'tickets': [t.to_dict() for t in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'counts': counts
    }), 200


@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get a specific ticket with messages"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    # Check authorization
    if ticket.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Filter out internal messages for non-admins
    messages = ticket.messages.all()
    if user.role not in ['admin', 'superadmin']:
        messages = [m for m in messages if not m.is_internal]

    ticket_dict = ticket.to_dict()
    ticket_dict['messages'] = [m.to_dict() for m in messages]

    return jsonify({'ticket': ticket_dict}), 200


@tickets_bp.route('/<int:ticket_id>/messages', methods=['POST'])
@jwt_required()
def add_message(ticket_id):
    """Add a message to a ticket"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    data = request.get_json()

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    # Check authorization
    if ticket.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    message_text = data.get('message')
    if not message_text:
        return jsonify({'error': 'message is required'}), 400

    is_internal = data.get('is_internal', False)
    # Only admins can create internal notes
    if is_internal and user.role not in ['admin', 'superadmin']:
        is_internal = False

    message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=current_user_id,
        message=message_text,
        is_internal=is_internal
    )
    db.session.add(message)

    # Update ticket status based on who replied
    if user.role in ['admin', 'superadmin']:
        if ticket.status == 'open':
            ticket.status = 'in_progress'
        elif ticket.status == 'waiting_response':
            ticket.status = 'in_progress'
    else:
        if ticket.status in ['in_progress', 'waiting_response']:
            ticket.status = 'waiting_response'

    ticket.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Message added successfully',
        'ticket_message': message.to_dict()
    }), 201


@tickets_bp.route('/<int:ticket_id>/close', methods=['PUT'])
@jwt_required()
def close_ticket(ticket_id):
    """Close a ticket"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    # Check authorization
    if ticket.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    ticket.close()
    db.session.commit()

    return jsonify({
        'message': 'Ticket closed successfully',
        'ticket': ticket.to_dict()
    }), 200


@tickets_bp.route('/<int:ticket_id>/reopen', methods=['PUT'])
@jwt_required()
def reopen_ticket(ticket_id):
    """Reopen a closed ticket"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    # Check authorization
    if ticket.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    if ticket.status not in ['resolved', 'closed']:
        return jsonify({'error': 'Ticket is not closed'}), 400

    ticket.reopen()
    db.session.commit()

    return jsonify({
        'message': 'Ticket reopened successfully',
        'ticket': ticket.to_dict()
    }), 200


@tickets_bp.route('/<int:ticket_id>/assign', methods=['PUT'])
@jwt_required()
def assign_ticket(ticket_id):
    """Assign a ticket to an admin (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    data = request.get_json()
    assignee_id = data.get('assignee_id')

    if assignee_id:
        assignee = User.query.get(assignee_id)
        if not assignee or assignee.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Invalid assignee'}), 400
        ticket.assigned_to = assignee_id
    else:
        ticket.assigned_to = current_user_id

    if ticket.status == 'open':
        ticket.status = 'in_progress'

    db.session.commit()

    return jsonify({
        'message': 'Ticket assigned successfully',
        'ticket': ticket.to_dict()
    }), 200


@tickets_bp.route('/<int:ticket_id>/status', methods=['PUT'])
@jwt_required()
def update_status(ticket_id):
    """Update ticket status (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['open', 'in_progress', 'waiting_response', 'resolved', 'closed']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

    ticket.status = new_status
    if new_status in ['resolved', 'closed']:
        ticket.resolved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Status updated successfully',
        'ticket': ticket.to_dict()
    }), 200


@tickets_bp.route('/<int:ticket_id>/priority', methods=['PUT'])
@jwt_required()
def update_priority(ticket_id):
    """Update ticket priority (admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    data = request.get_json()
    new_priority = data.get('priority')

    valid_priorities = ['low', 'medium', 'high', 'urgent']
    if new_priority not in valid_priorities:
        return jsonify({'error': f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'}), 400

    ticket.priority = new_priority
    db.session.commit()

    return jsonify({
        'message': 'Priority updated successfully',
        'ticket': ticket.to_dict()
    }), 200
