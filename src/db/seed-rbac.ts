/**
 * RBAC Seed Data
 * Populates roles, permissions, and role_permissions tables with initial data
 */

import { db } from './index';
import { 
  roles, 
  permissions, 
  rolePermissions, 
  userRoles,
  users
} from './schema';
import { eq } from 'drizzle-orm';

// Default roles
const defaultRoles = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Super administrator with full system access',
    isSystemRole: true
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrator with management access',
    isSystemRole: true
  },
  {
    name: 'manufacturer',
    displayName: 'Manufacturer',
    description: 'Manufacturer role for product creation and management'
  },
  {
    name: 'distributor',
    displayName: 'Distributor',
    description: 'Distributor role for product distribution'
  },
  {
    name: 'retailer',
    displayName: 'Retailer',
    description: 'Retailer role for product sales'
  },
  {
    name: 'consumer',
    displayName: 'Consumer',
    description: 'Consumer role for product verification'
  },
  {
    name: 'auditor',
    displayName: 'Auditor',
    description: 'Auditor role for compliance and verification'
  }
];

// Default permissions
const defaultPermissions = [
  // User management
  { name: 'create:user', displayName: 'Create Users', description: 'Create new users', action: 'create', resource: 'user', isSystemPermission: true },
  { name: 'read:user', displayName: 'Read Users', description: 'Read user information', action: 'read', resource: 'user' },
  { name: 'update:user', displayName: 'Update Users', description: 'Update user information', action: 'update', resource: 'user' },
  { name: 'delete:user', displayName: 'Delete Users', description: 'Delete users', action: 'delete', resource: 'user', isSystemPermission: true },
  
  // Product management
  { name: 'create:product', displayName: 'Create Products', description: 'Create new products', action: 'create', resource: 'product' },
  { name: 'read:product', displayName: 'Read Products', description: 'Read product information', action: 'read', resource: 'product' },
  { name: 'update:product', displayName: 'Update Products', description: 'Update product information', action: 'update', resource: 'product' },
  { name: 'delete:product', displayName: 'Delete Products', description: 'Delete products', action: 'delete', resource: 'product' },
  
  // Organization management
  { name: 'create:organization', displayName: 'Create Organizations', description: 'Create organizations', action: 'create', resource: 'organization' },
  { name: 'read:organization', displayName: 'Read Organizations', description: 'Read organization information', action: 'read', resource: 'organization' },
  { name: 'update:organization', displayName: 'Update Organizations', description: 'Update organization information', action: 'update', resource: 'organization' },
  { name: 'delete:organization', displayName: 'Delete Organizations', description: 'Delete organizations', action: 'delete', resource: 'organization' },
  
  // Transaction management
  { name: 'create:transaction', displayName: 'Create Transactions', description: 'Create product transactions', action: 'create', resource: 'transaction' },
  { name: 'read:transaction', displayName: 'Read Transactions', description: 'Read transaction information', action: 'read', resource: 'transaction' },
  { name: 'update:transaction', displayName: 'Update Transactions', description: 'Update transaction information', action: 'update', resource: 'transaction' },
  { name: 'delete:transaction', displayName: 'Delete Transactions', description: 'Delete transactions', action: 'delete', resource: 'transaction' },
  
  // Audit management
  { name: 'create:audit_log', displayName: 'Create Audit Logs', description: 'Create audit logs', action: 'create', resource: 'audit_log' },
  { name: 'read:audit_log', displayName: 'Read Audit Logs', description: 'Read audit logs', action: 'read', resource: 'audit_log' },
  { name: 'update:audit_log', displayName: 'Update Audit Logs', description: 'Update audit logs', action: 'update', resource: 'audit_log' },
  { name: 'delete:audit_log', displayName: 'Delete Audit Logs', description: 'Delete audit logs', action: 'delete', resource: 'audit_log' },
  
  // Quality management
  { name: 'create:quality_report', displayName: 'Create Quality Reports', description: 'Create quality reports', action: 'create', resource: 'quality_report' },
  { name: 'read:quality_report', displayName: 'Read Quality Reports', description: 'Read quality report information', action: 'read', resource: 'quality_report' },
  { name: 'update:quality_report', displayName: 'Update Quality Reports', description: 'Update quality reports', action: 'update', resource: 'quality_report' },
  { name: 'delete:quality_report', displayName: 'Delete Quality Reports', description: 'Delete quality reports', action: 'delete', resource: 'quality_report' },
  
  // Contract management
  { name: 'create:contract', displayName: 'Create Contracts', description: 'Create smart contracts', action: 'create', resource: 'contract' },
  { name: 'read:contract', displayName: 'Read Contracts', description: 'Read contract information', action: 'read', resource: 'contract' },
  { name: 'update:contract', displayName: 'Update Contracts', description: 'Update contracts', action: 'update', resource: 'contract' },
  { name: 'delete:contract', displayName: 'Delete Contracts', description: 'Delete contracts', action: 'delete', resource: 'contract' },
  
  // Tracking management
  { name: 'create:tracking_record', displayName: 'Create Tracking Records', description: 'Create tracking records', action: 'create', resource: 'tracking_record' },
  { name: 'read:tracking_record', displayName: 'Read Tracking Records', description: 'Read tracking record information', action: 'read', resource: 'tracking_record' },
  { name: 'update:tracking_record', displayName: 'Update Tracking Records', description: 'Update tracking records', action: 'update', resource: 'tracking_record' },
  { name: 'delete:tracking_record', displayName: 'Delete Tracking Records', description: 'Delete tracking records', action: 'delete', resource: 'tracking_record' },
  
  // System management
  { name: 'execute:system', displayName: 'System Management', description: 'System management access', action: 'execute', resource: 'system', isSystemPermission: true },
  { name: 'audit:system', displayName: 'System Audit', description: 'System audit access', action: 'audit', resource: 'system', isSystemPermission: true }
];

