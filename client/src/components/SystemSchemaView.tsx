import React, { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCcw } from "lucide-react";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";

interface SystemSchemaViewProps {
  meterData: Record<string, string | number>;
  objectId: number;
}

export const SystemSchemaView: React.FC<SystemSchemaViewProps> = ({ meterData, objectId }) => {
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  // Stabiler Timestamp pro Session zur Vermeidung von iframe-Reloads
  const stableTimestamp = useRef<number>(Date.now());
  
  // Simple staggered iframe loading state  
  const [delayedIframes, setDelayedIframes] = useState(new Set<string>());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshingIframes, setRefreshingIframes] = useState(new Set<string>());
  
  // Fetch Grafana settings
  const { data: grafanaSettings } = useQuery({
    queryKey: ["/api/settings", "grafana"],
    queryFn: async () => {
      const response = await fetch("/api/settings?category=grafana", {
        credentials: 'include' // Send session cookies
      });
      if (!response.ok) throw new Error("Failed to fetch Grafana settings");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten Cache
  });

  // Get defaultGrafana settings
  const defaultGrafanaConfig = grafanaSettings?.find((setting: any) => setting.keyName === 'defaultGrafana' || setting.key_name === 'defaultGrafana');
  const grafanaConfig = defaultGrafanaConfig?.value?.setupGrafana;

  // Generate system components with useMemo to prevent unnecessary re-generations
  const systemComponents = useMemo(() => {
    console.log("🔧 [SCHEMA] Regenerating system components for objectId:", objectId);
    if (!grafanaConfig || !meterData) {
      console.log("🔧 [SCHEMA] Missing config or meterData, returning empty");
      return [];
    }

    const components: any[] = [];
    const counters: Record<string, number> = {};
    
    Object.entries(meterData).forEach(([key, value]) => {
      if (typeof key === 'string') {
        let componentType = '';
        let panelId = '';
        let baseLabel = '';
        
        // Determine component type based on meter ID pattern
        if (key.match(/Z202[4]\d/)) {
          // Wärmepumpe (Z20241, Z20242, Z20243)
          componentType = 'waermepumpe';
          panelId = grafanaConfig.defaultPanelid?.find((p: any) => p.waermepumpePanelId)?.waermepumpePanelId || '12';
          baseLabel = 'Wärmepumpe';
        } else if (key.match(/Z201[4]\d/)) {
          // Kessel (Z20141, Z20142, Z20143)
          componentType = 'kessel';
          panelId = grafanaConfig.defaultPanelid?.find((p: any) => p.kesselPanelId)?.kesselPanelId || '19';
          baseLabel = 'Kessel';
        } else if (key.match(/Z205[4]\d/)) {
          // Netz (Z20541, Z20542, Z20543)
          componentType = 'netz';
          panelId = grafanaConfig.defaultPanelid?.find((p: any) => p.netzPanelId)?.netzPanelId || '16';
          baseLabel = 'Netz';
        }
        
        if (componentType && panelId) {
          // Increment counter for this component type
          counters[componentType] = (counters[componentType] || 0) + 1;
          
          const resolvedId = value?.toString();
          // Use stable timestamp to prevent iframe reloads
          const grafanaUrl = `${grafanaConfig.baseUrl}/${grafanaConfig.defaultDashboard}?orgId=1&from=now-24h&to=now&panelId=${panelId}&var-id=${resolvedId}&refresh=30s&theme=light&kiosk=1&t=${stableTimestamp.current}`;
          
          // Create numbered label with line break
          const numberedLabel = `${baseLabel}${counters[componentType]}`;
          const displayLabel = (
            <div className="text-center">
              <div>{numberedLabel}</div>
              <div>({key})</div>
            </div>
          );
          
          components.push({
            id: key,
            type: componentType,
            label: numberedLabel,
            displayLabel,
            meterId: key,
            panelId,
            resolvedId,
            grafanaUrl
          });
        }
      }
    });
    
    console.log("🔧 [SCHEMA] Generated", components.length, "components with timestamp:", stableTimestamp.current);
    return components;
  }, [meterData, objectId, grafanaConfig?.baseUrl, grafanaConfig?.defaultDashboard, grafanaConfig?.defaultPanelid]);

  // Only reset timestamp when component mounts (not on objectId change)
  // This prevents unnecessary iframe reloads when switching objects
  
  // Simple staggered iframe loading with fixed delays
  useEffect(() => {
    if (systemComponents.length === 0) return;
    
    console.log("🔧 [IFRAME] Starting staggered loading for", systemComponents.length, "components");
    
    // Reset state
    setDelayedIframes(new Set());
    
    const timeoutIds: NodeJS.Timeout[] = [];
    
    // Load each iframe with 800ms delay between them
    systemComponents.forEach((component, index) => {
      const timeoutId = setTimeout(() => {
        console.log(`🔧 [IFRAME] Loading iframe ${index + 1}/${systemComponents.length}: ${component.id}`);
        setDelayedIframes(prev => {
          const newSet = new Set(prev);
          newSet.add(component.id);
          console.log(`🔧 [IFRAME] Added ${component.id} to delayedIframes, set size: ${newSet.size}`);
          return newSet;
        });
      }, (index + 1) * 600); // 600ms delay between each iframe, starting after 600ms
      
      timeoutIds.push(timeoutId);
    });
    
    // Cleanup on unmount
    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [systemComponents, refreshTrigger]);

  // Individual iframe refresh function
  const handleIframeRefresh = (componentId: string) => {
    console.log(`🔄 [REFRESH] Refreshing iframe: ${componentId}`);
    
    // Add to refreshing set
    setRefreshingIframes(prev => {
      const newSet = new Set(prev);
      newSet.add(componentId);
      return newSet;
    });
    
    // Remove from delayed iframes temporarily
    setDelayedIframes(prev => {
      const newSet = new Set(prev);
      newSet.delete(componentId);
      return newSet;
    });
    
    // Re-add with new timestamp after a short delay
    setTimeout(() => {
      setDelayedIframes(prev => {
        const newSet = new Set(prev);
        newSet.add(componentId);
        return newSet;
      });
      
      // Remove from refreshing set
      setRefreshingIframes(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentId);
        return newSet;
      });
    }, 100);
  };

  // Early returns after all hooks
  if (!grafanaConfig || !meterData) {
    return <div className="text-sm text-gray-500">Keine Schema-Daten verfügbar</div>;
  }
  
  if (systemComponents.length === 0) {
    return <div className="text-sm text-gray-500">Keine System-Komponenten gefunden</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Title - matching Energiezähler KI-Analyse style */}
      <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2 text-blue-600" />
        Anlagen-Komponenten-Schema{" "}
        <span className="text-xs text-gray-500 font-normal ml-1">(Livedaten)</span>
      </h4>

      {/* System Components Grid - 150px breit x 200px hoch mit 12px gap */}
      <div className="flex flex-wrap gap-3 justify-start">
        {systemComponents.map((component, index) => {
          const shouldLoad = delayedIframes.has(component.id);
          const isRefreshing = refreshingIframes.has(component.id);
          
          return (
            <div key={component.id} className="flex-shrink-0 space-y-2 w-[150px]">
              <div className="text-xs font-medium text-gray-700 text-center flex items-center justify-center relative">
                <div>
                  <div>{component.label}</div>
                  <div className="text-xs text-gray-500">({component.meterId})</div>
                </div>
                <button
                  onClick={() => handleIframeRefresh(component.id)}
                  disabled={isRefreshing}
                  className="absolute right-0 top-0 p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title={`${component.label} aktualisieren`}
                >
                  <RefreshCcw className={`h-3 w-3 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="border-none overflow-hidden bg-white relative">
                {(!shouldLoad || isRefreshing) && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-xs text-gray-500 z-10">
                    {isRefreshing ? 'Aktualisiere...' : 'Warteschlange...'}
                  </div>
                )}
                <iframe
                  ref={(el) => {
                    if (el) iframeRefs.current.set(component.id, el);
                  }}
                  width="150"
                  height="200"
                  frameBorder="0"
                  className="w-[150px] h-[200px] block border-none"
                  title={`${component.label} Dashboard`}
                  src={shouldLoad && !isRefreshing ? component.grafanaUrl : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};