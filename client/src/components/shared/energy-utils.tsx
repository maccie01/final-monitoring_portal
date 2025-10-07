import React from "react";
import { Share2, Leaf, Flame, Zap, Settings, XCircle, AlertTriangle, Check } from "lucide-react";

// Gemeinsame Typen
export interface DailyData {
  date: string;
  diffEn: number;
}

export interface MonthlyData {
  date: string;
  diffEn: number;
}

export interface MeterData {
  meterId: string | number;
  values?: number[];
  dailyData?: DailyData[];
  monthlyData?: MonthlyData[];
}

export interface EvaluationResult {
  status: 'critical' | 'kontrolle' | 'ok' | 'unknown';
  criticalDays: number;
  zeroDays: number;
  lowDays: number;
  kontrolleDays: number;
}

// Komponententyp-Erkennung
export const getComponentType = (key: string) => {
  if (key.match(/^Z2054[1-3]/)) return { type: 'netz', number: key.slice(-1) };
  if (key.match(/^Z2014[1-3]/)) return { type: 'kessel', number: key.slice(-1) };
  if (key.match(/^Z2024[1-3]/)) return { type: 'waermepumpe', number: key.slice(-1) };
  if (key.match(/^Z2022\d*/)) return { type: 'waermepumpe-strom', number: key.slice(-1) };
  return { type: 'sonstiges', number: '' };
};

// Komponenten-Eigenschaften basierend auf Typ
export const getComponentProps = (type: string) => {
  const props = {
    netz: {
      name: 'Netz',
      icon: <Share2 className="h-4 w-4" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      barColor: 'bg-blue-400'
    },
    kessel: {
      name: 'Kessel',
      icon: <Flame className="h-4 w-4" />,
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-800',
      barColor: 'bg-violet-500'
    },
    waermepumpe: {
      name: 'Wärmepumpe',
      icon: <Leaf className="h-4 w-4" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      barColor: 'bg-green-400'
    },
    'waermepumpe-strom': {
      name: 'Wärmepumpe-Strom',
      icon: <Zap className="h-4 w-4" />,
      bgColor: 'bg-gray-100',
      textColor: 'text-black',
      barColor: 'bg-yellow-400'
    },
    sonstiges: {
      name: 'Sonstiges',
      icon: <Settings className="h-4 w-4" />,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      barColor: 'bg-gray-400'
    }
  };
  return props[type as keyof typeof props] || props.sonstiges;
};

// Intelligente Namensgebung
export const getSmartComponentName = (
  componentType: string, 
  componentNumber: string, 
  allKeys: string[]
) => {
  if (!componentNumber) return componentType;
  
  const sameTypeCount = allKeys.filter(k => {
    if (componentType === 'Netz') return k.match(/^Z2054[1-3]/);
    if (componentType === 'Kessel') return k.match(/^Z2014[1-3]/);
    if (componentType === 'Wärmepumpe') return k.match(/^Z2024[1-3]/);
    return false;
  }).length;
  
  return sameTypeCount === 1 ? componentType : `${componentType} ${componentNumber}`;
};

