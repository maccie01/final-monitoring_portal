import { useState, useEffect } from "from "react"";
import { Button } from "from "@/components/ui/button"";
import { Card, CardContent, CardHeader, CardTitle } from "from "@/components/ui/card"";
import { Badge } from "from "@/components/ui/badge"";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "from "@/components/ui/select"";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "from "@/components/ui/dialog"";
import { useToast } from "from "@/hooks/use-toast"";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Copy,
  Loader2,
  Plus,
  Trash2,
  Wifi,
  Upload,
  Edit,
  Save,
  X,
  Settings
} from "from "lucide-react"";
import { getStatusIcon, getStatusColor } from "from "./shared/energy-utils"";
import { api } from "from "@/lib/api-utils"";

// Portal-Konfigurationen
const newPortalConfig = {
  host: "j3yy.your-database.de",
  port: 5432,
  database: "heimkehr_db2025",
  username: "heimkehr_db",
  password: "",
  ssl: { rejectUnauthorized: false },
  schema: "public"
};

const oldPortalConfig = {
  host: "portal.monitoring.direct", 
  port: 51880,
  database: "portal",
  username: "postgres",
  password: "",
  ssl: false,
  schema: "public"
};

const defaultDbConfig = {
  host: "j3yy.your-database.de",
  port: 5432,
  database: "heimkehr_db2025",
  username: "heimkehr_db",
  password: "vhHqu4XDZh8ux5Qq",
  ssl: false,
  schema: "public"
};

interface SystemPortalSetupProps {
  configType?: string;
  title?: string;
  description?: string;
}

