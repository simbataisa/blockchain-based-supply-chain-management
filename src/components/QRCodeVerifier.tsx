import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Scan } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  batch_number: string;
  status: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
  current_location: string;
  created_at: string;
  manufacturer_id: string;
}

interface QRCodeVerifierProps {
  products: Product[];
  onProductFound?: (product: Product) => void;
}

const QRCodeVerifier: React.FC<QRCodeVerifierProps> = ({ products, onProductFound }) => {
  const [inputValue, setInputValue] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'warning';
    product?: Product;
    message: string;
  }>({ status: 'idle', message: '' });
  const [isScanning, setIsScanning] = useState(false);

  const verifyProduct = (productId: string) => {
    if (!productId.trim()) {
      setVerificationResult({
        status: 'error',
        message: 'Please enter a product ID or scan a QR code'
      });
      return;
    }

    const product = products.find(p => 
      p.id === productId || 
      p.sku === productId || 
      p.batch_number === productId
    );

    if (!product) {
      setVerificationResult({
        status: 'error',
        message: 'Product not found. This may be a counterfeit or invalid product ID.'
      });
      toast.error('Product verification failed');
      return;
    }

    // Check product status for warnings
    let status: 'success' | 'warning' = 'success';
    let message = 'Product verified successfully! This is an authentic product.';

    if (product.status === 'recalled') {
      status = 'warning';
      message = 'WARNING: This product has been recalled. Do not use this product.';
      toast.error('Product recalled!');
    } else {
      toast.success('Product verified!');
    }

    setVerificationResult({
      status,
      product,
      message
    });

    if (onProductFound) {
      onProductFound(product);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyProduct(inputValue);
  };

  const simulateQRScan = () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      // For demo purposes, randomly select a product or use a sample ID
      const sampleProduct = products[Math.floor(Math.random() * products.length)];
      if (sampleProduct) {
        setInputValue(sampleProduct.id);
        verifyProduct(sampleProduct.id);
      }
      setIsScanning(false);
    }, 2000);
  };

  const getStatusIcon = () => {
    switch (verificationResult.status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (verificationResult.status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Product Verification
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product ID, SKU, or Batch Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter product identifier..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Verify Product
            </button>
            
            <button
              type="button"
              onClick={simulateQRScan}
              disabled={isScanning}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isScanning ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Scan className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </form>
        
        {verificationResult.status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start space-x-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {verificationResult.message}
                </p>
                
                {verificationResult.product && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p>{verificationResult.product.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">SKU:</span>
                        <p>{verificationResult.product.sku}</p>
                      </div>
                      <div>
                        <span className="font-medium">Batch:</span>
                        <p>{verificationResult.product.batch_number}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="capitalize">{verificationResult.product.status.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p>{verificationResult.product.current_location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <p>{new Date(verificationResult.product.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeVerifier;