import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values from Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          organization?: string;
          avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: string;
          organization?: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          organization?: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
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
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          category: string;
          sku: string;
          batch_number: string;
          manufacturer_id: string;
          current_owner_id: string;
          status?: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
          origin_location: string;
          current_location: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          sku?: string;
          batch_number?: string;
          manufacturer_id?: string;
          current_owner_id?: string;
          status?: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
          origin_location?: string;
          current_location?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
      };
      tracking_records: {
        Row: {
          id: string;
          product_id: string;
          location: string;
          timestamp: string;
          event_type: 'created' | 'transferred' | 'location_update' | 'quality_check' | 'delivered';
          actor_id: string;
          notes?: string;
          sensor_data?: any;
          blockchain_tx_hash?: string;
        };
        Insert: {
          id: string;
          product_id: string;
          location: string;
          timestamp?: string;
          event_type: 'created' | 'transferred' | 'location_update' | 'quality_check' | 'delivered';
          actor_id: string;
          notes?: string;
          sensor_data?: any;
          blockchain_tx_hash?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          location?: string;
          timestamp?: string;
          event_type?: 'created' | 'transferred' | 'location_update' | 'quality_check' | 'delivered';
          actor_id?: string;
          notes?: string;
          sensor_data?: any;
          blockchain_tx_hash?: string;
        };
      };
      smart_contracts: {
        Row: {
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
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          contract_address: string;
          abi: any[];
          bytecode: string;
          deployed_by: string;
          deployed_at?: string;
          status?: 'deployed' | 'verified' | 'paused' | 'terminated';
          network_id: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          contract_address?: string;
          abi?: any[];
          bytecode?: string;
          deployed_by?: string;
          deployed_at?: string;
          status?: 'deployed' | 'verified' | 'paused' | 'terminated';
          network_id?: number;
        };
      };
      quality_records: {
        Row: {
          id: string;
          product_id: string;
          inspector_id: string;
          quality_score: number;
          test_results: any;
          compliance_status: 'passed' | 'failed' | 'pending';
          notes?: string;
          created_at: string;
        };
        Insert: {
          id: string;
          product_id: string;
          inspector_id: string;
          quality_score: number;
          test_results: any;
          compliance_status: 'passed' | 'failed' | 'pending';
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          inspector_id?: string;
          quality_score?: number;
          test_results?: any;
          compliance_status?: 'passed' | 'failed' | 'pending';
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];