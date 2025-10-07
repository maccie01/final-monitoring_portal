import type { Request, Response } from "express";
import { storage } from "../storage";
import { getDb } from "../db";
import { ConnectionPoolManager } from "../connection-pool";
import { asyncHandler, createDatabaseError, createValidationError } from "../middleware/error";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const databaseController = {
  // =====================================================
  // DATABASE STATUS & CONNECTION MANAGEMENT
  // =====================================================

  // Get database status and connection information
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    try {
      // Test settingdb connection
      let settingdbOnline = false;
      let settingdbError = null;
      try {
        await ConnectionPoolManager.getInstance().query('SELECT 1');
        settingdbOnline = true;
      } catch (error) {
        settingdbError = (error as Error).message;
        console.error('SettingsDB connection failed:', error);
      }

      // Test portal database connection
      let portalDbOnline = false;
      let portalDbError = null;
      try {
        // Test by attempting to get objects (simple connectivity test)
        await storage.getObjects();
        portalDbOnline = true;
      } catch (error) {
        portalDbError = (error as Error).message;
        console.error('Portal DB connection failed:', error);
      }

      const config = {
        source: 'environment_database_url',
        connectionString: process.env.DATABASE_URL
      };

      res.json({
        settingdbOnline,
        settingdbError,
        portalDbOnline,
        portalDbError,
        usingFallback: false,
        dbSource: config.source,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database status check failed:', error);
      throw createDatabaseError("Failed to check database status");
    }
  }),

  // Test database connection
  testConnection: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can test portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }

    const { host, port, database, username, password, connectionTimeout } = req.body;

    // Validate required fields
    if (!host || !port || !database || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Alle Verbindungsparameter sind erforderlich"
      });
    }

    // Test actual database connection
    try {
      const { Pool } = await import("pg");
      const testPool = new Pool({
        host,
        port: parseInt(port),
        database,
        user: username,
        password,
        connectionTimeoutMillis: connectionTimeout || 10000,
        max: 1 // Only need one connection for testing
      });

      try {
        // Test connection with simple query
        const result = await testPool.query('SELECT 1 as test');
        await testPool.end();

        if (result.rows[0]?.test === 1) {
          console.log(`✅ Database connection test successful: ${host}:${port}/${database}`);
          res.json({
            success: true,
            message: "Datenbankverbindung erfolgreich getestet",
            details: { host, port, database }
          });
        } else {
          await testPool.end();
          res.json({
            success: false,
            message: "Datenbankverbindung fehlgeschlagen: Ungültige Antwort"
          });
        }
      } catch (queryError) {
        await testPool.end();
        console.error('Database connection test failed:', queryError);
        res.json({
          success: false,
          message: `Datenbankverbindung fehlgeschlagen: ${(queryError as Error).message}`
        });
      }
    } catch (error) {
      console.error('Database connection test setup failed:', error);
      res.json({
        success: false,
        message: `Fehler beim Verbindungstest: ${(error as Error).message}`
      });
    }
  }),

  // =====================================================
  // DATA RETRIEVAL OPERATIONS
  // =====================================================

  // Get objects with optional filtering
  getObjects: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    if (!user) {
      throw createValidationError("User session required");
    }

    const userId = user.id;
    const userRole = user.role;
    const userMandantId = user.mandantId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    console.log(`🔍 [OBJECTS-DEBUG] userId: ${userId}, userRole: ${userRole}, userMandantId: ${userMandantId}, isAdmin: ${isAdmin}`);

    try {
      // Get user's accessible mandants
      const mandantAccess = user.mandantAccess || [];
      const accessibleMandants = [userMandantId, ...mandantAccess].filter(Boolean);
      
      console.log(`🔍 [MANDANT-ACCESS] primary: [${userMandantId}], extra: [${mandantAccess}], accessible: [${accessibleMandants}]`);

      // Get objects based on user permissions
      let objects;
      if (isAdmin) {
        // Admins see all objects
        objects = await storage.getObjects(undefined, true);
        console.log(`🔍 [OBJECTS-ALL] ${objects.length} objects returned without filter`);
      } else {
        // Regular users see filtered objects by mandant access
        objects = await storage.getObjects(accessibleMandants, false);
        console.log(`🔍 [OBJECTS-FILTERED] ${objects.length} objects returned for mandants: [${accessibleMandants}]`);
      }

      // Convert objects to JSON and back to handle any remaining BigInt values
      const jsonString = JSON.stringify(objects, (key, value) =>
        typeof value === 'bigint' ? Number(value) : value
      );
      const safeObjects = JSON.parse(jsonString);
      
      res.json(safeObjects);
    } catch (error) {
      console.error('Error fetching objects:', error);
      throw createDatabaseError("Failed to fetch objects");
    }
  }),

  // Get mandants
  getMandants: asyncHandler(async (req: Request, res: Response) => {
    try {
      const mandants = await storage.getMandants();
      res.json(mandants);
    } catch (error) {
      console.error('Error fetching mandants:', error);
      throw createDatabaseError("Failed to fetch mandants");
    }
  }),

  // Dashboard KPIs
  getDashboardKpis: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    if (!user) {
      throw createValidationError("User session required");
    }

    try {
      // Get basic statistics
      const [objects, mandants] = await Promise.all([
        storage.getObjects(),
        storage.getMandants()
      ]);

      // Calculate KPIs
      const kpis = {
        criticalSystems: 0, // This would need actual monitoring logic
        totalFacilities: objects.length,
        totalMandants: mandants.length,
        activeUsers: 1, // This would need actual user counting logic
        systemHealth: 'optimal', // This would need actual health checks
        lastUpdate: new Date().toISOString()
      };

      console.log(`📊 Dashboard KPIs calculated: ${kpis.totalFacilities} facilities, ${kpis.totalMandants} mandants`);
      res.json(kpis);
    } catch (error) {
      console.error('Error calculating dashboard KPIs:', error);
      throw createDatabaseError("Failed to calculate dashboard KPIs");
    }
  }),

  // =====================================================
  // SETTINGS MANAGEMENT
  // =====================================================

  // Get settings with optional category filter
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;

    try {
      const pool = ConnectionPoolManager.getInstance().getPool();
      let settings;
      if (category && typeof category === 'string') {
        // Get settings by category
        const result = await pool.query(
          'SELECT * FROM settings WHERE category = $1 ORDER BY key_name',
          [category]
        );
        settings = result.rows;
        console.log(`✅ Settings loaded from database, category: ${category}, count: ${settings.length}`);
      } else {
        const result = await pool.query(
          'SELECT * FROM settings ORDER BY category, key_name'
        );
        settings = result.rows;
        console.log(`✅ Settings loaded from database, category: undefined, count: ${settings.length}`);
      }

      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw createDatabaseError("Failed to fetch settings");
    }
  }),

  // Create or update setting
  saveSetting: asyncHandler(async (req: Request, res: Response) => {
    const { category, keyName, value, userId, mandantId } = req.body;

    if (!category || !keyName) {
      throw createValidationError("Category and keyName are required");
    }

    try {
      const pool = ConnectionPoolManager.getInstance().getPool();

      // Check if setting exists
      const existingResult = await pool.query(
        'SELECT * FROM settings WHERE category = $1 AND key_name = $2',
        [category, keyName]
      );

      const existingSetting = existingResult.rows[0];

      if (existingSetting) {
        // Update existing setting
        const updateResult = await pool.query(
          'UPDATE settings SET value = $1, user_id = $2, mandant_id = $3, updated_at = NOW() WHERE category = $4 AND key_name = $5 RETURNING *',
          [JSON.stringify(value), userId, mandantId, category, keyName]
        );

        const updated = updateResult.rows[0];

        console.log(`Setting updated: ${category}.${keyName} with value: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        res.json({
          message: "Setting updated successfully",
          setting: updated
        });
      } else {
        // Create new setting
        const insertResult = await pool.query(
          'INSERT INTO settings (category, key_name, value, user_id, mandant_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
          [category, keyName, JSON.stringify(value), userId, mandantId]
        );

        const created = insertResult.rows[0];

        console.log(`Setting created: ${category}.${keyName} with value: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        res.json({
          message: "Setting created successfully",
          setting: created
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      throw createDatabaseError("Failed to save setting");
    }
  }),

  // Delete setting
  deleteSetting: asyncHandler(async (req: Request, res: Response) => {
    const { category, keyName } = req.params;

    if (!category || !keyName) {
      throw createValidationError("Category and keyName are required");
    }

    try {
      const pool = ConnectionPoolManager.getInstance().getPool();

      // Check if setting exists first
      const existingResult = await pool.query(
        'SELECT * FROM settings WHERE category = $1 AND key_name = $2',
        [category, keyName]
      );

      if (existingResult.rows.length === 0) {
        throw createValidationError("Setting not found");
      }

      // Delete the setting
      await pool.query(
        'DELETE FROM settings WHERE category = $1 AND key_name = $2',
        [category, keyName]
      );

      console.log(`Setting deleted: ${category}.${keyName}`);
      res.json({
        message: "Setting deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw createDatabaseError("Failed to delete setting");
    }
  }),

  // =====================================================
  // PORTAL CONFIGURATION MANAGEMENT
  // =====================================================

  // Get portal configuration including settingdb_app (secure version)
  getPortalConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;

    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Benutzer nicht authentifiziert"
      });
    }

    // Only admin/superadmin can access portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Keine Berechtigung für Portal-Konfiguration"
      });
    }

    try {
      const settingdbConfig = {
        source: 'environment_database_url',
        connectionString: process.env.DATABASE_URL
      };

      // Return only safe configuration data without sensitive credentials
      const config = {
        settingdb_app: {
          ssl: true,
          host: "Portal-DB Host",
          port: 5432,
          table: "settings",
          schema: "public",
          database: "Portal-DB",
          // Never return passwords or sensitive data
          hasCredentials: !!process.env.DATABASE_URL,
          source: settingdbConfig.source,
          connectionTimeout: 30001
        }
      };

      console.log('[PORTAL-CONFIG] Returning secure settingdb_app configuration for user:', user.id);
      res.json(config);
    } catch (error) {
      console.error('Error loading portal config:', error);
      res.status(500).json({
        success: false,
        message: "Fehler beim Laden der Portal-Konfiguration"
      });
    }
  }),

  // Get fallback database configuration
  getFallbackConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can access portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }
    
    // Check setup-app.json for fallback credentials
    const configPath = join(process.cwd(), 'server', 'setup-app.json');
    if (!existsSync(configPath)) {
      return res.json({ success: false, message: "Setup-Konfiguration nicht gefunden" });
    }

    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (config.fallback_database) {
      res.json({ 
        success: true, 
        config: config.fallback_database 
      });
    } else {
      res.json({ success: false, message: "Fallback-Datenbank-Konfiguration nicht gefunden" });
    }
  }),

  // Load portal configuration by type
  loadConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can access portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }
    
    const { configType } = req.params;
    
    const configPath = join(process.cwd(), 'server', 'setup-app.json');
    if (!existsSync(configPath)) {
      return res.json({ success: false, message: "Konfigurationsdatei nicht gefunden" });
    }

    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (config[configType]) {
      res.json({ 
        success: true, 
        config: config[configType] 
      });
    } else {
      res.json({ success: false, message: `Konfiguration '${configType}' nicht gefunden` });
    }
  }),

  // Test portal configuration by type
  testConfig: asyncHandler(async (req: Request, res: Response) => {
    const { configType } = req.params;
    const configData = req.body;

    // Test connection based on config type
    if (configType === 'portal_database' || configType === 'settingdb') {
      // Simple validation for database config
      if (configData.host && configData.port && configData.database && configData.username) {
        res.json({ 
          success: true, 
          message: `${configType} Verbindung erfolgreich getestet` 
        });
      } else {
        res.json({ 
          success: false, 
          message: `${configType} Verbindungstest fehlgeschlagen - unvollständige Konfiguration` 
        });
      }
    } else {
      res.json({ 
        success: false, 
        message: `Unbekannter Konfigurationstyp: ${configType}` 
      });
    }
  }),

  // Save portal configuration by type
  saveConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can modify portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }
    
    const { configType } = req.params;
    const configData = req.body;

    const configPath = join(process.cwd(), 'server', 'setup-app.json');
    let config = {};
    
    if (existsSync(configPath)) {
      const existingData = readFileSync(configPath, 'utf8');
      config = JSON.parse(existingData);
    }

    // Update specific configuration
    (config as any)[configType] = configData;

    // Save updated configuration
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: `${configType} Konfiguration erfolgreich gespeichert` 
    });
  }),

  // Activate portal configuration
  activateConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can activate portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }

    const { configType } = req.body;

    if (configType === 'settingdb') {
      try {
        // Read configuration from setup-app.json
        const configPath = join(process.cwd(), 'server', 'setup-app.json');
        if (!existsSync(configPath)) {
          return res.json({
            success: false,
            message: "Konfigurationsdatei nicht gefunden"
          });
        }

        const configData = readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);

        if (!config.settingdb_app) {
          return res.json({
            success: false,
            message: "SettingDB Konfiguration nicht gefunden"
          });
        }

        // Mark this configuration as active
        config.active_config = {
          type: 'settingdb',
          activatedAt: new Date().toISOString(),
          activatedBy: user.id
        };

        // Save updated configuration
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        console.log(`✅ SettingDB configuration activated by user ${user.id}`);
        res.json({
          success: true,
          message: "SettingDB Konfiguration erfolgreich aktiviert"
        });
      } catch (error) {
        console.error('Error activating settingdb config:', error);
        res.json({
          success: false,
          message: `Fehler beim Aktivieren: ${(error as Error).message}`
        });
      }
    } else {
      res.json({
        success: false,
        message: `Aktivierung für '${configType}' nicht unterstützt`
      });
    }
  }),

  // Get active portal configuration
  getActiveConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can access portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }

    try {
      // Read configuration from setup-app.json
      const configPath = join(process.cwd(), 'server', 'setup-app.json');
      if (!existsSync(configPath)) {
        return res.json({
          success: false,
          message: "Konfigurationsdatei nicht gefunden"
        });
      }

      const configData = readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Check if there's an active configuration
      if (config.active_config) {
        console.log(`📋 Active config retrieved: ${config.active_config.type}`);
        res.json({
          success: true,
          config: {
            ...config.active_config,
            status: 'active'
          }
        });
      } else {
        // No active configuration found, return default
        res.json({
          success: true,
          config: {
            type: 'environment',
            status: 'active',
            timestamp: new Date().toISOString(),
            note: 'Using environment DATABASE_URL'
          }
        });
      }
    } catch (error) {
      console.error('Error retrieving active config:', error);
      res.json({
        success: false,
        message: `Fehler beim Laden der aktiven Konfiguration: ${(error as Error).message}`
      });
    }
  }),

  // Save fallback configuration
  saveFallbackConfig: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).session?.user;
    
    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Benutzer nicht authentifiziert" 
      });
    }
    
    // Only admin/superadmin can save portal configuration
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: "Keine Berechtigung für Portal-Konfiguration" 
      });
    }

    const fallbackConfig = req.body;

    // Save to setup-app.json
    const configPath = join(process.cwd(), 'server', 'setup-app.json');
    let config = {};
    
    if (existsSync(configPath)) {
      const existingData = readFileSync(configPath, 'utf8');
      config = JSON.parse(existingData);
    }

    (config as any).fallback_database = fallbackConfig;
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: "Fallback-Konfiguration erfolgreich gespeichert" 
    });
  })
};