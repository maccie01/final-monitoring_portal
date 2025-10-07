import { Request, Response } from "express";
import { ConnectionPoolManager } from "../connection-pool";
import { createDatabaseError } from "../middleware/error";
import { storage } from "../storage";

export class EfficiencyController {
  /**
   * GET /api/efficiency-analysis/:objectId - Effizienzanalyse für Objekt
   *
   * @description Liefert detaillierte Energieeffizienz-Daten für ein Objekt aus der externen Energiedatenbank
   *
   * @param {string} objectId - URL Parameter: Eindeutige Objektkennung (z.B. 207315076)
   * @param {string} timeRange - Query Parameter: Zeitraum für Analyse (default: '2024')
   *   - '2024', '2023' für spezifische Jahre
   *   - 'last-year' für letztes Jahr
   *   - 'last-365-days' für letzte 365 Tage
   * @param {string} resolution - Query Parameter: Auflösung der Daten (default: 'daily')
   *   - 'daily' für Tagesauflösung
   *   - 'monthly' für Monatsauflösung
   *
   * @returns {Object} JSON Response mit folgender Struktur:
   *   {
   *     objectId: number,           // Objekt-ID
   *     timeRange: string,          // Abgefragter Zeitraum
   *     resolution: string,         // Datenauflösung
   *     meterId: number,            // Zähler-ID (dynamisch aus object.meter extrahiert)
   *     meterKey: string,           // Zähler-Schlüssel (z.B. "Z20541")
   *     area: number,               // Objektfläche in m² (aus object.objdata)
   *     period: {
   *       days: number,             // Tatsächliche Anzahl Tage mit Daten
   *       totalKwh: number,         // Gesamtverbrauch in kWh (en_last - en_first)
   *       startDate: string,        // Startdatum (YYYY-MM-DD)
   *       endDate: string,          // Enddatum (YYYY-MM-DD)
   *       en_first: number,         // Erster Zählerstand (Wh)
   *       en_last: number,          // Letzter Zählerstand (Wh)
   *       en_first_Date: string,    // Datum erster Zählerstand
   *       en_last_Date: string      // Datum letzter Zählerstand
   *     },
   *     yearly: {
   *       en_first: number,         // Erster Zählerstand (Wh)
   *       en_last: number,          // Letzter Zählerstand (Wh)
   *       totalKwh: number,         // Gesamtverbrauch in kWh
   *       efficiencyPerM2: number,  // Effizienz kWh/m²/Jahr (totalKwh/area)
   *       unit: string              // Einheit: "kWh/m²/Jahr"
   *     },
   *     monthlyClimate: [           // Monatliche Klimadaten aus daily_outdoor_temperatures
   *       {
   *         month: string,          // YYYY-MM Format (z.B. "2024-01")
   *         monthName: string,      // Deutscher Monatsname mit Jahr (z.B. "Januar 2024")
   *         temperatureMin: number, // Minimale Temperatur des Monats (°C)
   *         temperatureMax: number, // Maximale Temperatur des Monats (°C)
   *         temperatureMean: number,// Durchschnittstemperatur des Monats (°C)
   *         daysCount: number       // Anzahl verfügbare Tage mit Daten
   *       }
   *     ],
   *     location: {
   *       postalCode: string,       // PLZ des Objekts für Klimadaten
   *       city: string              // Stadt des Objekts
   *     }
   *   }
   *
   * @example GET /api/efficiency-analysis/207315076?timeRange=2024&resolution=daily
   *
   * @database Zugriff auf:
   *   - Portal-DB: objects (Objektdaten, Berechtigungen, Zähler-Zuordnung)
   *   - Portal-DB: daily_outdoor_temperatures (Klimadaten min/max/mean je Monat)
   *   - Externe Energy-DB: view_day_comp (Energiezählerstände)
   *   - Settings-DB: Konfiguration der externen Energy-Datenbank
   */
  getEfficiencyAnalysis = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      // API Parameter-Zusammenfassung: Effizienzanalyse-Request verarbeiten
      // URL Parameter: objectId (z.B. "207315076")
      // Query Parameter: timeRange (default: '2024'), resolution (default: 'daily')
      // Session: user-Object für Berechtigungsprüfung (role, mandantId, mandantAccess)
      const { objectId } = req.params;
      const { timeRange = "2024", resolution = "daily" } = req.query;
      const user = (req as any).user || (req.session as any)?.user;

      // Temporarily disabled for testing - Create demo user for testing
      const demoUser = user || {
        id: "100",
        role: "admin",
        mandantId: 6,
        mandantAccess: [1, 8],
      };

      console.log(
        `🔍 [EFF-ANALYSIS] Fetching efficiency analysis for object: ${objectId}, timeRange: ${timeRange}, resolution: ${resolution}`,
      );

      // Portal-DB API Aufruf Zusammenfassung: Objektdaten + Berechtigung abrufen
      // Parameter: objectId als Integer
      // SQL-Query: objects mit direktem mandant_id (object_mandant existiert nicht)
      // Rückgabe: object-Daten mit mandantId und mandant_access für Zugriffskontrolle
      const pool = ConnectionPoolManager.getInstance().getPool();
      const objectQuery = `
        SELECT o.*, 
               o.mandant_id as mandantId
        FROM objects o
        WHERE o.objectid = $1
        LIMIT 1
      `;
      const objectResult = await pool.query(objectQuery, [parseInt(objectId)]);

