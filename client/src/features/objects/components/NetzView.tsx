import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, RefreshCcw, Network, BarChart3, Share2, TrendingUp } from "lucide-react";

interface NetzViewProps {
  meterData: Record<string, string | number>;
  objectId: number;
}

export const NetzView: React.FC<NetzViewProps> = ({ meterData, objectId }) => {
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const stableTimestamp = useRef<number>(Date.now());
  
  // Simple loading state for staggered iframe loading
  const [delayedIframes, setDelayedIframes] = useState(new Set<string>());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshingIframes, setRefreshingIframes] = useState(new Set<string>());
  
  // Time range state
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  
  // Histogram selection state
  const [selectedHistogramType, setSelectedHistogramType] = useState<'temp' | 'flow' | 'power'>('temp');
  
  // Fetch defaultGrafana settings
  const { data: defaultGrafanaSettings } = useQuery<any>({
    queryKey: ["/api/settings"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    select: (data: any[]) => {
      const setting = data?.find(setting => setting.key_name === 'defaultGrafana')?.value;
      return setting;
    },
  });

  // Extract grafana configuration
  const grafanaConfig = (defaultGrafanaSettings as any)?.setupGrafana;
  
  // Timeline time range options
  const timelineRanges = [
    { value: '24h', label: '24h', from: 'now-24h', to: 'now' },
    { value: '7d', label: ' 7', from: 'now-7d', to: 'now' },
    { value: '14d', label: '14', from: 'now-14d', to: 'now' },
    { value: '30d', label: '30T', from: 'now-30d', to: 'now' },
    { value: '90d', label: ' 3', from: 'now-90d', to: 'now' },
    { value: '6M', label: ' 6', from: 'now-6M', to: 'now' },
    { value: '1y', label: '12M', from: 'now-1y', to: 'now' }
  ];

  // Dynamische Jahres-Buttons basierend auf aktuellem Jahr
  const yearlyRanges = [
    { value: (new Date().getFullYear() - 1).toString(), label: (new Date().getFullYear() - 1).toString(), from: 'now-1y/y', to: 'now-1y/y' },
    { value: (new Date().getFullYear() - 2).toString(), label: (new Date().getFullYear() - 2).toString(), from: 'now-2y/y', to: 'now-2y/y' }
  ];

  const allTimeRanges = useMemo(() => [...timelineRanges, ...yearlyRanges], []);

  // Extract Netz1 meter data (Z20541)
  const netz1Data = useMemo(() => {
    if (!meterData || !meterData.Z20541) {
      return null;
    }
    
    return {
      meterId: meterData.Z20541.toString(),
      label: "Netz",
      key: "Z20541"
    };
  }, [meterData]);

  // Central URL generation helper
  const generateGrafanaUrl = useCallback((meterId: string, panelId: number) => {
    const grafanaUrl = (defaultGrafanaSettings as any)?.setupGrafana?.baseUrl || 'https://graf.heatcare.one';
    const dashboardId = (defaultGrafanaSettings as any)?.setupGrafana?.defaultDashboard || 'd-solo/eelav0ybil2wwd/ws-heatcare';
    const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
    const timeParams = `from=${timeRange?.from || 'now-7d'}&to=${timeRange?.to || 'now'}`;
    
    return `${grafanaUrl}/${dashboardId}?orgId=1&${timeParams}&panelId=${panelId}&var-id=${meterId}&refresh=30s&theme=light&kiosk=1&t=${stableTimestamp.current}`;
  }, [defaultGrafanaSettings, selectedTimeRange, allTimeRanges]);

  // Histogram Panel ID mapping
  const histogramPanelIds = {
    temp: 4,   // HistoTempPanelId
    flow: 5,   // HistoFlowPanelId 
    power: 7   // HistoPowerPanelId
  };
  
  // Histogram title mapping
  const histogramTitles = {
    temp: 'Häufigkeit Temperatur',
    flow: 'Häufigkeit Durchfluss',
    power: 'Häufigkeit Leistung'
  };

  // Generate iframe URLs for the 3 panels
  const iframeUrls = useMemo(() => {
    if (!netz1Data) return null;
    
    const urls = {
      network: generateGrafanaUrl(netz1Data.meterId, 16),                                    // Network Panel
      histogram: generateGrafanaUrl(netz1Data.meterId, histogramPanelIds[selectedHistogramType]),  // Histogram Panel with dynamic panelId
      diagram: generateGrafanaUrl(netz1Data.meterId, 3)                                     // Diagram Panel
    };
    
    
    return urls;
  }, [netz1Data, generateGrafanaUrl, selectedHistogramType]);

  // Staggered iframe loading - 50ms initial wait, then 1,2,3 sequentially
  useEffect(() => {
    if (!iframeUrls) return;
    
    setDelayedIframes(new Set());
    
    const timeoutIds: NodeJS.Timeout[] = [];
    const iframeKeys = ['network', 'histogram', 'diagram'];
    
    iframeKeys.forEach((key, index) => {
      const timeoutId = setTimeout(() => {
        setDelayedIframes(prev => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
      }, index === 0 ? 150 : 50 + (index * 300)); // First iframe at 150ms, others at 350ms and 650ms
      
      timeoutIds.push(timeoutId);
    });
    
    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [iframeUrls, refreshTrigger]);

  // Individual iframe refresh function
  const handleIframeRefresh = (iframeKey: string) => {
    setRefreshingIframes(prev => {
      const newSet = new Set(prev);
      newSet.add(iframeKey);
      return newSet;
    });
    
    setDelayedIframes(prev => {
      const newSet = new Set(prev);
      newSet.delete(iframeKey);
      return newSet;
    });
    
    setTimeout(() => {
      setDelayedIframes(prev => {
        const newSet = new Set(prev);
        newSet.add(iframeKey);
        return newSet;
      });
      
      setRefreshingIframes(prev => {
        const newSet = new Set(prev);
        newSet.delete(iframeKey);
        return newSet;
      });
    }, 100);
  };

  // Global refresh function
  const handleGlobalRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Early returns
  if (!grafanaConfig || !meterData) {
    return <div className="text-sm text-gray-500">Keine Netz-Daten verfügbar</div>;
  }
  
  if (!netz1Data) {
    return <div className="text-sm text-gray-500">Netz1 (Z20541) nicht gefunden</div>;
  }

  if (!iframeUrls) {
    return <div className="text-sm text-gray-500">Grafana URLs können nicht generiert werden</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Timeline Selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          {/* Timeline buttons */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
            {timelineRanges.map((option, index) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value)}
                style={{ padding: '5px 10px' }}
                className={`py-2 text-sm font-medium transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${
                  index > 0 ? 'border-l border-gray-300' : ''
                }`}
                data-testid={`button-timeline-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Year buttons */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white ml-2">
            {yearlyRanges.map((option, index) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value)}
                style={{ padding: '5px 10px' }}
                className={`py-2 text-sm font-medium transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${
                  index > 0 ? 'border-l border-gray-300' : ''
                }`}
                data-testid={`button-year-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Histogram Selection */}
        <div className="flex gap-2 items-center ml-4">
          <span className="text-sm font-medium text-gray-700">Histogram</span>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setSelectedHistogramType('temp')}
              style={{ padding: '5px 10px' }}
              className={`py-2 text-sm font-medium transition-colors ${
                selectedHistogramType === 'temp'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="button-histogram-temp"
            >
              Temp
            </button>
            <button
              onClick={() => setSelectedHistogramType('flow')}
              style={{ padding: '5px 10px' }}
              className={`py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                selectedHistogramType === 'flow'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="button-histogram-flow"
            >
              Flow
            </button>
            <button
              onClick={() => setSelectedHistogramType('power')}
              style={{ padding: '5px 10px' }}
              className={`py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                selectedHistogramType === 'power'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="button-histogram-power"
            >
              Power
            </button>
          </div>
        </div>
      </div>
      {/* Drittes iframe oben - volle Breite */}
      <div className="mb-2" data-testid="panel-diagram">
        <div className="mb-0">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700 flex items-center">
              <Share2 className="h-4 w-4 mr-2 text-blue-500" />
              Netz-Diagramm-Verlauf
            </h5>
            <button
              onClick={() => handleIframeRefresh('diagram')}
              disabled={refreshingIframes.has('diagram')}
              className="p-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
              title="Diagramm aktualisieren"
              data-testid="button-refresh-diagram"
            >
              <RefreshCcw className={`h-3 w-3 text-blue-600 ${refreshingIframes.has('diagram') ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="overflow-hidden bg-white relative">
          {(!delayedIframes.has('diagram') || refreshingIframes.has('diagram')) && (
            <div className="absolute inset-0 bg-blue-50 flex items-center justify-center text-xs text-blue-600 z-10">
              {refreshingIframes.has('diagram') ? (
                <div className="flex items-center space-x-2">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <span>Aktualisiere...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Lade...</span>
                </div>
              )}
            </div>
          )}
          <iframe
            width="100%"
            height="230"
            frameBorder="0"
            className="w-full h-[230px] block border-none"
            title="Diagramm Verlauf Dashboard"
            src={delayedIframes.has('diagram') && !refreshingIframes.has('diagram') ? iframeUrls.diagram : undefined}
            data-testid="iframe-diagram"
          />
        </div>
      </div>
      {/* 2 iframes nebeneinander */}
      <div className="flex gap-0 mb-0">
        {/* Erstes iframe - 140px fest */}
        <div style={{ width: '140px', flexShrink: 0 }} data-testid="panel-network">
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700 flex items-center">
                <Share2 className="h-4 w-4 mr-2 text-green-600" />
                Netz
              </h5>
              <button
                onClick={() => handleIframeRefresh('network')}
                disabled={refreshingIframes.has('network')}
                className="p-1 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
                title="Network aktualisieren"
                data-testid="button-refresh-network"
              >
                <RefreshCcw className={`h-3 w-3 text-green-600 ${refreshingIframes.has('network') ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="overflow-hidden bg-white relative">
            {(!delayedIframes.has('network') || refreshingIframes.has('network')) && (
              <div className="absolute inset-0 bg-green-50 flex items-center justify-center text-xs text-green-600 z-10">
                {refreshingIframes.has('network') ? (
                  <div className="flex items-center space-x-1">
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                    <span>Lade...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Network className="h-3 w-3" />
                    <span>Lade...</span>
                  </div>
                )}
              </div>
            )}
            <iframe
              ref={(el) => {
                if (el) iframeRefs.current.set('network', el);
              }}
              width="100%"
              height="210"
              frameBorder="0"
              className="w-full h-[210px] block border-none"
              title="Network Dashboard"
              src={delayedIframes.has('network') && !refreshingIframes.has('network') ? iframeUrls.network : undefined}
              data-testid="iframe-network"
            />
          </div>
        </div>

        {/* Zweites iframe - flex */}
        <div className="flex-1" data-testid="panel-histogram">
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                {histogramTitles[selectedHistogramType]}
              </h5>
              <button
                onClick={() => handleIframeRefresh('histogram')}
                disabled={refreshingIframes.has('histogram')}
                className="p-1 rounded-full hover:bg-orange-100 transition-colors disabled:opacity-50"
                title="Histogramm aktualisieren"
                data-testid="button-refresh-histogram"
              >
                <RefreshCcw className={`h-3 w-3 text-orange-600 ${refreshingIframes.has('histogram') ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="overflow-hidden bg-white relative">
            {(!delayedIframes.has('histogram') || refreshingIframes.has('histogram')) && (
              <div className="absolute inset-0 bg-orange-50 flex items-center justify-center text-xs text-orange-600 z-10">
                {refreshingIframes.has('histogram') ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>Aktualisiere...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Lade...</span>
                  </div>
                )}
              </div>
            )}
            <iframe
              width="100%"
              height="210"
              frameBorder="0"
              className="w-full h-[210px] block border-none"
              title="Histogramm Dashboard"
              src={delayedIframes.has('histogram') && !refreshingIframes.has('histogram') ? iframeUrls.histogram : undefined}
              data-testid="iframe-histogram"
            />
          </div>
        </div>
      </div>
    </div>
  );
};