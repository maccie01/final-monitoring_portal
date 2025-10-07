import { Request, Response } from "from "express"";
import { storage } from "from "../storage"";
import { createDatabaseError } from "from "../middleware/error"";

// Interface für Threshold-Konfigurationen
interface ThresholdSettings {
  id?: number;
  keyName?: string;
  key_name?: string;
  value?: {
    thresholds: {
      critical: { vlValue: number; rlValue: number };
      warning: { vlValue: number; rlValue: number };
      normal: { vlValue: number; rlValue: number };
    };
  };
}

// Interface für Sensor-Analyse-Ergebnisse
interface SensorAnalysis {
  sensorId: string;
  vlTemp: number;
  rlTemp: number;
  vlStatus: 'critical' | 'warning' | 'normal';
  rlStatus: 'critical' | 'warning' | 'normal';
  overallStatus: 'critical' | 'warning' | 'normal';
}

// Interface für Temperaturanalyse-Ergebnisse
interface TemperatureAnalysisResult {
  offline?: boolean;
  reason?: string;
  lastUpdate?: string | null;
  overallStatus?: 'critical' | 'warning' | 'normal';
  sensors?: SensorAnalysis[];
  configSource?: string;
  thresholds?: any;
}

export class TemperatureController {
  constructor(private storage: any) {}

  // GET /api/settings/thresholds - Schwellwerte abrufen
  getThresholds = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 [THRESHOLDS] Fetching temperature thresholds...');
      
      // Hole alle Settings mit Kategorie 'thresholds'
      const allSettings = await this.storage.getSettings();
      const thresholds = allSettings.filter((setting: any) => 
        setting.category === 'thresholds' && (
          setting.key_name?.includes('netzwaechter') || 
          setting.keyName?.includes('netzwaechter')
        )
      );
      
      console.log(`✅ [THRESHOLDS] Found ${thresholds.length} threshold configurations`);
      
