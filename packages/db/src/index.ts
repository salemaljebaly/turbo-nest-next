import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

export * from './schema/index.js';
export { sql, eq, and, or, desc, asc, count, inArray, ne, lt, lte, gt, gte } from 'drizzle-orm';

export type Database = ReturnType<typeof createDb>;

/**
 * Create a database connection. Call once at app startup and reuse.
 * Throws immediately if DATABASE_URL is missing, not at module load time.
 */
export function createDb(connectionString?: string) {
  const url = connectionString ?? process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const client = postgres(url);
  return drizzle(client, { schema, logger: process.env['NODE_ENV'] === 'development' });
}
