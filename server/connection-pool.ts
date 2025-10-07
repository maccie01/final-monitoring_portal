import { Pool as PgPool, PoolClient, PoolConfig } from "pg";

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalQueries: number;
  totalErrors: number;
  averageQueryTime: number;
  uptime: number;
}

interface HealthStatus {
  healthy: boolean;
  activeConnections: number;
  lastCheck: Date;
  errorRate: number;
}

/**
 * Centralized Connection Pool Manager
 * Maintains optimized database connection pool (5-20 connections) for performance
 * Implements connection health monitoring, metrics tracking, and graceful degradation
 *
 * Configuration (via environment variables):
 * - DB_POOL_MIN: Minimum persistent connections (default: 5)
 * - DB_POOL_MAX: Maximum concurrent connections (default: 20)
 * - DB_POOL_IDLE_TIMEOUT: Idle connection timeout in ms (default: 30000)
 * - DB_CONNECTION_TIMEOUT: Connection acquisition timeout in ms (default: 5000)
 */
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private pool: PgPool | null = null;
  private isInitialized: boolean = false;
  private startTime: number = Date.now();

  // Metrics
  private totalQueries: number = 0;
  private totalErrors: number = 0;
  private queryTimes: number[] = [];
  private circuitBreakerFailures: number = 0;
  private circuitBreakerOpen: boolean = false;
  private lastHealthCheck: Date = new Date();

  private constructor() {}

  public static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  /**
   * Initialize connection pool with optimized configuration
   * Reduced from 50 to 5-20 connections for better resource management
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  Connection pool already initialized');
      return;
    }

    try {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      // Optimized pool configuration - read from environment or use defaults
      const minConnections = parseInt(process.env.DB_POOL_MIN || '5', 10);
      const maxConnections = parseInt(process.env.DB_POOL_MAX || '20', 10);
      const idleTimeout = parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10);
      const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10);

      console.log(`🔄 Initializing optimized connection pool (min: ${minConnections}, max: ${maxConnections})...`);

      const poolConfig: PoolConfig = {
        connectionString,
        min: minConnections,              // Minimum persistent connections (reduced from 50)
        max: maxConnections,              // Maximum connections (reduced from 50)
        idleTimeoutMillis: idleTimeout,   // Close idle connections after 30s (was: never)
        connectionTimeoutMillis: connectionTimeout, // 5 second connection timeout
        keepAlive: true,                  // Enable TCP keepalive
        keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
      };

      // SSL Configuration - only if URL indicates SSL should be used
      // The sslmode in DATABASE_URL will control SSL behavior
      // If database server supports SSL and sslmode=prefer/require, connection will use SSL
      if (connectionString.includes('sslmode=require') || connectionString.includes('sslmode=verify')) {
        poolConfig.ssl = {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          ca: process.env.DB_SSL_CERT, // Optional: Custom CA certificate
        };
        console.log('🔐 SSL enforcement enabled (sslmode=require detected)');
      } else if (connectionString.includes('sslmode=prefer') || connectionString.includes('sslmode=allow')) {
        // Let PostgreSQL driver handle SSL negotiation based on server capabilities
        console.log('🔒 SSL preferred (will use SSL if server supports it)');
      }

      this.pool = new PgPool(poolConfig);

      // Set up event handlers
      this.pool.on('connect', (client) => {
        console.log('✅ New database connection established');
      });

      this.pool.on('acquire', () => {
        // Connection acquired from pool
      });

      this.pool.on('remove', (client) => {
        console.log('🔴 Connection removed from pool');
      });

      this.pool.on('error', (err, client) => {
        console.error('❌ Unexpected pool error:', err);
        this.totalErrors++;
        this.circuitBreakerFailures++;

        // Open circuit breaker after 5 consecutive failures
        if (this.circuitBreakerFailures >= 5) {
          this.circuitBreakerOpen = true;
          console.error('🚨 Circuit breaker OPEN - too many connection failures');

          // Auto-reset circuit breaker after 30 seconds
          setTimeout(() => {
            this.circuitBreakerOpen = false;
            this.circuitBreakerFailures = 0;
            console.log('🔄 Circuit breaker RESET');
          }, 30000);
        }
      });

      // Pre-warm minimum connections
      await this.prewarmConnections(minConnections);

      this.isInitialized = true;
      console.log(`✅ Connection pool initialized successfully (${minConnections}-${maxConnections} connections)`);

      // Start health check interval
      this.startHealthCheckInterval();

    } catch (error) {
      console.error('❌ Failed to initialize connection pool:', error);
      throw error;
    }
  }

  /**
   * Pre-warm minimum connections by establishing them upfront
   * @param count Number of connections to pre-warm (default: pool minimum)
   */
  private async prewarmConnections(count?: number): Promise<void> {
    const warmCount = count || 5;
    console.log(`🔥 Pre-warming ${warmCount} connections...`);

    const connections: PoolClient[] = [];
    try {
      // Acquire minimum connections to force creation
      for (let i = 0; i < warmCount; i++) {
        const client = await this.pool!.connect();
        connections.push(client);

        // Validate connection with simple query
        await client.query('SELECT 1');
      }

      console.log(`✅ Pre-warmed ${connections.length} connections successfully`);
    } finally {
      // Release all connections back to pool
      connections.forEach(client => client.release());
    }
  }

  /**
   * Start periodic health check
   */
  private startHealthCheckInterval(): void {
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get the pool instance
   */
  public getPool(): PgPool {
    if (!this.pool || !this.isInitialized) {
      throw new Error('Connection pool not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Acquire a connection from the pool with timeout
   */
  public async acquireConnection(): Promise<PoolClient> {
    if (this.circuitBreakerOpen) {
      throw new Error('Circuit breaker is OPEN - connections unavailable');
    }

    if (!this.pool || !this.isInitialized) {
      throw new Error('Connection pool not initialized');
    }

    try {
      const startTime = Date.now();
      const client = await this.pool.connect();
      const acquireTime = Date.now() - startTime;

      if (acquireTime > 100) {
        console.warn(`⚠️  Slow connection acquisition: ${acquireTime}ms`);
      }

      return client;
    } catch (error) {
      this.totalErrors++;
      this.circuitBreakerFailures++;
      console.error('❌ Failed to acquire connection:', error);
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  public releaseConnection(client: PoolClient): void {
    try {
      client.release();
    } catch (error) {
      console.error('❌ Error releasing connection:', error);
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T> {
    const startTime = Date.now();
    const client = await this.acquireConnection();

    try {
      const result = await client.query(text, params);
      this.totalQueries++;

      // Track query time for metrics
      const queryTime = Date.now() - startTime;
      this.queryTimes.push(queryTime);

      // Keep only last 1000 query times for average calculation
      if (this.queryTimes.length > 1000) {
        this.queryTimes.shift();
      }

      // Reset circuit breaker on successful query
      this.circuitBreakerFailures = 0;

      return result.rows as T;
    } catch (error) {
      this.totalErrors++;
      console.error('❌ Query execution error:', error);
      throw error;
    } finally {
      this.releaseConnection(client);
    }
  }

  /**
   * Get connection pool statistics
   */
  public getStats(): PoolStats {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const averageQueryTime = this.queryTimes.length > 0
      ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
      : 0;

    return {
      totalConnections: this.pool.totalCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      idleConnections: this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      totalQueries: this.totalQueries,
      totalErrors: this.totalErrors,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Perform health check on connection pool
   */
  public async healthCheck(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      await this.query('SELECT 1');
      const checkTime = Date.now() - startTime;

      this.lastHealthCheck = new Date();

      const stats = this.getStats();
      const errorRate = stats.totalQueries > 0
        ? (stats.totalErrors / stats.totalQueries) * 100
        : 0;

      // Dynamic active connection threshold based on max pool size
      const maxActiveThreshold = Math.floor(
        (this.pool?.options?.max || 20) * 0.9
      ); // 90% of max capacity

      const healthy =
        !this.circuitBreakerOpen &&
        stats.activeConnections <= maxActiveThreshold && // Leave 10% headroom
        errorRate < 5 && // Less than 5% error rate
        checkTime < 100; // Health check under 100ms

      if (!healthy) {
        console.warn('⚠️  Pool health check: UNHEALTHY', {
          circuitBreaker: this.circuitBreakerOpen ? 'OPEN' : 'CLOSED',
          activeConnections: stats.activeConnections,
          errorRate: `${errorRate.toFixed(2)}%`,
          checkTime: `${checkTime}ms`
        });
      }

      return {
        healthy,
        activeConnections: stats.activeConnections,
        lastCheck: this.lastHealthCheck,
        errorRate: Math.round(errorRate * 100) / 100,
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        healthy: false,
        activeConnections: 0,
        lastCheck: this.lastHealthCheck,
        errorRate: 100,
      };
    }
  }

  /**
   * Get Prometheus-style metrics
   */
  public getPrometheusMetrics(): string {
    const stats = this.getStats();
    const health = {
      healthy: !this.circuitBreakerOpen,
      activeConnections: stats.activeConnections,
      lastCheck: this.lastHealthCheck,
      errorRate: stats.totalQueries > 0 ? (stats.totalErrors / stats.totalQueries) * 100 : 0,
    };

    return `
# HELP db_pool_total_connections Total number of connections in the pool
# TYPE db_pool_total_connections gauge
db_pool_total_connections ${stats.totalConnections}

# HELP db_pool_active_connections Number of active connections
# TYPE db_pool_active_connections gauge
db_pool_active_connections ${stats.activeConnections}

# HELP db_pool_idle_connections Number of idle connections
# TYPE db_pool_idle_connections gauge
db_pool_idle_connections ${stats.idleConnections}

# HELP db_pool_waiting_requests Number of waiting requests
# TYPE db_pool_waiting_requests gauge
db_pool_waiting_requests ${stats.waitingRequests}

# HELP db_pool_total_queries Total number of queries executed
# TYPE db_pool_total_queries counter
db_pool_total_queries ${stats.totalQueries}

# HELP db_pool_total_errors Total number of query errors
# TYPE db_pool_total_errors counter
db_pool_total_errors ${stats.totalErrors}

# HELP db_pool_average_query_time Average query execution time in milliseconds
# TYPE db_pool_average_query_time gauge
db_pool_average_query_time ${stats.averageQueryTime}

# HELP db_pool_uptime Pool uptime in seconds
# TYPE db_pool_uptime counter
db_pool_uptime ${stats.uptime}

# HELP db_pool_health Pool health status (1=healthy, 0=unhealthy)
# TYPE db_pool_health gauge
db_pool_health ${health.healthy ? 1 : 0}

# HELP db_pool_error_rate Error rate percentage
# TYPE db_pool_error_rate gauge
db_pool_error_rate ${health.errorRate}
`.trim();
  }

  /**
   * Gracefully shutdown the connection pool
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down connection pool...');

    if (this.pool) {
      try {
        // Wait for active queries to complete (max 30 seconds)
        const startTime = Date.now();
        while (this.pool.waitingCount > 0 && Date.now() - startTime < 30000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        await this.pool.end();
        console.log('✅ Connection pool shut down gracefully');
      } catch (error) {
        console.error('❌ Error shutting down connection pool:', error);
      }
    }

    this.isInitialized = false;
    this.pool = null;
  }
}

// Export singleton instance getter
export const getConnectionPool = () => ConnectionPoolManager.getInstance();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📋 SIGTERM received, shutting down connection pool');
  await ConnectionPoolManager.getInstance().shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📋 SIGINT received, shutting down connection pool');
  await ConnectionPoolManager.getInstance().shutdown();
  process.exit(0);
});
