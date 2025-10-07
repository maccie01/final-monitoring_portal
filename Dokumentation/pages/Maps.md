# Maps Page Documentation

## Overview
The Maps page (`/maps`) provides a comprehensive geographical visualization interface for the Netzwächter monitoring system. It displays facility locations on an interactive map with real-time status indicators, filtering capabilities, and direct integration with monitoring dashboards. The page serves as the primary geographical overview and navigation tool for facility management.

## Page Content & Layout

### 1. Page Structure
- **Layout**: Two-panel horizontal layout with collapsible sidebar
- **Map**: Full-height Leaflet-based interactive map
- **Sidebar**: Collapsible facility list and controls
- **Responsive**: Adapts to mobile with collapsible sidebar

### 2. Sidebar Panel (Left)

#### Header Controls
- **Collapse Button**: Toggle sidebar visibility
- **Title**: "Objekt-Karte" (Facility Map)
- **Facility Count**: Dynamic count display

#### Search and Filters
**Search Input**
- **Placeholder**: "Objekte suchen..." (Search facilities...)
- **Real-time Filtering**: Filters by facility name, city, postal code
- **Debounced**: Efficient search with performance optimization

**Status Filter**
- **Options**: All, Critical, Warning, Normal, Offline
- **Visual Indicators**: Color-coded status badges
- **Real-time Updates**: Dynamic filtering based on facility status

**Mandant Filter**
- **Options**: All clients or specific mandant selection
- **Multi-tenant Support**: Client-specific facility filtering
- **Dynamic Options**: Populated from available mandants

#### Facility List
- **Scrollable Container**: Virtual scrolling for performance
- **Item Structure**:
  - Facility name and ID
  - Location (city, postal code)
  - Status badge with color coding
  - Temperature indicators (VL/RL)
  - Selection highlighting

#### Facility Actions
- **GPS Editing**: Manual coordinate correction
- **Grafana Access**: Direct dashboard navigation
- **Status Details**: Real-time temperature monitoring

### 3. Map Panel (Right)

#### Map Container
- **Technology**: Leaflet.js with React integration
- **Tile Layer**: OpenStreetMap tiles
- **Responsive**: Full viewport utilization
- **Zoom Controls**: Standard Leaflet zoom controls

#### Map Markers
**Status-based Markers**
- **Critical**: Red pulsing markers with animation
- **Warning**: Orange markers
- **Normal**: Green markers
- **Offline**: Gray markers
- **Selected**: Blue border highlighting

**Marker Interactions**
- **Click**: Select facility and center map
- **Popup**: Facility details on hover/click
- **Navigation**: Direct links to monitoring dashboards

#### Map Features
- **Clustering**: Marker clustering for dense areas
- **Bounds Fitting**: Auto-zoom to show all facilities
- **Coordinate Editing**: Manual GPS coordinate adjustment
- **High Zoom Toggle**: Enhanced detail viewing

### 4. Modal Dialogs

#### Grafana Modal
- **Purpose**: Embedded Grafana dashboard preview
- **Time Range Selection**: Configurable time periods
- **Full Dashboard Access**: Direct navigation links
- **Iframe Integration**: Secure dashboard embedding

#### GPS Editing Modal
- **Coordinate Input**: Manual latitude/longitude entry
- **Validation**: Geographic coordinate validation
- **Update Functionality**: Database coordinate updates
- **Real-time Preview**: Map marker position updates

## Functions & Logic

### Core Functions

#### Facility Status Analysis
```typescript
const analyzeObjectTemperature = (obj: ObjectItem) => {
  // Temperature threshold analysis
  // Data freshness validation (< 24h)
  // Critical/warning/normal/offline classification
  return {
    status: 'critical' | 'warning' | 'normal' | 'offline',
    offline: boolean,
    lastUpdate: Date | null,
    reason: string
  };
};
```

#### Marker Creation
```typescript
const createStatusIcon = (status: string, isSelected: boolean) => {
  // Dynamic SVG marker generation
  // Color coding based on status
  // Size differentiation for selection
  // Pulsing animation for critical status
};
```

#### Map Interactions
- **Facility Selection**: Click handlers for marker and list items
- **Map Centering**: Auto-center on selected facilities
- **Bounds Calculation**: Dynamic viewport adjustment
- **Zoom Management**: Intelligent zoom level management

#### Data Filtering
- **Multi-criteria Filtering**: Search term, status, mandant
- **Real-time Updates**: Instant filter application
- **Performance Optimization**: Efficient filtering algorithms

### State Management

#### Local State
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'normal' | 'offline'>('all');
const [mandantFilter, setMandantFilter] = useState<'all' | number>('all');
const [selectedObject, setSelectedObject] = useState<ObjectItem | null>(null);
const [editingGPS, setEditingGPS] = useState<ObjectItem | null>(null);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [useHighZoom, setUseHighZoom] = useState(false);
const [showGrafanaModal, setShowGrafanaModal] = useState(false);
```

#### React Query Data
```typescript
// Facility data with real-time updates
const { data: objects, isLoading } = useQuery({
  queryKey: ["/api/objects"],
  refetchInterval: 30000, // 30-second updates
});

// Mandant data for filtering
const { data: mandates } = useQuery({
  queryKey: ["/api/mandants"],
});