// Role-Permission mappings
const rolePermissionMappings = {
  super_admin: [
    // Super admin has all permissions
    'create:user', 'read:user', 'update:user', 'delete:user',
    'create:product', 'read:product', 'update:product', 'delete:product',
    'create:organization', 'read:organization', 'update:organization', 'delete:organization',
    'create:transaction', 'read:transaction', 'update:transaction', 'delete:transaction',
    'create:audit_log', 'read:audit_log', 'update:audit_log', 'delete:audit_log',
    'create:quality_report', 'read:quality_report', 'update:quality_report', 'delete:quality_report',
    'create:contract', 'read:contract', 'update:contract', 'delete:contract',
    'create:tracking_record', 'read:tracking_record', 'update:tracking_record', 'delete:tracking_record',
    'execute:system', 'audit:system'
  ],
  admin: [
    'create:user', 'read:user', 'update:user',
    'read:product', 'update:product',
    'read:organization', 'update:organization',
    'read:transaction', 'update:transaction',
    'read:audit_log', 'create:audit_log',
    'read:quality_report', 'update:quality_report',
    'read:contract',
    'read:tracking_record', 'update:tracking_record',
    'audit:system'
  ],
  manufacturer: [
    'create:product', 'read:product', 'update:product',
    'create:transaction', 'read:transaction',
    'create:quality_report', 'read:quality_report', 'update:quality_report',
    'create:contract', 'read:contract',
    'create:tracking_record', 'read:tracking_record', 'update:tracking_record',
    'read:organization'
  ],
  distributor: [
    'read:product', 'update:product',
    'create:transaction', 'read:transaction', 'update:transaction',
    'read:quality_report',
    'read:contract',
    'read:tracking_record', 'update:tracking_record',
    'read:organization'
  ],
  retailer: [
    'read:product', 'update:product',
    'read:transaction',
    'read:quality_report',
    'read:contract',
    'read:tracking_record',
    'read:organization'
  ],
  consumer: [
    'read:product',
    'read:transaction',
    'read:quality_report',
    'read:tracking_record'
  ],
  auditor: [
    'read:product',
    'read:transaction',
    'read:audit_log', 'create:audit_log',
    'read:quality_report',
    'read:contract',
    'read:tracking_record',
    'read:organization',
    'audit:system'
  ]
};

