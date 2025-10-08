import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, AlertTriangle, XCircle, CheckCircle2, Search, Brain, Menu, X, Building2, Printer } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Link } from "wouter";
import TemperatureEfficiencyChart from "@/components/TemperatureEfficiencyChart";
import EfficiencyDistributionCard from "@/components/EfficiencyDistributionCard";

interface ObjectEfficiency {
  objectId: number;
  name: string;
  address: string;
  area: number;
  verbrauch: number;
  efficiencyPerM2: number;
  efficiencyClass: string;
  color: string;
}

const getEfficiencyClass = (value: number) => {
  if (value <= 30) return { class: "A+", color: "#22c55e" };
  if (value <= 50) return { class: "A", color: "#84cc16" };
  if (value <= 75) return { class: "B", color: "#eab308" };
  if (value <= 100) return { class: "C", color: "#f59e0b" };
  if (value <= 130) return { class: "D", color: "#ef4444" };
  if (value <= 160) return { class: "E", color: "#dc2626" };
  return { class: "F", color: "#991b1b" };
};

// TimeRange Label Funktion
const getTimeRangeLabel = (timeRange: string) => {
  switch (timeRange) {
    case 'last-year': return '2024';
    case 'last-2year': return '2023';
    case 'last-365-days': return '365Tage';
    default: return timeRange;
  }
};

