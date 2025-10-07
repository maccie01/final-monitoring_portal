# TemperatureAnalysis Page Documentation

## Overview
The TemperatureAnalysis page (`/temperature-analysis`, `/temperatur-analyse`) provides comprehensive temperature monitoring and efficiency analysis for individual facilities in the Netzwächter system. It displays real-time temperature data alongside efficiency metrics, allowing users to monitor heating system performance and identify optimization opportunities.

## Page Content & Layout

### 1. Page Structure
- **Layout**: Two-panel horizontal layout (`min-h-screen`)
- **Background**: Gray background (`bg-gray-50`)
- **Responsive**: Flexible panel widths with overflow handling

### 2. Left Panel - Object Selection (1/3 width)

#### Header Section
- **Title**: "Portfolio Objekte" with MapPin icon
- **Object Count**: Dynamic count display (`{objects.length} Objekte verfügbar`)
- **Consumption Summary**: Portfolio consumption info box
  - Area: "120.059 m²" (hardcoded for demo)
  - Consumption: "7.634.633 kWh" (hardcoded for demo)
  - Styling: Blue background with border

#### Object List
- **Scroll Area**: `overflow-y-auto` with flex-1 height
- **Loading State**: Skeleton animation with 3 placeholder cards
- **Empty State**: No specific empty state handling

#### Object Cards
- **Selection**: Clickable cards with hover and selection states
- **Selected State**: Blue ring and background (`ring-2 ring-blue-500 bg-blue-50`)
- **Hover State**: Gray background (`hover:bg-gray-50`)

**Object Information**:
- **Name**: Primary display (`font-medium text-gray-900`)
- **Object ID**: Secondary info (`text-gray-600`)
- **Location**: Postal code and city (`text-gray-500`)
- **Status Badge**: Active/inactive status with appropriate colors

### 3. Right Panel - Analysis Display (2/3 width)

#### Header Section
- **Title**: "Temperatur & Effizienz-Analyse" with Thermometer icon
- **Selected Object Info**: Name, postal code, and city when object selected
- **Border**: Bottom border separation (`border-b border-gray-200`)

#### Content Area
- **Background**: Gray background (`bg-gray-50`)
- **Padding**: Standard padding (`p-6`)
- **Flex Layout**: Full height flex container

#### Empty State (No Object Selected)
- **Card Layout**: Centered content card taking full height
- **Icon**: Large thermometer icon (`h-16 w-16 text-gray-400`)
- **Title**: "Objekt auswählen"
- **Description**: Instructions to select an object from the left panel

#### Chart Display (Object Selected)
- **Component**: `TemperatureEfficiencyChart`
- **Props**:
  - `objektid`: Selected object's ID
  - `zeitraum`: Current time range selection
  - `onTimeRangeChange`: Callback to update time range

### 4. InfoText Component

#### Purpose
- **Dynamic Content**: Loads text content from database settings
- **Configuration**: Category and key-based content retrieval
- **Styling**: Blue-colored title with gray subtitle

#### States
- **Loading**: "Lade InfoText..." message
- **Error**: Error message display with red text
- **Success**: Displays loaded InfoText content
- **Empty**: "InfoText nicht gefunden" when no content available

## Functions & Logic

### Core Functions

#### Object Selection
- **State Management**: `selectedObject` state with ObjectType
- **Click Handler**: `setSelectedObject(object)` on card click
- **Persistence**: No persistence, resets on page refresh

#### Time Range Management
- **State**: `timeRange` with predefined options
- **Options**: "last-year", "last-365-days", "last-2year"
- **Default**: "last-year"
- **Propagation**: Passed to chart component for data filtering

### Data Fetching

#### Objects Query
```typescript
const { data: objects = [], isLoading: objectsLoading } = useQuery<ObjectType[]>({
  queryKey: ["/api/objects"],
});
```
- **Purpose**: Retrieve all accessible facility objects
- **Caching**: React Query default caching
- **Type Safety**: Explicit ObjectType array typing

#### Settings Query (InfoText)
```typescript
const { data: settings, isLoading, error } = useQuery({
  queryKey: ["/api/settings", category],
  queryFn: async () => {
    const response = await fetch(`/api/settings?category=${category}`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },
});
```
- **Purpose**: Load dynamic text content from settings
- **Filtering**: Finds setting by `key_name`
- **Error Handling**: Graceful error display

## Variables & State

### React State
```typescript
const [selectedObject, setSelectedObject] = useState<ObjectType | null>(null);
const [timeRange, setTimeRange] = useState<"last-year" | "last-365-days" | "last-2year">("last-year");
```

### Type Definitions
```typescript
interface ObjectType {
  id: number;
  objectid: number;
  name: string;
  postalCode: string;
  city: string;
  status: string;
}
```

### React Query Data
```typescript
// Objects data
const { data: objects = [], isLoading: objectsLoading } = useQuery<ObjectType[]>({
  queryKey: ["/api/objects"],
});

// Settings data (for InfoText component)
const { data: settings, isLoading, error } = useQuery({
  queryKey: ["/api/settings", category],
  queryFn: async () => fetch(`/api/settings?category=${category}`).then(r => r.json())
});
```

## API Endpoints Used

