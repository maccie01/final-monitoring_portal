/**
 * KI Reports API Client
 * Handles all Grafana dashboard and reporting API calls
 */

/**
 * Grafana Configuration Interface
 */
export interface GrafanaConfig {
  baseUrl: string;
  defaultDashboard: string;
  defaultTimeRange: string;
}

/**
 * Grafana Settings from Database
 */
export interface GrafanaSetting {
  id: number;
  category: string;
  key_name: string;
  value: any;
}

/**
 * Object with Grafana Data
 */
export interface GrafanaObject {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  zip?: string;
  address?: string;
  meter?: Record<string, string | number>;
  report?: any[];
  dashboard?: any;
  auswertung?: any;
  portdata?: any[];
  energy?: any;
}

/**
 * Fetch Grafana settings from the database
 * Used for configuring Grafana base URL and default dashboard
 */
export async function fetchGrafanaSettings(): Promise<GrafanaSetting[]> {
  const response = await fetch('/api/settings/grafana');
  if (!response.ok) {
    throw new Error('Failed to fetch Grafana settings');
  }
  return response.json();
}

/**
 * Fetch object data including Grafana configuration
 * @param objectId - The object ID to fetch
 */
export async function fetchObjectById(objectId: number): Promise<GrafanaObject> {
  const response = await fetch(`/api/objects/by-objectid?objectId=${objectId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch object ${objectId}`);
  }
  return response.json();
}

/**
 * Fetch object meter data for Grafana panels
 * @param objectId - The object ID to fetch meter data for
 */
export async function fetchObjectMeter(objectId: number): Promise<{
  objectid: number;
  meter: Record<string, string | number>;
  report?: any;
}> {
  const response = await fetch(`/api/objects/meter?objectId=${objectId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch meter data for object ${objectId}`);
  }
  return response.json();
}

/**
 * Build Grafana panel URL
 * @param config - URL configuration parameters
 */
export function buildGrafanaUrl(config: {
  baseUrl: string;
  dashboard: string;
  panelId: string | number;
  meterId?: string;
  from?: string;
  to?: string;
  additionalParams?: Record<string, string>;
}): string {
  const {
    baseUrl,
    dashboard,
    panelId,
    meterId,
    from = 'now-7d',
    to = 'now',
    additionalParams = {},
  } = config;

  const params = new URLSearchParams({
    orgId: '1',
    from,
    to,
    panelId: panelId.toString(),
    kiosk: '1',
    __feature: 'dashboardSceneSolo',
    refresh: '1m',
    ...additionalParams,
  });

  if (meterId) {
    params.set('var-id', meterId);
  }

  return `${baseUrl}/${dashboard}?${params.toString()}`;
}

/**
 * Export report data (placeholder for future implementation)
 * @param objectId - Object to export report for
 * @param format - Export format (pdf, csv, excel)
 */
export async function exportReport(
  objectId: number,
  format: 'pdf' | 'csv' | 'excel' = 'pdf'
): Promise<Blob> {
  const response = await fetch(`/api/reports/export/${objectId}?format=${format}`);
  if (!response.ok) {
    throw new Error(`Failed to export report for object ${objectId}`);
  }
  return response.blob();
}

/**
 * Fallback Grafana configuration
 */
export const FALLBACK_GRAFANA_CONFIG: GrafanaConfig = {
  baseUrl: 'https://graf.heatcare.one',
  defaultDashboard: 'd-solo/eelav0ybil2wwd/ws-heatcare',
  defaultTimeRange: 'now-7d',
};

/**
 * Load Grafana configuration from settings
 * Falls back to default config if not found
 */
export async function loadGrafanaConfig(): Promise<GrafanaConfig> {
  try {
    const settings = await fetchGrafanaSettings();
    const defaultGrafana = settings.find(s => s.key_name === 'defaultGrafana');

    if (defaultGrafana?.value?.setupGrafana) {
      const config = defaultGrafana.value.setupGrafana;
      return {
        baseUrl: config.baseUrl || FALLBACK_GRAFANA_CONFIG.baseUrl,
        defaultDashboard: config.defaultDashboard || FALLBACK_GRAFANA_CONFIG.defaultDashboard,
        defaultTimeRange: config.defaultTimeRange || FALLBACK_GRAFANA_CONFIG.defaultTimeRange,
      };
    }

    return FALLBACK_GRAFANA_CONFIG;
  } catch (error) {
    console.error('Failed to load Grafana config, using fallback:', error);
    return FALLBACK_GRAFANA_CONFIG;
  }
}
