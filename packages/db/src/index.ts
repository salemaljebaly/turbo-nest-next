import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export * from "./schema/index.js";
export {
  sql,
  eq,
  and,
  or,
  desc,
  asc,
  count,
  inArray,
  ne,
  lt,
  lte,
  gt,
  gte,
} from "drizzle-orm";

export type Database = ReturnType<typeof createDb>;
export type DatabaseConnection = ReturnType<typeof createDbConnection>;

export interface CreateDbConnectionOptions {
  connectionString?: string;
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
  prepare?: boolean;
}

/**
 * Create a database connection. Call once at app startup and reuse.
 * Throws immediately if DATABASE_URL is missing, not at module load time.
 */
export function createDbConnection(options: CreateDbConnectionOptions = {}) {
  const url = options.connectionString ?? process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = postgres(url, {
    max: options.max,
    idle_timeout: options.idleTimeout,
    connect_timeout: options.connectTimeout,
    prepare: options.prepare,
  });
  const db = drizzle(client, {
    schema,
    logger: process.env["NODE_ENV"] === "development",
  });

  return {
    db,
    client,
    close: () => client.end({ timeout: 5 }),
  };
}

/**
 * Backwards-compatible helper for callers that only need the Drizzle database.
 * Prefer createDbConnection when the host app can own shutdown lifecycle.
 */
export function createDb(connectionString?: string) {
  return createDbConnection({ connectionString }).db;
}
