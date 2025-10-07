import React, { useState } from "from "react"";
import { useQuery } from "from "@tanstack/react-query"";
import { Zap, Brain } from "from "lucide-react"";
import { KIEnergyAnalysisJahr } from "from "./KI_energy_jahr"";
import { KIEnergyAnalysis } from "from "./KI_energy"";

type TimeRange = 'year-before-last' | 'last-year' | 'last-365-days';

// Dynamische Labels mit aktuellen Jahresangaben in gewünschter Reihenfolge
const TIME_RANGE_LABELS = {
  'year-before-last': (new Date().getFullYear() - 2).toString(), // z.B. "2023"
  'last-year': (new Date().getFullYear() - 1).toString(), // z.B. "2024"
  'last-365-days': 'Letzte 365 Tage'
};

interface KIEnergyJahrWrapperProps {
  selectedObjectId: string;
  selectedObjectMeter?: Record<string, any>;
  dailyConsumption?: Record<string, any>;
  show7DayAnalysis?: boolean;
  setShow7DayAnalysis?: (show: boolean) => void;
}

// Hook für Benutzerauthentifizierung
const useAuth = () => {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => fetch('/api/auth/user').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });
  return user;
};

export const KIEnergyJahrWrapper = ({ selectedObjectId, selectedObjectMeter, dailyConsumption, show7DayAnalysis, setShow7DayAnalysis }: KIEnergyJahrWrapperProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('last-365-days');
  const [isChangingTimeRange, setIsChangingTimeRange] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState<{[key: string]: number}>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [showJahresAnalysis, setShowJahresAnalysis] = useState(false);
  const user = useAuth();
  
  // Lade Objektdaten für Flächeninformation
  const { data: selectedObject } = useQuery({
    queryKey: ['/api/objects/by-objectid', selectedObjectId],
    queryFn: () => fetch(`/api/objects/by-objectid/${selectedObjectId}`).then(res => res.json()),
    enabled: !!selectedObjectId,
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch alle Zeitbereiche für bessere Performance
  const { data: monthlyConsumption365, isLoading: isLoading365 } = useQuery({
    queryKey: ['/api/public-monthly-consumption', selectedObjectId, 'last-365-days'],
    queryFn: async () => {
      const start = performance.now();
      console.log('🚀 Starting API call for last-365-days');
      
      const response = await fetch(`/api/public-monthly-consumption/${selectedObjectId}?timeRange=last-365-days`);
      const data = await response.json();
      
      const end = performance.now();
      const duration = Math.round(end - start);
      setLoadingTimes(prev => ({ ...prev, 'last-365-days': duration }));
      console.log(`⏱️ last-365-days loaded in ${duration}ms`);
      
      return data;
    },
    enabled: !!selectedObjectId,
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten im Cache behalten
  });

  // Prefetch andere Zeitbereiche nach 2 Sekunden für bessere UX
  const { data: monthlyConsumptionLastYear, isLoading: isLoadingLastYear } = useQuery({
    queryKey: ['/api/public-monthly-consumption', selectedObjectId, 'last-year'],
    queryFn: async () => {
      const start = performance.now();
      console.log('🚀 Starting API call for last-year');
      
      const response = await fetch(`/api/public-monthly-consumption/${selectedObjectId}?timeRange=last-year`);
      const data = await response.json();
      
      const end = performance.now();
      const duration = Math.round(end - start);
      setLoadingTimes(prev => ({ ...prev, 'last-year': duration }));
      console.log(`⏱️ last-year loaded in ${duration}ms`);
      
      return data;
    },
    enabled: !!selectedObjectId,
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten im Cache behalten
  });

  const { data: monthlyConsumptionYearBefore, isLoading: isLoadingYearBefore } = useQuery({
    queryKey: ['/api/public-monthly-consumption', selectedObjectId, 'year-before-last'],
    queryFn: async () => {
      const start = performance.now();
      console.log('🚀 Starting API call for year-before-last');
      
      const response = await fetch(`/api/public-monthly-consumption/${selectedObjectId}?timeRange=year-before-last`);
      const data = await response.json();
      
      const end = performance.now();
      const duration = Math.round(end - start);
      setLoadingTimes(prev => ({ ...prev, 'year-before-last': duration }));
      console.log(`⏱️ year-before-last loaded in ${duration}ms`);
      
      return data;
    },
    enabled: !!selectedObjectId,
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten im Cache behalten
  });

  // Bestimme welcher Datensatz für den aktuellen Zeitbereich genutzt werden soll
  let monthlyConsumption, isLoading;
  switch (selectedTimeRange) {
    case 'last-year':
      monthlyConsumption = monthlyConsumptionLastYear;
      isLoading = isLoadingLastYear;
      break;
    case 'year-before-last':
      monthlyConsumption = monthlyConsumptionYearBefore;
      isLoading = isLoadingYearBefore;
      break;
    default:
      monthlyConsumption = monthlyConsumption365;
      isLoading = isLoading365;
  }

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    const switchStart = performance.now();
    setStartTime(switchStart);
    setIsChangingTimeRange(true);
    setSelectedTimeRange(timeRange);
    
    console.log(`🔄 Switching to ${timeRange}...`);
    
    // Nach kurzer Zeit Loading-State zurücksetzen
    setTimeout(() => {
      setIsChangingTimeRange(false);
      const switchEnd = performance.now();
      const switchDuration = Math.round(switchEnd - switchStart);
      console.log(`⚡ Time range switch completed in ${switchDuration}ms`);
    }, 500);
  };

  // Render die Hauptlogik für KI-Auswertung
  return (
    <div className="space-y-6">
      {!showJahresAnalysis ? (
        // === 7-TAGE KI-ANALYSE (Standard-Ansicht) ===
        // Komponente: KIEnergyAnalysis (@/components/KI_energy)
        // Datenquelle: dailyConsumption (letzte 7 Tage)
        // Features: Meter-Analyse, Trend-Erkennung, Effizienz-Bewertung
        <KIEnergyAnalysis
          selectedObjectMeter={selectedObjectMeter || {}}
          dailyConsumption={dailyConsumption || {}}
          showJahresAnalysis={false}
          setShowJahresAnalysis={() => setShowJahresAnalysis(true)}
        />
      ) : (
        // === JAHRES-ANALYSE (erweiterte KI-Ansicht) ===
        // Loading State für Jahres-Analyse
        isLoading365 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-orange-500" />
                Energiezähler KI-Analyse (Jahresansicht)
              </h4>
            </div>
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center text-gray-500">
                <Brain className="h-5 w-5 mr-2 animate-pulse text-blue-500" />
                <span>KI-Analyse ... durchforste Ihre Daten</span>
              </div>
            </div>
          </div>
        ) : (
          // Jahres-Analyse Content
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-800 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-500" />
                  Energiezähler KI-Analyse (Jahresansicht)
                </h4>
                
                {/* Zeitauswahl Buttons */}
                <div className="flex space-x-2">
                  {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((timeRange) => {
                    const isLoadingThisRange = (timeRange === 'last-year' && isLoadingLastYear) || 
                                              (timeRange === 'year-before-last' && isLoadingYearBefore) ||
                                              (timeRange === 'last-365-days' && isLoading365);
                    const cachedTime = loadingTimes[timeRange];
                    
                    return (
                      <button
                        key={timeRange}
                        onClick={() => handleTimeRangeChange(timeRange)}
                        disabled={isLoadingThisRange}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors disabled:opacity-50 relative ${
                          selectedTimeRange === timeRange
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        title={cachedTime ? `Geladen in ${cachedTime}ms` : 'Noch nicht geladen'}
                      >
                        {isLoadingThisRange ? (
                          <span className="flex items-center">
                            <Brain className="h-3 w-3 mr-1 animate-pulse" />
                            Lädt...
                          </span>
                        ) : (
                          <>
                            {TIME_RANGE_LABELS[timeRange]}
                            {cachedTime && (
                              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                                cachedTime < 1000 ? 'bg-green-500' : cachedTime < 3000 ? 'bg-orange-500' : 'bg-red-500'
                              }`} />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                  
                  {/* 7-Tage-Analyse Button neben den anderen */}
                  <button
                    onClick={() => setShowJahresAnalysis(false)}
                    className="px-3 py-1 text-sm rounded-md border transition-colors flex items-center space-x-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                  >
                    <Zap className="h-3 w-3" />
                    <span>7-Tage</span>
                  </button>
                </div>
              </div>
              
              {/* Relative Loading Overlay für den Inhalt */}
              <div className="relative">
                {(isChangingTimeRange || isLoading) && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex items-center text-blue-600">
                      <Brain className="h-5 w-5 mr-2 animate-pulse" />
                      <span className="font-medium">Lade {TIME_RANGE_LABELS[selectedTimeRange]}...</span>
                    </div>
                  </div>
                )}
                
                <KIEnergyAnalysisJahr 
                  selectedObjectMeter={monthlyConsumption}
                  monthlyConsumption={monthlyConsumption}
                  selectedObjectId={parseInt(selectedObjectId)}
                  timeRange={selectedTimeRange}
                  allTimeRangeData={{
                    'last-365-days': monthlyConsumption365,
                    'last-year': monthlyConsumptionLastYear,
                    'year-before-last': monthlyConsumptionYearBefore
                  }}
                  selectedObject={selectedObject}
                />
              </div>
            </div>
            
            {/* Performance Monitor - nur für Admins */}
            {user?.role === 'admin' && Object.keys(loadingTimes).length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
                  <span className="font-medium">Performance:</span> {Object.entries(loadingTimes).map(([range, time], index) => (
                    <React.Fragment key={range}>
                      {index > 0 && ' | '}
                      <span className={`${time < 1000 ? 'text-green-600' : time < 3000 ? 'text-orange-600' : 'text-red-600'}`}>
                        {TIME_RANGE_LABELS[range as TimeRange]}: {time}ms
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};