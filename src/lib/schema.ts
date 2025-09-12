import { pgTable, text, integer, real, timestamp, varchar, serial, uuid, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define enums
export const productCategoryEnum = pgTable('product_category', {});
export const productStatusEnum = pgTable('product_status', {});
export const userRoleEnum = pgTable('user_role', {});
export const userStatusEnum = pgTable('user_status', {});

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  description: text('description'),
  address: text('address'),
  contact_email: varchar('contact_email', { length: 255 }),
  contact_phone: varchar('contact_phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  certifications: text('certifications').array(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  organization_id: uuid('organization_id').references(() => organizations.id),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  avatar: text('avatar'),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  batch_number: varchar('batch_number', { length: 100 }).notNull(),
  manufacturer_id: uuid('manufacturer_id').notNull().references(() => organizations.id),
  current_owner_id: uuid('current_owner_id').notNull().references(() => organizations.id),
  status: varchar('status', { length: 20 }).default('created').notNull(),
  origin_location: varchar('origin_location', { length: 255 }).notNull(),
  current_location: varchar('current_location', { length: 255 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1),
  weight: numeric('weight', { precision: 8, scale: 2 }),
  dimensions: varchar('dimensions', { length: 100 }),
  expiry_date: timestamp('expiry_date'),
  certifications: text('certifications').array(),
  metadata: jsonb('metadata'),
  blockchain_tx_hash: varchar('blockchain_tx_hash', { length: 66 }),
  qr_code_data: text('qr_code_data'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Product transfers table
export const productTransfers = pgTable('product_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id),
  from_owner_id: uuid('from_owner_id').references(() => organizations.id),
  to_owner_id: uuid('to_owner_id').notNull().references(() => organizations.id),
  from_location: varchar('from_location', { length: 255 }),
  to_location: varchar('to_location', { length: 255 }).notNull(),
  transfer_type: varchar('transfer_type', { length: 50 }).notNull(),
  notes: text('notes'),
  blockchain_tx_hash: varchar('blockchain_tx_hash', { length: 66 }),
  verified_at: timestamp('verified_at'),
  verified_by: uuid('verified_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Tracking records table
export const trackingRecords = pgTable('tracking_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id),
  location: varchar('location', { length: 255 }).notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  event_type: varchar('event_type', { length: 50 }).notNull(),
  actor_id: uuid('actor_id').notNull().references(() => users.id),
  notes: text('notes'),
  sensor_data: jsonb('sensor_data'),
  blockchain_tx_hash: varchar('blockchain_tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Smart contracts table
export const smartContracts = pgTable('smart_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  contract_address: varchar('contract_address', { length: 42 }).notNull().unique(),
  abi: jsonb('abi').notNull(),
  bytecode: text('bytecode'),
  network: varchar('network', { length: 50 }).notNull().default('localhost'),
  deployed_by: uuid('deployed_by').references(() => users.id),
  deployment_tx_hash: varchar('deployment_tx_hash', { length: 66 }),
  deployment_block_number: integer('deployment_block_number'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Quality records table
export const qualityRecords = pgTable('quality_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id),
  inspector_id: uuid('inspector_id').notNull().references(() => users.id),
  quality_score: numeric('quality_score', { precision: 5, scale: 2 }).notNull(),
  test_results: jsonb('test_results'),
  compliance_status: varchar('compliance_status', { length: 20 }).notNull(),
  notes: text('notes'),
  blockchain_tx_hash: varchar('blockchain_tx_hash', { length: 66 }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  product_id: uuid('product_id').references(() => products.id),
  from_user_id: uuid('from_user_id').references(() => users.id),
  to_user_id: uuid('to_user_id').references(() => users.id),
  from_location: varchar('from_location', { length: 255 }),
  to_location: varchar('to_location', { length: 255 }),
  quantity: integer('quantity'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  blockchain_tx_hash: varchar('blockchain_tx_hash', { length: 66 }),
  block_number: integer('block_number'),
  gas_used: integer('gas_used'),
  gas_fee: numeric('gas_fee', { precision: 18, scale: 8 }),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at')
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource_type: varchar('resource_type', { length: 50 }).notNull(),
  resource_id: varchar('resource_id', { length: 100 }),
  old_values: jsonb('old_values'),
  new_values: jsonb('new_values'),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Export types for TypeScript
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductTransfer = typeof productTransfers.$inferSelect;
export type NewProductTransfer = typeof productTransfers.$inferInsert;

export type TrackingRecord = typeof trackingRecords.$inferSelect;
export type NewTrackingRecord = typeof trackingRecords.$inferInsert;

export type SmartContract = typeof smartContracts.$inferSelect;
export type NewSmartContract = typeof smartContracts.$inferInsert;

export type QualityRecord = typeof qualityRecords.$inferSelect;
export type NewQualityRecord = typeof qualityRecords.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;