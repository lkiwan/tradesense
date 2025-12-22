import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'tradesense-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS
    CORS_HEADERS = 'Content-Type'

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
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///tradesense.db')


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/tradesense')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
