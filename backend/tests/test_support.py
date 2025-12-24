"""
Support System Tests
"""
import pytest


class TestSupportTickets:
    """Test support ticket endpoints"""

    def test_get_tickets_unauthenticated(self, client):
        """Test getting tickets without auth"""
        response = client.get('/api/tickets')
        assert response.status_code in [401, 422]

    def test_get_tickets_authenticated(self, client, auth_headers):
        """Test getting tickets with auth"""
        if auth_headers:
            response = client.get('/api/tickets', headers=auth_headers)
            assert response.status_code == 200

    def test_create_ticket_unauthenticated(self, client):
        """Test creating ticket without auth"""
        response = client.post('/api/tickets', json={
            'subject': 'Test Ticket',
            'message': 'Test message',
            'category': 'general'
        })
        assert response.status_code in [401, 422]

    def test_get_ticket_by_id_authenticated(self, client, auth_headers):
        """Test getting specific ticket with auth"""
        if auth_headers:
            response = client.get('/api/tickets/1', headers=auth_headers)
            # 200 if exists, 404 if not
            assert response.status_code in [200, 404]
