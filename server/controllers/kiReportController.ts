import { Request, Response } from "from "express"";
import { storage } from "from "../storage"";
import { createDatabaseError } from "from "../middleware/error"";
import { ConnectionPoolManager } from "../connection-pool";

export class KIReportController {
  constructor(private storage: any) {}

  // POST /api/energy-balance/:objectId - Energiebilanz-Berechnung
  calculateEnergyBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { objectId } = req.params;
      const { timeRange = '2024' } = req.body;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔋 [ENERGY-BALANCE] Calculating for object ${objectId}, timeRange: ${timeRange}, user: ${user.id}`);

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

        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }
      
      const object = objectResult.rows[0];


      // Check permissions (mit mandantAccess)
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(object.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      // Bestimme Datumsbereich basierend auf timeRange
      let startDate: string;
      let endDate: string;

      if (timeRange === '2024') {
        startDate = '2024-01-01';
        endDate = '2024-12-31';
      } else if (timeRange === '2023') {
        startDate = '2023-01-01';
        endDate = '2023-12-31';
      } else if (timeRange === 'last-365-days') {
        const today = new Date();
        const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        startDate = oneYearAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else {
        // Fallback für andere timeRanges
        startDate = '2024-01-01';
        endDate = '2024-12-31';
      }

      // Hole monatliche Verbrauchsdaten für das Objekt
      const monthlyData = await this.storage.getMonthlyConsumptionData(
        parseInt(objectId),
        timeRange as 'last-365-days' | 'last-year' | 'year-before-last'
      );

      console.log(`📊 [ENERGY-BALANCE] Found monthly data for ${Object.keys(monthlyData || {}).length} meters`);

      // Berechne Energiebilanz
      let netzVerbrauch = 0;
      let gesamtErzeugung = 0;

      if (monthlyData) {
        // Sammle Netz-Verbrauchsdaten (Z2054x)
        Object.keys(monthlyData).forEach(key => {
          if (key.match(/^Z2054\d*/)) {
            const meterData = monthlyData[key];
            if (meterData?.monthlyData) {
              const verbrauch = meterData.monthlyData.reduce((sum: number, data: any) => 
                sum + Math.abs(data.diffEn || 0), 0
              ) / 1000; // Convert to kWh
              netzVerbrauch += verbrauch;
            }
          }
        });

        // Sammle Erzeugungsdaten (Wärmepumpe Z2024x, Kessel Z2014x)
        Object.keys(monthlyData).forEach(key => {
          if (key.match(/^Z202[4|2]\d*/) || key.match(/^Z2014\d*/)) {
            const meterData = monthlyData[key];
            if (meterData?.monthlyData) {
              const erzeugung = meterData.monthlyData.reduce((sum: number, data: any) => 
                sum + Math.abs(data.diffEn || 0), 0
              ) / 1000; // Convert to kWh
              gesamtErzeugung += erzeugung;
            }
          }
        });
      }

      // Berechne Verluste
      const verlusteAbs = Math.max(0, gesamtErzeugung - netzVerbrauch);
      const verlusteInProzent = gesamtErzeugung > 0 ? (verlusteAbs / gesamtErzeugung * 100) : 0;

      // Bewertung der Energiebilanz
      let bewertung: string;
      let farbKlasse: string;

      if (verlusteInProzent < 10) {
        bewertung = "Excellent → Sehr effiziente Energienutzung";
        farbKlasse = "text-green-700";
      } else if (verlusteInProzent < 20) {
        bewertung = "Gut → Effiziente Energienutzung";
        farbKlasse = "text-blue-700";
      } else if (verlusteInProzent < 30) {
        bewertung = "Kontrolle → Mögliche Optimierung";
        farbKlasse = "text-orange-700";
      } else {
        bewertung = "Kritisch → Hohe Energieverluste";
        farbKlasse = "text-red-700";
      }

      const result = {
        netzVerbrauch: Math.round(netzVerbrauch),
        gesamtErzeugung: Math.round(gesamtErzeugung),
        verlusteAbs: Math.round(verlusteAbs),
        verlusteInProzent: Math.round(verlusteInProzent * 100) / 100,
        bewertung,
        farbKlasse,
        zeitbereich: timeRange
      };

      console.log(`✅ [ENERGY-BALANCE] Calculation complete:`, result);

      res.json(result);
    } catch (error) {
      console.error('❌ [ENERGY-BALANCE] Error calculating energy balance:', error);
      throw createDatabaseError('Fehler bei der Energiebilanz-Berechnung', error);
    }
  };

  // GET /api/yearly-summary/:objectId - Jahreszusammenfassung
  getYearlySummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { objectId } = req.params;
      const { year } = req.query;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`📈 [YEARLY-SUMMARY] Fetching for object ${objectId}, year: ${year || 'current'}, user: ${user.id}`);

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

        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }
      
      const object = objectResult.rows[0];


      // Check permissions (mit mandantAccess)
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(object.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

      // Bestimme timeRange basierend auf Jahr
      let timeRange: 'last-365-days' | 'last-year' | 'year-before-last';
      const currentYear = new Date().getFullYear();
      
      if (targetYear === currentYear) {
        timeRange = 'last-365-days';
      } else if (targetYear === currentYear - 1) {
        timeRange = 'last-year';
      } else if (targetYear === currentYear - 2) {
        timeRange = 'year-before-last';
      } else {
        timeRange = 'last-year'; // Fallback
      }

      // Hole monatliche Verbrauchsdaten
      const monthlyData = await this.storage.getMonthlyConsumptionData(
        parseInt(objectId),
        timeRange
      );

      console.log(`📊 [YEARLY-SUMMARY] Found monthly data for ${Object.keys(monthlyData || {}).length} meters`);

      // Berechne Jahreszusammenfassung
      const summary = {
        year: targetYear,
        objectId: parseInt(objectId),
        objectName: object.name,
        totalConsumption: 0,
        averageMonthly: 0,
        peakMonth: '',
        peakValue: 0,
        efficiency: 0,
        meterCount: 0,
        dataAvailable: false
      };

      if (monthlyData && Object.keys(monthlyData).length > 0) {
        let totalKWh = 0;
        let monthlyValues: { [month: string]: number } = {};
        let meterCount = 0;

        // Sammle alle Verbrauchsdaten
        Object.keys(monthlyData).forEach(key => {
          if (key === 'ZLOGID') return;
          
          const meterData = monthlyData[key];
          if (meterData?.monthlyData) {
            meterCount++;
            meterData.monthlyData.forEach((data: any) => {
              const monthKey = new Date(data.date).toLocaleDateString('de-DE', { month: 'short' });
              const kWh = Math.abs(data.diffEn || 0) / 1000;
              totalKWh += kWh;
              
              if (!monthlyValues[monthKey]) {
                monthlyValues[monthKey] = 0;
              }
              monthlyValues[monthKey] += kWh;
            });
          }
        });

        // Finde Peak-Monat
        let peakMonth = '';
        let peakValue = 0;
        Object.entries(monthlyValues).forEach(([month, value]) => {
          if (value > peakValue) {
            peakValue = value;
            peakMonth = month;
          }
        });

        // Berechne Effizienz basierend auf Objektfläche
        const efficiency = object.objdata?.area && object.objdata.area > 0 
          ? Math.round(totalKWh / object.objdata.area) 
          : 0;

        summary.totalConsumption = Math.round(totalKWh);
        summary.averageMonthly = Math.round(totalKWh / 12);
        summary.peakMonth = peakMonth;
        summary.peakValue = Math.round(peakValue);
        summary.efficiency = efficiency;
        summary.meterCount = meterCount;
        summary.dataAvailable = totalKWh > 0;
      }

      console.log(`✅ [YEARLY-SUMMARY] Summary calculated:`, summary);

      res.json({
        success: true,
        data: summary,
        objectId: parseInt(objectId),
        year: targetYear
      });
    } catch (error) {
      console.error('❌ [YEARLY-SUMMARY] Error fetching yearly summary:', error);
      res.status(500).json({ message: "Fehler beim Laden der Jahreszusammenfassung" });
    }
  };

  // GET /api/monthly-consumption-multi-year/:objectId - Multi-Jahr Monatsdaten für KI-Bewertung
  getMonthlyConsumptionMultiYear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { objectId } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`📊 [MULTI-YEAR-CONSUMPTION] Fetching for object ${objectId}, user: ${user.id}`);

      // Validate access to the object
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
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }
      
      const object = objectResult.rows[0];

      // Check permissions
      if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(object.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      // Lade alle drei Zeitbereiche parallel
      const [data365Days, dataLastYear, dataYearBefore] = await Promise.all([
        this.storage.getMonthlyConsumptionData(parseInt(objectId), 'last-365-days'),
        this.storage.getMonthlyConsumptionData(parseInt(objectId), 'last-year'),
        this.storage.getMonthlyConsumptionData(parseInt(objectId), 'year-before-last')
      ]);

      const result = {
        'last-365-days': data365Days || {},
        'last-year': dataLastYear || {},
        'year-before-last': dataYearBefore || {}
      };

      console.log(`✅ [MULTI-YEAR-CONSUMPTION] Data loaded for ${Object.keys(result['last-365-days'] || {}).length} meters across 3 time ranges`);

      res.json(result);
    } catch (error) {
      console.error('❌ [MULTI-YEAR-CONSUMPTION] Error fetching multi-year consumption:', error);
      res.status(500).json({ message: "Fehler beim Laden der Multi-Jahr-Verbrauchsdaten" });
    }
  };
}

// Export controller instance
export const kiReportController = new KIReportController(storage);