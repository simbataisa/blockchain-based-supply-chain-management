import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import DatabaseSeeder from '../components/DatabaseSeeder';
import Auth0LoginButton from '../components/Auth0LoginButton';

const Login: React.FC = () => {
  const [showSetup, setShowSetup] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-6">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Supply Chain Tracker
          </h2>
          <p className="text-blue-100">
            Secure blockchain-based supply chain management
          </p>
        </div>

        {/* Setup Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">
              {showSetup ? 'Hide Setup' : 'Database Setup'}
            </span>
          </button>
        </div>

        {/* Setup Mode */}
        {showSetup ? (
          <DatabaseSeeder />
        ) : (
          /* Login Card */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h3>
                <p className="text-gray-600">
                  Sign in to access your supply chain dashboard
                </p>
              </div>

              {/* Auth0 Login Button */}
              <div className="space-y-4">
                <Auth0LoginButton />
              </div>

              {/* Demo Information */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Demo Access
                </h4>
                <p className="text-xs text-blue-700">
                  Use Auth0 authentication to access the supply chain management system.
                  The system includes role-based access for manufacturers, suppliers, and administrators.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-blue-200 text-sm">
            Powered by blockchain technology for maximum transparency and security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;