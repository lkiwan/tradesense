"""
Admin Permissions API Routes
Manage RBAC (Role-Based Access Control) for admin users
"""

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from models import (
    db, User,
    AdminPermission, AdminRole, UserAdminRole,
    PERMISSION_CATEGORIES, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS,
    has_permission, get_user_permissions, grant_permission, revoke_permission,
    grant_default_permissions, create_default_roles,
    AuditLog
)
from utils.decorators import permission_required, superadmin_required, admin_required

admin_permissions_bp = Blueprint('admin_permissions', __name__, url_prefix='/api/admin/permissions')


# ==================== Permission Info Routes ====================

@admin_permissions_bp.route('/categories', methods=['GET'])
@admin_required
def get_permission_categories():
    """Get all available permission categories and permissions"""
    return jsonify({
        'categories': PERMISSION_CATEGORIES,
        'all_permissions': ALL_PERMISSIONS,
        'default_role_permissions': DEFAULT_ROLE_PERMISSIONS
    }), 200


@admin_permissions_bp.route('/my-permissions', methods=['GET'])
@admin_required
def get_my_permissions():
    """Get current user's permissions"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    permissions = get_user_permissions(current_user_id)

    # Get user's roles
    user_roles = UserAdminRole.query.filter_by(user_id=current_user_id).all()
    roles = [ur.role.to_dict() for ur in user_roles if ur.role]

    # Get individual permissions
    individual_perms = AdminPermission.query.filter_by(
        user_id=current_user_id,
        is_active=True
    ).all()

    return jsonify({
        'user_id': current_user_id,
        'username': user.username,
        'role': user.role,
        'is_superadmin': user.role == 'superadmin',
        'permissions': list(permissions),
        'roles': roles,
        'individual_permissions': [p.to_dict() for p in individual_perms]
    }), 200


# ==================== User Permission Management ====================

@admin_permissions_bp.route('/users/<int:user_id>', methods=['GET'])
@permission_required('manage_permissions')
def get_user_permissions_detail(user_id):
    """Get detailed permissions for a specific user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'User is not an admin'}), 400

    permissions = get_user_permissions(user_id)

    # Get user's roles
    user_roles = UserAdminRole.query.filter_by(user_id=user_id).all()
    roles = [ur.to_dict() for ur in user_roles]

    # Get individual permissions with details
    individual_perms = AdminPermission.query.filter_by(user_id=user_id).all()

    return jsonify({
        'user': user.to_dict(),
        'all_permissions': list(permissions),
        'roles': roles,
        'individual_permissions': [p.to_dict() for p in individual_perms],
        'is_superadmin': user.role == 'superadmin'
    }), 200


@admin_permissions_bp.route('/users/<int:user_id>/grant', methods=['POST'])
@permission_required('manage_permissions')
def grant_user_permission(user_id):
    """Grant a permission to a user"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    permission_name = data.get('permission')
    expires_at_str = data.get('expires_at')
    notes = data.get('notes')

    if not permission_name:
        return jsonify({'error': 'Permission name is required'}), 400

    if permission_name not in ALL_PERMISSIONS:
        return jsonify({
            'error': f'Unknown permission: {permission_name}',
            'available_permissions': list(ALL_PERMISSIONS.keys())
        }), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'User must be an admin to receive permissions'}), 400

    # Parse expiration date if provided
    expires_at = None
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid expires_at format. Use ISO format.'}), 400

    try:
        perm = grant_permission(
            user_id=user_id,
            permission_name=permission_name,
            granted_by_id=current_user_id,
            expires_at=expires_at,
            notes=notes
        )

        # Log the action
        AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='permission_granted',
            user_id=current_user_id,
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Granted permission: {permission_name}',
            new_value={'permission': permission_name, 'expires_at': expires_at_str}
        )

        return jsonify({
            'message': f'Permission {permission_name} granted to {user.username}',
            'permission': perm.to_dict()
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_permissions_bp.route('/users/<int:user_id>/revoke', methods=['POST'])
@permission_required('manage_permissions')
def revoke_user_permission(user_id):
    """Revoke a permission from a user"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    permission_name = data.get('permission')

    if not permission_name:
        return jsonify({'error': 'Permission name is required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    success = revoke_permission(
        user_id=user_id,
        permission_name=permission_name,
        revoked_by_id=current_user_id
    )

    if success:
        # Log the action
        AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='permission_revoked',
            user_id=current_user_id,
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Revoked permission: {permission_name}'
        )

        return jsonify({
            'message': f'Permission {permission_name} revoked from {user.username}'
        }), 200
    else:
        return jsonify({
            'error': f'Permission {permission_name} not found or already revoked'
        }), 404


@admin_permissions_bp.route('/users/<int:user_id>/grant-defaults', methods=['POST'])
@permission_required('manage_permissions')
def grant_user_default_permissions(user_id):
    """Grant default permissions based on user's role"""
    current_user_id = int(get_jwt_identity())

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'User must be an admin'}), 400

    granted = grant_default_permissions(
        user_id=user_id,
        role=user.role,
        granted_by_id=current_user_id
    )

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='default_permissions_granted',
        user_id=current_user_id,
        target_type='user',
        target_id=user_id,
        target_name=user.username,
        description=f'Granted {len(granted)} default permissions for role: {user.role}'
    )

    return jsonify({
        'message': f'Granted {len(granted)} default permissions to {user.username}',
        'permissions': [p.to_dict() for p in granted]
    }), 200


