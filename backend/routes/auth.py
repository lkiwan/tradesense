import logging
import secrets
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from . import auth_bp
from models import db, User, UserStatus
from middleware.rate_limiter import (
    limiter,
    RateLimitTracker,
    get_ip_key
)
from services.audit_service import AuditService

logger = logging.getLogger(__name__)


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per hour", key_func=get_ip_key)
def register():
    """Register a new user"""
    data = request.get_json()

    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Check if user exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        preferred_language=data.get('preferred_language', 'fr')
    )
    user.set_password(data['password'])

    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)

    db.session.add(user)
    db.session.commit()

    # Send welcome email with verification link (async via Celery or sync fallback)
    try:
        from tasks.email_tasks import send_welcome_email, send_verification_email
        send_welcome_email.delay(user.id, user.email, user.username)
        send_verification_email.delay(user.id, user.email, verification_token)
        logger.info(f"Welcome and verification emails queued for {user.email}")
    except Exception as e:
        # Fallback to sync email if Celery is not available
        logger.warning(f"Celery not available, trying sync email: {e}")
        try:
            from services.email_service import EmailService
            EmailService.send_welcome_email(user.email, user.username)
            EmailService.send_verification_email(user.email, verification_token)
        except Exception as email_error:
            logger.error(f"Failed to send emails: {email_error}")

    # Create tokens (identity must be string for Flask-JWT-Extended)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Log registration event
    try:
        AuditService.log_register(user.id, user.username, user.email)
    except Exception as e:
        logger.warning(f"Failed to log registration audit: {e}")

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per 15 minutes", key_func=get_ip_key)
def login():
    """Login user"""
    try:
        logger.info("Login attempt started")
        data = request.get_json()
        logger.info(f"Got JSON data: {bool(data)}")

        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400

        email = data['email'].lower()
        ip_address = get_ip_key()
        logger.info(f"Login attempt for email: {email}")
    except Exception as e:
        logger.error(f"Error in login initial processing: {e}")
        return jsonify({'error': 'Server error during login'}), 500

    # Check if CAPTCHA is required due to failed attempts
    failed_attempts = RateLimitTracker.get_failed_attempts(ip_address)
    if RateLimitTracker.requires_captcha(ip_address):
        # Check for CAPTCHA token in request
        captcha_token = data.get('captcha_token')
        if not captcha_token:
            return jsonify({
                'error': 'CAPTCHA required',
                'requires_captcha': True,
                'failed_attempts': failed_attempts
            }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(data['password']):
        # Record failed attempt
        attempts = RateLimitTracker.record_failed_attempt(ip_address)
        RateLimitTracker.record_failed_attempt(f"email:{email}")

        # Log failed login attempt
        try:
            AuditService.log_login(
                user_id=user.id if user else None,
                username=user.username if user else email,
                success=False,
                error_message='Invalid password' if user else 'User not found'
            )
        except Exception as e:
            logger.warning(f"Failed to log login audit: {e}")

        response_data = {'error': 'Invalid email or password'}
        if attempts >= 3:
            response_data['requires_captcha'] = True
            response_data['failed_attempts'] = attempts

        return jsonify(response_data), 401

    # Check if user is banned
    user_status = UserStatus.query.filter_by(user_id=user.id).first()
    if user_status and user_status.is_banned:
        ban_reason = user_status.ban_reason or 'No reason provided'
        return jsonify({
            'error': 'This account has been banned',
            'banned': True,
            'reason': ban_reason
        }), 403

    # Check if 2FA is enabled
    from services.totp_service import TOTPService
    if TOTPService.is_2fa_required(user.id):
        # 2FA token provided in login request
        two_fa_token = data.get('two_fa_token')

        if not two_fa_token:
            # Return partial auth - need 2FA verification
            # Create a temporary token for 2FA verification step
            temp_token = create_access_token(
                identity=str(user.id),
                additional_claims={'requires_2fa': True}
            )
            return jsonify({
                'message': '2FA verification required',
                'requires_2fa': True,
                'temp_token': temp_token,
                'user_id': user.id
            }), 200

        # Verify 2FA token
        result = TOTPService.verify_2fa(user.id, two_fa_token)
        if not result['success']:
            return jsonify({
                'error': result.get('message', 'Invalid 2FA code'),
                'requires_2fa': True,
                'attempts_remaining': result.get('attempts_remaining')
            }), 401

    # Create user session for device tracking
    from routes.sessions import create_session_for_user, send_new_device_alert
    session, is_suspicious, suspicious_reason = create_session_for_user(user.id, request)

    # Send email alert for suspicious login (new device)
    if is_suspicious and suspicious_reason:
        send_new_device_alert(user, session, suspicious_reason)
        # Log suspicious login
        try:
            AuditService.log_suspicious_login(
                user_id=user.id,
                username=user.username,
                reason=suspicious_reason,
                metadata={'session_id': session.id, 'ip': session.ip_address}
            )
        except Exception as e:
            logger.warning(f"Failed to log suspicious login audit: {e}")

    # Clear failed login attempts on successful login
    RateLimitTracker.clear_failed_attempts(ip_address)
    RateLimitTracker.clear_failed_attempts(f"email:{email}")

    # Log successful login
    try:
        AuditService.log_login(
            user_id=user.id,
            username=user.username,
            success=True,
            metadata={'session_id': session.id, 'is_new_device': is_suspicious}
        )
    except Exception as e:
        logger.warning(f"Failed to log login audit: {e}")

    # Generate full access tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'session_token': session.session_token,
        'is_new_device': is_suspicious
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(current_user_id))
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user info"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    # Update allowed fields
    if 'username' in data:
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Username already exists'}), 400
        user.username = data['username']

    if 'avatar' in data:
        user.avatar = data['avatar']

    if 'preferred_language' in data:
        user.preferred_language = data['preferred_language']

    if 'password' in data:
        user.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour", key_func=get_ip_key)
