import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Plus, Filter, FileText, CheckCircle, AlertCircle, Clock, Wrench, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LogbookEntry {
  id: number;
  objectId: string;
  entryType: string;
  category: string;
  priority: string;
  title: string;
  description?: string;
  status: string;
  technicianName?: string;
  technicianCompany?: string;
  scheduledDate?: string;
  totalCost?: number;
  objectName?: string;
  createdAt: string;
}

interface TodoTask {
  id: number;
  objectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  assignedTo?: string;
  status: string;
  objectName?: string;
}


export default function Logbook() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("entries");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);

  // Fetch objects for dropdown
  const { data: objects } = useQuery({
    queryKey: ["/api/objects"],
  });

  // Fetch logbook entries
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/logbook/entries"],
  });

  // Fetch todo tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/logbook/tasks"],
  });


  // Create logbook entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/logbook/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook/entries"] });
      setIsEntryDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Logbucheintrag wurde erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Logbucheintrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Create todo task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/logbook/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook/tasks"] });
      setIsTaskDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update todo task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: number; updates: any }) => 
      apiRequest("PUT", `/api/logbook/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook/tasks"] });
      setIsEditTaskDialogOpen(false);
      setEditingTask(null);
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete todo task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/logbook/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logbook/tasks"] });
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "erledigt":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Erledigt</Badge>;
      case "in_bearbeitung":
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />In Bearbeitung</Badge>;
      case "verschoben":
        return <Badge className="bg-orange-500 text-white">Verschoben</Badge>;
      default:
        return <Badge variant="outline">Offen</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "kritisch":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kritisch</Badge>;
      case "hoch":
        return <Badge className="bg-orange-500 text-white">Hoch</Badge>;
      case "mittel":
        return <Badge className="bg-yellow-500 text-black">Mittel</Badge>;
      default:
        return <Badge variant="outline">Niedrig</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "wartung":
        return <Badge className="bg-blue-500 text-white"><Wrench className="h-3 w-3 mr-1" />Wartung</Badge>;
      case "störung":
        return <Badge variant="destructive">Störung</Badge>;
      case "umbau":
        return <Badge className="bg-purple-500 text-white">Umbau</Badge>;
      case "inspektion":
        return <Badge className="bg-gray-500 text-white">Inspektion</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredEntries = (entries as LogbookEntry[] || []).filter((entry: LogbookEntry) => {
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    const matchesPriority = filterPriority === "all" || entry.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const filteredTasks = (tasks as TodoTask[] || []).filter((task: TodoTask) => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });


  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
                <SelectItem value="verschoben">Verschoben</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="niedrig">Niedrig</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="kritisch">Kritisch</SelectItem>
              </SelectContent>
            </Select>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Eintrag
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Neuer Logbucheintrag</DialogTitle>
                    <DialogDescription>
                      Dokumentieren Sie Wartungen, Störungen oder andere Arbeiten
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    console.log('🔍 [LOGBOOK] Form data before submission:', {
                      objectId: BigInt(formData.get("objectId") as string),
                      entryType: formData.get("entryType"),
                      category: formData.get("category"),
                      priority: formData.get("priority"),
                      title: formData.get("title"),
                      description: formData.get("description"),
                      technicianName: formData.get("technicianName"),
                      technicianCompany: formData.get("technicianCompany"),
                      scheduledDate: selectedDate?.toISOString().split('T')[0],
                      status: "offen",
                    });
                    
                    createEntryMutation.mutate({
                      objectId: BigInt(formData.get("objectId") as string),
                      entryType: formData.get("entryType"),
                      category: formData.get("category"),
                      priority: formData.get("priority"),
                      title: formData.get("title"),
                      description: formData.get("description"),
                      technicianName: formData.get("technicianName"),
                      technicianCompany: formData.get("technicianCompany"),
                      scheduledDate: selectedDate?.toISOString().split('T')[0],
                      status: "offen",
                    });
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="objectId">Objekt</Label>
                        <Select name="objectId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Objekt wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {(objects as any[] || [])?.map((obj: any) => (
                              <SelectItem key={obj.id} value={obj.objectid.toString()}>
                                {obj.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entryType">Typ</Label>
                        <Select name="entryType" defaultValue="wartung">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wartung">Wartung</SelectItem>
                            <SelectItem value="störung">Störung</SelectItem>
                            <SelectItem value="umbau">Umbau</SelectItem>
                            <SelectItem value="inspektion">Inspektion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Kategorie</Label>
                        <Select name="category" defaultValue="heizung">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="heizung">Heizung</SelectItem>
                            <SelectItem value="sanitär">Sanitär</SelectItem>
                            <SelectItem value="elektro">Elektro</SelectItem>
                            <SelectItem value="sonstiges">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priorität</Label>
                        <Select name="priority" defaultValue="mittel">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="niedrig">Niedrig</SelectItem>
                            <SelectItem value="mittel">Mittel</SelectItem>
                            <SelectItem value="hoch">Hoch</SelectItem>
                            <SelectItem value="kritisch">Kritisch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">Titel</Label>
                      <Input name="title" required placeholder="z.B. Jährliche Wartung Heizkessel" />
                    </div>

                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea name="description" rows={3} placeholder="Detaillierte Beschreibung der Arbeiten..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="technicianName">Techniker</Label>
                        <Input name="technicianName" placeholder="Name des Technikers" />
                      </div>
                      <div>
                        <Label htmlFor="technicianCompany">Firma</Label>
                        <Input name="technicianCompany" placeholder="Firma des Technikers" />
                      </div>
                    </div>

                    <div>
                      <Label>Geplantes Datum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: de }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEntryDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={createEntryMutation.isPending}>
                        Erstellen
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Aufgabe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Aufgabe</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie eine neue Aufgabe für Handwerker
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createTaskMutation.mutate({
                      objectId: BigInt(formData.get("objectId") as string),
                      title: formData.get("title"),
                      description: formData.get("description"),
                      priority: formData.get("priority"),
                      assignedTo: formData.get("assignedTo"),
                      dueDate: formData.get("dueDate"),
                      status: "offen",
                    });
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="objectId">Objekt</Label>
                      <Select name="objectId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Objekt wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {(objects as any[] || [])?.map((obj: any) => (
                            <SelectItem key={obj.id} value={obj.id.toString()}>
                              {obj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="title">Aufgabe</Label>
                      <Input name="title" required placeholder="z.B. Filter wechseln" />
                    </div>

                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea name="description" rows={3} placeholder="Details zur Aufgabe..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priorität</Label>
                        <Select name="priority" defaultValue="mittel">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="niedrig">Niedrig</SelectItem>
                            <SelectItem value="mittel">Mittel</SelectItem>
                            <SelectItem value="hoch">Hoch</SelectItem>
                            <SelectItem value="kritisch">Kritisch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Fällig bis</Label>
                        <Input name="dueDate" type="date" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="assignedTo">Zugewiesen an</Label>
                      <Input name="assignedTo" placeholder="Name oder Firma" />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending}>
                        Erstellen
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries">
            <FileText className="h-4 w-4 mr-2" />
            Logbucheinträge
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aufgaben
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logbucheinträge</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="text-center py-8">Lade Einträge...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Keine Einträge gefunden
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Objekt</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Priorität</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Techniker</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry: LogbookEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.scheduledDate
                            ? format(new Date(entry.scheduledDate), "dd.MM.yyyy")
                            : format(new Date(entry.createdAt), "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{entry.objectName}</TableCell>
                        <TableCell>{entry.title}</TableCell>
                        <TableCell>{getTypeBadge(entry.entryType)}</TableCell>
                        <TableCell>{getPriorityBadge(entry.priority)}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>{entry.technicianName || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offene Aufgaben</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8">Lade Aufgaben...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Keine Aufgaben gefunden
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fällig</TableHead>
                      <TableHead>Objekt</TableHead>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead>Priorität</TableHead>
                      <TableHead>Zugewiesen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task: TodoTask) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          {task.dueDate
                            ? format(new Date(task.dueDate), "dd.MM.yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{task.objectName}</TableCell>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority || "niedrig")}</TableCell>
                        <TableCell>{task.assignedTo || "-"}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingTask(task);
                                setIsEditTaskDialogOpen(true);
                              }}
                              title="Bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm(`Möchten Sie die Aufgabe "${task.title}" wirklich löschen?`)) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Aufgabe
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (!editingTask) return;
            
            updateTaskMutation.mutate({
              id: editingTask.id,
              updates: {
                objectId: formData.get("objectId") as string, // String senden, Backend konvertiert zu BigInt
                title: formData.get("title"),
                description: formData.get("description"),
                priority: formData.get("priority"),
                assignedTo: formData.get("assignedTo"),
                dueDate: formData.get("dueDate"),
                status: formData.get("status"),
              }
            });
          }} className="space-y-4">
            <div>
              <Label htmlFor="objectId">Objekt</Label>
              <Select name="objectId" defaultValue={editingTask?.objectId?.toString()} required>
                <SelectTrigger>
                  <SelectValue placeholder="Objekt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {(objects as any[] || [])?.map((obj: any) => (
                    <SelectItem key={obj.id} value={obj.objectid.toString()}>
                      {obj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Aufgabe</Label>
              <Input name="title" defaultValue={editingTask?.title} required placeholder="z.B. Filter wechseln" />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea name="description" defaultValue={editingTask?.description} rows={3} placeholder="Details zur Aufgabe..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priorität</Label>
                <Select name="priority" defaultValue={editingTask?.priority || "mittel"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="niedrig">Niedrig</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="kritisch">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingTask?.status || "offen"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                    <SelectItem value="erledigt">Erledigt</SelectItem>
                    <SelectItem value="verschoben">Verschoben</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Fällig bis</Label>
                <Input name="dueDate" type="date" defaultValue={editingTask?.dueDate} />
              </div>
              <div>
                <Label htmlFor="assignedTo">Zugewiesen an</Label>
                <Input name="assignedTo" defaultValue={editingTask?.assignedTo} placeholder="Name oder Firma" />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditTaskDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}