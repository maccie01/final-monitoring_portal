# Netzwächter API Documentation

## Overview

This comprehensive API documentation covers all endpoints in the Netzwächter monitoring system. The APIs are organized by functional groups and provide complete specifications for integration and development.

## 📁 Documentation Structure

### Core System APIs
- **[Authentication APIs](./auth_apis.md)** - User authentication, session management, and security
- **[Database APIs](./database_apis.md)** - Core data access, settings management, and database operations
- **[User Management APIs](./user_management_apis.md)** - User CRUD, profiles, permissions, and access control

### Monitoring & Analytics APIs
- **[Energy APIs](./energy_apis.md)** - Energy consumption data, heating systems, and efficiency analysis
- **[Efficiency APIs](./efficiency_apis.md)** - Advanced efficiency analysis and optimization recommendations
- **[Temperature APIs](./temperature_apis.md)** - Temperature monitoring, alerts, and climate control
- **[Weather APIs](./weather_apis.md)** - Outdoor temperature data and degree day calculations

### Business Logic APIs
- **[Object Management APIs](./object_management_apis.md)** - Building/property management and hierarchies
- **[KI Report APIs](./ki_report_apis.md)** - AI-powered energy analysis and predictive insights
- **[Portal APIs](./portal_apis.md)** - Portal configuration and database management
- **[Monitoring APIs](./monitoring_apis.md)** - System monitoring and database pool statistics

## 🔑 Authentication & Security

### Authentication Methods
- **Session-based authentication** for most APIs
- **Superadmin authentication** for system administration
- **Demo sessions** for development and testing
- **Public endpoints** for external integrations

### Security Features
- SSL/TLS encryption for all connections
- Role-based access control (RBAC)
- Mandant-based data isolation
- Comprehensive audit logging
- Input validation and sanitization

## 📊 API Statistics

| Category | Endpoints | Authentication | Public Access |
|----------|-----------|----------------|---------------|
| Authentication | 5 | None/Mixed | Partial |
| Database | 6 | Required | None |
| User Management | 8 | Required | None |
| Energy | 8 | Mixed | Partial |
| Efficiency | 1 | None (testing) | Partial |
| Temperature | 2 | Required | None |
| Weather | 6 | Mixed | Partial |
| Object Management | 7 | Required | None |
| KI Reports | 3 | Required | None |
| Portal | 8 | Required | None |
| Monitoring | 3 | Required | None |
| **Total** | **94** | **Mixed** | **Limited** |

## 🚀 Quick Start

### 1. Authentication
```javascript
// Login
const response = await fetch('/api/auth/user-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
});
```

### 2. Get Objects
```javascript
// Get accessible objects
const objects = await fetch('/api/objects', {
  headers: {
    'Cookie': 'session=your_session_cookie'
  }
});
```

### 3. Energy Analysis
```javascript
// Get energy data
const energyData = await fetch('/api/energy-data/OBJ001', {
  headers: {
    'Cookie': 'session=your_session_cookie'
  }
});
```

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": { ... }
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

## 🔍 API Discovery

### Health Check
```bash
GET /api/health
# Returns system health status
```

### API Listing
```bash
GET /api/
# Returns available API endpoints (development mode)
```

### Schema Information
```bash
GET /api/schema/{table}
# Returns database schema information (admin only)
```

## 🛠️ Development Tools

### Testing
- **Public endpoints** available for API testing
- **Demo authentication** for development
- **Comprehensive error responses** for debugging
- **Request/response logging** for troubleshooting

### Integration
- **RESTful design** following HTTP conventions
- **JSON data format** for all communications
- **Pagination support** for large datasets
- **Filtering and sorting** capabilities

## 📈 Performance & Scaling

### Optimization Features
- Database connection pooling
- Query result caching
- Efficient pagination
- Background processing for heavy operations

### Rate Limiting
- Authenticated users: 1000 requests/hour
- Public endpoints: 100 requests/hour
- Burst protection with sliding windows

### Monitoring
- Request/response time tracking
- Database query performance
- Error rate monitoring
- Resource usage statistics

## 🔧 Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your-secret-key
PORT=4004
NODE_ENV=development
```

### Database Setup
```bash
npm run db:push  # Initialize schema
npm run db:generate  # Generate migrations
npm run db:migrate  # Apply migrations
```

## 🐛 Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `AUTH_REQUIRED` | Authentication | Session required |
| `PERMISSION_DENIED` | Authorization | Insufficient permissions |
| `VALIDATION_ERROR` | Input | Invalid data provided |
| `DB_CONNECTION_ERROR` | Database | Connection failed |
| `OBJECT_NOT_FOUND` | Data | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate Limiting | Too many requests |

## 🔗 Related Documentation

- **[Application Architecture](../app-aufbau.md)** - Overall system design
- **[Database Schema](../Database-Schema-cockpit-Dokumentation.md)** - Database structure
- **[Security Concept](../SICHERHEITSKONZEPT.md)** - Security implementation
- **[Workflow Documentation](../workflowdevice.md)** - Development workflows

## 📞 Support

### Getting Help
1. Check this API documentation first
2. Review error codes and troubleshooting guides
3. Contact development team for integration support
4. Use health check endpoints for system status

### Best Practices
- Always handle errors gracefully
- Implement proper authentication flows
- Use pagination for large datasets
- Cache frequently accessed data
- Monitor API usage and performance

---

*This documentation is automatically generated and maintained. Last updated: 2025-01-07*
