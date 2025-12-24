"""
TOTP (Time-based One-Time Password) Service for TradeSense
Handles 2FA operations including QR code generation and verification
"""
import pyotp
import qrcode
import io
import base64
import logging
from datetime import datetime
from models import db, TwoFactorAuth, User

logger = logging.getLogger(__name__)

# App name for authenticator apps
APP_NAME = "TradeSense"


class TOTPService:
    """Service for handling TOTP-based two-factor authentication"""

    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def get_totp(secret: str) -> pyotp.TOTP:
        """Get TOTP object for a secret"""
        return pyotp.TOTP(secret)

    @staticmethod
    def generate_provisioning_uri(secret: str, email: str) -> str:
        """Generate provisioning URI for authenticator apps"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=APP_NAME)

    @staticmethod
    def generate_qr_code(secret: str, email: str) -> str:
        """
        Generate QR code as base64 encoded PNG.

        Args:
            secret: TOTP secret
            email: User's email for the authenticator app

        Returns:
            Base64 encoded PNG image
        """
        uri = TOTPService.generate_provisioning_uri(secret, email)

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    @staticmethod
    def verify_token(secret: str, token: str, valid_window: int = 1) -> bool:
        """
        Verify a TOTP token.

        Args:
            secret: TOTP secret
            token: 6-digit token from authenticator
            valid_window: Number of 30-second windows to check (default: 1)

        Returns:
            True if token is valid
        """
        if not token or len(token) != 6 or not token.isdigit():
            return False

        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=valid_window)

    @staticmethod
    def setup_2fa(user_id: int) -> dict:
        """
        Initialize 2FA setup for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with secret, qr_code, and backup_codes
        """
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        # Check if 2FA already enabled
        existing = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if existing and existing.is_enabled:
            raise ValueError("2FA is already enabled")

        # Generate new secret
        secret = TOTPService.generate_secret()

        # Create or update 2FA record
        if existing:
            existing.secret = secret
            existing.is_enabled = False
            existing.verified_at = None
            two_fa = existing
        else:
            two_fa = TwoFactorAuth(user_id=user_id, secret=secret)
            db.session.add(two_fa)

        # Generate backup codes
        backup_codes = TwoFactorAuth.generate_backup_codes(10)
        two_fa.set_backup_codes(backup_codes)

        db.session.commit()

        # Generate QR code
        qr_code = TOTPService.generate_qr_code(secret, user.email)

        logger.info(f"2FA setup initiated for user {user_id}")

        return {
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': backup_codes,
            'provisioning_uri': TOTPService.generate_provisioning_uri(secret, user.email)
        }

    @staticmethod
    def confirm_2fa(user_id: int, token: str) -> bool:
        """
        Confirm 2FA setup by verifying initial token.

        Args:
            user_id: User ID
            token: 6-digit token from authenticator

        Returns:
            True if confirmed successfully
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_fa:
            raise ValueError("2FA not set up")

        if two_fa.is_enabled:
            raise ValueError("2FA is already enabled")

        # Verify the token
        if not TOTPService.verify_token(two_fa.secret, token):
            two_fa.record_failed_attempt()
            db.session.commit()
            return False

        # Enable 2FA
        two_fa.is_enabled = True
        two_fa.verified_at = datetime.utcnow()
        two_fa.reset_failed_attempts()
        db.session.commit()

        logger.info(f"2FA enabled for user {user_id}")
        return True

    @staticmethod
    def verify_2fa(user_id: int, token: str) -> dict:
        """
        Verify a 2FA token during login.

        Args:
            user_id: User ID
            token: 6-digit token or backup code

        Returns:
            Dict with success status and method used
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_fa or not two_fa.is_enabled:
            return {'success': True, 'method': 'none', 'message': '2FA not enabled'}

        # Check if locked
        if two_fa.is_locked():
            return {
                'success': False,
                'method': 'locked',
                'message': 'Too many failed attempts. Please try again later.'
            }

        # Try TOTP verification first
        if TOTPService.verify_token(two_fa.secret, token):
            two_fa.reset_failed_attempts()
            db.session.commit()
            return {'success': True, 'method': 'totp'}

        # Try backup code
        if two_fa.verify_backup_code(token):
            two_fa.reset_failed_attempts()
            db.session.commit()
            logger.info(f"User {user_id} used backup code. {two_fa.get_backup_codes_remaining()} remaining.")
            return {
                'success': True,
                'method': 'backup_code',
                'backup_codes_remaining': two_fa.get_backup_codes_remaining()
            }

        # Failed verification
        two_fa.record_failed_attempt()
        db.session.commit()

        return {
            'success': False,
            'method': 'failed',
            'message': 'Invalid verification code',
            'attempts_remaining': max(0, 5 - two_fa.failed_attempts)
        }

    @staticmethod
    def disable_2fa(user_id: int, token: str) -> bool:
        """
        Disable 2FA for a user.

        Args:
            user_id: User ID
            token: Current TOTP token for verification

        Returns:
            True if disabled successfully
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_fa or not two_fa.is_enabled:
            return True  # Already disabled

        # Verify token before disabling
        if not TOTPService.verify_token(two_fa.secret, token):
            two_fa.record_failed_attempt()
            db.session.commit()
            raise ValueError("Invalid verification code")

        # Delete the 2FA record
        db.session.delete(two_fa)
        db.session.commit()

        logger.info(f"2FA disabled for user {user_id}")
        return True

    @staticmethod
    def regenerate_backup_codes(user_id: int, token: str) -> list:
        """
        Regenerate backup codes.

        Args:
            user_id: User ID
            token: Current TOTP token for verification

        Returns:
            List of new backup codes
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        if not two_fa or not two_fa.is_enabled:
            raise ValueError("2FA not enabled")

        # Verify token before regenerating
        if not TOTPService.verify_token(two_fa.secret, token):
            two_fa.record_failed_attempt()
            db.session.commit()
            raise ValueError("Invalid verification code")

        # Generate new backup codes
        backup_codes = TwoFactorAuth.generate_backup_codes(10)
        two_fa.set_backup_codes(backup_codes)
        db.session.commit()

        logger.info(f"Backup codes regenerated for user {user_id}")
        return backup_codes

    @staticmethod
    def get_2fa_status(user_id: int) -> dict:
        """
        Get 2FA status for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with 2FA status information
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()

        if not two_fa:
            return {
                'enabled': False,
                'verified_at': None,
                'backup_codes_remaining': 0
            }

        return {
            'enabled': two_fa.is_enabled,
            'verified_at': two_fa.verified_at.isoformat() if two_fa.verified_at else None,
            'backup_codes_remaining': two_fa.get_backup_codes_remaining(),
            'is_locked': two_fa.is_locked()
        }

    @staticmethod
    def is_2fa_required(user_id: int) -> bool:
        """
        Check if 2FA is required for a user.

        Args:
            user_id: User ID

        Returns:
            True if 2FA is enabled and required
        """
        two_fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
        return two_fa is not None and two_fa.is_enabled
