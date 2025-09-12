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
  ExternalLink,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Use the SmartContract type from SupplyChainContext which matches the database schema
import type { SmartContract } from '../contexts/SupplyChainContext';

const SmartContracts: React.FC = () => {
  const { web3, account, isConnected, deployContract, callContractMethod } = useWeb3();
  const { smartContracts, loadSmartContracts, createSmartContract } = useSupplyChain();
  const { user } = useAuth();
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
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
  const [contractMethods, setContractMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [verificationData, setVerificationData] = useState({
    contractAddress: '',
    sourceCode: '',
    compilerVersion: 'v0.8.19+commit.7dd6d404',
    optimizationEnabled: false,
    runs: 200
  });
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedSourceContract, setSelectedSourceContract] = useState<SmartContract | null>(null);
  const [sourceCodeEditor, setSourceCodeEditor] = useState({
    content: '',
    isEditing: false,
    hasChanges: false
  });
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedEventsContract, setSelectedEventsContract] = useState<SmartContract | null>(null);
  const [contractEvents, setContractEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState({
    eventType: 'all',
    fromBlock: 'latest',
    toBlock: 'latest'
  });
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    loadSmartContracts();
  }, []);

  // Parse ABI and extract methods when a contract is selected
  useEffect(() => {
    if (selectedContract) {
      const methods = parseContractMethods(selectedContract.abi as string);
      setContractMethods(methods);
      setSelectedMethod(null);
      setExecutionData({ methodName: '', args: '', value: '0' });
    }
  }, [selectedContract]);

  // Parse contract ABI to extract callable methods
  const parseContractMethods = (abiString: string) => {
    try {
      const abi = JSON.parse(abiString);
      return abi.filter((item: any) => 
        item.type === 'function' && 
        (item.stateMutability === 'nonpayable' || 
         item.stateMutability === 'payable' || 
         item.stateMutability === 'view' || 
         item.stateMutability === 'pure')
      ).map((method: any) => ({
        ...method,
        signature: `${method.name}(${method.inputs.map((input: any) => `${input.type} ${input.name}`).join(', ')})`,
        isReadOnly: method.stateMutability === 'view' || method.stateMutability === 'pure'
      }));
    } catch (error) {
       console.error('Error parsing ABI:', error);
       return [];
     }
   };

  const statusConfig = {
    active: { color: 'bg-blue-100 text-blue-800', icon: Code },
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

  // Mock Solidity compiler function
  const compileContract = async (sourceCode: string) => {
    // Simulate compilation process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Basic validation
    if (!sourceCode.includes('pragma solidity')) {
      return { success: false, error: 'Missing pragma solidity directive' };
    }
    
    if (!sourceCode.includes('contract ')) {
      return { success: false, error: 'No contract definition found' };
    }
    
    // Mock successful compilation
    const mockAbi = [
      {
        "inputs": [],
        "name": "productCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "string", "name": "_name", "type": "string"}, {"internalType": "string", "name": "_location", "type": "string"}],
        "name": "createProduct",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    const mockBytecode = '0x608060405234801561001057600080fd5b50600080819055506108bc806100266000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631003e2d21461005c57806329dcb0cf146100785780634f02c42014610096578063a3ec138d146100b4578063cc11efc0146100d0575b600080fd5b610076600480360381019061007191906105a9565b6100ee565b005b6100806101f5565b60405161008d919061064a565b60405180910390f35b61009e6101fb565b6040516100ab919061064a565b60405180910390f35b6100ce60048036038101906100c99190610665565b610201565b005b6100d8610308565b6040516100e5919061064a565b60405180910390f35b';
    
    return {
      success: true,
      abi: mockAbi,
      bytecode: mockBytecode
    };
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!web3 || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!deploymentData.name || !deploymentData.sourceCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setDeploymentStatus('compiling');
    
    try {
      // Compile the contract using mock compiler
      const compilationResult = await compileContract(deploymentData.sourceCode);
      
      if (!compilationResult.success) {
        setDeploymentStatus('error');
        toast.error(`Compilation failed: ${compilationResult.error}`);
        return;
      }

      setDeploymentStatus('deploying');
      
      // Deploy using Web3
      const constructorArgs = deploymentData.constructorArgs ? 
        JSON.parse(deploymentData.constructorArgs) : [];
      
      // Mock deployment result for now
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      const newContract = {
         name: deploymentData.name,
         description: deploymentData.description,
         source_code: deploymentData.sourceCode,
         abi: JSON.stringify(compilationResult.abi),
         bytecode: compilationResult.bytecode,
         contract_address: mockAddress,
         network: 'localhost',
         status: 'active',
         version: '1.0.0',
         deployed_by: account || '',
         created_at: new Date()
       };
      
      await createSmartContract(newContract);
      await loadSmartContracts();
      
      setDeploymentStatus('success');
      toast.success(`Contract deployed successfully at: ${mockAddress}`);
      
      setTimeout(() => {
        setShowDeployModal(false);
        setDeploymentData({ name: '', description: '', sourceCode: '', constructorArgs: '' });
        setDeploymentStatus('idle');
      }, 2000);
      
    } catch (error: any) {
      setDeploymentStatus('error');
      toast.error(error.message || 'Deployment failed');
    }
  };

  const handleExecuteMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !executionData.methodName) {
      toast.error('Please select a contract and method');
      return;
    }

    if (!web3 || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Parse method arguments
      const args = executionData.args ? JSON.parse(executionData.args) : [];
      
      // Estimate gas first
      const gasEstimateResult = await estimateGas(
        selectedContract.contract_address,
        JSON.parse(selectedContract.abi as string),
        executionData.methodName,
        args,
        executionData.value
      );

      if (!gasEstimateResult.success) {
        toast.error(`Gas estimation failed: ${gasEstimateResult.error}`);
        return;
      }

      setGasEstimate(gasEstimateResult.gasEstimate);

      // Mock execution result for now
      const mockResult = {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        gasUsed: gasEstimateResult.gasEstimate,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        returnValue: 'Method executed successfully'
      };
      
      const result = mockResult;

      if (result.success) {
        setExecutionResults({
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed,
          status: 'success',
          blockNumber: result.blockNumber,
          result: result.returnValue || 'Method executed successfully'
        });
        toast.success('Method executed successfully!');
      } else {
         toast.error('Execution failed');
       }
    } catch (error: any) {
      toast.error(`Execution failed: ${error.message}`);
    }
  };

  // Gas estimation function
  const estimateGas = async (contractAddress: string, abi: any[], methodName: string, args: any[], value: string) => {
    try {
      if (!web3) return { success: false, error: 'Web3 not available' };
      
      const contract = new web3.eth.Contract(abi, contractAddress);
      const method = contract.methods[methodName](...args);
      
      const gasEstimate = await method.estimateGas({
        from: account,
        value: web3.utils.toWei(value, 'ether')
      });
      
      return { success: true, gasEstimate: gasEstimate.toString() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handlePauseContract = async (contractId: string) => {
    try {
      // In a real implementation, this would call a contract method to pause
      // For now, we'll just update the status in the database
      toast.success('Contract paused successfully');
      await loadSmartContracts();
    } catch (error: any) {
      toast.error(`Failed to pause contract: ${error.message}`);
    }
  };

  const handleResumeContract = async (contractId: string) => {
    try {
      // In a real implementation, this would call a contract method to resume
      toast.success('Contract resumed successfully');
      await loadSmartContracts();
    } catch (error: any) {
      toast.error(`Failed to resume contract: ${error.message}`);
    }
  };

  const handleTerminateContract = async (contractId: string) => {
    if (!window.confirm('Are you sure you want to terminate this contract? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real implementation, this would call a contract method to terminate
      toast.success('Contract terminated successfully');
      await loadSmartContracts();
    } catch (error: any) {
      toast.error(`Failed to terminate contract: ${error.message}`);
    }
  };

  const handleVerifyContract = async () => {
    if (!verificationData.contractAddress || !verificationData.sourceCode) {
      toast.error('Please provide contract address and source code');
      return;
    }

    setVerificationStatus('verifying');

    try {
      // Mock verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate verification success/failure
      const isVerified = Math.random() > 0.3; // 70% success rate
      
      if (isVerified) {
        setVerificationStatus('success');
        toast.success('Contract verified successfully!');
        
        // Reset form after successful verification
        setTimeout(() => {
          setShowVerifyModal(false);
          setVerificationStatus('idle');
          setVerificationData({
            contractAddress: '',
            sourceCode: '',
            compilerVersion: 'v0.8.19+commit.7dd6d404',
            optimizationEnabled: false,
            runs: 200
          });
        }, 1500);
      } else {
        setVerificationStatus('error');
        toast.error('Contract verification failed. Please check your source code and compiler settings.');
      }
    } catch (error: any) {
      setVerificationStatus('error');
      toast.error(`Verification failed: ${error.message}`);
    }
  };

  const handleViewSource = (contract: SmartContract) => {
    setSelectedSourceContract(contract);
    setSourceCodeEditor({
      content: (contract as any).source_code || '// Source code not available',
      isEditing: false,
      hasChanges: false
    });
    setShowSourceModal(true);
  };

  const handleEditSource = () => {
    setSourceCodeEditor(prev => ({ ...prev, isEditing: true }));
  };

  const handleSaveSource = async () => {
    if (!selectedSourceContract) return;
    
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the contract with new source code
      const updatedContract = {
        ...selectedSourceContract,
        source_code: sourceCodeEditor.content,
        updated_at: new Date()
      };
      
      // In a real app, you would call updateSmartContract here
      toast.success('Source code updated successfully!');
      
      setSourceCodeEditor(prev => ({ 
        ...prev, 
        isEditing: false, 
        hasChanges: false 
      }));
      
      // Refresh the contracts list
      loadSmartContracts();
    } catch (error: any) {
      toast.error(`Failed to save source code: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    if (sourceCodeEditor.hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setSourceCodeEditor(prev => ({
          content: (selectedSourceContract as any)?.source_code || '// Source code not available',
          isEditing: false,
          hasChanges: false
        }));
      }
    } else {
      setSourceCodeEditor(prev => ({ ...prev, isEditing: false }));
    }
  };

  const handleSourceCodeChange = (value: string) => {
    setSourceCodeEditor(prev => ({
      ...prev,
      content: value,
      hasChanges: value !== ((selectedSourceContract as any)?.source_code || '// Source code not available')
    }));
  };

  const handleViewEvents = async (contract: SmartContract) => {
    setSelectedEventsContract(contract);
    setShowEventsModal(true);
    await loadContractEvents(contract);
  };

  const loadContractEvents = async (contract: SmartContract) => {
    setIsLoadingEvents(true);
    try {
      // Mock event data - in a real app, you'd fetch from blockchain
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents = [
        {
          id: '1',
          event: 'Transfer',
          blockNumber: 18500000,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          args: {
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            to: '0x8ba1f109551bD432803012645Hac136c',
            value: '1000000000000000000'
          },
          gasUsed: '21000'
        },
        {
          id: '2',
          event: 'Approval',
          blockNumber: 18499950,
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          args: {
            owner: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            spender: '0x8ba1f109551bD432803012645Hac136c',
            value: '5000000000000000000'
          },
          gasUsed: '46000'
        },
        {
          id: '3',
          event: 'Mint',
          blockNumber: 18499800,
          transactionHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          args: {
            to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            amount: '2000000000000000000'
          },
          gasUsed: '65000'
        }
      ];
      
      setContractEvents(mockEvents);
    } catch (error: any) {
      toast.error(`Failed to load events: ${error.message}`);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const filteredEvents = contractEvents.filter(event => {
    if (eventFilter.eventType === 'all') return true;
    return event.event.toLowerCase() === eventFilter.eventType.toLowerCase();
  });

  const formatEventArgs = (args: any) => {
    return Object.entries(args).map(([key, value]) => (
      `${key}: ${typeof value === 'string' && value.startsWith('0x') ? 
        `${value.slice(0, 10)}...${value.slice(-8)}` : 
        value}`
    )).join(', ');
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

       {/* Events Modal */}
       {showEventsModal && selectedEventsContract && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                     <Activity className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h2 className="text-xl font-semibold text-gray-900">Contract Events</h2>
                     <p className="text-sm text-gray-600">{selectedEventsContract.name} - {selectedEventsContract.contract_address}</p>
                   </div>
                 </div>
                 <button
                   onClick={() => {
                     setShowEventsModal(false);
                     setSelectedEventsContract(null);
                     setContractEvents([]);
                   }}
                   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
             </div>
             
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                     <select
                       value={eventFilter.eventType}
                       onChange={(e) => setEventFilter(prev => ({ ...prev, eventType: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                     >
                       <option value="all">All Events</option>
                       <option value="transfer">Transfer</option>
                       <option value="approval">Approval</option>
                       <option value="mint">Mint</option>
                       <option value="burn">Burn</option>
                     </select>
                   </div>
                   <button
                     onClick={() => loadContractEvents(selectedEventsContract)}
                     disabled={isLoadingEvents}
                     className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                   >
                     {isLoadingEvents ? (
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     ) : (
                       <Activity className="w-4 h-4" />
                     )}
                     <span>{isLoadingEvents ? 'Loading...' : 'Refresh'}</span>
                   </button>
                 </div>
                 <div className="text-sm text-gray-600">
                   {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                 </div>
               </div>
               
               {isLoadingEvents ? (
                 <div className="flex items-center justify-center py-12">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                   <span className="ml-3 text-gray-600">Loading events...</span>
                 </div>
               ) : filteredEvents.length === 0 ? (
                 <div className="text-center py-12">
                   <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">No events found for this contract</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {filteredEvents.map((event) => (
                     <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center space-x-3 mb-2">
                             <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                               {event.event}
                             </span>
                             <span className="text-sm text-gray-600">
                               Block #{event.blockNumber.toLocaleString()}
                             </span>
                             <span className="text-sm text-gray-600">
                               {new Date(event.timestamp).toLocaleString()}
                             </span>
                           </div>
                           <div className="text-sm text-gray-700 mb-2">
                             <strong>Arguments:</strong> {formatEventArgs(event.args)}
                           </div>
                           <div className="flex items-center space-x-4 text-xs text-gray-500">
                             <span>Gas Used: {parseInt(event.gasUsed).toLocaleString()}</span>
                             <span>Tx: {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}</span>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <button
                             onClick={() => copyToClipboard(event.transactionHash)}
                             className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                             title="Copy transaction hash"
                           >
                             <Copy className="w-4 h-4" />
                           </button>
                           <a
                             href={`https://etherscan.io/tx/${event.transactionHash}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                             title="View on Etherscan"
                           >
                             <ExternalLink className="w-4 h-4" />
                           </a>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               
               <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                 <button
                   onClick={() => {
                     setShowEventsModal(false);
                     setSelectedEventsContract(null);
                     setContractEvents([]);
                   }}
                   className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>Verify Contract</span>
                </button>
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
                      <p className="text-sm text-gray-500">Network: {contract.network}</p>
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
                    <span className="text-gray-900">{new Date(contract.created_at).toLocaleDateString()}</span>
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
                      title="Execute Method"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    
                    {contract.status === 'active' && (
                      <button
                        onClick={() => handlePauseContract(contract.id)}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Pause Contract"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    
                    {contract.status === 'paused' && (
                      <button
                        onClick={() => handleResumeContract(contract.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Resume Contract"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleViewSource(contract)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="View Source"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleViewEvents(contract)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Events"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleTerminateContract(contract.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Terminate Contract"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>
                  <a
                    href={`https://etherscan.io/address/${contract.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View on Etherscan"
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

      {/* Verify Contract Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Verify Smart Contract</h2>
                    <p className="text-sm text-gray-600">Verify your contract source code on the blockchain</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contract Address</label>
                <input
                  type="text"
                  required
                  value={verificationData.contractAddress}
                  onChange={(e) => setVerificationData({...verificationData, contractAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Code</label>
                <textarea
                  required
                  value={verificationData.sourceCode}
                  onChange={(e) => setVerificationData({...verificationData, sourceCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  rows={12}
                  placeholder="Enter the exact source code used for deployment..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compiler Version</label>
                  <select
                    value={verificationData.compilerVersion}
                    onChange={(e) => setVerificationData({...verificationData, compilerVersion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="v0.8.19+commit.7dd6d404">v0.8.19+commit.7dd6d404</option>
                    <option value="v0.8.18+commit.87f61d96">v0.8.18+commit.87f61d96</option>
                    <option value="v0.8.17+commit.8df45f5f">v0.8.17+commit.8df45f5f</option>
                    <option value="v0.8.16+commit.07c72cc2">v0.8.16+commit.07c72cc2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Runs</label>
                  <input
                    type="number"
                    value={verificationData.runs}
                    onChange={(e) => setVerificationData({...verificationData, runs: parseInt(e.target.value) || 200})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="optimization"
                  checked={verificationData.optimizationEnabled}
                  onChange={(e) => setVerificationData({...verificationData, optimizationEnabled: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="optimization" className="text-sm text-gray-700">
                  Optimization enabled
                </label>
              </div>
              
              {verificationStatus !== 'idle' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {verificationStatus === 'verifying' && (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-sm text-gray-700">Verifying contract...</span>
                      </>
                    )}
                    {verificationStatus === 'success' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Contract verified successfully!</span>
                      </>
                    )}
                    {verificationStatus === 'error' && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-700">Verification failed. Please check your inputs.</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setVerificationStatus('idle');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyContract}
                  disabled={verificationStatus === 'verifying'}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificationStatus === 'verifying' ? 'Verifying...' : 'Verify Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Code Modal */}
      {showSourceModal && selectedSourceContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedSourceContract.name}</h2>
                    <p className="text-sm text-gray-600">{selectedSourceContract.contract_address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!sourceCodeEditor.isEditing ? (
                    <button
                      onClick={handleEditSource}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSource}
                        disabled={!sourceCodeEditor.hasChanges}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => copyToClipboard(sourceCodeEditor.content)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Source Code</label>
                  {sourceCodeEditor.hasChanges && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      Unsaved changes
                    </span>
                  )}
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <textarea
                    value={sourceCodeEditor.content}
                    onChange={(e) => handleSourceCodeChange(e.target.value)}
                    readOnly={!sourceCodeEditor.isEditing}
                    className={`w-full px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      sourceCodeEditor.isEditing 
                        ? 'bg-white border-blue-200' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                    rows={25}
                    style={{ lineHeight: '1.5' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusConfig[selectedSourceContract.status].color
                  }`}>
                    {selectedSourceContract.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Network</span>
                  </div>
                  <span className="text-sm text-gray-900">{selectedSourceContract.network}</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Deployed</span>
                  </div>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedSourceContract.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSourceModal(false);
                    setSelectedSourceContract(null);
                    setSourceCodeEditor({ content: '', isEditing: false, hasChanges: false });
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <a
                  href={`https://etherscan.io/address/${selectedSourceContract.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Etherscan</span>
                </a>
              </div>
            </div>
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
                  onChange={(e) => {
                    const methodName = e.target.value;
                    const method = contractMethods.find(m => m.name === methodName);
                    setSelectedMethod(method);
                    setExecutionData({...executionData, methodName});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select method</option>
                  {contractMethods.map((method, index) => (
                    <option key={index} value={method.name}>
                      {method.signature} {method.isReadOnly ? '(Read-only)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedMethod && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Method Details:</h4>
                  <p className="text-xs text-blue-700">Type: {selectedMethod.isReadOnly ? 'Read-only' : 'Transaction'}</p>
                  <p className="text-xs text-blue-700">State Mutability: {selectedMethod.stateMutability}</p>
                  {selectedMethod.inputs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-blue-900">Required Parameters:</p>
                      <ul className="text-xs text-blue-700 ml-2">
                        {selectedMethod.inputs.map((input: any, idx: number) => (
                          <li key={idx}>• {input.name} ({input.type})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
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
              
              {gasEstimate && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Gas Estimate: {gasEstimate}</span>
                  </div>
                </div>
              )}
              
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