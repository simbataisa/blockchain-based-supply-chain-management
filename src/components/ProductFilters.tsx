import React from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  Truck,
  Factory,
  Trash2
} from 'lucide-react';

interface ProductFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterCategory: string;
  filterLocation: string;
  filterDateRange: { start: string; end: string };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  advancedFiltersOpen: boolean;
  categories: string[];
  selectedProducts: string[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onAdvancedFiltersToggle: () => void;
  onClearAdvancedFilters: () => void;
  onBatchAction: (action: string, value?: string) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  filterStatus,
  filterCategory,
  filterLocation,
  filterDateRange,
  sortBy,
  sortOrder,
  advancedFiltersOpen,
  categories,
  selectedProducts,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onLocationFilterChange,
  onDateRangeChange,
  onSortChange,
  onAdvancedFiltersToggle,
  onClearAdvancedFilters,
  onBatchAction
}) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-');
    onSortChange(field, order as 'asc' | 'desc');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => onStatusFilterChange(e.target.value)}
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
          onChange={(e) => onCategoryFilterChange(e.target.value)}
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
          onChange={handleSortChange}
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
          onClick={onAdvancedFiltersToggle}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
          <span className={`transform transition-transform ${advancedFiltersOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {(filterLocation !== 'all' || filterDateRange.start || filterDateRange.end) && (
          <button
            onClick={onClearAdvancedFilters}
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
              onChange={(e) => onLocationFilterChange(e.target.value || 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created From</label>
            <input
              type="date"
              value={filterDateRange.start}
              onChange={(e) => onDateRangeChange({ ...filterDateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created To</label>
            <input
              type="date"
              value={filterDateRange.end}
              onChange={(e) => onDateRangeChange({ ...filterDateRange, end: e.target.value })}
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
              onClick={() => onBatchAction('export')}
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
                    onClick={() => onBatchAction('status_update', 'created')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Created
                  </button>
                  <button
                    onClick={() => onBatchAction('status_update', 'in_transit')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    In Transit
                  </button>
                  <button
                    onClick={() => onBatchAction('status_update', 'delivered')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => onBatchAction('status_update', 'verified')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Verified
                  </button>
                </div>
              </div>
            </div>
            
            {/* Location Update */}
            <button
              onClick={() => onBatchAction('location_update')}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Update Location</span>
            </button>
            
            {/* Print Labels */}
            <button
              onClick={() => onBatchAction('print_labels')}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Factory className="w-4 h-4" />
              <span>Print Labels</span>
            </button>
            
            {/* Delete */}
            <button
              onClick={() => onBatchAction('delete')}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
          
          <button
            onClick={() => onBatchAction('clear_selection')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
export type { ProductFiltersProps };