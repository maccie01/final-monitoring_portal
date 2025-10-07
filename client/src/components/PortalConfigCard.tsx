import { useState, useEffect } from "from "react"";
import { Button } from "from "@/components/ui/button"";
import { Card, CardContent, CardHeader, CardTitle } from "from "@/components/ui/card"";
import { Textarea } from "from "@/components/ui/textarea"";
import { Badge } from "from "@/components/ui/badge"";
import { useToast } from "from "@/hooks/use-toast"";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play,
  Save,
  Wifi
} from "from "lucide-react"";

interface PortalConfigCardProps {
  configType: string;
  title: string;
  description: string;
}

export default function PortalConfigCard({ configType, title, description }: PortalConfigCardProps) {
  const [config, setConfig] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activateStatus, setActivateStatus] = useState<'idle' | 'activating' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  // Lade Konfiguration beim Mount
  useEffect(() => {
    loadConfig();
  }, [configType]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/portal/load-config/${configType}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.config) {
          setConfig(JSON.stringify(result.config, null, 2));
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Konfiguration:', error);
    }
  };

  const testConnection = async () => {
    setStatus('testing');
    
    try {
      const configObj = JSON.parse(config);
      // Korrigiere SSL-Konfiguration für bessere Kompatibilität
      if (configObj.ssl === true || (typeof configObj.ssl === 'object')) {
        configObj.ssl = { rejectUnauthorized: false };
      }
      
      const response = await fetch(`/api/portal/test-config/${configType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configObj),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatus('success');
          toast({
            title: "Verbindung erfolgreich",
            description: `${title} Verbindung funktioniert einwandfrei.`,
          });
        } else {
          setStatus('error');
          toast({
            title: "Verbindung fehlgeschlagen",
            description: result.message || "Verbindung konnte nicht hergestellt werden.",
            variant: "destructive",
          });
        }
      } else {
        setStatus('error');
        toast({
          title: "Verbindung fehlgeschlagen",
          description: "Server-Fehler beim Testen der Verbindung.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: "Konfigurationsfehler",
        description: "Ungültiges JSON-Format in der Konfiguration.",
        variant: "destructive",
      });
    }

    // Status nach 3 Sekunden zurücksetzen
    setTimeout(() => {
      setStatus('idle');
    }, 3000);
  };

  const saveConfig = async () => {
    setSaveStatus('saving');
    
    try {
      const configObj = JSON.parse(config);
      const response = await fetch(`/api/portal/save-config/${configType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configObj),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSaveStatus('success');
          toast({
            title: "Konfiguration gespeichert",
            description: `${title} erfolgreich gespeichert.`,
          });
        } else {
          setSaveStatus('error');
          toast({
            title: "Speichern fehlgeschlagen",
            description: result.message || "Konfiguration konnte nicht gespeichert werden.",
            variant: "destructive",
          });
        }
      } else {
        setSaveStatus('error');
        toast({
          title: "Speichern fehlgeschlagen",
          description: "Server-Fehler beim Speichern der Konfiguration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setSaveStatus('error');
      toast({
        title: "Konfigurationsfehler",
        description: "Ungültiges JSON-Format in der Konfiguration.",
        variant: "destructive",
      });
    }

    // Status nach 3 Sekunden zurücksetzen
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  const activateConfig = async () => {
    setActivateStatus('activating');
    
    try {
      const configObj = JSON.parse(config);
      
      // Speichere in db.settings
      const saveResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'data',
          key_name: 'settingdb',
          value: configObj
        }),
      });

      if (saveResponse.ok) {
        // Aktiviere die Konfiguration
        const response = await fetch('/api/portal/activate-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceConfigType: configType,
            targetConfigType: 'settingdb',
            config: configObj
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setActivateStatus('success');
            toast({
              title: "Konfiguration aktiviert",
              description: `${title} wurde als aktive settingdb-Konfiguration gesetzt und in Settings gespeichert.`,
            });
            
            // Lade System-Setup neu nach kurzer Verzögerung
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
            // Reset nach 2 Sekunden
            setTimeout(() => setActivateStatus('idle'), 2000);
          } else {
            setActivateStatus('error');
            toast({
              title: "Fehler beim Aktivieren",
              description: result.message || `Fehler beim Aktivieren der ${title} Konfiguration.`,
              variant: "destructive",
            });
          }
        } else {
          setActivateStatus('error');
          toast({
            title: "Fehler beim Aktivieren", 
            description: "Unerwarteter Fehler beim Aktivieren der Konfiguration.",
            variant: "destructive",
          });
        }
      } else {
        setActivateStatus('error');
        toast({
          title: "Fehler beim Speichern",
          description: "Konfiguration konnte nicht in Settings gespeichert werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setActivateStatus('error');
      toast({
        title: "Fehler beim Aktivieren",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Aktivieren.",
        variant: "destructive",
      });
    }

    // Status nach 3 Sekunden zurücksetzen
    setTimeout(() => {
      setActivateStatus('idle');
    }, 3000);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>{title}</span>
          </div>
          <Badge className={getStatusColor()}>
            {configType}
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Datenbank-Konfiguration
          </label>
          <Textarea
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            placeholder="JSON-Konfiguration..."
            className="font-mono text-xs"
            rows={8}
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={testConnection}
            disabled={status === 'testing' || !config.trim()}
            variant="outline"
            size="sm"
          >
            {status === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={saveConfig}
            disabled={saveStatus === 'saving' || !config.trim()}
            variant="default"
            size="sm"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          
          {configType !== 'settingdb' && (
            <Button
              onClick={activateConfig}
              disabled={activateStatus === 'activating' || !config.trim() || status !== 'success'}
              variant="secondary"
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {activateStatus === 'activating' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Als settingdb aktivieren
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}