"""
Push Notification Service
Handles sending push notifications via Firebase Cloud Messaging and Web Push API.
"""
import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

# Try to import Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK not installed. Push notifications will be limited.")

# Try to import pywebpush for Web Push API
try:
    from pywebpush import webpush, WebPushException
    WEBPUSH_AVAILABLE = True
except ImportError:
    WEBPUSH_AVAILABLE = False
    logger.warning("pywebpush not installed. Web Push notifications will not work.")


class PushNotificationService:
    """Service for sending push notifications"""

    _firebase_initialized = False

    @classmethod
    def initialize_firebase(cls):
        """Initialize Firebase Admin SDK"""
        if cls._firebase_initialized:
            return True

        if not FIREBASE_AVAILABLE:
            logger.warning("Firebase Admin SDK not available")
            return False

        try:
            # Try to get credentials from environment or file
            cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')

            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            elif cred_json:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
            else:
                logger.warning("No Firebase credentials found")
                return False

            firebase_admin.initialize_app(cred)
            cls._firebase_initialized = True
            logger.info("Firebase Admin SDK initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            return False

    @staticmethod
    def send_to_device(device_token: str, title: str, body: str,
                       data: Optional[Dict] = None, image_url: Optional[str] = None) -> bool:
        """
        Send push notification to a single device via FCM.

        Args:
            device_token: FCM device token
            title: Notification title
            body: Notification body
            data: Additional data payload
            image_url: URL of image to show in notification

        Returns:
            bool: True if sent successfully
        """
        if not FIREBASE_AVAILABLE or not PushNotificationService._firebase_initialized:
            logger.warning("Firebase not available, cannot send push")
            return False

        try:
            # Build notification
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url
            )

            # Build Android config
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='notification_icon',
                    color='#4F46E5',
                    click_action='FLUTTER_NOTIFICATION_CLICK'
                )
            )

            # Build Web config
            webpush_config = messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/icon-192x192.png',
                    badge='/badge-72x72.png'
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link='/'
                )
            )

            # Build message
            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=device_token,
                android=android_config,
                webpush=webpush_config
            )

            # Send message
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
            return True

        except messaging.UnregisteredError:
            logger.warning(f"Device token is no longer valid: {device_token[:20]}...")
            return False
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False

    @staticmethod
    def send_to_multiple_devices(device_tokens: List[str], title: str, body: str,
                                  data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Send push notification to multiple devices.

        Returns:
            Dict with success_count, failure_count, and failed_tokens
        """
        if not FIREBASE_AVAILABLE or not PushNotificationService._firebase_initialized:
            return {'success_count': 0, 'failure_count': len(device_tokens), 'failed_tokens': device_tokens}

        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=device_tokens
            )

            response = messaging.send_multicast(message)

            failed_tokens = []
            if response.failure_count > 0:
                for idx, send_response in enumerate(response.responses):
                    if not send_response.success:
                        failed_tokens.append(device_tokens[idx])

            return {
                'success_count': response.success_count,
                'failure_count': response.failure_count,
                'failed_tokens': failed_tokens
            }

        except Exception as e:
            logger.error(f"Error sending multicast: {e}")
            return {'success_count': 0, 'failure_count': len(device_tokens), 'failed_tokens': device_tokens}

    @staticmethod
    def send_web_push(subscription: Dict, title: str, body: str,
                      data: Optional[Dict] = None, icon: str = '/icon-192x192.png') -> bool:
        """
        Send Web Push notification using VAPID.

        Args:
            subscription: Web Push subscription object with endpoint, keys
            title: Notification title
            body: Notification body
            data: Additional data
            icon: Icon URL

        Returns:
            bool: True if sent successfully
        """
        if not WEBPUSH_AVAILABLE:
            logger.warning("pywebpush not available")
            return False

        vapid_private_key = os.getenv('VAPID_PRIVATE_KEY')
        vapid_claims = {
            'sub': os.getenv('VAPID_SUBJECT', 'mailto:admin@tradesense.com')
        }

        if not vapid_private_key:
            logger.warning("VAPID_PRIVATE_KEY not configured")
            return False

        try:
            payload = json.dumps({
                'title': title,
                'body': body,
                'icon': icon,
                'badge': '/badge-72x72.png',
                'data': data or {},
                'timestamp': datetime.utcnow().isoformat()
            })

            webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims
            )

            logger.info(f"Web push sent successfully")
            return True

        except WebPushException as e:
            logger.error(f"Web push failed: {e}")
            if e.response and e.response.status_code == 410:
                # Subscription expired/invalid
                return False
            return False
        except Exception as e:
            logger.error(f"Error sending web push: {e}")
            return False

    @staticmethod
    def send_to_user(user_id: int, notification_type: str, title: str, body: str,
                     data: Optional[Dict] = None, save_log: bool = True) -> Dict[str, Any]:
        """
        Send push notification to all devices of a user.

        Args:
            user_id: User ID
            notification_type: Type of notification for filtering
            title: Notification title
            body: Notification body
            data: Additional data
            save_log: Whether to save notification log

        Returns:
            Dict with results
        """
        from models import db
        from models.push_device import (
            PushDevice, NotificationPreference, NotificationLog,
            get_user_devices, get_or_create_preferences
        )

        # Check user preferences
        prefs = get_or_create_preferences(user_id)
        if not prefs.should_send_push(notification_type):
            return {'sent': False, 'reason': 'disabled_by_user'}

        # Get active devices
        devices = get_user_devices(user_id, active_only=True)
        if not devices:
            return {'sent': False, 'reason': 'no_devices'}

        results = {
            'total_devices': len(devices),
            'success_count': 0,
            'failure_count': 0,
            'failed_devices': []
        }

        # Add notification type to data
        notification_data = data or {}
        notification_data['type'] = notification_type
        notification_data['timestamp'] = datetime.utcnow().isoformat()

        for device in devices:
            success = False

            if device.platform == 'web' and device.endpoint:
                # Web Push
                subscription = {
                    'endpoint': device.endpoint,
                    'keys': {
                        'p256dh': device.p256dh_key,
                        'auth': device.auth_key
                    }
                }
                success = PushNotificationService.send_web_push(
                    subscription, title, body, notification_data
                )
            else:
                # FCM
                success = PushNotificationService.send_to_device(
                    device.device_token, title, body, notification_data
                )

            if success:
                results['success_count'] += 1
                device.last_used_at = datetime.utcnow()
                device.failed_attempts = 0
            else:
                results['failure_count'] += 1
                results['failed_devices'].append(device.id)
                device.failed_attempts += 1

                # Deactivate device after too many failures
                if device.failed_attempts >= 5:
                    device.is_active = False

            # Save notification log
            if save_log:
                log = NotificationLog(
                    user_id=user_id,
                    device_id=device.id,
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    data=notification_data,
                    status='sent' if success else 'failed',
                    sent_at=datetime.utcnow() if success else None
                )
                db.session.add(log)

        db.session.commit()

        results['sent'] = results['success_count'] > 0
        return results

    @staticmethod
    def send_to_topic(topic: str, title: str, body: str, data: Optional[Dict] = None) -> bool:
        """
        Send notification to a topic (all subscribers).

        Args:
            topic: Topic name
            title: Notification title
            body: Notification body
            data: Additional data

        Returns:
            bool: True if sent successfully
        """
        if not FIREBASE_AVAILABLE or not PushNotificationService._firebase_initialized:
            return False

        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                topic=topic
            )

            response = messaging.send(message)
            logger.info(f"Topic message sent: {response}")
            return True

        except Exception as e:
            logger.error(f"Error sending topic message: {e}")
            return False


# Notification helper functions for common scenarios
def notify_trade_executed(user_id: int, symbol: str, direction: str, lot_size: float):
    """Send notification when a trade is executed"""
    title = f"Trade Executed: {symbol}"
    body = f"{direction.upper()} {lot_size} lots of {symbol}"
    data = {
        'symbol': symbol,
        'direction': direction,
        'lot_size': str(lot_size),
        'action': 'view_trade'
    }
    return PushNotificationService.send_to_user(
        user_id, 'trade_executed', title, body, data
    )


def notify_trade_closed(user_id: int, symbol: str, profit: float):
    """Send notification when a trade is closed"""
    profit_str = f"+${profit:.2f}" if profit >= 0 else f"-${abs(profit):.2f}"
    title = f"Trade Closed: {symbol}"
    body = f"P/L: {profit_str}"
    data = {
        'symbol': symbol,
        'profit': str(profit),
        'action': 'view_history'
    }
    return PushNotificationService.send_to_user(
        user_id, 'trade_closed', title, body, data
    )


def notify_challenge_update(user_id: int, challenge_name: str, phase: str, message: str):
    """Send notification for challenge updates"""
    title = f"Challenge Update: {challenge_name}"
    body = message
    data = {
        'phase': phase,
        'action': 'view_challenge'
    }
    return PushNotificationService.send_to_user(
        user_id, 'challenge_update', title, body, data
    )


def notify_challenge_passed(user_id: int, challenge_name: str, phase: str):
    """Send notification when user passes a challenge phase"""
    title = "Congratulations! 🎉"
    body = f"You passed {phase} of {challenge_name}!"
    data = {
        'phase': phase,
        'action': 'view_challenge'
    }
    return PushNotificationService.send_to_user(
        user_id, 'challenge_passed', title, body, data
    )


def notify_payout_status(user_id: int, status: str, amount: float):
    """Send notification for payout status updates"""
    if status == 'approved':
        title = "Payout Approved! 💰"
        body = f"Your payout of ${amount:.2f} has been approved"
    elif status == 'rejected':
        title = "Payout Update"
        body = f"Your payout request requires attention"
    else:
        title = "Payout Processing"
        body = f"Your payout of ${amount:.2f} is being processed"

    data = {
        'status': status,
        'amount': str(amount),
        'action': 'view_payout'
    }
    return PushNotificationService.send_to_user(
        user_id, f'payout_{status}', title, body, data
    )


def notify_new_follower(user_id: int, follower_name: str):
    """Send notification when someone follows the user"""
    title = "New Follower"
    body = f"{follower_name} started following you"
    data = {
        'action': 'view_followers'
    }
    return PushNotificationService.send_to_user(
        user_id, 'new_follower', title, body, data
    )


def notify_copy_trade(user_id: int, copier_name: str, symbol: str):
    """Send notification when someone copies a trade"""
    title = "Trade Copied"
    body = f"{copier_name} copied your {symbol} trade"
    data = {
        'symbol': symbol,
        'action': 'view_copiers'
    }
    return PushNotificationService.send_to_user(
        user_id, 'copy_trade', title, body, data
    )


def notify_idea_comment(user_id: int, commenter_name: str, idea_title: str):
    """Send notification when someone comments on user's idea"""
    title = "New Comment"
    body = f"{commenter_name} commented on '{idea_title[:30]}...'"
    data = {
        'action': 'view_idea'
    }
    return PushNotificationService.send_to_user(
        user_id, 'new_idea_comment', title, body, data
    )


def notify_security_alert(user_id: int, message: str):
    """Send security alert notification"""
    title = "Security Alert ⚠️"
    body = message
    data = {
        'action': 'view_security'
    }
    return PushNotificationService.send_to_user(
        user_id, 'security_alert', title, body, data
    )
