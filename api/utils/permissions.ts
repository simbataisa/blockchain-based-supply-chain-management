/**
 * Permission Utility Functions
 * Provides helper functions for checking permissions, roles, and access control
 */

import { db } from '../../src/db/index';
import { 
  users, 
  roles, 
  permissions, 
  rolePermissions, 
  userRoles, 
  userPermissions,
  organizations
} from '../../src/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import type { ABACContext } from '../middleware/abac';

// Types
export interface UserPermissionInfo {
  userId: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
  organizationType?: string;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  grantedBy?: 'role' | 'direct' | 'organization';
  context?: Record<string, any>;
}

/**
 * Check if user has a specific permission
 */
export const hasPermission = async (
  userId: string,
  permission: string,
  resourceId?: string
): Promise<PermissionCheckResult> => {
  try {
    // Get user's roles and direct permissions
    const userInfo = await getUserPermissionInfo(userId);
    
    if (!userInfo) {
      return {
        hasPermission: false,
        reason: 'User not found'
      };
    }
    
    // Check direct permissions first
    if (userInfo.permissions.includes(permission)) {
      return {
        hasPermission: true,
        grantedBy: 'direct',
        context: { userId, permission }
      };
    }
    
    // Check role-based permissions
    const rolePermissions = await getRolePermissions(userInfo.roles);
    if (rolePermissions.includes(permission)) {
      return {
        hasPermission: true,
        grantedBy: 'role',
        context: { userId, permission, roles: userInfo.roles }
      };
    }
    
    // Check organization-level permissions
    if (userInfo.organizationId) {
      const orgPermission = await checkOrganizationPermission(
        userInfo.organizationId,
        userInfo.organizationType || '',
        permission
      );
      
      if (orgPermission) {
        return {
          hasPermission: true,
          grantedBy: 'organization',
          context: { 
            userId, 
            permission, 
            organizationId: userInfo.organizationId,
            organizationType: userInfo.organizationType
          }
        };
      }
    }
    
    return {
      hasPermission: false,
      reason: 'Permission not granted through any mechanism'
    };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      hasPermission: false,
      reason: 'Error during permission check'
    };
  }
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = async (
  userId: string,
  permissions: string[],
  resourceId?: string
): Promise<PermissionCheckResult> => {
  for (const permission of permissions) {
    const result = await hasPermission(userId, permission, resourceId);
    if (result.hasPermission) {
      return result;
    }
  }
  
  return {
    hasPermission: false,
    reason: `None of the required permissions found: ${permissions.join(', ')}`
  };
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = async (
  userId: string,
  permissions: string[],
  resourceId?: string
): Promise<PermissionCheckResult> => {
  const results: PermissionCheckResult[] = [];
  
  for (const permission of permissions) {
    const result = await hasPermission(userId, permission, resourceId);
    results.push(result);
    
    if (!result.hasPermission) {
      return {
        hasPermission: false,
        reason: `Missing required permission: ${permission}`,
        context: { checkedPermissions: results }
      };
    }
  }
  
  return {
    hasPermission: true,
    grantedBy: 'role',
    context: { checkedPermissions: results }
  };
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (
  userId: string,
  roleName: string
): Promise<boolean> => {
  try {
    const userInfo = await getUserPermissionInfo(userId);
    return userInfo?.roles.includes(roleName) || false;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = async (
  userId: string,
  roleNames: string[]
): Promise<boolean> => {
  try {
    const userInfo = await getUserPermissionInfo(userId);
    if (!userInfo) return false;
    
    return roleNames.some(role => userInfo.roles.includes(role));
  } catch (error) {
    console.error('Error checking roles:', error);
    return false;
  }
};

/**
 * Check if user can access a specific resource
 */
export const canAccessResource = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string = 'read'
): Promise<PermissionCheckResult> => {
  try {
    // Check basic permission first
    const permission = `${action}:${resourceType}`;
    const basicCheck = await hasPermission(userId, permission, resourceId);
    
    if (basicCheck.hasPermission) {
      return basicCheck;
    }
    
    // Check resource ownership
    const isOwner = await isResourceOwner(userId, resourceType, resourceId);
    if (isOwner) {
      return {
        hasPermission: true,
        grantedBy: 'direct',
        reason: 'Resource owner',
        context: { userId, resourceType, resourceId, action }
      };
    }
    
    // Check organization access
    const orgAccess = await canAccessOrganizationResource(
      userId,
      resourceType,
      resourceId,
      action
    );
    
    if (orgAccess.hasPermission) {
      return orgAccess;
    }
    
    return {
      hasPermission: false,
      reason: 'No access to resource'
    };
  } catch (error) {
    console.error('Error checking resource access:', error);
    return {
      hasPermission: false,
      reason: 'Error during resource access check'
    };
  }
};

/**
 * Get user's complete permission information
 */
export const getUserPermissionInfo = async (
  userId: string
): Promise<UserPermissionInfo | null> => {
  try {
    // Get user details
    const userDetails = await db
      .select({
        user: users,
        organization: organizations
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!userDetails.length) {
      return null;
    }
    
    const userRecord = userDetails[0];
    
    // Get user roles
    const userRolesList = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userRecord.user.id));
    
    // Get direct permissions
    const directPermissions = await db
      .select({ permissionName: permissions.name })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userRecord.user.id));
    
    return {
      userId: userRecord.user.id,
      roles: userRolesList.map(r => r.roleName),
      permissions: directPermissions.map(p => p.permissionName),
      organizationId: userRecord.user.organizationId || undefined,
      organizationType: userRecord.organization?.type || undefined
    };
  } catch (error) {
    console.error('Error getting user permission info:', error);
    return null;
  }
};

