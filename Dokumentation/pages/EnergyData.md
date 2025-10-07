# EnergyData Page Documentation

## Overview
The EnergyData page (`/energy-data`) serves as a comprehensive energy data management interface for the Netzwächter monitoring system. It provides facilities for viewing, creating, and managing energy consumption data across different heating systems, with advanced filtering, trend analysis, and data visualization capabilities.

## Page Content & Layout

### 1. Page Container
- **Layout**: Two-column grid layout (`grid-cols-2 gap-6`)
- **Responsive**: Full-height container with padding
- **Structure**: Side-by-side panels for system selection and data display

### 2. Left Panel - System Selection

#### Header Section
- **Title**: "Energiedaten" with lightning bolt icon
- **Action Button**: "Daten eingeben" (Add Data) - only visible when system selected
- **Icon**: `BoltIcon` with primary color styling

#### Search Functionality
- **Search Input**: Text input with search icon
- **Placeholder**: "Anlagen suchen..." (Search systems...)
- **Real-time Filtering**: Filters by system name and systemId
- **State**: `searchTerm` (controlled input)

#### System List
- **Display**: Scrollable list (`max-h-96 overflow-y-auto`)
- **Item Styling**: Card-like appearance with border and hover effects
- **Selection State**: Blue border and background for selected system
- **System Information**:
  - System name (bold)
  - System ID (smaller text)
  - System type (capitalized, fallback to "Unbekannt")
  - Efficiency percentage (if available)

#### Empty State
- **Icon**: Large lightning bolt icon
- **Message**: "Keine Anlagen gefunden" / "Überprüfen Sie Ihre Suchkriterien"

### 3. Right Panel - Energy Data Display

#### Header Section
- **Dynamic Title**: Shows selected system name or "Anlage auswählen"
- **Date Range Controls**: Two date inputs (start/end) - only visible with selected system
- **Default Range**: Last 30 days from current date

#### Summary Cards (2x2 Grid)
**Average Consumption Card**
- **Metric**: Average energy consumption across date range
- **Calculation**: Sum of all `energyConsumption` values divided by count
- **Unit**: kWh with one decimal place
- **Trend Indicator**: Shows percentage change with up/down arrows
- **Color Coding**: Green for decreasing consumption (positive), red for increasing

**Average Renewable Share Card**
- **Metric**: Average renewable energy percentage
- **Calculation**: Sum of all `renewableShare` values divided by count
- **Unit**: Percentage with one decimal place
- **Trend Indicator**: Shows percentage change
- **Color Coding**: Green for increasing renewable share (positive), red for decreasing

#### Data Table
- **Columns**: Datum, Verbrauch (kWh), Regenerativ (%), CO₂ (kg), Kosten (EUR)
- **Row Limit**: Shows first 10 entries only
- **Date Formatting**: German locale (`de-DE`)
- **Value Formatting**: One decimal place for consumption/CO₂, two for costs
- **Fallback Display**: "N/A" for missing values

#### Load More Button
- **Condition**: Only shows if more than 10 entries exist
- **Text**: "Weitere {count} Einträge anzeigen"
- **Styling**: Outline variant button

#### Empty States
**No System Selected**
- **Icon**: Lightning bolt icon
- **Message**: "Wählen Sie eine Anlage aus der Liste"

**No Data Available**
- **Icon**: Calendar icon
- **Message**: "Keine Energiedaten vorhanden" / "Erfassen Sie neue Daten für diese Anlage"

### 4. Data Entry Dialog

#### Trigger
- **Button**: "Daten eingeben" in left panel header
- **Condition**: Only enabled when system is selected
- **Dialog**: Modal overlay with form

#### Form Fields
**Record Date** (Required)
- **Type**: Date input
- **Label**: "Datum*"
- **Default**: Current date
- **Validation**: Required field

**Energy Consumption**
- **Type**: Number input (step: 0.001)
- **Label**: "Energieverbrauch (kWh)"
- **Placeholder**: "z.B. 1250.5"
- **Optional**: Can be left empty

**Renewable Share**
- **Type**: Number input (step: 0.01)
- **Label**: "Regenerativanteil (%)"
- **Placeholder**: "z.B. 45.5"
- **Optional**: Can be left empty

**CO₂ Emissions**
- **Type**: Number input (step: 0.001)
- **Label**: "CO₂-Emissionen (kg)"
- **Placeholder**: "z.B. 125.5"
- **Optional**: Can be left empty

**Cost**
- **Type**: Number input (step: 0.01)
- **Label**: "Kosten (EUR)"
- **Placeholder**: "z.B. 89.50"
- **Optional**: Can be left empty

**Temperature**
- **Type**: Number input (step: 0.1)
- **Label**: "Temperatur (°C)"
- **Placeholder**: "z.B. 21.5"
- **Optional**: Can be left empty

**Humidity**
- **Type**: Number input (step: 0.1)
- **Label**: "Luftfeuchtigkeit (%)"
- **Placeholder**: "z.B. 65.5"
- **Optional**: Can be left empty

