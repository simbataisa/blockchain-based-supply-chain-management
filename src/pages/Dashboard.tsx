import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { useWeb3 } from '../contexts/Web3Context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Shield,
  Truck,
  Factory,
  Globe
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, trend }) => {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const bgColor = trend === 'up' ? 'bg-emerald-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${trendColor}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface SystemHealthProps {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastUpdate: string;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ status, uptime, lastUpdate }) => {
  const statusConfig = {
    healthy: { color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'All Systems Operational' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Minor Issues Detected' },
    critical: { color: 'text-red-600', bg: 'bg-red-100', text: 'Critical Issues' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig[status].bg}`}></div>
            <span className={`text-sm font-medium ${statusConfig[status].color}`}>
              {statusConfig[status].text}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Uptime</span>
          <span className="text-sm font-medium text-gray-900">{uptime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Update</span>
          <span className="text-sm font-medium text-gray-900">{lastUpdate}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { products, trackingRecords, getAnalytics } = useSupplyChain();
  const { isConnected, account } = useWeb3();
  const [timeRange, setTimeRange] = useState('7d');

  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await getAnalytics();
      setAnalytics(data);
    };
    loadAnalytics();
  }, [getAnalytics]);

  // Mock data for charts
  const productionData = [
    { name: 'Mon', products: 24, quality: 95 },
    { name: 'Tue', products: 32, quality: 97 },
    { name: 'Wed', products: 28, quality: 94 },
    { name: 'Thu', products: 35, quality: 96 },
    { name: 'Fri', products: 42, quality: 98 },
    { name: 'Sat', products: 38, quality: 95 },
    { name: 'Sun', products: 29, quality: 97 }
  ];

  const statusDistribution = [
    { name: 'In Transit', value: 35, color: '#3B82F6' },
    { name: 'Delivered', value: 45, color: '#10B981' },
    { name: 'Processing', value: 15, color: '#F59E0B' },
    { name: 'Issues', value: 5, color: '#EF4444' }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, transactions: 120 },
    { month: 'Feb', revenue: 52000, transactions: 145 },
    { month: 'Mar', revenue: 48000, transactions: 132 },
    { month: 'Apr', revenue: 61000, transactions: 167 },
    { month: 'May', revenue: 55000, transactions: 154 },
    { month: 'Jun', revenue: 67000, transactions: 189 }
  ];

  const kpiData = {
    totalProducts: products.length,
    activeShipments: products.filter(p => p.status === 'in_transit').length,
    qualityScore: 96.5,
    onTimeDelivery: 94.2,
    totalRevenue: '$2.4M',
    monthlyGrowth: '+12.5%'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supply Chain Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}. Here's what's happening with your supply chain today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Products"
            value={kpiData.totalProducts}
            change="+8 this week"
            icon={<Package className="w-6 h-6 text-blue-600" />}
            trend="up"
          />
          <KPICard
            title="Active Shipments"
            value={kpiData.activeShipments}
            change="+5 today"
            icon={<Truck className="w-6 h-6 text-emerald-600" />}
            trend="up"
          />
          <KPICard
            title="Quality Score"
            value={`${kpiData.qualityScore}%`}
            change="+2.1% this month"
            icon={<Shield className="w-6 h-6 text-green-600" />}
            trend="up"
          />
          <KPICard
            title="On-Time Delivery"
            value={`${kpiData.onTimeDelivery}%`}
            change="-1.2% this week"
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
            trend="down"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Production Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Production Trends</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="products"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue &amp; Transactions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#10B981" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="transactions"
                  stroke="#3B82F6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* System Health */}
          <SystemHealth
            status="healthy"
            uptime="99.9%"
            lastUpdate="2 minutes ago"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {trackingRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.event_type}</p>
                      <p className="text-xs text-gray-500">{record.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{new Date(record.timestamp).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Alerts &amp; Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Temperature Alert</p>
                  <p className="text-xs text-yellow-600">Product #12345 temperature exceeded threshold</p>
                  <p className="text-xs text-yellow-500 mt-1">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Delivery Completed</p>
                  <p className="text-xs text-green-600">Batch #67890 successfully delivered</p>
                  <p className="text-xs text-green-500 mt-1">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Blockchain Sync</p>
                  <p className="text-xs text-blue-600">Smart contract updated successfully</p>
                  <p className="text-xs text-blue-500 mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;