"""
Social Trading Tests
"""
import pytest


class TestTraderProfiles:
    """Test trader profile endpoints"""

    def test_get_my_profile_unauthenticated(self, client):
        """Test getting own profile without auth"""
        response = client.get('/api/profiles/me')
        assert response.status_code in [401, 422]

    def test_get_my_profile_authenticated(self, client, auth_headers):
        """Test getting own profile with auth"""
        if auth_headers:
            response = client.get('/api/profiles/me', headers=auth_headers)
            assert response.status_code == 200

    def test_get_profile_by_id_unauthenticated(self, client):
        """Test getting profile by ID without auth"""
        response = client.get('/api/profiles/1')
        # Requires auth - returns 401 or 403
        assert response.status_code in [401, 403, 422]

    def test_get_profile_by_id_authenticated(self, client, auth_headers):
        """Test getting profile by ID with auth"""
        if auth_headers:
            response = client.get('/api/profiles/1', headers=auth_headers)
            # 200 if exists and viewable, 403 if private, 404 if not found
            assert response.status_code in [200, 403, 404]

    def test_search_profiles(self, client):
        """Test searching profiles"""
        response = client.get('/api/profiles/search?q=test')
        assert response.status_code == 200

    def test_get_leaderboard(self, client):
        """Test getting profile leaderboard"""
        response = client.get('/api/profiles/leaderboard')
        assert response.status_code == 200

    def test_get_badges(self, client):
        """Test getting available badges"""
        response = client.get('/api/profiles/badges')
        assert response.status_code == 200


class TestFollowSystem:
    """Test follow system endpoints"""

    def test_get_followers_unauthenticated(self, client):
        """Test getting followers without auth"""
        response = client.get('/api/follow/followers/1')
        assert response.status_code in [401, 403, 422]

    def test_get_followers_authenticated(self, client, auth_headers):
        """Test getting followers with auth"""
        if auth_headers:
            response = client.get('/api/follow/followers/1', headers=auth_headers)
            # 200 if viewable, 403 if private profile, 404 if not found
            assert response.status_code in [200, 403, 404]

    def test_get_following_unauthenticated(self, client):
        """Test getting following without auth"""
        response = client.get('/api/follow/following/1')
        assert response.status_code in [401, 403, 422]

    def test_get_following_authenticated(self, client, auth_headers):
        """Test getting following with auth"""
        if auth_headers:
            response = client.get('/api/follow/following/1', headers=auth_headers)
            # 200 if viewable, 403 if private profile, 404 if not found
            assert response.status_code in [200, 403, 404]

    def test_check_follow_status(self, client, auth_headers):
        """Test checking follow status"""
        if auth_headers:
            response = client.get('/api/follow/check/1', headers=auth_headers)
            assert response.status_code in [200, 404]

    def test_get_follow_suggestions(self, client, auth_headers):
        """Test getting follow suggestions"""
        if auth_headers:
            response = client.get('/api/follow/suggestions', headers=auth_headers)
            assert response.status_code == 200


class TestCopyTrading:
    """Test copy trading endpoints"""

    def test_get_copy_traders_unauthenticated(self, client):
        """Test getting copy traders without auth"""
        response = client.get('/api/copy-trading/traders')
        assert response.status_code in [401, 422]

    def test_get_copy_traders_authenticated(self, client, auth_headers):
        """Test getting available copy traders with auth"""
        if auth_headers:
            response = client.get('/api/copy-trading/traders', headers=auth_headers)
            assert response.status_code == 200

    def test_get_my_copies_unauthenticated(self, client):
        """Test getting my copies without auth"""
        response = client.get('/api/copy-trading/my-copies')
        assert response.status_code in [401, 422]

    def test_get_my_copies_authenticated(self, client, auth_headers):
        """Test getting my copies with auth"""
        if auth_headers:
            response = client.get('/api/copy-trading/my-copies', headers=auth_headers)
            assert response.status_code == 200

    def test_get_master_settings_authenticated(self, client, auth_headers):
        """Test getting master settings with auth"""
        if auth_headers:
            response = client.get('/api/copy-trading/master-settings', headers=auth_headers)
            assert response.status_code in [200, 404]
