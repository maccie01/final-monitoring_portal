import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Shield, 
  Activity, 
  Users, 
  TrendingUp, 
  Eye, 
  Download,
  Clock,
  UserCheck,
  AlertTriangle,
  BarChart3,
  Calendar
} from "lucide-react";

interface UserActivityLog {
  id: number;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
}

interface ActivityStats {
  totalActivities: number;
  uniqueUsers: number;
  topActions: Array<{action: string; count: number}>;
  recentActivities: UserActivityLog[];
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchUser, setSearchUser] = useState("");

  // Fetch user activity logs
  const { data: userActivities, isLoading: activitiesLoading } = useQuery<UserActivityLog[]>({
    queryKey: ["/api/user-activity-logs", timeRange],
  });

  // Calculate activity statistics
  const activityStats: ActivityStats = {
    totalActivities: userActivities?.length || 0,
    uniqueUsers: userActivities ? new Set(userActivities.map(a => a.user_id)).size : 0,
    topActions: userActivities ? 
      Object.entries(userActivities.reduce((acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>))
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) : [],
    recentActivities: userActivities?.slice(0, 10) || []
  };

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
    
    return <Badge className={colorClass}>{displayText}</Badge>;
  };

  const filteredActivities = userActivities?.filter((activity) => {
    const matchesAction = selectedAction === "all" || activity.action === selectedAction;
    const matchesUser = !searchUser || 
      (activity.user_email?.toLowerCase().includes(searchUser.toLowerCase())) ||
      (activity.user_first_name?.toLowerCase().includes(searchUser.toLowerCase())) ||
      (activity.user_last_name?.toLowerCase().includes(searchUser.toLowerCase()));
    return matchesAction && matchesUser;
  }) || [];

  const getTimeRangeDisplay = (range: string) => {
    switch (range) {
      case "1d": return "Letzten 24 Stunden";
      case "7d": return "Letzten 7 Tage";
      case "30d": return "Letzten 30 Tage";
      default: return "Alle Zeit";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">User-Aktivitäten überwachen und analysieren</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Letzten 24 Stunden</SelectItem>
              <SelectItem value="7d">Letzten 7 Tage</SelectItem>
              <SelectItem value="30d">Letzten 30 Tage</SelectItem>
              <SelectItem value="all">Alle Zeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Aktivitäten</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeDisplay(timeRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Eindeutige Benutzer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Aktion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityStats.topActions[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {activityStats.topActions[0]?.action.replace(/_/g, ' ') || 'Keine Daten'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt/Tag</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(activityStats.totalActivities / (timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30))}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktivitäten pro Tag
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">
            <Activity className="h-4 w-4 mr-2" />
            Alle Aktivitäten
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiken
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCheck className="h-4 w-4 mr-2" />
            Benutzer-Übersicht
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Benutzer suchen..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Aktion filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Aktionen</SelectItem>
                    {activityStats.topActions.map((action) => (
                      <SelectItem key={action.action} value={action.action}>
                        {action.action.replace(/_/g, ' ')} ({action.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle>User-Aktivitäten ({filteredActivities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8">Lade Aktivitäten...</div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Keine Aktivitäten gefunden
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitpunkt</TableHead>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>Aktion</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP-Adresse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            {format(new Date(activity.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.user_first_name && activity.user_last_name 
                            ? `${activity.user_first_name} ${activity.user_last_name}` 
                            : activity.user_email || activity.user_id}
                        </TableCell>
                        <TableCell>{getActionBadge(activity.action)}</TableCell>
                        <TableCell>
                          {activity.resource_type && activity.resource_id 
                            ? `${activity.resource_type}:${activity.resource_id}`
                            : activity.resource_type || "-"}
                        </TableCell>
                        <TableCell>
                          {activity.details ? (
                            <div className="max-w-xs truncate" title={JSON.stringify(activity.details, null, 2)}>
                              {JSON.stringify(activity.details).substring(0, 50)}...
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {activity.ip_address || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Aktionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityStats.topActions.map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        {getActionBadge(action.action)}
                      </div>
                      <span className="text-sm text-gray-500">{action.count} mal</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityStats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getActionBadge(activity.action)}
                        <span className="text-sm text-gray-600">
                          {activity.user_first_name || activity.user_email?.split('@')[0]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(activity.timestamp), "HH:mm", { locale: de })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer-Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Benutzer-Übersicht wird hier angezeigt...
                <br />
                <span className="text-sm">Feature in Entwicklung</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}