#### Form Actions
- **Cancel Button**: "Abbrechen" - closes dialog without saving
- **Submit Button**: "Speichern" - creates new record
- **Loading State**: Button disabled during submission

## Functions & Logic

### Core Functions

#### `calculateTrend(data, field)`
- **Purpose**: Calculates percentage change trend for a data field
- **Parameters**: `data` (array), `field` (string)
- **Logic**:
  1. Sorts data by record date (chronological)
  2. Compares latest vs previous values
  3. Calculates percentage change: `((latest - previous) / previous) * 100`
  4. Determines if trend is positive (varies by field)
- **Returns**: `{ trend: number, isPositive: boolean }`
- **Special Logic**: Renewable share considers increase positive, consumption decrease positive

#### `openNewEntry()`
- **Purpose**: Prepares form for new data entry
- **Validation**: Requires selected system
- **Actions**:
  - Resets form with current date and selected system ID
  - Opens dialog modal
  - Clears all optional fields

#### `onSubmit(data)`
- **Purpose**: Handles form submission
- **Parameters**: Validated form data
- **Action**: Triggers `createDataMutation.mutate(data)`

### Data Processing

#### System Filtering
```typescript
const filteredSystems = Array.isArray(systems) ? systems.filter((system: any) =>
  system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  system.systemId.toLowerCase().includes(searchTerm.toLowerCase())
) : [];
```

#### Data Aggregation
- **Average Calculations**: Sum divided by count for consumption and renewable share
- **Trend Analysis**: Percentage change between latest and previous values
- **Date Sorting**: Chronological sorting for trend calculations

## Variables & State

### React State
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [selectedSystem, setSelectedSystem] = useState<any>(null);
const [dialogOpen, setDialogOpen] = useState(false);
const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
});
```

### Form State (React Hook Form)
```typescript
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
```

### React Query States
```typescript
// System data
const { data: systems, isLoading: systemsLoading } = useQuery({
  queryKey: ["/api/heating-systems"],
});

// Energy data (conditional on selected system)
const { data: energyData, isLoading: energyDataLoading } = useQuery({
  queryKey: ["/api/energy-data", selectedSystem?.id, dateRange.start, dateRange.end],
  enabled: !!selectedSystem,
});

