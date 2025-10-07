# Temperature APIs

## Overview

The temperature APIs provide comprehensive temperature monitoring and analysis capabilities including indoor/outdoor temperature tracking, threshold monitoring, temperature efficiency analysis, and automated alerting based on temperature deviations.

## API Endpoints

### GET `/api/settings/thresholds`
Get temperature monitoring thresholds and configuration.

**Authentication**: Required
**Method**: GET

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "temperatureThresholds": {
      "minIndoorTemp": 18.0,
      "maxIndoorTemp": 25.0,
      "optimalIndoorTemp": 21.0,
      "criticalLowTemp": 16.0,
      "criticalHighTemp": 28.0,
      "tempDeviationThreshold": 2.0
    },
    "alertSettings": {
      "enableAlerts": true,
      "alertCooldownMinutes": 30,
      "emailNotifications": true,
      "smsNotifications": false
    },
    "monitoringSettings": {
      "checkIntervalMinutes": 15,
      "dataRetentionDays": 365,
      "anomalyDetection": true
    }
  }
}
```

### GET `/api/temperature-analysis/:objectId`
Get comprehensive temperature analysis for a specific object.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): Analysis period (default: 'last-month')
- `includeAlerts` (optional): Include temperature alerts data

### GET `/api/temperature-analysis`
Get temperature analysis for all objects accessible to the authenticated user.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): Analysis period (default: 'last-month')
- `includeAlerts` (optional): Include temperature alerts data
- `limit` (optional): Maximum number of objects to analyze (default: 50)

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "objectId": "OBJ001",
    "analysisPeriod": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "temperatureStats": {
      "averageIndoorTemp": 21.8,
      "averageOutdoorTemp": 8.5,
      "minIndoorTemp": 18.2,
      "maxIndoorTemp": 24.5,
      "temperatureVariance": 1.2,
      "comfortHours": 85.5
    },
    "efficiencyMetrics": {
      "heatingEfficiency": 0.87,
      "temperatureConsistency": 0.92,
      "energyWasteHours": 24
    },
    "alerts": [
      {
        "id": 1,
        "type": "low_temperature",
        "severity": "warning",
        "message": "Indoor temperature below threshold",
        "value": 17.8,
        "threshold": 18.0,
        "timestamp": "2024-01-15T02:30:00.000Z",
        "resolved": true,
        "resolutionTime": "2024-01-15T03:15:00.000Z"
      }
    ],
    "recommendations": [
      {
        "type": "temperature_optimization",
        "description": "Consider adjusting thermostat schedule for better comfort",
        "potentialSavings": 150
      }
    ]
  }
}
```

### GET `/api/temperature-analysis`
Get temperature analysis for all objects accessible to the user.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `mandantId` (optional): Filter by mandant
- `alertStatus` (optional): Filter by alert status ('active', 'resolved', 'all')

## Temperature Monitoring Components

### Threshold Management
- **Indoor Temperature Ranges**: Comfort and safety thresholds
- **Critical Alerts**: Emergency temperature conditions
- **Deviation Monitoring**: Temperature stability tracking
- **Seasonal Adjustments**: Dynamic threshold adaptation

### Alert System
- **Alert Types**: Low temp, high temp, deviation, system failure
- **Severity Levels**: Info, warning, critical
- **Notification Channels**: Email, SMS, dashboard alerts
- **Cooldown Periods**: Prevent alert spam

### Analysis Algorithms
- **Comfort Hours Calculation**: Percentage of time in optimal range
- **Temperature Variance**: Stability measurement
- **Efficiency Correlation**: Temperature vs energy consumption
- **Trend Analysis**: Temperature pattern identification

## Data Models

### TemperatureReading Schema
```typescript
interface TemperatureReading {
  id: number;
  objectId: string;
  sensorId: string;
  timestamp: Date;
  indoorTemp: number;
  outdoorTemp: number;
  targetTemp: number;
  humidity?: number;
  sensorStatus: 'online' | 'offline' | 'maintenance';
}
```

### TemperatureAlert Schema
```typescript
interface TemperatureAlert {
  id: number;
  objectId: string;
  alertType: 'low_temp' | 'high_temp' | 'deviation' | 'sensor_failure';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: number;
}
```

## Alert Management

### Alert Types
1. **Low Temperature**: Indoor temp below minimum threshold
2. **High Temperature**: Indoor temp above maximum threshold
3. **Temperature Deviation**: Unusually large temperature changes
4. **Sensor Failure**: Sensor offline or malfunctioning
5. **System Failure**: Heating/cooling system issues

