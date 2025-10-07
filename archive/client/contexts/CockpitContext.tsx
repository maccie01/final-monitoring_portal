import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface CockpitContextType {
  cockpitMode: boolean;
  setCockpitMode: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

const CockpitContext = createContext<CockpitContextType | undefined>(undefined);

export function CockpitProvider({ children }: { children: ReactNode }) {
  const [cockpitMode, setCockpitModeState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cockpit mode from API on mount
  useEffect(() => {
    const loadCockpitMode = async () => {
      try {
        const response = await fetch('/api/settings/cockpit-mode');
        if (response.ok) {
          const data = await response.json();
          setCockpitModeState(data.enabled || false);
        }
      } catch (error) {
        console.error('Failed to load cockpit mode:', error);
        setCockpitModeState(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadCockpitMode();
  }, []);

  // Update cockpit mode via API
  const setCockpitMode = async (enabled: boolean) => {
    try {
      await apiRequest('POST', '/api/settings/cockpit-mode', { enabled });
      setCockpitModeState(enabled);
    } catch (error) {
      console.error('Failed to update cockpit mode:', error);
      throw error;
    }
  };

  return (
    <CockpitContext.Provider value={{ cockpitMode, setCockpitMode, isLoading }}>
      {children}
    </CockpitContext.Provider>
  );
}

export function useCockpit() {
  const context = useContext(CockpitContext);
  if (context === undefined) {
    throw new Error('useCockpit must be used within a CockpitProvider');
  }
  return context;
}