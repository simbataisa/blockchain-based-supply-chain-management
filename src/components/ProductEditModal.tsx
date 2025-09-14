import React from 'react';
import { X } from 'lucide-react';

interface Product {
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

interface ProductEditModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  onChange: (product: Product) => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  product,
  onClose,
  onSubmit,
  onChange
}) => {
  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(product);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                required
                value={product.name}
                onChange={(e) => onChange({...product, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                required
                value={product.sku}
                onChange={(e) => onChange({...product, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              value={product.description}
              onChange={(e) => onChange({...product, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={product.status}
                onChange={(e) => onChange({...product, status: e.target.value as Product['status']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created">Created</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="verified">Verified</option>
                <option value="recalled">Recalled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                required
                value={product.category}
                onChange={(e) => onChange({...product, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
              <input
                type="text"
                required
                value={product.batch_number}
                onChange={(e) => onChange({...product, batch_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
              <input
                type="text"
                required
                value={product.current_location}
                onChange={(e) => onChange({...product, current_location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Origin Location</label>
            <input
              type="text"
              required
              value={product.origin_location}
              onChange={(e) => onChange({...product, origin_location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Metadata fields */}
          {product.metadata && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-t pt-4">Technical Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.metadata.weight || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: { ...product.metadata, weight: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing Date</label>
                  <input
                    type="date"
                    value={product.metadata.manufacturing_date || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: { ...product.metadata, manufacturing_date: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (L × W × H cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Length"
                    value={product.metadata.dimensions?.length || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: {
                        ...product.metadata,
                        dimensions: { ...product.metadata.dimensions, length: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={product.metadata.dimensions?.width || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: {
                        ...product.metadata,
                        dimensions: { ...product.metadata.dimensions, width: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={product.metadata.dimensions?.height || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: {
                        ...product.metadata,
                        dimensions: { ...product.metadata.dimensions, height: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={product.metadata.expiry_date || ''}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: { ...product.metadata, expiry_date: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality Grade</label>
                  <select
                    value={product.metadata.quality_grade || 'A'}
                    onChange={(e) => onChange({
                      ...product,
                      metadata: { ...product.metadata, quality_grade: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">Grade A - Premium</option>
                    <option value="B">Grade B - Standard</option>
                    <option value="C">Grade C - Basic</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;
export type { ProductEditModalProps, Product };