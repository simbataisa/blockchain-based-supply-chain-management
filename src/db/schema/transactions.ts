import { pgTable, uuid, varchar, text, timestamp, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';
import { users } from './users';

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  fromUserId: uuid('from_user_id').references(() => users.id),
  toUserId: uuid('to_user_id').references(() => users.id),
  fromLocation: varchar('from_location', { length: 255 }),
  toLocation: varchar('to_location', { length: 255 }),
  quantity: integer('quantity'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  blockNumber: integer('block_number'),
  gasUsed: integer('gas_used'),
  gasFee: decimal('gas_fee', { precision: 18, scale: 8 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  product: one(products, {
    fields: [transactions.productId],
    references: [products.id],
  }),
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
  }),
}));

// Types
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;