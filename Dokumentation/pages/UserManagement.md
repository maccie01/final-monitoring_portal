# UserManagement Page Documentation

## Overview
The UserManagement page (`/users`, `/UserManagement`, `/user-management`, `/User-Management`) serves as the comprehensive user administration interface for the Netzwächter system. It provides multi-tab functionality for managing users, mandates (clients), object groups, user profiles, and activity logs, with full CRUD operations and permission management.

## Page Content & Layout

### 1. Page Header
- **Title**: "Benutzerverwaltung" (User Management)
- **Icon**: UsersIcon with primary color
- **Layout**: Full-width page with tabbed interface

### 2. Tab Navigation (5 Tabs)
Horizontal tab layout with distinct sections for different administrative functions:

#### **Tab 1: Benutzer** (Users)
- **Icon**: UsersIcon
- **Purpose**: User account management and permissions
- **Content**:
  - User search and filtering
  - User creation/editing forms
  - Permission assignment (object access, roles)
  - User status management (active/inactive)
  - Password reset functionality

#### **Tab 2: Mandanten** (Mandates)
- **Icon**: ShieldCheckIcon
- **Purpose**: Client/organization management
- **Content**:
  - Mandant creation and configuration
  - Client-specific settings
  - Organization hierarchy management
  - Multi-tenant data separation

#### **Tab 3: Objektgruppen** (Object Groups)
- **Icon**: Building
- **Purpose**: Facility grouping and access control
- **Content**:
  - Object group creation and management
  - Facility categorization
  - Group-based permission assignment
  - Hierarchical object organization

#### **Tab 4: Profile** (Profiles)
- **Icon**: Settings
- **Purpose**: User profile and preference management
- **Content**:
  - User profile configuration
  - Start page preferences
  - UI customization settings
  - Notification preferences
  - Language and regional settings

#### **Tab 5: UserLog** (User Activity Log)
- **Icon**: Activity
- **Purpose**: User activity monitoring and audit trails
- **Content**:
  - User action logging
  - Login/logout tracking
  - Permission usage monitoring
  - Security event logging
  - Administrative action auditing

## Functions & Logic

### Core Functions

#### User Management
- **CRUD Operations**: Create, read, update, delete users
- **Password Management**: Secure password generation and reset
- **Permission Assignment**: Granular object-level permissions
- **Role Management**: User role assignment and validation
- **Status Control**: Active/inactive user state management

#### Mandant Management
- **Multi-tenant Support**: Client organization management
- **Data Isolation**: Mandant-specific data separation
- **Configuration**: Client-specific system settings
- **Hierarchy**: Parent-child mandant relationships

#### Object Group Management
- **Grouping Logic**: Facility categorization and grouping
- **Access Control**: Group-based permission assignment
- **Hierarchy Support**: Nested group structures
- **Bulk Operations**: Group-level permission management

#### Profile Management
- **User Preferences**: Customizable user experience
- **Start Page Configuration**: Default landing page selection
- **UI Customization**: Theme and layout preferences
- **Notification Settings**: Alert and notification preferences

#### Activity Logging
- **Audit Trail**: Complete user action tracking
- **Security Monitoring**: Login attempt and permission usage logging
- **Compliance**: Regulatory compliance through activity logs
- **Investigation**: Security incident investigation support

### State Management

#### Local State
```typescript
const [activeTab, setActiveTab] = useState("users");
const [searchTerm, setSearchTerm] = useState("");
const [selectedUser, setSelectedUser] = useState(null);
const [editingUser, setEditingUser] = useState(null);
const [userPermissions, setUserPermissions] = useState([]);
const [mandantFilter, setMandantFilter] = useState("all");
const [roleFilter, setRoleFilter] = useState("all");
```

#### React Query Data
```typescript
// User management
const { data: users } = useQuery(["/api/users"]);
const { data: userPermissions } = useQuery(["/api/user-permissions"]);
const { data: roles } = useQuery(["/api/roles"]);

// Mandant management
const { data: mandates } = useQuery(["/api/mandants"]);

// Object groups
const { data: objectGroups } = useQuery(["/api/object-groups"]);

// Activity logs
const { data: userLogs } = useQuery(["/api/user-activity-logs"]);

// Mutations
const createUserMutation = useMutation({
  mutationFn: (userData) => apiRequest("POST", "/api/users", userData),
  onSuccess: () => queryClient.invalidateQueries(["/api/users"])
});
```

## API Endpoints Used

### User Management
#### GET `/api/users`
- **Purpose**: Retrieve all users with permissions and roles
- **Response**: Array of user objects with profile data

#### POST `/api/users`
- **Purpose**: Create new user account
- **Request Body**: User data with permissions and profile

#### PUT `/api/users/:id`
- **Purpose**: Update existing user information
- **Request Body**: Updated user data

#### DELETE `/api/users/:id`
- **Purpose**: Deactivate or remove user account

#### POST `/api/users/:id/reset-password`
- **Purpose**: Reset user password and send notification

### Mandant Management
#### GET `/api/mandants`
- **Purpose**: Retrieve all client organizations
- **Response**: Array of mandant objects with configuration

#### POST `/api/mandants`
- **Purpose**: Create new client organization

#### PUT `/api/mandants/:id`
- **Purpose**: Update mandant configuration

### Object Groups
#### GET `/api/object-groups`
- **Purpose**: Retrieve facility groupings
- **Response**: Hierarchical object group structure

#### POST `/api/object-groups`
- **Purpose**: Create new object group

