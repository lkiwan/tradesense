"""Add extended profile fields (gender, date_of_birth, city, address)

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2025-01-06 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6g7h8i9j0'
down_revision = 'd4e5f6g7h8i9'
branch_labels = None
depends_on = None


def upgrade():
    # Add extended profile fields
    op.add_column('users', sa.Column('gender', sa.String(10), nullable=True))
    op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(255), nullable=True))


def downgrade():
    # Remove extended profile fields
    op.drop_column('users', 'address')
    op.drop_column('users', 'city')
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'gender')
