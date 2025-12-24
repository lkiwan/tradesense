"""
Challenge System Tests
"""
import pytest


class TestChallengeModels:
    """Test challenge model endpoints"""

    def test_get_challenge_models(self, client):
        """Test getting all challenge models"""
        response = client.get('/api/challenge-models')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, (list, dict))

    def test_get_challenge_model_by_id(self, client):
        """Test getting a specific challenge model"""
        response = client.get('/api/challenge-models/1')
        # May return 200 if exists or 404 if not
        assert response.status_code in [200, 404]


class TestUserChallenges:
    """Test user challenge endpoints"""

    def test_get_user_challenges_unauthenticated(self, client):
        """Test getting user challenges without auth"""
        response = client.get('/api/challenges')
        assert response.status_code in [401, 422]

    def test_get_user_challenges_authenticated(self, client, auth_headers):
        """Test getting user challenges with auth"""
        if auth_headers:
            response = client.get('/api/challenges', headers=auth_headers)
            assert response.status_code == 200


class TestChallengeAddons:
    """Test challenge add-on endpoints"""

    def test_get_my_addons(self, client, auth_headers):
        """Test getting user add-ons"""
        if auth_headers:
            response = client.get('/api/challenges/my-addons', headers=auth_headers)
            assert response.status_code == 200
