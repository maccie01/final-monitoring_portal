import { Activity, Thermometer, Zap } from "lucide-react";
import { buildGrafanaUrl } from "from "@/utils/grafanaConfig"";

export interface GrafanaPanel {
  id: string;
  originalId: string;
  label: string;
  panelId: string;
  panelId2?: string;
  panelId3?: string;
  panelId3height?: string;
  histogram?: number[];
  panelIdWidth?: string;
  height?: string;
  histogramHeight?: string;
  auswahl?: any[];
  noAccordion?: boolean;
  dashboard?: string; // Dashboard URL für konsistente URL-Generierung
  meterId?: string; // Meter-ID für URL-Generierung
  url?: string; // Generierte iframe URL
  // Gecachte URLs zur Vermeidung mehrfacher URL-Generierung
  cachedUrl?: string;
  cachedUrl2?: string;
  cachedUrl3?: string;
}

export interface GrafanaTab {
  id: string;
  label: string;
  icon: any;
  panels: GrafanaPanel[];
}

export interface GrafanaSettings {
  keyName: string;
  category: string;
  value: any;
}

export interface GrafanaObject {
  objectid: number;
  meter?: Record<string, any>;
  report?: any;
  portdata?: any;
}

/**
 * Zentrale Grafana-Logik für konsistente Tab- und Panel-Generierung
 * Verwendet von Report-Panels, DefaultAuswertung und anderen Dashboard-Typen
 */
// Hilfsfunktion zur URL-Generierung für fallback tabs
async function generateFallbackUrl(
  dashboard: string, 
  panelId: number, 
  meterId: string, 
  timeRange: string = '7d'
): Promise<string> {
  try {
    return await buildGrafanaUrl({
      dashboard,
      panelId,
      meterId,
      timeRange,
      additionalParams: {
        refresh: '1m'
      }
    });
  } catch (error) {
    console.error('🔧 [FALLBACK-URL] Error generating URL:', error);
    return '';
  }
}

export class GrafanaLogic {
  
  /**
   * Verarbeitet ein einzelnes Site-Objekt (Report, DefaultAuswertung oder Portdata)
   * Verwendet die gleiche Logik für alle Typen
   */
  static processSingleSiteObject(
    site: any, 
    index: number, 
    siteIndex: number = 0,
    source: 'report' | 'default' | 'portdata' = 'report'
  ): GrafanaPanel {

    // Use panelIdWidth for panel width configuration
    

    return {
      id: `${source}-panel-${index}-${siteIndex}`,
      originalId: site.id,
      label: "", // Ignore label for single site object - consistent behavior
      panelId: site.panelId || "16",
      panelId2: site.panelId2,
      panelId3: site.panelId3,
      panelId3height: site.panelId3height,
      histogram: site.histogram,
      panelIdWidth: site.panelIdWidth,
      height: site.height || "550px",
      histogramHeight: site.histogramHeight || "250px",
      auswahl: site.auswahl,
      noAccordion: true, // Flag to indicate no accordion needed
      dashboard: site.dashboard, // Dashboard URL für konsistente URL-Generierung
    };
  }

  /**
   * Verarbeitet ein Site-Array (für Akkordeon-Layout)
   */
  static processSiteArray(
    sites: any[], 
    index: number,
    source: 'report' | 'default' | 'portdata' = 'report'
  ): GrafanaPanel[] {
    return sites.map((site: any, siteIndex: number) => {


      return {
        id: `${source}-panel-${index}-${siteIndex}`,
        originalId: site.id,
        label: site.label || `Panel ${siteIndex + 1}`,
        panelId: site.panelId || "16",
        panelId2: site.panelId2,
        panelId3: site.panelId3,
        panelId3height: site.panelId3height,
        histogram: site.histogram,
        panelIdWidth: site.panelIdWidth,
        height: site.height,
        histogramHeight: site.histogramHeight || "250px",
        auswahl: site.auswahl,
        dashboard: site.dashboard, // Dashboard URL für konsistente URL-Generierung
      };
    });
  }

