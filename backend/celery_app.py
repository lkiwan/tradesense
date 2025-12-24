"""
Celery Configuration for TradeSense
Background task processing with Redis as broker
"""
import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# Get Redis URL from environment
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Create Celery app
celery_app = Celery(
    'tradesense',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'tasks.email_tasks',
        'tasks.payout_tasks',
        'tasks.notification_tasks',
        'tasks.sync_tasks',
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task execution settings
    task_acks_late=True,  # Tasks acknowledged after completion
    task_reject_on_worker_lost=True,  # Re-queue if worker dies
    task_time_limit=300,  # 5 minute hard limit
    task_soft_time_limit=240,  # 4 minute soft limit (raises exception)

    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time for fair distribution
    worker_concurrency=4,  # Number of concurrent workers

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour

    # Retry settings
    task_default_retry_delay=60,  # 1 minute between retries
    task_max_retries=3,  # Maximum 3 retries

    # Beat scheduler (periodic tasks)
    beat_schedule={
        # Process email queue every minute
        'process-email-queue': {
            'task': 'tasks.email_tasks.process_email_queue',
            'schedule': crontab(minute='*'),  # Every minute
        },
        # Clean up old emails weekly
        'cleanup-email-queue': {
            'task': 'tasks.email_tasks.cleanup_email_queue',
            'schedule': crontab(day_of_week=0, hour=2, minute=0),  # Sunday 2 AM
        },
        # Process expired trials every hour
        'process-expired-trials': {
            'task': 'tasks.sync_tasks.process_expired_trials',
            'schedule': crontab(minute=0),  # Every hour
        },
        # Send daily summary emails at 8 AM
        'send-daily-summary': {
            'task': 'tasks.email_tasks.send_daily_summary_emails',
            'schedule': crontab(hour=8, minute=0),
        },
        # Check and process pending payouts every 4 hours
        'process-pending-payouts': {
            'task': 'tasks.payout_tasks.process_pending_payouts',
            'schedule': crontab(minute=0, hour='*/4'),
        },
        # Sync market data every 5 minutes during market hours
        'sync-market-data': {
            'task': 'tasks.sync_tasks.sync_market_data',
            'schedule': crontab(minute='*/5'),
        },
        # Clean up old notifications weekly
        'cleanup-old-notifications': {
            'task': 'tasks.notification_tasks.cleanup_old_notifications',
            'schedule': crontab(day_of_week=0, hour=3, minute=0),  # Sunday 3 AM
        },
        # Check challenge statuses every 30 minutes
        'check-challenge-statuses': {
            'task': 'tasks.sync_tasks.check_challenge_statuses',
            'schedule': crontab(minute='*/30'),
        },
    },

    # Task routes (optional - for task prioritization)
    task_routes={
        'tasks.email_tasks.*': {'queue': 'emails'},
        'tasks.payout_tasks.*': {'queue': 'payouts'},
        'tasks.notification_tasks.*': {'queue': 'notifications'},
        'tasks.sync_tasks.*': {'queue': 'sync'},
    },
)


def make_celery(app):
    """
    Create a Celery app that integrates with Flask app context.
    Use this when you need database access in tasks.
    """
    celery = Celery(
        app.import_name,
        broker=app.config.get('REDIS_URL', REDIS_URL),
        backend=app.config.get('REDIS_URL', REDIS_URL),
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        """Task that runs within Flask app context"""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# For running celery worker:
# celery -A celery_app worker --loglevel=info
#
# For running celery beat (scheduler):
# celery -A celery_app beat --loglevel=info
#
# For running both (development):
# celery -A celery_app worker --beat --loglevel=info
