"""
Trading Features Tests
"""
import pytest


class TestTradingFeatures:
    """Test trading feature endpoints"""

    def test_get_order_templates_unauthenticated(self, client):
        """Test getting order templates without auth"""
        response = client.get('/api/templates')
        assert response.status_code in [401, 422]

    def test_get_order_templates_authenticated(self, client, auth_headers):
        """Test getting order templates with auth"""
        if auth_headers:
            response = client.get('/api/templates', headers=auth_headers)
            assert response.status_code == 200


class TestTradeJournal:
    """Test trade journal endpoints"""

    def test_get_journal_entries_unauthenticated(self, client):
        """Test getting journal entries without auth"""
        response = client.get('/api/journal')
        assert response.status_code in [401, 422]

    def test_get_journal_entries_authenticated(self, client, auth_headers):
        """Test getting journal entries with auth"""
        if auth_headers:
            response = client.get('/api/journal', headers=auth_headers)
            assert response.status_code == 200

    def test_get_journal_analytics_authenticated(self, client, auth_headers):
        """Test getting journal analytics with auth"""
        if auth_headers:
            response = client.get('/api/journal/analytics', headers=auth_headers)
            assert response.status_code == 200

    def test_get_journal_tags_authenticated(self, client, auth_headers):
        """Test getting journal tags with auth"""
        if auth_headers:
            response = client.get('/api/journal/tags', headers=auth_headers)
            assert response.status_code == 200


class TestTradingIdeas:
    """Test trading ideas endpoints"""

    def test_get_ideas_unauthenticated(self, client):
        """Test getting ideas without auth"""
        response = client.get('/api/ideas')
        assert response.status_code in [401, 422]

    def test_get_ideas_authenticated(self, client, auth_headers):
        """Test getting ideas with auth"""
        if auth_headers:
            response = client.get('/api/ideas', headers=auth_headers)
            assert response.status_code == 200

    def test_get_trending_ideas_unauthenticated(self, client):
        """Test getting trending ideas without auth"""
        response = client.get('/api/ideas/trending')
        assert response.status_code in [401, 422]

    def test_get_trending_ideas_authenticated(self, client, auth_headers):
        """Test getting trending ideas with auth"""
        if auth_headers:
            response = client.get('/api/ideas/trending', headers=auth_headers)
            assert response.status_code == 200

    def test_get_idea_tags_unauthenticated(self, client):
        """Test getting idea tags without auth"""
        response = client.get('/api/ideas/tags')
        assert response.status_code in [401, 422]

    def test_get_idea_tags_authenticated(self, client, auth_headers):
        """Test getting idea tags with auth"""
        if auth_headers:
            response = client.get('/api/ideas/tags', headers=auth_headers)
            assert response.status_code == 200

    def test_get_my_ideas_unauthenticated(self, client):
        """Test getting my ideas without auth"""
        response = client.get('/api/ideas/my-ideas')
        assert response.status_code in [401, 422]

    def test_get_my_ideas_authenticated(self, client, auth_headers):
        """Test getting my ideas with auth"""
        if auth_headers:
            response = client.get('/api/ideas/my-ideas', headers=auth_headers)
            assert response.status_code == 200

    def test_get_idea_feed_authenticated(self, client, auth_headers):
        """Test getting idea feed with auth"""
        if auth_headers:
            response = client.get('/api/ideas/feed', headers=auth_headers)
            assert response.status_code == 200