  /**
   * Generiert Tab-Icon basierend auf Index
   */
  static getTabIcon(index: number) {
    if (index === 0) {
      return <Activity className="h-4 w-4" />;
    } else if (index === 1) {
      return <Thermometer className="h-4 w-4" />;
    } else {
      return <Zap className="h-4 w-4" />;
    }
  }

  /**
   * Verarbeitet Report-Daten und generiert Tabs
   */
  static generateReportTabs(reportData: any[]): GrafanaTab[] {
    
    const tabs: GrafanaTab[] = [];

    reportData.forEach((reportItem: any, index: number) => {
      
      // Check if site is an array or single object
      if (reportItem.site && Array.isArray(reportItem.site)) {
        // Handle site as array (accordion behavior)
        const panels = this.processSiteArray(reportItem.site, index, 'report');

        tabs.push({
          id: `report-tab-${index}`,
          label: reportItem.sitelabel || `Tab ${index + 1}`,
          icon: this.getTabIcon(index),
          panels,
        });
      } else if (reportItem.site && typeof reportItem.site === 'object') {
        // Handle site as single object (no accordions)
        const panel = this.processSingleSiteObject(reportItem.site, index, 0, 'report');
        
        // Add dashboard information from reportItem to panel (like in generateDefaultTabs)
        if (reportItem.dashboard) {
          panel.dashboard = reportItem.dashboard;
        }
        
        // Add grafana base URL from reportItem to panel
        if (reportItem.grafana) {
          (panel as any).grafana = reportItem.grafana;
        }

        tabs.push({
          id: `report-tab-${index}`,
          label: reportItem.sitelabel || `Tab ${index + 1}`,
          icon: this.getTabIcon(index),
          panels: [panel],
        });
      }
    });

    return tabs;
  }

  /**
   * Verarbeitet DefaultAuswertung-Daten und generiert Tabs
   */
  static generateDefaultAuswertungTabs(defaultConfig: any[]): GrafanaTab[] {
    
    const tabs: GrafanaTab[] = [];

    defaultConfig.forEach((configItem: any, index: number) => {
      if (configItem.site) {
        
        // Handle DefaultAuswertung exactly like Report single site object
        const panel = this.processSingleSiteObject(configItem.site, index, 0, 'default');
        
        // Add dashboard information from configItem to panel
        if (configItem.dashboard) {
          panel.dashboard = configItem.dashboard;
        }

        tabs.push({
          id: `default-auswertung-tab-${index}`,
          label: configItem.sitelabel || "Standard Auswertung",
          icon: this.getTabIcon(index),
          panels: [panel],
        });
      }
    });

    return tabs;
  }

  /**
   * Verarbeitet Portdata-Daten und generiert Tabs
   */
  static generatePortdataTabs(portdataArray: any[]): GrafanaTab[] {
    
    const tabs: GrafanaTab[] = [];

    portdataArray.forEach((portItem: any, index: number) => {
      if (portItem.site && Array.isArray(portItem.site)) {
        // Handle site as array (accordion behavior)
        const panels = this.processSiteArray(portItem.site, index, 'portdata');

        tabs.push({
          id: `portdata-tab-${index}`,
          label: portItem.sitelabel || `Tab ${index + 1}`,
          icon: this.getTabIcon(index),
          panels,
        });
      } else if (portItem.site && typeof portItem.site === 'object') {
        // Handle site as single object (no accordion)
        const panel = this.processSingleSiteObject(portItem.site, index, 0, 'portdata');

        tabs.push({
          id: `portdata-tab-${index}`,
          label: portItem.sitelabel || `Tab ${index + 1}`,
          icon: this.getTabIcon(index),
          panels: [panel],
        });
      }
    });

    return tabs;
  }

