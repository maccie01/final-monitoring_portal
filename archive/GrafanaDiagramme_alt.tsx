import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartBarIcon, ShareIcon, FireIcon } from "@heroicons/react/24/outline";
import { Leaf, BarChart3, BarChart2, TrendingUp, LineChart, Bug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { loadGrafanaConfig, buildGrafanaUrl } from '@/utils/grafanaConfig';
import { useAuth } from "@/hooks/useAuth";

interface StandardMeter {
  key: string;
  id: string;
  name: string;
}

interface SpecialMeter extends StandardMeter {
  panelId: number;
  panelType: 'overview' | 'main' | 'histogram';
  title: string;
  height: number;
}

interface Panel {
  id: string;
  originalId: string;
  meterId: string;
  url: string;
  panelId: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement;
  meters: StandardMeter[];
  panelId: number;
  panels?: Panel[]; // For URL lookup
  isSpecialLayout?: boolean;
}

interface SpecialTab {
  id: string;
  label: string;
  icon: React.ReactElement;
  meters: SpecialMeter[];
  panelId: number;
  panels?: Panel[]; // For URL lookup
  isSpecialLayout: true;
}

interface GrafanaDiagrammeProps {
  objectId: number;
  className?: string;
  dashboard?: string;
}

export const GrafanaDiagramme: React.FC<GrafanaDiagrammeProps> = ({
  objectId,
  className = "",
  dashboard
}) => {
  const { user } = useAuth();

  // Check if user has admin access
  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.role === 'superadmin';

  // Initialize activeTab from URL parameter 'tap'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tapParam = params.get('tap');
      return 0; // Will be properly set when tabs are available
    }
    return 0;
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d'); // Will be updated via useEffect
  const [selectedPanelId, setSelectedPanelId] = useState(3);
  const [histogrammsLoaded, setHistogrammsLoaded] = useState(false);
  const [loadedIframes, setLoadedIframes] = useState(new Set<string>());
  const [failedIframes, setFailedIframes] = useState(new Set<string>());

  // Function to update URL with tab parameter
  const updateTabInUrl = useCallback((tabId: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tap', tabId);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Fetch selected object details
  const { data: selectedObject } = useQuery<any>({
    queryKey: ["/api/objects/by-objectid", objectId],
    enabled: !!objectId,
  });

  // Fetch energy meter data to detect TempID
  const { data: energyMetersData } = useQuery<any>({
    queryKey: ["/api/energy-data-meters", objectId],
    enabled: !!objectId,
  });

  // Fetch histogram settings from database
  const { data: histogramSettings } = useQuery<any[]>({
    queryKey: ["/api/settings"],
    staleTime: 0, // Force fresh data
    select: (data: any[]) => {
      const setting = data?.find(setting => setting.key_name === 'histogram')?.value;
      // Return the complete setting object (new structure) or empty array
      return setting;
    },
  });

  // Fetch defaultGrafana settings for TempID logic
  const { data: defaultGrafanaSettings } = useQuery<any[]>({
    queryKey: ["/api/settings"],
    staleTime: 0,
    gcTime: 0, // TanStack Query v5
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    select: (data: any[]) => {
      const setting = data?.find(setting => setting.key_name === 'defaultGrafana')?.value;
      return setting;
    },
  });

  // Parse URL parameters to detect netzwächter mode and active tab
  const urlParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlData = {
        objectID: params.get('objectID'),
        typ: params.get('typ'),
        tap: params.get('tap'),
        from: params.get('from')
      };
      return urlData;
    }
    return { objectID: null, typ: null, tap: null, from: null };
  }, []);

  // Check if netzwächter mode is active via Z20541-only detection OR TempID-only detection
  const isNetzwaechterMode = useMemo(() => {
    // Check if only Z20541 meter exists (automatic detection for single Netz-Meter)
    const isZ20541Only = selectedObject?.meter ? (() => {
      const meterKeys = Object.keys(selectedObject.meter);
      const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054')); // Only Netz-Meter (Z2054*)
      return netzMeters.length === 1 && netzMeters[0] === 'Z20541';
    })() : false;
    
    // Auto-activate for Enhanced mode (mehrere Z2054x Meter)
    const isEnhancedMode = selectedObject?.meter ? (() => {
      const meterKeys = Object.keys(selectedObject.meter);
      const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054'));
      return netzMeters.length > 1; // Mehr als ein Netz-Meter
    })() : false;
    
    const isActive = isZ20541Only || isEnhancedMode;
    
    console.log('🔧 [NETZWÄCHTER-MODE] Z20541-only:', isZ20541Only, '| Enhanced:', isEnhancedMode);
    console.log('🔧 [NETZWÄCHTER-MODE] FINAL MODE:', isActive);
    
    return isActive;
  }, [selectedObject]);

  // Fetch netzwaechter settings for URL-based netzwächter mode
  const { data: netzwaechterSettings } = useQuery<any>({
    queryKey: ["/api/settings"],
    staleTime: 0,
    enabled: Boolean(isNetzwaechterMode), // Convert to boolean to avoid React Query error
    select: (data: any[]) => {
      const setting = data?.find(setting => setting.key_name === 'netzwaechter')?.value;
      return setting;
    },
  });

  // Set default time range from defaultGrafana settings
  useEffect(() => {
    if (defaultGrafanaSettings) {
      const defaultInterval = (defaultGrafanaSettings as any)?.defaultInterval;
      if (defaultInterval) {
        console.log('🔧 [DEFAULT-INTERVAL] Using defaultInterval from settings:', defaultInterval);
        setSelectedTimeRange(defaultInterval);
      } else {
        console.log('🔧 [DEFAULT-INTERVAL] No defaultInterval found');
        setSelectedTimeRange('7d');
      }
    }
  }, [defaultGrafanaSettings]);

  // Check for TempID in meter data with z20451 logic recognition
  const hasTempID = useMemo(() => {
    // Check selectedObject.meter for TempID
    const tempIDFromObject = selectedObject?.meter?.TempID;
    const z20451ID = selectedObject?.meter?.Z20451;
    
    // ENHANCED: Check if TempID exists as a key in meter data structure
    const tempIDAsKey = selectedObject?.meter && 'TempID' in selectedObject.meter;
    
    const hasTempIDValue = !!tempIDFromObject || tempIDAsKey;
    
    console.log('🔧 [TEMP-ID] Checking TempID - Object:', tempIDFromObject);
    console.log('🔧 [TEMP-ID] Enhanced checks - AsKey:', tempIDAsKey);
    console.log('🔧 [TEMP-ID] Z20451 ID:', z20451ID);
    if (selectedObject?.meter) {
      console.log('🔧 [TEMP-ID] Available object meter keys:', Object.keys(selectedObject.meter));
    }
    if (z20451ID && tempIDFromObject) {
      console.log('🎯 [Z20451-LOGIC] Special z20451 logic detected for TempID:', tempIDFromObject);
    }
    
    if (hasTempIDValue) {
      console.log('🎯 [TEMP-ID-DETECTED] TempID system activated for object:', selectedObject?.objectid);
      console.log('🎯 [TEMP-ID-PATTERN] Detection method:', {
        explicitTempID: !!tempIDFromObject,
        tempIDAsKey: tempIDAsKey
      });
    }
    
    return hasTempIDValue;
  }, [selectedObject]);

  // Generate panel options from histogramm settings
  const panelOptions = useMemo(() => {
    // Check for TempID-specific configuration first
    if (hasTempID && defaultGrafanaSettings) {
      // Get TempDiagrammPanelId from array structure (correct structure)
      let tempPanelId = 3; // Default value
      let tempLabel = 'Temperatur-Verlauf'; // Default value
      
      // Look in defaultPanelid array for TempDiagrammPanelId (correct structure)
      if ((defaultGrafanaSettings as any)?.setupGrafana?.defaultPanelid) {
        const tempConfig = (defaultGrafanaSettings as any)?.setupGrafana?.defaultPanelid?.find(
          (item: any) => item.TempDiagrammPanelId && item.TempDiagrammPanelIdLabel
        );
        if (tempConfig) {
          tempPanelId = tempConfig.TempDiagrammPanelId;
          tempLabel = tempConfig.TempDiagrammPanelIdLabel;
        }
      }
      
      console.log('🔧 [TEMP-ID] Using TempDiagrammPanelId:', tempPanelId, 'Label:', tempLabel);
      
      if (tempPanelId && tempLabel) {
        const tempOption = { value: tempPanelId, label: tempLabel };
        return [tempOption]; // Only show temperature option for TempID objects
      }
    }
    
    const baseOption = { value: 3, label: 'Diagramm' };
    
    console.log('🔧 [HISTOGRAM] Histogram settings geladen:', histogramSettings);
    console.log('🔧 [HISTOGRAM] Settings Typ:', typeof histogramSettings, Array.isArray(histogramSettings));
    
    if (histogramSettings) {
      // Check if settings has the new structure with panelID and label arrays
      if (!Array.isArray(histogramSettings) && (histogramSettings as any).panelID && (histogramSettings as any).label) {
        const { panelID, label } = histogramSettings as any;
        console.log('🔧 [HISTOGRAM] Verwende neue panelID/label Struktur - panelIds:', panelID, 'Labels:', label);
        
        const dynamicOptions = panelID.map((panelId: number, index: number) => {
          const optionLabel = label[index] || `Panel ${panelId}`;
          return {
            value: panelId,
            label: optionLabel
          };
        });

        return [baseOption, ...dynamicOptions];
      }
      
      // Check if settings has the old structure with histogram and bezeichnung arrays (backward compatibility)
      if (!Array.isArray(histogramSettings) && (histogramSettings as any).histogram && (histogramSettings as any).bezeichnung) {
        const { histogram, bezeichnung } = histogramSettings as any;
        console.log('🔧 [HISTOGRAM] Verwende alte histogram/bezeichnung Struktur - panelIds:', histogram, 'Bezeichnungen:', bezeichnung);
        
        const dynamicOptions = histogram.map((panelId: number, index: number) => {
          const label = bezeichnung[index] || `Panel ${panelId}`;
          return {
            value: panelId,
            label: `Histogramm ${label}`
          };
        });

        return [baseOption, ...dynamicOptions];
      }
      
      // Support for old array format
      if (Array.isArray(histogramSettings)) {
        const panelIdToLabel: Record<number, string> = {
          4: 'Temperatur',
          5: 'Leistung', 
          7: 'Durchfluss',
          16: 'Sonstige'
        };
        
        console.log('🔧 [HISTOGRAM] Verwende alte Array-Struktur:', histogramSettings);
        
        const dynamicOptions = (histogramSettings as number[]).map((panelId: number) => {
          const label = panelIdToLabel[panelId] || `Panel ${panelId}`;
          return {
            value: panelId,
            label: `Histogramm ${label}`
          };
        });

        return [baseOption, ...dynamicOptions];
      }
    }
    
    // Default values
    const defaultOptions = [
      { value: 4, label: 'Histogramm Temperatur' },
      { value: 5, label: 'Histogramm Leistung' },
      { value: 7, label: 'Histogramm Durchfluss' }
    ];
    
    console.log('🔧 [HISTOGRAM] Verwende Default-Werte');
    return [baseOption, ...defaultOptions];
  }, [histogramSettings, hasTempID, defaultGrafanaSettings]);

  // Generate tabs based on available meters and URL parameters

  const tabs = useMemo(() => {
    // Use energyMetersData if available, otherwise fall back to selectedObject.meter
    const meterData = energyMetersData || selectedObject?.meter;
    if (!meterData) return [];
    
    console.log('🔧 [METER-DATA] Using meter data from:', energyMetersData ? 'energyMetersData' : 'selectedObject.meter', 'Keys:', Object.keys(meterData));
    const generatedTabs: (Tab | SpecialTab)[] = [];
    const currentPanelId = selectedPanelId;

    
    // Special case: Netzwächter mode via URL parameter - use netzwaechter settings for multi-panel layout
    if (isNetzwaechterMode) {
      console.log('🔧 [NETZWÄCHTER-MODE] Netzwächter mode detected!');
      console.log('🔧 [NETZWÄCHTER-MODE] Settings:', netzwaechterSettings);
      console.log('🔧 [URL-PARAMS] Detected objectID:', urlParams.objectID, 'typ:', urlParams.typ);
      
      if (!netzwaechterSettings) {
        console.log('⚠️ [NETZWÄCHTER-MODE] No settings found, using defaults');
      }
    }
    
    if (isNetzwaechterMode && netzwaechterSettings) {
      console.log('🔧 [NETZWÄCHTER-MODE] Using netzwaechter settings for URL-based layout:', netzwaechterSettings);
      
      // Find all available netz meters (Z2045x for multi-netz, Z2054x for single netz)
      const netzMeters: StandardMeter[] = Object.entries(meterData)
        .filter(([key]) => key?.startsWith('Z2054') || key?.startsWith('Z2045'))
        .map(([key, value]) => ({
          key,
          id: String(typeof value === 'object' && value ? ((value as any).ID || (value as any).meterId || key) : (value || key)),
          name: key === 'Z20541' ? 'Netz1' : 
                key === 'Z20451' ? 'Netz1' : 
                key === 'Z20452' ? 'Netz2' : 
                key === 'Z20453' ? 'Netz3' : 
                key === 'Z20542' ? 'Netz2' : 
                key === 'Z20543' ? 'Netz3' : key
        }));

      if (netzMeters.length > 0) {
        // Enhanced Tab-Generierung: Bei mehreren Netz-Metern separate Tabs für jeden Meter
        if (netzMeters.length > 1) {
          console.log('🎯 [ENHANCED-TAB-GENERATION] Enhanced-Modus erkannt! Generiere separate Tabs für', netzMeters.length, 'Netz-Meter');
          
          // Erstelle separaten Tab für jeden Netz-Meter
          netzMeters.forEach((meter, index) => {
            const netzwaechterPanels: SpecialMeter[] = [
              {
                ...meter,
                key: `${meter.key}-overview`,
                panelId: netzwaechterSettings.panelId || 16,
                panelType: 'overview',
                title: 'Übersicht',
                height: parseInt(netzwaechterSettings.height) || 200
              },
              {
                ...meter,
                key: `${meter.key}-main`,
                panelId: selectedPanelId,
                panelType: 'main',
                title: panelOptions.find(opt => opt.value === selectedPanelId)?.label || 'Diagramm',
                height: parseInt(netzwaechterSettings.height) || 200
              }
            ];
            
            const netzPanels = netzwaechterPanels.map(specialMeter => ({
              id: `panel-${specialMeter.key}-${specialMeter.panelType}`,
              originalId: specialMeter.key,
              meterId: specialMeter.id,
              url: `https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-7d&to=now&panelId=${specialMeter.panelId}&var-id=${specialMeter.id}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`,
              panelId: specialMeter.panelId.toString()
            }));

            generatedTabs.push({
              id: `netzwaechter-${meter.key}`,
              label: meter.name,
              icon: <ShareIcon className="h-4 w-4" />,
              meters: netzwaechterPanels,
              panelId: selectedPanelId,
              panels: netzPanels,
              isSpecialLayout: true
            } as SpecialTab);
            
            console.log('🎯 [ENHANCED-TAB] Added', meter.name, 'tab with', netzwaechterPanels.length, 'panels');
          });
        } else {
          // Z20541-Only Modus: Bisheriges Verhalten für einzelnen Netz-Meter
          const primaryMeter = netzMeters[0];
          const netzwaechterPanels: SpecialMeter[] = [];
          
          // Overview panel (left top - usually panel 16 or panelId from settings)
          const overviewPanelId = netzwaechterSettings.panelId || 16;
          netzwaechterPanels.push({
            ...primaryMeter,
            key: `${primaryMeter.key}-overview`, // Unique key for lookup
            panelId: overviewPanelId,
            panelType: 'overview',
            title: 'Übersicht',
            height: parseInt(netzwaechterSettings.height) || 200
          });

          // Main dashboard panel (right top - uses selectedPanelId for dynamic switching)
          const mainPanelId = selectedPanelId; // Use selected panel from dropdown
          netzwaechterPanels.push({
            ...primaryMeter,
            key: `${primaryMeter.key}-main`, // Unique key for lookup
            panelId: mainPanelId,
            panelType: 'main',
            title: panelOptions.find(opt => opt.value === selectedPanelId)?.label || 'Diagramm',
            height: parseInt(netzwaechterSettings.height) || 200
          });

          // Add histogram panels from netzwaechter settings
          if (netzwaechterSettings.histogram && Array.isArray(netzwaechterSettings.histogram)) {
            netzwaechterSettings.histogram.forEach((panelId: number, index: number) => {
              const histogramTitles = ['Häufigkeit Temperaturen', 'Häufigkeit Leistung', 'Häufigkeit Durchfluss'];
              const histogramSuffixes = ['temperaturen', 'leistung', 'durchfluss'];
              netzwaechterPanels.push({
                ...primaryMeter,
                key: `${primaryMeter.key}-histogram-${histogramSuffixes[index] || index}`, // Unique key for each histogram
                panelId: panelId,
                panelType: 'histogram',
                title: histogramTitles[index] || `Histogramm ${index + 1}`,
                height: parseInt(netzwaechterSettings.histogramHeight) || 280
              });
            });
          } else {
            // Default histogram panels if not configured
            const defaultHistogramPanels = [
              { panelId: 4, title: 'Häufigkeit Temperaturen', suffix: 'temperaturen' },
              { panelId: 5, title: 'Häufigkeit Leistung', suffix: 'leistung' },
              { panelId: 7, title: 'Häufigkeit Durchfluss', suffix: 'durchfluss' }
            ];
            
            defaultHistogramPanels.forEach(panel => {
              netzwaechterPanels.push({
                ...primaryMeter,
                key: `${primaryMeter.key}-histogram-${panel.suffix}`, // Unique key for each histogram
                panelId: panel.panelId,
                panelType: 'histogram',
                title: panel.title,
                height: 280
              });
            });
          }

          // Generate panels array for URL lookup - one panel per SpecialMeter with unique originalId matching meter.key
          const netzPanels = netzwaechterPanels.map((meter, index) => ({
            id: `panel-${meter.key}-${meter.panelType}`,
            originalId: meter.key, // Use the unique meter.key for matching
            meterId: meter.id,
            url: `https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-7d&to=now&panelId=${meter.panelId}&var-id=${meter.id}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`,
            panelId: meter.panelId.toString()
          }));

          generatedTabs.push({
            id: "netzwaechter",
            label: "Netz",
            icon: <ShareIcon className="h-4 w-4" />,
            meters: netzwaechterPanels,
            panelId: mainPanelId,
            panels: netzPanels, // Add panels array for URL lookup
            isSpecialLayout: true
          } as SpecialTab);
          
          console.log('🔧 [NETZWÄCHTER-SPECIAL] Added Netz tab with', netzwaechterPanels.length, 'special meters and', netzPanels.length, 'panels');
        }
        
        // Add Kessel and Wärmepumpe tabs to netzwächter layout
        // Kesselwächter Tab - Z20141, Z20142, Z20143
        const kesselMeters: StandardMeter[] = Object.entries(meterData)
          .filter(([key]) => key?.startsWith('Z2014'))
          .map(([key, value]) => ({
            key,
            id: String(typeof value === 'object' && value ? ((value as any).ID || (value as any).meterId || key) : (value || key)),
            name: key === 'Z20141' ? 'Kessel1' : key === 'Z20142' ? 'Kessel2' : key === 'Z20143' ? 'Kessel3' : key
          }));
        
        if (kesselMeters.length > 0) {
          // Use selectedPanelId (user-selectable diagramm panel) for Kessel
          const kesselPanelId = selectedPanelId;
          console.log('🔧 [KESSEL-PANEL] Using selectedPanelId as kesselPanelId:', kesselPanelId);
          
          // Generate panels with URLs for Kessel meters
          const kesselPanels = kesselMeters.map(meter => ({
            id: `panel-${meter.key}`,
            originalId: meter.key,
            meterId: meter.id,
            url: `https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-7d&to=now&panelId=${kesselPanelId}&var-id=${meter.id}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`,
            panelId: kesselPanelId.toString()
          }));

          generatedTabs.push({
            id: "kesselwaechter", 
            label: "Kessel",
            icon: <FireIcon className="h-4 w-4" />,
            meters: kesselMeters,
            panelId: kesselPanelId,
            panels: kesselPanels
          });
          console.log('🔧 [KESSEL-TAB] Added Kessel tab with', kesselMeters.length, 'meters and', kesselPanels.length, 'panels');
        }
        
        // Wärmepumpenwächter Tab - Z20241, Z20242, Z20243
        const waermepumpeMeters: StandardMeter[] = Object.entries(meterData)
          .filter(([key]) => key?.startsWith('Z2024'))
          .map(([key, value]) => ({
            key,
            id: String(typeof value === 'object' && value ? ((value as any).ID || (value as any).meterId || key) : (value || key)),
            name: key === 'Z20241' ? 'Wärmepumpe1' : key === 'Z20242' ? 'Wärmepumpe2' : key === 'Z20243' ? 'Wärmepumpe3' : key
          }));
        
        if (waermepumpeMeters.length > 0) {
          // Use selectedPanelId (user-selectable diagramm panel) for Wärmepumpe
          const waermepumpePanelId = selectedPanelId;
          console.log('🔧 [WÄRMEPUMPE-PANEL] Using selectedPanelId as waermepumpePanelId:', waermepumpePanelId);
          
          // Generate panels with URLs for Wärmepumpe meters
          const waermepumpePanels = waermepumpeMeters.map(meter => ({
            id: `panel-${meter.key}`,
            originalId: meter.key,
            meterId: meter.id,
            url: `https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-7d&to=now&panelId=${waermepumpePanelId}&var-id=${meter.id}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`,
            panelId: waermepumpePanelId.toString()
          }));

          generatedTabs.push({
            id: "waermepumpenwaechter", 
            label: "Wärmepumpe",
            icon: <Leaf className="h-4 w-4" />,
            meters: waermepumpeMeters,
            panelId: waermepumpePanelId,
            panels: waermepumpePanels
          });
          console.log('🔧 [WÄRMEPUMPE-TAB] Added Wärmepumpe tab with', waermepumpeMeters.length, 'meters and', waermepumpePanels.length, 'panels');
        }

        return generatedTabs;
      }
    }
    
    // TempID Tab-Generierung (Standard-Modus)
    if (hasTempID && defaultGrafanaSettings) {
      const tempPanelId = (defaultGrafanaSettings as any)?.setupGrafana?.TempDiagrammPanelId || 3;
      
      // Generate TempID panels
      const tempPanels = [{
        id: `panel-tempid`,
        originalId: 'tempid',
        meterId: String(selectedObject?.meter?.TempID || selectedObject?.objectid),
        url: `https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-7d&to=now&panelId=${tempPanelId}&var-id=${selectedObject?.meter?.TempID}&__feature=dashboardSceneSolo&kiosk=1&refresh=1m`,
        panelId: tempPanelId.toString()
      }];

      generatedTabs.push({
        id: "temperatur",
        label: "Temperatur",
        icon: <TrendingUp className="h-4 w-4" />,
        meters: [{
          key: 'TempID',
          id: String(selectedObject?.meter?.TempID || selectedObject?.objectid),
          name: 'Temperatur'
        }],
        panelId: tempPanelId,
        panels: tempPanels
      });
      console.log('🔧 [TEMP-TAB] Added Temperatur tab for TempID:', selectedObject?.meter?.TempID);
    }
    
    // Standard mode: For objects without netzwächter configuration
    console.log('🔧 [STANDARD-MODE] No netzwächter configuration - would generate standard tabs here');
    
    return generatedTabs;
  }, [selectedObject, energyMetersData, selectedPanelId, isNetzwaechterMode, netzwaechterSettings, hasTempID, defaultGrafanaSettings]);

  // Time range options - separate short term and yearly
  const shortTermRanges = [
    { value: '24h', label: 'Letzte 24h', from: 'now-24h', to: 'now' },
    { value: '3d', label: '3 Tage', from: 'now-3d', to: 'now' },
    { value: '7d', label: '7 Tage', from: 'now-7d', to: 'now' },
    { value: '30d', label: '30 Tage', from: 'now-30d', to: 'now' },
    { value: '90d', label: '3 Monate', from: 'now-90d', to: 'now' },
    { value: '6M', label: '6 Monate', from: 'now-6M', to: 'now' },
    { value: '1y', label: '12 Monate', from: 'now-1y', to: 'now' }
  ];

  const yearlyRanges = [
    { value: '2024', label: '2024', from: 'now-1y/y', to: 'now-1y/y' },
    { value: '2023', label: '2023', from: 'now-2y/y', to: 'now-2y/y' }
  ];

  const allTimeRanges = useMemo(() => [...shortTermRanges, ...yearlyRanges], []);

  // Stable session timestamp - completely stable per component lifecycle
  const stableSessionTimestamp = useMemo(() => Date.now(), []);

  // Stable iframe references for smooth time range switching
  const [iframeRefs] = useState(() => new Map<string, HTMLIFrameElement>());
  
  // Generate base URL without time parameters
  const getBaseGrafanaUrl = useCallback(async (meterId: string, panelId: number) => {
    const config = await loadGrafanaConfig();
    const dashboardPath = dashboard || config.defaultDashboard;
    const dashboardUrl = dashboardPath.startsWith('http') 
      ? dashboardPath 
      : `${config.baseUrl}/${dashboardPath.replace(/^\/+/, '')}`;
    
    // Use TempID directly for TempID objects (when meterId is the actual TempID)
    if (selectedObject?.meter?.TempID && meterId === String(selectedObject.meter.TempID)) {
      console.log('🔧 [URL-TEMP] Using TempID URL format for TempID:', meterId, 'panelId:', panelId);
      return `${dashboardUrl}?var-id=${meterId}&panelId=${panelId}`;
    }
    
    // Fallback: Use objectId for TempID objects when meterId matches objectId
    if (selectedObject?.meter?.TempID && meterId === String(objectId)) {
      console.log('🔧 [URL-FALLBACK] Using objectId fallback for TempID object:', objectId, 'actual TempID:', selectedObject.meter.TempID);
      return `${dashboardUrl}?var-id=${selectedObject.meter.TempID}&panelId=${panelId}`;
    }
    
    // Keep original format for other meters
    const stableIframeKey = `diagramme_${objectId}_${panelId}_${meterId}`;
    return `${dashboardUrl}?orgId=1&panelId=${panelId}&var-id=${meterId}&__feature.dashboardSceneSolo&refresh=${stableSessionTimestamp}&iframe=${stableIframeKey}&kiosk=1&t=${stableSessionTimestamp}`;
  }, [objectId, dashboard, stableSessionTimestamp]);

  // Dynamic URL with current time range - updates smoothly
  const getCurrentGrafanaUrl = useCallback((meterId: string, panelId: number) => {
    const baseUrl = getBaseGrafanaUrl(meterId, panelId);
    const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
    const finalCacheKey = `cache_${selectedTimeRange}_${meterId}`;
    
    return `${baseUrl}&from=${timeRange?.from || 'now-24h'}&to=${timeRange?.to || 'now'}&cache=${finalCacheKey}`;
  }, [getBaseGrafanaUrl, selectedTimeRange, allTimeRanges]);

  // Smooth time range update without iframe reload
  const updateIframeTimeRange = useCallback((meterId: string, panelId: number) => {
    const iframeKey = `${meterId}_${panelId}`;
    const iframe = iframeRefs.get(iframeKey);
    
    if (iframe) {
      const newUrl = getCurrentGrafanaUrl(meterId, panelId);
      if (iframe.src !== newUrl) {
        iframe.src = newUrl;
        console.log(`🔄 [SMOOTH UPDATE] Updated time range for ${meterId}`);
      }
    }
  }, [getCurrentGrafanaUrl, iframeRefs]);

  // IMMEDIATE dashboard cleanup - synchronous cleanup on component initialization
  const isDashboardNavigation = useMemo(() => {
    return urlParams.from === 'dashboard';
  }, [urlParams]); // Update when URL params change

  // Track if cleanup was already performed to avoid repeated cleanup
  const [cleanupPerformed, setCleanupPerformed] = useState(false);

  // Track if user recently clicked a tab to prevent URL override
  const [userClickedTab, setUserClickedTab] = useState(false);
  
  // Lazy load histograms after main panels are loaded (2 seconds delay)
  useEffect(() => {
    if (activeTab === 0 && tabs.length > 0 && tabs[0]?.id === 'netzwaechter') {
      const timer = setTimeout(() => {
        console.log('🚀 [LAZY-LOAD] Loading histograms after 2s delay');
        setHistogrammsLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Reset for other tabs
      setHistogrammsLoaded(false);
    }
  }, [activeTab, tabs]);

  // Initial tab sync - only for page load and dashboard navigation
  useEffect(() => {
    if (!tabs.length || userClickedTab) return; // Skip if user just clicked a tab
    
    // Read tap parameter directly from URL to avoid state lag
    const currentUrl = new URL(window.location.href);
    const tapParam = currentUrl.searchParams.get('tap');
    
    if (tapParam) {
      // URL has tap parameter - sync to activeTab if different AND tab exists
      const tabIndex = tabs.findIndex(tab => tab.id === tapParam);
      if (tabIndex !== -1 && tabIndex !== activeTab) {
        setActiveTab(tabIndex);
      }
    } else if (!isDashboardNavigation) {
      // No tap parameter and not dashboard navigation - set first tab in URL
      if (tabs.length > 0) {
          updateTabInUrl(tabs[0].id);
      }
    } else {
      // Dashboard navigation - set first tab and ADD URL parameter 
      if (tabs.length > 0) {
        if (activeTab !== 0) {
          setActiveTab(0);
        }
        updateTabInUrl(tabs[0].id);
      }
    }
  }, [tabs, isDashboardNavigation, userClickedTab]); // Removed urlParams.tap dependency

  // Reset userClickedTab flag after URL params have updated
  useEffect(() => {
    if (userClickedTab) {
      const timeout = setTimeout(() => {
        setUserClickedTab(false);
      }, 1000); // Increased to 1000ms to prevent URL override
      return () => clearTimeout(timeout);
    }
  }, [userClickedTab]);

  // Simple iframe update on tab change - Use pregenerated URLs from tabs
  useEffect(() => {
    if (!tabs[activeTab]) return;
    
    tabs[activeTab].meters.forEach((meter) => {
      const iframeKey = `${meter.id}_${tabs[activeTab].panelId}`;
      const iframe = iframeRefs.get(iframeKey);
      
      if (iframe && !iframe.src) {
        // First try to use pregenerated URL from tab panels if available
        const panelWithUrl = tabs[activeTab].panels?.find(panel => 
          panel.meterId === meter.id || panel.originalId === meter.key
        );
        
        if (panelWithUrl?.url && panelWithUrl.url !== '') {
          console.log('🔧 [IFRAME-URL] Using pregenerated URL from tab panel:', panelWithUrl.url);
          iframe.src = panelWithUrl.url;
        }
      }
    });
  }, [activeTab, tabs]);

  if (!selectedObject) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Grafana Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {tabs.length > 0 ? (
        <Card className="border-0">
          <CardContent className="p-6">
            {/* Tab Navigation with Time Range Selection - Inside Card */}
            <div className="flex items-center justify-between modern-tab-nav bg-white mb-6">
              <div className="flex">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setUserClickedTab(true);
                      setActiveTab(index);
                      updateTabInUrl(tab.id);
                    }}
                    className={`modern-tab-button flex items-center space-x-2 ${
                      activeTab === index ? "active" : ""
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Panel Type Dropdown + Time Range Selection */}
              <div className="pb-3 pr-2 flex gap-3 items-center">
                {/* Panel Type Dropdown with Icon - Hidden for TempID special cases */}
                {!hasTempID && (
                  <div className="relative">
                    <BarChart2 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />
                    <select
                      value={selectedPanelId}
                      onChange={(e) => setSelectedPanelId(Number(e.target.value))}
                      className={`pl-8 pr-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedPanelId !== 3
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300'
                      } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                      style={{ width: '140px' }}
                    >
                      {panelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Dropdown for short-term ranges */}
                <select
                  value={shortTermRanges.some(range => range.value === selectedTimeRange) ? selectedTimeRange : ''}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    shortTermRanges.some(range => range.value === selectedTimeRange)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300'
                  } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                  style={{ width: '120px' }}
                >
                  <option value="" disabled>Zeitraum</option>
                  {shortTermRanges.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {/* Year buttons */}
                {yearlyRanges.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      selectedTimeRange === option.value
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content - All iframes always rendered but hidden/shown to prevent recreation */}
            <div className="space-y-6 max-w-6xl mx-auto">
              {(() => {
                console.log(`🔍 [TAB-STRUCTURE] Total tabs: ${tabs.length}`);
                tabs.forEach((tab, index) => {
                  console.log(`🔍 [TAB-${index}] ${tab.label} - ID: ${tab.id}, Panels: ${tab.panels?.length || 0}, Meters: ${tab.meters?.length || 0}`);
                  if (tab.panels && tab.panels.length > 0) {
                    tab.panels.forEach((panel, panelIndex) => {
                      console.log(`  📋 [PANEL-${panelIndex}] originalId: ${panel.originalId}, meterId: ${panel.meterId}, hasURL: ${!!panel.url}`);
                    });
                  }
                });
                return null;
              })()}
              {tabs.map((tab, tabIndex) => (
                <div 
                  key={tab.id} 
                  className={`${tabIndex === activeTab ? 'block' : 'hidden'}`}
                  style={{ display: tabIndex === activeTab ? 'block' : 'none' }}
                >
                  {(tab as SpecialTab).isSpecialLayout ? (
                    // Special netzwächter layout: 2x3 grid (overview + main top, 3 histograms bottom)
                    <div className="space-y-0.5">
                      {/* Top Row: Overview Panel (left) + Main Dashboard (right) */}
                      <div className="flex gap-0.5">
                        {/* Overview Panel (left top) */}
                        {(tab as SpecialTab).meters.filter(m => m.panelType === 'overview').map((meter: SpecialMeter) => (
                          <div key={`overview-${meter.panelId}-${meter.id || meter.key || 'meter'}`} style={{ width: netzwaechterSettings.panelIdWidth || '140px', flexShrink: 0 }}>
                            <div className="overflow-hidden">
                              <iframe
                                key={`iframe-stable-${meter.id || meter.key || 'meter'}-overview-${stableSessionTimestamp}`}
                                ref={(el) => {
                                  if (el) {
                                    const iframeKey = `${meter.id}_${meter.panelId}`;
                                    iframeRefs.set(iframeKey, el);
                                  }
                                }}
                                src={(tabIndex === activeTab && (meter.panelType !== 'histogram' || histogrammsLoaded)) ? (() => {
                                  // Enhanced Panel-URL Lookup mit allen verfügbaren Panels
                                  const allPanels = tabs[tabIndex]?.panels || [];
                                  console.log(`🔍 [PANEL-LOOKUP] For ${meter.panelType || 'meter'} ${meter.key}/${meter.id}, checking ${allPanels.length} panels`);
                                  
                                  // Lookup-Versuche
                                  let panelWithUrl = allPanels.find(panel => panel.originalId === meter.key);
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => panel.meterId === meter.id);
                                  }
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => String(panel.meterId) === String(meter.id));
                                  }
                                  
                                  console.log(`🔍 [PANEL-LOOKUP] Found panel:`, panelWithUrl ? 'YES' : 'NO', panelWithUrl?.url ? 'with URL' : 'without URL');
                                  
                                  if (panelWithUrl?.url && panelWithUrl.url !== '') {
                                    // Generate dynamic URL with current time range
                                    const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
                                    // Replace only time parameters, keep all other parameters intact
                                    let dynamicUrl = panelWithUrl.url
                                      .replace(/&from=[^&]*/, `&from=${timeRange?.from || 'now-7d'}`)
                                      .replace(/&to=[^&]*/, `&to=${timeRange?.to || 'now'}`);
                                    return dynamicUrl;
                                  }
                                  return 'data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial;color:%23dc2626;background:%23fef2f2;"><div style="text-align:center;"><h3>Fehler: Meter konnte nicht aufgelöst werden</h3><p style="color:%236b7280;">Grafana-URL konnte nicht generiert werden</p></div></div>';
                                })() : 'about:blank'}
                                width="100%"
                                height={meter.height || 200}
                                style={{ 
                                  border: 'none',
                                  minHeight: '200px',
                                  maxWidth: '100%'
                                }}
                                title={meter.title}
                                className="border-none rounded-md"
                                loading={tabIndex === activeTab ? "eager" : "lazy"}
                                onLoad={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  if (tabIndex === activeTab) {
                                    console.log(`🎯 [ULTRA-STABLE] Overview panel loaded for ${meter?.name} (${meter?.id})`);
                                    setLoadedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.add(iframeKey);
                                      return newSet;
                                    });
                                    setFailedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(iframeKey);
                                      return newSet;
                                    });
                                  }
                                }}
                                onError={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  console.error(`❌ [IFRAME-ERROR] Failed to load overview panel ${meter?.name} (${meter?.id})`);
                                  setFailedIframes(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(iframeKey);
                                  return newSet;
                                });
                                  setLoadedIframes(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(iframeKey);
                                    return newSet;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Main Dashboard Panel (right top) */}
                        {(tab as SpecialTab).meters.filter(m => m.panelType === 'main').map((meter: SpecialMeter) => (
                          <div key={`main-${meter.panelId}-${meter.id || meter.key || 'meter'}`} className="flex-1">
                            <div className="overflow-hidden">
                              <iframe
                                key={`iframe-stable-${meter.id || meter.key || 'meter'}-main-${stableSessionTimestamp}`}
                                ref={(el) => {
                                  if (el) {
                                    const iframeKey = `${meter.id}_${meter.panelId}`;
                                    iframeRefs.set(iframeKey, el);
                                  }
                                }}
                                src={(tabIndex === activeTab && (meter.panelType !== 'histogram' || histogrammsLoaded)) ? (() => {
                                  // Enhanced Panel-URL Lookup mit allen verfügbaren Panels
                                  const allPanels = tabs[tabIndex]?.panels || [];
                                  console.log(`🔍 [PANEL-LOOKUP] For ${meter.panelType || 'meter'} ${meter.key}/${meter.id}, checking ${allPanels.length} panels`);
                                  
                                  // Lookup-Versuche
                                  let panelWithUrl = allPanels.find(panel => panel.originalId === meter.key);
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => panel.meterId === meter.id);
                                  }
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => String(panel.meterId) === String(meter.id));
                                  }
                                  
                                  console.log(`🔍 [PANEL-LOOKUP] Found panel:`, panelWithUrl ? 'YES' : 'NO', panelWithUrl?.url ? 'with URL' : 'without URL');
                                  
                                  if (panelWithUrl?.url && panelWithUrl.url !== '') {
                                    // Generate dynamic URL with current time range
                                    const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
                                    // Replace only time parameters, keep all other parameters intact
                                    let dynamicUrl = panelWithUrl.url
                                      .replace(/&from=[^&]*/, `&from=${timeRange?.from || 'now-7d'}`)
                                      .replace(/&to=[^&]*/, `&to=${timeRange?.to || 'now'}`);
                                    return dynamicUrl;
                                  }
                                  return 'data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial;color:%23dc2626;background:%23fef2f2;"><div style="text-align:center;"><h3>Fehler: Meter konnte nicht aufgelöst werden</h3><p style="color:%236b7280;">Grafana-URL konnte nicht generiert werden</p></div></div>';
                                })() : 'about:blank'}
                                width="100%"
                                height={meter.height || 200}
                                style={{ 
                                  border: 'none',
                                  minHeight: '200px',
                                  maxWidth: '100%'
                                }}
                                title={meter.title}
                                className="border-none rounded-md"
                                loading={tabIndex === activeTab ? "eager" : "lazy"}
                                onLoad={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  if (tabIndex === activeTab) {
                                    console.log(`🎯 [ULTRA-STABLE] ${meter.panelType || 'Panel'} loaded for ${meter?.name} (${meter?.id})`);
                                    setLoadedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.add(iframeKey);
                                      return newSet;
                                    });
                                    setFailedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(iframeKey);
                                      return newSet;
                                    });
                                  }
                                }}
                                onError={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  console.error(`❌ [IFRAME-ERROR] Failed to load ${meter.panelType || 'panel'} ${meter?.name} (${meter?.id})`);
                                  setFailedIframes(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(iframeKey);
                                  return newSet;
                                });
                                  setLoadedIframes(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(iframeKey);
                                    return newSet;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Row: Histogram Panels Grid (3 columns) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
                        {(tab as SpecialTab).meters.filter(m => m.panelType === 'histogram').map((meter: SpecialMeter, meterIndex) => (
                          <div key={`histogram-${meter.panelId}-${meter.id || meter.key || 'meter'}`} className="w-full">
                            <div className="overflow-hidden relative">
                              {!histogrammsLoaded && (
                                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10 rounded-md">
                                  <div className="text-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <div className="text-sm text-gray-600">Histogramm wird geladen...</div>
                                  </div>
                                </div>
                              )}
                              {histogrammsLoaded && failedIframes.has(`${meter.id}_${meter.panelId}`) && (
                                <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-20 rounded-md">
                                  <div className="text-center">
                                    <div className="text-red-600 mb-2">⚠️ Ladefehler</div>
                                    <button 
                                      onClick={() => {
                                        const iframeKey = `${meter.id}_${meter.panelId}`;
                                        setFailedIframes(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(iframeKey);
                                          return newSet;
                                        });
                                        // Force iframe reload
                                        const iframe = iframeRefs.get(iframeKey);
                                        if (iframe && iframe.src !== 'about:blank') {
                                          const currentSrc = iframe.src;
                                          iframe.src = 'about:blank';
                                          setTimeout(() => iframe.src = currentSrc, 100);
                                        }
                                      }}
                                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                                    >
                                      Erneut laden
                                    </button>
                                  </div>
                                </div>
                              )}
                              <iframe
                                key={`iframe-stable-${meter.id || meter.key || 'meter'}-histogram-${stableSessionTimestamp}`}
                                ref={(el) => {
                                  if (el) {
                                    const iframeKey = `${meter.id}_${meter.panelId}`;
                                    iframeRefs.set(iframeKey, el);
                                  }
                                }}
                                src={(tabIndex === activeTab && (meter.panelType !== 'histogram' || histogrammsLoaded)) ? (() => {
                                  // Enhanced Panel-URL Lookup mit allen verfügbaren Panels
                                  const allPanels = tabs[tabIndex]?.panels || [];
                                  console.log(`🔍 [PANEL-LOOKUP] For ${meter.panelType || 'meter'} ${meter.key}/${meter.id}, checking ${allPanels.length} panels`);
                                  
                                  // Lookup-Versuche
                                  let panelWithUrl = allPanels.find(panel => panel.originalId === meter.key);
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => panel.meterId === meter.id);
                                  }
                                  if (!panelWithUrl) {
                                    panelWithUrl = allPanels.find(panel => String(panel.meterId) === String(meter.id));
                                  }
                                  
                                  console.log(`🔍 [PANEL-LOOKUP] Found panel:`, panelWithUrl ? 'YES' : 'NO', panelWithUrl?.url ? 'with URL' : 'without URL');
                                  
                                  if (panelWithUrl?.url && panelWithUrl.url !== '') {
                                    // Generate dynamic URL with current time range
                                    const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
                                    // Replace only time parameters, keep all other parameters intact
                                    let dynamicUrl = panelWithUrl.url
                                      .replace(/&from=[^&]*/, `&from=${timeRange?.from || 'now-7d'}`)
                                      .replace(/&to=[^&]*/, `&to=${timeRange?.to || 'now'}`);
                                    return dynamicUrl;
                                  }
                                  return 'data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial;color:%23dc2626;background:%23fef2f2;"><div style="text-align:center;"><h3>Fehler: Meter konnte nicht aufgelöst werden</h3><p style="color:%236b7280;">Grafana-URL konnte nicht generiert werden</p></div></div>';
                                })() : 'about:blank'}
                                width="100%"
                                height={meter.height || 280}
                                style={{ 
                                  border: 'none',
                                  minHeight: '280px',
                                  maxWidth: '100%'
                                }}
                                title={`${meter.title}`}
                                className="border-none rounded-md"
                                loading={tabIndex === activeTab ? "eager" : "lazy"}
                                onLoad={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  if (tabIndex === activeTab) {
                                    console.log(`🎯 [ULTRA-STABLE] Histogram ${meter.title} loaded (${meter.id})`);
                                    setLoadedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.add(iframeKey);
                                      return newSet;
                                    });
                                    setFailedIframes(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(iframeKey);
                                      return newSet;
                                    });
                                  }
                                }}
                                onError={() => {
                                  const iframeKey = `${meter.id}_${meter.panelId}`;
                                  console.error(`❌ [IFRAME-ERROR] Failed to load histogram ${meter.title} (${meter.id})`);
                                  setFailedIframes(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(iframeKey);
                                  return newSet;
                                });
                                  setLoadedIframes(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(iframeKey);
                                    return newSet;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Standard layout for multiple meters
                    <div className="space-y-6">
                      {(tab as Tab).meters.map((meter: StandardMeter) => (
                        <div key={`${tab.id}-${meter.id || meter.key || 'meter'}-${tab.panelId}`} className="w-full">
                          <div className={`${tab.id === "temperatur" ? "overflow-hidden" : "border border-gray-200 rounded-md overflow-hidden"}`}>
                            <iframe
                              key={`iframe-stable-${meter.id || meter.key || 'meter'}-${stableSessionTimestamp}`}
                              ref={(el) => {
                                if (el) {
                                  const iframeKey = `${meter.id}_${tab.panelId}`;
                                  iframeRefs.set(iframeKey, el);
                                }
                              }}
                              src={tabIndex === activeTab ? (() => {
                                // Use dynamic URL with current time range
                                const panelWithUrl = tab.panels?.find(panel => 
                                  panel.meterId === meter.id || panel.originalId === meter.key
                                );
                                console.log(`🔧 [STANDARD-TAB-DEBUG] Tab: ${tab.label}, Meter: ${meter.key}/${meter.id}, Panel found:`, !!panelWithUrl, panelWithUrl?.url);
                                
                                if (panelWithUrl?.url && panelWithUrl.url !== '') {
                                  // Generate dynamic URL with current time range
                                  const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
                                  // Replace only time parameters, keep all other parameters intact
                                  let dynamicUrl = panelWithUrl.url
                                    .replace(/&from=[^&]*/, `&from=${timeRange?.from || 'now-7d'}`)
                                    .replace(/&to=[^&]*/, `&to=${timeRange?.to || 'now'}`);
                                  console.log(`🔧 [STANDARD-TAB-URL] Generated URL:`, dynamicUrl);
                                  return dynamicUrl;
                                }
                                console.log(`🚨 [STANDARD-TAB-ERROR] No valid panel URL found for ${meter.key}/${meter.id}`);
                                return 'data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial;color:%23dc2626;background:%23fef2f2;"><div style="text-align:center;"><h3>Fehler: Meter konnte nicht aufgelöst werden</h3><p style="color:%236b7280;">Grafana-URL konnte nicht generiert werden</p></div></div>';
                              })() : 'about:blank'}
                              width="100%"
                              height="240"
                              style={{ 
                                border: 'none',
                                minHeight: '240px',
                                maxWidth: '100%'
                              }}
                              title={`${meter.name} Grafana Panel`}
                              className="border-none rounded-md"
                              loading={tabIndex === activeTab ? "eager" : "lazy"}
                              onLoad={() => {
                                // onLoad removed to prevent duplicate log entries
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0">
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-red-600 font-medium">Fehler: Meter konnte nicht aufgelöst werden</p>
              <p className="text-sm text-gray-400 mt-2">Meter-Konfiguration überprüfen</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Modal - nur für Admin-Rolle */}
      {isAdmin && (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug
            </Button>
          </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-blue-600" />
              <span>Grafana Debug - Objekt {objectId}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Tab Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Tab Diagramme</h3>
                <div className="space-y-2 text-xs">
                  {tabs.map((tab: any, index: number) => (
                    <div key={tab.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">Tab {index + 1}: {tab.label} (ID: {tab.id})</div>
                      <div className="text-gray-600">Panel ID: {tab.panelId}</div>
                      <div className="text-gray-600">Meters: {tab.meters?.length || 0}</div>
                      {tab.meters?.map((meter: any, meterIndex: number) => (
                        <div key={meter.key} className="ml-4 text-gray-500">
                          • {meter.name} ({meter.key}): {meter.id}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grafana URLs */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">GrafanaIframes</h3>
                <div className="space-y-2 text-xs">
                  {tabs.map((tab: any, tabIndex: number) => (
                    <div key={tab.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium mb-2">Tab: {tab.label}</div>
                      {tab.meters?.map((meter: any, meterIndex: number) => {
                        const panelWithUrl = tab.panels?.find((panel: Panel) => 
                          panel.meterId === meter.id || panel.originalId === meter.key
                        );
                        const url = panelWithUrl?.url && panelWithUrl.url !== '' 
                          ? panelWithUrl.url 
                          : 'Grafana Generation fehlgeschlagen';
                        return (
                          <div key={`${tab.id}-${meter.key}`} className="ml-2 mb-2">
                            <div className="text-gray-600">
                              {meterIndex + 1} =&gt; {meter.name} ({meter.key})
                            </div>
                            <div className="text-blue-600 break-all">
                              URL: {url}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Iframe URLs */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Live Iframe URLs (Aktuell generiert)</h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-red-50 p-2 rounded mb-4">
                    <strong>⚠️ HAUPTPROBLEM GEFUNDEN:</strong>
                    <div>Alle Tabs haben 0 Panels! Panel-URLs werden nicht generiert.</div>
                    <div>Total Tabs: {tabs.length}</div>
                    {tabs.map((tab: any, index: number) => (
                      <div key={index}>• Tab {index}: {tab.label} - Panels: {tab.panels?.length || 0}, Meters: {tab.meters?.length || 0}</div>
                    ))}
                  </div>
                  {tabs.length === 0 ? (
                    <div className="text-red-600">Keine Tabs verfügbar!</div>
                  ) : (
                    tabs.map((tab: any, tabIndex: number) => (
                    <div key={`live-${tab.id}`} className="bg-blue-50 p-2 rounded">
                      <div className="font-medium mb-2">Tab {tabIndex + 1}: {tab.label} {tabIndex === activeTab ? '(AKTIV)' : ''}</div>
                      {tab.meters?.map((meter: any, meterIndex: number) => {
                        const panelWithUrl = tab.panels?.find((panel: Panel) => 
                          panel.meterId === meter.id || panel.originalId === meter.key
                        );
                        const generatedUrl = tabIndex === activeTab ? (() => {
                          const url = panelWithUrl?.url && panelWithUrl.url !== '' 
                            ? panelWithUrl.url 
                            : null;
                          return url || 'data:text/html,<div style="...">Fehler: Meter konnte nicht aufgelöst werden</div>';
                        })() : 'about:blank';
                        
                        // Debug-Info für Panel-Struktur
                        const debugInfo = {
                          panelFound: !!panelWithUrl,
                          hasUrl: !!(panelWithUrl?.url),
                          urlValue: panelWithUrl?.url,
                          availablePanels: tab.panels?.length || 0,
                          panelIds: tab.panels?.map((p: Panel) => p.id) || [],
                          meterId: meter.id,
                          meterKey: meter.key,
                          lookupAttempts: {
                            byMeterId: tab.panels?.find((p: Panel) => p.meterId === meter.id),
                            byOriginalId: tab.panels?.find((p: Panel) => p.originalId === meter.key)
                          }
                        };
                        
                        return (
                          <div key={`live-${tab.id}-${meter.key}`} className="ml-2 mb-2 border-l-2 border-blue-300 pl-2">
                            <div className="text-gray-700 font-medium">
                              {meter.name} ({meter.key}) → Meter ID: {meter.id}
                            </div>
                            <div className="text-green-600 text-xs break-all mt-1">
                              <strong>Live URL:</strong> {generatedUrl.substring(0, 150)}{generatedUrl.length > 150 ? '...' : ''}
                            </div>
                            {generatedUrl.startsWith('data:text/html') && (
                              <div className="text-red-600 text-xs mt-1">⚠️ FEHLER: URL-Generierung fehlgeschlagen</div>
                            )}
                            <div className="bg-gray-100 p-2 mt-2 rounded text-xs">
                              <div><strong>Panel Debug:</strong></div>
                              <div>Panel gefunden: {debugInfo.panelFound ? '✅' : '❌'}</div>
                              <div>Hat URL: {debugInfo.hasUrl ? '✅' : '❌'}</div>
                              <div>Verfügbare Panels: {debugInfo.availablePanels}</div>
                              <div>Panel IDs: [{debugInfo.panelIds.join(', ')}]</div>
                              <div>Meter ID: {debugInfo.meterId}</div>
                              <div>Meter Key: {debugInfo.meterKey}</div>
                              <div>Lookup byMeterId: {debugInfo.lookupAttempts.byMeterId ? '✅' : '❌'}</div>
                              <div>Lookup byOriginalId: {debugInfo.lookupAttempts.byOriginalId ? '✅' : '❌'}</div>
                              {debugInfo.urlValue && <div className="text-blue-600 break-all">URL: {debugInfo.urlValue}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grafana URL (Diagramme) */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Grafana URL (Diagramme):</h3>
                <div className="space-y-2 text-xs">
                  {tabs.map((tab: any, tabIndex: number) => {
                    const tabTypeMap = {
                      'netzwaechter': 'netzwaechter',
                      'kesselwaechter': 'kessel', 
                      'waermepumpenwaechter': 'waermepumpe'
                    };
                    const tapParam = tabTypeMap[tab.id as keyof typeof tabTypeMap] || tab.id;
                    const diagrammeUrl = `/grafana-dashboards?objectID=${objectId}&typ=waechter&from=network-monitor&tap=${tapParam}`;
                    
                    return (
                      <div key={`diagramme-url-${tab.id}`} className="bg-blue-50 p-2 rounded">
                        <div className="font-medium text-blue-800">Tab {tabIndex + 1}: {tab.label}</div>
                        <div className="text-blue-600 break-all mt-1">
                          <strong>URL:</strong> {diagrammeUrl}
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          tap={tapParam} | typ=waechter | from=network-monitor
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">Konfiguration</h3>
                <div className="space-y-2 text-xs">
                  <div><strong>Object ID:</strong> {objectId}</div>
                  <div><strong>Active Tab:</strong> {activeTab}</div>
                  <div><strong>Time Range:</strong> {selectedTimeRange}</div>
                  <div><strong>URL Params:</strong> {JSON.stringify(urlParams)}</div>
                  <div><strong>Netzwächter Mode:</strong> {isNetzwaechterMode ? 'Yes' : 'No'}</div>
                  <div><strong>Has TempID:</strong> {hasTempID ? 'Yes' : 'No'}</div>
                  {hasTempID && (
                    <div className="bg-yellow-50 p-2 rounded">
                      <div><strong>TempID Details:</strong></div>
                      <div>Panel ID: {(defaultGrafanaSettings as any)?.setupGrafana?.TempDiagrammPanelId || 'Not found'}</div>
                      <div>Label: {(defaultGrafanaSettings as any)?.setupGrafana?.TempDiagrammPanelIdLabel || 'Not found'}</div>
                      <div>Config lookup: {JSON.stringify((defaultGrafanaSettings as any)?.setupGrafana?.defaultPanelid?.find((item: any) => item.TempDiagrammPanelId))}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      )}

    </div>
  );
};

export default GrafanaDiagramme;