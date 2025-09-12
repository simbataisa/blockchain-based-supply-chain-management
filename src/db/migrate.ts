import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(console.error);
}