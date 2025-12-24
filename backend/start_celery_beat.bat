@echo off
REM Start Celery Beat Scheduler only (for production)

echo Starting Celery Beat Scheduler...
echo.

set FLASK_ENV=production

celery -A celery_app beat --loglevel=info
