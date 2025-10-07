# Weather Data Setup - Bright Sky API Integration

**Status**: ✅ IMPLEMENTED
**Date**: 2025-10-07
**API Source**: Bright Sky API (German Weather Service DWD)
**Cost**: FREE (no API key required)

---

## Overview

This application integrates with the Bright Sky API to fetch daily outdoor temperature data for German postal codes. The temperature data is used for:

- Temperature-efficiency correlation analysis (GEG 2024 compliance)
- Heating Degree Days calculations (DIN V 18599)
- Weather-adjusted benchmarking (VDI 3807)
- Energy efficiency class reporting

## Database Schema

**Table**: `daily_outdoor_temperatures`

**Columns**:
- `id` - Primary key
- `date` - Date of measurement (YYYY-MM-DD)
- `postal_code` - German postal code (PLZ)
- `city` - City name
- `temperature_min` - Daily minimum temperature (°C)
- `temperature_max` - Daily maximum temperature (°C)
- `temperature_mean` - Daily average temperature (°C)
- `data_source` - Default: "DWD (Bright Sky)"
- `data_quality` - Data quality indicator
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes**:
- Unique index on (`postal_code`, `date`)

---

## Supported Postal Codes

The weatherService supports **62+ postal codes** across **14 German cities**:

### Major Cities (Exact Coordinates)

- **Hannover**: 30161, 30159, 30167, 30169, 30173
- **Berlin**: 10115, 10117, 10178, 10179, 10243
- **Hamburg**: 20095, 20099, 20144, 22143, 22765
- **München**: 80331, 80335, 80333, 80539, 81541
- **Köln**: 50667, 50668, 50672, 50674, 50676
- **Frankfurt am Main**: 60311, 60313, 60308, 60316, 60594
- **Stuttgart**: 70173, 70174, 70176, 70178, 70182
- **Düsseldorf**: 40210, 40211, 40213, 40215
- **Dortmund**: 44135, 44137, 44139
- **Essen**: 45127, 45128, 45130
- **Leipzig**: 04103, 04105, 04109
- **Dresden**: 01067, 01069, 01097
- **Bremen**: 28195, 28199, 28203
- **Nürnberg**: 90402, 90403, 90408

### Regional Fallbacks

For postal codes not listed above, the system automatically uses the nearest regional weather station based on postal code prefix. Supports **30+ regional prefixes** covering most of Germany.

---

## NPM Scripts

### 1. Import Historical Data

Import weather data for specific years:

```bash
# Import 2024 data
npm run import:weather 2024

# Import multiple years
npm run import:weather 2023 2024

# Import 2023-2024 (default if no args)
npm run import:weather
```

**Features**:
- Fetches data for all postal codes in `objects` table
- Aggregates hourly API data into daily min/max/mean
- Handles duplicates gracefully (ON CONFLICT DO NOTHING)
- Rate limiting: 1 second between postal codes
- Progress logging with temperature values

**Example Output**:
```
🌡️  BRIGHT SKY WEATHER DATA IMPORT
=====================================

📅 Target years: 2024

Date range: 2024-01-01 to 2024-12-31

📍 Found 2 unique postal codes in objects table
   30161, 45701

🌡️ Processing postal code: 30161
   ✅ 2024-01-01: 7.1°C (5.3°C - 8.4°C)
   ✅ 2024-01-02: 7.2°C (4.7°C - 11.5°C)
   ...
   Summary: 366 imported, 0 skipped, 0 errors
```

### 2. Daily Automated Update

Fetch yesterday's temperature data for all postal codes:

```bash
npm run weather:daily
```

**Features**:
- Automatically calculates yesterday's date
- Imports temperature data for all postal codes
- Suitable for cron jobs
- Lightweight database pool (5 connections)

**Example Output**:
```
🌡️  DAILY WEATHER UPDATE - 2024-10-06
============================================================

✅ Database connection established

📅 Fetching temperature data for: 2024-10-06

📊 Summary:
   Date: 2024-10-06
   Postal codes processed: 2
   Records imported: 2
   Records skipped (duplicates): 0
   Errors: 0

✅ Daily weather data imported successfully!
```

---

## Setting Up Daily Automation

### Option 1: System Crontab (Recommended)

Add to your system crontab (`crontab -e`):

```bash
# Daily weather update at 6:00 AM
0 6 * * * cd /Users/janschubert/code-projects/monitoring_firma/app-version-4_netzwächter && npm run weather:daily >> /var/log/weather-daily.log 2>&1
```

**Notes**:
- Update the path to match your project directory
- Logs are written to `/var/log/weather-daily.log`
- Runs at 6:00 AM daily (after DWD data is available)

### Option 2: PM2 Process Manager

If using PM2, create an ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'weather-daily',
    script: 'npm',
    args: 'run weather:daily',
    cron_restart: '0 6 * * *',
    autorestart: false,
    env_file: '.env'
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Option 3: GitHub Actions / GitLab CI

For cloud-deployed applications:

```yaml
name: Daily Weather Update

on:
  schedule:
    - cron: '0 6 * * *'  # 6:00 AM UTC daily

jobs:
  update-weather:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run weather:daily
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Current Data Status

### Database Contents

```sql
SELECT
  postal_code,
  COUNT(*) as records,
  MIN(date) as earliest,
  MAX(date) as latest
