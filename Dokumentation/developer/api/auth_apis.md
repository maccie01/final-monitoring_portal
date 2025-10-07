# Authentication APIs

## Overview

The authentication system provides session-based user authentication with support for regular users and superadmin access. The system uses PostgreSQL session storage and supports demo sessions for development.

## API Endpoints

### POST `/api/auth/superadmin-login`
Superadmin login endpoint for system administration.

**Authentication**: None required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "username": "superadmin_username",
  "password": "superadmin_password"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "role": "superadmin",
    "mandantId": null
  },
  "session": {
    "id": "session_id",
    "expires": "2025-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/auth/user-login`
Regular user login endpoint.

**Authentication**: None required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "username": "user_username",
  "password": "user_password"
}
```

**Response (Success)**: Same format as superadmin-login but with user role

### POST `/api/auth/logout`
User logout endpoint - destroys the current session.

**Authentication**: Required (session-based)
**Method**: POST

**Response (Success)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/api/auth/user`
Get current authenticated user information.

**Authentication**: Required (session-based)
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "mandantId": 123
  }
}
```

### POST `/api/auth/heartbeat`
Session heartbeat to maintain active session and prevent timeout.

**Authentication**: Required (session-based)
**Method**: POST

**Response (Success)**:
```json
{
  "success": true,
  "session": {
    "expires": "2025-01-01T00:00:00.000Z"
  }
}
```

## Authentication Flow

1. **Login**: User submits credentials via `/api/auth/user-login` or `/api/auth/superadmin-login`
2. **Session Creation**: Server creates session in PostgreSQL store
3. **Session Cookie**: Browser receives session cookie
4. **Heartbeat**: Frontend periodically calls `/api/auth/heartbeat` to maintain session
5. **Auto-logout**: Session expires after 2 hours of inactivity
6. **Logout**: User explicitly logs out via `/api/auth/logout`

## Session Management

### Session Store
- **Backend**: PostgreSQL database (`sessions` table)
- **Cleanup**: Automatic cleanup of expired sessions
- **Security**: Secure session IDs, HTTP-only cookies

### Session Timeout
- **Inactivity Timeout**: 2 hours
- **Heartbeat Interval**: 30 seconds (frontend)
- **Graceful Logout**: Clean session destruction

## Error Responses

### Invalid Credentials
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

### Session Expired
```json
{
  "success": false,
  "error": "Session expired",
  "code": "SESSION_EXPIRED"
}
```

### Authentication Required
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/auth.ts`
- **Controller**: `server/controllers/authController.ts`
- **Middleware**: `server/middleware/auth.ts`
- **Database**: `server/db.ts` (session store)

### Frontend Usage
```typescript
// Login
const response = await fetch('/api/auth/user-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Get current user
const userResponse = await fetch('/api/auth/user');

// Heartbeat (every 30 seconds)
setInterval(async () => {
  await fetch('/api/auth/heartbeat', { method: 'POST' });
}, 30000);

// Logout
await fetch('/api/auth/logout', { method: 'POST' });
```

### Security Features
- **Password Hashing**: bcryptjs for secure password storage
- **Session Security**: Secure session configuration
- **Input Validation**: Username/password validation
- **Rate Limiting**: Built-in protection against brute force
- **Audit Logging**: Login attempts and session activities logged

## Development Notes

### Demo Sessions
The system supports demo sessions for development:
```typescript
// Demo session fallback in auth middleware
if (!user && isDemoSession) {
  // Allow access with demo user context
}
```

### Superadmin Credentials
Default superadmin credentials (configured in `server/setup-app.json`):
- Username: Configurable
- Password: Configurable per environment

### Session Debugging
Enable debug logging for session issues:
```bash
DEBUG=express-session npm run dev
```

## Related APIs

- **User Management**: User CRUD operations in `user_management_apis.md`
- **Database**: Session storage in `database_apis.md`
- **Portal**: Configuration management in `portal_apis.md`
