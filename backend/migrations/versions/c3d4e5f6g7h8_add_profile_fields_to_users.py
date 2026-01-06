"""Add profile fields to users table

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2025-01-06

Adds full_name, phone, country, failed_login_attempts, and locked_until
columns to users table for profile completion tracking.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6g7h8'
down_revision = 'b2c3d4e5f6g7'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add profile completion fields to users table (if they don't exist)
    if not column_exists('users', 'full_name'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('full_name', sa.String(100), nullable=True))

    if not column_exists('users', 'phone'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('phone', sa.String(20), nullable=True))

    if not column_exists('users', 'country'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('country', sa.String(50), nullable=True))

    if not column_exists('users', 'failed_login_attempts'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('failed_login_attempts', sa.Integer(), nullable=True, server_default='0'))

    if not column_exists('users', 'locked_until'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))


def downgrade():
    # Remove profile fields from users table
    if column_exists('users', 'locked_until'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('locked_until')

    if column_exists('users', 'failed_login_attempts'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('failed_login_attempts')

    if column_exists('users', 'country'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('country')

    if column_exists('users', 'phone'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('phone')

    if column_exists('users', 'full_name'):
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_column('full_name')
