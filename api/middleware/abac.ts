/**
 * ABAC (Attribute-Based Access Control) Middleware
 * Provides attribute-based authorization for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index';
import { users, organizations, products, permissions, permissionAuditLog } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkUserPermission } from './rbac';

// Extend Request interface to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    organizationId?: string;
    [key: string]: any;
  };
}

// ABAC Context interface
export interface ABACContext {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    attributes: Record<string, any>;
  };
  resource: {
    id?: string;
    type: string;
    ownerId?: string;
    organizationId?: string;
    attributes: Record<string, any>;
  };
  environment: {
    time: Date;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    attributes: Record<string, any>;
  };
  action: {
    type: string;
    attributes: Record<string, any>;
  };
}

// ABAC Policy interface
export interface ABACPolicy {
  id: string;
  name: string;
  description?: string;
  target: {
    subjects?: PolicyCondition[];
    resources?: PolicyCondition[];
    actions?: PolicyCondition[];
    environment?: PolicyCondition[];
  };
  condition?: PolicyCondition;
  effect: 'permit' | 'deny';
  obligations?: PolicyObligation[];
}

// Policy condition interface
export interface PolicyCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'matches';
  value: any;
  function?: string; // For custom functions
}

// Policy obligation interface
export interface PolicyObligation {
  type: 'log' | 'notify' | 'encrypt' | 'custom';
  parameters: Record<string, any>;
}

/**
 * ABAC Authorization Middleware Factory
 * Creates middleware that evaluates ABAC policies for authorization
 */
export const requireABACPermission = (
  resourceType: string,
  actionType: string,
  options: {
    resourceIdParam?: string;
    contextBuilder?: (req: AuthenticatedRequest) => Promise<Partial<ABACContext>>;
    policies?: ABACPolicy[];
    auditLog?: boolean;
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

      // Build ABAC context
      const context = await buildABACContextInternal(req, resourceType, actionType, options);
      
      // Evaluate ABAC policies
      const decision = await evaluateABACPoliciesInternal(context, options.policies);
      
      // Log the decision if audit logging is enabled
      if (options.auditLog !== false) {
        await logPermissionDecision(context, decision);
      }
      
      if (!decision.permit) {
        res.status(403).json({ 
          success: false, 
          error: 'Access denied by policy',
          reason: decision.reason,
          obligations: decision.obligations
        });
        return;
      }
      
      // Execute any permit obligations
      if (decision.obligations) {
        await executeObligations(decision.obligations, context);
      }
      
      // Add context to request for downstream use
      (req as any).abacContext = context;
      (req as any).abacDecision = decision;
      
      next();
    } catch (error) {
      console.error('ABAC authorization error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authorization evaluation failed' 
      });
    }
  };
};

/**
 * Build ABAC context from request
 */
const buildABACContextInternal = async (
  req: AuthenticatedRequest,
  resourceType: string,
  actionType: string,
  options: {
    resourceIdParam?: string;
    contextBuilder?: (req: AuthenticatedRequest) => Promise<Partial<ABACContext>>;
  } = {}
): Promise<ABACContext> => {
  const userId = req.user!.id || req.user!.sub;
  
  // Get user details from database
  const userDetails = await db
    .select({
      user: users,
      organization: organizations
    })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.authId, userId))
    .limit(1);
  
  const userRecord = userDetails[0];
  
  // Build base context
  let context: ABACContext = {
    user: {
      id: userId,
      email: req.user!.email,
      role: userRecord?.user.role || req.user!.role || 'consumer',
      organizationId: userRecord?.user.organizationId || undefined,
      attributes: {
        isVerified: (userRecord?.user as any)?.isVerified || false,
        status: userRecord?.user.status || 'active',
        organizationType: userRecord?.organization?.type || null,
        organizationVerified: (userRecord?.organization as any)?.isVerified || false,
        ...(userRecord?.user as any)?.metadata || {}
      }
    },
    resource: {
      type: resourceType,
      attributes: {}
    },
    environment: {
      time: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      attributes: {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers
      }
    },
    action: {
      type: actionType,
      attributes: {
        method: req.method,
        endpoint: req.path
      }
    }
  };
  
  // Get resource details if resource ID is provided
  if (options.resourceIdParam && req.params[options.resourceIdParam]) {
    const resourceId = req.params[options.resourceIdParam];
    context.resource.id = resourceId;
    
    // Fetch resource details based on type
    const resourceDetails = await getResourceDetails(resourceType, resourceId);
    if (resourceDetails) {
      context.resource = { ...context.resource, ...resourceDetails };
    }
  }
  
  // Apply custom context builder if provided
  if (options.contextBuilder) {
    const customContext = await options.contextBuilder(req);
    context = { ...context, ...customContext };
  }
  
  return context;
};

