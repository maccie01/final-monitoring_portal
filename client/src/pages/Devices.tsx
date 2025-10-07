import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "from "@/components/ui/input"";
import { Label } from "from "@/components/ui/label"";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Cpu,
  Info,
  ArrowLeft,
  Settings,
  Activity,
  Zap,
  Search,
  Building,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import {
  CogIcon,
  InformationCircleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

interface ObjectItem {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  postalCode?: string;
  status?: string;
  objanlage?: any;
  fltemp?: any;
  rttemp?: any;
  meter?: any;
  mandantid?: number;
}

const DeviceStatusIndicator = ({ objectId }: { objectId: number }) => {
  const { data: objects } = useQuery({
    queryKey: ["/api/objects"],
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache
    gcTime: 5 * 60 * 1000, // 5 Minuten Cache
    refetchOnWindowFocus: false,
  });

  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten Cache
    refetchOnWindowFocus: false,
  });

  const getOnlineStatus = () => {
    if (!objects || !thresholds || !Array.isArray(thresholds)) {
      return { isOnline: false, lastUpdate: null, reason: 'Threshold data not loaded', status: 'offline' };
    }

    const obj = (objects as any[]).find((o: any) => o.objectid === objectId);
    if (!obj) {
      return { isOnline: false, lastUpdate: null, reason: 'Object not found', status: 'offline' };
    }

    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { isOnline: false, lastUpdate: null, reason: 'Keine Temperatur-Daten', status: 'offline' };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { isOnline: false, lastUpdate: null, reason: 'Daten älter als 24h', status: 'offline' };
    }

    let latestUpdate: Date | null = null;
    if (hasFltemp && obj.fltemp.updateTime) {
      const flUpdate = new Date(obj.fltemp.updateTime);
      if (!latestUpdate || flUpdate.getTime() > (latestUpdate as Date).getTime()) {
        latestUpdate = flUpdate;
      }
    }
    if (hasRttemp && obj.rttemp.updateTime) {
      const rtUpdate = new Date(obj.rttemp.updateTime);
      if (!latestUpdate || rtUpdate.getTime() > (latestUpdate as Date).getTime()) {
        latestUpdate = rtUpdate;
      }
    }

    // Analyze temperature for critical/warning status
    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    
    if (defaultThresholds && obj.fltemp && obj.rttemp) {
      let critical = false;
      let warning = false;
      
      Object.keys(obj.fltemp).forEach(sensorId => {
        if (sensorId === 'updateTime') return;
        
        const vlTemp = obj.fltemp[sensorId];
        const rlTemp = obj.rttemp[sensorId];
        
        if (vlTemp !== undefined && rlTemp !== undefined) {
          // VL: Kritisch wenn UNTER dem Grenzwert (zu niedrig)
          if (vlTemp < defaultThresholds.critical.vlValue) critical = true;
          else if (vlTemp < defaultThresholds.warning.vlValue) warning = true;
          
          // RL: Kritisch wenn ÜBER dem Grenzwert (zu hoch)
          if (rlTemp > defaultThresholds.critical.rlValue) critical = true;
          else if (rlTemp > defaultThresholds.warning.rlValue) warning = true;
        }
      });
      
      if (critical) {
        return { isOnline: true, lastUpdate: latestUpdate, reason: 'Kritische Temperaturwerte', status: 'critical' };
      } else if (warning) {
        return { isOnline: true, lastUpdate: latestUpdate, reason: 'Temperaturwarnung', status: 'warning' };
      }
    }

    return { isOnline: true, lastUpdate: latestUpdate, reason: 'Aktuelle Temperatur-Daten verfügbar', status: 'normal' };
  };

  const { isOnline, lastUpdate, status } = getOnlineStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'normal': return 'text-green-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'critical': return 'Kritisch';
      case 'warning': return 'Warnung';
      case 'normal': return 'Normal';
      case 'offline': return 'Offline';
      default: return 'Unbekannt';
    }
  };

  return (
    <span className="ml-2">
      / Status: 
      <span className={`ml-1 font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastUpdate && (
        <span className="ml-1 text-sm text-gray-500">
          ({new Date(lastUpdate).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})
        </span>
      )}
    </span>
  );
};

export default function Devices() {
  const { user } = useAuth();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>();
  const [currentMainTab, setCurrentMainTab] = useState<string>("details");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'normal' | 'offline' | 'neu'>('all');
  const [mandantFilter, setMandantFilter] = useState<string>('all');
  
  // Fetch objects list (our "devices")
  const { data: objects, isLoading } = useQuery<ObjectItem[]>({
    queryKey: ["/api/objects"],
  });

  // Fetch thresholds for temperature-based status detection
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Analyze object temperature status (from ObjectListLayout logic)
  const analyzeObjectTemperature = (obj: any) => {
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return { status: 'offline', offline: true, lastUpdate: null };
    }

    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { status: 'offline', offline: true, lastUpdate: null };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { status: 'offline', offline: true, lastUpdate: null };
    }

    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    
    if (defaultThresholds && obj.fltemp && obj.rttemp) {
      let critical = false;
      let warning = false;
      
      Object.keys(obj.fltemp).forEach(sensorId => {
        if (sensorId === 'updateTime') return;
        
        const vlTemp = obj.fltemp[sensorId];
        const rlTemp = obj.rttemp[sensorId];
        
        if (vlTemp !== undefined && rlTemp !== undefined) {
          if (vlTemp < defaultThresholds.critical.vlValue) critical = true;
          else if (vlTemp < defaultThresholds.warning.vlValue) warning = true;
          
          if (rlTemp > defaultThresholds.critical.rlValue) critical = true;
          else if (rlTemp > defaultThresholds.warning.rlValue) warning = true;
        }
      });
      
      if (critical) return { status: 'critical', offline: false };
      else if (warning) return { status: 'warning', offline: false };
    }

    return { status: 'normal', offline: false };
  };

  // Filter devices (objects) based on search and status
  const filteredDevices = objects?.filter((obj: any) => {
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
    
    // Mandant filter (using objects.mandantid)
    if (mandantFilter !== 'all') {
      const objectMandant = obj.mandantid?.toString();
      if (objectMandant !== mandantFilter) return false;
    }
    
    return true;
  }) || [];

  // Sort objects by status priority (critical first)
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const statusA = analyzeObjectTemperature(a).status;
    const statusB = analyzeObjectTemperature(b).status;
    
    const statusPriority = { critical: 0, warning: 1, normal: 2, offline: 3 };
    return statusPriority[statusA as keyof typeof statusPriority] - statusPriority[statusB as keyof typeof statusPriority];
  });

  const selectedDevice = objects?.find(d => d.objectid === selectedDeviceId);
  
  // Generate unique mandants for filter options
  const uniqueMandants = objects 
    ? Array.from(new Set(objects.map(obj => obj.mandantid?.toString()).filter(Boolean))) 
    : [];

  const handleDeviceSelect = (objectId: number) => {
    if (objectId !== selectedDeviceId) {
      setSelectedDeviceId(objectId);
    }
  };

  const getDeviceTypeIcon = (obj: any) => {
    const type = obj.objanlage?.Typ || 'Unbekannt';
    switch (type.toLowerCase()) {
      case 'kessel':
      case 'heizkessel':
        return <Zap className="h-5 w-5 text-red-600" />;
      case 'wärmepumpe':
      case 'waermepumpe':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'sensor':
      case 'temperatursensor':
        return <Cpu className="h-5 w-5 text-green-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDeviceTypeBg = (obj: any) => {
    const type = obj.objanlage?.Typ || 'Unbekannt';
    switch (type.toLowerCase()) {
      case 'kessel':
      case 'heizkessel':
        return 'bg-red-100';
      case 'wärmepumpe':
      case 'waermepumpe':
        return 'bg-blue-100';
      case 'sensor':
      case 'temperatursensor':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusDot = (obj: any) => {
    const analysis = analyzeObjectTemperature(obj);
    switch (analysis.status) {
      case 'critical': return 'bg-red-400';
      case 'warning': return 'bg-orange-400';
      case 'normal': return 'bg-green-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const renderDeviceList = () => {
    if (isLoading) {
      return (
        <div className="w-[40%] max-w-[350px] min-w-[300px] border-r bg-gray-50 h-screen overflow-y-auto">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Geräteverwaltung</h2>
          </div>
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-[500px] border-r bg-gray-50 h-screen overflow-y-auto">
        <div className="p-4 border-b bg-white space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Geräteverwaltung ({filteredDevices.length})</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Objekte durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-devices"
            />
          </div>
          
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'critical', 'warning', 'normal', 'offline', 'neu'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                data-testid={`button-status-${status}`}
                className="text-xs"
              >
                {status === 'all' && 'Alle'}
                {status === 'critical' && 'Kritisch'}
                {status === 'warning' && 'Warnung'}
                {status === 'normal' && 'Normal'}
                {status === 'offline' && 'Offline'}
                {status === 'neu' && 'Neu'}
              </Button>
            ))}
          </div>
          
          {/* Mandant Filter */}
          {uniqueMandants.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mandant</Label>
                <Select value={mandantFilter} onValueChange={setMandantFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alle Mandanten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mandanten</SelectItem>
                    {uniqueMandants.map(mandantId => (
                      <SelectItem key={mandantId} value={mandantId || 'unknown'}>
                        Mandant {mandantId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {/* Simple Table like GrafanaDashboard */}
        <div className="bg-white border border-gray-200 m-4 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm font-medium text-gray-700">Objekt</div>
              <div className="text-sm font-medium text-gray-700">Status</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {sortedDevices.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <WifiOff className="h-6 w-6 mx-auto mb-2" />
                Keine Geräte gefunden
              </div>
            ) : (
              sortedDevices.map((device, index) => {
                const status = analyzeObjectTemperature(device);
                return (
                  <div
                    key={device.objectid}
                    onClick={() => handleDeviceSelect(device.objectid)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                      selectedDeviceId === device.objectid
                        ? 'bg-blue-100 border-l-4 border-l-blue-500'
                        : index % 2 === 0 
                          ? 'bg-white' 
                          : 'bg-gray-50/30'
                    }`}
                    data-testid={`device-item-${device.objectid}`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Objekt Spalte */}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {device.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {device.objectid}
                        </div>
                      </div>

                      {/* Status Spalte */}
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {status.status === 'critical' && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          {status.status === 'warning' && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          {status.status === 'normal' && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          {status.status === 'offline' && (
                            <WifiOff className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailContent = () => {
    if (!selectedDeviceId || !selectedDevice) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="mx-6 my-6">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Cpu className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Wählen Sie ein Gerät aus der Liste
              </h3>
              <p className="text-gray-500">
                um Details und Konfiguration anzuzeigen
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!selectedDevice) {
      return (
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <Card className="ml-[2px] mr-6 mt-6 mb-0 border-0">
          <CardContent className="p-0">
            <Tabs
              value={currentMainTab}
              onValueChange={setCurrentMainTab}
              className="w-full"
            >
              <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 flex flex-col space-x-0 w-full rounded-none">
                {/* Device Header */}
                <div className="w-full px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getDeviceTypeBg(selectedDevice)}`}>
                        {getDeviceTypeIcon(selectedDevice)}
                      </div>

                      <div>
                        <h1 className="text-lg font-bold text-gray-900 mb-1">
                          {selectedDevice.name}
                        </h1>
                        <div className="text-sm text-gray-600 font-medium">
                          Objekt-ID: {selectedDevice.objectid}
                          <DeviceStatusIndicator objectId={selectedDevice.objectid} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDeviceId(undefined)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                        title="Zurück zur Geräteliste"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Zurück</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-start space-x-0 w-full">
                  <TabsTrigger
                    value="details"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="h-5 w-5" />
                      <span>Details</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="configuration"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <CogIcon className="h-5 w-5" />
                      <span>Konfiguration</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="monitoring"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <BoltIcon className="h-5 w-5" />
                      <span>Monitoring</span>
                    </div>
                  </TabsTrigger>

                </div>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="details" className="p-6 pt-4">
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Geräteinformationen</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-base text-gray-900">{selectedDevice.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Typ</label>
                        <p className="text-base text-gray-900">{selectedDevice.objanlage?.Typ || 'Unbekannt'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Standort</label>
                        <p className="text-base text-gray-900">{selectedDevice.city || 'Unbekannt'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Objekt-ID</label>
                        <p className="text-base text-gray-900">{selectedDevice.objectid}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">PLZ</label>
                        <p className="text-base text-gray-900">{selectedDevice.postalCode || 'Unbekannt'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Handwerker</label>
                        <p className="text-base text-gray-900">{selectedDevice.objanlage?.Handwerker || 'Nicht zugewiesen'}</p>
                      </div>
                      {selectedDevice.meter && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Zähler-Daten</label>
                          <div className="text-sm bg-gray-50 p-3 rounded-lg mt-1">
                            <pre className="text-xs">{JSON.stringify(selectedDevice.meter, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="configuration" className="p-6 pt-4">
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Gerätekonfiguration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="device-name">Gerätename</Label>
                        <Input
                          id="device-name"
                          defaultValue={selectedDevice.name}
                          className="mt-1"
                          data-testid="input-device-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="device-location">Standort</Label>
                        <Input
                          id="device-location"
                          defaultValue={selectedDevice.city || ''}
                          className="mt-1"
                          data-testid="input-device-location"
                        />
                      </div>
                      <div>
                        <Label htmlFor="device-type">Typ</Label>
                        <Input
                          id="device-type"
                          defaultValue={selectedDevice.objanlage?.Typ || ''}
                          className="mt-1"
                          data-testid="input-device-type"
                        />
                      </div>
                      <Button className="mt-4" data-testid="button-save-config">
                        Konfiguration speichern
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monitoring" className="p-6 pt-4">
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Überwachung & Metriken</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Betriebszeit</p>
                        <p className="text-2xl font-bold text-blue-600">98.5%</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Leistung</p>
                        <p className="text-2xl font-bold text-green-600">85 kW</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Temperatur</p>
                        <p className="text-2xl font-bold text-orange-600">65°C</p>
                      </div>
                    </div>
                    
                    {/* Temperature Data Display */}
                    {(selectedDevice.fltemp || selectedDevice.rttemp) && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-3">Live Temperaturdaten</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedDevice.fltemp && (
                            <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-red-800 mb-2">Vorlauf-Temperatur</p>
                              {Object.entries(selectedDevice.fltemp).map(([key, value]: [string, any]) => 
                                key !== 'updateTime' && (
                                  <div key={key} className="text-sm">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="ml-2 font-medium text-red-600">{value}°C</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          {selectedDevice.rttemp && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-2">Rücklauf-Temperatur</p>
                              {Object.entries(selectedDevice.rttemp).map(([key, value]: [string, any]) => 
                                key !== 'updateTime' && (
                                  <div key={key} className="text-sm">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="ml-2 font-medium text-blue-600">{value}°C</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {renderDeviceList()}
      <div className="flex-1 overflow-y-auto">
        {renderDetailContent()}
      </div>
    </div>
  );
}