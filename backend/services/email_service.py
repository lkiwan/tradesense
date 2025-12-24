"""
Email Service for TradeSense
Supports SendGrid (primary) and SMTP (fallback) for sending emails.
Includes template rendering and queue support.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)

# Template environment
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates', 'emails')
_jinja_env = None


def get_template_env():
    """Get or create Jinja2 template environment"""
    global _jinja_env
    if _jinja_env is None:
        if os.path.exists(TEMPLATE_DIR):
            _jinja_env = Environment(
                loader=FileSystemLoader(TEMPLATE_DIR),
                autoescape=select_autoescape(['html', 'xml'])
            )
        else:
            logger.warning(f"Email templates directory not found: {TEMPLATE_DIR}")
            _jinja_env = None
    return _jinja_env


class EmailConfig:
    """Email configuration from environment or settings"""

    @staticmethod
    def get_sendgrid_config():
        return {
            'api_key': os.getenv('SENDGRID_API_KEY', ''),
            'from_email': os.getenv('SENDGRID_FROM_EMAIL', os.getenv('SMTP_FROM_EMAIL', 'noreply@tradesense.com')),
            'from_name': os.getenv('SENDGRID_FROM_NAME', os.getenv('SMTP_FROM_NAME', 'TradeSense')),
        }

    @staticmethod
    def get_smtp_config():
        try:
            from models import Settings
            return {
                'host': Settings.get_setting('smtp_host', os.getenv('SMTP_HOST', 'smtp.gmail.com')),
                'port': int(Settings.get_setting('smtp_port', os.getenv('SMTP_PORT', '587'))),
                'username': Settings.get_setting('smtp_username', os.getenv('SMTP_USERNAME', '')),
                'password': Settings.get_setting('smtp_password', os.getenv('SMTP_PASSWORD', '')),
                'from_email': Settings.get_setting('smtp_from_email', os.getenv('SMTP_FROM_EMAIL', 'noreply@tradesense.com')),
                'from_name': Settings.get_setting('smtp_from_name', os.getenv('SMTP_FROM_NAME', 'TradeSense'))
            }
        except Exception:
            return {
                'host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
                'port': int(os.getenv('SMTP_PORT', '587')),
                'username': os.getenv('SMTP_USERNAME', ''),
                'password': os.getenv('SMTP_PASSWORD', ''),
                'from_email': os.getenv('SMTP_FROM_EMAIL', 'noreply@tradesense.com'),
                'from_name': os.getenv('SMTP_FROM_NAME', 'TradeSense')
            }

    @staticmethod
    def is_sendgrid_configured():
        config = EmailConfig.get_sendgrid_config()
        return bool(config['api_key'])

    @staticmethod
    def is_smtp_configured():
        config = EmailConfig.get_smtp_config()
        return bool(config['username'] and config['password'])


class EmailService:
    """Main email service with SendGrid and SMTP support"""

    @staticmethod
    def send(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send email using SendGrid (primary) or SMTP (fallback).

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body content
            text_content: Plain text body (optional)
            template_data: Data for template rendering (optional)

        Returns:
            True if email sent successfully, False otherwise
        """
        # Try SendGrid first
        if EmailConfig.is_sendgrid_configured():
            result = EmailService._send_via_sendgrid(to_email, subject, html_content, text_content)
            if result:
                return True
            logger.warning("SendGrid failed, trying SMTP fallback")

        # Fallback to SMTP
        if EmailConfig.is_smtp_configured():
            return EmailService._send_via_smtp(to_email, subject, html_content, text_content)

        # No email provider configured
        logger.warning(f"No email provider configured. Would send to {to_email}: {subject}")
        return False

    @staticmethod
    def _send_via_sendgrid(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email via SendGrid API"""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content

            config = EmailConfig.get_sendgrid_config()

            message = Mail(
                from_email=Email(config['from_email'], config['from_name']),
                to_emails=To(to_email),
                subject=subject,
                html_content=html_content
            )

            if text_content:
                message.add_content(Content("text/plain", text_content))

            sg = SendGridAPIClient(config['api_key'])
            response = sg.send(message)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent via SendGrid to {to_email}: {subject}")
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return False

        except Exception as e:
            logger.error(f"SendGrid error sending to {to_email}: {e}")
            return False

    @staticmethod
    def _send_via_smtp(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email via SMTP"""
        config = EmailConfig.get_smtp_config()

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{config['from_name']} <{config['from_email']}>"
            msg['To'] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(config['host'], config['port']) as server:
                server.starttls()
                server.login(config['username'], config['password'])
                server.send_message(msg)

            logger.info(f"Email sent via SMTP to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"SMTP error sending to {to_email}: {e}")
            return False

    @staticmethod
    def send_template(
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any]
    ) -> bool:
        """
        Send email using a template.

        Args:
            to_email: Recipient email
            subject: Email subject
            template_name: Template filename (e.g., 'welcome.html')
            context: Template variables

        Returns:
            True if sent successfully
        """
        env = get_template_env()
        if env is None:
            logger.error(f"Template environment not available for {template_name}")
            # Fall back to inline template
            return False

        try:
            template = env.get_template(template_name)
            html_content = template.render(**context)

            # Try to get text version
            text_content = None
            text_template_name = template_name.replace('.html', '.txt')
            try:
                text_template = env.get_template(text_template_name)
                text_content = text_template.render(**context)
            except Exception:
                pass  # Text template is optional

            return EmailService.send(to_email, subject, html_content, text_content)

        except Exception as e:
            logger.error(f"Template error for {template_name}: {e}")
            return False

    # =========================================================================
    # Convenience Methods for Common Emails
    # =========================================================================

    @staticmethod
    def send_welcome_email(email: str, username: str) -> bool:
        """Send welcome email to new user"""
        subject = "Welcome to TradeSense!"
        context = {
            'username': username,
            'login_url': os.getenv('FRONTEND_URL', 'https://tradesense.com') + '/login',
            'year': datetime.utcnow().year
        }

        # Try template first
        if get_template_env():
            return EmailService.send_template(email, subject, 'welcome.html', context)

        # Fallback to inline HTML
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome to TradeSense!</h1>
            </div>
            <div style="padding: 30px;">
                <p>Hi <strong>{username}</strong>,</p>
                <p>Welcome to TradeSense - your AI-powered prop trading platform!</p>
                <p>You're now ready to start your trading journey. Here's what you can do:</p>
                <ul>
                    <li>Start a trading challenge</li>
                    <li>Get AI-powered market signals</li>
                    <li>Track your performance</li>
                    <li>Earn real profits when funded</li>
                </ul>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{context['login_url']}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        Start Trading
                    </a>
                </p>
                <p>Happy Trading!</p>
                <p>The TradeSense Team</p>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_verification_email(email: str, token: str) -> bool:
        """Send email verification link"""
        verify_url = f"{os.getenv('FRONTEND_URL', 'https://tradesense.com')}/verify-email?token={token}"
        subject = "Verify Your TradeSense Email"

        context = {
            'verify_url': verify_url,
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'verify_email.html', context)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3B82F6; padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">Verify Your Email</h1>
            </div>
            <div style="padding: 30px;">
                <p>Please click the button below to verify your email address:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{verify_url}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        Verify Email
                    </a>
                </p>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_password_reset_email(email: str, token: str) -> bool:
        """Send password reset email"""
        reset_url = f"{os.getenv('FRONTEND_URL', 'https://tradesense.com')}/reset-password?token={token}"
        subject = "Reset Your TradeSense Password"

        context = {
            'reset_url': reset_url,
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'password_reset.html', context)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #EF4444; padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">Reset Your Password</h1>
            </div>
            <div style="padding: 30px;">
                <p>You requested to reset your password. Click the button below:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </p>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_trade_notification(email: str, trade_data: Dict[str, Any]) -> bool:
        """Send trade execution notification"""
        action = trade_data.get('action', 'executed')
        symbol = trade_data.get('symbol', 'Unknown')
        subject = f"Trade {action.title()}: {symbol}"

        context = {
            'trade': trade_data,
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'trade_notification.html', context)

        profit_loss = trade_data.get('profit_loss', 0)
        pl_color = '#10B981' if profit_loss >= 0 else '#EF4444'

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3B82F6; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Trade {action.title()}</h1>
            </div>
            <div style="padding: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Symbol:</td><td style="text-align: right; font-weight: bold;">{symbol}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Type:</td><td style="text-align: right;">{trade_data.get('trade_type', 'N/A')}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Lot Size:</td><td style="text-align: right;">{trade_data.get('lot_size', 'N/A')}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Entry Price:</td><td style="text-align: right;">${trade_data.get('entry_price', 0):.2f}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Exit Price:</td><td style="text-align: right;">${trade_data.get('exit_price', 0):.2f}</td></tr>
                    <tr><td style="padding: 10px 0;">P/L:</td><td style="text-align: right; font-weight: bold; color: {pl_color};">${profit_loss:.2f}</td></tr>
                </table>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_payout_status_email(email: str, payout_data: Dict[str, Any]) -> bool:
        """Send payout status notification"""
        status = payout_data.get('status', 'updated')
        amount = payout_data.get('amount', 0)
        subject = f"Payout {status.title()}: ${amount:.2f}"

        context = {
            'payout': payout_data,
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'payout_status.html', context)

        status_color = '#10B981' if status == 'completed' else '#F59E0B' if status == 'pending' else '#EF4444'

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {status_color}; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Payout {status.title()}</h1>
            </div>
            <div style="padding: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Amount:</td><td style="text-align: right; font-weight: bold;">${amount:.2f}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Status:</td><td style="text-align: right; color: {status_color}; font-weight: bold;">{status.title()}</td></tr>
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Method:</td><td style="text-align: right;">{payout_data.get('method', 'N/A')}</td></tr>
                    <tr><td style="padding: 10px 0;">Date:</td><td style="text-align: right;">{datetime.utcnow().strftime('%B %d, %Y')}</td></tr>
                </table>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_challenge_update_email(email: str, challenge_data: Dict[str, Any]) -> bool:
        """Send challenge status update email"""
        status = challenge_data.get('status', 'updated')
        name = challenge_data.get('name', 'Challenge')
        subject = f"Challenge Update: {name} - {status.title()}"

        context = {
            'challenge': challenge_data,
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'challenge_update.html', context)

        status_colors = {
            'passed': '#10B981',
            'funded': '#8B5CF6',
            'failed': '#EF4444',
            'active': '#3B82F6'
        }
        color = status_colors.get(status, '#6B7280')

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {color}; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">{name}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Status: {status.title()}</p>
            </div>
            <div style="padding: 30px;">
                <p>Your challenge status has been updated to: <strong>{status.title()}</strong></p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'https://tradesense.com')}/dashboard"
                       style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        View Dashboard
                    </a>
                </p>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_security_alert_email(email: str, username: str, alert_data: Dict[str, Any]) -> bool:
        """Send security alert email (e.g., new device login)"""
        alert_type = alert_data.get('type', 'security_alert')
        subject = "TradeSense Security Alert: New Device Login"

        if alert_type == 'new_device_login':
            subject = "TradeSense Security Alert: New Device Login"
        elif alert_type == 'password_changed':
            subject = "TradeSense Security Alert: Password Changed"
        elif alert_type == 'suspicious_activity':
            subject = "TradeSense Security Alert: Suspicious Activity Detected"

        context = {
            'username': username,
            'alert': alert_data,
            'year': datetime.utcnow().year,
            'settings_url': f"{os.getenv('FRONTEND_URL', 'https://tradesense.com')}/settings"
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'security_alert.html', context)

        # Fallback inline HTML
        device = alert_data.get('device', 'Unknown device')
        ip_address = alert_data.get('ip_address', 'Unknown')
        location = alert_data.get('location', 'Unknown')
        time = alert_data.get('time', datetime.utcnow().isoformat())
        reason = alert_data.get('reason', 'New login detected')

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #F59E0B; padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">Security Alert</h1>
            </div>
            <div style="padding: 30px;">
                <p>Hi <strong>{username}</strong>,</p>
                <p>We detected a login to your TradeSense account from a new device.</p>

                <div style="background: #fef3c7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #6B7280;">Reason:</td><td style="text-align: right; font-weight: bold;">{reason}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">Device:</td><td style="text-align: right;">{device}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">IP Address:</td><td style="text-align: right;">{ip_address}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">Location:</td><td style="text-align: right;">{location}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6B7280;">Time:</td><td style="text-align: right;">{time}</td></tr>
                    </table>
                </div>

                <p>If this was you, you can ignore this email.</p>
                <p>If you didn't login from this device, please secure your account immediately:</p>

                <p style="text-align: center; margin: 30px 0;">
                    <a href="{context['settings_url']}" style="background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        Review Account Security
                    </a>
                </p>

                <p style="color: #6B7280; font-size: 14px;">
                    We recommend:
                    <ul>
                        <li>Enabling two-factor authentication (2FA)</li>
                        <li>Changing your password if you don't recognize this login</li>
                        <li>Reviewing your active sessions</li>
                    </ul>
                </p>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)

    @staticmethod
    def send_daily_summary(email: str, summary_data: Dict[str, Any]) -> bool:
        """Send daily trading summary"""
        subject = f"Daily Summary - {datetime.utcnow().strftime('%B %d, %Y')}"

        context = {
            'summary': summary_data,
            'date': datetime.utcnow().strftime('%B %d, %Y'),
            'year': datetime.utcnow().year
        }

        if get_template_env():
            return EmailService.send_template(email, subject, 'daily_summary.html', context)

        username = summary_data.get('username', 'Trader')
        trades_count = summary_data.get('trades_count', 0)
        total_pnl = summary_data.get('total_pnl', 0)
        pl_color = '#10B981' if total_pnl >= 0 else '#EF4444'

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Daily Summary</h1>
                <p style="color: rgba(255,255,255,0.9);">{context['date']}</p>
            </div>
            <div style="padding: 30px;">
                <p>Hi {username},</p>
                <p>Here's your trading summary for today:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;">Trades:</td><td style="text-align: right; font-weight: bold;">{trades_count}</td></tr>
                    <tr><td style="padding: 10px 0;">Total P/L:</td><td style="text-align: right; font-weight: bold; color: {pl_color};">${total_pnl:.2f}</td></tr>
                </table>
            </div>
        </body>
        </html>
        """
        return EmailService.send(email, subject, html_content)


# =========================================================================
# Legacy functions for backwards compatibility
# =========================================================================

def _send_email(to_email: str, subject: str, html_body: str, text_body: str = None) -> bool:
    """Legacy send email function"""
    return EmailService.send(to_email, subject, html_body, text_body)


def send_trial_started_email(to_email: str, username: str, selected_plan: str,
                              plan_price: float, trial_end_date: datetime) -> bool:
    """Email: Trial started notification (legacy)"""
    end_date_str = trial_end_date.strftime('%B %d, %Y at %H:%M UTC') if trial_end_date else '7 days from now'

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to TradeSense!</h1>
            <p style="color: rgba(255,255,255,0.9);">Your 7-day free trial has started</p>
        </div>
        <div style="padding: 30px;">
            <p>Hi <strong>{username}</strong>,</p>
            <p>Your <strong>7-day free trial</strong> is now active with <strong>$5,000</strong> virtual trading capital!</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Trial Details</h3>
                <table style="width: 100%;">
                    <tr><td>Selected Plan:</td><td style="text-align: right; font-weight: bold;">{selected_plan}</td></tr>
                    <tr><td>Trial Balance:</td><td style="text-align: right; font-weight: bold;">$5,000</td></tr>
                    <tr><td>Trial Ends:</td><td style="text-align: right; font-weight: bold;">{end_date_str}</td></tr>
                    <tr><td>After Trial:</td><td style="text-align: right; font-weight: bold; color: #3B82F6;">${plan_price:.2f}</td></tr>
                </table>
            </div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <strong>Important:</strong> After your trial ends, you'll be automatically charged ${plan_price:.2f} for the {selected_plan} plan.
            </div>
        </div>
    </body>
    </html>
    """
    return EmailService.send(to_email, "Your TradeSense Free Trial Has Started!", html_body)


