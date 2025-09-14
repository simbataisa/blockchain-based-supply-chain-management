# Blockchain Supply Chain Management System - Technical Architecture Document

## 1. System Overview

The Blockchain Supply Chain Management System is a comprehensive platform that leverages blockchain technology to provide transparency, traceability, and trust in supply chain operations. The system integrates IoT sensors, smart contracts, and real-time tracking to create an immutable record of product journey from manufacture to end consumer.

### Key Features:
- **Product Lifecycle Tracking**: Complete visibility from raw materials to finished products
- **Smart Contract Automation**: Automated compliance checks and payments
- **IoT Integration**: Real-time sensor data collection and monitoring
- **Multi-stakeholder Platform**: Support for manufacturers, distributors, retailers, and consumers
- **Blockchain Immutability**: Tamper-proof records and audit trails
- **Quality Assurance**: Automated quality checks and certifications

### Architecture Updates (Latest):
- **API-First Architecture**: Frontend completely decoupled from database operations
- **RESTful API Layer**: All data operations go through standardized API endpoints
- **Enhanced Security**: No direct database access from frontend components
- **Improved Scalability**: Clean separation of concerns between frontend and backend

## 2. Technology Stack

* **Frontend**: React@18 + TypeScript + Vite + TailwindCSS@3 + Web3.js + Ethers.js

* **Backend**: Node.js@20 + Express@4 + TypeScript + Socket.io + Bull Queue

* **Blockchain**: Ethereum/Polygon + Solidity@0.8.19 + Hardhat + OpenZeppelin

* **Database**: Supabase (PostgreSQL) + Redis@7 + InfluxDB (time series)

* **Storage**: IPFS + Supabase Storage

* **Authentication**: Supabase Auth + MetaMask + WalletConnect

* **Real-time**: WebSocket + Server-Sent Events + Redis Pub/Sub

* **Monitoring**: Grafana + Prometheus + Sentry

## 3. Architecture Design

```mermaid
graph TD
    A[User Browser] --> B[React Frontend Application]
    B --> C[Web3 Provider]
    C --> D[Smart Contract Layer]
    B --> E[Backend API Gateway]
    E --> F[Authentication Service]
    E --> G[Real-time Service]
    E --> H[Analytics Service]
    E --> I[Notification Service]
    
    D --> J[Ethereum/Polygon Network]
    E --> K[Supabase Database]
    G --> L[Redis Cache]
    G --> M[WebSocket Server]
    H --> N[Time Series Database]
    I --> O[Message Queue]
    
    P[IoT Devices] --> Q[IoT Gateway]
    Q --> G
    
    R[External APIs] --> E
    S[IPFS Network] --> D
    
    subgraph "Frontend Layer"
        B
        C
    end
    
    subgraph "Smart Contract Layer"
        D
        J
        S
    end
    
    subgraph "Backend Services"
        E
        F
        G
        H
        I
    end
    
    subgraph "Data Layer"
        K
        L
        N
        O
    end
    
    subgraph "External Integrations"
        P
        Q
        R
    end
```

## 4. Route Definitions

| Route         | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| /             | Landing page with system overview and login options              |
| /dashboard    | Main dashboard with analytics and quick actions                  |
| /login        | Authentication page with wallet connection and traditional login |
| /register     | User registration with role selection and KYC verification       |
| /products     | Product management interface with creation and tracking          |
| /products/:id | Individual product details with complete history                 |
| /inventory    | Inventory management dashboard with stock monitoring             |
| /tracking     | Real-time tracking interface with maps and IoT data              |
| /contracts    | Smart contract management and deployment interface               |
| /transactions | Transaction verification and approval workflows                  |
| /analytics    | Advanced analytics and reporting dashboard                       |
| /compliance   | Compliance monitoring and audit trail interface                  |
| /users        | User management and access control administration                |
| /settings     | System configuration and security settings                       |
| /api-docs     | API documentation and testing interface                          |

## 5. API Definitions

### 5.1 Core API

**Authentication APIs**

```
POST /api/auth/login
```

Request:

| Param Name    | Param Type | isRequired | Description                            |
| ------------- | ---------- | ---------- | -------------------------------------- |
| email         | string     | false      | Email for traditional login            |
| walletAddress | string     | false      | Wallet address for Web3 login          |
| signature     | string     | false      | Signed message for wallet verification |
| password      | string     | false      | Password for traditional login         |

Response:

| Param Name   | Param Type | Description                       |
| ------------ | ---------- | --------------------------------- |
| success      | boolean    | Authentication status             |
| token        | string     | JWT access token                  |
| refreshToken | string     | Refresh token for session renewal |
| user         | object     | User profile information          |

**Product Management APIs**

```
POST /api/database/products
```

Request:

