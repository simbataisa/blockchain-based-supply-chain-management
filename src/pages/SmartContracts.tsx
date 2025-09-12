import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Code,
  Play,
  Pause,
  Upload,
  Download,
  Eye,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  FileText,
  Settings,
  Activity,
  Shield,
  Link,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SmartContract {
  id: string;
  name: string;
  description: string;
  contract_address: string;
  abi: any[];
  bytecode: string;
  deployed_by: string;
  deployed_at: string;
  status: 'deployed' | 'verified' | 'paused' | 'terminated';
  network_id: number;
}

const SmartContracts: React.FC = () => {
  const { web3, account, isConnected, deployContract, callContractMethod } = useWeb3();
  const { smartContracts, loadSmartContracts, createSmartContract } = useSupplyChain();
  const { user } = useAuth();
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [deploymentData, setDeploymentData] = useState({
    name: '',
    description: '',
    sourceCode: '',
    constructorArgs: ''
  });
  const [executionData, setExecutionData] = useState({
    methodName: '',
    args: '',
    value: '0'
  });
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'compiling' | 'deploying' | 'success' | 'error'>('idle');
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [gasEstimate, setGasEstimate] = useState<string>('');

  useEffect(() => {
    loadSmartContracts();
  }, [loadSmartContracts]);

  const statusConfig = {
    deployed: { color: 'bg-blue-100 text-blue-800', icon: Code },
    verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
    terminated: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  // Sample contract templates
  const contractTemplates = {
    supplyChain: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Product {
        uint256 id;
        string name;
        address manufacturer;
        address currentOwner;
        uint256 timestamp;
        string location;
        bool exists;
    }
    
    mapping(uint256 => Product) public products;
    mapping(uint256 => address[]) public productHistory;
    uint256 public productCount;
    
    event ProductCreated(uint256 indexed productId, string name, address manufacturer);
    event ProductTransferred(uint256 indexed productId, address from, address to, string location);
    
    function createProduct(string memory _name, string memory _location) public returns (uint256) {
        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: _name,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            timestamp: block.timestamp,
            location: _location,
            exists: true
        });
        
        productHistory[productCount].push(msg.sender);
        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }
    
    function transferProduct(uint256 _productId, address _to, string memory _location) public {
        require(products[_productId].exists, "Product does not exist");
        require(products[_productId].currentOwner == msg.sender, "Not authorized");
        
        address previousOwner = products[_productId].currentOwner;
        products[_productId].currentOwner = _to;
        products[_productId].location = _location;
        products[_productId].timestamp = block.timestamp;
        
        productHistory[_productId].push(_to);
        emit ProductTransferred(_productId, previousOwner, _to, _location);
    }
    
    function getProduct(uint256 _productId) public view returns (Product memory) {
        require(products[_productId].exists, "Product does not exist");
        return products[_productId];
    }
    
    function getProductHistory(uint256 _productId) public view returns (address[] memory) {
        return productHistory[_productId];
    }
}`,
    qualityControl: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QualityControl {
    struct QualityRecord {
        uint256 productId;
        address inspector;
        uint256 score;
        string notes;
        uint256 timestamp;
        bool passed;
    }
    
    mapping(uint256 => QualityRecord[]) public qualityRecords;
    mapping(address => bool) public authorizedInspectors;
    address public owner;
    
    event QualityRecorded(uint256 indexed productId, address inspector, uint256 score, bool passed);
    event InspectorAuthorized(address inspector);
    
    constructor() {
        owner = msg.sender;
        authorizedInspectors[msg.sender] = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyInspector() {
        require(authorizedInspectors[msg.sender], "Not an authorized inspector");
        _;
    }
    
    function authorizeInspector(address _inspector) public onlyOwner {
        authorizedInspectors[_inspector] = true;
        emit InspectorAuthorized(_inspector);
    }
    
    function recordQuality(uint256 _productId, uint256 _score, string memory _notes) public onlyInspector {
        bool passed = _score >= 70; // 70% threshold
        
        qualityRecords[_productId].push(QualityRecord({
            productId: _productId,
            inspector: msg.sender,
            score: _score,
            notes: _notes,
            timestamp: block.timestamp,
            passed: passed
        }));
        
        emit QualityRecorded(_productId, msg.sender, _score, passed);
    }
    
    function getQualityRecords(uint256 _productId) public view returns (QualityRecord[] memory) {
        return qualityRecords[_productId];
    }
}`
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setDeploymentStatus('compiling');
    
    try {
      // Simulate compilation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeploymentStatus('deploying');
      
      // Mock deployment - in real implementation, this would compile and deploy the contract
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const mockAbi = [
        {
          "inputs": [],
          "name": "productCount",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      
      const newContract: SmartContract = {
        id: `contract_${Date.now()}`,
        name: deploymentData.name,
        description: deploymentData.description,
        contract_address: mockAddress,
        abi: mockAbi,
        bytecode: '0x608060405234801561001057600080fd5b50...',
        deployed_by: user?.id || account || '',
        deployed_at: new Date().toISOString(),
        status: 'deployed',
        network_id: 1
      };
      
      await createSmartContract(newContract);
      
      setDeploymentStatus('success');
      toast.success('Contract deployed successfully!');
      setShowDeployModal(false);
      setDeploymentData({ name: '', description: '', sourceCode: '', constructorArgs: '' });
      
    } catch (error: any) {
      setDeploymentStatus('error');
      toast.error(error.message || 'Deployment failed');
    }
  };

  const handleExecuteMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    try {
      // Mock contract execution
      const mockResult = {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        status: 'success',
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        result: executionData.methodName === 'getProduct' ? {
          id: 1,
          name: 'Sample Product',
          manufacturer: account,
          currentOwner: account,
          timestamp: Date.now(),
          location: 'Factory A'
        } : 'Transaction successful'
      };
      
      setExecutionResults(mockResult);
      toast.success('Method executed successfully!');
      
    } catch (error: any) {
      toast.error(error.message || 'Execution failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const loadTemplate = (template: string) => {
    setDeploymentData({
      ...deploymentData,
      sourceCode: contractTemplates[template as keyof typeof contractTemplates]
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Contracts</h1>
              <p className="text-gray-600 mt-2">
                Deploy and manage smart contracts for your supply chain.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">Connect your wallet to deploy contracts</p>
                </div>
              )}
              <button
                onClick={() => setShowDeployModal(true)}
                disabled={!isConnected}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Code className="w-5 h-5" />
                <span>Deploy Contract</span>
              </button>
            </div>
          </div>
        </div>

        {/* Network Status */}
        {isConnected && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Connected to Ethereum Mainnet</p>
                  <p className="text-xs text-gray-500">Account: {account}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Gas: 25 gwei</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Block: 18,500,123</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {smartContracts.map(contract => {
            const StatusIcon = statusConfig[contract.status].icon;
            
            return (
              <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Code className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{contract.name}</h3>
                      <p className="text-sm text-gray-500">Network ID: {contract.network_id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[contract.status].color}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {contract.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{contract.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Address:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-gray-900">
                        {contract.contract_address.slice(0, 6)}...{contract.contract_address.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(contract.contract_address)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Deployed:</span>
                    <span className="text-gray-900">{new Date(contract.deployed_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowExecuteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <a
                    href={`https://etherscan.io/address/${contract.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {smartContracts.length === 0 && (
          <div className="text-center py-12">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts deployed</h3>
            <p className="text-gray-500 mb-4">Deploy your first smart contract to get started.</p>
            <button
              onClick={() => setShowDeployModal(true)}
              disabled={!isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy Contract
            </button>
          </div>
        )}
      </div>

      {/* Deploy Contract Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Deploy Smart Contract</h2>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => loadTemplate(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="">Load Template</option>
                    <option value="supplyChain">Supply Chain</option>
                    <option value="qualityControl">Quality Control</option>
                  </select>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleDeploy} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract Name</label>
                  <input
                    type="text"
                    required
                    value={deploymentData.name}
                    onChange={(e) => setDeploymentData({...deploymentData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contract name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    required
                    value={deploymentData.description}
                    onChange={(e) => setDeploymentData({...deploymentData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Code</label>
                <textarea
                  required
                  value={deploymentData.sourceCode}
                  onChange={(e) => setDeploymentData({...deploymentData, sourceCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={15}
                  placeholder="Enter Solidity source code..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Constructor Arguments (JSON)</label>
                <input
                  type="text"
                  value={deploymentData.constructorArgs}
                  onChange={(e) => setDeploymentData({...deploymentData, constructorArgs: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='["arg1", "arg2"]'
                />
              </div>
              
              {deploymentStatus !== 'idle' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {deploymentStatus === 'compiling' && (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-700">Compiling contract...</span>
                      </>
                    )}
                    {deploymentStatus === 'deploying' && (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-700">Deploying to blockchain...</span>
                      </>
                    )}
                    {deploymentStatus === 'success' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Contract deployed successfully!</span>
                      </>
                    )}
                    {deploymentStatus === 'error' && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-700">Deployment failed. Please try again.</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeployModal(false);
                    setDeploymentStatus('idle');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deploymentStatus === 'compiling' || deploymentStatus === 'deploying'}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deploymentStatus === 'compiling' || deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute Method Modal */}
      {showExecuteModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Execute Contract Method</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedContract.name}</p>
            </div>
            
            <form onSubmit={handleExecuteMethod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Method Name</label>
                <select
                  value={executionData.methodName}
                  onChange={(e) => setExecutionData({...executionData, methodName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select method</option>
                  <option value="createProduct">createProduct</option>
                  <option value="transferProduct">transferProduct</option>
                  <option value="getProduct">getProduct</option>
                  <option value="productCount">productCount</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arguments (JSON Array)</label>
                <input
                  type="text"
                  value={executionData.args}
                  onChange={(e) => setExecutionData({...executionData, args: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='["Product Name", "Location"]'
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value (ETH)</label>
                <input
                  type="text"
                  value={executionData.value}
                  onChange={(e) => setExecutionData({...executionData, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              {executionResults && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Execution Results:</h4>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(executionResults, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExecuteModal(false);
                    setSelectedContract(null);
                    setExecutionResults(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Execute Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartContracts;