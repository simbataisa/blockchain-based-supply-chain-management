import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  MapPin, 
  Users, 
  Warehouse, 
  CreditCard, 
  FileBarChart, 
  BarChart3, 
  X,
  Blocks,
  Database
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      description: 'Product management'
    },
    {
      name: 'Smart Contracts',
      href: '/smart-contracts',
      icon: FileText,
      description: 'Blockchain contracts'
    },
    {
      name: 'Real-time Tracking',
      href: '/tracking',
      icon: MapPin,
      description: 'GPS and IoT monitoring'
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      description: 'Roles and permissions'
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Warehouse,
      description: 'Stock and warehouses'
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: CreditCard,
      description: 'Verification and disputes'
    },
    {
      name: 'Compliance',
      href: '/compliance',
      icon: FileBarChart,
      description: 'Reports and audits'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Performance metrics'
    },
    {
      name: 'Database Migration',
      href: '/database-migration',
      icon: Database,
      description: 'Setup database tables'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-emerald-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Blocks className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BlockChain</h1>
              <p className="text-xs text-blue-200">Supply Chain</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      active
                        ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white hover:transform hover:scale-105'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                    ${active ? 'text-white' : 'text-blue-300 group-hover:text-white'}
                  `} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`
                      text-xs mt-0.5 transition-colors
                      ${active ? 'text-emerald-100' : 'text-blue-300 group-hover:text-blue-100'}
                    `}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
          <div className="text-center">
            <p className="text-xs text-blue-300">Blockchain Supply Chain v1.0</p>
            <p className="text-xs text-blue-400 mt-1">Secure &middot; Transparent &middot; Efficient</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;