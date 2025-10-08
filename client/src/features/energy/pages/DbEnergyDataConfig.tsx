import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DbEnergyDataConfigProps {}

export default function DbEnergyDataConfig({}: DbEnergyDataConfigProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDbEnergyDataConfig();
  }, []);

  const loadDbEnergyDataConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/dbEnergyData_view_day_comp');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
        setError(null);
      } else {
        setError(data.message || 'Konfiguration nicht gefunden');
      }
    } catch (err) {
      setError('Fehler beim Laden der Konfiguration');
      console.error('Error loading dbEnergyData config:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: "Konfiguration in Zwischenablage kopiert"
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Database className="w-6 h-6 animate-pulse" />
              <span className="ml-2">Lade dbEnergyData_view_day_comp Konfiguration...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-6 h-6" />
              <span className="ml-2">{error}</span>
            </div>
            <Button onClick={loadDbEnergyDataConfig} className="mt-4">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">dbEnergyData_view_day_comp Konfiguration</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Datenbank-Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.host}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.port}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datenbank</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.database}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.schema}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tabelle</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.table}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benutzer</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSL</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.ssl ? 'Aktiviert' : 'Deaktiviert'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout</label>
                  <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                    {config.connectionTimeout}ms
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vollständige JSON-Konfiguration
                </label>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{JSON.stringify(config, null, 2)}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(JSON.stringify(config, null, 2))}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <span className="ml-2">Keine Konfigurationsdaten verfügbar</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}