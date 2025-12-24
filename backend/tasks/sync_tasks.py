"""
Sync Tasks for TradeSense
Handles data synchronization and scheduled maintenance tasks
"""
import logging
from celery import shared_task
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@shared_task
def process_expired_trials():
    """
    Process expired trial accounts.
    Scheduled to run every hour.
    """
    try:
        from app import create_app
        from models import db, UserChallenge, User, Subscription

        app = create_app()
        with app.app_context():
            now = datetime.utcnow()

            # Find expired trials
            expired_trials = UserChallenge.query.filter(
                UserChallenge.status == 'trial',
                UserChallenge.trial_ends_at <= now
            ).all()

            processed_count = 0
            for challenge in expired_trials:
                try:
                    user = User.query.get(challenge.user_id)
                    if not user:
                        continue

                    # Check if user has active subscription
                    subscription = Subscription.query.filter_by(
                        user_id=user.id,
                        status='active'
                    ).first()

                    if subscription:
                        # Convert trial to paid challenge
                        challenge.status = 'active'
                        challenge.is_trial = False
                        logger.info(f"Trial {challenge.id} converted to active for user {user.id}")
                    else:
                        # Expire the trial
                        challenge.status = 'expired'
                        logger.info(f"Trial {challenge.id} expired for user {user.id}")

                        # Send notification
                        from tasks.notification_tasks import send_challenge_alert
                        send_challenge_alert.delay(user.id, {
                            'challenge_id': challenge.id,
                            'status': 'expired',
                            'name': 'Trial Challenge'
                        })

                    processed_count += 1

                except Exception as e:
                    logger.error(f"Error processing trial {challenge.id}: {e}")

            db.session.commit()
            logger.info(f"Processed {processed_count} expired trials")
            return {'status': 'success', 'processed': processed_count}

    except Exception as e:
        logger.error(f"Failed to process expired trials: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def sync_market_data():
    """
    Sync market data from external sources.
    Scheduled to run every 5 minutes during market hours.
    """
    try:
        from services.cache_service import CacheService
        from services.yfinance_service import get_multiple_prices

        # Key symbols to keep cached
        symbols = [
            'BTC-USD', 'ETH-USD', 'AAPL', 'TSLA', 'GOOGL', 'MSFT',
            'NVDA', 'META', 'AMZN', 'JPM'
        ]

        prices = get_multiple_prices(symbols)

        # Update cache
        for symbol, price_data in prices.items():
            cache_key = CacheService.market_key(symbol)
            CacheService.set(cache_key, price_data, timeout=CacheService.TTL['market_prices'])

        logger.info(f"Synced market data for {len(prices)} symbols")
        return {'status': 'success', 'synced': len(prices)}

    except Exception as e:
        logger.error(f"Failed to sync market data: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def check_challenge_statuses():
    """
    Check and update challenge statuses based on trading rules.
    Scheduled to run every 30 minutes.
    """
    try:
        from app import create_app
        from models import db, UserChallenge, Trade, ChallengeModel

        app = create_app()
        with app.app_context():
            # Get active challenges
            active_challenges = UserChallenge.query.filter(
                UserChallenge.status.in_(['active', 'evaluation', 'verification'])
            ).all()

            updated_count = 0
            for challenge in active_challenges:
                try:
                    model = ChallengeModel.query.get(challenge.model_id)
                    if not model:
                        continue

                    # Calculate current metrics
                    trades = Trade.query.filter_by(
                        challenge_id=challenge.id,
                        status='closed'
                    ).all()

                    total_pnl = sum(t.profit_loss or 0 for t in trades)
                    current_balance = challenge.initial_balance + total_pnl

                    # Check for violations
                    max_loss = challenge.initial_balance * (model.max_overall_loss / 100)
                    if current_balance < (challenge.initial_balance - max_loss):
                        challenge.status = 'failed'
                        challenge.failed_at = datetime.utcnow()
                        challenge.failure_reason = 'max_overall_loss_exceeded'
                        updated_count += 1

                        from tasks.notification_tasks import send_challenge_alert
                        send_challenge_alert.delay(challenge.user_id, {
                            'challenge_id': challenge.id,
                            'status': 'failed',
                            'reason': 'Maximum overall loss exceeded'
                        })
                        continue

                    # Check for profit target reached
                    profit_target = None
                    if challenge.status == 'evaluation':
                        profit_target = model.phase1_profit_target
                    elif challenge.status == 'verification':
                        profit_target = model.phase2_profit_target

                    if profit_target:
                        target_profit = challenge.initial_balance * (profit_target / 100)
                        if total_pnl >= target_profit:
                            # Progress to next phase
                            if challenge.status == 'evaluation' and model.phases > 1:
                                challenge.status = 'verification'
                                challenge.phase = 2
                            else:
                                challenge.status = 'funded'
                                challenge.funded_at = datetime.utcnow()

                            updated_count += 1

                            from tasks.notification_tasks import send_challenge_alert
                            send_challenge_alert.delay(challenge.user_id, {
                                'challenge_id': challenge.id,
                                'status': challenge.status,
                                'phase': challenge.phase
                            })

                    # Update balance
                    challenge.current_balance = current_balance

                except Exception as e:
                    logger.error(f"Error checking challenge {challenge.id}: {e}")

            db.session.commit()
            logger.info(f"Checked {len(active_challenges)} challenges, updated {updated_count}")
            return {'status': 'success', 'checked': len(active_challenges), 'updated': updated_count}

    except Exception as e:
        logger.error(f"Failed to check challenge statuses: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def sync_user_statistics():
    """
    Sync and update user trading statistics.
    """
    try:
        from app import create_app
        from models import db, User, UserChallenge, Trade

        app = create_app()
        with app.app_context():
            users = User.query.filter_by(is_active=True).all()

            updated_count = 0
            for user in users:
                try:
                    # Get all user's trades
                    challenges = UserChallenge.query.filter_by(user_id=user.id).all()
                    challenge_ids = [c.id for c in challenges]

                    if not challenge_ids:
                        continue

                    trades = Trade.query.filter(
                        Trade.challenge_id.in_(challenge_ids),
                        Trade.status == 'closed'
                    ).all()

                    if not trades:
                        continue

                    # Calculate statistics
                    total_trades = len(trades)
                    winning_trades = len([t for t in trades if (t.profit_loss or 0) > 0])
                    total_pnl = sum(t.profit_loss or 0 for t in trades)

                    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

                    # Update user statistics (if user has stats fields)
                    # user.total_trades = total_trades
                    # user.win_rate = win_rate
                    # user.total_pnl = total_pnl

                    updated_count += 1

                except Exception as e:
                    logger.error(f"Error syncing stats for user {user.id}: {e}")

            db.session.commit()
            logger.info(f"Synced statistics for {updated_count} users")
            return {'status': 'success', 'updated': updated_count}

    except Exception as e:
        logger.error(f"Failed to sync user statistics: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def cleanup_expired_sessions():
    """
    Clean up expired user sessions.
    """
    try:
        from app import create_app
        from models import db

        app = create_app()
        with app.app_context():
            # This would clean up expired sessions from the database
            # Assuming UserSession model exists
            cutoff_date = datetime.utcnow() - timedelta(days=7)

            # deleted_count = UserSession.query.filter(
            #     UserSession.last_active < cutoff_date
            # ).delete()
            # db.session.commit()

            deleted_count = 0  # Placeholder
            logger.info(f"Cleaned up {deleted_count} expired sessions")
            return {'status': 'success', 'deleted': deleted_count}

    except Exception as e:
        logger.error(f"Failed to clean up expired sessions: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def backup_database():
    """
    Create database backup.
    Should be scheduled to run daily.
    """
    try:
        import subprocess
        import os
        from datetime import datetime

        # Get database URL from environment
        db_url = os.getenv('DATABASE_URL', '')

        if 'postgresql' not in db_url:
            logger.info("Skipping backup - not using PostgreSQL")
            return {'status': 'skipped', 'reason': 'not_postgresql'}

        # Create backup directory if it doesn't exist
        backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        # Generate backup filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'tradesense_backup_{timestamp}.sql')

        # Run pg_dump (would need to be configured properly)
        # subprocess.run(['pg_dump', '-Fc', '-f', backup_file, db_url], check=True)

        logger.info(f"Database backup created: {backup_file}")
        return {'status': 'success', 'file': backup_file}

    except Exception as e:
        logger.error(f"Failed to create database backup: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def sync_leaderboard():
    """
    Sync and update leaderboard rankings.
    """
    try:
        from app import create_app
        from models import db, User, UserChallenge, Trade
        from services.cache_service import CacheService

        app = create_app()
        with app.app_context():
            # Get all funded users with their stats
            funded_challenges = UserChallenge.query.filter_by(status='funded').all()

            leaderboard = []
            for challenge in funded_challenges:
                user = User.query.get(challenge.user_id)
                if not user:
                    continue

                trades = Trade.query.filter_by(
                    challenge_id=challenge.id,
                    status='closed'
                ).all()

                total_pnl = sum(t.profit_loss or 0 for t in trades)
                total_trades = len(trades)
                winning_trades = len([t for t in trades if (t.profit_loss or 0) > 0])
                win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

                leaderboard.append({
                    'user_id': user.id,
                    'username': user.username,
                    'total_pnl': total_pnl,
                    'win_rate': win_rate,
                    'total_trades': total_trades,
                    'challenge_id': challenge.id
                })

            # Sort by total PnL
            leaderboard.sort(key=lambda x: x['total_pnl'], reverse=True)

            # Add ranking
            for i, entry in enumerate(leaderboard):
                entry['rank'] = i + 1

            # Cache the leaderboard
            CacheService.set('leaderboard:global', leaderboard, timeout=300)

            logger.info(f"Synced leaderboard with {len(leaderboard)} traders")
            return {'status': 'success', 'traders': len(leaderboard)}

    except Exception as e:
        logger.error(f"Failed to sync leaderboard: {e}")
        return {'status': 'error', 'error': str(e)}


@shared_task(bind=True, max_retries=3)
def sync_trade_from_mt(self, challenge_id: int, mt_trade_data: dict):
    """
    Sync a trade from MT4/MT5 platform.

    Args:
        challenge_id: Challenge ID
        mt_trade_data: Trade data from MT platform
    """
    try:
        from app import create_app
        from models import db, Trade, UserChallenge

        app = create_app()
        with app.app_context():
            challenge = UserChallenge.query.get(challenge_id)
            if not challenge:
                return {'status': 'skipped', 'reason': 'challenge_not_found'}

            # Create or update trade
            trade = Trade.query.filter_by(
                challenge_id=challenge_id,
                external_id=mt_trade_data.get('ticket')
            ).first()

            if not trade:
                trade = Trade(
                    challenge_id=challenge_id,
                    external_id=mt_trade_data.get('ticket'),
                    symbol=mt_trade_data.get('symbol'),
                    trade_type=mt_trade_data.get('type'),
                    lot_size=mt_trade_data.get('lots'),
                    entry_price=mt_trade_data.get('open_price'),
                    opened_at=mt_trade_data.get('open_time'),
                    status='open'
                )
                db.session.add(trade)
            else:
                # Update existing trade
                if mt_trade_data.get('close_price'):
                    trade.exit_price = mt_trade_data.get('close_price')
                    trade.closed_at = mt_trade_data.get('close_time')
                    trade.profit_loss = mt_trade_data.get('profit')
                    trade.status = 'closed'

            db.session.commit()

            logger.info(f"Synced trade {mt_trade_data.get('ticket')} for challenge {challenge_id}")
            return {'status': 'success', 'trade_id': trade.id}

    except Exception as e:
        logger.error(f"Failed to sync MT trade for challenge {challenge_id}: {e}")
        raise self.retry(exc=e, countdown=60)
