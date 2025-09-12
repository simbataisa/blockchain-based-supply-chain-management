import React, { useState, useEffect } from 'react';
import { Database, Users, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DatabaseStatus {
  connected: boolean;
  tablesExist: boolean;
  existingTables: string[];
  missingTables: string[];
  demoUsersExist: boolean;
}

const DatabaseSeeder: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [migrationSql, setMigrationSql] = useState<string>('');

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/database/status');
      const result = await response.json();
      
      if (result.success) {
        setDbStatus(result.database);
      } else {
        toast.error('Failed to check database status');
        console.error('Database status check failed:', result.error);
      }
    } catch (error) {
      toast.error('Failed to connect to database API');
      console.error('Error checking database status:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const fetchMigrationSql = async () => {
    try {
      const response = await fetch('/api/database/migration-sql');
      const result = await response.json();
      
      if (result.success) {
        setMigrationSql(result.sql);
      }
    } catch (error) {
      console.error('Error fetching migration SQL:', error);
    }
  };

  const handleRunMigrations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/database/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Database migrations completed successfully!');
        await checkDatabaseStatus();
      } else {
        toast.error(result.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Error running migrations:', error);
      toast.error('Failed to run migrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemoUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/database/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Demo users created successfully!');
        await checkDatabaseStatus();
      } else {
        toast.error(result.error || 'Failed to create demo users');
      }
    } catch (error) {
      console.error('Error creating demo users:', error);
      toast.error('Failed to create demo users');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking || !dbStatus) {
      return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
    return dbStatus.connected && dbStatus.tablesExist && dbStatus.demoUsersExist ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusText = () => {
    if (isChecking || !dbStatus) {
      return 'Checking database status...';
    }
    if (!dbStatus.connected) {
      return 'Database connection failed';
    }
    if (!dbStatus.tablesExist) {
      return 'Database tables missing - migration required';
    }
    if (!dbStatus.demoUsersExist) {
      return 'Database ready - demo users needed';
    }
    return 'Database is fully configured';
  };

  useEffect(() => {
    checkDatabaseStatus();
    fetchMigrationSql();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {getStatusIcon()}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Database Setup</h2>
          <p className="text-sm text-gray-600">{getStatusText()}</p>
        </div>
      </div>
      
      {/* Database Status Details */}
      {dbStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Database Status Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {dbStatus.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Database Connection: {dbStatus.connected ? 'Connected' : 'Failed'}</span>
            </div>
            <div className="flex items-center gap-2">
              {dbStatus.tablesExist ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Tables: {dbStatus.tablesExist ? 'All tables exist' : 'Missing tables'}</span>
            </div>
            {dbStatus.existingTables.length > 0 && (
              <div className="ml-6 text-xs text-gray-600">
                Existing: {dbStatus.existingTables.join(', ')}
              </div>
            )}
            {dbStatus.missingTables.length > 0 && (
              <div className="ml-6 text-xs text-red-600">
                Missing: {dbStatus.missingTables.join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2">
              {dbStatus.demoUsersExist ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Demo Users: {dbStatus.demoUsersExist ? 'Available' : 'Not created'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">

        {/* Migration SQL Display */}
        {dbStatus && !dbStatus.tablesExist && migrationSql && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">Database Migration Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  The database tables need to be created. You can either run the migration automatically or copy the SQL below:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(migrationSql)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                  >
                    <Copy className="h-3 w-3" />
                    Copy SQL
                  </button>
                </div>
                <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800 overflow-x-auto max-h-40">
                  {migrationSql}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {dbStatus && !dbStatus.tablesExist && (
            <button
              onClick={handleRunMigrations}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running Migrations...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Run Database Migrations
                </>
              )}
            </button>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleCreateDemoUsers}
              disabled={isLoading || !dbStatus?.tablesExist}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Demo Users...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Create Demo Users
                </>
              )}
            </button>
            
            <button
              onClick={checkDatabaseStatus}
              disabled={isChecking}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Demo Credentials</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Admin:</strong> admin@supply.com / admin123</p>
            <p><strong>Manufacturer:</strong> manufacturer@supply.com / manu123</p>
            <p><strong>Distributor:</strong> distributor@supply.com / dist123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSeeder;