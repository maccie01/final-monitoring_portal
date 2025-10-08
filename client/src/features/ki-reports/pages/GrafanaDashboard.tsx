import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ObjectListLayout from "@/features/objects/components/ObjectListLayout";
import {
  Pencil,
  Info,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Brain,
} from "lucide-react";
import { KIEnergyAnalysis } from "@/features/energy/components/KI_energy";
import { KIEnergyJahrWrapper } from "@/features/energy/components/KI_energy_jahr_wrapper";
import ObjektinfoContent from "@/features/objects/components/ObjektinfoContent";
import {
  ViewColumnsIcon,
  PresentationChartLineIcon,
  InformationCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { GrafanaLogic, type GrafanaTab, type GrafanaPanel } from "@/features/ki-reports/components/GrafanaLogic";
import { GrafanaDiagramme } from "@/features/ki-reports/components/GrafanaDiagramme";
import { GrafanaReport } from "@/features/ki-reports/components/GrafanaReport";
import { SystemSchemaView } from "@/components/SystemSchemaView";

interface GrafanaObject {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  zip?: string;
  address?: string;
  nutzflaeche?: string | number;
  nutzeinheiten?: string | number;
  portdata?: any[];
  report?: any[];
  meter?: Record<string, string | number>;
  dashboard?: any;
  auswertung?: any;
  energy?: any;
}

const ObjectStatusIndicator = ({ objectId }: { objectId: number }) => {
  const { data: objects } = useQuery({
    queryKey: ["/api/objects"],
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache
    gcTime: 5 * 60 * 1000, // 5 Minuten Cache
    refetchOnWindowFocus: false,
  });

  const { data: thresholds } = useQuery({
    queryKey: ["/api/settings/thresholds"],
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    gcTime: 10 * 60 * 1000, // 10 Minuten Cache
    refetchOnWindowFocus: false,
  });

  const getOnlineStatus = () => {
    if (!objects || !thresholds || !Array.isArray(thresholds)) {
      return { isOnline: false, lastUpdate: null, reason: 'Threshold data not loaded' };
    }

    const obj = (objects as any[]).find((o: any) => o.objectid === objectId);
    if (!obj) {
      return { isOnline: false, lastUpdate: null, reason: 'Object not found' };
    }

    const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
    const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
    
    if (!hasFltemp && !hasRttemp) {
      return { isOnline: false, lastUpdate: null, reason: 'Keine Temperatur-Daten' };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const flIsOld = hasFltemp && new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
    const rtIsOld = hasRttemp && new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
    
    if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
      return { isOnline: false, lastUpdate: null, reason: 'Daten älter als 24h' };
    }

    let latestUpdate: Date | null = null;
    if (hasFltemp && obj.fltemp.updateTime) {
      const flUpdate = new Date(obj.fltemp.updateTime);
      if (!latestUpdate || flUpdate.getTime() > (latestUpdate as Date).getTime()) {
        latestUpdate = flUpdate;
      }
    }
    if (hasRttemp && obj.rttemp.updateTime) {
      const rtUpdate = new Date(obj.rttemp.updateTime);
      if (!latestUpdate || rtUpdate.getTime() > (latestUpdate as Date).getTime()) {
        latestUpdate = rtUpdate;
      }
    }

    return { isOnline: true, lastUpdate: latestUpdate, reason: 'Aktuelle Temperatur-Daten verfügbar' };
  };

  const { isOnline, lastUpdate } = getOnlineStatus();

  return (
    <span className="ml-2">
      / Status: 
      <span className={`ml-1 font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        {isOnline ? 'online' : 'offline'}
      </span>
      {lastUpdate && (
        <span className="ml-1 text-sm text-gray-500">
          ({new Date(lastUpdate).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})
        </span>
      )}
    </span>
  );
};

export default function GrafanaDashboard() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.role === 'superadmin';

  const urlParams = new URLSearchParams(window.location.search);
  const objectIdFromUrl =
    urlParams.get("objectID") || urlParams.get("objid") || urlParams.get("id");
  const hasUrlObjectId = !!objectIdFromUrl;
  const [selectedObjectId, setSelectedObjectId] = useState<
    number | undefined
  >();
  // showJahresAnalysis State jetzt in KI_energy_jahr_wrapper verlagert
  const activeTab = 0;
  const [showBackButton, setShowBackButton] = useState(false);
  const [referrerPage, setReferrerPage] = useState<string | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [tabCache, setTabCache] = useState<Record<string, GrafanaTab[]>>({});
  

  const [lastObjectId, setLastObjectId] = useState<number | null>(null);
  useEffect(() => {
    const shouldClearCache = selectedObjectId && selectedObjectId !== lastObjectId;
      
    if (shouldClearCache) {
      setTabCache({});
      setLastObjectId(selectedObjectId || null);
    }
  }, [selectedObjectId, lastObjectId]);
  
  const [currentMainTab, setCurrentMainTab] = useState<string>("diagramme");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const objectIdParam =
      urlParams.get("objectID") ||
      urlParams.get("objid") ||
      urlParams.get("id");
    const typParam = urlParams.get("typ");

    
    if (typParam === "report") {
      if (currentMainTab !== "grafanareport") {
        setCurrentMainTab("grafanareport");
      }
    } else {
      if (typParam === "diagramme") {
        if (currentMainTab !== "diagramme") {
          setCurrentMainTab("diagramme");
        }
      } else if (typParam === "KI-Auswertung") {
        if (currentMainTab !== "KI-Auswertung") {
          setCurrentMainTab("KI-Auswertung");
        }
        
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has("tap")) {
          currentUrl.searchParams.delete("tap");
          window.history.replaceState({}, '', currentUrl.toString());
        }
      } else if (typParam === "anlage") {
        if (currentMainTab !== "anlage") {
          setCurrentMainTab("anlage");
        }
      } else if (typParam === "objektinfo") {
        if (currentMainTab !== "objektinfo") {
          setCurrentMainTab("objektinfo");
        }
      } else {
        if (currentMainTab !== "diagramme") {
          setCurrentMainTab("diagramme");
        }
      }
    }

    if (objectIdParam) {
      const parsedId = parseInt(objectIdParam, 10);
      if (!isNaN(parsedId) && parsedId !== selectedObjectId) {
        setSelectedObjectId(parsedId);
        
        const fromParam = urlParams.get("from");
        
        // Dynamischer Back-Button: fromParam direkt als Pfad verwenden
        // Beispiele: ?from=maps → zurück zu /maps
        //           ?from=dashboard → zurück zu /dashboard  
        //           ?from=network-monitor → zurück zu /network-monitor
        if (fromParam) {
          setShowBackButton(true);
          setReferrerPage(`/${fromParam}`);
        } else {
          setShowBackButton(false);
          setReferrerPage(null);
        }
      }
    }

  }, [location, selectedObjectId]);


  const { data: selectedObjectMeter } = useQuery<{objectid: number; meter: any; report?: any}>({
    queryKey: ["/api/objects/meter", selectedObjectId],
    enabled: !!selectedObjectId,
  });

  const { data: selectedObject } = useQuery<GrafanaObject>({
    queryKey: ["/api/objects/by-objectid", selectedObjectId],
    enabled: !!selectedObjectId,
  });

  // Daily consumption data for the last 7 days
  const { data: dailyConsumption } = useQuery({
    queryKey: ["/api/daily-consumption", selectedObjectId],
    enabled: !!selectedObjectId,
    queryFn: async () => {
      if (!selectedObjectId) return {};
      const response = await fetch(`/api/daily-consumption/${selectedObjectId}`);
      if (!response.ok) throw new Error('Failed to fetch daily consumption data');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache für tägliche Daten
    gcTime: 10 * 60 * 1000, // 10 Minuten Cache
  });

  // ==========================================
  // Code Tabs
  // ==========================================
  
  const tabs = useMemo(() => {
    if (!selectedObject) return [];
    
    return GrafanaLogic.generateTabs(
      selectedObject,
      [],
      urlParams.get("typ") || undefined
    );
  }, [selectedObject]);
  const currentTab = tabs && tabs.length > activeTab ? tabs[activeTab] : null;

  // ==========================================
  // Code für ObjectList links
  // ==========================================
  
  const handleObjectSelect = (objectId: number) => {
    // Guard against null/undefined objectId
    if (!objectId) {
      return;
    }
    
    // Only update if different object is selected
    if (objectId !== selectedObjectId) {
      setSelectedObjectId(objectId);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("objectID", objectId.toString());
      window.history.pushState({}, "", url.toString());

    }
  };

  // ==========================================
  // Render Detail Content (Tab-Inhalte)
  // ==========================================
  
  const renderDetailContent = () => {
    if (!selectedObjectId) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="mx-6 my-6">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Info className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Wählen Sie ein Objekt aus der Liste
              </h3>
              <p className="text-gray-500">
                um Details und Grafana Dashboards anzuzeigen
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!selectedObject) {
      return (
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Card Content mit Header und Tab-Struktur */}
        <Card className="ml-[2px] mr-6 mt-6 mb-0 border-0">
          <CardContent className="p-0">
            <Tabs
              value={currentMainTab}
              onValueChange={(newTab) => {
                setCurrentMainTab(newTab);
                
                const currentUrl = new URL(window.location.href);
            
                
                if (newTab === "grafanareport") {
                  currentUrl.searchParams.set("typ", "report");
                  currentUrl.searchParams.delete("tap");
                } else if (newTab === "KI-Auswertung") {
                  currentUrl.searchParams.set("typ", "KI-Auswertung");
                  currentUrl.searchParams.delete("tap");
                } else if (newTab === "diagramme") {
                  currentUrl.searchParams.set("typ", "diagramme");
                } else if (newTab === "anlage") {
                  currentUrl.searchParams.set("typ", "anlage");
                } else if (newTab === "objektinfo") {
                  currentUrl.searchParams.set("typ", "objektinfo");
                }
                
                window.history.replaceState({}, '', currentUrl.toString());
              }}
              className="w-full"
            >
              <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 flex flex-col space-x-0 w-full rounded-none">
                {/* ========== OBJEKT-HEADER MIT STATUS ========== */}
                <div className="w-full px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>

                      {/* Title and ID with Status */}
                      <div>
                        <h1 className="text-lg font-bold text-gray-900 mb-1">
                          {selectedObject?.name}
                        </h1>
                        <div className="text-sm text-gray-600 font-medium">
                          Objekt-ID: {selectedObject?.objectid}
                          <ObjectStatusIndicator objectId={selectedObject?.objectid} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Back Button */}
                      {showBackButton && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            
                            // Prüfe URL-Parameter auf 'from' Parameter
                            const urlParams = new URLSearchParams(window.location.search);
                            const fromParam = urlParams.get('from');
                            
                            
                            if (fromParam) {
                              // Direkte Navigation basierend auf from Parameter
                              const targetRoute = fromParam === 'network-monitor' ? '/network-monitor' : 
                                                fromParam === 'dashboard' ? '/dashboard' :
                                                fromParam === 'objects' ? '/objects' :
                                                fromParam === 'efficiency-strategy' ? '/efficiency-strategy' :
                                                fromParam === 'maps' ? '/maps' :
                                                `/${fromParam}`;
                              
                              navigate(targetRoute);
                            } else if (window.history.length > 1 && document.referrer) {
                              window.history.back();
                            } else {
                              // Fallback zur erkannten referrer page
                              const fallbackRoute = referrerPage || "/dashboard";
                              navigate(fallbackRoute);
                            }
                          }}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                          title={(() => {
                            const urlParams = new URLSearchParams(window.location.search);
                            const fromParam = urlParams.get('from');
                            if (fromParam) {
                              return `Zurück zu ${
                                fromParam === 'network-monitor' ? 'Netzwächter' : 
                                fromParam === 'dashboard' ? 'KPI Dashboard' : 
                                fromParam === 'objects' ? 'Objektverwaltung' :
                                fromParam === 'efficiency-strategy' ? 'Effizienzstrategie' :
                                fromParam === 'maps' ? 'Objekt-Karte' :
                                fromParam.replace('-', ' ')
                              }`;
                            }
                            return referrerPage ? `Zurück zu ${
                              referrerPage === '/dashboard' ? 'KPI Dashboard' : 
                              referrerPage === '/network-monitor' ? 'Netzwächter' : 
                              referrerPage === '/objects' ? 'Objektverwaltung' :
                              referrerPage === '/efficiency-strategy' ? 'Effizienzstrategie' :
                              referrerPage.replace('/', '')
                            }` : 'Zurück zur vorherigen Seite';
                          })()}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Zurück</span>
                        </Button>
                      )}

                      {/* Edit Button - nur für Admin-Rolle */}
                      {(user as any)?.role === 'admin' && selectedObject && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate zur Objektverwaltung mit selectedObject
                            navigate(`/objects?objectId=${selectedObject.objectid}`);
                          }}
                          className="w-8 h-8 p-0"
                          title="Objekt bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                    </div>
                  </div>
                </div>

                {/* ========== TAB NAVIGATION ========== */}
                <div className="flex justify-start space-x-0 w-full">


                  <TabsTrigger
                    value="anlage"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <ViewColumnsIcon className="h-5 w-5" />
                      <span>Anlage</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="KI-Auswertung"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>KI-Auswertung</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="diagramme"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <PresentationChartLineIcon className="h-5 w-5" />
                      <span>Diagramme</span>
                    </div>
                  </TabsTrigger>


                  <TabsTrigger
                    value="grafanareport"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>GrafanaReport</span>
                    </div>
                  </TabsTrigger>

                  <TabsTrigger
                    value="objektinfo"
                    className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-600 hover:text-gray-800 bg-transparent rounded-none shadow-none"
                  >
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="h-5 w-5" />
                      <span>Objektinfo</span>
                    </div>
                  </TabsTrigger>

                </div>
              </TabsList>

              {/* ========== TAB CONTENT BEREICHE ========== */}
              
              {/* ========== ANLAGE TAB ========== */}
              {/* Komponente: @/components/SystemSchemaView */}
              <TabsContent value="anlage" className="p-6 pt-4">
                <div className="space-y-6">
                  {selectedObject?.meter && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 pt-[10px] pb-[10px]">
                      <SystemSchemaView 
                        meterData={selectedObject.meter}
                        objectId={selectedObject.objectid}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              
              {/* ========== OBJEKTINFO TAB ========== */}
              {/* Komponente: @/components/ObjektinfoContent */}
              <TabsContent value="objektinfo" className="p-0">
                <div className="p-6">
                  <ObjektinfoContent 
                    selectedObject={selectedObject}
                    showEditButton={false}
                  />
                </div>
              </TabsContent>

              {/* ========== KI-AUSWERTUNG TAB ========== */}
              {/* Komponenten: @/components/KI_energy, @/components/KI_energy_jahr_wrapper */}
              <TabsContent value="KI-Auswertung" className="p-6 pt-4">
                <div className="space-y-6">
                  {selectedObject ? (
                    <KIEnergyJahrWrapper
                      selectedObjectId={selectedObject.objectid.toString()}
                      selectedObjectMeter={selectedObject.meter || {}}
                      dailyConsumption={dailyConsumption || {}}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Keine Jahresauswertungsdaten verfügbar</p>
                      <p className="text-sm text-gray-400">Objekt auswählen um die Jahresanalyse anzuzeigen</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ========== DIAGRAMME TAB ========== */}
              {/* Komponente: @/components/GrafanaDiagramme */}
              <TabsContent value="diagramme" className="p-0">
                <div className="w-full">
                  {(() => {
                    return selectedObjectId ? (
                      <GrafanaDiagramme 
                        objectId={selectedObjectId} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="text-gray-500 text-lg mb-2">Kein Objekt ausgewählt</div>
                          <div className="text-gray-400 text-sm">
                            Wählen Sie ein Objekt aus der Liste aus, um Diagramme anzuzeigen
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>

              {/* ========== GRAFANA REPORT TAB ========== */}
              {/* Komponente: @/components/GrafanaReport */}
              <TabsContent value="grafanareport" className="p-0">
                <div className="grafana-content w-full">
                  {selectedObjectId ? (
                    <Card className="border-0">
                      <CardContent className="p-0">
                        <GrafanaReport 
                          objectId={selectedObjectId}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-500 text-lg mb-2">Kein Objekt ausgewählt</div>
                        <div className="text-gray-400 text-sm">
                          Wählen Sie ein Objekt aus der Liste aus, um den Grafana Report anzuzeigen
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ==========================================
  // Haupt-Render mit ObjectListLayout
  // ==========================================
  
  return (
    <ObjectListLayout
      title="Objekt Monitor"
      searchPlaceholder="Objekte durchsuchen..."
      onObjectSelect={handleObjectSelect}
      selectedObjectId={selectedObjectId}
      autoExpandFromUrl={hasUrlObjectId}
      showExpandButton={true}
      componentId="grafana-dashboard"
    >
      {renderDetailContent()}
    </ObjectListLayout>
  );
}
