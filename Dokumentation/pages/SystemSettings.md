# SystemSettings Page Documentation

## Overview
The SystemSettings page (`/system-settings`, `/setup`) is a comprehensive administrative interface for configuring and managing all system-wide settings in the Netzwächter monitoring platform. It provides superadmin-level access to temperature thresholds, Grafana configurations, database settings, portal configurations, API testing, and Grafana testing functionality.

## Page Content & Layout

### 1. Page Header
- **Title**: "Systemeinstellungen" (System Settings)
- **Icon**: Cog icon with primary color
- **Layout**: Full-width page with padding

### 2. Tab Navigation (6 Tabs)
The page uses a horizontal tab layout with 6 main sections:

#### **Tab 1: Temperatur-Grenzwerte** (Temperature Thresholds)
- **Icon**: Thermometer
- **Purpose**: Configure temperature monitoring thresholds for heating systems
- **Content**:
  - Threshold configuration table
  - Create/Edit threshold dialogs
  - Color-coded threshold levels (normal/warning/critical)
  - VL/RL temperature ranges per system type

#### **Tab 2: Grafana** (Grafana)
- **Icon**: BarChart3
- **Purpose**: Configure Grafana dashboard integrations and URLs
- **Content**:
  - Grafana configuration table
  - KPI dashboard URL settings
  - Dashboard type configurations
  - URL builder and tester

#### **Tab 3: Datenbank** (Database)
- **Icon**: Database
- **Purpose**: Database connection management and settings
- **Content**:
  - Current database connection status
  - Fallback database configuration
  - Database performance testing
  - Connection string management
  - SSL and authentication settings

#### **Tab 4: Portal-Setup** (Portal Setup)
- **Icon**: Settings
- **Purpose**: Configure portal-specific settings and integrations
- **Content**:
  - Portal configuration cards
  - Collapsible portal settings
  - System portal setup components
  - JSON configuration editors

#### **Tab 5: API-Tests** (API Tests)
- **Icon**: Code2
- **Purpose**: Test and validate API endpoints
- **Content**:
  - Embedded `ApiManagement` component
  - API endpoint testing interface
  - Response validation and debugging
  - Authentication testing

#### **Tab 6: GrafanaTest** (Grafana Test)
- **Icon**: BarChart3
- **Purpose**: Test and debug Grafana iframe integrations
- **Content**:
  - Grafana iframe URL builder
  - Panel and object ID testing
  - Dashboard embedding validation
  - Real-time iframe preview

## Functions & Logic

### Core Functions

#### Threshold Management
- **Create/Edit Thresholds**: Modal dialogs for threshold configuration
- **Validation**: Color and value range validation
- **Persistence**: Save to `/api/settings` endpoint
- **Real-time Updates**: Automatic cache invalidation

#### Grafana Configuration
- **URL Building**: Dynamic Grafana URL construction
- **Configuration Storage**: Key-value settings storage
- **Testing Integration**: Live iframe testing capabilities

#### Database Management
- **Connection Testing**: Real-time database connectivity checks
- **Performance Testing**: Query execution time measurement
- **Configuration Management**: Connection string and parameter editing

#### Portal Setup
- **Configuration Management**: Portal-specific settings
- **JSON Editing**: Advanced configuration via JSON editor
- **Validation**: Configuration schema validation

#### API Testing
- **Endpoint Testing**: Comprehensive API validation
- **Authentication Testing**: Session and token validation
- **Response Analysis**: Detailed API response inspection

#### Grafana Testing
- **URL Construction**: Dynamic iframe URL building
- **Parameter Testing**: Object ID, panel ID, and dashboard type testing
- **Preview Mode**: Real-time iframe rendering

### State Management