### Alert Workflow
1. **Detection**: Automated threshold monitoring
2. **Alert Creation**: Database alert record creation
3. **Notification**: Email/SMS/dashboard notifications
4. **Acknowledgment**: Manual alert acknowledgment
5. **Resolution**: Automatic or manual resolution
6. **Reporting**: Alert history and analytics

## Integration Points

### Energy System Integration
- **Consumption Correlation**: Temperature vs energy usage analysis
- **Heating Optimization**: Smart thermostat control
- **Efficiency Analysis**: Temperature-based efficiency calculations

### Weather Service Integration
- **Outdoor Temperature**: Real-time weather data
- **Degree Day Calculations**: Weather-normalized analysis
- **Seasonal Adjustments**: Dynamic threshold adaptation

### IoT Sensor Integration
- **Sensor Management**: Multi-sensor network monitoring
- **Data Validation**: Sensor data quality assurance
- **Calibration**: Automatic sensor calibration routines

## Error Handling

### Sensor Data Errors
```json
{
  "success": false,
  "error": "Invalid sensor data",
  "code": "SENSOR_DATA_ERROR",
  "details": {
    "sensorId": "TEMP001",
    "issue": "Temperature reading out of range",
    "value": 150.5,
    "expectedRange": "-50 to 50"
  }
}
```

### Alert System Errors
```json
{
  "success": false,
  "error": "Alert system unavailable",
  "code": "ALERT_SYSTEM_ERROR",
  "details": {
    "component": "email_service",
    "status": "offline"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/temperature.ts`
- **Controller**: `server/controllers/temperatureController.ts`
- **Alert Engine**: Custom alert detection and notification system
- **Data Models**: Temperature and alert database schemas

### Frontend Usage
```typescript
// Get temperature analysis
const tempAnalysis = await apiRequest(`/api/temperature-analysis/${objectId}?timeRange=last-month&includeAlerts=true`);

// Display temperature alerts
const { alerts, temperatureStats } = tempAnalysis.data;

// Real-time temperature monitoring
const temperatureSocket = new WebSocket('/ws/temperature');
temperatureSocket.onmessage = (event) => {
  const reading = JSON.parse(event.data);
  updateTemperatureDisplay(reading);
};
```

### Real-time Monitoring
- **WebSocket Integration**: Real-time temperature updates
- **Live Dashboard**: Real-time temperature visualization
- **Alert Notifications**: Instant alert notifications
- **Data Streaming**: Continuous sensor data streaming

### Performance Optimization
- **Data Aggregation**: Hourly/daily temperature summaries
- **Alert Deduplication**: Prevent duplicate alerts
- **Caching Strategy**: Frequently accessed temperature data caching
- **Background Processing**: Asynchronous alert processing

## Development Notes

### Test Data Generation
```typescript
// Generate realistic temperature test data
const testTempData = generateTemperatureTestData({
  objectId: 'OBJ001',
  baseTemp: 21.0,
  seasonalVariation: true,
  includeAlerts: true,
  sensorCount: 3
});
```

### Sensor Simulation
```typescript
// Simulate temperature sensor readings
const sensorSimulator = new TemperatureSensorSimulator({
  objectId: 'OBJ001',
  sensors: [
    { id: 'indoor_1', type: 'indoor', location: 'living_room' },
    { id: 'outdoor_1', type: 'outdoor', location: 'north_wall' }
  ],
  intervalMs: 60000 // 1 minute readings
});
```

### Alert Testing
- **Alert Scenarios**: Various temperature alert conditions
- **Notification Testing**: Email/SMS alert delivery testing
- **Resolution Workflows**: Alert acknowledgment and resolution testing
- **Performance Testing**: High-frequency alert generation testing

### Future Enhancements
- **Predictive Alerts**: ML-based temperature prediction
- **Smart Thermostat Integration**: Direct thermostat control
- **Thermal Imaging**: Advanced temperature mapping
- **Energy Optimization**: AI-driven temperature optimization

## Related APIs

- **Energy APIs**: Temperature-efficiency correlation in `energy_apis.md`
- **Weather APIs**: Outdoor temperature data in `weather_apis.md`
- **Efficiency APIs**: Temperature-based efficiency analysis in `efficiency_apis.md`
- **Object Management**: Temperature sensors per object in `object_management_apis.md`
