"""
Notification Tasks for TradeSense
Handles all notification-related background tasks
"""
import logging
from celery import shared_task
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_push_notification(self, user_id: int, title: str, message: str, data: dict = None):
    """
    Send push notification to a user.

    Args:
        user_id: User ID
        title: Notification title
        message: Notification message
        data: Additional data payload
    """
    try:
        logger.info(f"Sending push notification to user {user_id}: {title}")

        # TODO: Integrate with Firebase Cloud Messaging or similar service
        # from services.push_notification_service import PushNotificationService
        # PushNotificationService.send(user_id, title, message, data)

        # For now, create in-app notification
        from app import create_app
        from models import db

        app = create_app()
        with app.app_context():
            # Create notification record in database
            # This would be replaced with actual push notification
            logger.info(f"Push notification queued for user {user_id}")

        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send push notification to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@shared_task(bind=True, max_retries=2)
def send_trade_alert(self, user_id: int, trade_data: dict):
    """
    Send real-time trade alert notification.

    Args:
        user_id: User ID
        trade_data: Trade details
    """
    try:
        symbol = trade_data.get('symbol', 'Unknown')
        action = trade_data.get('action', 'trade')
        profit_loss = trade_data.get('profit_loss', 0)

        title = f"Trade {action.title()}: {symbol}"
        message = f"Your {symbol} trade has been {action}."
        if profit_loss:
            message += f" P/L: ${profit_loss:.2f}"

        # Send push notification
        send_push_notification.delay(user_id, title, message, trade_data)

        # Also send via WebSocket if user is connected
        from app import create_app
        from services.websocket_service import socketio

        app = create_app()
        with app.app_context():
            socketio.emit('trade_alert', trade_data, room=f'user_{user_id}')

        logger.info(f"Trade alert sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send trade alert to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@shared_task(bind=True, max_retries=2)
def send_challenge_alert(self, user_id: int, challenge_data: dict):
    """
    Send challenge status alert notification.

    Args:
        user_id: User ID
        challenge_data: Challenge details
    """
    try:
        status = challenge_data.get('status', 'updated')
        challenge_name = challenge_data.get('name', 'Challenge')

        title = f"Challenge {status.title()}"
        message = f"Your {challenge_name} has been {status}."

        if status == 'passed':
            message = f"Congratulations! You've passed {challenge_name}!"
        elif status == 'failed':
            message = f"Unfortunately, {challenge_name} has ended. Don't give up!"
        elif status == 'funded':
            message = f"Amazing! You're now funded on {challenge_name}!"

        send_push_notification.delay(user_id, title, message, challenge_data)

        logger.info(f"Challenge alert sent to user {user_id}: {status}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send challenge alert to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@shared_task(bind=True, max_retries=2)
def send_payout_alert(self, user_id: int, payout_data: dict):
    """
    Send payout status alert notification.

    Args:
        user_id: User ID
        payout_data: Payout details
    """
    try:
        status = payout_data.get('status', 'updated')
        amount = payout_data.get('amount', 0)

        title = f"Payout {status.title()}"

        if status == 'completed':
            message = f"Your payout of ${amount:.2f} has been processed!"
        elif status == 'approved':
            message = f"Your payout request of ${amount:.2f} has been approved!"
        elif status == 'rejected':
            message = f"Your payout request has been rejected. Please contact support."
        else:
            message = f"Your payout status has been updated to: {status}"

        send_push_notification.delay(user_id, title, message, payout_data)

        logger.info(f"Payout alert sent to user {user_id}: {status}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send payout alert to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@shared_task
def send_broadcast_notification(title: str, message: str, user_ids: list = None):
    """
    Send broadcast notification to multiple users.

    Args:
        title: Notification title
        message: Notification message
        user_ids: Optional list of user IDs (None = all users)
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            if user_ids:
                users = User.query.filter(User.id.in_(user_ids)).all()
            else:
                users = User.query.filter_by(is_active=True).all()

            sent_count = 0
            for user in users:
                try:
                    send_push_notification.delay(user.id, title, message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to queue notification for user {user.id}: {e}")

            logger.info(f"Broadcast notification queued for {sent_count} users")
            return {'status': 'success', 'queued': sent_count}

    except Exception as e:
        logger.error(f"Failed to send broadcast notification: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def cleanup_old_notifications():
    """
    Clean up old notifications from the database.
    Scheduled to run weekly.
    """
    try:
        from app import create_app
        from models import db

        app = create_app()
        with app.app_context():
            # Delete notifications older than 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)

            # Assuming there's a Notification model
            # deleted_count = Notification.query.filter(
            #     Notification.created_at < cutoff_date,
            #     Notification.read == True
            # ).delete()
            # db.session.commit()

            deleted_count = 0  # Placeholder until Notification model exists
            logger.info(f"Cleaned up {deleted_count} old notifications")
            return {'status': 'success', 'deleted': deleted_count}

    except Exception as e:
        logger.error(f"Failed to clean up old notifications: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def send_login_alert(self, user_id: int, login_data: dict):
    """
    Send new device login alert.

    Args:
        user_id: User ID
        login_data: Login details (IP, device, location)
    """
    try:
        device = login_data.get('device', 'Unknown device')
        location = login_data.get('location', 'Unknown location')
        ip = login_data.get('ip', 'Unknown IP')

        title = "New Login Detected"
        message = f"New login from {device} at {location}"

        send_push_notification.delay(user_id, title, message, login_data)

        # Also send email for security
        from tasks.email_tasks import send_trade_notification_email
        # send_security_alert_email.delay(user_id, login_data)

        logger.info(f"Login alert sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send login alert to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@shared_task
def send_market_alert(symbol: str, alert_type: str, message: str, user_ids: list = None):
    """
    Send market alert to subscribed users.

    Args:
        symbol: Trading symbol
        alert_type: Type of alert (price_target, signal, news)
        message: Alert message
        user_ids: List of user IDs to notify (None = all with symbol in watchlist)
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            if user_ids:
                users = User.query.filter(User.id.in_(user_ids)).all()
            else:
                # Get all active users (in production, filter by watchlist)
                users = User.query.filter_by(is_active=True).limit(100).all()

            title = f"{symbol} Alert: {alert_type.replace('_', ' ').title()}"

            sent_count = 0
            for user in users:
                try:
                    send_push_notification.delay(user.id, title, message, {
                        'symbol': symbol,
                        'alert_type': alert_type
                    })
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to queue market alert for user {user.id}: {e}")

            logger.info(f"Market alert for {symbol} queued for {sent_count} users")
            return {'status': 'success', 'symbol': symbol, 'queued': sent_count}

    except Exception as e:
        logger.error(f"Failed to send market alert for {symbol}: {e}")
        return {'status': 'error', 'error': str(e)}