export default function SystemPortalSetup({ configType, title, description }: SystemPortalSetupProps = {}) {
  // Aktive Konfiguration
  const [activeConfig, setActiveConfig] = useState<'neu' | 'alt' | 'defaultdb' | 'unknown'>('unknown');
  
  // Default-Konfiguration verwenden
  const [useDefaultConfig, setUseDefaultConfig] = useState(false);
  const [defaultConfigJson, setDefaultConfigJson] = useState(`{
  "host": "j3yy.your-database.de",
  "port": 5432,
  "database": "heimkehr_db2025",
  "username": "heimkehr_db",
  "password": "vhHqu4XDZh8ux5Qq",
  "ssl": false,
  "connectionTimeout": 30000
}`);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Portal-Konfigurationsliste mit vollständiger Verwaltung
  const [allPortalConfigs, setAllPortalConfigs] = useState<any[]>([]);
  const [configManagementStatus, setConfigManagementStatus] = useState<'idle' | 'loading' | 'creating' | 'success' | 'error'>('idle');

  // Server-Neustart mit DB-Konfiguration
  const [restartLoading, setRestartLoading] = useState(false);
  const [selectedRestartConfig, setSelectedRestartConfig] = useState<string>('');

  // NEU DB Portal-Tabellen Status
  const [createTablesStatus, setCreateTablesStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [deleteTablesStatus, setDeleteTablesStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  
  // Day Comp Tabelle Status
  const [createDayCompStatus, setCreateDayCompStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [deleteDayCompStatus, setDeleteDayCompStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [copyDayCompStatus, setCopyDayCompStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [optimizeDayCompStatus, setOptimizeDayCompStatus] = useState<'idle' | 'optimizing' | 'success' | 'error'>('idle');
  const [copyDayCompCount, setCopyDayCompCount] = useState<number>(10);
  const [checkSchemaStatus, setCheckSchemaStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [copyCompleteStatus, setCopyCompleteStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  
  // Tabellenverwaltung Status
  const [selectedTable, setSelectedTable] = useState<string>('day_comp');
  const [tableOperationStatus, setTableOperationStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [createTableStatus, setCreateTableStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [deleteTableStatus, setDeleteTableStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [copyLimit, setCopyLimit] = useState<number>(10);
  
  // Stop-Kontrollen
  const [operationController, setOperationController] = useState<AbortController | null>(null);
  
  // View Mon Comp Status  
  const [createViewMonCompStatus, setCreateViewMonCompStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [deleteViewMonCompStatus, setDeleteViewMonCompStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');

  // Tabellen-Kopier-Funktionalität
  const [selectedTableForCopy, setSelectedTableForCopy] = useState('');
  const [copyTableStatus, setCopyTableStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  
  // Modal für settingdb_neu Bearbeitung
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [settingsdbNeuJson, setSettingsdbNeuJson] = useState('');
  const [settingsdbNeuJsonError, setSettingsdbNeuJsonError] = useState<string | null>(null);
  const [saveSettingsdbNeuLoading, setSaveSettingsdbNeuLoading] = useState(false);

  const [isEditAltModalOpen, setIsEditAltModalOpen] = useState(false);
  const [settingsdbAltJson, setSettingsdbAltJson] = useState('');
  const [settingsdbAltJsonError, setSettingsdbAltJsonError] = useState<string | null>(null);
  const [saveSettingsdbAltLoading, setSaveSettingsdbAltLoading] = useState(false);

  // Modal für settingdb Bearbeitung
  const [isEditSettingsdbModalOpen, setIsEditSettingsdbModalOpen] = useState(false);
  const [settingsdbJson, setSettingsdbJson] = useState('');
  const [settingsdbJsonError, setSettingsdbJsonError] = useState<string | null>(null);
  const [saveSettingsdbLoading, setSaveSettingsdbLoading] = useState(false);

  // Modal für settingdb_fallback Bearbeitung
  const [isEditFallbackModalOpen, setIsEditFallbackModalOpen] = useState(false);
  const [settingsdbFallbackJson, setSettingsdbFallbackJson] = useState('');
  const [settingsdbFallbackJsonError, setSettingsdbFallbackJsonError] = useState<string | null>(null);
  const [saveSettingsdbFallbackLoading, setSaveSettingsdbFallbackLoading] = useState(false);
  
  // Aktuelle Konfigurationen für Anzeige
  const [currentSettingsdbNeuConfig, setCurrentSettingsdbNeuConfig] = useState<any>(null);
  const [currentSettingsdbAltConfig, setCurrentSettingsdbAltConfig] = useState<any>(null);
  const [currentSettingsdbConfig, setCurrentSettingsdbConfig] = useState<any>(null);

  // Setup-App Konfigurationen
  const [setupConfig, setSetupConfig] = useState<any>(null);

  const { toast } = useToast();

  // Lade Konfigurationen beim Mount
  useEffect(() => {
    loadSetupConfig();
    loadAllPortalConfigurations();
    checkActiveConfig();
    loadInitialDefaultConfig();
  }, []);

  // Setup-Config abhängige Ladeoperationen
  useEffect(() => {
    if (setupConfig) {
      loadSettingsdbNeuConfig();
      loadSettingsdbAltConfig();
      loadSettingsdbConfig();
    }
  }, [setupConfig]);

  const loadSetupConfig = async () => {
    try {
      const response = await fetch('/api/setup-config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSetupConfig(data.config);
          console.log('🔧 Setup-App Konfiguration geladen:', data.config);
        }
      }
    } catch (error) {
      console.error('Error loading setup-app.json:', error);
    }
  };

  const loadInitialDefaultConfig = async () => {
    const config = await loadDefaultConfig();
    if (config) {
      setDefaultConfigJson(JSON.stringify(config, null, 2));
    }
  };

  const loadDefaultConfig = async () => {
    // Lade API-Fallback-Konfiguration direkt (Portal-Datenbank)
    try {
      const response = await fetch('/api/portal/fallback-config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('📋 API-Fallback-Konfiguration geladen:', data.config);
          return data.config;
        }
      }
    } catch (error) {
      console.error('Error loading API fallback config:', error);
    }
    
    return defaultDbConfig; // Final fallback
  };

  const loadSettingsdbNeuConfig = () => {
    // Lade aus setup-app.json
    const neuConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_neu || {
      host: "j3yy.your-database.de",
      port: 5432,
      database: "heimkehr_db2025",
      username: "heimkehr_db",
      password: "vhHqu4XDZh8ux5Qq",
      ssl: false,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading settingdb_neu config from setup-app.json');
    setSettingsdbNeuJson(JSON.stringify(neuConfig, null, 2));
    setCurrentSettingsdbNeuConfig(neuConfig);
  };

  const loadDefaultSettingsdbNeuConfig = () => {
    // Verwende setup-app.json Konfiguration falls verfügbar
    const defaultConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_neu || {
      host: "j3yy.your-database.de",
      port: 5432,
      database: "heimkehr_db2025",
      username: "heimkehr_db",
      password: "vhHqu4XDZh8ux5Qq",
      ssl: false,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading default settingdb_neu config from setup-app.json');
    setSettingsdbNeuJson(JSON.stringify(defaultConfig, null, 2));
    setCurrentSettingsdbNeuConfig(defaultConfig);
  };

  const loadSettingsdbAltConfig = () => {
    // Lade aus setup-app.json
    const altConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_alt || {
      host: "docker.monitoring.direct",
      port: 51880,
      database: "horizonte-portal",
      username: "postgres",
      password: "postgres",
      ssl: false,
      schema: "public",
      table: "view_mon_comp",
      connectionTimeout: 30000
    };
    console.log('📋 Loading settingdb_alt config from setup-app.json');
    setSettingsdbAltJson(JSON.stringify(altConfig, null, 2));
    setCurrentSettingsdbAltConfig(altConfig);
  };

  const loadDefaultSettingsdbAltConfig = () => {
    // Verwende setup-app.json Konfiguration falls verfügbar
    const defaultConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_alt || {
      host: "ep-delicate-bird-afvb8ubp.c-2.us-west-2.aws.neon.tech",
      port: 5432,
      database: "neondb",
      username: "neondb_owner",
      password: "npg_7VaHxYBO5MqF",
      ssl: true,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading default settingdb_alt config from setup-app.json');
    setSettingsdbAltJson(JSON.stringify(defaultConfig, null, 2));
    setCurrentSettingsdbAltConfig(defaultConfig);
  };

  const loadSettingsdbConfig = () => {
    // Lade aus setup-app.json
    const dbConfig = setupConfig?.Datenbankkonfigurationen?.settingdb || {
      host: "j3yy.your-database.de",
      port: 5432,
      database: "heimkehr_db2025",
      username: "heimkehr_db",
      password: "vhHqu4XDZh8ux5Qq",
      ssl: false,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading settingdb config from setup-app.json');
    setSettingsdbJson(JSON.stringify(dbConfig, null, 2));
    setCurrentSettingsdbConfig(dbConfig);
  };

  const loadDefaultSettingsdbConfig = () => {
    // Verwende setup-app.json Konfiguration falls verfügbar
    const defaultConfig = setupConfig?.Datenbankkonfigurationen?.settingdb || {
      host: "j3yy.your-database.de",
      port: 5432,
      database: "heimkehr_db2025",
      username: "heimkehr_db",
      password: "vhHqu4XDZh8ux5Qq",
      ssl: false,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading default settingdb config from setup-app.json');
    setSettingsdbJson(JSON.stringify(defaultConfig, null, 2));
    setCurrentSettingsdbConfig(defaultConfig);
  };

  const saveSettingsdbNeuConfig = async () => {
    if (settingsdbNeuJsonError) {
      toast({
        title: "Fehler",
        description: "JSON-Format ist ungültig",
        variant: "destructive"
      });
      return;
    }

    setSaveSettingsdbNeuLoading(true);
    try {
      const config = JSON.parse(settingsdbNeuJson);
      
      const response = await fetch('/api/setup-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'settingdb_neu',
          value: config
        })
      });
      
      if (response.ok) {
        toast({
          title: "Konfiguration gespeichert",
          description: "settingdb_neu Konfiguration wurde erfolgreich in setup-app.json gespeichert"
        });
        setIsEditModalOpen(false);
        
        // Aktualisiere setup-config
        loadSetupConfig();
      } else {
        toast({
          title: "Fehler",
          description: "Konfiguration konnte nicht gespeichert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Speichern fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      setSaveSettingsdbNeuLoading(false);
    }
  };

  const saveSettingsdbAltConfig = async () => {
    if (settingsdbAltJsonError) {
      toast({
        title: "Fehler",
        description: "JSON-Format ist ungültig",
        variant: "destructive"
      });
      return;
    }

    setSaveSettingsdbAltLoading(true);
    try {
      const config = JSON.parse(settingsdbAltJson);
      
      const response = await fetch('/api/setup-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'settingdb_alt',
          value: config
        })
      });
      
      if (response.ok) {
        toast({
          title: "Konfiguration gespeichert",
          description: "settingdb_alt Konfiguration wurde erfolgreich in setup-app.json gespeichert"
        });
        setIsEditAltModalOpen(false);
        
        // Aktualisiere setup-config
        loadSetupConfig();
      } else {
        toast({
          title: "Fehler",
          description: "Konfiguration konnte nicht gespeichert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Speichern fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      setSaveSettingsdbAltLoading(false);
    }
  };

  const saveSettingsdbConfig = async () => {
    if (settingsdbJsonError) {
      toast({
        title: "Fehler",
        description: "JSON-Format ist ungültig",
        variant: "destructive"
      });
      return;
    }

    setSaveSettingsdbLoading(true);
    try {
      const config = JSON.parse(settingsdbJson);
      
      const response = await fetch('/api/setup-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'settingdb',
          value: config
        })
      });
      
      if (response.ok) {
        toast({
          title: "Konfiguration gespeichert",
          description: "settingdb Konfiguration wurde erfolgreich in setup-app.json gespeichert"
        });
        setIsEditSettingsdbModalOpen(false);
        
        // Aktualisiere setup-config
        loadSetupConfig();
      } else {
        toast({
          title: "Fehler",
          description: "Konfiguration konnte nicht gespeichert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Speichern fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      setSaveSettingsdbLoading(false);
    }
  };

  const loadSettingsdbFallbackConfig = () => {
    // Lade aus setup-app.json
    const fallbackConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_fallback || {
      host: "j3yy.your-database.de",
      port: 5432,
      database: "heimkehr_db2025",
      username: "heimkehr_db",
      password: "vhHqu4XDZh8ux5Qq",
      ssl: false,
      schema: "public",
      connectionTimeout: 30000
    };
    console.log('📋 Loading settingdb_fallback config from setup-app.json');
    setSettingsdbFallbackJson(JSON.stringify(fallbackConfig, null, 2));
  };


  const saveSettingsdbFallbackConfig = async () => {
    if (settingsdbFallbackJsonError) {
      toast({
        title: "Fehler",
        description: "JSON-Format ist ungültig",
        variant: "destructive"
      });
      return;
    }

    setSaveSettingsdbFallbackLoading(true);
    try {
      const config = JSON.parse(settingsdbFallbackJson);
      
      // Speichere in setup-app.json statt Datenbank
      const response = await fetch('/api/setup-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'settingdb_fallback',
          value: config
        })
      });
      
      if (response.ok) {
        toast({
          title: "Konfiguration gespeichert",
          description: "settingdb_fallback Konfiguration wurde erfolgreich gespeichert"
        });
        setIsEditFallbackModalOpen(false);
        
        // Aktualisiere setup-config
        loadSetupConfig();
      } else {
        toast({
          title: "Fehler",
          description: "Konfiguration konnte nicht gespeichert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Speichern fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      setSaveSettingsdbFallbackLoading(false);
    }
  };

  // Überschreibe settingdb mit settingdb_neu oder settingdb_alt
  const overrideSettingsdbWith = async (sourceConfig: 'settingdb_neu' | 'settingdb_alt') => {
    try {
      const sourceConfigData = sourceConfig === 'settingdb_neu' ? currentSettingsdbNeuConfig : currentSettingsdbAltConfig;
      
      if (!sourceConfigData) {
        toast({
          title: "Fehler",
          description: `${sourceConfig} Konfiguration ist nicht verfügbar`,
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'data',
          key_name: 'settingdb',
          value: sourceConfigData
        })
      });
      
      if (response.ok) {
        toast({
          title: "settingdb überschrieben",
          description: `settingdb wurde erfolgreich mit ${sourceConfig} überschrieben`
        });
        
        // Aktualisiere lokale Konfiguration
        setCurrentSettingsdbConfig(sourceConfigData);
        setSettingsdbJson(JSON.stringify(sourceConfigData, null, 2));
        
        // Server-Neustart anbieten
        if (window.confirm("Möchten Sie den Server mit der neuen Konfiguration neu starten?")) {
          handleRestartServerWithDb();
        }
      } else {
        toast({
          title: "Fehler",
          description: "settingdb konnte nicht überschrieben werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Überschreiben fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const loadAllPortalConfigurations = async () => {
    setConfigManagementStatus('loading');
    try {
      const response = await fetch('/api/portal/configs');
      if (response.ok) {
        const data = await response.json();
        setAllPortalConfigs(data.configs || []);
        setConfigManagementStatus('success');
      } else {
        setConfigManagementStatus('error');
      }
    } catch (error) {
      console.error('Error loading portal configurations:', error);
      setConfigManagementStatus('error');
    }
  };

  const checkActiveConfig = async () => {
    try {
      const response = await fetch('/api/portal/active-config');
      if (response.ok) {
        const data = await response.json();
        setActiveConfig(data.activeConfig || 'unknown');
      }
    } catch (error) {
      console.error('Error checking active config:', error);
    }
  };

  const handleCreatePortalTables = async () => {
    setCreateTablesStatus('creating');
    try {
      const response = await fetch('/api/portal/create-portal-tables', {
        method: 'POST'
      });

      if (response.ok) {
        setCreateTablesStatus('success');
        toast({
          title: "Portal-Tabellen erfolgreich erstellt",
          description: "Alle Portal-Tabellen wurden in der neuen Datenbank erstellt"
        });
      } else {
        setCreateTablesStatus('error');
        toast({
          title: "Fehler beim Erstellen der Portal-Tabellen",
          description: "Portal-Tabellen konnten nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCreateTablesStatus('error');
      toast({
        title: "Fehler beim Erstellen der Portal-Tabellen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllPortalTables = async () => {
    setDeleteTablesStatus('deleting');
    try {
      const response = await fetch('/api/portal/delete-portal-tables', {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeleteTablesStatus('success');
        toast({
          title: "Portal-Tabellen erfolgreich gelöscht",
          description: "Alle Portal-Tabellen wurden aus der neuen Datenbank entfernt"
        });
      } else {
        setDeleteTablesStatus('error');
        toast({
          title: "Fehler beim Löschen der Portal-Tabellen",
          description: "Portal-Tabellen konnten nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeleteTablesStatus('error');
      toast({
        title: "Fehler beim Löschen der Portal-Tabellen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const handleCopyTable = async () => {
    if (!selectedTableForCopy) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Tabelle zum Kopieren aus",
        variant: "destructive"
      });
      return;
    }

    setCopyTableStatus('copying');
    try {
      const response = await fetch(`/api/portal/copy-table/${selectedTableForCopy}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'alt',
          to: 'neu'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCopyTableStatus('success');
        toast({
          title: "Tabelle erfolgreich kopiert",
          description: data.message || `Tabelle ${selectedTableForCopy} wurde von ALT zu NEU kopiert`
        });
      } else {
        setCopyTableStatus('error');
        toast({
          title: "Fehler beim Kopieren der Tabelle",
          description: `Tabelle ${selectedTableForCopy} konnte nicht kopiert werden`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setCopyTableStatus('error');
      toast({
        title: "Fehler beim Kopieren der Tabelle",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  // Server-Neustart mit DB-Konfiguration
  const handleRestartServerWithDb = async () => {
    if (!selectedRestartConfig) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Datenbank-Konfiguration aus",
        variant: "destructive"
      });
      return;
    }

    setRestartLoading(true);
    try {
      const response = await fetch('/api/portal/restart-server-with-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settingdbKey: selectedRestartConfig
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Server-Neustart eingeleitet",
          description: `Server wird mit ${selectedRestartConfig} neu gestartet`
        });
        
        // Warte kurz und lade dann die Seite neu
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast({
          title: "Fehler beim Server-Neustart",
          description: data.message || "Server konnte nicht neu gestartet werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler beim Server-Neustart",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setRestartLoading(false);
    }
  };



  // Day Comp Tabelle Handler
  const handleCreateDayComp = async () => {
    setCreateDayCompStatus('creating');
    try {
      const response = await api.post('/api/portal/create-day-comp');

      if (response.ok) {
        setCreateDayCompStatus('success');
        toast({
          title: "Day Comp Tabelle erfolgreich erstellt",
          description: "Tagesverbrauchsdaten-Tabelle wurde in der settingdb_neu erstellt"
        });
      } else {
        setCreateDayCompStatus('error');
        toast({
          title: "Fehler beim Erstellen der Day Comp Tabelle",
          description: "Tabelle konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCreateDayCompStatus('error');
      toast({
        title: "Fehler",
        description: "Day Comp Tabelle erstellen fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDayComp = async () => {
    setDeleteDayCompStatus('deleting');
    try {
      const response = await api.delete('/api/portal/delete-day-comp');

      if (response.ok) {
        setDeleteDayCompStatus('success');
        toast({
          title: "Day Comp Tabelle erfolgreich gelöscht",
          description: "Tagesverbrauchsdaten-Tabelle wurde aus der settingdb_neu entfernt"
        });
      } else {
        setDeleteDayCompStatus('error');
        toast({
          title: "Fehler beim Löschen der Day Comp Tabelle",
          description: "Tabelle konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeleteDayCompStatus('error');
      toast({
        title: "Fehler",
        description: "Day Comp Tabelle löschen fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleOptimizeDayComp = async () => {
    setOptimizeDayCompStatus('optimizing');
    try {
      const response = await api.post('/api/portal/optimize-day-comp');

      if (response.ok) {
        const result = await response.json();
        setOptimizeDayCompStatus('success');
        toast({
          title: "Day Comp Schema erfolgreich optimiert",
          description: `Optimierungen: ${result.optimizations?.join(', ') || 'Schema verbessert'}`
        });
      } else {
        setOptimizeDayCompStatus('error');
        toast({
          title: "Fehler bei Schema-Optimierung",
          description: "Schema konnte nicht optimiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setOptimizeDayCompStatus('error');
      toast({
        title: "Fehler",
        description: "Schema-Optimierung fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleCheckDayCompSchema = async () => {
    setCheckSchemaStatus('checking');
    try {
      const response = await api.get('/api/portal/check-day-comp-schema');

      if (response.ok) {
        const result = await response.json();
        setCheckSchemaStatus('success');
        setSchemaInfo(result);
        toast({
          title: "Schema erfolgreich gelesen",
          description: `${result.message}`
        });
      } else {
        setCheckSchemaStatus('error');
        toast({
          title: "Fehler beim Schema lesen",
          description: "Schema konnte nicht gelesen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCheckSchemaStatus('error');
      toast({
        title: "Fehler",
        description: "Schema lesen fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  // Universelle Tabellen-Handler
  // Stop alle laufenden Operationen
  const handleStopOperation = () => {
    if (operationController && !operationController.signal.aborted) {
      try {
        operationController.abort('Operation von Benutzer gestoppt');
        setOperationController(null);
      } catch (error) {
        console.log('AbortController bereits abgebrochen:', error);
      }
    }
    setCreateTableStatus('idle');
    setTableOperationStatus('idle');
    setDeleteTableStatus('idle');
    toast({
      title: "Operation gestoppt", 
      description: "Alle laufenden Vorgänge wurden abgebrochen"
    });
  };

  const handleCreateTable = async () => {
    setCreateTableStatus('creating');
    
    // Erstelle neuen AbortController
    const controller = new AbortController();
    setOperationController(controller);
    
    try {
      const response = await fetch('/api/portal/copy-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          copyMode: 'schema'
        }),
        signal: controller.signal
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCreateTableStatus('success');
          toast({
            title: "Leere Tabelle erstellt",
            description: `${selectedTable} Schema erfolgreich kopiert (ohne Daten)`
          });
        } else {
          setCreateTableStatus('error');
          toast({
            title: "Erstellen fehlgeschlagen",
            description: result.message || "Unbekannter Fehler",
            variant: "destructive"
          });
        }
      } else {
        setCreateTableStatus('error');
        toast({
          title: "Fehler beim Erstellen",
          description: "Tabelle konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setCreateTableStatus('idle');
        toast({
          title: "Operation abgebrochen",
          description: "Tabellenerstellung wurde gestoppt"
        });
      } else {
        setCreateTableStatus('error');
        toast({
          title: "Fehler",
          description: error.message || "Tabellenerstellung fehlgeschlagen",
          variant: "destructive"
        });
      }
    } finally {
      setOperationController(null);
    }
  };

  const handleCopyTableData = async () => {
    setTableOperationStatus('copying');
    try {
      const response = await api.post('/api/portal/copy-table', {
        tableName: selectedTable,
        copyMode: 'latest',
        limit: copyLimit
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTableOperationStatus('success');
          toast({
            title: "Daten kopiert",
            description: `${result.copiedCount} neueste Einträge von ${selectedTable} kopiert`
          });
        } else {
          setTableOperationStatus('error');
          toast({
            title: "Kopieren fehlgeschlagen",
            description: result.message || "Unbekannter Fehler",
            variant: "destructive"
          });
        }
      } else {
        setTableOperationStatus('error');
        toast({
          title: "Fehler beim Kopieren",
          description: "Daten konnten nicht kopiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTableOperationStatus('error');
      toast({
        title: "Fehler",
        description: "Datenkopierung fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTable = async () => {
    setDeleteTableStatus('deleting');
    try {
      const response = await api.delete('/api/portal/delete-table', {
        tableName: selectedTable
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDeleteTableStatus('success');
          toast({
            title: "Tabelle gelöscht",
            description: `${selectedTable} (${result.deletedType}) erfolgreich gelöscht`
          });
        } else {
          setDeleteTableStatus('error');
          toast({
            title: "Löschen fehlgeschlagen",
            description: result.message || "Unbekannter Fehler",
            variant: "destructive"
          });
        }
      } else {
        setDeleteTableStatus('error');
        toast({
          title: "Fehler beim Löschen",
          description: "Tabelle konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeleteTableStatus('error');
      toast({
        title: "Fehler",
        description: "Tabellenlöschung fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleCopyDayCompData = async () => {
    setCopyDayCompStatus('copying');
    try {
      const response = await api.post('/api/portal/copy-day-comp-data', {
        count: copyDayCompCount
      });

      if (response.ok) {
        const result = await response.json();
        setCopyDayCompStatus('success');
        toast({
          title: "Day Comp Daten erfolgreich kopiert",
          description: `${result.copiedCount || 'Unbekannte Anzahl'} Einträge wurden in die Portal-DB kopiert`
        });
      } else {
        setCopyDayCompStatus('error');
        toast({
          title: "Fehler beim Kopieren der Day Comp Daten",
          description: "Daten konnten nicht kopiert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCopyDayCompStatus('error');
      toast({
        title: "Fehler",
        description: "Day Comp Daten kopieren fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  // View Mon Comp Handler
  const handleCreateViewMonComp = async () => {
    setCreateViewMonCompStatus('creating');
    try {
      const response = await api.post('/api/portal/create-view-mon-comp');

      if (response.ok) {
        setCreateViewMonCompStatus('success');
        toast({
          title: "view_mon_comp View erfolgreich erstellt",
          description: "PostgreSQL View für monatliche Aggregation wurde erstellt"
        });
      } else {
        setCreateViewMonCompStatus('error');
        toast({
          title: "Fehler beim Erstellen der view_mon_comp View",
          description: "PostgreSQL View konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCreateViewMonCompStatus('error');
      toast({
        title: "Fehler",
        description: "view_mon_comp View erstellen fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const handleDeleteViewMonComp = async () => {
    setDeleteViewMonCompStatus('deleting');
    try {
      const response = await api.delete('/api/portal/delete-view-mon-comp');

      if (response.ok) {
        setDeleteViewMonCompStatus('success');
        toast({
          title: "view_mon_comp View erfolgreich gelöscht",
          description: "PostgreSQL View wurde aus der settingdb_neu entfernt"
        });
      } else {
        setDeleteViewMonCompStatus('error');
        toast({
          title: "Fehler beim Löschen der view_mon_comp View",
          description: "PostgreSQL View konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeleteViewMonCompStatus('error');
      toast({
        title: "Fehler",
        description: "view_mon_comp View löschen fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const availableTables = [
    'settings',
    'objects', 
    'mandants',
    'users',
    'user_profiles',
    'object_mandant',
    'object_groups',
    'user_activity_logs',
    'daily_outdoor_temperatures',
    'logbook_entries',
    'todo_tasks',
    'day_comp'
  ];

  return (
    <div className="space-y-6">
      {/* NEU DB Portal-Tabellen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            NEU DB Portal-Tabellen (settingdb_neu)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleCreatePortalTables}
              disabled={createTablesStatus === 'creating'}
              className="h-9 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1 text-xs"
              data-testid="button-create-portal-tables"
            >
              <Plus className="w-3 h-3" />
              {createTablesStatus === 'creating' ? 'Erstelle...' : 'Erstellen'}
            </Button>
            
            <Button
              onClick={handleDeleteAllPortalTables}
              disabled={deleteTablesStatus === 'deleting'}
              className="h-9 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 text-xs"
              data-testid="button-delete-all-portal-tables"
            >
              <Trash2 className="w-3 h-3" />
              {deleteTablesStatus === 'deleting' ? 'Lösche...' : 'Löschen'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className={`${getStatusColor(createTablesStatus)} text-xs justify-center py-1`}>
              {getStatusIcon(createTablesStatus)}
              <span className="ml-1">{createTablesStatus}</span>
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(deleteTablesStatus)} text-xs justify-center py-1`}>
              {getStatusIcon(deleteTablesStatus)}
              <span className="ml-1">{deleteTablesStatus}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Energiedaten */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Energiedaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabelle Tagesverbrauchsdaten (day_comp) */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium mb-2 text-sm">Tabelle Tagesverbrauchsdaten (day_comp)</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCreateDayComp}
                disabled={createDayCompStatus === 'creating'}
                className="h-9 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1 text-xs"
                data-testid="button-create-day-comp"
              >
                <Plus className="w-3 h-3" />
                {createDayCompStatus === 'creating' ? 'Erstelle...' : 'Erstellen'}
              </Button>
              
              <Badge variant="outline" className={`${getStatusColor(createDayCompStatus)} text-xs justify-center py-1`}>
                {getStatusIcon(createDayCompStatus)}
                <span className="ml-1">{createDayCompStatus}</span>
              </Badge>
            </div>
          </div>

          {/* PostgreSQL Views - view_mon_comp */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium mb-2 text-sm">View: view_mon_comp (Monatliche Aggregation)</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCreateViewMonComp}
                disabled={createViewMonCompStatus === 'creating'}
                className="h-9 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1 text-xs"
                data-testid="button-create-view-mon-comp"
              >
                <Plus className="w-3 h-3" />
                {createViewMonCompStatus === 'creating' ? 'Erstelle...' : 'Erstellen'}
              </Button>
              
              <Badge variant="outline" className={`${getStatusColor(createViewMonCompStatus)} text-xs justify-center py-1`}>
                {getStatusIcon(createViewMonCompStatus)}
                <span className="ml-1">{createViewMonCompStatus}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Daten zwischen Datenbanken kopieren */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Copy className="w-4 h-4" />
            Daten zwischen Datenbanken kopieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedTableForCopy} onValueChange={setSelectedTableForCopy}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tabelle auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleCopyTable}
              disabled={copyTableStatus === 'copying' || !selectedTableForCopy}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 text-xs"
              data-testid="button-copy-table"
            >
              {copyTableStatus === 'copying' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Kopiere...
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  ALT → NEU
                </>
              )}
            </Button>
          </div>

          {copyTableStatus !== 'idle' && (
            <Badge variant="outline" className={`${getStatusColor(copyTableStatus)} text-xs justify-center py-1`}>
              {getStatusIcon(copyTableStatus)}
              <span className="ml-1">{copyTableStatus}</span>
              {selectedTableForCopy && <span className="ml-1">({selectedTableForCopy})</span>}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Portal-Konfigurationen - moved before Server-Neustart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[16px]">
            <Database className="w-4 h-4" />
            Portal-Konfigurationen ( /setup-app.json)
          </CardTitle>
          
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Portal Configuration Selection */}
          <div className="grid grid-cols-2 gap-3">
            {/* settingdb (Aktuelle Portal-DB) */}
            <div className="p-3 border-2 border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-green-800">settingdb (Aktuelle Portal-DB)</h4>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={async () => {
                      try {
                        const testConfig = currentSettingsdbConfig || setupConfig?.Datenbankkonfigurationen?.settingdb;
                        if (!testConfig) return;
                        
                        const response = await fetch('/api/portal/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(testConfig)
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Verbindung erfolgreich",
                            description: "Verbindung zu settingdb hergestellt"
                          });
                        } else {
                          toast({
                            title: "Verbindungsfehler",
                            description: "Verbindung zu settingdb fehlgeschlagen",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Fehler",
                          description: "settingdb Verbindungstest fehlgeschlagen",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Dialog open={isEditSettingsdbModalOpen} onOpenChange={setIsEditSettingsdbModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => {
                          loadSettingsdbConfig();
                          setIsEditSettingsdbModalOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          settingdb Konfiguration bearbeiten
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            JSON-Konfiguration:
                          </label>
                          <textarea
                            value={settingsdbJson}
                            onChange={(e) => {
                              setSettingsdbJson(e.target.value);
                              try {
                                JSON.parse(e.target.value);
                                setSettingsdbJsonError(null);
                              } catch (error) {
                                setSettingsdbJsonError('Ungültiges JSON-Format');
                              }
                            }}
                            className={`w-full h-80 px-3 py-2 border rounded-md text-sm font-mono ${
                              settingsdbJsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="JSON-Konfiguration eingeben..."
                          />
                          {settingsdbJsonError && (
                            <p className="text-red-600 text-xs mt-1">{settingsdbJsonError}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditSettingsdbModalOpen(false)}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            onClick={saveSettingsdbConfig}
                            disabled={!!settingsdbJsonError || saveSettingsdbLoading}
                            className="flex items-center gap-2"
                          >
                            {saveSettingsdbLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-white p-2 rounded font-mono mb-2">
                {currentSettingsdbConfig ? 
                  `${currentSettingsdbConfig.host}:${currentSettingsdbConfig.port}/${currentSettingsdbConfig.database}` :
                  'j3yy.your-database.de:5432/heimkehr_db2025'
                }
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs flex-1"
                  onClick={() => overrideSettingsdbWith('settingdb_neu')}
                >
                  ← NEU
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs flex-1"
                  onClick={() => overrideSettingsdbWith('settingdb_alt')}
                >
                  ← ALT
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRestartConfig('settingdb');
                    handleRestartServerWithDb();
                  }}
                  disabled={restartLoading}
                  className="h-7 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-1 text-xs flex-1"
                  data-testid="button-restart-server-settingdb"
                >
                  {restartLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wifi className="w-3 h-3" />
                  )}
                  {restartLoading ? 'Neustart...' : 'Restart'}
                </Button>
              </div>
            </div>

            {/* settingdb_fallback */}
            <div className="p-3 border-2 border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-orange-800">settingdb_fallback</h4>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={async () => {
                      try {
                        const testConfig = setupConfig?.Datenbankkonfigurationen?.settingdb_fallback;
                        if (!testConfig) return;
                        
                        const response = await fetch('/api/portal/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(testConfig)
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Verbindung erfolgreich",
                            description: "Verbindung zu settingdb_fallback hergestellt"
                          });
                        } else {
                          toast({
                            title: "Verbindungsfehler",
                            description: "Verbindung zu settingdb_fallback fehlgeschlagen",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Fehler",
                          description: "settingdb_fallback Verbindungstest fehlgeschlagen",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Dialog open={isEditFallbackModalOpen} onOpenChange={setIsEditFallbackModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => {
                          loadSettingsdbFallbackConfig();
                          setIsEditFallbackModalOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          settingdb_fallback Konfiguration bearbeiten
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            JSON-Konfiguration:
                          </label>
                          <textarea
                            value={settingsdbFallbackJson}
                            onChange={(e) => {
                              setSettingsdbFallbackJson(e.target.value);
                              try {
                                JSON.parse(e.target.value);
                                setSettingsdbFallbackJsonError(null);
                              } catch (error) {
                                setSettingsdbFallbackJsonError('Ungültiges JSON-Format');
                              }
                            }}
                            className={`w-full h-80 px-3 py-2 border rounded-md text-sm font-mono ${
                              settingsdbFallbackJsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="JSON-Konfiguration eingeben..."
                          />
                          {settingsdbFallbackJsonError && (
                            <p className="text-red-600 text-xs mt-1">{settingsdbFallbackJsonError}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditFallbackModalOpen(false)}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            onClick={saveSettingsdbFallbackConfig}
                            disabled={!!settingsdbFallbackJsonError || saveSettingsdbFallbackLoading}
                            className="flex items-center gap-2"
                          >
                            {saveSettingsdbFallbackLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-white p-2 rounded font-mono mb-2">
                {setupConfig?.Datenbankkonfigurationen?.settingdb_fallback ? 
                  `${setupConfig.Datenbankkonfigurationen.settingdb_fallback.host}:${setupConfig.Datenbankkonfigurationen.settingdb_fallback.port}/${setupConfig.Datenbankkonfigurationen.settingdb_fallback.database}` :
                  'j3yy.your-database.de:5432/heimkehr_db2025'
                }
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Portal (settingdb_neu)</h4>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/portal/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            host: "j3yy.your-database.de",
                            port: 5432,
                            database: "heimkehr_db2025",
                            username: "heimkehr_db",
                            ssl: false
                          })
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Verbindung erfolgreich",
                            description: "Verbindung zu Portal (settingdb_neu) hergestellt"
                          });
                        } else {
                          toast({
                            title: "Verbindungsfehler",
                            description: "Verbindung zu Portal (settingdb_neu) fehlgeschlagen",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Fehler",
                          description: "Portal (settingdb_neu) Verbindungstest fehlgeschlagen",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => {
                          loadSettingsdbNeuConfig();
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          settingdb_neu Konfiguration bearbeiten
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            JSON-Konfiguration:
                          </label>
                          <textarea
                            value={settingsdbNeuJson}
                            onChange={(e) => {
                              setSettingsdbNeuJson(e.target.value);
                              try {
                                JSON.parse(e.target.value);
                                setSettingsdbNeuJsonError(null);
                              } catch (error) {
                                setSettingsdbNeuJsonError('Ungültiges JSON-Format');
                              }
                            }}
                            className={`w-full h-80 px-3 py-2 border rounded-md text-sm font-mono ${
                              settingsdbNeuJsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="JSON-Konfiguration eingeben..."
                          />
                          {settingsdbNeuJsonError && (
                            <p className="text-red-600 text-xs mt-1">{settingsdbNeuJsonError}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            onClick={saveSettingsdbNeuConfig}
                            disabled={!!settingsdbNeuJsonError || saveSettingsdbNeuLoading}
                            className="flex items-center gap-2"
                          >
                            {saveSettingsdbNeuLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded font-mono">
                {currentSettingsdbNeuConfig ? 
                  `${currentSettingsdbNeuConfig.host}:${currentSettingsdbNeuConfig.port}/${currentSettingsdbNeuConfig.database}` :
                  'j3yy.your-database.de:5432/heimkehr_db2025'
                }
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Portal (settingdb_alt)</h4>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/portal/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            host: "portal.monitoring.direct",
                            port: 51880,
                            database: "portal",
                            username: "postgres",
                            ssl: false
                          })
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Verbindung erfolgreich",
                            description: "Verbindung zu Portal (settingdb_alt) hergestellt"
                          });
                        } else {
                          toast({
                            title: "Verbindungsfehler",
                            description: "Verbindung zu Portal (settingdb_alt) fehlgeschlagen",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Fehler",
                          description: "Portal (settingdb_alt) Verbindungstest fehlgeschlagen",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Test
                  </Button>

                  <Dialog open={isEditAltModalOpen} onOpenChange={setIsEditAltModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={loadSettingsdbAltConfig}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          settingdb_alt Konfiguration bearbeiten
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            JSON-Konfiguration:
                          </label>
                          <textarea
                            value={settingsdbAltJson}
                            onChange={(e) => {
                              setSettingsdbAltJson(e.target.value);
                              try {
                                JSON.parse(e.target.value);
                                setSettingsdbAltJsonError(null);
                              } catch (error) {
                                setSettingsdbAltJsonError('Ungültiges JSON-Format');
                              }
                            }}
                            className={`w-full h-80 px-3 py-2 border rounded-md text-sm font-mono ${
                              settingsdbAltJsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="JSON-Konfiguration eingeben..."
                          />
                          {settingsdbAltJsonError && (
                            <p className="text-red-600 text-xs mt-1">{settingsdbAltJsonError}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditAltModalOpen(false)}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            onClick={saveSettingsdbAltConfig}
                            disabled={!!settingsdbAltJsonError || saveSettingsdbAltLoading}
                            className="flex items-center gap-2"
                          >
                            {saveSettingsdbAltLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Speichern
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded font-mono">
                {currentSettingsdbAltConfig ? 
                  `${currentSettingsdbAltConfig.host}:${currentSettingsdbAltConfig.port}/${currentSettingsdbAltConfig.database}` :
                  'portal.monitoring.direct:51880/portal'
                }
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}