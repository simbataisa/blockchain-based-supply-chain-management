import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fpghljbtkxpczmqxwxef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZ2hsamJ0a3hwY3ptcXh3eGVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYwNTA4MSwiZXhwIjoyMDczMTgxMDgxfQ.pE2y0mZurz5rBXN9bmsVsJR8pnrYdbv9s9mD-sFwjls';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Supabase client initialized with URL:', supabaseUrl);
console.log('Service key present:', !!supabaseServiceKey);

const router = Router();

// Check database status
router.get('/status', async (req, res) => {
  try {
    // Check if tables exist by querying information_schema
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'organizations']);

    const existingTables = tablesData?.map(t => t.table_name) || [];
    const expectedTables = ['users', 'organizations'];
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    // Check if demo users exist
    let demoUsersExist = false;
    if (existingTables.includes('users')) {
      const { data: demoUsers } = await supabase
        .from('users')
        .select('email')
        .in('email', ['admin@supply.com', 'manufacturer@supply.com', 'distributor@supply.com'])
        .limit(1);
      
      demoUsersExist = demoUsers && demoUsers.length > 0;
    }
    
    res.json({
      success: true,
      database: {
        connected: true,
        tablesExist: missingTables.length === 0,
        existingTables,
        missingTables,
        demoUsersExist
      }
    });
  } catch (error) {
    console.error('Database status check failed:', error);
    res.json({
      success: true,
      database: {
        connected: false,
        tablesExist: false,
        existingTables: [],
        missingTables: ['users', 'organizations'],
        demoUsersExist: false
      }
    });
  }
});

// Run database migrations
router.post('/migrate', async (req, res) => {
  try {
    const migrationSql = readFileSync(join(process.cwd(), 'src/db/migrations/0000_create_tables.sql'), 'utf-8');
    
    // Since we can't execute raw SQL directly, we'll provide instructions
    // and attempt to create basic table structure using available methods
    
    const instructions = [
      '1. Go to your Supabase dashboard: https://supabase.com/dashboard',
      '2. Navigate to your project: fpghljbtkxpczmqxwxef',
      '3. Go to SQL Editor',
      '4. Copy and paste the SQL migration provided below',
      '5. Click "Run" to execute the migration',
      '6. After successful execution, call the /api/database/seed endpoint'
    ];
    
    // Check if tables already exist using the same logic as status endpoint
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'organizations']);
    
    const existingTables = tables?.map(t => t.table_name) || [];
    const tablesExist = existingTables.includes('users') && existingTables.includes('organizations');
    
    console.log('Existing tables:', existingTables);
    console.log('Tables exist:', tablesExist);
    
    res.json({
      success: true,
      message: tablesExist ? 'Tables already exist in database' : 'Manual migration required - follow instructions below',
      tablesExist,
      instructions: tablesExist ? [] : instructions,
      migrationSql: tablesExist ? null : migrationSql
    });
  } catch (error) {
    console.error('Migration check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration check failed',
    });
  }
});

// Seed database with demo data
router.post('/seed', async (req, res) => {
  try {
    // Create demo organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Supply Chain Admin',
          type: 'admin',
          description: 'Administrative organization for supply chain management',
          contact_email: 'admin@supply.com'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Manufacturing Corp',
          type: 'manufacturer',
          description: 'Leading manufacturing company',
          contact_email: 'contact@manufacturing.com'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Distribution Inc',
          type: 'distributor',
          description: 'Global distribution network',
          contact_email: 'contact@distribution.com'
        }
      ], { onConflict: 'id' })
      .select();

    if (orgError) {
      console.warn('Organization seeding warning:', orgError);
    }

    // Create demo users in Supabase Auth system
    const demoUsers = [
      {
        email: 'admin@supply.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        email: 'manufacturer@supply.com',
        password: 'manu123',
        name: 'Manufacturing User',
        role: 'manufacturer',
        organization_id: '550e8400-e29b-41d4-a716-446655440002'
      },
      {
        email: 'distributor@supply.com',
        password: 'dist123',
        name: 'Distribution User',
        role: 'distributor',
        organization_id: '550e8400-e29b-41d4-a716-446655440003'
      }
    ];

    const createdUsers = [];
    
    for (const userData of demoUsers) {
      try {
        // Create user in Supabase Auth using admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: userData.role
          }
        });

        if (authError) {
          if (authError.message.includes('already registered') || 
              authError.message.includes('already exists') || 
              authError.code === 'email_exists') {
            console.log(`User ${userData.email} already exists in auth, creating profile only...`);
            
            // For existing users, we need to get their auth ID from the auth.users table
            // We'll use a different approach - query our users table to see if profile exists
            const { data: existingProfile } = await supabase
              .from('users')
              .select('*')
              .eq('email', userData.email)
              .single();
              
            if (!existingProfile) {
              console.log(`No profile found for ${userData.email}, but auth user exists. Manual profile creation needed.`);
            } else {
              console.log(`Profile already exists for ${userData.email}`);
              createdUsers.push(existingProfile);
            }
          } else {
            console.warn(`Auth user creation failed for ${userData.email}:`, authError);
          }
          continue;
        }

        // Successfully created auth user, now create profile
        if (authData?.user) {
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .insert({
              auth_id: authData.user.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              organization_id: userData.organization_id
            })
            .select()
            .single();

          if (!dbError) {
            createdUsers.push(dbUser);
            console.log(`Successfully created user: ${userData.email}`);
          } else {
            console.warn(`Database profile creation failed for ${userData.email}:`, dbError);
          }
        }
      } catch (error) {
        console.warn(`User creation failed for ${userData.email}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: 'Database seeded successfully with demo data',
      data: {
        organizations: organizations?.length || 0,
        users: createdUsers?.length || 0,
      },
      demoCredentials: {
        admin: { email: 'admin@supply.com', password: 'admin123' },
        manufacturer: { email: 'manufacturer@supply.com', password: 'manu123' },
        distributor: { email: 'distributor@supply.com', password: 'dist123' }
      }
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database seeding failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get migration SQL for manual execution
router.get('/migration-sql', async (req, res) => {
  try {
    const migrationPath = join(process.cwd(), 'src/db/migrations/0000_create_tables.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    res.json({
      success: true,
      migrationFile: '0000_create_tables.sql',
      sql: migrationSql,
    });
  } catch (error) {
    console.error('Failed to read migration SQL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read migration files',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;