// Temperature thresholds for status calculation
const { data: thresholds } = useQuery({
  queryKey: ["/api/settings/thresholds"],
});
```

## API Endpoints Used

### GET `/api/objects`
- **Purpose**: Retrieve all accessible facility objects with location data
- **Response**: Array of facility objects with coordinates and sensor data
- **Real-time**: 30-second refresh interval for status updates
- **Required Fields**: `id`, `latitude`, `longitude`, `fltemp`, `rttemp`, `objanlage`

### GET `/api/mandants`
- **Purpose**: Retrieve client organizations for filtering
- **Response**: Array of mandant objects
- **Usage**: Populates mandant filter dropdown

### GET `/api/settings/thresholds`
- **Purpose**: Retrieve temperature threshold configurations
- **Response**: Array of threshold settings by category
- **Usage**: Status calculation for facility monitoring

### PUT `/api/objects/:id/coordinates`
- **Purpose**: Update facility GPS coordinates
- **Request Body**: `{ latitude: number, longitude: number }`
- **Usage**: Manual coordinate correction functionality

## Database Calls

### Facility Data
- **Table**: `objects` (facilities)
- **Fields**: `id`, `objectid`, `name`, `latitude`, `longitude`, `city`, `postal_code`
- **Joins**: Temperature data, mandant relationships
- **Real-time**: Sensor data freshness validation

### Mandant Data
- **Table**: `mandants`
- **Fields**: `id`, `name`, `settings`
- **Purpose**: Multi-tenant filtering support

### Threshold Configuration
- **Table**: `settings`
- **Category**: `thresholds`
- **Fields**: Temperature limits and alert configurations
- **Purpose**: Status classification logic

## Required Files & Components

### Core Files
- `client/src/pages/Maps.tsx` - Main map page component
- `client/src/components/ui/card.tsx` - UI containers
- `client/src/components/ui/badge.tsx` - Status indicators
- `client/src/components/ui/button.tsx` - Interactive buttons
- `client/src/components/ui/input.tsx` - Search and coordinate inputs

### External Libraries
- **React Leaflet**: Map rendering and interactions
- **Leaflet**: Core mapping library
- **Lucide Icons**: UI icons and markers

### Map Assets
- **Marker Icons**: Custom SVG markers with status colors
- **Leaflet CSS**: Map styling and themes
- **OpenStreetMap Tiles**: Base map tile layer

## Navigation & Routing

### Incoming Routes
- `/maps` - Main facility map route
- `/maps?filter=critical` - Pre-filtered critical facilities view

### Outgoing Navigation
- **Grafana Dashboards**: Direct links to monitoring interfaces
- **Facility Details**: Navigation to detailed facility views
- **Coordinate Updates**: AJAX updates without navigation

### Route Parameters
- **filter**: Optional status filter (e.g., `?filter=critical`)

## Security Considerations

### Data Access Control
- **Facility Filtering**: User permission-based object access
- **Mandant Isolation**: Client-specific data separation
- **API Security**: Authenticated endpoint access only

### Location Data Privacy
- **GPS Coordinates**: Secure storage and transmission
- **Access Logging**: Coordinate update auditing
- **Data Encryption**: Sensitive location data protection

## Performance Considerations

### Map Optimization
- **Marker Clustering**: Efficient rendering of dense facility areas
- **Lazy Loading**: Progressive marker loading
- **Bounds Optimization**: Intelligent viewport management
- **Memory Management**: Efficient marker cleanup

### Data Management
- **Real-time Updates**: 30-second refresh intervals
- **Caching Strategy**: React Query caching with invalidation
- **Filter Performance**: Client-side filtering for responsiveness
- **Background Updates**: Non-blocking data synchronization

## Error Handling

### Map Loading Errors
- **Tile Loading**: Fallback tile handling
- **Marker Errors**: Graceful marker rendering failures
- **Geolocation Errors**: Coordinate validation and error display

### API Failures
- **Data Loading**: Skeleton UI and retry logic
- **Update Failures**: User feedback for coordinate updates
- **Network Issues**: Offline mode with cached data

## Loading States

### Initial Loading
- **Skeleton Sidebar**: Placeholder facility list
- **Map Loading**: Progressive map tile loading
- **Data Fetching**: Loading indicators for API calls

### Real-time Updates
- **Status Updates**: Live status indicator changes
- **Marker Updates**: Dynamic marker color changes
- **Filter Updates**: Instant filter application feedback

## Browser Compatibility

### Supported Features
- **Geolocation API**: GPS coordinate handling
- **Canvas/WebGL**: High-performance map rendering
- **CSS Grid/Flexbox**: Responsive layout management
- **ES6 Modules**: Modern JavaScript module system

### Progressive Enhancement
- **JavaScript Required**: Full map functionality requires JS
- **Fallback Display**: Basic facility list without map
- **Feature Detection**: Modern API usage with fallbacks

## Mobile Responsiveness

### Adaptive Layout
- **Collapsible Sidebar**: Space-efficient mobile design
- **Touch Interactions**: Optimized for touch interfaces
- **Responsive Markers**: Appropriate marker sizes for screens
- **Gesture Support**: Pinch-to-zoom and pan gestures

### Performance Optimization
- **Reduced Detail**: Lower resolution tiles on mobile
- **Simplified Markers**: Streamlined marker design for small screens
- **Touch Targets**: Adequate button and marker sizes

## Integration Features

### Grafana Integration
- **Dashboard Access**: Direct links to facility monitoring
- **Modal Previews**: Embedded dashboard previews
- **Time Range Control**: Configurable monitoring periods
- **Seamless Navigation**: Single-click dashboard access

### Real-time Monitoring
- **Status Updates**: Live facility status monitoring
- **Temperature Alerts**: Real-time temperature violation detection
- **Notification System**: Alert integration capabilities
- **Historical Trends**: Time-based status analysis

### Administrative Features
- **GPS Correction**: Manual coordinate adjustment tools
- **Bulk Operations**: Multi-facility management capabilities
- **Export Functions**: Facility data export features
- **Audit Trails**: Location and access change logging
