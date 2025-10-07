# Weather APIs

## Overview

The weather APIs provide outdoor temperature data management and degree day calculations for energy efficiency analysis. The system integrates with external weather services and provides both historical and real-time weather data for building performance analysis.

## Public Weather Endpoints

### GET `/api/outdoor-temperatures/postal-code/:postalCode/latest`
Get the latest outdoor temperature for a postal code (public access for integration).

**Authentication**: None required
**Method**: GET
**Parameters**:
- `postalCode`: German postal code (5 digits)

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "postalCode": "10115",
    "temperature": 8.5,
    "humidity": 75,
    "timestamp": "2024-01-15T14:30:00.000Z",
    "source": "DWD",
    "location": {
      "city": "Berlin",
      "latitude": 52.5200,
      "longitude": 13.4050
    }
  }
}
```

### GET `/api/outdoor-temperatures/postal-code/:postalCode`
Get temperature history for a postal code.

**Authentication**: None required
**Method**: GET
**Parameters**:
- `postalCode`: German postal code
- `days` (optional): Number of days history (default: 7, max: 30)

**Response (Success)**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "minTemp": 2.1,
      "maxTemp": 8.5,
      "avgTemp": 5.3,
      "humidity": 75,
      "precipitation": 0.2,
      "degreeDays": 14.7
    }
  ],
  "summary": {
    "period": "7 days",
    "totalDegreeDays": 98.5,
    "avgTemperature": 5.8
  }
}
```

### POST `/api/outdoor-temperatures/restore-climate-data`
Restore climate data from backup (admin operation).

**Authentication**: None required (for data restoration)
**Method**: POST

### POST `/api/outdoor-temperatures/import-2023-climate`
Import 2023 climate data (admin operation).

**Authentication**: None required (for data import)
**Method**: POST

## Authenticated Weather Endpoints

### GET `/api/outdoor-temperatures/objects`
Get temperature data for all objects accessible to the user.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `date` (optional): Specific date for data
- `days` (optional): Number of days history

### GET `/api/outdoor-temperatures/:id`
Get detailed temperature data for a specific outdoor temperature record.

**Authentication**: Required
**Method**: GET

### GET `/api/outdoor-temperatures`
Get all outdoor temperature records with optional filtering.

**Authentication**: Required
**Method**: GET
**Query Parameters**:
- `postalCode` (optional): Filter by postal code
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `limit` (optional): Result limit

### POST `/api/outdoor-temperatures`
Create new outdoor temperature record.

**Authentication**: Required
**Method**: POST
**Content-Type**: application/json

**Request Body**:
```json
{
  "postalCode": "10115",
  "temperature": 8.5,
  "humidity": 75,
  "windSpeed": 12.5,
  "windDirection": "NW",
  "precipitation": 0.0,
  "timestamp": "2024-01-15T14:30:00.000Z"
}
```

### PUT `/api/outdoor-temperatures/:id`
Update outdoor temperature record.

**Authentication**: Required
**Method**: PUT
**Content-Type**: application/json

### DELETE `/api/outdoor-temperatures/:id`
Delete outdoor temperature record.

**Authentication**: Required
**Method**: DELETE

## Degree Day Calculations

### Degree Day Concept
Degree days measure heating/cooling demand based on outdoor temperature:
- **Heating Degree Days (HDD)**: When outdoor temp < base temp (usually 18°C)
- **Cooling Degree Days (CDD)**: When outdoor temp > base temp
- **Formula**: Degree Days = max(0, base_temp - outdoor_temp)

### Integration with Energy Analysis
```javascript
// Degree day calculation for energy normalization
function calculateHeatingDegreeDays(temperatures, baseTemp = 18) {
  return temperatures
    .map(temp => Math.max(0, baseTemp - temp))
    .reduce((sum, dd) => sum + dd, 0);
}

// Energy consumption per degree day
function normalizeConsumption(consumption, degreeDays) {
  if (degreeDays === 0) return 0;
  return consumption / degreeDays;
}
```

## Weather Data Sources

### Primary Data Sources
1. **DWD (Deutscher Wetterdienst)**: Official German weather service
2. **OpenWeatherMap**: Global weather API
3. **Local Weather Stations**: Building-mounted sensors
4. **Historical Climate Data**: Long-term weather archives

### Data Quality Management
- **Source Validation**: Multiple source cross-verification
- **Data Completeness**: Missing data gap filling
- **Accuracy Verification**: Statistical outlier detection
- **Update Frequency**: Real-time to hourly updates

