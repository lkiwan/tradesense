"""
Metrics Service for TradeSense
Collects and stores application and system metrics
"""

import os
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from threading import Lock
from functools import wraps

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collects and stores application metrics"""

    def __init__(self, max_history_minutes=60):
        self.max_history = max_history_minutes
        self._lock = Lock()

        # Request metrics
        self.request_count = 0
        self.request_times = []  # (timestamp, duration, endpoint, status)
        self.error_count = 0
        self.errors = []  # (timestamp, endpoint, error_type, message)

        # Endpoint-specific metrics
        self.endpoint_stats = defaultdict(lambda: {
            'count': 0,
            'total_time': 0,
            'errors': 0,
            'avg_time': 0
        })

        # Database metrics
        self.db_query_count = 0
        self.db_query_times = []

        # Cache metrics
        self.cache_hits = 0
        self.cache_misses = 0

        # Business metrics
        self.active_users = set()
        self.user_actions = []  # (timestamp, user_id, action)

        # Custom counters
        self.counters = defaultdict(int)

        # Start time for uptime calculation
        self.start_time = datetime.utcnow()

    def record_request(self, endpoint, duration, status_code):
        """Record a request metric"""
        with self._lock:
            self.request_count += 1
            timestamp = datetime.utcnow()

            self.request_times.append({
                'timestamp': timestamp,
                'duration': duration,
                'endpoint': endpoint,
                'status': status_code
            })

            # Update endpoint stats
            stats = self.endpoint_stats[endpoint]
            stats['count'] += 1
            stats['total_time'] += duration
            stats['avg_time'] = stats['total_time'] / stats['count']

            if status_code >= 400:
                stats['errors'] += 1
                self.error_count += 1

            # Cleanup old data
            self._cleanup_old_data()

    def record_error(self, endpoint, error_type, message):
        """Record an error"""
        with self._lock:
            self.errors.append({
                'timestamp': datetime.utcnow(),
                'endpoint': endpoint,
                'error_type': error_type,
                'message': str(message)[:500]  # Limit message length
            })
            self.error_count += 1

    def record_db_query(self, duration):
        """Record a database query"""
        with self._lock:
            self.db_query_count += 1
            self.db_query_times.append({
                'timestamp': datetime.utcnow(),
                'duration': duration
            })

    def record_cache_hit(self):
        """Record a cache hit"""
        with self._lock:
            self.cache_hits += 1

    def record_cache_miss(self):
        """Record a cache miss"""
        with self._lock:
            self.cache_misses += 1

    def record_user_activity(self, user_id, action):
        """Record user activity"""
        with self._lock:
            self.active_users.add(user_id)
            self.user_actions.append({
                'timestamp': datetime.utcnow(),
                'user_id': user_id,
                'action': action
            })

    def increment_counter(self, name, value=1):
        """Increment a custom counter"""
        with self._lock:
            self.counters[name] += value

    def _cleanup_old_data(self):
        """Remove data older than max_history minutes"""
        cutoff = datetime.utcnow() - timedelta(minutes=self.max_history)

        self.request_times = [r for r in self.request_times if r['timestamp'] > cutoff]
        self.errors = [e for e in self.errors if e['timestamp'] > cutoff]
        self.db_query_times = [q for q in self.db_query_times if q['timestamp'] > cutoff]
        self.user_actions = [a for a in self.user_actions if a['timestamp'] > cutoff]

    def get_system_metrics(self):
        """Get current system metrics"""
        metrics = {
            'cpu_percent': 0,
            'memory_percent': 0,
            'memory_used_mb': 0,
            'memory_total_mb': 0,
            'disk_percent': 0,
            'disk_used_gb': 0,
            'disk_total_gb': 0,
            'open_files': 0,
            'threads': 0,
            'process_memory_mb': 0
        }

        if PSUTIL_AVAILABLE:
            try:
                # CPU
                metrics['cpu_percent'] = psutil.cpu_percent(interval=0.1)

                # Memory
                mem = psutil.virtual_memory()
                metrics['memory_percent'] = mem.percent
                metrics['memory_used_mb'] = round(mem.used / (1024 * 1024), 2)
                metrics['memory_total_mb'] = round(mem.total / (1024 * 1024), 2)

                # Disk
                disk = psutil.disk_usage('/')
                metrics['disk_percent'] = disk.percent
                metrics['disk_used_gb'] = round(disk.used / (1024 * 1024 * 1024), 2)
                metrics['disk_total_gb'] = round(disk.total / (1024 * 1024 * 1024), 2)

                # Process info
                process = psutil.Process()
                metrics['process_memory_mb'] = round(process.memory_info().rss / (1024 * 1024), 2)
                metrics['threads'] = process.num_threads()
                try:
                    metrics['open_files'] = len(process.open_files())
                except:
                    pass

            except Exception as e:
                logger.warning(f"Error collecting system metrics: {e}")

        return metrics

    def get_request_metrics(self, minutes=5):
        """Get request metrics for the last N minutes"""
        with self._lock:
            cutoff = datetime.utcnow() - timedelta(minutes=minutes)
            recent_requests = [r for r in self.request_times if r['timestamp'] > cutoff]

            if not recent_requests:
                return {
                    'requests_per_minute': 0,
                    'avg_response_time': 0,
                    'error_rate': 0,
                    'total_requests': 0
                }

            total = len(recent_requests)
            errors = sum(1 for r in recent_requests if r['status'] >= 400)
            avg_time = sum(r['duration'] for r in recent_requests) / total

            return {
                'requests_per_minute': round(total / minutes, 2),
                'avg_response_time': round(avg_time * 1000, 2),  # Convert to ms
                'error_rate': round((errors / total) * 100, 2) if total > 0 else 0,
                'total_requests': total
            }

    def get_endpoint_metrics(self, limit=20):
        """Get metrics for each endpoint"""
        with self._lock:
            endpoints = []
            for endpoint, stats in sorted(
                self.endpoint_stats.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:limit]:
                endpoints.append({
                    'endpoint': endpoint,
                    'requests': stats['count'],
                    'avg_time_ms': round(stats['avg_time'] * 1000, 2),
                    'errors': stats['errors'],
                    'error_rate': round((stats['errors'] / stats['count']) * 100, 2) if stats['count'] > 0 else 0
                })
            return endpoints

    def get_error_summary(self, limit=50):
        """Get recent errors"""
        with self._lock:
            return [
                {
                    'timestamp': e['timestamp'].isoformat(),
                    'endpoint': e['endpoint'],
                    'error_type': e['error_type'],
                    'message': e['message']
                }
                for e in sorted(self.errors, key=lambda x: x['timestamp'], reverse=True)[:limit]
            ]

    def get_cache_metrics(self):
        """Get cache hit/miss metrics"""
        with self._lock:
            total = self.cache_hits + self.cache_misses
            return {
                'hits': self.cache_hits,
                'misses': self.cache_misses,
                'hit_rate': round((self.cache_hits / total) * 100, 2) if total > 0 else 0
            }

    def get_uptime(self):
        """Get application uptime"""
        uptime = datetime.utcnow() - self.start_time
        return {
            'start_time': self.start_time.isoformat(),
            'uptime_seconds': int(uptime.total_seconds()),
            'uptime_formatted': str(uptime).split('.')[0]
        }

    def get_active_users_count(self, minutes=15):
        """Get count of recently active users"""
        with self._lock:
            cutoff = datetime.utcnow() - timedelta(minutes=minutes)
            recent_users = set(
                a['user_id'] for a in self.user_actions
                if a['timestamp'] > cutoff
            )
            return len(recent_users)

    def get_full_report(self):
        """Get comprehensive metrics report"""
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': self.get_uptime(),
            'system': self.get_system_metrics(),
            'requests': self.get_request_metrics(),
            'endpoints': self.get_endpoint_metrics(),
            'cache': self.get_cache_metrics(),
            'errors': {
                'total': self.error_count,
                'recent': self.get_error_summary(10)
            },
            'users': {
                'active_15m': self.get_active_users_count(15),
                'active_60m': self.get_active_users_count(60)
            },
            'counters': dict(self.counters)
        }


# Singleton instance
metrics = MetricsCollector()


def track_request_time(f):
    """Decorator to track request timing"""
    @wraps(f)
    def decorated(*args, **kwargs):
        start = time.time()
        try:
            result = f(*args, **kwargs)
            duration = time.time() - start

            # Get endpoint and status from Flask
            from flask import request
            endpoint = request.endpoint or request.path
            status = getattr(result, 'status_code', 200) if hasattr(result, 'status_code') else 200

            metrics.record_request(endpoint, duration, status)
            return result
        except Exception as e:
            duration = time.time() - start
            from flask import request
            endpoint = request.endpoint or request.path
            metrics.record_request(endpoint, duration, 500)
            metrics.record_error(endpoint, type(e).__name__, str(e))
            raise
    return decorated


def setup_request_tracking(app):
    """Setup automatic request tracking for Flask app"""

    @app.before_request
    def before_request():
        from flask import g
        g.start_time = time.time()

    @app.after_request
    def after_request(response):
        from flask import g, request

        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            endpoint = request.endpoint or request.path
            metrics.record_request(endpoint, duration, response.status_code)

            # Track user activity if authenticated
            try:
                from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    metrics.record_user_activity(user_id, endpoint)
            except:
                pass

        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        from flask import request, jsonify
        from werkzeug.exceptions import HTTPException
        import logging

        logger = logging.getLogger(__name__)
        endpoint = request.endpoint or request.path
        metrics.record_error(endpoint, type(e).__name__, str(e))

        # Return proper response with CORS headers instead of re-raising
        if isinstance(e, HTTPException):
            response = jsonify({'error': e.description})
            response.status_code = e.code
        else:
            logger.error(f"Unhandled exception at {endpoint}: {e}", exc_info=True)
            response = jsonify({'error': 'Internal server error'})
            response.status_code = 500

        # Add CORS headers to error responses
        origin = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Session-Token, Accept, Origin'
        return response