#### Local State
```typescript
const [activeTab, setActiveTab] = useState("temperatur");
const [editingThreshold, setEditingThreshold] = useState<ThresholdConfig | null>(null);
const [editingGrafana, setEditingGrafana] = useState<GrafanaConfig | null>(null);
const [editingEnergyData, setEditingEnergyData] = useState<EnergyDataConfig | null>(null);
const [isCreateMode, setIsCreateMode] = useState(false);
const [connectionStatus, setConnectionStatus] = useState<{
  status: 'checking' | 'ok' | 'error';
  lastCheck: Date | null;
  message: string;
}>({ status: 'checking', lastCheck: null, message: 'Noch nicht geprüft' });
```

#### React Query Data
```typescript
// Settings data
const { data: thresholds } = useQuery(["/api/settings/thresholds"]);
const { data: grafanaSettings } = useQuery(["/api/settings", "grafana"]);
const { data: energyDataSettings } = useQuery(["/api/settings", "energy-data"]);
const { data: allSettings } = useQuery(["/api/settings", "all"]);
const { data: portalConfigDetails } = useQuery(["/api/portal/config-details"]);

// Mutations
const saveMutation = useMutation({
  mutationFn: async (data) => apiRequest(data.id ? "PUT" : "POST", data.id ? `/api/settings/${data.id}` : "/api/settings", data),
  onSuccess: () => {
    // Invalidate all related caches
    queryClient.invalidateQueries({ queryKey: ["/api/settings/thresholds"] });
    queryClient.invalidateQueries({ queryKey: ["/api/settings", "grafana"] });
    // ... more invalidations
  }
});
```

## API Endpoints Used

### Settings Management
#### GET `/api/settings/thresholds`
- **Purpose**: Retrieve temperature threshold configurations
- **Response**: Array of threshold configurations with VL/RL values and colors

#### GET `/api/settings?category=grafana`
- **Purpose**: Retrieve Grafana-related settings
- **Response**: Array of Grafana configuration objects

#### GET `/api/settings?category=data`
- **Purpose**: Retrieve energy data and database settings
- **Response**: Array of data configuration objects

#### GET `/api/settings`
- **Purpose**: Retrieve all system settings
- **Response**: Complete settings array for configuration management

#### POST `/api/settings`
- **Purpose**: Create new setting configuration
- **Request Body**: Setting object with category, key_name, and value

#### PUT `/api/settings/:id`
- **Purpose**: Update existing setting configuration
- **Request Body**: Updated setting object

### Portal Configuration
#### GET `/api/portal/config-details`
- **Purpose**: Retrieve detailed portal configurations with passwords
- **Response**: Array of portal configurations with sensitive data

### Database Testing
#### GET `/api/status`
- **Purpose**: Test database connection status
- **Response**: Connection health and performance metrics

## Database Calls

### Settings Table Operations
- **Read**: `SELECT * FROM settings WHERE category = ?`
- **Create**: `INSERT INTO settings (category, key_name, value, user_id, mandant_id)`
- **Update**: `UPDATE settings SET value = ?, updated_at = NOW() WHERE id = ?`
- **Delete**: `DELETE FROM settings WHERE id = ?`

### Portal Configurations
- **Read**: `SELECT * FROM portal_configs` (with password decryption)
- **Update**: `UPDATE portal_configs SET config = ?, updated_at = NOW() WHERE id = ?`

### Audit Logging
- **Table**: `user_activity_logs`
- **Fields**: `user_id`, `action`, `resource_type`, `resource_id`, `timestamp`, `details`
- **Purpose**: Track all configuration changes for compliance

## Required Files & Components

### Core Files
- `client/src/pages/SystemSettings.tsx` - Main settings page
- `client/src/components/ui/tabs.tsx` - Tab navigation
- `client/src/components/ui/card.tsx` - Content containers
- `client/src/components/ui/table.tsx` - Data display tables
- `client/src/components/ui/dialog.tsx` - Modal dialogs

