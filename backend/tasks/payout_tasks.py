"""
Payout Tasks for TradeSense
Handles all payout-related background tasks
"""
import logging
from celery import shared_task
from datetime import datetime

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_payout_request(self, payout_id: int):
    """
    Process a single payout request.

    Args:
        payout_id: Payout request ID
    """
    try:
        from app import create_app
        from models import db, Payout, User

        app = create_app()
        with app.app_context():
            payout = Payout.query.get(payout_id)
            if not payout:
                logger.warning(f"Payout {payout_id} not found")
                return {'status': 'skipped', 'reason': 'payout_not_found'}

            if payout.status != 'pending':
                logger.info(f"Payout {payout_id} already processed (status: {payout.status})")
                return {'status': 'skipped', 'reason': 'already_processed'}

            user = User.query.get(payout.user_id)
            if not user:
                logger.error(f"User not found for payout {payout_id}")
                return {'status': 'error', 'reason': 'user_not_found'}

            # Process payout via payment gateway
            try:
                from services.payment_gateway import PaymentGateway

                result = PaymentGateway.process_payout(
                    user_id=user.id,
                    amount=float(payout.amount),
                    method=payout.payout_method,
                    details=payout.payout_details
                )

                if result.get('success'):
                    payout.status = 'completed'
                    payout.processed_at = datetime.utcnow()
                    payout.transaction_id = result.get('transaction_id')
                    db.session.commit()

                    # Send notification email
                    from tasks.email_tasks import send_payout_status_email
                    send_payout_status_email.delay(user.id, {
                        'status': 'completed',
                        'amount': float(payout.amount),
                        'method': payout.payout_method,
                        'transaction_id': payout.transaction_id
                    })

                    logger.info(f"Payout {payout_id} completed successfully")
                    return {'status': 'success', 'payout_id': payout_id}
                else:
                    payout.status = 'failed'
                    payout.notes = result.get('error', 'Payment processing failed')
                    db.session.commit()

                    logger.error(f"Payout {payout_id} failed: {result.get('error')}")
                    return {'status': 'failed', 'error': result.get('error')}

            except Exception as payment_error:
                logger.error(f"Payment gateway error for payout {payout_id}: {payment_error}")
                raise self.retry(exc=payment_error, countdown=300)

    except Exception as e:
        logger.error(f"Failed to process payout {payout_id}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def process_pending_payouts():
    """
    Process all pending payout requests.
    Scheduled to run every 4 hours.
    """
    try:
        from app import create_app
        from models import Payout

        app = create_app()
        with app.app_context():
            # Get pending payouts that are approved
            pending_payouts = Payout.query.filter_by(
                status='approved'
            ).all()

            queued_count = 0
            for payout in pending_payouts:
                try:
                    process_payout_request.delay(payout.id)
                    queued_count += 1
                except Exception as e:
                    logger.error(f"Failed to queue payout {payout.id}: {e}")

            logger.info(f"Queued {queued_count} pending payouts for processing")
            return {'status': 'success', 'queued': queued_count}

    except Exception as e:
        logger.error(f"Failed to process pending payouts: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def calculate_payout_amount(self, challenge_id: int):
    """
    Calculate payout amount for a funded challenge.

    Args:
        challenge_id: Challenge ID
    """
    try:
        from app import create_app
        from models import db, UserChallenge, Trade, ChallengeModel

        app = create_app()
        with app.app_context():
            challenge = UserChallenge.query.get(challenge_id)
            if not challenge:
                return {'status': 'skipped', 'reason': 'challenge_not_found'}

            if challenge.status != 'funded':
                return {'status': 'skipped', 'reason': 'not_funded'}

            # Get all profitable closed trades
            trades = Trade.query.filter_by(
                challenge_id=challenge_id,
                status='closed'
            ).all()

            total_profit = sum(t.profit_loss for t in trades if t.profit_loss and t.profit_loss > 0)

            # Get profit split from challenge model
            model = ChallengeModel.query.get(challenge.model_id)
            profit_split = model.default_profit_split if model else 80.0

            # Calculate trader's share
            trader_payout = total_profit * (profit_split / 100)

            logger.info(f"Challenge {challenge_id}: Total profit ${total_profit}, "
                        f"Trader payout ${trader_payout} ({profit_split}%)")

            return {
                'status': 'success',
                'challenge_id': challenge_id,
                'total_profit': total_profit,
                'profit_split': profit_split,
                'trader_payout': trader_payout
            }

    except Exception as e:
        logger.error(f"Failed to calculate payout for challenge {challenge_id}: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def generate_payout_report(start_date: str, end_date: str):
    """
    Generate payout report for a date range.

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
    """
    try:
        from app import create_app
        from models import Payout
        from datetime import datetime

        app = create_app()
        with app.app_context():
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')

            payouts = Payout.query.filter(
                Payout.created_at >= start,
                Payout.created_at <= end
            ).all()

            report = {
                'period': {'start': start_date, 'end': end_date},
                'total_payouts': len(payouts),
                'completed': len([p for p in payouts if p.status == 'completed']),
                'pending': len([p for p in payouts if p.status == 'pending']),
                'failed': len([p for p in payouts if p.status == 'failed']),
                'total_amount': sum(float(p.amount) for p in payouts),
                'completed_amount': sum(float(p.amount) for p in payouts if p.status == 'completed'),
            }

            logger.info(f"Generated payout report: {report}")
            return report

    except Exception as e:
        logger.error(f"Failed to generate payout report: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=3)
def process_affiliate_payout(self, referral_id: int):
    """
    Process affiliate commission payout.

    Args:
        referral_id: Referral ID
    """
    try:
        from app import create_app
        from models import db, Referral, User

        app = create_app()
        with app.app_context():
            referral = Referral.query.get(referral_id)
            if not referral:
                return {'status': 'skipped', 'reason': 'referral_not_found'}

            if referral.commission_paid:
                return {'status': 'skipped', 'reason': 'already_paid'}

            referrer = User.query.get(referral.referrer_id)
            if not referrer:
                return {'status': 'error', 'reason': 'referrer_not_found'}

            # Process commission payment
            commission_amount = float(referral.commission_earned or 0)
            if commission_amount <= 0:
                return {'status': 'skipped', 'reason': 'no_commission'}

            # Mark as paid (actual payment processing would go here)
            referral.commission_paid = True
            referral.commission_paid_at = datetime.utcnow()
            db.session.commit()

            logger.info(f"Processed affiliate payout for referral {referral_id}: ${commission_amount}")
            return {'status': 'success', 'referral_id': referral_id, 'amount': commission_amount}

    except Exception as e:
        logger.error(f"Failed to process affiliate payout for referral {referral_id}: {e}")
        raise self.retry(exc=e, countdown=60)
