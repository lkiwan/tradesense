"""Add extended profile fields (gender, date_of_birth, city, address)

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2025-01-06 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'e5f6g7h8i9j0'
down_revision = 'd4e5f6g7h8i9'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add extended profile fields (if they don't exist)
    if not column_exists('users', 'gender'):
        op.add_column('users', sa.Column('gender', sa.String(10), nullable=True))

    if not column_exists('users', 'date_of_birth'):
        op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))

    if not column_exists('users', 'city'):
        op.add_column('users', sa.Column('city', sa.String(100), nullable=True))

    if not column_exists('users', 'address'):
        op.add_column('users', sa.Column('address', sa.String(255), nullable=True))


def downgrade():
    # Remove extended profile fields
    if column_exists('users', 'address'):
        op.drop_column('users', 'address')

    if column_exists('users', 'city'):
        op.drop_column('users', 'city')

    if column_exists('users', 'date_of_birth'):
        op.drop_column('users', 'date_of_birth')

    if column_exists('users', 'gender'):
        op.drop_column('users', 'gender')
