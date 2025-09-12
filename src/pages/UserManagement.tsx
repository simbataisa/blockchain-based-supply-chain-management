import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  organization: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
  last_login?: string;
  created_at: string;
  permissions: string[];
  avatar_url?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [viewMode, setViewMode] = useState<'users' | 'roles' | 'permissions'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role: 'viewer' as User['role'],
    organization: '',
    phone: '',
    address: ''
  });
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [isEditing, setIsEditing] = useState(false);

  // Mock data
  const mockUsers: User[] = [
    {
      id: 'user_001',
      email: 'admin@company.com',
      full_name: 'John Administrator',
      role: 'admin',
      organization: 'Global Supply Corp',
      phone: '+1-555-0101',
      address: 'New York, NY',
      status: 'active',
      last_login: '2024-01-15T10:30:00Z',
      created_at: '2023-01-15T08:00:00Z',
      permissions: ['all'],
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'user_002',
      email: 'manager@company.com',
      full_name: 'Sarah Manager',
      role: 'manager',
      organization: 'Global Supply Corp',
      phone: '+1-555-0102',
      address: 'Los Angeles, CA',
      status: 'active',
      last_login: '2024-01-15T09:15:00Z',
      created_at: '2023-02-20T08:00:00Z',
      permissions: ['products.read', 'products.write', 'tracking.read', 'users.read'],
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'user_003',
      email: 'operator@company.com',
      full_name: 'Mike Operator',
      role: 'operator',
      organization: 'Logistics Partners',
      phone: '+1-555-0103',
      address: 'Chicago, IL',
      status: 'active',
      last_login: '2024-01-14T16:45:00Z',
      created_at: '2023-03-10T08:00:00Z',
      permissions: ['products.read', 'tracking.read', 'tracking.write'],
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'user_004',
      email: 'viewer@company.com',
      full_name: 'Lisa Viewer',
      role: 'viewer',
      organization: 'Quality Assurance Inc',
      phone: '+1-555-0104',
      address: 'Miami, FL',
      status: 'pending',
      created_at: '2024-01-10T08:00:00Z',
      permissions: ['products.read', 'tracking.read']
    },
    {
      id: 'user_005',
      email: 'inactive@company.com',
      full_name: 'Tom Inactive',
      role: 'operator',
      organization: 'Former Partner LLC',
      status: 'inactive',
      last_login: '2023-12-01T10:00:00Z',
      created_at: '2023-01-01T08:00:00Z',
      permissions: ['products.read']
    }
  ];

  const mockRoles: Role[] = [
    {
      id: 'role_001',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['all'],
      user_count: 1
    },
    {
      id: 'role_002',
      name: 'Manager',
      description: 'Manage products, tracking, and view users',
      permissions: ['products.read', 'products.write', 'tracking.read', 'tracking.write', 'users.read'],
      user_count: 1
    },
    {
      id: 'role_003',
      name: 'Operator',
      description: 'Handle day-to-day operations and tracking',
      permissions: ['products.read', 'tracking.read', 'tracking.write'],
      user_count: 2
    },
    {
      id: 'role_004',
      name: 'Viewer',
      description: 'Read-only access to products and tracking',
      permissions: ['products.read', 'tracking.read'],
      user_count: 1
    }
  ];

  const allPermissions = [
    'products.read',
    'products.write',
    'products.delete',
    'tracking.read',
    'tracking.write',
    'contracts.read',
    'contracts.write',
    'contracts.deploy',
    'users.read',
    'users.write',
    'users.delete',
    'analytics.read',
    'settings.read',
    'settings.write'
  ];

  useEffect(() => {
    setUsers(mockUsers);
    setRoles(mockRoles);
  }, []);

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  };

  const roleConfig = {
    admin: { color: 'bg-purple-100 text-purple-800', icon: Shield },
    manager: { color: 'bg-blue-100 text-blue-800', icon: Users },
    operator: { color: 'bg-green-100 text-green-800', icon: Settings },
    viewer: { color: 'bg-gray-100 text-gray-800', icon: Eye }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      ...userForm,
      status: 'pending',
      created_at: new Date().toISOString(),
      permissions: roles.find(r => r.name.toLowerCase() === userForm.role)?.permissions || []
    };
    
    setUsers([...users, newUser]);
    setShowUserModal(false);
    setUserForm({
      email: '',
      full_name: '',
      role: 'viewer',
      organization: '',
      phone: '',
      address: ''
    });
    toast.success('User created successfully');
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const updatedUsers = users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...userForm, permissions: roles.find(r => r.name.toLowerCase() === userForm.role)?.permissions || [] }
        : user
    );
    
    setUsers(updatedUsers);
    setShowUserModal(false);
    setSelectedUser(null);
    setIsEditing(false);
    toast.success('User updated successfully');
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const newStatus: 'active' | 'inactive' | 'pending' = user.status === 'active' ? 'inactive' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    toast.success('User status updated');
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization: user.organization,
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsEditing(true);
    setShowUserModal(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setUserForm({
      email: '',
      full_name: '',
      role: 'viewer',
      organization: '',
      phone: '',
      address: ''
    });
    setIsEditing(false);
    setShowUserModal(true);
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">
                Manage users, roles, and permissions for your organization.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'users'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setViewMode('roles')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'roles'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Roles
            </button>
            <button
              onClick={() => setViewMode('permissions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'permissions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Permissions
            </button>
          </div>
        </div>

        {/* Users View */}
        {viewMode === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Organization</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => {
                      const StatusIcon = statusConfig[user.status].icon;
                      const RoleIcon = roleConfig[user.role].icon;
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                {user.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt={user.full_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-medium text-sm">
                                    {user.full_name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[user.role].color}`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">{user.organization}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[user.status].color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-500">
                            {formatLastLogin(user.last_login)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`p-1 hover:bg-gray-50 rounded ${
                                  user.status === 'active' ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'
                                }`}
                              >
                                {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles View */}
        {viewMode === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.user_count} users</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map(permission => (
                      <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {permission}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions View */}
        {viewMode === 'permissions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">System Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPermissions.map(permission => {
                const [resource, action] = permission.split('.');
                return (
                  <div key={permission} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 capitalize">{resource}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        action === 'read' ? 'bg-green-100 text-green-800' :
                        action === 'write' ? 'bg-blue-100 text-blue-800' :
                        action === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {action}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {action === 'read' ? 'View' : action === 'write' ? 'Create/Edit' : action === 'delete' ? 'Delete' : 'Special'} {resource} data
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit User' : 'Create New User'}
              </h2>
            </div>
            
            <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as User['role']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <input
                    type="text"
                    required
                    value={userForm.organization}
                    onChange={(e) => setUserForm({...userForm, organization: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={userForm.address}
                    onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;