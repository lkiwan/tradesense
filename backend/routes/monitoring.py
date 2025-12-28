"""
Monitoring and Health Check Routes
Provides system health, metrics, and analytics endpoints
"""

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
import time
from datetime import datetime, timedelta

from models import db, User
from services.metrics_service import metrics

monitoring_bp = Blueprint('monitoring', __name__, url_prefix='/api/monitoring')


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


# ======================
# Public Health Endpoints
# ======================

@monitoring_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'tradesense-api'
    })


@monitoring_bp.route('/health/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check with component status"""
    health = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'components': {}
    }

    # Check database
    try:
        db.session.execute(db.text('SELECT 1'))
        health['components']['database'] = {
            'status': 'healthy',
            'type': 'postgresql'
        }
    except Exception as e:
        health['components']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health['status'] = 'degraded'

    # Check Redis cache (if configured)
    try:
        from services.cache_service import cache, CacheService
        if hasattr(cache, 'cache') and hasattr(cache.cache, '_client'):
            cache.cache._client.ping()
            health['components']['cache'] = {
                'status': 'healthy',
                'type': 'redis'
            }
        else:
            health['components']['cache'] = {
                'status': 'healthy',
                'type': 'simple'
            }

        # Add cache stats
        cache_stats = CacheService.get_stats()
        health['components']['cache']['l1_hit_rate'] = cache_stats['l1_cache']['hit_rate']
    except Exception as e:
        health['components']['cache'] = {
            'status': 'degraded',
            'error': str(e)
        }

    # Check circuit breakers
    try:
        from services.circuit_breaker import circuit_registry
        breaker_stats = circuit_registry.get_all_stats()
        open_circuits = [name for name, stats in breaker_stats.items() if stats['state'] == 'open']

        health['components']['circuit_breakers'] = {
            'status': 'healthy' if not open_circuits else 'degraded',
            'total': len(breaker_stats),
            'open': open_circuits
        }

        if open_circuits:
            health['status'] = 'degraded'
    except Exception as e:
        health['components']['circuit_breakers'] = {
            'status': 'unknown',
            'error': str(e)
        }

    # Add uptime info
    uptime = metrics.get_uptime()
    health['uptime'] = uptime

    return jsonify(health)


