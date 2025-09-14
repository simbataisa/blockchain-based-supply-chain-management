import React from 'react';
import {
  Package,
  MapPin,
  Clock,
  Edit,
  Eye,
  FileText,
  QrCode,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  selectedProducts: string[];
  statusConfig: Record<string, { icon: React.ComponentType<any>; color: string }>;
  onToggleSelection: (productId: string) => void;
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onQuality: (product: Product) => void;
  onQRCode: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedProducts,
  statusConfig,
  onToggleSelection,
  onEdit,
  onView,
  onQuality,
  onQRCode,
  onDelete
}) => {
  const StatusIcon = statusConfig[product.status].icon;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedProducts.includes(product.id)}
            onChange={() => onToggleSelection(product.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[product.status].color}`}>
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {product.status.replace('_', ' ')}
          </span>
          <div className="relative">
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>SKU: {product.sku}</span>
          <span>Batch: {product.batch_number}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{product.current_location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{new Date(product.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500 capitalize">{product.category}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onView(product)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onQuality(product)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onQRCode(product)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
export type { Product, ProductCardProps };