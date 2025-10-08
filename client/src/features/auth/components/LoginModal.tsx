import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Building2, Eye, EyeOff, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
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

  const handleInputChange = (field: keyof typeof loginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#21496E]">
            <Brain className="h-6 w-6" />
            Anmeldung - KI Netzwächter
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-none shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Benutzername eingeben"
                  value={loginForm.username}
                  onChange={handleInputChange('username')}
                  className="w-full"
                  data-testid="input-username"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort eingeben"
                    value={loginForm.password}
                    onChange={handleInputChange('password')}
                    className="w-full pr-10"
                    data-testid="input-password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel"
                  disabled={isLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#21496E] hover:bg-[#1a3a5a] text-white"
                  data-testid="button-login"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Anmelden...
                    </div>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Anmelden
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}