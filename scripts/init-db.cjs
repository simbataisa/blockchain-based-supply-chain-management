const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/supply_chain';
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

console.log('🔗 Connected to PostgreSQL database');

async function initializeDatabase() {
  try {
    // Read and execute migration SQL
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0000_quiet_gunslinger.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await sql.unsafe(migrationSQL);
      console.log('✅ Database tables created successfully');
    } else {
      console.log('⚠️  Migration file not found, creating tables manually...');
      
      // Create tables manually if migration file doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          organization VARCHAR(255),
          avatar TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          sku VARCHAR(100) UNIQUE,
          price REAL,
          currency VARCHAR(10) DEFAULT 'USD',
          manufacturer VARCHAR(255),
          manufacturing_date TIMESTAMP,
          expiry_date TIMESTAMP,
          batch_number VARCHAR(100),
          qr_code TEXT,
          rfid_tag VARCHAR(100),
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          metadata TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      
      await sql`CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku)`;
      console.log('✅ Tables created manually');
    }

    // Seed demo users
    const demoUsers = [
      { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin', organization: 'Demo Corp' },
      { email: 'manager@demo.com', name: 'Demo Manager', role: 'manager', organization: 'Demo Corp' },
      { email: 'user@demo.com', name: 'Demo User', role: 'user', organization: 'Demo Corp' }
    ];

    for (const user of demoUsers) {
      await sql`
        INSERT INTO users (email, name, role, organization)
        VALUES (${user.email}, ${user.name}, ${user.role}, ${user.organization})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    console.log('✅ Demo users seeded successfully');

    // Seed demo products
    const demoProducts = [
      {
        name: 'Organic Coffee Beans',
        description: 'Premium organic coffee beans from sustainable farms',
        category: 'Food & Beverage',
        price: 24.99,
        sku: 'COFFEE-001',
        manufacturer: 'Green Valley Farms',
        batch_number: 'BATCH-2024-001',
        manufacturing_date: '2024-01-15',
        expiry_date: '2025-01-15'
      },
      {
        name: 'Eco-Friendly T-Shirt',
        description: 'Made from 100% organic cotton with sustainable practices',
        category: 'Clothing',
        price: 29.99,
        sku: 'SHIRT-002',
        manufacturer: 'EcoWear Co.',
        batch_number: 'BATCH-2024-002',
        manufacturing_date: '2024-02-01'
      }
    ];

    for (const product of demoProducts) {
      await sql`
        INSERT INTO products (name, description, category, price, sku, manufacturer, batch_number, manufacturing_date, expiry_date)
        VALUES (${product.name}, ${product.description}, ${product.category}, ${product.price}, ${product.sku}, ${product.manufacturer}, ${product.batch_number}, ${product.manufacturing_date}, ${product.expiry_date})
        ON CONFLICT (sku) DO NOTHING
      `;
    }

    console.log('✅ Demo products seeded successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
console.log('🎉 Database initialization completed!');