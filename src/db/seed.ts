import { config } from 'dotenv';
config(); // Load environment variables

import { db, users, organizations, products, productTransfers, smartContracts, type NewUser, type NewOrganization, type NewProduct, type NewProductTransfer, type NewSmartContract } from './index';
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

// Demo smart contracts data
const demoSmartContracts: Omit<NewSmartContract, 'deployedBy'>[] = [
  {
    name: 'Supply Chain Tracker',
    description: 'Smart contract for tracking products through the supply chain with immutable records',
    contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    abi: [
      {
        "inputs": [{"name": "_name", "type": "string"}, {"name": "_location", "type": "string"}],
        "name": "createProduct",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_productId", "type": "uint256"}, {"name": "_to", "type": "address"}, {"name": "_location", "type": "string"}],
        "name": "transferProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "productId", "type": "uint256"}, {"indexed": false, "name": "name", "type": "string"}, {"indexed": true, "name": "manufacturer", "type": "address"}],
        "name": "ProductCreated",
        "type": "event"
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50610c2f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80631234567814610046578063abcdef781461006457600080fd5b5b600080fd5b61004e610082565b60405161005b9190610123565b60405180910390f35b61006c610088565b6040516100799190610123565b60405180910390f35b60005481565b60015481565b6000819050919050565b6100a18161008e565b82525050565b60006020820190506100bc6000830184610098565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061010957607f821691505b60208210810361011c5761011b6100c2565b5b5091905056fea2646970667358221220',
    network: 'ethereum',
    deploymentTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    deploymentBlockNumber: 18500000,
    status: 'active',
    version: '1.0.0'
  },
  {
    name: 'Quality Control Contract',
    description: 'Automated quality control and compliance verification for pharmaceutical products',
    contractAddress: '0x8ba1f109551bD432803012645Hac136c72DcF8Dc',
    abi: [
      {
        "inputs": [{"name": "_productId", "type": "uint256"}, {"name": "_qualityScore", "type": "uint8"}, {"name": "_certifications", "type": "string[]"}],
        "name": "recordQualityCheck",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_productId", "type": "uint256"}],
        "name": "getQualityRecord",
        "outputs": [{"name": "score", "type": "uint8"}, {"name": "timestamp", "type": "uint256"}, {"name": "inspector", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "productId", "type": "uint256"}, {"indexed": false, "name": "score", "type": "uint8"}, {"indexed": true, "name": "inspector", "type": "address"}],
        "name": "QualityRecorded",
        "type": "event"
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50610d5f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631a2b3c4d1461005c5780632f4f21e21461007a5780634e71d92d14610098578063a9059cbb146100b6575b600080fd5b6100646100d4565b6040516100719190610234565b60405180910390f35b6100826100da565b60405161008f9190610234565b60405180910390f35b6100a06100e0565b6040516100ad9190610234565b60405180910390f35b6100be6100e6565b6040516100cb9190610234565b60405180910390f35b60005481565b60015481565b60025481565b60035481565b',
    network: 'polygon',
    deploymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    deploymentBlockNumber: 45600000,
    status: 'verified',
    version: '2.1.0'
  },
  {
    name: 'Inventory Management System',
    description: 'Decentralized inventory tracking with automated reordering and stock alerts',
    contractAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    abi: [
      {
        "inputs": [{"name": "_itemId", "type": "uint256"}, {"name": "_quantity", "type": "uint256"}, {"name": "_threshold", "type": "uint256"}],
        "name": "updateInventory",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_itemId", "type": "uint256"}],
        "name": "getInventoryLevel",
        "outputs": [{"name": "quantity", "type": "uint256"}, {"name": "threshold", "type": "uint256"}, {"name": "needsReorder", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "itemId", "type": "uint256"}, {"indexed": false, "name": "quantity", "type": "uint256"}, {"indexed": false, "name": "threshold", "type": "uint256"}],
        "name": "InventoryUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "itemId", "type": "uint256"}, {"indexed": false, "name": "currentLevel", "type": "uint256"}],
        "name": "ReorderAlert",
        "type": "event"
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50610e8f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80631f2698ab146100675780633ccfd60b146100835780635c975abb1461009f5780638456cb59146100bd578063a0712d68146100c7578063f2fde38b146100e3575b600080fd5b610081600480360381019061007c9190610456565b6100ff565b005b61009d60048036038101906100989190610456565b610234565b005b6100a7610369565b6040516100b49190610492565b60405180910390f35b6100c561037c565b005b6100e160048036038101906100dc9190610456565b610402565b005b6100fd60048036038101906100f891906104ad565b610537565b005b',
    network: 'bsc',
    deploymentTxHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    deploymentBlockNumber: 32100000,
    status: 'paused',
    version: '1.5.2'
  },
  {
    name: 'Carbon Credit Tracker',
    description: 'Blockchain-based carbon credit tracking and trading system for supply chain sustainability',
    contractAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    abi: [
      {
        "inputs": [{"name": "_amount", "type": "uint256"}, {"name": "_projectId", "type": "string"}, {"name": "_verifier", "type": "address"}],
        "name": "mintCarbonCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_amount", "type": "uint256"}],
        "name": "transferCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_amount", "type": "uint256"}, {"name": "_reason", "type": "string"}],
        "name": "retireCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "to", "type": "address"}, {"indexed": false, "name": "amount", "type": "uint256"}, {"indexed": false, "name": "projectId", "type": "string"}],
        "name": "CreditsMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "from", "type": "address"}, {"indexed": false, "name": "amount", "type": "uint256"}, {"indexed": false, "name": "reason", "type": "string"}],
        "name": "CreditsRetired",
        "type": "event"
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50610f2f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100735760003560e01c80631249c58b1461007857806318160ddd1461009657806323b872dd146100b457806342842e0e146100d0578063a22cb465146100ec578063b88d4fde14610108578063e985e9c514610124575b600080fd5b610080610154565b60405161008d9190610567565b60405180910390f35b61009e61015a565b6040516100ab9190610567565b60405180910390f35b6100ce60048036038101906100c99190610582565b610160565b005b6100ea60048036038101906100e59190610582565b610295565b005b610106600480360381019061010191906105d5565b6103ca565b005b610122600480360381019061011d9190610615565b6104ff565b005b61013e60048036038101906101399190610698565b610634565b60405161014b91906106d8565b60405180910390f35b60005481565b60015481565b',
    network: 'ethereum',
    deploymentTxHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    deploymentBlockNumber: 18750000,
    status: 'active',
    version: '3.0.1'
  },
  {
    name: 'Multi-Signature Wallet',
    description: 'Secure multi-signature wallet for managing supply chain payments and escrow',
    contractAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    abi: [
      {
        "inputs": [{"name": "_owners", "type": "address[]"}, {"name": "_required", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}, {"name": "_data", "type": "bytes"}],
        "name": "submitTransaction",
        "outputs": [{"name": "transactionId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_transactionId", "type": "uint256"}],
        "name": "confirmTransaction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_transactionId", "type": "uint256"}],
        "name": "executeTransaction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "sender", "type": "address"}, {"indexed": true, "name": "transactionId", "type": "uint256"}],
        "name": "Submission",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "sender", "type": "address"}, {"indexed": true, "name": "transactionId", "type": "uint256"}],
        "name": "Confirmation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "transactionId", "type": "uint256"}],
        "name": "Execution",
        "type": "event"
      }
    ],
    bytecode: '0x608060405234801561001057600080fd5b50604051610a38380380610a388339818101604052810190610032919061025d565b81518351146100765760405162461bcd60e51b815260206004820152601760248201527f696e76616c6964206f776e657273206c656e6774680000000000000000000000604482015260640160405180910390fd5b60005b83518110156101235760008482815181106100965761009661029f565b6020026020010151905073ffffffffffffffffffffffffffffffffffffffff81166101035760405162461bcd60e51b815260206004820152601360248201527f696e76616c6964206f776e657220616464726573730000000000000000000000604482015260640160405180910390fd5b6001600160a01b03166000908152600160208190526040909120805460ff19169091179055600101610079565b5050600291909155600355506102b5565b',
    network: 'arbitrum',
    deploymentTxHash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    deploymentBlockNumber: 125000000,
    status: 'terminated',
    version: '2.3.0'
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

// Seed smart contracts
async function seedSmartContracts() {
  console.log('🔗 Seeding smart contracts...');
  
  try {
    // Get a random user to be the deployer for each contract
     const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log('⚠️ No users found, skipping smart contract seeding');
      return;
    }

    for (const contractData of demoSmartContracts) {
      // Check if contract already exists
      const existing = await db.select().from(smartContracts).where(eq(smartContracts.contractAddress, contractData.contractAddress)).limit(1);
      
      if (existing.length > 0) {
        console.log(`   ✓ Smart contract '${contractData.name}' already exists`);
        continue;
      }

      // Randomly assign a deployer from existing users
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      const contractToInsert: NewSmartContract = {
        ...contractData,
        deployedBy: randomUser.id
      };

      const [newContract] = await db.insert(smartContracts).values(contractToInsert).returning();
      console.log(`   ✓ Created smart contract: ${newContract.name}`);
    }
    
    console.log(`📋 Successfully seeded ${demoSmartContracts.length} smart contracts`);
  } catch (error) {
    console.error('❌ Error seeding smart contracts:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Seed organizations first
    const orgs = await seedOrganizations();
    
    // Then seed users
    await seedUsers(orgs);
    
    // Then seed products
    await seedProducts(orgs);
    
    // Finally seed smart contracts
    await seedSmartContracts();
    
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
export { seedDatabase, seedOrganizations, seedUsers, seedProducts, seedSmartContracts };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}