// Evaluierung für tägliche Daten
export const evaluateDailyConsumption = (dailyData: DailyData[]): EvaluationResult => {
  if (!dailyData || dailyData.length === 0) {
    return { status: 'unknown', criticalDays: 0, zeroDays: 0, lowDays: 0, kontrolleDays: 0 };
  }
  
  let criticalDays = 0;
  let zeroDays = 0;
  let lowDays = 0;
  let kontrolleDays = 0;
  
  dailyData.forEach(day => {
    const diffEnKWh = day.diffEn / 1000;
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

// Evaluierung für monatliche Daten
export const evaluateMonthlyConsumption = (monthlyData: MonthlyData[] | number[]): EvaluationResult => {
  if (!Array.isArray(monthlyData)) {
    return { status: 'unknown', criticalDays: 0, zeroDays: 0, lowDays: 0, kontrolleDays: 0 };
  }
  
  const values = monthlyData.length > 0 && typeof monthlyData[0] === 'object' 
    ? (monthlyData as MonthlyData[]).map(d => d.diffEn)
    : (monthlyData as number[]);

  if (values.length === 0) {
    return { status: 'unknown', criticalDays: 0, zeroDays: 0, lowDays: 0, kontrolleDays: 0 };
  }
  
  let criticalMonths = 0;
  let zeroMonths = 0;
  let lowMonths = 0;
  let kontrolleMonths = 0;
  
  values.forEach(kWhValue => {
    if (kWhValue === 0) {
      zeroMonths++;
      criticalMonths++;
    } else if (kWhValue < 20000) { // 20 kWh = 20.000 Wh
      kontrolleMonths++;
    }
  });
  
  if (criticalMonths === values.length && values.length >= 12) {
    return { status: 'critical', criticalDays: criticalMonths, zeroDays: zeroMonths, lowDays: lowMonths, kontrolleDays: kontrolleMonths };
  } else if (criticalMonths > 0) {
    return { status: 'critical', criticalDays: criticalMonths, zeroDays: zeroMonths, lowDays: lowMonths, kontrolleDays: kontrolleMonths };
  } else if (kontrolleMonths > 0) {
    return { status: 'kontrolle', criticalDays: criticalMonths, zeroDays: zeroMonths, lowDays: lowMonths, kontrolleDays: kontrolleMonths };
  } else {
    return { status: 'ok', criticalDays: criticalMonths, zeroDays: zeroMonths, lowDays: lowMonths, kontrolleDays: kontrolleMonths };
  }
};

// Status-Icon Komponente - erweitert für verschiedene Status-Typen
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'kontrolle':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'ok':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'success':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'online':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'offline':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  }
};

// Status-Farben für Badges
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'testing':
    case 'creating':
    case 'deleting':
    case 'copying':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Formatierung
export const formatKWh = (value: number): string => {
  return Math.round(value).toLocaleString('de-DE');
};

export const formatPercentage = (value: number): string => {
  return Math.round(value).toString();
};

// Bar-Chart Komponente
export interface BarChartProps {
  data: Array<{ value: number; date?: string; month?: string }>;
  maxValue: number;
  componentType: string;
  isMonthly?: boolean;
}

export const EnergyBarChart: React.FC<BarChartProps> = ({ 
  data, 
  maxValue, 
  componentType,
  isMonthly = false 
}) => {
  const { barColor } = getComponentProps(componentType);
  
  return (
    <div className="flex flex-col">
      {/* Balken Container */}
      <div className="flex items-end space-x-0 mb-1">
        {data.map((item, index) => {
          const value = isMonthly ? item.value / 1000 : item.value;
          const height = Math.max((value / maxValue) * 60, 4);
          const isZeroValue = value === 0;
          const isLowValue = isMonthly ? value < 20 : value < 10;
          
          let barColorClass = barColor;
          if (isZeroValue) {
            barColorClass = 'bg-red-500';
          } else if (isLowValue) {
            barColorClass = 'bg-orange-400';
          }
          
          return (
            <div 
              key={index}
              className="flex flex-col items-center"
              style={{ minWidth: isMonthly ? '24px' : '18px' }}
            >
              <div
                className={`${isMonthly ? 'w-6' : 'w-4'} ${barColorClass} transition-all duration-200 hover:opacity-80`}
                style={{ height: `${height}px` }}
                title={`${isMonthly ? item.month || item.date : item.date}: ${formatKWh(value)} kWh`}
              />
              {isZeroValue && (
                <div className={`${isMonthly ? 'w-6' : 'w-4'} h-px bg-red-500 mt-1`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Labels Container - nur für tägliche Daten */}
      {!isMonthly && (
        <div className="flex space-x-0">
          {data.map((item, index) => (
            <div 
              key={index}
              className={`${isMonthly ? 'w-6' : 'w-4'} text-center`}
              style={{ minWidth: isMonthly ? '24px' : '18px' }}
            >
              <div className="text-xs text-gray-500 font-medium">
                {item.date || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Gruppierung der Meter-Einträge
export const groupMeterEntries = (selectedObjectMeter: Record<string, any>) => {
  const entries = Object.entries(selectedObjectMeter).filter(([key]) => key !== 'ZLOGID');
  return {
    netz: entries.filter(([key]) => key.match(/^Z2054[1-3]/)),
    waermepumpe: entries.filter(([key]) => key.match(/^Z2024[1-3]/)),
    kessel: entries.filter(([key]) => key.match(/^Z2014[1-3]/)),
    waermepumpeStrom: entries.filter(([key]) => key.match(/^Z2022\d*/)),
    sonstige: entries.filter(([key]) => !key.match(/^Z2054[1-3]/) && !key.match(/^Z2024[1-3]/) && !key.match(/^Z2014[1-3]/) && !key.match(/^Z2022\d*/))
  };
};