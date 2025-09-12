-- Create user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manufacturer', 'distributor', 'retailer', 'consumer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_status enum
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  wallet_address VARCHAR(42),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'consumer',
  status user_status NOT NULL DEFAULT 'active',
  organization_id UUID REFERENCES organizations(id),
  wallet_address VARCHAR(42),
  profile_image TEXT,
  phone_number VARCHAR(50),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY IF NOT EXISTS "Organizations are viewable by everyone" ON organizations
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Organizations are insertable by service role" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Organizations are updatable by service role" ON organizations
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create policies for users
CREATE POLICY IF NOT EXISTS "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY IF NOT EXISTS "Users are insertable by service role" ON users
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);