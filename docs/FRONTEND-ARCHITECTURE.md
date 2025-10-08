# Frontend Architecture

Last Updated: 2025-10-08

## Overview
This document describes the modular frontend architecture implemented in the monitoring application. The frontend has been refactored from a monolithic structure into self-contained feature modules.

## Feature-Based Structure

The frontend is organized into domain-driven feature modules:

```
client/src/features/
├── auth/              # Authentication & authorization
│   ├── api/           # Auth API client
│   ├── components/    # Auth-specific components (LoginModal, SessionWarning)
│   ├── hooks/         # Auth hooks (useAuth)
│   └── pages/         # Login pages (Login, SuperadminLogin, LoginStrawa, LayoutStrawa)
├── users/             # User management
│   ├── api/           # Users API client
│   ├── components/    # User components (UserSettingsModal)
│   └── pages/         # User management pages
├── objects/           # Object management
│   ├── api/           # Objects API client
│   ├── components/    # Object components (NetzView, ObjectFilterAPI, ObjektinfoContent)
│   └── pages/         # Object management page
├── energy/            # Energy monitoring & analysis
│   ├── api/           # Energy API client
│   ├── components/    # Energy charts & analysis components
│   └── pages/         # Energy data & efficiency analysis pages
├── temperature/       # Temperature analysis
│   ├── api/           # Temperature API client
│   ├── components/    # Temperature charts
│   └── pages/         # Temperature analysis page
├── monitoring/        # System monitoring & dashboards
│   ├── api/           # Monitoring API client
│   └── pages/         # Dashboard, Maps, Network Monitor, Performance Test
├── ki-reports/        # Grafana & Reporting
│   ├── api/           # Reports API client
│   ├── components/    # Grafana components (GrafanaDiagramme, GrafanaLogic, GrafanaReport, grafanaConfig)
│   └── pages/         # Grafana dashboard
└── settings/          # System settings & configuration
    ├── api/           # Settings API client
    ├── components/    # Settings components (device config, portal setup, JSON editors)
    └── pages/         # Settings pages (SystemSettings, ApiManagement, ModbusConfig, Devices, Geraeteverwaltung)
```

## API Architecture

### Shared API Client

All features use a shared API client (`client/src/lib/apiClient.ts`) that provides:

```typescript
export const apiClient = {
  get<T>(url: string, params?: Record<string, any>): Promise<T>
  post<T>(url: string, data?: any): Promise<T>
  put<T>(url: string, data?: any): Promise<T>
  delete<T>(url: string): Promise<T>
  patch<T>(url: string, data?: any): Promise<T>
}
```

Features:
- **Consistent error handling** across all requests
- **Automatic authentication** with credentials
- **Content-Type management** (JSON, FormData)
- **TypeScript generics** for type-safe responses

### Feature API Clients

Each feature has its own API module that uses the shared client:

```typescript
// Example: client/src/features/users/api/usersApi.ts
import { apiClient } from '@/lib/apiClient';

export const usersApi = {
  async getAllUsers() {
    return apiClient.get('/api/users');
  },

  async createUser(userData: any) {
    return apiClient.post('/api/users', userData);
  },

  // ... more endpoints
};
```

## Shared Resources

```
client/src/
├── components/        # Shared UI components
│   ├── ui/           # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── Layout.tsx    # Main application layout
│   ├── DatabaseStatusHeader.tsx
│   └── ...
├── hooks/             # Shared hooks (useUIMode, use-toast)
├── lib/               # Utilities
│   ├── apiClient.ts  # Shared API client
│   ├── queryClient.ts # React Query configuration
│   └── utils.ts      # Helper functions
├── styles/            # Global styles
└── contexts/          # React contexts
```

## Routing Organization

Routes are organized by feature in `client/src/App.tsx`:

```typescript
// Monitoring Routes
<Route path="/dashbord" component={Dashboard} />
<Route path="/maps" component={Maps} />
<Route path="/network-monitor" component={NetworkMonitor} />

// Energy Routes
<Route path="/energy-data" component={EnergyData} />
<Route path="/efficiency" component={EfficiencyAnalysis} />

// Settings Routes
<Route path="/system-setup" component={SystemSettings} />
<Route path="/api-management" component={ApiManagement} />

// ... etc
```

## Benefits

### 1. Modularity
- Each feature is self-contained with its own components, pages, and API logic
- Features can be developed and tested in isolation
- Clear boundaries between different domains

### 2. Scalability
- Easy to add new features without affecting existing code
- New developers can quickly understand specific feature domains
- Feature modules can be split into separate packages if needed

### 3. Maintainability
- Clear separation of concerns
- Easy to find code related to specific functionality
- Reduced coupling between features

### 4. Reusability
- Shared components and utilities are centralized
- Common patterns enforced through shared API client
- Consistent error handling and authentication

### 5. Type Safety
- TypeScript throughout
- Type-safe API responses
- Catch errors at compile time

## Migration Guide

### Adding a New Feature

1. **Create feature directory structure:**
   ```bash
   mkdir -p client/src/features/my-feature/{api,components,pages,hooks}
   ```

2. **Create API client:**
   ```typescript
   // client/src/features/my-feature/api/myFeatureApi.ts
   import { apiClient } from '@/lib/apiClient';

   export const myFeatureApi = {
     async getData() {
       return apiClient.get('/api/my-feature');
     },
   };
   ```

3. **Add routes:**
   ```typescript
   // client/src/App.tsx
   import MyFeaturePage from '@/features/my-feature/pages/MyFeaturePage';

   // In routing section:
   <Route path="/my-feature" component={MyFeaturePage} />
   ```

4. **Add navigation (if needed):**
   Update `client/src/components/Layout.tsx` or navigation components

### Moving Code to Features

When moving existing code into a feature:

1. Move files to appropriate feature subdirectories
2. Update imports to use `@/features/feature-name/...`
3. Extract API calls into feature's API module
4. Update route imports in App.tsx
5. Test build: `npm run build`

## Technical Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Wouter** - Lightweight routing
- **React Query (TanStack Query)** - Server state management
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling

## Performance Considerations

- Code splitting can be improved (current main bundle: ~2.4MB)
- Consider lazy loading features with `React.lazy()`
- Optimize bundle size with dynamic imports for large features

## Future Improvements

1. **Lazy Loading**: Implement code splitting for feature modules
2. **Shared Types**: Create shared TypeScript types package
3. **Feature Flags**: Add feature toggle system
4. **Testing**: Add unit tests for each feature module
5. **Storybook**: Document components in Storybook
6. **Bundle Optimization**: Split large chunks using Vite's manual chunks

## Related Documentation

- [Backend Architecture](./.agents/ARCHITECTURE.md)
- [API Documentation](../README.md)
- [Development Guide](../README.md)

---

*This architecture was established in October 2025 as part of the modularization effort.*
