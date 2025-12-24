@echo off
REM Start Celery Worker only (for production)

echo Starting Celery Worker...
echo.

set FLASK_ENV=production

celery -A celery_app worker --loglevel=info --pool=solo --concurrency=4
