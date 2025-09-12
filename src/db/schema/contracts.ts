import { pgTable, uuid, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Smart contracts table
export const smartContracts = pgTable('smart_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  contractAddress: varchar('contract_address', { length: 42 }).notNull().unique(),
  abi: jsonb('abi').notNull(),
  bytecode: text('bytecode'),
  network: varchar('network', { length: 50 }).notNull().default('localhost'),
  deployedBy: uuid('deployed_by').references(() => users.id),
  deploymentTxHash: varchar('deployment_tx_hash', { length: 66 }),
  deploymentBlockNumber: integer('deployment_block_number'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const smartContractsRelations = relations(smartContracts, ({ one }) => ({
  deployer: one(users, {
    fields: [smartContracts.deployedBy],
    references: [users.id],
  }),
}));

// Types
export type SmartContract = typeof smartContracts.$inferSelect;
export type NewSmartContract = typeof smartContracts.$inferInsert;