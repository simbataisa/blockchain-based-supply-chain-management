import { pgTable, uuid, varchar, text, timestamp, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, organizations } from './users';

// Enums
export const productStatusEnum = pgEnum('product_status', ['created', 'in_transit', 'delivered', 'verified', 'recalled']);
export const productCategoryEnum = pgEnum('product_category', ['Electronics', 'Pharmaceuticals', 'Food & Beverage', 'Automotive', 'Textiles', 'Chemicals']);

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: productCategoryEnum('category').notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  manufacturerId: uuid('manufacturer_id').references(() => organizations.id).notNull(),
  currentOwnerId: uuid('current_owner_id').references(() => organizations.id).notNull(),
  status: productStatusEnum('status').notNull().default('created'),
  originLocation: varchar('origin_location', { length: 255 }).notNull(),
  currentLocation: varchar('current_location', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  dimensions: varchar('dimensions', { length: 100 }),
  expiryDate: timestamp('expiry_date'),
  certifications: text('certifications').array(),
  metadata: jsonb('metadata'),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  qrCodeData: text('qr_code_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product transfers/transactions table
export const productTransfers = pgTable('product_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  fromOwnerId: uuid('from_owner_id').references(() => organizations.id),
  toOwnerId: uuid('to_owner_id').references(() => organizations.id).notNull(),
  fromLocation: varchar('from_location', { length: 255 }),
  toLocation: varchar('to_location', { length: 255 }).notNull(),
  transferType: varchar('transfer_type', { length: 50 }).notNull(), // 'manufacture', 'ship', 'receive', 'sell'
  notes: text('notes'),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  manufacturer: one(organizations, {
    fields: [products.manufacturerId],
    references: [organizations.id],
  }),
  currentOwner: one(organizations, {
    fields: [products.currentOwnerId],
    references: [organizations.id],
  }),
  transfers: many(productTransfers),
}));

export const productTransfersRelations = relations(productTransfers, ({ one }) => ({
  product: one(products, {
    fields: [productTransfers.productId],
    references: [products.id],
  }),
  fromOwner: one(organizations, {
    fields: [productTransfers.fromOwnerId],
    references: [organizations.id],
  }),
  toOwner: one(organizations, {
    fields: [productTransfers.toOwnerId],
    references: [organizations.id],
  }),
  verifier: one(users, {
    fields: [productTransfers.verifiedBy],
    references: [users.id],
  }),
}));

// Types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductTransfer = typeof productTransfers.$inferSelect;
export type NewProductTransfer = typeof productTransfers.$inferInsert;