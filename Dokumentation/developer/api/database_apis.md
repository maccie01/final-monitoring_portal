# Database APIs

## Overview

The database APIs provide core data access functionality for the monitoring system. This includes object management, settings management, mandant handling, and dashboard KPI data. The system uses a dual-database architecture with primary Neon database and portal database fallback.

## API Endpoints

### GET `/api/status`
Get database connection status and system health.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "database": {
    "connected": true,
    "type": "postgresql",
    "pool": {
      "totalCount": 10,
      "idleCount": 8,
      "waitingCount": 0
    }
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET `/api/objects`
Get all objects accessible to the authenticated user (filtered by mandant permissions).

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `limit` (optional): Number of objects to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "objectid": "OBJ001",
      "name": "Building A",
      "address": "Main Street 123",
      "mandantId": 123,
      "type": "building",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

### GET `/api/mandants`
Get all mandants (tenants) available in the system.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tenant A",
      "description": "Main tenant",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET `/api/settings`
Get system settings filtered by category.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `category` (optional): Filter by setting category

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "system",
      "keyName": "version",
      "value": "1.0.0",
      "userId": null,
      "mandantId": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/settings`
Create or update a system setting.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "category": "system",
  "keyName": "maintenance_mode",
  "value": {
    "enabled": true,
    "message": "System maintenance in progress"
  },
  "userId": 123,
  "mandantId": 456
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "system",
    "keyName": "maintenance_mode",
    "value": {
      "enabled": true,
      "message": "System maintenance in progress"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE `/api/settings/:category/:keyName`
Delete a system setting by category and key name.

**Authentication**: Required
**Method**: DELETE

**Response (Success)**:
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

### GET `/api/dashboard/kpis`
Get dashboard KPI data for the authenticated user's accessible objects.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "totalObjects": 25,
    "activeMonitoring": 23,
    "totalEnergyConsumption": 1250000,
    "efficiencyScore": 87.5,
    "alertCount": 3,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

## Database Architecture

### Primary Database (Neon)
- **Type**: PostgreSQL
- **Purpose**: Main application data
- **Tables**: objects, users, sessions, settings, etc.
- **Connection**: Direct via DATABASE_URL

### Portal Database
- **Type**: PostgreSQL
- **Purpose**: Configuration and settings
- **Access**: Via SettingsDbManager
- **Fallback**: Automatic fallback if portal DB unavailable

### Connection Management
- **Pooling**: Connection pool management
- **SSL**: Required SSL connections
- **Health Checks**: Automatic connection monitoring
- **Retry Logic**: Built-in connection retry mechanisms

## Data Access Patterns

### Object Filtering
All object queries include mandant-based filtering:
```sql
SELECT o.*, om.mandant_id
FROM objects o
LEFT JOIN object_mandant om ON o.id = om.object_id
WHERE o.mandant_id = $1 OR om.mandant_id = $1
```

### Settings Management
Settings stored as JSONB for flexible configuration:
```sql
INSERT INTO settings (category, key_name, value)
VALUES ('system', 'config', '{"enabled": true}'::jsonb)
```

### Audit Logging
All data changes logged for compliance:
- User activity tracking
- Change history
- Access logging

## Error Handling

### Database Connection Errors
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DB_CONNECTION_ERROR"
}
```

### Permission Denied
```json
{
  "success": false,
  "error": "Access denied to requested objects",
  "code": "PERMISSION_DENIED"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Invalid setting data",
  "code": "VALIDATION_ERROR",
  "details": {
    "category": "Category is required",
    "keyName": "Key name must be unique"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/db.ts`
- **Controller**: `server/controllers/databaseController.ts`
- **Database Layer**: `server/db.ts`, `server/settingsdb.ts`
- **Schema**: `shared/schema.ts`

### Frontend Usage
```typescript
// Get objects
const objects = await apiRequest('/api/objects');

// Save setting
await apiRequest('/api/settings', {
  method: 'POST',
  body: {
    category: 'user',
    keyName: 'preferences',
    value: { theme: 'dark' }
  }
});

// Get dashboard data
const kpis = await apiRequest('/api/dashboard/kpis');
```

### Security Features
- **Mandant Isolation**: Users only see data from their mandants
- **Input Validation**: All inputs validated before database operations
- **SQL Injection Protection**: Parameterized queries only
- **Access Logging**: All data access logged for audit trails

## Performance Optimization

### Indexing Strategy
- Primary keys on all tables
- Foreign key indexes
- Composite indexes for common query patterns
- Partial indexes for active records

### Query Optimization
- Efficient JOIN operations
- Pagination for large datasets
- Query result caching
- Connection pooling

### Monitoring
- Query performance monitoring
- Connection pool statistics
- Database health checks
- Slow query logging

## Development Notes

### Database Schema
Schema defined using Drizzle ORM:
```typescript
export const objects = pgTable("objects", {
  id: serial("id").primaryKey(),
  objectid: varchar("objectid", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  // ... other fields
});
```

### Migration Process
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push
```

### Testing
Public endpoints available for API testing:
- Health checks
- Basic data retrieval
- Demo data access

## Related APIs

- **Object Management**: Detailed object CRUD in `object_management_apis.md`
- **User Management**: User permissions and profiles in `user_management_apis.md`
- **Portal**: Configuration management in `portal_apis.md`
