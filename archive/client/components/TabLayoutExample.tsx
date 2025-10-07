import React, { useState } from 'react';
import { Activity, Thermometer, Zap } from 'lucide-react';
import { 
  TabNavigation, 
  CounterSelectionGroup, 
  GrafanaIframeContainer,
  GrafanaSplitLayout,
  STANDARD_TIME_RANGES,
  type TabLayoutItem,
  type CounterSelection 
} from './TabLayout';

// Beispiel für die Verwendung der Tab Layout Components
export const TabLayoutExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState("now-7d");
  const [selectedCounters, setSelectedCounters] = useState<Record<string, string>>({
    'netz-panel': 'Z20541',
    'kessel-panel': 'Z20141'
  });

  // Tab-Konfiguration
  const tabs: TabLayoutItem[] = [
    {
      id: 'netzwaechter',
      label: 'Netzwächter',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: 'kesselwaechter', 
      label: 'Kesselwächter',
      icon: <Thermometer className="h-4 w-4" />,
    },
    {
      id: 'waermepumpe',
      label: 'Wärmepumpe',
      icon: <Zap className="h-4 w-4" />,
    }
  ];

  // Counter Selections für verschiedene Panels
  const counterSelections: CounterSelection[] = [
    {
      id: 'netz-panel',
      label: 'Wärmezähler Netz - Übersicht', 
      title: 'Wärmezähler Netz - Übersicht',
      options: [
        { id: 'Z20541', label: 'Netz 1' },
        { id: 'Z20542', label: 'Netz 2' },
        { id: 'Z20543', label: 'Netz 3' }
      ],
      selectedValue: selectedCounters['netz-panel'],
      onSelect: (value) => setSelectedCounters(prev => ({ ...prev, 'netz-panel': value }))
    },
    {
      id: 'kessel-panel',
      label: 'Wärmezähler Kessel - Übersicht',
      title: 'Wärmezähler Kessel - Übersicht', 
      options: [
        { id: 'Z20141', label: 'Kessel 1' },
        { id: 'Z20142', label: 'Kessel 2' }
      ],
      selectedValue: selectedCounters['kessel-panel'],
      onSelect: (value) => setSelectedCounters(prev => ({ ...prev, 'kessel-panel': value }))
    }
  ];

  // Beispiel URL Generator
  const generateGrafanaUrl = (panelId: string, counterId?: string) => {
    return `https://graf.heatcare.one/d-solo/example/dashboard?panelId=${panelId}&var-id=${counterId || ''}&from=${timeRange}`;
  };

  return (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTabIndex={activeTab}
        onTabChange={setActiveTab}
        timeRanges={STANDARD_TIME_RANGES}
        selectedTimeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Tab Content */}
      <div className="tab-content-area">
        {activeTab === 0 && (
          <div className="space-y-4 p-4">
            {/* Counter Selection */}
            <CounterSelectionGroup 
              selections={[counterSelections[0]]}
            />
            
            {/* Split Layout für zwei Panels nebeneinander */}
            <GrafanaSplitLayout
              leftSrc={generateGrafanaUrl('16', selectedCounters['netz-panel'])}
              rightSrc={generateGrafanaUrl('3', selectedCounters['netz-panel'])}
              leftTitle="Netzwächter - Links"
              rightTitle="Netzwächter - Rechts"
              leftWidth="180px"
              height="250px"
              onLeftLoad={() => console.log('Left panel loaded')}
              onRightLoad={() => console.log('Right panel loaded')}
            />
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4 p-4">
            {/* Counter Selection */}
            <CounterSelectionGroup 
              selections={[counterSelections[1]]}
            />
            
            {/* Single Panel */}
            <GrafanaIframeContainer
              src={generateGrafanaUrl('13', selectedCounters['kessel-panel'])}
              title="Kesselwächter Dashboard"
              height="400px"
              onLoad={() => console.log('Kessel panel loaded')}
            />
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4 p-4">
            <p className="text-gray-500 text-center py-8">
              Wärmepumpe Monitoring - Kommt bald
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabLayoutExample;