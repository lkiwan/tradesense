"""Increase phone field size from 20 to 30 characters

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2025-01-06 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6g7h8i9'
down_revision = 'c3d4e5f6g7h8'
branch_labels = None
depends_on = None


def upgrade():
    # Increase phone column size to accommodate international phone formats
    op.alter_column('users', 'phone',
                    existing_type=sa.String(20),
                    type_=sa.String(30),
                    existing_nullable=True)


def downgrade():
    # Revert phone column size
    op.alter_column('users', 'phone',
                    existing_type=sa.String(30),
                    type_=sa.String(20),
                    existing_nullable=True)
