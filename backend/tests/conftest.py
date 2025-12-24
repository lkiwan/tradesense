"""
Pytest Configuration and Fixtures
"""
import os
import sys
import pytest

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    # Use testing config - respects DATABASE_URL from CI environment
    config_name = os.getenv('FLASK_ENV', 'testing')
    _app = create_app(config_name)
    _app.config['TESTING'] = True
    _app.config['WTF_CSRF_ENABLED'] = False

    # Disable rate limiting for tests
    _app.config['RATELIMIT_ENABLED'] = False

    # Try to disable limiter if it exists
    try:
        from middleware.rate_limiter import limiter
        limiter.enabled = False
    except:
        pass

    with _app.app_context():
        yield _app


@pytest.fixture(scope='session')
def client(app):
    """Test client for making requests"""
    return app.test_client()


@pytest.fixture(scope='session')
def runner(app):
    """Test CLI runner"""
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def auth_headers(client, app):
    """Get authentication headers for protected routes"""
    # Disable rate limiter for auth
    try:
        from middleware.rate_limiter import limiter
        limiter.enabled = False
    except:
        pass

    # Login with test user
    response = client.post('/api/auth/login', json={
        'email': 'admin@tradesense.com',
        'password': 'admin123'
    })

    if response.status_code == 200:
        data = response.get_json()
        token = data.get('access_token')
        if token:
            return {'Authorization': f'Bearer {token}'}
    return None
