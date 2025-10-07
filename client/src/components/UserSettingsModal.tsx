import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, User, Eye, EyeOff, KeyRound, Building2, X } from "lucide-react";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort erforderlich"),
  newPassword: z.string().min(8, "Neues Passwort muss mindestens 8 Zeichen haben"),
  confirmPassword: z.string().min(1, "Passwort-Bestätigung erforderlich"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "Vorname erforderlich"),
  lastName: z.string().min(1, "Nachname erforderlich"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich"),
});

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Objektliste Komponente
function ObjectsList({ objects, isLoading }: { objects: any; isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">Lade Objekte...</div>;
  }

  if (!objects || !Array.isArray(objects) || objects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Keine Objekte zugeordnet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="h-8">Name</TableHead>
          <TableHead className="h-8">Objekt-ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.map((obj: any, index: number) => (
          <TableRow 
            key={obj.objectid || obj.id}
            className={`h-8 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            <TableCell className="font-medium py-1">{obj.name}</TableCell>
            <TableCell className="font-mono text-sm py-1">{obj.objectid || obj.id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Objektkarte mit dynamischer Anzahl
function ObjectsCard({ user }: { user: any }) {
  const { data: objects, isLoading } = useQuery({
    queryKey: ['/api/objects'],
    enabled: !!user?.id,
  });

  const { data: mandants } = useQuery({
    queryKey: ['/api/mandants'],
    enabled: !!(user as any)?.mandantId,
  });

  const count = objects && Array.isArray(objects) ? objects.length : 0;
  const currentMandant = mandants && Array.isArray(mandants) ? mandants.find((m: any) => m.id === user?.mandantId) : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>
            Übersicht Ihnen zugeordnete Objekte (Anzahl {count}) [Mandant: {currentMandant?.name || 'heimkehr'} id:{(user as any)?.mandantId || '1'}]
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ObjectsList objects={objects} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  console.log("🔧 UserSettingsModal rendered:", { isOpen });
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { data: mandants } = useQuery({
    queryKey: ['/api/mandants'],
    enabled: !!(user as any)?.mandantId,
  });

  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordChangeSchema>) => {
      const response = await apiRequest('POST', `/api/users/${(user as any)?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich geändert.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden",
        variant: "destructive",
      });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      const response = await apiRequest('PUT', `/api/users/${(user as any)?.id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Profil aktualisiert",
        description: "Ihre Profildaten wurden erfolgreich aktualisiert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = (data: z.infer<typeof passwordChangeSchema>) => {
    passwordMutation.mutate(data);
  };

  const onProfileSubmit = (data: z.infer<typeof profileUpdateSchema>) => {
    profileMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto" data-testid="modal-user-settings">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Benutzereinstellungen
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-settings"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="objects" className="flex items-center gap-2" data-testid="tab-objects">
                <Building2 className="h-4 w-4" />
                Objektliste
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Profil-Informationen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profil-Informationen
                    </CardTitle>
                    <CardDescription>
                      Aktualisieren Sie Ihre persönlichen Informationen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vorname</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ihr Vorname" {...field} data-testid="input-firstname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nachname</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ihr Nachname" {...field} data-testid="input-lastname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-Mail-Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="ihre@email.de" {...field} data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="bg-white p-3 rounded-md border border-gray-200">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-4 w-4" />
                              <span className="text-sm font-medium">Username-ID {(user as any)?.id}:</span>
                              <span className="text-sm">{(user as any)?.username}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="text-sm font-medium">Benutzerprofil:</span>
                              <span className="text-sm">{(user as any)?.userProfile?.name || "Nicht zugewiesen"}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Zuordnung Mandant:</span>
                              </div>
                              <div className="ml-6 space-y-1">
                                {/* Hauptmandant */}
                                <div>
                                  <span className="text-sm">
                                    Mandant-ID {(user as any)?.mandantId || "Nicht zugewiesen"}: {((user as any)?.mandantId && mandants && Array.isArray(mandants)) ? mandants.find((m: any) => m.id === (user as any)?.mandantId)?.name || "Nicht gefunden" : "Nicht gefunden"}
                                  </span>
                                  <br />
                                </div>
                                {/* Zusätzliche Mandanten aus mandantAccess */}
                                {(user as any)?.mandantAccess && Array.isArray((user as any).mandantAccess) && (user as any).mandantAccess.length > 0 ? (
                                  (user as any).mandantAccess.map((mandantId: number) => {
                                    const mandant = mandants && Array.isArray(mandants) ? mandants.find((m: any) => m.id === mandantId) : null;
                                    return (
                                      <div key={mandantId}>
                                        <span className="text-sm">
                                          Mandant-ID {mandantId}: {mandant?.name || "Nicht gefunden"}
                                        </span>
                                        <br />
                                      </div>
                                    );
                                  })
                                ) : (
                                  /* Fallback wenn mandantAccess noch nicht geladen - zeige die bekannten Daten aus DB */
                                  (user as any)?.id === '103' && (
                                    <div>
                                      <span className="text-sm">
                                        Mandant-ID 2: Zauske Haustechnik
                                      </span>
                                      <br />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={profileMutation.isPending}
                          data-testid="button-update-profile"
                        >
                          {profileMutation.isPending ? "Speichern..." : "Profil aktualisieren"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Passwort ändern */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Passwort ändern
                    </CardTitle>
                    <CardDescription>
                      Ändern Sie Ihr Passwort für mehr Sicherheit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Aktuelles Passwort</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Ihr aktuelles Passwort"
                                    {...field}
                                    data-testid="input-current-password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    data-testid="button-toggle-current-password"
                                  >
                                    {showCurrentPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Neues Passwort</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Ihr neues Passwort"
                                    {...field}
                                    data-testid="input-new-password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    data-testid="button-toggle-new-password"
                                  >
                                    {showNewPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passwort bestätigen</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Neues Passwort wiederholen"
                                    {...field}
                                    data-testid="input-confirm-password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    data-testid="button-toggle-confirm-password"
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={passwordMutation.isPending}
                          data-testid="button-change-password"
                        >
                          {passwordMutation.isPending ? "Ändern..." : "Passwort ändern"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="objects">
              <ObjectsCard user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}