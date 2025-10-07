import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bell,
  Settings,
  Flame,
  BarChart3,
  Network,
  Leaf,
  Building,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Thermometer,
  BookOpen,
  UserCog,
  UserCheck,
  LogOut,
  Code,
  MapPin,
  Server,
  Shield,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode, useState, useEffect } from "react";
import UserSettingsModal from "@/components/UserSettingsModal";

const navigationItems = [
  { href: "/dashbord", label: "KPI Dashboard", icon: BarChart3, permission: "showDashboard" },
  { href: "/maps", label: "Objekt-Karte", icon: MapPin, permission: "showMaps" },
  { href: "/network-monitor", label: "Netzwächter", icon: Network, permission: "showNetworkMonitor" },
  { href: "/efficiency", label: "Klassifizierung", icon: Leaf, permission: "showEfficiencyStrategy" },
  { href: "/objects", label: "Objektverwaltung", icon: Building, permission: "showObjectManagement" },
  { href: "/logbook", label: "Logbuch", icon: BookOpen, permission: "showLogbook" },
  { href: "/admin-dashboard", label: "Admin Dashboard", icon: Shield, permission: "admin", adminOnly: true },
  { href: "/grafana-dashboards", label: "Objekt-Monitoring", icon: Monitor, permission: "showGrafanaDashboards" },
  { href: "/energy-data", label: "Energiedaten", icon: Zap, permission: "showEnergyData" },
  { href: "/devices", label: "Geräteverwaltung", icon: Cpu, permission: "showDeviceManagement" },
  { href: "/system-setup", label: "System-Setup", icon: Settings, permission: "showSystemSetup" },
  { href: "/api-management", label: "API-Verwaltung", icon: Server, permission: "admin", adminOnly: true },
  { href: "/users", label: "Benutzerverwaltung", icon: Users, permission: "showUserManagement", adminOnly: true },
  { href: "/user", label: "Meine Benutzer", icon: UserCheck, permission: "showUser" },
  { href: "/api-test", label: "API-Test", icon: Thermometer, permission: "admin", adminOnly: true },
  { href: "/api-tests", label: "API-Tests", icon: Code, permission: "admin", adminOnly: true },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Startet eingeklappt, wird durch useEffect angepasst
  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Load system title dynamically from database
  const { data: titleData } = useQuery({
    queryKey: ['/api/settings/system-title'],
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  const systemTitle = (titleData as any)?.title || 'heatcare';

  // Mobile-responsive Sidebar: Desktop aufgeklappt, Mobil eingeklappt
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setSidebarCollapsed(isMobile); // Desktop = false (aufgeklappt), Mobil = true (eingeklappt)
    };

    // Initial check
    checkScreenSize();

    // Listen for window resize
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Erfolg",
        description: "Sie wurden erfolgreich abgemeldet",
      });
      // Redirect to landing page (the login form)
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

  const handlePrintPDF = () => {
    try {
      // Kurz warten damit CSS-Klassen vollständig geladen sind
      setTimeout(() => {
        window.print();
        toast({
          title: "PDF-Druck",
          description: "Druckdialog wurde geöffnet - nur rechter Bereich wird gedruckt",
        });
      }, 100);
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Fehler",
        description: "Drucken fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  // Sidebar auf Desktop immer anzeigen, auf Mobil nur wenn aufgeklappt
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < 768);
    };
    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);
  
  const showSidebar = !isMobile; // Mobile: Sidebar komplett ausblenden, Desktop: immer anzeigen

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay bei aufgeklappter Sidebar */}
      {showSidebar && !sidebarCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar - nur bei Network-Monitor */}
      {showSidebar && (
        <div
          className={cn(
            "bg-sidebar text-white flex flex-col transition-all duration-300 relative print-hide-sidebar",
            sidebarCollapsed ? "w-16" : "w-60",
            // Mobile: Fixed positioning bei ausgeklappter Sidebar
            !sidebarCollapsed && isMobile 
              ? "fixed inset-y-0 left-0 z-30" 
              : "",
            // Mobile: Zuklappen bei schmalen Bildschirmen
            "md:relative md:z-auto"
          )}
        >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-500">
          <div className="flex items-center space-x-3">
            <Flame className="text-2xl text-accent" />
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-semibold">{systemTitle}</h1>
                <p className="text-xs text-gray-300">Anlagen-Verwaltung</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2">
          {navigationItems
            .filter((item) => {
              const userProfile = (user as any)?.userProfile;
              const userRole = (user as any)?.role;
              
              // Bei mobilen Geräten: Nur Network-Monitor und KPI Dashboard anzeigen
              if (isMobile && sidebarCollapsed) {
                return item.href === "/network-monitor" || item.href === "/";
              }
              
              // Admin-only Items (wie API-Test) nur für Administratoren anzeigen
              if (item.adminOnly && userRole !== "admin") {
                return false;
              }
              
              // Wenn kein Profil vorhanden, zeige nur für Admins
              if (!userProfile?.sidebar) {
                return userRole === "admin";
              }
              
              // Verwende Profil-Berechtigungen
              return userProfile.sidebar[item.permission] === true;
            })
            .map((item) => {
              const isNetworkMonitor = item.href === "/network-monitor";
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center py-3 transition-colors cursor-pointer ml-auto w-[90%]",
                      sidebarCollapsed ? "justify-center px-4" : "space-x-3 pl-6",
                      location === item.href
                        ? "bg-primary text-white"
                        : "hover:bg-gray-600",
                      // Network-Monitor bei mobilen Geräten hervorheben
                      isMobile && sidebarCollapsed && isNetworkMonitor
                        ? "bg-accent text-white ring-2 ring-accent-foreground"
                        : "",
                    )}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5",
                        // Network-Monitor Icon bei mobilen Geräten größer
                        isMobile && sidebarCollapsed && isNetworkMonitor ? "w-6 h-6" : ""
                      )} 
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-500">
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("🔧 Avatar clicked, opening modal");
                  setUserSettingsModalOpen(true);
                }}
                className="p-2 hover:bg-gray-600"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                  <AvatarFallback className="bg-primary text-white">
                    {(user as any)?.firstName?.[0] ||
                      (user as any)?.email?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                console.log("🔧 User info clicked, opening modal");
                setUserSettingsModalOpen(true);
              }}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-600 justify-start"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                <AvatarFallback className="bg-primary text-white">
                  {(user as any)?.firstName?.[0] ||
                    (user as any)?.email?.[0] ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {(user as any)?.firstName && (user as any)?.lastName
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.email || "Benutzer"}
                </p>
                <p className="text-xs text-gray-300">
                  {(user as any)?.userProfile?.name || 
                   ((user as any)?.role === "admin"
                    ? "Administrator"
                    : (user as any)?.role === "user"
                    ? "Benutzer"
                    : "Betrachter")}
                </p>
              </div>
              <Settings className="h-4 w-4 text-gray-300" />
            </Button>
          )}
        </div>

        {/* Toggle Button - Mobile-optimiert */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "absolute bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10",
            // Mobile: Größerer Button, bessere Position
            "md:-right-3 md:top-6 md:p-1.5",
            "right-2 top-4 p-2",
            // Mobile: Network-Monitor Button hervorheben
            sidebarCollapsed && isMobile 
              ? "bg-accent hover:bg-accent/90 ring-2 ring-accent-foreground" 
              : ""
          )}
          aria-label={sidebarCollapsed ? "Sidebar erweitern" : "Sidebar zuklappen"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className={cn("w-4 h-4", "md:w-4 md:h-4")} />
          ) : (
            <ChevronLeft className={cn("w-4 h-4", "md:w-4 md:h-4")} />
          )}
        </button>
        </div>
      )}
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden print-full-width",
        // Mobile: Vollbreite bei zugeklappter Sidebar
        sidebarCollapsed && isMobile ? "ml-0" : ""
      )}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-20 px-6 py-4 print-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-80">
                {(() => {
                  const currentItem = navigationItems.find((item) => item.href === location);
                  const baseLabel = currentItem?.label || "KPI Dashboard Wohnungswirtschaft";
                  
                  // Für /efficiency Route: "Klassifizierung | Effizienzstrategie"
                  if (location === "/efficiency") {
                    return (
                      <span>
                        {baseLabel} <span className="text-gray-400 font-normal mx-2">|</span> <span className="text-gray-500 font-normal">Effizienzstrategie</span>
                      </span>
                    );
                  }
                  
                  return baseLabel;
                })()}
              </h2>
            </div>
            <div className="flex items-center space-x-4 print-hide">
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-50 cursor-pointer hover:text-gray-80" />
                <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </div>
              

              {/* User Profile with Logout */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                  console.log("🔧 Avatar clicked, opening modal");
                  setUserSettingsModalOpen(true);
                }}
                  className="flex items-center space-x-2 p-2"
                  title="Benutzer-Menü öffnen"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {(user as any)?.firstName?.[0] ||
                        (user as any)?.email?.[0] ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto print-content">
          <div className="print-no-break">
            {children}
          </div>
        </main>
      </div>

      {/* User Settings Modal */}
      <UserSettingsModal 
        isOpen={userSettingsModalOpen} 
        onClose={() => setUserSettingsModalOpen(false)} 
      />
    </div>
  );
}
