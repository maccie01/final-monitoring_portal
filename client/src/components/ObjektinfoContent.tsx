import { PencilIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Flame, Leaf, Zap, Navigation, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ObjektinfoContentProps {
  selectedObject: any;
  user?: any;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export default function ObjektinfoContent({ 
  selectedObject, 
  user, 
  onEdit, 
  showEditButton = false 
}: ObjektinfoContentProps) {
  const [editingGPS, setEditingGPS] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [currentCoords, setCurrentCoords] = useState({ lat: 0, lng: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can edit GPS coordinates
  const canEditGPS = (user?.role === 'admin' || user?.role === 'user');

  // Update current coordinates when selectedObject changes
  useEffect(() => {
    if (selectedObject) {
      const coords = getObjectCoordinates(selectedObject);
      if (coords) {
        setCurrentCoords(coords);
      } else {
        // No coordinates available - hide GPS section
        setCurrentCoords({ lat: 0, lng: 0 });
      }
    }
  }, [selectedObject]);

  // Get object coordinates function (similar to Maps component)
  const getObjectCoordinates = (obj: any) => {
    // 1. Check direct latitude/longitude columns
    if (obj.latitude && obj.longitude) {
      return { lat: obj.latitude, lng: obj.longitude };
    }
    
    // 2. Check objdata.adresse for coordinates
    if (obj.objdata?.adresse?.Latitude && obj.objdata?.adresse?.Longitude) {
      return { 
        lat: obj.objdata.adresse.Latitude, 
        lng: obj.objdata.adresse.Longitude 
      };
    }
    
    // 3. No coordinates available
    return null;
  };

  // GPS coordinates update mutation
  const updateGPSMutation = useMutation({
    mutationFn: async ({ objectId, latitude, longitude }: { objectId: number; latitude: number; longitude: number }) => {
      const response = await fetch(`/api/objects/${objectId}/coordinates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update coordinates');
      }
      
      return response.json();
    },
    onSuccess: (updatedObject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      
      // Update local coordinates immediately
      if (updatedObject.latitude && updatedObject.longitude) {
        setCurrentCoords({ 
          lat: updatedObject.latitude, 
          lng: updatedObject.longitude 
        });
      }
      
      toast({
        title: "GPS-Koordinaten aktualisiert",
        description: "Die Koordinaten wurden erfolgreich gespeichert.",
      });
      setEditingGPS(false);
      setGpsCoordinates('');
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die GPS-Koordinaten konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Handle GPS edit click
  const handleEditGPS = () => {
    setGpsCoordinates(`${Number(currentCoords.lat).toFixed(8)}, ${Number(currentCoords.lng).toFixed(8)}`);
    setEditingGPS(true);
  };

  // Handle GPS save
  const handleSaveGPS = () => {
    if (!gpsCoordinates.trim()) return;

    // Parse coordinates from "lat, lng" format
    const parts = gpsCoordinates.split(',').map(s => s.trim());
    if (parts.length !== 2) {
      toast({
        title: "Ungültiges Format",
        description: "Bitte verwenden Sie das Format: 52.123456, 9.123456",
        variant: "destructive",
      });
      return;
    }

    const latitude = parseFloat(parts[0]);
    const longitude = parseFloat(parts[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: "Ungültige Koordinaten",
        description: "Bitte geben Sie gültige Dezimalzahlen ein.",
        variant: "destructive",
      });
      return;
    }

    updateGPSMutation.mutate({
      objectId: selectedObject.id,
      latitude,
      longitude,
    });
  };
  if (!selectedObject) {
    return (
      <div className="p-6 text-center text-gray-500">
        Kein Objekt ausgewählt
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Objekt-Informationen */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedObject.name}
              </h3>
              <p className="text-sm text-gray-500">Objekt-ID: {selectedObject.objectid}</p>
            </div>
            {showEditButton && ((user as any)?.role === 'admin' || (user as any)?.role === 'user') && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Adresse</p>
              <p className="text-gray-900 font-medium">
                {selectedObject.objdata?.street || selectedObject.address || selectedObject.name}
              </p>
              {(selectedObject.postalCode || selectedObject.zip || selectedObject.city) && (
                <p className="text-gray-900">
                  {(selectedObject.postalCode || selectedObject.zip) && (selectedObject.postalCode || selectedObject.zip)} {selectedObject.city && selectedObject.city}
                </p>
              )}
            </div>
            {(selectedObject.objdata?.area || selectedObject.nutzflaeche) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Nutzfläche</p>
                <p className="text-gray-900 font-medium">
                  {selectedObject.objdata?.area || selectedObject.nutzflaeche} m²
                </p>
              </div>
            )}
            {(selectedObject.objdata?.NE || selectedObject.nutzeinheiten) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Nutzeinheiten</p>
                <p className="text-gray-900 font-medium">
                  {selectedObject.objdata?.NE || selectedObject.nutzeinheiten}
                </p>
              </div>
            )}
            {selectedObject.objdata?.GEG && selectedObject.objdata.GEG !== "" && (
              <div>
                <p className="text-sm font-medium text-gray-500">GEG-Wert</p>
                <p className="text-gray-900 font-medium">
                  {selectedObject.objdata.GEG} kWh/m²
                </p>
              </div>
            )}
            {getObjectCoordinates(selectedObject) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    GPS-Koordinaten
                  </p>
                  {canEditGPS && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditGPS}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      title="GPS-Koordinaten bearbeiten"
                    >
                      <Edit3 className="h-3 w-3 text-blue-500" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-900 font-mono text-sm">
                  {`${Number(currentCoords.lat).toFixed(6)}, ${Number(currentCoords.lng).toFixed(6)}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Meter */}
        {selectedObject.meter && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Meter
            </h3>
            <div className="space-y-3">
              {Object.entries(selectedObject.meter)
                .sort(([keyA], [keyB]) => {
                  // Sortierung: Netz, Wärmepumpe, Kessel, Rest
                  const getOrder = (key: string) => {
                    if (key.match(/^Z2054[1-3]/)) return 1; // Netz
                    if (key.match(/^Z2024[1-3]/)) return 2; // Wärmepumpe
                    if (key.match(/^Z2014[1-3]/)) return 3; // Kessel
                    if (key.match(/^Z2022\d*/)) return 4;   // Wärmepumpe-Strom
                    return 5; // Sonstiges
                  };
                  return getOrder(keyA) - getOrder(keyB);
                })
                .map(([meterKey, meterId]) => {
                // Bestimme Komponententyp und Icon basierend auf Meter-Key
                const getComponentInfo = (key: string) => {
                  // Zähle Meter desselben Typs für intelligente Benennung
                  const allMeterKeys = Object.keys(selectedObject.meter);
                  
                  if (key.match(/^Z2054[1-3]/)) {
                    const netzMeters = allMeterKeys.filter(k => k.match(/^Z2054[1-3]/));
                    const name = netzMeters.length === 1 ? 'Netz' : `Netz ${key.slice(-1)}`;
                    return { 
                      name, 
                      icon: <Share2 className="h-4 w-4 text-blue-600" />,
                      bgColor: 'bg-blue-50',
                      textColor: 'text-blue-700'
                    };
                  }
                  if (key.match(/^Z2014[1-3]/)) {
                    const kesselMeters = allMeterKeys.filter(k => k.match(/^Z2014[1-3]/));
                    const name = kesselMeters.length === 1 ? 'Kessel' : 
                                key === 'Z20141' ? 'Kessel 1' : 
                                key === 'Z20142' ? 'Kessel 2' : 
                                key === 'Z20143' ? 'Kessel 3' : 'Kessel';
                    return { 
                      name, 
                      icon: <Flame className="h-4 w-4 text-violet-600" />,
                      bgColor: 'bg-violet-50', 
                      textColor: 'text-violet-700'
                    };
                  }
                  if (key.match(/^Z2024[1-3]/)) {
                    const wpMeters = allMeterKeys.filter(k => k.match(/^Z2024[1-3]/));
                    const name = wpMeters.length === 1 ? 'Wärmepumpe' : `Wärmepumpe ${key.slice(-1)}`;
                    return { 
                      name, 
                      icon: <Leaf className="h-4 w-4 text-green-600" />,
                      bgColor: 'bg-green-50',
                      textColor: 'text-green-700'
                    };
                  }
                  if (key.match(/^Z2022\d*/)) {
                    return { 
                      name: 'Wärmepumpe-Strom', 
                      icon: <Zap className="h-4 w-4 text-orange-600" />,
                      bgColor: 'bg-orange-50',
                      textColor: 'text-orange-700'
                    };
                  }
                  return { 
                    name: 'Sonstiges', 
                    icon: <Share2 className="h-4 w-4 text-gray-600" />,
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-700'
                  };
                };

                const componentInfo = getComponentInfo(meterKey);

                return (
                  <div key={meterKey} className={`p-3 rounded-lg ${componentInfo.bgColor} flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                      {componentInfo.icon}
                      <div>
                        <p className={`font-medium ${componentInfo.textColor}`}>
                          {componentInfo.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {meterKey}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-mono ${componentInfo.textColor}`}>
                      {String(meterId)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* GPS Edit Dialog */}
      <Dialog open={editingGPS} onOpenChange={() => setEditingGPS(false)}>
        <DialogContent className="sm:max-w-md z-[10000]">
          <DialogHeader>
            <DialogTitle>GPS-Koordinaten bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Objekt: {selectedObject?.name}
              </label>
              <label className="text-sm text-gray-500 mb-2 block">
                Koordinaten (Latitude, Longitude)
              </label>
              <Input
                value={gpsCoordinates}
                onChange={(e) => setGpsCoordinates(e.target.value)}
                placeholder="52.123456, 9.123456"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Breitengrad, Längengrad (z.B. aus Google Maps kopiert)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingGPS(false)}
                disabled={updateGPSMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={handleSaveGPS}
                disabled={updateGPSMutation.isPending || !gpsCoordinates.trim()}
              >
                {updateGPSMutation.isPending ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}