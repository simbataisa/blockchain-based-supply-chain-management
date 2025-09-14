/**
 * RBAC (Role-Based Access Control) Middleware
 * Provides role-based authorization for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index';
import { users, roles, permissions, userRoles, rolePermissions, userPermissions, resourceTypeEnum, permissionTypeEnum } from '../../src/db/schema';
import { eq, and, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    sub?: string;
    [key: string]: any;
  };
}

// Permission check result interface
interface PermissionResult {
  granted: boolean;
  reason?: string;
  conditions?: any;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and extracts user information
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.AUTH0_CLIENT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ 
        success: false, 
        error: 'JWT secret not configured' 
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Extract user information from token
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded['https://supplychain.app/role'] || decoded.role,
      sub: decoded.sub,
      ...decoded
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * RBAC Authorization Middleware Factory
 * Creates middleware that checks if user has required permissions
 */
export const requirePermission = (
  resource: string,
  action: string,
  options: {
    allowSelf?: boolean; // Allow users to access their own resources
    resourceIdParam?: string; // Parameter name for resource ID (e.g., 'userId', 'productId')
    conditions?: (req: AuthenticatedRequest) => any; // Additional conditions
  } = {}
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const userId = req.user.id || req.user.sub;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid user token' 
        });
        return;
      }

      // Check if user is accessing their own resource
      if (options.allowSelf && options.resourceIdParam) {
        const resourceId = req.params[options.resourceIdParam];
        if (resourceId === userId) {
          next();
          return;
        }
      }

      // Check user permissions
      const hasPermission = await checkUserPermission(
        userId,
        resource,
        action,
        options.conditions ? options.conditions(req) : undefined
      );

      if (!hasPermission.granted) {
        res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions',
          details: hasPermission.reason 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC authorization error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authorization check failed' 
      });
    }
  };
};

/**
 * Role-based Authorization Middleware Factory
 * Creates middleware that checks if user has required roles
 */
export const requireRole = (
  requiredRoles: string | string[],
  options: {
    requireAll?: boolean; // Require all roles (AND) vs any role (OR)
  } = {}
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const userId = req.user.id || req.user.sub;
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      const userRolesList = await getUserRoles(userId);
      const userRoleNames = userRolesList.map(r => r.name);

      const hasRole = options.requireAll
        ? rolesArray.every(role => userRoleNames.includes(role))
        : rolesArray.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        res.status(403).json({ 
          success: false, 
          error: 'Insufficient role permissions',
          required: rolesArray,
          current: userRoleNames
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Role check failed' 
      });
    }
  };
};

/**
 * Check if user has specific permission
 */
export const checkUserPermission = async (
  userId: string,
  resource: string,
  action: string,
  context?: any
): Promise<PermissionResult> => {
  try {
    // Get user's direct permissions
    const directPermissions = await db
      .select({
        permission: permissions,
        userPermission: userPermissions
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(permissions.id, userPermissions.permissionId))
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.isActive, true),
          eq(permissions.resource, resource as any),
          eq(permissions.action, action as any),
          eq(permissions.isActive, true)
        )
      );

    // Check direct permissions first
    for (const perm of directPermissions) {
      if (perm.userPermission.isGranted) {
        // Check conditions if any
        if (perm.permission.conditions || perm.userPermission.conditions) {
          const conditionsMet = await evaluateConditions(
            perm.permission.conditions || perm.userPermission.conditions,
            context,
            userId
          );
          if (conditionsMet) {
            return { granted: true, conditions: perm.userPermission.conditions };
          }
        } else {
          return { granted: true };
        }
      } else {
        // Explicit denial
        return { 
          granted: false, 
          reason: 'Permission explicitly denied' 
        };
      }
    }

    // Get user's role-based permissions
    const roleBasedPermissions = await db
      .select({
        permission: permissions,
        rolePermission: rolePermissions,
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(rolePermissions.isActive, true),
          eq(permissions.resource, resource as any),
          eq(permissions.action, action as any),
          eq(permissions.isActive, true),
          eq(roles.isActive, true)
        )
      );

    // Check role-based permissions
    for (const perm of roleBasedPermissions) {
      // Check conditions if any
      if (perm.permission.conditions || perm.rolePermission.conditions) {
        const conditionsMet = await evaluateConditions(
          perm.permission.conditions || perm.rolePermission.conditions,
          context,
          userId
        );
        if (conditionsMet) {
          return { granted: true, conditions: perm.rolePermission.conditions };
        }
      } else {
        return { granted: true };
      }
    }

    return { 
      granted: false, 
      reason: `No permission found for ${action} on ${resource}` 
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return { 
      granted: false, 
      reason: 'Permission check failed' 
    };
  }
};

