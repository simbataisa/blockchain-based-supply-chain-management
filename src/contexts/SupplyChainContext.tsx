import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useWeb3 } from './Web3Context';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  batch_number: string;
  manufacturer_id: string;
  current_owner_id: string;
  status: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
  origin_location: string;
  current_location: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface TrackingRecord {
  id: string;
  product_id: string;
  location: string;
  timestamp: string;
  event_type: 'created' | 'transferred' | 'location_update' | 'quality_check' | 'delivered';
  actor_id: string;
  notes?: string;
  sensor_data?: any;
  blockchain_tx_hash?: string;
}

export interface SmartContract {
  id: string;
  name: string;
  description: string;
  contract_address: string;
  abi: any[];
  bytecode: string;
  deployed_by: string;
  deployed_at: string;
  status: 'deployed' | 'verified' | 'paused' | 'terminated';
  network_id: number;
}

export interface QualityRecord {
  id: string;
  product_id: string;
  inspector_id: string;
  quality_score: number;
  test_results: any;
  compliance_status: 'passed' | 'failed' | 'pending';
  notes?: string;
  created_at: string;
}

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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('tracking_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setTrackingRecords(data || []);
    } catch (error) {
      console.error('Error loading tracking records:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_contracts')
        .select('*')
        .order('deployed_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  // Alias for loadContracts to match interface
  const loadSmartContracts = loadContracts;

  const loadQualityRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('quality_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQualityRecords(data || []);
    } catch (error) {
      console.error('Error loading quality records:', error);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const newProduct = {
        ...productData,
        id: `prod_${Date.now()}`,
        manufacturer_id: user.id,
        current_owner_id: user.id,
        status: 'created' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) throw error;

      // Add initial tracking record
      await addTrackingRecord({
        product_id: data.id,
        location: productData.origin_location || 'Unknown',
        event_type: 'created',
        actor_id: user.id,
        notes: 'Product created'
      });

      setProducts(prev => [data, ...prev]);
      toast.success('Product created successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === id ? data : p));
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
      const { error: updateError } = await supabase
        .from('products')
        .update({
          current_owner_id: newOwnerId,
          current_location: location,
          status: 'in_transit',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('tracking_records')
        .select('*')
        .eq('product_id', productId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
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
        ...record,
        id: `track_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor_id: record.actor_id || user.id
      };

      const { data, error } = await supabase
        .from('tracking_records')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;

      setTrackingRecords(prev => [data, ...prev]);
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
        ...contractData,
        id: `contract_${Date.now()}`,
        contract_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        deployed_by: user.id,
        deployed_at: new Date().toISOString(),
        status: 'deployed' as const,
        network_id: 1 // Mainnet
      };

      const { data, error } = await supabase
        .from('smart_contracts')
        .insert(newContract)
        .select()
        .single();

      if (error) throw error;

      setContracts(prev => [data, ...prev]);
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
        ...record,
        id: `quality_${Date.now()}`,
        inspector_id: record.inspector_id || user.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quality_records')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;

      setQualityRecords(prev => [data, ...prev]);
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
      const [productsCount, trackingCount, contractsCount, qualityCount] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('tracking_records').select('*', { count: 'exact', head: true }),
        supabase.from('smart_contracts').select('*', { count: 'exact', head: true }),
        supabase.from('quality_records').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalProducts: productsCount.count || 0,
        totalTracking: trackingCount.count || 0,
        totalContracts: contractsCount.count || 0,
        totalQuality: qualityCount.count || 0,
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