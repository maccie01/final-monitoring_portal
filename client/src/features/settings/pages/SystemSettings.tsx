import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { Thermometer, Settings, BarChart3, Pencil, Trash2, Code2, Filter, Database, Server, Download, Edit, Save, Upload, Shield, Copy, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PortalConfigCard from "@/features/settings/components/PortalConfigCard";
import SystemPortalSetup from "@/features/settings/components/SystemPortalSetup";
import CollapsiblePortalCards from "@/features/settings/components/CollapsiblePortalCards";
import CurrentDatabaseConnection from "@/components/CurrentDatabaseConnection";
import { JsonConfigurationEditor } from "@/features/settings/components/JsonConfigurationEditor";
import { PortalJsonEditor } from "@/features/settings/components/PortalJsonEditor";
import FallbackDatabaseAccess from "@/components/FallbackDatabaseAccess";
import ApiManagement from "@/features/settings/pages/ApiManagement";
import { buildGrafanaUrl } from "@/utils/grafanaConfig";

interface ThresholdConfig {
  id?: number;
  category: string;
  key_name: string;
  value: {
    label: string;
    enabled: boolean;
    showTemp: boolean;
    thresholds: {
      normal: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
      warning: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
      critical: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
    };
  };
}

interface GrafanaConfig {
  id?: number;
  category: string;
  key_name: string;
  value: any;
  userId?: string;
  mandantId?: string;
}

interface EnergyDataConfig {
  id?: number;
  category: string;
  key_name: string;
  value: {
    dbEnergyData: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      ssl?: boolean;
      schema?: string;
      connectionTimeout?: number;
    };
  };
  userId?: string;
  mandantId?: string;
}


