import { Request, Response } from "express";
import { storage } from "../storage";
import { ConnectionPoolManager } from "../connection-pool";
import { insertDailyOutdoorTemperatureSchema } from "../../shared/schema";

class WeatherController {
  /**
   * API: GET /api/outdoor-temperatures
   * Parameter: ?postalCode=30161&startDate=2024-01-01&endDate=2024-12-31&resolution=w|m|d
   * Zweck: Lädt tägliche Außentemperaturen mit Filter-Optionen für Postleitzahl und Zeitbereich
   * Auth: Keine Authentifizierung erforderlich
   * Rückgabe: Array von Temperaturdaten mit {date, temperatureMin, temperatureMax, temperatureMean}
   * DB-Zugriff: storage.getDailyOutdoorTemperatures() mit Auflösung (wöchentlich/monatlich/täglich)
   */
  async getOutdoorTemperatures(req: Request, res: Response) {
    try {
      const { postalCode, startDate, endDate, resolution } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const resolutionParam = (resolution as string) || 'w'; // Default: wöchentlich
      
      const temperatures = await storage.getDailyOutdoorTemperatures(
        postalCode as string,
        start,
        end,
        resolutionParam
      );
      
      res.json(temperatures);
    } catch (error) {
      console.error('Error fetching outdoor temperatures:', error);
      res.status(500).json({ message: 'Failed to fetch outdoor temperatures' });
    }
  }

