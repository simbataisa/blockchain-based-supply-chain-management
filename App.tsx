import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './src/components/Layout';
import Dashboard from './src/pages/Dashboard';
import ProductManagement from './src/pages/ProductManagement';
import SmartContracts from './src/pages/SmartContracts';
import Inventory from './src/pages/Inventory';
import Tracking from './src/pages/Tracking';
import Analytics from './src/pages/Analytics';
import Compliance from './src/pages/Compliance';
import UserManagement from './src/pages/UserManagement';
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import Settings from './src/pages/Settings';
import { AuthProvider } from './src/contexts/AuthContext';
import { Web3Provider } from './src/contexts/Web3Context';
import { SupplyChainProvider } from './src/contexts/SupplyChainContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <SupplyChainProvider>
          <Router>
            <div className="min-h-screen bg-slate-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="contracts" element={<SmartContracts />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="tracking" element={<Tracking />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              <Toaster 
                position="top-right" 
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1e40af',
                    color: '#ffffff',
                    border: 'none',
                  },
                }}
              />
            </div>
          </Router>
        </SupplyChainProvider>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
