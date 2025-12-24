"""
OAuth Routes for TradeSense
Handles Google and Apple SSO authentication
"""

import os
import secrets
import logging
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, session, redirect
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)

from models import db
from models.user import User
from models.oauth_account import (
    OAuthAccount, OAuthProvider,
    get_oauth_account, get_user_oauth_accounts,
    create_oauth_account, link_oauth_to_user, unlink_oauth_account,
    find_user_by_oauth
)
from services.oauth_service import google_oauth, apple_oauth, get_oauth_provider

logger = logging.getLogger(__name__)

oauth_bp = Blueprint('oauth', __name__, url_prefix='/api/auth/oauth')


# ==================== GOOGLE OAUTH ====================

@oauth_bp.route('/google/url', methods=['GET'])
def google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        redirect_after = request.args.get('redirect', '/')
        link_account = request.args.get('link', 'false') == 'true'

        url, state, nonce = google_oauth.get_authorization_url()

        # Store state and nonce in session for verification
        session['oauth_state'] = state
        session['oauth_nonce'] = nonce
        session['oauth_redirect'] = redirect_after
        session['oauth_link'] = link_account

        return jsonify({
            'url': url,
            'state': state
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Google auth URL error: {e}")
        return jsonify({'error': 'Failed to generate authorization URL'}), 500


@oauth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')

        if not code:
            return jsonify({'error': 'Authorization code required'}), 400

        # Verify state (CSRF protection)
        stored_state = session.get('oauth_state')
        if state and stored_state and state != stored_state:
            return jsonify({'error': 'Invalid state parameter'}), 400

        # Exchange code for tokens
        token_response = google_oauth.exchange_code_sync(code)
        access_token = token_response.get('access_token')
        id_token = token_response.get('id_token')
        refresh_token = token_response.get('refresh_token')
        expires_in = token_response.get('expires_in', 3600)

        # Get user info
        user_info = google_oauth.get_user_info_sync(access_token)
        parsed_data = google_oauth.parse_user_data(user_info)

        provider_user_id = parsed_data['provider_user_id']
        email = parsed_data['email']
        name = parsed_data.get('name')
        picture = parsed_data.get('picture')

        # Check if linking to existing account
        link_account = session.get('oauth_link', False)

        if link_account:
            # This would require JWT - handled separately
            return jsonify({'error': 'Use /link endpoint for account linking'}), 400

        # Find existing OAuth account
        oauth_account = get_oauth_account('google', provider_user_id)

        if oauth_account:
            # Existing user - login
            user = oauth_account.user

            # Update tokens
            oauth_account.update_tokens(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=datetime.utcnow() + timedelta(seconds=expires_in)
            )
        else:
            # Check if user exists with this email
            user = User.query.filter_by(email=email).first()

            if user:
                # Link to existing account
                oauth_account = create_oauth_account(
                    user_id=user.id,
                    provider='google',
                    provider_user_id=provider_user_id,
                    email=email,
                    name=name,
                    picture=picture,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    raw_data=user_info
                )
            else:
                # Create new user
                username = _generate_username(name or email.split('@')[0])

                user = User(
                    username=username,
                    email=email,
                    email_verified=parsed_data.get('email_verified', False),
                    email_verified_at=datetime.utcnow() if parsed_data.get('email_verified') else None
                )
                # Set a random password (user can set real one later or use SSO)
                user.set_password(secrets.token_urlsafe(32))

                db.session.add(user)
                db.session.commit()

                # Create OAuth account link
                oauth_account = create_oauth_account(
                    user_id=user.id,
                    provider='google',
                    provider_user_id=provider_user_id,
                    email=email,
                    name=name,
                    picture=picture,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                    raw_data=user_info
                )

        # Generate JWT tokens
        jwt_access_token = create_access_token(identity=str(user.id))
        jwt_refresh_token = create_refresh_token(identity=str(user.id))

        # Clear OAuth session data
        session.pop('oauth_state', None)
        session.pop('oauth_nonce', None)
        redirect_url = session.pop('oauth_redirect', '/')
        session.pop('oauth_link', None)

        return jsonify({
            'message': 'Successfully authenticated with Google',
            'access_token': jwt_access_token,
            'refresh_token': jwt_refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'picture': picture
            },
            'redirect': redirect_url,
            'is_new_user': oauth_account.created_at > datetime.utcnow() - timedelta(seconds=10)
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Google callback error: {e}")
        return jsonify({'error': 'Authentication failed'}), 500


# ==================== APPLE OAUTH ====================

@oauth_bp.route('/apple/url', methods=['GET'])
def apple_auth_url():
    """Get Apple Sign In authorization URL"""
    try:
        redirect_after = request.args.get('redirect', '/')
        link_account = request.args.get('link', 'false') == 'true'

        url, state, nonce = apple_oauth.get_authorization_url()

        # Store state and nonce in session for verification
        session['oauth_state'] = state
        session['oauth_nonce'] = nonce
        session['oauth_redirect'] = redirect_after
        session['oauth_link'] = link_account

        return jsonify({
            'url': url,
            'state': state
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Apple auth URL error: {e}")
        return jsonify({'error': 'Failed to generate authorization URL'}), 500


@oauth_bp.route('/apple/callback', methods=['POST'])
def apple_callback():
    """Handle Apple Sign In callback"""
    try:
        # Apple sends data as form-post
        data = request.form if request.form else request.get_json()

        code = data.get('code')
        id_token = data.get('id_token')
        state = data.get('state')
        user_data = data.get('user')  # Only sent on first authorization

        if not code and not id_token:
            return jsonify({'error': 'Authorization code or ID token required'}), 400

        # Verify state
        stored_state = session.get('oauth_state')
        if state and stored_state and state != stored_state:
            return jsonify({'error': 'Invalid state parameter'}), 400

        # Verify nonce
        stored_nonce = session.get('oauth_nonce')

        # If we have id_token, verify it
        if id_token:
            id_token_data = apple_oauth.verify_id_token(id_token, stored_nonce)
        else:
            # Exchange code for tokens
            token_response = apple_oauth.exchange_code_sync(code)
            id_token = token_response.get('id_token')
            id_token_data = apple_oauth.verify_id_token(id_token, stored_nonce)

        parsed_data = apple_oauth.parse_user_data(id_token_data, user_data)

        provider_user_id = parsed_data['provider_user_id']
        email = parsed_data.get('email')
        name = parsed_data.get('name')

        # Check if linking to existing account
        link_account = session.get('oauth_link', False)

        if link_account:
            return jsonify({'error': 'Use /link endpoint for account linking'}), 400

        # Find existing OAuth account
        oauth_account = get_oauth_account('apple', provider_user_id)

        if oauth_account:
            # Existing user - login
            user = oauth_account.user
            oauth_account.last_used_at = datetime.utcnow()
            db.session.commit()
        else:
            # Check if user exists with this email (if email provided)
            user = None
            if email:
                user = User.query.filter_by(email=email).first()

            if user:
                # Link to existing account
                oauth_account = create_oauth_account(
                    user_id=user.id,
                    provider='apple',
                    provider_user_id=provider_user_id,
                    email=email,
                    name=name,
                    raw_data=id_token_data
                )
            else:
                # Create new user
                username = _generate_username(name or f"user_{provider_user_id[:8]}")

                user = User(
                    username=username,
                    email=email or f"{provider_user_id}@privaterelay.appleid.com",
                    email_verified=True  # Apple verifies emails
                )
                user.set_password(secrets.token_urlsafe(32))

                db.session.add(user)
                db.session.commit()

                oauth_account = create_oauth_account(
                    user_id=user.id,
                    provider='apple',
                    provider_user_id=provider_user_id,
                    email=email,
                    name=name,
                    raw_data=id_token_data
                )

        # Generate JWT tokens
        jwt_access_token = create_access_token(identity=str(user.id))
        jwt_refresh_token = create_refresh_token(identity=str(user.id))

        # Clear OAuth session data
        session.pop('oauth_state', None)
        session.pop('oauth_nonce', None)
        redirect_url = session.pop('oauth_redirect', '/')
        session.pop('oauth_link', None)

        return jsonify({
            'message': 'Successfully authenticated with Apple',
            'access_token': jwt_access_token,
            'refresh_token': jwt_refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            },
            'redirect': redirect_url,
            'is_new_user': oauth_account.created_at > datetime.utcnow() - timedelta(seconds=10)
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Apple callback error: {e}")
        return jsonify({'error': 'Authentication failed'}), 500


# ==================== ACCOUNT LINKING ====================

@oauth_bp.route('/linked-accounts', methods=['GET'])
@jwt_required()
def get_linked_accounts():
    """Get user's linked OAuth accounts"""
    user_id = get_jwt_identity()
    accounts = get_user_oauth_accounts(int(user_id))

    return jsonify({
        'accounts': [acc.to_dict() for acc in accounts],
        'available_providers': ['google', 'apple']
    })


@oauth_bp.route('/link/<provider>', methods=['POST'])
@jwt_required()
def link_account(provider):
    """Link an OAuth account to current user"""
    if provider not in ['google', 'apple']:
        return jsonify({'error': 'Invalid provider'}), 400

    user_id = get_jwt_identity()
    data = request.get_json()

    code = data.get('code')
    id_token = data.get('id_token')

    if not code and not id_token:
        return jsonify({'error': 'Authorization code or ID token required'}), 400

    try:
        oauth_provider = get_oauth_provider(provider)

        if provider == 'google':
            token_response = oauth_provider.exchange_code_sync(code)
            access_token = token_response.get('access_token')
            refresh_token = token_response.get('refresh_token')
            expires_in = token_response.get('expires_in', 3600)

            user_info = oauth_provider.get_user_info_sync(access_token)
            parsed_data = oauth_provider.parse_user_data(user_info)

            oauth_account = link_oauth_to_user(
                user_id=int(user_id),
                provider='google',
                provider_user_id=parsed_data['provider_user_id'],
                email=parsed_data.get('email'),
                name=parsed_data.get('name'),
                picture=parsed_data.get('picture'),
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                raw_data=user_info
            )

        elif provider == 'apple':
            if id_token:
                id_token_data = oauth_provider.verify_id_token(id_token)
            else:
                token_response = oauth_provider.exchange_code_sync(code)
                id_token = token_response.get('id_token')
                id_token_data = oauth_provider.verify_id_token(id_token)

            parsed_data = oauth_provider.parse_user_data(id_token_data)

            oauth_account = link_oauth_to_user(
                user_id=int(user_id),
                provider='apple',
                provider_user_id=parsed_data['provider_user_id'],
                email=parsed_data.get('email'),
                name=parsed_data.get('name'),
                raw_data=id_token_data
            )

        return jsonify({
            'message': f'{provider.capitalize()} account linked successfully',
            'account': oauth_account.to_dict()
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Account linking error: {e}")
        return jsonify({'error': 'Failed to link account'}), 500


@oauth_bp.route('/unlink/<provider>', methods=['DELETE'])
@jwt_required()
def unlink_account_route(provider):
    """Unlink an OAuth account from current user"""
    if provider not in ['google', 'apple']:
        return jsonify({'error': 'Invalid provider'}), 400

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    # Check if user has a password set (can still login without OAuth)
    if not user.password_hash:
        # Check how many OAuth accounts are linked
        accounts = get_user_oauth_accounts(int(user_id))
        if len(accounts) <= 1:
            return jsonify({
                'error': 'Cannot unlink last login method. Please set a password first.'
            }), 400

    success = unlink_oauth_account(int(user_id), provider)

    if success:
        return jsonify({'message': f'{provider.capitalize()} account unlinked successfully'})
    else:
        return jsonify({'error': f'No {provider} account linked'}), 404


# ==================== HELPER FUNCTIONS ====================

def _generate_username(base_name):
    """Generate a unique username"""
    # Clean base name
    username = ''.join(c for c in base_name if c.isalnum() or c == '_').lower()
    if not username:
        username = 'user'

    # Ensure uniqueness
    original = username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{original}{counter}"
        counter += 1

    return username


@oauth_bp.route('/providers', methods=['GET'])
def get_available_providers():
    """Get available OAuth providers and their status"""
    google_configured = bool(os.getenv('GOOGLE_CLIENT_ID'))
    apple_configured = bool(os.getenv('APPLE_CLIENT_ID'))

    return jsonify({
        'providers': [
            {
                'id': 'google',
                'name': 'Google',
                'enabled': google_configured,
                'icon': 'google'
            },
            {
                'id': 'apple',
                'name': 'Apple',
                'enabled': apple_configured,
                'icon': 'apple'
            }
        ]
    })