/**
 * Seed RBAC data
 */
export async function seedRBACData() {
  try {
    console.log('🌱 Starting RBAC data seeding...');
    
    // Insert roles
    console.log('📝 Inserting roles...');
    const insertedRoles = [];
    for (const role of defaultRoles) {
      try {
        const [insertedRole] = await db
          .insert(roles)
          .values(role)
          .onConflictDoNothing()
          .returning();
        
        if (insertedRole) {
          insertedRoles.push(insertedRole);
          console.log(`✅ Role created: ${role.name}`);
        } else {
          // Get existing role
          const [existingRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, role.name))
            .limit(1);
          
          if (existingRole) {
            insertedRoles.push(existingRole);
            console.log(`ℹ️  Role already exists: ${role.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error inserting role ${role.name}:`, error);
      }
    }
    
    // Insert permissions
    console.log('🔐 Inserting permissions...');
    const insertedPermissions = [];
    for (const permission of defaultPermissions) {
      try {
        const [insertedPermission] = await db
          .insert(permissions)
          .values({
            ...permission,
            action: permission.action as any,
            resource: permission.resource as any
          })
          .onConflictDoNothing()
          .returning();
        
        if (insertedPermission) {
          insertedPermissions.push(insertedPermission);
          console.log(`✅ Permission created: ${permission.name}`);
        } else {
          // Get existing permission
          const [existingPermission] = await db
            .select()
            .from(permissions)
            .where(eq(permissions.name, permission.name))
            .limit(1);
          
          if (existingPermission) {
            insertedPermissions.push(existingPermission);
            console.log(`ℹ️  Permission already exists: ${permission.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error inserting permission ${permission.name}:`, error);
      }
    }
    
    // Create role-permission mappings
    console.log('🔗 Creating role-permission mappings...');
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const role = insertedRoles.find(r => r.name === roleName);
      if (!role) {
        console.warn(`⚠️  Role not found: ${roleName}`);
        continue;
      }
      
      for (const permissionName of permissionNames) {
        const permission = insertedPermissions.find(p => p.name === permissionName);
        if (!permission) {
          console.warn(`⚠️  Permission not found: ${permissionName}`);
          continue;
        }
        
        try {
          await db
            .insert(rolePermissions)
            .values({
              roleId: role.id,
              permissionId: permission.id
            })
            .onConflictDoNothing();
          
          console.log(`✅ Mapped ${roleName} -> ${permissionName}`);
        } catch (error) {
          console.error(`❌ Error mapping ${roleName} -> ${permissionName}:`, error);
        }
      }
    }
    
    // Assign roles to existing users based on their current role field
    console.log('👥 Assigning roles to existing users...');
    const existingUsers = await db.select().from(users);
    
    for (const user of existingUsers) {
      const userRole = user.role;
      const role = insertedRoles.find(r => r.name === userRole);
      
      if (role) {
        try {
          await db
            .insert(userRoles)
            .values({
              userId: user.id,
              roleId: role.id
            })
            .onConflictDoNothing();
          
          console.log(`✅ Assigned role ${userRole} to user ${user.email}`);
        } catch (error) {
          console.error(`❌ Error assigning role to user ${user.email}:`, error);
        }
      } else {
        console.warn(`⚠️  Role not found for user ${user.email}: ${userRole}`);
      }
    }
    
    console.log('🎉 RBAC data seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`- Roles: ${insertedRoles.length}`);
    console.log(`- Permissions: ${insertedPermissions.length}`);
    console.log(`- Users with roles: ${existingUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding RBAC data:', error);
    throw error;
  }
}

/**
 * Run seeding if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRBACData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}