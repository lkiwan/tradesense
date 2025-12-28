"""
Circuit Breaker Pattern Implementation
Provides resilience for external API calls with automatic fallback and recovery.
"""

import time
import threading
import logging
from enum import Enum
from functools import wraps
from datetime import datetime, timedelta
from typing import Callable, Any, Optional, Dict

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation, requests pass through
    OPEN = "open"          # Circuit is tripped, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit Breaker implementation for external service calls.

    States:
    - CLOSED: Normal operation, all requests pass through
    - OPEN: Service is down, fail fast without calling
    - HALF_OPEN: Testing if service recovered

    Usage:
        breaker = CircuitBreaker("yahoo_finance", failure_threshold=5, recovery_timeout=60)

        @breaker
        def fetch_price(symbol):
            return yfinance.get_price(symbol)
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 3
    ):
        """
        Initialize circuit breaker.

        Args:
            name: Identifier for this circuit breaker
            failure_threshold: Number of failures before opening circuit
            success_threshold: Number of successes in half-open to close circuit
            recovery_timeout: Seconds to wait before attempting recovery
            half_open_max_calls: Max concurrent calls in half-open state
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._last_state_change: datetime = datetime.now()
        self._half_open_calls = 0
        self._lock = threading.RLock()

        # Statistics
        self._stats = {
            'total_calls': 0,
            'successful_calls': 0,
            'failed_calls': 0,
            'rejected_calls': 0,
            'state_changes': []
        }

    @property
    def state(self) -> CircuitState:
        """Get current circuit state, checking for recovery timeout"""
        with self._lock:
            if self._state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self._last_failure_time:
                    elapsed = (datetime.now() - self._last_failure_time).total_seconds()
                    if elapsed >= self.recovery_timeout:
                        self._transition_to(CircuitState.HALF_OPEN)
            return self._state

    def _transition_to(self, new_state: CircuitState):
        """Transition to a new state"""
        old_state = self._state
        self._state = new_state
        self._last_state_change = datetime.now()

        if new_state == CircuitState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
        elif new_state == CircuitState.HALF_OPEN:
            self._success_count = 0
            self._half_open_calls = 0

        self._stats['state_changes'].append({
            'from': old_state.value,
            'to': new_state.value,
            'timestamp': datetime.now().isoformat()
        })

        # Keep only last 20 state changes
        if len(self._stats['state_changes']) > 20:
            self._stats['state_changes'] = self._stats['state_changes'][-20:]

        logger.info(f"Circuit breaker '{self.name}': {old_state.value} -> {new_state.value}")

    def _record_success(self):
        """Record a successful call"""
        with self._lock:
            self._stats['total_calls'] += 1
            self._stats['successful_calls'] += 1

            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._transition_to(CircuitState.CLOSED)
            elif self._state == CircuitState.CLOSED:
                # Reset failure count on success
                self._failure_count = 0

    def _record_failure(self, error: Exception):
        """Record a failed call"""
        with self._lock:
            self._stats['total_calls'] += 1
            self._stats['failed_calls'] += 1
            self._failure_count += 1
            self._last_failure_time = datetime.now()

            logger.warning(f"Circuit breaker '{self.name}' failure #{self._failure_count}: {error}")

            if self._state == CircuitState.HALF_OPEN:
                # Any failure in half-open immediately opens circuit
                self._transition_to(CircuitState.OPEN)
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._transition_to(CircuitState.OPEN)

    def _can_execute(self) -> bool:
        """Check if a call can be executed"""
        current_state = self.state  # This also checks recovery timeout

        if current_state == CircuitState.CLOSED:
            return True
        elif current_state == CircuitState.OPEN:
            self._stats['rejected_calls'] += 1
            return False
        elif current_state == CircuitState.HALF_OPEN:
            with self._lock:
                if self._half_open_calls < self.half_open_max_calls:
                    self._half_open_calls += 1
                    return True
                self._stats['rejected_calls'] += 1
                return False
        return False

    def call(self, func: Callable, *args, fallback: Callable = None, **kwargs) -> Any:
        """
        Execute a function with circuit breaker protection.

        Args:
            func: Function to call
            *args: Positional arguments
            fallback: Fallback function if circuit is open
            **kwargs: Keyword arguments

        Returns:
            Result of func or fallback

        Raises:
            CircuitBreakerOpen: If circuit is open and no fallback provided
        """
        if not self._can_execute():
            if fallback:
                logger.debug(f"Circuit breaker '{self.name}' open, using fallback")
                return fallback(*args, **kwargs)
            raise CircuitBreakerOpen(f"Circuit breaker '{self.name}' is open")

        try:
            result = func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as e:
            self._record_failure(e)
            if fallback:
                return fallback(*args, **kwargs)
            raise

    def __call__(self, func: Callable = None, fallback: Callable = None):
        """
        Decorator for wrapping functions with circuit breaker.

        Usage:
            @breaker
            def my_function():
                pass

            @breaker(fallback=my_fallback)
            def my_function():
                pass
        """
        def decorator(fn: Callable):
            @wraps(fn)
            def wrapper(*args, **kwargs):
                return self.call(fn, *args, fallback=fallback, **kwargs)
            return wrapper

        if func is not None:
            return decorator(func)
        return decorator

    def get_stats(self) -> Dict:
        """Get circuit breaker statistics"""
        with self._lock:
            return {
                'name': self.name,
                'state': self.state.value,
                'failure_count': self._failure_count,
                'success_count': self._success_count,
                'failure_threshold': self.failure_threshold,
                'recovery_timeout': self.recovery_timeout,
                'last_failure': self._last_failure_time.isoformat() if self._last_failure_time else None,
                'last_state_change': self._last_state_change.isoformat(),
                **self._stats
            }

    def reset(self):
        """Manually reset circuit breaker to closed state"""
        with self._lock:
            self._transition_to(CircuitState.CLOSED)
            self._failure_count = 0
            self._success_count = 0
            logger.info(f"Circuit breaker '{self.name}' manually reset")


class CircuitBreakerOpen(Exception):
    """Exception raised when circuit breaker is open"""
    pass


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers.
    Provides centralized access and monitoring.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._breakers: Dict[str, CircuitBreaker] = {}
        return cls._instance

    def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        recovery_timeout: int = 60
    ) -> CircuitBreaker:
        """Get existing circuit breaker or create new one"""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(
                name=name,
                failure_threshold=failure_threshold,
                success_threshold=success_threshold,
                recovery_timeout=recovery_timeout
            )
        return self._breakers[name]

    def get(self, name: str) -> Optional[CircuitBreaker]:
        """Get circuit breaker by name"""
        return self._breakers.get(name)

    def get_all_stats(self) -> Dict:
        """Get stats for all circuit breakers"""
        return {
            name: breaker.get_stats()
            for name, breaker in self._breakers.items()
        }

    def reset_all(self):
        """Reset all circuit breakers"""
        for breaker in self._breakers.values():
            breaker.reset()


# Global registry instance
circuit_registry = CircuitBreakerRegistry()


# Pre-configured circuit breakers for common services
def get_yfinance_breaker() -> CircuitBreaker:
    """Circuit breaker for Yahoo Finance API"""
    return circuit_registry.get_or_create(
        name="yfinance",
        failure_threshold=5,
        recovery_timeout=60
    )


def get_moroccan_api_breaker() -> CircuitBreaker:
    """Circuit breaker for Moroccan market APIs"""
    return circuit_registry.get_or_create(
        name="moroccan_api",
        failure_threshold=3,
        recovery_timeout=30
    )


def get_news_api_breaker() -> CircuitBreaker:
    """Circuit breaker for news APIs"""
    return circuit_registry.get_or_create(
        name="news_api",
        failure_threshold=5,
        recovery_timeout=120
    )


def get_calendar_api_breaker() -> CircuitBreaker:
    """Circuit breaker for calendar APIs"""
    return circuit_registry.get_or_create(
        name="calendar_api",
        failure_threshold=3,
        recovery_timeout=60
    )


def get_forex_api_breaker() -> CircuitBreaker:
    """Circuit breaker for forex APIs"""
    return circuit_registry.get_or_create(
        name="forex_api",
        failure_threshold=5,
        recovery_timeout=60
    )
