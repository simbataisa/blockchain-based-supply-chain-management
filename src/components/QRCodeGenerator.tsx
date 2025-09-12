import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  title?: string;
  showActions?: boolean;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  size = 200,
  title,
  showActions = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current && data) {
        try {
          await QRCode.toCanvas(canvasRef.current, data, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          // Also generate data URL for download
          const dataUrl = await QRCode.toDataURL(data, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrDataUrl(dataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };

    generateQR();
  }, [data, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      toast.success('QR code data copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded');
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <canvas ref={canvasRef} className="block" />
      </div>
      
      {showActions && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Data'}</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center max-w-xs break-all">
        {data}
      </p>
    </div>
  );
};

export default QRCodeGenerator;