### Custom Components
- `client/src/components/PortalConfigCard.tsx` - Portal configuration display
- `client/src/components/SystemPortalSetup.tsx` - Portal setup interface
- `client/src/components/CollapsiblePortalCards.tsx` - Collapsible portal settings
- `client/src/components/CurrentDatabaseConnection.tsx` - Database status display
- `client/src/components/JsonConfigurationEditor.tsx` - JSON editing interface
- `client/src/components/PortalJsonEditor.tsx` - Portal JSON editor
- `client/src/components/FallbackDatabaseAccess.tsx` - Fallback database management
- `client/src/pages/ApiManagement.tsx` - Embedded API testing

### External Dependencies
- **React Query**: Data fetching and mutations
- **React Hook Form**: Form state management (used in dialogs)
- **Zod**: Configuration validation
- **Lucide Icons**: UI icons
- **Heroicons**: Additional icon set

## Navigation & Routing

### Incoming Routes
- `/system-settings` - Main system settings route
- `/setup` - Alternative settings route
- `/system-setup` - Alternative system setup route
- `/admin-dashboard` - May redirect to settings for superadmins

### Outgoing Navigation
- **No direct navigation**: Settings page stays within admin context
- **Error redirects**: May redirect to login on authentication failures

### Route Parameters
- **None**: Standalone administrative page

## Security Considerations

### Access Control
- **Superadmin Only**: Requires 'superadmin' role
- **Authentication Required**: Session-based authentication mandatory
- **Role Verification**: Server-side role checking on all operations

### Data Security
- **Sensitive Data**: Portal configurations include passwords
- **Encryption**: Password fields encrypted in database
- **Access Logging**: All configuration changes audited

### Input Validation
- **Client-side**: Form validation for all inputs
- **Server-side**: Database constraints and API validation
- **JSON Validation**: Schema validation for configuration objects

## Performance Considerations

### Data Loading Strategy
- **Parallel Queries**: Multiple settings categories loaded simultaneously
- **Caching**: React Query caching with intelligent invalidation
- **Lazy Loading**: Components loaded as needed
- **Background Updates**: Cache invalidation triggers UI updates

### Optimization Features
- **Debounced Updates**: Settings changes don't trigger excessive re-renders
- **Selective Refetching**: Only relevant caches invalidated on changes
- **Memory Management**: Large configuration objects handled efficiently

## Error Handling

### API Failures
- **Toast Notifications**: User-friendly error messages
- **Graceful Degradation**: Components show loading/error states
- **Retry Logic**: Automatic retries for transient failures

### Validation Errors
- **Field-level**: Individual field validation feedback
- **Form-level**: Overall form validation with error summaries
- **Server Errors**: API error responses displayed to user

## Loading States

### Initial Loading
- **Skeleton UI**: Loading placeholders for all major sections
- **Progressive Loading**: Content appears as data loads
- **Tab-specific**: Each tab loads its own data independently

### Mutation Loading
- **Button States**: Save buttons show loading during operations
- **Form Disabled**: Forms disabled during submission
- **Progress Indicators**: Visual feedback for long operations

## Browser Compatibility

### Supported Features
- **Modern JavaScript**: ES6+ features and async/await
- **JSON Editing**: Advanced JSON manipulation
- **File Upload**: Configuration file import/export
- **Iframe Embedding**: Grafana dashboard embedding

### Progressive Enhancement
- **JavaScript Required**: Full functionality requires modern JS
- **Graceful Degradation**: Basic HTML structure maintained
- **Feature Detection**: Modern APIs used with fallbacks

## Administrative Features

### Configuration Management
- **Centralized Settings**: All system settings in one interface
- **Version Control**: Settings changes tracked with timestamps
- **Backup/Restore**: Configuration export/import capabilities
- **Validation**: Real-time configuration validation

### Monitoring & Testing
- **Connection Testing**: Real-time database connectivity checks
- **API Validation**: Comprehensive endpoint testing
- **Grafana Integration**: Live iframe testing and validation
- **Performance Monitoring**: Query execution time measurement

### User Management Integration
- **Role-based Access**: Superadmin-only access to sensitive settings
- **Audit Trails**: Complete logging of configuration changes
- **Permission Inheritance**: Settings respect user permission hierarchies
