import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { buildGrafanaUrl } from "@/features/ki-reports/components/grafanaConfig";

export default function Geraeteverwaltung() {
  const [id, setId] = useState('');
  const [objectId, setObjectId] = useState('');
  const [panelId, setPanelId] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');

  const generateUrl = async () => {
    if (!id || !objectId || !panelId) return;
    
    try {
      const url = await buildGrafanaUrl({
        panelId: panelId,
        meterId: id,
        timeRange: '7d'
      });
      setIframeUrl(url);
    } catch (error) {
      console.error('Error generating Grafana URL:', error);
    }
  };

  const clearInputs = () => {
    setId('');
    setObjectId('');
    setPanelId('');
    setIframeUrl('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Geräteverwaltung</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafana Test Interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="12205151"
                data-testid="input-id"
              />
            </div>
            
            <div>
              <Label htmlFor="objectid">Object ID</Label>
              <Input
                id="objectid"
                value={objectId}
                onChange={(e) => setObjectId(e.target.value)}
                placeholder="207125085"
                data-testid="input-objectid"
              />
            </div>
            
            <div>
              <Label htmlFor="panelid">Panel ID</Label>
              <Input
                id="panelid"
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                placeholder="3"
                data-testid="input-panelid"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateUrl} data-testid="button-generate">
              URL Generieren
            </Button>
            <Button onClick={clearInputs} variant="outline" data-testid="button-clear">
              Zurücksetzen
            </Button>
          </div>

          {iframeUrl && (
            <div className="space-y-2">
              <Label>Generierte URL:</Label>
              <div className="text-xs bg-gray-100 p-2 rounded break-all">
                {iframeUrl}
              </div>
              
              <div className="border rounded" data-testid="grafana-iframe-container">
                <iframe
                  src={iframeUrl}
                  style={{ height: '300px' }}
                  className="w-full border-0"
                  title="Grafana Dashboard"
                  data-testid="grafana-iframe"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}