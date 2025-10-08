import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Layout } from "@/components/Layout";
import DatabaseStatusHeader from "@/components/DatabaseStatusHeader";
import { SessionWarning } from "@/features/auth/components/SessionWarning";
import { useUIMode } from "@/hooks/useUIMode";
import Login from "@/features/auth/pages/Login";
import SuperadminLogin from "@/features/auth/pages/SuperadminLogin";
import Dashboard from "@/features/monitoring/pages/Dashboard";
import LayoutStrawaTabs from "@/features/auth/pages/LayoutStrawa";
import LoginStrawa from "@/features/auth/pages/LoginStrawa";
import Maps from "@/features/monitoring/pages/Maps";
import User from "@/features/users/pages/User";
import UserSettings from "@/features/users/pages/UserSettings";
import Logbook from "@/pages/Logbook";
import UserManagement from "@/features/users/pages/UserManagement";
import EnergyData from "@/features/energy/pages/EnergyData";
import GrafanaDashboard from "@/features/ki-reports/pages/GrafanaDashboard";
import ObjectManagement from "@/features/objects/pages/ObjectManagement";
import EfficiencyAnalysis from "@/features/energy/pages/EfficiencyAnalysis";
import NetworkMonitor from "@/features/monitoring/pages/NetworkMonitor";
import SystemSettings from "@/features/settings/pages/SystemSettings";
import TemperatureAnalysis from "@/features/temperature/pages/TemperatureAnalysis";
import AdminDashboard from "@/pages/AdminDashboard";
import ApiManagement from "@/features/settings/pages/ApiManagement";
import DbEnergyDataConfig from "@/features/energy/pages/DbEnergyDataConfig";
import PerformanceTest from "@/features/monitoring/pages/PerformanceTest";
import ModbusConfig from "@/features/settings/pages/ModbusConfig";
import Devices from "@/features/settings/pages/Devices";
import Geraeteverwaltung from "@/features/settings/pages/Geraeteverwaltung";

function RouterMain() {
  const { isAuthenticated, isLoading, isSuperadmin } = useAuth();
  const { shouldUseStrawa } = useUIMode();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSuperadmin) {
    return (
      <Switch>
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/superadmin-login" component={SuperadminLogin} />
        <Route path="/login" component={Login} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/anmelden" component={LoginStrawa} />
        <Route path="/login" component={Login} />
        <Route path="/superadmin-login" component={SuperadminLogin} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/" component={LoginStrawa} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  // Check UI mode: NUR ui=cockpit zeigt große Sidebar, alles andere zeigt 4-Tab-Layout
  if (shouldUseStrawa) {
    // Alles außer ui=cockpit zeigt 4-Tab-Layout (LayoutStrawa)
    return (
      <>
        <DatabaseStatusHeader />
        <LayoutStrawaTabs />
      </>
    );
  }

  // ui=cockpit zeigt große Sidebar mit normalem Routing
  return (
    <>
      <DatabaseStatusHeader />
      <Switch>
        {/* Homepage: LayoutStrawaTabs */}
        <Route path="/" component={() => <LayoutStrawaTabs />} />
        
        {/* All other routes: Large Sidebar Layout */}
        <Route>
          <Layout>
            <Switch>
              {/* Monitoring Routes */}
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/maps" component={Maps} />
              <Route path="/network-monitor" component={NetworkMonitor} />
              <Route path="/performance-test" component={PerformanceTest} />

              {/* KI Reports / Grafana Routes */}
              <Route path="/grafana-dashboards" component={GrafanaDashboard} />
              <Route path="/grafana-dashboard" component={GrafanaDashboard} />

              {/* Energy Routes */}
              <Route path="/energy-data" component={EnergyData} />
              <Route path="/efficiency" component={EfficiencyAnalysis} />
              <Route path="/db-energy-config" component={DbEnergyDataConfig} />

              {/* Temperature Routes */}
              <Route path="/temperature-analysis" component={TemperatureAnalysis} />
              <Route path="/temperatur-analyse" component={TemperatureAnalysis} />

              {/* Objects Routes */}
              <Route path="/objects" component={ObjectManagement} />
              <Route path="/objektverwaltung" component={ObjectManagement} />

              {/* User Management Routes */}
              <Route path="/users" component={UserManagement} />
              <Route path="/UserManagement" component={UserManagement} />
              <Route path="/user-management" component={UserManagement} />
              <Route path="/User-Management" component={UserManagement} />
              <Route path="/user" component={User} />
              <Route path="/user-settings" component={UserSettings} />

              {/* Settings Routes */}
              <Route path="/system-setup" component={SystemSettings} />
              <Route path="/setup" component={SystemSettings} />
              <Route path="/api-management" component={ApiManagement} />
              <Route path="/api-test" component={ApiManagement} />
              <Route path="/api-tests" component={ApiManagement} />
              <Route path="/modbusConfig" component={ModbusConfig} />
              <Route path="/devices" component={Devices} />
              <Route path="/geraeteverwaltung" component={Geraeteverwaltung} />

              {/* Admin Routes */}
              <Route path="/admin-dashboard" component={AdminDashboard} />
              <Route path="/logbook" component={Logbook} />

              {/* Debug/Development Routes */}
              <Route path="/layout" component={() => (
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold">Layout Komponente</h1>
                  <p className="text-gray-600 mt-4">Dies ist die Layout-Komponente als eigenständige Route.</p>
                </div>
              )} />

              <Route><Redirect to="/" /></Route>
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SessionWarning />
        <RouterMain />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;