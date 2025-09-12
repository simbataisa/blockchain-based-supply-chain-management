import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Settings,
  Archive,
  ShoppingCart,
  DollarSign,
  Users,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  warehouse_id: string;
  warehouse_name: string;
  location: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  max_stock: number;
  unit_cost: number;
  total_value: number;
  last_updated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  category: string;
  supplier: string;
  expiry_date?: string;
  batch_number?: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  current_utilization: number;
  manager: string;
  status: 'active' | 'maintenance' | 'inactive';
  zones: number;
  temperature_controlled: boolean;
}

interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  item_id?: string;
  warehouse_id?: string;
  created_at: string;
  acknowledged: boolean;
}

interface StockMovement {
  id: string;
  item_id: string;
  type: 'inbound' | 'outbound' | 'transfer' | 'adjustment';
  quantity: number;
  from_warehouse?: string;
  to_warehouse?: string;
  reason: string;
  created_by: string;
  created_at: string;
}

const InventoryManagement: React.FC = () => {
  const { products } = useSupplyChain();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'inventory' | 'warehouses' | 'alerts' | 'movements'>('inventory');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementForm, setMovementForm] = useState({
    type: 'inbound' as StockMovement['type'],
    quantity: 0,
    from_warehouse: '',
    to_warehouse: '',
    reason: ''
  });

  // Mock data
  const mockWarehouses: Warehouse[] = [
    {
      id: 'wh_001',
      name: 'Main Distribution Center',
      location: 'New York, NY',
      capacity: 10000,
      current_utilization: 7500,
      manager: 'John Smith',
      status: 'active',
      zones: 12,
      temperature_controlled: true
    },
    {
      id: 'wh_002',
      name: 'West Coast Hub',
      location: 'Los Angeles, CA',
      capacity: 8000,
      current_utilization: 6200,
      manager: 'Sarah Johnson',
      status: 'active',
      zones: 10,
      temperature_controlled: false
    },
    {
      id: 'wh_003',
      name: 'Regional Storage',
      location: 'Chicago, IL',
      capacity: 5000,
      current_utilization: 3800,
      manager: 'Mike Wilson',
      status: 'maintenance',
      zones: 8,
      temperature_controlled: true
    }
  ];

  const mockInventory: InventoryItem[] = [
    {
      id: 'inv_001',
      product_id: 'prod_001',
      product_name: 'Premium Coffee Beans',
      sku: 'PCB-001',
      warehouse_id: 'wh_001',
      warehouse_name: 'Main Distribution Center',
      location: 'A-12-03',
      quantity: 150,
      reserved_quantity: 25,
      available_quantity: 125,
      reorder_point: 50,
      max_stock: 500,
      unit_cost: 12.50,
      total_value: 1875,
      last_updated: '2024-01-15T10:30:00Z',
      status: 'in_stock',
      category: 'Food & Beverage',
      supplier: 'Global Coffee Co.',
      expiry_date: '2024-06-15',
      batch_number: 'BCH-2024-001'
    },
    {
      id: 'inv_002',
      product_id: 'prod_002',
      product_name: 'Organic Honey',
      sku: 'OH-002',
      warehouse_id: 'wh_001',
      warehouse_name: 'Main Distribution Center',
      location: 'B-05-12',
      quantity: 25,
      reserved_quantity: 10,
      available_quantity: 15,
      reorder_point: 30,
      max_stock: 200,
      unit_cost: 8.75,
      total_value: 218.75,
      last_updated: '2024-01-15T09:15:00Z',
      status: 'low_stock',
      category: 'Food & Beverage',
      supplier: 'Natural Farms Ltd.',
      expiry_date: '2025-01-15',
      batch_number: 'HNY-2024-003'
    },
    {
      id: 'inv_003',
      product_id: 'prod_003',
      product_name: 'Smartphone Case',
      sku: 'SPC-003',
      warehouse_id: 'wh_002',
      warehouse_name: 'West Coast Hub',
      location: 'C-08-07',
      quantity: 0,
      reserved_quantity: 0,
      available_quantity: 0,
      reorder_point: 20,
      max_stock: 300,
      unit_cost: 15.00,
      total_value: 0,
      last_updated: '2024-01-14T16:45:00Z',
      status: 'out_of_stock',
      category: 'Electronics',
      supplier: 'Tech Accessories Inc.',
      batch_number: 'SPC-2024-012'
    },
    {
      id: 'inv_004',
      product_id: 'prod_004',
      product_name: 'Wireless Headphones',
      sku: 'WH-004',
      warehouse_id: 'wh_002',
      warehouse_name: 'West Coast Hub',
      location: 'D-15-20',
      quantity: 450,
      reserved_quantity: 50,
      available_quantity: 400,
      reorder_point: 100,
      max_stock: 300,
      unit_cost: 45.00,
      total_value: 20250,
      last_updated: '2024-01-15T11:20:00Z',
      status: 'overstock',
      category: 'Electronics',
      supplier: 'Audio Tech Solutions',
      batch_number: 'WH-2024-008'
    }
  ];

  const mockAlerts: Alert[] = [
    {
      id: 'alert_001',
      type: 'low_stock',
      severity: 'high',
      title: 'Low Stock Alert',
      message: 'Organic Honey (OH-002) is below reorder point',
      item_id: 'inv_002',
      created_at: '2024-01-15T09:15:00Z',
      acknowledged: false
    },
    {
      id: 'alert_002',
      type: 'out_of_stock',
      severity: 'critical',
      title: 'Out of Stock',
      message: 'Smartphone Case (SPC-003) is completely out of stock',
      item_id: 'inv_003',
      created_at: '2024-01-14T16:45:00Z',
      acknowledged: false
    },
    {
      id: 'alert_003',
      type: 'overstock',
      severity: 'medium',
      title: 'Overstock Warning',
      message: 'Wireless Headphones (WH-004) exceeds maximum stock level',
      item_id: 'inv_004',
      created_at: '2024-01-15T11:20:00Z',
      acknowledged: true
    },
    {
      id: 'alert_004',
      type: 'maintenance',
      severity: 'medium',
      title: 'Warehouse Maintenance',
      message: 'Regional Storage warehouse is under maintenance',
      warehouse_id: 'wh_003',
      created_at: '2024-01-13T08:00:00Z',
      acknowledged: true
    }
  ];

  const mockMovements: StockMovement[] = [
    {
      id: 'mov_001',
      item_id: 'inv_001',
      type: 'inbound',
      quantity: 100,
      to_warehouse: 'wh_001',
      reason: 'New shipment received',
      created_by: 'John Smith',
      created_at: '2024-01-15T08:00:00Z'
    },
    {
      id: 'mov_002',
      item_id: 'inv_002',
      type: 'outbound',
      quantity: -15,
      from_warehouse: 'wh_001',
      reason: 'Customer order fulfillment',
      created_by: 'Sarah Johnson',
      created_at: '2024-01-15T09:30:00Z'
    },
    {
      id: 'mov_003',
      item_id: 'inv_004',
      type: 'transfer',
      quantity: 50,
      from_warehouse: 'wh_001',
      to_warehouse: 'wh_002',
      reason: 'Rebalancing inventory',
      created_by: 'Mike Wilson',
      created_at: '2024-01-14T14:15:00Z'
    }
  ];

  useEffect(() => {
    setInventory(mockInventory);
    setWarehouses(mockWarehouses);
    setAlerts(mockAlerts);
    setMovements(mockMovements);
  }, []);

  const statusConfig = {
    in_stock: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    low_stock: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    out_of_stock: { color: 'bg-red-100 text-red-800', icon: XCircle },
    overstock: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp }
  };

  const alertSeverityConfig = {
    low: { color: 'bg-gray-100 text-gray-800', icon: Bell },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    critical: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const warehouseStatusConfig = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: Settings },
    inactive: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse_id === selectedWarehouse;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);

  const totalValue = inventory.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const categoryData = inventory.reduce((acc, item) => {
    const existing = acc.find(cat => cat.name === item.category);
    if (existing) {
      existing.value += item.total_value;
      existing.quantity += item.quantity;
    } else {
      acc.push({ name: item.category, value: item.total_value, quantity: item.quantity });
    }
    return acc;
  }, [] as { name: string; value: number; quantity: number }[]);

  const warehouseUtilization = warehouses.map(wh => ({
    name: wh.name,
    utilization: (wh.current_utilization / wh.capacity) * 100,
    capacity: wh.capacity,
    current: wh.current_utilization
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const handleStockMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const newMovement: StockMovement = {
      id: `mov_${Date.now()}`,
      item_id: selectedItem.id,
      type: movementForm.type,
      quantity: movementForm.type === 'outbound' ? -movementForm.quantity : movementForm.quantity,
      from_warehouse: movementForm.from_warehouse || undefined,
      to_warehouse: movementForm.to_warehouse || undefined,
      reason: movementForm.reason,
      created_by: 'Current User',
      created_at: new Date().toISOString()
    };

    // Update inventory quantity
    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        const newQuantity = item.quantity + newMovement.quantity;
        const newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' = newQuantity <= 0 ? 'out_of_stock' : 
                         newQuantity <= item.reorder_point ? 'low_stock' :
                         newQuantity > item.max_stock ? 'overstock' : 'in_stock';
        
        return {
          ...item,
          quantity: Math.max(0, newQuantity),
          available_quantity: Math.max(0, newQuantity - item.reserved_quantity),
          total_value: Math.max(0, newQuantity) * item.unit_cost,
          status: newStatus,
          last_updated: new Date().toISOString()
        };
      }
      return item;
    });

    setInventory(updatedInventory);
    setMovements([newMovement, ...movements]);
    setShowMovementModal(false);
    setSelectedItem(null);
    setMovementForm({
      type: 'inbound',
      quantity: 0,
      from_warehouse: '',
      to_warehouse: '',
      reason: ''
    });
    
    toast.success('Stock movement recorded successfully');
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    toast.success('Alert acknowledged');
  };

  const openMovementModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementForm({
      type: 'inbound',
      quantity: 0,
      from_warehouse: '',
      to_warehouse: item.warehouse_id,
      reason: ''
    });
    setShowMovementModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-2">
                Monitor stock levels, manage warehouses, and track inventory movements.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {criticalAlerts.length > 0 && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">{criticalAlerts.length} Critical Alerts</span>
                </div>
              )}
              <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('inventory')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'inventory'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Inventory
            </button>
            <button
              onClick={() => setViewMode('warehouses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'warehouses'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Warehouse className="w-4 h-4 inline mr-2" />
              Warehouses
            </button>
            <button
              onClick={() => setViewMode('alerts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                viewMode === 'alerts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Alerts
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('movements')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'movements'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Movements
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-500 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">-3 items</span>
              <span className="text-gray-500 ml-1">since yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">{warehouses.filter(w => w.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">All operational</span>
            </div>
          </div>
        </div>

        {/* Inventory View */}
        {viewMode === 'inventory' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Warehouses</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Garden">Home & Garden</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInventory.map(item => {
                      const StatusIcon = statusConfig[item.status].icon;
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{item.product_name}</div>
                              <div className="text-sm text-gray-500">{item.category}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900 font-mono">{item.sku}</td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="text-sm text-gray-900">{item.warehouse_name}</div>
                              <div className="text-xs text-gray-500">{item.location}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.available_quantity} / {item.quantity}
                              </div>
                              <div className="text-xs text-gray-500">
                                Reserved: {item.reserved_quantity}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status].color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            ${item.total_value.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openMovementModal(item)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Utilization</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={warehouseUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Utilization']} />
                    <Bar dataKey="utilization" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Warehouses View */}
        {viewMode === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map(warehouse => {
              const StatusIcon = warehouseStatusConfig[warehouse.status].icon;
              const utilizationPercent = (warehouse.current_utilization / warehouse.capacity) * 100;
              
              return (
                <div key={warehouse.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Warehouse className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {warehouse.location}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${warehouseStatusConfig[warehouse.status].color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {warehouse.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Utilization</span>
                        <span className="text-sm text-gray-900">{utilizationPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationPercent > 90 ? 'bg-red-500' :
                            utilizationPercent > 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${utilizationPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Capacity</p>
                        <p className="font-medium text-gray-900">{warehouse.capacity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current</p>
                        <p className="font-medium text-gray-900">{warehouse.current_utilization.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Zones</p>
                        <p className="font-medium text-gray-900">{warehouse.zones}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Manager</p>
                        <p className="font-medium text-gray-900">{warehouse.manager}</p>
                      </div>
                    </div>
                    
                    {warehouse.temperature_controlled && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Settings className="w-4 h-4 mr-1" />
                        Temperature Controlled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts View */}
        {viewMode === 'alerts' && (
          <div className="space-y-4">
            {alerts.map(alert => {
              const SeverityIcon = alertSeverityConfig[alert.severity].icon;
              
              return (
                <div key={alert.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${
                  alert.severity === 'critical' ? 'border-red-500' :
                  alert.severity === 'high' ? 'border-orange-500' :
                  alert.severity === 'medium' ? 'border-yellow-500' :
                  'border-gray-300'
                } ${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        alert.severity === 'critical' ? 'bg-red-100' :
                        alert.severity === 'high' ? 'bg-orange-100' :
                        alert.severity === 'medium' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        <SeverityIcon className={`w-5 h-5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'high' ? 'text-orange-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alertSeverityConfig[alert.severity].color}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.acknowledged && (
                        <span className="text-green-600 text-sm font-medium flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Movements View */}
        {viewMode === 'movements' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map(movement => {
                    const item = inventory.find(i => i.id === movement.item_id);
                    const typeConfig = {
                      inbound: { color: 'bg-green-100 text-green-800', icon: Plus },
                      outbound: { color: 'bg-red-100 text-red-800', icon: Minus },
                      transfer: { color: 'bg-blue-100 text-blue-800', icon: Truck },
                      adjustment: { color: 'bg-yellow-100 text-yellow-800', icon: Edit }
                    };
                    const TypeIcon = typeConfig[movement.type].icon;
                    
                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig[movement.type].color}`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {movement.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{item?.product_name}</div>
                            <div className="text-sm text-gray-500">{item?.sku}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {movement.type === 'transfer' 
                            ? `${movement.from_warehouse} → ${movement.to_warehouse}`
                            : movement.from_warehouse || movement.to_warehouse
                          }
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{movement.reason}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{movement.created_by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Movement Modal */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Record Stock Movement</h2>
              <p className="text-gray-600 mt-1">{selectedItem.product_name}</p>
            </div>
            
            <form onSubmit={handleStockMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({...movementForm, type: e.target.value as StockMovement['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inbound">Inbound (Receive Stock)</option>
                  <option value="outbound">Outbound (Ship Stock)</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  required
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})}
                  placeholder="Enter reason for stock movement"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;