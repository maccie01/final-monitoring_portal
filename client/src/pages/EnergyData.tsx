import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { insertEnergyDataSchema } from "@shared/schema"; // schema removed
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BoltIcon,
  PlusIcon,
  CalendarIcon,
  Search,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react";
import { z } from "zod";

// energyDataFormSchema recreated to match form requirements
const energyDataFormSchema = z.object({
  systemId: z.coerce.number(),
  recordDate: z.string(), // date field that was missing
  energyConsumption: z.coerce.number().optional(),
  renewableShare: z.coerce.number().optional(),
  co2Emissions: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  temperature: z.coerce.number().optional(),
  humidity: z.coerce.number().optional(),
});

export default function EnergyData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch heating systems
  const { data: systems, isLoading: systemsLoading } = useQuery({
    queryKey: ["/api/heating-systems"],
  });

  // Fetch energy data for selected system
  const { data: energyData, isLoading: energyDataLoading } = useQuery({
    queryKey: ["/api/energy-data", selectedSystem?.id, dateRange.start, dateRange.end],
    enabled: !!selectedSystem,
  });

  // Energy data form
  const form = useForm<z.infer<typeof energyDataFormSchema>>({
    resolver: zodResolver(energyDataFormSchema),
    defaultValues: {
      systemId: 0,
      recordDate: new Date().toISOString().split('T')[0],
      energyConsumption: undefined,
      renewableShare: undefined,
      co2Emissions: undefined,
      cost: undefined,
      temperature: undefined,
      humidity: undefined,
    },
  });

  // Create energy data mutation
  const createDataMutation = useMutation({
    mutationFn: async (data: z.infer<typeof energyDataFormSchema>) => {
      return await apiRequest("POST", "/api/energy-data", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/energy-data"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Erfolg",
        description: "Energiedaten erfolgreich gespeichert",
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
        description: "Energiedaten konnten nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  const filteredSystems = Array.isArray(systems) ? systems.filter((system: any) =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.systemId.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const openNewEntry = () => {
    if (!selectedSystem) return;
    form.reset({
      systemId: selectedSystem.id,
      recordDate: new Date().toISOString().split('T')[0],
      energyConsumption: undefined,
      renewableShare: undefined,
      co2Emissions: undefined,
      cost: undefined,
      temperature: undefined,
      humidity: undefined,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof energyDataFormSchema>) => {
    createDataMutation.mutate(data);
  };

  const calculateTrend = (data: any[], field: string) => {
    if (!Array.isArray(data) || data.length < 2) return { trend: 0, isPositive: false };
    
    const sortedData = [...data].sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
    const latest = sortedData[sortedData.length - 1]?.[field] || 0;
    const previous = sortedData[sortedData.length - 2]?.[field] || 0;
    
    if (previous === 0) return { trend: 0, isPositive: false };
    
    const trend = ((latest - previous) / previous) * 100;
    return { trend: Math.abs(trend), isPositive: field === 'renewableShare' ? trend > 0 : trend < 0 };
  };

  if (systemsLoading) {
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
    <div className="p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Panel - System Selection */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BoltIcon className="h-5 w-5 text-primary" />
                <span>Energiedaten</span>
              </CardTitle>
              {selectedSystem && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewEntry}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Daten eingeben
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Energiedaten eingeben</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="recordDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Datum*</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="energyConsumption"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Energieverbrauch (kWh)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001"
                                  placeholder="z.B. 1250.5" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="renewableShare"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Regenerativanteil (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="z.B. 45.5" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="co2Emissions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CO₂-Emissionen (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001"
                                  placeholder="z.B. 125.5" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kosten (EUR)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="z.B. 89.50" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperatur (°C)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="z.B. 21.5" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="humidity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Luftfeuchtigkeit (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="z.B. 65.5" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button type="submit" disabled={createDataMutation.isPending}>
                            Speichern
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                <Input
                  placeholder="Anlagen suchen..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSystems.length > 0 ? (
                filteredSystems.map((system: any) => (
                  <div
                    key={system.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSystem?.id === system.id
                        ? "border-primary bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedSystem(system)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-80">{system.name}</h3>
                        <p className="text-sm text-gray-50">{system.systemId}</p>
                        <p className="text-xs text-gray-50 mt-1 capitalize">
                          {system.type?.replace('_', ' ') || "Unbekannt"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-80">
                          {system.efficiency ? `${system.efficiency}%` : "N/A"}
                        </p>
                        <p className="text-xs text-gray-50">Effizienz</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-50">
                  <BoltIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine Anlagen gefunden</p>
                  <p className="text-sm mt-1">Überprüfen Sie Ihre Suchkriterien</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Energy Data Details */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedSystem ? `Energiedaten - ${selectedSystem.name}` : "Anlage auswählen"}
              </CardTitle>
              {selectedSystem && (
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-32"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSystem ? (
              energyDataLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-20 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : Array.isArray(energyData) && energyData.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-50">Ø Verbrauch</p>
                            <p className="text-lg font-bold text-gray-80">
                              {Array.isArray(energyData) && energyData.length > 0 
                                ? (energyData.reduce((sum: number, item: any) => sum + (item.energyConsumption || 0), 0) / energyData.length).toFixed(1)
                                : 0} kWh
                            </p>
                          </div>
                          <div className="flex items-center">
                            {(() => {
                              const trend = calculateTrend(Array.isArray(energyData) ? energyData : [], 'energyConsumption');
                              return (
                                <>
                                  {trend.isPositive ? (
                                    <TrendingDownIcon className="h-4 w-4 text-success mr-1" />
                                  ) : (
                                    <TrendingUpIcon className="h-4 w-4 text-error mr-1" />
                                  )}
                                  <span className={`text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                                    {trend.trend.toFixed(1)}%
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-50">Ø Regenerativanteil</p>
                            <p className="text-lg font-bold text-gray-80">
                              {Array.isArray(energyData) && energyData.length > 0 
                                ? (energyData.reduce((sum: number, item: any) => sum + (item.renewableShare || 0), 0) / energyData.length).toFixed(1)
                                : 0}%
                            </p>
                          </div>
                          <div className="flex items-center">
                            {(() => {
                              const trend = calculateTrend(Array.isArray(energyData) ? energyData : [], 'renewableShare');
                              return (
                                <>
                                  {trend.isPositive ? (
                                    <TrendingUpIcon className="h-4 w-4 text-success mr-1" />
                                  ) : (
                                    <TrendingDownIcon className="h-4 w-4 text-error mr-1" />
                                  )}
                                  <span className={`text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                                    {trend.trend.toFixed(1)}%
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Verbrauch (kWh)</TableHead>
                          <TableHead>Regenerativ (%)</TableHead>
                          <TableHead>CO₂ (kg)</TableHead>
                          <TableHead>Kosten (EUR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(energyData) ? energyData.slice(0, 10).map((data: any) => (
                          <TableRow key={data.id}>
                            <TableCell>
                              {new Date(data.recordDate).toLocaleDateString('de-DE')}
                            </TableCell>
                            <TableCell>
                              {data.energyConsumption?.toFixed(1) || "N/A"}
                            </TableCell>
                            <TableCell>
                              {data.renewableShare?.toFixed(1) || "N/A"}
                            </TableCell>
                            <TableCell>
                              {data.co2Emissions?.toFixed(1) || "N/A"}
                            </TableCell>
                            <TableCell>
                              {data.cost?.toFixed(2) || "N/A"}
                            </TableCell>
                          </TableRow>
                        )) : null}
                      </TableBody>
                    </Table>
                  </div>

                  {Array.isArray(energyData) && energyData.length > 10 && (
                    <div className="text-center">
                      <Button variant="outline">
                        Weitere {energyData.length - 10} Einträge anzeigen
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-50">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Keine Energiedaten vorhanden</p>
                  <p className="text-sm mt-1">Erfassen Sie neue Daten für diese Anlage</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-50">
                <BoltIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Wählen Sie eine Anlage aus der Liste</p>
                <p className="text-sm mt-1">um Energiedaten anzuzeigen</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
