import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Check, XCircle, AlertTriangle, WifiOff, Search, MapPin, ExternalLink, Thermometer, RotateCcw, ArrowUpRight, Navigation, Edit3, ZoomIn, Brain, LineChart, BarChart, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
import markerIcon from "from "leaflet/dist/images/marker-icon.png"";
import markerIcon2x from "from "leaflet/dist/images/marker-icon-2x.png"";
import markerShadow from "from "leaflet/dist/images/marker-shadow.png"";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface ObjectItem {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  postalCode?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  fltemp?: any;
  rttemp?: any;
  objanlage?: any;
  meter?: { [key: string]: any };
  mandantId?: number;
  objdata?: {
    adresse?: {
      street?: string;
      Latitude?: number;
      Longitude?: number;
    };
    [key: string]: any;
  };
}

// Status-basierte Marker Icons
const createStatusIcon = (status: string, isSelected: boolean = false) => {
  const colors = {
    critical: '#dc2626',
    warning: '#ea580c', 
    normal: '#16a34a',
    offline: '#6b7280'
  };
  
  const color = colors[status as keyof typeof colors] || colors.offline;
  
  // Dicker blauer Rand für ausgewählte Objekte
  const selectedBorder = isSelected ? 'border: 4px solid #2563eb;' : 'border: 2px solid white;';
  const markerSize = isSelected ? 24 : 20;
  const anchorOffset = isSelected ? 12 : 10;
  
  // CSS-Klasse für pulsierende Animation bei kritischen Objekten
  const criticalClass = status === 'critical' ? 'pulse-critical' : '';
  
  return L.divIcon({
    html: `<div class="${criticalClass}" style="
      background-color: ${color};
      width: ${markerSize}px;
      height: ${markerSize}px;
      border-radius: 50%;
      ${selectedBorder}
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ${isSelected ? 'z-index: 1000;' : ''}
    "></div>`,
    className: 'custom-marker',
    iconSize: [markerSize, markerSize],
    iconAnchor: [anchorOffset, anchorOffset]
  });
};

