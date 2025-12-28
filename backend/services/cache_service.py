"""
Cache Service for TradeSense
Provides multi-layer caching:
  - Layer 1: In-memory LRU cache (fastest, per-worker)
  - Layer 2: Redis cache (shared across workers)
  - Layer 3: SimpleCache fallback for development
"""
import json
import logging
import threading
import time
from collections import OrderedDict
from functools import wraps
from typing import Any, Optional, Callable, Dict, Tuple
from flask import Flask
from flask_caching import Cache

logger = logging.getLogger(__name__)

# Global cache instance
cache = Cache()


class LRUCache:
    """
    Thread-safe LRU (Least Recently Used) cache with TTL support.
    Acts as Layer 1 cache to reduce Redis calls.
    """

    def __init__(self, max_size: int = 1000, default_ttl: int = 60):
        """
        Initialize LRU cache.

        Args:
            max_size: Maximum number of items to store
            default_ttl: Default time-to-live in seconds
        """
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._lock = threading.RLock()
        self._stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0
        }

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self._lock:
            if key not in self._cache:
                self._stats['misses'] += 1
                return None

            value, expiry = self._cache[key]

            # Check if expired
            if time.time() > expiry:
                del self._cache[key]
                self._stats['misses'] += 1
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self._stats['hits'] += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        with self._lock:
            expiry = time.time() + (ttl or self._default_ttl)

            # If key exists, update and move to end
            if key in self._cache:
                self._cache[key] = (value, expiry)
                self._cache.move_to_end(key)
            else:
                # Check if we need to evict
                while len(self._cache) >= self._max_size:
                    self._cache.popitem(last=False)
                    self._stats['evictions'] += 1

                self._cache[key] = (value, expiry)

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self) -> int:
        """Remove expired entries and return count"""
        with self._lock:
            now = time.time()
            expired_keys = [
                key for key, (_, expiry) in self._cache.items()
                if now > expiry
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        with self._lock:
            total = self._stats['hits'] + self._stats['misses']
            hit_rate = (self._stats['hits'] / total * 100) if total > 0 else 0
            return {
                'size': len(self._cache),
                'max_size': self._max_size,
                'hits': self._stats['hits'],
                'misses': self._stats['misses'],
                'evictions': self._stats['evictions'],
                'hit_rate': round(hit_rate, 2)
            }


# Global L1 cache instance (per-worker in-memory cache)
l1_cache = LRUCache(max_size=2000, default_ttl=30)


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
    Multi-layer cache service with JSON serialization support.

    Layer 1: In-memory LRU cache (fastest, per-worker)
    Layer 2: Redis/SimpleCache (shared across workers)
    """

    # Cache key prefixes for different data types
    PREFIXES = {
        'market': 'market:',
        'user': 'user:',
        'challenge': 'challenge:',
        'session': 'session:',
        'rate_limit': 'rate:',
        'forex': 'forex:',
        'news': 'news:',
        'signals': 'signals:',
        'calendar': 'calendar:',
    }

    # Default TTL values (in seconds)
    TTL = {
        'market_prices': 5,       # Real-time data, refresh every 5 seconds
        'market_signals': 30,     # AI signals, 30 seconds
        'forex_rates': 60,        # Forex rates, 1 minute
        'news_feed': 300,         # News feed, 5 minutes
        'calendar_events': 900,   # Calendar events, 15 minutes
        'user_profile': 60,       # User data, 1 minute
        'challenge_data': 30,     # Challenge info, 30 seconds
        'challenge_models': 300,  # Challenge models rarely change, 5 minutes
        'session': 86400,         # Sessions, 24 hours
    }

    # Keys that should skip L1 cache (shared data that needs consistency)
    _SKIP_L1_PREFIXES = ['session:', 'rate:']

    @classmethod
    def _should_use_l1(cls, key: str) -> bool:
        """Check if key should use L1 cache"""
        return not any(key.startswith(prefix) for prefix in cls._SKIP_L1_PREFIXES)

    @classmethod
    def get(cls, key: str, use_l1: bool = True) -> Optional[Any]:
        """
        Get value from multi-layer cache.

        Args:
            key: Cache key
            use_l1: Whether to check L1 cache first (default True)

        Returns:
            Cached value or None if not found
        """
        try:
            # Layer 1: Check in-memory LRU cache first
            if use_l1 and cls._should_use_l1(key):
                l1_value = l1_cache.get(key)
                if l1_value is not None:
                    logger.debug(f"L1 Cache HIT: {key}")
                    return l1_value

            # Layer 2: Check Redis/SimpleCache
            value = cache.get(key)
            if value is not None:
                logger.debug(f"L2 Cache HIT: {key}")
                # Populate L1 cache for future reads
                if use_l1 and cls._should_use_l1(key):
                    l1_cache.set(key, value, ttl=30)  # Short L1 TTL
                return value

            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
            return None

    @classmethod
    def set(cls, key: str, value: Any, timeout: Optional[int] = None, use_l1: bool = True) -> bool:
        """
        Set value in multi-layer cache.

        Args:
            key: Cache key
            value: Value to cache
            timeout: TTL in seconds (None uses default)
            use_l1: Whether to also set in L1 cache (default True)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Layer 2: Set in Redis/SimpleCache
            cache.set(key, value, timeout=timeout)

            # Layer 1: Set in in-memory cache with shorter TTL
            if use_l1 and cls._should_use_l1(key):
                l1_ttl = min(timeout or 30, 60)  # L1 max TTL is 60 seconds
                l1_cache.set(key, value, ttl=l1_ttl)

            logger.debug(f"Cache SET: {key} (TTL: {timeout}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
            return False

    @classmethod
    def delete(cls, key: str) -> bool:
        """
        Delete value from all cache layers.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete from L1
            l1_cache.delete(key)
            # Delete from L2
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
        Clear all cache entries from all layers.

        Returns:
            True if successful, False otherwise
        """
        try:
            # Clear L1
            l1_cache.clear()
            # Clear L2
            cache.clear()
            logger.info("Cache CLEARED (all layers)")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False

    @classmethod
    def get_stats(cls) -> Dict:
        """
        Get cache statistics for all layers.

        Returns:
            Dictionary with cache stats
        """
        from flask import current_app

        l1_stats = l1_cache.get_stats()

        # Get L2 backend type
        l2_backend = 'unknown'
        try:
            l2_backend = current_app.config.get('CACHE_BACKEND', 'unknown')
        except RuntimeError:
            pass

        return {
            'l1_cache': {
                **l1_stats,
                'type': 'LRU (in-memory)'
            },
            'l2_cache': {
                'type': l2_backend,
                'backend': 'Redis' if l2_backend == 'redis' else 'SimpleCache'
            },
            'prefixes': list(cls.PREFIXES.keys()),
            'ttl_config': cls.TTL
        }

    @classmethod
    def cleanup_l1(cls) -> int:
        """
        Remove expired entries from L1 cache.

        Returns:
            Number of entries removed
        """
        return l1_cache.cleanup_expired()

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
