"""
Middleware modules for TradeSense
"""
from .email_verification import email_verified_required, email_verification_optional
from .rate_limiter import (
    limiter,
    get_rate_limit_key,
    rate_limit_exceeded_handler,
    rate_limit_login,
    rate_limit_register,
    rate_limit_password_reset,
    rate_limit_trade,
    rate_limit_api,
    RateLimitTracker,
    init_rate_limiter
)

__all__ = [
    'email_verified_required',
    'email_verification_optional',
    'limiter',
    'get_rate_limit_key',
    'rate_limit_exceeded_handler',
    'rate_limit_login',
    'rate_limit_register',
    'rate_limit_password_reset',
    'rate_limit_trade',
    'rate_limit_api',
    'RateLimitTracker',
    'init_rate_limiter'
]