| Param Name          | Param Type | isRequired | Description                     |
| ------------------- | ---------- | ---------- | ------------------------------- |
| name                | string     | true       | Product name                    |
| description         | string     | false      | Product description             |
| category            | string     | true       | Product category                |
| sku                 | string     | true       | Stock keeping unit              |
| batch_number        | string     | false      | Manufacturing batch identifier  |
| manufacturer_id     | string     | false      | Manufacturer user ID            |
| current_owner_id    | string     | true       | Current owner user ID           |
| origin_location     | string     | false      | Origin location                 |
| current_location    | string     | false      | Current location                |
| price               | number     | false      | Product price                   |
| quantity            | number     | false      | Product quantity                |
| weight              | number     | false      | Product weight                  |
| dimensions          | object     | false      | Product dimensions              |
| expiry_date         | string     | false      | Product expiry date             |
| certifications      | array      | false      | Quality certification documents |
| metadata            | object     | false      | Additional product metadata     |

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | object     | Created product data           |

```
GET /api/database/products
```

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | array      | List of products               |
| count      | number     | Total number of products       |

```
GET /api/database/products/:id
```

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | object     | Product details                |

```
PUT /api/database/products/:id
```

Request: Same as POST request parameters

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | object     | Updated product data           |

```
DELETE /api/database/products/:id
```

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| message    | string     | Deletion confirmation message  |

**Smart Contract APIs**

```
POST /api/database/smart-contracts
```

Request:

| Param Name       | Param Type | isRequired | Description                     |
| ---------------- | ---------- | ---------- | ------------------------------- |
| name             | string     | true       | Smart contract name             |
| description      | string     | false      | Contract description            |
| contract_address | string     | true       | Deployed contract address       |
| abi              | array      | true       | Contract ABI                    |
| bytecode         | string     | true       | Contract bytecode               |
| deployed_by      | string     | true       | Deployer user ID                |
| network_id       | number     | true       | Blockchain network ID           |

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | object     | Created smart contract record  |

```
GET /api/database/smart-contracts
```

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | array      | List of smart contracts        |

```
GET /api/database/smart-contracts/:id
```

Response:

| Param Name | Param Type | Description                    |
| ---------- | ---------- | ------------------------------ |
| success    | boolean    | Operation status               |
| data       | object     | Smart contract details         |

**Real-time Tracking APIs**

```
POST /api/database/tracking-records
```

Request:

| Param Name | Param Type | isRequired | Description                        |
| ---------- | ---------- | ---------- | ---------------------------------- |
| product_id | string     | true       | Product identifier                 |
| location   | string     | true       | Location description               |
| event_type | string     | true       | Event type (created/transferred/etc) |
| actor_id   | string     | true       | User performing the action         |
| sensor_data| object     | false      | IoT sensor readings                |
| notes      | string     | false      | Additional notes                   |

Response:

| Param Name   | Param Type | Description                 |
| ------------ | ---------- | --------------------------- |
| success      | boolean    | Update status               |
| data         | object     | Created tracking record     |

**Quality Records APIs**

```
POST /api/database/quality-records
```

Request:

| Param Name        | Param Type | isRequired | Description                    |
| ----------------- | ---------- | ---------- | ------------------------------ |
| product_id        | string     | true       | Product identifier             |
| inspector_id      | string     | true       | Inspector user ID              |
| quality_score     | number     | true       | Quality assessment score       |
| test_results      | object     | false      | Detailed test results          |
| compliance_status | string     | true       | Compliance status              |
| notes            | string     | false      | Additional notes               |

Response:

| Param Name | Param Type | Description               |
| ---------- | ---------- | ------------------------- |
| success    | boolean    | Operation status          |
| data       | object     | Created quality record    |

## 6. Server Architecture Diagram

```mermaid
graph TD
    A[API Gateway] --> B[Authentication Middleware]
    B --> C[Rate Limiting]
    C --> D[Request Validation]
    D --> E[Controller Layer]
    
    E --> F[Product Service]
    E --> G[Blockchain Service]
    E --> H[Tracking Service]
    E --> I[Analytics Service]
    E --> J[Notification Service]
    
    F --> K[Product Repository]
    G --> L[Smart Contract Interface]
    H --> M[IoT Data Repository]
    I --> N[Analytics Repository]
    J --> O[Message Queue]
    
    K --> P[(Supabase Database)]
    L --> Q[Blockchain Network]
    M --> R[(Time Series DB)]
    N --> S[(Analytics DB)]
    O --> T[Redis Queue]
    
    subgraph "API Layer"
        A
        B
        C
        D
    end
    
    subgraph "Business Logic Layer"
        E
        F
        G
        H
        I
        J
    end
    
    subgraph "Data Access Layer"
        K
        L
        M
        N
        O
    end
    
    subgraph "Storage Layer"
        P
        Q
        R
        S
        T
    end
```

