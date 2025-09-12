import React, { useState } from 'react';
import { Copy, ExternalLink, CheckCircle, Database, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MigrationResponse {
  success: boolean;
  message: string;
  tablesExist: boolean;
  instructions: string[];
  migrationSql: string | null;
}

export function DatabaseMigration() {
  const [migrationData, setMigrationData] = useState<MigrationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkMigrationStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/database/migrate', {
        method: 'POST',
      });
      const data = await response.json();
      setMigrationData(data);
    } catch (error) {
      console.error('Failed to check migration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (migrationData?.migrationSql) {
      await navigator.clipboard.writeText(migrationData.migrationSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('SQL copied to clipboard!');
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/fpghljbtkxpczmqxwxef/sql', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Database Migration</h2>
          </div>
          <p className="text-gray-600">
            Check and execute database migrations for the blockchain supply chain system
          </p>
        </div>
        <div className="p-6 space-y-4">
          <button 
            onClick={checkMigrationStatus} 
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>{loading ? 'Checking...' : 'Check Migration Status'}</span>
          </button>

          {migrationData && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                migrationData.tablesExist 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {migrationData.tablesExist ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span>{migrationData.message}</span>
                </div>
              </div>

              {migrationData.tablesExist ? (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Database tables are already set up!</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Migration Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      {migrationData.instructions.map((instruction, index) => (
                        <li key={index} className="text-sm leading-relaxed">{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={openSupabaseDashboard}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open Supabase SQL Editor</span>
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                    </button>
                  </div>

                  {migrationData.migrationSql && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">Migration SQL:</h3>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96">
                        <pre className="text-sm text-gray-100">
                          <code>{migrationData.migrationSql}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}