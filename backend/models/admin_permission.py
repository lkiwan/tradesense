"""
Admin Permission Model for TradeSense
Implements Role-Based Access Control (RBAC) for granular admin permissions
"""
from datetime import datetime
from . import db


# Available permissions grouped by category
PERMISSION_CATEGORIES = {
    'users': {
        'view_users': 'View user list and details',
        'edit_users': 'Edit user profiles',
        'ban_users': 'Ban/unban users',
        'delete_users': 'Delete user accounts',
    },
    'challenges': {
        'view_challenges': 'View all challenges',
        'edit_challenges': 'Modify challenge status',
        'create_challenges': 'Create challenges for users',
        'delete_challenges': 'Delete challenges',
    },
    'financial': {
        'view_payments': 'View payment history',
        'process_refunds': 'Process refunds',
        'view_payouts': 'View payout requests',
        'approve_payouts': 'Approve/reject payouts',
        'process_payouts': 'Mark payouts as processed',
    },
    'support': {
        'view_tickets': 'View support tickets',
        'respond_tickets': 'Respond to tickets',
        'close_tickets': 'Close/resolve tickets',
        'assign_tickets': 'Assign tickets to staff',
    },
    'content': {
        'manage_blog': 'Create/edit blog posts',
        'manage_webinars': 'Manage webinars',
        'manage_resources': 'Manage educational resources',
    },
    'platform': {
        'view_analytics': 'View platform analytics',
        'manage_offers': 'Create/edit promotional offers',
        'manage_challenges_config': 'Configure challenge models',
        'view_audit_logs': 'View audit logs',
    },
    'superadmin': {
        'manage_admins': 'Promote/demote admins',
        'manage_permissions': 'Assign permissions to admins',
        'platform_settings': 'Modify platform settings',
        'maintenance_mode': 'Toggle maintenance mode',
        'manage_api_keys': 'Manage API integrations',
    }
}

# Flatten permissions for easy lookup
ALL_PERMISSIONS = {}
for category, perms in PERMISSION_CATEGORIES.items():
    ALL_PERMISSIONS.update(perms)


# Default permission sets for roles
DEFAULT_ROLE_PERMISSIONS = {
    'admin': [
        'view_users', 'edit_users', 'ban_users',
        'view_challenges', 'edit_challenges',
        'view_payments', 'view_payouts',
        'view_tickets', 'respond_tickets', 'close_tickets',
        'view_analytics',
    ],
    'superadmin': list(ALL_PERMISSIONS.keys()),  # All permissions
}


class AdminPermission(db.Model):
    """Individual permission assignments for admin users"""
    __tablename__ = 'admin_permissions'
    __table_args__ = (
        db.Index('idx_admin_perm_user', 'user_id'),
        db.Index('idx_admin_perm_name', 'permission_name'),
        db.Index('idx_admin_perm_active', 'user_id', 'is_active'),
        db.UniqueConstraint('user_id', 'permission_name', name='uq_user_permission'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Permission details
    permission_name = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Audit trail
    granted_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)

    # Optional expiration
    expires_at = db.Column(db.DateTime, nullable=True)

    # Notes
    notes = db.Column(db.String(255), nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('permissions', lazy='dynamic', cascade='all, delete-orphan'))
    granter = db.relationship('User', foreign_keys=[granted_by])
    revoker = db.relationship('User', foreign_keys=[revoked_by])

    def is_valid(self):
        """Check if permission is currently valid"""
        if not self.is_active:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True

    def revoke(self, revoked_by_id=None):
        """Revoke this permission"""
        self.is_active = False
        self.revoked_by = revoked_by_id
        self.revoked_at = datetime.utcnow()

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'permission_name': self.permission_name,
            'permission_description': ALL_PERMISSIONS.get(self.permission_name, ''),
            'is_active': self.is_active,
            'is_valid': self.is_valid(),
            'granted_by': self.granted_by,
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'notes': self.notes
        }

    def __repr__(self):
        status = 'active' if self.is_valid() else 'inactive'
        return f'<AdminPermission {self.permission_name} for user {self.user_id} ({status})>'


class AdminRole(db.Model):
    """Predefined admin roles with permission sets"""
    __tablename__ = 'admin_roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # JSON array of permission names
    permissions = db.Column(db.JSON, nullable=False, default=list)

    # Role hierarchy (higher = more authority)
    level = db.Column(db.Integer, default=0)

    # System roles cannot be deleted
    is_system = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'permissions': self.permissions,
            'level': self.level,
            'is_system': self.is_system,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AdminRole {self.name} (level {self.level})>'


