"""
Email Service for Trial Notifications
Minimal emails: trial start and charge success/failure only
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def _get_smtp_config():
    """Get SMTP configuration from settings or environment"""
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


def _send_email(to_email: str, subject: str, html_body: str, text_body: str = None) -> bool:
    """Send email via SMTP"""
    config = _get_smtp_config()

    if not config['username'] or not config['password']:
        print(f"SMTP not configured, skipping email to {to_email}")
        print(f"Subject: {subject}")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{config['from_name']} <{config['from_email']}>"
        msg['To'] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(config['host'], config['port']) as server:
            server.starttls()
            server.login(config['username'], config['password'])
            server.send_message(msg)

        print(f"Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False


def send_trial_started_email(to_email: str, username: str, selected_plan: str,
                              plan_price: float, trial_end_date: datetime) -> bool:
    """
    Email 1: Trial started notification

    Sent when user successfully activates their trial with PayPal billing agreement.
    """
    subject = "Your TradeSense Free Trial Has Started!"

    # Format the end date
    end_date_str = trial_end_date.strftime('%B %d, %Y at %H:%M UTC') if trial_end_date else '7 days from now'

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                    Welcome to TradeSense!
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                    Your 7-day free trial has started
                </p>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Hi <strong>{username}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    Your <strong>7-day free trial</strong> is now active with <strong>$5,000</strong> virtual trading capital!
                </p>

                <!-- Trial Details Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 25px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Trial Details</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Selected Plan:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">{selected_plan}</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Trial Balance:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">$5,000</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Trial Ends:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">{end_date_str}</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">After Trial:</td>
                                    <td style="color: #3B82F6; font-weight: 600; text-align: right;">${plan_price:.2f} USD</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Important Notice -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>Important:</strong> After your trial ends, you'll be automatically charged <strong>${plan_price:.2f}</strong> for the {selected_plan} plan via PayPal.
                        You can cancel anytime before the trial ends to avoid charges.
                    </p>
                </div>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center; padding: 20px 0;">
                            <a href="https://tradesense.com/dashboard"
                               style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                                      color: #ffffff; text-decoration: none; padding: 16px 40px;
                                      border-radius: 10px; font-weight: 600; font-size: 16px;">
                                Start Trading Now
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    Questions? Reply to this email or contact our support team.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    TradeSense - AI-Powered Trading Platform
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    text_body = f"""
Welcome to TradeSense!

Hi {username},

Your 7-day free trial is now active with $5,000 virtual trading capital!

Trial Details:
- Selected Plan: {selected_plan}
- Trial Balance: $5,000
- Trial Ends: {end_date_str}
- After Trial: ${plan_price:.2f} USD

Important: After your trial ends, you'll be automatically charged ${plan_price:.2f} for the {selected_plan} plan via PayPal. You can cancel anytime before the trial ends to avoid charges.

Start trading: https://tradesense.com/dashboard

Best regards,
TradeSense Team
"""

    return _send_email(to_email, subject, html_body, text_body)


def send_charge_success_email(to_email: str, username: str, plan_name: str, amount: float) -> bool:
    """
    Email 2: Charge successful notification

    Sent when the auto-charge after trial succeeds.
    """
    subject = f"Welcome to TradeSense {plan_name}!"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 40px 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px auto; line-height: 60px;">
                    <span style="font-size: 30px;">&#10003;</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                    Payment Successful!
                </h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Hi <strong>{username}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    Your trial has ended and you've been successfully upgraded to the <strong>{plan_name}</strong> plan!
                </p>

                <!-- Payment Details Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 25px;">
                            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">Payment Details</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Plan:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">{plan_name}</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Amount Charged:</td>
                                    <td style="color: #10B981; font-weight: 600; text-align: right;">${amount:.2f} USD</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Payment Method:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">PayPal</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; padding: 8px 0;">Date:</td>
                                    <td style="color: #1f2937; font-weight: 600; text-align: right;">{datetime.utcnow().strftime('%B %d, %Y')}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    Your new challenge is now active with full trading capital. Good luck and trade wisely!
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center; padding: 20px 0;">
                            <a href="https://tradesense.com/dashboard"
                               style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669);
                                      color: #ffffff; text-decoration: none; padding: 16px 40px;
                                      border-radius: 10px; font-weight: 600; font-size: 16px;">
                                Go to Dashboard
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    Thank you for choosing TradeSense!
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    TradeSense - AI-Powered Trading Platform
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    text_body = f"""
Payment Successful!

Hi {username},

Your trial has ended and you've been successfully upgraded to the {plan_name} plan!

Payment Details:
- Plan: {plan_name}
- Amount Charged: ${amount:.2f} USD
- Payment Method: PayPal
- Date: {datetime.utcnow().strftime('%B %d, %Y')}

Your new challenge is now active with full trading capital. Good luck!

Go to Dashboard: https://tradesense.com/dashboard

Best regards,
TradeSense Team
"""

    return _send_email(to_email, subject, html_body, text_body)


def send_charge_failed_email(to_email: str, username: str, plan_name: str, reason: str) -> bool:
    """
    Email 3: Charge failed notification

    Sent when the auto-charge after trial fails.
    """
    subject = "TradeSense: Payment Failed - Trial Expired"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background-color: #EF4444; padding: 40px 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px auto; line-height: 60px;">
                    <span style="font-size: 30px; color: #ffffff;">!</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                    Payment Failed
                </h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Hi <strong>{username}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    Unfortunately, we couldn't charge your PayPal account for the <strong>{plan_name}</strong> plan.
                </p>

                <!-- Error Box -->
                <div style="background-color: #fef2f2; border-left: 4px solid #EF4444; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                    <p style="color: #991b1b; margin: 0; font-size: 14px;">
                        <strong>Reason:</strong> {reason}
                    </p>
                </div>

                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Your trial has expired and trading access has been suspended.
                </p>

                <p style="color: #374151; font-size: 16px; margin: 0 0 30px 0;">
                    To continue trading with TradeSense, please purchase a challenge directly:
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center; padding: 20px 0;">
                            <a href="https://tradesense.com/pricing"
                               style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                                      color: #ffffff; text-decoration: none; padding: 16px 40px;
                                      border-radius: 10px; font-weight: 600; font-size: 16px;">
                                View Plans
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                    Need help? Reply to this email or contact our support team.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    TradeSense - AI-Powered Trading Platform
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    text_body = f"""
Payment Failed

Hi {username},

Unfortunately, we couldn't charge your PayPal account for the {plan_name} plan.

Reason: {reason}

Your trial has expired and trading access has been suspended.

To continue trading, please purchase a challenge directly:
https://tradesense.com/pricing

Best regards,
TradeSense Team
"""

    return _send_email(to_email, subject, html_body, text_body)
