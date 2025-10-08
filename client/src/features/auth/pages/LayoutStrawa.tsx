import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Dashboard from "@/features/monitoring/pages/Dashboard";
import NetworkMonitor from "@/features/monitoring/pages/NetworkMonitor";
import EfficiencyAnalysis from "@/features/energy/pages/EfficiencyAnalysis";
import Maps from "@/features/monitoring/pages/Maps";
import GrafanaDashboard from "@/pages/GrafanaDashboard";
import SystemSettings from "@/features/settings/pages/SystemSettings";
import UserSettings from "@/features/users/pages/UserSettings";
import User from "@/features/users/pages/User";
import UserManagement from "@/features/users/pages/UserManagement";
import Logbook from "@/pages/Logbook";
import { Share2, MapPin, Layers, BarChart3, Settings, UserCheck, Users, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCog, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import strawaLogo from "@/components/strawa-logo.png";

export default function LayoutStrawaTabs() {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState(0); // KPI Dashboard is active by default
  const [animationKey, setAnimationKey] = useState(0);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Set active menu item based on URL pathname
  useEffect(() => {
    const pathname = location.split('?')[0];
    
    if (pathname === '/dashbord') {
      setActiveMenuItem(0); // KPI Dashboard tab
    } else if (pathname === '/network-monitor' || pathname === '/temperatur-analyse') {
      setActiveMenuItem(1); // Netzwächter tab
    } else if (pathname === '/efficiency' || pathname === '/klassifizierung') {
      setActiveMenuItem(3); // Klassifizierung tab
    } else if (pathname === '/grafana-dashboards') {
      setActiveMenuItem(4); // Grafana Dashboard tab
    } else if (pathname === '/system-setup') {
      setActiveMenuItem(5); // System-Setup tab
    } else if (pathname === '/logbook') {
      setActiveMenuItem(8); // Logbook tab
    } else if (pathname === '/user') {
      setActiveMenuItem(6); // Meine Benutzer tab
    } else if (pathname === '/users') {
      setActiveMenuItem(7); // Benutzerverwaltung tab
    } else {
      setActiveMenuItem(2); // Default: Objekt-Karte tab
    }
  }, [location]);


  // Dynamic header content based on active menu item
  const getHeaderContent = () => {
    switch (activeMenuItem) {
      case 0: // KPI Dashboard
        return {
          title: "KPI Dashboard | Kennzahlen-Übersicht",
          subtitle: "Zentrale Steuerung und Überwachung aller wichtigen Kennzahlen"
        };
      case 1: // Netzwächter
        return {
          title: "Netzwächter | Temperaturanalyse",
          subtitle: "Gruppierung / Untersuchung vom Netztemperaturen nach Grenzwertverletzungen"
        };
      case 2: // Objekt-Karte
        return {
          title: "Objekt-Karte | Standortübersicht",
          subtitle: "Geografische Darstellung aller Objekte mit Temperaturstatus"
        };
      case 3: // Klassifizierung
        return {
          title: "Klassifizierung | Effizienzstrategie",
          subtitle: "normierte GEG-Analyse : Verbrauch je m²"
        };
      case 4: // Grafana Dashboard
        return {
          title: "Objekt Monitor | Detailanalyse",
          subtitle: "Interaktive Dashboards und detaillierte Objektauswertungen"
        };
      case 5: // System-Setup
        return {
          title: "System-Setup | Konfiguration",
          subtitle: "Systemeinstellungen und Datenbankverbindungen verwalten"
        };
      case 6: // Meine Benutzer
        return {
          title: "Meine Benutzer | Mandant",
          subtitle: "Persönliche Einstellungen und Benutzerinformationen"
        };
      case 7: // Benutzerverwaltung
        return {
          title: "Benutzerverwaltung | Administration",
          subtitle: "Benutzer, Profile und Zugriffsrechte verwalten"
        };
      default:
        return {
          title: "Anlagen-Logbuch",
          subtitle: "Wartungen, Reparaturen und Aufgaben verwalten"
        };
    }
  };

  // Handler für Logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Erfolg",
        description: "Sie wurden erfolgreich abgemeldet",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Fehler",
        description: "Abmeldung fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  // Handler für Layout-Wechsel über URL-Parameter

  // Local header component to avoid dependencies
  const HeaderStrawa = () => {
    const headerContent = getHeaderContent();
    return (
      <div className="border-b border-strawa-blue px-6 py-4 bg-white dark:bg-gray-900" data-testid="header-strawa">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-strawa-blue" data-testid="text-title">
              {headerContent.title}
            </h2>
            <p className="text-sm mt-1 text-strawa-blue opacity-80" data-testid="text-subtitle">
              {headerContent.subtitle}
            </p>
          </div>
          
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-strawa-gray" data-testid="layout-strawa-container">
      {/* Integrated Sidebar */}
      <div 
        className={`${sidebarCollapsed ? 'w-12' : 'w-60'} shadow-lg flex flex-col transition-all duration-300 relative bg-strawa-blue`} 
        data-testid="sidebar-strawa"
      >
        {/* Toggle Button */}
        <div className="absolute -right-3 top-6 z-20">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="bg-white dark:bg-gray-800 border-2 border-strawa-blue rounded-full p-1.5 hover:bg-strawa-gray transition-colors"
            data-testid="button-sidebar-toggle"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={sidebarCollapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"}
              />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className={`p-6 border-b border-[#21496E]/30 pt-[16px] pb-[16px] ${sidebarCollapsed ? 'hidden' : ''}`} data-testid="sidebar-header">
          <div className="flex items-center space-x-3 mt-[10px] mb-[10px]">
            <img src={strawaLogo} alt="Strawa Logo" className="h-10 w-auto" data-testid="img-logo" />
            <div>
              <h1 className="text-lg font-bold text-white" data-testid="text-sidebar-title">Digital Service</h1>
              <p className="text-sm text-blue-100 font-medium" data-testid="text-sidebar-subtitle">Wärmetechnologie</p>
            </div>
          </div>
          <div className="p-4 pt-[10px] pb-[10px] pl-[10px] pr-[10px] text-center">
            <div className="relative">
              <div 
                className="text-2xl font-medium text-white" 
                style={{ fontFamily: 'Caveat, cursive', transform: 'rotate(-5deg)' }} 
                data-testid="text-efficiency-slogan"
              >
                {['Wir', 'leben', 'Effizienz'].map((word, index) => (
                  <span
                    key={`${animationKey}-${index}`}
                    className="animate-typewriter inline-block mr-2"
                    style={{
                      animationDelay: `${index * 0.8}s`,
                      animationDuration: '1s',
                      animationFillMode: 'forwards',
                      animationIterationCount: '1',
                      opacity: 0
                    }}
                    data-testid={`text-slogan-word-${index}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Collapsed Header */}
        <div className={`px-1 py-2 pt-16 border-b border-[#21496E]/30 ${sidebarCollapsed ? '' : 'hidden'}`} data-testid="sidebar-header-collapsed">
          <img src={strawaLogo} alt="Strawa Logo" className="h-8 w-auto mx-auto" data-testid="img-logo-collapsed" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2">
          {[
            { 
              title: 'KPI Dashboard', 
              icon: <BarChart3 className="h-5 w-5" />,
              id: 0
            },
            { 
              title: 'Netzwächter', 
              icon: <Share2 className="h-5 w-5" />,
              id: 1
            },
            { 
              title: 'Objekt-Karte', 
              icon: (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              ),
              id: 2
            },
            { 
              title: 'Klassifizierung', 
              icon: (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M12 2L2 7l10 5 10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              ),
              id: 3
            },
            { 
              title: 'Objekt Monitor', 
              icon: <BarChart3 className="h-5 w-5" />,
              id: 4
            },
            { 
              title: 'Logbuch', 
              icon: <BookOpen className="h-5 w-5" />,
              id: 8
            },
            { 
              title: 'Meine Benutzer', 
              icon: <UserCheck className="h-5 w-5" />,
              id: 6
            }
          ]
          .filter((item) => {
            // User-Profile-Berechtigungen prüfen
            const userProfile = (user as any)?.userProfile;
            const sidebar = userProfile?.sidebar;
            
            // Meine Benutzer (ID 6) nur anzeigen wenn showUser berechtigt
            if (item.id === 6 && !sidebar?.showUser) {
              return false;
            }
            
            return true;
          })
          .map((item, index) => (
            <div
              key={index}
              onClick={() => {
                setActiveMenuItem(item.id);
                setAnimationKey(prev => prev + 1);
              }}
              className={`flex items-center cursor-pointer transition-colors mb-1 py-3 ${
                sidebarCollapsed 
                  ? 'px-0.5 justify-center' 
                  : 'gap-3 px-3'
              } ${
                activeMenuItem === item.id 
                  ? 'bg-gray-200 text-[#21496E] -mr-2' 
                  : 'text-white/90 hover:bg-white/10'
              }`}
              data-testid={`nav-item-${index}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {item.icon}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <div className="text-base font-semibold">{item.title}</div>
                </div>
              )}
            </div>
          ))}
        </nav>
        
        {/* Admin Block - separate section at bottom */}
        {(user as any)?.role === 'admin' && (
          <div className="px-2 pb-2">
            <div className="bg-[#1a3a5c] rounded-lg p-2 space-y-1">
              <div className="text-xs font-medium text-white/70 px-2 py-1 uppercase tracking-wide">
                {!sidebarCollapsed && 'Administration'}
              </div>
              {[
                { 
                  title: 'System-Setup', 
                  icon: <Settings className="h-4 w-4" />,
                  id: 5
                },
                { 
                  title: 'Benutzerverwaltung', 
                  icon: <Users className="h-4 w-4" />,
                  id: 7
                }
              ].map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setActiveMenuItem(item.id);
                    setAnimationKey(prev => prev + 1);
                  }}
                  className={`flex items-center cursor-pointer transition-colors rounded py-2 ${
                    sidebarCollapsed 
                      ? 'px-1 justify-center' 
                      : 'gap-2 px-2'
                  } ${
                    activeMenuItem === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                  data-testid={`admin-nav-item-${index}`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {item.icon}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* User Profile at Bottom */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[#21496E]/30" data-testid="user-profile">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 rounded-lg p-2 transition-colors"
              onClick={() => setUserModalOpen(true)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white text-[#21496E] text-sm font-semibold">
                  {(user as any)?.lastName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </div>
                <div className="text-xs text-white/70">
                  {(user as any)?.role === 'admin' ? 'Administrator' : 
                   (user as any)?.role === 'user' ? 'Benutzer' : 'Betrachter'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderStrawa />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-strawa-gray" data-testid="content-main">
          {showUserSettings ? (
            // Benutzereinstellungen Content - full screen
            <div className="h-full overflow-auto bg-white">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Benutzereinstellungen</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserSettings(false)}
                  >
                    Zurück
                  </Button>
                </div>
              </div>
              <UserSettings />
            </div>
          ) : activeMenuItem === 0 ? (
            // KPI Dashboard Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <Dashboard />
              </div>
            </div>)
          ) : activeMenuItem === 1 ? (
            // Netzwächter Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <NetworkMonitor />
              </div>
            </div>)
          ) : activeMenuItem === 2 ? (
            // Objekt-Karte Content - full screen like main /maps route
            (<Maps />)
          ) : activeMenuItem === 3 ? (
            // Klassifizierung Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <EfficiencyAnalysis />
              </div>
            </div>)
          ) : activeMenuItem === 4 ? (
            // Grafana Dashboard Content - full screen
            (<GrafanaDashboard />)
          ) : activeMenuItem === 5 ? (
            // System-Setup Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <SystemSettings />
              </div>
            </div>)
          ) : activeMenuItem === 6 ? (
            // Meine Benutzer Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <User />
              </div>
            </div>)
          ) : activeMenuItem === 8 ? (
            // Logbook Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <Logbook />
              </div>
            </div>)
          ) : (
            // Benutzerverwaltung Content - with padding
            (<div className="h-full overflow-auto p-6 pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <div className="max-w-full mx-auto">
                <UserManagement />
              </div>
            </div>)
          )}
        </div>
      </div>

      {/* User Settings Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[400px] z-[10000]" style={{ zIndex: 10000 }}>
          <DialogHeader>
            <DialogTitle>Benutzer-Menü</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-white">
                  {(user as any)?.lastName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(user as any)?.role === 'admin' ? 'Administrator' : 
                   (user as any)?.role === 'user' ? 'Benutzer' : 'Betrachter'}
                </p>
              </div>
            </div>
            <hr />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setUserModalOpen(false);
                setShowUserSettings(true);
              }}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Benutzereinstellungen
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}