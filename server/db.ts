import { Pool as PgPool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { ConnectionPoolManager } from "./connection-pool";

// Connection pool manager instance
let poolManager: ConnectionPoolManager | null = null;
let pool: PgPool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Initialize database connection (called from server startup)
export async function initializeDatabase(): Promise<void> {
  if (poolManager) {
    return; // Already initialized
  }

  console.log('🔄 Initializing database connection...');
  poolManager = ConnectionPoolManager.getInstance();
  await poolManager.initialize();
  pool = poolManager.getPool();
  db = drizzle(pool, { schema });
  console.log('✅ Database connection pool ready');
}

// Export database instances (will be null until initializeDatabase is called)
export function getPool(): PgPool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export pool manager instance
export function getPoolManager(): ConnectionPoolManager {
  if (!poolManager) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return poolManager;
}

// Export connection pool manager for advanced usage
export { ConnectionPoolManager };

// Export db directly (will be null until initialized, use with caution or prefer getDb())
export { db, pool };
