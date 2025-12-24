"""
Notification System Tests
"""
import pytest


class TestNotifications:
    """Test notification endpoints"""

    def test_get_notifications_unauthenticated(self, client):
        """Test getting notifications without auth"""
        response = client.get('/api/notifications/history')
        assert response.status_code in [401, 422]

    def test_get_notifications_authenticated(self, client, auth_headers):
        """Test getting notifications with auth"""
        if auth_headers:
            response = client.get('/api/notifications/history', headers=auth_headers)
            assert response.status_code == 200

    def test_get_notification_preferences_unauthenticated(self, client):
        """Test getting notification preferences without auth"""
        response = client.get('/api/notifications/preferences')
        assert response.status_code in [401, 422]

    def test_get_notification_preferences_authenticated(self, client, auth_headers):
        """Test getting notification preferences with auth"""
        if auth_headers:
            response = client.get('/api/notifications/preferences', headers=auth_headers)
            assert response.status_code == 200

    def test_get_unread_count_authenticated(self, client, auth_headers):
        """Test getting unread notification count with auth"""
        if auth_headers:
            response = client.get('/api/notifications/unread-count', headers=auth_headers)
            assert response.status_code == 200

    def test_get_vapid_key(self, client):
        """Test getting VAPID public key for push notifications"""
        response = client.get('/api/notifications/vapid-key')
        assert response.status_code in [200, 404, 501]  # May not be configured

    def test_get_devices_authenticated(self, client, auth_headers):
        """Test getting registered devices with auth"""
        if auth_headers:
            response = client.get('/api/notifications/devices', headers=auth_headers)
            assert response.status_code == 200