## 7. Data Model

### 7.1 Data Model Definition

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : creates
    USERS ||--o{ TRANSACTIONS : initiates
    USERS }|--|| ORGANIZATIONS : belongs_to
    
    PRODUCTS ||--o{ PRODUCT_HISTORY : has
    PRODUCTS ||--o{ QUALITY_RECORDS : has
    PRODUCTS ||--o{ TRACKING_RECORDS : has
    PRODUCTS ||--o{ PRODUCT_TRANSFERS : transferred_via
    
    TRANSACTIONS ||--o{ TRANSACTION_APPROVALS : requires
    TRANSACTIONS }|--|| SMART_CONTRACTS : executed_by
    
    SMART_CONTRACTS ||--o{ CONTRACT_EVENTS : emits
    
    ORGANIZATIONS ||--o{ USERS : employs
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : granted_to
    USERS ||--o{ USER_PERMISSIONS : has_direct
    PERMISSIONS ||--o{ USER_PERMISSIONS : granted_directly
    PERMISSIONS ||--o{ PERMISSION_AUDIT_LOG : logs
    
    USERS {
        uuid id PK
        string email
        string wallet_address
        string name
        string phone
        uuid organization_id FK
        uuid role_id FK
        jsonb profile_data
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    ORGANIZATIONS {
        uuid id PK
        string name
        string type
        string registration_number
        jsonb address
        jsonb certifications
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        string name
        string description
        string category
        string sku
        uuid current_owner_id FK
        jsonb metadata
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCT_TRANSFERS {
        uuid id PK
        uuid product_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        string transfer_type
        jsonb metadata
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        string action
        string table_name
        uuid record_id
        uuid user_id FK
        jsonb old_values
        jsonb new_values
        timestamp created_at
    }
    
    TRANSACTIONS {
        uuid id PK
        string type
        uuid from_user_id FK
        uuid to_user_id FK
        uuid product_id FK
        jsonb transaction_data
        string blockchain_hash
        string status
        timestamp initiated_at
        timestamp completed_at
    }
    
    SMART_CONTRACTS {
        uuid id PK
        string name
        string contract_address
        string abi
        string bytecode
        uuid deployed_by FK
        jsonb parameters
        string status
        timestamp deployed_at
    }
    
    TRACKING_RECORDS {
        uuid id PK
        uuid product_id FK
        jsonb location
        jsonb sensor_data
        uuid recorded_by FK
        string verification_hash
        timestamp recorded_at
    }
    
    QUALITY_RECORDS {
        uuid id PK
        uuid product_id FK
        uuid inspector_id FK
        string test_type
        jsonb test_results
        string certification_hash
        boolean passed
        timestamp tested_at
    }
    
    ROLES {
        uuid id PK
        string name
        string display_name
        string description
        boolean is_system_role
        timestamp created_at
        timestamp updated_at
    }
    
    PERMISSIONS {
        uuid id PK
        string name
        string display_name
        string description
        permission_type action
        resource_type resource
        boolean is_system_permission
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        uuid assigned_by FK
        timestamp assigned_at
        timestamp expires_at
        boolean is_active
    }
    
    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
        uuid granted_by FK
        timestamp granted_at
        boolean is_active
    }
    
    USER_PERMISSIONS {
        uuid id PK
        uuid user_id FK
        uuid permission_id FK
        uuid granted_by FK
        timestamp granted_at
        timestamp expires_at
        boolean is_active
    }
    
    PERMISSION_AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        uuid permission_id FK
        permission_type action
        resource_type resource
        string resource_id
        boolean granted
        string reason
        jsonb context
        timestamp checked_at
    }
```

### 7.2 Data Definition Language

**Users Table**

```sql
-- Create users table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );
```

**Products Table**

```sql
-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    current_owner_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_owner ON products(current_owner_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);

-- Full text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || category));

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view products in their organization" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1, users u2 
            WHERE u1.id = auth.uid() 
            AND u2.id = products.current_owner_id 
            AND u1.organization_id = u2.organization_id
        )
    );
```

**Smart Contracts Table**

```sql
-- Create smart_contracts table
CREATE TABLE smart_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    abi TEXT NOT NULL,
    bytecode TEXT,
    deployed_by UUID REFERENCES users(id),
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'deployed',
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contracts_address ON smart_contracts(contract_address);
CREATE INDEX idx_contracts_deployer ON smart_contracts(deployed_by);
CREATE INDEX idx_contracts_status ON smart_contracts(status);

-- Row Level Security
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON smart_contracts TO anon;
GRANT ALL PRIVILEGES ON smart_contracts TO authenticated;
```

**Tracking Records Table**

```sql
-- Create tracking_records table
CREATE TABLE tracking_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location JSONB NOT NULL,
    sensor_data JSONB DEFAULT '{}',
    recorded_by UUID REFERENCES users(id),
    verification_hash VARCHAR(100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tracking_product ON tracking_records(product_id);
CREATE INDEX idx_tracking_time ON tracking_records(recorded_at DESC);
CREATE INDEX idx_tracking_recorder ON tracking_records(recorded_by);

-- Spatial index for location queries
CREATE INDEX idx_tracking_location ON tracking_records USING gin(location);

-- Row Level Security
ALTER TABLE tracking_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON tracking_records TO anon;
GRANT ALL PRIVILEGES ON tracking_records TO authenticated;
```

**Product Transfers Table**

```sql
-- Create product_transfers table
CREATE TABLE product_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    transfer_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_product_transfers_product ON product_transfers(product_id);
CREATE INDEX idx_product_transfers_from ON product_transfers(from_user_id);
CREATE INDEX idx_product_transfers_to ON product_transfers(to_user_id);
CREATE INDEX idx_product_transfers_status ON product_transfers(status);

-- Row Level Security
ALTER TABLE product_transfers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON product_transfers TO anon;
GRANT ALL PRIVILEGES ON product_transfers TO authenticated;
```

**Quality Records Table**

```sql
-- Create quality_records table
CREATE TABLE quality_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id),
    test_type VARCHAR(100) NOT NULL,
    test_results JSONB DEFAULT '{}',
    certification_hash VARCHAR(100),
    passed BOOLEAN NOT NULL,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quality_records_product ON quality_records(product_id);
CREATE INDEX idx_quality_records_inspector ON quality_records(inspector_id);
CREATE INDEX idx_quality_records_passed ON quality_records(passed);
CREATE INDEX idx_quality_records_tested_at ON quality_records(tested_at DESC);

-- Row Level Security
ALTER TABLE quality_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON quality_records TO anon;
GRANT ALL PRIVILEGES ON quality_records TO authenticated;
```

**Transactions Table**

```sql
-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    transaction_data JSONB DEFAULT '{}',
    blockchain_hash VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_from ON transactions(from_user_id);
CREATE INDEX idx_transactions_to ON transactions(to_user_id);
CREATE INDEX idx_transactions_product ON transactions(product_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_initiated_at ON transactions(initiated_at DESC);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON transactions TO anon;
GRANT ALL PRIVILEGES ON transactions TO authenticated;
```

**Audit Logs Table**

```sql
-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    user_id UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON audit_logs TO anon;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;
```

**Initial Data**

```sql
-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'System Administrator', '["all"]'),
('supplier', 'Product Supplier', '["create_product", "manage_inventory"]'),
('manufacturer', 'Product Manufacturer', '["transform_product", "quality_control"]'),
('distributor', 'Product Distributor', '["transfer_product", "track_shipment"]'),
('retailer', 'Product Retailer', '["sell_product", "customer_service"]'),
('auditor', 'Quality Auditor', '["audit_quality", "verify_compliance"]'),
('consumer', 'End Consumer', '["verify_product", "view_history"]');

-- Insert sample organizations
INSERT INTO organizations (name, type, registration_number, address, is_verified) VALUES
('Global Supply Corp', 'supplier', 'SUP001', '{"street": "123 Supply St", "city": "New York", "country": "USA"}', true),
('TechManufacturing Ltd', 'manufacturer', 'MFG001', '{"street": "456 Factory Ave", "city": "Detroit", "country": "USA"}', true),
('Logistics Express', 'distributor', 'DIS001', '{"street": "789 Warehouse Blvd", "city": "Chicago", "country": "USA"}', true),
('Retail Chain Inc', 'retailer', 'RET001', '{"street": "321 Commerce Dr", "city": "Los Angeles", "country": "USA"}', true);

-- Note: Complete database schema with all 15 tables has been implemented
-- All 3 migrations successfully applied:
-- 0000_perpetual_wolfpack.sql - Base schema with core tables
-- 0001_colossal_proteus.sql - Supply chain tables
-- 0002_public_fat_cobra.sql - RBAC system tables

-- Core Tables: users, organizations, products, product_transfers
-- Supply Chain Tables: tracking_records, smart_contracts, quality_records, transactions, audit_logs
-- RBAC Tables: roles, permissions, user_roles, role_permissions, user_permissions, permission_audit_log

-- Database Enums (6 total):
-- product_category, product_status, user_role, user_status (core enums)
-- permission_type, resource_type (RBAC enums)

-- RBAC System Features:
-- - 7 predefined roles with hierarchical permissions
-- - 34 granular permissions covering all resources and actions
-- - Role-permission mapping with inheritance support
-- - Direct user permissions for exceptions
-- - Permission audit logging for compliance tracking
-- - Middleware integration for API endpoint protection
```

