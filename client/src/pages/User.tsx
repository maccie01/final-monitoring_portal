import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserPlus, Edit2, Trash2, Building, Eye, EyeOff, Mail, Send, Info, X, BarChart3, Activity, Zap, BookOpen, Database, UserCheck, Settings, MapPin, Network, Leaf, Grid3x3, Monitor } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

// Icon-Mapping für sidebarPermissions
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    BarChart3,
    Activity,
    MapPin,
    Network,
    Leaf,
    Grid3x3,
    BookOpen,
    Monitor,
    Zap, 
    UserCheck,
    Building,
    Database,
    Settings,
    Users
  };
  return iconMap[iconName] || Activity;
};

// Form Schema für Benutzeränderungen
const userFormSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().optional(), // Beim Bearbeiten optional
  role: z.enum(["viewer", "user", "admin"]),
  userProfileId: z.number().min(1, "Benutzerprofil ist erforderlich"),
  mandantId: z.number().optional(),
  mandantRole: z.enum(["verwalter", "handwerker", "betreuer", "besitzer"]).optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

// Hilfsfunktion für Fehlerprüfung
function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('401') || 
         error?.message?.includes('Unauthorized') ||
         error?.message?.includes('Not authorized');
}

export default function User() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // User Form
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "viewer",
    },
  });

  // Check für Admins: Admins können alle User sehen  
  const isAdmin = currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'admin';
  const currentUserMandantId = (currentUser as any)?.mandantId;

  // Admins holen alle Users, normale Benutzer nur die ihres Mandanten
  const { data: allUsersResponse = [], isLoading: usersLoading, error: usersError } = useQuery<any>({
    queryKey: isAdmin ? ["/api/users"] : ["/api/users/mandant"],
  });
  
  // Handle new API response structure for /api/users/mandant
  const allUsers = useMemo(() => {
    if (isAdmin) {
      return Array.isArray(allUsersResponse) ? allUsersResponse : [];
    } else {
      return allUsersResponse?.users || [];
    }
  }, [allUsersResponse, isAdmin]);

  // Filtere Users nach aktuellem Mandanten (Admins sehen alle)
  const users = useMemo(() => {
    if (!allUsers) return [];
    
    // For normal users using /api/users/mandant, we already get filtered users from API
    // No additional filtering needed since API returns users from mandants [1,2]
    if (!isAdmin) {
      return allUsers; // API already filters for mandants [1,2]
    }
    
    // Admins still use /api/users and need filtering
    return allUsers.filter((user: any) => {
      return true; // Admins sehen alle User
    });
  }, [allUsers, isAdmin, currentUserMandantId]);

  // Fetch user profiles
  const { data: userProfiles = [] } = useQuery<any[]>({
    queryKey: ["/api/user-profiles"],
  });

  // Fetch setup config für Mandantenrollen
  const { data: setupConfig = {} } = useQuery<any>({
    queryKey: ["/api/setup-config"],
  });

  // Fetch alle verfügbaren Mandanten
  const { data: allMandants = [] } = useQuery<any[]>({
    queryKey: ["/api/mandants"],
  });

  // Check if username is unique
  const checkUsernameUnique = async (username: string, excludeUserId?: string) => {
    return !allUsers.some((user: any) => 
      user.username === username && user.id !== excludeUserId
    );
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      // Check username uniqueness
      if (!(await checkUsernameUnique(userData.username))) {
        throw new Error("Benutzername bereits vergeben");
      }
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/mandant"] });
      setUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: "Erfolg",
        description: "Benutzer erfolgreich erstellt",
      });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; userData: Partial<UserFormData> }) => {
      // Check username uniqueness if username changed
      if (data.userData.username && !(await checkUsernameUnique(data.userData.username, data.id))) {
        throw new Error("Benutzername bereits vergeben");
      }
      
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/mandant"] });
      setUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: "Erfolg",
        description: "Benutzer erfolgreich aktualisiert",
      });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/mandant"] });
      setUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: "Erfolg",
        description: "Benutzer erfolgreich gelöscht",
      });
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  // Email password function
  const sendPasswordEmail = async () => {
    const formData = userForm.getValues();
    const newPassword = formData.password;
    const email = formData.email;

    if (!newPassword || !email) {
      toast({
        title: "Fehler",
        description: "E-Mail-Adresse und neues Passwort sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Load email template from database
      const templateResponse = await fetch('/api/settings/system/Mailserver_Passwort');
      let subject = "Portal-Nachricht: Handeln : Zugang";
      let htmlTemplate = "Neue Zugangsdaten für das heimkehr Portal<br><br>Ihr neues Passwort: {PASSWORD}<br><br>Sie können sich hier anmelden: {URL}<br><br><br>Mit freundlichen Grüßen<br>Das heimkehr Portal Team";

      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        if (templateData.value) {
          subject = templateData.value.subject || subject;
          htmlTemplate = templateData.value.html || htmlTemplate;
        }
      }

      // Replace placeholders
      const html = htmlTemplate
        .replace('{PASSWORD}', newPassword)
        .replace('{URL}', window.location.origin);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: subject,
          html: html
        })
      });

      if (response.ok) {
        toast({
          title: "E-Mail gesendet",
          description: `Passwort-E-Mail wurde an ${email} gesendet`,
        });
      } else {
        throw new Error('E-Mail konnte nicht gesendet werden');
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Fehler",
        description: "E-Mail konnte nicht gesendet werden",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Form submit handler
  const onUserSubmit = (data: UserFormData) => {
    // Validierung für Bearbeitung - Passwort kann leer sein
    if (editingUser && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: dataWithoutPassword,
      });
    } else if (editingUser) {
      // Bearbeitung mit neuem Passwort
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: data,
      });
    } else {
      // Erstellung - Passwort erforderlich
      if (!data.password || data.password.length < 6) {
        toast({
          title: "Fehler",
          description: "Passwort muss mindestens 6 Zeichen haben",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(data);
    }
  };

  // Filter users basierend auf Suchterm und blende Admin-Benutzer aus
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Admin-Benutzer ausblenden
    const isNotAdmin = user.role !== 'admin';
    
    return matchesSearch && isNotAdmin;
  });

  // Rolle Badge-Style
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "user": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  // Rolle Display-Name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Administrator";
      case "user": return "Benutzer";
      case "viewer": return "Betrachter";
      default: return role;
    }
  };

  // Mandantenrolle Display-Name
  const getMandantRoleDisplayName = (role: string) => {
    if (!role) return "-";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Edit user handler
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "", // Leer für Bearbeitung
      role: user.role || "viewer",
      userProfileId: user.userProfileId || undefined,
      mandantId: user.mandantId || undefined,
      mandantRole: user.mandantRole || undefined,
    });
    setUserDialogOpen(true);
  };

  // Authentication error check
  if (usersError && isUnauthorizedError(usersError)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Zugriff verweigert</h2>
            <p className="text-gray-600">
              Sie benötigen entsprechende Rechte, um auf diese Benutzerliste zuzugreifen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No mandant assigned (außer für Admins)
  if (!isAdmin && (!currentUser || !currentUserMandantId)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Kein Mandant zugewiesen</h2>
            <p className="text-gray-600">
              Sie müssen einem Mandanten zugewiesen werden, um die Benutzerliste zu sehen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
      <Card>
        <CardHeader className="p-6 border-b border-gray-200">
          
          
          
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-base font-medium text-gray-700">
                Benutzerverwaltung
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {isAdmin ? (
                <Button 
                  onClick={() => {
                    setEditingUser(null);
                    userForm.reset({
                      username: "",
                      firstName: "",
                      lastName: "", 
                      email: "",
                      password: "",
                      role: "viewer",
                      userProfileId: undefined,
                      mandantId: currentUserMandantId || undefined,
                      mandantRole: undefined,
                    });
                    setUserDialogOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Benutzer erstellen
                </Button>
              ) : null}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Benutzer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Benutzer...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">
                {searchTerm ? "Keine Benutzer gefunden" : "Keine Benutzer in Ihrem Mandanten"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white">
                  <TableHead>Benutzername</TableHead>
                  <TableHead>E-Mail/Mandant</TableHead>
                  <TableHead>Profil/Rolle</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any, index: number) => (
                  <TableRow
                    key={user.id}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <TableCell className="py-3">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : "-"
                        }
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const mandantNames = [];
                          
                          // Hauptmandant hinzufügen
                          if (user.mandantId) {
                            const hauptMandant = allMandants.find((m: any) => m.id === user.mandantId)?.name;
                            if (hauptMandant) mandantNames.push(hauptMandant);
                          }
                          
                          // Zusätzliche Mandanten aus mandantAccess hinzufügen
                          if (user.mandantAccess && Array.isArray(user.mandantAccess)) {
                            user.mandantAccess.forEach((mandantId: number) => {
                              if (mandantId !== user.mandantId) { // Duplikat vermeiden
                                const mandantName = allMandants.find((m: any) => m.id === mandantId)?.name;
                                if (mandantName) mandantNames.push(mandantName);
                              }
                            });
                          }
                          
                          return mandantNames.length > 0 ? mandantNames.join(", ") : "-";
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-medium">
                        {userProfiles.find((p: any) => p.id === user.userProfileId)?.name || "-"}
                      </div>
                      <div className="mt-1">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                        aria-label="Benutzer bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Benutzer bearbeiten" : "Benutzer erstellen"}
            </DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname*</FormLabel>
                      <FormControl>
                        <Input placeholder="Vorname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nachname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benutzername*</FormLabel>
                      <FormControl>
                        <Input placeholder="Benutzername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail*</FormLabel>
                      <FormControl>
                        <Input placeholder="E-Mail-Adresse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{editingUser ? "Neues Passwort (optional)" : "Passwort*"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={editingUser ? "Leer lassen für kein Update" : "Passwort eingeben"} 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      {editingUser && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={sendPasswordEmail}
                            disabled={sendingEmail || !field.value || !userForm.getValues().email}
                            className="flex items-center gap-2"
                          >
                            {sendingEmail ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Sende...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                User-Passwort ändern
                              </>
                            )}
                          </Button>
                          <span className="text-sm text-gray-500">
                            E-Mail mit neuem Passwort versenden
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="userProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Benutzerprofil*</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => {
                            const currentProfile = userProfiles.find((p: any) => p.id === field.value);
                            if (currentProfile) {
                              setSelectedProfile(currentProfile);
                              setProfileModalOpen(true);
                            }
                          }}
                          disabled={!field.value}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Profil auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userProfiles
                            .filter((profile: any) => profile.name !== "Administrator")
                            .map((profile: any) => (
                              <SelectItem key={profile.id} value={profile.id.toString()}>
                                {profile.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rolle auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(() => {
                            // Verfügbare Rollen basierend auf aktueller Benutzerrolle
                            const currentUserRole = currentUser && typeof currentUser === 'object' && 'role' in currentUser ? currentUser.role : 'viewer';
                            let availableRoles: { value: string; label: string }[] = [];
                            
                            if (currentUserRole === "admin") {
                              availableRoles = [
                                { value: "viewer", label: "Betrachter" },
                                { value: "user", label: "Benutzer" },
                                { value: "admin", label: "Administrator" }
                              ];
                            } else if (currentUserRole === "user") {
                              availableRoles = [
                                { value: "viewer", label: "Betrachter" },
                                { value: "user", label: "Benutzer" }
                              ];
                            } else {
                              // Viewer kann nur Viewer-Rolle vergeben
                              availableRoles = [
                                { value: "viewer", label: "Betrachter" }
                              ];
                            }
                            
                            return availableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="mandantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mandant</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mandant auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allMandants
                            .filter((mandant: any) => {
                              // Admin sieht alle Mandanten
                              if (isAdmin) return true;
                              
                              // 🎯 GLEICHE LOGIK WIE IN UserSettings.tsx:
                              const userMandantId = (currentUser as any)?.mandantId;
                              const currentUserMandantAccess = (currentUser as any)?.mandantAccess || [];
                              
                              // 1. Hauptmandant anzeigen
                              if (userMandantId && mandant.id === userMandantId) {
                                return true;
                              }
                              
                              // 2. Zusätzliche Mandanten - nutze GLEICHE Fallback-Logik
                              if (currentUserMandantAccess.length > 0) {
                                // Normaler Fall: mandantAccess Array
                                return currentUserMandantAccess.includes(mandant.id);
                              } else if ((currentUser as any)?.id === '103') {
                                // Fallback für User 103: Mandant-ID 2 (Zauske Haustechnik)
                                return mandant.id === 2;
                              }
                              
                              return false;
                            })
                            .map((mandant: any) => (
                              <SelectItem key={mandant.id} value={mandant.id.toString()}>
                                {mandant.name}
                              </SelectItem>
                            ))
                          }
                          {/* Debug Info für leere Liste */}
                          {allMandants.filter((mandant: any) => {
                            if (isAdmin) return true;
                            const currentUserMandantAccess = (currentUser as any)?.mandantAccess || [];
                            if (currentUserMandantAccess.length === 0) {
                              const userMandantId = (currentUser as any)?.mandantId;
                              return userMandantId ? mandant.id === userMandantId : false;
                            }
                            return currentUserMandantAccess.includes(mandant.id);
                          }).length === 0 && (
                            <div className="p-2 text-sm text-gray-500">
                              Keine Mandanten verfügbar
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="mandantRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mandantenrolle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mandantenrolle auswählen" />
                          </SelectTrigger>
                        </FormControl>
                      <SelectContent>
                        {setupConfig && 'config' in setupConfig && setupConfig.config && 'Mandantenrollen' in setupConfig.config && Array.isArray(setupConfig.config.Mandantenrollen) && setupConfig.config.Mandantenrollen.length > 0 ? (
                          setupConfig.config.Mandantenrollen
                            .filter((rolle: string) => rolle !== "Administrator")
                            .map((rolle: string) => (
                              <SelectItem key={rolle} value={rolle.toLowerCase()}>
                                {rolle.charAt(0).toUpperCase() + rolle.slice(1)}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            Keine Mandantenrollen verfügbar
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              <div className="flex justify-between">
                <div>
                  {editingUser && (
                    <Button 
                      type="button" 
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Benutzer "${editingUser.username}" wirklich löschen?`)) {
                          deleteUserMutation.mutate(editingUser.id);
                        }
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editingUser ? updateUserMutation.isPending : createUserMutation.isPending}
                  >
                    {editingUser ? "Aktualisieren" : "Erstellen"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Profile Permissions Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Seitenberechtigungen: {selectedProfile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-0.5">
            {selectedProfile?.sidebar && setupConfig && 'config' in setupConfig && setupConfig.config && 'sidebarPermissions' in setupConfig.config && (() => {
              // Verwende echte sidebarPermissions aus setup-app.json
              const sidebarPermissions = setupConfig.config.sidebarPermissions || [];
              
              return sidebarPermissions.map((permission: any) => {
                const enabled = selectedProfile.sidebar[permission.key] || false;
                const IconComponent = getIconComponent(permission.icon);
                
                return (
                  <div 
                    key={permission.key} 
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      enabled ? 'bg-gray-50' : 'bg-gray-100'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${
                      enabled ? 'text-gray-600' : 'text-gray-300'
                    }`} />
                    <span className={`text-sm font-medium ${
                      enabled ? 'text-gray-900' : 'text-gray-300 line-through'
                    }`}>
                      {permission.label}
                    </span>
                  </div>
                );
              });
            })()}
            {(!selectedProfile?.sidebar || Object.keys(selectedProfile.sidebar).length === 0) && (
              <div className="text-center text-gray-500 py-4">
                Keine Seitenberechtigungen definiert
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setProfileModalOpen(false)}
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}