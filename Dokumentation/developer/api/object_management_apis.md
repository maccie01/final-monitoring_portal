# Object Management APIs

## Overview

The object management APIs provide comprehensive building and property management functionality including CRUD operations, hierarchical relationships, mandant-based access control, and object-specific configuration management.

## API Endpoints

### GET `/api/objects`
Get all objects accessible to the authenticated user (filtered by mandant permissions).

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `mandantId` (optional): Filter by specific mandant
- `type` (optional): Filter by object type ('building', 'apartment', etc.)
- `parentId` (optional): Filter by parent object
- `limit` (optional): Number of objects to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "objectid": "BLD001",
      "name": "Residential Building A",
      "description": "5-story residential building",
      "type": "building",
      "address": "Hauptstraße 123, 10115 Berlin",
      "postalCode": "10115",
      "city": "Berlin",
      "country": "Germany",
      "latitude": 52.5200,
      "longitude": 13.4050,
      "area": 2500,
      "floors": 5,
      "units": 25,
      "constructionYear": 1995,
      "energyClass": "C",
      "mandantId": 1,
      "parentId": null,
      "isActive": true,
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

### GET `/api/objects/:id`
Get detailed information for a specific object.

**Authentication**: Required
**Method**: GET
**Permissions**: User must have access to the object's mandant

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "objectid": "BLD001",
    "name": "Residential Building A",
    "description": "5-story residential building",
    "type": "building",
    "address": "Hauptstraße 123, 10115 Berlin",
    "technicalData": {
      "heatingSystem": "gas_boiler",
      "heatingCapacity": 50000,
      "insulation": "good",
      "windows": "double_glazed",
      "roof": "insulated"
    },
    "contactData": {
      "propertyManager": "John Doe",
      "phone": "+49 30 12345678",
      "email": "manager@building-a.com"
    },
    "mandantId": 1,
    "parentId": null,
    "children": [
      {
        "id": 2,
        "objectid": "APT001",
        "name": "Apartment 1.1",
        "type": "apartment"
      }
    ]
  }
}
```

### POST `/api/objects`
Create a new object.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json
**Permissions**: Admin or superadmin role

**Request Body**:
```json
{
  "objectid": "BLD002",
  "name": "Office Building B",
  "description": "Modern office building",
  "type": "building",
  "address": "Businessstraße 456, 20095 Hamburg",
  "postalCode": "20095",
  "city": "Hamburg",
  "country": "Germany",
  "latitude": 53.5511,
  "longitude": 9.9937,
  "area": 5000,
  "floors": 8,
  "units": 80,
  "constructionYear": 2010,
  "energyClass": "A",
  "mandantId": 1,
  "parentId": null,
  "technicalData": {
    "heatingSystem": "heat_pump",
    "heatingCapacity": 150000,
    "insulation": "excellent"
  }
}
```

### PUT `/api/objects/:id`
Update an existing object.

**Authentication**: Required
**Method**: PUT
**Content-Type**: application/json
**Permissions**: Admin/superadmin or object owner

### DELETE `/api/objects/:id`
Delete an object.

**Authentication**: Required
**Method**: DELETE
**Permissions**: Admin or superadmin role

### GET `/api/objects/by-objectid/:objectId`
Get object by its unique objectid.

**Authentication**: Required
**Method**: GET

### GET `/api/objects/:id/children`
Get all child objects of a parent object.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "objectid": "APT001",
      "name": "Apartment 1.1",
      "type": "apartment",
      "parentId": 1,
      "area": 85,
      "rooms": 3,
      "occupants": 2
    },
    {
      "id": 3,
      "objectid": "APT002",
      "name": "Apartment 1.2",
      "type": "apartment",
      "parentId": 1,
      "area": 92,
      "rooms": 4,
      "occupants": 3
    }
  ]
}
```

