@echo off
REM Start Celery Worker and Beat Scheduler for TradeSense

echo Starting Celery Worker with Beat Scheduler...
echo.

REM Set environment variables
set FLASK_ENV=development

REM Start Celery with both worker and beat in one process (development)
celery -A celery_app worker --beat --loglevel=info --pool=solo

REM Note: In production, run worker and beat separately:
REM celery -A celery_app worker --loglevel=info --concurrency=4
REM celery -A celery_app beat --loglevel=info
