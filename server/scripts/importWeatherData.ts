#!/usr/bin/env tsx

import { weatherService } from "../services/weatherService";
import { Pool } from "pg";

/**
 * Import historical weather data from Bright Sky API (DWD)
 *
 * Usage:
 *   npm run import:weather              # Import 2023-2024 for all postal codes
 *   npm run import:weather 2024         # Import 2024 only
 *   npm run import:weather 2023 2024    # Import 2023 and 2024
 */

// Create a lightweight pool for this script only (5 connections max)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function importHistoricalWeather() {
  console.log('🌡️  BRIGHT SKY WEATHER DATA IMPORT');
  console.log('=====================================\n');

  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection initialized\n');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Configure weatherService to use our lightweight pool
  weatherService.setPool(pool);

  // Parse command line arguments
  const args = process.argv.slice(2);

  let years: number[];
  if (args.length === 0) {
    // Default: Import 2023-2024
    years = [2023, 2024];
  } else {
    // Parse years from arguments
    years = args.map(arg => parseInt(arg)).filter(year => !isNaN(year));
    if (years.length === 0) {
      console.error('❌ Invalid year arguments. Usage: npm run import:weather [year1] [year2] ...');
      process.exit(1);
    }
  }

  console.log(`📅 Target years: ${years.join(', ')}\n`);

  try {
    let grandTotalImported = 0;
    let grandTotalSkipped = 0;
    let grandTotalErrors = 0;

    for (const year of years) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  IMPORTING YEAR ${year}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      console.log(`Date range: ${startDate} to ${endDate}`);

      const result = await weatherService.importDataForAllPostalCodes(startDate, endDate);

      grandTotalImported += result.totalImported;
      grandTotalSkipped += result.totalSkipped;
      grandTotalErrors += result.totalErrors;

      console.log(`\n✅ Year ${year} Summary:`);
      console.log(`   Postal codes processed: ${result.postalCodes}`);
      console.log(`   Records imported: ${result.totalImported}`);
      console.log(`   Records skipped (duplicates): ${result.totalSkipped}`);
      console.log(`   Errors: ${result.totalErrors}`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  IMPORT COMPLETE`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`📊 Grand Total:`);
    console.log(`   Years processed: ${years.length}`);
    console.log(`   Records imported: ${grandTotalImported}`);
    console.log(`   Records skipped: ${grandTotalSkipped}`);
    console.log(`   Errors: ${grandTotalErrors}\n`);

    if (grandTotalErrors > 0) {
      console.log(`⚠️  Import completed with ${grandTotalErrors} errors. Check logs above for details.\n`);
      await pool.end();
      process.exit(1);
    } else {
      console.log(`✅ All weather data imported successfully!\n`);
      await pool.end();
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

// Run the import
importHistoricalWeather();
