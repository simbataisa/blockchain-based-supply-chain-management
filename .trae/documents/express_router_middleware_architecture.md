# Express Router Middleware Architecture

## Overview

This document explains the Express Router class implementation and middleware chain architecture used in the blockchain supply chain management system. It covers how arguments are handled, processed, and executed through the router's middleware pipeline.

## Express Router Class Foundation

The Express Router class provides the core infrastructure for route management and middleware orchestration:

```typescript
export function Router(options?: RouterOptions): core.Router;
```

### Core Responsibilities

- **Route Registration**: Storing route patterns and their associated handlers
- **Request Matching**: Matching incoming requests to registered routes
- **Middleware Chain Management**: Executing middleware functions in sequence
- **Parameter Extraction**: Parsing URL parameters, query strings, and request bodies
- **Error Handling**: Propagating errors through the middleware chain

## Router Argument Handling

### Route Definition Structure

```typescript
router.get(
  "/admin/dashboard",           // Path argument
  authenticateToken,            // Middleware argument 1
  requireRole(['admin']),       // Middleware argument 2  
  requirePermission('admin_dashboard', 'read'), // Middleware argument 3
  async (req, res) => { ... }   // Final handler argument
);
```

### Internal Router Processing

```typescript
// Simplified Router internals
class Router {
  get(path: string, ...handlers: Function[]) {
    // Store route configuration
    this.routes.push({
      method: 'GET',
      path: path,
      handlers: handlers // All middleware + final handler
    });
  }
  
  // When request comes in
  handle(req, res, next) {
    const route = this.matchRoute(req.method, req.path);
    if (route) {
      this.executeHandlers(route.handlers, req, res, next);
    }
  }
}
```

## Middleware Chain Execution

The Router implements the middleware chain pattern:

```typescript
executeHandlers(handlers, req, res, finalNext) {
  let index = 0;
  
  function next(error?) {
    if (error) return finalNext(error);
    
    const handler = handlers[index++];
    if (!handler) return finalNext(); // No more handlers
    
    try {
      handler(req, res, next); // Pass 'next' to continue chain
    } catch (error) {
      finalNext(error);
    }
  }
  
  next(); // Start the chain
}
```

## Middleware Factory Pattern

Our authentication and authorization middleware use the factory pattern:

### 1. Authentication Middleware (Direct)

```typescript
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract and validate JWT token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  const decoded = jwt.verify(token, jwtSecret);
  req.user = {
    id: decoded.sub || decoded.id,
    email: decoded.email,
    role: decoded.role,
    ...decoded
  };
  
  next();
};
```

### 2. Role Authorization Middleware (Factory)

```typescript
export const requireRole = (
  requiredRoles: string | string[],
  options: { requireAll?: boolean } = {}
) => {
  return async (req, res, next) => { // Returns configured middleware
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRolesList = await getUserRoles(req.user.id);
    const userRoleNames = userRolesList.map(r => r.name);
    
    const hasRole = options.requireAll
      ? rolesArray.every(role => userRoleNames.includes(role))
      : rolesArray.some(role => userRoleNames.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient role permissions',
        required: rolesArray,
        current: userRoleNames
      });
    }
    
    next();
  };
};
```

### 3. Permission Authorization Middleware (Factory)

```typescript
export const requirePermission = (
  resource: string,
  action: string,
  options: {
    allowSelf?: boolean;
    resourceIdParam?: string;
    conditions?: (req: AuthenticatedRequest) => any;
  } = {}
) => {
  return async (req, res, next) => {
    // Check if user is accessing their own resource
    if (options.allowSelf && options.resourceIdParam) {
      const resourceId = req.params[options.resourceIdParam];
      if (resourceId === req.user.id) {
        return next();
      }
    }
    
    // Check user permissions
    const hasPermission = await checkUserPermission(
      req.user.id,
      resource,
      action,
      options.conditions ? options.conditions(req) : undefined
    );
    
    if (!hasPermission.granted) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions',
        details: hasPermission.reason 
      });
    }
    
    next();
  };
};
```

## Request Lifecycle

```
Incoming Request
       ↓
1. Router.handle(req, res, next)
       ↓
2. Route matching (path + method)
       ↓
3. Parameter extraction (req.params)
       ↓
4. Middleware chain execution
   - authenticateToken(req, res, next)
   - requireRole(['admin'])(req, res, next)
   - requirePermission('admin_dashboard', 'read')(req, res, next)
       ↓
5. Final handler execution
       ↓
6. Response sent or error handled
```

