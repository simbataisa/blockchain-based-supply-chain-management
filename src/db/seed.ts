import { db, users, organizations, type NewUser, type NewOrganization } from './index';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';

// Supabase client for auth operations
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Demo organizations data
const demoOrganizations: NewOrganization[] = [
  {
    name: 'TechCorp Manufacturing',
    type: 'manufacturer',
    description: 'Leading technology manufacturer specializing in electronic components',
    address: '123 Industrial Ave, Tech City, TC 12345',
    contactEmail: 'contact@techcorp.com',
    contactPhone: '+1-555-0123',
    isVerified: true,
  },
  {
    name: 'Global Distribution Network',
    type: 'distributor',
    description: 'Worldwide distribution network for technology products',
    address: '456 Commerce Blvd, Distribution Hub, DH 67890',
    contactEmail: 'info@globaldist.com',
    contactPhone: '+1-555-0456',
    isVerified: true,
  },
  {
    name: 'RetailMax Stores',
    type: 'retailer',
    description: 'Chain of retail stores selling consumer electronics',
    address: '789 Retail St, Shopping District, SD 11111',
    contactEmail: 'support@retailmax.com',
    contactPhone: '+1-555-0789',
    isVerified: true,
  },
];

// Demo users data
const demoUsers = [
  {
    email: 'admin@supply.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin' as const,
    organizationName: null,
  },
  {
    email: 'manufacturer@supply.com',
    password: 'manu123',
    name: 'Manufacturing Manager',
    role: 'manufacturer' as const,
    organizationName: 'TechCorp Manufacturing',
  },
  {
    email: 'distributor@supply.com',
    password: 'dist123',
    name: 'Distribution Manager',
    role: 'distributor' as const,
    organizationName: 'Global Distribution Network',
  },
];

async function createAuthUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error(`Error creating auth user ${email}:`, error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error(`Exception creating auth user ${email}:`, error);
    return null;
  }
}

async function seedOrganizations() {
  console.log('🏢 Seeding organizations...');
  
  const insertedOrgs = [];
  
  for (const orgData of demoOrganizations) {
    try {
      // Check if organization already exists
      const existing = await db.select().from(organizations).where(eq(organizations.name, orgData.name)).limit(1);
      
      if (existing.length > 0) {
        console.log(`   ✓ Organization '${orgData.name}' already exists`);
        insertedOrgs.push(existing[0]);
        continue;
      }

      const [newOrg] = await db.insert(organizations).values(orgData).returning();
      console.log(`   ✓ Created organization: ${newOrg.name}`);
      insertedOrgs.push(newOrg);
    } catch (error) {
      console.error(`   ✗ Error creating organization '${orgData.name}':`, error);
    }
  }
  
  return insertedOrgs;
}

async function seedUsers(orgs: any[]) {
  console.log('👥 Seeding users...');
  
  for (const userData of demoUsers) {
    try {
      // Check if user already exists in our database
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length > 0) {
        console.log(`   ✓ User '${userData.email}' already exists`);
        continue;
      }

      // Create auth user first
      const authUser = await createAuthUser(userData.email, userData.password);
      if (!authUser) {
        console.log(`   ✗ Failed to create auth user for ${userData.email}`);
        continue;
      }

      // Find organization if specified
      let organizationId = null;
      if (userData.organizationName) {
        const org = orgs.find(o => o.name === userData.organizationName);
        if (org) {
          organizationId = org.id;
        }
      }

      // Create user profile
      const newUser: NewUser = {
        authId: authUser.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organizationId,
        status: 'active',
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();
      console.log(`   ✓ Created user: ${createdUser.email} (${createdUser.role})`);
    } catch (error) {
      console.error(`   ✗ Error creating user '${userData.email}':`, error);
    }
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Seed organizations first
    const orgs = await seedOrganizations();
    
    // Then seed users
    await seedUsers(orgs);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@supply.com / admin123');
    console.log('   Manufacturer: manufacturer@supply.com / manu123');
    console.log('   Distributor: distributor@supply.com / dist123');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Export for use in API endpoints
export { seedDatabase, seedOrganizations, seedUsers };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}