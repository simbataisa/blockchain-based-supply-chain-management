import React from 'react';
import { X, Edit, FileText } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

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

interface ProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onQualityRecords: (product: Product) => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  product,
  onClose,
  onEdit,
  onQualityRecords
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{product.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{product.category?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                    <p className="mt-1 text-sm text-gray-900">{product.batch_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(product.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Technical Specifications */}
              {product.metadata && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.metadata.weight && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Weight</label>
                        <p className="mt-1 text-sm text-gray-900">{product.metadata.weight} kg</p>
                      </div>
                    )}
                    {product.metadata.manufacturing_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(product.metadata.manufacturing_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {product.metadata.dimensions && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {product.metadata.dimensions.length} × {product.metadata.dimensions.width} × {product.metadata.dimensions.height} cm
                        </p>
                      </div>
                    )}
                    {product.metadata.temperature_range && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Temperature Range</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {product.metadata.temperature_range.min}°C to {product.metadata.temperature_range.max}°C
                        </p>
                      </div>
                    )}
                    {product.metadata.expiry_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(product.metadata.expiry_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {product.metadata.quality_grade && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quality Grade</label>
                        <p className="mt-1 text-sm text-gray-900">Grade {product.metadata.quality_grade}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Lifecycle Tracking */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifecycle Tracking</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-600">{new Date(product.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Status: {product.status.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-600">Location: {product.current_location}</p>
                    </div>
                  </div>
                  {product.updated_at !== product.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-600">{new Date(product.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-gray-50 rounded-lg p-4">
                <QRCodeGenerator 
                  data={JSON.stringify({
                    id: product.id,
                    sku: product.sku,
                    batch: product.batch_number,
                    name: product.name,
                    status: product.status,
                    location: product.current_location,
                    created: product.created_at
                  })}
                  size={150}
                  title="Product QR Code"
                  showActions={false}
                  className=""
                />
                <p className="text-xs text-gray-600 mt-2 text-center">Scan to verify authenticity</p>
              </div>
              
              {/* Location History */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location History</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Origin:</span>
                    <span className="text-gray-900">{product.origin_location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current:</span>
                    <span className="text-gray-900">{product.current_location}</span>
                  </div>
                </div>
              </div>
              
              {/* Supplier Information */}
              {product.metadata?.supplier_info && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                  <div className="space-y-2">
                    {product.metadata.supplier_info.name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Name:</span>
                        <span className="text-gray-900">{product.metadata.supplier_info.name}</span>
                      </div>
                    )}
                    {product.metadata.supplier_info.contact && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Contact:</span>
                        <span className="text-gray-900">{product.metadata.supplier_info.contact}</span>
                      </div>
                    )}
                    {product.metadata.supplier_info.certification && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cert:</span>
                        <span className="text-gray-900">{product.metadata.supplier_info.certification}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => onEdit(product)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => onQualityRecords(product)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Quality Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
export type { ProductDetailsModalProps, Product };