/**
 * Evaluate ABAC policies against context
 */
const evaluateABACPoliciesInternal = async (
  context: ABACContext,
  customPolicies?: ABACPolicy[]
): Promise<{
  permit: boolean;
  reason?: string;
  obligations?: PolicyObligation[];
  appliedPolicies: string[];
}> => {
  // Get applicable policies (custom + default)
  const policies = [...(customPolicies || []), ...getDefaultPolicies()];
  
  const appliedPolicies: string[] = [];
  const obligations: PolicyObligation[] = [];
  
  // Evaluate each policy
  for (const policy of policies) {
    if (await isPolicyApplicable(policy, context)) {
      appliedPolicies.push(policy.name);
      
      // Check policy condition
      const conditionMet = policy.condition ? 
        await evaluateCondition(policy.condition, context) : true;
      
      if (conditionMet) {
        // Add obligations
        if (policy.obligations) {
          obligations.push(...policy.obligations);
        }
        
        // Return decision based on effect
        if (policy.effect === 'deny') {
          return {
            permit: false,
            reason: `Denied by policy: ${policy.name}`,
            appliedPolicies,
            obligations
          };
        } else if (policy.effect === 'permit') {
          return {
            permit: true,
            appliedPolicies,
            obligations
          };
        }
      }
    }
  }
  
  // Default deny if no permit policy matched
  return {
    permit: false,
    reason: 'No applicable permit policy found',
    appliedPolicies
  };
};

/**
 * Check if policy is applicable to context
 */
const isPolicyApplicable = async (
  policy: ABACPolicy,
  context: ABACContext
): Promise<boolean> => {
  // Check subject conditions
  if (policy.target.subjects) {
    const subjectMatch = await evaluateConditions(policy.target.subjects, {
      ...context.user,
      ...context.user.attributes
    });
    if (!subjectMatch) return false;
  }
  
  // Check resource conditions
  if (policy.target.resources) {
    const resourceMatch = await evaluateConditions(policy.target.resources, {
      ...context.resource,
      ...context.resource.attributes
    });
    if (!resourceMatch) return false;
  }
  
  // Check action conditions
  if (policy.target.actions) {
    const actionMatch = await evaluateConditions(policy.target.actions, {
      ...context.action,
      ...context.action.attributes
    });
    if (!actionMatch) return false;
  }
  
  // Check environment conditions
  if (policy.target.environment) {
    const envMatch = await evaluateConditions(policy.target.environment, {
      ...context.environment,
      ...context.environment.attributes
    });
    if (!envMatch) return false;
  }
  
  return true;
};

/**
 * Evaluate multiple conditions (AND logic)
 */
const evaluateConditions = async (
  conditions: PolicyCondition[],
  attributes: Record<string, any>
): Promise<boolean> => {
  for (const condition of conditions) {
    if (!await evaluateCondition(condition, attributes)) {
      return false;
    }
  }
  return true;
};

/**
 * Evaluate single condition
 */
const evaluateCondition = async (
  condition: PolicyCondition,
  attributes: Record<string, any> | ABACContext
): Promise<boolean> => {
  const attributeValue = getAttributeValue(condition.attribute, attributes);
  
  switch (condition.operator) {
    case 'eq':
      return attributeValue === condition.value;
    case 'ne':
      return attributeValue !== condition.value;
    case 'gt':
      return attributeValue > condition.value;
    case 'lt':
      return attributeValue < condition.value;
    case 'gte':
      return attributeValue >= condition.value;
    case 'lte':
      return attributeValue <= condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(attributeValue);
    case 'contains':
      return Array.isArray(attributeValue) && attributeValue.includes(condition.value);
    case 'matches':
      return new RegExp(condition.value).test(String(attributeValue));
    default:
      console.warn(`Unknown condition operator: ${condition.operator}`);
      return false;
  }
};

/**
 * Get attribute value from context using dot notation
 */
const getAttributeValue = (path: string, context: any): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], context);
};

/**
 * Get resource details by type and ID
 */