@admin_permissions_bp.route('/users/<int:user_id>/bulk', methods=['POST'])
@permission_required('manage_permissions')
def bulk_update_permissions(user_id):
    """Bulk update permissions for a user (grant multiple, revoke multiple)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    permissions_to_grant = data.get('grant', [])
    permissions_to_revoke = data.get('revoke', [])

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'User must be an admin'}), 400

    granted = []
    revoked = []
    errors = []

    # Grant permissions
    for perm_name in permissions_to_grant:
        if perm_name not in ALL_PERMISSIONS:
            errors.append(f'Unknown permission: {perm_name}')
            continue
        try:
            perm = grant_permission(user_id, perm_name, current_user_id)
            granted.append(perm_name)
        except Exception as e:
            errors.append(f'Failed to grant {perm_name}: {str(e)}')

    # Revoke permissions
    for perm_name in permissions_to_revoke:
        if revoke_permission(user_id, perm_name, current_user_id):
            revoked.append(perm_name)

    # Log the action
    if granted or revoked:
        AuditLog.log(
            action_type=AuditLog.ACTION_TYPE_ADMIN,
            action='bulk_permissions_update',
            user_id=current_user_id,
            target_type='user',
            target_id=user_id,
            target_name=user.username,
            description=f'Bulk update: granted {len(granted)}, revoked {len(revoked)}',
            new_value={'granted': granted, 'revoked': revoked}
        )

    return jsonify({
        'message': 'Bulk permission update completed',
        'granted': granted,
        'revoked': revoked,
        'errors': errors if errors else None,
        'current_permissions': list(get_user_permissions(user_id))
    }), 200


# ==================== Role Management ====================

@admin_permissions_bp.route('/roles', methods=['GET'])
@admin_required
def get_all_roles():
    """Get all available admin roles"""
    roles = AdminRole.query.order_by(AdminRole.level.desc()).all()
    return jsonify({
        'roles': [r.to_dict() for r in roles]
    }), 200


@admin_permissions_bp.route('/roles', methods=['POST'])
@permission_required('manage_permissions')
def create_role():
    """Create a new admin role"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    name = data.get('name')
    display_name = data.get('display_name')
    description = data.get('description')
    permissions = data.get('permissions', [])
    level = data.get('level', 1)

    if not name or not display_name:
        return jsonify({'error': 'name and display_name are required'}), 400

    # Validate permissions
    invalid_perms = [p for p in permissions if p not in ALL_PERMISSIONS]
    if invalid_perms:
        return jsonify({
            'error': f'Invalid permissions: {", ".join(invalid_perms)}'
        }), 400

    # Check if role already exists
    if AdminRole.query.filter_by(name=name).first():
        return jsonify({'error': f'Role {name} already exists'}), 400

    role = AdminRole(
        name=name,
        display_name=display_name,
        description=description,
        permissions=permissions,
        level=level,
        is_system=False
    )

    db.session.add(role)
    db.session.commit()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='role_created',
        user_id=current_user_id,
        target_type='role',
        target_id=role.id,
        target_name=role.name,
        description=f'Created role: {display_name}',
        new_value=role.to_dict()
    )

    return jsonify({
        'message': f'Role {display_name} created',
        'role': role.to_dict()
    }), 201


@admin_permissions_bp.route('/roles/<int:role_id>', methods=['PUT'])
@permission_required('manage_permissions')
def update_role(role_id):
    """Update an admin role"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    role = AdminRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404

    if role.is_system:
        return jsonify({'error': 'Cannot modify system roles'}), 400

    old_value = role.to_dict()

    if 'display_name' in data:
        role.display_name = data['display_name']
    if 'description' in data:
        role.description = data['description']
    if 'permissions' in data:
        # Validate permissions
        invalid_perms = [p for p in data['permissions'] if p not in ALL_PERMISSIONS]
        if invalid_perms:
            return jsonify({
                'error': f'Invalid permissions: {", ".join(invalid_perms)}'
            }), 400
        role.permissions = data['permissions']
    if 'level' in data:
        role.level = data['level']
    if 'is_active' in data:
        role.is_active = data['is_active']

    db.session.commit()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='role_updated',
        user_id=current_user_id,
        target_type='role',
        target_id=role.id,
        target_name=role.name,
        description=f'Updated role: {role.display_name}',
        old_value=old_value,
        new_value=role.to_dict()
    )

    return jsonify({
        'message': f'Role {role.display_name} updated',
        'role': role.to_dict()
    }), 200


@admin_permissions_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@permission_required('manage_permissions')
def delete_role(role_id):
    """Delete an admin role"""
    current_user_id = int(get_jwt_identity())

    role = AdminRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404

    if role.is_system:
        return jsonify({'error': 'Cannot delete system roles'}), 400

    role_name = role.display_name
    role_data = role.to_dict()

    # Remove all user assignments first
    UserAdminRole.query.filter_by(role_id=role_id).delete()

    db.session.delete(role)
    db.session.commit()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='role_deleted',
        user_id=current_user_id,
        target_type='role',
        target_id=role_id,
        target_name=role_name,
        description=f'Deleted role: {role_name}',
        old_value=role_data
    )

    return jsonify({
        'message': f'Role {role_name} deleted'
    }), 200


# ==================== User Role Assignment ====================

@admin_permissions_bp.route('/users/<int:user_id>/roles', methods=['GET'])
@permission_required('manage_permissions')
def get_user_roles(user_id):
    """Get all roles assigned to a user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_roles = UserAdminRole.query.filter_by(user_id=user_id).all()

    return jsonify({
        'user': user.to_dict(),
        'roles': [ur.to_dict() for ur in user_roles]
    }), 200