### GET `/api/objects`
- **Purpose**: Retrieve all accessible facility objects
- **Response**: Array of facility objects with metadata
- **Required Fields**: `id`, `objectid`, `name`, `postalCode`, `city`, `status`
- **Caching**: React Query automatic caching
- **Authentication**: Session-based, filtered by user permissions

### GET `/api/settings?category=:category`
- **Purpose**: Retrieve settings by category for InfoText component
- **Parameters**: `category` (query parameter)
- **Response**: Array of settings objects
- **Usage**: Dynamic content loading for informational text
- **Authentication**: Required for settings access

## Database Calls

### Objects Query
- **Table**: `objects` (or facilities)
- **Fields**: `id`, `objectid`, `name`, `postal_code`, `city`, `status`
- **Filtering**: User permission-based access control
- **Purpose**: Display facility selection list

### Settings Query
- **Table**: `settings`
- **Fields**: `category`, `key_name`, `value` (JSON)
- **Filtering**: `WHERE category = ? AND key_name = ?`
- **Purpose**: Load dynamic UI content and configuration

### Temperature Data (via Chart Component)
- **Delegation**: TemperatureEfficiencyChart component handles data fetching
- **Endpoints**: Likely `/api/temperature-data/:objectId` or similar
- **Purpose**: Real-time temperature monitoring data

## Required Files & Components

### Core Files
- `client/src/pages/TemperatureAnalysis.tsx` - Main page component
- `client/src/components/TemperatureEfficiencyChart.tsx` - Chart visualization
- `client/src/components/ui/card.tsx` - Card containers
- `client/src/components/ui/badge.tsx` - Status indicators

### External Dependencies
- **React Query**: Data fetching (`useQuery`)
- **Lucide Icons**: `Thermometer`, `MapPin`
- **TypeScript**: Type-safe interfaces and state management

## Navigation & Routing

### Incoming Routes
- `/temperature-analysis` - Main temperature analysis route
- `/temperatur-analyse` - German language alternative route

### Outgoing Navigation
- **No direct navigation**: Analysis page stays within monitoring context
- **Object Selection**: Changes displayed data without route changes

### Route Parameters
- **None**: Standalone analysis page without URL parameters

## Security Considerations

### Authentication
- **Session Required**: Requires active user session
- **Object Filtering**: Only accessible objects displayed
- **API Security**: All endpoints protected with authentication

### Data Access Control
- **Permission-based**: Objects filtered by user access permissions
- **Settings Access**: InfoText content requires appropriate permissions
- **Audit Trail**: Object access may be logged for monitoring

## Performance Considerations

### Data Loading Strategy
- **Lazy Loading**: Chart component loads data only when object selected
- **Caching**: React Query caching for objects and settings
- **Incremental Loading**: Object list loads immediately, chart data loads on demand

### Optimization Features
- **Virtual Scrolling**: Object list could benefit from virtualization (not implemented)
- **Debounced Selection**: No debouncing needed for simple selection
- **Memory Management**: Minimal state, data cached by React Query

## Loading States

### Objects Loading
- **Skeleton UI**: Three animated placeholder cards
- **Layout Preservation**: Maintains page structure during loading
- **Progressive Enhancement**: Content appears as data loads

### Settings Loading (InfoText)
- **Inline Loading**: "Lade InfoText..." message
- **Error States**: Red error text for failed loads
- **Graceful Degradation**: Shows without InfoText if loading fails

## Error Handling

### API Failures
- **Objects Loading**: Skeleton UI, no specific error state
- **Settings Loading**: Error message display in InfoText component
- **Chart Loading**: Handled by TemperatureEfficiencyChart component

### Network Errors
- **Retry Logic**: React Query automatic retries
- **User Feedback**: Error messages in appropriate locations
- **Graceful Degradation**: Page remains functional with partial failures

## Browser Compatibility

### Supported Features
- **Modern JavaScript**: ES6+ features and React 18
- **CSS Grid/Flexbox**: Modern layout systems
- **Responsive Design**: Flexible panel widths
- **Touch Support**: Click/tap interactions

### Progressive Enhancement
- **JavaScript Required**: Chart functionality requires JS
- **Graceful Degradation**: Object list works without JS
- **Feature Detection**: Modern APIs used with fallbacks

## Accessibility Features

### Keyboard Navigation
- **Object Selection**: Arrow keys and Enter for selection
- **Focus Management**: Proper focus indicators on interactive elements
- **Screen Reader**: Semantic HTML structure with proper headings

### Visual Feedback
- **Selection States**: Clear visual indication of selected objects
- **Loading States**: Skeleton UI provides loading feedback
- **Hover States**: Interactive elements show hover effects

### Content Structure
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader accessible content
- **Color Contrast**: High contrast text and backgrounds

## Integration Points

### TemperatureEfficiencyChart Component
- **Data Source**: Temperature and efficiency data APIs
- **Time Range Control**: Receives and updates time range state
- **Object Context**: Uses selected object ID for data fetching
- **Visualization**: Charts combining temperature and efficiency metrics

### InfoText Component
- **Dynamic Content**: Database-driven UI text
- **Configuration**: Category/key-based content management
- **Fallback**: Graceful handling of missing content

### Portfolio Integration
- **Object Management**: Integrates with facility management system
- **Consumption Display**: Shows aggregate portfolio metrics
- **Status Monitoring**: Real-time facility status indicators
