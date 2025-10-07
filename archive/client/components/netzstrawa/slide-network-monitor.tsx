import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildGrafanaUrl } from '@/utils/grafanaConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ExclamationTriangleIcon,
  FireIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  WifiIcon,
  BugAntIcon,
  ChartBarIcon,
  InformationCircleIcon,
  CogIcon,
  ViewColumnsIcon,
  PresentationChartLineIcon,
  CheckCircleIcon,
  ShareIcon,
  BoltIcon,
  FireIcon as HeroFireIcon,
  WifiIcon as OfflineIcon
} from "@heroicons/react/24/outline";
import { Thermometer, Leaf, Maximize2, Minimize2, Brain, WifiOff, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

// Temperatur-Status Logik
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

// Sensor Namen Mapping
const getSensorName = (sensorId: string, allSensorIds: string[]) => {
  const sensorMap: { [key: string]: string } = {
    'VL1': 'Netz1 VL',
    'RL1': 'Netz1 RL',
    'VL2': 'Netz2 VL',
    'RL2': 'Netz2 RL',
    'VL3': 'Netz3 VL',
    'RL3': 'Netz3 RL'
  };
  
  return sensorMap[sensorId] || `Sensor ${sensorId}`;
};

// Embedded Grafana Component für Netzwächter
const GrafanaContentEmbedded = ({ objectId }: { objectId: number }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Fetch selected object details
  const { data: selectedObject } = useQuery<any>({
    queryKey: ["/api/objects/by-objectid", objectId],
    enabled: !!objectId,
  });

  // Simplified tabs without Netzwächter-Logik - using GrafanaDiagramme component now
  const tabs = useMemo(() => {
    return [{
      id: "monitoring",
      label: "System Monitor", 
      icon: <ShareIcon className="h-4 w-4" />
    }];
  }, []);

  // Extended time range options
  const timeRangeOptions = [
    { value: '24h', label: 'Letzte 24h', from: 'now-24h' },
    { value: '3d', label: '3 Tage', from: 'now-3d' },
    { value: '7d', label: '7 Tage', from: 'now-7d' },
    { value: '30d', label: '30 Tage', from: 'now-30d' },
    { value: '90d', label: '3 Monate', from: 'now-90d' },
    { value: '6M', label: '6 Monate', from: 'now-6M' },
    { value: '1y', label: '12 Monate', from: 'now-1y' }
  ];

  // Generate Grafana URL for a specific meter
  const generateGrafanaUrl = async (meterId: string, panelId: number) => {
    const timeRange = timeRangeOptions.find(option => option.value === selectedTimeRange);
    
    try {
      return await buildGrafanaUrl({
        dashboard: selectedObject?.dashboard?.url,
        panelId: panelId,
        meterId: meterId,
        timeRange: timeRange?.from?.replace('now-', '') || '24h',
        additionalParams: {
          refresh: '1m'
        }
      });
    } catch (error) {
      console.error('Error generating Grafana URL:', error);
      return '';
    }
  };

  if (!selectedObject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Grafana Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {tabs.length > 0 ? (
        <div className="space-y-4">
          {/* Tab Navigation with Time Range Selection */}
          <div className="flex items-center justify-between modern-tab-nav bg-white">
            <div className="flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`modern-tab-button flex items-center space-x-2 ${
                    activeTab === index ? "active" : ""
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Time Range Selection */}
            <div className="pb-3 pr-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 text-sm border-0.5 border-gray-300 rounded-md bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tab Content */}
          {tabs[activeTab] && (
            <div className="space-y-4 p-4 pt-[5px] pb-[5px] pl-[10px] pr-[10px] text-[14px]">
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">System Monitor aktiv</p>
                <p className="text-sm text-gray-400">Überwache Netzwächter-Status</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Keine Wächter-Daten verfügbar</p>
          <p className="text-sm text-gray-400">Meter-Konfiguration erforderlich</p>
        </div>
      )}
    </div>
  );
};

export function SlideNetworkMonitor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    critical: false,
    warning: false,
    offline: false,
    energy: false,
    optimized: false
  });
  const [temperatureAnalysis, setTemperatureAnalysis] = useState<any>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredObjects, setFilteredObjects] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Create logbook entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/logbook/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook/entries"] });
      setIsServiceDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Service-Anfrage wurde erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Service-Anfrage konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Generate critical status title for logbook entry
  const generateCriticalTitle = () => {
    if (!selectedSystem?.analysis?.sensors || !selectedSystem?.analysis?.critical) {
      return "Netzstörung";
    }

    // Find the first critical sensor
    const criticalSensor = selectedSystem.analysis.sensors.find((sensor: any) => 
      sensor.vl.status === 'critical' || sensor.rl.status === 'critical'
    );

    if (!criticalSensor) {
      return "Netzstörung";
    }

    // Get critical values and thresholds
    let criticalValue, criticalThreshold, criticalType;
    
    if (criticalSensor.vl.status === 'critical') {
      criticalValue = criticalSensor.vl.value;
      criticalThreshold = criticalSensor.vl.threshold;
      criticalType = 'VL';
    } else {
      criticalValue = criticalSensor.rl.value;
      criticalThreshold = criticalSensor.rl.threshold;
      criticalType = 'RL';
    }

    // Format: "Netz1 VL Kritisch 46 < (Grenzwert =50)"
    const sensorName = criticalSensor.name || "Netz1";
    const comparison = criticalType === 'VL' ? '<' : '>';
    
    return `${sensorName} ${criticalType} Kritisch ${criticalValue} ${comparison} (Grenzwert =${criticalThreshold})`;
  };

  // Objektspezifische Netzwächter-Erkennung
  const isObjectNetzwaechter = (obj: any) => {
    if (!obj) return false;
    
    // Prüfe Zähler des spezifischen Objekts
    const counters = obj.objkpis?.counter || [];
    const meters = obj.meter || {};
    const meterKeys = Object.keys(meters);
    
    // KORREKTE LOGIK: Netzwächter = NUR Z20541-Zähler, keine anderen
    const hasMeters = meterKeys.length > 0;
    const hasOnlyZ20541Meters = hasMeters && meterKeys.every(key => key.startsWith('Z2054'));
    const hasNoHeatingMeters = !meterKeys.some(key => 
      key.startsWith('Z2013') || key.startsWith('Z2014') || key.startsWith('Z2024')
    );
    
    // Zusätzlich: Prüfe Counter
    const hasOnlyZ20541Counters = counters.length === 0 || 
      counters.every((counter: any) => counter.zaehlerId?.startsWith('Z2054'));
    
    return hasMeters && hasOnlyZ20541Meters && hasNoHeatingMeters && hasOnlyZ20541Counters;
  };

  // Fetch critical systems and alerts
  const { data: criticalSystems, isLoading } = useQuery({
    queryKey: ["/api/dashboard/critical-systems"],
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/system-alerts"],
  });

  // Fetch objects with temperature analysis
  const { data: objects } = useQuery({
    queryKey: ["/api/objects"],
  });

  // Fetch temperature thresholds
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch daily consumption data for selected system (needed for KI-Analyse)
  const { data: dailyConsumption } = useQuery({
    queryKey: ["/api/daily-consumption", selectedSystem?.objectid],
    queryFn: async () => {
      if (!selectedSystem?.objectid) return null;
      const response = await fetch(`/api/daily-consumption/${selectedSystem.objectid}`);
      if (!response.ok) throw new Error('Failed to fetch daily consumption');
      return response.json();
    },
    enabled: !!selectedSystem?.objectid,
  });

  // Reset expanded sections when component mounts
  useEffect(() => {
    setExpandedSections({
      critical: false,
      warning: false,
      offline: false,
      energy: false,
      optimized: false
    });
  }, []);

  // Process temperature analysis
  useEffect(() => {
    if (objects && thresholds) {
      processTemperatureAnalysis();
    }
  }, [objects, thresholds]);

  // Click-outside handler für Suchergebnisse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Objektsuche Funktionen
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setShowSearchResults(false);
      setFilteredObjects([]);
      return;
    }

    if (objects && Array.isArray(objects)) {
      const filtered = objects.filter((obj: any) => 
        obj.name?.toLowerCase().includes(term.toLowerCase()) ||
        obj.objectid?.toString().includes(term)
      );
      
      setFilteredObjects(filtered);
      setShowSearchResults(true);
    }
  };

  const getObjectCategory = (obj: any) => {
    if (!temperatureAnalysis) return 'Unbekannt';
    
    // Finde das Objekt in den verschiedenen Kategorien
    if (temperatureAnalysis.critical?.some((item: any) => item.objectid === obj.objectid)) {
      return 'Kritisch';
    }
    if (temperatureAnalysis.warning?.some((item: any) => item.objectid === obj.objectid)) {
      return 'Warnung';
    }
    if (temperatureAnalysis.offline?.some((item: any) => item.objectid === obj.objectid)) {
      return 'Offline';
    }
    if (temperatureAnalysis.energy?.some((item: any) => item.objectid === obj.objectid)) {
      return 'Energie';
    }
    if (temperatureAnalysis.optimized?.some((item: any) => item.objectid === obj.objectid)) {
      return 'Optimiert';
    }
    return 'Unbekannt';
  };

  const selectObjectFromSearch = (obj: any) => {
    // Schließe die Suchergebnisse
    setShowSearchResults(false);
    setSearchTerm('');
    
    // Finde die entsprechende Kategorie und öffne sie
    let targetSection: keyof typeof expandedSections | null = null;
    
    if (temperatureAnalysis.critical?.some((item: any) => item.objectid === obj.objectid)) {
      targetSection = 'critical';
    } else if (temperatureAnalysis.warning?.some((item: any) => item.objectid === obj.objectid)) {
      targetSection = 'warning';
    } else if (temperatureAnalysis.offline?.some((item: any) => item.objectid === obj.objectid)) {
      targetSection = 'offline';
    } else if (temperatureAnalysis.energy?.some((item: any) => item.objectid === obj.objectid)) {
      targetSection = 'energy';
    } else if (temperatureAnalysis.optimized?.some((item: any) => item.objectid === obj.objectid)) {
      targetSection = 'optimized';
    }
    
    if (targetSection) {
      // Öffne die entsprechende Sektion (Accordeon-Verhalten)
      setExpandedSections({
        critical: targetSection === 'critical',
        warning: targetSection === 'warning',
        offline: targetSection === 'offline',
        energy: targetSection === 'energy',
        optimized: targetSection === 'optimized'
      });
      
      // Setze das ausgewählte System für die Details-Anzeige
      const targetObject = temperatureAnalysis[targetSection]?.find((item: any) => item.objectid === obj.objectid);
      if (targetObject) {
        setSelectedSystem(targetObject);
      }
      
      // Scroll zum Element nach kurzer Verzögerung
      setTimeout(() => {
        const element = document.querySelector(`[data-objectid="${obj.objectid}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight-Effekt
          element.classList.add('bg-yellow-200');
          setTimeout(() => {
            element.classList.remove('bg-yellow-200');
          }, 2000);
        }
      }, 300);
    }
  };

  const processTemperatureAnalysis = () => {
    if (!objects || !thresholds) return;

    const analysis = {
      critical: [] as any[],
      warning: [] as any[],
      offline: [] as any[],
      energy: [] as any[],
      optimized: [] as any[]
    };

    (objects as any[]).forEach((obj: any) => {
      const status = analyzeObjectTemperature(obj);
      
      if (status.offline) {
        analysis.offline.push({ ...obj, analysis: status });
      } else if (status.critical) {
        analysis.critical.push({ ...obj, analysis: status });
      } else if (status.warning) {
        analysis.warning.push({ ...obj, analysis: status });
      } else {
        analysis.optimized.push({ ...obj, analysis: status });
      }
    });

    setTemperatureAnalysis(analysis);
  };

  const analyzeObjectTemperature = (obj: any) => {
    // Check if thresholds are loaded
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return { offline: true, lastUpdate: null, reason: `Threshold data not loaded. Received: ${typeof thresholds} with ${thresholds ? 'length' : 'no length'}` };
    }
    
    const availableConfigs = (thresholds as any[]).map(t => t.keyName || t.key_name).filter(k => k && k.trim() && k !== 'undefined');
    
    if (!availableConfigs.includes('netzwaechter_0')) {
      return { offline: true, lastUpdate: null, reason: 'netzwaechter_0 missing' };
    }

    // Find threshold configuration with priority order:
    // 1. objanlage.thresholds (anlagentyp-basiert)
    // 2. netzwaechter_0 (fallback)
    let objectThresholds = null;
    let configSource = 'netzwaechter_0';
    
    if (obj.objanlage?.thresholds) {
      const found = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === obj.objanlage.thresholds);
      if (found) {
        objectThresholds = found.value?.thresholds;
        configSource = obj.objanlage.thresholds;
      }
    }
    
    // Fallback to default netzwaechter_0 if no object-specific config found
    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    const usedThresholds = objectThresholds || defaultThresholds;
    
    if (!usedThresholds) {
      return { offline: true, lastUpdate: null, reason: 'netzwaechter_0 config not found' };
    }
    
    // Prüfe ob Objekt offline ist (keine Temperatur-Daten oder älter als 24h)
    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { offline: true, lastUpdate: null, reason: 'Keine Temperatur-Daten' };
    }

    // Prüfe ob Daten älter als 24h sind
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { offline: true, lastUpdate: null, reason: 'Daten älter als 24h' };
    }

    let critical = false;
    let warning = false;
    const sensors: any[] = [];
    
    // Sammle alle verfügbaren Sensor-IDs für die getSensorName Logik (unique)
    const allSensorIds: string[] = [];
    const sensorSet = new Set<string>();
    if (obj.fltemp) Object.keys(obj.fltemp).forEach(key => key !== 'updateTime' && sensorSet.add(key));
    if (obj.rttemp) Object.keys(obj.rttemp).forEach(key => key !== 'updateTime' && sensorSet.add(key));
    allSensorIds.push(...Array.from(sensorSet));

    // Analyze each sensor using the selected threshold configuration
    Object.keys(obj.fltemp).forEach(sensorId => {
      if (sensorId === 'updateTime') return;
      
      const vlTemp = obj.fltemp[sensorId];
      const rlTemp = obj.rttemp[sensorId];
      
      if (vlTemp !== undefined && rlTemp !== undefined) {
        const vlStatus = getTemperatureStatus(vlTemp, usedThresholds, 'vl');
        const rlStatus = getTemperatureStatus(rlTemp, usedThresholds, 'rl');
        
        const sensorStatus = vlStatus === 'critical' || rlStatus === 'critical' ? 'critical' :
                           vlStatus === 'warning' || rlStatus === 'warning' ? 'warning' : 'normal';
        
        if (sensorStatus === 'critical') critical = true;
        if (sensorStatus === 'warning') warning = true;
        
        // Threshold display for Netzwächter configuration
        const getDisplayThreshold = (status: string, type: 'vl' | 'rl') => {
          if (status === 'critical') {
            return type === 'vl' ? usedThresholds.critical.vlValue : usedThresholds.critical.rlValue;
          } else if (status === 'warning') {
            return type === 'vl' ? usedThresholds.warning.vlValue : usedThresholds.warning.rlValue;
          } else {
            return type === 'vl' ? usedThresholds.warning.vlValue : usedThresholds.warning.rlValue;
          }
        };

        sensors.push({
          id: sensorId,
          name: getSensorName(sensorId, allSensorIds),
          vl: { value: vlTemp, status: vlStatus, threshold: getDisplayThreshold(vlStatus, 'vl') },
          rl: { value: rlTemp, status: rlStatus, threshold: getDisplayThreshold(rlStatus, 'rl') },
          overallStatus: sensorStatus,
          thresholdConfig: configSource
        });
      }
    });

    // Bestimme letzte Update-Zeit aus Temperatur-Daten
    const getLatestUpdateTime = () => {
      const flUpdateTime = obj.fltemp?.updateTime;
      const rtUpdateTime = obj.rttemp?.updateTime;
      
      if (flUpdateTime && rtUpdateTime) {
        return new Date(flUpdateTime) > new Date(rtUpdateTime) ? flUpdateTime : rtUpdateTime;
      }
      return flUpdateTime || rtUpdateTime;
    };

    const lastUpdate = getLatestUpdateTime();

    return {
      critical,
      warning,
      sensors,
      lastUpdate,
      usedThresholdConfig: configSource,
      thresholdSource: configSource
    };
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderAnalysisSection = (
    title: string,
    items: any[],
    sectionKey: keyof typeof expandedSections,
    bgColor: string,
    textColor: string,
    icon: React.ReactNode
  ) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <Card className="mb-4">
        <CardHeader
          className={`cursor-pointer ${bgColor} ${textColor} p-4 flex flex-row items-center justify-between space-y-0`}
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center space-x-3">
            {icon}
            <CardTitle className="text-base font-medium">
              {title} ({items?.length || 0})
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5" />
          ) : (
            <ChevronRightIcon className="h-5 w-5" />
          )}
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Letzte Aktualisierung</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item: any) => (
                  <TableRow 
                    key={item.objectid}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedSystem(item)}
                    data-objectid={item.objectid}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">ID: {item.objectid}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.analysis?.offline ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">Offline</Badge>
                      ) : item.analysis?.critical ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">Critical</Badge>
                      ) : item.analysis?.warning ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">Warning</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{item.analysis?.lastUpdate ? new Date(item.analysis.lastUpdate).toLocaleDateString('de-DE') : '25.7.2025'}</div>
                      <div className="text-gray-500">{item.analysis?.lastUpdate ? new Date(item.analysis.lastUpdate).toLocaleTimeString('de-DE') : '23:04:01'}</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSystem(item);
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Netzwächter-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header with Search and Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative search-container">
            <Input
              type="text"
              placeholder="Objekt suchen..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64"
              data-testid="input-search"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && filteredObjects.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                <div className="max-h-60 overflow-y-auto">
                  {filteredObjects.map((obj: any) => (
                    <div
                      key={obj.objectid}
                      onClick={() => selectObjectFromSearch(obj)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{obj.name}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>ID: {obj.objectid}</span>
                        <Badge variant="outline" className="text-xs">
                          {getObjectCategory(obj)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullWidth(!isFullWidth)}
            data-testid="button-fullwidth"
          >
            {isFullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullWidth ? 'Normal' : 'Vollbild'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            data-testid="button-debug"
          >
            <BugAntIcon className="h-4 w-4 mr-1" />
            Debug
          </Button>
        </div>
      </div>

      <div className="flex gap-6 h-full">
        {/* Left Panel - Temperature Analysis */}
        <Card className="flex-1 h-fit">
          <CardContent className="p-6 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
            {/* Temperature Analysis Sections */}
            {temperatureAnalysis && (
              <div className="space-y-4">
                {renderAnalysisSection(
                  "Kritische Anlagen",
                  temperatureAnalysis.critical,
                  "critical",
                  "bg-red-100",
                  "text-red-700",
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                )}
                
                {renderAnalysisSection(
                  "Anlagen mit Warnungen", 
                  temperatureAnalysis.warning,
                  "warning",
                  "bg-orange-100",
                  "text-orange-700",
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                )}
                
                {renderAnalysisSection(
                  "Offline-Anlagen",
                  temperatureAnalysis.offline,
                  "offline", 
                  "bg-gray-100",
                  "text-gray-700",
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}

                {renderAnalysisSection(
                  "Energie-Anlagen",
                  temperatureAnalysis.energy,
                  "energy", 
                  "bg-blue-100",
                  "text-blue-700",
                  <BoltIcon className="h-5 w-5 text-blue-600" />
                )}
                
                {renderAnalysisSection(
                  "Optimierte Anlagen",
                  temperatureAnalysis.optimized,
                  "optimized",
                  "bg-green-100",
                  "text-green-700",
                  <ClockIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Object Details */}
        {selectedSystem && (
          <Card className="lg:flex-1 h-fit">
            <CardContent className="p-0">
              <div>
                {/* Header with Object Info */}
                <div className="p-4 pt-3 pb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-gray-900 text-[18px]">{selectedSystem.name}</h2>
                      <p className="text-gray-600 text-[12px]">Objekt-ID: {selectedSystem.objectid}</p>
                    </div>
                    
                    {/* Status Icon and Service Button */}
                    <div className="flex items-center space-x-2">
                      {selectedSystem.analysis?.critical && (
                        <div className="p-2 bg-red-100 rounded-lg">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" title="KRITISCH" />
                        </div>
                      )}
                      {selectedSystem.analysis?.warning && !selectedSystem.analysis?.critical && (
                        <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" title="WARNUNG" />
                      )}
                      {selectedSystem.analysis?.offline && !selectedSystem.analysis?.critical && !selectedSystem.analysis?.warning && (
                        <WifiOff className="h-6 w-6 text-red-600" />
                      )}
                      {!selectedSystem.analysis?.critical && !selectedSystem.analysis?.warning && !selectedSystem.analysis?.offline && (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" title="NORMAL" />
                      )}
                      
                      {/* Service Button für kritische Systeme */}
                      {selectedSystem.analysis?.critical && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsServiceDialogOpen(true)}
                        >
                          <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                          Service
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="monitoring" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
                    <TabsTrigger 
                      value="monitoring" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <PresentationChartLineIcon className="h-4 w-4 mr-1" />
                      Monitoring
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="details" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="monitoring" className="p-6 pt-4 pl-[10px] pr-[10px] pb-[10px]">
                    {/* Monitoring Content */}
                    <GrafanaContentEmbedded objectId={selectedSystem.objectid} />
                  </TabsContent>

                  <TabsContent value="details" className="p-6 pt-4 pl-[10px] pr-[10px] pb-[10px]">
                    {/* Temperature Sensor Details */}
                    {selectedSystem.analysis?.sensors && selectedSystem.analysis.sensors.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-800 mb-4">
                          Temperatursensoren
                        </h4>
                        <div className="space-y-2">
                          {selectedSystem.analysis.sensors.map((sensor: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{sensor.name}</span>
                                <Badge 
                                  variant={sensor.overallStatus === 'critical' ? 'destructive' : 
                                          sensor.overallStatus === 'warning' ? 'secondary' : 'outline'}
                                  className={sensor.overallStatus === 'critical' ? 'bg-red-100 text-red-800' :
                                            sensor.overallStatus === 'warning' ? 'bg-orange-100 text-orange-800' :
                                            'bg-green-100 text-green-800'}
                                >
                                  {sensor.overallStatus === 'critical' ? 'Kritisch' :
                                   sensor.overallStatus === 'warning' ? 'Warnung' : 'Normal'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600">Vorlauf (VL)</div>
                                  <div className={`font-medium ${sensor.vl.status === 'critical' ? 'text-red-600' :
                                                                 sensor.vl.status === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>
                                    {sensor.vl.value}°C
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Grenzwert: {sensor.vl.threshold}°C
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Rücklauf (RL)</div>
                                  <div className={`font-medium ${sensor.rl.status === 'critical' ? 'text-red-600' :
                                                                 sensor.rl.status === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>
                                    {sensor.rl.value}°C
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Grenzwert: {sensor.rl.threshold}°C
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service-Anfrage erstellen</DialogTitle>
            <DialogDescription>
              Erstelle eine Service-Anfrage für kritisches System: {selectedSystem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titel
              </Label>
              <Input
                id="title"
                value={generateCriticalTitle()}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Beschreibung
              </Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie das Problem..."
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => {
              const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
              createEntryMutation.mutate({
                objectId: selectedSystem?.objectid,
                title: generateCriticalTitle(),
                description: description || 'Service-Anfrage für kritisches System',
                category: 'service',
                priority: 'high'
              });
            }}>
              Erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}