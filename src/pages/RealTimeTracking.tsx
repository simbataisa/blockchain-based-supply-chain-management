import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import {
  MapPin,
  Navigation,
  Thermometer,
  Droplets,
  Zap,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface TrackingData {
  id: string;
  productId: string;
  productName: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'in_transit' | 'delivered' | 'delayed' | 'at_checkpoint';
  carrier: string;
  estimatedArrival: string;
  sensorData: {
    temperature: number;
    humidity: number;
    vibration: number;
    light: number;
    pressure: number;
  };
  batteryLevel: number;
  signalStrength: number;
  lastUpdate: string;
  route: Array<{ lat: number; lng: number; timestamp: string }>;
}

interface IoTSensor {
  id: string;
  type: 'temperature' | 'humidity' | 'vibration' | 'light' | 'pressure';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: { min: number; max: number };
  history: Array<{ timestamp: string; value: number }>;
}

const RealTimeTracking: React.FC = () => {
  const { trackingRecords, loadTrackingRecords } = useSupplyChain();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<TrackingData | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'sensors' | 'analytics'>('map');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sensorHistory, setSensorHistory] = useState<Array<{ timestamp: string; temperature: number; humidity: number; vibration: number }>>([]);

  // Mock tracking data
  const mockTrackingData: TrackingData[] = [
    {
      id: 'track_001',
      productId: 'prod_001',
      productName: 'Organic Coffee Beans',
      currentLocation: {
        lat: 40.7128,
        lng: -74.0060,
        address: 'New York, NY, USA'
      },
      destination: {
        lat: 34.0522,
        lng: -118.2437,
        address: 'Los Angeles, CA, USA'
      },
      status: 'in_transit',
      carrier: 'Global Logistics Inc.',
      estimatedArrival: '2024-01-15T14:30:00Z',
      sensorData: {
        temperature: 22.5,
        humidity: 45.2,
        vibration: 0.8,
        light: 120,
        pressure: 1013.25
      },
      batteryLevel: 85,
      signalStrength: 4,
      lastUpdate: new Date().toISOString(),
      route: [
        { lat: 40.7128, lng: -74.0060, timestamp: '2024-01-14T08:00:00Z' },
        { lat: 39.9526, lng: -75.1652, timestamp: '2024-01-14T12:00:00Z' },
        { lat: 39.2904, lng: -76.6122, timestamp: '2024-01-14T16:00:00Z' }
      ]
    },
    {
      id: 'track_002',
      productId: 'prod_002',
      productName: 'Premium Electronics',
      currentLocation: {
        lat: 51.5074,
        lng: -0.1278,
        address: 'London, UK'
      },
      destination: {
        lat: 48.8566,
        lng: 2.3522,
        address: 'Paris, France'
      },
      status: 'at_checkpoint',
      carrier: 'European Express',
      estimatedArrival: '2024-01-15T10:00:00Z',
      sensorData: {
        temperature: 18.3,
        humidity: 52.1,
        vibration: 0.3,
        light: 85,
        pressure: 1015.8
      },
      batteryLevel: 92,
      signalStrength: 5,
      lastUpdate: new Date().toISOString(),
      route: [
        { lat: 51.5074, lng: -0.1278, timestamp: '2024-01-14T06:00:00Z' },
        { lat: 50.8503, lng: 4.3517, timestamp: '2024-01-14T10:00:00Z' }
      ]
    },
    {
      id: 'track_003',
      productId: 'prod_003',
      productName: 'Medical Supplies',
      currentLocation: {
        lat: 35.6762,
        lng: 139.6503,
        address: 'Tokyo, Japan'
      },
      destination: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'San Francisco, CA, USA'
      },
      status: 'delayed',
      carrier: 'Pacific Shipping Co.',
      estimatedArrival: '2024-01-16T18:00:00Z',
      sensorData: {
        temperature: 4.2,
        humidity: 38.7,
        vibration: 1.2,
        light: 45,
        pressure: 1008.9
      },
      batteryLevel: 67,
      signalStrength: 3,
      lastUpdate: new Date().toISOString(),
      route: [
        { lat: 35.6762, lng: 139.6503, timestamp: '2024-01-13T14:00:00Z' },
        { lat: 35.4437, lng: 139.6380, timestamp: '2024-01-13T18:00:00Z' }
      ]
    }
  ];

  useEffect(() => {
    loadTrackingRecords();
    setTrackingData(mockTrackingData);
    generateSensorHistory();
  }, [loadTrackingRecords]);

  const generateSensorHistory = () => {
    const history = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp: timestamp.toISOString(),
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        vibration: Math.random() * 2
      });
    }
    
    setSensorHistory(history);
  };

  const statusConfig = {
    in_transit: { color: 'bg-blue-100 text-blue-800', icon: Truck },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    delayed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    at_checkpoint: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  };

  const getSensorStatus = (value: number, type: string) => {
    const thresholds = {
      temperature: { min: 2, max: 25 },
      humidity: { min: 30, max: 60 },
      vibration: { min: 0, max: 1.5 },
      light: { min: 50, max: 200 },
      pressure: { min: 1000, max: 1020 }
    };
    
    const threshold = thresholds[type as keyof typeof thresholds];
    if (value < threshold.min || value > threshold.max) {
      return 'critical';
    } else if (value < threshold.min * 1.1 || value > threshold.max * 0.9) {
      return 'warning';
    }
    return 'normal';
  };

  const getSensorColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    toast.success('GPS simulation started');
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setTrackingData(prev => prev.map(item => ({
        ...item,
        sensorData: {
          ...item.sensorData,
          temperature: item.sensorData.temperature + (Math.random() - 0.5) * 2,
          humidity: Math.max(0, Math.min(100, item.sensorData.humidity + (Math.random() - 0.5) * 5)),
          vibration: Math.max(0, item.sensorData.vibration + (Math.random() - 0.5) * 0.3)
        },
        lastUpdate: new Date().toISOString()
      })));
    }, 3000);

    // Stop simulation after 30 seconds for demo
    setTimeout(() => {
      clearInterval(interval);
      setIsSimulating(false);
      toast.info('GPS simulation stopped');
    }, 30000);
  };

  const filteredTrackingData = trackingData.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Tracking</h1>
              <p className="text-gray-600 mt-2">
                Monitor products with GPS tracking and IoT sensor data.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                  <option value="at_checkpoint">At Checkpoint</option>
                </select>
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isSimulating ? 'Simulating...' : 'Start GPS Simulation'}</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Map View
            </button>
            <button
              onClick={() => setViewMode('sensors')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'sensors'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Sensors
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Signal className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Live Tracking Map</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Updates</span>
                  </div>
                </div>
                
                {/* Mock Map */}
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  <div className="text-center z-10">
                    <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h3>
                    <p className="text-gray-600">Real-time GPS tracking visualization</p>
                    <div className="mt-4 flex items-center justify-center space-x-4">
                      {filteredTrackingData.map((item, index) => {
                        const StatusIcon = statusConfig[item.status].icon;
                        return (
                          <div
                            key={item.id}
                            className={`absolute bg-white rounded-full p-2 shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                            style={{
                              left: `${20 + index * 25}%`,
                              top: `${30 + index * 15}%`
                            }}
                            onClick={() => setSelectedTracking(item)}
                          >
                            <StatusIcon className="w-4 h-4 text-blue-600" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Shipments</h2>
              {filteredTrackingData.map(item => {
                const StatusIcon = statusConfig[item.status].icon;
                const distance = calculateDistance(
                  item.currentLocation.lat,
                  item.currentLocation.lng,
                  item.destination.lat,
                  item.destination.lng
                );
                
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      selectedTracking?.id === item.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTracking(item)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.productName}</h3>
                        <p className="text-sm text-gray-500">{item.carrier}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{item.currentLocation.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Navigation className="w-4 h-4 mr-2" />
                        <span>{item.destination.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Distance: {distance.toFixed(0)} km</span>
                        <span>ETA: {new Date(item.estimatedArrival).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Battery className="w-3 h-3 mr-1" />
                          <span>{item.batteryLevel}%</span>
                        </div>
                        <div className="flex items-center">
                          {item.signalStrength >= 4 ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                          <span>{item.signalStrength}/5</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(item.lastUpdate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sensors View */}
        {viewMode === 'sensors' && (
          <div className="space-y-6">
            {/* Sensor Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {selectedTracking ? (
                Object.entries(selectedTracking.sensorData).map(([key, value]) => {
                  const sensorIcons = {
                    temperature: Thermometer,
                    humidity: Droplets,
                    vibration: Activity,
                    light: Zap,
                    pressure: Signal
                  };
                  
                  const units = {
                    temperature: '°C',
                    humidity: '%',
                    vibration: 'g',
                    light: 'lux',
                    pressure: 'hPa'
                  };
                  
                  const SensorIcon = sensorIcons[key as keyof typeof sensorIcons];
                  const status = getSensorStatus(value, key);
                  
                  return (
                    <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <SensorIcon className={`w-5 h-5 ${getSensorColor(status)}`} />
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === 'critical' ? 'bg-red-100 text-red-800' :
                          status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          {units[key as keyof typeof units]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a shipment to view sensor data</p>
                </div>
              )}
            </div>

            {/* Sensor History Chart */}
            {selectedTracking && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor History (24h)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Temperature (°C)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Humidity (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vibration" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Vibration (g)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Shipments</p>
                    <p className="text-2xl font-bold text-gray-900">{trackingData.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-green-600">
                    <span>+12% from last week</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                    <p className="text-2xl font-bold text-gray-900">94.2%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-green-600">
                    <span>+2.1% from last month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Temperature</p>
                    <p className="text-2xl font-bold text-gray-900">18.3°C</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Thermometer className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Within optimal range</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sensor Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-yellow-600">
                    <span>2 temperature, 1 humidity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="temperature" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Temperature Compliance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeTracking;