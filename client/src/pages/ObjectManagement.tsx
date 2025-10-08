import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertObjectSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createFilterOptions, filterObjects, ObjectGroup } from "@/components/ObjectFilterAPI";
import { 
  Info,
  Flame,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Search,
  Settings,
  Save,
  X,
  Share2,
  Leaf,
  Zap,
  Users
} from "lucide-react";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { z } from "zod";
import ObjektinfoContent from "@/components/ObjektinfoContent";



const objdataFormSchema = z.object({
  NE: z.any().optional(),
  GEG: z.any().optional(),
  area: z.any().optional(),
});

const objectFormSchema = insertObjectSchema.extend({
  objectid: z.coerce.number().optional(),
  mandantId: z.coerce.number().min(1, "Mandant ist erforderlich"),
});

const objectInfoFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  nutzflaeche: z.any().optional(),
  nutzeinheiten: z.any().optional(),
  geg: z.any().optional(),
});

export default function ObjectManagement() {
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'konfiguration' | 'setup' | 'zuordnung'>('home');
  const [editingJson, setEditingJson] = useState<string>('');
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [editingPortdata, setEditingPortdata] = useState<string>('');
  const [selectedSetupField, setSelectedSetupField] = useState<'portdata' | 'report'>('portdata');
  const [selectedKonfigField, setSelectedKonfigField] = useState<'meter' | 'objanlage' | 'objdata'>('meter');
  const [objectDialogOpen, setObjectDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<any>(null);
  const [objdataDialogOpen, setObjdataDialogOpen] = useState(false);
  const [objectInfoDialogOpen, setObjectInfoDialogOpen] = useState(false);
  
  // Filter states
  const [filterTyp, setFilterTyp] = useState("__all__");
  const [filterHandwerker, setFilterHandwerker] = useState("__all__");
  
  // Mandanten-Zuordnung States
  const [selectedVerwalterMandant, setSelectedVerwalterMandant] = useState<number | null>(null);
  const [selectedHandwerkerMandant, setSelectedHandwerkerMandant] = useState<number | null>(null);
  const [selectedBetreuerMandant, setSelectedBetreuerMandant] = useState<number | null>(null);
  const [selectedBesitzerMandant, setSelectedBesitzerMandant] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  // Benutzer-spezifische Mandanten-Filterung für Objekte
  const currentUserMandantId = (currentUser as any)?.mandantId;

  // Fetch objects from database mit benutzer-spezifischer Mandanten-Filterung
  const { data: objects, isLoading: objectsLoading } = useQuery({
    queryKey: ["/api/objects", currentUserMandantId],
    queryFn: async () => {
      const url = currentUserMandantId 
        ? `/api/objects?mandantId=${currentUserMandantId}`
        : "/api/objects";
      return await fetch(url).then(res => res.json());
    }
  });


  // Fetch mandants for dropdown
  const { data: mandants } = useQuery({
    queryKey: ["/api/mandants"],
  });

  // Fetch object groups (for Anlagentyp and dynamic filtering)
  const { data: objectGroups } = useQuery<ObjectGroup[]>({
    queryKey: ["/api/object-groups"],
  });

  // Fetch threshold settings (for TemperaturGrenzwert dropdown)
  const { data: thresholdSettings } = useQuery<any[]>({
    queryKey: ["/api/settings/thresholds"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });



  // Reset mandant selections when object changes
  useEffect(() => {
    if (selectedObject && mandants) {
      // Reset mandant selections to match current object assignments
      const objanlage = selectedObject.objanlage || {};
      
      // Find mandant IDs by name for backward compatibility
      const verwalterMandant = (mandants as any[])?.find((m: any) => 
        m.name === objanlage.Verwalter
      );
      const handwerkerMandant = (mandants as any[])?.find((m: any) => 
        m.name === objanlage.Handwerker
      );
      const betreuerMandant = (mandants as any[])?.find((m: any) => 
        m.name === objanlage.Betreuer
      );
      const besitzerMandant = (mandants as any[])?.find((m: any) => 
        m.name === objanlage.Besitzer
      );
      
      setSelectedVerwalterMandant(verwalterMandant?.id || null);
      setSelectedHandwerkerMandant(handwerkerMandant?.id || null);
      setSelectedBetreuerMandant(betreuerMandant?.id || null);
      setSelectedBesitzerMandant(besitzerMandant?.id || null);
    } else {
      // Reset all selections when no object selected
      setSelectedVerwalterMandant(null);
      setSelectedHandwerkerMandant(null);
      setSelectedBetreuerMandant(null);
      setSelectedBesitzerMandant(null);
    }
  }, [selectedObject, mandants]);

  // Auto-select object based on URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const objectIdFromUrl = urlParams.get('objectId');
    
    if (objectIdFromUrl && objects && !selectedObject) {
      // Find object by objectid
      const foundObject = (objects as any[])?.find((obj: any) => 
        obj.objectid.toString() === objectIdFromUrl
      );
      
      if (foundObject) {
        setSelectedObject(foundObject);
      }
    }
  }, [objects, selectedObject]);

  // Update object meter data mutation
  const updateObjectMeterMutation = useMutation({
    mutationFn: async ({ objectId, meterData, fieldName }: { objectId: number; meterData: any; fieldName?: string }) => {
      const updateField = fieldName || 'meter';
      const response = await fetch(`/api/objects/${objectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [updateField]: meterData }),
      });
      if (!response.ok) throw new Error(`Failed to update ${updateField}`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      
      // Update selectedObject immediately with fresh data from server
      if (data && selectedObject && data.id === selectedObject.id) {
        setSelectedObject(data);
      }
      
      const fieldDisplayName = variables.fieldName === 'meter' ? 'Meter-Daten' : 
                                variables.fieldName === 'objanlage' ? 'Anlagenzuordnung' : 
                                variables.fieldName === 'objdata' ? 'Objektdaten' :
                                variables.fieldName === 'portdata' ? 'Portdata' :
                                variables.fieldName === 'report' ? 'Report-Daten' : 'Daten';
      // Kein Toast für Anlagenzuordnung (wird manuell im Button gezeigt)
      if (fieldDisplayName !== 'Anlagenzuordnung') {
        toast({
          title: "Erfolgreich",
          description: `${fieldDisplayName} wurden aktualisiert.`,
        });
      }
    },
    onError: (error: any, variables) => {
      console.error('Update error:', error);
      const fieldDisplayName = variables.fieldName === 'meter' ? 'Meter-Daten' : 
                                variables.fieldName === 'objanlage' ? 'Anlagenzuordnung' : 
                                variables.fieldName === 'objdata' ? 'Objektdaten' :
                                variables.fieldName === 'portdata' ? 'Portdata' :
                                variables.fieldName === 'report' ? 'Report-Daten' : 'Daten';
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie haben keine Berechtigung für diese Aktion.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler beim Speichern",
          description: `${fieldDisplayName} konnten nicht gespeichert werden. Prüfen Sie das JSON-Format.`,
          variant: "destructive",
        });
      }
    },
  });

  // Update portdata mutation
  const updatePortdataMutation = useMutation({
    mutationFn: async ({ objectId, portdataData, fieldName }: { objectId: number; portdataData: any; fieldName?: string }) => {
      const updateField = fieldName || 'portdata';
      const response = await fetch(`/api/objects/${objectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [updateField]: portdataData }),
      });
      if (!response.ok) throw new Error(`Failed to update ${updateField}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      setEditingPortdata('');
      toast({
        title: "Erfolgreich",
        description: "JSON-Daten wurden aktualisiert.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie haben keine Berechtigung für diese Aktion.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: "JSON-Daten konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    },
  });


  // Object form
  const objectForm = useForm<z.infer<typeof objectFormSchema>>({
    resolver: zodResolver(objectFormSchema),
    defaultValues: {
      objectid: undefined,
      name: "",
      objectType: "building",
      status: "active",
      description: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
      mandantId: undefined,
    },
  });


  const objdataForm = useForm<z.infer<typeof objdataFormSchema>>({
    resolver: zodResolver(objdataFormSchema),
    defaultValues: {
      NE: undefined,
      GEG: undefined,
      area: undefined,
    },
  });

  const objectInfoForm = useForm<z.infer<typeof objectInfoFormSchema>>({
    resolver: zodResolver(objectInfoFormSchema),
    defaultValues: {
      name: "",
      city: "",
      postalCode: "",
      address: "",
      nutzflaeche: undefined,
      nutzeinheiten: undefined,
    },
  });

  // Create object mutation
  const createObjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof objectFormSchema>) => {
      return await apiRequest("POST", "/api/objects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      setObjectDialogOpen(false);
      objectForm.reset();
      toast({
        title: "Erfolg",
        description: "Objekt erfolgreich erstellt",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Objekt konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });




  // Objekt-Mandanten-Zuordnung Mutation (ohne automatischen Toast)
  const saveObjectMandantMutation = useMutation({
    mutationFn: async (data: { objectId: number; verwalter?: number; handwerker?: number; betreuer?: number; besitzer?: number }) => {
      return await apiRequest("POST", "/api/object-mandant", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      // Kein Toast hier - wird manuell im Button-Handler gezeigt
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Objekt-Mandanten-Zuordnung konnte nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  // Use gemeinsame ObjectFilterAPI with dynamic object groups
  const filterOptions = createFilterOptions(objects, objectGroups as ObjectGroup[]);
  const typOptions = filterOptions?.objectGroups?.map(g => g.name) || []; // Use dynamic object groups instead of hardcoded types
  const handwerkerOptions = filterOptions?.handwerker || [];

  // Filter objects using gemeinsame API
  const filteredObjects = filterObjects(objects, searchTerm, {
    typ: filterTyp,
    handwerker: filterHandwerker
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive" className="bg-error text-white">Kritisch</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-warning text-black">Warnung</Badge>;
      case "failure":
        return <Badge variant="destructive" className="bg-error text-white">Ausfall</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };





  const onObjectSubmit = (data: z.infer<typeof objectFormSchema>) => {
    if (editingObject) {
      toast({
        title: "Information",
        description: "Objekt-Bearbeitung noch nicht implementiert",
        variant: "default",
      });
    } else {
      createObjectMutation.mutate(data);
    }
  };





  const onObjdataSubmit = (data: z.infer<typeof objdataFormSchema>) => {
    if (!selectedObject) return;
    
    updateObjectMeterMutation.mutate({
      objectId: selectedObject.id,
      meterData: data,
      fieldName: 'objdata'
    });
    setObjdataDialogOpen(false);
  };

  const updateObjectMutation = useMutation({
    mutationFn: async ({ objectId, data }: { objectId: number; data: any }) => {
      const response = await fetch(`/api/objects/${objectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update object');
      return response.json();
    },
    onSuccess: (updatedObject) => {
      // Invalidate all relevant queries to refresh the page
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objects/by-objectid"] });

      queryClient.invalidateQueries({ queryKey: ["/api/object-groups"] });
      
      // Sofortige Aktualisierung der Anzeige
      setSelectedObject(updatedObject);
      toast({
        title: "Erfolgreich",
        description: "Objekt-Informationen wurden aktualisiert.",
      });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie haben keine Berechtigung für diese Aktion.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler beim Speichern",
          description: "Objekt-Informationen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    },
  });

  const onObjectInfoSubmit = (data: z.infer<typeof objectInfoFormSchema>) => {
    if (!selectedObject) return;
    
    // Aktuelles objdata beibehalten und alle Felder aktualisieren
    const currentObjdata = selectedObject.objdata || {};
    const updatedObjdata = {
      ...currentObjdata,
      area: data.nutzflaeche,
      NE: data.nutzeinheiten,
      GEG: data.geg,
      street: data.address
    };
    
    updateObjectMutation.mutate({
      objectId: selectedObject.id,
      data: {
        name: data.name,
        city: data.city,
        postalCode: data.postalCode,
        address: data.address,
        objdata: updatedObjdata,
      }
    });
    setObjectInfoDialogOpen(false);
  };

  if (objectsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-20 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-20 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-20 rounded mb-4"></div>
              <div className="h-32 bg-gray-20 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Facilities */}
        <Card className="flex flex-col w-[30%] max-w-[400px] min-w-[300px] border-0 bg-transparent shadow-none">
          <CardHeader className="pt-[12px] pb-[12px] px-[10px] pl-[14px] pr-[14px]">
            <div className="flex items-center justify-between">
              <CardTitle className="font-semibold tracking-tight flex items-center space-x-2 text-[18px] text-[#1e40af]">
                <Info className="h-5 w-5 text-[#1e40af]" />
                <span>Portfolio Objekte</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Dialog open={objectDialogOpen} onOpenChange={setObjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setEditingObject(null);
                        objectForm.reset();
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Objekt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingObject ? "Objekt bearbeiten" : "Neues Objekt erstellen"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...objectForm}>
                      <form onSubmit={objectForm.handleSubmit(onObjectSubmit)} className="space-y-4">
                        <FormField
                          control={objectForm.control}
                          name="objectid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objekt-ID (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Wird automatisch generiert" 
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="Objektname" {...field} value={field.value as string} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stadt*</FormLabel>
                              <FormControl>
                                <Input placeholder="Stadt" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PLZ</FormLabel>
                              <FormControl>
                                <Input placeholder="Postleitzahl" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beschreibung</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Zusätzliche Informationen" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={objectForm.control}
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
                                  {Array.isArray(mandants) ? mandants.map((mandant: any) => (
                                    <SelectItem key={mandant.id} value={mandant.id.toString()}>
                                      {mandant.name}
                                    </SelectItem>
                                  )) : null}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setObjectDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button type="submit" disabled={createObjectMutation.isPending}>
                            {createObjectMutation.isPending ? "Erstelle..." : editingObject ? "Aktualisieren" : "Erstellen"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-1 flex-1 flex flex-col min-h-0 ml-[0px] mr-[0px] pl-[5px] pr-[5px]">
            <div className="flex-shrink-0 space-y-3 bg-gray-50 px-4 py-2 pl-[10px] pr-[10px]">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Objekte suchen..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Typ</label>
                  <Select value={filterTyp} onValueChange={setFilterTyp}>
                    <SelectTrigger className="w-full h-7 text-xs border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="Alle Typen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Alle Typen</SelectItem>
                      {typOptions.map((typ) => (
                        <SelectItem key={typ} value={typ}>{typ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Handwerker</label>
                  <Select value={filterHandwerker} onValueChange={setFilterHandwerker}>
                    <SelectTrigger className="w-full h-7 text-xs border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="Alle Handwerker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Alle Handwerker</SelectItem>
                      {handwerkerOptions.map((handwerker) => (
                        <SelectItem key={handwerker} value={handwerker}>{handwerker}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              

            </div>
            {/* Objects Table */}
            <div className="flex-1 flex flex-col min-h-0">
              {filteredObjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine Objekte gefunden</p>
                  <p className="text-sm mt-1">Keine Daten in der Datenbank</p>
                </div>
              ) : (
                <div className="h-full flex flex-col bg-transparent">
                  {/* Fixed Table Header */}
                  <div className="flex-shrink-0 bg-blue-50">
                    <div className="flex px-6 py-3 pt-[5px] pb-[5px] pl-[10px] pr-[10px]">
                      <div className="w-[60%] text-left font-semibold text-blue-900 text-sm">Objekt</div>
                      <div className="w-[40%] text-left font-semibold text-blue-900 text-sm">Stadt</div>
                    </div>
                  </div>
                  
                  {/* Scrollable Table Body */}
                  <div className="flex-1 overflow-y-auto">
                    <div>
                      {filteredObjects.map((object: any, index: number) => (
                        <div 
                          key={object.id} 
                          className={`flex py-4 cursor-pointer transition-colors pt-[5px] pb-[5px] relative px-6 border-b-[0.5px] border-b-gray-300 pl-[10px] pr-[10px] ${
                            selectedObject?.id === object.id
                              ? "bg-blue-100"
                              : ""
                          }`}
                          style={{
                            backgroundColor: selectedObject?.id === object.id 
                              ? '' 
                              : index % 2 === 0 
                                ? 'rgba(255, 255, 255, 0.65)' 
                                : 'rgba(255, 255, 255, 0.8)'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedObject?.id !== object.id) {
                              e.currentTarget.style.backgroundColor = 'rgb(147 197 253)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedObject?.id !== object.id) {
                              e.currentTarget.style.backgroundColor = index % 2 === 0 
                                ? 'rgba(255, 255, 255, 0.65)' 
                                : 'rgba(255, 255, 255, 0.8)';
                            }
                          }}
                          onClick={() => setSelectedObject(object)}
                        >

                          <div className="w-[60%]">
                            <div className="font-medium text-gray-900 mb-1 text-[14px]">
                              {object.name}
                            </div>
                            <div className="text-gray-500 font-mono text-[12px]">
                              {object.objectid}
                            </div>
                          </div>
                          <div className="w-[40%]">
                            <div className="text-gray-900 text-[14px]">
                              {object.city || ""}
                            </div>
                            <div className="text-gray-500 text-[12px]">
                              {object.postalCode || ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>


          </CardContent>
        </Card>

        {/* Right Panel - Heating Systems */}
        <Card className="flex flex-col flex-1 mt-[10px] mb-[10px] ml-[10px] mr-[10px]">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between mb-4">
              {selectedObject && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedObject.name}</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Objekt-ID: {selectedObject.objectid}</span>
                      <span>/</span>
                      <span>Status: {getStatusBadge(selectedObject.status)}</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Button */}
                  <Button 
                    variant="outline" 
                    size="default"
                    className="flex items-center justify-center w-10 h-10 p-0"
                    onClick={() => navigate(`/grafana-dashboards?objectID=${selectedObject.objectid}&typ=waechter&from=object-management`)}
                    title="Dashboard"
                  >
                    <PresentationChartLineIcon className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Tabs - only show when object is selected */}
            {selectedObject && (
              <div className="flex space-x-0 border-b">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    activeTab === 'home'
                      ? 'border-blue-500 text-blue-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  <span>Objektinfo</span>
                </button>
                {/* Konfiguration Tab - nur für Admin */}
                {(user as any)?.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('konfiguration')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                      activeTab === 'konfiguration'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Konfiguration</span>
                  </button>
                )}
                {/* Setup Tab - nur für Admin */}
                {(user as any)?.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('setup')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                      activeTab === 'setup'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Setup</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('zuordnung')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    activeTab === 'zuordnung'
                      ? 'border-blue-500 text-blue-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Zuordnung</span>
                </button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6 overflow-y-auto flex-1">
            {selectedObject ? (
              <>
                {/* Home Tab Content - Zentrale Objektinfo Komponente */}
                {activeTab === 'home' && (
                  <ObjektinfoContent 
                    selectedObject={selectedObject}
                    user={user}
                    showEditButton={true}
                    onEdit={() => {
                      // Pre-fill form with existing data
                      objectInfoForm.reset({
                        name: selectedObject.name || '',
                        city: selectedObject.city || '',
                        postalCode: selectedObject.postalCode || '',
                        address: selectedObject.objdata?.street || '',
                        nutzflaeche: selectedObject.objdata?.area || undefined,
                        nutzeinheiten: selectedObject.objdata?.NE || undefined,
                        geg: selectedObject.objdata?.GEG || undefined,
                      });
                      setObjectInfoDialogOpen(true);
                    }}
                  />
                )}

                {/* Konfiguration Tab Content - nur für Admin */}
                {activeTab === 'konfiguration' && (user as any)?.role === 'admin' && (
                  <div className="space-y-6">
                    {/* Field Selection Dropdown */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Konfiguration Objekt &gt; Daten</h3>
                        <p className="text-sm text-gray-600">Bearbeiten Sie im JSON-Format</p>
                      </div>
                      <Select 
                        value={selectedKonfigField} 
                        onValueChange={(value: 'meter' | 'objanlage' | 'objdata') => setSelectedKonfigField(value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meter">Zählerdaten</SelectItem>
                          <SelectItem value="objanlage">Anlagenzuordnung</SelectItem>
                          <SelectItem value="objdata">Objektdaten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* JSON Editor for selected field */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-800">
                            {selectedKonfigField === 'meter' ? 'Zählerdaten' : 
                             selectedKonfigField === 'objanlage' ? 'Anlagenzuordnung' : 'Objektdaten'} Bearbeitung
                          </h4>
                          <p className="text-sm text-gray-500">
                            Aktuell wird das Feld <code>objects.{selectedKonfigField}</code> bearbeitet
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {/* Strukturierter Editor für objdata */}
                          {selectedKonfigField === 'objdata' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => {
                                // Pre-fill form with existing data
                                const existingObjdata = selectedObject.objdata || {};
                                objdataForm.reset({
                                  NE: existingObjdata.NE || 1,
                                  GEG: existingObjdata.GEG || undefined,
                                  area: existingObjdata.area || 1,
                                });
                                setObjdataDialogOpen(true);
                              }}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Strukturiert bearbeiten
                            </Button>
                          )}
                          
                          {!isEditingJson ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const fieldData = selectedObject[selectedKonfigField];
                                setEditingJson(fieldData 
                                  ? JSON.stringify(fieldData, null, 2)
                                  : '{}'
                                );
                                setIsEditingJson(true);
                              }}
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              JSON bearbeiten
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setIsEditingJson(false);
                                  setEditingJson('');
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Abbrechen
                              </Button>
                              <Button 
                                size="sm"
                                disabled={updateObjectMeterMutation.isPending}
                                onClick={() => {
                                  try {
                                    const parsedJson = JSON.parse(editingJson);
                                    updateObjectMeterMutation.mutate({
                                      objectId: selectedObject.id,
                                      meterData: parsedJson,
                                      fieldName: selectedKonfigField
                                    });
                                    setIsEditingJson(false);
                                    // Update selected object immediately for UI
                                    setSelectedObject({...selectedObject, [selectedKonfigField]: parsedJson});
                                  } catch (error) {
                                    toast({
                                      title: "Fehler",
                                      description: "Ungültiges JSON Format.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Speichern
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditingJson ? (
                        <Textarea
                          value={editingJson}
                          onChange={(e) => setEditingJson(e.target.value)}
                          placeholder={`JSON ${selectedKonfigField} eingeben...`}
                          className="h-[400px] font-mono text-sm resize-none"
                        />
                      ) : (
                        <div className="bg-gray-50 border rounded-lg p-4 h-[400px] overflow-y-auto">
                          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                            {selectedObject[selectedKonfigField] 
                              ? JSON.stringify(selectedObject[selectedKonfigField], null, 2)
                              : '{}'
                            }
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* JSON Field Help */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">JSON Bearbeitungs-Tipps:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Verwenden Sie gültiges JSON-Format mit Anführungszeichen</li>
                        <li>• Meter: Zählerkonfigurationen und Messgeräte-Daten</li>
                        <li>• Objanlage: Anlagentechnische Parameter und Einstellungen</li>
                        <li>• Objdata: Allgemeine Objektdaten und Metainformationen</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Setup Tab Content - nur für Admin */}
                {activeTab === 'setup' && (user as any)?.role === 'admin' && (
                  <div className="space-y-6">
                    {/* Field Selection Dropdown */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Portdata Konfiguration</h3>
                        <p className="text-sm text-gray-600">Bearbeiten Sie die Portdata-Felder im JSON-Format</p>
                      </div>
                      <Select 
                        value={selectedSetupField} 
                        onValueChange={(value: 'portdata' | 'report') => setSelectedSetupField(value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portdata">objects.portdata</SelectItem>
                          <SelectItem value="report">objects.report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* JSON Editor for selected field */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-800">
                            {selectedSetupField === 'portdata' ? 'Portdata' : 'Report'} Bearbeitung
                          </h4>
                          <p className="text-sm text-gray-500">
                            Aktuell wird das Feld <code>objects.{selectedSetupField}</code> bearbeitet
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {editingPortdata === '' ? (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const fieldData = selectedObject[selectedSetupField];
                                setEditingPortdata(fieldData 
                                  ? JSON.stringify(fieldData, null, 2)
                                  : (selectedSetupField === 'portdata' ? '[]' : '{}')
                                );
                              }}
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              Bearbeiten
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingPortdata('');
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Abbrechen
                              </Button>
                              <Button 
                                size="sm"
                                disabled={updatePortdataMutation.isPending}
                                onClick={() => {
                                  try {
                                    const parsedJson = JSON.parse(editingPortdata);
                                    updatePortdataMutation.mutate({
                                      objectId: selectedObject.id,
                                      portdataData: parsedJson,
                                      fieldName: selectedSetupField
                                    });
                                    // Update selected object immediately for UI
                                    setSelectedObject({...selectedObject, [selectedSetupField]: parsedJson});
                                  } catch (error) {
                                    toast({
                                      title: "Fehler",
                                      description: "Ungültiges JSON Format.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Speichern
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingPortdata !== '' ? (
                        <Textarea
                          value={editingPortdata}
                          onChange={(e) => setEditingPortdata(e.target.value)}
                          placeholder={`JSON ${selectedSetupField} eingeben...`}
                          className="h-[400px] font-mono text-sm resize-none"
                        />
                      ) : (
                        <div className="bg-gray-50 border rounded-lg p-4 h-[400px] overflow-y-auto">
                          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                            {selectedObject[selectedSetupField] 
                              ? JSON.stringify(selectedObject[selectedSetupField], null, 2)
                              : (selectedSetupField === 'portdata' ? '[]' : '{}')
                            }
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* JSON Field Help */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">JSON Bearbeitungs-Tipps:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Verwenden Sie gültiges JSON-Format mit Anführungszeichen</li>
                        <li>• Portdata: Array-Format [ ] für Dashboard-Konfigurationen</li>
                        <li>• Report: Objekt-Format {'{'} {'}'} für Berichtskonfigurationen</li>
                        <li>• Automatische Formatvalidierung beim Speichern</li>
                      </ul>
                      
                      <h4 className="text-sm font-medium text-blue-900 mb-2 mt-4">Portdata Struktur-Beispiel:</h4>
                      <pre className="text-xs text-blue-800 font-mono bg-white border rounded p-3 overflow-x-auto">
{`[
  {
    "sitelabel": "Diagramm",
    "site": [
      {
        "id": "waermezaehler-objekt",
        "label": "Wärmezähler Objekt",
        "panelId": "16",
        "panelId2": "3",
        "panelIdWidth": "180px",
        "height": "400px",
        "histogramHeight": "250px",
        "histogram": [4, 5, 7],
        "auswahl": [
          {
            "id": "Z20141",
            "idlabel": "Wärmezentrale 1"
          }
        ]
      }
    ]
  }
]`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Zuordnung Tab Content */}
                {activeTab === 'zuordnung' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Objekt Zuordnung</h3>
                        <p className="text-sm text-gray-600">Zuordnung von Typ, Handwerker, Verwalter und Betreuer</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Typ */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Typ</Label>
                        <Select 
                          value={selectedObject.objanlage?.Typ || ""} 
                          onValueChange={(value) => {
                            const currentObjanlage = selectedObject.objanlage || {};
                            const updatedObjanlage = { ...currentObjanlage, Typ: value };
                            updateObjectMeterMutation.mutate({
                              objectId: selectedObject.id,
                              meterData: updatedObjanlage,
                              fieldName: 'objanlage'
                            });
                            setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Objektgruppe auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {(objectGroups as any[] || []).map((group: any) => (
                              <SelectItem key={group.id} value={group.name}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* TemperaturGrenzwert */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">TemperaturGrenzwert</Label>
                        <Select 
                          value={selectedObject.objanlage?.thresholds || "none"}
                          key={`threshold-${selectedObject.id}-${selectedObject.objanlage?.thresholds}`} 
                          onValueChange={(value) => {
                            const currentObjanlage = selectedObject.objanlage || {};
                            const actualValue = value === "none" ? undefined : value;
                            const updatedObjanlage = { ...currentObjanlage, thresholds: actualValue };
                            updateObjectMeterMutation.mutate({
                              objectId: selectedObject.id,
                              meterData: updatedObjanlage,
                              fieldName: 'objanlage'
                            });
                            setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Grenzwert auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Kein Vorgabe - Global aktiv</SelectItem>
                            {(thresholdSettings as any[] || []).map((setting: any) => (
                              <SelectItem key={setting.key_name} value={setting.key_name}>
                                {setting.key_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Verwalter - Mandanten-Zuordnung */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Verwalter</Label>
                        <Select 
                          value={selectedVerwalterMandant?.toString() || ""} 
                          onValueChange={(value) => {
                            setSelectedVerwalterMandant(value && value !== 'none' ? parseInt(value) : null);
                            // Nur lokale State-Änderung, Speichern erfolgt über Button
                            const mandantName = (value && value !== 'none') ? (mandants as any[] || []).find((m: any) => m.id === parseInt(value))?.name || "" : "";
                            const currentObjanlage = selectedObject.objanlage || {};
                            const updatedObjanlage = { ...currentObjanlage, Verwalter: mandantName };
                            setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Verwalter auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              kein Eintrag
                            </SelectItem>
                            {(mandants as any[] || []).filter((mandants: any) => 
                              ['wohnungsgesellschaft', 'verwalter', 'besitzer', 'betreiber'].includes(mandants.category?.toLowerCase())
                            ).map((mandants: any) => (
                              <SelectItem key={mandants.id} value={mandants.id.toString()}>
                                {mandants.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Handwerker - Mandanten-Zuordnung */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Handwerker</Label>
                        <Select 
                          value={selectedHandwerkerMandant?.toString() || ""} 
                          onValueChange={(value) => {
                            setSelectedHandwerkerMandant(value && value !== 'none' ? parseInt(value) : null);
                            // Nur lokale State-Änderung, Speichern erfolgt über Button
                            const mandantName = (value && value !== 'none') ? (mandants as any[] || []).find((m: any) => m.id === parseInt(value))?.name || "" : "";
                            const currentObjanlage = selectedObject.objanlage || {};
                            const updatedObjanlage = { ...currentObjanlage, Handwerker: mandantName };
                            setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Handwerker auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              kein Eintrag
                            </SelectItem>
                            {(mandants as any[] || []).filter((mandants: any) => 
                              ['handwerker'].includes(mandants.category?.toLowerCase())
                            ).map((mandants: any) => (
                              <SelectItem key={mandants.id} value={mandants.id.toString()}>
                                {mandants.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Betreuer - Mandanten-Zuordnung */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Betreuer</Label>
                        <Select 
                          value={selectedBetreuerMandant?.toString() || ""} 
                          onValueChange={(value) => {
                            setSelectedBetreuerMandant(value && value !== 'none' ? parseInt(value) : null);
                            // Nur lokale State-Änderung, Speichern erfolgt über Button
                            const mandantName = (value && value !== 'none') ? (mandants as any[] || []).find((m: any) => m.id === parseInt(value))?.name || "" : "";
                            const currentObjanlage = selectedObject.objanlage || {};
                            const updatedObjanlage = { ...currentObjanlage, Betreuer: mandantName };
                            setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Betreuer auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              kein Eintrag
                            </SelectItem>
                            {(mandants as any[] || []).filter((mandants: any) => 
                              ['betreuer'].includes(mandants.category?.toLowerCase())
                            ).map((mandants: any) => (
                              <SelectItem key={mandants.id} value={mandants.id.toString()}>
                                {mandants.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Besitzer / Mandant - Mandanten-Zuordnung */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Besitzer / Mandant</Label>
                        {(user as any)?.role === 'admin' ? (
                          <Select 
                            value={selectedBesitzerMandant?.toString() || ""} 
                            onValueChange={(value) => {
                              setSelectedBesitzerMandant(value && value !== 'none' ? parseInt(value) : null);
                              // Nur lokale State-Änderung, Speichern erfolgt über Button
                              const mandantName = (value && value !== 'none') ? (mandants as any[] || []).find((m: any) => m.id === parseInt(value))?.name || "" : "";
                              const currentObjanlage = selectedObject.objanlage || {};
                              const updatedObjanlage = { ...currentObjanlage, Besitzer: mandantName };
                              setSelectedObject({...selectedObject, objanlage: updatedObjanlage});
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Besitzer / Mandant auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                kein Eintrag
                              </SelectItem>
                              {(mandants as any[] || []).filter((mandants: any) => 
                                ['wohnungsgesellschaft'].includes(mandants.category?.toLowerCase())
                              ).map((mandants: any) => (
                                <SelectItem key={mandants.id} value={mandants.id.toString()}>
                                  {mandants.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                            {selectedBesitzerMandant 
                              ? (mandants as any[] || []).find((m: any) => m.id === selectedBesitzerMandant)?.name || "Unbekannt"
                              : "Nicht zugeordnet"
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Speichern Button für Mandanten-Zuordnung */}
                    <div className="flex justify-end border-t pt-4">
                      <Button 
                        onClick={() => {
                          // Automatische Erkennung aus objanlage JSON-Daten
                          const objanlage = selectedObject?.objanlage as any || {};
                          
                          // Finde Mandanten basierend auf objanlage Namen
                          const verwalterMandant = (mandants as any[])?.find((m: any) => 
                            m.name === objanlage.Verwalter && ['verwalter', 'wohnungsgesellschaft'].includes(m.category?.toLowerCase())
                          );
                          const handwerkerMandant = (mandants as any[])?.find((m: any) => 
                            m.name === objanlage.Handwerker && m.category?.toLowerCase() === 'handwerker'
                          );
                          const betreuerMandant = (mandants as any[])?.find((m: any) => 
                            m.name === objanlage.Betreuer // Any mandant can act as Betreuer
                          );
                          const besitzerMandant = (mandants as any[])?.find((m: any) => 
                            m.name === objanlage.Besitzer // Any mandant can act as Besitzer
                          );

                          const mutationData: any = {
                            objectId: selectedObject.id,
                            // Verwende zuerst manuelle Auswahl, dann automatische Erkennung
                            verwalter: selectedVerwalterMandant || verwalterMandant?.id || undefined,
                            handwerker: selectedHandwerkerMandant || handwerkerMandant?.id || undefined,
                            betreuer: selectedBetreuerMandant || betreuerMandant?.id || undefined
                          };
                          
                          // Besitzer immer speichern - Backend prüft Berechtigung
                          mutationData.besitzer = selectedBesitzerMandant || besitzerMandant?.id || undefined;
                          
                          // Speichere sowohl object_mandant Zuordnungen als auch objanlage JSON
                          Promise.all([
                            // 1. Speichere object_mandant Zuordnungen
                            saveObjectMandantMutation.mutateAsync(mutationData),
                            // 2. Speichere aktualisierte objanlage
                            updateObjectMeterMutation.mutateAsync({
                              objectId: selectedObject.id,
                              meterData: selectedObject.objanlage,
                              fieldName: 'objanlage'
                            })
                          ]).then(() => {
                            toast({
                              title: "Erfolgreich",
                              description: "Mandanten-Zuordnung wurde gespeichert.",
                            });
                          }).catch((error) => {
                            console.error('Fehler beim Speichern:', error);
                            toast({
                              title: "Fehler",
                              description: "Fehler beim Speichern der Mandanten-Zuordnung.",
                              variant: "destructive",
                            });
                          });
                        }}
                        disabled={saveObjectMandantMutation.isPending || updateObjectMeterMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Mandanten-Zuordnung speichern
                      </Button>
                    </div>

                    {/* Current Values Display */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Aktuelle Zuordnungen</h4>
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                          {selectedObject.objanlage 
                            ? JSON.stringify(selectedObject.objanlage, null, 2)
                            : '{}'
                          }
                        </pre>
                      </div>
                    </div>

                    {/* Zuordnungs-Informationen im Zuordnung Tab */}
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Zuordnungs-Informationen:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• <strong>Typ:</strong> Auswahl aus Objektgruppen mit Typ "Anlagentyp"</li>
                          <li>• <strong>Verwalter:</strong> Auswahl aus Mandanten mit Kategorie "Verwalter"</li>
                          <li>• <strong>Handwerker:</strong> Auswahl aus Mandanten mit Kategorie "Handwerker"</li>
                          <li>• <strong>Betreuer:</strong> Auswahl aus Mandanten mit Kategorie "Betreuer"</li>
                        </ul>
                      </div>
                    </div>


                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Wählen Sie ein Objekt aus der Liste</p>
                <p className="text-sm mt-1">um Details anzuzeigen</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Objektdaten Modal für strukturierte Bearbeitung */}
        <Dialog open={objdataDialogOpen} onOpenChange={setObjdataDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Objektdaten bearbeiten</DialogTitle>
              <p className="text-sm text-gray-600">
                Strukturierte Bearbeitung der JSONB-Objektdaten
              </p>
            </DialogHeader>
            <Form {...objdataForm}>
              <form onSubmit={objdataForm.handleSubmit(onObjdataSubmit)} className="space-y-4">
                <FormField
                  control={objdataForm.control}
                  name="NE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nutzeinheiten</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Anzahl Nutzungseinheiten" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Anzahl der Nutzungseinheiten im Objekt
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={objdataForm.control}
                  name="GEG"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GEG-Wert (kWh/m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="GEG-Wert" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        GEG-Wert für das Objekt
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={objdataForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nutzfläche (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Fläche in Quadratmetern" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Gesamte Nutzungsfläche des Objekts in m²
                      </p>
                    </FormItem>
                  )}
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Hinweise:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• NE: Nutzungseinheit (Wohnungen, Gewerbeflächen, etc.)</li>
                    <li>• GEG: GEG-Wert für das Objekt</li>
                    <li>• Area: Nutzungsfläche für Effizienzberechnungen</li>
                    <li>• Daten werden im objects.objdata JSONB-Feld gespeichert</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setObjdataDialogOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateObjectMeterMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Object Information Edit Dialog */}
        <Dialog open={objectInfoDialogOpen} onOpenChange={setObjectInfoDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Objekt-Informationen bearbeiten</DialogTitle>
            </DialogHeader>
            <Form {...objectInfoForm}>
              <form onSubmit={objectInfoForm.handleSubmit(onObjectInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={objectInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Objektname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={objectInfoForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stadt*</FormLabel>
                        <FormControl>
                          <Input placeholder="Stadt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={objectInfoForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ</FormLabel>
                        <FormControl>
                          <Input placeholder="Postleitzahl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={objectInfoForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straße</FormLabel>
                        <FormControl>
                          <Input placeholder="Straße und Hausnummer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={objectInfoForm.control}
                    name="nutzflaeche"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nutzfläche (m²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="" 
                            {...field}

                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={objectInfoForm.control}
                    name="nutzeinheiten"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nutzeinheiten</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="" 
                            {...field}

                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={objectInfoForm.control}
                    name="geg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GEG-Wert (kWh/m²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="" 
                            {...field}

                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setObjectInfoDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={updateObjectMutation.isPending}>
                    {updateObjectMutation.isPending ? "Speichern..." : "Speichern"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
