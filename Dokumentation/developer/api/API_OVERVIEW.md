# API Overview - Netzwächter Monitoring System

## Table of Contents

1. [API Groups](#api-groups)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [API Categories](#api-categories)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)

## API Groups

This document provides a comprehensive overview of all APIs used in the Netzwächter monitoring system. The APIs are grouped by functionality:

### Core System APIs
- **[Authentication APIs](./auth_apis.md)** - User login, logout, session management
- **[Database APIs](./database_apis.md)** - Core database operations, settings, objects, mandants
- **[User Management APIs](./user_management_apis.md)** - User CRUD, profiles, permissions

### Monitoring & Data APIs
- **[Energy APIs](./energy_apis.md)** - Energy data, consumption, heating systems
- **[Efficiency APIs](./efficiency_apis.md)** - Efficiency analysis, performance metrics
- **[Temperature APIs](./temperature_apis.md)** - Temperature monitoring, analysis
- **[Weather APIs](./weather_apis.md)** - Outdoor temperature data

### Business Logic APIs
- **[Object Management APIs](./object_management_apis.md)** - Building/property management
- **[KI Report APIs](./ki_report_apis.md)** - AI-powered energy reports and analysis
- **[Portal APIs](./portal_apis.md)** - Portal configuration and settings

## Authentication

Most APIs require authentication via session-based authentication. The system supports:
- Standard user login via `/api/auth/user-login`
- Superadmin login via `/api/auth/superadmin-login`
- Session management with heartbeat mechanism
- Demo session fallback for development

### Authentication Headers
```
Session-based authentication (handled automatically by frontend)
```

## Public Endpoints

The following endpoints are accessible without authentication:

### ✅ Health Check
- `GET /api/health` - **WORKING**: Returns `{"status":"healthy","timestamp":"2025-10-07T09:35:46.560Z","version":"1.0.0"}`

### ✅ Weather Data APIs
- `GET /api/outdoor-temperatures/postal-code/:postalCode/latest` - Get latest temperature by postal code
- `GET /api/outdoor-temperatures/postal-code/:postalCode` - Get temperature history by postal code
- `POST /api/outdoor-temperatures/restore-climate-data` - Restore climate data
- `POST /api/outdoor-temperatures/import-2023-climate` - Import 2023 climate data

### ✅ Public Energy Data APIs
- `GET /api/public-daily-consumption/:objectId` - Get public daily consumption data
- `GET /api/public-monthly-consumption/:objectId` - Get public monthly consumption data
- `GET /api/monthly-netz/:objectId` - Get monthly netz data

### ✅ Test APIs
- `GET /api/test-efficiency-analysis/:objectId` - Test efficiency analysis

### ✅ Export APIs
- `POST /api/export/send-email` - Send PDF export via email

### ✅ Legacy Compatibility APIs
- `GET /api/temperature-efficiency-chart/:objectId` - Legacy endpoint for temperature efficiency charts (redirects to energy API)

## Authenticated Endpoints

The following endpoints require authentication via session cookies:

### ✅ Authentication APIs (`/api/auth/*`)
- `POST /api/auth/superadmin-login` - Superadmin login
- `POST /api/auth/user-login` - Standard user login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user info

### ✅ Core Database APIs (`/api/*`)
- `GET /api/status` - Database connection status
- `GET /api/objects` - Get all accessible objects
- `GET /api/mandants` - Get all mandants
- `GET /api/settings` - Get system settings
- `POST /api/settings` - Save system setting
- `GET /api/dashboard/kpis` - Get dashboard KPIs

### ✅ User Management APIs (`/api/users/*`)
- `GET /api/users/` - Get all users
- `POST /api/users/` - Create new user
- `GET /api/users/:id` - Get specific user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/change-password` - Change user password
- `GET /api/users/profiles/list` - Get user profiles
- `POST /api/users/profiles` - Create user profile
- `PUT /api/users/profiles/:id` - Update user profile
- `DELETE /api/users/profiles/:id` - Delete user profile

### ✅ Energy APIs (`/api/*`)
- `GET /api/energy-data` - Get energy data
- `POST /api/energy-data` - Create energy data
- `GET /api/daily-consumption/:objectId` - Get daily consumption
- `GET /api/monthly-consumption/:objectId` - Get monthly consumption
- `GET /api/energy-data-meters/:objectId` - Get meter energy data
- `GET /api/energy-data/temperature-efficiency-chart/:objectId` - Get temperature efficiency chart

### ✅ Efficiency APIs (`/api/*`)
- `GET /api/efficiency-analysis/:objectId` - Get efficiency analysis

### ✅ Temperature APIs (`/api/*`)
- `GET /api/settings/thresholds` - Get temperature thresholds
- `GET /api/temperature-analysis/:objectId` - Get temperature analysis for object
- `GET /api/temperature-analysis` - Get temperature analysis for all objects

### ✅ Object Management APIs (`/api/*`)
- `GET /api/objects` - Get objects (duplicate, see core APIs)
- `GET /api/objects/by-objectid/:objectId` - Get object by objectId
- `GET /api/objects/hierarchy/:mandantId` - Get object hierarchy
- `GET /api/objects/:id` - Get object by ID
- `GET /api/objects/:id/children` - Get object children
- `POST /api/objects` - Create object
- `PUT /api/objects/:id` - Update object
- `DELETE /api/objects/:id` - Delete object

### ✅ KI Report APIs (`/api/*`)
- `GET /api/yearly-summary/:objectId` - Get yearly summary report

### ✅ Portal APIs (`/api/portal/*`)
- `GET /api/portal/config` - Get portal configuration
- `GET /api/portal/fallback-config` - Get fallback configuration
- `POST /api/portal/save-fallback-config` - Save fallback configuration
- `POST /api/portal/test-connection` - Test database connection
- `GET /api/portal/load-config/:configType` - Load configuration
- `POST /api/portal/test-config/:configType` - Test configuration
- `POST /api/portal/save-config/:configType` - Save configuration
- `POST /api/portal/activate-config` - Activate configuration
- `GET /api/portal/active-config` - Get active configuration

### ✅ Monitoring APIs (`/api/monitoring/*`)
- Pool statistics and health monitoring endpoints

## API Categories

### By HTTP Method
- **GET**: Data retrieval (85% of endpoints)
- **POST**: Create new resources, trigger actions (10% of endpoints)
- **PUT/PATCH**: Update existing resources (3% of endpoints)
- **DELETE**: Remove resources (2% of endpoints)

### By Authentication Level
- **Public**: No authentication required
- **Authenticated**: Session-based authentication required
- **Superadmin**: Special superadmin permissions required

### By Data Flow
- **Read-Only**: GET operations for data retrieval
- **Write Operations**: POST/PUT/PATCH for data modification
- **Analytics**: Complex calculations and reports
- **Configuration**: System and user settings management

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Data Response
```json
{
  "data": [ ... ] | { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Common Error Patterns
- Database connection errors
- Authentication/authorization failures
- Validation errors
- Missing required parameters
- Resource not found errors

## API Architecture

### Route Structure
```
/api/{module}/{resource}/{action}
```

### Middleware Stack
1. **CORS**: Cross-origin resource sharing
2. **Body Parser**: JSON/URL-encoded body parsing
3. **Session Management**: Express sessions with PostgreSQL store
4. **Authentication**: Custom auth middleware
5. **Error Handling**: Global error handler
6. **Logging**: Request/response logging

### Database Layer
- **Primary**: Neon PostgreSQL database
- **Settings**: Portal database for configuration
- **Fallback**: Local database for resilience

## Development Notes

### Testing
- Public endpoints available for API testing
- Demo sessions for development
- Comprehensive error logging

### Performance
- Database connection pooling
- Query optimization with indexes
- Caching for frequently accessed data
- Pagination for large datasets

### Security
- SSL/TLS encryption for database connections
- Input validation and sanitization
- Session-based authentication
- Role-based access control (RBAC)
- Audit logging for user activities

---

*For detailed documentation of each API group, see the individual markdown files linked above.*
