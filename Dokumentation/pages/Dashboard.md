# Dashboard Page Documentation

## Overview
The Dashboard page (`/dashbord`) serves as the main overview and portfolio management interface for the Netzwächter monitoring system. It provides comprehensive insights into facility performance, energy efficiency, and system health across all managed buildings.

**Note**: The route uses `/dashbord` (without the second 'a') as configured in the application routing.

## Page Content & Layout

### 1. KPI Dashboard Section (External)
- **Purpose**: Displays key performance indicators from an external Grafana dashboard
- **Source**: Embedded iframe loading from `kpi_dashboard_url` setting
- **Configuration**: Retrieved from `/api/settings` endpoint
- **Responsive**: Adapts height based on screen size (96 on mobile, 500 on md, 600 on lg screens)

### 2. KPI Cards Grid (4-Card Row)
**Critical Systems Card**
- **Metric**: Count of critical and warning systems
- **Data Source**: Real-time temperature analysis of all objects
- **Navigation**: Click redirects to `/maps?filter=critical`
- **Calculation**:
  - Critical: Objects with temperature violations beyond thresholds
  - Warning: Objects with temperature warnings (shown in parentheses)

**Energy Efficiency Card**
- **Metric**: Average energy efficiency percentage across all facilities
- **Data Source**: Efficiency data from `/api/test-efficiency-analysis/:objectId` for each object
- **Calculation**: `(maxEfficiency - avgEfficiencyPerM2) / maxEfficiency * 100`
- **Thresholds**: Max efficiency = 250 kWh/m² (H-class)

**Renewable Share Card**
- **Metric**: Percentage of renewable energy in total consumption
- **Data Source**: `auswertung["365"]["20241"]` (renewable) vs `auswertung["365"]["20541"]` (total)
- **Calculation**: `(totalRenewable / totalConsumption) * 100`

**Total Facilities Card**
- **Metric**: Total facilities count with active count
- **Data Source**: All objects from `/api/objects`
- **Active Calculation**: Facilities with recent temperature data (< 24 hours old)

### 3. Portfolio Overview Section (2-Column Layout)

#### Left Column: Efficiency Distribution Chart
- **Component**: `EfficiencyDistributionCard`
- **Data**: Processed objects with efficiency classes A+ to H
- **Time Range**: Fixed to "last-year"
- **Visualization**: Pie chart with color-coded efficiency classes

#### Right Column: Portfolio Objects Table
- **Headers**: Object Name, Info/Potential, Area (NE), Efficiency Class, Renewable Share, VL-Temp, RL-Temp, Status
- **Sorting**: Clickable column headers for all columns
- **Filtering**: Search by name, efficiency class filter (all/A+-C/D-H/specific classes), building type filter
- **Export**: `ExportDialog` component for CSV/PDF export with filters applied

## Functions & Logic

### Core Functions

#### `analyzeObjectTemperature(obj)`
- **Purpose**: Analyzes temperature status of a facility
- **Parameters**: `obj` (facility object with temperature data)
- **Returns**: `{ offline: boolean, critical: boolean, warning: boolean }`
- **Logic**:
  1. Checks for available threshold configurations
  2. Finds object-specific or fallback thresholds
  3. Validates data freshness (< 24 hours)
  4. Compares VL/RL temperatures against warning/critical thresholds
- **Used For**: Status indicators, sorting, critical system counts

#### `calculateEnergyEfficiency()`
- **Purpose**: Calculates average efficiency percentage across all facilities
- **Returns**: Number (0-100)
- **Formula**: `((250 - avgEfficiencyPerM2) / 250) * 100`

#### `calculateRenewableShare()`
- **Purpose**: Calculates total renewable energy percentage
- **Returns**: Number (0-100)
- **Data**: Aggregates renewable vs total consumption across all facilities

#### `getEfficiencyClass(efficiency)`
- **Purpose**: Maps kWh/m² to GEG 2024 efficiency class
- **Parameters**: `efficiency` (kWh/m²)
- **Returns**: String ('A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')
- **Thresholds**: A+ ≤30, A ≤50, B ≤75, C ≤100, D ≤130, E ≤160, F ≤200, G ≤250, H >250