## Weather Data Processing

### Data Normalization
- **Unit Conversion**: Consistent temperature units (°C)
- **Time Zone Handling**: UTC to local time conversion
- **Data Aggregation**: Hourly to daily summaries
- **Quality Filtering**: Invalid data removal

### Storage Optimization
- **Time-series Database**: Optimized for temporal queries
- **Data Compression**: Historical data compression
- **Retention Policies**: Configurable data retention periods
- **Indexing Strategy**: Postal code and timestamp indexing

## Integration Points

### Energy Efficiency Analysis
- **Consumption Normalization**: Weather-adjusted energy analysis
- **Benchmarking**: Weather-normalized building comparisons
- **Seasonal Adjustments**: Dynamic efficiency calculations

### Building Performance
- **Heating Load Calculation**: Degree day-based heating requirements
- **Thermal Performance**: Building envelope efficiency assessment
- **Optimization Recommendations**: Weather-based system adjustments

### Forecasting Integration
- **Weather Predictions**: Future temperature forecasting
- **Load Forecasting**: Predictive heating/cooling demand
- **Optimization Planning**: Weather-aware system scheduling

## Error Handling

### Data Source Errors
```json
{
  "success": false,
  "error": "Weather service unavailable",
  "code": "WEATHER_SERVICE_ERROR",
  "details": {
    "service": "DWD",
    "retryAfter": 300
  }
}
```

### Data Validation Errors
```json
{
  "success": false,
  "error": "Invalid weather data",
  "code": "INVALID_WEATHER_DATA",
  "details": {
    "field": "temperature",
    "value": 150,
    "expectedRange": "-50 to 50"
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/weather.ts`
- **Controller**: `server/controllers/weatherController.ts`
- **Data Models**: Outdoor temperature database schema
- **Weather Service**: External weather API integration

### Frontend Usage
```typescript
// Get current outdoor temperature
const currentTemp = await apiRequest(`/api/outdoor-temperatures/postal-code/10115/latest`);

// Get temperature history for analysis
const tempHistory = await apiRequest(`/api/outdoor-temperatures/postal-code/10115?days=30`);

// Use in energy analysis
const degreeDays = tempHistory.data.summary.totalDegreeDays;
const normalizedConsumption = totalConsumption / degreeDays;
```

### Real-time Updates
- **WebSocket Integration**: Real-time weather updates
- **Push Notifications**: Weather alert notifications
- **Dashboard Updates**: Live weather data in dashboards

### Performance Optimization
- **Caching Strategy**: Weather data caching with TTL
- **Batch Processing**: Bulk weather data imports
- **Query Optimization**: Efficient spatial and temporal queries
- **CDN Integration**: Global weather data distribution

## Development Notes

### Test Data Generation
```typescript
// Generate realistic weather test data
const testWeatherData = generateWeatherTestData({
  postalCode: '10115',
  baseTemp: 10.0,
  seasonalVariation: true,
  includeExtremes: true,
  dataPoints: 8760 // 1 year hourly
});
```

### Weather API Integration
```typescript
// Weather service integration example
const weatherService = new WeatherService({
  primarySource: 'DWD',
  fallbackSource: 'OpenWeatherMap',
  cacheEnabled: true,
  cacheTTL: 1800 // 30 minutes
});
```

### Degree Day Calculations
```typescript
// Advanced degree day calculation
function calculateAdvancedDegreeDays(temperatures, baseTemp = 18, method = 'simple') {
  switch (method) {
    case 'simple':
      return calculateHeatingDegreeDays(temperatures, baseTemp);
    case 'weighted':
      return calculateWeightedDegreeDays(temperatures, baseTemp);
    case 'nonlinear':
      return calculateNonlinearDegreeDays(temperatures, baseTemp);
    default:
      return calculateHeatingDegreeDays(temperatures, baseTemp);
  }
}
```

### Data Quality Monitoring
- **Source Reliability**: Weather service uptime monitoring
- **Data Accuracy**: Cross-source data validation
- **Update Frequency**: Real-time data freshness monitoring
- **Historical Consistency**: Long-term data quality assurance

## Related APIs

- **Energy APIs**: Degree day integration in `energy_apis.md`
- **Efficiency APIs**: Weather-normalized analysis in `efficiency_apis.md`
- **Temperature APIs**: Indoor/outdoor correlation in `temperature_apis.md`
- **Object Management**: Location-based weather data in `object_management_apis.md`
