import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, TrendingUp, Flame, Gauge } from "lucide-react";
import strawaLogo from "@/components/strawa-logo.png";
import DeviceRegistration from "@/components/deviceanmeldung";
import LoginModal from "@/components/LoginModal";

export default function LoginStrawa() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeviceRegistration, setShowDeviceRegistration] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(45deg, #00b3e4 0%, #143e7f 100%)' }}>
      {/* Punktemuster Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.25) 3px, transparent 3px)`,
          backgroundSize: '35px 35px',
          mask: 'linear-gradient(90deg, transparent 0%, transparent 50%, rgba(0,0,0,1) 100%)',
          WebkitMask: 'linear-gradient(90deg, transparent 0%, transparent 50%, rgba(0,0,0,1) 100%)'
        }}
      ></div>
      <div className="relative z-10 h-full flex flex-col">
        {/* Grid Layout - Oberer Bereich */}
        <div className="h-1/3 grid grid-cols-2 gap-0">
          {/* Grid 1: Logo und Digital Service */}
          <div className="flex items-center px-8 py-6">
            <div className="flex items-center gap-4">
              <img src={strawaLogo} alt="Strawa Logo" className="h-12 w-auto" />
              <div className="text-white">
                <h1 className="font-bold text-lg sm:text-[26px]">Digital Service</h1>
                <p className="text-base sm:text-xl opacity-90">Wärmetechnologie</p>
              </div>
            </div>
          </div>

          {/* Grid 2: "Wir leben Effizienz" mit -5° Rotation - Ausgeblendet auf Mobil */}
          <div className="hidden md:flex items-center justify-center relative overflow-hidden">
            <div className="transform -rotate-5 origin-center">
              <h2 className="text-white text-4xl font-light italic opacity-90" style={{ fontFamily: 'Caveat, cursive' }}>
                Wir leben Effizienz
              </h2>
            </div>
          </div>
        </div>

        {/* Hauptbereich - KI-geführter Netzwächter */}
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-7xl">
            {/* Grid Layout: 20% Icon, 80% Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center mb-12">
              {/* Block 1: Brain Icon (20%) - Ausgeblendet auf Mobil */}
              <div className="hidden md:flex md:col-span-1 justify-center items-center">
                <Brain className="h-20 w-20 animate-pulse" style={{
                  color: '#8BB5D6'
                }} />
              </div>

              {/* Block 2: Content (80%) - Vollbreite auf Mobil */}
              <div className="col-span-1 md:col-span-4">
                {/* Haupttitel */}
                <h1 className="text-white text-2xl sm:text-3xl md:text-5xl font-bold mb-4 text-left">
                  KI-geführter Netzwächter
                </h1>
                
                {/* Untertitel */}
                <p className="text-white text-base sm:text-lg md:text-2xl mb-8 opacity-90 leading-relaxed text-left">
                  Intelligente Überwachung und Optimierung Ihrer Heizungsanlagen
                </p>

                {/* Login und Device Registration Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => setShowDeviceRegistration(true)}
                    variant="outline"
                    className="bg-white/95 hover:bg-white text-[#21496E] border-[#21496E] px-8 py-4 text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                    data-testid="button-device-registration"
                  >Gerät anmelden</Button>
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-[#21496E] hover:bg-[#1a3a5a] text-white px-8 py-4 text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                    data-testid="button-start-login"
                  >
                    Jetzt starten - Login
                  </Button>
                </div>
              </div>
            </div>

            {/* Healthcare-Style Cards - Volle Breite */}
            <div className="grid md:grid-cols-2 gap-8 w-full">
              {/* Why AI Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Warum KI-geführte Überwachung?
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#4BA7D7]" />
                      NetzWächter
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">Der NetzWächter ist die Erweiterung von Heizungsanlagen zu automatisierten Optimierung von Wärmenetzen des Gebäudes.</p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-[#4BA7D7]" />
                      Expertenteam Klaus & Ingo - Das KI-Team
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Das Expertenteam Klaus & Ingo eröffnet neue Formen der Zusammenarbeit zwischen Mensch und KI. Ohne sie wäre es Arbeit für ein Team, was sich keiner leisten kann.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-[#4BA7D7]" />
                      Selbstlernende Systeme
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Lernt kontinuierlich aus Betriebsdaten und verbessert automatisch die Systemperformance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] rounded-lg">
                    <Gauge className="h-5 w-5 text-white" />
                  </div>
                  Übersichtliches Portal
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm">KPI-Dashboard</h4>
                    <p className="text-xs opacity-90">Zentrale Übersicht</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                    <Flame className="h-8 w-8 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm">Netzwächter</h4>
                    <p className="text-xs opacity-90">Live-Monitoring</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm">Analytics</h4>
                    <p className="text-xs opacity-90">Datenvisualisierung</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#4BA7D7] to-[#203E7C] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm">Effizienzstrategie mit KI</h4>
                    <p className="text-xs opacity-90">Strategische Energieplanung</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      {/* Device Registration Modal */}
      <DeviceRegistration 
        isOpen={showDeviceRegistration} 
        onClose={() => setShowDeviceRegistration(false)} 
      />
    </div>
  );
}