# Blockchain Supply Chain Management System - Technical Architecture Document

## 1. Architecture Design

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

## 2. Technology Description

* **Frontend**: React\@18 + TypeScript + Vite + TailwindCSS\@3 + Web3.js + Ethers.js

* **Backend**: Node.js\@20 + Express\@4 + TypeScript + Socket.io + Bull Queue

* **Blockchain**: Ethereum/Polygon + Solidity\@0.8.19 + Hardhat + OpenZeppelin

* **Database**: Supabase (PostgreSQL) + Redis\@7 + InfluxDB (time series)

* **Storage**: IPFS + Supabase Storage

* **Authentication**: Supabase Auth + MetaMask + WalletConnect

* **Real-time**: WebSocket + Server-Sent Events + Redis Pub/Sub

* **Monitoring**: Grafana + Prometheus + Sentry

## 3. Route Definitions

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

## 4. API Definitions

### 4.1 Core API

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
POST /api/products
```

Request:

| Param Name          | Param Type | isRequired | Description                     |
| ------------------- | ---------- | ---------- | ------------------------------- |
| name                | string     | true       | Product name                    |
| category            | string     | true       | Product category                |
| batchId             | string     | true       | Manufacturing batch identifier  |
| specifications      | object     | true       | Technical specifications        |
| qualityCertificates | array      | false      | Quality certification documents |
| metadata            | object     | false      | Additional product metadata     |

Response:

| Param Name      | Param Type | Description                    |
| --------------- | ---------- | ------------------------------ |
| success         | boolean    | Operation status               |
| productId       | string     | Generated product identifier   |
| transactionHash | string     | Blockchain transaction hash    |
| ipfsHash        | string     | IPFS hash for metadata storage |

**Smart Contract APIs**

```
POST /api/contracts/deploy
```

Request:

| Param Name   | Param Type | isRequired | Description                        |
| ------------ | ---------- | ---------- | ---------------------------------- |
| contractType | string     | true       | Type of contract to deploy         |
| parameters   | object     | true       | Contract initialization parameters |
| gasLimit     | number     | false      | Gas limit for deployment           |

Response:

| Param Name      | Param Type | Description                 |
| --------------- | ---------- | --------------------------- |
| success         | boolean    | Deployment status           |
| contractAddress | string     | Deployed contract address   |
| transactionHash | string     | Deployment transaction hash |

**Real-time Tracking APIs**

```
POST /api/tracking/update
```

Request:

| Param Name | Param Type | isRequired | Description                        |
| ---------- | ---------- | ---------- | ---------------------------------- |
| productId  | string     | true       | Product identifier                 |
| location   | object     | true       | GPS coordinates and address        |
| sensorData | object     | false      | IoT sensor readings                |
| timestamp  | string     | true       | Update timestamp                   |
| signature  | string     | true       | Digital signature for verification |

Response:

| Param Name   | Param Type | Description                 |
| ------------ | ---------- | --------------------------- |
| success      | boolean    | Update status               |
| trackingId   | string     | Tracking record identifier  |
| blockchainTx | string     | Blockchain transaction hash |

## 5. Server Architecture Diagram

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

## 6. Data Model

### 6.1 Data Model Definition

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : creates
    USERS ||--o{ TRANSACTIONS : initiates
    USERS }|--|| ORGANIZATIONS : belongs_to
    
    PRODUCTS ||--o{ PRODUCT_HISTORY : has
    PRODUCTS ||--o{ QUALITY_RECORDS : has
    PRODUCTS ||--o{ TRACKING_RECORDS : has
    PRODUCTS }|--|| BATCHES : belongs_to
    
    TRANSACTIONS ||--o{ TRANSACTION_APPROVALS : requires
    TRANSACTIONS }|--|| SMART_CONTRACTS : executed_by
    
    SMART_CONTRACTS ||--o{ CONTRACT_EVENTS : emits
    
    ORGANIZATIONS ||--o{ ROLES : defines
    ROLES ||--o{ PERMISSIONS : has
    USERS }|--|| ROLES : assigned
    
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
        string category
        string sku
        uuid batch_id FK
        uuid current_owner_id FK
        jsonb specifications
        jsonb metadata
        string status
        string contract_address
        string ipfs_hash
        timestamp created_at
        timestamp updated_at
    }
    
    BATCHES {
        uuid id PK
        string batch_number
        uuid manufacturer_id FK
        date production_date
        date expiry_date
        jsonb quality_parameters
        integer quantity
        string status
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
```

### 6.2 Data Definition Language

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
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    batch_id UUID REFERENCES batches(id),
    current_owner_id UUID REFERENCES users(id),
    specifications JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'created',
    contract_address VARCHAR(42),
    ipfs_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_batch ON products(batch_id);
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
INSERT INTO organizations (name, type, registration_number, is_verified) VALUES
('Global Supply Corp', 'supplier', 'SUP001', true),
('TechManufacturing Ltd', 'manufacturer', 'MFG001', true),
('Logistics Express', 'distributor', 'DIS001', true),
('Retail Chain Inc', 'retailer', 'RET001', true);
```

