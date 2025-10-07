# PHASE 3.1: Frontend Architecture Overview

Created: 2025-10-07
Timestamp: 14:10:00

## Frontend Technology Stack

### Core Framework

**React**: v18.3.1
**Build Tool**: Vite v5.4.19
**Language**: TypeScript v5.6.3
**Router**: Wouter v3.3.5 (lightweight React Router alternative)
**State Management**: @tanstack/react-query v5.60.5

---

## Application Entry Point

### 1. main.tsx (6 lines)

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

**Pattern**: React 18 concurrent mode
**No StrictMode**: Direct App render
**Styling**: Global CSS import

---

## Root Application Component

### 2. App.tsx (154 lines)

**Purpose**: Main application router and provider wrapper
**Pattern**: Multi-route with authentication guards

#### Provider Hierarchy (Lines 143-152)

```typescript
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
```

**Wrapper Stack**:
1. **QueryClientProvider**: React Query state management
2. **TooltipProvider**: Radix UI tooltip context
3. **Toaster**: Toast notifications (shadcn/ui)
4. **SessionWarning**: Session timeout warnings
5. **RouterMain**: Application routing logic

---

## Routing Architecture

### RouterMain Component (Lines 37-141)

**Pattern**: Conditional routing based on authentication state

#### Authentication States

**1. Loading State** (Lines 41-50)
```typescript
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
```

**2. Superadmin State** (Lines 52-61)
```typescript
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
```

**Routes**: 3 (admin-dashboard, superadmin-login, login)
**Layout**: No sidebar (minimal UI)

**3. Unauthenticated State** (Lines 63-74)
```typescript
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
```

**Routes**: 5 login-related routes
**Default**: LoginStrawa (German: "to login")

**4. Authenticated State - UI Mode Switch** (Lines 76-140)

### UI Mode System

**Hook**: `useUIMode()` from `@/hooks/useUIMode`
**Purpose**: Switch between two different UI layouts

#### Mode 1: Strawa Layout (Lines 77-85)
```typescript
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
```

**Trigger**: `shouldUseStrawa` = true
**Layout**: 4-Tab mobile-friendly layout
**Components**:
- DatabaseStatusHeader (persistent)
- LayoutStrawaTabs (page: LayoutStrawa.tsx, 20,128 bytes)

**German Comment Translation**:
- "NUR ui=cockpit zeigt große Sidebar" = "ONLY ui=cockpit shows large sidebar"
- "Alles außer ui=cockpit zeigt 4-Tab-Layout" = "Everything except ui=cockpit shows 4-Tab layout"

#### Mode 2: Cockpit Layout (Lines 88-140)
```typescript
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
            {/* 29 application routes */}
          </Switch>
        </Layout>
      </Route>
    </Switch>
  </>
);
```

**Trigger**: `ui=cockpit` query parameter or default
**Layout**: Large sidebar with full routing
**Homepage**: Still shows LayoutStrawaTabs
**Other Routes**: Wrapped in `<Layout>` component

---

## Route Inventory

### Total Routes: 34 routes

#### Authentication Routes (5)
| Path | Component | Purpose |
|------|-----------|---------|
| /login | Login | Regular user login |
| /anmelden | LoginStrawa | German login UI |
| /superadmin-login | SuperadminLogin | Superadmin authentication |
| /admin-dashboard | AdminDashboard | Admin control panel |
| / (unauthenticated) | LoginStrawa | Default login |

#### Core Application Routes (29)

| Path | Component | Size (bytes) | Lines | Purpose |
|------|-----------|--------------|-------|---------|
| / | LayoutStrawaTabs | 20,128 | ~480 | Homepage/Dashboard |
| /dashbord | Dashboard | 39,585 | ~900 | Main dashboard (typo in route) |
| /maps | Maps | 50,042 | ~1,100 | Object location maps |
| /grafana-dashboards | GrafanaDashboard | 26,203 | ~620 | Grafana iframe integration |
| /grafana-dashboard | GrafanaDashboard | 26,203 | ~620 | Duplicate route |
| /energy-data | EnergyData | 24,317 | ~580 | Energy consumption data |
| /network-monitor | NetworkMonitor | 77,370 | 1,705 | Network monitoring |
| /efficiency | EfficiencyAnalysis | 46,095 | ~1,050 | Efficiency analysis |
| /objects | ObjectManagement | 80,042 | 1,786 | Object management |
| /objektverwaltung | ObjectManagement | 80,042 | 1,786 | German: object admin |
| /users | UserManagement | 98,815 | 2,088 | User management |
| /UserManagement | UserManagement | 98,815 | 2,088 | Case variation |
| /user-management | UserManagement | 98,815 | 2,088 | Kebab-case variant |
| /User-Management | UserManagement | 98,815 | 2,088 | Title-case variant |
| /user | User | 39,298 | ~900 | User profile |
| /user-settings | UserSettings | 18,658 | ~450 | User settings |
| /system-setup | SystemSettings | 88,117 | 2,019 | System configuration |
| /setup | SystemSettings | 88,117 | 2,019 | Short alias |
| /api-management | ApiManagement | 27,472 | ~650 | API testing interface |
| /db-energy-config | DbEnergyDataConfig | 6,262 | ~150 | Database config |
| /logbook | Logbook | 32,183 | ~760 | Activity logbook |
| /api-test | ApiManagement | 27,472 | ~650 | Duplicate API route |
| /api-tests | ApiManagement | 27,472 | ~650 | Plural variant |
| /temperature-analysis | TemperatureAnalysis | 6,910 | ~165 | Temperature charts |
| /temperatur-analyse | TemperatureAnalysis | 6,910 | ~165 | German variant |
| /performance-test | PerformanceTest | 11,732 | ~280 | Performance testing |
| /modbusConfig | ModbusConfig | 14,611 | ~350 | Modbus device config |
| /devices | Devices | 31,013 | ~740 | Device management |
| /geraeteverwaltung | Geraeteverwaltung | 3,456 | ~85 | German: device admin |
| /layout | (inline) | - | 10 | Layout test route |

