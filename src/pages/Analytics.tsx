import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calendar, Filter, Download } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  target?: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

interface PerformanceData {
  category: string;
  current: number;
  target: number;
  previous: number;
}

const Analytics: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'trends' | 'comparison'>('overview');

  // Mock data generation
  useEffect(() => {
    const mockKPIs: KPIMetric[] = [
      {
        id: '1',
        title: 'Total Revenue',
        value: 2847500,
        previousValue: 2456000,
        unit: '$',
        trend: 'up',
        changePercentage: 15.9,
        target: 3000000
      },
      {
        id: '2',
        title: 'Active Products',
        value: 1247,
        previousValue: 1189,
        unit: '',
        trend: 'up',
        changePercentage: 4.9
      },
      {
        id: '3',
        title: 'Supply Chain Efficiency',
        value: 94.2,
        previousValue: 91.8,
        unit: '%',
        trend: 'up',
        changePercentage: 2.6,
        target: 95
      },
      {
        id: '4',
        title: 'Transaction Volume',
        value: 15847,
        previousValue: 16234,
        unit: '',
        trend: 'down',
        changePercentage: -2.4
      },
      {
        id: '5',
        title: 'Quality Score',
        value: 4.8,
        previousValue: 4.6,
        unit: '/5',
        trend: 'up',
        changePercentage: 4.3,
        target: 4.9
      },
      {
        id: '6',
        title: 'Cost Reduction',
        value: 18.5,
        previousValue: 15.2,
        unit: '%',
        trend: 'up',
        changePercentage: 21.7,
        target: 20
      }
    ];

    const mockTimeSeriesData: ChartData[] = [
      { name: 'Jan', value: 2100000, revenue: 2100000, transactions: 12500, efficiency: 89.2 },
      { name: 'Feb', value: 2250000, revenue: 2250000, transactions: 13200, efficiency: 90.1 },
      { name: 'Mar', value: 2180000, revenue: 2180000, transactions: 12800, efficiency: 88.9 },
      { name: 'Apr', value: 2420000, revenue: 2420000, transactions: 14100, efficiency: 91.5 },
      { name: 'May', value: 2680000, revenue: 2680000, transactions: 15200, efficiency: 92.8 },
      { name: 'Jun', value: 2847500, revenue: 2847500, transactions: 15847, efficiency: 94.2 }
    ];

    const mockCategoryData: ChartData[] = [
      { name: 'Electronics', value: 35, color: '#3B82F6' },
      { name: 'Food & Beverage', value: 28, color: '#10B981' },
      { name: 'Textiles', value: 18, color: '#F59E0B' },
      { name: 'Pharmaceuticals', value: 12, color: '#EF4444' },
      { name: 'Others', value: 7, color: '#8B5CF6' }
    ];

    const mockPerformanceData: PerformanceData[] = [
      { category: 'Quality Control', current: 94, target: 95, previous: 91 },
      { category: 'Delivery Time', current: 87, target: 90, previous: 85 },
      { category: 'Cost Efficiency', current: 92, target: 88, previous: 89 },
      { category: 'Customer Satisfaction', current: 96, target: 95, previous: 94 },
      { category: 'Compliance', current: 98, target: 100, previous: 97 },
      { category: 'Innovation', current: 85, target: 90, previous: 82 }
    ];

    setKpiMetrics(mockKPIs);
    setTimeSeriesData(mockTimeSeriesData);
    setCategoryData(mockCategoryData);
    setPerformanceData(mockPerformanceData);
  }, []);

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (unit === '%') {
      return `${value}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return `${value}${unit}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Performance metrics, trends, and insights for your supply chain</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="revenue">Revenue</option>
            <option value="transactions">Transactions</option>
            <option value="efficiency">Efficiency</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: Activity },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'comparison', label: 'Comparison', icon: PieChart }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiMetrics.map(metric => (
              <div key={metric.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                  {getTrendIcon(metric.trend)}
                </div>
                
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.unit)}
                  </span>
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                    {Math.abs(metric.changePercentage)}%
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-3">
                  vs. previous period: {formatValue(metric.previousValue, metric.unit)}
                </p>
                
                {metric.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress to target</span>
                      <span>{formatValue(metric.target, metric.unit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Last 6 months</span>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatValue(value, selectedMetric === 'revenue' ? '$' : selectedMetric === 'efficiency' ? '%' : '')} />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Category Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value}%`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{category.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Radar Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="current" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Target" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceData.map((item, index) => {
              const progress = (item.current / item.target) * 100;
              const isAboveTarget = item.current >= item.target;
              const improvement = ((item.current - item.previous) / item.previous) * 100;
              
              return (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">{item.category}</h4>
                    <div className={`flex items-center space-x-1 text-xs ${
                      improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {improvement > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : improvement < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Activity className="w-3 h-3" />
                      )}
                      <span>{Math.abs(improvement).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current</span>
                      <span className="font-medium text-gray-900">{item.current}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Target</span>
                      <span className="font-medium text-gray-900">{item.target}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Previous</span>
                      <span className="font-medium text-gray-900">{item.previous}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.min(progress, 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isAboveTarget ? 'bg-green-500' : progress > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Multi-line Trend Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Multi-Metric Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency (%)" />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#F59E0B" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Growth Rate</span>
                  <span className="text-sm font-medium text-green-600">+15.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Best Month</span>
                  <span className="text-sm font-medium text-gray-900">June</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Forecast</span>
                  <span className="text-sm font-medium text-blue-600">$3.1M</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Trend</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Improvement</span>
                  <span className="text-sm font-medium text-green-600">+5.0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current Score</span>
                  <span className="text-sm font-medium text-gray-900">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Target</span>
                  <span className="text-sm font-medium text-blue-600">95.0%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trend</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Volume Change</span>
                  <span className="text-sm font-medium text-red-600">-2.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Peak Month</span>
                  <span className="text-sm font-medium text-gray-900">June</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg/Month</span>
                  <span className="text-sm font-medium text-blue-600">14.1K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Current vs Previous vs Target</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="previous" fill="#E5E7EB" name="Previous" />
                  <Bar dataKey="current" fill="#3B82F6" name="Current" />
                  <Bar dataKey="target" fill="#10B981" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Above Target</span>
                  <span className="text-lg font-bold text-green-600">
                    {performanceData.filter(item => item.current >= item.target).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-yellow-800">Near Target</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {performanceData.filter(item => item.current < item.target && item.current >= item.target * 0.9).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Below Target</span>
                  <span className="text-lg font-bold text-red-600">
                    {performanceData.filter(item => item.current < item.target * 0.9).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Improvement Areas</h4>
              <div className="space-y-3">
                {performanceData
                  .filter(item => item.current < item.target)
                  .sort((a, b) => (b.target - b.current) - (a.target - a.current))
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.category}</p>
                        <p className="text-xs text-gray-500">Gap: {(item.target - item.current).toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.current}%</p>
                        <p className="text-xs text-gray-500">Target: {item.target}%</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;