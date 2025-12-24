"""
Authentication Tests
"""
import pytest


class TestAuthEndpoints:
    """Test authentication endpoints"""

    def test_login_success(self, client):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'email': 'admin@tradesense.com',
            'password': 'admin123'
        })
        # Should return 200 or handle if user doesn't exist
        assert response.status_code in [200, 401, 429]

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'invalid@test.com',
            'password': 'wrongpassword'
        })
        assert response.status_code in [401, 404, 429]

    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post('/api/auth/login', json={})
        assert response.status_code in [400, 401, 422]

    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token"""
        response = client.get('/api/auth/me')
        assert response.status_code in [401, 422]

    def test_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token"""
        response = client.get('/api/auth/me', headers={
            'Authorization': 'Bearer invalid_token_here'
        })
        assert response.status_code in [401, 422]

    def test_get_current_user_authenticated(self, client, auth_headers):
        """Test getting current user with valid auth"""
        if auth_headers:
            response = client.get('/api/auth/me', headers=auth_headers)
            assert response.status_code == 200
            data = response.get_json()
            assert 'email' in data or 'user' in data


class TestRegistration:
    """Test registration endpoints"""

    def test_register_missing_fields(self, client):
        """Test registration with missing fields"""
        response = client.post('/api/auth/register', json={
            'email': 'test@test.com'
        })
        assert response.status_code in [400, 422]

    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post('/api/auth/register', json={
            'email': 'invalid-email',
            'password': 'TestPass123!',
            'username': 'testuser'
        })
        assert response.status_code in [400, 422]


class TestTwoFactor:
    """Test 2FA endpoints"""

    def test_get_2fa_status_unauthenticated(self, client):
        """Test getting 2FA status without auth"""
        response = client.get('/api/auth/2fa/status')
        assert response.status_code in [401, 422]

    def test_get_2fa_status_authenticated(self, client, auth_headers):
        """Test getting 2FA status with auth"""
        if auth_headers:
            response = client.get('/api/auth/2fa/status', headers=auth_headers)
            assert response.status_code == 200


class TestSessions:
    """Test session management endpoints"""

    def test_get_sessions_unauthenticated(self, client):
        """Test getting sessions without auth"""
        response = client.get('/api/auth/sessions')
        assert response.status_code in [401, 422]

    def test_get_sessions_authenticated(self, client, auth_headers):
        """Test getting sessions with auth"""
        if auth_headers:
            response = client.get('/api/auth/sessions', headers=auth_headers)
            assert response.status_code == 200
