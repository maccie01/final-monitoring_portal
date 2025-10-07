import React, { useState } from "from "react"";
import { FileText, Brain, Leaf } from "from "lucide-react"";
import { useMutation } from "from "@tanstack/react-query"";
import { apiRequest } from "from "@/lib/queryClient"";
import {
  getComponentType,
  getComponentProps,
  getSmartComponentName,
  evaluateMonthlyConsumption,
  getStatusIcon,
  formatKWh,
  formatPercentage,
  EnergyBarChart,
  groupMeterEntries,
  type MonthlyData,
  type EvaluationResult
} from "from "./shared/energy-utils"";

interface MeterData {
  meterId: string;
  values: number[];
  monthlyData: MonthlyData[];
}

interface MonthlyConsumption {
  [key: string]: MeterData;
}

interface GroupSum {
  totalSum: number;
  meterCount: number;
  meterKeys: string[];
}

interface ComponentGroupSums {
  netz?: GroupSum;
  waermepumpe?: GroupSum;
  kessel?: GroupSum;
  waermepumpeStrom?: GroupSum;
}

interface KIEnergyProps {
  selectedObjectMeter: {
    [key: string]: any;
  };
  monthlyConsumption: MonthlyConsumption;
  selectedObjectId: number;
  timeRange: string;
  allTimeRangeData?: {
    'last-365-days': any;
    'last-year': any;
    'year-before-last': any;
  };
  selectedObject?: {
    objdata?: {
      area?: number;
    };
  };
}

// Generate dynamic header based on data dates
const generateMonthsHeader = (monthlyConsumption: MonthlyConsumption): string => {
  let allDates: Date[] = [];
  
  // Collect all dates from all meters
  Object.values(monthlyConsumption).forEach(meterData => {
    if (meterData?.monthlyData) {
      const dates = meterData.monthlyData.map((d: any) => new Date(d.date));
      allDates = [...allDates, ...dates];
    }
  });
  
  if (allDates.length === 0) {
    return "Monatswerte";
  }
  
  // Sort dates and get range
  allDates.sort((a, b) => a.getTime() - b.getTime());
  const firstDate = allDates[0];
  const lastDate = allDates[allDates.length - 1];
  
  // Check if all dates are from the same year
  const firstYear = firstDate.getFullYear();
  const lastYear = lastDate.getFullYear();
  
  if (firstYear === lastYear) {
    // Same year: "Monatswerte (Jan-Dez 2024)"
    return `Monatswerte (Jan-Dez ${firstYear})`;
  } else {
    // Different years with month precision: "Monatswerte (Sep.2024 - Aug.2025)"
    const firstMonth = firstDate.toLocaleDateString('de-DE', { month: 'short' });
    const lastMonth = lastDate.toLocaleDateString('de-DE', { month: 'short' });
    return `Monatswerte (${firstMonth}.${firstYear} - ${lastMonth}.${lastYear})`;
  }
};

interface EnergyBalanceResult {
  netzVerbrauch: number;
  gesamtErzeugung: number;
  verlusteAbs: number;
  verlusteInProzent: number;
  bewertung: string;
  farbKlasse: string;
  zeitbereich: string;
}