def send_charge_success_email(to_email: str, username: str, plan_name: str, amount: float) -> bool:
    """Email: Charge successful notification (legacy)"""
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Successful!</h1>
        </div>
        <div style="padding: 30px;">
            <p>Hi <strong>{username}</strong>,</p>
            <p>Your trial has ended and you've been upgraded to the <strong>{plan_name}</strong> plan!</p>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr><td>Plan:</td><td style="text-align: right; font-weight: bold;">{plan_name}</td></tr>
                    <tr><td>Amount:</td><td style="text-align: right; font-weight: bold; color: #10B981;">${amount:.2f}</td></tr>
                    <tr><td>Date:</td><td style="text-align: right;">{datetime.utcnow().strftime('%B %d, %Y')}</td></tr>
                </table>
            </div>
            <p>Your new challenge is now active. Good luck!</p>
        </div>
    </body>
    </html>
    """
    return EmailService.send(to_email, f"Welcome to TradeSense {plan_name}!", html_body)


def send_charge_failed_email(to_email: str, username: str, plan_name: str, reason: str) -> bool:
    """Email: Charge failed notification (legacy)"""
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #EF4444; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Failed</h1>
        </div>
        <div style="padding: 30px;">
            <p>Hi <strong>{username}</strong>,</p>
            <p>Unfortunately, we couldn't charge your PayPal account for the <strong>{plan_name}</strong> plan.</p>
            <div style="background: #fef2f2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
                <strong>Reason:</strong> {reason}
            </div>
            <p>Your trial has expired. To continue trading, please purchase a challenge directly.</p>
        </div>
    </body>
    </html>
    """
    return EmailService.send(to_email, "TradeSense: Payment Failed - Trial Expired", html_body)
