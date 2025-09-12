import { supabase } from '../lib/supabase';

// Demo users to be created
const demoUsers = [
  {
    email: 'admin@supply.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    organization: 'Supply Chain Pro'
  },
  {
    email: 'manufacturer@supply.com',
    password: 'manu123',
    name: 'Manufacturing Manager',
    role: 'manufacturer',
    organization: 'Global Manufacturing Inc'
  },
  {
    email: 'distributor@supply.com',
    password: 'dist123',
    name: 'Distribution Manager',
    role: 'distributor',
    organization: 'Logistics Partners'
  }
];

export const seedDemoUsers = async () => {
  console.log('Starting database seeding...');
  
  for (const user of demoUsers) {
    try {
      // Check if user already exists by trying to sign in
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      
      if (existingUser.user) {
        console.log(`User ${user.email} already exists, skipping...`);
        await supabase.auth.signOut(); // Sign out the test user
        continue;
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });
      
      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError.message);
        continue;
      }
      
      if (authData.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization: user.organization,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error(`Error creating user profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ Successfully created user: ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
  
  console.log('Database seeding completed!');
};

// Alternative method using service role key for admin operations
export const seedDemoUsersWithServiceRole = async () => {
  console.log('Starting database seeding with service role...');
  
  // This requires VITE_SUPABASE_SERVICE_ROLE_KEY in environment
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('Service role key not found. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
    return;
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  const adminClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  for (const user of demoUsers) {
    try {
      // Create user with admin client
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });
      
      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError.message);
        continue;
      }
      
      if (authData.user) {
        // Create user profile in users table
        const { error: profileError } = await adminClient
          .from('users')
          .insert({
            id: authData.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization: user.organization,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error(`Error creating user profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ Successfully created user: ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
  
  console.log('Database seeding completed!');
};

// Run seeding if this file is executed directly (Node.js environment only)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  seedDemoUsersWithServiceRole().catch(console.error);
}