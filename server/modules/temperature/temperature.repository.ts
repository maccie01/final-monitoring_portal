import { getDb } from "../../db";
import { dailyOutdoorTemperatures, objects } from "@shared/schema";
import { eq, and, gte, lte, desc, inArray, sql } from "drizzle-orm";
import { ConnectionPoolManager } from "../../connection-pool";
import type { DailyOutdoorTemperature, InsertDailyOutdoorTemperature } from "@shared/schema";

/**
 * Temperature Repository
 *
 * Data access layer for temperature operations.
 * Handles direct database queries for daily outdoor temperature data.
 * Uses Portal-DB via ConnectionPoolManager with fallback to Dev-DB where applicable.
 */

export class TemperatureRepository {
  // ============================================================================
  // DAILY OUTDOOR TEMPERATURE OPERATIONS
  // ============================================================================

  /**
   * Get daily outdoor temperatures with optional filtering
   * Uses Portal-DB via ConnectionPoolManager
   * @param postalCode - Optional postal code filter
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @param resolution - Optional resolution filter ('d' daily, 'w' weekly, 'm' monthly)
   * @returns Array of DailyOutdoorTemperature records
   */
  async getDailyOutdoorTemperatures(postalCode?: string, startDate?: Date, endDate?: Date, resolution?: string): Promise<DailyOutdoorTemperature[]> {
    try {
      // Verwende direkte SQL-Abfrage über settingsDb Pool
      const settingsDbPool = await ConnectionPoolManager.getInstance().getPool();

      let query = `
        SELECT id, date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source, created_at, updated_at
        FROM daily_outdoor_temperatures WHERE 1=1
      `;
      const params: any[] = [];

      if (postalCode) {
        query += ` AND postal_code = $${params.length + 1}`;
        params.push(postalCode);
      }
      if (startDate) {
        query += ` AND date >= $${params.length + 1}`;
        params.push(startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query += ` AND date <= $${params.length + 1}`;
        params.push(endDate.toISOString().split('T')[0]);
      }

      // Füge Auflösungsfilter hinzu
      if (resolution === 'm') {
        query += ` AND EXTRACT(day FROM date) = 1`;
        console.log(`📅 Monatliche Auflösung aktiviert - nur 1. Tag jedes Monats`);
      } else if (resolution === 'd') {
        // Keine zusätzlichen Filter für täglich - alle verfügbaren Datenpunkte
        console.log(`📊 Tägliche Auflösung aktiviert - alle verfügbaren Datenpunkte`);
      } else {
        console.log(`📊 Wöchentliche Auflösung aktiviert - alle Datenpunkte`);
      }

      query += ` ORDER BY date DESC`;

      console.log(`🔍 SQL Query Portal-DB: ${query}`);
      console.log(`📋 Parameters: ${JSON.stringify(params)}`);

      const result = await settingsDbPool.query(query, params);

      console.log(`📊 Gefundene Datensätze aus Portal-DB: ${result.rows.length}`);

      console.log(`📊 Portal-DB Abfrage abgeschlossen: ${result.rows.length} Datensätze`);

      if (result.rows.length === 0) {
        console.log(`⚠️ Keine Daten in Portal-DB gefunden für ${postalCode}, ${startDate?.toISOString()?.split('T')[0]} - ${endDate?.toISOString()?.split('T')[0]}`);
      }

      return result.rows.map(row => ({
        id: row.id,
        date: row.date,
        postalCode: row.postal_code,
        city: row.city,
        temperatureMin: row.temperature_min,
        temperatureMax: row.temperature_max,
        temperatureMean: row.temperature_mean,
        humidity: row.humidity,
        pressure: row.pressure,
        windSpeed: row.wind_speed,
        windDirection: row.wind_direction || null,
        precipitation: row.precipitation,
        dataSource: row.data_source,
        dataQuality: row.data_quality || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Temperaturdaten aus Portal-DB:', error);
      throw error; // Weiterleitung des Fehlers ohne Fallback
    }
  }

  /**
   * Get a single daily outdoor temperature record by ID
   * @param id - Temperature record ID
   * @returns DailyOutdoorTemperature record or undefined
   */
  async getDailyOutdoorTemperature(id: number): Promise<DailyOutdoorTemperature | undefined> {
    const [result] = await getDb().select().from(dailyOutdoorTemperatures).where(eq(dailyOutdoorTemperatures.id, id));
    return result;
  }

  /**
   * Create new daily outdoor temperature record
   * @param temperature - Temperature data to insert
   * @returns Created DailyOutdoorTemperature record
   */
  async createDailyOutdoorTemperature(temperature: InsertDailyOutdoorTemperature): Promise<DailyOutdoorTemperature> {
    const [result] = await getDb().insert(dailyOutdoorTemperatures).values(temperature).returning();
    return result;
  }

  /**
   * Update existing daily outdoor temperature record
   * @param id - Temperature record ID
   * @param temperature - Partial temperature data to update
   * @returns Updated DailyOutdoorTemperature record
   */
  async updateDailyOutdoorTemperature(id: number, temperature: Partial<InsertDailyOutdoorTemperature>): Promise<DailyOutdoorTemperature> {
    const [result] = await getDb()
      .update(dailyOutdoorTemperatures)
      .set({...temperature, updatedAt: new Date()})
      .where(eq(dailyOutdoorTemperatures.id, id))
      .returning();
    return result;
  }

  /**
   * Delete daily outdoor temperature record
   * @param id - Temperature record ID
   */
  async deleteDailyOutdoorTemperature(id: number): Promise<void> {
    await getDb().delete(dailyOutdoorTemperatures).where(eq(dailyOutdoorTemperatures.id, id));
  }

  /**
   * Get temperatures by postal code with optional date range
   * Uses Portal-DB via ConnectionPoolManager
   * @param postalCode - Postal code to filter by
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of DailyOutdoorTemperature records
   */
  async getTemperaturesByPostalCode(postalCode: string, startDate?: Date, endDate?: Date): Promise<DailyOutdoorTemperature[]> {
    // Verwende konfigurierte Klimadaten-DB über setting_klimadaten
    const settingsDbPool = await ConnectionPoolManager.getInstance().getPool();

    let query = `
      SELECT id, date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source, created_at, updated_at
      FROM daily_outdoor_temperatures
      WHERE postal_code = $1
    `;
    const params: any[] = [postalCode];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate.toISOString().split('T')[0]);
    }

    query += ` ORDER BY date DESC`;

    const result = await settingsDbPool.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      postalCode: row.postal_code,
      city: row.city,
      temperatureMin: parseFloat(row.temperature_min).toString(),
      temperatureMax: parseFloat(row.temperature_max).toString(),
      temperatureMean: parseFloat(row.temperature_mean).toString(),
      humidity: row.humidity ? parseFloat(row.humidity).toString() : null,
      pressure: row.pressure ? parseFloat(row.pressure).toString() : null,
      windSpeed: row.wind_speed ? parseFloat(row.wind_speed).toString() : null,
      windDirection: row.wind_direction || null,
      precipitation: row.precipitation ? parseFloat(row.precipitation).toString() : null,
      dataSource: row.data_source,
      dataQuality: row.data_quality || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Get latest temperature for a specific postal code
   * Uses Portal-DB via ConnectionPoolManager
   * @param postalCode - Postal code to query
   * @returns Latest DailyOutdoorTemperature record or undefined
   */
  async getLatestTemperatureForPostalCode(postalCode: string): Promise<DailyOutdoorTemperature | undefined> {
    const settingsDbPool = await ConnectionPoolManager.getInstance().getPool();

    const query = `
      SELECT id, date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source, created_at, updated_at
      FROM daily_outdoor_temperatures
      WHERE postal_code = $1
      ORDER BY date DESC
      LIMIT 1
    `;

    const result = await settingsDbPool.query(query, [postalCode]);
    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      id: row.id,
      date: row.date,
      postalCode: row.postal_code,
      city: row.city,
      temperatureMin: parseFloat(row.temperature_min).toString(),
      temperatureMax: parseFloat(row.temperature_max).toString(),
      temperatureMean: parseFloat(row.temperature_mean).toString(),
      humidity: row.humidity ? parseFloat(row.humidity).toString() : null,
      pressure: row.pressure ? parseFloat(row.pressure).toString() : null,
      windSpeed: row.wind_speed ? parseFloat(row.wind_speed).toString() : null,
      windDirection: row.wind_direction || null,
      precipitation: row.precipitation ? parseFloat(row.precipitation).toString() : null,
      dataSource: row.data_source,
      dataQuality: row.data_quality || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get temperatures for postal codes of specified objects
   * @param objectIds - Optional array of object IDs to filter
   * @returns Array of DailyOutdoorTemperature records
   */
  async getTemperaturesForObjectPostalCodes(objectIds?: number[]): Promise<DailyOutdoorTemperature[]> {
    // Hole zuerst die PLZ der Objekte
    const conditions = [];
    if (objectIds && objectIds.length > 0) {
      conditions.push(inArray(objects.id, objectIds));
    }

    const objectsWithPostalCodes = await getDb().select({
      id: objects.id,
      postalCode: objects.postalCode
    }).from(objects).where(conditions.length > 0 ? and(...conditions) : undefined);

    const postalCodes = Array.from(new Set(objectsWithPostalCodes.map(obj => obj.postalCode).filter(Boolean))) as string[];

    if (postalCodes.length === 0) {
      return [];
    }

    // Hole die neuesten Temperaturdaten für diese PLZ
    return await getDb().select().from(dailyOutdoorTemperatures)
      .where(inArray(dailyOutdoorTemperatures.postalCode, postalCodes))
      .orderBy(desc(dailyOutdoorTemperatures.date));
  }

  /**
   * Get temperature efficiency data for an object
   * Combines outdoor temperatures with efficiency calculations
   * @param objectId - Object ID
   * @param timeRange - Time range filter (e.g., 'last30days', '2024', '2023', '365days')
   * @returns Array of temperature efficiency data points
   */
  async getTemperatureEfficiencyData(objectId: number, timeRange: string = 'last30days'): Promise<any[]> {
    try {
      // Get object metadata first
      const objectIdBigInt = BigInt(objectId);
      const [objectData] = await getDb()
        .select({
          postalCode: objects.postalCode,
          objdata: objects.objdata
        })
        .from(objects)
        .where(eq(objects.objectid, objectIdBigInt))
        .limit(1);

      if (!objectData) {
        console.log(`⚠️ [EFFICIENCY] Object ${objectId} not found`);
        return [];
      }

      console.log(`🔍 [EFFICIENCY] Found object ${objectId}:`, {
        postalCode: objectData.postalCode,
        objdata: objectData.objdata
      });

      const postalCode = objectData.postalCode || '30159'; // Fallback PLZ
      const objdataAny = objectData.objdata as any;
      const area = parseFloat(objdataAny?.area || objdataAny?.nutzflaeche || '0');

      // ✅ Hole echte Outdoor-Temperaturdaten aus externer Datenbank
      // Berechne korrekten Datumsbereich basierend auf timeRange
      let startDate: Date;
      let endDate: Date;

      if (timeRange === '2024') {
        startDate = new Date('2024-01-01');
        endDate = new Date('2024-12-31');
      } else if (timeRange === '2023') {
        startDate = new Date('2023-01-01');
        endDate = new Date('2023-12-31');
      } else if (timeRange === '365days') {
        const now = new Date();
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else {
        // Standard: letzte 30 Tage
        const now = new Date();
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
      }

      console.log(`🌡️ [EFFICIENCY] Fetching real outdoor temperatures for postal code: ${postalCode}, timeRange: ${timeRange} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);

      // Versuche zuerst die spezifische PLZ
      let outdoorTemperatures = await this.getDailyOutdoorTemperatures(
        postalCode,
        startDate,
        endDate
      );

      // Fallback auf Hannover (30161) falls keine Daten verfügbar
      if (outdoorTemperatures.length === 0 && postalCode !== '30161') {
        console.log(`⚠️ [EFFICIENCY] No temperature data for ${postalCode}, falling back to Hannover (30161)`);
        outdoorTemperatures = await this.getDailyOutdoorTemperatures(
          '30161',
          startDate,
          endDate
        );
      }

      console.log(`📊 [EFFICIENCY] Found ${outdoorTemperatures.length} outdoor temperature records`);

      const efficiencyData = [];

      // Kombiniere echte Outdoor-Temperaturen mit Effizienzberechnungen
      for (const tempRecord of outdoorTemperatures) {
        const dateKey = tempRecord.date;

        // Nutze echte min/max/mean Temperaturen aus der externen Datenbank (als Strings gespeichert)
        const outsideTemp = parseFloat(tempRecord.temperatureMean || '0');
        const tempMin = parseFloat(tempRecord.temperatureMin || '0');
        const tempMax = parseFloat(tempRecord.temperatureMax || '0');
        const tempMean = parseFloat(tempRecord.temperatureMean || '0');

        // Simuliere Effizienz basierend auf echter Außentemperatur
        // (In einer echten Anwendung würden hier echte Effizienz-Messdaten verwendet)
        const baseEfficiency = Math.min(100, Math.max(30, 90 - Math.abs(outsideTemp - 10) * 2));
        const efficiency = Math.round(baseEfficiency * 10) / 10;

        efficiencyData.push({
          date: dateKey,
          min: Math.round(tempMin * 10) / 10,      // ✅ Echte Min-Temperatur
          mean: Math.round(tempMean * 10) / 10,    // ✅ Echte Durchschnitts-Temperatur
          max: Math.round(tempMax * 10) / 10,      // ✅ Echte Max-Temperatur
          efficiency: efficiency,
          threshold: 70,
          fullDate: tempRecord.date,
          temperatureDifference: Math.round((tempMax - tempMin) * 10) / 10
        });
      }

      console.log(`📊 [EFFICIENCY] Calculated ${efficiencyData.length} efficiency points for object ${objectId}`);
      return efficiencyData.reverse(); // oldest to newest
    } catch (error) {
      console.error('❌ Error calculating temperature efficiency data:', error);
      return [];
    }
  }
}

// Singleton instance
export const temperatureRepository = new TemperatureRepository();
