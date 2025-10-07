import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Database, Key, Shield, CheckCircle, XCircle, Loader2, Settings, Save, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-utils";

interface FallbackConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  schema: string;
  table: string;
  connectionTimeout: number;
}

export function FallbackDatabaseAccess() {
  const [fallbackConfig, setFallbackConfig] = useState<FallbackConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for configuration editing
  const [editConfig, setEditConfig] = useState<FallbackConfig | null>(null);
  const [jsonConfig, setJsonConfig] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Lade API-Fallback-Konfiguration
  useEffect(() => {
    loadFallbackConfig();
  }, []);

  const loadFallbackConfig = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/portal/fallback-config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFallbackConfig(data.config);
          setEditConfig(data.config);
          setJsonConfig(JSON.stringify(data.config, null, 2));
          console.log('📋 Fallback-Konfiguration für SystemSetup geladen:', data.config);
        }
      }
    } catch (error) {
      console.error('Error loading fallback config:', error);
      toast({
        title: "Fehler",
        description: "Fallback-Konfiguration konnte nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFallbackConnection = async () => {
    if (!fallbackConfig) return;

    setConnectionStatus('testing');
    try {
      const response = await api.post('/api/portal/test-connection', {
        host: fallbackConfig.host,
        port: fallbackConfig.port,
        database: fallbackConfig.database,
        username: fallbackConfig.username,
        password: fallbackConfig.password,
        connectionTimeout: fallbackConfig.connectionTimeout
      });

      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus('success');
        toast({
          title: "Verbindung erfolgreich",
          description: `Verbindung zur Fallback-Datenbank erfolgreich: ${fallbackConfig.host}/${fallbackConfig.database}`
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Verbindungsfehler",
          description: result.message || "Verbindung zur Fallback-Datenbank fehlgeschlagen",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Fehler",
        description: "Verbindungstest fehlgeschlagen",
        variant: "destructive"
      });
    }
  };

  const updateFormField = (field: keyof FallbackConfig, value: any) => {
    if (editConfig) {
      const updated = { ...editConfig, [field]: value };
      setEditConfig(updated);
      setJsonConfig(JSON.stringify(updated, null, 2));
    }
  };

  const updateFromJson = (jsonString: string) => {
    setJsonConfig(jsonString);
    setJsonError(null);
    
    try {
      const parsed = JSON.parse(jsonString);
      setEditConfig(parsed);
    } catch (error) {
      setJsonError('Ungültiges JSON-Format');
    }
  };

  const saveConfiguration = async () => {
    if (!editConfig || jsonError) return;

    setIsSaving(true);
    try {
      const response = await api.post('/api/portal/save-fallback-config', editConfig);

      const result = await response.json();
      
      if (result.success) {
        setFallbackConfig(editConfig);
        toast({
          title: "Erfolgreich gespeichert",
          description: "API-Fallback-Konfiguration wurde aktualisiert"
        });
      } else {
        throw new Error(result.message || 'Speichern fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: "Fehler",
        description: error.message || "Konfiguration konnte nicht gespeichert werden",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activateFallbackConfiguration = async () => {
    if (!fallbackConfig) return;

    setIsConfiguring(true);
    try {
      // Kopiere Fallback-Konfiguration als aktive settingdb-Konfiguration
      const settingData = {
        category: 'data',
        keyName: 'settingdb',
        value: {
          host: fallbackConfig.host,
          port: fallbackConfig.port,
          database: fallbackConfig.database,
          username: fallbackConfig.username,
          password: fallbackConfig.password,
          ssl: fallbackConfig.ssl,
          connectionTimeout: fallbackConfig.connectionTimeout
        },
        userId: null,
        mandantId: null
      };

      const response = await api.post('/api/settings', {
        category: 'data',
        key_name: 'fallback_db_config',
        value: fallbackConfig
      });

      if (response.ok) {
        toast({
          title: "Konfiguration aktiviert",
          description: "Fallback-Konfiguration wurde als aktive settingdb-Konfiguration gespeichert"
        });

        // Server-Neustart auslösen
        const restartResponse = await api.post('/api/database/restart-server', { configKey: 'settingdb' });

        if (restartResponse.ok) {
          toast({
            title: "Server wird neu gestartet",
            description: "System wird mit neuer Konfiguration neu gestartet..."
          });
        }
      } else {
        toast({
          title: "Fehler",
          description: "Konfiguration konnte nicht aktiviert werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aktivierung der Konfiguration fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Lade Fallback-Konfiguration...</span>
        </CardContent>
      </Card>
    );
  }

  if (!fallbackConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Keine Fallback-Konfiguration verfügbar</p>
            <Button onClick={loadFallbackConfig} variant="outline" className="mt-4">
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>API-Fallback-Konfiguration bearbeiten (Portal-Datenbank)</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Diese Fallback-Konfiguration wird verwendet, wenn settingdb-Einstellungen nicht verfügbar sind. 
          Nutzt die Portal-Datenbank als Fallback-System.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
            <TabsTrigger value="actions">Aktionen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Konfigurationsübersicht */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Fallback-Status:</span>
                <Badge className={getStatusColor()}>
                  {getStatusIcon()}
                  <span className="ml-1">
                    {connectionStatus === 'success' ? 'Verbunden' : 
                     connectionStatus === 'testing' ? 'Teste...' : 
                     connectionStatus === 'error' ? 'Fehler' : 'Nicht getestet'}
                  </span>
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Host:</span>
                  <span className="ml-2 font-mono">{fallbackConfig.host}</span>
                </div>
                <div>
                  <span className="text-gray-600">Datenbank:</span>
                  <span className="ml-2 font-mono">{fallbackConfig.database}</span>
                </div>
                <div>
                  <span className="text-gray-600">Benutzer:</span>
                  <span className="ml-2 font-mono">{fallbackConfig.username}</span>
                </div>
                <div>
                  <span className="text-gray-600">Port:</span>
                  <span className="ml-2 font-mono">{fallbackConfig.port}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            {editConfig && (
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Formular</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={editConfig.host}
                        onChange={(e) => updateFormField('host', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={editConfig.port}
                        onChange={(e) => updateFormField('port', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="database">Datenbank</Label>
                      <Input
                        id="database"
                        value={editConfig.database}
                        onChange={(e) => updateFormField('database', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Benutzername</Label>
                      <Input
                        id="username"
                        value={editConfig.username}
                        onChange={(e) => updateFormField('username', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Passwort</Label>
                      <Input
                        id="password"
                        type="password"
                        value={editConfig.password}
                        onChange={(e) => updateFormField('password', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="schema">Schema</Label>
                      <Input
                        id="schema"
                        value={editConfig.schema}
                        onChange={(e) => updateFormField('schema', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="json" className="space-y-4">
                  <div>
                    <Label htmlFor="json-config">JSON-Konfiguration</Label>
                    <Textarea
                      id="json-config"
                      rows={12}
                      value={jsonConfig}
                      onChange={(e) => updateFromJson(e.target.value)}
                      className={`font-mono text-sm ${jsonError ? 'border-red-500' : ''}`}
                    />
                    {jsonError && (
                      <p className="text-sm text-red-600 mt-1">{jsonError}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={saveConfiguration} 
                disabled={isSaving || !!jsonError}
                className="flex items-center space-x-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Konfiguration speichern</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={testFallbackConnection} 
                disabled={connectionStatus === 'testing'}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {connectionStatus === 'testing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Verbindung testen</span>
              </Button>
              
              <Button 
                onClick={activateFallbackConfiguration} 
                disabled={isConfiguring || connectionStatus !== 'success'}
                className="flex items-center space-x-2"
              >
                {isConfiguring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>Als aktive Konfiguration verwenden</span>
              </Button>
              
              <Button 
                onClick={loadFallbackConfig} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Neu laden</span>
              </Button>
            </div>

            {connectionStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Fallback-Verbindung erfolgreich getestet. Diese Konfiguration kann als aktive settingdb verwendet werden.
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FallbackDatabaseAccess;