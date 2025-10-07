import React, { useState, useEffect } from "react";
import { Zap, Brain } from "lucide-react";
import { 
  getComponentType, 
  getComponentProps, 
  getSmartComponentName, 
  evaluateDailyConsumption, 
  getStatusIcon, 
  formatKWh, 
  EnergyBarChart, 
  groupMeterEntries,
  type DailyData,
  type EvaluationResult
} from "./shared/energy-utils";

interface DailyConsumption {
  [meterKey: string]: {
    meterId: number;
    dailyData: DailyData[];
  };
}

interface KIEnergyProps {
  selectedObjectMeter: Record<string, string | number>;
  dailyConsumption: DailyConsumption;
  showJahresAnalysis?: boolean;
  setShowJahresAnalysis?: (show: boolean) => void;
}

// Optimierte renderRow-Funktion
const renderMeterRow = (
  key: string, 
  value: string | number, 
  dailyConsumption: DailyConsumption, 
  allKeys: string[]
) => {
  const meterDailyData = dailyConsumption?.[key]?.dailyData || [];
  const evaluation = evaluateDailyConsumption(meterDailyData);
  
  // Verwende neue Utility-Funktionen
  const { type, number } = getComponentType(key);
  const { name, icon, bgColor, textColor } = getComponentProps(type);
  const smartName = getSmartComponentName(name, number, allKeys);
  
  const maxValue = Math.max(...(meterDailyData.length > 0 ? meterDailyData.map(d => d.diffEn / 1000) : [1]), 1);

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
              {smartName}
            </div>
            <div className="text-sm text-gray-600">
              {key}: {typeof value === 'number' ? value.toString().replace(/\./g, '') : String(value)}
            </div>
          </div>
        </div>
      </td>
      
      {/* Tageswerte Column */}
      <td className="py-2 px-4">
        <div className="flex items-center">
          {meterDailyData.length > 0 ? (
            <div className="mr-3">
              <EnergyBarChart 
                data={meterDailyData.slice(-7).map(data => ({
                  value: data.diffEn / 1000,
                  date: new Date(data.date).toLocaleDateString('de-DE', { weekday: 'short' })
                }))}
                maxValue={maxValue}
                componentType={type}
                isMonthly={false}
              />
            </div>
          ) : (
            <div className="text-gray-500 text-sm mr-3">Keine Daten verfügbar</div>
          )}
          
          <div className="text-right text-xs space-y-0.5" style={{ minWidth: '100px' }}>
            {meterDailyData.length > 0 ? (
              <>
                <div className="font-medium text-gray-800">
                  <span className="inline-block w-8">MAX:</span> {formatKWh(Math.max(...meterDailyData.map(d => d.diffEn / 1000)))} kWh
                </div>
                <div className="font-medium text-gray-600">
                  <span className="inline-block w-8">Ø:</span> {formatKWh(meterDailyData.reduce((sum, d) => sum + d.diffEn / 1000, 0) / meterDailyData.length)} kWh
                </div>
                <div className="font-medium text-gray-500">
                  <span className="inline-block w-8">MIN:</span> {formatKWh(Math.min(...meterDailyData.map(d => d.diffEn / 1000)))} kWh
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-gray-400"><span className="inline-block w-8">MAX:</span> 0 kWh</div>
                <div className="font-medium text-gray-400"><span className="inline-block w-8">Ø:</span> 0 kWh</div>
                <div className="font-medium text-gray-400"><span className="inline-block w-8">MIN:</span> 0 kWh</div>
              </>
            )}
          </div>
        </div>
      </td>
      
      {/* Bewertung Column */}
      <td className="py-2 px-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(evaluation.status)}
          <div>
            {evaluation.status === 'critical' && evaluation.criticalDays > 0 && (
              <>
                <span className="text-red-700 font-medium">
                  Kritisch! Keine Energie an {evaluation.criticalDays} Tag{evaluation.criticalDays > 1 ? 'en' : ''}
                </span>
                <div className="text-xs text-red-600">
                  Anlage prüfen ⇒ {smartName}
                </div>
              </>
            )}
            {evaluation.status === 'kontrolle' && (
              <span className="text-orange-700 font-medium">
                Kontrolle! Anlage ⇒ {smartName}
              </span>
            )}
            {evaluation.status === 'ok' && (
              <span className="text-green-700 font-medium">
                Normal ⇒ {smartName}
              </span>
            )}
            {evaluation.status === 'unknown' && (
              <span className="text-gray-500 font-medium">
                Keine Daten ⇒ {smartName}
              </span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export const KIEnergyAnalysis: React.FC<KIEnergyProps> = ({ 
  selectedObjectMeter, 
  dailyConsumption, 
  showJahresAnalysis, 
  setShowJahresAnalysis 
}) => {
  const [dots, setDots] = useState('.');
  if (!selectedObjectMeter || Object.keys(selectedObjectMeter).length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center text-gray-500">
            <Brain className="h-5 w-5 mr-2 animate-pulse text-blue-500" />
            <span>Keine Zählerdaten verfügbar</span>
          </div>
        </div>
      </div>
    );
  }

  const allKeys = Object.keys(selectedObjectMeter).filter(k => k !== 'ZLOGID');
  const groupedEntries = groupMeterEntries(selectedObjectMeter);

  // Berechne Fortschritt für Datenladung
  const totalMeters = allKeys.length;
  const loadedMeters = allKeys.filter(key => {
    const meterData = dailyConsumption[key];
    // Ein Meter ist "geladen" wenn:
    // 1. Er hat Daten (dailyData.length > 0) ODER
    // 2. Er hat explizit eine leere Datenstruktur (dailyData existiert aber ist leer - bedeutet "keine Daten verfügbar")
    return meterData?.dailyData !== undefined;
  }).length;
  const isFullyLoaded = loadedMeters === totalMeters && totalMeters > 0;

  // Animiere die Ladepunkte
  useEffect(() => {
    if (!isFullyLoaded && totalMeters > 0) {
      const interval = setInterval(() => {
        setDots(prevDots => {
          switch (prevDots) {
            case '.': return '..';
            case '..': return '...';
            case '...': return '....';
            case '....': return '.';
            default: return '.';
          }
        });
      }, 500); // Wechsle alle 500ms

      return () => clearInterval(interval);
    }
  }, [isFullyLoaded, totalMeters]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-800 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-orange-500" />
          Energiezähler KI-7-Tage-Analyse
          {!isFullyLoaded && totalMeters > 0 && (
            <span className="ml-2 text-sm font-normal text-blue-600">
              ( {dots} lade )
            </span>
          )}
        </h4>
        
        {setShowJahresAnalysis && (
          <button
            onClick={() => setShowJahresAnalysis(true)}
            className="px-3 py-1 text-sm rounded-md border transition-colors flex items-center space-x-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <Brain className="h-3 w-3" />
            <span>Jahresanalyse</span>
          </button>
        )}
      </div>
      
      {/* Optimierte Tabelle */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-700">Komponente</th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">
                Tageswerte <span className="text-sm font-normal text-gray-500">(letzte 7 Tage - kWh)</span>
              </th>
              <th className="text-left py-2 px-4 font-medium text-gray-700">Bewertung</th>
            </tr>
          </thead>
          <tbody>
            {/* Netz Group */}
            {groupedEntries.netz.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => renderMeterRow(key, value, dailyConsumption, allKeys))}
            
            {/* Wärmepumpe Group */}
            {groupedEntries.waermepumpe.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => renderMeterRow(key, value, dailyConsumption, allKeys))}
            
            {/* Kessel Group */}
            {groupedEntries.kessel.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => renderMeterRow(key, value, dailyConsumption, allKeys))}
            
            {/* Wärmepumpe-Strom Group */}
            {groupedEntries.waermepumpeStrom.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => renderMeterRow(key, value, dailyConsumption, allKeys))}
            
            {/* Sonstige Group */}
            {groupedEntries.sonstige.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => renderMeterRow(key, value, dailyConsumption, allKeys))}
          </tbody>
        </table>
      </div>
    </div>
  );
};