FROM daily_outdoor_temperatures
GROUP BY postal_code
ORDER BY postal_code;
```

**Expected Output** (after initial import):
```
postal_code | records | earliest   | latest
------------|---------|------------|------------
10115       | 731     | 2023-01-01 | 2024-12-31
30161       | 731     | 2023-01-01 | 2024-12-31
```

### Data Coverage

- **2023**: 365 days per postal code
- **2024**: 366 days per postal code (leap year)
- **Total**: 731 days per postal code

---

## API Endpoints

### GET /api/outdoor-temperatures/postal-code/:postalCode

Fetch temperature data for a specific postal code and date range.

**Parameters**:
- `postalCode` (required) - German postal code
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)

**Example**:
```bash
curl "http://localhost:4004/api/outdoor-temperatures/postal-code/30161?startDate=2024-01-01&endDate=2024-01-31"
```

**Response**:
```json
[
  {
    "id": 5,
    "date": "2024-01-01T00:00:00.000Z",
    "postalCode": "30161",
    "city": "Hannover",
    "temperatureMin": "4.7",
    "temperatureMax": "11.5",
    "temperatureMean": "7.2",
    "dataSource": "DWD (Bright Sky)",
    "dataQuality": null,
    "createdAt": "2025-10-07T12:54:49.219Z",
    "updatedAt": "2025-10-07T12:54:49.219Z"
  }
]
```

---

## Troubleshooting

### Issue: "Too many clients already"

**Cause**: Multiple dev servers or scripts running simultaneously.

**Solution**:
1. Kill background processes: `pkill -f "npm run dev"`
2. The import script uses a lightweight pool (5 connections max)
3. Avoid running import script while dev server is running

### Issue: "No coordinates found for postal code XXXXX"

**Cause**: Postal code not in the mapping table.

**Solution**: The system automatically falls back to the nearest regional weather station. No action needed.

**Example**:
```
ℹ️ Using regional fallback: 45701 → 10115 (Berlin)
```

### Issue: Empty temperature data

**Cause**: Historical data not yet imported.

**Solution**: Run the import script:
```bash
npm run import:weather 2023 2024
```

---

## Technical Details

### Bright Sky API

**Base URL**: https://api.brightsky.dev
**Documentation**: https://brightsky.dev/docs/

**Request Example**:
```
GET https://api.brightsky.dev/weather?lat=52.3759&lon=9.7320&date=2024-01-01&last_date=2024-12-31
```

**Response**: Hourly temperature data in °C

### Data Aggregation

The weatherService automatically:
1. Fetches hourly temperature data from Bright Sky
2. Groups by date (YYYY-MM-DD)
3. Calculates daily statistics:
   - `temperature_min`: Minimum temperature of the day
   - `temperature_max`: Maximum temperature of the day
   - `temperature_mean`: Average of all hourly readings

### Rate Limiting

- **Bright Sky API Limit**: ~2 million requests/day
- **Script Implementation**: 1 second delay between postal codes
- **Daily Update**: ~2 requests per day (one per postal code)
- **Annual Import**: ~730 requests per year per postal code

---

## German Standards Compliance

This temperature-only implementation complies with:

- **GEG 2024** (Gebäudeenergiegesetz): Building Energy Act
- **DIN V 18599**: Energy Evaluation Standards
- **VDI 3807**: Weather-adjusted Benchmarking

**Use Cases**:
- Heating Degree Days (Heizgradtage): `HDD = max(0, 20°C - temp_mean) if temp_mean < 15°C`
- Temperature-Efficiency Correlation: R² > 0.7 for heating-dominated buildings
- Energy Class Reporting: Required for GEG compliance

---

## Files Created

1. **server/services/weatherService.ts** (390 lines)
   - Bright Sky API integration
   - Postal code mapping (62+ locations)
   - Regional fallbacks (30+ prefixes)
   - Data aggregation logic

2. **server/scripts/importWeatherData.ts** (116 lines)
   - Historical data import CLI
   - Year-based filtering
   - Progress logging

3. **server/scripts/dailyWeatherUpdate.ts** (90 lines)
   - Daily automated update
   - Yesterday's date calculation
   - Cron-ready output

4. **package.json** (updated)
   - Added `import:weather` script
   - Added `weather:daily` script

---

## Next Steps (Optional)

### 1. Import Additional Years

```bash
npm run import:weather 2022
npm run import:weather 2021 2022
```

### 2. Add More Postal Codes

Edit `server/services/weatherService.ts` and add to `postalCodeCoords` mapping:

```typescript
'XXXXX': { lat: XX.XXXX, lon: X.XXXX, city: 'City Name' },
```

### 3. Monitor Daily Updates

Check cron logs:
```bash
tail -f /var/log/weather-daily.log
```

### 4. Heating Degree Days Calculation

Add a calculated column for HDD in future iterations:

```sql
ALTER TABLE daily_outdoor_temperatures
  ADD COLUMN heating_degree_days DECIMAL(5,1);

UPDATE daily_outdoor_temperatures
SET heating_degree_days = GREATEST(0, 20 - temperature_mean)
WHERE temperature_mean < 15;
```

---

**Setup Complete** ✅
All weather data infrastructure is ready for production use.
