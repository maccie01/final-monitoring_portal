#!/usr/bin/env tsx

import { weatherService } from "../services/weatherService";
import { Pool } from "pg";

/**
 * Daily automated weather data update from Bright Sky API (DWD)
 *
 * This script should be run daily (e.g., via cron) to fetch the previous day's
 * temperature data for all postal codes in the objects table.
 *
 * Recommended cron schedule:
 *   0 6 * * * cd /path/to/app && npm run weather:daily
 *
 * This runs at 6:00 AM every day, ensuring previous day's data is available.
 */

// Create a lightweight pool for this script only (5 connections max)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function dailyWeatherUpdate() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`🌡️  DAILY WEATHER UPDATE - ${dateStr}`);
  console.log('=' .repeat(60));
  console.log();

  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    await pool.end();
    process.exit(1);
  }

  // Configure weatherService to use our lightweight pool
  weatherService.setPool(pool);

  try {
    console.log(`📅 Fetching temperature data for: ${dateStr}\n`);

    // Import data for all postal codes (uses same date for start and end)
    const result = await weatherService.importDataForAllPostalCodes(dateStr, dateStr);

    console.log('\n' + '='.repeat(60));
    console.log('  DAILY UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log(`📊 Summary:`);
    console.log(`   Date: ${dateStr}`);
    console.log(`   Postal codes processed: ${result.postalCodes}`);
    console.log(`   Records imported: ${result.totalImported}`);
    console.log(`   Records skipped (duplicates): ${result.totalSkipped}`);
    console.log(`   Errors: ${result.totalErrors}`);
    console.log();

    if (result.totalErrors > 0) {
      console.log(`⚠️  Update completed with ${result.totalErrors} errors. Check logs above.\n`);
      await pool.end();
      process.exit(1);
    } else {
      console.log(`✅ Daily weather data imported successfully!\n`);
      await pool.end();
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during daily update:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

// Run the daily update
dailyWeatherUpdate();
