import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Lock, Building2, Eye, EyeOff, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {

  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();







  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Benutzername und Passwort ein",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!",
        });
        
        // Navigiere zur Startseite des Benutzerprofils oder Standard-Dashboard
        const startPage = result.user?.userProfile?.startPage || "/";
        window.location.href = startPage;
      } else {
        const error = await response.json();
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: error.message || "Ungültiger Benutzername oder Passwort",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verbindungsfehler",
        description: "Bitte versuchen Sie es später erneut",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8bb6ff] via-[#667eea] to-[#2d3748] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight text-white">
            KI-geführter Netzwächter
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8 text-white">
            Intelligente Überwachung und Optimierung Ihrer Heizungsanlagen
          </p>
        </div>

        {/* User Login Section */}
        <Card className="mb-4 bg-white/95 backdrop-blur-sm shadow-lg w-full max-w-[400px] mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Benutzer-Anmeldung</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername oder E-Mail</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ihr Benutzername oder E-Mail-Adresse"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ihr Passwort"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Anmelden..." : "Anmelden"}
              </Button>
            </form>
          </CardContent>
        </Card>

        

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© 2025 HeizungsManager - Heizungsanlagen-Management-System</p>
        </div>
      </div>
    </div>
  );
}