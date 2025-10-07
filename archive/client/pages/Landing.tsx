import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flame, Users, Building, Leaf, BarChart3, Brain, Zap, Shield, TrendingUp, Gauge, Settings, Mail, User } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleLoginClick = () => {
    // Smooth transition with wouter routing instead of window.location
    document.body.style.transition = 'opacity 0.2s ease-out';
    document.body.style.opacity = '0.9';
    setTimeout(() => {
      setLocation('/startki');
      document.body.style.opacity = '1';
    }, 100);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.email.trim()) {
      setShowThankYou(true);
      setTimeout(() => {
        setShowContactModal(false);
        setShowThankYou(false);
        setFormData({ name: '', email: '' });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8bb6ff] via-[#667eea] to-[#2d3748] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating triangles */}
        <div className="absolute top-10 left-10 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-white/10"></div>
        </div>
        <div className="absolute top-32 right-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-white/15"></div>
        </div>
        <div className="absolute top-48 left-1/4 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}>
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-white/20"></div>
        </div>
        <div className="absolute bottom-32 right-1/3 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent border-b-white/8"></div>
        </div>
        <div className="absolute bottom-48 left-16 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[14px] border-l-transparent border-r-transparent border-b-white/12"></div>
        </div>
        <div className="absolute top-1/2 right-8 animate-bounce" style={{ animationDelay: '3s', animationDuration: '6s' }}>
          <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-b-[18px] border-l-transparent border-r-transparent border-b-white/18"></div>
        </div>
        <div className="absolute bottom-1/4 left-1/2 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '4.5s' }}>
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent border-b-white/25"></div>
        </div>
        
        {/* Floating heating-themed icons */}
        <div className="absolute top-20 right-1/4 animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }}>
          <Flame className="h-8 w-8 text-white/20" />
        </div>
        <div className="absolute bottom-40 left-1/3 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}>
          <Zap className="h-6 w-6 text-white/25" />
        </div>
        <div className="absolute top-1/3 left-8 animate-pulse" style={{ animationDelay: '2s', animationDuration: '2.5s' }}>
          <Settings className="h-5 w-5 text-white/20" />
        </div>
        <div className="absolute bottom-20 right-12 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <TrendingUp className="h-7 w-7 text-white/15" />
        </div>
        
        {/* Moving wave effect */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
      </div>
      
      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 text-white">
          <div className="mb-4">
            <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            KI-geführter Netzwächter
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Intelligente Überwachung und Optimierung Ihrer Heizungsanlagen
          </p>
          <Button 
            onClick={handleLoginClick}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 from-[#667eea] to-[#764ba2] hover:from-[#5a6fd8] hover:to-[#6a4190] text-white px-8 py-3 rounded-lg font-semibold text-[16px] bg-[#065eb8]"
          >
            Jetzt starten - Login
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Why AI Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Warum KI-geführte Überwachung?
            </h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#667eea]" />
                  NetzWächter
                </h4>
                <p className="text-xs text-gray-600 mt-1">Der NetzWächter ist die Erweiterung von Heizungsanlagen zu automatisierten Optimierung von Wärmenetzen des Gebäudes.</p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#667eea]" />
                  Expertenteam Klaus & Ingo - Das KI-Team
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Das Expertenteam Klaus & Ingo eröffnet neue Formen der Zusammenarbeit zwischen Mensch und KI. Ohne sie wäre es Arbeit für ein Team, was sich keiner leisten kann.
                </p>
              </div>
              
              
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#667eea]" />
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
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <Gauge className="h-5 w-5 text-white" />
              </div>
              Übersichtliches Portal
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">KPI-Dashboard</h4>
                <p className="text-xs opacity-90">Zentrale Übersicht</p>
              </div>
              
              <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                <Flame className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Netzwächter</h4>
                <p className="text-xs opacity-90">Live-Monitoring</p>
              </div>
              
              <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Analytics</h4>
                <p className="text-xs opacity-90">Datenvisualisierung</p>
              </div>
              
              <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-4 rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Effizienzstrategie mit KI</h4>
                <p className="text-xs opacity-90">Strategische Energieplanung</p>
              </div>
            </div>
          </div>
        </div>



        {/* Benefits Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-white" />
            Vorteile für Betreiber
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg text-center">
              <Leaf className="h-8 w-8 mx-auto mb-3 text-[#667eea]" />
              <h4 className="text-lg font-bold text-gray-800 mb-2">Kosteneinsparungen</h4>
              <p className="text-sm text-gray-600">15-45% weniger Verbrauch<br />durch frühzeitige Erkennung von Ineffizienzen</p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg text-center">
              <Shield className="h-8 w-8 mx-auto mb-3 text-[#667eea]" />
              <h4 className="text-lg font-bold text-gray-800 mb-2">Betriebssicherheit</h4>
              <p className="text-sm text-gray-600">Früherkennung von Problemen <br />
              Weniger Serviceeinsätzen</p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg text-center">
              <Flame className="h-8 w-8 mx-auto mb-3 text-[#667eea]" />
              <h4 className="text-lg font-bold text-gray-800 mb-2">Effizienzplanung</h4>
              <p className="text-sm text-gray-600">Klassifizierung von Wärmenetzen <br /> Sie wissen, was Ihre Anlagen wirklich tun</p>
            </div>
          </div>
        </div>

        {/* Heatcare Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-3 text-center">
            Bereit für effizientes Heizungsmanagement?
          </h2>
          <h3 className="text-2xl font-normal text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-[#667eea]" />
            Heatcare-HeizungsManager
          </h3>
          <h4 className="font-normal text-gray-800 mb-4 text-[16px]">
            KI-gestütztes Effizienz-Monitoring für Heizungsanlagen
          </h4>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Starten Sie noch heute mit der professionellen Verwaltung Ihrer Heizungsanlagen und optimieren Sie Energieeffizienz und Nachhaltigkeit.
          </p>
          <Button 
            onClick={() => setShowContactModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
          >
            <Building className="h-4 w-4 mr-2" />
            Kostenlos testen
          </Button>
        </div>
      </main>

      {/* Kontaktformular Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#667eea]" />
              Info anfordern
            </DialogTitle>
          </DialogHeader>
          
          {!showThankYou ? (
            <form onSubmit={handleContactSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  placeholder="Ihr vollständiger Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Ihre eMail
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                  placeholder="ihre.email@beispiel.de"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  disabled={!formData.name.trim() || !formData.email.trim()}
                >
                  Senden
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="text-4xl text-green-500 mb-4">✓</div>
              <h3 className="text-lg font-semibold text-gray-800">Danke!</h3>
              <p className="text-gray-600">
                Wir melden uns in Kürze bei Ihnen.
              </p>
              <div className="text-sm text-gray-500">
                Sie werden automatisch zur Startseite weitergeleitet...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}