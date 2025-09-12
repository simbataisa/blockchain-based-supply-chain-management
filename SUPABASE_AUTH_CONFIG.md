# Supabase Authentication Configuration Guide

## Overview

This document outlines the complete Supabase authentication configuration for the Blockchain Supply Chain Management System based on the PRD and architecture requirements.

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Supabase Client Configuration

Update `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Enhanced security
  }
});
```

## User Roles and Registration Methods

| Role | Registration Method | Authentication Requirements |
|------|--------------------|--------------------------|
| System Administrator | Admin invitation | Multi-factor authentication |
| Supply Chain Manager | Company registration | Email verification + KYC |
| Supplier | Business registration | KYC verification |
| Manufacturer | Business registration | Compliance certificates |
| Distributor | Logistics company registration | Business verification |
| Retailer | Retail business registration | Business license |
| Quality Auditor | Professional certification | Certification verification |
| Consumer | Email/mobile registration | Email verification |

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    wallet_address VARCHAR(42) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization_id UUID REFERENCES organizations(id),
    role_id UUID REFERENCES roles(id),
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Organizations Table

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100),
    address JSONB,
    certifications JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Roles Table

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- Organization members can view each other
CREATE POLICY "Organization members can view each other" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = users.organization_id
        )
    );
```

## Authentication Methods

### 1. Traditional Email/Password

```typescript
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};
```

### 2. Web3 Wallet Authentication

```typescript
const loginWithWallet = async (walletAddress: string, signature: string) => {
  // Verify signature
  const message = `Login to Supply Chain Pro: ${Date.now()}`;
  const isValidSignature = await verifySignature(message, signature, walletAddress);
  
  if (!isValidSignature) {
    throw new Error('Invalid signature');
  }
  
  // Check if user exists
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
    
  if (!user) {
    // Create new user
    const { data, error } = await supabase.auth.signUp({
      email: `${walletAddress}@wallet.local`,
      password: generateRandomPassword(),
      options: {
        data: {
          wallet_address: walletAddress,
          auth_method: 'wallet'
        }
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  // Sign in existing user
  return await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.wallet_address // Use wallet as password for wallet users
  });
};
```

### 3. Multi-Factor Authentication

```typescript
const enableMFA = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (error) throw error;
  return data;
};

const verifyMFA = async (factorId: string, challengeId: string, code: string) => {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code
  });
  
  if (error) throw error;
  return data;
};
```

## Enhanced AuthContext

```typescript
interface AuthUser {
  id: string;
  email: string;
  walletAddress?: string;
  name: string;
  role: 'admin' | 'supplier' | 'manufacturer' | 'distributor' | 'retailer' | 'auditor' | 'consumer';
  organization_id?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    is_verified: boolean;
  };
  phone?: string;
  is_verified: boolean;
  profile_data: any;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithWallet: (walletAddress: string, signature: string) => Promise<{ error?: string }>;
  register: (userData: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error?: string }>;
  hasPermission: (permission: string) => boolean;
  enableMFA: () => Promise<{ error?: string; qrCode?: string }>;
  verifyMFA: (code: string) => Promise<{ error?: string }>;
}
```

## Security Best Practices

### 1. Password Policies

- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and special characters
- Password history (prevent reuse of last 5 passwords)
- Account lockout after 5 failed attempts

### 2. Session Management

- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Automatic session refresh
- Secure cookie storage

### 3. Audit Logging

```sql
CREATE TABLE auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Rate Limiting

- Login attempts: 5 per minute per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email

## Integration with Web3

### Wallet Connection

```typescript
const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const walletAddress = accounts[0];
      const message = `Login to Supply Chain Pro: ${Date.now()}`;
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      
      return await loginWithWallet(walletAddress, signature);
    } catch (error) {
      throw new Error('Failed to connect wallet');
    }
  } else {
    throw new Error('MetaMask not installed');
  }
};
```

## Compliance Features

### 1. KYC Verification

- Document upload and verification
- Identity verification through third-party services
- Business license verification for commercial users

### 2. GDPR Compliance

- Data export functionality
- Right to be forgotten (account deletion)
- Consent management
- Data processing logs

### 3. Regulatory Reporting

- User activity reports
- Authentication logs
- Compliance status tracking
- Audit trail maintenance

## Testing

### Unit Tests

```typescript
describe('AuthContext', () => {
  test('should login with valid credentials', async () => {
    // Test implementation
  });
  
  test('should handle wallet authentication', async () => {
    // Test implementation
  });
  
  test('should enforce role-based permissions', async () => {
    // Test implementation
  });
});
```

### Integration Tests

- End-to-end authentication flows
- Role-based access control
- Multi-factor authentication
- Wallet integration

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Authentication flows tested
- [ ] MFA configured for admin users
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] SSL certificates installed
- [ ] Backup and recovery procedures tested

## Monitoring and Maintenance

### Metrics to Track

- Authentication success/failure rates
- Session duration and activity
- MFA adoption rates
- Security incidents
- Performance metrics

### Regular Maintenance

- Review and rotate API keys
- Update security policies
- Monitor for suspicious activity
- Update dependencies
- Backup user data

## Support and Troubleshooting

### Common Issues

1. **Login failures**: Check credentials, account status, and rate limiting
2. **Wallet connection issues**: Verify MetaMask installation and network
3. **Permission errors**: Review role assignments and RLS policies
4. **Session timeouts**: Check token expiration and refresh logic

### Contact Information

- Technical Support: support@supplychainpro.com
- Security Issues: security@supplychainpro.com
- Documentation: docs.supplychainpro.com