  /**
   * API: GET /api/outdoor-temperatures/:id
   * Parameter: :id (URL) - Eindeutige Temperatur-Datensatz ID
   * Zweck: Lädt spezifischen Außentemperatur-Datensatz nach ID
   * Auth: Keine Authentifizierung erforderlich
   * Rückgabe: Einzelner Temperaturdatensatz oder 404 wenn nicht gefunden
   * DB-Zugriff: storage.getDailyOutdoorTemperature()
   */
  async getOutdoorTemperature(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const temperature = await storage.getDailyOutdoorTemperature(id);
      
      if (!temperature) {
        return res.status(404).json({ message: 'Temperature record not found' });
      }
      
      res.json(temperature);
    } catch (error) {
      console.error('Error fetching outdoor temperature:', error);
      res.status(500).json({ message: 'Failed to fetch outdoor temperature' });
    }
  }

  /**
   * API: POST /api/outdoor-temperatures
   * Parameter: Body {date, postalCode, city, temperatureMin, temperatureMax, temperatureMean, dataSource}
   * Zweck: Erstellt neuen Außentemperatur-Datensatz (temperature-only, GEG 2024 konform)
   * Auth: Keine Authentifizierung erforderlich
   * Rückgabe: Erstellter Temperaturdatensatz mit ID
   * DB-Zugriff: storage.createDailyOutdoorTemperature() mit Schema-Validierung
   * Standards: GEG 2024, DIN V 18599 (Heizgradtage), VDI 3807 (Witterungsbereinigung)
   */
  async createOutdoorTemperature(req: Request, res: Response) {
    try {
      const validatedData = insertDailyOutdoorTemperatureSchema.parse(req.body);
      const newTemperature = await storage.createDailyOutdoorTemperature(validatedData);
      res.status(201).json(newTemperature);
    } catch (error) {
      console.error('Error creating outdoor temperature:', error);
      res.status(500).json({ message: 'Failed to create outdoor temperature' });
    }
  }

  // PUT /api/outdoor-temperatures/:id - Außentemperatur aktualisieren
  async updateOutdoorTemperature(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDailyOutdoorTemperatureSchema.partial().parse(req.body);
      const updatedTemperature = await storage.updateDailyOutdoorTemperature(id, validatedData);
      res.json(updatedTemperature);
    } catch (error) {
      console.error('Error updating outdoor temperature:', error);
      res.status(500).json({ message: 'Failed to update outdoor temperature' });
    }
  }

  // DELETE /api/outdoor-temperatures/:id - Außentemperatur löschen
  async deleteOutdoorTemperature(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDailyOutdoorTemperature(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting outdoor temperature:', error);
      res.status(500).json({ message: 'Failed to delete outdoor temperature' });
    }
  }

  /**
   * API: POST /api/outdoor-temperatures/restore-climate-data
   * DEPRECATED: Use Bright Sky API integration instead
   * This endpoint contained hardcoded test data and is replaced by real-time API integration
   */
  async restoreClimateData(req: Request, res: Response) {
    res.status(410).json({
      success: false,
      message: 'This endpoint is deprecated. Please use Bright Sky API integration for real weather data.',
      recommendation: 'Implement weatherService.ts with Bright Sky API as per /tmp/WEATHER_DATA_IMPLEMENTATION_RECOMMENDATION.md'
    });
  }

  // GET /api/outdoor-temperatures/postal-code/:postalCode - Temperaturen für spezielle PLZ (ohne Auth für Chart-Zugriff)
  async getTemperaturesByPostalCode(req: Request, res: Response) {
    try {
      let { postalCode } = req.params;
      const { startDate, endDate, resolution } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const resolutionParam = (resolution as string) || 'w'; // Default: wöchentlich (d=täglich, w=wöchentlich, m=monatlich)
      
      console.log(`🔍 Temperaturdaten-Anfrage: PLZ=${postalCode}, resolution=${resolutionParam}, startDate=${startDate}, endDate=${endDate}`);
      
      // Versuche ursprüngliche PLZ
      let temperatures = await storage.getDailyOutdoorTemperatures(
        postalCode,
        start,
        end,
        resolutionParam
      );
      
      // Intelligenter Stadt-basierter PLZ-Fallback für Hannover
      if (temperatures.length === 0) {
        // Für deutsche Städte: Hannover → PLZ 30161 (beste Temperaturdaten)
        if (postalCode.startsWith('30') || postalCode.startsWith('31')) {
          console.log(`🏢 Hannover-Region erkannt für PLZ ${postalCode} → verwende PLZ 30161 (beste Temperaturdaten)`);
          const fallbackPostalCode = "30161";
          temperatures = await storage.getDailyOutdoorTemperatures(
            fallbackPostalCode,
            start,
            end,
            resolutionParam
          );
          console.log(`✅ Hannover-Fallback: ${temperatures.length} Datensätze für PLZ 30161`);
        }
      }
      
      console.log(`📊 Gefundene Temperaturdaten: ${temperatures.length} Datensätze`);
      res.json(temperatures);
    } catch (error) {
      console.error('Error fetching temperatures for postal code:', error);
      res.status(500).json({ message: 'Failed to fetch temperatures for postal code' });
    }
  }

  // GET /api/outdoor-temperatures/postal-code/:postalCode/latest - Neueste Temperatur für PLZ (ohne Auth für Chart-Zugriff)
  async getLatestTemperatureByPostalCode(req: Request, res: Response) {
    try {
      const { postalCode } = req.params;
      const temperature = await storage.getLatestTemperatureForPostalCode(postalCode);
      
      if (!temperature) {
        return res.status(404).json({ message: 'No temperature data found for this postal code' });
      }
      
      res.json(temperature);
    } catch (error) {
      console.error('Error fetching latest temperature:', error);
      res.status(500).json({ message: 'Failed to fetch latest temperature' });
    }
  }

  // GET /api/outdoor-temperatures/objects - Temperaturen für Objekt-PLZ
  async getTemperaturesForObjects(req: Request, res: Response) {
    try {
      const { objectIds } = req.query;
      
      const ids = objectIds ? (objectIds as string).split(',').map(id => parseInt(id)) : undefined;
      const temperatures = await storage.getTemperaturesForObjectPostalCodes(ids);
      
      res.json(temperatures);
    } catch (error) {
      console.error('Error fetching temperatures for objects:', error);
      res.status(500).json({ message: 'Failed to fetch temperatures for objects' });
    }
  }

  // POST /api/import-2023-climate - Import 2023 climate data from Neon-DB to Portal-DB
  async import2023Climate(req: Request, res: Response) {
    try {
      console.log('📊 Starte Import von 2023-Klimadaten in Portal-DB...');
      
      // 1. Hole 2023-Daten aus Neon-DB über storage
      const neonData = await storage.getNeon2023ClimateData();
      
      console.log(`📊 ${neonData.length} Datensätze aus Neon-DB gelesen`);
      
      if (neonData.length === 0) {
        return res.status(404).json({ error: 'Keine 2023-Daten in Neon-DB gefunden' });
      }
      
      // 2. Portal-DB Pool über ConnectionPoolManager
      const poolManager = ConnectionPoolManager.getInstance();
      const portalPool = poolManager.getPool();
      
      // 3. Prüfe/erstelle Tabelle in Portal-DB
      try {
        await portalPool.query('SELECT 1 FROM daily_outdoor_temperatures LIMIT 1');
        console.log('✅ Portal-DB Tabelle existiert');
      } catch (error) {
        console.log('📝 Erstelle Tabelle in Portal-DB...');
        await portalPool.query(`
          CREATE TABLE daily_outdoor_temperatures (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            postal_code VARCHAR(10) NOT NULL,
            city VARCHAR(100),
            temperature_min DECIMAL(4,1),
            temperature_max DECIMAL(4,1),
            temperature_mean DECIMAL(4,1),
            humidity DECIMAL(4,1),
            pressure DECIMAL(6,1),
            wind_speed DECIMAL(4,1),
            wind_direction VARCHAR(3),
            precipitation DECIMAL(5,1),
            data_source VARCHAR(100) DEFAULT 'weather_api',
            data_quality VARCHAR(20) DEFAULT 'good',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
      }
      
      // 4. Lösche existierende 2023-Daten für Hannover
      const deleteResult = await portalPool.query(`
        DELETE FROM daily_outdoor_temperatures 
        WHERE postal_code = '30161' 
        AND EXTRACT(YEAR FROM date) = 2023
      `);
      console.log(`🗑️ ${deleteResult.rowCount} alte 2023-Datensätze gelöscht`);
      
      // 5. Importiere alle 2023-Daten
      let importedCount = 0;
      for (const row of neonData) {
        await portalPool.query(`
          INSERT INTO daily_outdoor_temperatures (
            date, postal_code, city, 
            temperature_min, temperature_max, temperature_mean,
            data_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          row.date,
          row.postalCode,
          row.city,
          row.temperatureMin,
          row.temperatureMax,
          row.temperatureMean,
          'neon_import_2023'
        ]);
        importedCount++;
      }
      
      console.log(`✅ ${importedCount} Datensätze in Portal-DB importiert`);
      
      // 6. Finale Statistik
      const statsResult = await portalPool.query(`
        SELECT 
          COUNT(*) as total_count,
          MIN(date) as earliest_date,
          MAX(date) as latest_date,
          ROUND(AVG(temperature_mean::numeric), 1) as avg_temp
        FROM daily_outdoor_temperatures 
        WHERE postal_code = '30161' AND EXTRACT(YEAR FROM date) = 2023
      `);
      
      const stats = statsResult.rows[0];
      
      res.json({
        success: true,
        imported: importedCount,
        stats: {
          totalCount: stats.total_count,
          dateRange: `${stats.earliest_date} bis ${stats.latest_date}`,
          avgTemp: `${stats.avg_temp}°C`
        }
      });
      
    } catch (error: unknown) {
      console.error('❌ Import-Fehler:', error);
      res.status(500).json({ error: 'Import fehlgeschlagen', details: error instanceof Error ? error.message : 'Unbekannter Fehler' });
    }
  }
}

export const weatherController = new WeatherController();