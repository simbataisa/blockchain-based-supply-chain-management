import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3, { Contract } from 'web3';

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  connected: boolean;
  isConnected: boolean;
  connecting: boolean;
  networkId: number | null;
  balance: string;
  supplyChainContract: Contract<any> | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  deployContract: (contractCode: string, abi: any[]) => Promise<Contract<any> | null>;
  callContractMethod: (contractAddress: string, abi: any[], methodName: string, params: any[]) => Promise<any>;
  getContractInstance: (address: string, abi: any[]) => Contract<any> | null;
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>;
  getTransactionReceipt: (txHash: string) => Promise<any>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

// Mock ABI for supply chain contract
const SUPPLY_CHAIN_ABI = [
  {
    "inputs": [],
    "name": "createProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "productId", "type": "uint256"}],
    "name": "getProduct",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "productId", "type": "uint256"},
      {"internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "transferProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [supplyChainContract, setSupplyChainContract] = useState<Contract<any> | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          
          const networkId = await web3Instance.eth.net.getId();
          setNetworkId(Number(networkId));
          
          const balance = await web3Instance.eth.getBalance(accounts[0]);
          setBalance(web3Instance.utils.fromWei(balance, 'ether'));
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    setConnecting(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      setConnected(true);
      
      const networkId = await web3Instance.eth.net.getId();
      setNetworkId(Number(networkId));
      
      const balance = await web3Instance.eth.getBalance(accounts[0]);
      setBalance(web3Instance.utils.fromWei(balance, 'ether'));
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });
      
      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setConnected(false);
    setNetworkId(null);
    setBalance('0');
    setSupplyChainContract(null);
  };

  const callContractMethod = async (
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[]
  ) => {
    if (!web3 || !account) {
      throw new Error('Web3 not connected');
    }

    try {
      const contract = new web3.eth.Contract(abi, contractAddress);
      const method = contract.methods[methodName](...params);
      
      const gasEstimate = await method.estimateGas({ from: account });
      const result = await method.send({
        from: account,
        gas: gasEstimate.toString()
      });
      
      return result;
    } catch (error) {
      console.error('Error calling contract method:', error);
      throw error;
    }
  };

  const deployContract = async (contractCode: string, abi: any[]): Promise<Contract<any> | null> => {
    if (!web3 || !account) {
      throw new Error('Web3 not connected');
    }

    try {
      const contract = new web3.eth.Contract(abi);
      const deployTx = contract.deploy({
        data: contractCode
      });
      
      const gasEstimate = await deployTx.estimateGas({ from: account });
      const deployedContract = await deployTx.send({
        from: account,
        gas: gasEstimate.toString()
      });
      
      return deployedContract;
    } catch (error) {
      console.error('Error deploying contract:', error);
      return null;
    }
  };

  const getContractInstance = (address: string, abi: any[]): Contract<any> | null => {
    if (!web3) {
      return null;
    }
    
    try {
      return new web3.eth.Contract(abi, address);
    } catch (error) {
      console.error('Error creating contract instance:', error);
      return null;
    }
  };

  const sendTransaction = async (to: string, value: string, data?: string): Promise<string> => {
    if (!web3 || !account) {
      throw new Error('Web3 not connected');
    }

    try {
      const tx = await web3.eth.sendTransaction({
        from: account,
        to,
        value: web3.utils.toWei(value, 'ether'),
        data,
        gas: '21000'
      });

      return tx.transactionHash as string;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  const getTransactionReceipt = async (txHash: string) => {
    if (!web3) {
      throw new Error('Web3 not connected');
    }

    try {
      return await web3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  };

  const value = {
    web3,
    account,
    connected,
    isConnected: connected,
    connecting,
    networkId,
    balance,
    supplyChainContract,
    connectWallet,
    disconnectWallet,
    deployContract,
    callContractMethod,
    getContractInstance,
    sendTransaction,
    getTransactionReceipt
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;

// Extend window object for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}