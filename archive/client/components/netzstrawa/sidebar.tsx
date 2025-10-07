import strawaLogo from "@/components/strawa-logo.png";
import { Share2 } from "lucide-react";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeMenuItem: number;
  setActiveMenuItem: (id: number) => void;
  animationKey: number;
  setAnimationKey: (fn: (prev: number) => number) => void;
}

export function Sidebar({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  activeMenuItem, 
  setActiveMenuItem,
  animationKey,
  setAnimationKey 
}: SidebarProps) {
  return (
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
                    animationDelay: `${index * 0.8}s`,    // 0s, 0.8s, 1.6s
                    animationDuration: '1s',              // jedes Wort 1 Sekunde
                    animationFillMode: 'forwards',        // bleibt sichtbar
                    animationIterationCount: '1',         // läuft nur einmal
                    opacity: 0                           // startet unsichtbar
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
            title: 'Netzwächter', 
            icon: <Share2 className="h-5 w-5" />,
            id: 0
          },
          { 
            title: 'Objekt-Karte', 
            icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            ),
            id: 1
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
            id: 2
          },
          { 
            title: 'Logbuch', 
            icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            ),
            id: 3
          }
        ].map((item, index) => (
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
    </div>
  );
}