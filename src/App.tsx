import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { SupplyChainProvider } from './contexts/SupplyChainContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import SmartContracts from './pages/SmartContracts';
import RealTimeTracking from './pages/RealTimeTracking';
import UserManagement from './pages/UserManagement';
import InventoryManagement from './pages/InventoryManagement';
import TransactionVerification from './pages/TransactionVerification';
import ComplianceReporting from './pages/ComplianceReporting';
import Analytics from './pages/Analytics';
import { DatabaseMigration } from './components/DatabaseMigration';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// App Component
function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <SupplyChainProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/products" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProductManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/smart-contracts" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SmartContracts />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/tracking" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <RealTimeTracking />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UserManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <InventoryManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TransactionVerification />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/compliance" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ComplianceReporting />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Analytics />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/database-migration" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DatabaseMigration />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Toast Notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
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