// Data creation mutation
const createDataMutation = useMutation({
  mutationFn: async (data) => await apiRequest("POST", "/api/energy-data", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/energy-data"] });
    setDialogOpen(false);
    form.reset();
    toast({ title: "Erfolg", description: "Energiedaten erfolgreich gespeichert" });
  },
  onError: (error) => {
    if (isUnauthorizedError(error)) {
      // Handle logout scenario
    }
    toast({ title: "Fehler", description: "Energiedaten konnten nicht gespeichert werden" });
  },
});
```

## API Endpoints Used

### GET `/api/heating-systems`
- **Purpose**: Retrieves all available heating systems
- **Response**: Array of system objects
- **Caching**: React Query default caching
- **Usage**: Populates system selection list
- **Required Fields**: `id`, `name`, `systemId`, `type`, `efficiency`

### GET `/api/energy-data`
- **Purpose**: Retrieves energy data for specific system and date range
- **Query Parameters**:
  - `systemId`: System identifier (URL parameter)
  - `startDate`: Date range start (query parameter)
  - `endDate`: Date range end (query parameter)
- **Response**: Array of energy data records
- **Conditional**: Only called when system is selected
- **Structure**:
  ```json
  [{
    "id": "number",
    "recordDate": "string",
    "energyConsumption": "number",
    "renewableShare": "number",
    "co2Emissions": "number",
    "cost": "number"
  }]
  ```

### POST `/api/energy-data`
- **Purpose**: Creates new energy data record
- **Request Body**:
  ```json
  {
    "systemId": "number",
    "recordDate": "string",
    "energyConsumption": "number?",
    "renewableShare": "number?",
    "co2Emissions": "number?",
    "cost": "number?",
    "temperature": "number?",
    "humidity": "number?"
  }
  ```
- **Success Response**: Created record data
- **Error Handling**: Unauthorized logout redirect, validation errors

## Database Calls

### Systems Query
- **Table**: `heating_systems` or equivalent
- **Fields**: `id`, `name`, `system_id`, `type`, `efficiency`
- **Filtering**: User permissions (accessible systems only)
- **Purpose**: System selection dropdown/population

### Energy Data Queries
**Read Operation**:
- **Table**: `energy_data`
- **Fields**: All energy-related fields
- **Filtering**: By system ID and date range
- **Sorting**: By record date (implicit via API)
- **Purpose**: Display historical energy data

**Create Operation**:
- **Table**: `energy_data`
- **Fields**: All form fields plus timestamps
- **Validation**: Foreign key constraints, data type validation
- **Purpose**: Insert new energy consumption records

### Audit Trail
- **Table**: `user_activity_logs` or equivalent
- **Fields**: `user_id`, `action`, `resource_type`, `resource_id`, `timestamp`
- **Purpose**: Track data creation and access for compliance

## Required Files & Components

### Core Files
- `client/src/pages/EnergyData.tsx` - Main page component
- `client/src/components/ui/card.tsx` - Card containers
- `client/src/components/ui/button.tsx` - Action buttons
- `client/src/components/ui/input.tsx` - Form inputs and search
- `client/src/components/ui/select.tsx` - Selection components
- `client/src/components/ui/dialog.tsx` - Modal dialogs
- `client/src/components/ui/table.tsx` - Data display tables
- `client/src/components/ui/form.tsx` - Form components
- `client/src/lib/queryClient.ts` - API request utilities

### External Libraries
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers/zod**: Form validation integration
- **@tanstack/react-query**: Data fetching and caching
- **Lucide Icons**: UI icons (BoltIcon, PlusIcon, CalendarIcon, etc.)

### Custom Hooks
- `client/src/hooks/use-toast.ts` - Notification system
- `client/src/lib/authUtils.ts` - Authentication utilities

## Navigation & Routing

### Incoming Routes
- `/energy-data` - Main energy data management route

### Outgoing Navigation
- **No direct navigation**: Page focuses on data management
- **Potential**: Error handling may redirect to login on auth failure

### Route Parameters
- **None**: Standalone page without URL parameters

## Security Considerations

### Authentication
- **Session-based**: Requires active user session
- **API Security**: All endpoints protected with authentication
- **Unauthorized Handling**: Automatic logout redirect on 401 responses

### Data Access Control
- **System Filtering**: Users only see accessible heating systems
- **Permission Checks**: Database queries include user permission filters
- **Audit Logging**: Data creation and access may be logged

### Input Validation
- **Client-side**: Zod schema validation
- **Server-side**: Database constraints and API validation
- **Type Safety**: TypeScript with strict typing
- **Sanitization**: React automatic XSS prevention

## Error Handling

### API Errors
- **Loading States**: Skeleton UI during data fetching
- **Empty States**: User-friendly messages for no data
- **Error Toasts**: Descriptive error messages via toast system
- **Unauthorized**: Automatic logout and redirect

### Form Validation
- **Field-level**: Individual field validation messages
- **Required Fields**: Date field mandatory validation
- **Type Validation**: Number inputs with appropriate constraints
- **Submission Errors**: Mutation error handling with user feedback

## Performance Considerations

### Data Loading Strategy
- **Conditional Queries**: Energy data only loads when system selected
- **Caching**: React Query caching for systems data
- **Pagination**: Table limited to 10 rows with "load more" option
- **Lazy Loading**: Dialog and form components loaded on demand

### Optimization Features
- **Search Debouncing**: Real-time search without performance impact
- **Memoization**: Trend calculations cached per render
- **Virtual Scrolling**: Potential for large datasets (not implemented)
- **Background Updates**: Query invalidation for data consistency

## Loading States

### System Loading
- **Skeleton Cards**: 2x2 grid of animated placeholders
- **Full Page**: Covers entire left panel during loading

### Energy Data Loading
- **Skeleton Rows**: 3 animated placeholder rows
- **Conditional**: Only shows when system is selected

### Form Submission
- **Button Disabled**: Submit button disabled during creation
- **Loading Text**: Button text changes to indicate processing
- **Dialog Locked**: Modal remains open during submission

## Accessibility Features

### Form Accessibility
- **Labels**: All form fields have associated labels
- **Required Indicators**: Visual and semantic required field marking
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Semantic HTML structure and ARIA attributes

### Data Table Accessibility
- **Table Headers**: Proper table structure with headers
- **Cell Association**: Data cells associated with column headers
- **Keyboard Navigation**: Arrow key navigation support
- **Screen Reader**: Table announced as data table

### Visual Feedback
- **Focus States**: Clear focus indicators on interactive elements
- **Hover States**: Visual feedback on clickable elements
- **Loading States**: Clear indication of asynchronous operations
- **Error States**: Color-coded error messages and validation feedback

## Browser Compatibility

### Supported Features
- **Modern JavaScript**: ES6+ features and syntax
- **Date Input**: HTML5 date input support
- **Number Input**: HTML5 number input with step validation
- **CSS Grid/Flexbox**: Modern layout systems
- **CSS Custom Properties**: Dynamic theming support

### Progressive Enhancement
- **JavaScript Required**: Full functionality requires JavaScript
- **Graceful Degradation**: Basic HTML structure maintained
- **Feature Detection**: Modern API usage with fallbacks

### Mobile Responsiveness
- **Responsive Grid**: 2-column layout adapts to screen size
- **Touch Targets**: Adequate button and input sizes
- **Scrollable Areas**: Horizontal scroll for data tables on small screens
- **Date Pickers**: Native mobile date picker support
