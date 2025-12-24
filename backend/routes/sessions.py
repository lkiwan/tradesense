"""
Session Management Routes for TradeSense
Handles active session tracking and device management
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserSession, User

logger = logging.getLogger(__name__)

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/auth/sessions')


@sessions_bp.route('', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all active sessions for the current user"""
    user_id = int(get_jwt_identity())

    try:
        sessions = UserSession.get_active_sessions(user_id)

        # Get current session token from request
        current_token = request.headers.get('X-Session-Token')

        session_list = []
        for session in sessions:
            session_dict = session.to_dict()
            # Mark if this is the current session
            if current_token and session.session_token == current_token:
                session_dict['is_current'] = True
            session_list.append(session_dict)

        return jsonify({
            'sessions': session_list,
            'total': len(session_list)
        }), 200

    except Exception as e:
        logger.error(f"Error getting sessions: {e}")
        return jsonify({'error': 'Failed to get sessions'}), 500


@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific session"""
    user_id = int(get_jwt_identity())

    try:
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        return jsonify({'session': session.to_dict()}), 200

    except Exception as e:
        logger.error(f"Error getting session: {e}")
        return jsonify({'error': 'Failed to get session'}), 500


@sessions_bp.route('/<int:session_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_session(session_id):
    """Revoke a specific session"""
    user_id = int(get_jwt_identity())

    try:
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=user_id,
            is_active=True
        ).first()

        if not session:
            return jsonify({'error': 'Session not found or already revoked'}), 404

        # Check if trying to revoke current session
        current_token = request.headers.get('X-Session-Token')
        if current_token and session.session_token == current_token:
            return jsonify({'error': 'Cannot revoke current session. Use logout instead.'}), 400

        session.revoke()
        db.session.commit()

        logger.info(f"Session {session_id} revoked for user {user_id}")

        return jsonify({
            'message': 'Session revoked successfully',
            'session_id': session_id
        }), 200

    except Exception as e:
        logger.error(f"Error revoking session: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to revoke session'}), 500


@sessions_bp.route('/revoke-all', methods=['POST'])
@jwt_required()
def revoke_all_sessions():
    """Revoke all sessions except the current one"""
    user_id = int(get_jwt_identity())

    try:
        current_token = request.headers.get('X-Session-Token')

        # Find current session to exclude it
        current_session = None
        if current_token:
            current_session = UserSession.query.filter_by(
                session_token=current_token,
                user_id=user_id,
                is_active=True
            ).first()

        if current_session:
            revoked_count = UserSession.revoke_all_except(user_id, current_session.id)
        else:
            # If no current session found, revoke all
            revoked_count = UserSession.revoke_all(user_id)

        logger.info(f"Revoked {revoked_count} sessions for user {user_id}")

        return jsonify({
            'message': f'{revoked_count} session(s) revoked successfully',
            'revoked_count': revoked_count
        }), 200

    except Exception as e:
        logger.error(f"Error revoking all sessions: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to revoke sessions'}), 500


@sessions_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_session():
    """Get the current session info"""
    user_id = int(get_jwt_identity())
    current_token = request.headers.get('X-Session-Token')

    if not current_token:
        return jsonify({'error': 'No session token provided'}), 400

    try:
        session = UserSession.query.filter_by(
            session_token=current_token,
            user_id=user_id,
            is_active=True
        ).first()

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        session_dict = session.to_dict()
        session_dict['is_current'] = True

        return jsonify({'session': session_dict}), 200

    except Exception as e:
        logger.error(f"Error getting current session: {e}")
        return jsonify({'error': 'Failed to get current session'}), 500


def create_session_for_user(user_id, request_obj):
    """
    Helper function to create a new session when user logs in.
    Called from auth.py login endpoint.

    Returns: (session, is_suspicious, suspicious_reason)
    """
    ip_address = request_obj.headers.get('X-Forwarded-For', request_obj.remote_addr)
    if ip_address and ',' in ip_address:
        ip_address = ip_address.split(',')[0].strip()

    user_agent = request_obj.headers.get('User-Agent', '')
    accept_language = request_obj.headers.get('Accept-Language', '')

    # Generate device fingerprint
    device_fingerprint = UserSession.generate_device_fingerprint(
        user_agent, ip_address, accept_language
    )

    # Check for suspicious login
    is_suspicious, suspicious_reason = UserSession.check_suspicious_login(
        user_id, ip_address, device_fingerprint
    )

    # Create new session
    session = UserSession(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        device_fingerprint=device_fingerprint,
        is_suspicious=is_suspicious,
        is_current=True
    )

    db.session.add(session)
    db.session.commit()

    logger.info(f"New session created for user {user_id} from {ip_address} (suspicious={is_suspicious})")

    return session, is_suspicious, suspicious_reason


def send_new_device_alert(user, session, reason):
    """
    Send email alert for new device login.
    Called when a suspicious login is detected.
    """
    try:
        from tasks.email_tasks import send_security_alert_email
        send_security_alert_email.delay(
            user.email,
            user.username,
            {
                'type': 'new_device_login',
                'reason': reason,
                'device': f"{session.browser} on {session.os}",
                'ip_address': session.ip_address,
                'location': f"{session.city}, {session.country}" if session.city else session.country or 'Unknown',
                'time': session.created_at.isoformat() if session.created_at else None
            }
        )
        logger.info(f"Security alert email queued for user {user.id}")
    except Exception as e:
        logger.warning(f"Failed to send security alert email: {e}")
        # Try sync email as fallback
        try:
            from services.email_service import EmailService
            EmailService.send_security_alert_email(
                user.email,
                user.username,
                {
                    'type': 'new_device_login',
                    'reason': reason,
                    'device': f"{session.browser} on {session.os}",
                    'ip_address': session.ip_address,
                    'location': f"{session.city}, {session.country}" if session.city else session.country or 'Unknown',
                    'time': session.created_at.isoformat() if session.created_at else None
                }
            )
        except Exception as email_error:
            logger.error(f"Failed to send security alert email (sync): {email_error}")