class UserAdminRole(db.Model):
    """Assignment of admin roles to users"""
    __tablename__ = 'user_admin_roles'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'role_id', name='uq_user_admin_role'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('admin_roles.id', ondelete='CASCADE'), nullable=False)

    # Audit
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('admin_roles', lazy='dynamic'))
    role = db.relationship('AdminRole', backref='users')
    assigner = db.relationship('User', foreign_keys=[assigned_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role.to_dict() if self.role else None,
            'assigned_by': self.assigned_by,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None
        }


# ==================== Helper Functions ====================

def has_permission(user_id, permission_name):
    """
    Check if a user has a specific permission.
    Checks both individual permissions and role-based permissions.

    Args:
        user_id: The user's ID
        permission_name: The permission to check

    Returns:
        bool: True if user has the permission
    """
    from .user import User

    # Get user and check base role first
    user = User.query.get(user_id)
    if not user:
        return False

    # Superadmins have all permissions
    if user.role == 'superadmin':
        return True

    # Check if user is at least an admin
    if user.role not in ['admin', 'superadmin']:
        return False

    # Check individual permissions
    individual_perm = AdminPermission.query.filter_by(
        user_id=user_id,
        permission_name=permission_name,
        is_active=True
    ).first()

    if individual_perm and individual_perm.is_valid():
        return True

    # Check role-based permissions
    user_roles = UserAdminRole.query.filter_by(user_id=user_id).all()
    for user_role in user_roles:
        if user_role.role and user_role.role.is_active:
            if permission_name in (user_role.role.permissions or []):
                return True

    return False


def get_user_permissions(user_id):
    """
    Get all permissions for a user (individual + role-based).

    Args:
        user_id: The user's ID

    Returns:
        set: Set of permission names
    """
    from .user import User

    user = User.query.get(user_id)
    if not user:
        return set()

    # Superadmins have all permissions
    if user.role == 'superadmin':
        return set(ALL_PERMISSIONS.keys())

    if user.role not in ['admin', 'superadmin']:
        return set()

    permissions = set()

    # Add individual permissions
    individual_perms = AdminPermission.query.filter_by(
        user_id=user_id,
        is_active=True
    ).all()

    for perm in individual_perms:
        if perm.is_valid():
            permissions.add(perm.permission_name)

    # Add role-based permissions
    user_roles = UserAdminRole.query.filter_by(user_id=user_id).all()
    for user_role in user_roles:
        if user_role.role and user_role.role.is_active:
            permissions.update(user_role.role.permissions or [])

    return permissions


def grant_permission(user_id, permission_name, granted_by_id=None, expires_at=None, notes=None):
    """
    Grant a permission to a user.

    Args:
        user_id: The user receiving the permission
        permission_name: The permission to grant
        granted_by_id: The admin granting the permission
        expires_at: Optional expiration datetime
        notes: Optional notes about the grant

    Returns:
        AdminPermission: The created or updated permission
    """
    if permission_name not in ALL_PERMISSIONS:
        raise ValueError(f"Unknown permission: {permission_name}")

    # Check if permission already exists
    existing = AdminPermission.query.filter_by(
        user_id=user_id,
        permission_name=permission_name
    ).first()

    if existing:
        # Reactivate if inactive
        existing.is_active = True
        existing.granted_by = granted_by_id
        existing.granted_at = datetime.utcnow()
        existing.expires_at = expires_at
        existing.notes = notes
        existing.revoked_at = None
        existing.revoked_by = None
    else:
        existing = AdminPermission(
            user_id=user_id,
            permission_name=permission_name,
            granted_by=granted_by_id,
            expires_at=expires_at,
            notes=notes
        )
        db.session.add(existing)

    db.session.commit()
    return existing


def revoke_permission(user_id, permission_name, revoked_by_id=None):
    """
    Revoke a permission from a user.

    Args:
        user_id: The user losing the permission
        permission_name: The permission to revoke
        revoked_by_id: The admin revoking the permission

    Returns:
        bool: True if permission was revoked
    """
    perm = AdminPermission.query.filter_by(
        user_id=user_id,
        permission_name=permission_name,
        is_active=True
    ).first()

    if perm:
        perm.revoke(revoked_by_id)
        db.session.commit()
        return True

    return False


def grant_default_permissions(user_id, role, granted_by_id=None):
    """
    Grant default permissions based on role.

    Args:
        user_id: The user receiving permissions
        role: 'admin' or 'superadmin'
        granted_by_id: The admin granting the permissions

    Returns:
        list: List of granted permissions
    """
    if role not in DEFAULT_ROLE_PERMISSIONS:
        return []

    granted = []
    for perm_name in DEFAULT_ROLE_PERMISSIONS[role]:
        perm = grant_permission(user_id, perm_name, granted_by_id)
        granted.append(perm)

    return granted


def create_default_roles():
    """Create default admin roles if they don't exist"""
    default_roles = [
        {
            'name': 'support_agent',
            'display_name': 'Support Agent',
            'description': 'Can handle support tickets and view user information',
            'permissions': ['view_users', 'view_tickets', 'respond_tickets', 'close_tickets'],
            'level': 1,
            'is_system': True
        },
        {
            'name': 'content_manager',
            'display_name': 'Content Manager',
            'description': 'Can manage blog posts, webinars, and educational content',
            'permissions': ['manage_blog', 'manage_webinars', 'manage_resources'],
            'level': 1,
            'is_system': True
        },
        {
            'name': 'financial_admin',
            'display_name': 'Financial Administrator',
            'description': 'Can manage payments and payouts',
            'permissions': [
                'view_payments', 'process_refunds',
                'view_payouts', 'approve_payouts', 'process_payouts'
            ],
            'level': 2,
            'is_system': True
        },
        {
            'name': 'admin',
            'display_name': 'Administrator',
            'description': 'Full admin access except platform settings',
            'permissions': DEFAULT_ROLE_PERMISSIONS['admin'],
            'level': 5,
            'is_system': True
        },
        {
            'name': 'superadmin',
            'display_name': 'Super Administrator',
            'description': 'Full platform access including system settings',
            'permissions': list(ALL_PERMISSIONS.keys()),
            'level': 10,
            'is_system': True
        }
    ]

    created = []
    for role_data in default_roles:
        existing = AdminRole.query.filter_by(name=role_data['name']).first()
        if not existing:
            role = AdminRole(**role_data)
            db.session.add(role)
            created.append(role)

    if created:
        db.session.commit()

    return created
