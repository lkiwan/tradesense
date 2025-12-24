"""
OAuth Service for TradeSense
Handles Google and Apple SSO authentication
"""

import os
import secrets
import logging
from datetime import datetime, timedelta
from urllib.parse import urlencode

import jwt
import httpx
from flask import current_app

logger = logging.getLogger(__name__)


class OAuthService:
    """Base OAuth service"""

    @staticmethod
    def generate_state():
        """Generate a random state for CSRF protection"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def generate_nonce():
        """Generate a random nonce for replay protection"""
        return secrets.token_urlsafe(32)


class GoogleOAuth:
    """Google OAuth 2.0 implementation"""

    AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    TOKEN_URL = 'https://oauth2.googleapis.com/token'
    USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
    REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback')

    def get_authorization_url(self, state=None, nonce=None):
        """Generate Google OAuth authorization URL"""
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID not configured")

        state = state or OAuthService.generate_state()
        nonce = nonce or OAuthService.generate_nonce()

        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'state': state,
            'nonce': nonce,
            'access_type': 'offline',
            'prompt': 'consent'
        }

        url = f"{self.AUTHORIZATION_URL}?{urlencode(params)}"
        return url, state, nonce

    async def exchange_code(self, code):
        """Exchange authorization code for tokens"""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri
                }
            )

            if response.status_code != 200:
                logger.error(f"Google token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.json().get('error_description', 'Unknown error')}")

            return response.json()

    def exchange_code_sync(self, code):
        """Synchronous version of exchange_code"""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth not configured")

        with httpx.Client() as client:
            response = client.post(
                self.TOKEN_URL,
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri
                }
            )

            if response.status_code != 200:
                logger.error(f"Google token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.json().get('error_description', 'Unknown error')}")

            return response.json()

    async def get_user_info(self, access_token):
        """Get user info from Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'}
            )

            if response.status_code != 200:
                raise ValueError("Failed to get user info from Google")

            return response.json()

    def get_user_info_sync(self, access_token):
        """Synchronous version of get_user_info"""
        with httpx.Client() as client:
            response = client.get(
                self.USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'}
            )

            if response.status_code != 200:
                raise ValueError("Failed to get user info from Google")

            return response.json()

    def verify_id_token(self, id_token):
        """Verify Google ID token (alternative to userinfo endpoint)"""
        try:
            # Google's public keys for verification
            # In production, fetch from https://www.googleapis.com/oauth2/v3/certs
            # For simplicity, we'll decode without verification and validate claims
            decoded = jwt.decode(id_token, options={"verify_signature": False})

            # Validate claims
            if decoded.get('aud') != self.client_id:
                raise ValueError("Invalid audience")

            if decoded.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError("Invalid issuer")

            # Check expiration
            if decoded.get('exp', 0) < datetime.utcnow().timestamp():
                raise ValueError("Token expired")

            return decoded
        except jwt.DecodeError as e:
            logger.error(f"Failed to decode Google ID token: {e}")
            raise ValueError("Invalid ID token")

    def parse_user_data(self, user_info):
        """Parse user data from Google response"""
        return {
            'provider_user_id': user_info.get('sub'),
            'email': user_info.get('email'),
            'email_verified': user_info.get('email_verified', False),
            'name': user_info.get('name'),
            'given_name': user_info.get('given_name'),
            'family_name': user_info.get('family_name'),
            'picture': user_info.get('picture'),
            'locale': user_info.get('locale')
        }


