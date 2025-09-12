import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Hash,
  Calendar,
  DollarSign,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Lock,
  Unlock,
  Key,
  Signature,
  Gavel,
  Flag,
  Archive,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckSquare,
  Square,
  User,
  Building,
  Truck,
  Package,
  Minus,
  Plus,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  hash: string;
  type: 'transfer' | 'payment' | 'contract_execution' | 'quality_check' | 'shipment';
  from_address: string;
  to_address: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'disputed' | 'resolved';
  confirmations: number;
  required_confirmations: number;
  gas_fee: number;
  timestamp: string;
  block_number?: number;
  product_id?: string;
  contract_address?: string;
  metadata: {
    description: string;
    participants: string[];
    documents: string[];
    quality_score?: number;
    location?: string;
  };
  signatures: Signature[];
  dispute?: Dispute;
}

interface Signature {
  id: string;
  signer_address: string;
  signer_name: string;
  signer_role: string;
  signature: string;
  timestamp: string;
  status: 'pending' | 'signed' | 'rejected';
  message?: string;
}

interface Dispute {
  id: string;
  transaction_id: string;
  raised_by: string;
  raised_at: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  evidence: Evidence[];
  votes: DisputeVote[];
}

interface Evidence {
  id: string;
  type: 'document' | 'image' | 'video' | 'testimony';
  title: string;
  description: string;
  file_url?: string;
  submitted_by: string;
  submitted_at: string;
}

interface DisputeVote {
  id: string;
  voter_address: string;
  voter_name: string;
  vote: 'approve' | 'reject' | 'abstain';
  reason: string;
  timestamp: string;
}

interface MultiSigWallet {
  id: string;
  address: string;
  name: string;
  required_signatures: number;
  total_signers: number;
  signers: {
    address: string;
    name: string;
    role: string;
    active: boolean;
  }[];
  balance: number;
  pending_transactions: number;
  created_at: string;
}