export const KIEnergyAnalysisJahr = ({ selectedObjectMeter, monthlyConsumption, selectedObjectId, timeRange, allTimeRangeData, selectedObject }: KIEnergyProps) => {
  const monthsHeader = generateMonthsHeader(monthlyConsumption);

  const [energyBalance, setEnergyBalance] = useState<EnergyBalanceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [yearlySummary, setYearlySummary] = useState<any>(null);

  // Mutation für Energiebilanz-Berechnung
  const energyBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/energy-balance/${selectedObjectId}`, { timeRange });
      return await response.json() as EnergyBalanceResult;
    },
    onSuccess: (data: EnergyBalanceResult) => {
      setEnergyBalance(data);
      setIsCalculating(false);
      console.log('🔋 Energy balance calculated successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Energy balance calculation failed:', error);
      setIsCalculating(false);
    }
  });



  // Fetch yearly summary data
  const yearlySummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/yearly-summary/${selectedObjectId}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setYearlySummary(data);
      console.log('📊 Yearly summary data received:', data);
    },
    onError: (error) => {
      console.error('❌ Yearly summary fetch failed:', error);
    }
  });

  // Auto-berechne Energiebilanz beim Laden - DEAKTIVIERT da API-Endpunkt nicht verfügbar
  // React.useEffect(() => {
  //   if (!energyBalance && !isCalculating && Object.keys(monthlyConsumption).length > 0) {
  //     setIsCalculating(true);
  //     energyBalanceMutation.mutate();
  //   }
  // }, [energyBalance, isCalculating, monthlyConsumption]);

  // Fetch yearly summary on component mount and when objectId changes - DEAKTIVIERT da API-Endpunkt nicht verfügbar
  // React.useEffect(() => {
  //   if (selectedObjectId && Object.keys(monthlyConsumption).length > 0) {
  //     yearlySummaryMutation.mutate();
  //   }
  // }, [selectedObjectId, monthlyConsumption]);

  // Removed groupSums API call for performance optimization

  // Verwende Utility-Funktion für Gruppierung
  const allKeys = Object.keys(selectedObjectMeter).filter(k => k !== 'ZLOGID');
  const groupedEntries = groupMeterEntries(selectedObjectMeter);

  // Removed renderGroupSummary function - no longer needed for performance optimization

  const renderIndividualRow = (key: string, value: any) => {
    const meterData = monthlyConsumption?.[key];
    const meterValues = meterData?.values || [];
    const monthlyDataValues = meterData?.monthlyData || [];
    const kWhValues = monthlyDataValues.map((d: any) => d.diffEn / 1000);
    const evaluation = evaluateMonthlyConsumption(monthlyDataValues); // Pass raw data to evaluation
    
    // Debug für Kessel (entfernt nach Fix)
    
    // Verwende Utility-Funktionen
    const { type, number } = getComponentType(key);
    const { name, icon, bgColor, textColor } = getComponentProps(type);
    const smartComponentName = getSmartComponentName(name, number, allKeys);
    
    const maxValue = Math.max(...(kWhValues.length > 0 ? kWhValues : [1]), 1);
    
    return (
      <tr key={key} className={`border-b border-gray-100 last:border-b-0 ${bgColor}`}>
        {/* Komponente Column */}
        <td className="py-2 px-4">
          <div className="flex items-center space-x-3">
            <div className={textColor}>
              {icon}
            </div>
            <div>
              <div className={`font-medium ${textColor}`}>
                {smartComponentName}
              </div>
              <div className="text-sm text-gray-600">
                {key}
              </div>
              <div className="text-xs text-gray-500">
                ({meterData?.meterId})
              </div>
            </div>
          </div>
        </td>
        {/* Monatswerte Column */}
        <td className="py-2 px-2">
          <div className="flex items-center">
            <div className="flex items-end space-x-px mr-3">
              {meterData?.monthlyData && meterData.monthlyData.length > 0 ? (
                meterData.monthlyData.slice(-12).reverse().map((monthData: any, index: number) => {
                  const monthlyKWh = monthData.diffEn / 1000; // Convert Wh to kWh
                  const height = Math.max((monthlyKWh / maxValue) * 60, 4);
                  const date = new Date(monthData.date);
                  const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
                  
                  // Determine bar color based on energy level and component type
                  let barColor = '';
                  let isZeroValue = monthlyKWh === 0;
                  if (isZeroValue) {
                    barColor = 'bg-red-500';
                  } else if (monthlyKWh < 20) { // Low threshold for monthly data  
                    barColor = 'bg-orange-400'; // Orange for < 20 kWh/month
                  } else {
                    // Normal colors based on component type
                    if (key.match(/^Z2054\d*/)) barColor = 'bg-blue-400';        // Netz
                    else if (key.match(/^Z2024\d*/)) barColor = 'bg-green-400';  // Wärmepumpe
                    else if (key.match(/^Z2014\d*/)) barColor = 'bg-violet-500'; // Kessel
                    else if (key.match(/^Z2022\d*/)) barColor = 'bg-yellow-400'; // Wärmepumpe-Strom
                    else barColor = 'bg-gray-400';
                  }
                  
                  return (
                    <div key={index} className="flex flex-col items-center" style={{ minWidth: '18px' }}>
                      {isZeroValue ? (
                        // For 0 kWh values: only a red underline
                        (<div 
                          className="w-3 h-0.5 bg-red-500 mt-auto"
                          title={`${monthName}: ${monthlyKWh.toFixed(0)} kWh`}
                        />)
                      ) : (
                        // For non-zero values: normal bar
                        (<div 
                          className={`w-3 ${barColor} rounded-t-sm`}
                          style={{ 
                            height: `${height}px`,
                            minHeight: '3px'
                          }}
                          title={`${monthName}: ${monthlyKWh.toFixed(0)} kWh`}
                        />)
                      )}
                      <div className="text-xs text-gray-500 text-center mt-0.5 text-[8px]">{monthName}</div>
                    </div>
                  );
                })
              ) : (
                ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((month, index) => (
                  <div key={index} className="flex flex-col items-center" style={{ minWidth: '18px' }}>
                    <div className="w-3 h-1 bg-gray-200 rounded-sm"></div>
                    <div className="text-xs text-gray-500 text-center mt-0.5 text-[8px]">{month}</div>
                  </div>
                ))
              )}
            </div>
            

          </div>
        </td>
        {/* ∑ (kWh/a) Column */}
        <td className="py-2 px-4 text-right whitespace-nowrap" style={{ width: '180px', minWidth: '180px' }}>
          {(() => {
            // Berechne Werte für alle drei Zeiträume
            const currentSum = kWhValues.length > 0 ? kWhValues.reduce((sum, val) => sum + val, 0) : 0;
            const currentYear = new Date().getFullYear();
            const lastYear = currentYear - 1;
            const yearBeforeLast = currentYear - 2;
            
            // Bestimme den aktuellen Zeitraum basierend auf timeRange
            let currentPeriod = '';
            if (timeRange === 'last-365-days') currentPeriod = '365';
            else if (timeRange === 'last-year') currentPeriod = lastYear.toString();
            else if (timeRange === 'year-before-last') currentPeriod = yearBeforeLast.toString();
            
            // Use current calculated values or realistic fallback based on meter type
            const currentValue = Math.round(currentSum);
            
            // Use real data from all time ranges
            let value365 = 0, valueLastYear = 0, valueYearBefore = 0;
            
            if (currentPeriod === '365') {
              value365 = currentValue;
            } else if (allTimeRangeData?.['last-365-days']?.[key]?.monthlyData) {
              const monthlyValues = allTimeRangeData['last-365-days'][key].monthlyData;
              value365 = Math.round(monthlyValues.reduce((sum: number, month: any) => sum + ((month.diffEn || 0) / 1000), 0));
            }
            
            if (currentPeriod === lastYear.toString()) {
              valueLastYear = currentValue;
            } else if (allTimeRangeData?.['last-year']?.[key]?.monthlyData) {
              const monthlyValues = allTimeRangeData['last-year'][key].monthlyData;
              valueLastYear = Math.round(monthlyValues.reduce((sum: number, month: any) => sum + ((month.diffEn || 0) / 1000), 0));
            }
            
            if (currentPeriod === yearBeforeLast.toString()) {
              valueYearBefore = currentValue;
            } else if (allTimeRangeData?.['year-before-last']?.[key]?.monthlyData) {
              const monthlyValues = allTimeRangeData['year-before-last'][key].monthlyData;
              valueYearBefore = Math.round(monthlyValues.reduce((sum: number, month: any) => sum + ((month.diffEn || 0) / 1000), 0));
            }

            // Calculate trends only when both values exist
            const trend365 = (value365 > 0 && valueLastYear > 0) ? ((value365 - valueLastYear) / valueLastYear * 100) : null;
            const trendLastYear = (valueLastYear > 0 && valueYearBefore > 0) ? ((valueLastYear - valueYearBefore) / valueYearBefore * 100) : null;
            
            return (
              <div className="font-medium leading-tight space-y-0.5" style={{ width: '160px' }}>
                <div className={`flex items-center justify-between whitespace-nowrap ${currentPeriod === '365' ? `${textColor} font-semibold text-sm` : 'text-black text-xs'}`}>
                  <span className="flex-shrink-0">&lt;365: {value365 > 0 ? value365.toLocaleString('de-DE') : '-'}</span>
                  {trend365 !== null && (
                    <span className={`text-xs ml-1 flex-shrink-0 ${trend365 >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {trend365 >= 0 ? '↑' : '↓'} {Math.round(Math.abs(trend365))}%
                    </span>
                  )}
                </div>
                <div className={`flex items-center justify-between whitespace-nowrap ${currentPeriod === lastYear.toString() ? `${textColor} font-semibold text-sm` : 'text-black text-xs'}`}>
                  <span className="flex-shrink-0">{lastYear}: {valueLastYear > 0 ? valueLastYear.toLocaleString('de-DE') : '-'}</span>
                  {trendLastYear !== null && (
                    <span className={`text-xs ml-1 flex-shrink-0 ${trendLastYear >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {trendLastYear >= 0 ? '↑' : '↓'} {Math.round(Math.abs(trendLastYear))}%
                    </span>
                  )}
                </div>
                <div className={`flex items-center justify-between whitespace-nowrap ${currentPeriod === yearBeforeLast.toString() ? `${textColor} font-semibold text-sm` : 'text-black text-xs'}`}>
                  <span className="flex-shrink-0">{yearBeforeLast}: {valueYearBefore > 0 ? valueYearBefore.toLocaleString('de-DE') : '-'}</span>
                </div>
              </div>
            );
          })()}
        </td>
        {/* Bewertung Column */}
        <td className="py-2 px-4">
          {kWhValues.length > 0 ? (
            <>
              <div className="flex items-center space-x-2">
                {/* Icon nur anzeigen wenn Text vorhanden ist */}
                {(evaluation.status === 'critical' && evaluation.criticalDays > 0) || 
                 (evaluation.status === 'kontrolle' && type !== 'netz') || 
                 evaluation.status === 'ok' || 
                 evaluation.status === 'unknown' ? getStatusIcon(evaluation.status) : null}
                <div>
                  {evaluation.status === 'critical' && evaluation.criticalDays > 0 && (
                    <>
                      <span className="text-red-700 font-medium">
                        Kritisch! Keine Energie in {evaluation.criticalDays} Monat{evaluation.criticalDays > 1 ? 'en' : ''}
                      </span>
                      <div className="text-xs text-red-600">
                        Anlage prüfen ⇒ {smartComponentName}
                      </div>
                    </>
                  )}
                  {evaluation.status === 'kontrolle' && type !== 'netz' && (
                    <span className="text-orange-700 font-medium">
                      Kontrolle! Anlage ⇒ {smartComponentName}
                    </span>
                  )}
                  {evaluation.status === 'ok' && (
                    <span className="text-green-700 font-medium">
                      Normal ⇒ {smartComponentName}
                    </span>
                  )}
                  {evaluation.status === 'unknown' && (
                    <span className="text-gray-500 font-medium">
                      Keine Daten ⇒ {smartComponentName}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              {getStatusIcon('unknown')}
              <span className="text-gray-500">
                Keine Daten verfügbar
              </span>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Table Layout with group summaries */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-700">Komponente</th>
              <th className="text-left py-2 px-2 font-medium text-gray-700 whitespace-nowrap" style={{ width: '180px' }}>
                <span className="font-medium">Monatswerte </span>
                <span className="text-xs font-normal text-gray-500">({monthsHeader.replace('Monatswerte ', '')})</span>
              </th>
              <th className="text-right py-2 px-4 font-medium text-gray-700" style={{ width: '180px', minWidth: '180px' }}>∑ (kWh/a)</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Bewertung</th>
            </tr>
          </thead>
          <tbody>
            {/* Netz Group */}
            {groupedEntries.netz.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => 
              renderIndividualRow(key, value)
            )}

            {/* Wärmepumpe Group */}
            {groupedEntries.waermepumpe.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => 
              renderIndividualRow(key, value)
            )}

            {/* Kessel Group */}
            {groupedEntries.kessel.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => 
              renderIndividualRow(key, value)
            )}

            {/* Wärmepumpe-Strom Group */}
            {groupedEntries.waermepumpeStrom.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => 
              renderIndividualRow(key, value)
            )}

            {/* Sonstige Group */}
            {groupedEntries.sonstige.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => 
              renderIndividualRow(key, value)
            )}
          </tbody>
        </table>
      </div>
      {/* Energetische Zusammenfassung */}
      {Object.keys(monthlyConsumption).length > 0 && (() => {
        // Bestimme Zeitbereich aus den verfügbaren Daten
        let minDate: Date | null = null;
        let maxDate: Date | null = null;
        
        Object.values(monthlyConsumption).forEach((meterData: any) => {
          if (meterData?.monthlyData) {
            meterData.monthlyData.forEach((data: any) => {
              if (data.date) {
                const date = new Date(data.date);
                if (!minDate || date < minDate) minDate = date;
                if (!maxDate || date > maxDate) maxDate = date;
              }
            });
          }
        });
        
        let zeitbereich = '';
        if (minDate && maxDate) {
          const minMonth = (minDate as Date).toLocaleDateString('de-DE', { month: 'short' });
          const maxMonth = (maxDate as Date).toLocaleDateString('de-DE', { month: 'short' });
          const minYear = (minDate as Date).getFullYear();
          const maxYear = (maxDate as Date).getFullYear();
          
          if (minYear === maxYear) {
            zeitbereich = ` (${minMonth}-${maxMonth} ${minYear})`;
          } else {
            zeitbereich = ` (${minMonth} ${minYear} - ${maxMonth} ${maxYear})`;
          }
        }
        
        return (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg pl-[0px] pr-[0px] pt-[0px] pb-[0px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verbraucher - Direkte Berechnung */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2 border-b border-blue-300 pb-2 text-sm">
                  <div className="text-blue-600">
                    {getComponentProps('netz').icon}
                  </div>
                  <span>Verbraucher</span>
                </h4>
                <div className="space-y-2">
                  {(() => {
                    // Sammle alle Netz-Verbraucher aus monthlyConsumption
                    const verbraucherData: Array<{key: string, sum: number, name: string, type: string, originalKey: string}> = [];
                    
                    Object.entries(selectedObjectMeter).forEach(([key, value]) => {
                      if (key === 'ZLOGID') return;
                      
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return;
                      
                      // Berechne Summe für diesen Zähler
                      const sum = meterData.monthlyData.reduce((total: number, data: any) => 
                        total + Math.abs(data.diffEn || 0), 0
                      ) / 1000; // Convert to kWh
                      
                      if (sum <= 0) return;
                      
                      // Nur Netz-Zähler (Z20541-Z20543 range)
                      if (key.match(/^Z2054[1-3]/)) {
                        const number = key.replace(/^Z2054/, '') || '1';
                        verbraucherData.push({
                          key,
                          sum: Math.round(sum),
                          name: `Netz ${number}`,
                          type: 'netz',
                          originalKey: key
                        });
                      }
                    });
                    
                    // Sortiere nach Verbrauch absteigend
                    verbraucherData.sort((a, b) => b.sum - a.sum);
                    
                    // Intelligente Namensgebung: Erstelle neues Array mit korrekten Namen
                    const finalVerbraucherData = verbraucherData.map((item, index) => ({
                      ...item,
                      name: verbraucherData.length === 1 ? 'Netz' : item.name
                    }));
                    
                    // Berechne Gesamtsumme
                    const totalVerbrauch = finalVerbraucherData.reduce((total, item) => total + item.sum, 0);
                    
                    return (
                      <>
                        {finalVerbraucherData.map((verbraucher, index) => {
                          // Berechne Effizienzwert nur für den ersten Verbraucher mit Fläche
                          const area = selectedObject?.objdata?.area;
                          const efficiencyValue = area && area > 0 ? Math.round(verbraucher.sum / area) : null;
                          
                          return (
                            <div key={verbraucher.key}>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <div className="text-blue-600">
                                    {getComponentProps('netz').icon}
                                  </div>
                                  <span className="text-blue-700 text-sm">{verbraucher.name}</span>
                                </div>
                                <span className="font-bold text-blue-800 text-sm">
                                  {Math.round(verbraucher.sum).toLocaleString('de-DE')} kWh
                                </span>
                              </div>
                              {index === 0 && area && area > 0 && (
                                <div className="mt-1 ml-5 text-sm text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Nutzfläche</span>
                                    <span>{area.toLocaleString('de-DE')} m²</span>
                                  </div>
                                  {efficiencyValue && (
                                    <div className="flex justify-between">
                                      <span>Effizienz</span>
                                      <span className="font-semibold">{efficiencyValue} kWh/m²</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {finalVerbraucherData.length > 1 && (
                          <div className="pt-2 mt-2 border-t border-blue-300">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-blue-800 text-sm">Gesamt Verbrauch</span>
                              <span className="text-blue-900 text-sm">
                                {Math.round(totalVerbrauch).toLocaleString('de-DE')} kWh
                              </span>
                            </div>
                          </div>
                        )}
                        {finalVerbraucherData.length === 0 && (
                          <div className="text-gray-500 text-sm">
                            Keine Verbraucher-Daten verfügbar
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Erzeuger - Einzelne Komponenten */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2 border-b border-gray-300 pb-2 text-sm">
                  <div className="text-yellow-500">
                    {getComponentProps('waermepumpe-strom').icon}
                  </div>
                  <span>Erzeuger</span>
                </h4>
                <div className="space-y-2">
                  {(() => {
                    // Sammle alle Erzeuger-Daten aus monthlyConsumption
                    const erzeugerData: Array<{key: string, sum: number, type: 'waermepumpe' | 'kessel', name: string, icon: any}> = [];
                    
                    // Durchsuche alle Zähler nach Erzeugern
                    Object.entries(selectedObjectMeter).forEach(([key, value]) => {
                      if (key === 'ZLOGID') return;
                      
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return;
                      
                      // Berechne Summe für diesen Zähler
                      const sum = meterData.monthlyData.reduce((total: number, data: any) => 
                        total + Math.abs(data.diffEn || 0), 0
                      ) / 1000; // Convert to kWh
                      
                      if (sum <= 0) return;
                      
                      // Bestimme Typ und Name
                      if (key.match(/^Z2024[1-3]/)) {
                        const number = key.replace(/^Z2024/, '') || '1';
                        erzeugerData.push({
                          key,
                          sum: Math.round(sum),
                          type: 'waermepumpe',
                          name: `Wärmepumpe ${number}`,
                          icon: getComponentProps('waermepumpe').icon
                        });
                      } else if (key.match(/^Z2014[1-3]/)) {
                        const number = key.replace(/^Z2014/, '') || '1';
                        erzeugerData.push({
                          key,
                          sum: Math.round(sum),
                          type: 'kessel',
                          name: `Kessel ${number}`,
                          icon: getComponentProps('kessel').icon
                        });
                      }
                    });
                    
                    // Sortiere nach Verbrauch absteigend
                    erzeugerData.sort((a, b) => b.sum - a.sum);
                    
                    // Intelligente Namensgebung für Erzeuger: Erstelle neues Array mit korrekten Namen
                    const waermepumpenCount = erzeugerData.filter(e => e.type === 'waermepumpe').length;
                    const kesselCount = erzeugerData.filter(e => e.type === 'kessel').length;
                    
                    const finalErzeugerData = erzeugerData.map((erzeuger) => ({
                      ...erzeuger,
                      name: erzeuger.type === 'waermepumpe' && waermepumpenCount === 1 
                        ? 'Wärmepumpe'
                        : erzeuger.type === 'kessel' && kesselCount === 1
                        ? 'Kessel'
                        : erzeuger.name
                    }));
                    
                    // Berechne Gesamtsumme
                    const totalErzeuger = finalErzeugerData.reduce((total, item) => total + item.sum, 0);
                    
                    return (
                      <>
                        {finalErzeugerData.map((erzeuger) => {
                          const anteil = totalErzeuger > 0 ? (erzeuger.sum / totalErzeuger * 100) : 0;
                          
                          // Typ-spezifische Farben
                          const textColor = erzeuger.type === 'waermepumpe' ? 'text-green-700' : 'text-purple-800';
                          const percentColor = erzeuger.type === 'waermepumpe' ? 'text-green-600' : 'text-purple-600';
                          
                          return (
                            <div key={erzeuger.key} className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div className={erzeuger.type === 'waermepumpe' ? 'text-green-600' : 'text-purple-600'}>
                                  {erzeuger.icon}
                                </div>
                                <span className={`${textColor} text-sm`}>
                                  {erzeuger.name}
                                </span>
                                <span className={`${percentColor} font-bold text-sm`}>
                                  ({Math.round(anteil)}%)
                                </span>
                              </div>
                              <span className={`font-bold ${textColor} text-sm`}>
                                {Math.round(erzeuger.sum).toLocaleString('de-DE')} kWh
                              </span>
                            </div>
                          );
                        })}
                        {finalErzeugerData.length === 0 && (
                          <div className="text-gray-500 text-sm">
                            Keine Erzeuger-Daten verfügbar
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Cards nebeneinander */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regenerativer Anteil KPI-Card */}
              {(() => {
                // Fallback-Bilanz-Berechnung wenn API nicht verfügbar
                if (!energyBalance && !isCalculating) {
                  // Berechne Erzeuger (Kessel + Wärmepumpe)
                  const erzeugerSum = Object.entries(selectedObjectMeter)
                    .filter(([key]) => key.match(/^Z2014[1-3]/) || key.match(/^Z2024[1-3]/))
                    .reduce((total, [key]) => {
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return total;
                      const sum = meterData.monthlyData.reduce((acc: number, data: any) => 
                        acc + Math.abs(data.diffEn || 0), 0
                      ) / 1000;
                      return total + sum;
                    }, 0);
                  
                  // Regenerativer Anteil (Summe der Wärmepumpen)
                  const waermepumpenSum = Object.entries(selectedObjectMeter)
                    .filter(([key]) => key.match(/^Z2024[1-3]/))
                    .reduce((total, [key]) => {
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return total;
                      const sum = meterData.monthlyData.reduce((acc: number, data: any) => 
                        acc + Math.abs(data.diffEn || 0), 0
                      ) / 1000;
                      return total + sum;
                    }, 0);
                  const regenerativerAnteilProzent = erzeugerSum > 0 ? (waermepumpenSum / erzeugerSum * 100) : 0;

                  if (erzeugerSum > 0) {
                    return (
                      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              {getComponentProps('waermepumpe').icon}
                            </div>
                            <div>
                              <h4 className="text-gray-700 font-medium text-sm">Regenerativer Anteil</h4>
                              <p className="text-gray-500 mt-1 text-sm">{Math.round(waermepumpenSum).toLocaleString('de-DE')} kWh</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 text-[18px]">
                              {Math.round(regenerativerAnteilProzent)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                
                // API-basierte Regenerativer Anteil
                if (energyBalance) {
                  const waermepumpenErzeugung = (energyBalance as any).waermepumpenErzeugung || 0;
                  const gesamtErzeugung = energyBalance.gesamtErzeugung || 0;
                  const apiRegenerativerAnteilProzent = waermepumpenErzeugung && gesamtErzeugung > 0 
                    ? (waermepumpenErzeugung / gesamtErzeugung * 100) 
                    : 0;
                  
                  return (
                    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Leaf className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-gray-700 font-medium text-sm">Regenerativer Anteil</h4>
                            <p className="text-gray-500 mt-1 text-sm">{Math.round(waermepumpenErzeugung).toLocaleString('de-DE')} kWh</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {Math.round(apiRegenerativerAnteilProzent)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}

              {/* Energiebilanz Card */}
              {(() => {
                // Fallback-Bilanz-Berechnung wenn API nicht verfügbar
                if (!energyBalance && !isCalculating) {
                  // Berechne Verbraucher (Netz)
                  const verbraucherSum = Object.entries(selectedObjectMeter)
                    .filter(([key]) => key.match(/^Z2054[1-3]/))
                    .reduce((total, [key]) => {
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return total;
                      const sum = meterData.monthlyData.reduce((acc: number, data: any) => 
                        acc + Math.abs(data.diffEn || 0), 0
                      ) / 1000;
                      return total + sum;
                    }, 0);
                  
                  // Berechne Erzeuger (Kessel + Wärmepumpe)
                  const erzeugerSum = Object.entries(selectedObjectMeter)
                    .filter(([key]) => key.match(/^Z2014[1-3]/) || key.match(/^Z2024[1-3]/))
                    .reduce((total, [key]) => {
                      const meterData = monthlyConsumption[key];
                      if (!meterData?.monthlyData) return total;
                      const sum = meterData.monthlyData.reduce((acc: number, data: any) => 
                        acc + Math.abs(data.diffEn || 0), 0
                      ) / 1000;
                      return total + sum;
                    }, 0);
                  
                  const verluste = erzeugerSum - verbraucherSum;
                  const verlusteInProzent = erzeugerSum > 0 ? (verluste / erzeugerSum * 100) : 0;
                  
                  let bewertung = '';
                  let farbKlasse = '';
                  if (verlusteInProzent < 10) {
                    bewertung = 'kaum Verluste';
                    farbKlasse = 'text-green-600';
                  } else if (verlusteInProzent < 20) {
                    bewertung = 'Kontrolle erforderlich';
                    farbKlasse = 'text-orange-600';
                  } else {
                    bewertung = 'Kritisch';
                    farbKlasse = 'text-red-600';
                  }
                  
                  if (verbraucherSum > 0 || erzeugerSum > 0) {
                    return (
                      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-gray-800 text-sm mb-4 font-normal">Energiebilanz{zeitbereich}</h4>
                        <div className="space-y-3 text-right">
                          <div className="text-gray-600 text-sm">
                            Summe Verbraucher: <span className="font-bold text-sm">{Math.round(verbraucherSum).toLocaleString('de-DE')} kWh</span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            Summe Erzeuger: <span className="font-bold text-sm">{Math.round(erzeugerSum).toLocaleString('de-DE')} kWh</span>
                          </div>
                          <hr className="border-gray-300" />
                          <div className={`${farbKlasse} font-medium text-right text-sm`}>
                            Anlagenverlust ({bewertung}): <span className="font-bold text-sm">{verluste > 0 ? '-' : '+'}{Math.round(Math.abs(verluste)).toLocaleString('de-DE')} kWh ({Math.round(Math.abs(verlusteInProzent))}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                
                // API-basierte Energiebilanz
                if (energyBalance) {
                  return (
                    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="text-gray-800 font-medium text-sm mb-4">Energiebilanz ({energyBalance.zeitbereich})</h4>
                      <div className="space-y-3 text-right">
                        <div className="text-gray-600 text-sm">
                          Summe Verbraucher: <span className="font-bold">{Math.round(energyBalance.netzVerbrauch).toLocaleString('de-DE')} kWh</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          Summe Erzeuger: <span className="font-bold">{Math.round(energyBalance.gesamtErzeugung).toLocaleString('de-DE')} kWh</span>
                        </div>
                        <hr className="border-gray-300" />
                        <div className={`${energyBalance.farbKlasse} font-medium text-right text-sm`}>
                          Anlagenverlust ({energyBalance.bewertung}): <span className="font-bold">-{Math.round(energyBalance.verlusteAbs).toLocaleString('de-DE')} kWh ({Math.round(energyBalance.verlusteInProzent)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
            {isCalculating && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-blue-800 font-medium">KI analysiert Energiebilanz...</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};