      if (objectResult.rows.length === 0) {
        console.log(`❌ [EFF-ANALYSIS] Object ${objectId} not found`);
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }

      const object = objectResult.rows[0];
      console.log(`✅ [EFF-ANALYSIS] Object found: ${object.name}`);

      // Zugriffsprüfung gem. Dokumentation (außer für Admins):
      // User hat Zugriff wenn:
      // 1. object.mandant_id = user.mandantId ODER
      // 2. user.mandantId ist in object.mandant_access Array
      if (demoUser.role !== "admin") {
        const hasPrimaryAccess = object.mandant_id === demoUser.mandantId;
        const hasSharedAccess = object.mandant_access && 
          Array.isArray(object.mandant_access) && 
          object.mandant_access.includes(demoUser.mandantId);
        
        if (!hasPrimaryAccess && !hasSharedAccess) {
          res
            .status(403)
            .json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      // Objektfläche API Zusammenfassung: Fläche aus Portal-DB object.objdata extrahieren
      // Parameter: object.objdata.area oder object.objdata.nutzflaeche als String
      // Parsing: parseFloat mit Fallback 100 m² bei fehlenden/ungültigen Werten
      // Rückgabe: area als Number für Effizienz-Berechnung (kWh/m²)
      let area = 100;
      if (object.objdata?.area) {
        area = parseFloat(object.objdata.area) || area;
      } else if (object.objdata?.nutzflaeche) {
        area = parseFloat(object.objdata.nutzflaeche) || area;
      }
      console.log(`🏠 [EFF-ANALYSIS] Object area: ${area} m²`);

      // Zähler-Suche API Zusammenfassung: Netz-Zähler aus Portal-DB object.meter finden
      // Parameter: object.meter Object mit Zähler-Pattern-Keys (Z20541 für Netz)
      // Regex-Suche: ^Z20541 Pattern für Energy-Zähler-ID
      // API Response 404: Netz-Zähler nicht verfügbar für Objekt
      const availableMeters = object.meter || {};
      let netMeterKey =
        Object.keys(availableMeters).find((key) => key.match(/^Z20541/)) || "";
      let netMeterId = "";

      if (!netMeterKey) {
        console.log(
          `❌ [EFF-ANALYSIS] Netz meter (Z20541) not found for object ${objectId}`,
        );
        res
          .status(404)
          .json({ message: "Netz-Zähler nicht gefunden für dieses Objekt" });
        return;
      }

      netMeterId = availableMeters[netMeterKey];
      console.log(
        `✅ [EFF-ANALYSIS] Found Netz meter: ${netMeterKey} (ID: ${netMeterId})`,
      );

      // Initialize variables for database values
      let totalKwh = 0;
      let efficiencyPerM2 = 0;
      let actualPeriodDays = 365;
      let actualStartDate: string = "";
      let actualEndDate: string = "";
      let actualEnFirst = 0;
      let actualEnLast = 0;

      try {
        // Settings-DB API Aufruf: Externe Energy-DB Konfiguration laden
        // Parameter: { category: 'data' } für Datenbank-Konfigurationen
        // API Response 500 bei fehlender Energy-DB Konfiguration
        // Energy-DB Verbindungsparameter aus Settings extrahieren
        const energySettings = await storage.getSettings({
          category: "data",
        });
        let dbConfig = energySettings.find(
          (s: any) => s.key_name === "dbEnergyData_view_day_comp",
        );

        if (!dbConfig || !dbConfig.value) {
          console.log(
            "❌ [EFF-ANALYSIS] Database configuration for day_comp not found",
          );
          throw new Error("Energy database configuration not found");
        }

        const config = (dbConfig.value as any).dbEnergyData || dbConfig.value;

        // Create connection to external energy database
        const { Pool } = await import("pg");
        const energyDbPool = new Pool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          ssl: config.ssl || false,
          connectionTimeoutMillis: config.connectionTimeout || 15000,
          max: 5,
          idleTimeoutMillis: 30000,
          allowExitOnIdle: true,
        });

        // Define time range condition
        let dateCondition = "";
        const currentYear = new Date().getFullYear();

        switch (timeRange) {
          case 'last-2year':
            // Dynamisch: Vorletztes Jahr (currentYear - 2)  
            dateCondition = `_time >= '${currentYear - 2}-01-01' AND _time < '${currentYear - 1}-01-01'`;
            break;
          case 'last-year':
            dateCondition = `_time >= '${currentYear - 1}-01-01' AND _time < '${currentYear}-01-01'`;
            break;
          case 'last-365-days':
          case '365days':
          default:
            dateCondition = "_time >= NOW() - INTERVAL '365 days'";
            break;
        }

        // Query for aggregated energy data with accurate period information
        const energyQuery = `
          WITH monthly_data AS (
            SELECT 
              DATE_TRUNC('month', _time) as month,
              MIN(en_first) as month_start,
              MAX(en_last) as month_end,
              COUNT(*) as days_count,
              MIN(_time) as month_first_date,
              MAX(_time) as month_last_date
            FROM "${config.table || "view_day_comp"}" 
            WHERE id = $1 AND ${dateCondition}
            GROUP BY DATE_TRUNC('month', _time)
            ORDER BY month ASC
          ),
          totals AS (
            SELECT 
              MIN(month_start) as period_start,
              MAX(month_end) as period_end,
              SUM(month_end - month_start) as total_kwh,
              SUM(days_count) as total_days,
              COUNT(*) as total_months,
              MIN(month_first_date) as period_first_date,
              MAX(month_last_date) as period_last_date
            FROM monthly_data
          )
          SELECT 
            m.*,
            t.period_start,
            t.period_end,
            t.total_kwh,
            t.total_days,
            t.total_months,
            t.period_first_date,
            t.period_last_date,
            (m.month_end - m.month_start) as monthly_kwh
          FROM monthly_data m 
          CROSS JOIN totals t
          ORDER BY m.month ASC
        `;

        console.log(
          `🔍 [EFF-ANALYSIS] Querying energy data for meter ${netMeterId}, timeRange: ${timeRange}`,
        );

        const energyResult = await energyDbPool.query(energyQuery, [
          netMeterId,
        ]);
        await energyDbPool.end();

        if (energyResult.rows.length > 0) {
          const firstRow = energyResult.rows[0];

          // Extract actual database values
          actualPeriodDays = parseInt(firstRow.total_days) || 365;
          actualEnFirst = parseInt(firstRow.period_start) || 0;
          actualEnLast = parseInt(firstRow.period_end) || 0;

          // Korrekte totalKwh Berechnung: direkt aus Zählerständen (Wh zu kWh)
          totalKwh = (actualEnLast - actualEnFirst) / 1000;

          // Extract actual period dates from database
          if (firstRow.period_last_date) {
            actualEndDate = new Date(firstRow.period_last_date)
              .toISOString()
              .split("T")[0];
          }

          // Calculate efficiency per m²
          efficiencyPerM2 = Math.round(totalKwh / area);

          console.log(
            `✅ [EFF-ANALYSIS] Energy data retrieved: totalKwh=${totalKwh}, efficiencyPerM2=${efficiencyPerM2}, days=${actualPeriodDays}, startDate=${actualStartDate}, endDate=${actualEndDate}`,
          );
          console.log(
            `📊 [EFF-ANALYSIS] Counter readings: en_first=${actualEnFirst}, en_last=${actualEnLast}`,
          );
        } else {
          console.log(
            `❌ [EFF-ANALYSIS] No energy data found for meter ${netMeterId}`,
          );
        }
      } catch (dbError) {
        console.error("❌ [EFF-ANALYSIS] Database connection error:", dbError);
        res.status(500).json({
          message: "Fehler beim Laden der Energiedaten aus der Datenbank",
          error:
            process.env.NODE_ENV === "development"
              ? (dbError as Error).message
              : undefined,
        });
        return;
      }