const TransactionVerification: React.FC = () => {
  const { account, web3 } = useWeb3();
  const { products } = useSupplyChain();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [multiSigWallets, setMultiSigWallets] = useState<MultiSigWallet[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'transactions' | 'multisig' | 'disputes'>('transactions');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState('');
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
    evidence: [] as File[]
  });

  // Mock data
  const mockTransactions: Transaction[] = [
    {
      id: 'tx_001',
      hash: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'transfer',
      from_address: '0xabcd...1234',
      to_address: '0xefgh...5678',
      amount: 1500.00,
      currency: 'ETH',
      status: 'pending',
      confirmations: 2,
      required_confirmations: 3,
      gas_fee: 0.025,
      timestamp: '2024-01-15T10:30:00Z',
      block_number: 18945672,
      product_id: 'prod_001',
      metadata: {
        description: 'Payment for Premium Coffee Beans shipment',
        participants: ['Supplier Corp', 'Distribution LLC'],
        documents: ['invoice_001.pdf', 'quality_cert_001.pdf'],
        quality_score: 95,
        location: 'New York, NY'
      },
      signatures: [
        {
          id: 'sig_001',
          signer_address: '0xabcd...1234',
          signer_name: 'John Smith',
          signer_role: 'Supplier Manager',
          signature: '0x789abc...def123',
          timestamp: '2024-01-15T10:30:00Z',
          status: 'signed'
        },
        {
          id: 'sig_002',
          signer_address: '0xefgh...5678',
          signer_name: 'Sarah Johnson',
          signer_role: 'Quality Inspector',
          signature: '0x456def...abc789',
          timestamp: '2024-01-15T10:45:00Z',
          status: 'signed'
        },
        {
          id: 'sig_003',
          signer_address: '0xijkl...9012',
          signer_name: 'Mike Wilson',
          signer_role: 'Finance Manager',
          signature: '',
          timestamp: '',
          status: 'pending'
        }
      ]
    },
    {
      id: 'tx_002',
      hash: '0xfedcba0987654321fedcba0987654321fedcba09',
      type: 'quality_check',
      from_address: '0xqrst...3456',
      to_address: '0xuvwx...7890',
      amount: 0,
      currency: 'ETH',
      status: 'disputed',
      confirmations: 12,
      required_confirmations: 12,
      gas_fee: 0.015,
      timestamp: '2024-01-14T15:20:00Z',
      block_number: 18943521,
      product_id: 'prod_002',
      contract_address: '0xcontract...address',
      metadata: {
        description: 'Quality verification for Organic Honey batch',
        participants: ['Quality Lab', 'Certification Body'],
        documents: ['lab_report_002.pdf', 'certification_002.pdf'],
        quality_score: 78,
        location: 'Los Angeles, CA'
      },
      signatures: [
        {
          id: 'sig_004',
          signer_address: '0xqrst...3456',
          signer_name: 'Dr. Emily Chen',
          signer_role: 'Lab Director',
          signature: '0xlab123...cert456',
          timestamp: '2024-01-14T15:20:00Z',
          status: 'signed'
        },
        {
          id: 'sig_005',
          signer_address: '0xuvwx...7890',
          signer_name: 'Robert Davis',
          signer_role: 'Certification Officer',
          signature: '0xcert789...lab012',
          timestamp: '2024-01-14T15:35:00Z',
          status: 'rejected',
          message: 'Quality score below acceptable threshold'
        }
      ],
      dispute: {
        id: 'dispute_001',
        transaction_id: 'tx_002',
        raised_by: 'Natural Farms Ltd.',
        raised_at: '2024-01-14T16:00:00Z',
        reason: 'Quality Assessment Dispute',
        description: 'We believe the quality assessment was conducted incorrectly. The honey batch meets all organic standards.',
        status: 'investigating',
        evidence: [
          {
            id: 'ev_001',
            type: 'document',
            title: 'Independent Lab Report',
            description: 'Third-party quality assessment showing 92% quality score',
            file_url: '/evidence/independent_report.pdf',
            submitted_by: 'Natural Farms Ltd.',
            submitted_at: '2024-01-14T16:30:00Z'
          },
          {
            id: 'ev_002',
            type: 'image',
            title: 'Product Photos',
            description: 'High-resolution images of the honey batch',
            file_url: '/evidence/honey_batch_photos.zip',
            submitted_by: 'Natural Farms Ltd.',
            submitted_at: '2024-01-14T17:00:00Z'
          }
        ],
        votes: [
          {
            id: 'vote_001',
            voter_address: '0xvoter1...addr',
            voter_name: 'Alice Thompson',
            vote: 'approve',
            reason: 'Evidence supports the dispute claim',
            timestamp: '2024-01-15T09:00:00Z'
          },
          {
            id: 'vote_002',
            voter_address: '0xvoter2...addr',
            voter_name: 'Bob Martinez',
            vote: 'reject',
            reason: 'Original assessment appears correct',
            timestamp: '2024-01-15T10:15:00Z'
          }
        ]
      }
    },
    {
      id: 'tx_003',
      hash: '0x9876543210fedcba9876543210fedcba98765432',
      type: 'payment',
      from_address: '0xpayer...addr',
      to_address: '0xpayee...addr',
      amount: 2750.50,
      currency: 'USDC',
      status: 'confirmed',
      confirmations: 25,
      required_confirmations: 12,
      gas_fee: 0.008,
      timestamp: '2024-01-13T11:45:00Z',
      block_number: 18941234,
      product_id: 'prod_003',
      metadata: {
        description: 'Final payment for smartphone case order',
        participants: ['Tech Accessories Inc.', 'Retail Chain'],
        documents: ['final_invoice.pdf', 'delivery_confirmation.pdf'],
        location: 'Chicago, IL'
      },
      signatures: [
        {
          id: 'sig_006',
          signer_address: '0xpayer...addr',
          signer_name: 'Lisa Wang',
          signer_role: 'Procurement Manager',
          signature: '0xpay123...sign456',
          timestamp: '2024-01-13T11:45:00Z',
          status: 'signed'
        },
        {
          id: 'sig_007',
          signer_address: '0xpayee...addr',
          signer_name: 'David Kim',
          signer_role: 'Sales Director',
          signature: '0xsale789...conf012',
          timestamp: '2024-01-13T12:00:00Z',
          status: 'signed'
        }
      ]
    }
  ];

  const mockMultiSigWallets: MultiSigWallet[] = [
    {
      id: 'wallet_001',
      address: '0xmultisig1234567890abcdef',
      name: 'Supply Chain Treasury',
      required_signatures: 3,
      total_signers: 5,
      signers: [
        { address: '0xsigner1...addr', name: 'John Smith', role: 'CEO', active: true },
        { address: '0xsigner2...addr', name: 'Sarah Johnson', role: 'CFO', active: true },
        { address: '0xsigner3...addr', name: 'Mike Wilson', role: 'COO', active: true },
        { address: '0xsigner4...addr', name: 'Emily Chen', role: 'CTO', active: true },
        { address: '0xsigner5...addr', name: 'Robert Davis', role: 'Legal', active: false }
      ],
      balance: 125000.75,
      pending_transactions: 2,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'wallet_002',
      address: '0xmultisig9876543210fedcba',
      name: 'Quality Assurance Fund',
      required_signatures: 2,
      total_signers: 3,
      signers: [
        { address: '0xqa1...addr', name: 'Dr. Emily Chen', role: 'QA Director', active: true },
        { address: '0xqa2...addr', name: 'Lisa Wang', role: 'QA Manager', active: true },
        { address: '0xqa3...addr', name: 'David Kim', role: 'QA Specialist', active: true }
      ],
      balance: 45000.25,
      pending_transactions: 1,
      created_at: '2024-01-05T00:00:00Z'
    }
  ];

  useEffect(() => {
    setTransactions(mockTransactions);
    setMultiSigWallets(mockMultiSigWallets);
  }, []);

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    disputed: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    resolved: { color: 'bg-blue-100 text-blue-800', icon: Gavel }
  };

  const typeConfig = {
    transfer: { color: 'bg-blue-100 text-blue-800', icon: Truck },
    payment: { color: 'bg-green-100 text-green-800', icon: DollarSign },
    contract_execution: { color: 'bg-purple-100 text-purple-800', icon: FileText },
    quality_check: { color: 'bg-orange-100 text-orange-800', icon: Shield },
    shipment: { color: 'bg-indigo-100 text-indigo-800', icon: Package }
  };

  const signatureStatusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    signed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const disputeStatusConfig = {
    open: { color: 'bg-red-100 text-red-800', icon: Flag },
    investigating: { color: 'bg-yellow-100 text-yellow-800', icon: Search },
    resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    closed: { color: 'bg-gray-100 text-gray-800', icon: Archive }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.metadata.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.to_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesType = filterType === 'all' || tx.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingSignatures = transactions.reduce((count, tx) => {
    return count + tx.signatures.filter(sig => sig.status === 'pending').length;
  }, 0);

  const disputedTransactions = transactions.filter(tx => tx.status === 'disputed').length;
  const totalValue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgConfirmations = transactions.reduce((sum, tx) => sum + tx.confirmations, 0) / transactions.length;

  const transactionsByStatus = transactions.reduce((acc, tx) => {
    acc[tx.status] = (acc[tx.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(transactionsByStatus).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleSignTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    // Simulate signing process
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === selectedTransaction.id) {
        const updatedSignatures = tx.signatures.map(sig => {
          if (sig.status === 'pending' && sig.signer_address === account) {
            return {
              ...sig,
              status: 'signed' as const,
              signature: `0x${Math.random().toString(16).substr(2, 64)}`,
              timestamp: new Date().toISOString(),
              message: signatureMessage
            };
          }
          return sig;
        });

        const signedCount = updatedSignatures.filter(sig => sig.status === 'signed').length;
        const newStatus: 'pending' | 'confirmed' | 'failed' | 'disputed' | 'resolved' = signedCount >= tx.required_confirmations ? 'confirmed' : 'pending';

        return {
          ...tx,
          signatures: updatedSignatures,
          status: newStatus,
          confirmations: signedCount
        };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    setShowSignModal(false);
    setSelectedTransaction(null);
    setSignatureMessage('');
    toast.success('Transaction signed successfully');
  };

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const newDispute: Dispute = {
      id: `dispute_${Date.now()}`,
      transaction_id: selectedTransaction.id,
      raised_by: user?.name || 'Current User',
      raised_at: new Date().toISOString(),
      reason: disputeForm.reason,
      description: disputeForm.description,
      status: 'open',
      evidence: [],
      votes: []
    };

    const updatedTransactions = transactions.map(tx => {
      if (tx.id === selectedTransaction.id) {
        return {
          ...tx,
          status: 'disputed' as const,
          dispute: newDispute
        };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    setShowDisputeModal(false);
    setSelectedTransaction(null);
    setDisputeForm({ reason: '', description: '', evidence: [] });
    toast.success('Dispute raised successfully');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Verification</h1>
              <p className="text-gray-600 mt-2">
                Verify transactions, manage multi-signature wallets, and resolve disputes.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {pendingSignatures > 0 && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <Signature className="w-5 h-5" />
                  <span className="font-medium">{pendingSignatures} Pending Signatures</span>
                </div>
              )}
              <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>New Transaction</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'transactions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Transactions
            </button>
            <button
              onClick={() => setViewMode('multisig')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'multisig'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Multi-Sig Wallets
            </button>
            <button
              onClick={() => setViewMode('disputes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                viewMode === 'disputes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Gavel className="w-4 h-4 inline mr-2" />
              Disputes
              {disputedTransactions > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {disputedTransactions}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transaction Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+15.3%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Signatures</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSignatures}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Signature className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600 font-medium">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confirmations</p>
                <p className="text-2xl font-bold text-gray-900">{avgConfirmations.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">Secure network</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{disputedTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Gavel className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {disputedTransactions === 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">All resolved</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">Needs attention</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transactions View */}
        {viewMode === 'transactions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                    <option value="disputed">Disputed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="transfer">Transfer</option>
                    <option value="payment">Payment</option>
                    <option value="contract_execution">Contract Execution</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="shipment">Shipment</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map(transaction => {
                const StatusIcon = statusConfig[transaction.status].icon;
                const TypeIcon = typeConfig[transaction.type].icon;
                const pendingSigs = transaction.signatures.filter(sig => sig.status === 'pending').length;
                const signedSigs = transaction.signatures.filter(sig => sig.status === 'signed').length;
                
                return (
                  <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{transaction.metadata.description}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[transaction.status].color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {transaction.status}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig[transaction.type].color}`}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Hash className="w-4 h-4 mr-1" />
                              {transaction.hash.substring(0, 10)}...{transaction.hash.substring(transaction.hash.length - 8)}
                              <button
                                onClick={() => copyToClipboard(transaction.hash)}
                                className="ml-1 p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(transaction.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {transaction.amount > 0 ? `${transaction.amount} ${transaction.currency}` : 'No value'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pendingSigs > 0 && (
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowSignModal(true);
                            }}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm flex items-center space-x-1"
                          >
                            <Signature className="w-4 h-4" />
                            <span>Sign ({pendingSigs})</span>
                          </button>
                        )}
                        {transaction.status === 'confirmed' && !transaction.dispute && (
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDisputeModal(true);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-1"
                          >
                            <Flag className="w-4 h-4" />
                            <span>Dispute</span>
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Signatures */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Signatures ({signedSigs}/{transaction.required_confirmations})</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(signedSigs / transaction.required_confirmations) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round((signedSigs / transaction.required_confirmations) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {transaction.signatures.map(signature => {
                          const SigStatusIcon = signatureStatusConfig[signature.status].icon;
                          
                          return (
                            <div key={signature.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${signatureStatusConfig[signature.status].color}`}>
                                <SigStatusIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{signature.signer_name}</p>
                                <p className="text-xs text-gray-500 truncate">{signature.signer_role}</p>
                                {signature.message && (
                                  <p className="text-xs text-gray-600 mt-1">{signature.message}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Dispute Info */}
                    {transaction.dispute && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Flag className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900">{transaction.dispute.reason}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${disputeStatusConfig[transaction.dispute.status].color}`}>
                                {transaction.dispute.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{transaction.dispute.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Raised by: {transaction.dispute.raised_by}</span>
                              <span>{new Date(transaction.dispute.raised_at).toLocaleString()}</span>
                              <span>{transaction.dispute.evidence.length} evidence files</span>
                              <span>{transaction.dispute.votes.length} votes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Analytics Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Multi-Sig Wallets View */}
        {viewMode === 'multisig' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {multiSigWallets.map(wallet => (
              <div key={wallet.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{wallet.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="ml-1 p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${wallet.balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Balance</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{wallet.required_signatures}</p>
                    <p className="text-sm text-blue-600">Required Signatures</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{wallet.total_signers}</p>
                    <p className="text-sm text-green-600">Total Signers</p>
                  </div>
                </div>
                
                {wallet.pending_transactions > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {wallet.pending_transactions} pending transaction{wallet.pending_transactions > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Signers</h4>
                  {wallet.signers.map(signer => (
                    <div key={signer.address} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          signer.active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <User className={`w-4 h-4 ${
                            signer.active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                          <p className="text-xs text-gray-500">{signer.role}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        signer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {signer.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disputes View */}
        {viewMode === 'disputes' && (
          <div className="space-y-6">
            {transactions.filter(tx => tx.dispute).map(transaction => {
              const dispute = transaction.dispute!;
              const DisputeStatusIcon = disputeStatusConfig[dispute.status].icon;
              
              return (
                <div key={dispute.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Gavel className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{dispute.reason}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${disputeStatusConfig[dispute.status].color}`}>
                            <DisputeStatusIcon className="w-3 h-3 mr-1" />
                            {dispute.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{dispute.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Raised by: {dispute.raised_by}</span>
                          <span>{new Date(dispute.raised_at).toLocaleString()}</span>
                          <span>Transaction: {transaction.hash.substring(0, 10)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Evidence */}
                  {dispute.evidence.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Evidence ({dispute.evidence.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dispute.evidence.map(evidence => (
                          <div key={evidence.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{evidence.title}</p>
                              <p className="text-xs text-gray-500 mb-1">{evidence.description}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{evidence.submitted_by}</span>
                                <span>•</span>
                                <span>{new Date(evidence.submitted_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Votes */}
                  {dispute.votes.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Community Votes ({dispute.votes.length})</h4>
                      <div className="space-y-2">
                        {dispute.votes.map(vote => (
                          <div key={vote.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              vote.vote === 'approve' ? 'bg-green-100' :
                              vote.vote === 'reject' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              {vote.vote === 'approve' ? (
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              ) : vote.vote === 'reject' ? (
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <Minus className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-gray-900">{vote.voter_name}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  vote.vote === 'approve' ? 'bg-green-100 text-green-800' :
                                  vote.vote === 'reject' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {vote.vote}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{vote.reason}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(vote.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sign Transaction Modal */}
      {showSignModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Sign Transaction</h2>
              <p className="text-gray-600 mt-1">{selectedTransaction.metadata.description}</p>
            </div>
            
            <form onSubmit={handleSignTransaction} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Transaction Hash</p>
                    <p className="font-mono text-gray-900">{selectedTransaction.hash.substring(0, 20)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">
                      {selectedTransaction.amount > 0 ? `${selectedTransaction.amount} ${selectedTransaction.currency}` : 'No value'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Required Signatures</p>
                    <p className="font-medium text-gray-900">{selectedTransaction.required_confirmations}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Signatures</p>
                    <p className="font-medium text-gray-900">{selectedTransaction.confirmations}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Message (Optional)</label>
                <textarea
                  value={signatureMessage}
                  onChange={(e) => setSignatureMessage(e.target.value)}
                  placeholder="Add a message with your signature..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignModal(false);
                    setSelectedTransaction(null);
                    setSignatureMessage('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Signature className="w-4 h-4" />
                  <span>Sign Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {showDisputeModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Raise Dispute</h2>
              <p className="text-gray-600 mt-1">{selectedTransaction.metadata.description}</p>
            </div>
            
            <form onSubmit={handleRaiseDispute} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dispute Reason</label>
                <select
                  required
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({...disputeForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Quality Assessment Dispute">Quality Assessment Dispute</option>
                  <option value="Payment Dispute">Payment Dispute</option>
                  <option value="Delivery Issue">Delivery Issue</option>
                  <option value="Contract Violation">Contract Violation</option>
                  <option value="Fraud Suspicion">Fraud Suspicion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({...disputeForm, description: e.target.value})}
                  placeholder="Provide detailed information about the dispute..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedTransaction(null);
                    setDisputeForm({ reason: '', description: '', evidence: [] });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Raise Dispute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionVerification;