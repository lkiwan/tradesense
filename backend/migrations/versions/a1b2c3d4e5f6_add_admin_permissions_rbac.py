"""add_admin_permissions_rbac

Revision ID: a1b2c3d4e5f6
Revises: e3ae470e791a
Create Date: 2025-12-26

Adds Role-Based Access Control (RBAC) tables for granular admin permissions:
- admin_permissions: Individual permission assignments
- admin_roles: Predefined role templates with permission sets
- user_admin_roles: Role assignments to users
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'e3ae470e791a'
branch_labels = None
depends_on = None


def upgrade():
    # Check if tables already exist (may have been created by db.create_all())
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # Create admin_roles table first (referenced by user_admin_roles)
    if 'admin_roles' not in existing_tables:
        op.create_table('admin_roles',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=50), nullable=False),
            sa.Column('display_name', sa.String(length=100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('permissions', sa.JSON(), nullable=False),
            sa.Column('level', sa.Integer(), nullable=True, default=0),
            sa.Column('is_system', sa.Boolean(), nullable=True, default=False),
            sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
            sa.Column('created_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name')
        )

    # Create admin_permissions table
    if 'admin_permissions' not in existing_tables:
        op.create_table('admin_permissions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('permission_name', sa.String(length=50), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
            sa.Column('granted_by', sa.Integer(), nullable=True),
            sa.Column('granted_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
            sa.Column('revoked_by', sa.Integer(), nullable=True),
            sa.Column('revoked_at', sa.DateTime(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
            sa.Column('notes', sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['revoked_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'permission_name', name='uq_user_permission')
        )

        # Create indexes for admin_permissions
        op.create_index('idx_admin_perm_user', 'admin_permissions', ['user_id'])
        op.create_index('idx_admin_perm_name', 'admin_permissions', ['permission_name'])
        op.create_index('idx_admin_perm_active', 'admin_permissions', ['user_id', 'is_active'])

    # Create user_admin_roles table
    if 'user_admin_roles' not in existing_tables:
        op.create_table('user_admin_roles',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('role_id', sa.Integer(), nullable=False),
            sa.Column('assigned_by', sa.Integer(), nullable=True),
            sa.Column('assigned_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['role_id'], ['admin_roles.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'role_id', name='uq_user_admin_role')
        )

    # Check if roles are already seeded
    result = bind.execute(sa.text("SELECT COUNT(*) FROM admin_roles"))
    count = result.scalar()

    if count == 0:
        # Insert default roles only if table is empty
        admin_roles_table = sa.table('admin_roles',
            sa.column('name', sa.String),
            sa.column('display_name', sa.String),
            sa.column('description', sa.Text),
            sa.column('permissions', sa.JSON),
            sa.column('level', sa.Integer),
            sa.column('is_system', sa.Boolean),
            sa.column('is_active', sa.Boolean),
            sa.column('created_at', sa.DateTime)
        )

        op.bulk_insert(admin_roles_table, [
            {
                'name': 'support_agent',
                'display_name': 'Support Agent',
                'description': 'Can handle support tickets and view user information',
                'permissions': ['view_users', 'view_tickets', 'respond_tickets', 'close_tickets'],
                'level': 1,
                'is_system': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'content_manager',
                'display_name': 'Content Manager',
                'description': 'Can manage blog posts, webinars, and educational content',
                'permissions': ['manage_blog', 'manage_webinars', 'manage_resources'],
                'level': 1,
                'is_system': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'financial_admin',
                'display_name': 'Financial Administrator',
                'description': 'Can manage payments and payouts',
                'permissions': ['view_payments', 'process_refunds', 'view_payouts', 'approve_payouts', 'process_payouts'],
                'level': 2,
                'is_system': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'admin',
                'display_name': 'Administrator',
                'description': 'Full admin access except platform settings',
                'permissions': [
                    'view_users', 'edit_users',
                    'view_challenges', 'edit_challenges',
                    'view_payments', 'view_payouts',
                    'view_tickets', 'respond_tickets', 'close_tickets',
                    'view_analytics'
                ],
                'level': 5,
                'is_system': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'superadmin',
                'display_name': 'Super Administrator',
                'description': 'Full platform access including system settings',
                'permissions': [
                    'view_users', 'edit_users', 'ban_users', 'delete_users',
                    'view_challenges', 'edit_challenges', 'create_challenges', 'delete_challenges',
                    'view_payments', 'process_refunds', 'view_payouts', 'approve_payouts', 'process_payouts',
                    'view_tickets', 'respond_tickets', 'close_tickets', 'assign_tickets',
                    'manage_blog', 'manage_webinars', 'manage_resources',
                    'view_analytics', 'manage_offers', 'manage_challenges_config', 'view_audit_logs',
                    'manage_admins', 'manage_permissions', 'platform_settings', 'maintenance_mode', 'manage_api_keys'
                ],
                'level': 10,
                'is_system': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            }
        ])


def downgrade():
    # Check if tables exist before dropping
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'user_admin_roles' in existing_tables:
        op.drop_table('user_admin_roles')

    if 'admin_permissions' in existing_tables:
        # Drop indexes first
        try:
            op.drop_index('idx_admin_perm_active', table_name='admin_permissions')
        except:
            pass
        try:
            op.drop_index('idx_admin_perm_name', table_name='admin_permissions')
        except:
            pass
        try:
            op.drop_index('idx_admin_perm_user', table_name='admin_permissions')
        except:
            pass
        op.drop_table('admin_permissions')

    if 'admin_roles' in existing_tables:
        op.drop_table('admin_roles')
