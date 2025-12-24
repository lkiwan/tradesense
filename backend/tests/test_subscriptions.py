"""
Subscription System Tests
"""
import pytest


class TestSubscriptionPlans:
    """Test subscription plan endpoints"""

    def test_get_subscription_plans(self, client):
        """Test getting available subscription plans"""
        response = client.get('/api/subscriptions/plans')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, (list, dict))


class TestUserSubscriptions:
    """Test user subscription endpoints"""

    def test_get_my_subscription_unauthenticated(self, client):
        """Test getting subscription status without auth"""
        response = client.get('/api/premium/my-subscription')
        assert response.status_code in [401, 422]

    def test_get_my_subscription_authenticated(self, client, auth_headers):
        """Test getting subscription status with auth"""
        if auth_headers:
            response = client.get('/api/premium/my-subscription', headers=auth_headers)
            # 200 if has subscription, 404 if not
            assert response.status_code in [200, 404]

    def test_get_trial_status_authenticated(self, client, auth_headers):
        """Test getting trial status with auth"""
        if auth_headers:
            response = client.get('/api/subscriptions/trial/status', headers=auth_headers)
            assert response.status_code in [200, 404]
