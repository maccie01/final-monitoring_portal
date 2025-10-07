import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Zap, Printer, ChevronDown, Brain } from "lucide-react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import html2canvas from "html2canvas";

interface OutdoorTemperature {
  id: number;
  date: string;
  postalCode: string;
  city: string;
  temperatureMin: number;
  temperatureMax: number;
  temperatureMean: number;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

interface EfficiencyData {
  objectId: number;
  timeRange: string;
  resolution: string;
  meterId: number;
  meterKey: string;
  area: number;
  period: {
    days: number;
    totalKwh: number;
    startDate: string;
    endDate: string;
    en_first: number;
    en_last: number;
    en_first_Date: string;
    en_last_Date: string;
  };
  monthlyData?: {
    month: string;
    monthlyKwh: number;
    monthlyWh: number;
    efficiencyPerM2: number;
    days: number;
    en_first: number;
    en_last: number;
    startDate: string;
    endDate: string;
  }[];
  summary: {
    daily: { totalKwh: number; avgKwh: number; efficiencyPerM2: number };
    weekly: { avgKwh: number; efficiencyPerM2: number };
    monthly: { avgKwh: number; efficiencyPerM2: number };
    yearly: { totalKwh: number; avgKwh: number; efficiencyPerM2: number };
  };
}

interface ObjectType {
  id: number;
  objectid: number;
  name: string;
  postalCode: string;
  city: string;
  status: string;
}

interface TemperatureEfficiencyChartProps {
  objektid: number;
  zeitraum: "last-year" | "last-365-days" | "last-2year";
  onTimeRangeChange?: (timeRange: "last-year" | "last-365-days" | "last-2year") => void;
}

export default function TemperatureEfficiencyChart({ objektid, zeitraum, onTimeRangeChange }: TemperatureEfficiencyChartProps) {
  // Vorletzes Jahr als Standard berechnen
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const secondPreviousYear = currentYear - 2;
  
  // Standard ist das letzte Jahr (z.B. 2024 wenn wir in 2025 sind)
  const defaultTimeRange: "last-year" | "last-365-days" | "last-2year" = "last-year";
  
  // Interner State für Zeitraum-Verwaltung falls kein onTimeRangeChange
  const [internalTimeRange, setInternalTimeRange] = useState<"last-year" | "last-365-days" | "last-2year">(defaultTimeRange);
  const currentTimeRange = onTimeRangeChange ? zeitraum : internalTimeRange;
  
  // Chart-Höhe dynamisch basierend auf Fensterbreite
  const [chartHeight, setChartHeight] = useState<number>(500);
  
  // Dropdown für Print-Optionen
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const printDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateChartHeight = () => {
      const windowWidth = window.innerWidth;
      // Breite zu Höhe Verhältnis für responsives Design - 1/3 kleiner
      if (windowWidth < 768) {
        setChartHeight(230); // Mobile
      } else if (windowWidth < 1024) {
        setChartHeight(300); // Tablet
      } else if (windowWidth < 1440) {
        setChartHeight(370); // Desktop
      } else {
        setChartHeight(430); // Large Desktop
      }
    };
    
    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);
    
    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);
  
  // Event Listener für Dropdown-Schließung beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (printDropdownRef.current && !printDropdownRef.current.contains(event.target as Node)) {
        setShowPrintDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Print-Funktionen
  const printCurrentChart = () => {
    document.body.classList.add('print-chart-only');
    window.print();
    setTimeout(() => document.body.classList.remove('print-chart-only'), 100);
    setShowPrintDropdown(false);
  };
  
  const captureChartForTimeRange = async (timeRange: "last-year" | "last-365-days" | "last-2year"): Promise<string | null> => {
    return new Promise(async (resolve) => {
      // Zeitbereich temporär wechseln
      const originalTimeRange = currentTimeRange;

      if (onTimeRangeChange) {
        onTimeRangeChange(timeRange);
      } else {
        setInternalTimeRange(timeRange);
      }
      
      // Warten bis Chart geladen ist (kurze Verzögerung)
      setTimeout(async () => {
        try {
          const chartContainer = document.getElementById('chart-print-area');
          if (!chartContainer) {
            resolve(null);
            return;
          }
          
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: false,
            width: 800,
            height: 500
          });
          
          const imageData = canvas.toDataURL('image/png');
          
          // Zurück zum ursprünglichen Zeitbereich
          if (onTimeRangeChange) {
            onTimeRangeChange(originalTimeRange);
          } else {
            setInternalTimeRange(originalTimeRange);
          }
          
          resolve(imageData);
        } catch (error) {
          console.error('Fehler beim Chart-Screenshot:', error);
          resolve(null);
        }
      }, 2000); // 2 Sekunden warten für API-Ladung
    });
  };

  const printAllTimeRanges = async () => {
    try {
      // Erstelle neue Seite mit Loading
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>GEG-Analyse - Alle Zeitbereiche - ${selectedObject?.name}</title>
            <meta charset="UTF-8">
            <style>
              @page { margin: 1cm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
              .header { text-align: center; margin-bottom: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .loading-section { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
              .chart-section { margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); page-break-after: always; }
              .chart-section:last-child { page-break-after: auto; }
              .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
              .chart-content { min-height: 400px; position: relative; }
              .chart-image { width: 100%; height: auto; max-width: 800px; margin: 0 auto; display: block; }
              .loading { color: #666; font-style: italic; text-align: center; padding: 20px; }
              .export-button { 
                background: #007bff; color: white; padding: 12px 24px; border: none; 
                border-radius: 6px; font-size: 16px; cursor: pointer; margin: 20px auto;
                display: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .export-button:hover { background: #0056b3; }
              .progress { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin: 10px 0; }
              .progress-bar { height: 100%; background: #007bff; width: 0%; transition: width 0.3s ease; }
              .geg-scale { display: flex; margin: 20px 0; justify-content: center; }
              .geg-item { padding: 8px 12px; color: white; text-align: center; min-width: 40px; }
              @media print {
                body { background: white; }
                .header { display: none; }
                .loading-section { display: none; }
                .export-button { display: none; }
                .chart-section { box-shadow: none; margin-bottom: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>GEG-Analyse: Verbrauch je m² - ${selectedObject?.name}</h1>
              <div class="loading-section">
                <div>Erstelle Charts für Export...</div>
                <div class="progress">
                  <div class="progress-bar" id="progressBar"></div>
                </div>
                <div id="loadingText">Beginne Chart-Erfassung...</div>
              </div>
              <button class="export-button" id="exportBtn" onclick="window.print()">
                📄 Als PDF exportieren
              </button>
            </div>
            
            <!-- GEG Farbskala für alle Charts -->
            <div class="chart-section">
              <div class="chart-title">GEG 2024 Effizienzklassen</div>
              <div class="geg-scale">
                <div class="geg-item" style="background: #22c55e;">
                  <div style="font-weight: bold; font-size: 12px;">A+</div>
                  <div style="font-size: 10px;">≤30</div>
                </div>
                <div class="geg-item" style="background: #84cc16;">
                  <div style="font-weight: bold; font-size: 12px;">A</div>
                  <div style="font-size: 10px;">≤50</div>
                </div>
                <div class="geg-item" style="background: #eab308;">
                  <div style="font-weight: bold; font-size: 12px;">B</div>
                  <div style="font-size: 10px;">≤75</div>
                </div>
                <div class="geg-item" style="background: #f59e0b;">
                  <div style="font-weight: bold; font-size: 12px;">C</div>
                  <div style="font-size: 10px;">≤100</div>
                </div>
                <div class="geg-item" style="background: #ef4444;">
                  <div style="font-weight: bold; font-size: 12px;">D</div>
                  <div style="font-size: 10px;">≤130</div>
                </div>
                <div class="geg-item" style="background: #dc2626;">
                  <div style="font-weight: bold; font-size: 12px;">E</div>
                  <div style="font-size: 10px;">≤160</div>
                </div>
                <div class="geg-item" style="background: #991b1b;">
                  <div style="font-weight: bold; font-size: 12px;">F</div>
                  <div style="font-size: 10px;">>160</div>
                </div>
              </div>
            </div>
      `);

      // Chart-Platzhalter erstellen
      const timeRanges: {range: "last-year" | "last-365-days" | "last-2year", label: string}[] = [
        {range: "last-year", label: "Letztes Jahr"},
        {range: "last-2year", label: "Vorletztes Jahr"}, 
        {range: "last-365-days", label: "365 Tage"}
      ];
      
      for (const {range, label} of timeRanges) {
        printWindow.document.write(`
          <div class="chart-section">
            <div class="chart-title">Zeitbereich: ${label}</div>
            <div class="chart-content" id="chart-${range}">
              <div class="loading">Erfasse Chart für ${label}...</div>
            </div>
          </div>
        `);
      }
      
      printWindow.document.write(`
          <script>
            let loadedCharts = 0;
            const totalCharts = 3;
            
            function updateProgress() {
              const progress = (loadedCharts / totalCharts) * 100;
              const progressBar = document.getElementById('progressBar');
              const loadingText = document.getElementById('loadingText');
              
              if (progressBar) progressBar.style.width = progress + '%';
              if (loadingText) {
                loadingText.textContent = 
                  loadedCharts === totalCharts ? 
                  'Alle Charts erfasst! Sie können jetzt als PDF exportieren.' : 
                  'Erfasse Chart ' + (loadedCharts + 1) + ' von ' + totalCharts + '...';
              }
              
              if (loadedCharts === totalCharts) {
                const exportBtn = document.getElementById('exportBtn');
                const loadingSection = document.querySelector('.loading-section .progress');
                if (exportBtn) exportBtn.style.display = 'block';
                if (loadingSection) loadingSection.style.display = 'none';
              }
            }
            
            function displayChart(range, label, imageData) {
              loadedCharts++;
              const chartElement = document.getElementById('chart-' + range);
              if (chartElement && imageData) {
                chartElement.innerHTML = 
                  '<img src="' + imageData + '" class="chart-image" alt="Chart für ' + label + '" />';
              } else {
                chartElement.innerHTML = 
                  '<div style="color: red; text-align: center; padding: 40px;">Fehler beim Laden des Charts für ' + label + '</div>';
              }
              updateProgress();
            }
            
            // Funktion für externen Aufruf verfügbar machen
            window.displayChart = displayChart;
          </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Jetzt echte Charts erfassen
      setShowPrintDropdown(false);
      
      // Sequenziell alle Charts erfassen
      for (let i = 0; i < timeRanges.length; i++) {
        const {range, label} = timeRanges[i];
        
        try {
          const imageData = await captureChartForTimeRange(range);
          if (printWindow && !printWindow.closed && (printWindow as any).displayChart) {
            (printWindow as any).displayChart(range, label, imageData);
          }
        } catch (error) {
          console.error(`Fehler beim Erfassen von ${label}:`, error);
          if (printWindow && !printWindow.closed && (printWindow as any).displayChart) {
            (printWindow as any).displayChart(range, label, null);
          }
        }
      }
      
    } catch (error) {
      console.error('Fehler beim Export-Vorbereitung:', error);
    }
  };
  
  const handleTimeRangeChange = (newTimeRange: "2024" | "365days" | "2023") => {
    // ✅ REPARIERT: Konvertiere Frontend-Button-Werte zu Backend-API-Werten
    let mappedTimeRange: "last-year" | "last-365-days" | "last-2year";
    switch (newTimeRange) {
      case "2024":
        mappedTimeRange = "last-year";
        break;
      case "365days":
        mappedTimeRange = "last-365-days";
        break;
      case "2023":
        mappedTimeRange = "last-2year";
        break;
      default:
        mappedTimeRange = "last-year";
    }
    
    if (onTimeRangeChange) {
      onTimeRangeChange(mappedTimeRange);
    } else {
      setInternalTimeRange(mappedTimeRange);
    }
  };
  
  // Beide Ansichten sind immer aktiviert, keine Toggle-Buttons mehr
  const showTemperature = true;
  const showEfficiency = true;
  const showXAxisLabels = true;

  // 🚀 NEUE KOMBINIERTE API - nur ein einziger API-Aufruf für alle Daten
  const { data: combinedData, isLoading: combinedLoading, error: combinedError } = useQuery({
    queryKey: ["/api/energy-data/temperature-efficiency-chart", objektid, currentTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/energy-data/temperature-efficiency-chart/${objektid}?timeRange=${currentTimeRange}`);
      if (!response.ok) {
        console.warn(`Failed to fetch combined chart data for ${currentTimeRange}: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch combined chart data');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extrahiere Daten aus der kombinierten API-Antwort
  // API gibt {object: {...}, temperatures: [...], efficiency: {...}} zurück
  const selectedObject = combinedData?.object ? {
    objectid: combinedData.object.objectid,
    name: combinedData.object.name,
    postalCode: combinedData.object.postalCode,
    city: combinedData.object.city,
    status: combinedData.object.status
  } : null;
  const temperatures = combinedData?.temperatures || []; // ✅ REPARIERT: Verwende echte Temperaturdaten aus API
  const efficiencyData = combinedData; // ✅ REPARIERT: Verwende combinedData direkt für summary.yearly und area
  const temperaturesLoading = combinedLoading;
  const efficiencyLoading = combinedLoading;
  const efficiencyError = combinedError;

  // Chart-Daten kombinieren
  const chartData = useMemo(() => {
    if (!temperatures.length) {
      console.log("🔍 No temperatures data available");
      return [];
    }

    console.log("🔍 Chart Data Debug:", {
      temperatureCount: temperatures.length,
      efficiencyData: efficiencyData,
      hasEfficiencyArray: !!efficiencyData?.efficiency,
      efficiencyArrayLength: efficiencyData?.efficiency?.length || 0
    });

    const tempMap = new Map<string, OutdoorTemperature>();
    temperatures.forEach((temp: OutdoorTemperature) => {
      const dateKey = temp.date.substring(0, 7); // YYYY-MM
      tempMap.set(dateKey, temp);
    });

    const effMap = new Map<string, number>();
    
    // 🔧 REPARIERT: Verwende echte Effizienz-Daten direkt aus der API 
    if (efficiencyData?.efficiency && Array.isArray(efficiencyData.efficiency)) {
      console.log("📊 Verarbeite Array-Effizienz-Daten:", efficiencyData.efficiency.length, "Datenpunkte");
      const monthlyAggregation = new Map<string, { total: number; count: number; }>();
      
      efficiencyData.efficiency.forEach((eff: any) => {
        if (eff.date && eff.efficiency !== undefined && eff.efficiency !== null) {
          // Parse Date korrekt aus API-Format (ISO 8601)
          const date = new Date(eff.date);
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          const current = monthlyAggregation.get(dateKey) || { total: 0, count: 0 };
          current.total += eff.efficiency;
          current.count += 1;
          monthlyAggregation.set(dateKey, current);
        }
      });
      
      // Berechne Durchschnittswerte pro Monat
      monthlyAggregation.forEach((data, dateKey) => {
        const avgEfficiency = data.total / data.count;
        effMap.set(dateKey, avgEfficiency);
      });
      
      console.log("📊 Monthly efficiency aggregation (kWh/m²):", Object.fromEntries(effMap));
      
      // Debug: Zeige erste Datenpunkte der Rohdaten
      console.log("🔍 Erste 5 Rohdatenpunkte:", efficiencyData.efficiency.slice(0, 5).map((d: any) => ({
        date: d.date,
        efficiency: d.efficiency,
        month: d.date ? new Date(d.date).toISOString().substring(0, 7) : 'INVALID'
      })));
      
      // Debug: Zeige Aggregations-Details
      console.log("🔍 Aggregations-Details:", Array.from(monthlyAggregation.entries()).map(([month, data]) => ({
        month,
        totalEfficiency: data.total,
        dataPoints: data.count,
        avgEfficiencyPerM2: (data.total / data.count).toFixed(2)
      })));
    } else if (efficiencyData && typeof efficiencyData === 'object') {
      // 🔧 REPARIERT: Verarbeite Object-Format aus API (direkte monthly data)
      console.log("📊 Verarbeite Object-Effizienz-Daten:", efficiencyData);
      
      // Wenn API ein Object mit direkten Effizienz-Werten pro Monat zurückgibt
      if (efficiencyData.chartData && Array.isArray(efficiencyData.chartData)) {
        efficiencyData.chartData.forEach((item: any) => {
          if (item.date && item.efficiency !== undefined && item.efficiency !== null) {
            const dateKey = item.date.substring(0, 7); // YYYY-MM aus "2024-01"
            effMap.set(dateKey, item.efficiency);
          }
        });
        console.log("📊 Direkte Monthly data verarbeitet:", Object.fromEntries(effMap));
      }
    } else {
      console.log("⚠️ Keine gültigen Effizienz-Daten gefunden:", typeof efficiencyData, efficiencyData);
    }

    // 🔧 REPARIERT: Verwende ALLE Effizienz-Monate als Basis, nicht nur Temperatur-Monate
    const allMonths = new Set([...Array.from(tempMap.keys()), ...Array.from(effMap.keys())]);
    const combinedData = Array.from(allMonths).map((dateKey) => {
      const temp = tempMap.get(dateKey);
      const efficiency = effMap.get(dateKey);
      
      return {
        date: dateKey,
        fullDate: temp?.date || `${dateKey}-01T00:00:00.000Z`, // Fallback-Datum
        min: temp?.temperatureMin || "0", // Fallback wenn keine Temperatur-Daten
        max: temp?.temperatureMax || "0",
        mean: temp?.temperatureMean || "0",
        efficiency: efficiency ?? null // Effizienz-Daten verfügbar
      };
    });

    const sorted = combinedData.sort((a, b) => a.date.localeCompare(b.date));
    console.log("🔍 Final Chart Data:", sorted.slice(0, 3)); // Erste 3 Datenpunkte

    return sorted;
  }, [temperatures, efficiencyData]);

  // Dynamische Min/Max/Durchschnitt Temperatur-Werte aus den Daten des Zeitraums
  const temperatureStats = useMemo(() => {
    if (!chartData.length) return { min: -1.8, max: 34.7, avg: 16.5 };

    const allTemps = chartData.flatMap(d => [parseFloat(String(d.min)), parseFloat(String(d.max)), parseFloat(String(d.mean))]);
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);

    // Durchschnitt aus allen mean-Werten berechnen
    const avgTemp = chartData.reduce((sum, d) => sum + parseFloat(String(d.mean)), 0) / chartData.length;
    
    return { 
      min: Number(minTemp.toFixed(1)), 
      max: Number(maxTemp.toFixed(1)),
      avg: Number(avgTemp.toFixed(1))
    };
  }, [chartData]);

  // GEG 2024 Effizienzklassen - Korrekte Farbzuordnung
  const getEfficiencyClass = (value: number) => {
    if (value <= 30) return { class: "A+", color: "#22c55e", textBgColor: "bg-green-50", borderColor: "border-green-200" };
    if (value <= 50) return { class: "A", color: "#84cc16", textBgColor: "bg-lime-50", borderColor: "border-lime-200" };
    if (value <= 75) return { class: "B", color: "#eab308", textBgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    if (value <= 100) return { class: "C", color: "#f59e0b", textBgColor: "bg-orange-50", borderColor: "border-orange-200" };
    if (value <= 130) return { class: "D", color: "#ef4444", textBgColor: "bg-red-50", borderColor: "border-red-200" };
    if (value <= 160) return { class: "E", color: "#dc2626", textBgColor: "bg-red-100", borderColor: "border-red-300" };
    return { class: "F", color: "#991b1b", textBgColor: "bg-red-200", borderColor: "border-red-400" };
  };

  // Y-Achsen-Skalierung basierend auf Effizienzklasse
  const getYAxisDomain = (avgEfficiency: number): [number, number] => {
    if (avgEfficiency > 100) return [0, 25]; // Klasse >C auf 25
    if (avgEfficiency <= 100 && avgEfficiency > 75) return [0, 20]; // Klasse C auf 20  
    return [0, 15]; // Klasse <B auf 15
  };

  const avgEfficiency = useMemo(() => {
    if (!efficiencyData?.summary?.yearly) return 77.6; // Fallback zu berechneter Effizienz: 439738/5667 = 77.6
    const efficiency = efficiencyData.summary.yearly.efficiencyPerM2;
    return isNaN(efficiency) || efficiency < 0 ? 77.6 : efficiency;
  }, [efficiencyData]);
  const efficiencyClass = getEfficiencyClass(avgEfficiency);

  // Überspringe "Objekt nicht gefunden" wenn wir noch laden
  if (!selectedObject && !combinedLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Thermometer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Objekt nicht gefunden
          </h3>
          <p className="text-gray-600">
            Objekt-ID {objektid} wurde nicht gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (combinedLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-16">
          {/* Brain Icon mit sanftem Blinken */}
          <Brain className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          
          {/* Haupt-Text */}
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Analysiere die Daten
          </h3>
          
          {/* Objektname */}
          {selectedObject?.name && (
            <p className="text-gray-700 font-medium text-lg mb-2">
              {selectedObject.name}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check both temperature data and efficiency data
  if (temperatures.length === 0 || (combinedData?.data && combinedData.data.length === 0)) {
    const noEfficiencyData = combinedData?.data && combinedData.data.length === 0;
    
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Thermometer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {noEfficiencyData 
              ? `Keine Effizienz-Daten für ${selectedObject?.name || objektid}`
              : `Keine Temperaturdaten für ${currentTimeRange}`}
          </h3>
          <p className="text-gray-600">
            {noEfficiencyData 
              ? 'Für dieses Objekt sind keine Vorlauf-/Rücklauftemperaturen verfügbar, die für die Effizienzanalyse benötigt werden.'
              : `Für PLZ ${selectedObject?.postalCode} sind keine Temperaturdaten im Zeitraum ${currentTimeRange} verfügbar.`}
          </p>
          {!noEfficiencyData && currentTimeRange !== "last-365-days" && (
            <div className="mt-4">
              <button 
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleTimeRangeChange("365days")}
                data-testid="button-switch-365days"
              >
                Zu 365 Tage wechseln
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Debug: Chart-Daten prüfen (NEUE KOMBINIERTE API)
  console.log('✅ Chart Debug (Combined API):', {
    chartDataLength: chartData.length,
    hasEfficiencyData: !!efficiencyData,
    hasTemperatures: !!temperatures?.length,
    selectedObject: selectedObject?.name,
    selectedObjectRaw: selectedObject,
    avgEfficiency,
    currentTimeRange,
    combinedLoading,
    combinedError,
    apiResponse: !!combinedData,
    combinedDataObject: selectedObject
  });

  return (
    <div className="flex flex-col gap-2" id="chart-print-area">
      {/* Chart Card */}
      <Card className={`h-full ${efficiencyClass.textBgColor} ${efficiencyClass.borderColor} border-2`}>
        <CardHeader className={`${efficiencyClass.textBgColor} rounded-t-lg py-3 px-4`}>
          {/* Header im CardHeader */}
          <div className="flex w-full mb-3 items-center gap-4">
            {/* Links: GEG-Analyse Text (20%) */}
            <div className="flex flex-col text-left" style={{ width: '20%' }}>
              <span className="text-sm leading-tight">
                normierte GEG-Analyse
              </span>
              <span className="text-sm leading-tight">
                Verbrauch je m²
              </span>
            </div>
            
            {/* Mittig: Objekt (50%) */}
            <div className="flex flex-col text-center" style={{ width: '50%' }}>
              <span className="font-semibold text-lg">
                Objekt : {selectedObject?.name}
              </span>
            </div>
            
            {/* Rechts: GEG Farbskala */}
            <div className="flex justify-end">
              <div className="flex bg-white overflow-hidden shadow-sm">
                <div className="px-2 py-0.5 bg-green-500 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">A+</div>
                  <div className="text-[8px]">≤30</div>
                </div>
                <div className="px-2 py-0.5 bg-lime-500 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">A</div>
                  <div className="text-[8px]">≤50</div>
                </div>
                <div className="px-2 py-0.5 bg-yellow-500 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">B</div>
                  <div className="text-[8px]">≤75</div>
                </div>
                <div className="px-2 py-0.5 text-white text-center min-w-[25px]" style={{ backgroundColor: "#f59e0b" }}>
                  <div className="text-[10px] font-bold">C</div>
                  <div className="text-[8px]">≤100</div>
                </div>
                <div className="px-2 py-0.5 bg-red-500 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">D</div>
                  <div className="text-[8px]">≤130</div>
                </div>
                <div className="px-2 py-0.5 bg-red-600 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">E</div>
                  <div className="text-[8px]">≤160</div>
                </div>
                <div className="px-2 py-0.5 bg-red-800 text-white text-center min-w-[25px]">
                  <div className="text-[10px] font-bold">F</div>
                  <div className="text-[8px]">≤200</div>
                </div>
              </div>
            </div>
          </div>

          <CardTitle className="flex flex-col gap-2 text-sm">
            {/* Grid für Verbrauchsdaten, Zeitbereich und Effizienz */}
            <div className="grid grid-cols-3 gap-3 items-start">
              {/* Linke Spalte - Verbrauchsdaten */}
              <div className="flex flex-col gap-0.5 text-left">
                {efficiencyData && (
                  <div className="text-gray-700 flex flex-col">
                    <span className="text-xs">Verbrauch: {Math.round(efficiencyData.summary?.yearly?.totalKwh || 0).toLocaleString()} kWh/Jahr</span>
                    <span className="text-xs">Fläche: {efficiencyData.area?.toLocaleString()} m²</span>
                  </div>
                )}
              </div>
              
              {/* Mittlere Spalte - Zeitbereich */}
              <div className="text-center">
                <div className="flex gap-1 justify-center">
                  <button 
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${currentTimeRange === "last-2year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    onClick={() => handleTimeRangeChange("2023")}
                    data-testid="button-timerange-2023"
                  >
                    {secondPreviousYear}
                  </button>
                  <button 
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${currentTimeRange === "last-year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    onClick={() => handleTimeRangeChange("2024")}
                    data-testid="button-timerange-2024"
                  >
                    {previousYear}
                  </button>
                  <button 
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${currentTimeRange === "last-365-days" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    onClick={() => handleTimeRangeChange("365days")}
                    data-testid="button-timerange-365days"
                  >
                    365 Tage
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Außentemperatur & Effizienz-Verlauf
                </div>
              </div>
              
              {/* Rechte Spalte - Effizienzwerte */}
              <div className="text-right">
                {efficiencyData && (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-gray-700">Effizienz: (Klasse {efficiencyClass.class})</span>
                    <div 
                      className="px-3 py-1.5 rounded-md font-bold text-sm text-white shadow-md"
                      style={{ backgroundColor: efficiencyClass.color }}
                    >
                      {Math.round(avgEfficiency)} kWh/m²/Jahr
                    </div>
                  </div>
                )}
              </div>
            </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4">
        <div className="w-full bg-gray-50" style={{ height: `${chartHeight}px` }}>
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8f8f8" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value && typeof value === 'string') {
                    const parts = value.split('-');
                    if (parts.length >= 2) {
                      return parts[1]; // Nur Monat: 01, 02, 03, etc.
                    }
                  }
                  return value;
                }}
              />
              <YAxis 
                yAxisId="efficiency"
                orientation="left" 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Verbrauch (kWh/m²/Monat)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
                domain={getYAxisDomain(avgEfficiency)}
              />
              <YAxis 
                yAxisId="temp"
                orientation="right" 
                tick={{ fontSize: 12 }}
                label={{
                  value: '',
                  position: 'insideRight',
                  content: (props: any) => {
                    return (
                      <g>
                        <text
                          x={props.viewBox.x + props.viewBox.width - 10}
                          y={props.viewBox.y + props.viewBox.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="12px"
                          transform={`rotate(90, ${props.viewBox.x + props.viewBox.width - 10}, ${props.viewBox.y + props.viewBox.height / 2})`}
                        >
                          <tspan fill="#6b7280">Außentemperatur - </tspan>
                          <tspan fill="#6b7280" fontWeight="bold">∅: {temperatureStats.avg}°C, </tspan>
                          <tspan fill="#3b82f6" fontWeight="bold">Min: {temperatureStats.min}°C</tspan>
                          <tspan fill="#6b7280">, </tspan>
                          <tspan fill="#ef4444" fontWeight="bold">Max: {temperatureStats.max}°C</tspan>
                        </text>
                      </g>
                    );
                  }
                }}
                domain={[-10, 35]}
              />
              <Tooltip 
                labelFormatter={(label: any, payload?: any[]) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `Datum: ${new Date(data.fullDate).toLocaleDateString('de-DE')}`;
                  }
                  return label;
                }}
                formatter={(value: any, name: any) => {
                  // Convert value to number and handle null/undefined cases
                  const numValue = typeof value === 'string' ? parseFloat(value) : 
                                   typeof value === 'number' ? value : 0;
                  
                  // Check for invalid numbers
                  if (isNaN(numValue)) {
                    if (name === 'Effizienz') {
                      return ['N/A kWh/m²/Monat', 'Verbrauch'];
                    }
                    return [
                      'N/A°C',
                      name === 'min' ? 'min' : name === 'max' ? 'max' : 'Temperatur Ø'
                    ];
                  }
                  
                  if (name === 'Effizienz') {
                    return [`${numValue.toFixed(2)} kWh/m²/Monat`, 'Verbrauch'];
                  }
                  return [
                    `${numValue.toFixed(1)}°C`,
                    name === 'min' ? 'min' : name === 'max' ? 'max' : 'Temperatur Ø'
                  ];
                }}
                contentStyle={{
                  backgroundColor: '#fafafa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              
              {/* Verbrauch-Balken */}
              <Bar 
                yAxisId="efficiency"
                dataKey="efficiency" 
                fill={efficiencyClass.color}
                name="Effizienz"
                opacity={0.8}
              />
              
              {/* Grüne Referenzlinie bei Y = 1.5 */}
              <ReferenceLine 
                yAxisId="efficiency"
                y={1.5} 
                stroke="#22c55e" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "1.5 kWh/m²", position: "insideTopRight", style: { fontSize: '11px', fill: '#22c55e', fontWeight: 'bold' } }}
              />
              
              {/* Temperatur-Linien */}
              <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="min" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="min"
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="mean" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Temperatur Ø"
                dot={{ fill: '#10b981', strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="max" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="max"
                dot={{ fill: '#ef4444', strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
              />
            </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}