/**
 * Get permissions for specific roles
 */
export const getRolePermissions = async (
  roleNames: string[]
): Promise<string[]> => {
  try {
    if (!roleNames.length) return [];
    
    const rolePerms = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(roles.name, roleNames));
    
    return rolePerms.map(p => p.permissionName);
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return [];
  }
};

/**
 * Check organization-level permissions
 */
const checkOrganizationPermission = async (
  organizationId: string,
  organizationType: string,
  permission: string
): Promise<boolean> => {
  // Define organization-level permissions
  const orgPermissions: Record<string, string[]> = {
    'manufacturer': [
      'create:product',
      'update:product',
      'read:product',
      'create:batch',
      'update:batch'
    ],
    'distributor': [
      'read:product',
      'update:product_location',
      'create:transfer',
      'read:transfer'
    ],
    'retailer': [
      'read:product',
      'update:product_status',
      'create:sale',
      'read:sale'
    ],
    'auditor': [
      'read:product',
      'read:transfer',
      'read:audit_log',
      'create:audit_report'
    ]
  };
  
  return orgPermissions[organizationType]?.includes(permission) || false;
};

/**
 * Check if user is the owner of a resource
 */
const isResourceOwner = async (
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> => {
  try {
    // Get user's internal ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    const internalUserId = user[0].id;
    
    switch (resourceType) {
      case 'user':
        return resourceId === internalUserId;
        
      case 'product':
        // Check if user's organization owns the product
        const userOrg = await db
          .select({ organizationId: users.organizationId })
          .from(users)
          .where(eq(users.id, internalUserId))
          .limit(1);
        
        if (!userOrg.length || !userOrg[0].organizationId) return false;
        
        // This would need to be implemented based on your product ownership logic
        // For now, return false as a placeholder
        return false;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
};

/**
 * Check if user can access organization resource
 */
const canAccessOrganizationResource = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<PermissionCheckResult> => {
  try {
    const userInfo = await getUserPermissionInfo(userId);
    
    if (!userInfo?.organizationId) {
      return {
        hasPermission: false,
        reason: 'User not associated with any organization'
      };
    }
    
    // Check if the resource belongs to the same organization
    // This would need to be implemented based on your resource structure
    // For now, return a basic check
    
    return {
      hasPermission: false,
      reason: 'Organization resource access not implemented'
    };
  } catch (error) {
    console.error('Error checking organization resource access:', error);
    return {
      hasPermission: false,
      reason: 'Error during organization resource access check'
    };
  }
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (
  userId: string,
  roleName: string
): Promise<boolean> => {
  try {
    // Get user's internal ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    // Get role ID
    const role = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (!role.length) return false;
    
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user[0].id),
          eq(userRoles.roleId, role[0].id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return true; // Already assigned
    }
    
    // Create assignment
    await db.insert(userRoles).values({
      userId: user[0].id,
      roleId: role[0].id
    });
    
    return true;
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return false;
  }
};

/**
 * Remove role from user
 */
export const removeRoleFromUser = async (
  userId: string,
  roleName: string
): Promise<boolean> => {
  try {
    // Get user's internal ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    // Get role ID
    const role = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (!role.length) return false;
    
    // Remove assignment
    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, user[0].id),
          eq(userRoles.roleId, role[0].id)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Error removing role from user:', error);
    return false;
  }
};

/**
 * Grant permission directly to user
 */
export const grantPermissionToUser = async (
  userId: string,
  permissionName: string
): Promise<boolean> => {
  try {
    // Get user's internal ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    // Get permission ID
    const permission = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.name, permissionName))
      .limit(1);
    
    if (!permission.length) return false;
    
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, user[0].id),
          eq(userPermissions.permissionId, permission[0].id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return true; // Already granted
    }
    
    // Create assignment
    await db.insert(userPermissions).values({
      userId: user[0].id,
      permissionId: permission[0].id
    });
    
    return true;
  } catch (error) {
    console.error('Error granting permission to user:', error);
    return false;
  }
};

/**
 * Revoke permission from user
 */
export const revokePermissionFromUser = async (
  userId: string,
  permissionName: string
): Promise<boolean> => {
  try {
    // Get user's internal ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, userId))
      .limit(1);
    
    if (!user.length) return false;
    
    // Get permission ID
    const permission = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.name, permissionName))
      .limit(1);
    
    if (!permission.length) return false;
    
    // Remove assignment
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, user[0].id),
          eq(userPermissions.permissionId, permission[0].id)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Error revoking permission from user:', error);
    return false;
  }
};

/**
 * Get all available permissions
 */
export const getAllPermissions = async (): Promise<Array<{ id: string; name: string; description?: string; }>> => {
  try {
    return await db.select().from(permissions);
  } catch (error) {
    console.error('Error getting all permissions:', error);
    return [];
  }
};

/**
 * Get all available roles
 */
export const getAllRoles = async (): Promise<Array<{ id: string; name: string; description?: string; }>> => {
  try {
    return await db.select().from(roles);
  } catch (error) {
    console.error('Error getting all roles:', error);
    return [];
  }
};