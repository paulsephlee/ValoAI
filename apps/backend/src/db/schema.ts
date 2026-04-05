import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import type { AnalysisResult } from '@valoai/shared';

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull().default('queued'),
  inputType: text('input_type').notNull(), // 'upload' | 'url'
  inputValue: text('input_value').notNull(), // file path or URL
  result: jsonb('result').$type<AnalysisResult>(),
  error: text('error'),
  rank: text('rank'),
  agent: text('agent'),
  map: text('map'),
  userId: text('user_id'), // nullable — populated when auth is added
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
