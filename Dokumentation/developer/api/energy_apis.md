# Energy APIs

## Overview

The energy APIs provide comprehensive energy data management including consumption data, temperature efficiency analysis, and energy balance calculations. The system supports real-time monitoring and historical data analysis.

## API Endpoints

### GET `/api/energy-data`
Get energy data with optional filtering.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `objectId` (optional): Filter by object
- `startDate` (optional): Start date for data range
- `endDate` (optional): End date for data range
- `limit` (optional): Number of records to return

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "objectId": "OBJ001",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "heatingEnergy": 1250.5,
      "hotWaterEnergy": 340.2,
      "totalEnergy": 1590.7,
      "temperature": 22.5,
      "efficiency": 0.87
    }
  ]
}
```

### POST `/api/energy-data`
Create new energy data record.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "objectId": "OBJ001",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "heatingEnergy": 1250.5,
  "hotWaterEnergy": 340.2,
  "temperature": 22.5
}
```

### GET `/api/daily-consumption/:objectId`
Get daily energy consumption data for a specific object.

**Authentication**: Required
**Method**: GET
**URL Parameters**:
- `objectId`: Object identifier

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "consumption": 1250.5,
      "efficiency": 0.87,
      "temperature": 22.5
    }
  ]
}
```

### GET `/api/monthly-consumption/:objectId`
Get monthly energy consumption data for a specific object.

**Authentication**: Required
**Method**: GET
**URL Parameters**:
- `objectId`: Object identifier

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01",
      "totalConsumption": 38750.5,
      "averageEfficiency": 0.85,
      "averageTemperature": 21.8
    }
  ]
}
```

### GET `/api/energy-data-meters/:objectId`
Get energy meter data for a specific object.

**Authentication**: Required
**Method**: GET
**URL Parameters**:
- `objectId`: Object identifier

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "objectId": "OBJ001",
    "meters": [
      {
        "id": "METER001",
        "type": "heating",
        "currentReading": 1250.5,
        "lastReading": 1200.0,
        "consumption": 50.5
      }
    ]
  }
}
```

### GET `/api/energy-data/temperature-efficiency-chart/:objectId`
Get temperature efficiency chart data for a specific object.

**Authentication**: Required
**Method**: GET
**URL Parameters**:
- `objectId`: Object identifier
**Query Parameters**:
- `timeRange` (optional): Time range ('last-year', 'last-2year', 'last-365-days')

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "datasets": [
      {
        "label": "Efficiency %",
        "data": [85, 87, 83, 89, 86]
      },
      {
        "label": "Temperature °C",
        "data": [20, 22, 18, 24, 21]
      }
    ]
  }
}
```

### GET `/api/temperature-efficiency-chart/:objectId` *(Legacy)*
Legacy compatibility endpoint for temperature efficiency charts. Automatically redirects to the new energy API with parameter mapping.

**Authentication**: Required
**Method**: GET
**URL Parameters**:
- `objectId`: Object identifier
**Query Parameters**:
- `timeRange` (optional): Legacy time range parameter (auto-converted to new format)

**Note**: This endpoint is maintained for backward compatibility. Use `/api/energy-data/temperature-efficiency-chart/:objectId` for new implementations.