### Route Duplication Issues

**Problem**: Multiple routes to same component

**UserManagement**: 4 routes
- /users
- /UserManagement
- /user-management
- /User-Management

**GrafanaDashboard**: 2 routes
- /grafana-dashboards
- /grafana-dashboard

**ObjectManagement**: 2 routes
- /objects
- /objektverwaltung (German)

**TemperatureAnalysis**: 2 routes
- /temperature-analysis
- /temperatur-analyse (German)

**ApiManagement**: 3 routes
- /api-management
- /api-test
- /api-tests

**SystemSettings**: 2 routes
- /system-setup
- /setup

**Total Duplicate Routes**: 13 (38% of application routes)

---

## Page Component Analysis

### Size Distribution

| Size Range | Count | Percentage | Components |
|------------|-------|------------|------------|
| 0-10 KB | 5 | 20% | Small utilities |
| 10-30 KB | 9 | 36% | Medium pages |
| 30-50 KB | 5 | 20% | Large pages |
| 50-100 KB | 6 | 24% | Very large pages |

### Largest Page Components (CRITICAL)

**1. UserManagement.tsx: 98,815 bytes (2,088 lines)**
- **Purpose**: User CRUD operations
- **Issue**: Single file for entire user admin
- **Needs**: Urgent refactoring

**2. SystemSettings.tsx: 88,117 bytes (2,019 lines)**
- **Purpose**: System configuration
- **Issue**: Massive single component
- **Needs**: Split into modules

**3. ObjectManagement.tsx: 80,042 bytes (1,786 lines)**
- **Purpose**: Object/building management
- **Issue**: Complex CRUD in one file
- **Needs**: Component extraction

**4. NetworkMonitor.tsx: 77,370 bytes (1,705 lines)**
- **Purpose**: Network monitoring dashboard
- **Issue**: Dense data visualization
- **Needs**: Chart components separation

**5. Maps.tsx: 50,042 bytes (~1,100 lines)**
- **Purpose**: Interactive maps with markers
- **Issue**: Map logic + UI in one file
- **Needs**: Service layer extraction

**Total Large Files**: 5 files = 394,387 bytes (385 KB)
**Average Size**: 78,877 bytes per file

---

## Component Architecture

### Component Types

#### 1. Page Components (25 files)
**Location**: `/client/src/pages`
**Total Size**: 760,112 bytes
**Average**: 30,404 bytes per page

#### 2. Custom Components (29 files)
**Location**: `/client/src/components`
**Excludes**: UI library components
**Purpose**: Business logic components

#### 3. UI Components (48 files)
**Location**: `/client/src/components/ui`
**Source**: shadcn/ui (Radix UI wrappers)
**Purpose**: Reusable UI primitives

#### 4. Shared Components
**Location**: `/client/src/components/shared`
**Purpose**: Cross-feature reusable components

#### 5. Domain Components
**Location**: `/client/src/components/netzstrawa`
**Purpose**: Domain-specific components (network?)

---

## State Management Architecture

### React Query Configuration (queryClient.ts)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

**Configuration Analysis**:
- **No automatic refetch**: refetchInterval = false
- **No focus refetch**: refetchOnWindowFocus = false
- **Data never stale**: staleTime = Infinity
- **No retries**: retry = false (both queries & mutations)
- **401 behavior**: Throws error (redirects to login)

**Pattern**: Pessimistic updates, manual refetch control

### API Request Function (Lines 10-29)

