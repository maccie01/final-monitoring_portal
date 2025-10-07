import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Network,
  Flame,
  Settings,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { GrafanaLogic, type GrafanaTab, type GrafanaPanel } from "@/components/GrafanaLogic";

interface GrafanaReportProps {
  objectId: number;
  className?: string;
  dashboard?: string;
}

interface GrafanaObject {
  id: number;
  objectid: number;
  name: string;
  meter?: Record<string, string | number>;
  report?: any[];
}

// Report-spezifische Zeitbereiche - wie in GrafanaDiagramme.tsx
const shortTermRanges = [
  { value: "now-1y", to: "now", label: "letzte 365 Tage" }
];

// Dynamische Jahres-Buttons basierend auf aktuellem Jahr (exakt wie GrafanaDiagramme.tsx)
const yearlyRanges = [
  { value: (new Date().getFullYear() - 1).toString(), label: (new Date().getFullYear() - 1).toString(), from: 'now-1y/y', to: 'now-1y/y' },
  { value: (new Date().getFullYear() - 2).toString(), label: (new Date().getFullYear() - 2).toString(), from: 'now-2y/y', to: 'now-2y/y' }
];

export const GrafanaReport: React.FC<GrafanaReportProps> = ({
  objectId,
  className = "",
  dashboard
}) => {
  // Lokaler timeRange State für dynamische Buttons
  const [localTimeRange, setLocalTimeRange] = useState("2024");
  
  // State für Tab-Management (wie im Dashboards Tab)
  const [activeTabPerDashboard, setActiveTabPerDashboard] = useState<Record<string, number>>({
    report: 0,
  });
  const activeTab = activeTabPerDashboard["report"] || 0;
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [contentKey, setContentKey] = useState(Date.now());

  // Update iframe key when localTimeRange changes to force reload
  useEffect(() => {
    setIframeKey(Date.now());
    setContentKey(Date.now());
  }, [localTimeRange, objectId]);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [selectedCounters, setSelectedCounters] = useState<Record<string, string>>({});
  const [showHistograms, setShowHistograms] = useState<Record<string, boolean>>({});
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Fetch object data
  const { data: selectedObject, isLoading: isLoadingObject } = useQuery<GrafanaObject>({
    queryKey: ["/api/objects/by-objectid", objectId],
    enabled: !!objectId,
  });

  // Fetch Grafana settings für default fallback
  const { data: grafanaSettings, isLoading: isLoadingGrafanaSettings } = useQuery<any[]>({
    queryKey: ["/api/settings"],
    select: (data: any[]) => {
      return data?.filter(setting => setting.category === "grafana") || [];
    },
  });

  // Helper functions (wie im Dashboards Tab)
  const toggleAccordion = (panelId: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  };

  const toggleHistogram = (panelId: string) => {
    setShowHistograms(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  // Function to generate Grafana URL (from panel data or defaultAuswertung fallback)
  const generateGrafanaUrl = useCallback((
    panelId: string,
    meterID?: string,
    dashboard?: string,
    grafanaBase = "https://graf.heatcare.one",
    panelData?: any
  ): string => {
    // Try to get dashboard from panel data first, then fallback to parameter
    let finalDashboard = dashboard;
    let finalGrafanaBase = grafanaBase;
    
    if (panelData) {
      if (panelData.dashboard) {
        finalDashboard = panelData.dashboard;
      }
      if (panelData.grafana) {
        finalGrafanaBase = panelData.grafana;
      }
    }
    
    // Only use dashboard if provided from settings/report
    if (!finalDashboard) {
      console.warn('No dashboard provided - URL generation requires defaultAuswertung or objects.report');
      return '';
    }

    // ZLOGID fallback to objectid
    let resolvedMeterId = meterID;
    if (meterID === "ZLOGID" && selectedObject?.objectid) {
      resolvedMeterId = selectedObject.objectid.toString();
    }

    // Real meter ID lookup
    if (meterID && meterID.match(/^[Zz]/) && selectedObject?.meter?.[meterID]) {
      const realMeterId = selectedObject.meter[meterID];
      resolvedMeterId = realMeterId.toString();
    }

    // Map localTimeRange to correct from/to parameters (like GrafanaDiagramme.tsx)
    let fromParam = localTimeRange;
    let toParam = "now";
    
    // Verbesserte Zeit-Range-Logik mit korrekter yearlyRanges Verwendung
    const reportTimeOption = [...shortTermRanges, ...yearlyRanges].find(option => option.value === localTimeRange);
    
    if (reportTimeOption) {
      if ((reportTimeOption as any).from && reportTimeOption.to) {
        // Verwende from/to aus yearlyRanges
        fromParam = (reportTimeOption as any).from;
        toParam = reportTimeOption.to;
      } else {
        // Verwende value/to aus shortTermRanges
        fromParam = reportTimeOption.value;
        toParam = reportTimeOption.to || "now";
      }
    } else {
      // Fallback für unbekannte Zeitbereiche
      fromParam = localTimeRange;
      toParam = "now";
    }

    const url = `${grafanaBase}/${finalDashboard}?orgId=1&from=${fromParam}&to=${toParam}&panelId=${panelId}&kiosk=1&var-id=${resolvedMeterId}&__feature=dashboardSceneSolo&refresh=1m`;
    
    return url;
  }, [selectedObject, localTimeRange]);

  // Generate tabs with URLs using GrafanaLogic (wie im Dashboards Tab)
  const tabs = useMemo(() => {
    if (!selectedObject || isLoadingGrafanaSettings) {
      return [];
    }

    // Verwende GrafanaLogic für konsistente Tab-Generierung
    const generatedTabs = GrafanaLogic.generateTabs(
      selectedObject,
      grafanaSettings || []
    );

    // Generate URLs for all panels - regenerate when localTimeRange changes
    const tabsWithUrls = generatedTabs.map(tab => ({
      ...tab,
      panels: tab.panels.map(panel => {
        const url1 = generateGrafanaUrl(panel.panelId, panel.originalId, panel.dashboard, (panel as any).grafana, panel);
        const url2 = panel.panelId2 ? generateGrafanaUrl(panel.panelId2, panel.originalId, panel.dashboard, (panel as any).grafana, panel) : undefined;
        const url3 = panel.panelId3 ? generateGrafanaUrl(panel.panelId3, panel.originalId, panel.dashboard, (panel as any).grafana, panel) : undefined;
        
        return {
          ...panel,
          cachedUrl: url1,
          cachedUrl2: url2,
          cachedUrl3: url3,
        };
      })
    }));

    return tabsWithUrls;
  }, [selectedObject, grafanaSettings, isLoadingGrafanaSettings, generateGrafanaUrl, localTimeRange]);

  // Get current tab
  const currentTab = tabs[activeTab];

  if (isLoadingObject || isLoadingGrafanaSettings) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Lade Grafana Report...</span>
        </div>
      </div>
    );
  }

  if (!selectedObject) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Objekt nicht gefunden</h3>
        <p className="text-gray-600">Das angegebene Objekt konnte nicht geladen werden.</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border-0.5 border-yellow-200 p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Keine Report-Einträge vorhanden
          </h3>
          <p className="text-yellow-700 text-sm">
            Wählen Sie ein anderes Board oder kontaktieren Sie den Administrator.
          </p>
        </div>
      </div>
    );
  }

  // Render using same structure as Dashboards Tab
  return (
    <div className="grafana-content w-full">
      {/* Tab Navigation for Grafana Boards - Same as Dashboards Tab */}
      <div className="tab-navigation-container bg-white border-b border-gray-200 shadow-sm">
        <div className="tab-navigation-header px-0 py-0 pt-0 pb-0 mt-[5px] mb-[5px] flex justify-between items-center pl-[20px] pr-[20px]">
          <div className="tab-container">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (isTabSwitching || activeTab === index) return;
                  
                  setIsTabSwitching(true);
                  setActiveTabPerDashboard(prev => ({ ...prev, report: index }));
                  setIframeKey(Date.now());
                  
                  setTimeout(() => setIsTabSwitching(false), 500);
                }}
                disabled={isTabSwitching}
                className={`tab-button ${
                  activeTab === index
                    ? tab.label === "Kessel" 
                      ? "tab-button-active-kessel" 
                      : "tab-button-active"
                    : "tab-button-inactive"
                } ${isTabSwitching ? 'opacity-70 cursor-wait' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  {tab.label === "Netz" && (
                    <Network className="h-4 w-4" />
                  )}
                  {tab.label === "Kessel" && (
                    <Flame className="h-4 w-4" />
                  )}
                  {tab.label === "Wärmepumpe" && (
                    <Settings className="h-4 w-4" />
                  )}
                  <span className="text-sm">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Aktualisierungs-Button und Jahr-Buttons */}
          <div className="flex gap-2 ml-auto items-center">
            {/* Aktualisierungs-Button */}
            <button
              onClick={() => {
                setIframeKey(Date.now());
                setContentKey(Date.now());
              }}
              className="px-3 py-2 text-sm rounded-md border transition-colors bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-200"
              title="Dashboards aktualisieren"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            {/* Short-term buttons (6M, 365 Tage) */}
            {shortTermRanges.map((option) => (
              <button
                key={option.value}
                onClick={() => setLocalTimeRange(option.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  localTimeRange === option.value
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
            
            {/* Year buttons - EXAKT wie in GrafanaDiagramme.tsx */}
            {yearlyRanges.map((option) => (
              <button
                key={option.value}
                onClick={() => setLocalTimeRange(option.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  localTimeRange === option.value
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

        </div>

        {/* Card Content mit Grafana-Iframes */}
        {currentTab && (
          <div className="card-content bg-white border border-gray-200 m-4 rounded-lg shadow-sm">
            <div key={contentKey} className="p-4 space-y-4 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
            {currentTab.panels.map((panel, panelIndex) => {
              const isOpen = panelIndex === 0 || openAccordions.has(panel.id);
              const selectedCounter = selectedCounters[panel.id] || (panel.auswahl && panel.auswahl[0]?.id);
              const showHisto = showHistograms[panel.id];

              return (
                <div key={panel.id} className="panel-container bg-gray-50 border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  {panel.noAccordion ? (
                    // Direct panel rendering without accordion (for single site object)
                    (<div className="p-0 m-0">
                      {/* Counter Selection Buttons */}
                      {panel.auswahl && panel.auswahl.length > 1 && (
                        <div className="counter-selection-container mb-0">
                          <div className="counter-selection-buttons">
                            {panel.auswahl.map((auswahl) => (
                              <button
                                key={auswahl.id}
                                onClick={() => {
                                  if (selectedCounter !== auswahl.id) {
                                    setSelectedCounters((prev) => ({
                                      ...prev,
                                      [panel.id]: auswahl.id,
                                    }));
                                    setIframeKey(Date.now());
                                  }
                                }}
                                className={`counter-button ${
                                  selectedCounter === auswahl.id
                                    ? "counter-button-active"
                                    : "counter-button-inactive"
                                }`}
                              >
                                {auswahl.idlabel}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Panel Display - Different layouts like Dashboards Tab */}
                      {panel.panelId3 ? (
                        // Triple Panel Layout (Layout3)
                        (<div
                          className="flex gap-0 overflow-hidden"
                          style={{ height: panel.height || "500px" }}
                        >
                          {/* Left Stack: panelId2 and panelId3 */}
                          <div 
                            className="bg-white overflow-hidden flex flex-col"
                            style={{ width: panel.panelIdWidth || "260px" }}
                          >
                            {/* Top Left: panelId2 */}
                            <div 
                              className="bg-white overflow-hidden"
                              style={{
                                height: panel.panelId3height 
                                  ? `calc(100% - ${panel.panelId3height})` 
                                  : "50%"
                              }}
                            >
                              <iframe
                                key={`layout3-top-${iframeKey}-${panel.panelId2}-${selectedCounter || 'default'}-${localTimeRange}`}
                                src={panel.cachedUrl2}
                                className="w-full h-full border-0"
                                title={`${panel.label} - Links Oben`}
                                loading="lazy"
                                onLoad={() => {}}
                              />
                            </div>
                            
                            {/* Bottom Left: panelId3 */}
                            <div 
                              className="bg-white overflow-hidden"
                              style={{ height: panel.panelId3height || "50%" }}
                            >
                              <iframe
                                key={`layout3-bottom-${iframeKey}-${panel.panelId3}-${selectedCounter || 'default'}-${localTimeRange}`}
                                src={panel.cachedUrl3}
                                className="w-full h-full border-0"
                                title={`${panel.label} - Links Unten`}
                                loading="lazy"
                                onLoad={() => {}}
                              />
                            </div>
                          </div>
                          {/* Right Panel: panelId */}
                          <div className="bg-white overflow-hidden flex-1">
                            <iframe
                              key={`layout3-right-${iframeKey}-${panel.panelId}-${selectedCounter || 'default'}-${localTimeRange}`}
                              src={panel.cachedUrl}
                              className="w-full h-full border-0"
                              title={`${panel.label} - Rechts`}
                              loading="lazy"
                              onLoad={() => {}}
                            />
                          </div>
                        </div>)
                      ) : panel.panelId2 ? (
                        // Dual Panel Layout
                        (<div
                          className="flex gap-0 overflow-hidden"
                          style={{ height: panel.height || "250px" }}
                        >
                          <div
                            className="bg-white overflow-hidden"
                            style={{ width: panel.panelIdWidth || "50%" }}
                          >
                            <iframe
                              key={`${iframeKey}-${panel.panelId}-${selectedCounter}-${localTimeRange}`}
                              src={panel.cachedUrl}
                              className="w-full h-full border-0"
                              title={`${panel.label} - Links`}
                              loading="lazy"
                            />
                          </div>
                          <div className="bg-white overflow-hidden flex-1">
                            <iframe
                              key={`${iframeKey}-${panel.panelId2}-${selectedCounter}-${localTimeRange}`}
                              src={panel.cachedUrl2}
                              className="w-full h-full border-0"
                              title={`${panel.label} - Rechts`}
                              loading="lazy"
                            />
                          </div>
                        </div>)
                      ) : (
                        // Single Panel Layout
                        (<div
                          className="bg-white overflow-hidden"
                          style={{ height: panel.height || "250px" }}
                        >
                          <iframe
                            key={`${iframeKey}-${panel.panelId}-${selectedCounter}-${localTimeRange}`}
                            src={panel.cachedUrl}
                            className="w-full h-full border-0"
                            title={panel.label}
                            loading="lazy"
                          />
                        </div>)
                      )}
                    </div>)
                  ) : (
                    // Accordion-based panel rendering
                    (<Collapsible
                      open={isOpen}
                      onOpenChange={panelIndex === 0 ? undefined : () => toggleAccordion(panel.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="panel-header panel-header-default pt-[1px] pb-[1px] cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {panelIndex === 0 ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <h3 className="text-lg font-semibold">{panel.label}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              {panel.histogram && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`${showHisto ? "font-medium text-blue-700 bg-blue-50 border-blue-500" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleHistogram(panel.id);
                                  }}
                                >
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Histogramm
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="panel-content">
                          {/* Counter Selection Buttons - Same as direct rendering */}
                          {panel.auswahl && panel.auswahl.length > 1 && (
                            <div className="counter-selection-container mb-0">
                              <div className="counter-selection-buttons">
                                {panel.auswahl.map((auswahl) => (
                                  <button
                                    key={auswahl.id}
                                    onClick={() => {
                                      if (selectedCounter !== auswahl.id) {
                                        setSelectedCounters((prev) => ({
                                          ...prev,
                                          [panel.id]: auswahl.id,
                                        }));
                                      }
                                    }}
                                    className={`counter-button ${
                                      selectedCounter === auswahl.id
                                        ? "counter-button-active"
                                        : "counter-button-inactive"
                                    }`}
                                  >
                                    {auswahl.idlabel}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Same panel layouts as in direct rendering */}
                          {panel.panelId3 ? (
                            // Triple Panel Layout (Layout3) in Accordion
                            (<div
                              className="flex gap-0 overflow-hidden"
                              style={{ height: panel.height || "500px" }}
                            >
                              {/* Same structure as above */}
                              <div 
                                className="bg-white overflow-hidden flex flex-col"
                                style={{ width: panel.panelIdWidth || "260px" }}
                              >
                                <div 
                                  className="bg-white overflow-hidden"
                                  style={{
                                    height: panel.panelId3height 
                                      ? `calc(100% - ${panel.panelId3height})` 
                                      : "50%"
                                  }}
                                >
                                  <iframe
                                    key={`accordion-layout3-top-${iframeKey}-${panel.panelId2}`}
                                    src={panel.cachedUrl2}
                                    className="w-full h-full border-0"
                                    title={`${panel.label} - Links Oben`}
                                    loading="lazy"
                                  />
                                </div>
                                <div 
                                  className="bg-white overflow-hidden"
                                  style={{ height: panel.panelId3height || "50%" }}
                                >
                                  <iframe
                                    key={`accordion-layout3-bottom-${iframeKey}-${panel.panelId3}`}
                                    src={panel.cachedUrl3}
                                    className="w-full h-full border-0"
                                    title={`${panel.label} - Links Unten`}
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                              <div className="bg-white overflow-hidden flex-1">
                                <iframe
                                  key={`accordion-layout3-right-${iframeKey}-${panel.panelId}`}
                                  src={panel.cachedUrl}
                                  className="w-full h-full border-0"
                                  title={`${panel.label} - Rechts`}
                                  loading="lazy"
                                />
                              </div>
                            </div>)
                          ) : (
                            // Single Panel Layout in Accordion
                            (<div
                              className="bg-white overflow-hidden"
                              style={{ height: panel.height || "250px" }}
                            >
                              <iframe
                                key={`accordion-${iframeKey}-${panel.panelId}-${selectedCounter}`}
                                src={panel.cachedUrl}
                                className="w-full h-full border-0"
                                title={panel.label}
                                loading="lazy"
                              />
                            </div>)
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>)
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrafanaReport;