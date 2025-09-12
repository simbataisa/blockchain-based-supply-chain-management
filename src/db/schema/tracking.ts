import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';
import { users } from './users';

// Tracking records table
export const trackingRecords = pgTable('tracking_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  notes: text('notes'),
  sensorData: jsonb('sensor_data'),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const trackingRecordsRelations = relations(trackingRecords, ({ one }) => ({
  product: one(products, {
    fields: [trackingRecords.productId],
    references: [products.id],
  }),
  actor: one(users, {
    fields: [trackingRecords.actorId],
    references: [users.id],
  }),
}));

// Types
export type TrackingRecord = typeof trackingRecords.$inferSelect;
export type NewTrackingRecord = typeof trackingRecords.$inferInsert;