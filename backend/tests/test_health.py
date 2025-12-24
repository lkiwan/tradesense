"""
Health Check and Monitoring Tests
"""
import pytest


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_health_check(self, client):
        """Test basic health endpoint"""
        response = client.get('/api/monitoring/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data

    def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe"""
        response = client.get('/api/monitoring/live')
        assert response.status_code == 200
        data = response.get_json()
        assert data['alive'] is True

    def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe"""
        response = client.get('/api/monitoring/ready')
        assert response.status_code == 200
        data = response.get_json()
        assert data['ready'] is True

    def test_detailed_health(self, client):
        """Test detailed health check"""
        response = client.get('/api/monitoring/health/detailed')
        assert response.status_code == 200
        data = response.get_json()
        assert 'components' in data
        assert 'database' in data['components']
