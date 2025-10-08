import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
// Transparent divs instead of Card components
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildGrafanaUrl } from "@/utils/grafanaConfig";
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
import ObjektinfoContent from "../components/ObjektinfoContent";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { GrafanaDiagramme } from "@/components/GrafanaDiagramme";
import { NetzView } from "@/components/NetzView";
import { KIEnergyAnalysisNetz } from "@/components/KI_energy_netz";


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

  // Time range options
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
          <div className="flex items-center modern-tab-nav bg-white">
            <div className="flex flex-1">
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

import "../components/TempAnalysisTable.css";

export default function NetworkMonitor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
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

  // Automatisches Aufklappen basierend auf Anzahl der Anlagen
  useEffect(() => {
    if (temperatureAnalysis) {
      setExpandedSections(prev => ({
        ...prev,
        critical: (temperatureAnalysis.critical?.length || 0) > 0,
        warning: (temperatureAnalysis.warning?.length || 0) > 0
      }));
    }
  }, [temperatureAnalysis]);

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
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  // URL-Parameter parsing für Netzwächter-Modus
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      objectID: searchParams.get('objectID'),
      typ: searchParams.get('typ')
    };
  }, [location]);

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

  // Netzwächter-Modus Erkennung
  const isNetzwaechterMode = useMemo(() => {
    // Explizit via URL-Parameter
    if (urlParams.typ === 'netzwächter') {
      return true;
    }
    
    // Objektspezifisch: wenn ein Objekt selektiert ist, prüfe nur dieses
    if (selectedSystem) {
      return isObjectNetzwaechter(selectedSystem);
    }
    
    // Fallback: prüfe alle Objekte
    if (objects && Array.isArray(objects) && objects.length > 0) {
      return objects.every((obj: any) => isObjectNetzwaechter(obj));
    }
    
    return false;
  }, [urlParams.typ, selectedSystem, objects]);

  // Fetch temperature thresholds
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch daily consumption data for selected system (needed for KI-Analyse)
  const { data: dailyConsumption } = useQuery({
    queryKey: ["/api/public-daily-consumption", selectedSystem?.objectid],
    queryFn: async () => {
      if (!selectedSystem?.objectid) return null;
      const response = await fetch(`/api/public-daily-consumption/${selectedSystem.objectid}`);
      if (!response.ok) throw new Error('Failed to fetch daily consumption');
      return response.json();
    },
    enabled: !!selectedSystem?.objectid,
  });

  // Fetch monthly consumption data for selected system (needed for KI-Bewertung)
  const { data: monthlyConsumption } = useQuery({
    queryKey: ["/api/public-monthly-consumption", selectedSystem?.objectid],
    queryFn: async () => {
      if (!selectedSystem?.objectid) return null;
      const response = await fetch(`/api/public-monthly-consumption/${selectedSystem.objectid}`);
      if (!response.ok) {
        console.warn('Monthly consumption API not available, using empty data');
        return {};
      }
      return response.json();
    },
    enabled: !!selectedSystem?.objectid,
  });

  // Fetch all time ranges for multi-year KI-Bewertung in one call
  const { data: allTimeRangeConsumption, isLoading: isLoadingMultiYear } = useQuery({
    queryKey: ["/api/monthly-consumption-multi-year", selectedSystem?.objectid],
    queryFn: async () => {
      if (!selectedSystem?.objectid) return null;
      
      try {
        // Try multiple calls in parallel for efficiency
        const [current, lastYear, yearBefore] = await Promise.all([
          fetch(`/api/public-monthly-consumption/${selectedSystem.objectid}?timeRange=last-365-days`).then(r => r.ok ? r.json() : null),
          fetch(`/api/public-monthly-consumption/${selectedSystem.objectid}?timeRange=last-year`).then(r => r.ok ? r.json() : null),
          fetch(`/api/public-monthly-consumption/${selectedSystem.objectid}?timeRange=year-before-last`).then(r => r.ok ? r.json() : null)
        ]);
        
        return {
          'last-365-days': current || {},
          'last-year': lastYear || {},
          'year-before-last': yearBefore || {}
        };
      } catch (error) {
        console.warn('Multi-year consumption API failed:', error);
        return {
          'last-365-days': {},
          'last-year': {},
          'year-before-last': {}
        };
      }
    },
    enabled: !!selectedSystem?.objectid,
  });

  // Reset expanded sections when component mounts (navigating to Netzwächter)
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

  const getSensorName = (sensorId: string, allSensors?: string[]) => {
    // Prüfe, ob mehrere Netz-Sensoren vorhanden sind
    const netzSensors = allSensors?.filter(id => 
      id === 'Z20541' || id === 'Z20542' || id === 'Z20543' || 
      id === '20541' || id === '20542' || id === '20543'
    ) || [];
    
    const hasMultipleNetz = netzSensors.length > 1;
    
    const sensorMap: Record<string, string> = {
      'Z20541': hasMultipleNetz ? 'Netz 1' : 'Netz',
      'Z20542': 'Netz 2', 
      'Z20543': 'Netz 3',
      '20541': hasMultipleNetz ? 'Netz 1' : 'Netz',
      '20542': 'Netz 2',
      '20543': 'Netz 3'
    };
    
    return sensorMap[sensorId] || `Sensor ${sensorId}`;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => {
      // Accordeon-Verhalten: Nur eine Sektion zur Zeit offen
      const isCurrentlyExpanded = prev[section];
      
      if (isCurrentlyExpanded) {
        // Wenn die Sektion bereits offen ist, schließe sie
        return {
          critical: false,
          warning: false,
          offline: false,
          energy: false,
          optimized: false
        };
      } else {
        // Schließe alle anderen Sektionen und öffne nur die geklickte
        return {
          critical: section === 'critical',
          warning: section === 'warning',
          offline: section === 'offline',
          energy: section === 'energy',
          optimized: section === 'optimized'
        };
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-error bg-red-100";
      case "warning": 
        return "text-warning bg-yellow-100";
      case "failure":
        return "text-error bg-red-100";
      default:
        return "text-gray-50 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
      case "failure":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <FireIcon className="h-5 w-5" />;
    }
  };

  const renderAnalysisSection = (title: string, items: any[], sectionKey: keyof typeof expandedSections, bgColor: string, textColor: string, icon: any) => {
    const isExpanded = expandedSections[sectionKey];
    const count = items?.length || 0;
    
    // Bestimme Badge-Farbe basierend auf Sektionstyp (nur Text farbig, Hintergrund weiß)
    const getBadgeColor = () => {
      switch (sectionKey) {
        case 'critical':
          return 'bg-white text-red-600';
        case 'warning':
          return 'bg-white text-orange-600';
        case 'energy':
          return 'bg-white text-blue-600';
        case 'offline':
          return 'bg-white text-gray-600';
        case 'optimized':
          return 'bg-white text-green-600';
        default:
          return 'bg-white text-gray-600';
      }
    };
    
    return (
      <div className={`rounded-lg ${bgColor} mb-4`}>
        <div 
          className="flex items-center justify-between cursor-pointer p-3 min-w-0"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
            {isExpanded ? <ChevronDownIcon className="h-4 w-4 flex-shrink-0" /> : <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />}
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <span className="font-semibold flex-shrink-0">{title}</span>
            <span className={`${getBadgeColor()} px-2 py-1 rounded-full text-sm font-bold flex-shrink-0`}>
              {count}
            </span>
          </div>
        </div>
        {isExpanded && items && items.length > 0 && (
          <div>
            <div className="temp-analysis-container">
              <table className={`temp-analysis-table ${sectionKey === 'critical' ? 'critical' : 'warning'}`}>
              <thead>
                <tr>
                  <th className="font-normal">OBJEKT</th>
                  <th>TEMPERATUR-KI-ANALYSE</th>
                  <th>UPDATE-ZEIT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => {
                  // Alternierende Zeilen werden durch CSS gehandhabt
                  const rowClassName = 'border-b border-gray-200';
                  
                  // Erweiterte Klick-Funktionalität: Öffnet Detail-Tab mit Netz-Diagramm
                  const handleRowClick = () => {
                    setSelectedSystem(item);
                  };
                  
                  return (
                    <tr 
                      key={item.objectid || index} 
                      onClick={handleRowClick}
                      className={`${rowClassName} cursor-pointer transition-colors duration-150`}
                      data-objectid={item.objectid}
                    >
                      <td>
                      <b>{item.name}</b><br />
                      <span className="object-id">{item.objectid}</span>
                    </td>
                      <td>
                        {item.analysis?.sensors && item.analysis.sensors.length > 0 ? (
                          <div>
                            {item.analysis.sensors.map((sensor: any) => (
                              <div key={sensor.id} style={{marginBottom: '2px'}}>
                                <div className={
                                  sensor.vl.status === 'critical' ? 'temp-value-critical' :
                                  sensor.vl.status === 'warning' ? 'temp-value-warning' : 'text-gray-500'
                                }>
                                  {sensor.name} VL: {sensor.vl.value}°C {sensor.vl.value > sensor.vl.threshold ? '>' : '<'} {sensor.vl.threshold}°C
                                </div>
                                <div className={
                                  sensor.rl.status === 'critical' ? 'temp-value-critical' :
                                  sensor.rl.status === 'warning' ? 'temp-value-warning' : 'text-gray-500'
                                }>
                                  {sensor.name} RL: {sensor.rl.value}°C {sensor.rl.value > sensor.rl.threshold ? '>' : '<'} {sensor.rl.threshold}°C
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : item.analysis?.reason ? (
                          <span className="object-id">{item.analysis.reason}</span>
                        ) : (
                          <span className="object-id">Keine Sensordaten</span>
                        )}
                      </td>
                      <td className="update-time">
                        {item.analysis?.lastUpdate ? (
                          <>
                            {new Date(item.analysis.lastUpdate).toLocaleDateString('de-DE')}<br />
                            {new Date(item.analysis.lastUpdate).toLocaleTimeString('de-DE')}
                          </>
                        ) : (
                          <>
                            -<br />
                            -
                          </>
                        )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetailButton = (item: any) => (
    <Button 
      size="sm" 
      variant="outline" 
      className="mt-2 w-full"
      onClick={() => setSelectedSystem(item)}
    >
      Details anzeigen
    </Button>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <div className="animate-pulse bg-transparent border-0">
            <div className="p-6 bg-transparent">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="animate-pulse bg-transparent border-0">
            <div className="p-6 bg-transparent">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex flex-col lg:flex-row gap-6 flex-1 p-6 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
        {/* Left Panel - Temperature Analysis Sections */}
        {!isFullWidth && (
        <div className="h-fit lg:w-[32%] lg:max-w-[500px] lg:min-w-[380px] bg-transparent border-0">
          <div className="flex flex-col space-y-1.5 p-6 pt-[10px] pb-[10px] pl-[10px] pr-[10px] bg-transparent">
            
            {/* Objektsuche */}
            <div className="mt-4 relative search-container">
              <div className="relative">
                <Input
                  placeholder="Objekt suchen (Name oder ID)..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Suchergebnisse Dropdown */}
              {showSearchResults && filteredObjects.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredObjects.map((obj) => (
                    <div
                      key={obj.objectid}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectObjectFromSearch(obj)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{obj.name}</div>
                          <div className="text-xs text-gray-500">ID: {obj.objectid}</div>
                        </div>
                        <div className="text-xs text-blue-600">
                          {getObjectCategory(obj)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {showDebugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                <div className="flex items-center gap-2 mb-3">
                  <BugAntIcon className="h-4 w-4" />
                  <strong>Temperatur-KI-Analyse für {objects ? (objects as any[]).length : 0} Objekte</strong>
                </div>
                
                <div className="bg-white rounded border max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left font-semibold">ObjectName</th>
                        <th className="px-2 py-1 text-left font-semibold">Temperatur-KI-Analyse</th>
                        <th className="px-2 py-1 text-left font-semibold">Status</th>
                        <th className="px-2 py-1 text-left font-semibold">Update-Zeit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(objects as any[] | undefined)?.map((obj: any) => {
                        const analysis = analyzeObjectTemperature(obj);

                        return (
                          <tr key={obj.objectid} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-2">
                              <div className="text-blue-600 font-medium">{obj.name}</div>
                              <div className="text-gray-500">{obj.objectid}</div>
                            </td>
                            <td className="px-2 py-2">
                              {!obj.fltemp || Object.keys(obj.fltemp).length === 0 ? (
                                <span className="text-gray-500">Keine Temperaturdaten</span>
                              ) : analysis && (analysis as any).sensors && (analysis as any).sensors.length > 0 ? (
                                <div className="text-xs">
                                  <div>Sensoren: {(analysis as any).sensors.length}</div>
                                  <div>Config: {(analysis as any).usedThresholdConfig || 'netzwaechter_0'}</div>
                                </div>
                              ) : (analysis as any).reason ? (
                                <span className="text-red-500">{(analysis as any).reason}</span>
                              ) : (
                                <span className="text-orange-500">Unbekannter Status</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {(analysis as any).offline ? (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Offline</Badge>
                              ) : (analysis as any).critical ? (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">Critical</Badge>
                              ) : (analysis as any).warning ? (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">Warning</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <div>{(analysis as any).lastUpdate ? new Date((analysis as any).lastUpdate).toLocaleDateString('de-DE') : '25.7.2025'}</div>
                              <div className="text-gray-500">{(analysis as any).lastUpdate ? new Date((analysis as any).lastUpdate).toLocaleTimeString('de-DE') : '23:04:01'}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-3 text-xs text-gray-600">
                  <div><strong>Debug Info:</strong></div>
                  <div>Objects loaded: {objects ? (objects as any[]).length : 'No'} | Thresholds loaded: {thresholds ? (thresholds as any[]).length : 'No'}</div>
                  {temperatureAnalysis && (
                    <div>Critical: {temperatureAnalysis.critical?.length || 0} | Warning: {temperatureAnalysis.warning?.length || 0} | Offline: {temperatureAnalysis.offline?.length || 0} | Normal: {temperatureAnalysis.optimized?.length || 0}</div>
                  )}
                  {thresholds && Array.isArray(thresholds) && thresholds.length > 0 && (
                    <div className="text-blue-600 mt-1">
                      Available configs: {(thresholds as any[]).map(t => t.keyName || t.key_name || 'undefined').filter(k => k !== 'undefined').join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="p-6 pl-[10px] pr-[10px] pt-[10px] pb-[10px] bg-transparent">
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
                  "Anlagen - hoher Energieverbrauch",
                  temperatureAnalysis.energy,
                  "energy",
                  "bg-blue-100", 
                  "text-blue-700",
                  <FireIcon className="h-5 w-5 text-blue-600" />
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
                  "Optimierte Anlagen",
                  temperatureAnalysis.optimized,
                  "optimized",
                  "bg-green-100",
                  "text-green-700",
                  <ClockIcon className="h-5 w-5 text-green-600" />
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right Panel - Object Details */}
        <div className={`h-fit relative ${isFullWidth ? 'w-full' : 'lg:flex-1'} bg-white border-0 rounded-lg`}>
          {/* Fullwidth Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="absolute top-4 -left-4 z-10 bg-blue-500 border border-blue-600 rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-blue-600 text-white"
            title={isFullWidth ? "Split-View anzeigen" : "Vollbild"}
          >
            {isFullWidth ? (
              <Minimize2 className="h-4 w-4 text-white" />
            ) : (
              <Maximize2 className="h-4 w-4 text-white" />
            )}
          </Button>
          <div className="p-0 bg-white rounded-lg">
            {selectedSystem ? (
              <div>
                {/* Header with Building Icon and Object ID */}
                <div className="p-4 pt-3 pb-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-gray-900 text-[18px]">{selectedSystem.name}</h2>
                      <p className="text-gray-600 text-[12px]">Objekt-ID: {selectedSystem.objectid}</p>
                    </div>
                    
                    {/* Dashboard Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="default"
                        className="flex items-center space-x-2 pl-[10px] pr-[10px] ml-[0px] mr-[0px]"
                        onClick={() => navigate(`/grafana-dashboards?objectID=${selectedSystem.objectid}&typ=waechter&from=network-monitor`)}
                        title="Grafana Dashboard"
                      >
                        <PresentationChartLineIcon className="h-5 w-5" />
                        <span>&gt; Dashboard</span>
                      </Button>
                      
                      {(user as any)?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="default"
                          className="flex items-center justify-center w-10 h-10 p-0"
                          onClick={() => navigate(`/objects?objectId=${selectedSystem.objectid}`)}
                          title="Objektverwaltung"
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Status Icon */}
                    {selectedSystem.analysis?.critical && (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-label="KRITISCH" />
                      </div>
                    )}
                    {selectedSystem.analysis?.warning && !selectedSystem.analysis?.critical && (
                      <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" aria-label="WARNUNG" />
                    )}
                    {selectedSystem.analysis?.offline && !selectedSystem.analysis?.critical && !selectedSystem.analysis?.warning && (
                      <WifiOff className="h-6 w-6 text-red-600" aria-label="OFFLINE" />
                    )}
                    {!selectedSystem.analysis?.critical && !selectedSystem.analysis?.warning && !selectedSystem.analysis?.offline && (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" aria-label="NORMAL" />
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue={isNetzwaechterMode ? "ki-bewertung" : "uebersicht"} className="w-full">
                  <TabsList className={`grid w-full ${isNetzwaechterMode ? 'grid-cols-4' : 'grid-cols-5'} bg-transparent border-b border-gray-200 rounded-none h-auto p-0`}>
                    
                    {/* 1) Netz-Diagramm Tab - nur anzeigen wenn NICHT im Netzwächter-Modus */}
                    {!isNetzwaechterMode && (
                      <TabsTrigger 
                        value="uebersicht" 
                        className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                      >
                        <ViewColumnsIcon className="h-4 w-4 mr-1" />
                        Netz-Diagramm
                      </TabsTrigger>
                    )}
                    
                    {/* 2) KI-Bewertung Tab */}
                    <TabsTrigger 
                      value="ki-bewertung" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      KI-Bewertung
                    </TabsTrigger>
                    
                    {/* 3) KI-Analyse Tab */}
                    <TabsTrigger 
                      value="netzwaechter" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      KI-Analyse
                    </TabsTrigger>
                    
                    {/* 4) Objektinfo Tab */}
                    <TabsTrigger 
                      value="objekt" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      Objektinfo
                    </TabsTrigger>
                    
                    {/* 5) Service Tab */}
                    <TabsTrigger 
                      value="service" 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent text-sm py-3 px-4"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Service
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="uebersicht" className="p-6 pl-[10px] pr-[10px] pt-[0px] pb-[10px]">
                    {/* Overview Dashboard */}
                    <div className="space-y-4">
                      
                      



                      {/* System-Schema - Full Width */}
                      <div className="mt-[5px]">
                        <div className="bg-transparent border-0">
                          <div className="p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px] bg-transparent">
                            {selectedSystem.meter && (
                              <NetzView 
                                meterData={selectedSystem.meter}
                                objectId={selectedSystem.objectid}
                              />
                            )}
                          </div>
                        </div>
                      </div>




                    </div>
                  </TabsContent>

                  <TabsContent value="netzwaechter" className="p-6 pt-4 pl-[24px] pr-[24px] pb-[10px]">
                    {/* Energiezähler KI-Analyse */}
                    {selectedSystem?.meter && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 pt-[10px] pb-[10px] pl-[1px] pr-[1px]">
                        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center pl-[10px] pr-[10px]">
                          <BoltIcon className="h-5 w-5 mr-2 text-orange-500" />
                          Energiezähler KI-Analyse
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Komponente</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">
                                  Tageswerte <span className="text-sm font-normal text-gray-500">(letzte 7 Tage - kWh)</span>
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Bewertung</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(selectedSystem.meter)
                                .filter(([key]) => key !== 'ZLOGID')
                                .sort(([keyA], [keyB]) => {
                                  // Sort order: Netz (Z2054x) → Wärmepumpe (Z2024x) → Kessel (Z2014x) → Wärmepumpe-Strom (Z2022x) → Sonstige
                                  const getOrder = (key: string) => {
                                    if (key.match(/^Z2054\d*/)) return 1; // Netz
                                    if (key.match(/^Z2024\d*/)) return 2; // Wärmepumpe
                                    if (key.match(/^Z2014\d*/)) return 3; // Kessel
                                    if (key.match(/^Z2022\d*/)) return 4; // Wärmepumpe-Strom
                                    return 5; // Sonstige
                                  };
                                  
                                  const orderA = getOrder(keyA);
                                  const orderB = getOrder(keyB);
                                  if (orderA !== orderB) return orderA - orderB;
                                  return keyA.localeCompare(keyB);
                                })
                                .map(([key, value]) => {
                                  let componentType = '';
                                  let componentNumber = '';
                                  let icon = null;
                                  let bgColor = '';
                                  let textColor = '';
                                  
                                  // Get daily consumption data for this meter
                                  const meterDailyData = dailyConsumption?.[key]?.dailyData || [];
                                  
                                  // Evaluate daily consumption function
                                  const evaluateDailyConsumption = (dailyData: Array<{date: string, diffEn: number}>) => {
                                    if (!dailyData || dailyData.length === 0) return { status: 'unknown', criticalDays: 0 };
                                    
                                    let criticalDays = 0;
                                    let zeroDays = 0;
                                    let lowDays = 0;
                                    let kontrolleDays = 0;
                                    
                                    dailyData.forEach(day => {
                                      const diffEnKWh = day.diffEn / 1000; // Convert Wh to kWh
                                      if (diffEnKWh === 0) {
                                        zeroDays++;
                                        criticalDays++;
                                      } else if (diffEnKWh < 10) {
                                        kontrolleDays++;
                                      }
                                    });
                                    
                                    if (criticalDays === dailyData.length && dailyData.length >= 7) {
                                      return { status: 'critical', criticalDays, zeroDays, lowDays, kontrolleDays };
                                    } else if (criticalDays > 0) {
                                      return { status: 'critical', criticalDays, zeroDays, lowDays, kontrolleDays };
                                    } else if (kontrolleDays > 0) {
                                      return { status: 'kontrolle', criticalDays, zeroDays, lowDays, kontrolleDays };
                                    } else {
                                      return { status: 'ok', criticalDays, zeroDays, lowDays, kontrolleDays };
                                    }
                                  };
                                  
                                  const evaluation = evaluateDailyConsumption(meterDailyData);
                                  
                                  // Determine component type based on meter ID pattern
                                  if (key.match(/^Z2054\d*/)) {
                                    componentType = 'Netz';
                                    componentNumber = key === 'Z20541' ? '1' : key === 'Z20542' ? '2' : key === 'Z20543' ? '3' : key.slice(-1);
                                    icon = <ShareIcon className="h-4 w-4" />;
                                    bgColor = 'bg-blue-50';
                                    textColor = 'text-blue-700';
                                  } else if (key.match(/^Z2014\d*/)) {
                                    componentType = 'Kessel';
                                    componentNumber = key === 'Z20141' ? '1' : key === 'Z20142' ? '2' : key === 'Z20143' ? '3' : key.slice(-1);
                                    icon = <HeroFireIcon className="h-4 w-4" />;
                                    bgColor = 'bg-purple-50';
                                    textColor = 'text-purple-800';
                                  } else if (key.match(/^Z2024\d*/)) {
                                    componentType = 'Wärmepumpe';
                                    componentNumber = key === 'Z20241' ? '1' : key === 'Z20242' ? '2' : key === 'Z20243' ? '3' : key.slice(-1);
                                    icon = <Leaf className="h-4 w-4" />;
                                    bgColor = 'bg-green-50';
                                    textColor = 'text-green-700';
                                  } else if (key.match(/^Z2022\d*/)) {
                                    componentType = 'Wärmepumpe-Strom';
                                    componentNumber = key === 'Z20221' ? '1' : key.slice(-1);
                                    icon = <BoltIcon className="h-4 w-4" />;
                                    bgColor = 'bg-gray-100';
                                    textColor = 'text-black';
                                  } else {
                                    componentType = 'Sonstiges';
                                    componentNumber = '';
                                    icon = <CogIcon className="h-4 w-4" />;
                                    bgColor = 'bg-gray-50';
                                    textColor = 'text-gray-700';
                                  }
                                  
                                  // Calculate max value for bar chart scaling
                                  const maxValue = Math.max(...meterDailyData.map((d: any) => d.diffEn / 1000), 1);
                                  
                                  return (
                                    <tr key={key} className={`${bgColor} border-b border-gray-100`}>
                                      {/* Spalte 1: Komponente */}
                                      <td className="py-4 px-4">
                                        <div className="flex items-center space-x-3">
                                          <div className={textColor}>
                                            {icon}
                                          </div>
                                          <div>
                                            <div className={`font-medium ${textColor}`}>
                                              {componentType} {componentNumber}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {key}: {typeof value === 'number' ? value.toString().replace(/\./g, '') : String(value)}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      {/* Spalte 2: Tageswerte als Balkendiagramm */}
                                      <td className="py-4 px-4">
                                        <div className="flex items-end space-x-1 h-20">
                                          {Array.from({length: 7}).map((_, index) => {
                                            const dayData = meterDailyData[6 - index];
                                            const diffEnKWh = dayData ? dayData.diffEn / 1000 : 0;
                                            
                                            // Calculate bar height (minimum 4px for non-zero values)
                                            const barHeight = diffEnKWh > 0 
                                              ? Math.max(4, (diffEnKWh / maxValue) * 60) 
                                              : 0;
                                            
                                            let barColor = 'bg-gray-300';
                                            if (dayData) {
                                              if (diffEnKWh === 0) {
                                                barColor = 'bg-red-400 border border-red-600';
                                              } else if (diffEnKWh < 10) {
                                                barColor = 'bg-orange-400';
                                              } else {
                                                // Different colors for component types
                                                if (componentType === 'Netz') barColor = 'bg-blue-400';
                                                else if (componentType === 'Wärmepumpe') barColor = 'bg-green-400';
                                                else if (componentType === 'Kessel') barColor = 'bg-purple-400';
                                                else if (componentType === 'Wärmepumpe-Strom') barColor = 'bg-yellow-400';
                                                else barColor = 'bg-gray-400';
                                              }
                                            }
                                            
                                            return (
                                              <div key={index} className="flex flex-col items-center space-y-1">
                                                <div 
                                                  className={`w-7 ${barColor} rounded-t transition-all duration-200`}
                                                  style={{ height: `${barHeight}px` }}
                                                  title={dayData ? `${dayData.date}: ${Math.round(diffEnKWh)} kWh` : 'Keine Daten'}
                                                />
                                                <span className="text-xs text-gray-600 font-mono min-w-[20px] text-center">
                                                  {dayData ? Math.round(diffEnKWh) : '-'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </td>
                                      {/* Spalte 3: Bewertung */}
                                      <td className="py-4 px-4">
                                        {evaluation.status !== 'unknown' && (
                                          <div className="text-sm">
                                            {evaluation.status === 'critical' && (
                                              <div className="flex items-start space-x-2">
                                                <div className="bg-red-100 p-1 rounded">
                                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                                                </div>
                                                <span className="text-red-600 font-medium">
                                                  Kontrolle! seit {evaluation.criticalDays}x kein<br />Energiewert / Tag
                                                </span>
                                              </div>
                                            )}
                                            {evaluation.status === 'kontrolle' && (
                                              <div className="flex items-center space-x-2">
                                                <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                                                <span className="text-orange-700 font-medium">
                                                  Kontrolle! Anlage =&gt; {componentType} {componentNumber}
                                                </span>
                                              </div>
                                            )}
                                            {evaluation.status === 'ok' && (
                                              <div className="flex items-center space-x-2">
                                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                                <span className="text-gray-700 font-medium">
                                                  Normal: Alle Werte im Bereich
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>




                  <TabsContent value="ki-bewertung" className="p-6 pt-4 pl-[24px] pr-[24px] pb-[10px]">
                    {/* Netz KI-Bewertung */}
                    {selectedSystem?.meter && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 pt-[10px] pb-[10px] pl-[1px] pr-[1px]">
                        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center pl-[10px] pr-[10px]">
                          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Netz KI-Bewertung <span className="text-gray-500">(normierte Verbrauchs-Monatswerte auf Nutzfläche [ kWh/m²] )</span>
                        </h4>
                        <div className="pl-[10px] pr-[10px]">
                          <KIEnergyAnalysisNetz 
                            selectedObjectMeter={selectedSystem.meter}
                            monthlyConsumption={monthlyConsumption || {}}
                            selectedObjectId={selectedSystem.objectid}
                            timeRange="last-365-days"
                            allTimeRangeData={allTimeRangeConsumption || {
                              'last-365-days': {},
                              'last-year': {},
                              'year-before-last': {}
                            }}
                            selectedObject={selectedSystem}
                            isLoading={isLoadingMultiYear}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="objekt" className="p-0 pb-[10px]">
                    <div className="p-6">
                      <ObjektinfoContent 
                        selectedObject={selectedSystem}
                        showEditButton={false}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="service" className="p-6 pt-4 pb-[10px]">
                    {/* Service Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Service & Wartung</h3>
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start"
                          variant={selectedSystem.analysis?.critical ? "destructive" : "default"}
                          onClick={() => setIsServiceDialogOpen(true)}
                        >
                          <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                          {selectedSystem.analysis?.critical ? "Notdienst anfordern" : "Service planen"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => navigate(`/grafana-dashboards?objectID=${selectedSystem.objectid}&typ=waechter&from=network-monitor`)}
                        >
                          <ChartBarIcon className="h-4 w-4 mr-2" />
                          Grafana Dashboard öffnen
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <InformationCircleIcon className="h-4 w-4 mr-2" />
                          Technische Dokumentation
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Wartungshistorie anzeigen
                        </Button>
                      </div>
                      
                      {/* Quick Info */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Status-Übersicht</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Letzte Wartung: Nicht verfügbar</p>
                          <p>Nächste Wartung: Nicht geplant</p>
                          <p>Service-Techniker: Nicht zugewiesen</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="py-6 px-4 space-y-4 text-center">
                <div className="mb-6">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                </div>
                
                {/* Überschriften und Warnungen */}
                {temperatureAnalysis?.critical && temperatureAnalysis.critical.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-red-600 font-medium mb-1">
                      Kritische Anlagen ({temperatureAnalysis.critical.length}) Kontrolle notwendig
                    </h3>
                    <p className="text-sm text-red-600">
                      Klicken Sie links auf [kritische Anlagen]
                    </p>
                  </div>
                )}
                
                {temperatureAnalysis?.warning && temperatureAnalysis.warning.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-orange-700 font-medium mb-1">
                      Warnungen ({temperatureAnalysis.warning.length}), bitte beobachten!
                    </h3>
                  </div>
                )}
                
                {/* Allgemeine Anleitung - immer anzeigen */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Wählen Sie eine Anlage aus der Liste um detaillierte Temperaturanalyse anzuzeigen
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Service Request Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service-Anfrage erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Service-Anfrage für die ausgewählte Anlage
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createEntryMutation.mutate({
              objectId: selectedSystem.id, // Use internal ID, not objectid
              entryType: "störung",
              category: "Netzstörung",
              priority: selectedSystem.analysis?.critical ? "kritisch" : "hoch",
              title: selectedSystem.analysis?.critical ? generateCriticalTitle() : formData.get("title"),
              description: formData.get("description"),
              technicianName: (user as any)?.username || formData.get("technicianName"),
              technicianCompany: formData.get("technicianCompany"),
              scheduledDate: format(new Date(), 'yyyy-MM-dd'),
              status: "offen",
            });
          }} className="space-y-4">
            <div>
              <Label>Objekt</Label>
              <Input value={selectedSystem?.name || ""} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label>Objekt-ID</Label>
              <Input value={selectedSystem?.objectid || ""} disabled className="bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typ</Label>
                <Input value="Störung" disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Input value="Netzstörung" disabled className="bg-gray-50" />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Titel</Label>
              <Input 
                name="title" 
                defaultValue={selectedSystem?.analysis?.critical ? generateCriticalTitle() : ""}
                placeholder="Beschreibung der Störung"
                className={selectedSystem?.analysis?.critical ? "bg-red-50" : ""}
                disabled={selectedSystem?.analysis?.critical}
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea 
                name="description" 
                rows={3} 
                placeholder="Detaillierte Beschreibung der Störung..."
                defaultValue={selectedSystem?.analysis?.critical ? 
                  `KRITISCHER ZUSTAND: ${selectedSystem.analysis.sensors?.filter((s: any) => 
                    s.vl.status === 'critical' || s.rl.status === 'critical'
                  ).map((s: any) => 
                    `${s.name}: VL=${s.vl.value}°C (${s.vl.status}), RL=${s.rl.value}°C (${s.rl.status})`
                  ).join('; ')}` : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="technicianName">Techniker</Label>
                <Input 
                  name="technicianName" 
                  defaultValue={(user as any)?.username || ""}
                  placeholder="Name des Technikers" 
                />
              </div>
              <div>
                <Label htmlFor="technicianCompany">Firma</Label>
                <Input name="technicianCompany" placeholder="Firma des Technikers" />
              </div>
            </div>

            <div>
              <Label>Datum</Label>
              <Input 
                value={format(new Date(), 'dd.MM.yyyy', { locale: de })} 
                disabled 
                className="bg-gray-50" 
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                variant={selectedSystem?.analysis?.critical ? "destructive" : "default"}
                disabled={createEntryMutation.isPending}
              >
                {selectedSystem?.analysis?.critical ? "Notdienst anfordern" : "Service-Anfrage erstellen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}