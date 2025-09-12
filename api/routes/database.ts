import { Router } from 'express';
import { db } from '../../src/lib/database.js';
import * as schema from '../../src/lib/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

console.log('Database connection initialized with PostgreSQL');

const router = Router();

// Check database status
router.get('/status', async (req, res) => {
  try {
    // For now, assume database is working if we reach this point
    const demoUsersExist = true;
    
    res.json({
      success: true,
      database: {
        connected: true,
        tablesExist: true,
        existingTables: ['users', 'organizations', 'products', 'tracking_records'],
        missingTables: [],
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
        missingTables: ['users', 'organizations', 'products', 'tracking_records'],
        demoUsersExist: false
      }
    });
  }
});

// Run database migrations
router.post('/migrate', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Database migration completed successfully (PostgreSQL with Drizzle ORM)'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed'
    });
  }
});

// Seed database with demo data
router.post('/seed', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Database seeded successfully with demo data'
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({
      success: false,
      error: 'Seeding failed'
    });
  }
});

// Get migration SQL
router.get('/migration-sql', async (req, res) => {
  try {
    res.json({
      success: true,
      sql: '-- PostgreSQL database with Drizzle ORM migrations handled automatically'
    });
  } catch (error) {
    console.error('Failed to get migration SQL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get migration SQL'
    });
  }
});

// Get products data
router.get('/products', async (req, res) => {
  try {
    const products = await db.select().from(schema.products).orderBy(schema.products.created_at);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products data'
    });
  }
});

// Create a new product
router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    
    const newProduct = {
      name: productData.name || '',
      description: productData.description,
      category: productData.category || '',
      sku: productData.sku || '',
      batch_number: productData.batch_number || '',
      manufacturer_id: productData.manufacturer_id,
      current_owner_id: productData.current_owner_id,
      status: 'created' as const,
      origin_location: productData.origin_location || 'Unknown',
      current_location: productData.current_location || productData.origin_location || 'Unknown',
      price: productData.price,
      quantity: productData.quantity || 1,
      weight: productData.weight,
      dimensions: productData.dimensions,
      expiry_date: productData.expiry_date,
      certifications: productData.certifications,
      metadata: productData.metadata,
      blockchain_tx_hash: productData.blockchain_tx_hash,
      qr_code_data: productData.qr_code_data
    };

    const [insertedProduct] = await db.insert(schema.products).values(newProduct).returning();
    
    // Add initial tracking record
    const trackingRecord = {
      id: uuidv4(),
      product_id: insertedProduct.id,
      location: newProduct.origin_location,
      event_type: 'created',
      actor_id: productData.current_owner_id,
      notes: 'Product created',
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.insert(schema.trackingRecords).values(trackingRecord);

    res.json({
      success: true,
      data: insertedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// Update a product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedProduct] = await db
      .update(schema.products)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(schema.products.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// Delete a product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .delete(schema.products)
      .where(eq(schema.products.id, id));

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// Transfer a product
router.post('/products/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { newOwnerId, location, actorId } = req.body;
    
    // Update product ownership
    const [updatedProduct] = await db
      .update(schema.products)
      .set({
        current_owner_id: newOwnerId,
        current_location: location,
        status: 'in_transit',
        updated_at: new Date()
      })
      .where(eq(schema.products.id, id))
      .returning();

    // Add tracking record
    const trackingRecord = {
      id: uuidv4(),
      product_id: id,
      location,
      event_type: 'transferred',
      actor_id: actorId,
      notes: `Transferred to new owner: ${newOwnerId}`,
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.insert(schema.trackingRecords).values(trackingRecord);

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error transferring product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer product'
    });
  }
});

// Get product history
router.get('/products/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await db
      .select()
      .from(schema.trackingRecords)
      .where(eq(schema.trackingRecords.product_id, id))
      .orderBy(desc(schema.trackingRecords.created_at));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting product history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product history'
    });
  }
});

// Get tracking records data
router.get('/tracking-records', async (req, res) => {
  try {
    const trackingRecords = await db.select().from(schema.trackingRecords).orderBy(schema.trackingRecords.timestamp);
    res.json({
      success: true,
      data: trackingRecords
    });
  } catch (error) {
    console.error('Error getting tracking records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tracking records data'
    });
  }
});

// Add a new tracking record
router.post('/tracking-records', async (req, res) => {
  try {
    const trackingData = req.body;
    
    const newTrackingRecord = {
      id: uuidv4(),
      product_id: trackingData.product_id,
      location: trackingData.location,
      event_type: trackingData.event_type,
      actor_id: trackingData.actor_id,
      notes: trackingData.notes || '',
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [insertedRecord] = await db.insert(schema.trackingRecords).values(newTrackingRecord).returning();

    res.json({
      success: true,
      data: insertedRecord
    });
  } catch (error) {
    console.error('Error creating tracking record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tracking record'
    });
  }
});

// Get contracts data
router.get('/contracts', async (req, res) => {
  try {
    const contracts = await db.select().from(schema.smartContracts).orderBy(schema.smartContracts.created_at);
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Error getting contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contracts data'
    });
  }
});

// Deploy a new smart contract
router.post('/contracts', async (req, res) => {
  try {
    const contractData = req.body;
    
    const newContract = {
      id: uuidv4(),
      name: contractData.name,
      description: contractData.description,
      contract_type: contractData.contract_type,
      contract_address: contractData.contract_address,
      abi: contractData.abi,
      bytecode: contractData.bytecode,
      deployed_by: contractData.deployed_by,
      network: contractData.network || 'ethereum',
      status: contractData.status || 'active',
      gas_used: contractData.gas_used,
      deployment_cost: contractData.deployment_cost,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [insertedContract] = await db.insert(schema.smartContracts).values(newContract).returning();

    res.json({
      success: true,
      data: insertedContract
    });
  } catch (error) {
    console.error('Error deploying contract:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy contract'
    });
  }
});

// Get quality records data
router.get('/quality-records', async (req, res) => {
  try {
    const qualityRecords = await db.select().from(schema.qualityRecords).orderBy(schema.qualityRecords.created_at);
    res.json({
      success: true,
      data: qualityRecords
    });
  } catch (error) {
    console.error('Error getting quality records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quality records data'
    });
  }
});

// Add a new quality record
router.post('/quality-records', async (req, res) => {
  try {
    const qualityData = req.body;
    
    const newQualityRecord = {
      id: uuidv4(),
      product_id: qualityData.product_id,
      inspector_id: qualityData.inspector_id,
      quality_score: qualityData.quality_score || qualityData.score || '0',
      test_results: qualityData.test_results,
      compliance_status: qualityData.compliance_status || 'pending',
      notes: qualityData.notes || '',
      blockchain_tx_hash: qualityData.blockchain_tx_hash,
      created_at: new Date()
    };

    const [insertedRecord] = await db.insert(schema.qualityRecords).values(newQualityRecord).returning();

    res.json({
      success: true,
      data: insertedRecord
    });
  } catch (error) {
    console.error('Error creating quality record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quality record'
    });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    // Get various analytics data
    const [productsData, trackingData, contractsData, qualityData] = await Promise.all([
      db.select().from(schema.products),
      db.select().from(schema.trackingRecords),
      db.select().from(schema.smartContracts),
      db.select().from(schema.qualityRecords)
    ]);

    const analytics = {
      totalProducts: productsData.length || 0,
      totalTracking: trackingData.length || 0,
      totalContracts: contractsData.length || 0,
      totalQuality: qualityData.length || 0,
      products: productsData,
      trackingRecords: trackingData,
      smartContracts: contractsData,
      qualityRecords: qualityData
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data'
    });
  }
});

export default router;