  /**
   * Validiert ob Report-Daten vorhanden und gültig sind
   */
  static hasValidReport(report: any): boolean {
    // Zusätzliche Prüfung für leeres Objekt {}
    if (!report || report === null) {
      return false;
    }
    
    // Spezielle Prüfung für leeres Objekt {}
    if (typeof report === "object" && !Array.isArray(report) && Object.keys(report).length === 0) {
      return false;
    }
    
    return report &&
      report !== null &&
      ((Array.isArray(report) &&
        report.length > 0 &&
        report.some(
          (item) =>
            item && 
            typeof item === "object" && 
            item !== null &&
            Object.keys(item).length > 0,
        )) ||
        (typeof report === "object" &&
          !Array.isArray(report) &&
          report !== null &&
          Object.keys(report).length > 0));
  }

  /**
   * Validiert ob Portdata vorhanden und gültig sind
   */
  static hasValidPortdata(portdata: any): boolean {
    return portdata &&
      Array.isArray(portdata) &&
      portdata.length > 0 &&
      portdata.some(
        (item) =>
          item && typeof item === "object" && Object.keys(item).length > 0,
      );
  }

  /**
   * Hauptfunktion für Tab-Generierung für Auswertung
   */
  static generateTabs(
    object: GrafanaObject,
    grafanaSettings: GrafanaSettings[],
    originalTypParam?: string
  ): GrafanaTab[] {
    if (!object) return [];

    const hasValidReport = this.hasValidReport(object.report);

    // Report-basierte Auswertung
    if (hasValidReport) {
      if (Array.isArray(object.report)) {
        return this.generateReportTabs(object.report);
      } else if (typeof object.report === "object") {
        return this.generateReportTabs([object.report]);
      }
    }

    // DefaultGrafana oder DefaultAuswertung Fallback
    if (!hasValidReport) {
      // Unterscheide basierend auf ursprünglichem URL-Parameter
      const isTypDiagramme = originalTypParam === "diagramme";
      const fallbackType = isTypDiagramme ? "defaultGrafana" : "defaultAuswertung";
      
      
      const defaultGrafanaSetting = grafanaSettings?.find(
        (setting: any) => (setting.keyName === fallbackType || setting.key_name === fallbackType) && setting.category === "grafana"
      );
      
      
      if (defaultGrafanaSetting?.value) {
        try {
          const defaultConfig = typeof defaultGrafanaSetting.value === 'string' 
            ? JSON.parse(defaultGrafanaSetting.value) 
            : defaultGrafanaSetting.value;
          
          
          if (Array.isArray(defaultConfig)) {
            const defaultTabs = this.generateDefaultAuswertungTabs(defaultConfig);
            return defaultTabs;
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing ${fallbackType} setting:`, error);
        }
      } else {
        console.warn(`⚠️ No ${fallbackType} setting found - creating fallback tabs based on meter data`);
      }
      
      // Meter-basierter Fallback für alle Auswertung-Fälle (nur echte Daten)
      
      if (object.meter && Object.keys(object.meter).length > 0) {
        
        // Erstelle Tabs basierend auf verfügbaren Meter-Typen
        const fallbackTabs: GrafanaTab[] = [];
        const meterKeys = Object.keys(object.meter);
        
        // Netz-Tab (Z20541)
        if (meterKeys.some(key => key.startsWith('Z2054'))) {
          const netzMeterKey = meterKeys.find(key => key.startsWith('Z2054'));
          if (netzMeterKey) {
            const meterId = String(object.meter[netzMeterKey]);
            fallbackTabs.push({
              id: 'netz-fallback',
              label: 'Netz',
              icon: this.getTabIcon(0),
              panels: [{
                id: 'netz-panel',
                label: 'Netz Dashboard',
                dashboard: (object as any).report?.dashboard,
                panelId: '3',
                meterId: meterId,
                originalId: netzMeterKey,
                url: `https://grafana.monitoring.direct/${(object as any).report?.dashboard || 'horizon-portal'}?orgId=1&from=now-7d&to=now&panelId=3&var-id=${meterId}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`
              }]
            });
          }
        }
        
        
        
        return fallbackTabs;
      }
    }

    // Für andere Dashboard-Typen: Rückgabe leeres Array (wird von anderen Logiken behandelt)
    return [];
  }
}