"""
Service Layer Tests
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestCacheService:
    """Test cache service"""

    def test_cache_service_import(self):
        """Test cache service can be imported"""
        try:
            from services.cache_service import cache
            assert cache is not None
        except ImportError as e:
            pytest.skip(f"Cache service not available: {e}")


class TestMetricsService:
    """Test metrics service"""

    def test_metrics_service_import(self):
        """Test metrics service can be imported"""
        from services.metrics_service import metrics
        assert metrics is not None

    def test_metrics_uptime(self):
        """Test metrics uptime calculation"""
        from services.metrics_service import metrics
        uptime = metrics.get_uptime()
        assert 'uptime_seconds' in uptime
        assert uptime['uptime_seconds'] >= 0

    def test_metrics_system_metrics(self):
        """Test system metrics collection"""
        from services.metrics_service import metrics
        system_metrics = metrics.get_system_metrics()
        assert 'cpu_percent' in system_metrics
        assert 'memory_percent' in system_metrics


class TestEmailService:
    """Test email service"""

    def test_email_service_import(self):
        """Test email service can be imported"""
        try:
            from services.email_service import EmailService
            assert EmailService is not None
        except ImportError as e:
            pytest.skip(f"Email service not available: {e}")


class TestStripeService:
    """Test stripe service"""

    def test_stripe_service_import(self):
        """Test stripe service can be imported"""
        try:
            from services.stripe_service import StripeService
            assert StripeService is not None
        except ImportError as e:
            pytest.skip(f"Stripe service not available: {e}")
