import axios from "axios";
import { ConnectionPoolManager } from "../connection-pool";
import type { Pool } from "pg";

interface WeatherData {
  date: string;
  temperature_min: number;
  temperature_max: number;
  temperature_mean: number;
  postal_code: string;
  data_source: string;
}

interface PostalCodeCoords {
  lat: number;
  lon: number;
  city: string;
}

class WeatherService {
  private readonly BRIGHT_SKY_BASE_URL = 'https://api.brightsky.dev';
  private customPool: Pool | null = null;

  /**
   * Set a custom database pool (useful for standalone scripts)
   */
  setPool(pool: Pool): void {
    this.customPool = pool;
  }

  /**
   * Get the database pool (custom or default ConnectionPoolManager)
   */
  private getPool(): Pool {
    return this.customPool || ConnectionPoolManager.getInstance().getPool();
  }

  // Postal code to coordinates mapping for German cities
  // Source: OpenStreetMap / Nominatim
  private readonly postalCodeCoords: Record<string, PostalCodeCoords> = {
    // Hannover region
    '30161': { lat: 52.3759, lon: 9.7320, city: 'Hannover' },
    '30159': { lat: 52.3810, lon: 9.7390, city: 'Hannover' },
    '30167': { lat: 52.3670, lon: 9.7450, city: 'Hannover' },
    '30169': { lat: 52.3690, lon: 9.7510, city: 'Hannover' },
    '30173': { lat: 52.3890, lon: 9.7130, city: 'Hannover' },

    // Berlin region
    '10115': { lat: 52.5244, lon: 13.4105, city: 'Berlin' },
    '10117': { lat: 52.5186, lon: 13.3978, city: 'Berlin' },
    '10178': { lat: 52.5200, lon: 13.4230, city: 'Berlin' },
    '10179': { lat: 52.5150, lon: 13.4220, city: 'Berlin' },
    '10243': { lat: 52.5090, lon: 13.4690, city: 'Berlin' },

    // Hamburg region
    '20095': { lat: 53.5503, lon: 9.9993, city: 'Hamburg' },
    '20099': { lat: 53.5537, lon: 10.0067, city: 'Hamburg' },
    '20144': { lat: 53.5730, lon: 9.9850, city: 'Hamburg' },
    '22143': { lat: 53.6070, lon: 10.1230, city: 'Hamburg' },
    '22765': { lat: 53.5580, lon: 9.9360, city: 'Hamburg' },

    // München region
    '80331': { lat: 48.1372, lon: 11.5755, city: 'München' },
    '80335': { lat: 48.1421, lon: 11.5608, city: 'München' },
    '80333': { lat: 48.1405, lon: 11.5785, city: 'München' },
    '80539': { lat: 48.1420, lon: 11.5970, city: 'München' },
    '81541': { lat: 48.1170, lon: 11.5930, city: 'München' },

    // Köln region
    '50667': { lat: 50.9375, lon: 6.9603, city: 'Köln' },
    '50668': { lat: 50.9410, lon: 6.9550, city: 'Köln' },
    '50672': { lat: 50.9450, lon: 6.9630, city: 'Köln' },
    '50674': { lat: 50.9480, lon: 6.9520, city: 'Köln' },
    '50676': { lat: 50.9350, lon: 6.9420, city: 'Köln' },

    // Frankfurt am Main region
    '60311': { lat: 50.1109, lon: 8.6821, city: 'Frankfurt am Main' },
    '60313': { lat: 50.1155, lon: 8.6842, city: 'Frankfurt am Main' },
    '60308': { lat: 50.1210, lon: 8.6690, city: 'Frankfurt am Main' },
    '60316': { lat: 50.1240, lon: 8.7070, city: 'Frankfurt am Main' },
    '60594': { lat: 50.0980, lon: 8.6750, city: 'Frankfurt am Main' },

    // Stuttgart region
    '70173': { lat: 48.7758, lon: 9.1829, city: 'Stuttgart' },
    '70174': { lat: 48.7779, lon: 9.1796, city: 'Stuttgart' },
    '70176': { lat: 48.7820, lon: 9.1690, city: 'Stuttgart' },
    '70178': { lat: 48.7720, lon: 9.1730, city: 'Stuttgart' },
    '70182': { lat: 48.7650, lon: 9.1850, city: 'Stuttgart' },

    // Düsseldorf region
    '40210': { lat: 51.2277, lon: 6.7735, city: 'Düsseldorf' },
    '40211': { lat: 51.2250, lon: 6.7780, city: 'Düsseldorf' },
    '40213': { lat: 51.2213, lon: 6.7761, city: 'Düsseldorf' },
    '40215': { lat: 51.2190, lon: 6.7820, city: 'Düsseldorf' },

    // Dortmund region
    '44135': { lat: 51.5136, lon: 7.4653, city: 'Dortmund' },
    '44137': { lat: 51.5200, lon: 7.4650, city: 'Dortmund' },
    '44139': { lat: 51.5150, lon: 7.4700, city: 'Dortmund' },

    // Essen region
    '45127': { lat: 51.4556, lon: 7.0116, city: 'Essen' },
    '45128': { lat: 51.4590, lon: 7.0080, city: 'Essen' },
    '45130': { lat: 51.4520, lon: 7.0050, city: 'Essen' },

    // Leipzig region
    '04103': { lat: 51.3397, lon: 12.3731, city: 'Leipzig' },
    '04105': { lat: 51.3450, lon: 12.3820, city: 'Leipzig' },
    '04109': { lat: 51.3320, lon: 12.3850, city: 'Leipzig' },

    // Dresden region
    '01067': { lat: 51.0504, lon: 13.7373, city: 'Dresden' },
    '01069': { lat: 51.0470, lon: 13.7310, city: 'Dresden' },
    '01097': { lat: 51.0630, lon: 13.7430, city: 'Dresden' },

    // Bremen region
    '28195': { lat: 53.0793, lon: 8.8017, city: 'Bremen' },
    '28199': { lat: 53.0750, lon: 8.8100, city: 'Bremen' },
    '28203': { lat: 53.0820, lon: 8.7850, city: 'Bremen' },

    // Nürnberg region
    '90402': { lat: 49.4521, lon: 11.0767, city: 'Nürnberg' },
    '90403': { lat: 49.4480, lon: 11.0710, city: 'Nürnberg' },
    '90408': { lat: 49.4430, lon: 11.0630, city: 'Nürnberg' },
  };

