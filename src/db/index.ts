import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as usersSchema from './schema/users';
import * as productsSchema from './schema/products';
import * as contractsSchema from './schema/contracts';

const schema = { ...usersSchema, ...productsSchema, ...contractsSchema };

// Get database URL from environment variables
function getDatabaseUrl(): string {
  // Check for explicit DATABASE_URL first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Default to local PostgreSQL for development
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'supply_chain';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres123';
  
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

// Initialize PostgreSQL connection
const connectionString = getDatabaseUrl();
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(client, { schema });
console.log('PostgreSQL database initialized');

// Export the database instance and schema
export { db };
export * from './schema/users';
export * from './schema/products';
export * from './schema/contracts';