@monitoring_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Kubernetes-style readiness probe"""
    try:
        # Check if database is accessible
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            'ready': True,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'ready': False,
            'error': str(e)
        }), 503


@monitoring_bp.route('/live', methods=['GET'])
def liveness_check():
    """Kubernetes-style liveness probe"""
    return jsonify({
        'alive': True,
        'timestamp': datetime.utcnow().isoformat()
    })


# ======================
# Admin Metrics Endpoints
# ======================

@monitoring_bp.route('/metrics', methods=['GET'])
@admin_required
def get_metrics():
    """Get full metrics report (admin only)"""
    return jsonify(metrics.get_full_report())


@monitoring_bp.route('/metrics/system', methods=['GET'])
@admin_required
def get_system_metrics():
    """Get system resource metrics"""
    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'system': metrics.get_system_metrics()
    })


@monitoring_bp.route('/metrics/requests', methods=['GET'])
@admin_required
def get_request_metrics():
    """Get request performance metrics"""
    minutes = request.args.get('minutes', 5, type=int)
    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'period_minutes': minutes,
        'metrics': metrics.get_request_metrics(minutes)
    })


@monitoring_bp.route('/metrics/endpoints', methods=['GET'])
@admin_required
def get_endpoint_metrics():
    """Get per-endpoint metrics"""
    limit = request.args.get('limit', 20, type=int)
    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': metrics.get_endpoint_metrics(limit)
    })


@monitoring_bp.route('/metrics/errors', methods=['GET'])
@admin_required
def get_error_metrics():
    """Get recent errors"""
    limit = request.args.get('limit', 50, type=int)
    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'total_errors': metrics.error_count,
        'errors': metrics.get_error_summary(limit)
    })


@monitoring_bp.route('/metrics/cache', methods=['GET'])
@admin_required
def get_cache_metrics():
    """Get cache performance metrics"""
    from services.cache_service import CacheService

    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'cache': metrics.get_cache_metrics(),
        'multi_layer': CacheService.get_stats()
    })


@monitoring_bp.route('/metrics/circuit-breakers', methods=['GET'])
@admin_required
def get_circuit_breaker_metrics():
    """Get circuit breaker status and metrics"""
    from services.circuit_breaker import circuit_registry

    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'circuit_breakers': circuit_registry.get_all_stats()
    })


@monitoring_bp.route('/metrics/circuit-breakers/<name>/reset', methods=['POST'])
@admin_required
def reset_circuit_breaker(name):
    """Reset a specific circuit breaker"""
    from services.circuit_breaker import circuit_registry

    breaker = circuit_registry.get(name)
    if not breaker:
        return jsonify({'error': f'Circuit breaker "{name}" not found'}), 404

    breaker.reset()
    return jsonify({
        'message': f'Circuit breaker "{name}" reset successfully',
        'stats': breaker.get_stats()
    })


@monitoring_bp.route('/health/services', methods=['GET'])
def external_services_health():
    """Check health of external services"""
    services = {
        'timestamp': datetime.utcnow().isoformat(),
        'services': {}
    }

    # Check Yahoo Finance
    try:
        import yfinance as yf
        ticker = yf.Ticker("AAPL")
        hist = ticker.history(period='1d')
        services['services']['yfinance'] = {
            'status': 'healthy' if not hist.empty else 'degraded',
            'response_time_ms': 0  # Would need timing
        }
    except Exception as e:
        services['services']['yfinance'] = {
            'status': 'unhealthy',
            'error': str(e)[:100]
        }

    # Check Frankfurter API (Forex)
    try:
        import requests
        start = time.time()
        resp = requests.get('https://api.frankfurter.app/latest?from=USD', timeout=5)
        elapsed = (time.time() - start) * 1000
        services['services']['frankfurter'] = {
            'status': 'healthy' if resp.status_code == 200 else 'degraded',
            'response_time_ms': round(elapsed, 2)
        }
    except Exception as e:
        services['services']['frankfurter'] = {
            'status': 'unhealthy',
            'error': str(e)[:100]
        }

    # Check circuit breaker states
    try:
        from services.circuit_breaker import circuit_registry
        for name, stats in circuit_registry.get_all_stats().items():
            if name not in services['services']:
                services['services'][name] = {
                    'status': 'healthy' if stats['state'] == 'closed' else stats['state'],
                    'circuit_state': stats['state'],
                    'failure_count': stats['failure_count']
                }
    except Exception:
        pass

    return jsonify(services)


@monitoring_bp.route('/metrics/users', methods=['GET'])
@admin_required
def get_user_metrics():
    """Get active user metrics"""
    return jsonify({
        'timestamp': datetime.utcnow().isoformat(),
        'active_users': {
            '15_minutes': metrics.get_active_users_count(15),
            '60_minutes': metrics.get_active_users_count(60)
        }
    })


# ======================
# Analytics Endpoints
# ======================

@monitoring_bp.route('/analytics/overview', methods=['GET'])
@admin_required
def analytics_overview():
    """Get analytics overview for dashboard"""
    # Get time range
    days = request.args.get('days', 7, type=int)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get user stats
    total_users = User.query.count()
    new_users = User.query.filter(User.created_at >= start_date).count()
    verified_users = User.query.filter(User.email_verified == True).count()

    # Get challenge stats
    try:
        from models import UserChallenge
        total_challenges = UserChallenge.query.count()
        active_challenges = UserChallenge.query.filter(
            UserChallenge.status.in_(['active', 'evaluation'])
        ).count()
        passed_challenges = UserChallenge.query.filter(
            UserChallenge.status == 'passed'
        ).count()
    except:
        total_challenges = 0
        active_challenges = 0
        passed_challenges = 0

    # Get payment stats
    try:
        from models import Payment
        total_revenue = db.session.query(
            db.func.sum(Payment.amount)
        ).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date
        ).scalar() or 0

        payment_count = Payment.query.filter(
            Payment.status == 'completed',
            Payment.created_at >= start_date
        ).count()
    except:
        total_revenue = 0
        payment_count = 0

    return jsonify({
        'period': {
            'days': days,
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'users': {
            'total': total_users,
            'new': new_users,
            'verified': verified_users,
            'active_15m': metrics.get_active_users_count(15),
            'active_60m': metrics.get_active_users_count(60)
        },
        'challenges': {
            'total': total_challenges,
            'active': active_challenges,
            'passed': passed_challenges,
            'pass_rate': round((passed_challenges / total_challenges * 100), 2) if total_challenges > 0 else 0
        },
        'revenue': {
            'total': float(total_revenue),
            'transactions': payment_count,
            'average': round(float(total_revenue) / payment_count, 2) if payment_count > 0 else 0
        },
        'performance': metrics.get_request_metrics(60),
        'system': metrics.get_system_metrics()
    })


@monitoring_bp.route('/analytics/users/growth', methods=['GET'])
@admin_required
def user_growth_analytics():
    """Get user growth data for charts"""
    days = request.args.get('days', 30, type=int)

    growth_data = []
    for i in range(days, -1, -1):
        date = datetime.utcnow().date() - timedelta(days=i)
        next_date = date + timedelta(days=1)

        count = User.query.filter(
            db.func.date(User.created_at) == date
        ).count()

        growth_data.append({
            'date': date.isoformat(),
            'new_users': count
        })

    return jsonify({
        'period_days': days,
        'data': growth_data
    })


@monitoring_bp.route('/analytics/revenue/daily', methods=['GET'])
@admin_required
def daily_revenue_analytics():
    """Get daily revenue data for charts"""
    days = request.args.get('days', 30, type=int)

    try:
        from models import Payment

        revenue_data = []
        for i in range(days, -1, -1):
            date = datetime.utcnow().date() - timedelta(days=i)

            daily_revenue = db.session.query(
                db.func.sum(Payment.amount)
            ).filter(
                Payment.status == 'completed',
                db.func.date(Payment.created_at) == date
            ).scalar() or 0

            revenue_data.append({
                'date': date.isoformat(),
                'revenue': float(daily_revenue)
            })

        return jsonify({
            'period_days': days,
            'data': revenue_data
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'data': []
        })


@monitoring_bp.route('/analytics/challenges/distribution', methods=['GET'])
@admin_required
def challenge_distribution():
    """Get challenge status distribution"""
    try:
        from models import UserChallenge

        distribution = db.session.query(
            UserChallenge.status,
            db.func.count(UserChallenge.id)
        ).group_by(UserChallenge.status).all()

        return jsonify({
            'distribution': {status: count for status, count in distribution}
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'distribution': {}
        })


@monitoring_bp.route('/analytics/endpoints/popular', methods=['GET'])
@admin_required
def popular_endpoints():
    """Get most popular API endpoints"""
    limit = request.args.get('limit', 10, type=int)
    return jsonify({
        'endpoints': metrics.get_endpoint_metrics(limit)
    })


# ======================
# Prometheus Metrics
# ======================

@monitoring_bp.route('/prometheus', methods=['GET'])
def prometheus_metrics():
    """Prometheus-compatible metrics endpoint"""
    try:
        from prometheus_client import (
            generate_latest,
            CONTENT_TYPE_LATEST,
            Counter,
            Gauge,
            Histogram,
            REGISTRY
        )

        # Update gauges with current metrics
        system = metrics.get_system_metrics()
        request_stats = metrics.get_request_metrics()

        # Generate and return metrics
        return generate_latest(REGISTRY), 200, {'Content-Type': CONTENT_TYPE_LATEST}
    except ImportError:
        return jsonify({'error': 'prometheus-client not installed'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500
