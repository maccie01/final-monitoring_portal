import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertMandantSchema, insertObjectGroupSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  UsersIcon,
  PlusIcon,
  PencilIcon,
  ShieldCheckIcon,
  Building,
  Search,
  Users,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Database,
  Zap,
  UserCheck,
  Shield
} from "lucide-react";

// Icon mapping for sidebar permissions (aus setup-app.json)
const iconMap = {
  BarChart3,
  Activity,
  Zap,
  Building,
  BookOpen,
  Database,
  Settings,
  Users,
  UserCheck,
};

// Start pages for user profiles - alle verfügbaren Seiten
const startPages = [
  { value: "/", label: "KPI Dashboard" },
  { value: "/maps", label: "Objekt-Karte" },
  { value: "/network-monitor", label: "Netzwächter" },
  { value: "/efficiency", label: "Klassifizierung" },
  { value: "/objects", label: "Objektverwaltung" },
  { value: "/logbook", label: "Logbuch" },
  { value: "/grafana-dashboards", label: "Objekt-Monitoring" },
  { value: "/energy-data", label: "Energiedaten" },
  { value: "/temperature-analysis", label: "Temperatur-Analyse" },
  { value: "/system-setup", label: "System-Setup" },
  { value: "/users", label: "Benutzerverwaltung" },
  { value: "/user", label: "Meine Benutzer" },
];

