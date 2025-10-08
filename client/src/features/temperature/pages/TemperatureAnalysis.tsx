import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Thermometer, MapPin } from "lucide-react";
import TemperatureEfficiencyChart from "@/features/temperature/components/TemperatureEfficiencyChart";

// InfoText-Komponente für dynamische Texte aus der Datenbank
function InfoText({ category, keyName, children }: { category: string; keyName: string; children: React.ReactNode }) {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/settings", category],
    queryFn: async () => {
      const response = await fetch(`/api/settings?category=${category}`);
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  // Debug: Finde das richtige Setting
  const setting = settings?.find((s: any) => s.key_name === keyName);
  const infoText = setting?.value?.InfoText;
  
  // Debug: Console log
  console.log('🔍 InfoText Debug:', { category, keyName, settings, setting, infoText });

  return (
    <div className="mb-4 p-4 text-center">
      <p className="text-lg font-semibold" style={{ color: 'hsl(210, 75%, 50%)' }}>
        {children}
      </p>
      {isLoading && (
        <p className="text-sm text-gray-400 mt-2">Lade InfoText...</p>
      )}
      {error && (
        <p className="text-sm text-red-500 mt-2">Fehler beim Laden: {(error as Error).message}</p>
      )}
      {infoText && (
        <p className="text-sm text-gray-600 mt-2">
          {infoText}
        </p>
      )}
      {!isLoading && !error && !infoText && (
        <p className="text-sm text-gray-400 mt-2">InfoText nicht gefunden</p>
      )}
    </div>
  );
}

interface ObjectType {
  id: number;
  objectid: number;
  name: string;
  postalCode: string;
  city: string;
  status: string;
}

export default function TemperatureAnalysis() {
  const [selectedObject, setSelectedObject] = useState<ObjectType | null>(null);
  const [timeRange, setTimeRange] = useState<"last-year" | "last-365-days" | "last-2year">("last-year");

  // Hole alle Objekte
  const { data: objects = [], isLoading: objectsLoading } = useQuery<ObjectType[]>({
    queryKey: ["/api/objects"],
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Object List */}
      <div className="w-1/3 max-w-md bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Portfolio Objekte
          </h2>
          <p className="text-gray-600 mt-1 text-sm">
            {objects.length} Objekte verfügbar
          </p>
          
          {/* Portfolio Verbrauchsinfo - Style wie EfficiencyAnalysis */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-900">
                Ihr Gesamverbrauch vom Portfolio (120.059 m²):
              </span>
              <span className="text-sm font-bold text-blue-900">
                7.634.633 kWh
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {objectsLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {objects.map((object) => (
                <Card
                  key={object.objectid}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedObject?.objectid === object.objectid
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedObject(object)}
                  data-testid={`object-${object.objectid}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {object.name}
                        </h3>
                        <p className="text-gray-600 text-xs">
                          ID: {object.objectid}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {object.postalCode} {object.city}
                        </p>
                      </div>
                      <Badge
                        variant={object.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {object.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Temperature Chart */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Thermometer className="h-6 w-6" />
                Temperatur & Effizienz-Analyse
              </h1>
              {selectedObject && (
                <p className="text-gray-600 mt-1">
                  {selectedObject.name} - {selectedObject.postalCode} {selectedObject.city}
                </p>
              )}
            </div>


          </div>
        </div>

        <div className="flex-1 p-6 bg-gray-50">
          {!selectedObject ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Thermometer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Objekt auswählen
                </h3>
                <p className="text-gray-600">
                  Wählen Sie links ein Objekt aus, um die Temperaturdaten anzuzeigen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TemperatureEfficiencyChart 
              objektid={selectedObject.objectid} 
              zeitraum={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
        </div>
      </div>
    </div>
  );
}