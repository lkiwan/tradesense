"""
Points System Tests
"""
import pytest


class TestPointsSystem:
    """Test points system endpoints"""

    def test_get_points_balance_unauthenticated(self, client):
        """Test getting points balance without auth"""
        response = client.get('/api/points/balance')
        assert response.status_code in [401, 422]

    def test_get_points_balance_authenticated(self, client, auth_headers):
        """Test getting points balance with auth"""
        if auth_headers:
            response = client.get('/api/points/balance', headers=auth_headers)
            assert response.status_code == 200

    def test_get_rewards_catalog_unauthenticated(self, client):
        """Test getting rewards catalog without auth"""
        response = client.get('/api/points/rewards')
        assert response.status_code in [401, 422]

    def test_get_rewards_catalog_authenticated(self, client, auth_headers):
        """Test getting rewards catalog with auth"""
        if auth_headers:
            response = client.get('/api/points/rewards', headers=auth_headers)
            assert response.status_code == 200

    def test_get_points_leaderboard_unauthenticated(self, client):
        """Test getting points leaderboard without auth"""
        response = client.get('/api/points/leaderboard')
        assert response.status_code in [401, 422]

    def test_get_points_leaderboard_authenticated(self, client, auth_headers):
        """Test getting points leaderboard with auth"""
        if auth_headers:
            response = client.get('/api/points/leaderboard', headers=auth_headers)
            assert response.status_code == 200


class TestPointsTransactions:
    """Test points transaction endpoints"""

    def test_get_points_history_unauthenticated(self, client):
        """Test getting points history without auth"""
        response = client.get('/api/points/history')
        assert response.status_code in [401, 422]

    def test_get_points_history_authenticated(self, client, auth_headers):
        """Test getting points history with auth"""
        if auth_headers:
            response = client.get('/api/points/history', headers=auth_headers)
            assert response.status_code == 200

    def test_get_points_activities_authenticated(self, client, auth_headers):
        """Test getting points activities with auth"""
        if auth_headers:
            response = client.get('/api/points/activities', headers=auth_headers)
            assert response.status_code == 200

    def test_get_redemptions_authenticated(self, client, auth_headers):
        """Test getting redemptions with auth"""
        if auth_headers:
            response = client.get('/api/points/redemptions', headers=auth_headers)
            assert response.status_code == 200
