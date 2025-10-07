import { Request, Response } from "express";
import { ConnectionPoolManager } from "../connection-pool";

/**
 * Monitoring Controller
 * Provides endpoints for connection pool and system health monitoring
 */
export class MonitoringController {
  /**
   * Get connection pool statistics
   * API: GET /api/monitoring/pool/stats
   * Auth: Requires admin/superadmin role
   * Returns: Pool statistics including connections, queries, errors, uptime
   */
  async getPoolStats(req: Request, res: Response) {
    try {
      const poolManager = ConnectionPoolManager.getInstance();
      const stats = poolManager.getStats();

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting pool stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pool statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get connection pool health status
   * API: GET /api/monitoring/pool/health
   * Auth: Requires admin/superadmin role
   * Returns: Health status including healthy flag, active connections, error rate
   */
  async getPoolHealth(req: Request, res: Response) {
    try {
      const poolManager = ConnectionPoolManager.getInstance();
      const health = await poolManager.healthCheck();

      const statusCode = health.healthy ? 200 : 503;

      res.status(statusCode).json({
        success: true,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking pool health:', error);
      res.status(500).json({
        success: false,
        healthy: false,
        message: 'Failed to check pool health',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get combined monitoring dashboard data
   * API: GET /api/monitoring/dashboard
   * Auth: Requires admin/superadmin role
   * Returns: Combined stats and health information
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const poolManager = ConnectionPoolManager.getInstance();
      const stats = poolManager.getStats();
      const health = await poolManager.healthCheck();

      res.json({
        success: true,
        dashboard: {
          stats,
          health,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const monitoringController = new MonitoringController();
