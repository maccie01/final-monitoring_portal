import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ExclamationTriangleIcon,
  FireIcon,
  BuildingOfficeIcon,
  BoltIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, Search, BarChart3, Leaf, AlertTriangle, Check, WifiOff } from "lucide-react";
import ExportDialog from "@/components/ExportDialog";
import EfficiencyDistributionCard from "@/components/EfficiencyDistributionCard";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [buildingSearchTerm, setBuildingSearchTerm] = useState("");
  const [efficiencyFilter, setEfficiencyFilter] = useState("all");
  const [buildingTypeFilter, setBuildingTypeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Fetch dashboard KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["/api/dashboard/kpis"],
  });

  // Fetch all objects for portfolio table
  const { data: objects, isLoading: objectsLoading } = useQuery({
    queryKey: ["/api/objects"],
  });

  // Fetch thresholds for critical systems analysis
  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
  });

  // Fetch dashboard settings for KPI dashboard URL
  const { data: dashboardSettings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const handleObjectClick = (objectId: number, dashboardType: string = "auswertung") => {
    setLocation(`/grafana-dashboards?objectID=${objectId}&typ=diagramme&from=dashboard`)
  }

  const handleTemperatureClick = (objectId: number) => {
    setLocation(`/grafana-dashboards?objectID=${objectId}&typ=diagramme&from=dashboard`)
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }


  // Funktion zur Analyse kritischer Anlagen (exakt wie NetworkMonitor)
  const analyzeObjectTemperature = (obj: any) => {
    if (!thresholds || !Array.isArray(thresholds) || thresholds.length === 0) {
      return { offline: true, critical: false, warning: false };
    }
    
    const availableConfigs = (thresholds as any[]).map(t => t.keyName || t.key_name).filter(k => k && k.trim() && k !== 'undefined');
    
    if (!availableConfigs.includes('netzwaechter_0')) {
      return { offline: true, critical: false, warning: false };
    }
    
    // Find threshold configuration with priority order:
    // 1. objanlage.thresholds (anlagentyp-basiert)
    // 2. netzwaechter_0 (fallback)
    let objectThresholds = null;
    
    if (obj.objanlage?.thresholds) {
      const found = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === obj.objanlage.thresholds);
      if (found) {
        objectThresholds = found.value?.thresholds;
      }
    }
    
    // Fallback to default netzwaechter_0 if no object-specific config found
    const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
    const defaultThresholds = fallbackConfig?.value?.thresholds;
    const usedThresholds = objectThresholds || defaultThresholds;
    
    if (!usedThresholds) {
      return { offline: true, critical: false, warning: false };
    }
    
    // Prüfe ob Objekt offline ist (keine Temperatur-Daten oder älter als 24h)
    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { offline: true, critical: false, warning: false };
    }

    // Prüfe ob Daten älter als 24h sind
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { offline: true, critical: false, warning: false };
    }

    let critical = false;
    let warning = false;

    // Temperaturstatus-Funktion
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
      }
    });
    
    return { offline: false, critical, warning };
  };

  // Berechne echte Anzahl kritischer Anlagen und Warnungen
  const realCriticalSystemsCount = objects ? (objects as any[]).filter(obj => {
    const analysis = analyzeObjectTemperature(obj);
    return analysis.critical;
  }).length : 0;

  const warningSystemsCount = objects ? (objects as any[]).filter(obj => {
    const analysis = analyzeObjectTemperature(obj);
    return analysis.warning && !analysis.critical; // Nur Warnungen ohne kritische
  }).length : 0;

  // Berechne Energieeffizienz (Durchschnitt aller Objekte)
  const calculateEnergyEfficiency = () => {
    if (!objects || (objects as any[]).length === 0) return 0;
    const totalEfficiency = processedObjects.reduce((sum, obj) => sum + obj.efficiency, 0);
    const avgEfficiency = totalEfficiency / processedObjects.length;
    // Umrechnung in Prozent (niedrigere Werte = höhere Effizienz)
    const maxEfficiency = 250; // H-Klasse
    const efficiencyPercent = Math.max(0, Math.round(((maxEfficiency - avgEfficiency) / maxEfficiency) * 100));
    return efficiencyPercent;
  };

  // Berechne Regenerativanteil aus auswertung.20241
  const calculateRenewableShare = () => {
    if (!objects || !Array.isArray(objects) || objects.length === 0) return 0;
    
    const totalConsumption = (objects as any[]).reduce((sum, obj) => {
      return sum + (obj.auswertung?.["365"]?.["20541"] || 0);
    }, 0);
    
    const totalRenewable = (objects as any[]).reduce((sum, obj) => {
      return sum + (obj.auswertung?.["365"]?.["20241"] || 0);
    }, 0);
    
    if (totalConsumption === 0) return 0;
    return Math.round((totalRenewable / totalConsumption) * 100);
  };

  // Berechne Gesamt-Anlagen
  const totalFacilities = objects ? (objects as any[]).length : 0;
  const activeFacilities = objects ? (objects as any[]).filter(obj => {
    // Anlage ist aktiv wenn sie Temperaturdaten hat oder nicht offline ist
    const analysis = analyzeObjectTemperature(obj);
    return !analysis.offline;
  }).length : 0;

  // Effizienzklasseneinteilung nach GEG 2024
  const getEfficiencyClass = (efficiency: number) => {
    if (efficiency <= 30) return "A+";
    if (efficiency <= 50) return "A";
    if (efficiency <= 75) return "B";
    if (efficiency <= 100) return "C";
    if (efficiency <= 130) return "D";
    if (efficiency <= 160) return "E";
    if (efficiency <= 200) return "F";
    if (efficiency <= 250) return "G";
    return "H";
  };

  const getEfficiencyClassColor = (effClass: string) => {
    const colors = {
      "A+": "bg-green-600 text-white",
      "A": "bg-green-500 text-white",
      "B": "bg-lime-400 text-black",
      "C": "bg-yellow-400 text-black",
      "D": "bg-orange-400 text-white",
      "E": "bg-orange-500 text-white",
      "F": "bg-red-500 text-white",
      "G": "bg-red-600 text-white",
      "H": "bg-red-800 text-white"
    };
    return colors[effClass as keyof typeof colors] || "bg-gray-400 text-white";
  };

  // Hilfsfunktion: Hex-Farbe für Effizienzklasse (für PieChart)
  const getEfficiencyClassHexColor = (effClass: string) => {
    const hexColors = {
      "A+": "#22c55e",
      "A": "#84cc16",
      "B": "#eab308",
      "C": "#f59e0b",
      "D": "#fb923c",
      "E": "#f97316",
      "F": "#ef4444",
      "G": "#dc2626",
      "H": "#991b1b"
    };
    return hexColors[effClass as keyof typeof hexColors] || "#9ca3af";
  };



  // Effizienz-Daten von API laden (wie EfficiencyAnalysis)
  const { data: efficiencyData } = useQuery({
    queryKey: ['dashboard-efficiency-data', (objects as any[])?.map((obj: any) => obj.objectid)],
    queryFn: async () => {
      const objectsArray = objects as any[];
      if (!objectsArray || objectsArray.length === 0) return {};

      console.log(`🔄 Dashboard: Loading efficiency data for ${objectsArray.length} objects...`);
      const results: { [objectId: string]: any } = {};

      // Alle Objekte parallel laden
      const allPromises = objectsArray.map(async (obj: any) => {
        try {
          const response = await fetch(`/api/test-efficiency-analysis/${obj.objectid}?timeRange=last-year&resolution=monthly`);
          if (response.ok) {
            const data = await response.json();
            return { objectId: obj.objectid, data };
          }
          return null;
        } catch (error) {
          console.error(`❌ Dashboard: Error loading efficiency for object ${obj.objectid}:`, error);
          return null;
        }
      });
      
      const allResults = await Promise.all(allPromises);
      allResults.forEach((result: any) => {
        if (result) {
          results[result.objectId] = result.data;
        }
      });
      
      console.log(`✅ Dashboard: Loaded efficiency data for ${Object.keys(results).length} objects`);
      return results;
    },
    enabled: !!objects && (objects as any).length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Objektdaten verarbeiten mit API-Daten (nur API-Daten verwenden, KEIN Fallback)
  const processedObjects = (objects as any[])?.map((obj: any) => {
    const efficiencyApiData = efficiencyData?.[obj.objectid];
    
    // NUR API-Daten verwenden! Wenn keine API-Daten: Objekt überspringen
    if (!efficiencyApiData?.yearly) {
      return null; // Objekt hat keine API-Daten, wird herausgefiltert
    }
    
    const consumption = Math.round(efficiencyApiData.yearly.totalKwh || 0);
    const renewable = obj.auswertung?.["365"]?.["20241"] || 0;
    const area = parseFloat(obj.objdata?.area || obj.objdata?.nutzflaeche || '0');
    const efficiency = Math.round(efficiencyApiData.yearly.efficiencyPerM2 || 0);
    const efficiencyClass = getEfficiencyClass(efficiency);
    const renewableShare = consumption > 0 ? Math.round((renewable / consumption) * 100) : 0;
    
    // Netz-Temperaturen aus rltemp und vltemp (Z20541, Z20542, Z20543)
    const getNetworkTemperatures = () => {
      const rlData = obj.rttemp || {};
      const vlData = obj.fltemp || {};
      
      // Prüfe verfügbare Netz-Sensoren
      const networkSensors = ['Z20541', 'Z20542', 'Z20543', '20541', '20542', '20543'];
      let rlTemp = null;
      let vlTemp = null;
      let sensorId = null;
      
      for (const sensor of networkSensors) {
        if (rlData[sensor] !== undefined && vlData[sensor] !== undefined) {
          rlTemp = rlData[sensor];
          vlTemp = vlData[sensor];
          sensorId = sensor;
          break; // Ersten verfügbaren Sensor verwenden
        }
      }
      
      return { rlTemp, vlTemp, sensorId };
    };
    
    const { rlTemp, vlTemp, sensorId } = getNetworkTemperatures();
    
    return {
      ...obj,
      consumption,
      renewable,
      renewableShare,
      area,
      efficiency,
      efficiencyClass,
      rlTemp,
      vlTemp,
      sensorId,
      buildingType: obj.objdata?.buildingType || obj.objdata?.typ || 'Unbekannt'
    };
  }).filter((obj: any) => obj !== null) || []; // Filtere Objekte ohne API-Daten heraus

  // Verfügbare Gebäudetypen aus den Daten extrahieren
  const availableBuildingTypes = Array.from(new Set(processedObjects.map((obj: any) => obj.objanlage?.Typ))).filter(type => type && type !== 'Unbekannt').sort();

  const filteredObjects = processedObjects.filter((obj: any) => {
    const matchesSearch = obj.name.toLowerCase().includes(buildingSearchTerm.toLowerCase());
    
    let matchesEfficiency;
    if (efficiencyFilter === "all") {
      matchesEfficiency = true;
    } else if (efficiencyFilter === "A+-C") {
      matchesEfficiency = ['A+', 'A', 'B', 'C'].includes(obj.efficiencyClass);
    } else if (efficiencyFilter === "D-H") {
      matchesEfficiency = ['D', 'E', 'F', 'G', 'H'].includes(obj.efficiencyClass);
    } else {
      matchesEfficiency = obj.efficiencyClass === efficiencyFilter;
    }
    
    const matchesBuildingType = buildingTypeFilter === "all" || obj.objanlage?.Typ === buildingTypeFilter;
    return matchesSearch && matchesEfficiency && matchesBuildingType;
  }).sort((a: any, b: any) => {
    // Spaltensortierung hat Vorrang
    if (sortConfig) {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          // Alphabetische Sortierung nach Name
          return sortConfig.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'area':
          aValue = a.objdata?.area || 0;
          bValue = b.objdata?.area || 0;
          break;
        case 'efficiencyClass':
          // Sortierung nach Effizienz-Wert (numerisch)
          aValue = a.efficiency;
          bValue = b.efficiency;
          break;
        case 'renewableShare':
          aValue = a.renewableShare || 0;
          bValue = b.renewableShare || 0;
          break;
        case 'vlTemp':
          aValue = a.vlTemp !== null ? a.vlTemp : -999;
          bValue = b.vlTemp !== null ? b.vlTemp : -999;
          break;
        case 'rlTemp':
          aValue = a.rlTemp !== null ? a.rlTemp : -999;
          bValue = b.rlTemp !== null ? b.rlTemp : -999;
          break;
        case 'status':
          // Status-Sortierung: kritisch > warnung > normal
          const aAnalysisSort = analyzeObjectTemperature(a);
          const bAnalysisSort = analyzeObjectTemperature(b);
          if (aAnalysisSort.critical && !bAnalysisSort.critical) return sortConfig.direction === 'asc' ? -1 : 1;
          if (!aAnalysisSort.critical && bAnalysisSort.critical) return sortConfig.direction === 'asc' ? 1 : -1;
          if (aAnalysisSort.warning && !bAnalysisSort.warning) return sortConfig.direction === 'asc' ? -1 : 1;
          if (!aAnalysisSort.warning && bAnalysisSort.warning) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        default:
          aValue = 0;
          bValue = 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    
    // Fallback: Kritische Objekte zuerst
    const aAnalysis = analyzeObjectTemperature(a);
    const bAnalysis = analyzeObjectTemperature(b);
    
    // 1. Kritische Objekte zuerst
    if (aAnalysis.critical && !bAnalysis.critical) return -1;
    if (!aAnalysis.critical && bAnalysis.critical) return 1;
    
    // 2. Warnungen nach kritischen
    if (aAnalysis.warning && !bAnalysis.warning) return -1;
    if (!aAnalysis.warning && bAnalysis.warning) return 1;
    
    // 3. Alphabetisch nach Name
    return a.name.localeCompare(b.name);
  });

  // Temperatur-Status und Styling-Funktion
  const getTemperatureStyle = (temp: number, type: 'rl' | 'vl', obj: any) => {
    if (!thresholds || temp === null) return { textClass: 'text-gray-80', bgClass: '' };
    
    // Threshold-Konfiguration finden
    let usedThresholds = null;
    if (obj.objanlage?.thresholds) {
      const found = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === obj.objanlage.thresholds);
      if (found) {
        usedThresholds = found.value?.thresholds;
      }
    }
    
    // Fallback zu netzwaechter_0
    if (!usedThresholds) {
      const fallbackConfig = (thresholds as any[]).find((t: any) => (t.keyName || t.key_name) === 'netzwaechter_0');
      usedThresholds = fallbackConfig?.value?.thresholds;
    }
    
    if (!usedThresholds) return { textClass: 'text-gray-80', bgClass: '' };
    
    if (type === 'rl') {
      // RL (blau): Kritisch wenn > kritisch, Warnung wenn > warnung
      if (temp > usedThresholds.critical.rlValue) {
        return { textClass: 'text-blue-600', bgClass: 'bg-red-100' }; // Kritisch: hellroter Hintergrund
      } else if (temp > usedThresholds.warning.rlValue) {
        return { textClass: 'text-blue-600', bgClass: 'bg-orange-100' }; // Warnung: oranger Hintergrund
      } else {
        return { textClass: 'text-blue-600', bgClass: '' }; // Normal: nur blaue Schrift
      }
    } else {
      // VL (rot): Kritisch wenn < kritisch
      if (temp < usedThresholds.critical.vlValue) {
        return { textClass: 'text-blue-600', bgClass: 'bg-red-100' }; // Kritisch: blaue Schrift auf hellrotem Hintergrund
      } else if (temp < usedThresholds.warning.vlValue) {
        return { textClass: 'text-red-600', bgClass: 'bg-orange-100' }; // Warnung: rote Schrift auf orangem Hintergrund
      } else {
        return { textClass: 'text-red-600', bgClass: '' }; // Normal: nur rote Schrift
      }
    }
  };

  if (kpisLoading || objectsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="h-3 bg-gray-20 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-20 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-20 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Extract KPI-Dashboard URL from settings
  const kpiDashboardUrl = Array.isArray(dashboardSettings) 
    ? dashboardSettings.find((setting: any) => 
        setting.key_name === 'kpi_dashboard_url' || setting.keyName === 'kpi_dashboard_url'
      )?.value 
    : undefined;

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* External KPI Dashboard */}
      {kpiDashboardUrl && (
        <Card className="mb-6">
          <CardHeader className="pt-3 pb-2">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              KPI Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-96 md:h-[500px] lg:h-[600px] border rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={kpiDashboardUrl}
                className="w-full h-full border-0 bg-white"
                title="KPI Dashboard"
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                allowFullScreen
                data-testid="iframe-kpi-dashboard"
              />
            </div>
          </CardContent>
        </Card>
      )}
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation('/maps?filter=critical')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-50">Kritische Anlagen</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold text-red-600">
                    {realCriticalSystemsCount}
                  </p>
                  {warningSystemsCount > 0 && (
                    <p className="text-sm font-medium text-orange-700 ml-1">
                      ({warningSystemsCount})
                    </p>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-error" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-blue-600 font-medium">→ Zur Karte</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-50">Energieeffizienz</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {calculateEnergyEfficiency()}%
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <BoltIcon className="h-4 w-4 text-warning" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <ArrowUpIcon className="h-3 w-3 text-warning mr-1" />
              <span className="text-warning font-medium">+5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-50">Regenerativanteil</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {calculateRenewableShare()}%
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <Leaf className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-success font-medium">Ziel: 50%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-50">Gesamt Anlagen</p>
                <p className="text-2xl font-bold text-gray-80 mt-1">
                  {totalFacilities}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-success font-medium">Aktiv: {activeFacilities}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 2-spaltiges Grid: Verbrauchsverteilung & Portfolio Tabelle */}
      {processedObjects && processedObjects.length > 0 && (
        <div className="flex gap-6 mt-6 flex-1 min-h-0">
          {/* Verbrauchsverteilung nach Effizienzklassen - Links */}
          <div className="max-w-[300px] min-w-[250px] flex flex-col">
            <EfficiencyDistributionCard 
              objects={processedObjects.map(obj => ({
                objectId: obj.objectid,
                name: obj.name,
                address: obj.address || '',
                area: obj.area,
                verbrauch: obj.consumption,
                efficiencyPerM2: obj.efficiency,
                efficiencyClass: obj.efficiencyClass,
                color: getEfficiencyClassHexColor(obj.efficiencyClass)
              }))}
              timeRange="last-year"
            />
          </div>

          {/* Portfolio Objekte Tabelle - Rechts */}
          <Card className="flex-1 flex flex-col min-h-0 pl-[14px] pr-[14px]">
        <CardHeader className="pt-[10px] pb-[10px]">
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio Objekte</CardTitle>
            <div className="flex items-center space-x-3">
              <ExportDialog 
                data={filteredObjects || []}
                filename="portfolio-objekte"
                title="Portfolio-Daten exportieren"
                userEmail={(user as any)?.email}
                filterInfo={{
                  efficiencyFilter,
                  buildingTypeFilter,
                  searchTerm: buildingSearchTerm
                }}
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                <Input
                  placeholder="Gebäude suchen..."
                  className="pl-10"
                  value={buildingSearchTerm}
                  onChange={(e) => setBuildingSearchTerm(e.target.value)}
                  data-testid="input-building-search"
                />
              </div>
              <Select value={efficiencyFilter} onValueChange={setEfficiencyFilter}>
                <SelectTrigger className="w-48" data-testid="select-efficiency-filter">
                  <SelectValue placeholder="Effizienzklasse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Klassen</SelectItem>
                  <SelectItem value="A+-C">A+ bis C</SelectItem>
                  <SelectItem value="D-H">D bis H</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="H">H</SelectItem>
                </SelectContent>
              </Select>
              <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
                <SelectTrigger className="w-48" data-testid="select-building-type-filter">
                  <SelectValue placeholder="Gebäudetyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {availableBuildingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Fixed Table Header */}
            <div className="bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <div className="grid gap-0 h-10 items-center border-b px-3" style={{ gridTemplateColumns: '1fr 120px 160px 140px 140px 90px 90px 60px' }}>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Objekt</span>
                    {sortConfig?.key === 'name' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-blue-900 dark:text-blue-100 font-medium text-right">
                  Info/Potential
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('area')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Fläche (Nutzeinheiten)</span>
                    {sortConfig?.key === 'area' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('efficiencyClass')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Effizienzklasse</span>
                    {sortConfig?.key === 'efficiencyClass' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('renewableShare')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Regenerativanteil</span>
                    {sortConfig?.key === 'renewableShare' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('vlTemp')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>VL-Temp</span>
                    {sortConfig?.key === 'vlTemp' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('rlTemp')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>RL-Temp</span>
                    {sortConfig?.key === 'rlTemp' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
                <div className="text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium text-right" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Status</span>
                    {sortConfig?.key === 'status' ? (
                      sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                    ) : (
                      <ArrowUpDownIcon className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scrollable Table Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {processedObjects.length > 0 ? filteredObjects.map((obj: any) => (
                <div key={obj.id} className="grid gap-0 h-10 items-center hover:bg-gray-5 border-b border-gray-200 px-3" style={{ gridTemplateColumns: '1fr 120px 160px 140px 140px 90px 90px 60px' }} data-testid={`row-object-${obj.id}`}>
                  <div className="py-1 font-medium text-gray-80 text-sm" data-testid={`text-object-name-${obj.id}`}>
                    {obj.name}
                  </div>
                  <div className="py-1 text-gray-80 text-right text-[12px]" data-testid={`text-info-potential-${obj.id}`}>
                    {obj.kianalyse?.info || "-"}
                  </div>
                  <div className="py-1 text-gray-80 text-right text-[12px]" data-testid={`text-area-${obj.id}`}>
                    {obj.objdata?.area > 0 ? (
                      <>
                        {obj.objdata.area.toLocaleString('de-DE')} m²
                        {obj.objdata?.NE ? ` (${obj.objdata.NE})` : ''}
                      </>
                    ) : "-"}
                  </div>
                  <div className="py-1 text-right" data-testid={`text-efficiency-class-${obj.id}`}>
                    {obj.efficiency > 0 ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-gray-80 text-sm">{obj.efficiency} kWh/m²</span>
                        <Badge 
                          className={`${getEfficiencyClassColor(obj.efficiencyClass)} px-1.5 py-0.5 text-xs font-medium`}
                          data-testid={`badge-efficiency-class-${obj.id}`}
                        >
                          {obj.efficiencyClass}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-50 text-sm">-</span>
                    )}
                  </div>
                  <div className="py-1 text-gray-80 text-right" data-testid={`text-renewable-${obj.id}`}>
                    {obj.renewable > 0 ? (
                      <div className="flex items-center justify-end">
                        <span className="text-green-600 font-medium text-sm">{obj.renewableShare}%</span>
                        <span className="text-xs text-gray-50 ml-1">
                          ({Math.round(obj.renewable / 1000).toLocaleString('de-DE')} kWh)
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-50 text-sm">0%</span>
                    )}
                  </div>
                  <div className="py-1 text-right" data-testid={`text-vl-temp-${obj.id}`}>
                    {obj.vlTemp !== null ? (
                      <span 
                        onClick={() => handleTemperatureClick(obj.objectid)}
                        className={`font-mono px-1.5 py-0.5 text-xs hover:opacity-80 cursor-pointer transition-opacity ${getTemperatureStyle(obj.vlTemp, 'vl', obj).textClass} ${getTemperatureStyle(obj.vlTemp, 'vl', obj).bgClass}`}
                        title={`Zum Netzwächter für ${obj.name}`}
                      >
                        {obj.vlTemp}°C
                      </span>
                    ) : (
                      <span className="text-gray-50 text-sm">-</span>
                    )}
                  </div>
                  <div className="py-1 text-right" data-testid={`text-rl-temp-${obj.id}`}>
                    {obj.rlTemp !== null ? (
                      <span 
                        onClick={() => handleTemperatureClick(obj.objectid)}
                        className={`font-mono px-1.5 py-0.5 text-xs hover:opacity-80 cursor-pointer transition-opacity ${getTemperatureStyle(obj.rlTemp, 'rl', obj).textClass} ${getTemperatureStyle(obj.rlTemp, 'rl', obj).bgClass}`}
                        title={`Zum Netzwächter für ${obj.name}`}
                      >
                        {obj.rlTemp}°C
                      </span>
                    ) : (
                      <span className="text-gray-50 text-sm">-</span>
                    )}
                  </div>
                  <div className="py-1 text-right" data-testid={`status-${obj.id}`}>
                    {(() => {
                      const analysis = analyzeObjectTemperature(obj);
                      return (
                        <div className="flex items-center justify-end">
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
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )) : (
                <div className="grid grid-cols-7 gap-0 py-4">
                  <div className="col-span-7 text-center text-gray-50 text-sm" data-testid="text-no-objects">
                    {buildingSearchTerm || efficiencyFilter !== "all" 
                      ? "Keine Objekte entsprechen den Filterkriterien"
                      : "Keine Objekte verfügbar"
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
}
