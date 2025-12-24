"""
Two-Factor Authentication Routes for TradeSense
Handles 2FA setup, verification, and management
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.totp_service import TOTPService

logger = logging.getLogger(__name__)

two_factor_bp = Blueprint('two_factor', __name__, url_prefix='/api/auth/2fa')


@two_factor_bp.route('/status', methods=['GET'])
@jwt_required()
def get_2fa_status():
    """Get current 2FA status for the user"""
    user_id = int(get_jwt_identity())

    try:
        status = TOTPService.get_2fa_status(user_id)
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Error getting 2FA status: {e}")
        return jsonify({'error': 'Failed to get 2FA status'}), 500


@two_factor_bp.route('/setup', methods=['POST'])
@jwt_required()
def setup_2fa():
    """
    Initialize 2FA setup.
    Returns QR code and backup codes.
    """
    user_id = int(get_jwt_identity())

    try:
        result = TOTPService.setup_2fa(user_id)

        return jsonify({
            'message': '2FA setup initiated',
            'qr_code': result['qr_code'],
            'secret': result['secret'],  # For manual entry
            'backup_codes': result['backup_codes'],
            'provisioning_uri': result['provisioning_uri']
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error setting up 2FA: {e}")
        return jsonify({'error': 'Failed to set up 2FA'}), 500


@two_factor_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_2fa():
    """
    Confirm 2FA setup by verifying initial token.
    This enables 2FA on the account.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    token = data.get('token')
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400

    try:
        if TOTPService.confirm_2fa(user_id, token):
            return jsonify({
                'message': '2FA enabled successfully',
                'enabled': True
            }), 200
        else:
            return jsonify({
                'error': 'Invalid verification code',
                'enabled': False
            }), 400

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error confirming 2FA: {e}")
        return jsonify({'error': 'Failed to confirm 2FA'}), 500


@two_factor_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_2fa():
    """
    Verify a 2FA token.
    Used during login flow.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    token = data.get('token')
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400

    try:
        result = TOTPService.verify_2fa(user_id, token)

        if result['success']:
            return jsonify({
                'message': 'Verification successful',
                'method': result.get('method'),
                'backup_codes_remaining': result.get('backup_codes_remaining')
            }), 200
        else:
            return jsonify({
                'error': result.get('message', 'Verification failed'),
                'attempts_remaining': result.get('attempts_remaining')
            }), 400

    except Exception as e:
        logger.error(f"Error verifying 2FA: {e}")
        return jsonify({'error': 'Verification failed'}), 500


@two_factor_bp.route('/disable', methods=['POST'])
@jwt_required()
def disable_2fa():
    """
    Disable 2FA for the user.
    Requires current TOTP token for security.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    token = data.get('token')
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400

    try:
        if TOTPService.disable_2fa(user_id, token):
            return jsonify({
                'message': '2FA disabled successfully',
                'enabled': False
            }), 200
        else:
            return jsonify({'error': 'Failed to disable 2FA'}), 400

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error disabling 2FA: {e}")
        return jsonify({'error': 'Failed to disable 2FA'}), 500


@two_factor_bp.route('/backup-codes', methods=['GET'])
@jwt_required()
def get_backup_codes_count():
    """Get the number of remaining backup codes"""
    user_id = int(get_jwt_identity())

    try:
        status = TOTPService.get_2fa_status(user_id)
        return jsonify({
            'backup_codes_remaining': status.get('backup_codes_remaining', 0)
        }), 200
    except Exception as e:
        logger.error(f"Error getting backup codes count: {e}")
        return jsonify({'error': 'Failed to get backup codes'}), 500


@two_factor_bp.route('/backup-codes/regenerate', methods=['POST'])
@jwt_required()
def regenerate_backup_codes():
    """
    Regenerate backup codes.
    Requires current TOTP token for security.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    token = data.get('token')
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400

    try:
        backup_codes = TOTPService.regenerate_backup_codes(user_id, token)
        return jsonify({
            'message': 'Backup codes regenerated successfully',
            'backup_codes': backup_codes
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error regenerating backup codes: {e}")
        return jsonify({'error': 'Failed to regenerate backup codes'}), 500


@two_factor_bp.route('/required', methods=['GET'])
@jwt_required()
def check_2fa_required():
    """Check if 2FA is required for the current user"""
    user_id = int(get_jwt_identity())

    try:
        required = TOTPService.is_2fa_required(user_id)
        return jsonify({'required': required}), 200
    except Exception as e:
        logger.error(f"Error checking 2FA requirement: {e}")
        return jsonify({'error': 'Failed to check 2FA status'}), 500
