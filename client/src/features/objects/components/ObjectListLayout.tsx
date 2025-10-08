import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building, ChevronLeft, ChevronRight, Maximize2, Minimize2, Check, XCircle, AlertTriangle, WifiOff, Brain } from "lucide-react";
import { ExclamationTriangleIcon, FireIcon } from "@heroicons/react/24/outline";
import { createFilterOptions } from "./ObjectFilterAPI";

interface ObjectItem {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  postalCode?: string;
  status?: string;
}

interface ObjectListLayoutProps {
  title: string;
  searchPlaceholder?: string;
  selectedObjectId?: number;
  onObjectSelect: (objectId: number) => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  showExpandButton?: boolean;
  autoExpandFromUrl?: boolean;
  componentId?: string;
}

export default function ObjectListLayout({
  title,
  searchPlaceholder = "Objekte suchen...",
  selectedObjectId,
  onObjectSelect,
  children,
  headerActions,
  showExpandButton = false,
  autoExpandFromUrl = false,
  componentId = "default"
}: ObjectListLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(autoExpandFromUrl);
  const [isFullWidth, setIsFullWidth] = useState(autoExpandFromUrl);
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'offline'>('all');
  const [objectGroupFilter, setObjectGroupFilter] = useState<string>('all');
  const [handwerkerFilter, setHandwerkerFilter] = useState<string>('all');
  
  const queryClient = useQueryClient();

  // Fetch objects list with refetch capability
  const { data: objects, isLoading, refetch: refetchObjects } = useQuery<ObjectItem[]>({
    queryKey: ["/api/objects"],
  });

  // Fetch thresholds for temperature-based status detection (like NetworkMonitor)
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch user data to check admin role
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Use gemeinsame ObjectFilterAPI
  const filterOptions = createFilterOptions(objects);

  // Complete NetworkMonitor temperature analysis function
  const analyzeObjectTemperature = (obj: any) => {
    // Use exact NetworkMonitor logic
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'Threshold data not loaded' };
    }

    const availableConfigs = (thresholds as any[]).map(t => t.keyName || t.key_name).filter(k => k && k.trim() && k !== 'undefined');
    
    if (!availableConfigs.includes('netzwaechter_0')) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'netzwaechter_0 missing' };
    }

    // Find threshold configuration with priority order
    let objectThresholds = null;
    let configSource = 'netzwaechter_0';
    
    if (obj.objanlage?.thresholds) {
      const found = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === obj.objanlage.thresholds);
      if (found) {
        objectThresholds = found.value?.thresholds;
        configSource = obj.objanlage.thresholds;
      }
    }
    
    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    const usedThresholds = objectThresholds || defaultThresholds;
    
    if (!usedThresholds) {
      return { status: 'offline', offline: true, lastUpdate: null, reason: 'netzwaechter_0 config not found' };
    }

    // Check temperature data availability and age
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

    // Get latest update time with explicit type safety
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

    // EXACT NetworkMonitor temperature status function
    const getTemperatureStatus = (temp: number, thresholds: any, type: 'vl' | 'rl') => {
      if (type === 'vl') {
        // VL: Kritisch wenn UNTER dem Grenzwert (zu niedrig)
        if (temp < thresholds.critical.vlValue) return 'critical';
        if (temp < thresholds.warning.vlValue) return 'warning';
        return 'normal';
      } else {
        // RL: Kritisch wenn ÜBER dem Grenzwert (zu hoch)
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

  // Filter objects based on search term, status and object group
  const filteredObjects = objects?.filter((obj: any) => {
    // Search filter
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.objectid.toString().includes(searchTerm) ||
      obj.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Status filter
    if (statusFilter !== 'all') {
      const tempAnalysis = analyzeObjectTemperature(obj);
      if (tempAnalysis.status !== statusFilter) return false;
    }
    
    // Typ filter (using objects.objanlage.Typ)
    if (objectGroupFilter !== 'all') {
      const objectType = obj.objanlage?.Typ;
      if (objectType !== objectGroupFilter) return false;
    }
    
    // Handwerker filter (using objects.objanlage.Handwerker)
    if (handwerkerFilter !== 'all') {
      const objectHandwerker = obj.objanlage?.Handwerker;
      if (objectHandwerker !== handwerkerFilter) return false;
    }
    
    return true;
  }) || [];

  // Sort objects by status priority (critical first, then warning, then normal, then offline)
  const sortedObjects = [...filteredObjects].sort((a, b) => {
    const statusA = analyzeObjectTemperature(a).status;
    const statusB = analyzeObjectTemperature(b).status;
    
    const statusPriority = { critical: 0, warning: 1, normal: 2, offline: 3 };
    return statusPriority[statusA as keyof typeof statusPriority] - statusPriority[statusB as keyof typeof statusPriority];
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex h-screen">
        {/* Left Sidebar - Object List */}
        {!isFullWidth && (
          <div className={`bg-transparent flex flex-col transition-all duration-300 relative ${
            isCollapsed ? "w-52" : "w-[40%] max-w-[350px] min-w-[300px]"
          }`}>
          {/* Toggle Button - Overlapping Position */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-4 -right-4 z-10 bg-blue-500 border border-blue-600 rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-blue-600 text-white"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-white" />
            )}
          </Button>
          
          <Card className="rounded-none border-0 border-b bg-transparent h-full flex flex-col">
            <CardContent className="px-0 pb-0 pl-2.5 pr-2.5 flex flex-col h-full">
              {/* Header */}
              <div className="p-4 pb-3 pl-[10px] pr-[10px]">
                <div className="font-semibold tracking-tight text-blue-800 flex items-center justify-start text-[18px]">
                  <Building className={`h-5 w-5 mr-2 ${isCollapsed ? "h-4 w-4 mr-1" : ""}`} />
                  Objektliste ({filteredObjects.length})
                </div>
              </div>
              {/* Search Input */}
              <div className="relative mb-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={isCollapsed ? "Suchen..." : searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 w-full rounded-none border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 ${isCollapsed ? "text-xs" : ""}`}
                />
              </div>

              {/* Status Filter Buttons */}
              {!isCollapsed && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex gap-1 pl-[10px] pr-[10px]">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className={`h-7 px-2 text-xs border border-blue-200 focus:border-blue-500 ${
                      statusFilter === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'
                    }`}
                  >
                    Alle
                  </Button>
                  <Button
                    variant={statusFilter === 'critical' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter('critical')}
                    className={`h-7 px-2 text-xs border border-blue-200 focus:border-blue-500 ${
                      statusFilter === 'critical' ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    Kritisch
                  </Button>
                  <Button
                    variant={statusFilter === 'warning' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter('warning')}
                    className={`h-7 px-2 text-xs border border-blue-200 focus:border-blue-500 ${
                      statusFilter === 'warning' ? 'bg-orange-700 text-white hover:bg-orange-800' : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    Warnung
                  </Button>
                  <Button
                    variant={statusFilter === 'offline' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter('offline')}
                    className={`h-7 px-2 text-xs border border-blue-200 focus:border-blue-500 ${
                      statusFilter === 'offline' ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Offline
                  </Button>
                </div>
              )}

              {/* Filter Dropdowns */}
              {!isCollapsed && (
                <div className="px-4 py-2 bg-gray-50 space-y-2 pl-[10px] pr-[10px]">
                  {/* Type and Handwerker Filter */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Typ</label>
                      <Select value={objectGroupFilter} onValueChange={setObjectGroupFilter}>
                        <SelectTrigger className="w-full h-7 text-xs border-blue-200 focus:border-blue-500">
                          <SelectValue placeholder="Alle..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Typen</SelectItem>
                          {filterOptions && filterOptions.types ? filterOptions.types.map((type: string) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Handwerker Filter */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Handwerker</label>
                      <Select value={handwerkerFilter} onValueChange={setHandwerkerFilter}>
                        <SelectTrigger className="w-full h-7 text-xs border-blue-200 focus:border-blue-500">
                          <SelectValue placeholder="Zauske..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Handwerker</SelectItem>
                          {filterOptions && filterOptions.handwerker ? filterOptions.handwerker.map((handwerker: string) => (
                            <SelectItem key={handwerker} value={handwerker}>{handwerker}</SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Object List */}
              <div className="flex-1 overflow-auto mt-2">
                <div className="bg-transparent">
              {!isCollapsed ? (
                <>
                  {/* Table Header - Full */}
                  <div className="flex gap-2 px-4 py-3 bg-blue-50 border-b border-gray-200 text-sm font-medium text-blue-900 pt-[5px] pb-[5px]">
                    <div className="flex-1 min-w-0">Objekt</div>
                    <div className="w-20">Stadt</div>
                    <div className="w-12 flex justify-center">Status</div>
                  </div>

                  {/* Table Body - Full */}
                  <div className="divide-y divide-gray-200">
                    {isLoading ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        Lade Objekte...
                      </div>
                    ) : sortedObjects.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        Keine Objekte gefunden
                      </div>
                    ) : (
                      sortedObjects.map((obj, index) => (
                        <div
                          key={`${componentId}-object-list-full-${obj.objectid}-${obj.id}`}
                          onClick={() => onObjectSelect(obj.objectid)}
                          onMouseEnter={(e) => {
                            if (selectedObjectId !== obj.objectid) {
                              e.currentTarget.style.backgroundColor = 'rgb(147 197 253)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedObjectId !== obj.objectid) {
                              if (index % 2 === 0) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.65)';
                              } else {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                              }
                            }
                          }}
                          className="flex gap-2 py-[5px] cursor-pointer transition-colors relative border-b-[0.5px] border-gray-300 px-4 ml-[0px] mr-[0px] pl-[10px] pr-[10px]"
                          style={{
                            backgroundColor: selectedObjectId === obj.objectid 
                              ? 'rgb(219 234 254)'
                              : index % 2 === 0 
                                ? 'rgba(255, 255, 255, 0.65)'
                                : 'rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {obj.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {obj.objectid}
                            </div>
                          </div>
                          <div className="w-20">
                            <div className="text-sm text-gray-900 truncate">
                              {obj.city || "-"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {obj.postalCode || "-"}
                            </div>
                          </div>
                          <div className="w-12 flex items-center justify-center">
                            {(() => {
                              const analysis = analyzeObjectTemperature(obj);
                              if (analysis.offline) {
                                return <div title="Offline"><WifiOff className="h-4 w-4 text-red-600" /></div>;
                              } else if (analysis.critical) {
                                return <div title="Kritisch" className="p-1 bg-red-100 rounded-full"><ExclamationTriangleIcon className="h-4 w-4 text-red-600" /></div>;
                              } else if (analysis.warning) {
                                return <div title="Warnung"><ExclamationTriangleIcon className="h-4 w-4 text-orange-500" /></div>;
                              } else {
                                return <div title="Normal"><Check className="h-4 w-4 text-green-600" /></div>;
                              }
                            })()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Collapsed View - Only Names */}
                  <div className="divide-y divide-gray-200">
                    {isLoading ? (
                      <div className="px-2 py-4 text-center text-gray-500 text-xs">
                        ...
                      </div>
                    ) : sortedObjects.length === 0 ? (
                      <div className="px-2 py-4 text-center text-gray-500 text-xs">
                        Keine
                      </div>
                    ) : (
                      sortedObjects.map((obj, index) => (
                        <div
                          key={`${componentId}-object-list-collapsed-${obj.objectid}-${obj.id}`}
                          onClick={() => onObjectSelect(obj.objectid)}
                          onMouseEnter={(e) => {
                            if (selectedObjectId !== obj.objectid) {
                              e.currentTarget.style.backgroundColor = "rgb(147 197 253)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedObjectId !== obj.objectid) {
                              const index = sortedObjects.findIndex(o => o.objectid === obj.objectid);
                              e.currentTarget.style.backgroundColor = index % 2 === 0 
                                ? "rgba(255, 255, 255, 0.65)" 
                                : "rgba(255, 255, 255, 0.8)";
                            }
                          }}
                          className="py-2 cursor-pointer transition-colors relative px-2 ml-1 mr-1"
                          style={{
                            backgroundColor: selectedObjectId === obj.objectid 
                              ? "rgb(219 234 254)" 
                              : index % 2 === 0 
                                ? "rgba(255, 255, 255, 0.65)" 
                                : "rgba(255, 255, 255, 0.8)"
                          }}
                        >
                          <div className="text-gray-900 break-words w-full text-[14px] font-normal">
                            {obj.name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Right Content Area - 60% */}
        <div className="flex-1 bg-gray-50 overflow-auto relative min-w-0">
          {showExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="absolute top-4 left-4 z-10 bg-white border border-gray-200 rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm hover:shadow-md"
              title={isFullWidth ? "Objektliste anzeigen" : "Vollbild"}
            >
              {isFullWidth ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}