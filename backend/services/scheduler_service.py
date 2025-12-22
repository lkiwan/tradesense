"""
APScheduler Service for Background Jobs

Handles:
- Trial expiration checking
- Auto-charging expired trials via PayPal billing agreements
- Challenge status updates
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from decimal import Decimal
import logging

# Configure logging
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.INFO)

# Global scheduler instance
scheduler = BackgroundScheduler()
_app = None


def init_scheduler(app):
    """
    Initialize and start the scheduler with Flask app context.

    Args:
        app: Flask application instance
    """
    global _app
    _app = app

    # Add job to process expired trials every hour
    scheduler.add_job(
        func=process_expired_trials,
        trigger=IntervalTrigger(hours=1),
        id='process_expired_trials',
        name='Process expired trials and charge users',
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace period
    )

    # Start scheduler if not already running
    if not scheduler.running:
        scheduler.start()
        print("APScheduler started - Trial auto-charge job running every hour")

    return scheduler


def shutdown_scheduler():
    """Shutdown the scheduler gracefully"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("APScheduler shutdown")


def process_expired_trials():
    """
    Main scheduled job: Process all expired trials.

    This job runs every hour and:
    1. Finds all trials that have expired (status='trial', trial_expires_at <= now)
    2. For each expired trial:
       - Attempts to charge the PayPal billing agreement
       - On success: Creates paid challenge, updates subscription
       - On failure: Immediately expires trial (no retries per requirement)
    3. Sends appropriate email notifications
    """
    global _app

    if not _app:
        print("Scheduler: No app context available")
        return

    with _app.app_context():
        from models import db, Subscription, UserChallenge, Payment, User
        from services.payment_gateway import charge_billing_agreement
        from services.email_service import send_charge_success_email, send_charge_failed_email
        from flask import current_app

        now = datetime.utcnow()

        # Find expired trials that haven't been processed yet
        expired_trials = Subscription.query.filter(
            Subscription.status == 'trial',
            Subscription.trial_expires_at <= now,
            Subscription.paypal_agreement_id.isnot(None)
        ).all()

        if not expired_trials:
            print(f"Scheduler [{now}]: No expired trials to process")
            return

        print(f"Scheduler [{now}]: Processing {len(expired_trials)} expired trials...")

        for subscription in expired_trials:
            try:
                user = User.query.get(subscription.user_id)
                if not user:
                    print(f"Scheduler: User {subscription.user_id} not found, skipping")
                    continue

                # Get plan details
                plans = current_app.config['PLANS']
                plan = plans.get(subscription.selected_plan)

                if not plan:
                    print(f"Scheduler: Plan {subscription.selected_plan} not found, skipping")
                    subscription.mark_failed('Invalid plan configuration')
                    db.session.commit()
                    continue

                amount = plan['price']
                plan_name = plan['name']

                print(f"Scheduler: Attempting to charge user {user.email} ${amount} for {plan_name}")

                # Attempt to charge the billing agreement
                result = charge_billing_agreement(
                    agreement_id=subscription.paypal_agreement_id,
                    amount=amount,
                    description=f"TradeSense {plan_name} Challenge - Post-Trial Charge"
                )

                if result and result.get('success'):
                    # SUCCESS: Create paid challenge
                    print(f"Scheduler: Payment successful for {user.email}")

                    # Expire the trial challenge
                    trial_challenge = UserChallenge.query.filter_by(
                        subscription_id=subscription.id,
                        is_trial=True,
                        status='active'
                    ).first()

                    if trial_challenge:
                        trial_challenge.status = 'expired'
                        trial_challenge.end_date = now
                        trial_challenge.failure_reason = 'Trial ended - Upgraded to paid plan'

                    # Create the new paid challenge
                    new_challenge = UserChallenge(
                        user_id=subscription.user_id,
                        plan_type=subscription.selected_plan,
                        initial_balance=Decimal(str(plan['initial_balance'])),
                        current_balance=Decimal(str(plan['initial_balance'])),
                        highest_balance=Decimal(str(plan['initial_balance'])),
                        status='active',
                        is_trial=False,
                        subscription_id=subscription.id
                    )
                    db.session.add(new_challenge)
                    db.session.flush()  # Get the ID

                    # Create payment record
                    payment = Payment(
                        user_id=subscription.user_id,
                        challenge_id=new_challenge.id,
                        subscription_id=subscription.id,
                        amount=Decimal(str(amount)),
                        currency='USD',
                        payment_method='paypal',
                        plan_type=subscription.selected_plan,
                        status='completed',
                        transaction_id=result.get('transaction_id'),
                        is_trial_conversion=True,
                        paypal_agreement_id=subscription.paypal_agreement_id
                    )
                    payment.complete_payment(result.get('transaction_id'))
                    db.session.add(payment)

                    # Update subscription status
                    subscription.mark_converted(result.get('transaction_id'))

                    db.session.commit()

                    # Send success email
                    send_charge_success_email(
                        to_email=user.email,
                        username=user.username,
                        plan_name=plan_name,
                        amount=amount
                    )

                    print(f"Scheduler: Successfully upgraded {user.email} to {plan_name}")

                else:
                    # FAILURE: Expire immediately (no retries per requirement)
                    error_msg = result.get('error', 'Unknown error') if result else 'Charge failed'

                    print(f"Scheduler: Payment failed for {user.email}: {error_msg}")

                    # Update subscription status
                    subscription.mark_failed(error_msg)

                    # Expire the trial challenge
                    trial_challenge = UserChallenge.query.filter_by(
                        subscription_id=subscription.id,
                        is_trial=True,
                        status='active'
                    ).first()

                    if trial_challenge:
                        trial_challenge.status = 'expired'
                        trial_challenge.end_date = now
                        trial_challenge.failure_reason = 'Payment failed - Trial expired'

                    db.session.commit()

                    # Send failure email
                    send_charge_failed_email(
                        to_email=user.email,
                        username=user.username,
                        plan_name=plan_name,
                        reason=error_msg
                    )

                    print(f"Scheduler: Trial expired for {user.email} due to payment failure")

            except Exception as e:
                print(f"Scheduler: Error processing subscription {subscription.id}: {e}")
                db.session.rollback()

        print(f"Scheduler [{now}]: Finished processing expired trials")


def run_trial_check_now():
    """
    Manually trigger trial check (for testing/admin use).
    """
    print("Manual trial check triggered...")
    process_expired_trials()
    print("Manual trial check completed")