export default function EfficiencyAnalysis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedObject, setSelectedObject] = useState<ObjectEfficiency | null>(null);
  const [timeRange, setTimeRange] = useState<"last-year" | "last-365-days" | "last-2year">("last-year");
  const [portfolioTimeRange, setPortfolioTimeRange] = useState<"last-year" | "last-365-days" | "last-2year">("last-year"); // Standard: letztes Jahr
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [showObjectList, setShowObjectList] = useState(true); // Objektliste immer sichtbar
  const [showPortfolioStartView, setShowPortfolioStartView] = useState(false); // Portfolio Start-Tabelle
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedObjects, setLoadedObjects] = useState(0);

  // Druckfunktion für Portfolio
  const handlePrintPortfolio = () => {
    const allObjects = [...criticalObjects, ...warningObjects, ...optimizedObjects]
      .filter(obj => obj.efficiencyPerM2 && obj.efficiencyPerM2 > 0)
      .sort((a, b) => (b.efficiencyPerM2 || 0) - (a.efficiencyPerM2 || 0));

    // Gruppiere nach Effizienzklassen
    const groupedByClass = allObjects.reduce((groups, obj) => {
      const className = obj.efficiencyClass;
      if (!groups[className]) {
        groups[className] = [];
      }
      groups[className].push(obj);
      return groups;
    }, {} as { [key: string]: typeof allObjects });

    const classOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
    const sortedClasses = classOrder.filter(cls => groupedByClass[cls]);

    const totalAllVerbrauch = allObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
    const totalAllArea = allObjects.reduce((sum, obj) => sum + (obj.area || 0), 0);
    
    const formatNumber = (num: number) => num.toLocaleString('de-DE');

    let tableRows = '';
    
    sortedClasses.forEach(className => {
      const classObjects = groupedByClass[className];
      const totalVerbrauch = classObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
      const avgEfficiency = classObjects.reduce((sum, obj) => sum + (obj.efficiencyPerM2 || 0), 0) / classObjects.length;
      const classArea = classObjects.reduce((sum, obj) => sum + (obj.area || 0), 0);
      const areaPercentage = totalAllArea > 0 ? (classArea / totalAllArea * 100) : 0;
      const verbrauchPercentage = totalAllVerbrauch > 0 ? (totalVerbrauch / totalAllVerbrauch * 100) : 0;
      const firstObj = classObjects[0];

      // Summenzeile für Klasse
      tableRows += `
        <tr class="summary-row" style="background-color: ${firstObj.color}30;">
          <td style="font-weight: bold; font-size: 14px;"><span style="font-weight: normal;">∑</span> Summe Klasse (${className})</td>
          <td style="text-align: right; font-weight: bold; font-size: 14px;">∅ ${Math.round(avgEfficiency)} <span class="efficiency-badge" style="background-color: ${firstObj.color};">${className}</span></td>
          <td style="text-align: right; font-weight: bold; font-size: 14px;"><span style="font-weight: normal;">∑</span> ${formatNumber(classArea)} m² (${Math.round(areaPercentage)}%)</td>
          <td style="text-align: right; font-weight: bold; font-size: 14px;"><span style="font-weight: normal;">∑</span> ${formatNumber(totalVerbrauch)} kWh (${Math.round(verbrauchPercentage)}%)</td>
        </tr>
      `;

      // Objekte der Klasse
      classObjects.forEach(obj => {
        tableRows += `
          <tr class="object-row" style="background-color: ${obj.color}15;">
            <td style="padding-left: 20px; font-size: 13px;">${obj.name}</td>
            <td style="text-align: right; font-size: 13px;">${obj.efficiencyPerM2} <span class="efficiency-badge" style="background-color: ${obj.color};">${obj.efficiencyClass}</span></td>
            <td style="text-align: right; font-size: 13px;">${obj.area ? formatNumber(obj.area) : 'N/A'} m²</td>
            <td style="text-align: right; font-size: 13px;">${obj.verbrauch ? formatNumber(obj.verbrauch) + ' kWh' : 'N/A'}</td>
          </tr>
        `;
      });
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Portfolio Objekte - Effizienzanalyse</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #374151;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 20px; 
            }
            h1 { 
              color: #1f2937; 
              margin: 0 0 10px 0; 
              font-size: 24px;
            }
            .subtitle { 
              color: #6b7280; 
              font-size: 14px; 
              margin: 0;
            }
            .summary { 
              background-color: #dbeafe; 
              border: 1px solid #93c5fd; 
              border-radius: 8px; 
              padding: 15px; 
              margin-bottom: 25px;
              text-align: center;
            }
            .summary-text { 
              color: #1e40af; 
              font-weight: bold; 
              font-size: 16px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th { 
              background-color: #f9fafb; 
              color: #374151;
              font-weight: 600; 
              padding: 12px 8px;
              border: 1px solid #d1d5db; 
              text-align: left;
              font-size: 15px;
            }
            td { 
              padding: 10px 8px; 
              border: 1px solid #e5e7eb; 
            }
            .summary-row { 
              font-weight: bold; 
            }
            .object-row { 
              background-color: #ffffff; 
            }
            .efficiency-badge { 
              display: inline-block; 
              padding: 2px 6px; 
              border-radius: 12px; 
              color: white; 
              font-size: 9px; 
              font-weight: bold;
              margin-left: 5px;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            @media print { 
              body { margin: 15px; }
              .header { page-break-after: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              .summary-row { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Portfolio Objekte</h1>
            <p class="subtitle">Effizienzanalyse sortiert nach kWh/m² der letzten 365 Tage</p>
          </div>
          
          <div class="summary">
            <div class="summary-text">
              Gesamtverbrauch vom Portfolio (${formatNumber(totalAllArea)} m²): ${formatNumber(totalAllVerbrauch)} kWh
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Objekt. / Effizienzwert</th>
                <th style="width: 110px; text-align: right; white-space: nowrap;">kWh/m² (365T)</th>
                <th style="width: 20%; text-align: right;">Nutzfläche m²</th>
                <th style="width: 25%; text-align: right;">Verbrauch</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} | Effizienz-Analyse System
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
  
  const queryClient = useQueryClient();

  const [criticalObjects, setCriticalObjects] = useState<ObjectEfficiency[]>([]);
  const [warningObjects, setWarningObjects] = useState<ObjectEfficiency[]>([]);
  const [optimizedObjects, setOptimizedObjects] = useState<ObjectEfficiency[]>([]);

  // Fetch all objects first - show UI immediately
  const { data: objects = [], isLoading: objectsLoading } = useQuery<any[]>({
    queryKey: ['/api/objects'],
    staleTime: 5 * 60 * 1000,
  });

  // Query für InfoText aus den Settings  
  const { data: infoTextData } = useQuery({
    queryKey: ['/api/settings', 'system'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings?category=system');
        const data = await response.json();
        const klassifizierungInfo = data.find((setting: any) => setting.key_name === 'Klassifizierung_Info');
        
        if (!klassifizierungInfo?.value) {
          return 'Text-info';
        }
        
        const value = klassifizierungInfo.value;
        
        // Forciere String-Konvertierung für alle Fälle
        let result = '';
        
        if (value && typeof value === 'object') {
          // Objekt: nimm InfoText Property
          result = value.InfoText || JSON.stringify(value);
        } else if (typeof value === 'string') {
          // String: versuche JSON zu parsen
          try {
            const parsed = JSON.parse(value);
            result = parsed?.InfoText || value;
          } catch {
            result = value;
          }
        } else {
          // Alles andere zu String
          result = String(value);
        }
        
        // Finale String-Konvertierung
        return String(result);
      } catch (error) {
        console.error('Error loading InfoText:', error);
        return 'Text-info';
      }
    }
  });

  // Fetch efficiency data for all objects individually - deferred loading
  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['efficiency-data-all', objects.map((obj: any) => obj.objectid), portfolioTimeRange],
    queryFn: async () => {
      if (!objects || objects.length === 0) return {};
      
      console.log(`🔄 Loading efficiency data for ${objects.length} objects...`);
      const results: { [objectId: string]: any } = {};
      
      // Process ALL objects simultaneously for maximum speed
      console.log(`🚀 Loading efficiency data for ${objects.length} objects simultaneously...`);
      
      // Reset progress
      setLoadingProgress(0);
      setLoadedObjects(0);

      const allPromises = objects.map(async (obj: any, index: number) => {
        try {
          const response = await fetch(`/api/test-efficiency-analysis/${obj.objectid}?timeRange=${portfolioTimeRange}&resolution=monthly`);
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Object ${obj.objectid}: ${data.yearly?.efficiencyPerM2 || 'N/A'} kWh/m²`);
            
            // Update progress
            const newLoadedCount = index + 1;
            const progress = Math.round((newLoadedCount / objects.length) * 100);
            setLoadedObjects(newLoadedCount);
            setLoadingProgress(progress);
            
            return { objectId: obj.objectid, data };
          } else {
            console.log(`⚠️ Object ${obj.objectid}: No data available`);
            
            // Update progress even for failed requests
            const newLoadedCount = index + 1;
            const progress = Math.round((newLoadedCount / objects.length) * 100);
            setLoadedObjects(newLoadedCount);
            setLoadingProgress(progress);
            
            return null;
          }
        } catch (error) {
          console.error(`❌ Error loading efficiency for object ${obj.objectid}:`, error);
          
          // Update progress even for failed requests
          const newLoadedCount = index + 1;
          const progress = Math.round((newLoadedCount / objects.length) * 100);
          setLoadedObjects(newLoadedCount);
          setLoadingProgress(progress);
          
          return null;
        }
      });
      
      // Load ALL simultaneously - much faster!
      const allResults = await Promise.all(allPromises);
      allResults.forEach((result: any) => {
        if (result) {
          results[result.objectId] = result.data;
        }
      });
      
      console.log(`🏁 Loaded efficiency data for ${Object.keys(results).length} objects in parallel!`);
      return results;
    },
    enabled: !!objects && objects.length > 0,
    staleTime: 30 * 1000, // Cache nur 30 Sekunden für dynamische Updates
    retry: 1,
    refetchOnMount: true, // Immer neu laden für aktuellste Daten
    refetchOnWindowFocus: false,
  });

  // Initialize with first category expanded - no dependencies to avoid loops
  useEffect(() => {
    setExpandedCategories(new Set());
  }, []);

  // Process efficiency data once when both objects and efficiency data are available
  useEffect(() => {
    if (!objects || !efficiencyData) {
      setCriticalObjects([]);
      setWarningObjects([]);
      setOptimizedObjects([]);
      return;
    }

    const objectsWithEfficiency: ObjectEfficiency[] = (objects as any[])
      .map((obj: any) => {
        const efficiency = efficiencyData[obj.objectid];
        if (!efficiency?.yearly) return null;

        const efficiencyPerM2 = efficiency.yearly.efficiencyPerM2 || 0;
        const effClass = getEfficiencyClass(efficiencyPerM2);
        
        // Extract address properly - handle both string and object formats
        let addressText = 'Keine Adresse';
        if (typeof obj.objdata?.strasse === 'string') {
          addressText = obj.objdata.strasse;
        } else if (typeof obj.objdata?.adresse === 'string') {
          addressText = obj.objdata.adresse;
        } else if (obj.objdata?.adresse?.street) {
          addressText = obj.objdata.adresse.street;
        }
        
        return {
          objectId: obj.objectid,
          name: obj.name || `Objekt ${obj.objectid}`,
          address: addressText,
          area: parseFloat(obj.objdata?.area || obj.objdata?.nutzflaeche || '0'),
          verbrauch: Math.round(efficiency.yearly.totalKwh || 0),
          efficiencyPerM2: Math.round(efficiencyPerM2),
          efficiencyClass: effClass.class,
          color: effClass.color,
        };
      })
      .filter((obj: ObjectEfficiency | null): obj is ObjectEfficiency => obj !== null);

    // Kategorisiere Objekte
    const critical = objectsWithEfficiency
      .filter(obj => obj.efficiencyClass === 'D' || obj.efficiencyClass === 'E' || obj.efficiencyClass === 'F')
      .sort((a, b) => b.efficiencyPerM2 - a.efficiencyPerM2);
    
    const warning = objectsWithEfficiency
      .filter(obj => obj.efficiencyClass === 'C')
      .sort((a, b) => b.efficiencyPerM2 - a.efficiencyPerM2);
    
    const optimized = objectsWithEfficiency
      .filter(obj => obj.efficiencyClass === 'A+' || obj.efficiencyClass === 'A' || obj.efficiencyClass === 'B')
      .sort((a, b) => b.efficiencyPerM2 - a.efficiencyPerM2);

    setCriticalObjects(critical);
    setWarningObjects(warning);
    setOptimizedObjects(optimized);
  }, [objects, efficiencyData, portfolioTimeRange]);

  // Automatisch Portfolio-Ansicht anzeigen nach dem Laden
  useEffect(() => {
    if (!efficiencyLoading && objects && objects.length > 0) {
      setShowPortfolioStartView(true);
    }
  }, [efficiencyLoading, objects?.length]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      // Wenn die geklickte Kategorie bereits offen ist, schließe sie
      if (prev.has(categoryId)) {
        return new Set<string>();
      } else {
        // Wenn sie geschlossen ist, öffne nur diese und schließe alle anderen
        return new Set([categoryId]);
      }
    });
  };

  const handleObjectClick = (obj: ObjectEfficiency) => {
    setSelectedObject(obj);
    setShowPortfolioStartView(false);
  };

  const CategoryTable = ({ 
    title, 
    objects, 
    categoryId, 
    icon, 
    bgColor, 
    borderColor,
    badgeColor 
  }: {
    title: string;
    objects: ObjectEfficiency[];
    categoryId: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    badgeColor: string;
  }) => {
    const isExpanded = expandedCategories.has(categoryId);
    const filteredObjects = objects.filter(obj =>
      obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (obj.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.objectId.toString().includes(searchTerm)
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-[6px] mb-[6px] pl-[10px] pr-[10px] pt-[5px] pb-[5px]">
        <div 
          className="cursor-pointer hover:bg-opacity-80 pt-[0px] pb-[0px]"
          onClick={() => toggleCategory(categoryId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
              {icon}
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-xs opacity-75">
                  {categoryId === 'kritische' && 'Klasse D-F'}
                  {categoryId === 'warnungen' && 'Klasse C'}
                  {categoryId === 'optimiert' && 'Klasse A+, A, B'}
                </p>
              </div>
            </div>
            <Badge className={badgeColor}>
              {efficiencyLoading || !isDataLoaded || objectsLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              ) : (
                objects?.length || 0
              )}
            </Badge>
          </div>
        </div>
        {isExpanded && (
          <div className="pt-0 px-2 bg-white pl-[0px] pr-[0px]">
            {/* Tabellenkopf außerhalb des Scrollbereichs */}
            <div className="w-full text-xs border-b border-gray-200 bg-white">
              <div className="flex w-full py-2 px-1 font-medium text-gray-600">
                <div className="text-left flex-1">Objekt</div>
                <div className="text-right whitespace-nowrap min-w-[100px]">Effizienzwert ({getTimeRangeLabel(portfolioTimeRange)})</div>
              </div>
            </div>
            
            {/* Scrollbereich nur für Tabelleninhalt */}
            <div className={`bg-white ${filteredObjects.length > 10 ? 'overflow-auto' : 'overflow-hidden'}`} style={filteredObjects.length > 10 ? { maxHeight: '400px' } : {}}>
              <div className="w-full text-xs">
                {filteredObjects.map((obj, index) => (
                  <div 
                    key={obj.objectId}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => handleObjectClick(obj)}
                  >
                    <div className="flex items-center justify-between w-full">
                      {/* Horizontaler Balken mit Objekt-Info */}
                      <div 
                        className={`relative flex items-center justify-between w-full h-7 px-3 ${
                          selectedObject?.objectId === obj.objectId ? (obj.efficiencyClass === 'C' ? 'border-2 border-orange-600' : 'border-2 border-green-500') : ''
                        }`}
                        style={{ backgroundColor: `${obj.color}20` }}
                      >
                        {/* Hintergrund-Balken */}
                        <div 
                          className="absolute left-0 top-0 h-full transition-all duration-300 opacity-30"
                          style={{ 
                            width: `${Math.min(Math.max(obj.efficiencyPerM2 / 160 * 100, 10), 100)}%`,
                            backgroundColor: obj.color 
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-sm font-medium text-gray-900">{obj.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">
                              {obj.efficiencyPerM2}
                            </span>
                            <Badge 
                              style={{ 
                                backgroundColor: obj.color,
                                color: 'white',
                                border: 'none'
                              }}
                              className="text-[8px] font-bold px-1.5 py-0 min-w-[16px] h-4 rounded-full"
                            >
                              {obj.efficiencyClass}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 flex gap-4 p-4">
      {/* Toggle Button - nur wenn Liste ausgeblendet */}
      {!showObjectList && (
        <div className="flex flex-col">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowObjectList(!showObjectList)}
            className="mb-2 p-2 h-auto"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Left Panel - 3 Tables (Conditionally shown) */}
      {showObjectList && (
        <div className="max-w-[500px] w-80 flex flex-col space-y-4 h-full overflow-hidden pr-1">
        {/* Search and Portfolio Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Objekt suchen (Name oder ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedObject(null);
              setShowPortfolioStartView(true);
            }}
            className="px-3 whitespace-nowrap"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Portfolio
          </Button>
        </div>

        {/* Loading State */}
        {efficiencyLoading && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
              <Brain className="h-3 w-3 text-blue-600 animate-pulse" />
              <span className="text-blue-700">Analysiere {objects.length} Objekte...</span>
            </div>
          </div>
        )}

        {/* Three Tables - flex-1 to fill remaining space */}
        <div className="flex-1 flex flex-col space-y-3 overflow-auto mt-[0px] mb-[0px]">
          {/* Hoher Verbrauch */}
          <CategoryTable
            title="Hoher Verbrauch"
            objects={criticalObjects}
            categoryId="kritische"
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            bgColor="bg-red-50"
            borderColor="border-red-200"
            badgeColor="bg-red-600 text-white"
          />

          {/* Mittlerer Verbrauch */}
          <CategoryTable
            title="Mittlerer Verbrauch"
            objects={warningObjects}
            categoryId="warnungen"
            icon={<AlertTriangle className="h-5 w-5" style={{ color: "#f59e0b" }} />}
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            badgeColor="bg-amber-600 text-white"
          />

          {/* Optimierte Anlagen */}
          <CategoryTable
            title="Optimierte Anlagen"
            objects={optimizedObjects}
            categoryId="optimiert"
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            bgColor="bg-green-50"
            borderColor="border-green-200"
            badgeColor="bg-green-600 text-white"
          />
          
          {/* Verbrauchsverteilung nach Effizienzklassen */}
          <div className="mt-3">
            <EfficiencyDistributionCard 
              objects={[...criticalObjects, ...warningObjects, ...optimizedObjects]}
              timeRange={portfolioTimeRange}
            />
          </div>
        </div>
        </div>
      )}

      {/* Right Panel - Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedObject ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-transparent border-0">
            <div className="flex-1 overflow-hidden p-0 bg-transparent">
              <div className="h-full p-6 pl-[2px] pr-[2px] pt-[0px] pb-[0px] bg-transparent">
                <TemperatureEfficiencyChart 
                  objektid={selectedObject.objectId}
                  zeitraum={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {efficiencyLoading ? (
              // Portfolio Loading Screen mit Fortschrittsanzeige
              (<div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" style={{animation: 'pulse 1s ease-in-out infinite'}} />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Analysiere Portfolio
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Verarbeite {objects.length} Objekte...
                  </p>
                  
                  {/* Fortschrittsbalken */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Fortschrittstext */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{loadedObjects} von {objects.length} geladen</span>
                    <span>{loadingProgress}%</span>
                  </div>
                </div>
              </div>)
            ) : showPortfolioStartView ? (
              // Portfolio Objekte Tabelle
              (<div className="h-full flex flex-col max-h-full bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="mb-3 flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Portfolio Objekte
                    </h2>
                    <span className="text-sm text-gray-600">(.. nach Effizienzwert kWh/m²)</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={portfolioTimeRange === "last-2year" ? "default" : "outline"}
                        className={`h-7 px-3 text-xs ${portfolioTimeRange === "last-2year" ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                        onClick={() => setPortfolioTimeRange("last-2year")}
                      >
                        2023
                      </Button>
                      <Button
                        size="sm"
                        variant={portfolioTimeRange === "last-year" ? "default" : "outline"}
                        className={`h-7 px-3 text-xs ${portfolioTimeRange === "last-year" ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                        onClick={() => setPortfolioTimeRange("last-year")}
                      >
                        2024
                      </Button>
                      <Button
                        size="sm"
                        variant={portfolioTimeRange === "last-365-days" ? "default" : "outline"}
                        className={`h-7 px-3 text-xs ${portfolioTimeRange === "last-365-days" ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                        onClick={() => setPortfolioTimeRange("last-365-days")}
                      >
                        365Tage
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handlePrintPortfolio}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 max-w-4xl overflow-hidden">
                  <div className="border-0 shadow-none bg-white rounded-lg h-full">
                    <div id="portfolio-print-content" className="py-6 bg-white h-full overflow-auto pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
                      <div className="space-y-1">
                        {/* Gesamtsumme oberhalb der Tabelle */}
                        {(() => {
                          const allObjects = [...criticalObjects, ...warningObjects, ...optimizedObjects]
                            .filter(obj => obj.efficiencyPerM2 && obj.efficiencyPerM2 > 0);
                          const totalAllVerbrauch = allObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
                          const totalAllArea = allObjects.reduce((sum, obj) => sum + (obj.area || 0), 0);
                          const formatNumber = (num: number) => {
                            return num.toLocaleString('de-DE');
                          };
                          
                          return (
                            <>
                              {infoTextData && (
                                <div className="mb-2">
                                  <span className="text-sm text-gray-600">{String(infoTextData)}</span>
                                </div>
                              )}
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-900">
                                  Ihr Gesamverbrauch vom Portfolio ({formatNumber(totalAllArea)} m²):
                                </span>
                                <span className="text-sm font-bold text-blue-900">
                                  {formatNumber(totalAllVerbrauch)} kWh
                                </span>
                              </div>
                            </div>
                            </>
                          );
                        })()}
                        
                        {/* Header */}
                        <div className="grid items-center py-2 px-4 border border-gray-200 rounded" style={{ gridTemplateColumns: '1fr 110px 180px 220px' }}>
                          <span className="font-medium text-gray-700 text-sm text-left">Objekt. / Effizienzwert</span>
                          <span className="font-medium text-gray-700 text-right text-sm whitespace-nowrap">kWh/m² ({getTimeRangeLabel(portfolioTimeRange)})</span>
                          <span className="font-medium text-gray-700 text-right text-sm">Nutzfläche m²</span>
                          <span className="font-medium text-gray-700 text-right text-sm">Verbrauch</span>
                        </div>
                        
                        {/* Gruppiert nach Effizienzklassen */}
                        {(() => {
                          const allObjects = [...criticalObjects, ...warningObjects, ...optimizedObjects]
                            .filter(obj => obj.efficiencyPerM2 && obj.efficiencyPerM2 > 0)
                            .sort((a, b) => (b.efficiencyPerM2 || 0) - (a.efficiencyPerM2 || 0));

                          // Gruppiere nach Effizienzklassen
                          const groupedByClass = allObjects.reduce((groups, obj) => {
                            const className = obj.efficiencyClass;
                            if (!groups[className]) {
                              groups[className] = [];
                            }
                            groups[className].push(obj);
                            return groups;
                          }, {} as { [key: string]: typeof allObjects });

                          // Sortiere Klassen: F, E, D, C, B, A, A+
                          const classOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
                          const sortedClasses = classOrder.filter(cls => groupedByClass[cls]);

                          const formatNumber = (num: number) => {
                            return num.toLocaleString('de-DE');
                          };

                          return (
                            <>
                              {sortedClasses.map(className => {
                                const classObjects = groupedByClass[className];
                                const totalVerbrauch = classObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
                                const avgEfficiency = classObjects.reduce((sum, obj) => sum + (obj.efficiencyPerM2 || 0), 0) / classObjects.length;
                                const classArea = classObjects.reduce((sum, obj) => sum + (obj.area || 0), 0);
                                const totalAllArea = allObjects.reduce((sum, obj) => sum + (obj.area || 0), 0);
                                const totalAllVerbrauch = allObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
                                const areaPercentage = totalAllArea > 0 ? (classArea / totalAllArea * 100) : 0;
                                const verbrauchPercentage = totalAllVerbrauch > 0 ? (totalVerbrauch / totalAllVerbrauch * 100) : 0;
                                const firstObj = classObjects[0];

                                return (
                                  <div key={className} className="mb-4">
                                    {/* Summenzeile für Klasse */}
                                    <div style={{ marginBottom: '2px' }}>
                                      <div 
                                        className="relative flex items-center justify-between w-full h-6 rounded-sm shadow-sm"
                                        style={{ backgroundColor: '#f9f9f9', paddingLeft: '12px', paddingRight: '3px' }}
                                      >
                                        <div className="relative z-10 grid items-center w-full" style={{ gridTemplateColumns: '1fr 110px 180px 220px' }}>
                                          <span className="text-sm font-bold text-gray-900"><span className="font-normal">∑</span> Summe Klasse ({className})</span>
                                          <div className="flex items-center justify-end space-x-2">
                                            <span className="text-sm font-bold text-gray-900">
                                              ∅ {Math.round(avgEfficiency)}
                                            </span>
                                            <div 
                                              style={{ 
                                                backgroundColor: firstObj.color,
                                                color: 'white',
                                                border: 'none'
                                              }}
                                              className="text-[8px] font-bold px-1.5 py-0 min-w-[16px] h-4 rounded-full flex items-center justify-center"
                                            >
                                              {className}
                                            </div>
                                          </div>
                                          <span className="text-sm font-bold text-gray-900 text-right">
                                            <span className="font-normal">∑</span> {formatNumber(classArea)} m² ({Math.round(areaPercentage)}%)
                                          </span>
                                          <span className="text-sm font-bold text-gray-900 text-right">
                                            <span className="font-normal">∑</span> {formatNumber(totalVerbrauch)} kWh ({Math.round(verbrauchPercentage)}%)
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Objekte der Klasse */}
                                    {classObjects.map((obj) => (
                                      <div key={obj.objectId} style={{ marginBottom: '2px', marginLeft: '16px' }}>
                                        <div 
                                          onClick={() => {
                                            setSelectedObject(obj);
                                            setShowPortfolioStartView(false);
                                          }}
                                          className="cursor-pointer hover:opacity-80 transition-all"
                                        >
                                          <div 
                                            className="relative flex items-center justify-between w-full h-6 rounded-sm shadow-sm"
                                            style={{ backgroundColor: `${obj.color}20`, paddingLeft: '12px', paddingRight: '3px' }}
                                          >
                                            {/* Hintergrund-Balken */}
                                            <div 
                                              className="absolute left-0 top-0 h-full transition-all duration-300 opacity-30"
                                              style={{ 
                                                width: `${Math.min(Math.max(obj.efficiencyPerM2 / 160 * 100, 10), 100)}%`,
                                                backgroundColor: obj.color 
                                              }}
                                            />
                                            
                                            {/* Content */}
                                            <div className="relative z-10 grid items-center w-full" style={{ gridTemplateColumns: '1fr 110px 180px 220px' }}>
                                              <span className="text-sm font-medium text-gray-900">{obj.name}</span>
                                              <div className="flex items-center justify-end space-x-2">
                                                <span className="text-xs font-bold text-gray-900">
                                                  {obj.efficiencyPerM2}
                                                </span>
                                                <div 
                                                  style={{ 
                                                    backgroundColor: obj.color,
                                                    color: 'white',
                                                    border: 'none'
                                                  }}
                                                  className="text-[8px] font-bold px-1.5 py-0 min-w-[16px] h-4 rounded-full flex items-center justify-center"
                                                >
                                                  {obj.efficiencyClass}
                                                </div>
                                              </div>
                                              <span className="text-xs font-medium text-gray-900 text-right">
                                                {obj.area ? formatNumber(obj.area) : 'N/A'} m²
                                              </span>
                                              <span className="text-xs font-medium text-gray-900 text-right">
                                                {obj.verbrauch ? `${formatNumber(obj.verbrauch)} kWh` : 'N/A'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                          
                        {/* Objekte ohne Effizienzwerte */}
                        {[...criticalObjects, ...warningObjects, ...optimizedObjects]
                          .filter(obj => !obj.efficiencyPerM2 || obj.efficiencyPerM2 === 0)
                          .map((obj) => (
                            <div 
                              key={obj.objectId}
                              onClick={() => {
                                setSelectedObject(obj);
                                setShowPortfolioStartView(false);
                              }}
                              className="flex justify-between items-center py-3 px-4 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-gray-900 font-medium flex-1">{obj.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">N/A</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>)
            ) : (
              // Standardansicht wenn nichts ausgewählt
              (<div className="flex-1 flex flex-col overflow-hidden bg-transparent border-0">
                <div className="flex-shrink-0 bg-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">Portfolio Effizienzanalyse</h2>
                        <p className="text-sm text-gray-600">
                          Wählen Sie ein Objekt aus der Liste oder klicken Sie auf "Portfolio" für die Gesamtübersicht
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}