#### `getNetworkTemperatures()`
- **Purpose**: Extracts VL/RL temperatures from sensor data
- **Returns**: `{ rlTemp, vlTemp, sensorId }`
- **Sensor Priority**: Z20541, Z20542, Z20543, 20541, 20542, 20543

### Event Handlers

#### `handleObjectClick(objectId, dashboardType)`
- **Purpose**: Navigate to Grafana dashboard for specific object
- **Parameters**: `objectId`, `dashboardType` (default: 'auswertung')
- **Navigation**: `/grafana-dashboards?objectID=${objectId}&typ=diagramme&from=dashboard`

#### `handleTemperatureClick(objectId)`
- **Purpose**: Navigate to temperature monitoring for specific object
- **Navigation**: Same as `handleObjectClick`

#### `handleSort(key)`
- **Purpose**: Sort table by specified column
- **Parameters**: `key` (column identifier)
- **Directions**: asc/desc toggle, null to clear

## Variables & State

### React State
```typescript
const [buildingSearchTerm, setBuildingSearchTerm] = useState("");
const [efficiencyFilter, setEfficiencyFilter] = useState("all");
const [buildingTypeFilter, setBuildingTypeFilter] = useState("all");
const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
```

### API Data Hooks
```typescript
// Core data
const { data: kpis } = useQuery(["/api/dashboard/kpis"]);
const { data: objects } = useQuery(["/api/objects"]);
const { data: thresholds } = useQuery(["/api/settings/thresholds"]);
const { data: dashboardSettings } = useQuery(["/api/settings"]);

// Efficiency data (parallel loading for all objects)
const { data: efficiencyData } = useQuery(['dashboard-efficiency-data', objectIds], async () => {
  // Loads /api/test-efficiency-analysis/:objectId for each object
});
```

### Computed Values
```typescript
const processedObjects = objects.map(obj => ({
  consumption, renewable, renewableShare, area, efficiency, efficiencyClass,
  rlTemp, vlTemp, sensorId, buildingType
})).filter(obj => obj.efficiencyData?.yearly);

const filteredObjects = processedObjects.filter(/* search + filter logic */);
const availableBuildingTypes = [...new Set(processedObjects.map(o => o.objanlage?.Typ))];
```

## API Endpoints Used

### GET `/api/dashboard/kpis`
- **Purpose**: Retrieves KPI dashboard configuration
- **Response**: KPI metrics and display settings
- **Usage**: Not directly displayed, may be legacy

### GET `/api/objects`
- **Purpose**: Retrieves all accessible facility objects
- **Response**: Array of facility objects with metadata, temperature data, analysis data
- **Usage**: Primary data source for portfolio table and KPI calculations
- **Required Fields**: `id`, `objectid`, `name`, `address`, `objdata`, `objanlage`, `auswertung`, `fltemp`, `rttemp`

### GET `/api/settings/thresholds`
- **Purpose**: Retrieves temperature threshold configurations
- **Response**: Array of threshold settings by configuration name
- **Usage**: Temperature analysis for critical/warning status
- **Structure**: `{ keyName, value: { thresholds: { critical: { vlValue, rlValue }, warning: { vlValue, rlValue } } } }`

### GET `/api/settings`
- **Purpose**: Retrieves system settings
- **Response**: Array of key-value settings
- **Usage**: KPI dashboard URL extraction (`kpi_dashboard_url` key)

### GET `/api/test-efficiency-analysis/:objectId`
- **Purpose**: Retrieves efficiency analysis data for specific facility
- **Parameters**:
  - `objectId`: Facility identifier
  - `timeRange`: 'last-year' (default)
  - `resolution`: 'monthly' (default)
- **Response**: `{ yearly: { totalKwh, efficiencyPerM2 }, monthly: [...] }`
- **Usage**: Primary efficiency data source, loaded for all facilities in parallel

## Database Calls

### Direct DB Queries (via API)
The page relies on API endpoints that perform database queries:

1. **Objects Query**: `SELECT * FROM objects WHERE user_permissions_allow`
2. **Settings Query**: `SELECT * FROM settings WHERE category = 'thresholds'`
3. **Efficiency Analysis**: Complex calculation queries on energy consumption data
4. **Temperature Data**: Real-time temperature sensor readings

### Data Processing
- **Threshold Matching**: Settings table queries for temperature thresholds
- **User Permissions**: Objects filtered by user access permissions
- **Historical Data**: Analysis of 365-day consumption and renewable data
- **Real-time Status**: Temperature data freshness validation

## Required Files & Components

### Core Files
- `client/src/pages/Dashboard.tsx` - Main page component
- `client/src/components/Layout.tsx` - Page layout wrapper
- `client/src/components/DatabaseStatusHeader.tsx` - Connection status indicator
- `client/src/components/ExportDialog.tsx` - Data export functionality
- `client/src/components/EfficiencyDistributionCard.tsx` - Efficiency visualization

### UI Components
- `client/src/components/ui/card.tsx`
- `client/src/components/ui/badge.tsx`
- `client/src/components/ui/button.tsx`
- `client/src/components/ui/input.tsx`
- `client/src/components/ui/select.tsx`
- `client/src/components/ui/table.tsx`

### Hooks & Utilities
- `client/src/hooks/useAuth.ts` - User authentication state
- `client/src/lib/queryClient.ts` - API query management
- `client/src/lib/utils.ts` - Utility functions

### API Controllers
- `server/controllers/databaseController.ts` - Objects, settings endpoints
- `server/controllers/efficiencyController.ts` - Efficiency analysis
- `server/controllers/energyController.ts` - Energy data processing

### Database Schema
- `shared/schema.ts` - Database table definitions
- Tables: `objects`, `settings`, `energy_data`, temperature tables

## Navigation & Routing

### Incoming Routes
- `/dashbord` - Main dashboard route (note: typo in route)
- `/` (when using cockpit layout) - Alternative access via LayoutStrawaTabs

### Outgoing Navigation
- `/maps?filter=critical` - Critical systems map view
- `/grafana-dashboards?objectID=X&typ=diagramme&from=dashboard` - Facility details

### Route Parameters
- `from=dashboard` - Indicates navigation source for breadcrumbs/analytics

## Performance Considerations

### Data Loading Strategy
- **Parallel API Calls**: Efficiency data loaded concurrently for all objects
- **Caching**: React Query caching (5-minute stale time for efficiency data)
- **Lazy Loading**: KPI dashboard iframe loads on-demand
- **Conditional Rendering**: Portfolio section only renders with valid data

### Optimization Features
- **Debounced Search**: Building search with input debouncing
- **Virtual Scrolling**: Table body with overflow scrolling
- **Selective Rendering**: Objects filtered client-side for performance
- **Memory Management**: Processed data cached in component state

## Error Handling

### API Failures
- **Graceful Degradation**: Missing efficiency data filters out objects
- **Loading States**: Skeleton UI during data fetching
- **Error Boundaries**: Network failures don't crash the page
- **Fallback Values**: Default values for missing data (-, 0%, etc.)

### Data Validation
- **Temperature Freshness**: 24-hour validity check for status indicators
- **Threshold Availability**: Fallback to default thresholds when object-specific config missing
- **Sensor Validation**: Multiple sensor ID fallbacks for temperature data

## Security Considerations

### Authentication
- **Session-based**: Requires active user session
- **Role-based**: Data filtered by user permissions
- **API Security**: All endpoints protected with authentication middleware

### Data Access
- **Object Filtering**: Only accessible objects shown
- **Permission Checks**: Database queries include user permission filters
- **Audit Logging**: User activity may be logged for security monitoring

## Browser Compatibility

### Supported Features
- **ES6 Modules**: Modern JavaScript module system
- **CSS Grid**: Layout uses CSS Grid for responsive design
- **Flexbox**: Flexible layouts for adaptive UI
- **CSS Custom Properties**: Dynamic theming support

### Responsive Design
- **Mobile**: Single column layout, reduced spacing
- **Tablet**: Two-column grid for KPI cards
- **Desktop**: Full 4-column layout with sidebar space
