import { useLocation } from "wouter";

export function useUIMode() {
  const [location] = useLocation();
  
  // Get full URL including query parameters from window.location
  const fullURL = window.location.href;
  const url = new URL(fullURL);
  const urlParams = url.searchParams;
  const uiMode = urlParams.get('ui');
  const pathname = url.pathname;
  
  // Check UI modes
  const isCockpit = uiMode === 'cockpit';
  const isStrawa = uiMode === 'strawa';
  
  // Check if grafana-dashboards route (always Strawa)
  const isGrafanaDashboards = pathname === '/grafana-dashboards';
  
  // Final decision: should use LayoutStrawa?
  // NUR ui=cockpit zeigt große Sidebar, alles andere zeigt 4-Tab-Layout
  const shouldUseStrawa = !isCockpit;
  
  
  return {
    uiMode,
    pathname,
    isCockpit,
    isStrawa,
    isGrafanaDashboards,
    shouldUseStrawa,
    urlParams
  };
}