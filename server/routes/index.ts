import { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { initializeAuth, isAuthenticated } from "../middleware/auth";
import { errorHandler, notFoundHandler } from "../middleware/error";

// Import route modules
import authRoutes from "./auth";
import dbRoutes from "./db";
import weatherRoutes from "./weather";
import portalRoutes from "./portal";
import userRoutes from "./users";
import energyRoutes from "./energy";
import efficiencyRoutes from "./efficiency";
import objectRoutes from "./object";
import kiRoutes from "./kiReport";
import monitoringRoutes from "./monitoring";
import { temperatureRoutes } from "./temperature";
import { weatherController } from "../controllers/weatherController";
import { authController } from "../controllers/authController";

// Database imports for user activity logs
import { getDb } from "../db";
import { userActivityLogs } from "@shared/schema";
import { and, gte, eq, desc } from "drizzle-orm";

export async function setupRoutes(app: Express): Promise<Server> {
  console.log('🔧 [ROUTES] Setting up API routes...');

  try {
    // Initialize authentication middleware first
    await initializeAuth(app);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Public temperature endpoints (BEFORE auth init to avoid global auth)
    app.get('/api/outdoor-temperatures/postal-code/:postalCode/latest', weatherController.getLatestTemperatureByPostalCode);
    app.get('/api/outdoor-temperatures/postal-code/:postalCode', weatherController.getTemperaturesByPostalCode);
    app.post('/api/outdoor-temperatures/restore-climate-data', weatherController.restoreClimateData);
    app.post('/api/outdoor-temperatures/import-2023-climate', weatherController.import2023Climate);

    // Public energy endpoints for real database testing (BEFORE auth init to avoid global auth)
    const { energyController } = await import("../controllers/energyController");
    app.get('/api/public-daily-consumption/:objectId', energyController.getPublicDailyConsumption);
    app.get('/api/public-monthly-consumption/:objectId', energyController.getPublicMonthlyConsumption);
    app.get('/api/monthly-netz/:objectId', energyController.getMonthlyNetz);

    // Public efficiency endpoints for testing (BEFORE auth init to avoid global auth)
    const { efficiencyController } = await import("../controllers/efficiencyController");
    app.get('/api/test-efficiency-analysis/:objectId', efficiencyController.getEfficiencyAnalysis);

    // API route modules
    app.use('/api/auth', authRoutes);
    app.use('/api', dbRoutes);
    app.use('/api/outdoor-temperatures', weatherRoutes);
    app.use('/api/portal', portalRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', energyRoutes);
    app.use('/api', efficiencyRoutes);
    app.use('/api', objectRoutes);
    app.use('/api', kiRoutes);
    app.use('/api', temperatureRoutes);
    app.use('/api/monitoring', monitoringRoutes);
    
    // PDF Export Email Route
    app.post('/api/export/send-email', isAuthenticated, async (req, res) => {
      try {
        const { emailService } = await import("../email-service");
        const multer = (await import("multer")).default;
        
        // Setup multer for file upload
        const upload = multer({ storage: multer.memoryStorage() });
        
        // Handle multipart form data
        upload.single('file')(req, res, async (err) => {
          if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: 'File upload failed' });
          }

          const { email, subject } = req.body;
          const file = req.file;

          console.log('📧 [EMAIL-EXPORT] Received:', { 
            email, 
            subject, 
            hasFile: !!file,
            fileName: file?.originalname,
            fileSize: file?.size,
            body: req.body
          });

          if (!email || !file) {
            console.error('❌ [EMAIL-EXPORT] Missing data:', { email: !!email, file: !!file });
            return res.status(400).json({ error: 'Email and file are required' });
          }

          // Send email with PDF attachment
          const transporter = (emailService as any).transporter;
          if (!transporter) {
            await emailService.initialize();
          }

          const config = (emailService as any).config;
          await transporter.sendMail({
            from: config.email,
            to: email,
            subject: subject || 'Portfolio Objekte Export',
            html: `<p>Anbei finden Sie Ihren PDF-Export der Portfolio-Objekte.</p>`,
            attachments: [{
              filename: file.originalname,
              content: file.buffer
            }]
          });

          res.json({ success: true, message: 'E-Mail erfolgreich versendet' });
        });
      } catch (error) {
        console.error('❌ Error sending export email:', error);
        res.status(500).json({ error: 'Failed to send email' });
      }
    });
    
    // Legacy compatibility route for TemperatureEfficiencyChart
    app.get('/api/temperature-efficiency-chart/:objectId', isAuthenticated, async (req, res) => {
      try {
        // Redirect to new route with parameter mapping
        const { objectId } = req.params;
        const { timeRange } = req.query;
        
        // Map old timeRange format to new format
        let newTimeRange: string;
        if (timeRange === '2024') {
          newTimeRange = 'last-year';
        } else if (timeRange === '2023') {
          newTimeRange = 'last-2year';
        } else if (timeRange === '365days') {
          newTimeRange = 'last-365-days';
        } else {
          newTimeRange = 'last-year'; // default
        }
        
        console.log(`🔗 [LEGACY-API] Redirecting temperature-efficiency-chart for object ${objectId}, timeRange: ${timeRange} -> ${newTimeRange}`);
        
        // Forward to new API using internal call
        const { energyController } = await import("../controllers/energyController");
        req.query.timeRange = newTimeRange;
        await energyController.getTemperatureEfficiencyChart(req, res);
        
      } catch (error) {
        console.error('Legacy temperature-efficiency-chart API error:', error);
        res.status(500).json({ message: 'Failed to fetch combined chart data' });
      }
    });

    // Database status endpoint - reports main PostgreSQL connection pool status
    app.get('/api/database/status', async (req, res) => {
      try {
        const { ConnectionPoolManager } = await import("../connection-pool");
        const poolManager = ConnectionPoolManager.getInstance();
        const health = await poolManager.healthCheck();

        res.json({
          settingdbOnline: health.healthy,
          usingFallback: false,
          activeDatabase: 'PostgreSQL Connection Pool',
          poolStatus: {
            healthy: health.healthy,
            activeConnections: health.activeConnections,
            errorRate: health.errorRate
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Fehler beim Prüfen des Datenbankstatus:', error);
        res.status(500).json({
          success: false,
          message: 'Datenbankstatus konnte nicht ermittelt werden'
        });
      }
    });

    // UserManagement API aliases - map expected URLs to existing controllers
    const { databaseController } = await import("../controllers/databaseController");
    const { userController } = await import("../controllers/userController");
    
    // Add direct routes for UserManagement.tsx expected APIs with proper validation
    app.get('/api/user-profiles', async (req, res) => {
      try {
        const { storage } = await import("../storage");
        const profiles = await storage.getUserProfiles();
        if (!profiles) {
          return res.status(404).json({ error: 'User profiles not found' });
        }
        res.json(profiles);
      } catch (error) {
        console.error('❌ Error fetching user profiles:', error);
        res.status(500).json({ error: 'Failed to fetch user profiles' });
      }
    });
    app.post('/api/user-profiles', async (req, res) => {
      try {
        // Basic validation
        if (!req.body.name) {
          return res.status(400).json({ error: 'Profile name is required' });
        }
        const { storage } = await import("../storage");
        const newProfile = await storage.createUserProfile(req.body);
        if (!newProfile) {
          return res.status(500).json({ error: 'Failed to create user profile' });
        }
        res.status(201).json(newProfile);
      } catch (error) {
        console.error('❌ Error creating user profile:', error);
        res.status(500).json({ error: 'Failed to create user profile' });
      }
    });
    app.put('/api/user-profiles/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid profile ID' });
        }
        const { storage } = await import("../storage");
        const updated = await storage.updateUserProfile(id, req.body);
        if (!updated) {
          return res.status(404).json({ error: 'User profile not found' });
        }
        res.json(updated);
      } catch (error) {
        console.error('❌ Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
      }
    });
    app.delete('/api/user-profiles/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid profile ID' });
        }
        const { storage } = await import("../storage");
        await storage.deleteUserProfile(id);
        // No return value from deleteUserProfile - deletion was successful if no error thrown
        res.json({ success: true });
      } catch (error) {
        console.error('❌ Error deleting user profile:', error);
        res.status(500).json({ error: 'Failed to delete user profile' });
      }
    });
    
    app.post('/api/mandants', async (req, res) => {
      try {
        // Basic validation
        if (!req.body.name) {
          return res.status(400).json({ error: 'Mandant name is required' });
        }
        const { storage } = await import("../storage");
        const newMandant = await storage.createMandant(req.body);
        if (!newMandant) {
          return res.status(500).json({ error: 'Failed to create mandant' });
        }
        res.status(201).json(newMandant);
      } catch (error) {
        console.error('❌ Error creating mandant:', error);
        res.status(500).json({ error: 'Failed to create mandant' });
      }
    });
    app.patch('/api/mandants/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid mandant ID' });
        }
        const { storage } = await import("../storage");
        const updated = await storage.updateMandant(id, req.body);
        if (!updated) {
          return res.status(404).json({ error: 'Mandant not found' });
        }
        res.json(updated);
      } catch (error) {
        console.error('❌ Error updating mandant:', error);
        res.status(500).json({ error: 'Failed to update mandant' });
      }
    });
    app.delete('/api/mandants/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid mandant ID' });
        }
        const { storage } = await import("../storage");
        await storage.deleteMandant(id);
        // No return value from deleteMandant - deletion was successful if no error thrown
        res.json({ success: true });
      } catch (error) {
        console.error('❌ Error deleting mandant:', error);
        res.status(500).json({ error: 'Failed to delete mandant' });
      }
    });
    
    // Object groups API with proper validation and error handling
    app.get('/api/object-groups', async (req, res) => {
      try {
        const { storage } = await import("../storage");
        const objectGroups = await storage.getObjectGroups();
        if (!objectGroups) {
          return res.status(404).json({ error: 'Object groups not found' });
        }
        res.json(objectGroups);
      } catch (error) {
        console.error('❌ Error fetching object groups:', error);
        res.status(500).json({ error: 'Failed to fetch object groups' });
      }
    });
    app.post('/api/object-groups', async (req, res) => {
      try {
        // Basic validation
        if (!req.body.name) {
          return res.status(400).json({ error: 'Object group name is required' });
        }
        const { storage } = await import("../storage");
        const newObjectGroup = await storage.createObjectGroup(req.body);
        if (!newObjectGroup) {
          return res.status(500).json({ error: 'Failed to create object group' });
        }
        res.status(201).json(newObjectGroup);
      } catch (error) {
        console.error('❌ Error creating object group:', error);
        res.status(500).json({ error: 'Failed to create object group' });
      }
    });
    app.patch('/api/object-groups/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid object group ID' });
        }
        const { storage } = await import("../storage");
        const updated = await storage.updateObjectGroup(id, req.body);
        if (!updated) {
          return res.status(404).json({ error: 'Object group not found' });
        }
        res.json(updated);
      } catch (error) {
        console.error('❌ Error updating object group:', error);
        res.status(500).json({ error: 'Failed to update object group' });
      }
    });
    app.delete('/api/object-groups/:id', async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid object group ID' });
        }
        const { storage } = await import("../storage");
        await storage.deleteObjectGroup(id);
        // No return value from deleteObjectGroup - deletion was successful if no error thrown
        res.json({ success: true });
      } catch (error) {
        console.error('❌ Error deleting object group:', error);
        res.status(500).json({ error: 'Failed to delete object group' });
      }
    });
    
    // Setup config API
    app.get('/api/setup-config', async (req, res) => {
      try {
        // Return basic setup configuration for UserManagement
        res.json({
          config: {
            Mandantenrollen: ['besitzer', 'verwalter', 'handwerker'],
            sidebarPermissions: [
              { key: 'showMaps', label: 'Objekt-Karte', icon: 'Building' },
              { key: 'showDashboard', label: 'KPI Dashboard', icon: 'BarChart3' },
              { key: 'showEnergyData', label: 'Energiedaten', icon: 'Zap' },
              { key: 'showNetworkMonitor', label: 'Netzwächter', icon: 'Activity' },
              { key: 'showGrafanaDashboards', label: 'Objekt-Monitoring', icon: 'Database' },
              { key: 'showEfficiencyStrategy', label: 'Klassifizierung', icon: 'BookOpen' },
              { key: 'showSystemSetup', label: 'System-Setup', icon: 'Settings' },
              { key: 'showUserManagement', label: 'Benutzerverwaltung', icon: 'Users' },
              { key: 'showObjectManagement', label: 'Objektverwaltung', icon: 'Building' },
              { key: 'showDeviceManagement', label: 'Geräteverwaltung', icon: 'Settings' },
              { key: 'showLogbook', label: 'Logbuch', icon: 'BookOpen' },
              { key: 'showUser', label: 'Meine Benutzer', icon: 'UserCheck' }
            ]
          }
        });
      } catch (error) {
        console.error('❌ Error fetching setup config:', error);
        res.status(500).json({ error: 'Failed to fetch setup config' });
      }
    });

    // User logs API - load real data from database
    app.get('/api/user-logs', async (req, res) => {
      try {
        const user = (req as any).session?.user;
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Load real user activity logs from database
        const realLogs = await getDb().select().from(userActivityLogs)
          .where(eq(userActivityLogs.userId, user.id))
          .orderBy(desc(userActivityLogs.timestamp))
          .limit(50);

        // Transform to match frontend format if needed
        const transformedLogs = realLogs.map((log: any) => ({
          id: log.id,
          userId: log.userId,
          userName: `${user.firstName} ${user.lastName}`, // Add from session
          action: log.action,
          timestamp: log.timestamp,
          details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
          ipAddress: log.ipAddress || 'Unknown'
        }));

        res.json(transformedLogs);
      } catch (error) {
        console.error('❌ Error fetching user logs:', error);
        res.status(500).json({ error: 'Failed to fetch user logs' });
      }
    });

    // User activity logs API with timeRange support (for UserManagement frontend)
    app.get('/api/user-activity-logs/:timeRange?', async (req, res) => {
      try {
        const user = (req as any).session?.user;
        if (!user) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const timeRange = req.params.timeRange || '7d';
        
        // Calculate time range for filtering
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
          case '1d':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Load ALL user activity logs with user details using storage function with JOIN
        const { storage } = await import("../storage");
        const dateFilter = startDate.toISOString();
        const userLogs = await storage.getUserActivityLogsWithTimeRange(
          undefined, // No userId filter - show ALL users' activities  
          dateFilter,
          50,
          0
        );

        console.log(`📊 [USER-ACTIVITY-LOGS] Returning ${userLogs.length} logs for timeRange: ${timeRange}`);
        res.json(userLogs);
      } catch (error) {
        console.error('❌ Error fetching user activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch user activity logs' });
      }
    });

    // POST endpoint for creating user activity logs
    app.post('/api/user-activity-logs', async (req, res) => {
      try {
        const user = (req as any).session?.user;
        if (!user) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const { action, resourceType, resourceId, details } = req.body;
        
        // Basic validation
        if (!action || !resourceType) {
          return res.status(400).json({ error: 'Action and resourceType are required' });
        }

        // Save new log entry to database
        const insertedLog = await getDb().insert(userActivityLogs).values({
          userId: user.id,
          action,
          resourceType,
          resourceId: resourceId || null,
          details: details || {}
        }).returning();

        console.log('📝 [USER-LOG] Saved new activity log to database:', insertedLog[0] || {});
        
        res.status(201).json({ success: true, log: insertedLog[0] });
      } catch (error) {
        console.error('❌ Error creating user activity log:', error);
        res.status(500).json({ error: 'Failed to create user activity log' });
      }
    });

    app.use('/api/database', dbRoutes); // Alias: /api/database/* -> /api/* (db routes)
    app.use('/api/db', dbRoutes);       // Alternative alias: /api/db/* -> /api/* (db routes)

    // 404 handler for unmatched API routes
    app.use('/api/*', notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    console.log('✅ [ROUTES] API routes configured successfully');

    // Create HTTP server
    const server = createServer(app);
    
    return server;
  } catch (error) {
    console.error('❌ [ROUTES] Failed to setup routes:', error);
    throw error;
  }
}