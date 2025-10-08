import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-utils";

export default function SuperadminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string, password: string }) => {
      // Try user-login first (supports fallback users)
      const userResponse = await api.post('/api/user-login', { username, password });
      
      if (userResponse.ok) {
        return userResponse.json();
      }
      
      // If user-login fails, try superadmin-login
      const response = await api.post('/api/superadmin-login', { username, password });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🔧 Login successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Check for redirect path from server response
      const redirectPath = data.redirectTo || '/system-settings';
      
      toast({
        title: "Login erfolgreich",
        description: `Weiterleitung zu ${redirectPath === '/system-settings' ? 'SystemSettings' : 'System-Setup'}...`
      });
      setLocation(redirectPath);
    },
    onError: (error: any) => {
      console.error('❌ Login error:', error);
      toast({
        title: "Login fehlgeschlagen",
        description: error.message || "Ungültige Zugangsdaten",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Eingabe erforderlich",
        description: "Bitte Benutzername und Passwort eingeben",
        variant: "destructive"
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Superadmin Login</CardTitle>
          <p className="text-sm text-gray-600">System-Setup Zugriff</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full"
                data-testid="input-username"
              />
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Nur für System-Administratoren
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}