  /**
   * Fetch historical weather data from Bright Sky API (DWD)
   * @param postalCode - German postal code (PLZ)
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of daily weather data (temperature min/max/mean)
   */
  async getHistoricalWeather(
    postalCode: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]> {
    const coords = this.getCoordinatesForPostalCode(postalCode);

    if (!coords) {
      console.warn(`⚠️ No coordinates found for postal code ${postalCode}, using default (Berlin)`);
      // Fallback to Berlin if postal code not found
      return this.getHistoricalWeather('10115', startDate, endDate);
    }

    try {
      console.log(`🌡️ Fetching weather data from Bright Sky API for ${coords.city} (${postalCode})`);
      console.log(`   Date range: ${startDate} to ${endDate}`);
      console.log(`   Coordinates: ${coords.lat}, ${coords.lon}`);

      const response = await axios.get(`${this.BRIGHT_SKY_BASE_URL}/weather`, {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          date: startDate,
          last_date: endDate
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.data || !response.data.weather) {
        throw new Error('Invalid response from Bright Sky API');
      }

      console.log(`✅ Received ${response.data.weather.length} hourly records from Bright Sky`);

      // Aggregate hourly data into daily min/max/mean
      const dailyData = this.aggregateDailyData(response.data.weather, postalCode, coords.city);

      console.log(`📊 Aggregated into ${dailyData.length} daily records`);

      return dailyData;

    } catch (error) {
      console.error('❌ Error fetching weather data from Bright Sky:', error);
      if (axios.isAxiosError(error)) {
        console.error('   Response status:', error.response?.status);
        console.error('   Response data:', error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Get coordinates for a German postal code
   * @param postalCode - German postal code (PLZ)
   * @returns Coordinates and city name, or null if not found
   */
  private getCoordinatesForPostalCode(postalCode: string): PostalCodeCoords | null {
    // Direct lookup
    if (this.postalCodeCoords[postalCode]) {
      return this.postalCodeCoords[postalCode];
    }

    // Fallback: Use regional center for postal code prefix
    const prefix = postalCode.substring(0, 2);
    const regionalFallbacks: Record<string, string> = {
      // Hannover and Niedersachsen
      '30': '30161', // Hannover
      '31': '30161', // Hannover region
      '28': '28195', // Bremen

      // Berlin and Brandenburg
      '10': '10115', // Berlin
      '12': '10115', // Berlin
      '13': '10115', // Berlin
      '14': '10115', // Berlin (Spandau, Potsdam)

      // Hamburg and Schleswig-Holstein
      '20': '20095', // Hamburg
      '21': '20095', // Hamburg region
      '22': '20095', // Hamburg

      // Bayern (Bavaria)
      '80': '80331', // München
      '81': '80331', // München
      '82': '80331', // München region
      '90': '90402', // Nürnberg
      '91': '90402', // Nürnberg region

      // Nordrhein-Westfalen
      '40': '40210', // Düsseldorf
      '41': '40210', // Düsseldorf region
      '44': '44135', // Dortmund
      '45': '45127', // Essen
      '46': '45127', // Essen region
      '47': '45127', // Essen/Duisburg region
      '50': '50667', // Köln
      '51': '50667', // Köln region
      '52': '50667', // Aachen region

      // Hessen
      '60': '60311', // Frankfurt am Main
      '61': '60311', // Frankfurt region
      '64': '60311', // Darmstadt region

      // Baden-Württemberg
      '70': '70173', // Stuttgart
      '71': '70173', // Stuttgart region
      '72': '70173', // Reutlingen region

      // Sachsen (Saxony)
      '01': '01067', // Dresden
      '02': '01067', // Sachsen region
      '04': '04103', // Leipzig
    };

    const fallbackPostalCode = regionalFallbacks[prefix];
    if (fallbackPostalCode && this.postalCodeCoords[fallbackPostalCode]) {
      console.log(`ℹ️ Using regional fallback: ${postalCode} → ${fallbackPostalCode}`);
      return this.postalCodeCoords[fallbackPostalCode];
    }

    return null;
  }

  /**
   * Aggregate hourly temperature data into daily min/max/mean
   * @param hourlyData - Array of hourly weather data from Bright Sky
   * @param postalCode - German postal code
   * @param city - City name
   * @returns Array of daily weather data
   */
  private aggregateDailyData(
    hourlyData: any[],
    postalCode: string,
    city: string
  ): WeatherData[] {
    const dailyMap = new Map<string, { temperatures: number[] }>();

    // Group temperatures by day
    hourlyData.forEach(hour => {
      const date = hour.timestamp.split('T')[0]; // Extract YYYY-MM-DD

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { temperatures: [] });
      }

      // Bright Sky provides temperature in °C
      if (hour.temperature !== null && hour.temperature !== undefined) {
        dailyMap.get(date)!.temperatures.push(hour.temperature);
      }
    });

    // Calculate daily min/max/mean
    const dailyData: WeatherData[] = [];

    dailyMap.forEach((data, date) => {
      const temps = data.temperatures;

      if (temps.length > 0) {
        dailyData.push({
          date,
          temperature_min: Math.round(Math.min(...temps) * 10) / 10, // Round to 1 decimal
          temperature_max: Math.round(Math.max(...temps) * 10) / 10,
          temperature_mean: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
          postal_code: postalCode,
          data_source: 'DWD (Bright Sky)'
        });
      }
    });

    // Sort by date ascending
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    return dailyData;
  }

  /**
   * Import historical weather data into database
   * @param postalCode - German postal code
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Number of records imported
   */
  async importHistoricalData(
    postalCode: string,
    startDate: string,
    endDate: string
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const weatherData = await this.getHistoricalWeather(postalCode, startDate, endDate);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const pool = this.getPool();

    for (const day of weatherData) {
      try {
        // Insert with ON CONFLICT DO NOTHING to skip duplicates
        const result = await pool.query(`
          INSERT INTO daily_outdoor_temperatures
            (date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (postal_code, date) DO NOTHING
          RETURNING id
        `, [
          day.date,
          day.postal_code,
          this.getCoordinatesForPostalCode(day.postal_code)?.city || 'Unknown',
          day.temperature_min,
          day.temperature_max,
          day.temperature_mean,
          day.data_source
        ]);

        if (result.rows.length > 0) {
          imported++;
          console.log(`   ✅ ${day.date}: ${day.temperature_mean}°C (${day.temperature_min}°C - ${day.temperature_max}°C)`);
        } else {
          skipped++;
          console.log(`   ⏭️ ${day.date}: bereits vorhanden`);
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Error importing ${day.date}:`, error);
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Get all unique postal codes from objects table
   * @returns Array of unique postal codes
   */
  async getPostalCodesFromObjects(): Promise<string[]> {
    const pool = this.getPool();

    const result = await pool.query(`
      SELECT DISTINCT postal_code
      FROM objects
      WHERE postal_code IS NOT NULL
        AND postal_code != ''
      ORDER BY postal_code
    `);

    return result.rows.map(row => row.postal_code);
  }

  /**
   * Import weather data for all postal codes in objects table
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Summary of import results
   */
  async importDataForAllPostalCodes(
    startDate: string,
    endDate: string
  ): Promise<{
    postalCodes: number;
    totalImported: number;
    totalSkipped: number;
    totalErrors: number;
  }> {
    const postalCodes = await this.getPostalCodesFromObjects();

    console.log(`\n📍 Found ${postalCodes.length} unique postal codes in objects table`);
    console.log(`   ${postalCodes.join(', ')}\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const postalCode of postalCodes) {
      console.log(`\n🌡️ Processing postal code: ${postalCode}`);

      try {
        const stats = await this.importHistoricalData(postalCode, startDate, endDate);
        totalImported += stats.imported;
        totalSkipped += stats.skipped;
        totalErrors += stats.errors;

        console.log(`   Summary: ${stats.imported} imported, ${stats.skipped} skipped, ${stats.errors} errors`);

        // Rate limiting: Wait 1 second between postal codes to respect Bright Sky API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Failed to import data for ${postalCode}:`, error);
        totalErrors++;
      }
    }

    return {
      postalCodes: postalCodes.length,
      totalImported,
      totalSkipped,
      totalErrors
    };
  }
}

export const weatherService = new WeatherService();
