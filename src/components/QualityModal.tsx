import React from 'react';
import { X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  batch_number: string;
  manufacturer_id: string;
  current_owner_id: string;
  status: 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';
  origin_location: string;
  current_location: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface QualityRecord {
  id: string;
  type: string;
  status: 'Passed' | 'Warning' | 'Failed';
  inspector: string;
  date: string;
  score?: number;
  notes: string;
  temperature?: string;
}

interface Certification {
  id: string;
  name: string;
  status: 'Valid' | 'Expired' | 'Pending';
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  certificateId: string;
}

interface QualityModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddInspection?: () => void;
  onAddCertificate?: () => void;
  onGenerateReport?: () => void;
}

const QualityModal: React.FC<QualityModalProps> = ({
  isOpen,
  product,
  onClose,
  onAddInspection,
  onAddCertificate,
  onGenerateReport
}) => {
  if (!isOpen || !product) return null;

  // Sample quality records - in a real app, these would come from props or API
  const qualityRecords: QualityRecord[] = [
    {
      id: '1',
      type: 'Initial Quality Check',
      status: 'Passed',
      inspector: 'John Smith',
      date: new Date().toLocaleDateString(),
      score: 95,
      notes: 'Product meets all quality standards'
    },
    {
      id: '2',
      type: 'Temperature Compliance',
      status: 'Passed',
      inspector: 'Sarah Johnson',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      temperature: '2-4°C (Within Range)',
      notes: 'Temperature maintained throughout transport'
    },
    {
      id: '3',
      type: 'Packaging Integrity',
      status: 'Warning',
      inspector: 'Mike Davis',
      date: new Date(Date.now() - 172800000).toLocaleDateString(),
      score: 78,
      notes: 'Minor packaging damage detected, product integrity maintained'
    }
  ];

  // Sample certifications - in a real app, these would come from props or API
  const certifications: Certification[] = [
    {
      id: '1',
      name: 'ISO 9001:2015',
      status: 'Valid',
      issuedBy: 'SGS International',
      issueDate: new Date(Date.now() - 31536000000).toLocaleDateString(),
      expiryDate: new Date(Date.now() + 63072000000).toLocaleDateString(),
      certificateId: 'ISO-9001-2024-001'
    },
    {
      id: '2',
      name: 'HACCP Certification',
      status: 'Valid',
      issuedBy: 'Bureau Veritas',
      issueDate: new Date(Date.now() - 15768000000).toLocaleDateString(),
      expiryDate: new Date(Date.now() + 47304000000).toLocaleDateString(),
      certificateId: 'HACCP-2024-BV-789'
    },
    {
      id: '3',
      name: 'Organic Certification',
      status: 'Expired',
      issuedBy: 'USDA Organic',
      issueDate: new Date(Date.now() - 94608000000).toLocaleDateString(),
      expiryDate: new Date(Date.now() - 31536000000).toLocaleDateString(),
      certificateId: 'USDA-ORG-2022-456'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed':
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Warning':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallQualityScore = Math.round(
    qualityRecords.reduce((acc, record) => acc + (record.score || 0), 0) / 
    qualityRecords.filter(record => record.score).length
  );

  const activeCertifications = certifications.filter(cert => cert.status === 'Valid').length;
  const totalCertifications = certifications.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quality Management</h2>
              <p className="text-sm text-gray-600 mt-1">{product.name} - {product.sku}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Inspections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quality Inspections</h3>
                <button 
                  onClick={onAddInspection}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Add Inspection
                </button>
              </div>
              
              <div className="space-y-3">
                {qualityRecords.map((record) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{record.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Inspector:</span> {record.inspector}</p>
                      <p><span className="font-medium">Date:</span> {record.date}</p>
                      {record.score && (
                        <p><span className="font-medium">Score:</span> {record.score}/100</p>
                      )}
                      {record.temperature && (
                        <p><span className="font-medium">Temperature:</span> {record.temperature}</p>
                      )}
                      <p><span className="font-medium">Notes:</span> {record.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Certifications & Compliance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                <button 
                  onClick={onAddCertificate}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Add Certificate
                </button>
              </div>
              
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{cert.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                        {cert.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Issued By:</span> {cert.issuedBy}</p>
                      <p><span className="font-medium">Issue Date:</span> {cert.issueDate}</p>
                      <p><span className="font-medium">Expiry Date:</span> {cert.expiryDate}</p>
                      <p><span className="font-medium">Certificate ID:</span> {cert.certificateId}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Compliance Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Compliance Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Quality Score:</span>
                    <span className="font-medium text-green-600">{overallQualityScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Certifications:</span>
                    <span className="font-medium text-gray-900">{activeCertifications} of {totalCertifications}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Inspection:</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Compliance Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activeCertifications >= totalCertifications * 0.7 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activeCertifications >= totalCertifications * 0.7 ? 'Compliant' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={onGenerateReport}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityModal;
export type { QualityModalProps, Product, QualityRecord, Certification };