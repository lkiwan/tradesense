"""
Audit Service for TradeSense

Provides helper functions to log various system events for security and compliance.
"""

import logging
from functools import wraps
from flask import request, g
from models import db, AuditLog, User

logger = logging.getLogger(__name__)


class AuditService:
    """Service for creating audit log entries"""

    @staticmethod
    def get_request_info():
        """Extract IP address and user agent from current request"""
        ip_address = None
        user_agent = None

        try:
            if request:
                # Get IP address (handle proxies)
                if request.headers.get('X-Forwarded-For'):
                    ip_address = request.headers.get('X-Forwarded-For').split(',')[0].strip()
                else:
                    ip_address = request.remote_addr

                user_agent = request.headers.get('User-Agent', '')[:500]
        except RuntimeError:
            # Outside of request context
            pass

        return ip_address, user_agent

    @staticmethod
    def get_user_info(user_id=None):
        """Get user info for logging"""
        if user_id:
            user = User.query.get(user_id)
            if user:
                return user_id, user.username
        return user_id, None

    # ==================== Authentication Events ====================

    @classmethod
    def log_login(cls, user_id, username, success=True, error_message=None, extra_data=None):
        """Log user login attempt"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='login',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"User {'logged in successfully' if success else 'failed to log in'}",
            extra_data=extra_data,
            status=AuditLog.STATUS_SUCCESS if success else AuditLog.STATUS_FAILURE,
            error_message=error_message
        )

    @classmethod
    def log_logout(cls, user_id, username):
        """Log user logout"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='logout',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description="User logged out"
        )

    @classmethod
    def log_register(cls, user_id, username, email):
        """Log user registration"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='register',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"New user registered: {email}",
            extra_data={'email': email}
        )

    @classmethod
    def log_password_reset_request(cls, user_id, username, email):
        """Log password reset request"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='password_reset_request',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Password reset requested for {email}"
        )

    @classmethod
    def log_password_reset(cls, user_id, username):
        """Log successful password reset"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='password_reset',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description="Password reset completed"
        )

    @classmethod
    def log_2fa_enable(cls, user_id, username):
        """Log 2FA enablement"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='2fa_enable',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description="Two-factor authentication enabled"
        )

    @classmethod
    def log_2fa_disable(cls, user_id, username):
        """Log 2FA disablement"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='2fa_disable',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description="Two-factor authentication disabled"
        )

    @classmethod
    def log_email_verified(cls, user_id, username, email):
        """Log email verification"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_AUTH,
            action='email_verified',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Email verified: {email}"
        )

    # ==================== Trade Events ====================

    @classmethod
    def log_trade_open(cls, user_id, username, trade_id, symbol, trade_type, quantity, price):
        """Log trade opening"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_TRADE,
            action='trade_open',
            user_id=user_id,
            username=username,
            target_type='trade',
            target_id=trade_id,
            target_name=f"{trade_type.upper()} {symbol}",
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Opened {trade_type} trade: {quantity} {symbol} @ {price}",
            new_value={
                'symbol': symbol,
                'type': trade_type,
                'quantity': float(quantity),
                'price': float(price)
            }
        )

    @classmethod
    def log_trade_close(cls, user_id, username, trade_id, symbol, profit_loss):
        """Log trade closing"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_TRADE,
            action='trade_close',
            user_id=user_id,
            username=username,
            target_type='trade',
            target_id=trade_id,
            target_name=symbol,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Closed trade {symbol}: P/L ${profit_loss:.2f}",
            extra_data={'profit_loss': float(profit_loss)}
        )

    # ==================== Payout Events ====================

    @classmethod
    def log_payout_request(cls, user_id, username, payout_id, amount, payment_method):
        """Log payout request"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_PAYOUT,
            action='payout_request',
            user_id=user_id,
            username=username,
            target_type='payout',
            target_id=payout_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Payout requested: ${amount:.2f} via {payment_method}",
            new_value={
                'amount': float(amount),
                'payment_method': payment_method
            }
        )

    @classmethod
    def log_payout_approve(cls, admin_user_id, admin_username, payout_id, user_id, amount):
        """Log payout approval by admin"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_PAYOUT,
            action='payout_approve',
            user_id=admin_user_id,
            username=admin_username,
            target_type='payout',
            target_id=payout_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Payout #{payout_id} approved: ${amount:.2f}",
            extra_data={'target_user_id': user_id}
        )

    @classmethod
    def log_payout_reject(cls, admin_user_id, admin_username, payout_id, user_id, reason):
        """Log payout rejection by admin"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_PAYOUT,
            action='payout_reject',
            user_id=admin_user_id,
            username=admin_username,
            target_type='payout',
            target_id=payout_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Payout #{payout_id} rejected: {reason}",
            extra_data={'target_user_id': user_id, 'reason': reason},
            status=AuditLog.STATUS_WARNING
        )

    @classmethod
    def log_payout_process(cls, admin_user_id, admin_username, payout_id, transaction_id):
        """Log payout processing (payment sent)"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_PAYOUT,
            action='payout_process',
            user_id=admin_user_id,
            username=admin_username,
            target_type='payout',
            target_id=payout_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Payout #{payout_id} processed, transaction: {transaction_id}",
            extra_data={'transaction_id': transaction_id}
        )

    # ==================== Admin Events ====================

    @classmethod
    def log_user_update(cls, admin_user_id, admin_username, target_user_id, target_username, changes):
        """Log admin updating user"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='user_update',
            user_id=admin_user_id,
            username=admin_username,
            target_type='user',
            target_id=target_user_id,
            target_name=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Updated user {target_username}",
            new_value=changes
        )

    @classmethod
    def log_user_ban(cls, admin_user_id, admin_username, target_user_id, target_username, reason):
        """Log user ban"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='user_ban',
            user_id=admin_user_id,
            username=admin_username,
            target_type='user',
            target_id=target_user_id,
            target_name=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Banned user {target_username}: {reason}",
            extra_data={'reason': reason},
            status=AuditLog.STATUS_WARNING
        )

    @classmethod
    def log_challenge_update(cls, admin_user_id, admin_username, challenge_id, old_status, new_status, reason=None):
        """Log challenge status update"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='challenge_update',
            user_id=admin_user_id,
            username=admin_username,
            target_type='challenge',
            target_id=challenge_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Challenge #{challenge_id} status changed: {old_status} -> {new_status}",
            old_value={'status': old_status},
            new_value={'status': new_status},
            extra_data={'reason': reason} if reason else None
        )

    @classmethod
    def log_settings_update(cls, admin_user_id, admin_username, setting_name, old_value, new_value):
        """Log system settings update"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='settings_update',
            user_id=admin_user_id,
            username=admin_username,
            target_type='settings',
            target_name=setting_name,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Updated setting: {setting_name}",
            old_value={'value': old_value} if old_value is not None else None,
            new_value={'value': new_value}
        )

    @classmethod
    def log_admin_promote(cls, admin_user_id, admin_username, target_user_id, target_username):
        """Log user promotion to admin"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='admin_promote',
            user_id=admin_user_id,
            username=admin_username,
            target_type='user',
            target_id=target_user_id,
            target_name=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Promoted {target_username} to admin"
        )

    @classmethod
    def log_admin_demote(cls, admin_user_id, admin_username, target_user_id, target_username):
        """Log admin demotion"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='admin_demote',
            user_id=admin_user_id,
            username=admin_username,
            target_type='user',
            target_id=target_user_id,
            target_name=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Demoted {target_username} from admin"
        )

    # ==================== Security Events ====================

    @classmethod
    def log_session_revoke(cls, user_id, username, session_id, revoked_by_self=True):
        """Log session revocation"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_SECURITY,
            action='session_revoke',
            user_id=user_id,
            username=username,
            target_type='session',
            target_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Session revoked {'by user' if revoked_by_self else 'by admin'}"
        )

    @classmethod
    def log_suspicious_login(cls, user_id, username, reason, extra_data=None):
        """Log suspicious login attempt"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_SECURITY,
            action='suspicious_login',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Suspicious login detected: {reason}",
            extra_data=extra_data,
            status=AuditLog.STATUS_WARNING
        )

    @classmethod
    def log_rate_limit(cls, user_id, username, endpoint):
        """Log rate limit exceeded"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_SECURITY,
            action='rate_limit_exceeded',
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Rate limit exceeded for {endpoint}",
            extra_data={'endpoint': endpoint},
            status=AuditLog.STATUS_WARNING
        )

    # ==================== Payment Events ====================

    @classmethod
    def log_payment(cls, user_id, username, payment_id, amount, plan_type, status):
        """Log payment event"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_PAYMENT,
            action='payment',
            user_id=user_id,
            username=username,
            target_type='payment',
            target_id=payment_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Payment {status}: ${amount:.2f} for {plan_type}",
            new_value={
                'amount': float(amount),
                'plan_type': plan_type,
                'status': status
            },
            status=AuditLog.STATUS_SUCCESS if status == 'completed' else AuditLog.STATUS_WARNING
        )

    # ==================== Challenge Events ====================

    @classmethod
    def log_challenge_start(cls, user_id, username, challenge_id, model_name, account_size):
        """Log challenge start"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_CHALLENGE,
            action='challenge_start',
            user_id=user_id,
            username=username,
            target_type='challenge',
            target_id=challenge_id,
            target_name=model_name,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Started {model_name} challenge with ${account_size:,.0f}",
            new_value={
                'model': model_name,
                'account_size': float(account_size)
            }
        )

    @classmethod
    def log_challenge_phase_advance(cls, user_id, username, challenge_id, old_phase, new_phase):
        """Log challenge phase advancement"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_CHALLENGE,
            action='challenge_phase_advance',
            user_id=user_id,
            username=username,
            target_type='challenge',
            target_id=challenge_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Advanced from {old_phase} to {new_phase}",
            old_value={'phase': old_phase},
            new_value={'phase': new_phase}
        )

    @classmethod
    def log_challenge_fail(cls, user_id, username, challenge_id, reason):
        """Log challenge failure"""
        ip_address, user_agent = cls.get_request_info()

        return AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_CHALLENGE,
            action='challenge_fail',
            user_id=user_id,
            username=username,
            target_type='challenge',
            target_id=challenge_id,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Challenge failed: {reason}",
            extra_data={'reason': reason},
            status=AuditLog.STATUS_FAILURE
        )


def log_audit(action_type, action, user_id=None, username=None, description=None,
              target_type=None, target_id=None, target_name=None,
              old_value=None, new_value=None, extra_data=None,
              status='success', error_message=None):
    """
    Simple helper function to log an audit entry.
    Wrapper around AuditLog.log with request context extraction.
    """
    ip_address, user_agent = AuditService.get_request_info()

    return AuditLog.log(
        action_type=action_type,
        action=action,
        user_id=user_id,
        username=username,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        ip_address=ip_address,
        user_agent=user_agent,
        description=description,
        old_value=old_value,
        new_value=new_value,
        extra_data=extra_data,
        status=status,
        error_message=error_message
    )


def audit_action(action_type, action, get_target=None):
    """
    Decorator for automatically logging actions.

    Usage:
        @audit_action('TRADE', 'trade_open')
        def open_trade():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)

            try:
                # Get user info from JWT or session
                from flask_jwt_extended import get_jwt_identity
                user_id = get_jwt_identity()
                user_id, username = AuditService.get_user_info(user_id)

                # Get target info if provided
                target_type, target_id, target_name = None, None, None
                if get_target:
                    target_type, target_id, target_name = get_target(*args, **kwargs)

                ip_address, user_agent = AuditService.get_request_info()

                AuditLog.log(
                    action_type=action_type,
                    action=action,
                    user_id=user_id,
                    username=username,
                    target_type=target_type,
                    target_id=target_id,
                    target_name=target_name,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.warning(f"Failed to create audit log: {e}")

            return result
        return decorated_function
    return decorator
