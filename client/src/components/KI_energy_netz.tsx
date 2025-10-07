import React, { useState } from "from "react"";
import { FileText, Brain, Leaf, ShareIcon } from "from "lucide-react"";
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

interface KIEnergyNetzProps {
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
  isLoading?: boolean;
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

export const KIEnergyAnalysisNetz = ({ selectedObjectMeter, monthlyConsumption, selectedObjectId, timeRange, allTimeRangeData, selectedObject, isLoading }: KIEnergyNetzProps) => {
  // Filter nur Netz-Meter (Z2054x Pattern)  
  const netzKeys = Object.keys(selectedObjectMeter).filter(k => k !== 'ZLOGID' && k.match(/^Z2054\d*/));
  
  // Get area for kWh/m² calculations
  const area = selectedObject?.objdata?.area || 1;

  // Calculate data for yearly totals (365-day data for current year)
  const calculateYearTotals = (yearData: any, yearLabel: string) => {
    if (!yearData || !netzKeys.length) return null;
    
    let totalConsumption = 0;
    
    // Sum up all network meters (all available data for totals)
    netzKeys.forEach(key => {
      const meterData = yearData[key];
      if (meterData?.monthlyData) {
        meterData.monthlyData.forEach((data: any) => {
          const monthlyKWh = (data.diffEn || 0) / 1000;
          totalConsumption += monthlyKWh;
        });
      }
    });
    
    return {
      year: yearLabel,
      totalConsumption: Math.round(totalConsumption),
      totalConsumptionPerM2: Math.round(totalConsumption / area),
      hasData: totalConsumption > 0
    };
  };

  // Calculate monthly data for bar charts (Jan-current month for current year)
  const calculateMonthlyData = (yearData: any, yearLabel: string) => {
    if (!yearData || !netzKeys.length) return [];
    
    let monthlyData: Array<{month: string, value: number}> = [];
    
    // Initialize months
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    monthlyData = months.map(month => ({month, value: 0}));
    
    // For current year, limit to current month
    const currentMonth = new Date().getMonth(); // 0-11, September = 8
    const currentYear = new Date().getFullYear();
    const isCurrentYear = yearLabel === String(currentYear);
    
    // Sum up all network meters
    netzKeys.forEach(key => {
      const meterData = yearData[key];
      if (meterData?.monthlyData) {
        meterData.monthlyData.forEach((data: any) => {
          const date = new Date(data.date);
          const monthIndex = date.getMonth();
          
          // For current year: only include months from Jan (0) to current month (Sep = 8)
          if (isCurrentYear && monthIndex > currentMonth) {
            return; // Skip future months for current year
          }
          
          const monthlyKWh = (data.diffEn || 0) / 1000;
          if (monthlyData[monthIndex]) {
            monthlyData[monthIndex].value += monthlyKWh;
          }
        });
      }
    });
    
    return monthlyData;
  };

  // Get data for each year
  const currentYear = new Date().getFullYear();
  
  // Totals for Spalte 1 (365-Tage für aktuelles Jahr)
  const totals2025 = calculateYearTotals(allTimeRangeData?.['last-365-days'], '2025');
  const totals2024 = calculateYearTotals(allTimeRangeData?.['last-year'] || monthlyConsumption, '2024');
  const totals2023 = calculateYearTotals(allTimeRangeData?.['year-before-last'], '2023');
  
  // Monthly data for Spalte 2 (Jan-aktueller Monat für aktuelles Jahr)
  const monthly2025 = calculateMonthlyData(allTimeRangeData?.['last-365-days'], '2025');
  const monthly2024 = calculateMonthlyData(allTimeRangeData?.['last-year'] || monthlyConsumption, '2024');
  const monthly2023 = calculateMonthlyData(allTimeRangeData?.['year-before-last'], '2023');
  
  // Combine totals and monthly data
  const data2025 = totals2025 ? { ...totals2025, monthlyData: monthly2025 } : null;
  const data2024 = totals2024 ? { ...totals2024, monthlyData: monthly2024 } : null;
  const data2023 = totals2023 ? { ...totals2023, monthlyData: monthly2023 } : null;
  
  // Calculate trends with correct sign and direction
  const calculateTrend = (current: number, previous: number) => {
    if (!current || !previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      percent: Math.round(Math.abs(change)),
      isIncrease: change > 0,
      isDecrease: change < 0
    };
  };
  
  const trend2025 = data2025?.hasData && data2024?.hasData ? 
    calculateTrend(data2025.totalConsumptionPerM2, data2024.totalConsumptionPerM2) : null;
  const trend2024 = data2024?.hasData && data2023?.hasData ? 
    calculateTrend(data2024.totalConsumptionPerM2, data2023.totalConsumptionPerM2) : null;

  // Get year evaluation - only warn if >10% increase
  const getYearEvaluation = (yearData: any, trend: any) => {
    if (!yearData?.hasData) return null;
    
    // Only show warning if trend exists and is >10% increase
    if (trend?.isIncrease && trend.percent > 10) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-700 font-medium">Warnung → Energiebedarf erhöht</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">Normal → Netz</span>
        </div>
      );
    }
  };

  // Render bar chart for monthly data
  const renderBarChart = (monthlyData: Array<{month: string, value: number}>) => {
    const maxValue = Math.max(...monthlyData.map(d => d.value), 1);
    
    return (
      <div className="flex items-end space-x-1 h-20">
        {monthlyData.map((data, index) => {
          const height = Math.max((data.value / maxValue) * 60, 2);
          const valuePerM2 = Math.round(data.value / area);
          
          return (
            <div key={index} className="flex flex-col items-center" style={{ minWidth: '20px' }}>
              <div 
                className="bg-blue-400 rounded-t-sm w-4"
                style={{ 
                  height: `${height}px`,
                  minHeight: '2px'
                }}
                title={`${data.month}: ${Math.round(data.value)} kWh (${valuePerM2} kWh/m²)`}
              />
              <div className="text-xs text-gray-500 text-center mt-1 text-[10px]">
                {data.month}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading state with brain icon
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-blue-500 mb-4">
          <Brain className="h-12 w-12 mx-auto animate-pulse" />
        </div>
        <p className="text-blue-600 font-medium mb-2">KI-Auswertung</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        </div>
        <p className="text-sm text-gray-500 mt-3">Analysiere Netz-Verbrauchsdaten...</p>
      </div>
    );
  }

  // Wenn keine Netz-Meter vorhanden sind
  if (netzKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">
          <ShareIcon className="h-8 w-8 mx-auto text-gray-400" />
        </div>
        <p className="text-gray-500">Keine Netz-Meter gefunden</p>
        <p className="text-sm text-gray-400">Zähler mit Pattern Z2054x nicht verfügbar</p>
      </div>
    );
  }

  // Render bar chart for monthly data in kWh/m²
  const renderBarChartKWhM2 = (monthlyData: Array<{month: string, value: number}>) => {
    const monthlyDataKWhM2 = monthlyData.map(d => ({
      month: d.month,
      value: d.value / area // Convert to kWh/m²
    }));
    const maxValue = Math.max(...monthlyDataKWhM2.map(d => d.value), 1);
    
    return (
      <div className="flex items-end space-x-1 h-16">
        {monthlyDataKWhM2.map((data, index) => {
          const height = Math.max((data.value / maxValue) * 50, 2);
          const isZeroValue = data.value === 0;
          
          return (
            <div key={index} className="flex flex-col items-center" style={{ minWidth: '16px' }}>
              <div 
                className={isZeroValue ? "bg-gray-300 rounded-t-sm w-3" : "bg-blue-400 rounded-t-sm w-3"}
                style={{ 
                  height: `${height}px`,
                  minHeight: '2px'
                }}
                title={`${data.month}: ${Math.round(data.value)} kWh/m²`}
              />
              <div className="text-xs text-gray-500 text-center mt-1 text-[9px]">
                {data.month}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '200px' }}>
              Jahr & Verbrauch
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700" style={{ width: '300px' }}>
              Monatswerte kWh/m²
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '150px' }}>
              Bewertung
            </th>
          </tr>
        </thead>
        <tbody>
          {/* 2025 Row */}
          {data2025?.hasData && (
            <tr className="border-b border-gray-100 bg-blue-50">
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-blue-800">(-365T)</span>
                    {trend2025 && (
                      <div className="flex items-center space-x-1 text-sm">
                        <span className={trend2025.isIncrease ? "text-red-600" : "text-green-600"}>
                          {trend2025.isIncrease ? "↑" : "↓"}
                        </span>
                        <span className={trend2025.isIncrease ? "text-red-600" : "text-green-600"}>
                          {trend2025.percent}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {data2025.totalConsumptionPerM2} kWh/m²
                  </div>
                  <div className="text-sm text-gray-600">
                    {data2025.totalConsumption.toLocaleString('de-DE')} kWh
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <div className="text-xs text-gray-600 mb-2">
                  Monatswerte kWh/m² (Jan-Dez 2025)
                </div>
                <div className="flex justify-center">
                  {renderBarChartKWhM2(data2025.monthlyData)}
                </div>
              </td>
              <td className="py-4 px-4">
                {getYearEvaluation(data2025, trend2025)}
              </td>
            </tr>
          )}

          {/* 2024 Row */}
          {data2024?.hasData && (
            <tr className="border-b border-gray-100 bg-blue-50">
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-blue-800">2024</span>
                    {trend2024 && (
                      <div className="flex items-center space-x-1 text-sm">
                        <span className={trend2024.isIncrease ? "text-red-600" : "text-green-600"}>
                          {trend2024.isIncrease ? "↑" : "↓"}
                        </span>
                        <span className={trend2024.isIncrease ? "text-red-600" : "text-green-600"}>
                          {trend2024.percent}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {data2024.totalConsumptionPerM2} kWh/m²
                  </div>
                  <div className="text-sm text-gray-600">
                    {data2024.totalConsumption.toLocaleString('de-DE')} kWh
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <div className="text-xs text-gray-600 mb-2">
                  Monatswerte kWh/m² (Jan-Dez 2024)
                </div>
                <div className="flex justify-center">
                  {renderBarChartKWhM2(data2024.monthlyData)}
                </div>
              </td>
              <td className="py-4 px-4">
                {getYearEvaluation(data2024, trend2024)}
              </td>
            </tr>
          )}

          {/* 2023 Row */}
          {data2023?.hasData && (
            <tr className="border-b border-gray-100 bg-blue-50">
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-blue-800">2023</span>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {data2023.totalConsumptionPerM2} kWh/m²
                  </div>
                  <div className="text-sm text-gray-600">
                    {data2023.totalConsumption.toLocaleString('de-DE')} kWh
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <div className="text-xs text-gray-600 mb-2">
                  Monatswerte kWh/m² (Jan-Dez 2023)
                </div>
                <div className="flex justify-center">
                  {renderBarChartKWhM2(data2023.monthlyData)}
                </div>
              </td>
              <td className="py-4 px-4">
                {getYearEvaluation(data2023, null)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* No data message */}
      {!data2025?.hasData && !data2024?.hasData && !data2023?.hasData && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <ShareIcon className="h-8 w-8 mx-auto text-gray-400" />
          </div>
          <p className="text-gray-500">Keine Netz-Daten verfügbar</p>
          <p className="text-sm text-gray-400">Monatswerte für 2023/2024/2025 nicht gefunden</p>
        </div>
      )}
    </div>
  );
};