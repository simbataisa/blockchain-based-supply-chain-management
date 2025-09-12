import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/database';
import * as schema from '../lib/schema';
import { useAuth } from './AuthContext';
import { useWeb3 } from './Web3Context';
import toast from 'react-hot-toast';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Use the types from the schema instead of defining interfaces
import type { Product as DbProduct, TrackingRecord as DbTrackingRecord, SmartContract as DbSmartContract, QualityRecord as DbQualityRecord } from '../lib/schema';

export type Product = DbProduct;
export type TrackingRecord = DbTrackingRecord;
export type SmartContract = DbSmartContract;
export type QualityRecord = DbQualityRecord;

interface SupplyChainContextType {
  // Products
  products: Product[];
  selectedProduct: Product | null;
  loadingProducts: boolean;
  loadProducts: () => Promise<void>;
  createProduct: (productData: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  transferProduct: (productId: string, newOwnerId: string, location: string) => Promise<{ success: boolean; error?: string }>;
  getProductHistory: (productId: string) => Promise<TrackingRecord[]>;
  
  // Tracking
  trackingRecords: TrackingRecord[];
  loadTrackingRecords: () => Promise<void>;
  addTrackingRecord: (record: Partial<TrackingRecord>) => Promise<{ success: boolean; error?: string }>;

  // Smart Contracts
  contracts: SmartContract[];
  smartContracts: SmartContract[];
  loadSmartContracts: () => Promise<void>;
  createSmartContract: (contractData: Partial<SmartContract>) => Promise<{ success: boolean; error?: string }>;
  deployContract: (contractData: Partial<SmartContract>) => Promise<{ success: boolean; error?: string }>;
  
  // Quality
  qualityRecords: QualityRecord[];
  addQualityRecord: (record: Partial<QualityRecord>) => Promise<{ success: boolean; error?: string }>;
  
  // Analytics
  getAnalytics: () => Promise<any>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const SupplyChainContext = createContext<SupplyChainContextType | undefined>(undefined);

export const useSupplyChain = () => {
  const context = useContext(SupplyChainContext);
  if (context === undefined) {
    throw new Error('useSupplyChain must be used within a SupplyChainProvider');
  }
  return context;
};

interface SupplyChainProviderProps {
  children: ReactNode;
}

export const SupplyChainProvider: React.FC<SupplyChainProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { web3, account } = useWeb3();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    
    try {
      await Promise.all([
        loadProducts(),
        loadTrackingRecords(),
        loadContracts(),
        loadQualityRecords()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await db.select().from(schema.products).orderBy(desc(schema.products.created_at));
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadTrackingRecords = async () => {
    try {
      const data = await db.select().from(schema.trackingRecords).orderBy(desc(schema.trackingRecords.timestamp));
      setTrackingRecords(data || []);
    } catch (error) {
      console.error('Error loading tracking records:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const data = await db.select().from(schema.smartContracts).orderBy(desc(schema.smartContracts.created_at));
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  // Alias for loadContracts to match interface
  const loadSmartContracts = loadContracts;

  const loadQualityRecords = async () => {
    try {
      const data = await db.select().from(schema.qualityRecords).orderBy(desc(schema.qualityRecords.created_at));
      setQualityRecords(data || []);
    } catch (error) {
      console.error('Error loading quality records:', error);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const newProduct = {
        name: productData.name || '',
        description: productData.description,
        category: productData.category || '',
        sku: productData.sku || '',
        batch_number: productData.batch_number || '',
        manufacturer_id: productData.manufacturer_id || user.id,
        current_owner_id: productData.current_owner_id || user.id,
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
      await addTrackingRecord({
        product_id: insertedProduct.id,
        location: newProduct.origin_location,
        event_type: 'created',
        actor_id: user.id,
        notes: 'Product created'
      });

      setProducts(prev => [insertedProduct, ...prev]);
      toast.success('Product created successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const [updatedProduct] = await db
        .update(schema.products)
        .set({
          ...updates,
          updated_at: new Date()
        })
        .where(eq(schema.products.id, id))
        .returning();

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Product updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  };

  const transferProduct = async (productId: string, newOwnerId: string, location: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // Update product ownership
      await db
        .update(schema.products)
        .set({
          current_owner_id: newOwnerId,
          current_location: location,
          status: 'in_transit',
          updated_at: new Date()
        })
        .where(eq(schema.products.id, productId));

      // Add tracking record
      await addTrackingRecord({
        product_id: productId,
        location,
        event_type: 'transferred',
        actor_id: user.id,
        notes: `Transferred to new owner: ${newOwnerId}`
      });

      await loadProducts();
      toast.success('Product transferred successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error transferring product:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await db
        .delete(schema.products)
        .where(eq(schema.products.id, id));

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  };

  const getProductHistory = async (productId: string): Promise<TrackingRecord[]> => {
    try {
      const data = await db
        .select()
        .from(schema.trackingRecords)
        .where(eq(schema.trackingRecords.product_id, productId))
        .orderBy(desc(schema.trackingRecords.created_at));

      return data || [];
    } catch (error) {
      console.error('Error getting product history:', error);
      return [];
    }
  };

  const addTrackingRecord = async (record: Partial<TrackingRecord>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const newRecord = {
        id: uuidv4(),
        product_id: record.product_id || '',
        location: record.location || '',
        latitude: record.latitude || null,
        longitude: record.longitude || null,
        event_type: record.event_type || '',
        actor_id: record.actor_id || user.id,
        sensor_data: record.sensor_data || null,
        blockchain_tx_hash: record.blockchain_tx_hash || null,
        notes: record.notes || '',
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const [insertedRecord] = await db
        .insert(schema.trackingRecords)
        .values(newRecord)
        .returning();

      setTrackingRecords(prev => [insertedRecord, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding tracking record:', error);
      return { success: false, error: error.message };
    }
  };

  const deployContract = async (contractData: Partial<SmartContract>) => {
    if (!user || !web3 || !account) {
      return { success: false, error: 'Web3 not connected' };
    }

    try {
      // This would typically deploy to blockchain
      // For now, we'll simulate it
      const newContract = {
        id: uuidv4(),
        name: contractData.name || '',
        contract_address: contractData.contract_address || `0x${Math.random().toString(16).substr(2, 40)}`,
        abi: contractData.abi || {},
        bytecode: contractData.bytecode || '',
        network: contractData.network || 'localhost',
        deployed_by: contractData.deployed_by || user.id,
        deployment_tx_hash: contractData.deployment_tx_hash || null,
        deployment_block_number: contractData.deployment_block_number || null,
        status: 'active' as const,
        version: contractData.version || '1.0.0',
        description: contractData.description || '',
        created_at: new Date(),
        updated_at: new Date()
      };

      const [insertedContract] = await db
        .insert(schema.smartContracts)
        .values(newContract)
        .returning();

      setContracts(prev => [insertedContract, ...prev]);
      toast.success('Contract deployed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error deploying contract:', error);
      return { success: false, error: error.message };
    }
  };

  // Alias for deployContract to match interface
  const createSmartContract = deployContract;

  const addQualityRecord = async (record: Partial<QualityRecord>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const newRecord = {
        id: uuidv4(),
        product_id: record.product_id || '',
        inspector_id: record.inspector_id || user.id,
        quality_score: record.quality_score || '0',
        test_results: record.test_results || {},
        compliance_status: record.compliance_status || 'pending',
        notes: record.notes || '',
        blockchain_tx_hash: record.blockchain_tx_hash || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [insertedRecord] = await db
        .insert(schema.qualityRecords)
        .values(newRecord)
        .returning();

      setQualityRecords(prev => [insertedRecord, ...prev]);
      toast.success('Quality record added successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error adding quality record:', error);
      return { success: false, error: error.message };
    }
  };

  const getAnalytics = async () => {
    try {
      // Get various analytics data
      const [productsData, trackingData, contractsData, qualityData] = await Promise.all([
        db.select().from(schema.products),
        db.select().from(schema.trackingRecords),
        db.select().from(schema.smartContracts),
        db.select().from(schema.qualityRecords)
      ]);

      return {
        totalProducts: productsData.length || 0,
        totalTracking: trackingData.length || 0,
        totalContracts: contractsData.length || 0,
        totalQuality: qualityData.length || 0,
        products,
        trackingRecords,
        contracts,
        qualityRecords
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  };

  const value = {
    products,
    selectedProduct,
    loadingProducts,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    transferProduct,
    getProductHistory,
    trackingRecords,
    loadTrackingRecords,
    addTrackingRecord,
    contracts,
    smartContracts: contracts,
    loadSmartContracts,
    createSmartContract,
    deployContract,
    qualityRecords,
    addQualityRecord,
    getAnalytics,
    refreshData,
  };

  return (
    <SupplyChainContext.Provider value={value}>
      {children}
    </SupplyChainContext.Provider>
  );
};

export default SupplyChainProvider;