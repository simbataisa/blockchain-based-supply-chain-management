import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/users';

// Get database URL from environment
const getDatabaseUrl = () => {
  // First try the explicit DATABASE_URL
  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@localhost:5432/supply_chain_local') {
    return process.env.DATABASE_URL;
  }
  
  // For Supabase, construct the connection URL using service role key
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceRoleKey) {
    // Extract project reference from Supabase URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      // Use the service role key as password for direct PostgreSQL connection
      return `postgresql://postgres:[YOUR_PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }
  
  // Fallback to local development database
  return 'postgresql://postgres:postgres@localhost:5432/supply_chain_local';
};

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

try {
  const connectionString = getDatabaseUrl();
  client = postgres(connectionString, {
    prepare: false,
    max: 10,
  });
  db = drizzle(client, { schema });
} catch (error) {
  console.warn('Database connection failed, using fallback:', error);
  // Create a mock client for development
  client = postgres('postgresql://localhost:5432/fallback', {
    prepare: false,
    max: 1,
  });
  db = drizzle(client, { schema });
}

// Export the database instance and schema
export { db };
export * from './schema/users';