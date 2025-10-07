# Monitoring APIs

## Overview

The monitoring APIs provide system health monitoring and database connection pool management capabilities. These endpoints are restricted to admin users and provide insights into system performance and database health.

## API Endpoints

### GET `/api/monitoring/pool/stats`
Get detailed database connection pool statistics.

**Authentication**: Required (Admin role)
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "poolStats": {
      "totalConnections": 20,
      "activeConnections": 5,
      "idleConnections": 15,
      "pendingRequests": 0,
      "borrowedConnections": 3,
      "returnedConnections": 2,
      "createdConnections": 8,
      "destroyedConnections": 0,
      "acquiredConnections": 45,
      "timedOutConnections": 0,
      "totalQueryCount": 1250,
      "idleTimeoutCount": 0,
      "lifetimeTimeoutCount": 0
    },
    "performance": {
      "averageQueryTime": 45.2,
      "queriesPerSecond": 12.5,
      "connectionWaitTime": 2.1,
      "poolUtilization": 25.0
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/api/monitoring/pool/health`
Get database connection pool health status.

**Authentication**: Required (Admin role)
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "poolHealth": {
      "status": "healthy",
      "activeConnections": 5,
      "idleConnections": 15,
      "totalConnections": 20,
      "connectionLimit": 20,
      "utilizationPercentage": 25.0,
      "lastHealthCheck": "2024-01-01T00:00:00.000Z",
      "averageResponseTime": 45.2
    },
    "databaseHealth": {
      "connected": true,
      "lastConnectionTest": "2024-01-01T00:00:00.000Z",
      "connectionLatency": 12.5,
      "querySuccessRate": 99.8
    },
    "alerts": []
  }
}
```

### GET `/api/monitoring/dashboard`
Get comprehensive monitoring dashboard data.

**Authentication**: Required (Admin role)
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "systemOverview": {
      "uptime": "7 days, 4 hours",
      "totalRequests": 15420,
      "activeUsers": 23,
      "errorRate": 0.02,
      "responseTimeAvg": 245.5
    },
    "databaseMetrics": {
      "connectionPool": {
        "utilization": 25.0,
        "active": 5,
        "idle": 15,
        "total": 20
      },
      "queryPerformance": {
        "slowQueries": 2,
        "averageQueryTime": 45.2,
        "queriesPerSecond": 12.5,
        "cacheHitRate": 85.3
      },
      "tableStats": {
        "users": 45,
        "objects": 1250,
        "settings": 89,
        "sessions": 23
      }
    },
    "apiMetrics": {
      "endpointsCalled": {
        "/api/objects": 1250,
        "/api/energy-data": 890,
        "/api/auth/user": 2340,
        "/api/health": 5000
      },
      "responseCodes": {
        "200": 95.2,
        "201": 2.1,
        "400": 1.2,
        "401": 0.8,
        "404": 0.5,
        "500": 0.2
      },
      "topErrors": [
        {
          "endpoint": "/api/energy-data",
          "error": "Database connection timeout",
          "count": 3,
          "lastOccurrence": "2024-01-01T00:00:00.000Z"
        }
      ]
    },
    "alerts": [
      {
        "level": "warning",
        "message": "Database connection pool utilization above 80%",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "resolved": false
      }
    ],
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Monitoring Metrics Explained

### Connection Pool Metrics
- **totalConnections**: Total connections in the pool
- **activeConnections**: Currently active connections
- **idleConnections**: Available idle connections
- **pendingRequests**: Requests waiting for connections
- **borrowedConnections**: Connections currently borrowed by clients

### Performance Metrics
- **averageQueryTime**: Average query execution time in milliseconds
- **queriesPerSecond**: Query throughput rate
- **connectionWaitTime**: Average time to acquire a connection
- **poolUtilization**: Percentage of pool capacity in use

### Health Indicators
- **healthy**: Overall pool health status
- **connectionLimit**: Maximum allowed connections
- **utilizationPercentage**: Current pool utilization
- **connectionLatency**: Database connection response time

## Error Handling

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Access denied. Admin role required.",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Database Connection Issues
```json
{
  "success": false,
  "error": "Database connection pool unavailable",
  "code": "POOL_UNAVAILABLE",
  "details": {
    "poolStatus": "unhealthy",
    "activeConnections": 0,
    "errorMessage": "All connections failed"
  }
}
```

### Monitoring Data Unavailable
```json
{
  "success": false,
  "error": "Monitoring data temporarily unavailable",
  "code": "MONITORING_UNAVAILABLE",
  "details": {
    "reason": "Database metrics collection paused",
    "estimatedRecovery": "5 minutes"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/monitoring.ts`
- **Controller**: `server/controllers/monitoringController.ts`
- **Database Layer**: Connection pool monitoring via `ConnectionPoolManager`

### Frontend Usage
```typescript
// Get pool statistics
const poolStats = await apiRequest('/api/monitoring/pool/stats');

// Check pool health
const poolHealth = await apiRequest('/api/monitoring/pool/health');

// Get monitoring dashboard
const dashboard = await apiRequest('/api/monitoring/dashboard');
```

### Real-time Monitoring
- **WebSocket Integration**: Real-time monitoring updates
- **Alert Notifications**: Automatic alert generation for issues
- **Dashboard Updates**: Live metrics in admin dashboard
- **Health Checks**: Automated system health monitoring

### Security Considerations
- **Admin Only Access**: All endpoints require admin or superadmin role
- **Audit Logging**: All monitoring access logged for security
- **Rate Limiting**: Protected against excessive monitoring requests
- **Data Sanitization**: Sensitive information filtered from responses

## Performance Impact

### Resource Usage
- **Database Load**: Minimal additional load for statistics collection
- **Memory Usage**: Small memory footprint for metrics storage
- **Network Traffic**: Efficient data transmission with compression
- **CPU Usage**: Lightweight calculations for metrics aggregation

### Optimization Features
- **Caching**: Metrics cached to reduce database queries
- **Sampling**: Statistical sampling for high-frequency metrics
- **Async Processing**: Non-blocking metric collection
- **Background Tasks**: Metrics collected in background threads

## Integration Points

### System Monitoring
- **Application Performance**: Request/response time tracking
- **Error Monitoring**: Exception and error rate monitoring
- **Resource Usage**: CPU, memory, and disk usage tracking
- **Security Events**: Authentication and authorization monitoring

### Database Monitoring
- **Connection Health**: Real-time connection pool monitoring
- **Query Performance**: Slow query detection and analysis
- **Index Usage**: Database index effectiveness monitoring
- **Backup Status**: Database backup and recovery monitoring

### Business Metrics
- **User Activity**: User login/logout and activity tracking
- **API Usage**: Endpoint usage statistics and patterns
- **Data Growth**: Database size and growth rate monitoring
- **System Availability**: Uptime and availability tracking

## Development Notes

### Testing
```typescript
// Test monitoring endpoints
const testMonitoring = async () => {
  try {
    // Test pool stats
    const stats = await apiRequest('/api/monitoring/pool/stats');
    console.log('Pool stats:', stats);

    // Test pool health
    const health = await apiRequest('/api/monitoring/pool/health');
    console.log('Pool health:', health);

    // Test dashboard
    const dashboard = await apiRequest('/api/monitoring/dashboard');
    console.log('Dashboard:', dashboard);
  } catch (error) {
    console.error('Monitoring test failed:', error);
  }
};
```

### Alert Thresholds
- **Pool Utilization > 80%**: Warning alert
- **Pool Utilization > 95%**: Critical alert
- **Connection Failures > 5/min**: Error alert
- **Average Query Time > 1000ms**: Performance alert

### Monitoring Configuration
```typescript
const monitoringConfig = {
  collectionInterval: 30000, // 30 seconds
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  alertThresholds: {
    poolUtilization: 80,
    connectionTimeout: 5000,
    errorRate: 0.05
  }
};
```

## Related APIs

- **Database APIs**: Connection pool management in `database_apis.md`
- **Authentication APIs**: Admin role verification in `auth_apis.md`
- **System Health**: General health check in API overview