### GET `/api/objects/hierarchy/:mandantId`
Get complete object hierarchy for a mandant.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "mandantId": 1,
    "hierarchy": [
      {
        "id": 1,
        "objectid": "BLD001",
        "name": "Building A",
        "type": "building",
        "children": [
          {
            "id": 2,
            "objectid": "FLR001",
            "name": "Floor 1",
            "type": "floor",
            "children": [
              {
                "id": 3,
                "objectid": "APT001",
                "name": "Apartment 1.1",
                "type": "apartment",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Object Types and Hierarchy

### Object Type Classification
- **building**: Main building structure
- **floor**: Building floor/section
- **apartment**: Residential unit
- **office**: Office space
- **common_area**: Shared building spaces
- **technical_room**: Utility/technical rooms
- **parking**: Parking facilities
- **outdoor**: External building areas

### Hierarchical Relationships
- **Parent-Child Relationships**: Buildings contain floors, floors contain apartments
- **Multi-level Hierarchy**: Support for complex property structures
- **Reference Integrity**: Automatic relationship management
- **Access Inheritance**: Child objects inherit parent permissions

## Technical Data Management

### Building Specifications
- **Construction Details**: Year, materials, insulation
- **Energy Systems**: Heating, cooling, ventilation
- **Technical Equipment**: Elevators, security systems
- **Maintenance History**: Service records and schedules

### Performance Metrics
- **Energy Consumption**: Building-level energy tracking
- **Occupancy Data**: Usage patterns and occupancy rates
- **Maintenance Costs**: Ongoing operational expenses
- **Asset Value**: Property valuation and depreciation

## Access Control and Permissions

### Mandant-Based Security
- **Data Isolation**: Users only see objects from their mandants
- **Role-Based Access**: Different permission levels per role
- **Object Ownership**: Creator/maintainer relationship tracking
- **Audit Logging**: All object access and modifications logged

### Permission Matrix
| Permission | superadmin | admin | user |
|------------|------------|-------|------|
| View Objects | All | Assigned mandants | Profile-based |
| Create Objects | ✓ | ✓ | ✗ |
| Edit Objects | ✓ | ✓ | Own objects |
| Delete Objects | ✓ | ✓ | ✗ |
| View Hierarchy | ✓ | ✓ | Limited |

## Data Validation and Integrity

### Object ID Uniqueness
- **Global Uniqueness**: Object IDs must be unique across system
- **Format Validation**: Standardized object ID formats
- **Automatic Generation**: System-generated IDs with collision detection

### Geographic Data Validation
- **Coordinate Validation**: Latitude/longitude range checking
- **Address Verification**: Postal code and address format validation
- **Location Services**: Integration with mapping services

### Business Rule Enforcement
- **Hierarchy Constraints**: Parent-child relationship rules
- **Type Consistency**: Object type-specific validation
- **Data Completeness**: Required field validation

## Integration Points

### Energy Monitoring Integration
- **Meter Assignment**: Energy meters linked to objects
- **Consumption Allocation**: Usage distribution across hierarchy
- **Efficiency Tracking**: Object-specific performance metrics

### Maintenance Management
- **Work Order System**: Maintenance requests per object
- **Asset Tracking**: Equipment and system inventory
- **Compliance Monitoring**: Regulatory requirement tracking

### Financial Integration
- **Cost Allocation**: Expense distribution across objects
- **Rent Management**: Rental unit financial tracking
- **Budget Planning**: Object-specific budget management

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": "Object validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "objectid": "Object ID already exists",
    "postalCode": "Invalid postal code format",
    "latitude": "Latitude out of valid range"
  }
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Access denied to object",
  "code": "OBJECT_ACCESS_DENIED",
  "details": {
    "objectId": "BLD001",
    "requiredPermission": "admin",
    "userMandant": 2,
    "objectMandant": 1
  }
}
```

### Relationship Errors
```json
{
  "success": false,
  "error": "Invalid object hierarchy",
  "code": "HIERARCHY_ERROR",
  "details": {
    "parentId": 1,
    "childType": "building",
    "constraint": "Buildings cannot have building parents"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/object.ts`
- **Controller**: `server/controllers/objectController.ts`
- **Database Schema**: objects, object_mandant, object_groups tables
- **Validation**: Object-specific business rule validation

### Frontend Usage
```typescript
// Get objects for user's mandants
const objects = await apiRequest('/api/objects?mandantId=1');

// Create new building
const newBuilding = await apiRequest('/api/objects', {
  method: 'POST',
  body: {
    objectid: 'BLD003',
    name: 'New Office Building',
    type: 'building',
    address: 'Innovation Straße 789',
    mandantId: 1
  }
});

// Get object hierarchy
const hierarchy = await apiRequest('/api/objects/hierarchy/1');
```

### Performance Optimization
- **Hierarchical Queries**: Optimized parent-child relationship queries
- **Pagination**: Large object lists with efficient pagination
- **Caching**: Frequently accessed object data caching
- **Indexing**: Composite indexes for common query patterns

### Data Synchronization
- **Real-time Updates**: WebSocket notifications for object changes
- **Audit Trail**: Complete change history tracking
- **Backup Integration**: Automated backup of object configurations
- **Import/Export**: Bulk object data management capabilities

## Development Notes

### Test Data Generation
```typescript
// Generate realistic object hierarchy
const testObjects = generateObjectHierarchy({
  mandantId: 1,
  buildings: 3,
  floorsPerBuilding: 5,
  apartmentsPerFloor: 4,
  includeTechnicalData: true
});
```

### Object ID Generation
```typescript
// Automatic object ID generation
function generateObjectId(type: string, parentId?: string): string {
  const prefix = getTypePrefix(type); // BLD, APT, FLR, etc.
  const sequence = getNextSequence(prefix);
  const parentSuffix = parentId ? `_${parentId}` : '';
  return `${prefix}${sequence.toString().padStart(3, '0')}${parentSuffix}`;
}
```

### Hierarchy Management
- **Tree Structure**: Efficient tree traversal algorithms
- **Bulk Operations**: Mass update/delete operations
- **Relationship Validation**: Automatic integrity checking
- **Migration Support**: Hierarchy restructuring capabilities

### Future Enhancements
- **GIS Integration**: Geographic information system integration
- **IoT Integration**: Smart building sensor integration
- **Mobile App**: Field technician mobile application
- **Blockchain**: Property ownership verification
- **AI Integration**: Predictive maintenance recommendations

## Related APIs

- **Energy APIs**: Object-specific energy data in `energy_apis.md`
- **Temperature APIs**: Object temperature sensors in `temperature_apis.md`
- **User Management**: User-object permission relationships in `user_management_apis.md`
- **Database APIs**: Core object data storage in `database_apis.md`
