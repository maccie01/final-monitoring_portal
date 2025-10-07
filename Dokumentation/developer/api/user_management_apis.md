# User Management APIs

## Overview

The user management APIs provide comprehensive user lifecycle management including CRUD operations, profile management, password handling, and role-based permissions. The system supports multiple user roles and mandant-based access control.

## API Endpoints

### GET `/api/users`
Get all users accessible to the authenticated user (filtered by permissions).

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `mandantId` (optional): Filter by specific mandant
- `role` (optional): Filter by user role
- `limit` (optional): Number of users to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john.doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "mandantId": 123,
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

### GET `/api/users/:id`
Get detailed information for a specific user.

**Authentication**: Required
**Method**: GET
**Permissions**: User must have access to the requested user's mandant

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john.doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "mandantId": 123,
    "userProfileId": 5,
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/users`
Create a new user account.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json
**Permissions**: Admin or superadmin role required

**Request Body**:
```json
{
  "username": "new.user",
  "firstName": "New",
  "lastName": "User",
  "email": "new.user@example.com",
  "password": "securePassword123",
  "role": "user",
  "mandantId": 123,
  "userProfileId": 5,
  "isActive": true
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "new.user",
    "firstName": "New",
    "lastName": "User",
    "email": "new.user@example.com",
    "role": "user",
    "mandantId": 123,
    "userProfileId": 5,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

### PATCH `/api/users/:id`
Update an existing user (partial update).

**Authentication**: Required
**Method**: PATCH
**Content-Type**: application/json
**Permissions**: Admin/superadmin or user updating own profile

**Request Body** (partial update):
```json
{
  "firstName": "Updated Name",
  "email": "updated.email@example.com",
  "isActive": false
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john.doe",
    "firstName": "Updated Name",
    "lastName": "Doe",
    "email": "updated.email@example.com",
    "role": "user",
    "mandantId": 123,
    "isActive": false,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE `/api/users/:id`
Delete a user account.

**Authentication**: Required
**Method**: DELETE
**Permissions**: Admin or superadmin role required

**Response (Success)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### POST `/api/users/:id/change-password`
Change a user's password.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json
**Permissions**: User changing own password or admin/superadmin

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## User Profile Management

### GET `/api/users/profiles/list`
Get all available user profiles.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Administrator",
      "startPage": "/dashboard",
      "sidebar": {
        "showDashboard": true,
        "showObjectManagement": true,
        "showUserManagement": true,
        "showNetworkMonitor": true,
        "showEfficiencyStrategy": true,
        "showGrafanaDashboards": true,
        "showEnergyData": true,
        "showDeviceManagement": true,
        "showLogbook": true,
        "showUser": true
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/users/profiles`
Create a new user profile.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json
**Permissions**: Admin or superadmin role

**Request Body**:
```json
{
  "name": "Custom Profile",
  "startPage": "/maps",
  "sidebar": {
    "showDashboard": true,
    "showMaps": true,
    "showEnergyData": true
  }
}
```

### PUT `/api/users/profiles/:id`
Update an existing user profile.

**Authentication**: Required
**Method**: PUT
**Content-Type**: application/json
**Permissions**: Admin or superadmin role

### DELETE `/api/users/profiles/:id`
Delete a user profile.

**Authentication**: Required
**Method**: DELETE
**Permissions**: Admin or superadmin role

## User Roles and Permissions

### Role Hierarchy
1. **superadmin**: Full system access, all permissions
2. **admin**: Administrative access within assigned mandants
3. **user**: Standard user access with profile-based permissions

### Permission Matrix
| Permission | superadmin | admin | user |
|------------|------------|-------|------|
| Create Users | ✓ | ✓ | ✗ |
| Edit Users | ✓ | ✓ | Own profile only |
| Delete Users | ✓ | ✓ | ✗ |
| Manage Profiles | ✓ | ✓ | ✗ |
| View All Data | ✓ | Assigned mandants | Profile-based |
| System Config | ✓ | ✗ | ✗ |

### Mandant-Based Access
- Users can only access data from their assigned mandants
- Admins can manage users within their mandants
- Superadmins have cross-mandant access

## Security Features

### Password Security
- **Hashing**: bcryptjs with salt rounds
- **Minimum Requirements**: Configurable password policies
- **Password History**: Prevents reuse of recent passwords
- **Force Reset**: Admin capability to force password changes

### Session Security
- **Inactivity Timeout**: 2 hours automatic logout
- **Concurrent Sessions**: Single session per user
- **Session Hijacking Protection**: Secure session handling
- **Audit Logging**: All authentication events logged

### Access Control
- **Role-Based Access Control (RBAC)**: Permissions based on user roles
- **Mandant Isolation**: Data access restricted by mandant membership
- **Profile-Based UI**: Interface customized per user profile
- **Audit Trails**: Comprehensive logging of user actions

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "username": "Username already exists",
    "email": "Invalid email format",
    "password": "Password does not meet requirements"
  }
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED",
  "requiredRole": "admin"
}
```

### User Not Found
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/users.ts`
- **Controller**: `server/controllers/userController.ts`
- **Database Schema**: `shared/schema.ts` (users, userProfiles tables)
- **Auth Middleware**: `server/middleware/auth.ts`

### Frontend Usage
```typescript
// Get users
const users = await apiRequest('/api/users');

// Create user
const newUser = await apiRequest('/api/users', {
  method: 'POST',
  body: {
    username: 'newuser',
    firstName: 'New',
    lastName: 'User',
    email: 'new@example.com',
    password: 'securePass123',
    role: 'user',
    mandantId: 123
  }
});

// Update password
await apiRequest(`/api/users/${userId}/change-password`, {
  method: 'POST',
  body: {
    currentPassword: 'oldPass',
    newPassword: 'newPass',
    confirmPassword: 'newPass'
  }
});
```

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  mandant_id INTEGER,
  user_profile_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  start_page VARCHAR(100) DEFAULT '/maps',
  sidebar JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Development Notes

### Testing User Accounts
Default test accounts available:
- **Superadmin**: admin / admin123
- **Demo User**: Configurable in setup

### Profile Configuration
User profiles control UI permissions:
```json
{
  "sidebar": {
    "showDashboard": true,
    "showObjectManagement": false,
    "showUserManagement": true
  }
}
```

### Audit Logging
All user management actions logged:
- User creation/deletion
- Profile changes
- Password changes
- Permission modifications

## Related APIs

- **Authentication**: Login/logout in `auth_apis.md`
- **Database**: User data storage in `database_apis.md`
- **Object Management**: User-object relationships in `object_management_apis.md`
