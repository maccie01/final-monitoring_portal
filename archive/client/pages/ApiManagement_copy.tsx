import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, 
  Search, 
  Database, 
  Shield, 
  BarChart3, 
  Building, 
  Users, 
  Group, 
  MonitorSpeaker, 
  AlertTriangle, 
  Settings, 
  FileText, 
  Thermometer,
  ChevronDown,
  Play,
  Copy,
  CheckCircle,
  Mail
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  authRequired: boolean;
}

interface ApiCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  endpoints: ApiEndpoint[];
}

interface TestResult {
  status: number;
  statusText: string;
  data: any;
  headers: any;
  duration: number;
}

export default function ApiTests() {
  const [selectedCategory, setSelectedCategory] = useState<string>('auth');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [requestParams, setRequestParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestUrl, setRequestUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const apiCategories: ApiCategory[] = [
    {
      id: "auth",
      name: "Authentifizierung",
      description: "Login, Logout und Benutzeridentifikation",
      icon: Shield,
      color: "bg-blue-500",
      endpoints: [
        { method: "POST", path: "/api/superadmin-login", description: "Superadmin-Login für System-Setup", authRequired: false },
        { method: "POST", path: "/api/demo-login", description: "Demo-Benutzer Login", authRequired: false },
        { method: "POST", path: "/api/user-login", description: "Standard-Benutzer Login", authRequired: false },
        { method: "POST", path: "/api/auth/logout", description: "Benutzer abmelden", authRequired: true },
        { method: "GET", path: "/api/auth/user", description: "Aktueller Benutzer abrufen", authRequired: true }
      ]
    },
    {
      id: "dashboard",
      name: "Dashboard & KPIs",
      description: "Performance-Indikatoren und Übersichten",
      icon: BarChart3,
      color: "bg-green-500",
      endpoints: [
        { method: "GET", path: "/api/dashboard/kpis", description: "Key Performance Indicators", authRequired: true },
        { method: "GET", path: "/api/dashboard/energy-classes", description: "Energieklassen-Übersicht", authRequired: true },
        { method: "GET", path: "/api/dashboard/critical-systems", description: "Kritische Systeme", authRequired: true }
      ]
    },
    {
      id: "objects",
      name: "Objektverwaltung",
      description: "Gebäude und Objektmanagement",
      icon: Building,
      color: "bg-purple-500",
      endpoints: [
        { method: "GET", path: "/api/objects", description: "Alle Objekte abrufen", authRequired: true },
        { method: "GET", path: "/api/objects/with-mandants", description: "Objekte mit Mandantenzuordnungen", authRequired: true },
        { method: "GET", path: "/api/objects/filter-options", description: "Filter-Optionen für Objekte", authRequired: true },
        { method: "GET", path: "/api/objects/:id", description: "Einzelnes Objekt abrufen", authRequired: true },
        { method: "GET", path: "/api/objects/by-objectid/:objectid", description: "Objekt nach ObjectID abrufen", authRequired: true },
        { method: "POST", path: "/api/objects", description: "Neues Objekt erstellen", authRequired: true },
        { method: "PUT", path: "/api/objects/:id", description: "Objekt aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/objects/:id", description: "Objekt löschen", authRequired: true }
      ]
    },
    {
      id: "users",
      name: "Benutzerverwaltung",
      description: "Benutzer, Profile und Berechtigungen",
      icon: Users,
      color: "bg-indigo-500",
      endpoints: [
        { method: "GET", path: "/api/users", description: "Alle Benutzer abrufen", authRequired: true },
        { method: "GET", path: "/api/users/mandant", description: "Benutzer des aktuellen Mandanten", authRequired: true },
        { method: "POST", path: "/api/users", description: "Neuen Benutzer erstellen", authRequired: true },
        { method: "PUT", path: "/api/users/:id", description: "Benutzer aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/users/:id", description: "Benutzer löschen", authRequired: true },
        { method: "GET", path: "/api/user-profiles", description: "Benutzerprofile abrufen", authRequired: true },
        { method: "POST", path: "/api/users/:id/change-password", description: "Passwort ändern", authRequired: true }
      ]
    },
    {
      id: "mandants",
      name: "Mandantenverwaltung",
      description: "Kunden und Mandanten verwalten",
      icon: Group,
      color: "bg-orange-500",
      endpoints: [
        { method: "GET", path: "/api/mandants", description: "Alle Mandanten abrufen", authRequired: true },
        { method: "POST", path: "/api/mandants", description: "Neuen Mandanten erstellen", authRequired: true },
        { method: "PUT", path: "/api/mandants/:id", description: "Mandant aktualisieren", authRequired: true },
        { method: "PATCH", path: "/api/mandants/:id", description: "Mandant teilweise aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/mandants/:id", description: "Mandant löschen", authRequired: true }
      ]
    },
    {
      id: "energy",
      name: "Energiedaten",
      description: "Energieverbrauch und Effizienzanalyse",
      icon: BarChart3,
      color: "bg-yellow-500",
      endpoints: [
        { method: "GET", path: "/api/public-daily-consumption/:objectId", description: "🆕 Öffentliche Daily Energy API (funktioniert!)", authRequired: false },
        { method: "GET", path: "/api/public-monthly-consumption/:objectId", description: "🆕 Öffentliche Monthly Energy API (funktioniert!)", authRequired: false },
        { method: "GET", path: "/api/energy-data/:systemId", description: "Energiedaten für System abrufen", authRequired: true },
        { method: "GET", path: "/api/energy", description: "Flexible Energiedaten-API", authRequired: true },
        { method: "POST", path: "/api/energy-data", description: "Neue Energiedaten erstellen", authRequired: true },
        { method: "GET", path: "/api/efficiency-analysis/:objectId", description: "✅ Klassifizierungs-API mit Klimadaten (repariert!)", authRequired: true },
        { method: "GET", path: "/api/energy-data/temperature-efficiency-chart/:objectId", description: "✅ Temperatur-Effizienz-Chart mit view_mon_comp (repariert!)", authRequired: true },
        { method: "GET", path: "/api/efficiency-analysis-opt", description: "Optimierte Effizienzanalyse", authRequired: true }
      ]
    },
    {
      id: "alerts",
      name: "System-Alerts",
      description: "Alarme und Systembenachrichtigungen",
      icon: AlertTriangle,
      color: "bg-red-400",
      endpoints: [
        { method: "GET", path: "/api/system-alerts", description: "System-Alerts abrufen", authRequired: true },
        { method: "POST", path: "/api/system-alerts", description: "Neuen Alert erstellen", authRequired: true },
        { method: "PUT", path: "/api/system-alerts/:id/resolve", description: "Alert als gelöst markieren", authRequired: true }
      ]
    },
    {
      id: "settings",
      name: "Einstellungen",
      description: "Systemkonfiguration und Parameter",
      icon: Settings,
      color: "bg-gray-500",
      endpoints: [
        { method: "GET", path: "/api/settings", description: "Einstellungen abrufen", authRequired: true },
        { method: "GET", path: "/api/settings/:category/:key", description: "Spezifische Einstellung abrufen", authRequired: true },
        { method: "POST", path: "/api/settings", description: "Neue Einstellung erstellen", authRequired: true },
        { method: "PUT", path: "/api/settings/:id", description: "Einstellung aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/settings/:id", description: "Einstellung löschen", authRequired: true },
        { method: "GET", path: "/api/settings/system-title", description: "System-Titel abrufen", authRequired: true },
        { method: "POST", path: "/api/settings/system-title", description: "System-Titel setzen", authRequired: true },
        { method: "DELETE", path: "/api/settings/clear", description: "Alle Einstellungen löschen", authRequired: true },
        { method: "GET", path: "/api/settings/thresholds", description: "Schwellenwerte abrufen", authRequired: true }
      ]
    },
    {
      id: "logbook",
      name: "Logbuch & Aufgaben",
      description: "Einträge und Todo-Verwaltung",
      icon: FileText,
      color: "bg-teal-500",
      endpoints: [
        { method: "GET", path: "/api/logbook/entries", description: "Logbuch-Einträge abrufen", authRequired: true },
        { method: "GET", path: "/api/logbook/entries/:id", description: "Einzelnen Eintrag abrufen", authRequired: true },
        { method: "POST", path: "/api/logbook/entries", description: "Neuen Eintrag erstellen", authRequired: true },
        { method: "PUT", path: "/api/logbook/entries/:id", description: "Eintrag aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/logbook/entries/:id", description: "Eintrag löschen", authRequired: true },
        { method: "GET", path: "/api/logbook/tasks", description: "Todo-Aufgaben abrufen", authRequired: true },
        { method: "POST", path: "/api/logbook/tasks", description: "Neue Aufgabe erstellen", authRequired: true }
      ]
    },
    {
      id: "objectgroups",
      name: "Objektgruppen",
      description: "Gruppierung und Zuordnungen",
      icon: Group,
      color: "bg-pink-500",
      endpoints: [
        { method: "GET", path: "/api/object-groups", description: "Objektgruppen abrufen", authRequired: true },
        { method: "POST", path: "/api/object-groups", description: "Neue Objektgruppe erstellen", authRequired: true },
        { method: "PUT", path: "/api/object-groups/:id", description: "Objektgruppe aktualisieren", authRequired: true },
        { method: "DELETE", path: "/api/object-groups/:id", description: "Objektgruppe löschen", authRequired: true },
        { method: "GET", path: "/api/object-groups/:groupId/assignments", description: "Gruppenzuordnungen abrufen", authRequired: true },
        { method: "POST", path: "/api/object-groups/:groupId/assignments", description: "Objekt zu Gruppe zuordnen", authRequired: true },
        { method: "DELETE", path: "/api/object-groups/:groupId/assignments/:objectId", description: "Zuordnung entfernen", authRequired: true }
      ]
    },
    {
      id: "grafana",
      name: "Grafana Integration",
      description: "Dashboard-Content und Monitoring",
      icon: MonitorSpeaker,
      color: "bg-cyan-500",
      endpoints: [
        { method: "GET", path: "/api/grafana-content", description: "Grafana Dashboard-Content abrufen", authRequired: true }
      ]
    },
    {
      id: "climate",
      name: "Klimadaten",
      description: "Temperaturdaten und Wetterinformationen",
      icon: Thermometer,
      color: "bg-sky-500",
      endpoints: [
        { method: "POST", path: "/api/restore-climate-data", description: "Klimadaten wiederherstellen", authRequired: true },
        { method: "GET", path: "/api/outdoor-temperatures/postal-code/:postalCode", description: "Außentemperaturen nach PLZ", authRequired: true },
        { method: "POST", path: "/api/temperature/update", description: "Temperaturdaten aktualisieren", authRequired: true }
      ]
    },
    {
      id: "portal",
      name: "System-Konfiguration",
      description: "Portal-DB, Datenbankmanagement und Setup",
      icon: Database,
      color: "bg-violet-500",
      endpoints: [
        { method: "GET", path: "/api/db/status", description: "Datenbankstatus prüfen", authRequired: true },
        { method: "POST", path: "/api/test-db-connection", description: "Datenbankverbindung testen", authRequired: true },
        { method: "POST", path: "/api/database/performance-test", description: "Performance-Test ausführen", authRequired: true },
        { method: "GET", path: "/api/db/objects", description: "Datenbankobjekte abrufen", authRequired: true },
        { method: "GET", path: "/api/portal/config", description: "Portal-Konfiguration abrufen", authRequired: true },
        { method: "GET", path: "/api/portal/config-details", description: "Detaillierte Portal-Konfiguration", authRequired: true },
        { method: "POST", path: "/api/portal/setup", description: "Portal-Setup durchführen", authRequired: true },
        { method: "GET", path: "/api/energy-data-meters/:objectId", description: "Energiedaten-Zähler für Objekt", authRequired: true },
        { method: "GET", path: "/api/daily-consumption/:objectId", description: "Täglicher Verbrauch", authRequired: true },
        { method: "GET", path: "/api/monthly-consumption/:objectId", description: "Monatlicher Verbrauch", authRequired: true },
        { method: "GET", path: "/api/annual-consumption/:objectId", description: "Jährlicher Verbrauch", authRequired: true },
        { method: "GET", path: "/api/temperature-efficiency/:objectId", description: "Temperatur-Effizienz-Analyse", authRequired: true },
        { method: "POST", path: "/api/export-excel/:objectId", description: "Excel-Export für Objekt", authRequired: true },
        { method: "POST", path: "/api/restart-server", description: "Server-Neustart", authRequired: true }
      ]
    },
    {
      id: "email",
      name: "E-Mail Service",
      description: "SMTP E-Mail-Versendung und -Konfiguration",
      icon: Mail,
      color: "bg-emerald-500",
      endpoints: [
        { method: "POST", path: "/api/email/send", description: "E-Mail versenden (to, subject, text/html, from optional)", authRequired: true },
        { method: "POST", path: "/api/email/test", description: "SMTP-Verbindung testen oder Test-E-Mail senden", authRequired: true },
        { method: "GET", path: "/api/email/test", description: "Test-E-Mail via URL senden (?to=email&subject=betreff&text=nachricht)", authRequired: true },
        { method: "GET", path: "/api/email/config", description: "Mailserver-Konfiguration anzeigen (ohne Passwort)", authRequired: true }
      ]
    }
  ];

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const buildRequestUrl = (endpoint: ApiEndpoint) => {
    let url = endpoint.path;
    
    // Replace path parameters
    Object.entries(requestParams).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
    
    // Add query parameters
    if (queryParams.trim()) {
      url += `?${queryParams}`;
    }
    
    return url;
  };

  const extractPathParams = (path: string): string[] => {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map(match => match.slice(1)) : [];
  };

  const executeApiCall = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setError(null);
    setTestResult(null);

    const startTime = Date.now();
    const url = buildRequestUrl(selectedEndpoint);
    setRequestUrl(url);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
        try {
          JSON.parse(requestBody); // Validate JSON
          options.body = requestBody;
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        duration
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyUrlToClipboard = async () => {
    if (requestUrl) {
      await navigator.clipboard.writeText(requestUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const selectedCategoryData = apiCategories.find(cat => cat.id === selectedCategory);
  const pathParams = selectedEndpoint ? extractPathParams(selectedEndpoint.path) : [];

  return (
    <div className="space-y-6 p-6 pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Categories */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>API-Kategorien</CardTitle>
              <CardDescription>Wählen Sie eine Kategorie zum Testen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {apiCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Collapsible key={category.id}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                        data-testid={`button-category-${category.id}`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="flex-1 text-left">{category.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {category.endpoints.length}
                        </Badge>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2 ml-4">
                      {category.endpoints.map((endpoint, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setSelectedEndpoint(endpoint);
                            setRequestParams({});
                            setQueryParams('');
                          }}
                          data-testid={`button-endpoint-${endpoint.method}-${idx}`}
                        >
                          <Badge className={`mr-2 text-xs ${getMethodBadgeColor(endpoint.method)}`}>
                            {endpoint.method}
                          </Badge>
                          <span className="truncate">{endpoint.path}</span>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* API Testing Interface */}
        <div className="lg:col-span-2">
          {selectedEndpoint ? (
            <div className="space-y-4">
              {/* Endpoint Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getMethodBadgeColor(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </Badge>
                    <span className="font-mono text-sm">{selectedEndpoint.path}</span>
                    {selectedEndpoint.authRequired && (
                      <Badge variant="outline" className="ml-auto">
                        <Shield className="h-3 w-3 mr-1" />
                        Auth Required
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{selectedEndpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Path Parameters */}
                  {pathParams.length > 0 && (
                    <div className="space-y-2">
                      <Label>Pfad-Parameter</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pathParams.map((param) => (
                          <div key={param} className="space-y-1">
                            <Label htmlFor={`param-${param}`} className="text-xs">
                              :{param}
                            </Label>
                            <Input
                              id={`param-${param}`}
                              value={requestParams[param] || ''}
                              onChange={(e) => setRequestParams(prev => ({
                                ...prev,
                                [param]: e.target.value
                              }))}
                              placeholder={`Wert für ${param}`}
                              data-testid={`input-param-${param}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Query Parameters */}
                  <div className="space-y-2">
                    <Label htmlFor="query-params">Query-Parameter</Label>
                    <Input
                      id="query-params"
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder="param1=value1&param2=value2"
                      data-testid="input-query-params"
                    />
                  </div>

                  {/* Request Body */}
                  {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                    <div className="space-y-2">
                      <Label htmlFor="request-body">Request Body (JSON)</Label>
                      <Textarea
                        id="request-body"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="h-32 font-mono text-sm"
                        data-testid="textarea-request-body"
                      />
                    </div>
                  )}

                  {/* Execute Button */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={executeApiCall} 
                      disabled={loading}
                      className="flex-1"
                      data-testid="button-execute-api"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          API ausführen
                        </>
                      )}
                    </Button>
                    
                    {requestUrl && (
                      <Button
                        variant="outline"
                        onClick={copyUrlToClipboard}
                        data-testid="button-copy-url"
                      >
                        {copiedUrl ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Request URL Preview */}
                  {requestUrl && (
                    <div className="space-y-2">
                      <Label>Request URL</Label>
                      <div className="p-2 bg-muted rounded-md font-mono text-sm break-all">
                        {requestUrl}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Fehler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600" data-testid="text-error">{error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Test Results */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Test-Ergebnis</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={testResult.status < 400 ? "default" : "destructive"}
                          data-testid="badge-status"
                        >
                          {testResult.status} {testResult.statusText}
                        </Badge>
                        <Badge variant="outline" data-testid="badge-duration">
                          {testResult.duration}ms
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="response" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="response">Response</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="response" className="space-y-2">
                        <Label>Response Data</Label>
                        <Textarea 
                          value={typeof testResult.data === 'string' 
                            ? testResult.data 
                            : JSON.stringify(testResult.data, null, 2)
                          } 
                          className="h-64 font-mono text-xs"
                          readOnly
                          data-testid="textarea-response"
                        />
                      </TabsContent>
                      
                      <TabsContent value="headers" className="space-y-2">
                        <Label>Response Headers</Label>
                        <Textarea 
                          value={JSON.stringify(testResult.headers, null, 2)} 
                          className="h-64 font-mono text-xs"
                          readOnly
                          data-testid="textarea-headers"
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>Wählen Sie eine API-Kategorie und einen Endpunkt zum Testen</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}