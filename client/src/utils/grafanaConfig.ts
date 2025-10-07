/**
 * Zentrale Grafana-Konfiguration
 * Ersetzt hardcodierte URLs durch konfigurierbare Werte
 */

interface GrafanaConfig {
  baseUrl: string;
  defaultDashboard: string;
  defaultTimeRange: string;
}

// Fallback-Konfiguration
const FALLBACK_CONFIG: GrafanaConfig = {
  baseUrl: "https://graf.heatcare.one",
  defaultDashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
  defaultTimeRange: "now-7d",
};

// Cache für Konfiguration
let cachedConfig: GrafanaConfig | null = null;

/**
 * Lädt Grafana-Konfiguration aus der Datenbank
 */
export async function loadGrafanaConfig(): Promise<GrafanaConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/settings/grafana');
    const settings = await response.json();
    
    // Suche nach defaultGrafana Einstellung
    const defaultGrafana = settings.find((s: any) => s.key_name === 'defaultGrafana');
    
    if (defaultGrafana?.value?.setupGrafana) {
      const config = defaultGrafana.value.setupGrafana;
      cachedConfig = {
        baseUrl: config.baseUrl || FALLBACK_CONFIG.baseUrl,
        defaultDashboard: config.defaultDashboard || FALLBACK_CONFIG.defaultDashboard,
        defaultTimeRange: config.defaultTimeRange || FALLBACK_CONFIG.defaultTimeRange,
      };
    } else {
      console.warn('🔧 [GRAFANA-CONFIG] No defaultGrafana found, using fallback');
      cachedConfig = { ...FALLBACK_CONFIG };
    }
  } catch (error) {
    console.error('🔧 [GRAFANA-CONFIG] Failed to load config:', error);
    cachedConfig = { ...FALLBACK_CONFIG };
  }

  return cachedConfig;
}

/**
 * Erstellt komplette Grafana-URL
 */
export async function buildGrafanaUrl(params: {
  dashboard?: string;
  panelId: string | number;
  meterId?: string;
  timeRange?: string;
  additionalParams?: Record<string, string>;
}): Promise<string> {
  const config = await loadGrafanaConfig();
  
  const dashboard = params.dashboard || config.defaultDashboard;
  const timeRange = params.timeRange || config.defaultTimeRange;
  
  // Base URL zusammenbauen
  let url = `${config.baseUrl}/${dashboard}`;
  
  // Standard-Parameter
  const urlParams = new URLSearchParams({
    orgId: '1',
    from: timeRange.startsWith('now-') ? timeRange : `now-${timeRange}`,
    to: 'now',
    panelId: params.panelId.toString(),
    __feature: 'dashboardSceneSolo',
    kiosk: '1',
  });
  
  // Meter-ID hinzufügen
  if (params.meterId) {
    urlParams.set('var-id', params.meterId);
  }
  
  // Zusätzliche Parameter
  if (params.additionalParams) {
    Object.entries(params.additionalParams).forEach(([key, value]) => {
      urlParams.set(key, value);
    });
  }
  
  return `${url}?${urlParams.toString()}`;
}

/**
 * Cache zurücksetzen (für Tests oder Konfigurationsänderungen)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * Synchrone Version für Legacy-Code (nutzt Cache)
 */
export function getGrafanaBaseUrl(): string {
  return cachedConfig?.baseUrl || FALLBACK_CONFIG.baseUrl;
}