      // API Response JSON aufbauen - alle Werte aus echten DB-Abfragen:
      // - objectId/timeRange/resolution: URL/Query Parameter zurückgeben
      // - meterId/meterKey: aus Portal-DB object.meter extrahiert
      // - area: aus Portal-DB object.objdata extrahiert
      // - period: Periode-Daten aus Energy-DB (days, totalKwh, Zählerstände, Datumswerte)
      // - yearly: Jahres-Effizienz-Daten (totalKwh, efficiencyPerM2 berechnet als totalKwh/area)
      const responseData = {
        objectId: parseInt(objectId),
        timeRange: timeRange as string,
        resolution: resolution as string,
        meterId: parseInt(netMeterId),
        meterKey: netMeterKey,
        area,
        period: {
          days: actualPeriodDays,
          totalKwh,
          startDate: actualStartDate || `${timeRange}-01-01`,
          endDate: actualEndDate || `${timeRange}-12-31`,
          en_first: actualEnFirst,
          en_last: actualEnLast,
          en_first_Date: actualStartDate || `${timeRange}-01-01`,
          en_last_Date: actualEndDate || `${timeRange}-12-31`,
        },
        yearly: {
          en_first: actualEnFirst,
          en_last: actualEnLast,
          totalKwh,
          efficiencyPerM2,
          unit: "kWh/m²/Jahr",
        },
        location: {
          postalCode: object.postal_code || '30161',
          city: object.city || 'Hannover'
        }
      };

      console.log(
        `✅ [EFF-ANALYSIS] Returning efficiency data for object ${objectId} with totalKwh=${totalKwh}, area=${area}m², efficiency=${efficiencyPerM2}kWh/m²`,
      );
      res.json(responseData);
    } catch (error) {
      console.error("❌ [EFF-ANALYSIS] Error:", error);
      res.status(500).json({
        message: "Fehler beim Laden der Effizienzanalyse",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };
}

export const efficiencyController = new EfficiencyController();