```typescript
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;

  const res = await fetch(url, {
    method,
    // Don't set Content-Type for FormData (browser sets it automatically with boundary)
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    // Don't JSON.stringify FormData
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}
```

**Features**:
- FormData detection for file uploads
- Automatic Content-Type handling
- Credentials included (session cookies)
- Throws on non-OK responses

### Query Function Factory (Lines 32-47)

```typescript
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
```

**Pattern**: Query key as URL
- **Example**: `queryKey: ["/api/auth/user"]` → `fetch("/api/auth/user")`
- **401 Handling**: Configurable (throw or return null)

---

## Authentication Hook Analysis

### useAuth Hook (useAuth.ts, 159 lines)

**Purpose**: Central authentication state management
**Pattern**: React Query + client-side session tracking

#### Session Configuration (Lines 33-35)

```typescript
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const LOGOUT_WARNING_TIME = INACTIVITY_TIMEOUT - WARNING_TIME;
```

**Timeouts**:
- **Inactivity**: 2 hours
- **Warning**: 5 minutes before expiry
- **Warning Trigger**: 1 hour 55 minutes after last activity

#### User Query (Lines 7-13)

```typescript
const { data: user, isLoading, error } = useQuery({
  queryKey: ["/api/auth/user"],
  retry: false,
  // Stelle sicher, dass der Hook bei 401-Fehlern nicht endlos lädt
  staleTime: 0,
  gcTime: 0,
});
```

**Query**: GET /api/auth/user
**Behavior**: No retries, no caching, no stale time
**Error Handling**: 401 triggers unauthenticated state

#### Heartbeat System (Lines 49-65)

```typescript
const sendHeartbeat = async () => {
  const now = Date.now();
  // Only send heartbeat every 5 minutes to avoid spam
  if (now - lastHeartbeatRef.current < 5 * 60 * 1000) return;

  try {
    await apiRequest("POST", "/api/auth/heartbeat");
    lastHeartbeatRef.current = now;
  } catch (error) {
    // Silent fail for heartbeat - don't spam console with warnings
    if (error && typeof error === 'object' && 'message' in error && !(error as Error).message.includes('fetch')) {
      console.warn("Heartbeat failed:", error);
    }
  }
};
```

**Purpose**: Extend server session on activity
**Frequency**: Maximum once per 5 minutes
**Error Handling**: Silent fail (no user-visible errors)

#### Activity Tracking (Lines 94-125)

**Tracked Events**:
```typescript
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
```

**Pattern**: Event listeners on document
**Behavior**:
- Reset inactivity timer on any activity
- Send heartbeat to server
- Show warning 5 minutes before timeout
- Show expiry message after timeout

#### Session Expiration Detection (Lines 127-147)

```typescript
useEffect(() => {
  if (error && wasAuthenticated) {
    const errorStatus = (error as any)?.status || (error as any)?.response?.status;
    const errorMessage = (error as any)?.message;

    if (errorStatus === 401 || errorMessage?.includes("Session expired") || errorMessage?.includes("Unauthorized")) {
      const reason = (error as any)?.reason;
      if (reason === "inactivity_timeout") {
        setSessionWarning("Session wegen Inaktivität abgelaufen. Bitte melden Sie sich erneut an.");
      } else if (reason === "absolute_timeout") {
        setSessionWarning("Maximale Session-Dauer erreicht (24h). Bitte melden Sie sich erneut an.");
      } else {
        setSessionWarning("Session abgelaufen. Bitte melden Sie sich erneut an.");
      }
      setWasAuthenticated(false);
    }
  }
}, [error, wasAuthenticated]);
```

**Patterns**:
- Tracks `wasAuthenticated` flag to distinguish real expiry from initial load
- Reads `reason` from server error response
- Shows German warning messages
- Three timeout types: inactivity, absolute (24h), generic

**German Translations**:
- "Session wegen Inaktivität abgelaufen" = "Session expired due to inactivity"
- "Maximale Session-Dauer erreicht" = "Maximum session duration reached"
- "Bitte melden Sie sich erneut an" = "Please log in again"

#### Return Interface (Lines 149-158)

```typescript
return {
  user,                    // User object or undefined
  isLoading,               // Query loading state
  isAuthenticated,         // Boolean computed from user + error
  isSuperadmin,            // Boolean: user.role === 'superadmin'
  sessionWarning,          // String or null: warning message
  dismissWarning,          // Function: clear warning
  logout,                  // Function: perform logout
};
```

---

## Routing Library: Wouter

**Choice**: Wouter v3.3.5 instead of React Router
**Size**: 1.2 KB (vs React Router 47 KB)
**Pattern**: Hook-based routing

### Usage Pattern

```typescript
import { Route, Switch, Redirect } from "wouter";
import { useLocation } from "wouter";

const [, setLocation] = useLocation();  // Navigate programmatically
setLocation("/dashboard");
```

