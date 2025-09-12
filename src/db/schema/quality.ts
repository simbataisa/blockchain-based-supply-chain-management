import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';
import { users } from './users';

// Quality records table
export const qualityRecords = pgTable('quality_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  inspectorId: uuid('inspector_id').references(() => users.id).notNull(),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).notNull(),
  testResults: jsonb('test_results'),
  complianceStatus: varchar('compliance_status', { length: 20 }).notNull(),
  notes: text('notes'),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const qualityRecordsRelations = relations(qualityRecords, ({ one }) => ({
  product: one(products, {
    fields: [qualityRecords.productId],
    references: [products.id],
  }),
  inspector: one(users, {
    fields: [qualityRecords.inspectorId],
    references: [users.id],
  }),
}));

// Types
export type QualityRecord = typeof qualityRecords.$inferSelect;
export type NewQualityRecord = typeof qualityRecords.$inferInsert;