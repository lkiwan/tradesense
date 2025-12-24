"""baseline_schema

Revision ID: c6d69dae716b
Revises:
Create Date: 2025-12-23 15:23:45.506982

This is the baseline migration that documents the initial TradeSense database schema.
All tables were created directly by SQLAlchemy's db.create_all() before migrations were set up.

Tables included:
- users: User accounts and authentication
- challenge_models: Challenge configuration templates (Stellar 1-Step, 2-Step, Lite)
- account_sizes: Available account sizes for each challenge model
- user_challenges: User's active/past challenges
- trades: Trading positions (open and closed)
- payments: Payment transactions
- subscriptions: Trial subscriptions
- payouts: Withdrawal requests
- referrals: Referral program tracking
- points_balances: User points balances
- points_transactions: Points activity log
- support_tickets: Customer support tickets
- ticket_messages: Messages within tickets
- resources: Educational resources
- economic_events: Economic calendar events
- offers: Promotional offers/discounts
- offer_usages: Offer redemption tracking
- settings: Application settings
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c6d69dae716b'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Create all tables for TradeSense platform.
    Note: These tables already exist in the database.
    This migration serves as documentation of the initial schema.
    """
    # Users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=True),
        sa.Column('avatar', sa.String(length=255), nullable=True),
        sa.Column('preferred_language', sa.String(length=5), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('referral_code', sa.String(length=20), nullable=True),
        sa.Column('referred_by_code', sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('referral_code')
    )

    # Challenge Models table
    op.create_table('challenge_models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('phases', sa.Integer(), nullable=False),
        sa.Column('phase1_profit_target', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('phase2_profit_target', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('max_daily_loss', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('max_total_loss', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('min_trading_days', sa.Integer(), nullable=True),
        sa.Column('max_trading_days', sa.Integer(), nullable=True),
        sa.Column('profit_split', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('leverage', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Account Sizes table
    op.create_table('account_sizes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('challenge_model_id', sa.Integer(), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_popular', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['challenge_model_id'], ['challenge_models.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # User Challenges table
    op.create_table('user_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('challenge_model_id', sa.Integer(), nullable=True),
        sa.Column('account_size_id', sa.Integer(), nullable=True),
        sa.Column('plan_type', sa.String(length=20), nullable=False),
        sa.Column('initial_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('highest_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('phase', sa.String(length=20), nullable=True),
        sa.Column('current_phase', sa.Integer(), nullable=True),
        sa.Column('profit_target', sa.Float(), nullable=True),
        sa.Column('is_funded', sa.Boolean(), nullable=True),
        sa.Column('is_trial', sa.Boolean(), nullable=True),
        sa.Column('trial_expires_at', sa.DateTime(), nullable=True),
        sa.Column('total_profit_earned', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('withdrawable_profit', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('failure_reason', sa.String(length=100), nullable=True),
        sa.Column('daily_loss_date', sa.Date(), nullable=True),
        sa.Column('daily_starting_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['challenge_model_id'], ['challenge_models.id']),
        sa.ForeignKeyConstraint(['account_size_id'], ['account_sizes.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Trades table
    op.create_table('trades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('trade_type', sa.String(length=10), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('entry_price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('exit_price', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('stop_loss', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('take_profit', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('pnl', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['challenge_id'], ['user_challenges.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Payments table
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_type', sa.String(length=20), nullable=True),
        sa.Column('challenge_model_id', sa.Integer(), nullable=True),
        sa.Column('account_size_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('paypal_order_id', sa.String(length=100), nullable=True),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('is_trial_conversion', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('selected_plan', sa.String(length=20), nullable=True),
        sa.Column('challenge_model_id', sa.Integer(), nullable=True),
        sa.Column('account_size_id', sa.Integer(), nullable=True),
        sa.Column('paypal_agreement_id', sa.String(length=100), nullable=True),
        sa.Column('paypal_payer_id', sa.String(length=100), nullable=True),
        sa.Column('paypal_payer_email', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('trial_started_at', sa.DateTime(), nullable=True),
        sa.Column('trial_expires_at', sa.DateTime(), nullable=True),
        sa.Column('converted_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('failed_at', sa.DateTime(), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Payouts table
    op.create_table('payouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('gross_profit', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('net_payout', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('paypal_email', sa.String(length=255), nullable=True),
        sa.Column('transaction_id', sa.String(length=100), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('processed_by', sa.Integer(), nullable=True),
        sa.Column('rejection_reason', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['challenge_id'], ['user_challenges.id']),
        sa.ForeignKeyConstraint(['processed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Referrals table
    op.create_table('referrals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('referrer_id', sa.Integer(), nullable=False),
        sa.Column('referred_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('commission_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('total_earned', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('converted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['referred_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Points Balances table
    op.create_table('points_balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Integer(), nullable=True),
        sa.Column('lifetime_earned', sa.Integer(), nullable=True),
        sa.Column('lifetime_spent', sa.Integer(), nullable=True),
        sa.Column('level', sa.String(length=20), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Points Transactions table
    op.create_table('points_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Support Tickets table
    op.create_table('support_tickets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Ticket Messages table
    op.create_table('ticket_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_staff_reply', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['ticket_id'], ['support_tickets.id']),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Resources table
    op.create_table('resources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('resource_type', sa.String(length=50), nullable=True),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('thumbnail', sa.String(length=500), nullable=True),
        sa.Column('is_premium', sa.Boolean(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Economic Events table
    op.create_table('economic_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=10), nullable=True),
        sa.Column('impact', sa.String(length=20), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('previous', sa.String(length=50), nullable=True),
        sa.Column('forecast', sa.String(length=50), nullable=True),
        sa.Column('actual', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Offers table
    op.create_table('offers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('min_purchase', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('uses_count', sa.Integer(), nullable=True),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )

    # Offer Usages table
    op.create_table('offer_usages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('offer_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('payment_id', sa.Integer(), nullable=True),
        sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['offer_id'], ['offers.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Settings table
    op.create_table('settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )


def downgrade():
    """Drop all tables in reverse order."""
    op.drop_table('settings')
    op.drop_table('offer_usages')
    op.drop_table('offers')
    op.drop_table('economic_events')
    op.drop_table('resources')
    op.drop_table('ticket_messages')
    op.drop_table('support_tickets')
    op.drop_table('points_transactions')
    op.drop_table('points_balances')
    op.drop_table('referrals')
    op.drop_table('payouts')
    op.drop_table('subscriptions')
    op.drop_table('payments')
    op.drop_table('trades')
    op.drop_table('user_challenges')
    op.drop_table('account_sizes')
    op.drop_table('challenge_models')
    op.drop_table('users')
