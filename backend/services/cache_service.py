"""
Cache Service for TradeSense
Provides Redis caching with SimpleCache fallback for development.
"""
import json
import logging
from functools import wraps
from typing import Any, Optional, Callable
from flask import Flask
from flask_caching import Cache

logger = logging.getLogger(__name__)

# Global cache instance
cache = Cache()


def init_cache(app: Flask) -> Cache:
    """
    Initialize cache with Redis or fallback to SimpleCache.

    Args:
        app: Flask application instance

    Returns:
        Configured Cache instance
    """
    redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')

    # Try Redis first
    try:
        cache_config = {
            'CACHE_TYPE': 'RedisCache',
            'CACHE_REDIS_URL': redis_url,
            'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300),
            'CACHE_KEY_PREFIX': 'tradesense_',
        }
        cache.init_app(app, config=cache_config)

        # Test connection
        cache.set('_test_connection', 'ok', timeout=1)
        test_result = cache.get('_test_connection')
        cache.delete('_test_connection')

        if test_result == 'ok':
            logger.info(f"Cache initialized with Redis: {redis_url}")
            app.config['CACHE_BACKEND'] = 'redis'
            return cache
        else:
            raise ConnectionError("Redis connection test failed")

    except Exception as e:
        logger.warning(f"Redis not available ({e}), falling back to SimpleCache")

        # Fallback to SimpleCache (in-memory)
        cache_config = {
            'CACHE_TYPE': 'SimpleCache',
            'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300),
            'CACHE_THRESHOLD': 1000,  # Max items in cache
        }
        cache.init_app(app, config=cache_config)
        logger.info("Cache initialized with SimpleCache (in-memory)")
        app.config['CACHE_BACKEND'] = 'simple'
        return cache


class CacheService:
    """
    Service class for cache operations with JSON serialization support.
    """

    # Cache key prefixes for different data types
    PREFIXES = {
        'market': 'market:',
        'user': 'user:',
        'challenge': 'challenge:',
        'session': 'session:',
        'rate_limit': 'rate:',
    }

    # Default TTL values (in seconds)
    TTL = {
        'market_prices': 5,       # Real-time data, refresh every 5 seconds
        'market_signals': 30,     # AI signals, 30 seconds
        'user_profile': 60,       # User data, 1 minute
        'challenge_data': 30,     # Challenge info, 30 seconds
        'challenge_models': 300,  # Challenge models rarely change, 5 minutes
        'session': 86400,         # Sessions, 24 hours
    }

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        try:
            value = cache.get(key)
            if value is not None:
                logger.debug(f"Cache HIT: {key}")
            else:
                logger.debug(f"Cache MISS: {key}")
            return value
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
            return None

    @classmethod
    def set(cls, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            timeout: TTL in seconds (None uses default)

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.set(key, value, timeout=timeout)
            logger.debug(f"Cache SET: {key} (TTL: {timeout}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
            return False

    @classmethod
    def delete(cls, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache delete error for {key}: {e}")
            return False

    @classmethod
    def delete_pattern(cls, pattern: str) -> int:
        """
        Delete all keys matching pattern.
        Only works with Redis backend.

        Args:
            pattern: Key pattern (e.g., 'user:*')

        Returns:
            Number of keys deleted
        """
        try:
            # This only works with Redis
            if hasattr(cache.cache, '_read_client'):
                client = cache.cache._read_client
                keys = client.keys(f"tradesense_{pattern}")
                if keys:
                    count = client.delete(*keys)
                    logger.debug(f"Cache DELETE PATTERN: {pattern} ({count} keys)")
                    return count
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0

    @classmethod
    def clear(cls) -> bool:
        """
        Clear all cache entries.

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.clear()
            logger.info("Cache CLEARED")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False

    @classmethod
    def get_json(cls, key: str) -> Optional[Any]:
        """
        Get JSON value from cache and deserialize.

        Args:
            key: Cache key

        Returns:
            Deserialized JSON value or None
        """
        value = cls.get(key)
        if value is not None:
            try:
                return json.loads(value) if isinstance(value, str) else value
            except json.JSONDecodeError:
                return value
        return None

    @classmethod
    def set_json(cls, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """
        Serialize value to JSON and store in cache.

        Args:
            key: Cache key
            value: Value to serialize and cache
            timeout: TTL in seconds

        Returns:
            True if successful, False otherwise
        """
        try:
            json_value = json.dumps(value, default=str)
            return cls.set(key, json_value, timeout)
        except (TypeError, json.JSONEncodeError) as e:
            logger.error(f"JSON serialization error for {key}: {e}")
            return False

    # Key generation helpers
    @classmethod
    def market_key(cls, symbol: str) -> str:
        """Generate cache key for market data"""
        return f"{cls.PREFIXES['market']}{symbol}"

    @classmethod
    def user_key(cls, user_id: int, suffix: str = '') -> str:
        """Generate cache key for user data"""
        return f"{cls.PREFIXES['user']}{user_id}{':' + suffix if suffix else ''}"

    @classmethod
    def challenge_key(cls, challenge_id: int = None, suffix: str = '') -> str:
        """Generate cache key for challenge data"""
        base = cls.PREFIXES['challenge']
        if challenge_id:
            return f"{base}{challenge_id}{':' + suffix if suffix else ''}"
        return f"{base}{suffix}"

    @classmethod
    def session_key(cls, session_id: str) -> str:
        """Generate cache key for session data"""
        return f"{cls.PREFIXES['session']}{session_id}"


def cached_response(timeout: int = 300, key_prefix: str = ''):
    """
    Decorator for caching function responses.

    Args:
        timeout: Cache TTL in seconds
        key_prefix: Optional prefix for cache key

    Usage:
        @cached_response(timeout=30, key_prefix='market')
        def get_market_prices(symbols):
            # expensive operation
            return prices
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try to get from cache
            cached_value = CacheService.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function and cache result
            result = func(*args, **kwargs)
            CacheService.set(cache_key, result, timeout)
            return result

        return wrapper
    return decorator


# Convenience decorators with preset TTLs
def cache_market_data(func: Callable) -> Callable:
    """Cache market data for 5 seconds"""
    return cached_response(timeout=CacheService.TTL['market_prices'], key_prefix='market')(func)


def cache_signals(func: Callable) -> Callable:
    """Cache market signals for 30 seconds"""
    return cached_response(timeout=CacheService.TTL['market_signals'], key_prefix='signals')(func)


def cache_user_data(func: Callable) -> Callable:
    """Cache user data for 60 seconds"""
    return cached_response(timeout=CacheService.TTL['user_profile'], key_prefix='user')(func)


def cache_challenge_data(func: Callable) -> Callable:
    """Cache challenge data for 30 seconds"""
    return cached_response(timeout=CacheService.TTL['challenge_data'], key_prefix='challenge')(func)


def invalidate_user_cache(user_id: int):
    """Invalidate all cached data for a user"""
    CacheService.delete_pattern(f"user:{user_id}:*")


def invalidate_challenge_cache(challenge_id: int):
    """Invalidate all cached data for a challenge"""
    CacheService.delete_pattern(f"challenge:{challenge_id}:*")