const getResourceDetails = async (
  resourceType: string,
  resourceId: string
): Promise<Partial<ABACContext['resource']> | null> => {
  try {
    switch (resourceType) {
      case 'user':
        const user = await db.select().from(users).where(eq(users.id, resourceId)).limit(1);
        return user[0] ? {
          ownerId: user[0].id,
          organizationId: user[0].organizationId || undefined,
          attributes: {
            role: user[0].role,
            status: user[0].status,
            isVerified: (user[0] as any).isVerified,
            ...(user[0] as any).metadata || {}
          }
        } : null;
        
      case 'product':
        const product = await db.select().from(products).where(eq(products.id, resourceId)).limit(1);
        return product[0] ? {
          ownerId: product[0].currentOwnerId,
          organizationId: product[0].manufacturerId,
          attributes: {
            category: product[0].category,
            status: product[0].status,
            price: product[0].price,
            ...(product[0] as any).metadata || {}
          }
        } : null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${resourceType} details:`, error);
    return null;
  }
};

/**
 * Get default ABAC policies
 */
const getDefaultPolicies = (): ABACPolicy[] => {
  return [
    // Super admin can do everything
    {
      id: 'super-admin-all',
      name: 'Super Admin Full Access',
      description: 'Super admins have full access to all resources',
      target: {
        subjects: [{ attribute: 'role', operator: 'eq', value: 'super_admin' }]
      },
      effect: 'permit'
    },
    
    // Users can read their own data
    {
      id: 'user-self-read',
      name: 'User Self Read Access',
      description: 'Users can read their own data',
      target: {
        subjects: [{ attribute: 'id', operator: 'eq', value: '${resource.ownerId}' }],
        actions: [{ attribute: 'type', operator: 'eq', value: 'read' }]
      },
      effect: 'permit'
    },
    
    // Organization members can read organization data
    {
      id: 'org-member-read',
      name: 'Organization Member Read Access',
      description: 'Organization members can read organization data',
      target: {
        subjects: [{ attribute: 'organizationId', operator: 'eq', value: '${resource.organizationId}' }],
        actions: [{ attribute: 'type', operator: 'eq', value: 'read' }]
      },
      condition: {
        attribute: 'user.organizationId',
        operator: 'eq',
        value: '${resource.organizationId}'
      },
      effect: 'permit'
    },
    
    // Auditors can read audit logs
    {
      id: 'auditor-audit-read',
      name: 'Auditor Audit Log Access',
      description: 'Auditors can read audit logs',
      target: {
        subjects: [{ attribute: 'role', operator: 'eq', value: 'auditor' }],
        resources: [{ attribute: 'type', operator: 'eq', value: 'audit_log' }],
        actions: [{ attribute: 'type', operator: 'eq', value: 'read' }]
      },
      effect: 'permit',
      obligations: [
        {
          type: 'log',
          parameters: {
            message: 'Auditor accessed audit logs',
            level: 'info'
          }
        }
      ]
    }
  ];
};

/**
 * Execute policy obligations
 */
const executeObligations = async (
  obligations: PolicyObligation[],
  context: ABACContext
): Promise<void> => {
  for (const obligation of obligations) {
    try {
      switch (obligation.type) {
        case 'log':
          console.log(`ABAC Obligation: ${obligation.parameters.message}`, {
            user: context.user.id,
            resource: context.resource.type,
            action: context.action.type,
            timestamp: context.environment.time
          });
          break;
          
        case 'notify':
          // Implement notification logic
          console.log('ABAC Notification obligation:', obligation.parameters);
          break;
          
        case 'encrypt':
          // Implement encryption obligation
          console.log('ABAC Encryption obligation:', obligation.parameters);
          break;
          
        default:
          console.warn(`Unknown obligation type: ${obligation.type}`);
      }
    } catch (error) {
      console.error('Error executing obligation:', error);
    }
  }
};

/**
 * Log permission decision for audit
 */
const logPermissionDecision = async (
  context: ABACContext,
  decision: { permit: boolean; reason?: string; appliedPolicies: string[] }
): Promise<void> => {
  try {
    await db.insert(permissionAuditLog).values({
      userId: context.user.id,
      action: `${context.action.type}_${context.resource.type}`,
      resource: context.resource.type,
      resourceId: context.resource.id,
      permission: `${context.action.type}:${context.resource.type}`,
      result: decision.permit ? 'granted' : 'denied',
      context: {
        policies: decision.appliedPolicies,
        userRole: context.user.role,
        resourceOwner: context.resource.ownerId,
        ipAddress: context.environment.ipAddress,
        userAgent: context.environment.userAgent
      },
      reason: decision.reason,
      timestamp: context.environment.time
    });
  } catch (error) {
    console.error('Error logging permission decision:', error);
  }
};

// Export utility functions
export {
  buildABACContextInternal as buildABACContext,
  evaluateABACPoliciesInternal as evaluateABACPolicies,
  evaluateCondition
};