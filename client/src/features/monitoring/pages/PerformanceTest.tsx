import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TestResult {
  method: string;
  url: string;
  status: number;
  duration: number;
  response?: any;
  error?: string;
}

export default function PerformanceTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [resolution, setResolution] = useState<string>('daily');
  const [objectId, setObjectId] = useState<string>('');
  const [meterId, setMeterId] = useState<string>('');
  const [meterKey, setMeterKey] = useState<string>('');
  const [area, setArea] = useState<string>('');

  const runSingleTest = async (method: string, url: string): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      return {
        method,
        url,
        status: response.status,
        duration: Math.round(duration),
        response: responseData
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        method,
        url,
        status: 0,
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    const timeRange = '2024';
    console.log(`🔧 Test Configuration: objectId=${objectId}, meterId=${meterId}, area=${area}, resolution=${resolution}`);
    
    // Hilfsfunktion zum Erstellen von URLs mit nur ausgefüllten Parametern
    const buildUrl = (baseUrl: string, params: Record<string, string>) => {
      const url = new URL(baseUrl, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          url.searchParams.set(key, value);
        }
      });
      return url.pathname + url.search;
    };
    
    const tests = [
      {
        method: 'meterId (direkte DB-ID)',
        url: objectId ? `/api/efficiency-analysis/${objectId}?${new URLSearchParams({
          timeRange,
          resolution,
          ...(meterId && { meterId })
        }).toString()}` : null
      },
      {
        method: 'meterKey (Lookup erforderlich)', 
        url: objectId ? `/api/efficiency-analysis/${objectId}?${new URLSearchParams({
          timeRange,
          resolution,
          ...(meterKey && { meterKey })
        }).toString()}` : null
      },
      {
        method: 'Automatisch (Z20541 Suche)',
        url: objectId ? `/api/efficiency-analysis/${objectId}?${new URLSearchParams({
          timeRange,
          resolution
        }).toString()}` : null
      },
      {
        method: '🚀 Optimiert (kein Lookup)',
        url: meterId ? buildUrl('/api/efficiency-analysis-opt', {
          timeRange,
          meterId,
          resolution,
          ...(objectId && { objectId }),
          ...(area && { area })
        }) : null
      }
    ].filter(test => test.url !== null) as { method: string; url: string; }[];

    const testResults: TestResult[] = [];
    
    // Führe Tests sequenziell aus für genaue Zeitmessung
    for (const test of tests) {
      console.log(`🚀 Testing: ${test.method}`);
      const result = await runSingleTest(test.method, test.url);
      testResults.push(result);
      console.log(`✅ ${test.method}: ${result.duration}ms (Status: ${result.status})`);
    }
    
    // Sortiere nach Performance (schnellste zuerst)
    testResults.sort((a, b) => a.duration - b.duration);
    
    setResults(testResults);
    setIsRunning(false);
  };

  const getStatusBadge = (status: number) => {
    if (status === 200) return <Badge className="bg-green-500">200 OK</Badge>;
    if (status === 401) return <Badge variant="destructive">401 Unauthorized</Badge>;
    if (status === 500) return <Badge variant="destructive">500 Error</Badge>;
    if (status === 0) return <Badge variant="outline">Network Error</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getRankBadge = (index: number) => {
    const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600'];
    const labels = ['🥇 Schnellste', '🥈 Zweite', '🥉 Langsamste'];
    return <Badge className={colors[index] || 'bg-gray-500'}>{labels[index] || `#${index + 1}`}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Effizienz-API Performance Test</h1>
        <p className="text-gray-600">
          Vergleich der vier API-Varianten mit konfigurierbaren Parametern
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectId" className="text-sm font-medium">Objekt ID:</Label>
                <Input 
                  id="objectId"
                  value={objectId} 
                  onChange={(e) => setObjectId(e.target.value)}
                  placeholder="Optional: z.B. 207210094"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meterId" className="text-sm font-medium">Meter ID (für Optimiert-API):</Label>
                <Input 
                  id="meterId"
                  value={meterId} 
                  onChange={(e) => setMeterId(e.target.value)}
                  placeholder="Erforderlich für Optimiert: z.B. 51699126"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meterKey" className="text-sm font-medium">Meter Key:</Label>
                <Input 
                  id="meterKey"
                  value={meterKey} 
                  onChange={(e) => setMeterKey(e.target.value)}
                  placeholder="Optional: z.B. Z20541"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-medium">Fläche (m²):</Label>
                <Input 
                  id="area"
                  value={area} 
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Optional für Optimiert: z.B. 6327"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Auflösung:</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich (d)</SelectItem>
                  <SelectItem value="weekly">Wöchentlich (w)</SelectItem>
                  <SelectItem value="monthly">Monatlich (m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600 border-l-4 border-blue-400 pl-3 space-y-1">
              <div><strong>Zeitraum:</strong> 2024 (fest)</div>
              <div><strong>Regel:</strong> Nur ausgefüllte Parameter werden übertragen</div>
              <div><strong>Optimiert-API:</strong> Benötigt nur Meter ID, objectId + area optional</div>
              <div><strong>Standard-APIs:</strong> Benötigen Objekt ID</div>
            </div>
            
            <Button 
              onClick={runPerformanceTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Test läuft...' : `Performance-Test starten (${resolution})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test-Ergebnisse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getRankBadge(index)}
                    <h3 className="font-semibold">{result.method}</h3>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Antwortzeit:</span> {result.duration}ms
                    </div>
                    <div>
                      <span className="font-medium">URL:</span> {result.url}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      <strong>Fehler:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.response && result.status === 200 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 text-sm">API-Antwort anzeigen</summary>
                      <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
            
            {results.length > 1 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">Performance-Analyse ({resolution}):</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>🏆 Schnellste Methode: <strong>{results[0].method}</strong> ({results[0].duration}ms)</div>
                  <div>🐌 Langsamste Methode: <strong>{results[results.length - 1].method}</strong> ({results[results.length - 1].duration}ms)</div>
                  <div>📊 Performance-Unterschied: <strong>{results[results.length - 1].duration - results[0].duration}ms</strong></div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <strong>API-Performance-Vergleich:</strong>
                    <div className="text-xs mt-1">
                      • 🚀 Optimiert: Direkter meterId-Zugriff, keine Object-Suche
                      • meterId: Object-Lookup mit Early-Exit-Optimierung
                      • meterKey: Direkter Schlüssel-Zugriff zu Meter-Daten
                      • Automatisch: Pattern-Matching für Z20541-Suche
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}