#### PUT `/api/object-groups/:id`
- **Purpose**: Update group configuration and permissions

### User Activity Logs
#### GET `/api/user-activity-logs`
- **Purpose**: Retrieve user action audit trail
- **Parameters**: Date range, user filter, action type
- **Response**: Chronological activity log entries

### Permission Management
#### GET `/api/user-permissions`
- **Purpose**: Retrieve granular permission assignments
- **Response**: User-object permission matrix

#### PUT `/api/user-permissions`
- **Purpose**: Update user permission assignments
- **Request Body**: Permission matrix updates

## Database Calls

### User Tables
- **users**: `SELECT * FROM users WHERE is_active = true`
- **user_profiles**: User preference and configuration data
- **user_permissions**: Object-level access permissions
- **user_roles**: Role assignments and capabilities

### Mandant Tables
- **mandants**: Client organization definitions
- **mandant_settings**: Client-specific configurations
- **mandant_users**: User-mandant relationships

### Object Groups
- **object_groups**: Facility grouping definitions
- **object_group_members**: Group membership assignments
- **group_permissions**: Group-level permission templates

### Activity Logging
- **user_activity_logs**: Complete audit trail of user actions
- **login_attempts**: Authentication attempt logging
- **permission_changes**: Permission modification tracking

## Required Files & Components

### Core Files
- `client/src/pages/UserManagement.tsx` - Main user management page
- `client/src/components/ui/tabs.tsx` - Tab navigation system
- `client/src/components/ui/table.tsx` - Data display tables
- `client/src/components/ui/dialog.tsx` - Modal forms and confirmations
- `client/src/components/ui/form.tsx` - Form validation and submission

### External Dependencies
- **React Query**: Data fetching and mutations
- **React Hook Form**: Complex form state management
- **Zod**: Form validation schemas
- **Lucide Icons**: UI icons and indicators

### Shared Schema
- `shared/schema.ts` - Database schema definitions
- User, mandant, and permission type definitions
- Form validation schemas

## Navigation & Routing

### Incoming Routes
- `/users` - Main user management route
- `/UserManagement` - Alternative route (PascalCase)
- `/user-management` - Hyphenated alternative
- `/User-Management` - Pascal case with hyphen alternative

### Outgoing Navigation
- **Stay in Context**: Most actions remain within user management
- **Profile Links**: May navigate to individual user profiles
- **Permission Changes**: May trigger dashboard refreshes

### Route Parameters
- **None**: Standalone administrative interface

## Security Considerations

### Access Control
- **Role-based Access**: Admin/superadmin role requirements
- **Permission Validation**: Server-side permission checking
- **Audit Logging**: All administrative actions logged
- **Session Security**: Secure session management

### Data Protection
- **Password Security**: Secure password hashing and storage
- **PII Protection**: Personal information encryption
- **Access Logging**: Comprehensive audit trails
- **Compliance**: GDPR and data protection compliance

### Authentication
- **Multi-factor**: Optional MFA support
- **Session Management**: Secure session handling
- **Password Policies**: Complexity requirements
- **Account Lockout**: Brute force protection

## Performance Considerations

### Data Loading Strategy
- **Lazy Loading**: Tab content loads on demand
- **Pagination**: Large user lists with pagination
- **Caching**: React Query caching for stable data
- **Background Updates**: Real-time permission synchronization

### Optimization Features
- **Search Debouncing**: Efficient user search with debouncing
- **Virtual Scrolling**: Large lists with performance optimization
- **Selective Updates**: Targeted cache invalidation
- **Background Processing**: Asynchronous permission updates

## Error Handling

### API Failures
- **Toast Notifications**: User-friendly error messages
- **Graceful Degradation**: Interface remains functional
- **Retry Logic**: Automatic retry for transient failures
- **Validation Feedback**: Form-level error display

### Permission Errors
- **Access Denied**: Clear permission error messages
- **Role Validation**: Real-time role checking
- **Fallback UI**: Restricted functionality for limited permissions

## Loading States

### Initial Loading
- **Skeleton UI**: Loading placeholders for all sections
- **Progressive Loading**: Content appears as data loads
- **Tab-specific**: Each tab loads independently

### Mutation Loading
- **Button States**: Action buttons show loading indicators
- **Form Disabled**: Forms disabled during submission
- **Progress Feedback**: Clear operation status indication

## Browser Compatibility

### Supported Features
- **Modern JavaScript**: ES6+ features and TypeScript
- **React 18**: Modern React patterns and hooks
- **Complex Forms**: Advanced form state management
- **Real-time Updates**: Live data synchronization

### Progressive Enhancement
- **JavaScript Required**: Full functionality requires JS
- **Graceful Degradation**: Basic viewing without editing
- **Feature Detection**: Modern API usage with fallbacks

## Administrative Features

### User Lifecycle Management
- **Onboarding**: Automated user creation and setup
- **Permission Assignment**: Granular access control
- **Profile Customization**: User preference management
- **Deactivation**: Secure account deactivation

### Organizational Management
- **Multi-tenant Support**: Client organization management
- **Hierarchical Permissions**: Nested permission structures
- **Group Management**: Facility and user grouping
- **Compliance Reporting**: Audit and compliance features

### Monitoring & Auditing
- **Activity Logging**: Complete user action tracking
- **Security Monitoring**: Authentication and access monitoring
- **Compliance Reports**: Regulatory compliance reporting
- **Incident Response**: Security event investigation tools