/**
 * Get user's roles
 */
export const getUserRoles = async (userId: string) => {
  try {
    const userRolesList = await db
      .select({
        role: roles,
        userRole: userRoles
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true)
        )
      );

    return userRolesList.map(ur => ur.role);
  } catch (error) {
    console.error('Get user roles error:', error);
    return [];
  }
};

/**
 * Get user's permissions (both direct and role-based)
 */
export const getUserPermissions = async (userId: string) => {
  try {
    // Get direct permissions
    const directPerms = await db
      .select({
        permission: permissions,
        userPermission: userPermissions
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(permissions.id, userPermissions.permissionId))
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.isActive, true),
          eq(userPermissions.isGranted, true),
          eq(permissions.isActive, true)
        )
      );

    // Get role-based permissions
    const rolePerms = await db
      .select({
        permission: permissions,
        rolePermission: rolePermissions
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(rolePermissions.isActive, true),
          eq(permissions.isActive, true)
        )
      );

    // Combine and deduplicate permissions
    const allPermissions = [...directPerms, ...rolePerms];
    const uniquePermissions = allPermissions.filter(
      (perm, index, self) => 
        index === self.findIndex(p => p.permission.id === perm.permission.id)
    );

    return uniquePermissions.map(p => p.permission);
  } catch (error) {
    console.error('Get user permissions error:', error);
    return [];
  }
};

/**
 * Evaluate permission conditions
 */
const evaluateConditions = async (
  conditions: any,
  context: any,
  userId: string
): Promise<boolean> => {
  if (!conditions) return true;

  try {
    // Simple condition evaluation
    // This can be extended to support complex condition logic
    if (typeof conditions === 'object') {
      // Example: { "organization_id": "${user.organization_id}" }
      for (const [key, value] of Object.entries(conditions)) {
        if (typeof value === 'string' && value.startsWith('${')) {
          // Variable substitution
          const variable = value.slice(2, -1); // Remove ${ and }
          if (variable === 'user.id' && context?.userId !== userId) {
            return false;
          }
          // Add more variable substitutions as needed
        } else if (context && context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
};

// Predefined permission constants
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: { resource: 'user', action: 'create' },
  USER_READ: { resource: 'user', action: 'read' },
  USER_UPDATE: { resource: 'user', action: 'update' },
  USER_DELETE: { resource: 'user', action: 'delete' },
  
  // Product permissions
  PRODUCT_CREATE: { resource: 'product', action: 'create' },
  PRODUCT_READ: { resource: 'product', action: 'read' },
  PRODUCT_UPDATE: { resource: 'product', action: 'update' },
  PRODUCT_DELETE: { resource: 'product', action: 'delete' },
  
  // Transaction permissions
  TRANSACTION_CREATE: { resource: 'transaction', action: 'create' },
  TRANSACTION_READ: { resource: 'transaction', action: 'read' },
  TRANSACTION_UPDATE: { resource: 'transaction', action: 'update' },
  TRANSACTION_APPROVE: { resource: 'transaction', action: 'approve' },
  
  // Organization permissions
  ORGANIZATION_CREATE: { resource: 'organization', action: 'create' },
  ORGANIZATION_READ: { resource: 'organization', action: 'read' },
  ORGANIZATION_UPDATE: { resource: 'organization', action: 'update' },
  ORGANIZATION_DELETE: { resource: 'organization', action: 'delete' },
  
  // System permissions
  SYSTEM_ADMIN: { resource: 'system', action: 'execute' },
  AUDIT_READ: { resource: 'audit_log', action: 'read' },
} as const;

// Predefined role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  MANUFACTURER: 'manufacturer',
  DISTRIBUTOR: 'distributor',
  RETAILER: 'retailer',
  AUDITOR: 'auditor',
  CONSUMER: 'consumer',
} as const;