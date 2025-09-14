import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Permission types enum
export const permissionTypeEnum = pgEnum('permission_type', [
  'create', 'read', 'update', 'delete', 'execute', 'approve', 'audit'
]);

// Resource types enum
export const resourceTypeEnum = pgEnum('resource_type', [
  'user', 'organization', 'product', 'transaction', 'contract', 
  'quality_report', 'audit_log', 'tracking_record', 'system'
]);

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(false), // Cannot be deleted
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'), // Additional role configuration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Permissions table
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  resource: resourceTypeEnum('resource').notNull(),
  action: permissionTypeEnum('action').notNull(),
  conditions: jsonb('conditions'), // ABAC conditions (JSON)
  isSystemPermission: boolean('is_system_permission').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Role-Permission mapping table (Many-to-Many)
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  conditions: jsonb('conditions'), // Additional ABAC conditions specific to this role-permission
  isActive: boolean('is_active').default(true),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Optional expiration
});

// User-Role mapping table (Many-to-Many) - extends the simple role field in users table
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true),
  assignedBy: uuid('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Optional expiration
  context: jsonb('context'), // ABAC context (organization, project, etc.)
});

// Direct User-Permission mapping (for exceptions and specific grants)
export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  isGranted: boolean('is_granted').default(true), // true = grant, false = deny (override)
  conditions: jsonb('conditions'), // ABAC conditions
  isActive: boolean('is_active').default(true),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Optional expiration
  reason: text('reason'), // Why this permission was granted/denied
});

// Permission audit log
export const permissionAuditLog = pgTable('permission_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // 'permission_check', 'access_granted', 'access_denied'
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'), // ID of the specific resource accessed
  permission: varchar('permission', { length: 100 }).notNull(),
  result: varchar('result', { length: 20 }).notNull(), // 'granted', 'denied'
  context: jsonb('context'), // Request context, IP, user agent, etc.
  reason: text('reason'), // Why access was granted/denied
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
  grantedByUser: one(users, {
    fields: [rolePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
  grantedByUser: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
  }),
}));

// Types
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;
export type NewPermissionAuditLog = typeof permissionAuditLog.$inferInsert;

// ABAC Context interface
export interface ABACContext {
  user: {
    id: string;
    role: string;
    organizationId?: string;
    attributes?: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    ownerId?: string;
    organizationId?: string;
    attributes?: Record<string, any>;
  };
  environment: {
    time?: Date;
    ip?: string;
    userAgent?: string;
    location?: string;
    attributes?: Record<string, any>;
  };
  action: {
    type: string;
    attributes?: Record<string, any>;
  };
}

// Permission check result interface
export interface PermissionCheckResult {
  granted: boolean;
  reason: string;
  matchedPermissions: Permission[];
  context: ABACContext;
  auditLogId?: string;
}