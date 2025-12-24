"""
Affiliate System Tests
"""
import pytest


class TestAffiliateSystem:
    """Test affiliate system endpoints"""

    def test_get_affiliate_dashboard_unauthenticated(self, client):
        """Test getting affiliate dashboard without auth"""
        response = client.get('/api/affiliates/dashboard')
        assert response.status_code in [401, 422]

    def test_get_affiliate_dashboard_authenticated(self, client, auth_headers):
        """Test getting affiliate dashboard with auth"""
        if auth_headers:
            response = client.get('/api/affiliates/dashboard', headers=auth_headers)
            assert response.status_code == 200

    def test_get_referrals_unauthenticated(self, client):
        """Test getting referrals without auth"""
        response = client.get('/api/affiliates/referrals')
        assert response.status_code in [401, 422]

    def test_get_referrals_authenticated(self, client, auth_headers):
        """Test getting referrals with auth"""
        if auth_headers:
            response = client.get('/api/affiliates/referrals', headers=auth_headers)
            assert response.status_code == 200

    def test_get_commissions_authenticated(self, client, auth_headers):
        """Test getting commissions with auth"""
        if auth_headers:
            response = client.get('/api/affiliates/commissions', headers=auth_headers)
            assert response.status_code == 200

    def test_get_payouts_authenticated(self, client, auth_headers):
        """Test getting payouts with auth"""
        if auth_headers:
            response = client.get('/api/affiliates/payouts', headers=auth_headers)
            assert response.status_code == 200