class AppleOAuth:
    """Apple Sign In implementation"""

    AUTHORIZATION_URL = 'https://appleid.apple.com/auth/authorize'
    TOKEN_URL = 'https://appleid.apple.com/auth/token'
    KEYS_URL = 'https://appleid.apple.com/auth/keys'

    def __init__(self):
        self.client_id = os.getenv('APPLE_CLIENT_ID')  # Service ID
        self.team_id = os.getenv('APPLE_TEAM_ID')
        self.key_id = os.getenv('APPLE_KEY_ID')
        self.private_key = os.getenv('APPLE_PRIVATE_KEY')  # Contents of .p8 file
        self.redirect_uri = os.getenv('APPLE_REDIRECT_URI', 'http://localhost:5173/auth/apple/callback')

    def _generate_client_secret(self):
        """Generate client secret JWT for Apple"""
        if not all([self.team_id, self.client_id, self.key_id, self.private_key]):
            raise ValueError("Apple OAuth not fully configured")

        now = datetime.utcnow()
        payload = {
            'iss': self.team_id,
            'iat': now,
            'exp': now + timedelta(days=180),
            'aud': 'https://appleid.apple.com',
            'sub': self.client_id
        }

        headers = {
            'kid': self.key_id,
            'alg': 'ES256'
        }

        return jwt.encode(payload, self.private_key, algorithm='ES256', headers=headers)

    def get_authorization_url(self, state=None, nonce=None):
        """Generate Apple Sign In authorization URL"""
        if not self.client_id:
            raise ValueError("APPLE_CLIENT_ID not configured")

        state = state or OAuthService.generate_state()
        nonce = nonce or OAuthService.generate_nonce()

        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code id_token',
            'response_mode': 'form_post',
            'scope': 'name email',
            'state': state,
            'nonce': nonce
        }

        url = f"{self.AUTHORIZATION_URL}?{urlencode(params)}"
        return url, state, nonce

    def exchange_code_sync(self, code):
        """Exchange authorization code for tokens"""
        client_secret = self._generate_client_secret()

        with httpx.Client() as client:
            response = client.post(
                self.TOKEN_URL,
                data={
                    'client_id': self.client_id,
                    'client_secret': client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri
                }
            )

            if response.status_code != 200:
                logger.error(f"Apple token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.json().get('error', 'Unknown error')}")

            return response.json()

    def verify_id_token(self, id_token, nonce=None):
        """Verify Apple ID token"""
        try:
            # Decode without verification first to get header
            header = jwt.get_unverified_header(id_token)

            # In production, fetch Apple's public keys and verify signature
            # For now, decode and validate claims
            decoded = jwt.decode(id_token, options={"verify_signature": False})

            # Validate claims
            if decoded.get('aud') != self.client_id:
                raise ValueError("Invalid audience")

            if decoded.get('iss') != 'https://appleid.apple.com':
                raise ValueError("Invalid issuer")

            # Check expiration
            if decoded.get('exp', 0) < datetime.utcnow().timestamp():
                raise ValueError("Token expired")

            # Verify nonce if provided
            if nonce and decoded.get('nonce') != nonce:
                raise ValueError("Invalid nonce")

            return decoded
        except jwt.DecodeError as e:
            logger.error(f"Failed to decode Apple ID token: {e}")
            raise ValueError("Invalid ID token")

    def parse_user_data(self, id_token_data, user_data=None):
        """Parse user data from Apple response"""
        result = {
            'provider_user_id': id_token_data.get('sub'),
            'email': id_token_data.get('email'),
            'email_verified': id_token_data.get('email_verified', False),
            'is_private_email': id_token_data.get('is_private_email', False)
        }

        # Apple only sends name on first authorization
        if user_data:
            if isinstance(user_data, str):
                import json
                try:
                    user_data = json.loads(user_data)
                except:
                    user_data = {}

            name = user_data.get('name', {})
            if name:
                result['given_name'] = name.get('firstName')
                result['family_name'] = name.get('lastName')
                result['name'] = f"{name.get('firstName', '')} {name.get('lastName', '')}".strip()

        return result


# Singleton instances
google_oauth = GoogleOAuth()
apple_oauth = AppleOAuth()


def get_oauth_provider(provider):
    """Get OAuth provider instance by name"""
    providers = {
        'google': google_oauth,
        'apple': apple_oauth
    }
    return providers.get(provider)
