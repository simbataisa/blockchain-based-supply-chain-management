import { config } from 'dotenv';
config(); // Load environment variables

import { db, users, organizations, products, productTransfers, type NewUser, type NewOrganization, type NewProduct, type NewProductTransfer } from './index';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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

// Demo products data
const demoProducts: Omit<NewProduct, 'manufacturerId' | 'currentOwnerId'>[] = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Latest flagship smartphone with advanced camera system and titanium design',
    category: 'Electronics',
    sku: 'APPLE-IP15PM-256-NT',
    batchNumber: 'BATCH-2024-001',
    status: 'verified',
    originLocation: 'Cupertino, CA, USA',
    currentLocation: 'San Francisco, CA, USA',
    price: '1199.00',
    quantity: 50,
    weight: '0.221',
    dimensions: '159.9 x 76.7 x 8.25 mm',
    certifications: ['FCC', 'CE', 'RoHS'],
    metadata: {
      color: 'Natural Titanium',
      storage: '256GB',
      warranty: '1 year',
      model: 'A3108'
    }
  },
  {
    name: 'Pfizer COVID-19 Vaccine',
    description: 'mRNA-based COVID-19 vaccine for immunization',
    category: 'Pharmaceuticals',
    sku: 'PFZ-COV19-VAC-001',
    batchNumber: 'VAC-2024-PF-789',
    status: 'in_transit',
    originLocation: 'New York, NY, USA',
    currentLocation: 'Chicago, IL, USA',
    price: '19.50',
    quantity: 1000,
    weight: '0.005',
    dimensions: '2ml vial',
    expiryDate: new Date('2025-06-30'),
    certifications: ['FDA', 'EMA', 'WHO'],
    metadata: {
      temperature: '-70°C storage required',
      dosage: '0.3ml',
      activeIngredient: 'BNT162b2'
    }
  },
  {
    name: 'Organic Fair Trade Coffee Beans',
    description: 'Premium Arabica coffee beans from Colombian highlands',
    category: 'Food & Beverage',
    sku: 'COL-COFFEE-ORG-001',
    batchNumber: 'COFFEE-2024-COL-456',
    status: 'delivered',
    originLocation: 'Medellín, Colombia',
    currentLocation: 'Seattle, WA, USA',
    price: '24.99',
    quantity: 200,
    weight: '1.0',
    dimensions: '500g bag',
    expiryDate: new Date('2025-03-15'),
    certifications: ['Organic', 'Fair Trade', 'Rainforest Alliance'],
    metadata: {
      roastLevel: 'Medium',
      altitude: '1800m',
      variety: 'Caturra'
    }
  },
  {
    name: 'Tesla Model S Battery Pack',
    description: 'High-performance lithium-ion battery pack for Tesla Model S',
    category: 'Automotive',
    sku: 'TESLA-MS-BAT-100KWH',
    batchNumber: 'BAT-2024-TES-123',
    status: 'created',
    originLocation: 'Fremont, CA, USA',
    currentLocation: 'Fremont, CA, USA',
    price: '15000.00',
    quantity: 25,
    weight: '540.0',
    dimensions: '210 x 150 x 15 cm',
    certifications: ['UL', 'ISO 26262', 'IATF 16949'],
    metadata: {
      capacity: '100kWh',
      voltage: '400V',
      chemistry: 'NCA'
    }
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Sustainable organic cotton t-shirt with eco-friendly dyes',
    category: 'Textiles',
    sku: 'ECO-TSHIRT-ORG-M-BLU',
    batchNumber: 'TEX-2024-ECO-789',
    status: 'verified',
    originLocation: 'Mumbai, India',
    currentLocation: 'Los Angeles, CA, USA',
    price: '29.99',
    quantity: 500,
    weight: '0.15',
    dimensions: 'Size M',
    certifications: ['GOTS', 'OEKO-TEX', 'Fair Trade'],
    metadata: {
      size: 'Medium',
      color: 'Ocean Blue',
      material: '100% Organic Cotton'
    }
  },
  {
    name: 'Industrial Grade Ethanol',
    description: 'High-purity ethanol for industrial and pharmaceutical applications',
    category: 'Chemicals',
    sku: 'CHEM-ETH-99-IND-001',
    batchNumber: 'CHEM-2024-ETH-456',
    status: 'in_transit',
    originLocation: 'Houston, TX, USA',
    currentLocation: 'Dallas, TX, USA',
    price: '2.50',
    quantity: 10000,
    weight: '0.789',
    dimensions: '1L bottle',
    expiryDate: new Date('2026-12-31'),
    certifications: ['USP', 'ACS', 'ISO 9001'],
    metadata: {
      purity: '99.9%',
      grade: 'Industrial',
      hazardClass: 'Flammable Liquid'
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen and advanced AI features',
    category: 'Electronics',
    sku: 'SAMSUNG-S24U-512-TIT',
    batchNumber: 'BATCH-2024-SAM-002',
    status: 'delivered',
    originLocation: 'Seoul, South Korea',
    currentLocation: 'New York, NY, USA',
    price: '1299.99',
    quantity: 75,
    weight: '0.232',
    dimensions: '162.3 x 79.0 x 8.6 mm',
    certifications: ['FCC', 'CE', 'IC'],
    metadata: {
      color: 'Titanium Gray',
      storage: '512GB',
      ram: '12GB',
      display: '6.8" Dynamic AMOLED'
    }
  },
  {
    name: 'Moderna mRNA Vaccine',
    description: 'COVID-19 mRNA vaccine for active immunization',
    category: 'Pharmaceuticals',
    sku: 'MOD-COV19-VAC-002',
    batchNumber: 'VAC-2024-MOD-321',
    status: 'recalled',
    originLocation: 'Cambridge, MA, USA',
    currentLocation: 'Boston, MA, USA',
    price: '25.00',
    quantity: 500,
    weight: '0.005',
    dimensions: '2ml vial',
    expiryDate: new Date('2025-08-15'),
    certifications: ['FDA', 'Health Canada', 'TGA'],
    metadata: {
      temperature: '-20°C storage',
      dosage: '0.5ml',
      activeIngredient: 'mRNA-1273',
      recallReason: 'Quality control issue'
    }
  }
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

// Auth0 handles user authentication, so we don't need to create auth users here
// We'll just create database user records

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

      // Find organization if specified
      let organizationId = null;
      if (userData.organizationName) {
        const org = orgs.find(o => o.name === userData.organizationName);
        if (org) {
          organizationId = org.id;
        }
      }

      // Create user profile with generated authId (Auth0 will handle actual authentication)
      const newUser: NewUser = {
        authId: uuidv4(), // Generate a placeholder authId for database seeding
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

async function seedProducts(orgs: any[]) {
  console.log('🌱 Seeding products...');
  
  // Get manufacturer and distributor organizations
  const manufacturer = orgs.find(o => o.type === 'manufacturer');
  const distributor = orgs.find(o => o.type === 'distributor');
  const retailer = orgs.find(o => o.type === 'retailer');
  
  if (!manufacturer || !distributor || !retailer) {
    console.error('❌ Required organizations not found for product seeding');
    return [];
  }

  const createdProducts = [];
  
  for (const productData of demoProducts) {
    try {
      // Assign manufacturer and current owner based on product status
      let currentOwnerId = manufacturer.id;
      if (productData.status === 'in_transit') {
        currentOwnerId = distributor.id;
      } else if (productData.status === 'delivered' || productData.status === 'verified') {
        currentOwnerId = retailer.id;
      }
      
      // Generate QR code data
      const qrCodeData = JSON.stringify({
        id: `temp-${productData.sku}`,
        sku: productData.sku,
        batch: productData.batchNumber,
        name: productData.name,
        status: productData.status,
        location: productData.currentLocation,
        created: new Date().toISOString()
      });

      const newProduct: NewProduct = {
        ...productData,
        manufacturerId: manufacturer.id,
        currentOwnerId,
        qrCodeData
      };

      const [insertedProduct] = await db.insert(products).values(newProduct).returning();
      createdProducts.push(insertedProduct);
      console.log(`✅ Created product: ${productData.name} (${productData.sku})`);
      
      // Create initial transfer record (manufacturing)
      const manufacturingTransfer: NewProductTransfer = {
        productId: insertedProduct.id,
        fromOwnerId: null, // No previous owner for manufacturing
        toOwnerId: manufacturer.id,
        fromLocation: null,
        toLocation: productData.originLocation,
        transferType: 'manufacture',
        notes: 'Initial product creation and manufacturing',
        verifiedAt: new Date(),
      };
      
      await db.insert(productTransfers).values(manufacturingTransfer);
      
      // Create additional transfer records based on status
      if (productData.status !== 'created') {
        const distributionTransfer: NewProductTransfer = {
          productId: insertedProduct.id,
          fromOwnerId: manufacturer.id,
          toOwnerId: distributor.id,
          fromLocation: productData.originLocation,
          toLocation: productData.currentLocation,
          transferType: 'ship',
          notes: 'Shipped to distribution center',
          verifiedAt: new Date(),
        };
        
        await db.insert(productTransfers).values(distributionTransfer);
      }
      
      if (productData.status === 'delivered' || productData.status === 'verified') {
        const retailTransfer: NewProductTransfer = {
          productId: insertedProduct.id,
          fromOwnerId: distributor.id,
          toOwnerId: retailer.id,
          fromLocation: productData.originLocation,
          toLocation: productData.currentLocation,
          transferType: 'receive',
          notes: 'Delivered to retail location',
          verifiedAt: new Date(),
        };
        
        await db.insert(productTransfers).values(retailTransfer);
      }
      
    } catch (error) {
      console.error(`❌ Error creating product ${productData.name}:`, error);
    }
  }
  
  return createdProducts;
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Seed organizations first
    const orgs = await seedOrganizations();
    
    // Then seed users
    await seedUsers(orgs);
    
    // Finally seed products
    await seedProducts(orgs);
    
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
export { seedDatabase, seedOrganizations, seedUsers, seedProducts };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}