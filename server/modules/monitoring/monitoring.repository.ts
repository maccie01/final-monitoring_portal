import { ConnectionPoolManager } from "../../connection-pool";
import { getDb } from "../../db";
import { objects, systemAlerts } from "@shared/schema";
import { eq, and, or, sql, inArray, desc, SQL } from "drizzle-orm";
import type { DashboardKPIs } from "./monitoring.types";

/**
 * Monitoring Repository
 *
 * Data access layer for monitoring operations.
 * Handles direct database queries for dashboard KPIs, critical systems,
 * energy classifications, and system alerts.
 * Uses Portal-DB via ConnectionPoolManager for KPIs, and Drizzle ORM for other operations.
 */

export class MonitoringRepository {
  // ============================================================================
  // DASHBOARD KPIs OPERATIONS
  // ============================================================================

  /**
   * Get dashboard KPIs
   * Uses Portal-DB via ConnectionPoolManager
   * @returns Dashboard KPIs including critical systems, facilities, efficiency, and renewable share
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();

      // Total objects count (replaces facilities)
      const totalFacilitiesResult = await pool.query(
        'SELECT COUNT(*) as count FROM objects WHERE status = \'active\''
      );

      // Active objects (same as total for now)
      const activeFacilitiesResult = await pool.query(
        'SELECT COUNT(*) as count FROM objects WHERE status = \'active\''
      );

      // Count critical systems from systemAlerts table
      const criticalSystemsResult = await pool.query(
        "SELECT COUNT(*) as count FROM system_alerts WHERE status = 'active' AND severity IN ('high', 'critical')"
      );

      // Calculate average efficiency from objects with energy data
      const efficiencyResult = await pool.query(`
        SELECT AVG(
          CASE
            WHEN (energy->>'consumption')::numeric > 0
            THEN LEAST(100, (energy->>'efficiency')::numeric)
            ELSE NULL
          END
        ) as avg_efficiency
        FROM objects
        WHERE status = 'active'
          AND energy IS NOT NULL
          AND energy->>'consumption' IS NOT NULL
      `);

      // Calculate renewable share from energy data
      const renewableResult = await pool.query(`
        SELECT AVG(
          CASE
            WHEN (energy->>'totalConsumption')::numeric > 0
            THEN ((energy->>'renewableShare')::numeric * 100)
            ELSE NULL
          END
        ) as avg_renewable
        FROM objects
        WHERE status = 'active'
          AND energy IS NOT NULL
          AND energy->>'renewableShare' IS NOT NULL
      `);

      return {
        criticalSystems: parseInt(criticalSystemsResult.rows[0]?.count || '0'),
        totalFacilities: parseInt(totalFacilitiesResult.rows[0]?.count || '0'),
        activeFacilities: parseInt(activeFacilitiesResult.rows[0]?.count || '0'),
        averageEfficiency: parseFloat(efficiencyResult.rows[0]?.avg_efficiency || '0'),
        averageRenewableShare: parseFloat(renewableResult.rows[0]?.avg_renewable || '0'),
      };
    } catch (error) {
      console.error('Error fetching KPIs from Portal-DB:', error);
      return {
        criticalSystems: 0,
        totalFacilities: 0,
        activeFacilities: 0,
        averageEfficiency: 0,
        averageRenewableShare: 0,
      };
    }
  }

  // ============================================================================
  // CRITICAL SYSTEMS OPERATIONS
  // ============================================================================

  /**
   * Get critical systems
   * @param mandantIds - Optional array of mandant IDs for filtering
   * @param isAdmin - Whether the user is an admin
   * @returns Array of critical systems
   */
  async getCriticalSystems(mandantIds?: number[], isAdmin?: boolean): Promise<any[]> {
    try {
      // Query objects table for systems with critical status or high energy consumption
      let query = getDb()
        .select({
          id: objects.id,
          objectid: objects.objectid,
          name: objects.name,
          status: objects.status,
          mandantId: objects.mandantId,
          city: objects.city,
          postalCode: objects.postalCode,
          description: objects.description,
          alarm: objects.alarm,
          energy: objects.energy
        })
        .from(objects)
        .where(
          and(
            or(
              eq(objects.status, 'critical'),
              eq(objects.status, 'maintenance'),
              eq(objects.status, 'error')
            ),
            // SECURITY: Mandant-scoped access
            isAdmin
              ? sql`1=1` // Admin sees all
              : mandantIds && mandantIds.length > 0
                ? inArray(objects.mandantId, mandantIds)
                : sql`1=0` // No mandant access = no results
          )
        )
        .limit(50);

      const criticalObjects = await query;

      // Process and format critical systems
      const criticalSystems = criticalObjects.map(obj => ({
        id: obj.id,
        objectId: obj.objectid,
        name: obj.name || `Objekt ${obj.objectid}`,
        status: obj.status,
        mandantId: obj.mandantId,
        location: `${obj.city || ''} ${obj.postalCode || ''}`.trim(),
        lastAlert: obj.alarm ? new Date() : null,
        energyConsumption: obj.energy || {},
        description: obj.description,
        severity: obj.status === 'critical' ? 'high' : 'medium'
      }));

      console.log(`🚨 [CRITICAL-SYSTEMS] Found ${criticalSystems.length} critical systems (mandants: ${mandantIds || 'all'}, admin: ${isAdmin})`);
      return criticalSystems;
    } catch (error: any) {
      console.error('❌ Error fetching critical systems:', error);
      throw new Error(`Failed to fetch critical systems: ${error?.message || 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ENERGY CLASS OPERATIONS
  // ============================================================================

  /**
   * Get systems by energy class
   * @param mandantIds - Optional array of mandant IDs for filtering
   * @param isAdmin - Whether the user is an admin
   * @returns Array of systems classified by energy consumption
   */
  async getSystemsByEnergyClass(mandantIds?: number[], isAdmin?: boolean): Promise<any[]> {
    try {
      // Query objects with energy data and classify by consumption
      let query = getDb()
        .select({
          id: objects.id,
          objectid: objects.objectid,
          name: objects.name,
          energy: objects.energy,
          mandantId: objects.mandantId,
          city: objects.city,
          status: objects.status
        })
        .from(objects)
        .where(
          and(
            eq(objects.status, 'active'),
            // SECURITY: Mandant-scoped access
            isAdmin
              ? sql`1=1` // Admin sees all
              : mandantIds && mandantIds.length > 0
                ? inArray(objects.mandantId, mandantIds)
                : sql`1=0` // No mandant access = no results
          )
        )
        .limit(100);

      const objectsWithEnergy = await query;

      // Classify systems by energy efficiency
      const classifiedSystems = objectsWithEnergy.map(obj => {
        const energy = obj.energy as any || {};
        const consumption = parseFloat(energy.totalConsumption || energy.consumption || '0');

        let energyClass = 'G'; // Default worst class
        if (consumption === 0) energyClass = 'Unknown';
        else if (consumption < 1000) energyClass = 'A';
        else if (consumption < 2000) energyClass = 'B';
        else if (consumption < 3000) energyClass = 'C';
        else if (consumption < 4000) energyClass = 'D';
        else if (consumption < 5000) energyClass = 'E';
        else if (consumption < 7500) energyClass = 'F';

        return {
          id: obj.id,
          objectId: obj.objectid,
          name: obj.name || `Objekt ${obj.objectid}`,
          energyClass,
          consumption,
          mandantId: obj.mandantId,
          location: obj.city || 'Unknown',
          status: obj.status,
          efficiency: consumption > 0 ? Math.max(0, 100 - (consumption / 100)) : 0
        };
      });

      console.log(`⚡ [ENERGY-CLASS] Classified ${classifiedSystems.length} systems by energy class (mandants: ${mandantIds || 'all'}, admin: ${isAdmin})`);
      return classifiedSystems;
    } catch (error: any) {
      console.error('❌ Error classifying systems by energy:', error);
      throw new Error(`Failed to classify systems by energy: ${error?.message || 'Unknown error'}`);
    }
  }

  // ============================================================================
  // SYSTEM ALERTS OPERATIONS
  // ============================================================================

  /**
   * Get system alerts
   * @param systemId - Optional system/object ID to filter by
   * @param unresolved - Optional filter for unresolved alerts
   * @param mandantIds - Optional array of mandant IDs for filtering
   * @param isAdmin - Whether the user is an admin
   * @returns Array of system alerts
   */
  async getSystemAlerts(systemId?: number, unresolved?: boolean, mandantIds?: number[], isAdmin?: boolean): Promise<any[]> {
    try {
      // SECURITY: Build mandant-scoped query with JOIN to objects table
      const conditions: SQL[] = [];

      // SECURITY: Mandant-scoped access - only show alerts for allowed mandants
      if (!isAdmin) {
        if (!mandantIds || mandantIds.length === 0) {
          // No mandant access = no results
          return [];
        }
        conditions.push(inArray(objects.mandantId, mandantIds));
      }

      // Filter by system/object ID if provided
      if (systemId) {
        conditions.push(eq(systemAlerts.objectId, BigInt(systemId)));
      }

      // Filter by resolution status if specified
      if (unresolved === true) {
        conditions.push(eq(systemAlerts.isResolved, false));
      } else if (unresolved === false) {
        conditions.push(eq(systemAlerts.isResolved, true));
      }

      let baseQuery = getDb()
        .select({
          id: systemAlerts.id,
          objectId: systemAlerts.objectId,
          alertType: systemAlerts.alertType,
          message: systemAlerts.message,
          isResolved: systemAlerts.isResolved,
          resolvedBy: systemAlerts.resolvedBy,
          resolvedAt: systemAlerts.resolvedAt,
          createdAt: systemAlerts.createdAt
        })
        .from(systemAlerts)
        .leftJoin(objects, eq(systemAlerts.objectId, objects.objectid))
        .$dynamic();

      // Apply all conditions
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      const alerts = await baseQuery.orderBy(desc(systemAlerts.createdAt)).limit(100);

      console.log(`🚨 [SYSTEM-ALERTS] Found ${alerts.length} system alerts (systemId: ${systemId}, unresolved: ${unresolved}, mandants: ${mandantIds || 'all'}, admin: ${isAdmin})`);
      return alerts;
    } catch (error) {
      console.error('❌ Error fetching system alerts:', error);
      throw new Error(`Failed to fetch system alerts: ${(error as Error).message}`);
    }
  }

  /**
   * Create system alert
   * @param alert - Alert data to create
   * @returns Created system alert
   */
  async createSystemAlert(alert: any): Promise<any> {
    try {
      const alertData = {
        objectId: alert.objectId ? BigInt(alert.objectId) : null,
        alertType: alert.alertType || 'system',
        severity: alert.severity || 'medium',
        message: alert.message || 'System alert',
        status: 'active',
        metadata: alert.metadata || {},
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null
      };

      const [newAlert] = await getDb().insert(systemAlerts).values(alertData).returning();

      console.log(`🚨 [SYSTEM-ALERT] Created new alert:`, newAlert.id);
      return newAlert;
    } catch (error) {
      console.error('❌ Error creating system alert:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   * @param id - Alert ID
   * @param userId - User ID who resolved the alert
   * @returns Resolved system alert
   */
  async resolveAlert(id: number, userId: string): Promise<any> {
    try {
      const [resolvedAlert] = await getDb()
        .update(systemAlerts)
        .set({
          isResolved: true,
          resolvedBy: userId,
          resolvedAt: new Date()
        })
        .where(eq(systemAlerts.id, id))
        .returning();

      if (!resolvedAlert) {
        throw new Error(`Alert with ID ${id} not found`);
      }

      console.log(`✅ [SYSTEM-ALERT] Resolved alert ${id} by user ${userId}`);
      return resolvedAlert;
    } catch (error) {
      console.error('❌ Error resolving system alert:', error);
      throw error;
    }
  }
}

// Singleton instance
export const monitoringRepository = new MonitoringRepository();