// Automatische User ID-Generierung
const generateUserId = (firstName: string, lastName: string): string => {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanFirst}.${cleanLast}.${randomSuffix}`;
};

// Base schema für Benutzer (ohne userId - wird automatisch generiert)
const baseUserSchema = {
  username: z.string().min(1, "Benutzername ist erforderlich"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  userProfileId: z.number().optional(),
  address: z.object({
    firma: z.string().optional(),
    ort: z.string().optional(),
    strasse: z.string().optional(),
    telefon: z.string().optional(),
  }).optional(),
  role: z.enum(["viewer", "user", "admin"]),
  mandantId: z.number().optional(),
  mandantRole: z.enum(["besitzer", "verwalter", "handwerker"]).optional(),
  mandantAccess: z.array(z.number()).optional(),
};

// User form schema - userId nur für Bearbeitung (readonly)
const userProfileFormSchema = z.object({
  ...baseUserSchema,
  userId: z.string().optional(), // Nur für Anzeige beim Bearbeiten
  password: z.string().optional(),
}).refine((data) => {
  // Passwort nur beim Erstellen erforderlich
  if (!data.userId) {
    return data.password && data.password.length >= 6;
  }
  // Beim Bearbeiten ist leeres Passwort ok (bedeutet keine Änderung)
  return true;
}, {
  message: "Passwort muss mindestens 6 Zeichen haben",
  path: ["password"],
});

const mandateFormSchema = insertMandantSchema;
const objectGroupFormSchema = insertObjectGroupSchema;

// Schema für Profile-Form mit Startseiten-Auswahl
const profileFormSchema = z.object({
  name: z.string().min(1, "Profilname ist erforderlich"),
  startPage: z.string().min(1, "Startseite ist erforderlich"),
  sidebar: z.record(z.boolean()).optional(),
});

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [mandateDialogOpen, setMandateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [editingMandate, setEditingMandate] = useState<any>(null);
  const [editingObjectGroup, setEditingObjectGroup] = useState<any>(null);
  const [objectGroupDialogOpen, setObjectGroupDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Check if current user is admin - Only admins can access user management
  const isAdmin = (currentUser as any)?.role === "admin";

  // Security barrier: Block access for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
          <p className="text-gray-600">Sie haben keine Berechtigung, auf die Benutzerverwaltung zuzugreifen.</p>
          <p className="text-sm text-gray-500 mt-2">Nur Administratoren können diese Seite verwenden.</p>
        </div>
      </div>
    );
  }

  // Fetch users (not user profiles)
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch user profiles  
  const { data: userProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["/api/user-profiles"],
  });

  // Fetch mandants
  const { data: mandants, isLoading: mandantsLoading } = useQuery({
    queryKey: ["/api/mandants"],
  });

  // Fetch object groups
  const { data: objectGroups, isLoading: objectGroupsLoading } = useQuery({
    queryKey: ["/api/object-groups"],
  });

  // Fetch objects for assignment
  const { data: objects } = useQuery({
    queryKey: ["/api/objects"],
  });

  // Fetch setup configuration
  const { data: setupConfig, isLoading: setupConfigLoading } = useQuery({
    queryKey: ["/api/setup-config"],
  });

  // Sidebar permissions aus setup-config lesen (dynamisch)
  const sidebarPermissions = (setupConfig as any)?.sidebarPermissions?.map((perm: any) => ({
    ...perm,
    icon: iconMap[perm.icon as keyof typeof iconMap] || Activity // Fallback auf Activity
  })) || [];

  // User profile form
  const userForm = useForm<z.infer<typeof userProfileFormSchema>>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      userId: undefined, // Automatisch generiert
      username: "",
      firstName: "",
      lastName: "",
      password: "",
      email: "",
      userProfileId: undefined,
      address: {
        firma: "",
        ort: "",
        strasse: "",
        telefon: "",
      },
      role: "viewer",
      mandantId: undefined, // Muss vom Benutzer ausgewählt werden
      mandantRole: undefined,
      mandantAccess: [],
    },
    mode: "onChange",
  });

  // UserProfile form - separate form for profile management
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      startPage: "/",
      sidebar: {},
    },
  });

  // Mandate form
  const mandateForm = useForm<z.infer<typeof mandateFormSchema>>({
    resolver: zodResolver(mandateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      info: {
        adresse: {
          strasse: "",
          hausnummer: "",
          plz: "",
          ort: "",
          land: "Deutschland",
        },
        kontakt: {
          email: "",
          telefon: "",
          mobil: "",
          website: "",
        },
      },
    },
  });

  // Object group form
  const objectGroupForm = useForm<z.infer<typeof objectGroupFormSchema>>({
    resolver: zodResolver(objectGroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userProfileFormSchema>) => {
      // Automatische User ID-Generierung für neue Benutzer
      const userData = {
        ...data,
        userId: generateUserId(data.firstName, data.lastName)
      };
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "Benutzer erstellt",
        description: "Der neue Benutzer wurde erfolgreich erstellt.",
      });
      setUserDialogOpen(false);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen des Benutzers: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return await apiRequest("POST", "/api/user-profiles", data);
    },
    onSuccess: () => {
      toast({
        title: "Profil erstellt",
        description: "Das neue Benutzerprofil wurde erfolgreich erstellt.",
      });
      setProfileDialogOpen(false);
      profileForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user-profiles"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen des Profils: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const createMandateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mandateFormSchema>) => {
      return await apiRequest("POST", "/api/mandants", data);
    },
    onSuccess: () => {
      toast({
        title: "Mandant erstellt",
        description: "Der neue Mandant wurde erfolgreich erstellt.",
      });
      setMandateDialogOpen(false);
      mandateForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/mandants"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen des Mandanten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const createObjectGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof objectGroupFormSchema>) => {
      return await apiRequest("POST", "/api/object-groups", data);
    },
    onSuccess: () => {
      toast({
        title: "Objektgruppe erstellt",
        description: "Die neue Objektgruppe wurde erfolgreich erstellt.",
      });
      setObjectGroupDialogOpen(false);
      objectGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/object-groups"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen der Objektgruppe: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof userProfileFormSchema> }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Benutzer aktualisiert",
        description: "Der Benutzer wurde erfolgreich aktualisiert.",
      });
      setUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Benutzers: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof profileFormSchema> }) => {
      return await apiRequest("PUT", `/api/user-profiles/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profil aktualisiert",
        description: "Das Benutzerprofil wurde erfolgreich aktualisiert.",
      });
      setProfileDialogOpen(false);
      setEditingProfile(null);
      profileForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user-profiles"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Profils: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const updateMandateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof mandateFormSchema> }) => {
      return await apiRequest("PATCH", `/api/mandants/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Mandant aktualisiert",
        description: "Der Mandant wurde erfolgreich aktualisiert.",
      });
      setMandateDialogOpen(false);
      setEditingMandate(null);
      mandateForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/mandants"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Mandanten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/user-profiles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Profil gelöscht",
        description: "Das Benutzerprofil wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-profiles"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Profils: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Benutzer gelöscht",
        description: "Der Benutzer wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Benutzers: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const deleteMandateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/mandants/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Mandant gelöscht",
        description: "Der Mandant wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mandants"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Mandanten: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const updateObjectGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof objectGroupFormSchema> }) => {
      console.log("Update ObjectGroup Mutation:", { id, data });
      return await apiRequest("PATCH", `/api/object-groups/${id}`, data);
    },
    onSuccess: (data, variables) => {
      console.log("Update ObjectGroup Success:", data, variables);
      toast({
        title: "Objektgruppe aktualisiert",
        description: "Die Objektgruppe wurde erfolgreich aktualisiert.",
      });
      // Invalidate queries first, then UI cleanup after delay
      queryClient.invalidateQueries({ queryKey: ["/api/object-groups"] });
      
      setTimeout(() => {
        setEditingObjectGroup(null);
        objectGroupForm.reset({
          name: "",
          description: "",
        });
        setObjectGroupDialogOpen(false);
      }, 300);
    },
    onError: (error) => {
      console.error("Update ObjectGroup Error:", error);
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Objektgruppe: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  const deleteObjectGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/object-groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Objektgruppe gelöscht",
        description: "Die Objektgruppe wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/object-groups"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen der Objektgruppe: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        variant: "destructive",
      });
    },
  });

  // Form submit handlers
  const onUserSubmit = (data: z.infer<typeof userProfileFormSchema>) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    console.log("🔍 Profile Submit Data:", data);
    console.log("🔍 Selected Permissions:", selectedPermissions);
    
    // Sicherstellen, dass sidebar Daten übertragen werden
    const submitData = {
      ...data,
      sidebar: selectedPermissions
    };
    
    console.log("🔍 Final Submit Data:", submitData);
    
    if (editingProfile) {
      updateProfileMutation.mutate({ id: editingProfile.id, data: submitData });
    } else {
      createProfileMutation.mutate(submitData);
    }
  };

  const onMandateSubmit = (data: z.infer<typeof mandateFormSchema>) => {
    if (editingMandate) {
      updateMandateMutation.mutate({ id: editingMandate.id, data });
    } else {
      createMandateMutation.mutate(data);
    }
  };

  const onObjectGroupSubmit = (data: z.infer<typeof objectGroupFormSchema>) => {
    console.log("ObjectGroup Submit:", { editingObjectGroup, data });
    if (editingObjectGroup) {
      updateObjectGroupMutation.mutate({ id: editingObjectGroup.id, data });
    } else {
      createObjectGroupMutation.mutate(data);
    }
  };

  // Edit handlers
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "", // Leeres Passwort beim Bearbeiten - optional
      email: user.email,
      userProfileId: user.userProfileId,
      address: user.address || {
        firma: "",
        ort: "",
        strasse: "",
        telefon: "",
      },
      role: user.role,
      mandantId: user.mandantId || undefined,
      mandantRole: user.mandantRole || undefined,
      mandantAccess: user.mandantAccess || [],
    });
    setUserDialogOpen(true);
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    const currentSidebar = profile.sidebar || {};
    setSelectedPermissions(currentSidebar);
    profileForm.reset({
      name: profile.name,
      startPage: profile.startPage,
      sidebar: currentSidebar,
    });
    setProfileDialogOpen(true);
  };

  const handleEditMandate = (mandate: any) => {
    setEditingMandate(mandate);
    mandateForm.reset({
      name: mandate.name,
      description: mandate.description,
      category: mandate.category,
      info: {
        adresse: {
          strasse: mandate.info?.adresse?.strasse || "",
          hausnummer: mandate.info?.adresse?.hausnummer || "",
          plz: mandate.info?.adresse?.plz || "",
          ort: mandate.info?.adresse?.ort || "",
          land: mandate.info?.adresse?.land || "Deutschland",
        },
        kontakt: {
          email: mandate.info?.kontakt?.email || "",
          telefon: mandate.info?.kontakt?.telefon || "",
          mobil: mandate.info?.kontakt?.mobil || "",
          website: mandate.info?.kontakt?.website || "",
        },
      },
    });
    setMandateDialogOpen(true);
  };

  const handleEditObjectGroup = (objectGroup: any) => {
    console.log("Edit ObjectGroup:", objectGroup);
    setEditingObjectGroup(objectGroup);
    // Set form values with a small delay to ensure state is properly set
    setTimeout(() => {
      objectGroupForm.reset({
        name: objectGroup.name || "",
        description: objectGroup.description || "",
      });
    }, 50);
    setObjectGroupDialogOpen(true);
  };

  const handleDeleteObjectGroup = (objectGroup: any) => {
    if (confirm(`Möchten Sie die Objektgruppe "${objectGroup.name}" wirklich löschen?`)) {
      deleteObjectGroupMutation.mutate(objectGroup.id);
    }
  };

  const handleDeleteMandate = (id: number) => {
    if (confirm("Sind Sie sicher, dass Sie diesen Mandanten löschen möchten?")) {
      deleteMandateMutation.mutate(id);
    }
  };

  // Reset form handlers
  const resetUserForm = () => {
    setEditingUser(null);
    userForm.reset({
      userId: undefined, // Wird automatisch generiert
      username: "",
      firstName: "",
      lastName: "",
      password: "",
      email: "",
      userProfileId: undefined,
      address: {
        firma: "",
        ort: "",
        strasse: "",
        telefon: "",
      },
      role: "viewer",
      // Wenn aktueller User die Rolle "user" hat, übernehme dessen mandantId
      mandantId: (currentUser as any)?.role === "user" ? (currentUser as any)?.mandantId : undefined,
      mandantRole: undefined,
    });
  };

  const resetProfileForm = () => {
    setEditingProfile(null);
    setSelectedPermissions({});
    profileForm.reset({ name: "", startPage: "/", sidebar: {} });
  };

  const resetMandateForm = () => {
    setEditingMandate(null);
    mandateForm.reset({ name: "", description: "", category: "" });
  };

  const resetObjectGroupForm = () => {
    setEditingObjectGroup(null);
    objectGroupForm.reset({ name: "", description: "" });
  };

  // Filter functions
  const filteredUsers = (users as any)?.filter((user: any) =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Authentication error check
  if (usersError && isUnauthorizedError(usersError)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Zugriff verweigert</h2>
            <p className="text-gray-600">
              Sie benötigen Administrator-Rechte, um auf die Benutzerverwaltung zuzugreifen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
      <style>{`
        /* UserManagement Tab Overrides - Höchste Spezifität */
        /* Tabellenleiste Hintergrund hellgrau */
        div[role="tablist"] {
          background-color: #f3f4f6 !important;
        }
        button[data-state="active"] {
          background-color: #ffffff !important;
          color: #2563eb !important;
        }
        button[role="tab"]:not([data-state="active"]) {
          background-color: #f3f4f6 !important;
          color: #6b7280 !important;
        }
        /* Spezielle Regel für Profile Tab */
        button[value="profiles"] {
          background-color: #f3f4f6 !important;
          color: #6b7280 !important;
        }
        button[value="profiles"][data-state="active"] {
          background-color: #ffffff !important;
          color: #2563eb !important;
        }
        /* Tabellenkopfzeilen auf weiß setzen */
        tr[class*="bg-gray-200"] {
          background-color: #ffffff !important;
        }
        tr[class*="bg-gray-200"]:hover {
          background-color: #ffffff !important;
        }
        /* Direkte Selektor für alle TableRow Header */
        thead tr {
          background-color: #ffffff !important;
        }
        thead tr:hover {
          background-color: #ffffff !important;
        }
        /* Noch spezifischere Selektoren für Tabellenkopfzeilen */
        table thead tr {
          background-color: #ffffff !important;
        }
        table thead tr:hover {
          background-color: #ffffff !important;
        }
        .bg-gray-200 {
          background-color: #ffffff !important;
        }
        .hover\\:bg-gray-200:hover {
          background-color: #ffffff !important;
        }
        /* Globaler Override für alle grauen Hintergründe in UserManagement */
        * {
          --tw-bg-opacity: 1 !important;
        }
        *[class*="bg-gray-200"] {
          background-color: rgb(255 255 255 / var(--tw-bg-opacity)) !important;
        }
        *[class*="hover:bg-gray-200"]:hover {
          background-color: rgb(255 255 255 / var(--tw-bg-opacity)) !important;
        }
      `}</style>
      <Card>
        <CardHeader className="p-0">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 border-b border-gray-200 w-full">
              <TabsTrigger 
                value="users" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 ring-offset-background transition-all hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                <span>Benutzer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mandates"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 ring-offset-background transition-all hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                <span>Mandanten</span>
              </TabsTrigger>
              <TabsTrigger 
                value="objectgroups"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 ring-offset-background transition-all hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <Building className="h-4 w-4 mr-2" />
                <span>Objektgruppen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profiles"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 ring-offset-background transition-all hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="userlog"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 ring-offset-background transition-all hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                <Activity className="h-4 w-4 mr-2" />
                <span>UserLog</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-0 p-0">
              <CardContent className="p-1 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                      <Input
                        placeholder="Benutzer suchen..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Dialog open={userDialogOpen} onOpenChange={(open) => {
                    setUserDialogOpen(open);
                    if (!open) resetUserForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetUserForm}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Neuer Benutzer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingUser ? "Benutzerprofil bearbeiten" : "Neues Benutzerprofil"}</DialogTitle>
                      </DialogHeader>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                          {/* User ID nur anzeigen beim Bearbeiten */}
                          {editingUser && (
                            <div className="mb-4">
                              <FormLabel>User ID</FormLabel>
                              <Input 
                                value={editingUser.id} 
                                disabled 
                                className="bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                              />
                              <p className="text-sm text-gray-500 mt-1">Die User ID wird automatisch generiert und kann nicht geändert werden.</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-4">
                            <FormField
                              control={userForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Benutzername*</FormLabel>
                                  <FormControl>
                                    <Input placeholder="z.B. admin" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

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
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>E-Mail*</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="user@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                                  <FormLabel>Benutzerprofil</FormLabel>
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
                                      {(userProfiles as any)?.map((profile: any) => (
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
                                        const currentUserRole = (currentUser as any)?.role;
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

                          {/* Mandantenfelder für Admin und User */}
                          {((currentUser as any)?.role === "admin" || (currentUser as any)?.role === "user") && (
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={userForm.control}
                                name="mandantId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mandant</FormLabel>
                                    {(currentUser as any)?.role === "admin" ? (
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
                                          {(mandants as any)?.filter((mandant: any) => mandant.id && mandant.name).map((mandant: any) => (
                                            <SelectItem key={mandant.id} value={mandant.id.toString()}>
                                              {mandant.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <FormControl>
                                        <Input 
                                          value={field.value ? (mandants as any)?.find((m: any) => m.id === field.value)?.name || "Unbekannt" : "Kein Mandant"}
                                          readOnly
                                          className="bg-gray-50 text-gray-600"
                                        />
                                      </FormControl>
                                    )}
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
                                        {(setupConfig as any)?.config?.Mandantenrollen?.length > 0 ? (
                                          (setupConfig as any).config.Mandantenrollen.map((rolle: string) => (
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
                          )}

                          {/* Mandanten-Zugriff Mehrfachauswahl */}
                          {((currentUser as any)?.role === "admin" || (currentUser as any)?.role === "user") && (
                            <FormField
                              control={userForm.control}
                              name="mandantAccess"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Zugriff auf Mandant
                                  </FormLabel>
                                  <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                                    {(mandants as any)?.length > 0 ? (
                                      (mandants as any).map((mandant: any) => (
                                        <div key={mandant.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`mandant-${mandant.id}`}
                                            checked={field.value?.includes(mandant.id) || false}
                                            onCheckedChange={(checked) => {
                                              const currentValue = field.value || [];
                                              if (checked) {
                                                field.onChange([...currentValue, mandant.id]);
                                              } else {
                                                field.onChange(currentValue.filter((id: number) => id !== mandant.id));
                                              }
                                            }}
                                          />
                                          <label 
                                            htmlFor={`mandant-${mandant.id}`}
                                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                          >
                                            <span>{mandant.name}</span>
                                            {mandant.category && (
                                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {mandant.category}
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500 py-2">
                                        Keine Mandanten verfügbar
                                      </div>
                                    )}
                                  </div>
                                  {field.value && field.value.length > 0 && (
                                    <div className="text-xs text-gray-600 mt-2">
                                      {field.value.length} Mandant{field.value.length !== 1 ? 'en' : ''} ausgewählt
                                    </div>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="flex justify-between items-center">
                            {/* Löschen-Button nur beim Bearbeiten anzeigen */}
                            {editingUser && (
                              <Button 
                                type="button" 
                                variant="destructive" 
                                onClick={() => {
                                  if (confirm("Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?")) {
                                    deleteUserMutation.mutate(editingUser.id);
                                    setUserDialogOpen(false);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </Button>
                            )}
                            <div className="flex space-x-2 ml-auto">
                              <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                                Abbrechen
                              </Button>
                              <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                                {editingUser ? "Aktualisieren" : "Erstellen"}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : filteredUsers?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow style={{backgroundColor: '#ffffff'}} className="hover:bg-white">
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Benutzername</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Name</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">E-Mail</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Rolle</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Mandant</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user: any, index: number) => (
                        <TableRow key={user.id} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <TableCell className="font-medium py-1 px-4 pl-[10px] pr-[10px]">{user.username}</TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">{user.firstName} {user.lastName}</TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">{user.email}</TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <Badge variant={user.role === "admin" ? "default" : user.role === "user" ? "secondary" : "outline"}>
                              {user.role === "admin" ? "Administrator" : user.role === "user" ? "Benutzer" : "Betrachter"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            {user.mandantId ? 
                              (mandants as any)?.find((m: any) => m.id === user.mandantId)?.name || "Unbekannt" 
                              : "Kein Mandant"}
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <div className="flex space-x-2">
                              {((currentUser as any)?.role === "user" || (currentUser as any)?.role === "admin") && (
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditUser(user)} aria-label="Benutzer bearbeiten">
                                  <PencilIcon className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Keine Benutzer gefunden</p>
                    <p className="text-sm mt-1">Erstellen Sie einen neuen Benutzer</p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="profiles" className="mt-0 p-0">
              <CardContent className="p-1 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                      <Input
                        placeholder="Profile suchen..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Dialog open={profileDialogOpen} onOpenChange={(open) => {
                    setProfileDialogOpen(open);
                    if (!open) resetProfileForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetProfileForm}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Neues Profil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProfile ? "Profil bearbeiten" : "Neues Benutzerprofil"}</DialogTitle>
                      </DialogHeader>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Profilname*</FormLabel>
                                  <FormControl>
                                    <Input placeholder="z.B. Administrator" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="startPage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Startseite*</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Startseite auswählen" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {startPages.map((page) => (
                                        <SelectItem key={page.value} value={page.value}>
                                          {page.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div>
                            <FormLabel className="text-base font-medium">Seitenleisten-Berechtigungen</FormLabel>
                            <div className="grid grid-cols-2 gap-3 mt-4 max-h-64 overflow-y-auto">
                              {sidebarPermissions.map((permission: any) => {
                                const IconComponent = permission.icon;
                                const isChecked = selectedPermissions[permission.key] === true;
                                return (
                                  <div key={permission.key} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                    <Checkbox
                                      id={permission.key}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = {
                                          ...selectedPermissions,
                                          [permission.key]: checked === true
                                        };
                                        setSelectedPermissions(newPermissions);
                                        profileForm.setValue("sidebar", newPermissions);
                                      }}
                                    />
                                    <label
                                      htmlFor={permission.key}
                                      className="text-sm font-medium leading-none cursor-pointer flex items-center space-x-2 flex-1"
                                    >
                                      <IconComponent className="h-4 w-4 text-gray-600" />
                                      <span>{permission.label}</span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setProfileDialogOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button type="submit" disabled={createProfileMutation.isPending || updateProfileMutation.isPending}>
                              {editingProfile ? "Aktualisieren" : "Erstellen"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {profilesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (userProfiles as any)?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow style={{backgroundColor: '#ffffff'}} className="hover:bg-white">
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Name</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Startseite</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Berechtigungen</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(userProfiles as any)?.map((profile: any, index: number) => (
                        <TableRow key={profile.id} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <TableCell className="font-medium py-1 px-4 pl-[10px] pr-[10px]">{profile.name}</TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            {startPages.find(p => p.value === profile.startPage)?.label || profile.startPage}
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(profile.sidebar || {})
                                .filter(([_, enabled]) => enabled)
                                .slice(0, 3)
                                .map(([key, _]) => {
                                  const permission = sidebarPermissions.find((p: any) => p.key === key);
                                  return (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                      {permission?.label || key}
                                    </Badge>
                                  );
                                })}
                              {Object.entries(profile.sidebar || {}).filter(([_, enabled]) => enabled).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{Object.entries(profile.sidebar || {}).filter(([_, enabled]) => enabled).length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditProfile(profile)} aria-label="Profil bearbeiten">
                                <PencilIcon className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  if (confirm("Sind Sie sicher, dass Sie dieses Profil löschen möchten?")) {
                                    deleteProfileMutation.mutate(profile.id);
                                  }
                                }}
                                aria-label="Profil löschen"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Keine Benutzerprofile vorhanden</p>
                    <p className="text-sm mt-1">Erstellen Sie ein neues Benutzerprofil</p>
                  </div>
                )}
              </CardContent>
              </TabsContent>

            <TabsContent value="mandates" className="mt-0 p-0">
              <CardContent className="p-1 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                      <Input
                        placeholder="Mandanten suchen..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Dialog open={mandateDialogOpen} onOpenChange={(open) => {
                    setMandateDialogOpen(open);
                    if (!open) resetMandateForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetMandateForm}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Neuer Mandant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingMandate ? "Mandant bearbeiten" : "Neuer Mandant"}</DialogTitle>
                      </DialogHeader>
                      <Form {...mandateForm}>
                        <form onSubmit={mandateForm.handleSubmit(onMandateSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={mandateForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name*</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Mandantenname" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mandateForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kategorie</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Kategorie auswählen" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(setupConfig as any)?.config?.Mandantenkategorien?.map((kategorie: string) => (
                                        <SelectItem key={kategorie} value={kategorie}>
                                          {kategorie}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={mandateForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Beschreibung</FormLabel>
                                <FormControl>
                                  <Input placeholder="Mandantenbeschreibung" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Adresse Sektion */}
                          <div className="space-y-3">
                            <div className="border-t pt-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">📍 Adresse</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <FormField
                                    control={mandateForm.control}
                                    name="info.adresse.strasse"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Straße</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Musterstraße" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={mandateForm.control}
                                  name="info.adresse.hausnummer"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Nr.</FormLabel>
                                      <FormControl>
                                        <Input placeholder="123" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3 mt-3">
                                <FormField
                                  control={mandateForm.control}
                                  name="info.adresse.plz"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">PLZ</FormLabel>
                                      <FormControl>
                                        <Input placeholder="12345" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="col-span-2">
                                  <FormField
                                    control={mandateForm.control}
                                    name="info.adresse.ort"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Ort</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Musterstadt" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                              <FormField
                                control={mandateForm.control}
                                name="info.adresse.land"
                                render={({ field }) => (
                                  <FormItem className="mt-3">
                                    <FormLabel className="text-xs">Land</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Deutschland" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Kontakt Sektion */}
                          <div className="space-y-3">
                            <div className="border-t pt-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">📞 Kontakt</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <FormField
                                  control={mandateForm.control}
                                  name="info.kontakt.email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">E-Mail</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="info@mandant.de" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={mandateForm.control}
                                  name="info.kontakt.telefon"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Telefon</FormLabel>
                                      <FormControl>
                                        <Input placeholder="0123 456789" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <FormField
                                  control={mandateForm.control}
                                  name="info.kontakt.mobil"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Mobil</FormLabel>
                                      <FormControl>
                                        <Input placeholder="0178 123456" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={mandateForm.control}
                                name="info.kontakt.website"
                                render={({ field }) => (
                                  <FormItem className="mt-3">
                                    <FormLabel className="text-xs">Website</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://www.mandant.de" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setMandateDialogOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button type="submit" disabled={createMandateMutation.isPending || updateMandateMutation.isPending}>
                              {editingMandate ? "Aktualisieren" : "Erstellen"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {mandantsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-20 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (mandants as any)?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow style={{backgroundColor: '#ffffff'}} className="hover:bg-white">
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Name</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Beschreibung</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Kategorie</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Erstellt</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(mandants as any)?.map((mandant: any, index: number) => (
                        <TableRow key={mandant.id} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <TableCell className="font-medium py-1 px-4 pl-[10px] pr-[10px]">{mandant.name}</TableCell>
                          <TableCell className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]">{mandant.description || "Keine Beschreibung"}</TableCell>
                          <TableCell className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]">{mandant.category || "Keine Kategorie"}</TableCell>
                          <TableCell className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]">
                            {mandant.createdAt ? new Date(mandant.createdAt).toLocaleDateString('de-DE') : "N/A"}
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditMandate(mandant)} aria-label="Mandant bearbeiten">
                                <PencilIcon className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleDeleteMandate(mandant.id)} aria-label="Mandant löschen">
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Keine Mandanten gefunden</p>
                    <p className="text-sm mt-1">Erstellen Sie einen neuen Mandanten</p>
                  </div>
                )}
              </CardContent>
              </TabsContent>

            <TabsContent value="objectgroups" className="mt-0 p-0">
              <CardContent className="p-1 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                      <Input
                        placeholder="Objektgruppen suchen..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Dialog open={objectGroupDialogOpen} onOpenChange={(open) => {
                    if (!open && !updateObjectGroupMutation.isPending) {
                      // Only reset if not currently updating
                      setTimeout(() => resetObjectGroupForm(), 100);
                    }
                    setObjectGroupDialogOpen(open);
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={resetObjectGroupForm}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Neue Objektgruppe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingObjectGroup ? "Objektgruppe bearbeiten" : "Neue Objektgruppe"}</DialogTitle>
                      </DialogHeader>
                      <Form {...objectGroupForm}>
                        <form onSubmit={objectGroupForm.handleSubmit(onObjectGroupSubmit)} className="space-y-4">
                          <FormField
                            control={objectGroupForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Objektgruppenname" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={objectGroupForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Beschreibung</FormLabel>
                                <FormControl>
                                  <Input placeholder="Objektgruppenbeschreibung" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => {
                              setObjectGroupDialogOpen(false);
                              setTimeout(() => resetObjectGroupForm(), 100);
                            }}>
                              Abbrechen
                            </Button>
                            <Button type="submit" disabled={createObjectGroupMutation.isPending || updateObjectGroupMutation.isPending}>
                              {editingObjectGroup ? "Aktualisieren" : "Erstellen"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {objectGroupsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (objectGroups as any)?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow style={{backgroundColor: '#ffffff'}} className="hover:bg-white">
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Name</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Beschreibung</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Anzahl Objekte</TableHead>
                        <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(objectGroups as any)?.map((group: any, index: number) => (
                        <TableRow key={group.id} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <TableCell className="font-medium py-1 px-4 pl-[10px] pr-[10px]">{group.name}</TableCell>
                          <TableCell className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]">{group.description || "Keine Beschreibung"}</TableCell>
                          <TableCell className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]">
                            {(objects as any)?.filter((obj: any) => obj.groupId === group.id)?.length || 0}
                          </TableCell>
                          <TableCell className="py-1 px-4 pl-[10px] pr-[10px]">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditObjectGroup(group)}
                                aria-label="Objektgruppe bearbeiten"
                              >
                                <PencilIcon className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDeleteObjectGroup(group)}
                                disabled={deleteObjectGroupMutation.isPending}
                                aria-label="Objektgruppe löschen"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Keine Objektgruppen gefunden</p>
                    <p className="text-sm mt-1">Erstellen Sie eine neue Objektgruppe</p>
                  </div>
                )}
              </CardContent>
              </TabsContent>
            <TabsContent value="userlog" className="mt-0 p-0">
              <UserLogTab />
            </TabsContent>

          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}

// UserLogTab Komponente für User-Aktivitäten
function UserLogTab() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  // Fetch users for filter dropdown
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch user activity logs
  const { data: userActivities, isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/user-activity-logs", timeRange],
  });

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'login': 'bg-green-500 text-white',
      'logout': 'bg-gray-500 text-white', 
      'created_object': 'bg-blue-500 text-white',
      'updated_object': 'bg-yellow-500 text-black',
      'deleted_object': 'bg-red-500 text-white',
      'created_user': 'bg-purple-500 text-white',
      'updated_user': 'bg-orange-500 text-white',
      'viewed_dashboard': 'bg-cyan-500 text-white',
      'exported_data': 'bg-indigo-500 text-white'
    };
    
    const colorClass = actionColors[action] || 'bg-gray-400 text-white';
    const displayText = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return <Badge className={`${colorClass} text-xs px-1 py-0 h-5`}>{displayText}</Badge>;
  };

  const filteredActivities = userActivities?.filter((activity) => {
    const actionMatch = selectedAction === "all" || activity.action === selectedAction;
    const userMatch = selectedUser === "all" || activity.user_id === selectedUser;
    return actionMatch && userMatch;
  }) || [];

  return (
    <CardContent className="p-1 pl-[10px] pr-[10px] pt-[10px] pb-[10px]">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                User-Aktivitäten
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Benutzer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Benutzer</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">24h</SelectItem>
                    <SelectItem value="7d">7 Tage</SelectItem>
                    <SelectItem value="30d">30 Tage</SelectItem>
                    <SelectItem value="all">Alle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{filteredActivities.length}</div>
                <div className="text-xs text-blue-800">Aktivitäten</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">
                  {filteredActivities.length > 0 ? new Set(filteredActivities.map(a => a.user_id)).size : 0}
                </div>
                <div className="text-xs text-green-800">Benutzer</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">
                  {filteredActivities.filter(a => a.action === 'login').length || 0}
                </div>
                <div className="text-xs text-purple-800">Anmeldungen</div>
              </div>
            </div>

            {/* Activities Table */}
            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Lade User-Aktivitäten...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine User-Aktivitäten gefunden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs py-1 px-2">Zeit</TableHead>
                      <TableHead className="text-xs py-1 px-2">Benutzer</TableHead>
                      <TableHead className="text-xs py-1 px-2">Aktion</TableHead>
                      <TableHead className="text-xs py-1 px-2">Ressource</TableHead>
                      <TableHead className="text-xs py-1 px-2">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.slice(0, 50).map((activity) => (
                      <TableRow key={activity.id} className="h-8 hover:bg-blue-50">
                        <TableCell className="text-xs py-1 px-2">
                          {new Date(activity.timestamp).toLocaleDateString('de-DE')} {new Date(activity.timestamp).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}
                        </TableCell>
                        <TableCell className="font-medium text-xs py-1 px-2">
                          {activity.user_first_name && activity.user_last_name 
                            ? `${activity.user_first_name} ${activity.user_last_name}` 
                            : (activity.user_email || activity.user_id)}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {getActionBadge(activity.action)}
                        </TableCell>
                        <TableCell className="text-xs py-1 px-2">
                          {activity.resource_type && activity.resource_id 
                            ? `${activity.resource_type}:${activity.resource_id}`
                            : activity.resource_type || "-"}
                        </TableCell>
                        <TableCell className="text-xs py-1 px-2">
                          {activity.details ? (
                            <div className="max-w-[120px] truncate" title={JSON.stringify(activity.details, null, 2)}>
                              {JSON.stringify(activity.details).substring(0, 20)}...
                            </div>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CardContent>
  );
}