import React, { useState } from 'react';
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

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => void;
  categories: string[];
  newProduct: Partial<Product> & {
    metadata: {
      weight: string;
      manufacturing_date: string;
      dimensions: {
        length: string;
        width: string;
        height: string;
      };
      temperature_range: {
        min: string;
        max: string;
      };
      expiry_date: string;
      lot_number: string;
      quality_grade: string;
      supplier_info: {
        name: string;
        contact: string;
        certification: string;
      };
    };
  };
  onProductChange: (product: any) => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  newProduct,
  onProductChange
}) => {
  const [createStep, setCreateStep] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newProduct);
    setCreateStep(1);
  };

  const handleClose = () => {
    onClose();
    setCreateStep(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  createStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
              ))}
              <button
                onClick={handleClose}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {createStep === 1 && 'Basic Information'}
            {createStep === 2 && 'Technical Specifications'}
            {createStep === 3 && 'Quality & Compliance'}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Information */}
          {createStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name || ''}
                    onChange={(e) => onProductChange({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku || ''}
                    onChange={(e) => onProductChange({...newProduct, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  value={newProduct.description || ''}
                  onChange={(e) => onProductChange({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={newProduct.category || ''}
                    onChange={(e) => onProductChange({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.batch_number || ''}
                    onChange={(e) => onProductChange({...newProduct, batch_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin Location *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.origin_location || ''}
                    onChange={(e) => onProductChange({...newProduct, origin_location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Location *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.current_location || ''}
                    onChange={(e) => onProductChange({...newProduct, current_location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Technical Specifications */}
          {createStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.metadata?.weight || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: { ...newProduct.metadata, weight: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing Date</label>
                  <input
                    type="date"
                    value={newProduct.metadata?.manufacturing_date || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: { ...newProduct.metadata, manufacturing_date: e.target.value }
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
                    value={newProduct.metadata?.dimensions?.length || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        dimensions: { ...newProduct.metadata?.dimensions, length: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={newProduct.metadata?.dimensions?.width || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        dimensions: { ...newProduct.metadata?.dimensions, width: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={newProduct.metadata?.dimensions?.height || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        dimensions: { ...newProduct.metadata?.dimensions, height: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Range (°C)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Temperature"
                    value={newProduct.metadata?.temperature_range?.min || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        temperature_range: { ...newProduct.metadata?.temperature_range, min: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Temperature"
                    value={newProduct.metadata?.temperature_range?.max || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        temperature_range: { ...newProduct.metadata?.temperature_range, max: e.target.value }
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
                    value={newProduct.metadata?.expiry_date || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: { ...newProduct.metadata, expiry_date: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lot Number</label>
                  <input
                    type="text"
                    value={newProduct.metadata?.lot_number || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: { ...newProduct.metadata, lot_number: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Quality & Compliance */}
          {createStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality Grade</label>
                  <select
                    value={newProduct.metadata?.quality_grade || 'A'}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: { ...newProduct.metadata, quality_grade: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">Grade A - Premium</option>
                    <option value="B">Grade B - Standard</option>
                    <option value="C">Grade C - Basic</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Information</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    value={newProduct.metadata?.supplier_info?.name || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        supplier_info: { ...newProduct.metadata?.supplier_info, name: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact Information"
                    value={newProduct.metadata?.supplier_info?.contact || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        supplier_info: { ...newProduct.metadata?.supplier_info, contact: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Certification Number"
                    value={newProduct.metadata?.supplier_info?.certification || ''}
                    onChange={(e) => onProductChange({
                      ...newProduct,
                      metadata: {
                        ...newProduct.metadata,
                        supplier_info: { ...newProduct.metadata?.supplier_info, certification: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <div className="flex space-x-2">
              {createStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCreateStep(createStep - 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              
              {createStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCreateStep(createStep + 1)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Product
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
export type { CreateProductModalProps, Product };