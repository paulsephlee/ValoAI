import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { env } from '../env.js';

export async function runMigrations() {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status TEXT NOT NULL DEFAULT 'queued',
      input_type TEXT NOT NULL,
      input_value TEXT NOT NULL,
      result JSONB,
      error TEXT,
      user_id TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rank TEXT`);
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agent TEXT`);

  await client.end();
  console.log('Database migrations complete');
}