**Features Used**:
- `<Route path="..." component={...} />`
- `<Switch>` for route matching
- `<Redirect to="..." />`
- `useLocation()` hook for navigation

**Limitation**: No nested route config (must use nested `<Switch>`)

---

## Styling Architecture

### Tailwind CSS Configuration

**Version**: 3.4.17
**Pattern**: Utility-first CSS

### UI Component Library

**Library**: shadcn/ui (48 components)
**Foundation**: Radix UI primitives
**Customization**: Tailwind + CVA (class-variance-authority)

**Component Count**:
- Alert Dialog
- Accordion
- Avatar
- Button
- Calendar
- Card
- Chart
- Checkbox
- Combobox
- Context Menu
- Dialog
- Drawer
- Dropdown Menu
- Form
- Hover Card
- Input
- Input OTP
- Label
- Menu Bar
- Navigation Menu
- Pagination
- Popover
- Progress
- Radio Group
- Resizable
- Scroll Area
- Select
- Separator
- Sheet
- Skeleton
- Slider
- Switch
- Table
- Tabs
- Textarea
- Toast / Toaster
- Toggle
- Toggle Group
- Tooltip
- (and more...)

---

## Critical Frontend Issues

### 1. Massive Page Components (5 files)

**Total Size**: 394 KB in 5 files
**Issue**: Single-file components with 1,700-2,000 lines each
**Impact**:
- Difficult to maintain
- Hard to test
- Poor performance (entire component re-renders)
- Difficult to collaborate

### 2. Route Duplication (13 redundant routes)

**Issue**: Same component mapped to multiple routes
**Impact**:
- Confusing navigation
- Maintenance burden
- SEO issues (if applicable)
- Inconsistent URL structure

### 3. Typo in Core Route

**Route**: `/dashbord` (should be `/dashboard`)
**Impact**:
- Unprofessional
- Hard to remember
- May be referenced in external docs

### 4. No Code Splitting

**Evidence**: All pages imported directly in App.tsx
**Issue**: Entire app loads on first request
**Bundle Size**: Estimated 2-3 MB JavaScript

### 5. Inconsistent Naming

**Mixed Conventions**:
- kebab-case: `/user-management`
- PascalCase: `/UserManagement`
- Title-Case: `/User-Management`
- German + English mix

### 6. No Error Boundaries

**Evidence**: No ErrorBoundary components found
**Issue**: Single component error crashes entire app

### 7. React Query Misconfiguration

**Issue**: `staleTime: Infinity` with `refetchInterval: false`
**Impact**: Data never refreshes unless manually triggered
**Risk**: Users see stale data

---

## Recommendations

### Immediate Fixes

1. **Split Large Components**
   - UserManagement.tsx → Split into 5-10 smaller components
   - SystemSettings.tsx → Modular settings sections
   - ObjectManagement.tsx → Separate CRUD, list, detail
   - NetworkMonitor.tsx → Extract chart components
   - Maps.tsx → Separate map service layer

2. **Fix Route Duplication**
   - Choose one canonical route per component
   - Add redirects from old routes
   - Update documentation

3. **Fix Typo**
   - Rename `/dashbord` → `/dashboard`
   - Add redirect for backward compatibility

4. **Implement Code Splitting**
   ```typescript
   const Dashboard = lazy(() => import("@/pages/Dashboard"));
   const UserManagement = lazy(() => import("@/pages/UserManagement"));
   ```

5. **Add Error Boundaries**
   - Wrap each route in error boundary
   - Show user-friendly error messages
   - Log errors to monitoring service

### Architecture Improvements

6. **Normalize Route Naming**
   - Use kebab-case consistently
   - Keep English primary, German as aliases
   - Document route conventions

7. **Configure React Query Properly**
   ```typescript
   staleTime: 5 * 60 * 1000,  // 5 minutes
   refetchOnWindowFocus: true,
   ```

8. **Add Loading Suspense**
   ```typescript
   <Suspense fallback={<Loading />}>
     <Route ... />
   </Suspense>
   ```

9. **Extract Business Logic**
   - Move API calls to hooks
   - Create service layer
   - Separate UI from logic

10. **Implement Feature Folders**
    ```
    /features
      /users
        /components
        /hooks
        /services
      /objects
        /components
        /hooks
        /services
    ```

---

## PHASE 3.1 COMPLETE ✅

**Components Analyzed**: 102 files (25 pages + 29 custom + 48 UI)
**Largest Files**: 5 files totaling 394 KB
**Routes**: 34 (21 unique, 13 duplicates)
**State Management**: React Query + custom hooks
**Critical Issues**: 7 identified

**Status**: Ready for PHASE 3.2 Component Deep Dive
