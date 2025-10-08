# Routing & Shared Components Update Task

## Objective
Complete Tasks 10-13 of frontend refactoring: Update routing, shared layouts, and TypeScript configuration.

## Current State
- 9 feature modules extracted: Auth, Users, Objects, Energy, Temperature, Monitoring, KI Reports, Settings
- All features in `client/src/features/` directory
- Build passing

## Tasks

### Task 10: Update Shared Layout & Components

Review and ensure shared components are properly organized:
- `client/src/components/` - Shared UI components
- `client/src/components/Layout.tsx` - Main layout
- `client/src/components/DatabaseStatusHeader.tsx` - Database status
- Ensure no feature-specific components remain in shared directory

### Task 11: Update Routing

Organize routes by feature in `client/src/App.tsx`:
```typescript
// Group routes by feature with comments
// Auth Routes
<Route path="/login" component={Login} />
<Route path="/superadmin" component={SuperadminLogin} />

// Monitoring Routes
<Route path="/" component={Dashboard} />
<Route path="/maps" component={Maps} />
<Route path="/network-monitor" component={NetworkMonitor} />
<Route path="/performance" component={PerformanceTest} />

// User Management Routes
<Route path="/users" component={UserManagement} />
<Route path="/user-settings" component={UserSettings} />

// Energy Routes
<Route path="/energy" component={EnergyData} />
<Route path="/efficiency" component={EfficiencyAnalysis} />

// Temperature Routes
<Route path="/temperature" component={TemperatureAnalysis} />

// Objects Routes
<Route path="/objects" component={ObjectManagement} />

// KI Reports Routes
<Route path="/grafana" component={GrafanaDashboard} />

// Settings Routes
<Route path="/settings" component={SystemSettings} />
<Route path="/api-management" component={ApiManagement} />
<Route path="/modbus" component={ModbusConfig} />
<Route path="/devices" component={Devices} />

// Admin Routes
<Route path="/admin" component={AdminDashboard} />
<Route path="/logbook" component={Logbook} />
```

### Task 12: Create Shared API Client

Check if base API client exists in `client/src/lib/apiClient.ts`. If not, create it:
```typescript
import { apiRequest } from "@/lib/queryClient";

export class BaseApiClient {
  protected async get<T>(endpoint: string): Promise<T> {
    return apiRequest(endpoint);
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return apiRequest(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data: any): Promise<T> {
    return apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return apiRequest(endpoint, {
      method: "DELETE",
    });
  }
}
```

Update all feature API files to extend BaseApiClient if needed.

### Task 13: Update TypeScript Paths

Update `tsconfig.json` to add path aliases for all features:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/auth/*": ["./src/features/auth/*"],
      "@/features/users/*": ["./src/features/users/*"],
      "@/features/objects/*": ["./src/features/objects/*"],
      "@/features/energy/*": ["./src/features/energy/*"],
      "@/features/temperature/*": ["./src/features/temperature/*"],
      "@/features/monitoring/*": ["./src/features/monitoring/*"],
      "@/features/ki-reports/*": ["./src/features/ki-reports/*"],
      "@/features/settings/*": ["./src/features/settings/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

## Verification
- Run `npm run build` - must pass
- Check imports are clean and organized
- Verify no circular dependencies

## Commit Message
```
feat(frontend): update routing and shared infrastructure

- Organize routes by feature with clear comments
- Create shared BaseApiClient for all features
- Update TypeScript path aliases for better imports
- Ensure shared components properly organized

Tasks 10-13/15 complete
```

## Success Criteria
- ✅ Routes organized by feature
- ✅ BaseApiClient created and documented
- ✅ TypeScript paths configured
- ✅ Build passing
- ✅ Committed and pushed
