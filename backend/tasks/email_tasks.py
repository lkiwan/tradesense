"""
Email Tasks for TradeSense
Handles all email-related background tasks
"""
import logging
from celery import shared_task
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_welcome_email(self, user_id: int, email: str, username: str):
    """
    Send welcome email to new user.

    Args:
        user_id: User ID
        email: User email address
        username: User's username
    """
    try:
        logger.info(f"Sending welcome email to {email}")
        # Import here to avoid circular imports
        from services.email_service import EmailService

        EmailService.send_welcome_email(email, username)
        logger.info(f"Welcome email sent successfully to {email}")
        return {'status': 'success', 'email': email}

    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_verification_email(self, user_id: int, email: str, token: str):
    """
    Send email verification link.

    Args:
        user_id: User ID
        email: User email address
        token: Verification token
    """
    try:
        logger.info(f"Sending verification email to {email}")
        from services.email_service import EmailService

        EmailService.send_verification_email(email, token)
        logger.info(f"Verification email sent to {email}")
        return {'status': 'success', 'email': email}

    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_password_reset_email(self, email: str, token: str):
    """
    Send password reset email.

    Args:
        email: User email address
        token: Reset token
    """
    try:
        logger.info(f"Sending password reset email to {email}")
        from services.email_service import EmailService

        EmailService.send_password_reset_email(email, token)
        logger.info(f"Password reset email sent to {email}")
        return {'status': 'success', 'email': email}

    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_trade_notification_email(self, user_id: int, trade_data: dict):
    """
    Send trade execution notification email.

    Args:
        user_id: User ID
        trade_data: Trade details
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                logger.warning(f"User {user_id} not found for trade notification")
                return {'status': 'skipped', 'reason': 'user_not_found'}

            from services.email_service import EmailService
            EmailService.send_trade_notification(user.email, trade_data)

        logger.info(f"Trade notification email sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send trade notification to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_payout_status_email(self, user_id: int, payout_data: dict):
    """
    Send payout status update email.

    Args:
        user_id: User ID
        payout_data: Payout details (status, amount, etc.)
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                logger.warning(f"User {user_id} not found for payout notification")
                return {'status': 'skipped', 'reason': 'user_not_found'}

            from services.email_service import EmailService
            EmailService.send_payout_status_email(user.email, payout_data)

        logger.info(f"Payout status email sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send payout status to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_challenge_update_email(self, user_id: int, challenge_data: dict):
    """
    Send challenge status update email.

    Args:
        user_id: User ID
        challenge_data: Challenge details (status, phase, etc.)
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                logger.warning(f"User {user_id} not found for challenge notification")
                return {'status': 'skipped', 'reason': 'user_not_found'}

            from services.email_service import EmailService
            EmailService.send_challenge_update_email(user.email, challenge_data)

        logger.info(f"Challenge update email sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send challenge update to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_security_alert_email(self, email: str, username: str, alert_data: dict):
    """
    Send security alert email (e.g., new device login).

    Args:
        email: User email address
        username: User's username
        alert_data: Alert details (type, device, ip_address, location, time)
    """
    try:
        logger.info(f"Sending security alert email to {email}")
        from services.email_service import EmailService

        EmailService.send_security_alert_email(email, username, alert_data)
        logger.info(f"Security alert email sent to {email}")
        return {'status': 'success', 'email': email}

    except Exception as e:
        logger.error(f"Failed to send security alert email to {email}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def send_daily_summary_emails():
    """
    Send daily summary emails to all active users.
    Scheduled to run daily at 8 AM.
    """
    try:
        from app import create_app
        from models import User, UserChallenge

        app = create_app()
        with app.app_context():
            # Get users with active challenges
            active_users = User.query.join(UserChallenge).filter(
                UserChallenge.status.in_(['active', 'evaluation', 'verification', 'funded'])
            ).distinct().all()

            sent_count = 0
            for user in active_users:
                try:
                    # Queue individual email tasks
                    send_user_daily_summary.delay(user.id)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to queue daily summary for user {user.id}: {e}")

            logger.info(f"Queued {sent_count} daily summary emails")
            return {'status': 'success', 'queued': sent_count}

    except Exception as e:
        logger.error(f"Failed to process daily summary emails: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def send_user_daily_summary(self, user_id: int):
    """
    Send daily summary to a specific user.

    Args:
        user_id: User ID
    """
    try:
        from app import create_app
        from models import User, UserChallenge, Trade
        from datetime import datetime, timedelta

        app = create_app()
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                return {'status': 'skipped', 'reason': 'user_not_found'}

            # Get user's active challenges
            challenges = UserChallenge.query.filter_by(
                user_id=user_id
            ).filter(
                UserChallenge.status.in_(['active', 'evaluation', 'verification', 'funded'])
            ).all()

            # Get yesterday's trades
            yesterday = datetime.utcnow() - timedelta(days=1)
            trades = Trade.query.filter(
                Trade.challenge_id.in_([c.id for c in challenges]),
                Trade.opened_at >= yesterday
            ).all()

            summary_data = {
                'username': user.username,
                'challenges': [c.to_dict() for c in challenges],
                'trades_count': len(trades),
                'total_pnl': sum(t.profit_loss or 0 for t in trades),
            }

            from services.email_service import EmailService
            EmailService.send_daily_summary(user.email, summary_data)

        logger.info(f"Daily summary sent to user {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except Exception as e:
        logger.error(f"Failed to send daily summary to user {user_id}: {e}")
        raise self.retry(exc=e, countdown=120)


@shared_task
def send_bulk_email(subject: str, template: str, recipient_ids: list):
    """
    Send bulk email to multiple users.

    Args:
        subject: Email subject
        template: Template name
        recipient_ids: List of user IDs
    """
    try:
        from app import create_app
        from models import User

        app = create_app()
        with app.app_context():
            users = User.query.filter(User.id.in_(recipient_ids)).all()

            sent_count = 0
            for user in users:
                try:
                    from services.email_service import EmailService
                    EmailService.send_template_email(user.email, subject, template)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send bulk email to {user.email}: {e}")

            logger.info(f"Sent {sent_count}/{len(recipient_ids)} bulk emails")
            return {'status': 'success', 'sent': sent_count, 'total': len(recipient_ids)}

    except Exception as e:
        logger.error(f"Failed to process bulk email: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def process_email_queue(batch_size: int = 50):
    """
    Process pending emails from the email queue.
    Scheduled to run every minute.

    Args:
        batch_size: Number of emails to process per batch
    """
    try:
        from app import create_app
        from models import db, EmailQueue
        from services.email_service import EmailService

        app = create_app()
        with app.app_context():
            # Get pending emails ready to send
            pending_emails = EmailQueue.get_pending(limit=batch_size)

            if not pending_emails:
                return {'status': 'success', 'processed': 0, 'message': 'No pending emails'}

            sent_count = 0
            failed_count = 0

            for email in pending_emails:
                try:
                    # Mark as processing
                    email.mark_processing()
                    db.session.commit()

                    # Send the email
                    if email.template_name:
                        # Use template
                        success = EmailService.send_template_email(
                            to_email=email.to_email,
                            subject=email.subject,
                            template_name=email.template_name,
                            template_data=email.template_data or {}
                        )
                    else:
                        # Use pre-rendered content
                        success = EmailService.send(
                            to_email=email.to_email,
                            subject=email.subject,
                            html_content=email.html_content,
                            text_content=email.text_content
                        )

                    if success:
                        email.mark_sent()
                        sent_count += 1
                    else:
                        email.mark_failed("Send returned False")
                        failed_count += 1

                    db.session.commit()

                except Exception as e:
                    logger.error(f"Failed to process email {email.id}: {e}")
                    email.mark_failed(str(e))
                    db.session.commit()
                    failed_count += 1

            logger.info(f"Email queue: sent={sent_count}, failed={failed_count}")
            return {
                'status': 'success',
                'processed': sent_count + failed_count,
                'sent': sent_count,
                'failed': failed_count
            }

    except Exception as e:
        logger.error(f"Failed to process email queue: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def cleanup_email_queue(days: int = 30):
    """
    Clean up old sent/failed emails from the queue.
    Scheduled to run weekly.

    Args:
        days: Delete emails older than this many days
    """
    try:
        from app import create_app
        from models import db, EmailQueue

        app = create_app()
        with app.app_context():
            deleted = EmailQueue.cleanup_old(days=days)
            db.session.commit()

            logger.info(f"Cleaned up {deleted} old emails from queue")
            return {'status': 'success', 'deleted': deleted}

    except Exception as e:
        logger.error(f"Failed to cleanup email queue: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=3)
def queue_email(self, to_email: str, subject: str, template_name: str = None,
                template_data: dict = None, html_content: str = None,
                email_type: str = None, user_id: int = None, priority: int = 5):
    """
    Add an email to the queue for async processing.

    Args:
        to_email: Recipient email
        subject: Email subject
        template_name: Template to use
        template_data: Template variables
        html_content: Pre-rendered HTML
        email_type: Type of email for tracking
        user_id: Associated user ID
        priority: 1-10 (1=highest)
    """
    try:
        from app import create_app
        from models import EmailQueue

        app = create_app()
        with app.app_context():
            email = EmailQueue.add_email(
                to_email=to_email,
                subject=subject,
                template_name=template_name,
                template_data=template_data,
                html_content=html_content,
                email_type=email_type,
                user_id=user_id,
                priority=priority
            )

            logger.info(f"Email queued: id={email.id}, to={to_email}, type={email_type}")
            return {'status': 'success', 'email_id': email.id}

    except Exception as e:
        logger.error(f"Failed to queue email to {to_email}: {e}")
        raise self.retry(exc=e, countdown=30)
