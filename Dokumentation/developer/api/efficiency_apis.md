# Efficiency Analysis APIs

## Overview

The efficiency APIs provide advanced energy efficiency analysis including consumption pattern analysis, temperature correlation, performance benchmarking, and optimization recommendations. The system uses real database data (no mock data) for accurate efficiency calculations.

## API Endpoints

### GET `/api/efficiency-analysis/:objectId`
Get comprehensive efficiency analysis for a specific object.

**Authentication**: None required (for testing)
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): Analysis period (default: last-year)
- `includeRecommendations` (optional): Include optimization recommendations

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "objectId": "OBJ001",
    "analysisPeriod": {
      "startDate": "2023-01-01",
      "endDate": "2023-12-31"
    },
    "efficiencyMetrics": {
      "overallEfficiency": 0.85,
      "heatingEfficiency": 0.87,
      "hotWaterEfficiency": 0.78,
      "seasonalEfficiency": {
        "winter": 0.82,
        "summer": 0.91,
        "spring": 0.88,
        "autumn": 0.85
      }
    },
    "consumptionAnalysis": {
      "totalConsumption": 45000,
      "baselineConsumption": 52000,
      "savings": 7000,
      "savingsPercentage": 13.5,
      "degreeDays": 1800,
      "consumptionPerDegreeDay": 25.0
    },
    "temperatureCorrelation": {
      "correlationCoefficient": 0.78,
      "optimalTemperature": 21.5,
      "temperatureRange": {
        "min": 19.0,
        "max": 24.0,
        "average": 21.8
      }
    },
    "benchmarking": {
      "buildingType": "residential",
      "peerComparison": {
        "percentile": 75,
        "betterThan": "75% of similar buildings"
      },
      "efficiencyRating": "B+"
    },
    "recommendations": [
      {
        "type": "temperature_optimization",
        "priority": "high",
        "potentialSavings": 2500,
        "description": "Reduce heating temperature by 0.5°C",
        "implementation": "Adjust thermostat settings"
      },
      {
        "type": "maintenance",
        "priority": "medium",
        "potentialSavings": 1200,
        "description": "Clean heating system filters",
        "implementation": "Schedule annual maintenance"
      }
    ]
  },
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Efficiency Analysis Components

### Efficiency Metrics Calculation
- **Overall Efficiency**: Total system efficiency across all energy uses
- **Heating Efficiency**: Space heating efficiency specifically
- **Hot Water Efficiency**: Domestic hot water efficiency
- **Seasonal Variations**: Efficiency changes by season

### Consumption Analysis
- **Baseline Comparison**: Comparison with theoretical consumption
- **Degree Day Normalization**: Weather-adjusted consumption analysis
- **Savings Calculations**: Potential savings identification
- **Trend Analysis**: Consumption pattern identification

### Temperature Correlation
- **Indoor-Outdoor Correlation**: Relationship between indoor comfort and outdoor temperature
- **Optimal Temperature Range**: Data-driven temperature recommendations
- **Heating Curve Analysis**: Heating system performance curves

### Benchmarking
- **Peer Comparison**: Comparison with similar buildings
- **Industry Standards**: Compliance with energy efficiency standards
- **Rating System**: A+ to F efficiency ratings

## Efficiency Algorithms

### Degree Day Calculation
```javascript
// Degree day calculation for weather normalization
function calculateDegreeDays(outdoorTemperatures, baseTemperature = 20) {
  return outdoorTemperatures
    .filter(temp => temp < baseTemperature)
    .map(temp => baseTemperature - temp)
    .reduce((sum, dd) => sum + dd, 0);
}
```

### Efficiency Formula
```javascript
// Efficiency calculation
function calculateEfficiency(actualConsumption, theoreticalConsumption) {
  if (theoreticalConsumption === 0) return 0;
  return Math.min(actualConsumption / theoreticalConsumption, 1.0);
}
```

### Benchmarking Algorithm
```javascript
// Building type-based benchmarking
function calculateBenchmarking(efficiency, buildingType, size) {
  const benchmarks = {
    residential: { excellent: 0.90, good: 0.80, average: 0.70 },
    commercial: { excellent: 0.85, good: 0.75, average: 0.65 }
  };

  const benchmark = benchmarks[buildingType];
  if (efficiency >= benchmark.excellent) return 'A';
  if (efficiency >= benchmark.good) return 'B';
  if (efficiency >= benchmark.average) return 'C';
  return 'D';
}
```

## Data Sources

### Energy Consumption Data
- **Real-time Meter Data**: Live consumption from smart meters
- **Historical Data**: Multi-year consumption history
- **Sub-metering**: Individual system/component monitoring

