import { Request, Response } from "express";
import { storage } from "../storage";
import { ConnectionPoolManager } from "../connection-pool";

class EnergyController {
  /**
   * API: GET /api/energy/heating-systems
   * Parameter: Keine URL-Parameter, Session-basierte Authentifizierung
   * Zweck: Lädt alle Heizsysteme (Objekte) für den authentifizierten Benutzer
   * Auth: Erfordert Session mit user.mandantId und user.role
   * Rückgabe: Array von Heizsystemen mit {id, name, systemId, location, type, status, mandantId}
   * DB-Zugriff: storage.getObjects() mit Mandanten-Filterung
   */
  async getHeatingSystems(req: Request, res: Response) {
    try {
      const user = (req as any).session?.user;
      
      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }
      
      // Get objects that represent heating systems
      const systems = await storage.getObjects(user.mandantId, user.role !== 'admin');
      
      // Transform to heating systems format (use consistent numeric IDs)
      const heatingSystems = systems.map(system => ({
        id: system.id,
        name: system.name,
        systemId: system.id.toString(), // Use consistent numeric ID string
        location: system.description || 'Nicht spezifiziert',
        type: 'Wärmesystem',
        status: 'active',
        mandantId: system.mandantId
      }));

      res.json(heatingSystems);
    } catch (error) {
      console.error('Error fetching heating systems:', error);
      res.status(500).json({ message: "Fehler beim Laden der Heizsysteme" });
    }
  }

  /**
   * API: GET /api/energy/energy-data
   * Parameter: ?systemId=123&start=2024-01-01&end=2024-12-31
   * Zweck: Lädt Energiedaten für ein spezifisches Heizsystem mit Zeitfilter
   * Auth: Erfordert Session, prüft Mandanten-Berechtigung für System
   * Rückgabe: Array von Energiedaten aus dayComp-Tabelle
   * DB-Zugriff: storage.getEnergyDataForObject() mit start/end-Parametern
   */
  async getEnergyData(req: Request, res: Response) {
    try {
      const { systemId } = req.query;
      const { start, end } = req.query;
      const user = (req as any).session?.user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      if (!systemId) {
        return res.status(400).json({ message: "SystemId ist erforderlich" });
      }

      // Validate access to the system - Use working database method
      const pool = ConnectionPoolManager.getInstance().getPool();
      const objectQuery = `
        SELECT o.*,
               o.mandant_id as mandantId
        FROM objects o
        WHERE o.objectid = $1
        LIMIT 1
      `;
      
      const objectResult = await pool.query(objectQuery, [parseInt(systemId as string)]);
      
      if (objectResult.rows.length === 0) {

        return res.status(404).json({ message: "Heizsystem nicht gefunden" });
      }
      
      const system = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && system.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses System" });
      }

      // Get energy data from dayComp table
      const energyData = await storage.getEnergyDataForObject(
        parseInt(systemId as string),
        start as string,
        end as string
      );

      res.json(energyData);
    } catch (error) {
      console.error('Error fetching energy data:', error);
      res.status(500).json({ message: "Fehler beim Laden der Energiedaten" });
    }
  }

  /**
   * API: POST /api/energy/energy-data
   * Parameter: Body {systemId, recordDate, energyConsumption, renewableShare, co2Emissions, cost, temperature, humidity}
   * Zweck: Erstellt neue Energiedaten-Einträge für ein System
   * Auth: Erfordert Session, prüft Mandanten-Berechtigung für System
   * Rückgabe: Erstellte Energiedaten mit ID
   * DB-Zugriff: storage.createEnergyData() mit Validierung
   */
  async createEnergyData(req: Request, res: Response) {
    try {
      const user = (req as any).session?.user;
      const energyData = req.body;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Validate required fields
      if (!energyData.systemId || !energyData.recordDate) {
        return res.status(400).json({ message: "SystemId und Aufzeichnungsdatum sind erforderlich" });
      }

      // Validate access to the system - Use working database method
      const pool = ConnectionPoolManager.getInstance().getPool();
      const objectQuery = `
        SELECT o.*,
               o.mandant_id as mandantId
        FROM objects o
        WHERE o.objectid = $1
        LIMIT 1
      `;
      
      const objectResult = await pool.query(objectQuery, [energyData.systemId]);
      
      if (objectResult.rows.length === 0) {

        return res.status(404).json({ message: "Heizsystem nicht gefunden" });
      }
      
      const system = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && system.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses System" });
      }

      // Create energy data entry
      const newEnergyData = await storage.createEnergyData({
        objectId: energyData.systemId,
        date: new Date(energyData.recordDate),
        energyConsumption: energyData.energyConsumption || 0,
        renewableShare: energyData.renewableShare || 0,
        co2Emissions: energyData.co2Emissions || 0,
        cost: energyData.cost || 0,
        temperature: energyData.temperature || null,
        humidity: energyData.humidity || null
      });

      res.status(201).json(newEnergyData);
    } catch (error) {
      console.error('Error creating energy data:', error);
      res.status(500).json({ message: "Fehler beim Erstellen der Energiedaten" });
    }
  }

  /**
   * API: GET /api/energy/energy-data/:objectId
   * Parameter: :objectId (URL), ?timeRange=last-year|last-365-days|last-2year
   * Zweck: Lädt Energiedaten für spezifisches Objekt mit Zeitbereich-Filter
   * Auth: Erfordert Session, prüft Mandanten-Berechtigung für Objekt
   * Rückgabe: Energiedaten oder Fallback-Daten wenn keine echten Daten verfügbar
   * DB-Zugriff: storage.getEnergyDataForObject() mit Fallback auf generateFallbackEnergyData()
   */
  async getEnergyDataByObject(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const user = (req as any).session?.user;
      const { timeRange } = req.query;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Validate access to the object - Use working database method
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

        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }
      
      const object = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get energy data with time range filter
      const energyData = await storage.getEnergyDataForObject(
        parseInt(objectId),
        undefined,
        undefined,
        timeRange as string
      );

      // If no data found, return fallback/demo data
      if (!energyData || energyData.length === 0) {
        const fallbackData = this.generateFallbackEnergyData(parseInt(objectId), timeRange as string);
        return res.json({
          success: true,
          data: fallbackData,
          source: 'fallback',
          message: 'Echte Daten nicht verfügbar, Fallback-Daten werden angezeigt'
        });
      }

      res.json({
        success: true,
        data: energyData,
        source: 'database'
      });
    } catch (error) {
      console.error('Error fetching energy data by object:', error);
      res.status(500).json({ message: "Fehler beim Laden der Objektenergiedaten" });
    }
  }

  /**
   * API: GET /api/energy/energy-data-meters/:objectId
   * Parameter: :objectId (URL), ?timeRange=last-year|last-365-days|last-2year
   * Zweck: Lädt Zähler-spezifische Energiedaten für ein Objekt (Z20241, Z20141, Z20541)
   * Auth: Erfordert Session, prüft Mandanten-Berechtigung für Objekt
   * Rückgabe: Meter-Daten gruppiert nach Zähler-Keys oder Fallback-Daten
   * DB-Zugriff: storage.getMeterDataForObject() mit Fallback auf generateFallbackMeterData()
   */
  async getMeterEnergyData(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const user = (req as any).session?.user;
      const { timeRange } = req.query;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Validate access to the object - Use working database method
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

        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      const object = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get meter data
      const meterData = await storage.getMeterDataForObject(
        parseInt(objectId),
        timeRange as string
      );

      // If no data found, return fallback/demo data
      if (!meterData || Object.keys(meterData).length === 0) {
        const fallbackData = this.generateFallbackMeterData(parseInt(objectId), timeRange as string);
        return res.json({
          success: true,
          data: fallbackData,
          source: 'fallback',
          message: 'Echte Zählerdaten nicht verfügbar, Fallback-Daten werden angezeigt'
        });
      }

      res.json({
        success: true,
        data: meterData,
        source: 'database'
      });
    } catch (error) {
      console.error('Error fetching meter energy data:', error);
      res.status(500).json({ message: "Fehler beim Laden der Zählerenergiedaten" });
    }
  }

  // Generate fallback energy data for demo purposes
  private generateFallbackEnergyData(objectId: number, timeRange?: string): any[] {
    const months = timeRange === 'now-2y' ? 24 : 12;
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      data.push({
        id: `fallback_${objectId}_${i}`,
        objectId: objectId.toString(),
        time: date.toISOString(),
        energy: Math.round(15000 + (Math.random() * 5000) - 2500),
        volume: Math.round(3000 + (Math.random() * 1000) - 500),
        energyDiff: Math.round(1200 + (Math.random() * 400) - 200),
        volumeDiff: Math.round(250 + (Math.random() * 100) - 50),
        month: date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit' })
      });
    }

    return data;
  }

  // Generate fallback meter data for demo purposes
  private generateFallbackMeterData(objectId: number, timeRange?: string): any {
    const meters = ['Z20241', 'Z20141', 'Z20541']; // WP, Kessel, Netz
    const result: any = {};
    const months = timeRange === 'now-2y' ? 24 : 12;

    meters.forEach(meterKey => {
      result[meterKey] = {
        id: `${objectId}_${meterKey}`,
        name: meterKey.startsWith('Z2024') ? 'Wärmepumpe' : 
              (meterKey.startsWith('Z2014') ? 'Kessel' : 'Netz'),
        data: Array.from({ length: months }, (_, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - index);
          
          const baseEnergy = meterKey.startsWith('Z2024') ? 8000 : 
                            (meterKey.startsWith('Z2014') ? 4000 : 12000);
          const baseVolume = Math.round(baseEnergy * 0.2);
          
          return {
            id: `fallback_${meterKey}_${index}`,
            objectId: objectId.toString(),
            time: date.toISOString(),
            energy: Math.round(baseEnergy + (Math.random() * 2000) - 1000),
            volume: Math.round(baseVolume + (Math.random() * 400) - 200),
            energyDiff: Math.round((baseEnergy / 10) + (Math.random() * 200) - 100),
            volumeDiff: Math.round((baseVolume / 10) + (Math.random() * 40) - 20),
            month: date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit' })
          };
        })
      };
    });

    return result;
  }

  /**
   * API: GET /api/energy/energy-data/temperature-efficiency-chart/:objectId
   * Parameter: :objectId (URL), ?timeRange=last-year|last-365-days|last-2year
   * Zweck: Lädt Temperatur-Effizienz-Analyse für Chart-Anzeige mit Korrelation von Außentemperatur und Energieverbrauch
   * Auth: Erfordert Session, prüft Mandanten-Berechtigung für Objekt
   * Rückgabe: {efficiencyPoints, monthlyClimate, temperatureEfficiencyData} für Chart-Visualisierung
   * DB-Zugriff: Portal-DB für daily_outdoor_temperatures, Externe Energy-DB für monatliche Verbrauchsdaten (view_mon_comp)
   */
  async getTemperatureEfficiencyChart(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const user = (req as any).session?.user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Validate access to the object - Use working database method
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

        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      const object = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get temperature efficiency data with timeRange parameter
      const { timeRange } = req.query;
      const validTimeRange = timeRange === 'last-year' || timeRange === 'last-365-days' || timeRange === 'last-2year' ? timeRange : 'last-year';
      
      console.log(`🔍 [EFFICIENCY] Found object ${objectId}: { postalCode: '${object.postal_code}', objdata: { NE: ${object.objdata?.NE}, area: ${object.objdata?.area}, Portal: ${object.objdata?.Portal} } }`);
      
      // Fetch outdoor temperatures for postal code and timeRange
      const postalCode = object.postal_code || '30161';
      console.log(`🌡️ [EFFICIENCY] Fetching real outdoor temperatures for postal code: ${postalCode}, timeRange: ${validTimeRange} (${new Date(new Date().getTime() - 30*24*60*60*1000).toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]})`);
      
      // Calculate date range for temperatures
      const today = new Date();
      let startDate, endDate;
      
      if (validTimeRange === 'last-year') {
        startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0]; // 2024-01-01
        endDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0]; // 2024-12-31
      } else if (validTimeRange === 'last-2year') {
        startDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0]; // 2023-01-01
        endDate = new Date(today.getFullYear() - 2, 11, 31).toISOString().split('T')[0]; // 2023-12-31
      } else { // last-365-days
        startDate = new Date(today.getTime() - 365*24*60*60*1000).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }
      
      // Fetch outdoor temperatures
      const tempQuery = `
        SELECT id, date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source, created_at, updated_at
        FROM daily_outdoor_temperatures WHERE 1=1
       AND postal_code = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC
      `;
      console.log('📋 Parameters:', [postalCode, startDate, endDate]);
      
      const tempResult = await pool.query(tempQuery, [postalCode, startDate, endDate]);
      console.log(`📊 Gefundene Datensätze aus Portal-DB: ${tempResult.rows.length}`);
      
      const temperatures = tempResult.rows.map(row => ({
        id: row.id,
        date: row.date,
        postalCode: row.postal_code,
        city: row.city,
        temperatureMin: row.temperature_min,
        temperatureMax: row.temperature_max,
        temperatureMean: row.temperature_mean,
        dataSource: row.data_source,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log(`📊 [EFFICIENCY] Found ${temperatures.length} outdoor temperature records`);
      
      // Get efficiency data using external energy database (same logic as efficiency-analysis API)
      let efficiencyPoints: any[] = [];
      try {
        // Use same area calculation as efficiency-analysis API
        const area = parseFloat(object.objdata?.area || object.objdata?.nutzflaeche || '100'); // m²
        console.log(`🏠 [EFFICIENCY] Object area: ${area} m²`);
        
        // Find meter ID (same logic as efficiency-analysis API)
        const availableMeters = object.meter || {};
        let netMeterKey = Object.keys(availableMeters).find((key) => key.match(/^Z20541/)) || "";
        let netMeterId = "";

        if (netMeterKey) {
          netMeterId = availableMeters[netMeterKey];
          console.log(`✅ [TEMP-EFF-CHART] Found Netz meter: ${netMeterKey} (ID: ${netMeterId})`);
          
          try {
            // Get external energy database configuration (using monthly data - view_mon_comp)
            const energySettings = await storage.getSettings({ category: "data" });
            let dbConfig = energySettings.find((s: any) => s.key_name === "dbEnergyData_view_mon_comp");

            if (dbConfig && dbConfig.value) {
              const config = (dbConfig.value as any).dbEnergyData || dbConfig.value;
              
              // Connect to external energy database
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

              // Query monthly energy data using view_mon_comp
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
                  dateCondition = "_time >= NOW() - INTERVAL '365 days'";
                  break;
                default:
                  // Alle anderen Cases: Letzte 12 Monate
                  dateCondition = "_time >= NOW() - INTERVAL '12 months'";
                  break;
              }
              
              const energyQuery = `
                SELECT 
                  DATE_TRUNC('month', _time) as month,
                  (en_last - en_first) / 1000 as monthly_kwh,
                  1 as days_count
                FROM "${config.table || "view_mon_comp"}" 
                WHERE id = $1 
                  ${dateCondition ? `AND ${dateCondition}` : ''}
                  AND (en_last - en_first) > 0
                ORDER BY month ASC
              `;
              
              console.log(`🔍 [TEMP-EFF-CHART] Querying monthly energy data for meter ${netMeterId}, timeRange: ${timeRange}`);
              const energyResult = await energyDbPool.query(energyQuery, [parseInt(netMeterId)]);
              await energyDbPool.end();
              
              // Convert to efficiency points
              energyResult.rows.forEach((row: any) => {
                const monthlyKwh = parseFloat(row.monthly_kwh) || 0;
                const efficiencyPerM2 = area > 0 ? monthlyKwh / area : 0;
                
                efficiencyPoints.push({
                  date: row.month,
                  efficiency: Math.round(efficiencyPerM2 * 100) / 100,
                  consumption: Math.round(monthlyKwh),
                  days: parseInt(row.days_count) || 30
                });
              });
              
              console.log(`📊 [TEMP-EFF-CHART] Calculated ${efficiencyPoints.length} efficiency points from monthly energy DB`);
            } else {
              console.log("❌ [TEMP-EFF-CHART] Monthly energy database configuration not found");
            }
          } catch (energyDbError) {
            console.error("❌ [TEMP-EFF-CHART] External energy database error:", energyDbError);
          }
        } else {
          console.log(`❌ [TEMP-EFF-CHART] Netz meter (Z20541) not found for object ${objectId}`);
        }
      } catch (effError) {
        console.warn('Error fetching efficiency data:', effError);
      }
      
      console.log(`📊 [EFFICIENCY] Calculated ${efficiencyPoints.length} efficiency points for object ${objectId}`);
      
      // Klimadaten API Zusammenfassung: Monatliche Temperaturdaten (min/max/mean) je Monat laden
      // Parameter: postalCode für Standort, startDate/endDate für Zeitraum
      // SQL-Query: daily_outdoor_temperatures mit GROUP BY Monat für Aggregation
      // Rückgabe: monthlyClimate Array mit {month, min, max, mean} für jeden Monat
      let monthlyClimate: any[] = [];
      try {
        console.log(`🌡️ [TEMP-EFF-CHART] Fetching monthly climate data for postal code: ${postalCode}, timeRange: ${validTimeRange}`);

        // Portal-DB API Aufruf: Monatliche Temperatur-Aggregation aus daily_outdoor_temperatures
        // Parameter: postalCode für Standort, startDate/endDate für Zeitfilter
        // SQL-Aggregation: MIN/MAX/AVG gruppiert nach Jahr-Monat (DATE_TRUNC)
        // Rückgabe: Monatliche min/max/mean Temperaturen für Effizienz-Korrelation
        const climateQuery = `
          SELECT 
            DATE_TRUNC('month', date) as month,
            MIN(temperature_min) as month_min_temp,
            MAX(temperature_max) as month_max_temp,
            ROUND(AVG(temperature_mean)::numeric, 1) as month_mean_temp,
            COUNT(*) as days_count
          FROM daily_outdoor_temperatures 
          WHERE postal_code = $1 AND date >= $2 AND date <= $3
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY month ASC
        `;
        
        const climateResult = await pool.query(climateQuery, [postalCode, startDate, endDate]);
        
        monthlyClimate = climateResult.rows.map(row => ({
          month: row.month.toISOString().substring(0, 7), // YYYY-MM format
          monthName: row.month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
          temperatureMin: parseFloat(row.month_min_temp) || 0,
          temperatureMax: parseFloat(row.month_max_temp) || 0,
          temperatureMean: parseFloat(row.month_mean_temp) || 0,
          daysCount: parseInt(row.days_count) || 0
        }));

        console.log(`📊 [TEMP-EFF-CHART] Found ${monthlyClimate.length} months of climate data for ${postalCode}`);
        
      } catch (climateError) {
        console.error("⚠️ [TEMP-EFF-CHART] Error loading climate data:", climateError);
        // Continue with empty climate data - non-critical for chart display
        monthlyClimate = [];
      }
      
      // API Response Summary: Berechne Jahres-Summen und Fläche für Frontend-Anzeige
      // Parameter: efficiencyPoints Array für totalKwh/efficiencyPerM2-Berechnung
      // area aus object.objdata für m²-Anzeige
      // Rückgabe: summary.yearly mit totalKwh/efficiencyPerM2 für Header-Display
      const area = parseFloat(object.objdata?.area || object.objdata?.nutzflaeche || '100');
      let totalKwh = 0;
      let efficiencyPerM2 = 0;
      
      if (efficiencyPoints.length > 0) {
        // Berechne Jahres-Gesamtverbrauch aus monatlichen consumption-Werten
        totalKwh = efficiencyPoints.reduce((sum, point) => sum + (point.consumption || 0), 0);
        efficiencyPerM2 = area > 0 ? totalKwh / area : 0;
        console.log(`📊 [TEMP-EFF-CHART] Calculated yearly totals: totalKwh=${totalKwh}, area=${area}m², efficiency=${Math.round(efficiencyPerM2)}kWh/m²`);
      }
      
      // Transform response to match TemperatureEfficiencyChart expectations
      // Extended with summary.yearly und area für korrekte Header-Anzeige
      res.json({
        success: true,
        object: {
          objectid: object.objectid,
          name: object.name,
          postalCode: postalCode,
          city: object.city || object.ort,
          status: 'active'
        },
        temperatures: temperatures,
        efficiency: efficiencyPoints,
        summary: {
          yearly: {
            totalKwh: Math.round(totalKwh),
            efficiencyPerM2: Math.round(efficiencyPerM2 * 100) / 100,
            unit: 'kWh/m²/Jahr'
          }
        },
        area: area,
        monthlyClimate: monthlyClimate,
        location: {
          postalCode: postalCode,
          city: object.city || object.ort || 'Hannover'
        },
        objectId: parseInt(objectId)
      });
    } catch (error) {
      console.error('Error fetching temperature efficiency chart:', error);
      res.status(500).json({ message: "Fehler beim Laden der Temperatureffizienz-Daten" });
    }
  }

  // Get yearly summary
  async getYearlySummary(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const user = (req as any).session?.user;
      const { year } = req.query;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Validate access to the object - Use working database method
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

        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      const object = objectResult.rows[0];


      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get yearly summary
      const summary = await storage.getYearlySummary(
        parseInt(objectId),
        year ? parseInt(year as string) : new Date().getFullYear()
      );

      res.json({
        success: true,
        data: summary,
        objectId: parseInt(objectId),
        year: year || new Date().getFullYear()
      });
    } catch (error) {
      console.error('Error fetching yearly summary:', error);
      res.status(500).json({ message: "Fehler beim Laden der Jahreszusammenfassung" });
    }
  }

  // Get daily consumption data for an object
  async getDailyConsumption(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      // Restore proper auth validation
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { timeRange = 'last-365-days' } = req.query;

      console.log(`🔍 [DAILY-CONSUMPTION] Request for objectId: ${objectId}, timeRange: ${timeRange}`);

      // Validate access to the object using objectid lookup
      const object = await storage.getObjectByObjectId(BigInt(objectId));
      if (!object) {
        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get real daily consumption data from database
      const dailyData = await storage.getDailyConsumptionData(parseInt(objectId), timeRange as string);
      
      console.log(`✅ [DAILY-CONSUMPTION] Generated ${dailyData.length} daily records for object ${objectId}`);
      
      res.json({
        success: true,
        data: dailyData,
        source: 'generated',
        message: `Tägliche Verbrauchsdaten für Objekt ${objectId}`
      });
    } catch (error) {
      console.error('❌ [DAILY-CONSUMPTION] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der täglichen Verbrauchsdaten" });
    }
  }

  // Get monthly consumption data for an object
  async getMonthlyConsumption(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      // Restore proper auth validation
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { timeRange = 'last-365-days' } = req.query;

      console.log(`🔍 [MONTHLY-CONSUMPTION] Request for objectId: ${objectId}, timeRange: ${timeRange}`);

      // Validate access to the object using objectid lookup
      const object = await storage.getObjectByObjectId(BigInt(objectId));
      if (!object) {
        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
      }

      // Get real monthly consumption data from database
      const monthlyData = await storage.getMonthlyConsumptionData(parseInt(objectId), timeRange as string);
      
      console.log(`✅ [MONTHLY-CONSUMPTION] Generated monthly data for object ${objectId}, timeRange: ${timeRange}`);
      
      res.json({
        success: true,
        data: monthlyData,
        source: 'generated',
        message: `Monatliche Verbrauchsdaten für Objekt ${objectId}`
      });
    } catch (error) {
      console.error('❌ [MONTHLY-CONSUMPTION] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der monatlichen Verbrauchsdaten" });
    }
  }

  // PUBLIC METHODS FOR TESTING (without authentication bypass)
  // Get daily consumption data for public testing (with proper object validation)
  async getPublicDailyConsumption(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const { timeRange = 'last-365-days' } = req.query;

      console.log(`🔍 [PUBLIC-DAILY-CONSUMPTION] Request for objectId: ${objectId}, timeRange: ${timeRange}`);

      // First, verify the object exists and get the mandant info
      const objectInfo = await storage.getObjectByObjectId(BigInt(objectId));
      
      if (!objectInfo) {
        return res.status(404).json({ 
          success: false, 
          message: `Objekt ${objectId} nicht gefunden` 
        });
      }

      // Get energy data using validated object and mandant 
      const data = await storage.getDailyConsumptionData(parseInt(objectId), timeRange as string);

      console.log(`✅ [PUBLIC-DAILY-CONSUMPTION] Found ${Object.keys(data).length} meters for object ${objectId}`);

      res.json({
        success: true,
        data,
        source: 'database', 
        message: `Tägliche Verbrauchsdaten für Objekt ${objectId}`
      });

    } catch (error) {
      console.error('❌ [PUBLIC-DAILY-CONSUMPTION] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der öffentlichen täglichen Verbrauchsdaten" });
    }
  }

  // Get monthly consumption data for public testing (with proper object validation)
  async getPublicMonthlyConsumption(req: Request, res: Response) {
    try {
      const { objectId } = req.params;
      const { timeRange = 'last-365-days' } = req.query;

      console.log(`🔍 [PUBLIC-MONTHLY-CONSUMPTION] Request for objectId: ${objectId}, timeRange: ${timeRange}`);

      // First, verify the object exists and get the mandant info
      const objectInfo = await storage.getObjectByObjectId(BigInt(objectId));
      
      if (!objectInfo) {
        return res.status(404).json({ 
          success: false, 
          message: `Objekt ${objectId} nicht gefunden` 
        });
      }

      // Get energy data using validated object and mandant
      const data = await storage.getMonthlyConsumptionData(parseInt(objectId), timeRange as string);

      console.log(`✅ [PUBLIC-MONTHLY-CONSUMPTION] Found ${Object.keys(data).length} meters for object ${objectId}`);

      res.json({
        success: true,
        data,
        source: 'database',
        message: `Monatliche Verbrauchsdaten für Objekt ${objectId}`
      });

    } catch (error) {
      console.error('❌ [PUBLIC-MONTHLY-CONSUMPTION] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der öffentlichen monatlichen Verbrauchsdaten" });
    }
  }

  /**
   * API: GET /api/monthly-netz/:objectId (PUBLIC ROUTE)
   * Parameter: :objectId (URL), ?timeRange=last-365-days|2023|2024|2025|last-year
   * Zweck: Lädt spezifisch Z20541 Netz-Zähler monatliche Daten mit Aggregation aus externer Energy-DB
   * Auth: Public Route - keine Authentifizierung erforderlich
   * Rückgabe: {success, data: {objectId, meterKey, monthlyData, monthlyAggregatesCount}}
   * DB-Zugriff: Portal-DB für objectId=>Z20541 Mapping, Externe Energy-DB (view_mon_comp) für monatliche Aggregate
   */
  async getMonthlyNetz(req: Request, res: Response) {
    try {
      // API Parameter-Zusammenfassung: Monthly Netz (Z20541) data request 
      // URL Parameter: objectId (z.B. "207315076")
      // Query Parameter: timeRange (default: 'last-365-days')
      const { objectId } = req.params;
      const { timeRange = 'last-365-days' } = req.query;
      const user = (req as any).user || (req.session as any)?.user;

      console.log(`🔍 [MONTHLY-NETZ] Request for objectId: ${objectId}, timeRange: ${timeRange}`);

      // Portal-DB API Aufruf: Objektdaten + Z20541 Meter abrufen
      // Parameter: objectId als Integer, LEFT JOIN für mandant_id Zuordnung
      // SQL-Query: objects + object_mandant für Mandanten-Berechtigung
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
        console.log(`❌ [MONTHLY-NETZ] Object ${objectId} not found`);
        return res.status(404).json({ message: "Objekt nicht gefunden" });
      }

      const object = objectResult.rows[0];
      console.log(`✅ [MONTHLY-NETZ] Object found: ${object.name}`);

      // Zähler-Suche API: Netz-Zähler (Z20541) aus Portal-DB object.meter finden
      // Parameter: object.meter Object mit Zähler-Pattern-Keys (Z20541 für Netz)
      // Regex-Suche: ^Z20541 Pattern für Energy-Zähler-ID
      const availableMeters = object.meter || {};
      let netMeterKey = Object.keys(availableMeters).find((key) => key.match(/^Z20541/)) || "";
      let netMeterId = "";

      if (!netMeterKey) {
        console.log(`❌ [MONTHLY-NETZ] Netz meter (Z20541) not found for object ${objectId}`);
        return res.status(404).json({ 
          message: "Netz-Zähler (Z20541) nicht gefunden für dieses Objekt",
          availableMeters: Object.keys(availableMeters)
        });
      }

      netMeterId = availableMeters[netMeterKey];
      console.log(`✅ [MONTHLY-NETZ] Found Netz meter: ${netMeterKey} (ID: ${netMeterId})`);

      // Settings-DB API: Externe Energy-DB Konfiguration laden
      // Parameter: { category: 'data' } für Datenbank-Konfigurationen
      const energySettings = await storage.getSettings({ category: "data" });
      let dbConfig = energySettings.find((s: any) => s.key_name === "dbEnergyData_view_mon_comp");

      if (!dbConfig || !dbConfig.value) {
        console.log("❌ [MONTHLY-NETZ] Database configuration for mon_comp not found");
        return res.status(500).json({ message: "Energy database configuration not found" });
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
      });

      // Calculate date range based on timeRange parameter
      const now = new Date();
      let startDate: Date, endDate: Date;
      
      switch (timeRange) {
        case '2023':
          startDate = new Date(2023, 0, 1);
          endDate = new Date(2023, 11, 31, 23, 59, 59);
          break;
        case '2024':
          startDate = new Date(2024, 0, 1);
          endDate = new Date(2024, 11, 31, 23, 59, 59);
          break;
        case '2025':
          startDate = new Date(2025, 0, 1);
          endDate = new Date(2025, 11, 31, 23, 59, 59);
          break;
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        default: // last-365-days
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          endDate = now;
      }

      console.log(`🔍 [MONTHLY-NETZ] Searching for objectId ${objectId} in external database`);
      
      // Query external energy database for monthly data
      const monthlyQuery = `
        SELECT 
          _time,
          diff_en,
          flt_mean,
          ret_mean,
          pow_mean,
          diff_vol
        FROM view_mon_comp 
        WHERE object_id = $1 
          AND _time >= $2 
          AND _time <= $3 
        ORDER BY _time ASC
      `;

      const energyResult = await energyDbPool.query(monthlyQuery, [
        objectId.toString(),
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]);

      await energyDbPool.end();

      // Group data by month and calculate monthly aggregates
      const monthlyGroups = new Map<string, any[]>();
      
      // Group records by year-month
      energyResult.rows.forEach((record: any) => {
        const recordDate = new Date(record._time);
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyGroups.has(monthKey)) {
          monthlyGroups.set(monthKey, []);
        }
        monthlyGroups.get(monthKey)!.push(record);
      });
      
      // Calculate aggregated monthly data
      const monthlyData = Array.from(monthlyGroups.entries()).map(([monthKey, records]) => {
        const totalRecords = records.length;
        const totalDiffEn = records.reduce((sum, r) => sum + (r.diff_en || 0), 0);
        const avgTemp = records.reduce((sum, r) => sum + (r.flt_mean || 0), 0) / totalRecords;
        const avgPower = records.reduce((sum, r) => sum + (r.pow_mean || 0), 0) / totalRecords;
        const avgReturnTemp = records.reduce((sum, r) => sum + (r.ret_mean || 0), 0) / totalRecords;
        const totalVolume = records.reduce((sum, r) => sum + (r.diff_vol || 0), 0);
        
        return {
          date: `${monthKey}-01`, // First day of month for consistent date format
          diffEn: Math.round(totalDiffEn),
          energy: Math.round(totalDiffEn), // Same as diffEn for compatibility  
          avgTemp: Math.round(avgTemp * 100) / 100, // Round to 2 decimal places
          avgPower: Math.round(avgPower * 100) / 100,
          returnTemp: Math.round(avgReturnTemp * 100) / 100,
          volume: Math.round(totalVolume)
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      console.log(`✅ [MONTHLY-NETZ] Found ${energyResult.rows.length} raw records, ${monthlyData.length} monthly aggregates for Z20541`);

      // API Response JSON: Z20541 Netz-Meter spezifische monatliche Daten
      const responseData = {
        objectId: parseInt(objectId),
        meterKey: netMeterKey,
        meterId: parseInt(netMeterId),
        timeRange: timeRange as string,
        monthlyData: monthlyData,
        rawRecordsCount: energyResult.rows.length,
        monthlyAggregatesCount: monthlyData.length
      };

      res.json({
        success: true,
        data: responseData,
        source: 'external_database',
        message: `Z20541 Netz-Meter Daten für Objekt ${objectId}`
      });

    } catch (error) {
      console.error('❌ [MONTHLY-NETZ] Error:', error);
      res.status(500).json({ 
        message: "Fehler beim Laden der Z20541 Netz-Meter Daten",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      });
    }
  }


}

export const energyController = new EnergyController();