import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  FileText,
  QrCode,
  Truck,
  Factory,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCodeGenerator from '../components/QRCodeGenerator';
import QRCodeVerifier from '../components/QRCodeVerifier';

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

const ProductManagement: React.FC = () => {
  const { products, loadProducts, createProduct, updateProduct, deleteProduct } = useSupplyChain();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [showQRVerifier, setShowQRVerifier] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'electronics',
    sku: '',
    batch_number: '',
    origin_location: '',
    current_location: '',
    metadata: {
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      temperature_range: { min: '', max: '' },
      expiry_date: '',
      certifications: [],
      quality_grade: 'A',
      compliance_standards: [],
      manufacturing_date: '',
      lot_number: '',
      supplier_info: { name: '', contact: '', certification: '' }
    }
  });

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = [
    'electronics',
    'pharmaceuticals',
    'food_beverage',
    'automotive',
    'textiles',
    'chemicals',
    'machinery',
    'other'
  ];

  const statusConfig = {
    created: { color: 'bg-blue-100 text-blue-800', icon: Package },
    in_transit: { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    verified: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    recalled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  const filteredProducts = products
    .filter(product => {
      // Enhanced search - includes metadata search
      const matchesSearch = searchTerm === '' || (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.origin_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.current_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.metadata?.lot_number && product.metadata.lot_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.metadata?.supplier_info?.name && product.metadata.supplier_info.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      // Location filter
      const matchesLocation = filterLocation === 'all' || 
        product.current_location.toLowerCase().includes(filterLocation.toLowerCase()) ||
        product.origin_location.toLowerCase().includes(filterLocation.toLowerCase());
      
      // Date range filter
      const matchesDateRange = (!filterDateRange.start && !filterDateRange.end) || (
        (!filterDateRange.start || new Date(product.created_at) >= new Date(filterDateRange.start)) &&
        (!filterDateRange.end || new Date(product.created_at) <= new Date(filterDateRange.end))
      );
      
      return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesDateRange;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Product];
      const bValue = b[sortBy as keyof Product];
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        ...newProduct,
        id: `prod_${Date.now()}`,
        manufacturer_id: user?.id || '',
        current_owner_id: user?.id || '',
        status: 'created' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      toast.success('Product created successfully!');
      setShowCreateModal(false);
      setNewProduct({
        name: '',
        description: '',
        category: 'electronics',
        sku: '',
        batch_number: '',
        origin_location: '',
        current_location: '',
        metadata: {
          weight: '',
          dimensions: { length: '', width: '', height: '' },
          temperature_range: { min: '', max: '' },
          expiry_date: '',
          certifications: [],
          quality_grade: 'A',
          compliance_standards: [],
          manufacturing_date: '',
          lot_number: '',
          supplier_info: { name: '', contact: '', certification: '' }
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      await updateProduct(editingProduct.id, {
        ...editingProduct,
        updated_at: new Date().toISOString()
      });
      toast.success('Product updated successfully!');
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        toast.success('Product deleted successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete product');
      }
    }
  };

  const handleBatchAction = async (action: string, value?: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            for (const productId of selectedProducts) {
              await deleteProduct(productId);
            }
            toast.success(`${selectedProducts.length} products deleted successfully!`);
            setSelectedProducts([]);
          }
          break;
        case 'export':
          const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
          const csvContent = [
            'Name,SKU,Status,Category,Location,Created Date,Batch Number,Origin Location',
            ...selectedProductsData.map(p => 
              `"${p.name}","${p.sku}","${p.status}","${p.category}","${p.current_location}","${new Date(p.created_at).toLocaleDateString()}","${p.batch_number}","${p.origin_location}"`
            )
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success('Products exported successfully!');
          break;
        case 'status_update':
          if (value && window.confirm(`Are you sure you want to update the status of ${selectedProducts.length} products to "${value}"?`)) {
            for (const productId of selectedProducts) {
              const product = products.find(p => p.id === productId);
              if (product) {
                await updateProduct(productId, { ...product, status: value as any });
              }
            }
            toast.success(`${selectedProducts.length} products updated successfully!`);
            setSelectedProducts([]);
          }
          break;
        case 'location_update':
          const newLocation = value || window.prompt('Enter new location for selected products:');
          if (newLocation) {
            for (const productId of selectedProducts) {
              const product = products.find(p => p.id === productId);
              if (product) {
                await updateProduct(productId, { ...product, current_location: newLocation });
              }
            }
            toast.success(`Location updated for ${selectedProducts.length} products!`);
            setSelectedProducts([]);
          }
          break;
        case 'print_labels':
          const selectedProductsForPrint = products.filter(p => selectedProducts.includes(p.id));
          const printContent = selectedProductsForPrint.map(product => `
            <div style="page-break-after: always; padding: 20px; border: 1px solid #ccc; margin-bottom: 20px;">
              <h2>${product.name}</h2>
              <p><strong>SKU:</strong> ${product.sku}</p>
              <p><strong>Batch:</strong> ${product.batch_number}</p>
              <p><strong>Status:</strong> ${product.status}</p>
              <p><strong>Location:</strong> ${product.current_location}</p>
              <p><strong>Created:</strong> ${new Date(product.created_at).toLocaleDateString()}</p>
              <div style="margin-top: 20px; text-align: center;">
                <div style="border: 2px solid #000; padding: 10px; display: inline-block;">
                  QR Code Placeholder<br/>
                  ${product.id}
                </div>
              </div>
            </div>
          `).join('');
          
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Product Labels</title>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    @media print { body { margin: 0; } }
                  </style>
                </head>
                <body>${printContent}</body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
          }
          toast.success(`Generated labels for ${selectedProducts.length} products`);
          break;
        default:
          toast.error('Unknown action');
      }
    } catch (error: any) {
      toast.error(error.message || 'Batch action failed');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const StatusIcon = statusConfig[product.status].icon;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProductSelection(product.id)}
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
              onClick={() => {
                setEditingProduct(product);
                setShowEditModal(true);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setViewingProduct(product);
                setShowDetailModal(true);
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setViewingProduct(product);
                setShowQualityModal(true);
              }}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setSelectedProductForQR(product);
                setShowQRGenerator(true);
              }}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your products with advanced tracking and quality control.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowQRVerifier(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>Verify Product</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="created">Created</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="verified">Verified</option>
              <option value="recalled">Recalled</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="status-asc">Status A-Z</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
              <span className={`transform transition-transform ${advancedFiltersOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {(filterLocation !== 'all' || filterDateRange.start || filterDateRange.end) && (
              <button
                onClick={() => {
                  setFilterLocation('all');
                  setFilterDateRange({ start: '', end: '' });
                }}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear Advanced Filters
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {advancedFiltersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filterLocation === 'all' ? '' : filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value || 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created From</label>
                <input
                  type="date"
                  value={filterDateRange.start}
                  onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created To</label>
                <input
                  type="date"
                  value={filterDateRange.end}
                  onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Batch Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} product(s) selected
                </span>
                
                {/* Export */}
                <button
                  onClick={() => handleBatchAction('export')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                {/* Status Update Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    <span>Update Status</span>
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1 min-w-[140px]">
                      <button
                        onClick={() => handleBatchAction('status_update', 'created')}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Created
                      </button>
                      <button
                        onClick={() => handleBatchAction('status_update', 'in_transit')}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        In Transit
                      </button>
                      <button
                        onClick={() => handleBatchAction('status_update', 'delivered')}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Delivered
                      </button>
                      <button
                        onClick={() => handleBatchAction('status_update', 'verified')}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Verified
                      </button>
                      <button
                        onClick={() => handleBatchAction('status_update', 'recalled')}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Recalled
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Location Update */}
                <button
                  onClick={() => handleBatchAction('location_update')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Update Location</span>
                </button>
                
                {/* Print Labels */}
                <button
                  onClick={() => handleBatchAction('print_labels')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Print Labels</span>
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
              
              <button
                onClick={() => setSelectedProducts([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllProducts}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-500">
                {filteredProducts.length} product(s) found
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Product Modal */}
      {showCreateModal && (
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
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {createStep === 1 && 'Basic Information'}
                {createStep === 2 && 'Technical Specifications'}
                {createStep === 3 && 'Quality & Compliance'}
              </div>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6">
              {/* Step 1: Basic Information */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                      <input
                        type="text"
                        required
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
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
                        value={newProduct.batch_number}
                        onChange={(e) => setNewProduct({...newProduct, batch_number: e.target.value})}
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
                        value={newProduct.origin_location}
                        onChange={(e) => setNewProduct({...newProduct, origin_location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Location *</label>
                      <input
                        type="text"
                        required
                        value={newProduct.current_location}
                        onChange={(e) => setNewProduct({...newProduct, current_location: e.target.value})}
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
                        value={newProduct.metadata.weight}
                        onChange={(e) => setNewProduct({
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
                        value={newProduct.metadata.manufacturing_date}
                        onChange={(e) => setNewProduct({
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
                        value={newProduct.metadata.dimensions.length}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            dimensions: { ...newProduct.metadata.dimensions, length: e.target.value }
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Width"
                        value={newProduct.metadata.dimensions.width}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            dimensions: { ...newProduct.metadata.dimensions, width: e.target.value }
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={newProduct.metadata.dimensions.height}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            dimensions: { ...newProduct.metadata.dimensions, height: e.target.value }
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
                        value={newProduct.metadata.temperature_range.min}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            temperature_range: { ...newProduct.metadata.temperature_range, min: e.target.value }
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max Temperature"
                        value={newProduct.metadata.temperature_range.max}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            temperature_range: { ...newProduct.metadata.temperature_range, max: e.target.value }
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
                        value={newProduct.metadata.expiry_date}
                        onChange={(e) => setNewProduct({
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
                        value={newProduct.metadata.lot_number}
                        onChange={(e) => setNewProduct({
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
                        value={newProduct.metadata.quality_grade}
                        onChange={(e) => setNewProduct({
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
                        value={newProduct.metadata.supplier_info.name}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            supplier_info: { ...newProduct.metadata.supplier_info, name: e.target.value }
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Contact Information"
                        value={newProduct.metadata.supplier_info.contact}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            supplier_info: { ...newProduct.metadata.supplier_info, contact: e.target.value }
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Certification Number"
                        value={newProduct.metadata.supplier_info.certification}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          metadata: {
                            ...newProduct.metadata,
                            supplier_info: { ...newProduct.metadata.supplier_info, certification: e.target.value }
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
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateStep(1);
                    }}
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
      )}

      {/* Product Detail View Modal */}
      {showDetailModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewingProduct.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">SKU: {viewingProduct.sku}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[viewingProduct.status]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingProduct.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
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
                        <p className="mt-1 text-sm text-gray-900">{viewingProduct.description}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingProduct.category?.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingProduct.batch_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(viewingProduct.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technical Specifications */}
                  {viewingProduct.metadata && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingProduct.metadata.weight && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Weight</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingProduct.metadata.weight} kg</p>
                          </div>
                        )}
                        {viewingProduct.metadata.manufacturing_date && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingProduct.metadata.manufacturing_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {viewingProduct.metadata.dimensions && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {viewingProduct.metadata.dimensions.length} × {viewingProduct.metadata.dimensions.width} × {viewingProduct.metadata.dimensions.height} cm
                            </p>
                          </div>
                        )}
                        {viewingProduct.metadata.temperature_range && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Temperature Range</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {viewingProduct.metadata.temperature_range.min}°C to {viewingProduct.metadata.temperature_range.max}°C
                            </p>
                          </div>
                        )}
                        {viewingProduct.metadata.expiry_date && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(viewingProduct.metadata.expiry_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {viewingProduct.metadata.quality_grade && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Quality Grade</label>
                            <p className="mt-1 text-sm text-gray-900">Grade {viewingProduct.metadata.quality_grade}</p>
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
                          <p className="text-xs text-gray-600">{new Date(viewingProduct.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Status: {viewingProduct.status.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-600">Location: {viewingProduct.current_location}</p>
                        </div>
                      </div>
                      {viewingProduct.updated_at !== viewingProduct.created_at && (
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                            <p className="text-xs text-gray-600">{new Date(viewingProduct.updated_at).toLocaleString()}</p>
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
                        id: viewingProduct.id,
                        sku: viewingProduct.sku,
                        batch: viewingProduct.batch_number,
                        name: viewingProduct.name,
                        status: viewingProduct.status,
                        location: viewingProduct.current_location,
                        created: viewingProduct.created_at
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
                        <span className="text-gray-900">{viewingProduct.origin_location}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Current:</span>
                        <span className="text-gray-900">{viewingProduct.current_location}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Supplier Information */}
                  {viewingProduct.metadata?.supplier_info && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                      <div className="space-y-2">
                        {viewingProduct.metadata.supplier_info.name && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Name:</span>
                            <span className="text-gray-900">{viewingProduct.metadata.supplier_info.name}</span>
                          </div>
                        )}
                        {viewingProduct.metadata.supplier_info.contact && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Contact:</span>
                            <span className="text-gray-900">{viewingProduct.metadata.supplier_info.contact}</span>
                          </div>
                        )}
                        {viewingProduct.metadata.supplier_info.certification && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Cert:</span>
                            <span className="text-gray-900">{viewingProduct.metadata.supplier_info.certification}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setEditingProduct(viewingProduct);
                        setShowDetailModal(false);
                        setShowEditModal(true);
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewingProduct(viewingProduct);
                        setShowDetailModal(false);
                        setShowQualityModal(true);
                      }}
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
      )}
      
      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created">Created</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="verified">Verified</option>
                    <option value="recalled">Recalled</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
                <input
                  type="text"
                  required
                  value={editingProduct.current_location}
                  onChange={(e) => setEditingProduct({...editingProduct, current_location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
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
      )}
      
      {/* Quality Management Modal */}
      {showQualityModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Quality Management</h2>
                  <p className="text-sm text-gray-600 mt-1">{viewingProduct.name} - {viewingProduct.sku}</p>
                </div>
                <button
                  onClick={() => setShowQualityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Inspections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Quality Inspections</h3>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Add Inspection
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Sample Quality Records */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Initial Quality Check</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Passed</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Inspector:</span> John Smith</p>
                        <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                        <p><span className="font-medium">Score:</span> 95/100</p>
                        <p><span className="font-medium">Notes:</span> Product meets all quality standards</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Temperature Compliance</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Passed</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Inspector:</span> Sarah Johnson</p>
                        <p><span className="font-medium">Date:</span> {new Date(Date.now() - 86400000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Temperature:</span> 2-4°C (Within Range)</p>
                        <p><span className="font-medium">Notes:</span> Temperature maintained throughout transport</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Packaging Integrity</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Warning</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Inspector:</span> Mike Davis</p>
                        <p><span className="font-medium">Date:</span> {new Date(Date.now() - 172800000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Score:</span> 78/100</p>
                        <p><span className="font-medium">Notes:</span> Minor packaging damage detected, product integrity maintained</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Certifications & Compliance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                    <button className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors">
                      Add Certificate
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Sample Certifications */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">ISO 9001:2015</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Valid</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Issued By:</span> SGS International</p>
                        <p><span className="font-medium">Issue Date:</span> {new Date(Date.now() - 31536000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Expiry Date:</span> {new Date(Date.now() + 63072000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Certificate ID:</span> ISO-9001-2024-001</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">HACCP Certification</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Valid</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Issued By:</span> Bureau Veritas</p>
                        <p><span className="font-medium">Issue Date:</span> {new Date(Date.now() - 15768000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Expiry Date:</span> {new Date(Date.now() + 47304000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Certificate ID:</span> HACCP-2024-BV-789</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Organic Certification</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Expired</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Issued By:</span> USDA Organic</p>
                        <p><span className="font-medium">Issue Date:</span> {new Date(Date.now() - 94608000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Expiry Date:</span> {new Date(Date.now() - 31536000000).toLocaleDateString()}</p>
                        <p><span className="font-medium">Certificate ID:</span> USDA-ORG-2022-456</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compliance Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Compliance Summary</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Overall Quality Score:</span>
                        <span className="font-medium text-green-600">89/100</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active Certifications:</span>
                        <span className="font-medium text-gray-900">2 of 3</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Inspection:</span>
                        <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Compliance Status:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Compliant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowQualityModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generator Modal */}
      {showQRGenerator && selectedProductForQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Generate QR Code</h2>
              <button
                onClick={() => {
                  setShowQRGenerator(false);
                  setSelectedProductForQR(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <QRCodeGenerator 
              data={JSON.stringify({
                id: selectedProductForQR.id,
                sku: selectedProductForQR.sku,
                batch: selectedProductForQR.batch_number,
                name: selectedProductForQR.name,
                status: selectedProductForQR.status,
                location: selectedProductForQR.current_location,
                created: selectedProductForQR.created_at
              })}
              size={200}
              title={`QR Code for ${selectedProductForQR.name}`}
              showActions={true}
              className=""
            />
          </div>
        </div>
      )}

      {/* QR Code Verifier Modal */}
      {showQRVerifier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Verify Product</h2>
              <button
                onClick={() => setShowQRVerifier(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <QRCodeVerifier products={products} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;