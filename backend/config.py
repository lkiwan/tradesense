import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def get_database_uri():
    """
    Get database URI based on environment.
    Supports both SQLite (development) and PostgreSQL (production).
    """
    database_url = os.getenv('DATABASE_URL')

    if database_url:
        # Handle Heroku-style postgres:// URLs (convert to postgresql://)
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        return database_url

    # Default to SQLite for development
    return 'sqlite:///tradesense.db'


def is_postgresql():
    """Check if we're using PostgreSQL"""
    db_uri = get_database_uri()
    return db_uri.startswith('postgresql://') or db_uri.startswith('postgres://')


def get_engine_options():
    """
    Get SQLAlchemy engine options based on database type.
    PostgreSQL requires connection pooling settings.
    """
    if is_postgresql():
        return {
            'pool_pre_ping': True,      # Verify connections before use
            'pool_recycle': 300,        # Recycle connections after 5 minutes
            'pool_size': 10,            # Number of connections to keep open
            'max_overflow': 20,         # Max additional connections beyond pool_size
            'pool_timeout': 30,         # Seconds to wait for available connection
            'connect_args': {
                'connect_timeout': 10,  # Connection timeout in seconds
                'application_name': 'TradeSense',  # Identify app in pg_stat_activity
            }
        }
    else:
        # SQLite options
        return {
            'pool_pre_ping': True,
        }


def get_read_replica_uri():
    """
    Get read replica URI for read-heavy operations.
    Falls back to primary database if no replica is configured.

    Usage in production:
    - Set READ_REPLICA_URL environment variable
    - Configure PostgreSQL streaming replication
    - Use for SELECT queries that can tolerate slight lag
    """
    replica_url = os.getenv('READ_REPLICA_URL')
    if replica_url:
        # Handle Heroku-style postgres:// URLs
        if replica_url.startswith('postgres://'):
            replica_url = replica_url.replace('postgres://', 'postgresql://', 1)
        return replica_url
    # Fall back to primary database
    return get_database_uri()


class ReadReplicaConfig:
    """
    Configuration for read replica support.

    Setup Instructions:
    1. Set up PostgreSQL streaming replication
    2. Configure READ_REPLICA_URL in environment
    3. Use read_session for read-heavy queries

    Example usage in routes:
        from config import ReadReplicaConfig
        # For read operations (reports, analytics)
        replica_uri = ReadReplicaConfig.REPLICA_URI
    """
    REPLICA_URI = get_read_replica_uri()
    REPLICA_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 5,             # Smaller pool for reads
        'max_overflow': 10,
        'pool_timeout': 30,
        'connect_args': {
            'connect_timeout': 10,
            'application_name': 'TradeSense-ReadReplica',
        }
    }

    @classmethod
    def is_replica_configured(cls):
        """Check if a separate read replica is configured"""
        return os.getenv('READ_REPLICA_URL') is not None


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'tradesense-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Database
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = get_engine_options()

    # Redis Cache Configuration
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes default
    CACHE_KEY_PREFIX = 'tradesense_'

    # Rate Limiting Configuration
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = '100/minute'
    RATELIMIT_HEADERS_ENABLED = True

    # CORS
    CORS_HEADERS = 'Content-Type'

    # Frontend URL (for redirects)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    # File Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

    # Gemini AI
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

    # PayPal
    PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', '')
    PAYPAL_CLIENT_SECRET = os.getenv('PAYPAL_CLIENT_SECRET', '')
    PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox')  # sandbox or live

    # Challenge Rules (Legacy - for backwards compatibility)
    MAX_DAILY_LOSS = 0.05  # 5%
    MAX_TOTAL_LOSS = 0.10  # 10%
    PROFIT_TARGET = 0.10   # 10%

    # Phase-specific rules (FTMO style)
    PHASE_RULES = {
        'trial': {
            'profit_target': 0.10,  # 10% to pass
            'max_loss': 0.10,       # 10% total loss limit
            'daily_loss': 0.05      # 5% daily loss limit
        },
        'evaluation': {
            'profit_target': 0.10,  # Phase 1: 10% target
            'max_loss': 0.10,
            'daily_loss': 0.05
        },
        'verification': {
            'profit_target': 0.05,  # Phase 2: 5% target (easier)
            'max_loss': 0.10,
            'daily_loss': 0.05
        },
        'funded': {
            'profit_target': None,  # No target, just trade
            'max_loss': 0.10,       # Still have loss limits
            'daily_loss': 0.05
        }
    }

    # Profit Split for Funded Accounts
    PROFIT_SPLIT_TRADER = 0.80  # 80% to trader
    PROFIT_SPLIT_PLATFORM = 0.20  # 20% to platform

    # Pricing Plans (in USD)
    PLANS = {
        'trial': {
            'price': 0,
            'initial_balance': 5000,
            'name': 'Free Trial',
            'description': '7-day free trial',
            'is_trial': True,
            'trial_days': 7
        },
        'starter': {
            'price': 200,
            'initial_balance': 5000,
            'name': 'Starter',
            'description': 'Ideal for beginners'
        },
        'pro': {
            'price': 500,
            'initial_balance': 25000,
            'name': 'Pro',
            'description': 'For intermediate traders'
        },
        'elite': {
            'price': 1000,
            'initial_balance': 100000,
            'name': 'Elite',
            'description': 'For advanced traders'
        }
    }


class DevelopmentConfig(Config):
    """Development configuration - can use SQLite or PostgreSQL based on DATABASE_URL"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration - uses PostgreSQL with stricter settings"""
    DEBUG = False
    TESTING = False

    # Override with production-optimized pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 20,            # More connections for production
        'max_overflow': 40,         # More overflow for traffic spikes
        'pool_timeout': 30,
        'connect_args': {
            'connect_timeout': 10,
            'application_name': 'TradeSense-Production',
        }
    }


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True

    # Use DATABASE_URL if provided (CI uses PostgreSQL), otherwise SQLite in-memory
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///:memory:')

    # Adjust engine options based on database type
    @property
    def _is_sqlite(self):
        return self.SQLALCHEMY_DATABASE_URI.startswith('sqlite')

    # Override with database-appropriate settings
    SQLALCHEMY_ENGINE_OPTIONS = get_engine_options()


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