@admin_permissions_bp.route('/users/<int:user_id>/roles', methods=['POST'])
@permission_required('manage_permissions')
def assign_role_to_user(user_id):
    """Assign a role to a user"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    role_id = data.get('role_id')
    if not role_id:
        return jsonify({'error': 'role_id is required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'User must be an admin'}), 400

    role = AdminRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404

    if not role.is_active:
        return jsonify({'error': 'Role is not active'}), 400

    # Check if already assigned
    existing = UserAdminRole.query.filter_by(user_id=user_id, role_id=role_id).first()
    if existing:
        return jsonify({'error': 'Role already assigned to user'}), 400

    user_role = UserAdminRole(
        user_id=user_id,
        role_id=role_id,
        assigned_by=current_user_id
    )

    db.session.add(user_role)
    db.session.commit()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='role_assigned',
        user_id=current_user_id,
        target_type='user',
        target_id=user_id,
        target_name=user.username,
        description=f'Assigned role: {role.display_name}',
        new_value={'role_id': role_id, 'role_name': role.name}
    )

    return jsonify({
        'message': f'Role {role.display_name} assigned to {user.username}',
        'user_role': user_role.to_dict()
    }), 201


@admin_permissions_bp.route('/users/<int:user_id>/roles/<int:role_id>', methods=['DELETE'])
@permission_required('manage_permissions')
def remove_role_from_user(user_id, role_id):
    """Remove a role from a user"""
    current_user_id = int(get_jwt_identity())

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    role = AdminRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404

    user_role = UserAdminRole.query.filter_by(user_id=user_id, role_id=role_id).first()
    if not user_role:
        return jsonify({'error': 'User does not have this role'}), 404

    db.session.delete(user_role)
    db.session.commit()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_ADMIN,
        action='role_removed',
        user_id=current_user_id,
        target_type='user',
        target_id=user_id,
        target_name=user.username,
        description=f'Removed role: {role.display_name}',
        old_value={'role_id': role_id, 'role_name': role.name}
    )

    return jsonify({
        'message': f'Role {role.display_name} removed from {user.username}'
    }), 200


# ==================== Admin User List with Permissions ====================

@admin_permissions_bp.route('/admins', methods=['GET'])
@permission_required('manage_admins')
def get_all_admins_with_permissions():
    """Get all admin users with their permissions"""
    admins = User.query.filter(User.role.in_(['admin', 'superadmin'])).all()

    result = []
    for admin in admins:
        permissions = get_user_permissions(admin.id)
        user_roles = UserAdminRole.query.filter_by(user_id=admin.id).all()

        result.append({
            'user': admin.to_dict(),
            'permissions_count': len(permissions),
            'permissions': list(permissions),
            'roles': [ur.role.to_dict() for ur in user_roles if ur.role]
        })

    return jsonify({
        'admins': result,
        'total': len(result)
    }), 200


# ==================== Check Permission Endpoint ====================

@admin_permissions_bp.route('/check', methods=['POST'])
@admin_required
def check_permission():
    """Check if current user has specific permission(s)"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    permissions_to_check = data.get('permissions', [])
    if isinstance(permissions_to_check, str):
        permissions_to_check = [permissions_to_check]

    check_mode = data.get('mode', 'all')  # 'all' or 'any'

    results = {}
    for perm in permissions_to_check:
        results[perm] = has_permission(current_user_id, perm)

    if check_mode == 'all':
        has_access = all(results.values())
    else:
        has_access = any(results.values())

    return jsonify({
        'has_access': has_access,
        'mode': check_mode,
        'permissions': results
    }), 200


# ==================== Initialize Default Roles ====================

@admin_permissions_bp.route('/initialize', methods=['POST'])
@superadmin_required
def initialize_roles():
    """Initialize/recreate default roles (superadmin only)"""
    current_user_id = int(get_jwt_identity())

    created = create_default_roles()

    # Log the action
    AuditLog.log(
        action_type=AuditLog.ACTION_TYPE_SYSTEM,
        action='roles_initialized',
        user_id=current_user_id,
        description=f'Initialized {len(created)} default roles'
    )

    return jsonify({
        'message': f'Initialized {len(created)} default roles',
        'roles_created': [r.name for r in created]
    }), 200