## Router vs Middleware Responsibilities

| **Express Router Class** | **Custom Middleware** |
|--------------------------|----------------------|
| Route pattern matching | Business logic implementation |
| Middleware chain orchestration | Authentication/authorization logic |
| Request/response object management | Database queries |
| Error handling propagation | Custom validation |
| Parameter parsing (req.params, req.query) | Response formatting |

## Advanced Router Features

### Parameter Handling

```typescript
router.get('/users/:userId', middleware, handler);
// Router automatically populates req.params.userId
```

### Router-Level Middleware

```typescript
const adminRouter = Router();
adminRouter.use(authenticateToken); // Applied to ALL routes
adminRouter.use(requireRole(['admin']));

adminRouter.get('/dashboard', handler); // Inherits router middleware
adminRouter.get('/users', handler);     // Inherits router middleware
```

### Sub-Router Mounting

```typescript
const mainApp = express();
const authRouter = Router();

authRouter.get('/login', loginHandler);
mainApp.use('/api/auth', authRouter); // Mounts at /api/auth/*
```

## Database Integration

Middleware arguments directly map to database queries:

```typescript
// Role check: requireRole(['admin'])
SELECT r.name FROM roles r 
JOIN user_roles ur ON r.id = ur.role_id 
WHERE ur.user_id = ? AND r.name IN ('admin')

// Permission check: requirePermission('admin_dashboard', 'read')
SELECT p.* FROM permissions p
WHERE p.resource_type = 'admin_dashboard' AND p.permission_type = 'read'
AND (p.id IN (SELECT permission_id FROM user_permissions WHERE user_id = ?)
     OR p.id IN (SELECT rp.permission_id FROM role_permissions rp 
                 JOIN user_roles ur ON rp.role_id = ur.role_id 
                 WHERE ur.user_id = ?))
```

## Error Handling Patterns

Each middleware follows consistent error response patterns:

- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Insufficient roles/permissions
- **500 Internal Server Error**: System/database errors

```typescript
// Authentication failure
res.status(401).json({ success: false, error: 'Access token required' });

// Role failure
res.status(403).json({ 
  success: false, 
  error: 'Insufficient role permissions',
  required: ['admin'],
  current: userRoles
});

// Permission failure
res.status(403).json({ 
  success: false, 
  error: 'Insufficient permissions',
  details: 'Missing admin_dashboard:read permission'
});
```

## Router Internal State

The Router class maintains internal state:

```typescript
interface RouterState {
  routes: RouteDefinition[];     // All registered routes
  middleware: Function[];        // Router-level middleware
  params: ParamHandler[];        // Parameter processors
  settings: RouterOptions;       // Configuration options
}
```

## Implementation Example

### Complete Admin Dashboard Route

```typescript
// File: api/routes/auth.ts
import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '../middleware/rbac';

const router = Router();

/**
 * Admin Dashboard Endpoint
 * Demonstrates layered security middleware
 */
router.get(
  "/admin/dashboard",
  authenticateToken,                    // Layer 1: JWT validation
  requireRole(['admin']),              // Layer 2: Role check
  requirePermission('admin_dashboard', 'read'), // Layer 3: Permission check
  async (req: any, res: Response): Promise<void> => {
    // All security layers passed - execute business logic
    res.json({
      success: true,
      message: "Welcome to admin dashboard",
      user: req.user // Populated by authenticateToken
    });
  }
);

export default router;
```

## Key Concepts Summary

1. **Router Class**: Provides infrastructure for route management and middleware orchestration
2. **Middleware Arguments**: Functions that Router executes in sequence
3. **Chain Management**: Router ensures proper `next()` calling and error propagation
4. **Request Context**: Router maintains `req`/`res` objects throughout the chain
5. **Separation of Concerns**: Router handles routing logic, middleware handles business logic
6. **Factory Pattern**: Middleware factories accept configuration and return configured middleware functions
7. **Database Integration**: Middleware queries RBAC tables for authorization decisions
8. **Error Handling**: Consistent HTTP status codes and error response formats

The Express Router class acts as the **orchestrator** that manages how custom middleware arguments are processed, while the actual authentication and authorization logic resides in custom middleware functions. This separation enables clean, modular, and testable code architecture.
