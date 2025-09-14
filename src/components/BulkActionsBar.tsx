import React from 'react';
import {
  Download,
  CheckCircle,
  MapPin,
  QrCode,
  Trash2
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBatchAction: (action: string, value?: string) => void;
  onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onBatchAction,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {selectedCount} product(s) selected
        </span>
        
        {/* Export */}
        <button
          onClick={() => onBatchAction('export')}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        
        {/* Status Update Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            <CheckCircle className="w-4 h-4" />
            <span>Update Status</span>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="py-1 min-w-[140px]">
              <button
                onClick={() => onBatchAction('status_update', 'created')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Created
              </button>
              <button
                onClick={() => onBatchAction('status_update', 'in_transit')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                In Transit
              </button>
              <button
                onClick={() => onBatchAction('status_update', 'delivered')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Delivered
              </button>
              <button
                onClick={() => onBatchAction('status_update', 'verified')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Verified
              </button>
              <button
                onClick={() => onBatchAction('status_update', 'recalled')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Recalled
              </button>
            </div>
          </div>
        </div>
        
        {/* Location Update */}
        <button
          onClick={() => onBatchAction('location_update')}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span>Update Location</span>
        </button>
        
        {/* Print Labels */}
        <button
          onClick={() => onBatchAction('print_labels')}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>Print Labels</span>
        </button>
        
        {/* Delete */}
        <button
          onClick={() => onBatchAction('delete')}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
      
      <button
        onClick={onClearSelection}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Clear Selection
      </button>
    </div>
  );
};

export default BulkActionsBar;