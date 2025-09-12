import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema.js';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/supply_chain';

// Create PostgreSQL connection
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle database instance
export const db = drizzle(sql, { schema });

// Export the connection for direct queries if needed
export { sql };

// Migration function
export const runMigrations = () => {
  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    // Run migrations
    runMigrations();
    
    // Seed demo data if needed
    await seedDemoData();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Seed demo data
const seedDemoData = async () => {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(schema.users).limit(1);
    
    if (existingUsers.length === 0) {
      // Seed demo users
      const demoUsers = [
        {
          email: 'alice@example.com',
          name: 'Alice Johnson',
          role: 'supplier',
          organization: 'Fresh Farms Co.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'bob@example.com',
          name: 'Bob Smith',
          role: 'manufacturer',
          organization: 'Quality Foods Inc.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'carol@example.com', 
          name: 'Carol Davis',
          role: 'distributor',
          organization: 'Global Distribution Ltd.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'david@example.com',
          name: 'David Wilson',
          role: 'retailer', 
          organization: 'SuperMart Chain',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(schema.users).values(demoUsers).onConflictDoNothing();
      
      // Seed demo products
      const demoProducts = [
        {
          name: 'Organic Apples',
          description: 'Fresh organic apples from local farms',
          category: 'fruits',
          price: '4.99',
          unit: 'lb',
          supplierId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Whole Wheat Bread',
          description: 'Artisan whole wheat bread',
          category: 'bakery',
          price: '3.49',
          unit: 'loaf',
          supplierId: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(schema.products).values(demoProducts).onConflictDoNothing();
      
      console.log('Demo users seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

export default db;