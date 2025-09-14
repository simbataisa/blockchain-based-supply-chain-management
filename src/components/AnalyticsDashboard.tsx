import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Factory,
  MapPin,
  Target,
  Zap,
  Shield,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Download
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  status: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
  created_at: string;
  current_location: string;
  origin_location: string;
}

interface AnalyticsDashboardProps {
  products: Product[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ products }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeView, setActiveView] = useState('overview');
  const [selectedMetrics, setSelectedMetrics] = useState(['efficiency', 'risk', 'performance']);

  useEffect(() => {
    generateAnalytics();
  }, [products, timeRange, selectedMetrics]);

  const calculateSupplyChainEfficiency = (products: Product[]) => {
    const totalProducts = products.length;
    if (totalProducts === 0) return 0;
    
    const deliveredProducts = products.filter(p => p.status === 'delivered' || p.status === 'verified').length;
    const avgTransitTime = products
      .filter(p => p.status === 'delivered' || p.status === 'verified')
      .reduce((acc, p) => {
        const created = new Date(p.created_at).getTime();
        const now = new Date().getTime();
        return acc + (now - created) / (1000 * 60 * 60 * 24); // days
      }, 0) / Math.max(deliveredProducts, 1);
    
    const efficiencyScore = Math.min(100, (deliveredProducts / totalProducts) * 100 * (30 / Math.max(avgTransitTime, 1)));
    return Math.round(efficiencyScore);
  };

  const calculateRiskScore = (products: Product[]) => {
    const totalProducts = products.length;
    if (totalProducts === 0) return 0;
    
    const recalledProducts = products.filter(p => p.status === 'recalled').length;
    const inTransitProducts = products.filter(p => p.status === 'in_transit').length;
    const oldProducts = products.filter(p => {
      const daysSinceCreation = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 30;
    }).length;
    
    const riskScore = ((recalledProducts * 3 + inTransitProducts * 1 + oldProducts * 2) / totalProducts) * 100;
    return Math.min(100, Math.round(riskScore));
  };

  const generatePredictiveAnalytics = (products: Product[]) => {
    const last30Days = products.filter(p => {
      const daysSince = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    
    const dailyAverage = last30Days.length / 30;
    const projectedNext30Days = Math.round(dailyAverage * 30);
    
    return {
      projectedProducts: projectedNext30Days,
      growthRate: last30Days.length > 0 ? ((dailyAverage - 1) * 100).toFixed(1) : '0',
      trend: dailyAverage > 1 ? 'increasing' : dailyAverage < 1 ? 'decreasing' : 'stable'
    };
  };

  const generateAnalytics = () => {
    if (!products.length) {
      setAnalyticsData(null);
      return;
    }

    // Filter products by time range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    const filteredProducts = products.filter(product => 
      new Date(product.created_at) >= cutoffDate
    );

    // Status distribution
    const statusCounts = filteredProducts.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
      color: getStatusColor(status)
    }));

    // Category distribution
    const categoryCounts = filteredProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count
    }));

    // Daily creation trend
    const dailyCreation = filteredProducts.reduce((acc, product) => {
      const date = new Date(product.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendData = Object.entries(dailyCreation)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        products: count
      }));

    // Location distribution
    const locationCounts = filteredProducts.reduce((acc, product) => {
      acc[product.current_location] = (acc[product.current_location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationData = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({
        location,
        count
      }));

    // Key metrics
    const totalProducts = filteredProducts.length;
    const verifiedProducts = filteredProducts.filter(p => p.status === 'verified').length;
    const inTransitProducts = filteredProducts.filter(p => p.status === 'in_transit').length;
    const recalledProducts = filteredProducts.filter(p => p.status === 'recalled').length;
    const verificationRate = totalProducts > 0 ? (verifiedProducts / totalProducts * 100).toFixed(1) : '0';

    // Advanced analytics
    const efficiencyScore = calculateSupplyChainEfficiency(filteredProducts);
    const riskScore = calculateRiskScore(filteredProducts);
    const predictiveData = generatePredictiveAnalytics(products);

    // Performance metrics
    const performanceMetrics = {
      avgProcessingTime: filteredProducts.reduce((acc, p) => {
        const days = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return acc + days;
      }, 0) / Math.max(totalProducts, 1),
      throughput: totalProducts / Math.max(daysBack, 1),
      qualityScore: totalProducts > 0 ? ((verifiedProducts + (totalProducts - recalledProducts)) / (totalProducts * 2)) * 100 : 0
    };

    // Supply chain radar data
    const radarData = [
      { subject: 'Efficiency', A: efficiencyScore, fullMark: 100 },
      { subject: 'Quality', A: performanceMetrics.qualityScore, fullMark: 100 },
      { subject: 'Speed', A: Math.max(0, 100 - (performanceMetrics.avgProcessingTime * 10)), fullMark: 100 },
      { subject: 'Reliability', A: Math.max(0, 100 - riskScore), fullMark: 100 },
      { subject: 'Transparency', A: parseFloat(verificationRate), fullMark: 100 }
    ];

    setAnalyticsData({
      statusData,
      categoryData,
      trendData,
      locationData,
      radarData,
      predictiveData,
      metrics: {
        totalProducts,
        verifiedProducts,
        inTransitProducts,
        recalledProducts,
        verificationRate,
        efficiencyScore,
        riskScore,
        ...performanceMetrics
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      created: '#3B82F6',
      in_transit: '#F59E0B',
      delivered: '#10B981',
      verified: '#059669',
      recalled: '#EF4444'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
          <p className="mt-1 text-sm text-gray-500">Add some products to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Comprehensive supply chain insights and predictive analytics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="overview">Overview</option>
            <option value="performance">Performance</option>
            <option value="predictive">Predictive</option>
            <option value="risk">Risk Analysis</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Verified</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.verifiedProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Truck className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">In Transit</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.inTransitProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Recalled</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.recalledProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Efficiency</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.efficiencyScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Shield className={`h-6 w-6 ${analyticsData.metrics.riskScore < 30 ? 'text-green-600' : analyticsData.metrics.riskScore < 70 ? 'text-yellow-600' : 'text-red-600'}`} />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Risk Score</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.riskScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-indigo-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Quality Score</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(analyticsData.metrics.qualityScore)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-orange-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Throughput</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.metrics.throughput.toFixed(1)}/day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supply Chain Performance Radar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supply Chain Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={analyticsData.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Predictive Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Predictive Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projected Next 30 Days</span>
                <span className="text-lg font-semibold text-blue-600">{analyticsData.predictiveData.projectedProducts} products</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className={`text-lg font-semibold ${parseFloat(analyticsData.predictiveData.growthRate) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analyticsData.predictiveData.growthRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trend</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  analyticsData.predictiveData.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                  analyticsData.predictiveData.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {analyticsData.predictiveData.trend}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Alerts</h3>
            <div className="space-y-3">
              {analyticsData.metrics.riskScore > 70 && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">High Risk Detected</p>
                    <p className="text-xs text-red-600">Risk score is {analyticsData.metrics.riskScore}%</p>
                  </div>
                </div>
              )}
              {analyticsData.metrics.efficiencyScore < 50 && (
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Low Efficiency</p>
                    <p className="text-xs text-yellow-600">Efficiency is {analyticsData.metrics.efficiencyScore}%</p>
                  </div>
                </div>
              )}
              {analyticsData.metrics.inTransitProducts > analyticsData.metrics.totalProducts * 0.5 && (
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">High Transit Volume</p>
                    <p className="text-xs text-blue-600">{analyticsData.metrics.inTransitProducts} products in transit</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics View */}
      {activeView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Time Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Time Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailyCreation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quality vs Efficiency Scatter */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quality vs Efficiency Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={[{
                quality: analyticsData.metrics.qualityScore,
                efficiency: analyticsData.metrics.efficiencyScore,
                risk: analyticsData.metrics.riskScore
              }]}>
                <CartesianGrid />
                <XAxis type="number" dataKey="quality" name="Quality" unit="%" />
                <YAxis type="number" dataKey="efficiency" name="Efficiency" unit="%" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Current Performance" dataKey="risk" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics Table */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Performance Metrics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Average Processing Time</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analyticsData.metrics.avgProcessingTime.toFixed(1)} hours</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">&lt; 24 hours</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        analyticsData.metrics.avgProcessingTime < 24 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {analyticsData.metrics.avgProcessingTime < 24 ? 'On Target' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Daily Throughput</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analyticsData.metrics.throughput.toFixed(1)} products/day</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">&gt; 10 products/day</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        analyticsData.metrics.throughput > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {analyticsData.metrics.throughput > 10 ? 'Excellent' : 'Good'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Quality Score</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.round(analyticsData.metrics.qualityScore)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">&gt; 85%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        analyticsData.metrics.qualityScore > 85 ? 'bg-green-100 text-green-800' : 
                        analyticsData.metrics.qualityScore > 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {analyticsData.metrics.qualityScore > 85 ? 'Excellent' : 
                         analyticsData.metrics.qualityScore > 70 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Analytics View */}
      {activeView === 'predictive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forecast Chart */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Product Creation Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[
                ...analyticsData.dailyCreation.slice(-7),
                ...Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  count: Math.round(analyticsData.predictiveData.projectedProducts / 30 + Math.random() * 5),
                  predicted: true
                }))
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Historical" />
                <Line type="monotone" dataKey="count" stroke="#EF4444" strokeDasharray="5 5" name="Predicted" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Predictive Insights Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Market Predictions</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Demand Forecast</h4>
                <p className="text-sm text-gray-600">Expected {analyticsData.predictiveData.trend} trend with {analyticsData.predictiveData.growthRate}% growth rate</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900">Capacity Planning</h4>
                <p className="text-sm text-gray-600">Current capacity can handle up to {Math.round(analyticsData.metrics.throughput * 1.5)} products/day</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium text-gray-900">Resource Optimization</h4>
                <p className="text-sm text-gray-600">Efficiency improvements could reduce processing time by 15%</p>
              </div>
            </div>
          </div>

          {/* Risk Predictions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Supply Chain Disruption</span>
                <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quality Control Issues</span>
                <span className={`text-sm font-medium ${
                  analyticsData.metrics.qualityScore > 85 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.metrics.qualityScore > 85 ? 'Low Risk' : 'High Risk'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Capacity Overload</span>
                <span className={`text-sm font-medium ${
                  analyticsData.metrics.throughput < 15 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {analyticsData.metrics.throughput < 15 ? 'Low Risk' : 'Medium Risk'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis View */}
      {activeView === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low Risk', value: Math.max(0, 100 - analyticsData.metrics.riskScore), fill: '#10B981' },
                    { name: 'High Risk', value: analyticsData.metrics.riskScore, fill: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Factors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors Analysis</h3>
            <div className="space-y-4">
              {[
                { factor: 'Processing Delays', score: Math.min(100, analyticsData.metrics.avgProcessingTime * 2), color: 'red' },
                { factor: 'Quality Issues', score: Math.max(0, 100 - analyticsData.metrics.qualityScore), color: 'yellow' },
                { factor: 'Supply Chain', score: analyticsData.metrics.riskScore * 0.6, color: 'orange' },
                { factor: 'Capacity Strain', score: Math.min(100, analyticsData.metrics.throughput * 3), color: 'blue' }
              ].map((risk, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{risk.factor}</span>
                    <span className="text-sm text-gray-500">{Math.round(risk.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${risk.color}-500`}
                      style={{ width: `${Math.min(100, risk.score)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.statusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Creation Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Creation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="products" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.locationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;