      res.json(thresholds);
    } catch (error) {
      console.error('Error fetching thresholds:', error as Error);
      throw createDatabaseError("Failed to fetch thresholds");
    }
  };

  // GET /api/temperature-analysis/:objectId - Temperaturanalyse für einzelnes Objekt
  analyzeObjectTemperature = async (req: Request, res: Response): Promise<void> => {
    try {
      const objectId = parseInt(req.params.objectId);
      if (isNaN(objectId)) {
        res.status(400).json({ error: 'Invalid object ID' });
        return;
      }

      console.log(`🔍 [TEMP-ANALYSIS] Analyzing temperature for object: ${objectId}`);

      // Hole Objekt-Daten
      const objects = await this.storage.getObjectsByObjectId([objectId]);
      if (objects.length === 0) {
        res.status(404).json({ error: 'Object not found' });
        return;
      }

      const object = objects[0];

      // Hole Threshold-Konfigurationen
      const allSettings = await this.storage.getSettings();
      const temperatureThresholds = allSettings.filter((setting: any) => 
        setting.category === 'thresholds' && (
          setting.key_name?.includes('netzwaechter') || 
          setting.keyName?.includes('netzwaechter')
        )
      );

      // Führe Temperaturanalyse durch
      const analysis = this.performTemperatureAnalysis(object, temperatureThresholds);

      console.log(`✅ [TEMP-ANALYSIS] Analysis completed for object ${objectId}: ${analysis.overallStatus || 'offline'}`);

      res.json({
        objectId,
        objectName: object.name,
        analysis
      });
    } catch (error) {
      console.error('Error analyzing temperature:', error);
      throw createDatabaseError("Failed to analyze temperature");
    }
  };

  // Core-Funktion: analyzeObjectTemperature (basierend auf Dokumentation)
  private performTemperatureAnalysis(
    obj: any, 
    thresholds: ThresholdSettings[]
  ): TemperatureAnalysisResult {
    
    // 1. Threshold-Konfiguration bestimmen
    let objectThresholds = null;
    let configSource = 'netzwaechter_0'; // Fallback

    // Priorität: objanlage.thresholds > netzwaechter_0
    if (obj.objanlage?.thresholds) {
      const found = thresholds.find(t => 
        (t.keyName || t.key_name) === obj.objanlage.thresholds
      );
      if (found) {
        objectThresholds = found.value?.thresholds;
        configSource = obj.objanlage.thresholds;
      }
    }

    // Fallback auf Standard-Konfiguration
    if (!objectThresholds) {
      const defaultConfig = thresholds.find(t => 
        (t.keyName || t.key_name) === 'netzwaechter_0'
      );
      if (defaultConfig) {
        objectThresholds = defaultConfig.value?.thresholds;
      }
    }

    // 2. Offline-Status prüfen
    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;

    if (!hasFltemp && !hasRttemp) {
      return { 
        offline: true, 
        reason: 'Keine Temperatur-Daten',
        lastUpdate: null 
      };
    }

    // Datenaktualität prüfen (24h-Regel)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const flIsOld = hasFltemp && 
      new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && 
      new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;

    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { 
        offline: true, 
        reason: 'Daten älter als 24h',
        lastUpdate: hasFltemp ? obj.fltemp.updateTime : obj.rttemp.updateTime
      };
    }

    // 3. Temperaturanalyse pro Sensor
    let critical = false;
    let warning = false;
    const sensors: SensorAnalysis[] = [];

    // Analysiere alle verfügbaren Sensoren
    if (obj.fltemp) {
      Object.keys(obj.fltemp).forEach(sensorId => {
        if (sensorId === 'updateTime') return;

        const vlTemp = obj.fltemp[sensorId];
        const rlTemp = obj.rttemp?.[sensorId];

        if (vlTemp !== undefined && rlTemp !== undefined) {
          const vlStatus = this.getTemperatureStatus(vlTemp, objectThresholds, 'vl');
          const rlStatus = this.getTemperatureStatus(rlTemp, objectThresholds, 'rl');

          const sensorStatus = 
            vlStatus === 'critical' || rlStatus === 'critical' ? 'critical' :
            vlStatus === 'warning' || rlStatus === 'warning' ? 'warning' : 'normal';

          sensors.push({
            sensorId,
            vlTemp,
            rlTemp,
            vlStatus,
            rlStatus,
            overallStatus: sensorStatus
          });

          if (sensorStatus === 'critical') critical = true;
          if (sensorStatus === 'warning') warning = true;
        }
      });
    }

    // 4. Gesamtstatus bestimmen
    const overallStatus = critical ? 'critical' : warning ? 'warning' : 'normal';

    return {
      offline: false,
      overallStatus,
      sensors,
      configSource,
      thresholds: objectThresholds,
      lastUpdate: obj.fltemp?.updateTime || obj.rttemp?.updateTime
    };
  }

  // Hilfsfunktion: getTemperatureStatus
  private getTemperatureStatus(
    temperature: number,
    thresholds: any,
    type: 'vl' | 'rl'
  ): 'critical' | 'warning' | 'normal' {
    
    if (!thresholds) return 'normal';

    if (type === 'vl') {
      // Vorlauftemperatur: Überschreitung ist kritisch
      if (temperature > thresholds.critical?.vlValue) return 'critical';
      if (temperature > thresholds.warning?.vlValue) return 'warning';
    } else {
      // Rücklauftemperatur: Unterschreitung ist kritisch
      if (temperature < thresholds.critical?.rlValue) return 'critical';
      if (temperature < thresholds.warning?.rlValue) return 'warning';
    }

    return 'normal';
  }

  // GET /api/temperature-analysis - Temperaturanalyse für alle Objekte
  analyzeAllObjectsTemperature = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 [TEMP-ANALYSIS-ALL] Analyzing temperature for all objects...');

      // Get user information for mandant filtering
      const user = (req as any).user || (req.session as any)?.user;
      const userId = user?.id;
      const userRole = user?.role;
      const userMandantId = user?.mandantId;
      const isAdmin = userRole === 'admin';

      // Hole alle Objekte basierend auf Benutzerberechtigungen
      let objects;
      if (isAdmin) {
        // Admin sieht alle Objekte
        objects = await this.storage.getObjects(undefined, true);
      } else {
        // Normale Benutzer sehen nur ihre Mandanten-Objekte
        const accessibleMandants = userMandantId ? [userMandantId] : [];
        objects = await this.storage.getObjects(accessibleMandants, false);
      }

      // Hole Threshold-Konfigurationen
      const allSettings = await this.storage.getSettings();
      const temperatureThresholds = allSettings.filter((setting: any) => 
        setting.category === 'thresholds' && (
          setting.key_name?.includes('netzwaechter') || 
          setting.keyName?.includes('netzwaechter')
        )
      );

      // Führe Temperaturanalyse für alle Objekte durch
      const analyses = objects.map((obj: any) => ({
        objectId: obj.objectid,
        objectName: obj.name,
        mandantId: obj.mandantId,
        analysis: this.performTemperatureAnalysis(obj, temperatureThresholds)
      }));

      // Kategorisiere Ergebnisse
      const summary = {
        total: analyses.length,
        critical: analyses.filter((a: any) => a.analysis.overallStatus === 'critical').length,
        warning: analyses.filter((a: any) => a.analysis.overallStatus === 'warning').length,
        normal: analyses.filter((a: any) => a.analysis.overallStatus === 'normal').length,
        offline: analyses.filter((a: any) => a.analysis.offline).length
      };

      console.log(`✅ [TEMP-ANALYSIS-ALL] Completed analysis for ${objects.length} objects:`, summary);

      res.json({
        summary,
        results: analyses
      });
    } catch (error) {
      console.error('Error analyzing all temperatures:', error as Error);
      throw createDatabaseError("Failed to analyze temperatures");
    }
  };
}

// Export controller instance
export const temperatureController = new TemperatureController(storage);