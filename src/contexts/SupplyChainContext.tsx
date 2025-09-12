import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWeb3 } from './Web3Context';
import toast from 'react-hot-toast';

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
      const response = await fetch('/api/database/products');
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadTrackingRecords = async () => {
    try {
      const response = await fetch('/api/database/tracking-records');
      const result = await response.json();
      if (result.success) {
        setTrackingRecords(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load tracking records');
      }
    } catch (error) {
      console.error('Error loading tracking records:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/database/contracts');
      const result = await response.json();
      if (result.success) {
        setContracts(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load contracts');
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  // Alias for loadContracts to match interface
  const loadSmartContracts = loadContracts;

  const loadQualityRecords = async () => {
    try {
      const response = await fetch('/api/database/quality-records');
      const result = await response.json();
      if (result.success) {
        setQualityRecords(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load quality records');
      }
    } catch (error) {
      console.error('Error loading quality records:', error);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/database/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           ...productData,
           current_owner_id: productData.current_owner_id || user.id
         })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create product');
      }

      setProducts(prev => [result.data, ...prev]);
      toast.success('Product created successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch(`/api/database/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update product');
      }

      setProducts(prev => prev.map(p => p.id === id ? result.data : p));
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
      const response = await fetch(`/api/database/products/${productId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newOwnerId,
          location,
          actorId: user.id
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transfer product');
      }

      await loadProducts();
      toast.success('Product transferred successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error transferring product:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch(`/api/database/products/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product');
      }

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
      const response = await fetch(`/api/database/products/${productId}/history`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get product history');
      }
    } catch (error) {
      console.error('Error getting product history:', error);
      return [];
    }
  };

  const addTrackingRecord = async (record: Partial<TrackingRecord>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/database/tracking-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          actor_id: record.actor_id || user.id
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add tracking record');
      }

      setTrackingRecords(prev => [result.data, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding tracking record:', error);
      return { success: false, error: error.message };
    }
  };

  const deployContract = async (contractData: Partial<SmartContract>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/database/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contractData,
          deployed_by: contractData.deployed_by || user.id
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deploy contract');
      }

      setContracts(prev => [result.data, ...prev]);
      toast.success('Smart contract deployed successfully');
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
      const response = await fetch('/api/database/quality-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          inspector_id: record.inspector_id || user.id
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add quality record');
      }

      setQualityRecords(prev => [result.data, ...prev]);
      toast.success('Quality record added successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error adding quality record:', error);
      return { success: false, error: error.message };
    }
  };

  const getAnalytics = async () => {
    try {
      const response = await fetch('/api/database/analytics');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
      
      return result.data;
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