export default function Maps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'normal' | 'offline'>('all');
  const [mandantFilter, setMandantFilter] = useState<'all' | number>('all');
  const [selectedObject, setSelectedObject] = useState<ObjectItem | null>(null);
  const [editingGPS, setEditingGPS] = useState<ObjectItem | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [useHighZoom, setUseHighZoom] = useState(false);
  const [showGrafanaModal, setShowGrafanaModal] = useState(false);
  const [grafanaModalObject, setGrafanaModalObject] = useState<ObjectItem | null>(null);
  const [modalTimeRange, setModalTimeRange] = useState('now-48h');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Mobile default: expanded
  const mapRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // URL-Parameter für Statusfilter auslesen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam === 'critical' || filterParam === 'warning' || filterParam === 'offline') {
      setStatusFilter(filterParam);
    }
  }, []);
  
  // Fetch objects list
  const { data: objects, isLoading } = useQuery<ObjectItem[]>({
    queryKey: ["/api/objects"],
  });

  // Load Grafana settings for diagrammPanelId
  const { data: grafanaSettings } = useQuery({
    queryKey: ["/api/settings", "grafana"],
    queryFn: async () => {
      const response = await fetch("/api/settings?category=grafana");
      if (!response.ok) throw new Error("Failed to fetch Grafana settings");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch user data for role checking
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch thresholds for temperature analysis
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch mandants for admin filter
  const { data: mandants } = useQuery({
    queryKey: ["/api/mandants"],
    enabled: (user as any)?.role === 'admin',
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      toast({
        title: "GPS-Koordinaten aktualisiert",
        description: "Die Koordinaten wurden erfolgreich gespeichert.",
      });
      setEditingGPS(null);
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

  // Check if user can edit GPS coordinates
  const canEditGPS = ((user as any)?.role === 'admin' || (user as any)?.role === 'user');

  // Handle GPS edit click
  const handleEditGPS = (obj: ObjectItem) => {
    const coords = getObjectCoordinates(obj);
    setGpsCoordinates(`${Number(coords.lat).toFixed(8)}, ${Number(coords.lng).toFixed(8)}`);
    setEditingGPS(obj);
  };

  // Handle GPS save
  const handleSaveGPS = () => {
    if (!editingGPS || !gpsCoordinates.trim()) return;

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
      objectId: editingGPS.id,
      latitude,
      longitude,
    });
  };

  // NetworkMonitor temperature analysis function (reused from ObjectListLayout)
  const analyzeObjectTemperature = (obj: any) => {
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'Threshold data not loaded' };
    }

    const availableConfigs = (thresholds as any[]).map(t => t.keyName || t.key_name).filter(k => k && k.trim() && k !== 'undefined');
    
    if (!availableConfigs.includes('netzwaechter_0')) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'netzwaechter_0 missing' };
    }

    // Find threshold configuration
    let objectThresholds = null;
    
    if (obj.objanlage?.thresholds) {
      const found = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === obj.objanlage.thresholds);
      if (found) {
        objectThresholds = found.value?.thresholds;
      }
    }
    
    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    const usedThresholds = objectThresholds || defaultThresholds;
    
    if (!usedThresholds) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'netzwaechter_0 config not found' };
    }

    // Check temperature data availability
    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'Keine Temperatur-Daten' };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'Daten älter als 24h' };
    }

    // Analyze temperature thresholds
    let critical = false;
    let warning = false;
    let latestUpdate: Date | null = null;

    // Get latest update time
    const updates: Date[] = [];
    if (hasFltemp && obj.fltemp.updateTime) {
      updates.push(new Date(obj.fltemp.updateTime));
    }
    if (hasRttemp && obj.rttemp.updateTime) {
      updates.push(new Date(obj.rttemp.updateTime));
    }
    
    if (updates.length > 0) {
      latestUpdate = new Date(Math.max(...updates.map(d => d.getTime())));
    }

    // Temperature status function
    const getTemperatureStatus = (temp: number, thresholds: any, type: 'vl' | 'rl') => {
      if (type === 'vl') {
        if (temp < thresholds.critical.vlValue) return 'critical';
        if (temp < thresholds.warning.vlValue) return 'warning';
        return 'normal';
      } else {
        if (temp > thresholds.critical.rlValue) return 'critical';
        if (temp > thresholds.warning.rlValue) return 'warning';
        return 'normal';
      }
    };

    // Analyze each sensor
    if (obj.fltemp && obj.rttemp) {
      Object.keys(obj.fltemp).forEach(sensorId => {
        if (sensorId === 'updateTime') return;
        
        const vlTemp = obj.fltemp[sensorId];
        const rlTemp = obj.rttemp[sensorId];
        
        if (vlTemp !== undefined && rlTemp !== undefined) {
          const vlStatus = getTemperatureStatus(vlTemp, usedThresholds, 'vl');
          const rlStatus = getTemperatureStatus(rlTemp, usedThresholds, 'rl');
          
          if (vlStatus === 'critical' || rlStatus === 'critical') critical = true;
          if (vlStatus === 'warning' || rlStatus === 'warning') warning = true;
        }
      });
    }

    if (critical) {
      return { status: 'critical', offline: false, critical: true, warning: false, lastUpdate: latestUpdate };
    } else if (warning) {
      return { status: 'warning', offline: false, critical: false, warning: true, lastUpdate: latestUpdate };
    } else {
      return { status: 'normal', offline: false, critical: false, warning: false, lastUpdate: latestUpdate };
    }
  };

  // Generate demo coordinates for Hannover region if not available
  const getObjectCoordinates = (obj: ObjectItem) => {
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
    
    // 3. Fallback: Demo coordinates for Hannover area (spread objects around the city)
    const baseCoords = { lat: 52.3759, lng: 9.7320 }; // Hannover center
    const spread = 0.1; // ~10km radius
    
    // Use object ID as seed for consistent positioning
    const seed = obj.objectid % 1000;
    const angle = (seed / 1000) * 2 * Math.PI;
    const distance = (seed % 100) / 100 * spread;
    
    return {
      lat: baseCoords.lat + Math.cos(angle) * distance,
      lng: baseCoords.lng + Math.sin(angle) * distance
    };
  };

  // Filter objects
  const filteredObjects = objects?.filter((obj: any) => {
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.objectid.toString().includes(searchTerm) ||
      obj.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Mandant filter (only for admin users)
    if ((user as any)?.role === 'admin' && mandantFilter !== 'all') {
      if (obj.mandantId !== mandantFilter) {
        return false;
      }
    }
    
    if (statusFilter !== 'all') {
      const tempAnalysis = analyzeObjectTemperature(obj);
      // Map 'normal' to the status analysis result
      if (statusFilter === 'normal' && (tempAnalysis.status === 'critical' || tempAnalysis.status === 'warning' || tempAnalysis.status === 'offline')) {
        return false;
      } else if (statusFilter !== 'normal' && tempAnalysis.status !== statusFilter) {
        return false;
      }
    }
    
    return true;
  }) || [];

  // Get status statistics
  const statusStats = {
    critical: objects?.filter(obj => analyzeObjectTemperature(obj).status === 'critical').length || 0,
    warning: objects?.filter(obj => analyzeObjectTemperature(obj).status === 'warning').length || 0,
    normal: objects?.filter(obj => analyzeObjectTemperature(obj).status === 'normal').length || 0,
    offline: objects?.filter(obj => analyzeObjectTemperature(obj).status === 'offline').length || 0,
  };

  // Temperature color coding function (like in dashboard)
  const getTempColor = (temp: number | undefined, isVL: boolean = true): string => {
    if (temp === undefined) return 'text-gray-400';
    
    if (isVL) {
      // VL temperatures - red spectrum
      if (temp >= 60) return 'text-red-600';
      if (temp >= 50) return 'text-red-500';
      if (temp >= 40) return 'text-orange-500';
      return 'text-yellow-600';
    } else {
      // RL temperatures - blue spectrum
      if (temp >= 50) return 'text-purple-600';
      if (temp >= 40) return 'text-blue-600';
      if (temp >= 30) return 'text-blue-500';
      return 'text-blue-400';
    }
  };

  // Center map on selected object
  const centerMapOnObject = (obj: ObjectItem) => {
    const coords = getObjectCoordinates(obj);
    const zoomLevel = useHighZoom ? 18 : 15;
    if (mapRef.current) {
      mapRef.current.setView([coords.lat, coords.lng], zoomLevel);
    }
    setSelectedObject(obj);
  };

  // Reset map to overview
  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.setView([52.3759, 9.7320], 11);
    }
    setSelectedObject(null);
  };

  // Zoom to show all filtered objects
  const zoomToAllObjects = () => {
    if (!mapRef.current || !filteredObjects.length) {
      resetMapView();
      return;
    }

    // Get coordinates of all filtered objects
    const bounds = filteredObjects.map(obj => {
      const coords = getObjectCoordinates(obj);
      return [coords.lat, coords.lng] as [number, number];
    });

    // If only one object, center on it with reasonable zoom
    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 13);
    } else {
      // Fit bounds to show all objects with padding
      mapRef.current.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 15
      });
    }
    
    setSelectedObject(null);
  };

  // Reload map after zoom
  const zoomAndReloadMap = () => {
    zoomToAllObjects();
    // Trigger map refresh after zoom
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        // Force tile refresh
        mapRef.current.eachLayer((layer: any) => {
          if (layer.redraw) {
            layer.redraw();
          }
        });
      }
    }, 200);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - kompakter für embedded use */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
          {/* Status Summary */}
          <div className="p-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-1.5">
              <Card 
                className="p-2 cursor-pointer hover:bg-red-50" 
                onClick={() => setStatusFilter('critical')}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{statusStats.critical}</div>
                  <div className="text-xs text-gray-600">Kritisch</div>
                </div>
              </Card>
              <Card 
                className="p-2 cursor-pointer hover:bg-orange-50" 
                onClick={() => setStatusFilter('warning')}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{statusStats.warning}</div>
                  <div className="text-xs text-gray-600">Warnung</div>
                </div>
              </Card>
              <Card 
                className="p-2 cursor-pointer hover:bg-green-50" 
                onClick={() => setStatusFilter('normal')}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{statusStats.normal}</div>
                  <div className="text-xs text-gray-600">Normal</div>
                </div>
              </Card>
              <Card 
                className="p-2 cursor-pointer hover:bg-gray-50" 
                onClick={() => setStatusFilter('offline')}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600">{statusStats.offline}</div>
                  <div className="text-xs text-gray-600">Offline</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Objekte suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
                <SelectItem value="warning">Warnung</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            {/* Mandant Filter - nur für Admin */}
            {(user as any)?.role === 'admin' && (
              <Select 
                value={mandantFilter.toString()} 
                onValueChange={(value) => setMandantFilter(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mandant filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mandanten</SelectItem>
                  {Array.isArray(mandants) && mandants.map((mandant: any) => (
                    <SelectItem key={mandant.id} value={mandant.id.toString()}>
                      {mandant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {(searchTerm !== "" || statusFilter !== "all" || ((user as any)?.role === 'admin' && mandantFilter !== 'all')) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setMandantFilter("all");
                  // Use timeout to ensure filteredObjects is updated before zooming
                  setTimeout(() => zoomToAllObjects(), 300);
                }}
                className="w-full"
              >
                Alle anzeigen
              </Button>
            )}
          </div>

          {/* Object List */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                Lade Objekte...
              </div>
            ) : filteredObjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Keine Objekte gefunden
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredObjects.map((obj) => {
                  const analysis = analyzeObjectTemperature(obj);
                  const isSelected = selectedObject?.objectid === obj.objectid;
                  
                  return (
                    <div
                      key={obj.id}
                      onClick={() => centerMapOnObject(obj)}
                      className={`group p-4 cursor-pointer pt-[5px] pb-[5px] pl-[16px] pr-[16px] ${
                        isSelected 
                          ? 'bg-blue-100 border-l-4 border-blue-500' 
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Column 1: Object Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${
                            isSelected 
                              ? 'text-blue-700' 
                              : 'text-gray-900'
                          }`}>
                            {obj.name}
                          </div>
                          <div className={`text-xs ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {obj.city || "Hannover"}
                          </div>
                        </div>
                        
                        {/* Column 2: Temperature - Clickable */}
                        <div 
                          className="text-right mr-3 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGrafanaModalObject(obj);
                            setShowGrafanaModal(true);
                          }}
                          title="Zum Dashboard"
                        >
                          {!analysis.offline && (obj.fltemp || obj.rttemp) && (
                            <div className="space-y-0.5">
                              {(() => {
                                const fltemp = obj.fltemp;
                                const rttemp = obj.rttemp;
                                
                                if (!fltemp && !rttemp) return null;
                                
                                // Get unique sensor IDs from both fltemp and rttemp
                                const sensorIds = new Set([
                                  ...(fltemp ? Object.keys(fltemp).filter(key => key !== 'updateTime') : []),
                                  ...(rttemp ? Object.keys(rttemp).filter(key => key !== 'updateTime') : [])
                                ]);
                                
                                if (sensorIds.size === 0) return null;
                                
                                return Array.from(sensorIds).slice(0, 1).map((sensorId) => {
                                  const vlTemp = fltemp?.[sensorId];
                                  const rlTemp = rttemp?.[sensorId];
                                  
                                  return (
                                    <div key={sensorId} className="text-xs space-y-0.5">
                                      {vlTemp !== undefined && (
                                        <div>
                                          VL: <span className={`font-medium ${getTempColor(vlTemp, true)}`}>
                                            {vlTemp.toFixed(1)}°C
                                          </span>
                                        </div>
                                      )}
                                      {rlTemp !== undefined && (
                                        <div>
                                          RL: <span className={`font-medium ${getTempColor(rlTemp, false)}`}>
                                            {rlTemp.toFixed(1)}°C
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Column 3: Status Icon & Link */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          {analysis.offline ? (
                            <div title="Offline"><WifiOff className="h-4 w-4 text-gray-500" /></div>
                          ) : analysis.critical ? (
                            <div className="p-1 bg-red-100 rounded-full" title="Kritisch">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            </div>
                          ) : analysis.warning ? (
                            <div title="Warnung"><AlertTriangle className="h-4 w-4 text-orange-500" /></div>
                          ) : (
                            <div title="Normal"><Check className="h-4 w-4 text-green-600" /></div>
                          )}
                          
                          {/* Dashboard Link Icon */}
                          <Link
                            href={`/grafana-dashboards?objectID=${obj.objectid}&typ=KI-Auswertung&from=maps`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700"
                            title="Zum Dashboard"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map - Desktop: immer sichtbar, Mobile: nur wenn Objektliste ausgeblendet */}
        <div className={`flex-1 relative md:block ${sidebarCollapsed ? 'block' : 'hidden md:block'}`}>
          {/* Objects Counter - Top Center */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
            <div className="bg-strawa-gray rounded-lg px-3 py-2 shadow-sm border border-gray-200">
              <span className="text-xs font-medium text-gray-700">{filteredObjects.length} von {objects?.length || 0} Objekten</span>
            </div>
          </div>

          {/* Zoom Control - Top Left with more padding */}
          <div className="absolute top-4 left-20 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="high-zoom"
                  checked={useHighZoom}
                  onCheckedChange={(checked) => setUseHighZoom(checked === true)}
                />
                <label 
                  htmlFor="high-zoom" 
                  className="cursor-pointer flex items-center gap-1 text-xs text-gray-600"
                >
                  <ZoomIn className="h-3 w-3" />
                  Größerer Zoom
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar Toggle - Top Right */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
            {!sidebarCollapsed ? (
              <Button
                onClick={() => {
                  setSidebarCollapsed(true);
                  // Zoom to show all filtered objects and reload map after sidebar is collapsed
                  setTimeout(() => zoomAndReloadMap(), 100);
                }}
                variant="default"
                size="sm"
                className="text-sm shadow-sm"
                title="Karte anzeigen"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Vollkarte
              </Button>
            ) : (
              <Button
                onClick={() => setSidebarCollapsed(false)}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 shadow-lg text-xs"
                title="Objektliste anzeigen"
              >
                <PanelLeftOpen className="h-3 w-3 mr-1" />
                Mit Liste
              </Button>
            )}
            
            {/* Reset View Button - only show when object is selected */}
            {selectedObject && (
              <Button
                onClick={resetMapView}
                size="sm"
                variant="outline"
                className="bg-white/90 backdrop-blur-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 shadow-lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            )}
          </div>
          
          <MapContainer
            ref={mapRef}
            center={[52.3759, 9.7320]} // Hannover center
            zoom={11}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredObjects.map((obj) => {
              const coords = getObjectCoordinates(obj);
              const analysis = analyzeObjectTemperature(obj);
              const isSelected = selectedObject?.objectid === obj.objectid;
              
              return (
                <Marker
                  key={obj.id}
                  position={[coords.lat, coords.lng]}
                  icon={createStatusIcon(analysis.status, isSelected)}
                  eventHandlers={{
                    click: () => setSelectedObject(obj)
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <div className="font-semibold text-sm mb-1">{obj.name}</div>
                      <div className="text-xs text-gray-600 mb-1">ID: {obj.objectid}</div>
                      <div className="text-xs text-gray-600 mb-3">{obj.city || "Unbekannt"}</div>
                      
                      {/* Status Badge */}
                      <div className="mb-3">
                        <Badge 
                          variant={analysis.critical ? 'destructive' : analysis.warning ? 'secondary' : 'default'}
                          className={analysis.critical ? 'bg-red-100 text-red-800' : 
                                   analysis.warning ? 'bg-orange-100 text-orange-800' : 
                                   analysis.offline ? 'bg-gray-100 text-gray-800' :
                                   'bg-green-100 text-green-800'}
                        >
                          {analysis.critical ? 'Kritisch' : 
                           analysis.warning ? 'Warnung' : 
                           analysis.offline ? 'Offline' : 'Normal'}
                        </Badge>
                      </div>

                      {/* Temperaturwerte */}
                      {!analysis.offline && (obj.fltemp || obj.rttemp) && (
                        <div className="mb-3 p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                            <Thermometer className="h-3 w-3" />
                            Temperaturen
                          </div>
                          {(() => {
                            const fltemp = obj.fltemp;
                            const rttemp = obj.rttemp;
                            
                            if (!fltemp && !rttemp) return null;
                            
                            // Get unique sensor IDs from both fltemp and rttemp
                            const sensorIds = new Set([
                              ...(fltemp ? Object.keys(fltemp).filter(key => key !== 'updateTime') : []),
                              ...(rttemp ? Object.keys(rttemp).filter(key => key !== 'updateTime') : [])
                            ]);
                            
                            if (sensorIds.size === 0) return null;
                            
                            return Array.from(sensorIds).map((sensorId, index) => {
                              const vlTemp = fltemp?.[sensorId];
                              const rlTemp = rttemp?.[sensorId];
                              const sensorLabel = sensorIds.size === 1 ? "Netz" : `Netz ${index + 1}`;
                              
                              return (
                                <div key={sensorId} className="text-xs space-y-0.5">
                                  {vlTemp !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">{sensorLabel} VL:</span>
                                      <span className="font-mono">{vlTemp.toFixed(1)}°C</span>
                                    </div>
                                  )}
                                  {rlTemp !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">{sensorLabel} RL:</span>
                                      <span className="font-mono">{rlTemp.toFixed(1)}°C</span>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                      {/* GPS Coordinates */}
                      <div className="mb-3 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                          <Navigation className="h-3 w-3" />
                          GPS-Koordinaten
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-mono">
                            {(() => {
                              const coords = getObjectCoordinates(obj);
                              return `${Number(coords.lat).toFixed(6)}, ${Number(coords.lng).toFixed(6)}`;
                            })()}
                          </span>
                          {canEditGPS && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditGPS(obj);
                              }}
                              className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                              title="GPS-Koordinaten bearbeiten"
                            >
                              <Edit3 className="h-3 w-3 text-blue-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dashboard Navigation Icons */}
                      <div className="flex gap-3 justify-center pt-2">
                        <Link 
                          href={`/grafana-dashboards?objectID=${obj.objectid}&typ=KI-Auswertung&from=maps`}
                          className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => e.stopPropagation()}
                          title="KI-Auswertung"
                        >
                          <Brain className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                        </Link>
                        
                        <Link 
                          href={`/grafana-dashboards?objectID=${obj.objectid}&typ=diagramme&from=maps`}
                          className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => e.stopPropagation()}
                          title="Diagramme"
                        >
                          <LineChart className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                        </Link>
                        
                        <Link 
                          href={`/grafana-dashboards?objectID=${obj.objectid}&typ=report&from=maps`}
                          className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => e.stopPropagation()}
                          title="Auswertung"
                        >
                          <BarChart className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
      {/* GPS Edit Dialog */}
      <Dialog open={!!editingGPS} onOpenChange={() => setEditingGPS(null)}>
        <DialogContent className="sm:max-w-md z-[10000]">
          <DialogHeader>
            <DialogTitle>GPS-Koordinaten bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Objekt: {editingGPS?.name}
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
                onClick={() => setEditingGPS(null)}
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
      {/* Grafana Dashboard Modal - Absolute Centered */}
      {showGrafanaModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/30"
          onClick={() => setShowGrafanaModal(false)}
        >
          <div 
            className="bg-white border-2 border-gray-300 rounded-lg shadow-2xl flex flex-col"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(800px, 90vw)',
              height: 'min(450px, 80vh)',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex-shrink-0">
              {/* Title Row - Single Line with Truncate */}
              <h2 className="text-base sm:text-lg font-semibold mb-3 truncate">
                <span className="text-black">Netz-Temperaturen</span>
                <span className="text-gray-500"> | {grafanaModalObject?.name}</span>
              </h2>
              
              {/* All Icons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Dashboard Navigation Icons */}
                <div className="flex gap-2">
                  <Link 
                    href={`/grafana-dashboards?objectID=${grafanaModalObject?.objectid}&typ=KI-Auswertung&from=maps`}
                    onClick={() => setShowGrafanaModal(false)}
                    className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    title="KI-Auswertung"
                  >
                    <Brain className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                  </Link>
                  
                  <Link 
                    href={`/grafana-dashboards?objectID=${grafanaModalObject?.objectid}&typ=diagramme&from=maps`}
                    onClick={() => setShowGrafanaModal(false)}
                    className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    title="Diagramme"
                  >
                    <LineChart className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                  </Link>
                  
                  <Link 
                    href={`/grafana-dashboards?objectID=${grafanaModalObject?.objectid}&typ=report&from=maps`}
                    onClick={() => setShowGrafanaModal(false)}
                    className="group p-2 bg-blue-50 border border-blue-300 rounded hover:!bg-blue-600 hover:!border-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    title="Auswertung"
                  >
                    <BarChart className="h-4 w-4 text-blue-600 group-hover:!text-white transition-colors" />
                  </Link>
                </div>

                {/* Time Range Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={modalTimeRange === 'now-48h' ? 'default' : 'outline'}
                    onClick={() => setModalTimeRange('now-48h')}
                  >
                    48h
                  </Button>
                  <Button
                    size="sm"
                    variant={modalTimeRange === 'now-7d' ? 'default' : 'outline'}
                    onClick={() => setModalTimeRange('now-7d')}
                  >
                    7T
                  </Button>
                  <Button
                    size="sm"
                    variant={modalTimeRange === 'now-14d' ? 'default' : 'outline'}
                    onClick={() => setModalTimeRange('now-14d')}
                  >
                    14T
                  </Button>
                  <Button
                    size="sm"
                    variant={modalTimeRange === 'now-30d' ? 'default' : 'outline'}
                    onClick={() => setModalTimeRange('now-30d')}
                  >
                    30T
                  </Button>
                </div>
                
                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  {/* Link Icon für Vollansicht */}
                  <Link 
                    href={`/grafana-dashboards?objectID=${grafanaModalObject?.objectid}&typ=diagramme&from=maps&tap=netzwaechter`}
                    onClick={() => setShowGrafanaModal(false)}
                    className="inline-flex items-center p-2 h-9 w-9 border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    title="Vollansicht öffnen"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </Link>
                  
                  {/* Close Icon */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrafanaModal(false)}
                    className="p-2 h-9 w-9 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                    title="Schließen"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          
            {grafanaModalObject && (() => {
              // Get defaultGrafana settings for diagrammPanelId
              const defaultGrafanaConfig = grafanaSettings?.find(
                (setting: any) => setting.keyName === 'defaultGrafana' || setting.key_name === 'defaultGrafana'
              );
              const grafanaConfig = defaultGrafanaConfig?.value?.setupGrafana;
              
              // Get diagrammPanelId from settings
              const diagrammPanelId = grafanaConfig?.defaultPanelid?.find(
                (p: any) => p.diagrammPanelId
              )?.diagrammPanelId || '16'; // fallback to 16
              
              // Use the first available meter key (prioritize Z20541, then others)
              const availableMeters = grafanaModalObject.meter || {};
              
              // Get meter key (Z20541, etc.) and actual meter ID
              const meterKey = Object.keys(availableMeters).find(key => key === 'Z20541') ||
                              Object.keys(availableMeters).find(key => key.startsWith('Z2054')) ||
                              Object.keys(availableMeters).find(key => key.startsWith('Z')) ||
                              'Z20541'; // fallback
              
              // Get actual meter ID value (not the key)
              const meterId = availableMeters[meterKey] || grafanaModalObject.objectid;
              
              console.log(`🔧 [MODAL] Using meterKey: ${meterKey}, meterId: ${meterId}, available meters:`, Object.keys(availableMeters));
              
              // Generate Grafana URL with required parameters
              const timestamp = Date.now();
              const grafanaUrl = grafanaConfig 
                ? `${grafanaConfig.baseUrl}/${grafanaConfig.defaultDashboard}?orgId=1&from=${modalTimeRange}&to=now&panelId=${diagrammPanelId}&var-id=${meterId}&refresh=30s&theme=light&kiosk=1&t=${timestamp}`
                : '';

              return (
                <div className="flex flex-col flex-1">
                  {/* Grafana iframe */}
                  {grafanaUrl ? (
                    <div className="flex-1 overflow-hidden">
                      <iframe
                        src={grafanaUrl}
                        width="100%"
                        height="100%"
                        style={{ height: 'calc(100% - 20px)', minHeight: '350px' }}
                        frameBorder="0"
                        title={`${grafanaModalObject.name} Dashboard`}
                        className="block"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12 flex-1 flex items-center justify-center">
                      Grafana-Konfiguration nicht verfügbar
                    </div>
                  )}
                  
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}