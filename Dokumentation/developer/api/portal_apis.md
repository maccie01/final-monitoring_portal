# Portal APIs

## Overview

The portal APIs manage portal configuration, database connections, and system settings. This includes portal database management, configuration switching, connection testing, and settings management for the dual-database architecture.

## API Endpoints

### GET `/api/portal/config`
Get current portal configuration.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "currentConfig": "production",
    "databaseConnections": {
      "primary": {
        "host": "portal-db.example.com",
        "database": "settings_prod",
        "status": "connected",
        "lastTest": "2024-01-01T00:00:00.000Z"
      },
      "fallback": {
        "host": "local-db.example.com",
        "database": "settings_fallback",
        "status": "available",
        "lastTest": "2024-01-01T00:00:00.000Z"
      }
    },
    "systemSettings": {
      "maintenanceMode": false,
      "debugMode": false,
      "emailNotifications": true,
      "backupFrequency": "daily"
    }
  }
}
```

### GET `/api/portal/fallback-config`
Get fallback database configuration.

**Authentication**: Required
**Method**: GET

### POST `/api/portal/save-fallback-config`
Save fallback database configuration.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "netzwächter_fallback",
  "username": "admin",
  "password": "encrypted_password",
  "ssl": true,
  "connectionTimeout": 10000
}
```

### POST `/api/portal/test-connection`
Test database connection.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "configType": "primary",
  "connectionDetails": {
    "host": "portal-db.example.com",
    "port": 5432,
    "database": "settings_prod",
    "username": "app_user",
    "password": "encrypted_password"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "connectionStatus": "successful",
    "responseTime": 245,
    "databaseVersion": "PostgreSQL 15.3",
    "connectionPool": {
      "total": 10,
      "idle": 8,
      "waiting": 0
    },
    "lastTest": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/api/portal/load-config/:configType`
Load configuration from database.

**Authentication**: Required
**Method**: GET
**Parameters**:
- `configType`: Type of configuration to load

### POST `/api/portal/test-config/:configType`
Test configuration settings.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

### POST `/api/portal/save-config/:configType`
Save configuration to database.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

### POST `/api/portal/activate-config`
Activate a configuration.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "configType": "production",
  "activateImmediately": true,
  "backupCurrent": true
}
```

### GET `/api/portal/active-config`
Get currently active configuration.

**Authentication**: Required
**Method**: GET

## Database Architecture

### Dual-Database System
- **Portal Database**: Central configuration and shared settings
- **Local Database**: Application-specific data and backups
- **Automatic Failover**: Seamless switching between databases
- **Data Synchronization**: Bidirectional data synchronization

### Connection Management
- **Connection Pooling**: Efficient database connection management
- **Health Monitoring**: Continuous connection health checks
- **Retry Logic**: Automatic connection retry on failures
- **Load Balancing**: Multiple database instance support

## Configuration Management

### Configuration Types
1. **Production Config**: Live system configuration
2. **Development Config**: Development environment settings
3. **Test Config**: Testing environment configuration
4. **Fallback Config**: Emergency backup configuration

### Settings Categories
- **Database Settings**: Connection strings and parameters
- **System Settings**: Application-wide configuration
- **User Settings**: User-specific preferences
- **Security Settings**: Authentication and authorization settings

## Security Features

### Access Control
- **Role-Based Permissions**: Admin/superadmin access required
- **Audit Logging**: All configuration changes logged
- **Configuration Encryption**: Sensitive data encryption
- **Backup Security**: Secure configuration backups

### Data Protection
- **Connection Security**: SSL/TLS encryption for database connections
- **Credential Management**: Secure credential storage and rotation
- **Access Monitoring**: Configuration access tracking
- **Compliance**: GDPR and data protection compliance

## Error Handling

### Connection Errors
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DB_CONNECTION_ERROR",
  "details": {
    "configType": "primary",
    "host": "portal-db.example.com",
    "error": "Connection timeout",
    "retryCount": 3
  }
}
```

### Configuration Errors
```json
{
  "success": false,
  "error": "Invalid configuration",
  "code": "CONFIG_VALIDATION_ERROR",
  "details": {
    "field": "database.host",
    "value": "",
    "validation": "Host is required"
  }
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "CONFIG_PERMISSION_DENIED",
  "details": {
    "requiredRole": "superadmin",
    "currentRole": "admin"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/portal.ts`
- **Controller**: `server/controllers/databaseController.ts`
- **Database Manager**: `server/settingsdb.ts`
- **Configuration System**: Dual-database configuration management

### Frontend Usage
```typescript
// Test database connection
const testResult = await apiRequest('/api/portal/test-connection', {
  method: 'POST',
  body: {
    configType: 'primary',
    connectionDetails: connectionConfig
  }
});

// Save configuration
await apiRequest('/api/portal/save-config/production', {
  method: 'POST',
  body: productionConfig
});

// Activate configuration
await apiRequest('/api/portal/activate-config', {
  method: 'POST',
  body: {
    configType: 'production',
    activateImmediately: true
  }
});
```

### Configuration Workflow
1. **Load Config**: Retrieve current configuration
2. **Test Connection**: Validate database connectivity
3. **Save Config**: Store new configuration
4. **Activate Config**: Apply configuration changes
5. **Monitor Status**: Track configuration health

## Development Notes

### Configuration Testing
```typescript
// Test configuration pipeline
const configTester = new ConfigTester({
  configType: 'production',
  testConnections: true,
  validateSchema: true,
  performanceTest: true
});

const testResults = await configTester.runTests();
```

### Database Migration
```typescript
// Configuration migration
const migrator = new ConfigMigrator({
  sourceConfig: 'development',
  targetConfig: 'production',
  migrationStrategy: 'incremental',
  backupEnabled: true
});

await migrator.migrate();
```

### Monitoring and Alerting
- **Connection Monitoring**: Database connectivity alerts
- **Performance Monitoring**: Query performance tracking
- **Configuration Drift**: Configuration change detection
- **Security Monitoring**: Access pattern analysis

### Future Enhancements
- **Multi-Region Support**: Global configuration management
- **Configuration Versioning**: Historical configuration tracking
- **Automated Testing**: Configuration validation pipelines
- **Integration Testing**: End-to-end configuration testing
- **Disaster Recovery**: Automated failover configuration

## Related APIs

- **Database APIs**: Core database operations in `database_apis.md`
- **Authentication APIs**: User access control in `auth_apis.md`
- **User Management APIs**: User configuration in `user_management_apis.md`