@limiter.limit("3 per hour", key_func=lambda: f"reset:{request.get_json(silent=True).get('email', '').lower()}" if request.get_json(silent=True) else get_ip_key())
def forgot_password():
    """Request password reset email"""
    data = request.get_json()

    if not data or 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=data['email']).first()

    # Always return success to prevent email enumeration
    if not user:
        return jsonify({
            'message': 'If an account exists with this email, a reset link will be sent'
        }), 200

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    # Log password reset request
    try:
        AuditService.log_password_reset_request(user.id, user.username, user.email)
    except Exception as e:
        logger.warning(f"Failed to log password reset audit: {e}")

    # Send password reset email
    try:
        from tasks.email_tasks import send_password_reset_email
        send_password_reset_email.delay(user.email, reset_token)
        logger.info(f"Password reset email queued for {user.email}")
    except Exception as e:
        logger.warning(f"Celery not available, trying sync email: {e}")
        try:
            from services.email_service import EmailService
            EmailService.send_password_reset_email(user.email, reset_token)
        except Exception as email_error:
            logger.error(f"Failed to send password reset email: {email_error}")

    return jsonify({
        'message': 'If an account exists with this email, a reset link will be sent'
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.get_json()

    if not data or 'token' not in data or 'password' not in data:
        return jsonify({'error': 'Token and new password are required'}), 400

    user = User.query.filter_by(reset_token=data['token']).first()

    if not user:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        return jsonify({'error': 'Reset token has expired'}), 400

    # Update password
    user.set_password(data['password'])
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    # Log password reset
    try:
        AuditService.log_password_reset(user.id, user.username)
    except Exception as e:
        logger.warning(f"Failed to log password reset audit: {e}")

    logger.info(f"Password reset successful for {user.email}")

    return jsonify({
        'message': 'Password reset successful. You can now login with your new password.'
    }), 200


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email using token"""
    data = request.get_json()

    if not data or 'token' not in data:
        return jsonify({'error': 'Verification token is required'}), 400

    user = User.query.filter_by(verification_token=data['token']).first()

    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400

    # Check if token has expired
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        return jsonify({'error': 'Verification token has expired. Please request a new one.'}), 400

    # Already verified
    if user.email_verified:
        return jsonify({'message': 'Email is already verified'}), 200

    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()

    logger.info(f"Email verified for {user.email}")

    return jsonify({
        'message': 'Email verified successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email_get(token):
    """Verify email using token (GET method for email links)"""
    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400

    # Check if token has expired
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        return jsonify({'error': 'Verification token has expired. Please request a new one.'}), 400

    # Already verified
    if user.email_verified:
        return jsonify({'message': 'Email is already verified'}), 200

    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()

    logger.info(f"Email verified for {user.email}")

    return jsonify({
        'message': 'Email verified successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
@limiter.limit("5 per hour")
def resend_verification():
    """Resend verification email"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.email_verified:
        return jsonify({'message': 'Email is already verified'}), 200

    # Generate new verification token with 24h expiry
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    # Send verification email
    try:
        from tasks.email_tasks import send_verification_email
        send_verification_email.delay(user.id, user.email, verification_token)
        logger.info(f"Verification email queued for {user.email}")
    except Exception as e:
        logger.warning(f"Celery not available, trying sync email: {e}")
        try:
            from services.email_service import EmailService
            EmailService.send_verification_email(user.email, verification_token)
        except Exception as email_error:
            logger.error(f"Failed to send verification email: {email_error}")

    return jsonify({
        'message': 'Verification email sent'
    }), 200


@auth_bp.route('/verification-status', methods=['GET'])
@jwt_required()
def verification_status():
    """Get email verification status"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'email_verified': user.email_verified,
        'email_verified_at': user.email_verified_at.isoformat() if user.email_verified_at else None,
        'email': user.email
    }), 200
