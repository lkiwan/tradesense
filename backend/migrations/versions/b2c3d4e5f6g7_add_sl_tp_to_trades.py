"""Add stop_loss and take_profit to trades

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-12-28

Adds stop_loss and take_profit columns to trades table for
storing trade protection levels.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add stop_loss and take_profit columns to trades table (if they don't exist)
    if not column_exists('trades', 'stop_loss'):
        with op.batch_alter_table('trades', schema=None) as batch_op:
            batch_op.add_column(sa.Column('stop_loss', sa.Numeric(15, 5), nullable=True))

    if not column_exists('trades', 'take_profit'):
        with op.batch_alter_table('trades', schema=None) as batch_op:
            batch_op.add_column(sa.Column('take_profit', sa.Numeric(15, 5), nullable=True))


def downgrade():
    # Remove stop_loss and take_profit columns from trades table
    if column_exists('trades', 'take_profit'):
        with op.batch_alter_table('trades', schema=None) as batch_op:
            batch_op.drop_column('take_profit')

    if column_exists('trades', 'stop_loss'):
        with op.batch_alter_table('trades', schema=None) as batch_op:
            batch_op.drop_column('stop_loss')