// DatabaseStatus Komponente
function DatabaseStatus() {
  const [performanceTest, setPerformanceTest] = useState<{
    running: boolean;
    results?: any;
    error?: string;
  }>({ running: false });

  const { data: dbInfo, isLoading: dbLoading } = useQuery({
    queryKey: ["/api/database/info"],
    queryFn: async () => {
      const response = await fetch("/api/database/info");
      if (!response.ok) throw new Error("Failed to fetch database info");
      return response.json();
    }
  });

  const { data: portalConfigs } = useQuery({
    queryKey: ["/api/settings", "data"],
    queryFn: async () => {
      const response = await fetch("/api/settings?category=data");
      if (!response.ok) throw new Error("Failed to fetch portal configs");
      return response.json();
    }
  });

  const runPerformanceTest = async () => {
    setPerformanceTest({ running: true });
    
    try {
      const response = await fetch("/api/database/performance-test", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Performance-Test fehlgeschlagen");
      }
      
      const results = await response.json();
      setPerformanceTest({ running: false, results });
    } catch (error: any) {
      setPerformanceTest({ running: false, error: error.message });
    }
  };

  if (dbLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Datenbankstatus wird geladen...</p>
        </div>
      </div>
    );
  }

  const settingdbConfig = portalConfigs?.find((c: any) => c.keyName === 'settingdb');
  const currentDb = settingdbConfig?.value || { host: 'j3yy.your-database.de', database: 'heimkehr_db2025' };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="w-4 h-4" />
            Standard-Datenbank (DefaultDB)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Portal-Datenbank</span>
                </div>
                <Badge variant="default" className="bg-green-600">AKTIV</Badge>
              </div>
              
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Host:</span>
                  <span className="font-mono text-sm">{currentDb.host}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Datenbank:</span>
                  <span className="font-mono text-sm">{currentDb.database}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Benutzer:</span>
                  <span className="font-mono text-sm">{currentDb.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-mono text-sm">{currentDb.port || 5432}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SSL:</span>
                  <Badge variant={currentDb.ssl ? "default" : "secondary"}>
                    {currentDb.ssl ? "Aktiviert" : "Deaktiviert"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircleIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-600">Neon-Datenbank</span>
                </div>
                <Badge variant="secondary">INAKTIV</Badge>
              </div>
              
              <div className="space-y-2 pl-4 text-gray-500">
                <div className="flex justify-between text-sm">
                  <span>Host:</span>
                  <span className="font-mono text-xs">ep-delicate-bird-afvb8ubp.c-2...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="text-xs">Nicht verwendet (Fallback)</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dbInfo?.tables || '7'}</div>
              <div className="text-sm text-blue-800">Tabellen</div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-800">Verbindung</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dbInfo?.version || 'PostgreSQL'}</div>
              <div className="text-sm text-purple-800">Typ</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Portal-Datenbank aktiv</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Die Anwendung verwendet erfolgreich die Portal-Datenbank für alle Settings, Objects und Benutzerdaten. 
                  Die Neon-Datenbank ist als Fallback konfiguriert, aber nicht aktiv.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    <span>Performance-Test</span>
                  </div>
                  <Button
                    onClick={runPerformanceTest}
                    disabled={performanceTest.running}
                    size="sm"
                    variant="outline"
                  >
                    {performanceTest.running ? "Teste..." : "DB-Performance testen"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceTest.running && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Performance-Test läuft...</span>
                  </div>
                )}

                {performanceTest.results && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Test-Ergebnisse:</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Settings-Abfrage</div>
                        <div className="text-lg font-mono text-gray-900">
                          {Math.round(performanceTest.results.settingsQuery)}ms
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Objects-Abfrage</div>
                        <div className="text-lg font-mono text-gray-900">
                          {Math.round(performanceTest.results.objectsQuery)}ms
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">DB-Verbindung</div>
                        <div className="text-lg font-mono text-gray-900">
                          {Math.round(performanceTest.results.connectionTest)}ms
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">API-Response</div>
                        <div className="text-lg font-mono text-gray-900">
                          {typeof performanceTest.results.apiTest === 'string' 
                            ? performanceTest.results.apiTest 
                            : Math.round(performanceTest.results.apiTest) + 'ms'}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Datenbank-Größe</div>
                        <div className="text-lg font-mono text-gray-900">
                          {performanceTest.results.settingsCount}/${performanceTest.results.objectsCount}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-600">Gesamt</div>
                        <div className="text-lg font-mono text-blue-900">
                          {Math.round(performanceTest.results.totalTime)}ms
                        </div>
                      </div>
                    </div>
                    
                    {performanceTest.results.recommendations && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="text-sm font-medium text-yellow-800 mb-2">Empfehlungen:</h5>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {performanceTest.results.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {performanceTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircleIcon className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">Fehler: {performanceTest.error}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // GrafanaTest states
  const [grafanaId, setGrafanaId] = useState('');
  const [grafanaObjectId, setGrafanaObjectId] = useState('');
  const [grafanaPanelId, setGrafanaPanelId] = useState('');
  const [grafanaIframeUrl, setGrafanaIframeUrl] = useState('');
  const [editingThreshold, setEditingThreshold] = useState<ThresholdConfig | null>(null);
  const [editingGrafana, setEditingGrafana] = useState<GrafanaConfig | null>(null);
  const [editingEnergyData, setEditingEnergyData] = useState<EnergyDataConfig | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isCreateEnergyMode, setIsCreateEnergyMode] = useState(false);
  const [activeTab, setActiveTab] = useState("temperatur");
  const [debugDialogOpen, setDebugDialogOpen] = useState<{ open: boolean; config?: any }>({ open: false });
  const [dayCompData, setDayCompData] = useState<any[]>([]);
  const [selectedPortalConfig, setSelectedPortalConfig] = useState('settingdb_neu');
  const [dayCompFilter, setDayCompFilter] = useState({ id: "", objectid: "", endDate: "" });
  const [dayCompLoading, setDayCompLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'checking' | 'ok' | 'error';
    lastCheck: Date | null;
    message: string;
  }>({ status: 'checking', lastCheck: null, message: 'Noch nicht geprüft' });
  const [selectedConfigKey, setSelectedConfigKey] = useState("settingdb");
  const [categoryFilter, setCategoryFilter] = useState<string>("data");

  // Fetch threshold settings
  const { data: thresholds, isLoading: thresholdLoading, refetch: thresholdRefetch } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch Grafana settings
  const { data: grafanaSettings, isLoading: grafanaLoading, refetch: grafanaRefetch } = useQuery({
    queryKey: ["/api/settings", "grafana"],
    queryFn: async () => {
      const response = await fetch("/api/settings?category=grafana");
      if (!response.ok) throw new Error("Failed to fetch Grafana settings");
      const data = await response.json();
      console.log('🔧 Loaded Grafana settings:', data?.length, 'entries:', data?.map((d: any) => d.key_name || d.keyName));
      return data;
    }
  });

  // Fetch Energy Data settings
  const { data: energyDataSettings, isLoading: energyDataLoading, refetch: energyDataRefetch } = useQuery({
    queryKey: ["/api/settings", "energy-data"],
    queryFn: async () => {
      const response = await fetch("/api/settings?category=data");
      if (!response.ok) throw new Error("Failed to fetch Energy Data settings");
      const data = await response.json();
      console.log('🔧 Loaded Energy Data settings:', data?.length, 'entries:', data?.map((d: any) => d.key_name || d.keyName));
      return data;
    }
  });

  // Fetch all settings for configuration list
  const { data: allSettings, isLoading: allSettingsLoading, refetch: allSettingsRefetch } = useQuery({
    queryKey: ["/api/settings", "all"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch all settings");
      const data = await response.json();
      console.log('🔧 Loaded all settings:', data?.length, 'entries:', data?.map((d: any) => d.key_name || d.keyName));
      return data;
    }
  });

  // Neue API-Route für vollständige Portal-Konfigurationen mit Passwort
  const { data: portalConfigDetails, isLoading: portalConfigLoading, refetch: portalConfigRefetch } = useQuery({
    queryKey: ["/api/portal/config-details"],
    queryFn: async () => {
      const response = await fetch("/api/portal/config-details");
      if (!response.ok) throw new Error("Failed to fetch portal config details");
      const data = await response.json();
      console.log('🔧 Loaded portal configurations with full details:', data);
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ThresholdConfig | GrafanaConfig | EnergyDataConfig) => {
      if (data.id) {
        return apiRequest("PUT", `/api/settings/${data.id}`, data);
      } else {
        return apiRequest("POST", "/api/settings", data);
      }
    },
    onSuccess: () => {
      // Invalidate all related caches when settings change
      queryClient.invalidateQueries({ queryKey: ["/api/settings/thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "grafana"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "energy-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/critical-systems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-alerts"] });
      setEditingThreshold(null);
      setEditingGrafana(null);
      setEditingEnergyData(null);
      setIsCreateMode(false);
      setIsCreateEnergyMode(false);
      toast({
        title: "Einstellungen gespeichert", 
        description: "Die Konfiguration wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch('/api/test-db-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Test fehlgeschlagen');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🔗 DB-Test erfolgreich:', data);
      toast({
        title: "DB-Test erfolgreich",
        description: `Verbindung erfolgreich: ${data.message || 'OK'}`
      });
    },
    onError: (error) => {
      console.error('❌ DB-Test Fehler:', error);
      toast({
        title: "DB-Test Fehler",
        description: `Verbindung fehlgeschlagen: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/settings/${id}`);
    },
    onSuccess: () => {
      // Invalidate all related caches when settings are deleted
      queryClient.invalidateQueries({ queryKey: ["/api/settings/thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "grafana"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "energy-data"] });
      setEditingThreshold(null);
      setEditingGrafana(null);
      setEditingEnergyData(null);
      setIsCreateMode(false);
      setIsCreateEnergyMode(false);
      toast({
        title: "Eintrag gelöscht", 
        description: "Die Konfiguration wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Konfiguration konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Function to check day_comp connection status  
  const checkDayCompConnection = async () => {
    setConnectionStatus({ status: 'checking', lastCheck: null, message: 'Externe Datenbank wird geprüft...' });
    
    try {
      const response = await fetch('/api/day-comp/debug/12');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus({
          status: 'ok',
          lastCheck: new Date(),
          message: `Externe DB=ok (${data.length} day_comp Einträge verfügbar)`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        lastCheck: new Date(),
        message: `Externe DB-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      });
    }
  };

  // Function to fetch day_comp data
  const fetchDayCompData = async (config: any, filters: { id: string; objectid: string; endDate: string }) => {
    setDayCompLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.id) params.append('id', filters.id);
      if (filters.objectid) params.append('objectid', filters.objectid);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/day-comp/debug/${config.id}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 day_comp data loaded:', data?.length, 'entries');
      setDayCompData(data || []);
      
      // Update connection status when data is successfully loaded
      if (data && data.length > 0) {
        setConnectionStatus({
          status: 'ok',
          lastCheck: new Date(),
          message: `day_comp=ok (${data.length} Einträge geladen)`
        });
      }
      
      toast({
        title: "Daten geladen",
        description: `${data?.length || 0} Einträge aus day_comp Tabelle geladen`,
      });
    } catch (error: any) {
      console.error('❌ Error fetching day_comp data:', error);
      setDayCompData([]);
      setConnectionStatus({
        status: 'error',
        lastCheck: new Date(),
        message: `Datenfehler: ${error.message || 'Unbekannter Fehler'}`
      });
      toast({
        title: "Fehler beim Laden",
        description: error.message || "Konnte day_comp Daten nicht laden",
        variant: "destructive",
      });
    } finally {
      setDayCompLoading(false);
    }
  };

  // Auto-load data when debug dialog opens
  useEffect(() => {
    if (debugDialogOpen.open && debugDialogOpen.config && dayCompData.length === 0) {
      console.log('🔄 Auto-loading day_comp data for debug dialog');
      fetchDayCompData(debugDialogOpen.config, dayCompFilter);
    }
  }, [debugDialogOpen.open, debugDialogOpen.config]);



  // Threshold functions
  const handleEditThreshold = (threshold: any) => {
    setEditingThreshold({ ...threshold });
    setIsCreateMode(false);
  };

  // GrafanaTest functions
  const generateGrafanaUrl = async () => {
    if (!grafanaPanelId) return;
    
    // Logic: If objectid is not empty, use objectid as var-id, otherwise use id as var-id
    let varId = '';
    if (grafanaObjectId && grafanaObjectId.trim() !== '') {
      varId = grafanaObjectId;
    } else if (grafanaId && grafanaId.trim() !== '') {
      varId = grafanaId;
    } else {
      return; // Need at least one ID
    }
    
    try {
      const url = await buildGrafanaUrl({
        panelId: grafanaPanelId,
        meterId: varId,
        timeRange: '7d'
      });
      setGrafanaIframeUrl(url);
    } catch (error) {
      console.error('Error generating Grafana URL:', error);
    }
  };

  const clearGrafanaInputs = () => {
    setGrafanaId('');
    setGrafanaObjectId('');
    setGrafanaPanelId('');
    setGrafanaIframeUrl('');
  };

  const handleCreateThreshold = () => {
    setEditingThreshold({
      category: "thresholds",
      key_name: `netzwaechter_${Date.now()}`,
      value: {
        label: "Neue Konfiguration",
        enabled: true,
        showTemp: true,
        thresholds: {
          normal: {
            color: "#16a34a",
            label: "Normal",
            vlValue: 55,
            rlValue: 39
          },
          warning: {
            color: "#ffa726",
            label: "Warnung",
            vlValue: 53,
            rlValue: 43
          },
          critical: {
            color: "#dc2626",
            label: "Kritisch",
            vlValue: 49,
            rlValue: 44
          }
        }
      }
    });
    setIsCreateMode(true);
  };

  // Grafana functions
  const handleEditGrafana = (config: GrafanaConfig) => {
    // Convert key_name to keyName for editing compatibility
    const editableConfig = {
      ...config,
      key_name: config.key_name
    };
    setEditingGrafana(editableConfig);
    setIsCreateMode(false);
  };

  const handleCreateGrafana = () => {
    setEditingGrafana({
      category: "grafana",
      key_name: `config_${Date.now()}`,
      value: {
        label: "Neue Grafana Konfiguration",
        enabled: true,
        url: "",
        orgId: 1
      }
    });
    setIsCreateMode(true);
  };

  // Energy Data functions
  const handleEditEnergyData = (config: EnergyDataConfig) => {
    setEditingEnergyData({ ...config });
    setIsCreateEnergyMode(false);
  };

  const handleCreateEnergyData = () => {
    setEditingEnergyData({
      category: "data",
      key_name: `dbEnergyData_${Date.now()}`,
      value: {
        dbEnergyData: {
          host: "docker.monitoring.direct",
          port: 51880,
          database: "horizonte-portal",
          username: "postgres",
          password: "postgres",
          ssl: false,
          schema: "public",
          connectionTimeout: 30000
        }
      }
    });
    setIsCreateEnergyMode(true);
  };

  const handleDeleteEnergyData = () => {
    if (editingEnergyData?.id) {
      deleteMutation.mutate(editingEnergyData.id);
    }
  };

  const handleAddTableEntry = (tableName: string) => {
    if (!editingEnergyData) return;
    
    const updatedConfig = { ...editingEnergyData };
    if (updatedConfig.value && updatedConfig.value.dbEnergyData) {
      (updatedConfig.value.dbEnergyData as any).table = tableName;
      setEditingEnergyData(updatedConfig);
    }
  };

  const handleAddSSLEntry = () => {
    if (!editingEnergyData) return;
    
    const updatedConfig = { ...editingEnergyData };
    if (updatedConfig.value && updatedConfig.value.dbEnergyData) {
      updatedConfig.value.dbEnergyData.ssl = true;
      setEditingEnergyData(updatedConfig);
    }
  };

  const handleCreatePortalDB = () => {
    const portalDBConfig = {
      category: "data",
      key_name: "defaultportaldb",
      value: {
        dbEnergyData: {
          host: "j3yy.your-database.de",
          port: 5432,
          database: "wowiot_app",
          username: "heimkehr_db",
          password: "heimkehr_db",
          ssl: true,
          schema: "public",
          connectionTimeout: 30000,
          tables: ["objects", "mandants", "users", "user_profiles", "settings", "object_mandant", "object_groups"]
        }
      }
    };
    saveMutation.mutate(portalDBConfig);
  };

  const handleTestConnection = () => {
    if (editingEnergyData?.value) {
      console.log('🔗 Teste DB-Verbindung:', editingEnergyData.value);
      testConnectionMutation.mutate(editingEnergyData.value);
    }
  };

  const handleSave = () => {
    if (editingThreshold) {
      saveMutation.mutate(editingThreshold);
    } else if (editingGrafana) {
      saveMutation.mutate(editingGrafana);
    } else if (editingEnergyData) {
      saveMutation.mutate(editingEnergyData);
    }
  };

  const handleCancel = () => {
    setEditingThreshold(null);
    setEditingGrafana(null);
    setEditingEnergyData(null);
    setIsCreateMode(false);
    setIsCreateEnergyMode(false);
  };

  const updateThresholdValue = (path: string, value: any) => {
    if (!editingThreshold) return;
    
    const updated = { ...editingThreshold };
    const pathArray = path.split('.');
    let current: any = updated;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setEditingThreshold(updated);
  };

  const updateGrafanaValue = (path: string, value: any) => {
    if (!editingGrafana) return;
    
    const updated = { ...editingGrafana };
    const pathArray = path.split('.');
    let current: any = updated;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setEditingGrafana(updated);
  };

  const updateEnergyDataValue = (path: string, value: any) => {
    if (!editingEnergyData) return;
    
    const updated = { ...editingEnergyData };
    const pathArray = path.split('.');
    let current: any = updated;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setEditingEnergyData(updated);
  };

  // Portal-Datenbank Aktionen
  const handleLoadFromSettingdb = async () => {
    try {
      const response = await fetch('/api/portal/settings/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Einstellungen geladen",
          description: `${result.loadedCount} Einstellungen aus settingdb geladen.`
        });
        // Reload settings
        thresholdRefetch();
        grafanaRefetch();
        energyDataRefetch();
      } else {
        throw new Error('Laden fehlgeschlagen');
      }
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Einstellungen konnten nicht aus settingdb geladen werden.",
        variant: "destructive"
      });
    }
  };

  const handleSaveToSettingdb = async () => {
    try {
      const response = await fetch('/api/portal/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Einstellungen gespeichert",
          description: `${result.savedCount} Einstellungen in settingdb gespeichert.`
        });
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Einstellungen konnten nicht in settingdb gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleExportToJson = async () => {
    try {
      const response = await fetch('/api/portal/settings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.settings, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portal-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export erfolgreich",
          description: `${data.exportedCount} Einstellungen als JSON exportiert.`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Export Fehler:', error);
      toast({
        title: "Fehler beim Export",
        description: error.message || "Einstellungen konnten nicht exportiert werden.",
        variant: "destructive"
      });
    }
  };

  const handleImportFromJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      const response = await fetch('/api/portal/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Import erfolgreich",
          description: `${result.importedCount} Einstellungen importiert.`
        });
        // Reload settings
        thresholdRefetch();
        grafanaRefetch();
        energyDataRefetch();
      } else {
        throw new Error('Import fehlgeschlagen');
      }
    } catch (error) {
      toast({
        title: "Fehler beim Import",
        description: "JSON-Datei konnte nicht importiert werden.",
        variant: "destructive"
      });
    }
    
    // Reset file input
    event.target.value = '';
  };

  if (thresholdLoading || grafanaLoading || energyDataLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
          <TabsTrigger 
            value="temperatur" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <Thermometer className="h-4 w-4 mr-2" />
            Temperatur-Grenzwerte
          </TabsTrigger>
          <TabsTrigger 
            value="grafana" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Grafana
          </TabsTrigger>
          <TabsTrigger 
            value="datenbank" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Datenbank
          </TabsTrigger>
          <TabsTrigger 
            value="portal-setup" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Portal-Setup
          </TabsTrigger>
          <TabsTrigger 
            value="api-tests" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <Code2 className="h-4 w-4 mr-2" />
            API-Tests
          </TabsTrigger>
          <TabsTrigger 
            value="grafana-test" 
            className="data-[state=active]:bg-gray-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4 bg-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            GrafanaTest
          </TabsTrigger>

        </TabsList>

        <TabsContent value="temperatur" className="mt-6">
          <div className="space-y-6">
            {/* Threshold Configuration Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base">
                    <Thermometer className="w-4 h-4" />
                    <span>Temperatur-Konfigurationen</span>
                  </div>
                  <Button onClick={handleCreateThreshold} size="sm">
                    <CogIcon className="h-4 w-4 mr-2" />
                    Neue Konfiguration
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {thresholds && (thresholds as any[]).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Konfiguration</TableHead>
                        <TableHead>Normal (VL/RL)</TableHead>
                        <TableHead>Warnung (VL/RL)</TableHead>
                        <TableHead>Kritisch (VL/RL)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(thresholds as any[]).map((threshold: any) => (
                        <TableRow key={threshold.id}>
                          <TableCell>
                            <div className="font-medium">{threshold.value?.label || threshold.key_name}</div>
                            <div className="text-xs text-gray-500">{threshold.key_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-green-600">≥{threshold.value?.thresholds?.normal?.vlValue || 'N/A'}°C</span>
                              <span className="mx-1">/</span>
                              <span className="text-green-600">≤{threshold.value?.thresholds?.normal?.rlValue || 'N/A'}°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-orange-600">{threshold.value?.thresholds?.warning?.vlValue || 'N/A'}°C</span>
                              <span className="mx-1">/</span>
                              <span className="text-orange-600">{threshold.value?.thresholds?.warning?.rlValue || 'N/A'}°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-red-600">≤{threshold.value?.thresholds?.critical?.vlValue || 'N/A'}°C</span>
                              <span className="mx-1">/</span>
                              <span className="text-red-600">≥{threshold.value?.thresholds?.critical?.rlValue || 'N/A'}°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={threshold.value?.enabled ? "default" : "secondary"} className="text-xs">
                              {threshold.value?.enabled ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditThreshold(threshold)}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                title="Bearbeiten"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(threshold.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                title="Löschen"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Keine Konfigurationen vorhanden</p>
                    <Button onClick={handleCreateThreshold} className="mt-3">
                      Erste Konfiguration erstellen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Threshold Edit Form */}
            {editingThreshold && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CogIcon className="h-5 w-5" />
                      <span>{isCreateMode ? "Neue Temperatur-Konfiguration" : "Temperatur-Konfiguration bearbeiten"}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        size="sm"
                      >
                        {saveMutation.isPending ? "Speichern..." : "Speichern"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        size="sm"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Bezeichnung</Label>
                      <Input
                        value={editingThreshold.value.label}
                        onChange={(e) => updateThresholdValue('value.label', e.target.value)}
                        placeholder="z.B. Niedertemperatur-Netz"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Konfigurations-ID</Label>
                      <Input
                        value={editingThreshold.key_name}
                        onChange={(e) => updateThresholdValue('key_name', e.target.value)}
                        placeholder="z.B. netzwaechter_1"
                        disabled={!isCreateMode}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingThreshold.value.enabled}
                        onCheckedChange={(checked) => updateThresholdValue('value.enabled', checked)}
                      />
                      <Label className="text-sm">Aktiviert</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingThreshold.value.showTemp}
                        onCheckedChange={(checked) => updateThresholdValue('value.showTemp', checked)}
                      />
                      <Label className="text-sm">Temperaturen anzeigen</Label>
                    </div>
                  </div>

                  {/* Temperature Thresholds Table */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Temperatur-Schwellwerte</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Status</TableHead>
                          <TableHead>Vorlauf (VL)</TableHead>
                          <TableHead>Rücklauf (RL)</TableHead>
                          <TableHead>Logik</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-green-50">
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Normal</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">≥</span>
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.normal.vlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.normal.vlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">≤</span>
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.normal.rlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.normal.rlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">Optimal</TableCell>
                        </TableRow>
                        <TableRow className="bg-orange-50">
                          <TableCell>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">Warnung</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.warning.vlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.warning.vlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.warning.rlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.warning.rlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">Aufmerksamkeit erforderlich</TableCell>
                        </TableRow>
                        <TableRow className="bg-red-50">
                          <TableCell>
                            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">Kritisch</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">≤</span>
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.critical.vlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.critical.vlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">≥</span>
                              <Input
                                type="number"
                                value={editingThreshold.value.thresholds.critical.rlValue}
                                onChange={(e) => updateThresholdValue('value.thresholds.critical.rlValue', Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs">°C</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">Sofortige Aktion erforderlich</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grafana" className="mt-6">
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Panel - Grafana Configuration Table */}
            <div className="w-1/2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4" />
                      <span>Grafana-Konfigurationen</span>
                    </div>
                    <Button onClick={handleCreateGrafana} size="sm">
                      <CogIcon className="h-4 w-4 mr-2" />
                      Neue Konfiguration
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
                  {grafanaSettings && (grafanaSettings as any[]).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Schlüssel</TableHead>
                          <TableHead>Wert</TableHead>
                          <TableHead className="w-24">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(grafanaSettings as any[]).map((config: any) => (
                          <TableRow 
                            key={config.id}
                            className={editingGrafana?.id === config.id ? "bg-blue-50" : ""}
                          >
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{config.key_name || config.keyName}</code>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs max-w-xs truncate">
                                {typeof config.value === 'object' ? JSON.stringify(config.value).substring(0, 30) + '...' : config.value}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditGrafana(config)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                  title="Bearbeiten"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(config.id)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  title="Löschen"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Keine Grafana-Konfigurationen vorhanden</p>
                      <Button onClick={handleCreateGrafana} className="mt-3">
                        Erste Konfiguration erstellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Grafana Edit Details */}
            <div className="w-1/2">
              {editingGrafana ? (
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-base">
                        <BarChart3 className="w-4 h-4" />
                        <span>{isCreateMode ? "Neue Grafana-Konfiguration" : "Grafana-Konfiguration bearbeiten"}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSave}
                          disabled={saveMutation.isPending}
                          size="sm"
                        >
                          {saveMutation.isPending ? "Speichern..." : "Speichern"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          size="sm"
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 h-[calc(100%-80px)] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm">Schlüssel</Label>
                        <Input
                          value={editingGrafana.key_name || (editingGrafana as any).keyName}
                          onChange={(e) => updateGrafanaValue('key_name', e.target.value)}
                          placeholder="z.B. dashboard_url"
                          disabled={!isCreateMode}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Kategorie</Label>
                        <Input
                          value={editingGrafana.category}
                          onChange={(e) => updateGrafanaValue('category', e.target.value)}
                          disabled
                          className="text-sm bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Wert (JSON)</Label>
                      <textarea
                        value={JSON.stringify(editingGrafana.value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateGrafanaValue('value', parsed);
                          } catch (err) {
                            // Invalid JSON, keep typing
                          }
                        }}
                        className="w-full h-64 p-3 border border-gray-300 rounded text-sm font-mono resize-none"
                        placeholder='{"url": "https://example.com", "enabled": true}'
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Wählen Sie eine Konfiguration zum Bearbeiten aus</p>
                      <p className="text-sm mt-1">oder erstellen Sie eine neue Konfiguration</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="datenbank" className="mt-6">
          <div className="space-y-6">
            <CurrentDatabaseConnection />
            
            {/* Konfigurationsauswahl - verschoben vom Konfiguration Tab */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4" />
                  <span>Datenbank-Konfigurationen</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[600px]">
                  {/* Left Panel - Configuration List */}
                  <div className="w-[300px] border-r border-gray-200 bg-gray-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Konfigurationen</h3>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value="all">Alle</option>
                          <option value="data">Datenbank</option>
                          <option value="grafana">Grafana</option>
                          <option value="thresholds">Schwellwerte</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                      
                      {/* Anzahl gefilterte Konfigurationen */}
                      <div className="text-xs text-gray-500 mb-2">
                        {(() => {
                          const totalConfigs = allSettings?.length || 0;
                          const filteredCount = categoryFilter === "all" ? totalConfigs : 
                            allSettings?.filter((setting: any) => setting.category === categoryFilter).length || 0;
                          return `${filteredCount} von ${totalConfigs} Konfigurationen`;
                        })()}
                      </div>
                      
                      <div className="space-y-1">
                        {(() => {
                          // Erstelle Konfigurationen aus allen geladenen Settings
                          const configs: Record<string, { label: string; category: string }> = {};
                          
                          if (allSettings && Array.isArray(allSettings)) {
                            allSettings.forEach((setting: any) => {
                              if (setting.key_name) {
                                let label = "Konfiguration";
                                const category = setting.category || "unknown";
                                
                                if (setting.key_name.startsWith('settingdb')) {
                                  label = "Haupt-Konfiguration";
                                } else if (setting.key_name.includes('view')) {
                                  label = "View-Konfiguration";
                                } else if (setting.key_name.includes('tabellen')) {
                                  label = "Tabellen-Konfiguration";
                                } else if (category === 'grafana') {
                                  label = "Grafana-Konfiguration";
                                } else if (category === 'thresholds') {
                                  label = "Schwellwert-Konfiguration";
                                } else if (category === 'data') {
                                  label = "Datenbank-Konfiguration";
                                }
                                
                                configs[setting.key_name] = { label, category };
                              }
                            });
                          }

                          // Fallback für statische Konfigurationen falls keine Daten geladen werden
                          if (Object.keys(configs).length === 0) {
                            configs.settingsdb = { label: "Haupt-Konfiguration", category: "data" };
                            configs.settingsdb_1 = { label: "Test-Konfiguration", category: "data" };
                            configs.settingsdb_2 = { label: "Backup-Konfiguration", category: "data" };
                          }

                          // Filter nach Kategorie
                          const filteredConfigs = Object.keys(configs).filter(configKey => {
                            if (categoryFilter === "all") return true;
                            return configs[configKey].category === categoryFilter;
                          });
                          
                          return filteredConfigs.map((configKey) => (
                            <div
                              key={configKey}
                              onClick={() => setSelectedConfigKey(configKey)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors border-0.5 ${
                                selectedConfigKey === configKey
                                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                                  : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                              data-testid={`config-item-${configKey}`}
                            >
                              <div className="font-medium text-sm">{configKey}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {configs[configKey].label}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {configs[configKey].category}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Configuration Overview */}
                  <div className="flex-1 p-6">
                    <div className="h-full overflow-auto">
                      {(() => {
                        // Verwende Portal-Konfigurationsdetails mit vollständigen Daten (einschließlich Passwort)
                        let availableConfigs: Record<string, any> = {};
                        
                        if (portalConfigDetails && portalConfigDetails.configurations) {
                          availableConfigs = portalConfigDetails.configurations;
                        }
                        
                        // Zusätzlich alle Settings aus allSettings hinzufügen (auch wenn Portal-Details verfügbar)
                        if (allSettings && Array.isArray(allSettings)) {
                          allSettings.forEach((setting: any) => {
                            if (setting.key_name && setting.value) {
                              availableConfigs[setting.key_name] = setting.value;
                            }
                          });
                        }

                        // Fallback-Konfigurationen falls keine Daten geladen werden
                        if (Object.keys(availableConfigs).length === 0) {
                          availableConfigs.settingdb_neu = {
                            ssl: false,
                            host: "j3yy.your-database.de",
                            port: 5432,
                            database: "heimkehr_db2025",
                            username: "heimkehr_db",
                            password: "vhHqu4XDZh8ux5Qq",
                            schema: "public",
                            connectionTimeout: 30000,
                            table: "settings"
                          };
                        }

                        // Aktuelle Konfiguration ermitteln
                        const currentConfig = availableConfigs[selectedConfigKey];
                        
                        // Debug-Info für fehlende Konfigurationen
                        if (!currentConfig) {
                          console.log(`⚠️ Keine Konfiguration gefunden für: ${selectedConfigKey}`);
                          console.log('📋 Verfügbare Konfigurationen:', Object.keys(availableConfigs));
                        }

                        return (
                          <JsonConfigurationEditor
                            key={`config-${selectedConfigKey}`}
                            selectedConfigKey={selectedConfigKey}
                            currentConfiguration={currentConfig}
                            onApplyConfiguration={(config, selectedConfig) => {
                              console.log("Anwenden:", "Konfiguration", config, "Schlüssel:", selectedConfig || selectedConfigKey);
                              
                              // API-Aufruf zum Speichern der Konfiguration
                              apiRequest('POST', '/api/settings', {
                                category: 'data',
                                key_name: selectedConfig || selectedConfigKey,
                                value: config
                              }).then(() => {
                                toast({
                                  title: "Konfiguration gespeichert",
                                  description: `Die ${selectedConfig || selectedConfigKey}-Konfiguration wurde erfolgreich gespeichert.`,
                                });
                                // Cache invalidieren
                                portalConfigRefetch();
                                allSettingsRefetch();
                              }).catch((error) => {
                                toast({
                                  title: "Fehler beim Speichern",
                                  description: error.message,
                                  variant: "destructive"
                                });
                              });
                            }}
                            onConfigurationChange={(configKey) => {
                              console.log("Konfiguration gewechselt zu:", configKey);
                              setSelectedConfigKey(configKey);
                            }}
                            isLoading={portalConfigLoading || allSettingsLoading}
                            title={`Konfiguration: ${selectedConfigKey}`}
                            availableConfigurations={availableConfigs}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portal-setup" className="mt-6">
          <div className="space-y-6">

            {/* Portal-Datenbank settings-Tabelle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4" />
                  Portal-Datenbank settings-Tabelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-9 flex items-center gap-1 text-xs"
                    onClick={() => handleExportToJson()}
                  >
                    <Download className="w-3 h-3" />
                    JSON exportieren
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFromJson}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      className="h-9 flex items-center gap-1 text-xs w-full"
                    >
                      <Upload className="w-3 h-3" />
                      JSON importieren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vollständige SystemPortalSetup-Komponente */}
            <SystemPortalSetup />
          </div>
        </TabsContent>

        <TabsContent value="api-tests" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
                <div className="space-y-4">
                  <div className="border-t pt-[0px] pb-[0px]">
                    
                    
                    <ApiManagement />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grafana-test" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Grafana Test Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="grafana-id">ID</Label>
                    <Input
                      id="grafana-id"
                      value={grafanaId}
                      onChange={(e) => setGrafanaId(e.target.value)}
                      placeholder="12205151"
                      data-testid="input-grafana-id"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grafana-objectid">Object ID</Label>
                    <Input
                      id="grafana-objectid"
                      value={grafanaObjectId}
                      onChange={(e) => setGrafanaObjectId(e.target.value)}
                      placeholder="207125085"
                      data-testid="input-grafana-objectid"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grafana-panelid">Panel ID</Label>
                    <Input
                      id="grafana-panelid"
                      value={grafanaPanelId}
                      onChange={(e) => setGrafanaPanelId(e.target.value)}
                      placeholder="3"
                      data-testid="input-grafana-panelid"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateGrafanaUrl} data-testid="button-grafana-generate">
                    URL Generieren
                  </Button>
                  <Button onClick={clearGrafanaInputs} variant="outline" data-testid="button-grafana-clear">
                    Zurücksetzen
                  </Button>
                </div>

                {grafanaIframeUrl && (
                  <div className="space-y-2">
                    <div className="border rounded" style={{ height: '300px' }}>
                      <iframe
                        src={grafanaIframeUrl}
                        className="w-full h-full border-0"
                        title="Grafana Test Dashboard"
                        data-testid="grafana-test-iframe"
                      />
                    </div>
                  </div>
                )}

                {/* Debug URL Anzeige */}
                <div className="space-y-2">
                  <Label>Debug - Generierte URL:</Label>
                  <div className="text-xs bg-gray-50 p-3 rounded border font-mono break-all">
                    {grafanaIframeUrl || (
                      <span className="text-gray-400 italic">
                        Keine URL generiert - Panel ID und mindestens eine ID erforderlich
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
      {/* Debug Dialog for day_comp Table */}
      <Dialog open={debugDialogOpen.open} onOpenChange={(open) => setDebugDialogOpen({ open, config: debugDialogOpen.config })}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <span>
                {debugDialogOpen.config?.keyName === 'dbEnergyData_view_mon_comp' ? 'view_mon_comp (Monatsdaten)' : 'day_comp (Tagesdaten)'} Debug - {debugDialogOpen.config?.keyName}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filter Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">ID Filter</Label>
                    <Input
                      value={dayCompFilter.id}
                      onChange={(e) => setDayCompFilter(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="ID-Wert filtern..."
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Object ID Filter</Label>
                    <Input
                      value={dayCompFilter.objectid}
                      onChange={(e) => setDayCompFilter(prev => ({ ...prev, objectid: e.target.value }))}
                      placeholder="Object ID (Log) filtern..."
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Enddatum Filter</Label>
                    <Input
                      value={dayCompFilter.endDate}
                      onChange={(e) => setDayCompFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      placeholder="dd-mm-yyyy"
                      className="text-sm"
                      pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={() => {
                      // Fetch day_comp data with filters
                      if (debugDialogOpen.config) {
                        fetchDayCompData(debugDialogOpen.config, dayCompFilter);
                      }
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={dayCompLoading}
                  >
                    <Database className="h-3 w-3 mr-1" />
                    {dayCompLoading ? "Lade..." : "Daten laden"}
                  </Button>
                  <Button
                    onClick={checkDayCompConnection}
                    size="sm"
                    variant="outline"
                    disabled={connectionStatus.status === 'checking'}
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    {connectionStatus.status === 'checking' ? 'Prüfe...' : 'Verbindung'}
                  </Button>
                  <Button
                    onClick={() => setDayCompFilter({ id: "", objectid: "", endDate: "" })}
                    variant="outline"
                    size="sm"
                  >
                    Filter zurücksetzen
                  </Button>
                </div>
                
                {/* Connection Status in Debug Dialog */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus.status === 'ok' ? 'bg-green-500' : 
                      connectionStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span>Status: {connectionStatus.message}</span>
                    {connectionStatus.lastCheck && (
                      <span className="text-gray-500">({connectionStatus.lastCheck.toLocaleString('de-DE')})</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {debugDialogOpen.config?.keyName === 'dbEnergyData_view_mon_comp' ? 'view_mon_comp' : 'day_comp'} Tabellendaten ({dayCompData.length} Einträge - Letzte 50)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Counter</TableHead>
                        <TableHead>Zeit</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Log</TableHead>
                        <TableHead>Object ID</TableHead>
                        <TableHead>Tpl</TableHead>
                        <TableHead>En First</TableHead>
                        <TableHead>En Last</TableHead>
                        <TableHead>En2 First</TableHead>
                        <TableHead>En2 Last</TableHead>
                        <TableHead>Vol First</TableHead>
                        <TableHead>Vol Last</TableHead>
                        <TableHead>Flt Mean</TableHead>
                        <TableHead>Ret Mean</TableHead>
                        <TableHead>Flo Mean</TableHead>
                        <TableHead>Flo Max</TableHead>
                        <TableHead>Flo Min</TableHead>
                        <TableHead>Pow Mean</TableHead>
                        <TableHead>Pow Max</TableHead>
                        <TableHead>Pow Min</TableHead>
                        <TableHead>Day Count</TableHead>
                        <TableHead>Diff En</TableHead>
                        <TableHead>Diff Vol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayCompData.length > 0 ? (
                        dayCompData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{row.counter || 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.time ? new Date(row.time).toLocaleString('de-DE') : 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.id || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.log || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.objectId || 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.tpl || 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.enFirst ? parseFloat(row.enFirst).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.enLast ? parseFloat(row.enLast).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.en2First ? parseFloat(row.en2First).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.en2Last ? parseFloat(row.en2Last).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.volFirst ? parseFloat(row.volFirst).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.volLast ? parseFloat(row.volLast).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.fltMean ? parseFloat(row.fltMean).toFixed(1) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.retMean ? parseFloat(row.retMean).toFixed(1) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.floMean ? parseFloat(row.floMean).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.floMax ? parseFloat(row.floMax).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.floMin ? parseFloat(row.floMin).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.powMean ? parseFloat(row.powMean).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.powMax ? parseFloat(row.powMax).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs">{row.powMin ? parseFloat(row.powMin).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.dayCount || 'N/A'}</TableCell>
                            <TableCell className="text-xs font-semibold">{row.diffEn ? parseFloat(row.diffEn).toFixed(2) : 'N/A'}</TableCell>
                            <TableCell className="text-xs font-semibold">{row.diffVol ? parseFloat(row.diffVol).toFixed(2) : 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={23} className="text-center py-8 text-gray-500">
                            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Keine Daten verfügbar</p>
                            <p className="text-xs mt-1">Klicken Sie auf "Daten laden" um {debugDialogOpen.config?.keyName === 'dbEnergyData_view_mon_comp' ? 'view_mon_comp' : 'day_comp'} Tabelle abzufragen</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}