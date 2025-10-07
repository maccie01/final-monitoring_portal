// Simple database inspection script
// Uses the same connection pattern as the server

// Check environment directly
import { readFileSync } from 'fs';
import { join } from 'path';
import pkg from 'pg';
const { Client } = pkg;

// Read .env file directly
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (err) {
    console.log('Could not read .env file:', err.message);
    return {};
  }
}

async function testDatabase() {
  console.log('🔍 Testing database connection...');

  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

  console.log('DATABASE_URL exists:', !!databaseUrl);

  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found');
    return;
  }

  console.log('DATABASE_URL starts with:', databaseUrl.substring(0, 20) + '...');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Get all tables
    console.log('📊 Fetching table list...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`📋 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Get table structures for key tables
    const keyTables = ['users', 'objects', 'settings', 'sessions'];
    for (const tableName of keyTables) {
      if (tablesResult.rows.some(row => row.table_name === tableName)) {
        console.log(`\n📋 Structure of table '${tableName}':`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`);
        });
      }
    }

    // Check if there are any records in key tables
    console.log('\n📊 Record counts in key tables:');
    for (const tableName of keyTables) {
      if (tablesResult.rows.some(row => row.table_name === tableName)) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  - ${tableName}: ${countResult.rows[0].count} records`);
        } catch (err) {
          console.log(`  - ${tableName}: Error counting records (${err.message})`);
        }
      }
    }

  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
  } finally {
    try {
      await client.end();
      console.log('✅ Database connection closed');
    } catch (err) {
      console.error('Error closing connection:', err.message);
    }
  }
}

testDatabase();