### Environmental Data
- **Outdoor Temperature**: Weather service integration
- **Building Characteristics**: Size, insulation, orientation
- **Occupancy Patterns**: Usage pattern analysis

### System Performance Data
- **Heating System Data**: Boiler efficiency, pump performance
- **Temperature Sensors**: Indoor/outdoor temperature monitoring
- **Maintenance Records**: Service history and component status

## Recommendation Engine

### Optimization Categories
1. **Temperature Optimization**: Optimal heating temperature settings
2. **System Maintenance**: Regular maintenance scheduling
3. **Operational Improvements**: Usage pattern optimization
4. **Equipment Upgrades**: Component replacement recommendations
5. **Behavioral Changes**: Occupant behavior modification suggestions

### Priority Classification
- **High Priority**: >5% potential savings, low implementation cost
- **Medium Priority**: 2-5% potential savings, moderate cost
- **Low Priority**: <2% potential savings, high implementation cost

### Implementation Tracking
- **Cost-Benefit Analysis**: ROI calculations for recommendations
- **Timeline Estimates**: Implementation time requirements
- **Success Metrics**: Expected performance improvements

## Error Handling

### Data Quality Issues
```json
{
  "success": false,
  "error": "Insufficient data for analysis",
  "code": "INSUFFICIENT_DATA",
  "details": {
    "requiredPeriod": "At least 6 months of data needed",
    "availableData": "3 months available"
  }
}
```

### Calculation Errors
```json
{
  "success": false,
  "error": "Efficiency calculation failed",
  "code": "CALCULATION_ERROR",
  "details": {
    "reason": "Invalid temperature data range",
    "affectedMetrics": ["temperatureCorrelation", "seasonalEfficiency"]
  }
}
```

## Implementation Details

### Files Used
- **Route Handler**: `server/routes/efficiency.ts`
- **Controller**: `server/controllers/efficiencyController.ts`
- **Analysis Engine**: Custom efficiency calculation algorithms
- **Data Models**: Efficiency metrics and recommendation schemas

### Frontend Usage
```typescript
// Get comprehensive efficiency analysis
const analysis = await apiRequest(`/api/efficiency-analysis/${objectId}?timeRange=last-year&includeRecommendations=true`);

// Use analysis data for dashboard display
const { efficiencyMetrics, recommendations } = analysis.data;

// Implement recommendations tracking
recommendations.forEach(rec => {
  if (rec.priority === 'high') {
    // Highlight high-priority recommendations
    displayRecommendationAlert(rec);
  }
});
```

### Real-time Analysis
- **Data Processing**: Continuous data analysis pipeline
- **Alert Generation**: Automatic efficiency alert generation
- **Report Scheduling**: Automated efficiency report generation

### Performance Optimization
- **Data Aggregation**: Pre-calculated efficiency metrics
- **Caching Strategy**: Analysis results caching for quick access
- **Incremental Updates**: Progressive analysis updates as new data arrives

## Integration Points

### Grafana Dashboards
- **Efficiency Panels**: Real-time efficiency monitoring
- **Trend Charts**: Long-term efficiency trend visualization
- **Alert Integration**: Efficiency threshold alerts

### AI/KI System
- **Predictive Analysis**: ML-based efficiency prediction
- **Anomaly Detection**: Unusual consumption pattern identification
- **Optimization Algorithms**: AI-driven optimization recommendations

### External Systems
- **Weather Services**: Degree day calculation integration
- **Benchmarking Databases**: Industry comparison data
- **Regulatory Compliance**: Energy efficiency standard compliance

## Development Notes

### Test Data Generation
```typescript
// Generate realistic efficiency test data
const testEfficiencyData = generateEfficiencyTestData({
  objectId: 'OBJ001',
  baselineEfficiency: 0.75,
  improvementPotential: 0.15,
  seasonalVariation: true
});
```

### Algorithm Validation
- **Cross-validation**: Multiple calculation method comparison
- **Historical Validation**: Back-testing with known results
- **Peer Review**: Algorithm validation by domain experts

### Monitoring and Logging
- **Performance Metrics**: Analysis execution time monitoring
- **Accuracy Tracking**: Calculation accuracy validation
- **Error Rate Monitoring**: Analysis failure rate tracking

### Future Enhancements
- **Machine Learning Integration**: Advanced predictive modeling
- **IoT Sensor Integration**: Real-time efficiency monitoring
- **Blockchain Integration**: Efficiency certificate verification
- **Carbon Footprint Analysis**: Environmental impact calculations

## Related APIs

- **Energy Data**: Raw consumption data in `energy_apis.md`
- **KI Reports**: Advanced AI analysis in `ki_report_apis.md`
- **Temperature**: Temperature correlation data in `temperature_apis.md`
- **Weather**: Degree day calculations in `weather_apis.md`
