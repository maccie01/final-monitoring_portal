import type { Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { storage } from "../storage";
import { asyncHandler, createAuthError, createValidationError } from "../middleware/error";

export const authController = {
  /**
   * API: POST /api/auth/superadmin-login
   * Parameter: Body {username, password} für Superadmin-Authentifizierung
   * Zweck: System-Superadmin Anmeldung mit setup-app.json oder ENV-Variablen
   * Auth: Keine Session erforderlich - erstellt neue Superadmin-Session
   * Rückgabe: {message, user} mit Superadmin-Benutzerinformationen
   * DB-Zugriff: setup-app.json Konfigurationsdatei oder SUPERADMIN_USERNAME/PASSWORD ENV
   */
  superadminLogin: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw createValidationError("Benutzername und Passwort erforderlich");
    }

    console.log(`🔍 SUPERADMIN LOGIN ATTEMPT: ${username} with password: ${password.substring(0,3)}***`);
    
    let isValidSuperadmin = false;
    
    // Check setup-app.json for Superadmin credentials first
    try {
      const configPath = join(process.cwd(), 'server', 'setup-app.json');
      const configData = readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config['Login-user']?.enabled && config['Login-user']?.check_superadmin && config.Superadmin) {
        console.log('🔧 Prüfe Superadmin-Einträge aus setup-app.json');
        
        // Check each Superadmin entry
        for (const adminEntry of config.Superadmin) {
          const adminUsername = Object.keys(adminEntry)[0];
          const adminPassword = adminEntry[adminUsername];
          
          if (username === adminUsername && password === adminPassword) {
            console.log(`✅ Superadmin-Authentifizierung erfolgreich für: ${adminUsername}`);
            isValidSuperadmin = true;
            break;
          }
        }
      }
    } catch (configError) {
      console.error('❌ Error reading setup-app.json for Superadmin check:', configError);
    }
    
    // Check environment variables for superadmin credentials (SECURE)
    if (!isValidSuperadmin) {
      const envSuperadminUser = process.env.SUPERADMIN_USERNAME;
      const envSuperadminPass = process.env.SUPERADMIN_PASSWORD;
      
      if (envSuperadminUser && envSuperadminPass) {
        if (username === envSuperadminUser && password === envSuperadminPass) {
          isValidSuperadmin = true;
          console.log('✅ Umgebungsvariablen Superadmin-Authentifizierung erfolgreich');
        }
      }
    }
    
    if (!isValidSuperadmin) {
      throw createAuthError("Ungültige Superadmin-Anmeldedaten");
    }

    // Create superadmin session
    (req.session as any).user = {
      id: 'superadmin',
      email: 'superadmin@system.local',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      userProfileId: null,
      mandantId: null,
      mandantRole: 'superadmin'
    };

    // Log activity
    console.log(`💯 Superadmin ${username} erfolgreich angemeldet um ${new Date().toLocaleString()}`);

    res.json({
      message: "Superadmin erfolgreich angemeldet",
      user: {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin'
      }
    });
  }),

  /**
   * API: POST /api/auth/login
   * Parameter: Body {username, password} für Standard-Benutzer-Authentifizierung
   * Zweck: Normale Benutzer-Anmeldung mit bcrypt-basierter Authentifizierung
   * Auth: Keine Session erforderlich - erstellt neue Benutzer-Session
   * Rückgabe: {message, user} mit Benutzerinformationen und Mandanten-Zuordnung
   * DB-Zugriff: storage.validateUserCredentials() für sichere Passwort-Validierung
   */
  userLogin: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw createValidationError("Benutzername und Passwort erforderlich");
    }

    console.log(`User login attempt for username: ${username}`);

    // Check if it's a superadmin attempting to login via user-login
    let isValidSuperadmin = false;
    try {
      const configPath = join(process.cwd(), 'server', 'setup-app.json');
      const configData = readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config['Login-user']?.enabled && config['Login-user']?.check_superadmin && config.Superadmin) {
        for (const adminEntry of config.Superadmin) {
          const adminUsername = Object.keys(adminEntry)[0];
          const adminPassword = adminEntry[adminUsername];
          
          if (username === adminUsername && password === adminPassword) {
            isValidSuperadmin = true;
            break;
          }
        }
      }
      
      // Check environment variables for superadmin credentials
      if (!isValidSuperadmin) {
        const envSuperadminUser = process.env.SUPERADMIN_USERNAME;
        const envSuperadminPass = process.env.SUPERADMIN_PASSWORD;
        
        if (envSuperadminUser && envSuperadminPass && username === envSuperadminUser && password === envSuperadminPass) {
          isValidSuperadmin = true;
        }
      }
    } catch (configError) {
      console.error('Error checking superadmin credentials:', configError);
    }

    if (isValidSuperadmin) {
      // Create superadmin session
      (req.session as any).user = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
        mandantRole: 'superadmin'
      };

      return res.json({
        message: "Superadmin erfolgreich angemeldet",
        user: {
          id: 'superadmin',
          email: 'superadmin@system.local',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          userProfileId: null,
          mandantId: null,
          userProfile: {
            id: null,
            name: 'Superadmin',
            startPage: '/system-setup',
            sidebar: {
              showSystemSetup: true,
              showLogbook: false,
              showDashboard: false,
              showEnergyData: false,
              showNetworkMonitor: false,
              showUserManagement: false,
              showObjectManagement: false,
              showGrafanaDashboards: false,
              showEfficiencyStrategy: false
            }
          }
        }
      });
    }

    // Regular user authentication 
    const user = await storage.validateUserCredentials(username, password);
    
    if (!user) {
      throw createAuthError("Ungültige Anmeldedaten");
    }

    // Create user session
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userProfileId: user.userProfileId,
      mandantId: user.mandantId,
      mandantAccess: user.mandantAccess,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      sessionStart: Date.now(),
      lastActivity: Date.now()
    };

    console.log(`🔐 Benutzer ${username} erfolgreich angemeldet um ${new Date().toLocaleString()}`);

    res.json({
      message: "Erfolgreich angemeldet",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userProfileId: user.userProfileId,
        mandantId: user.mandantId
      }
    });
  }),

  // Get current user information
  getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
    // Check if this is a superadmin, demo session, or regular auth
    let userId;
    const session = (req as any).session;
    
    if (session?.user) {
      // Demo or superadmin session
      userId = session.user.id;
      
      // Handle superadmin specially
      if (session.user.role === 'superadmin') {
        return res.json({
          id: 'superadmin',
          email: 'superadmin@system.local',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          userProfileId: null,
          mandantId: null,
          userProfile: {
            id: null,
            name: 'Superadmin',
            startPage: '/system-setup',
            sidebar: {
              showSystemSetup: true,
              showLogbook: false,
              showDashboard: false,
              showEnergyData: false,
              showNetworkMonitor: false,
              showUserManagement: false,
              showObjectManagement: false,
              showGrafanaDashboards: false,
              showEfficiencyStrategy: false
            }
          }
        });
      }

      // Handle demo/admin/regular sessions from DB
      if (session.user.role === 'admin') {
        // Get user profile from storage if exists
        let userProfile = null;
        if (session.user.userProfileId) {
          try {
            userProfile = await storage.getUserProfile(session.user.userProfileId);
          } catch (error) {
            console.warn('Could not load user profile:', error);
          }
        }

        return res.json({
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
          userProfileId: session.user.userProfileId,
          mandantId: session.user.mandantId,
          userProfile: userProfile ? {
            id: userProfile.id,
            name: userProfile.name,
            startPage: userProfile.startPage || '/dashboard',
            sidebar: userProfile.sidebar || {
              showSystemSetup: false,
              showLogbook: true,
              showDashboard: true,
              showEnergyData: true,
              showNetworkMonitor: true,
              showUserManagement: true,
              showObjectManagement: true,
              showGrafanaDashboards: true,
              showEfficiencyStrategy: true
            }
          } : {
            id: null,
            name: 'Default Admin',
            startPage: '/dashboard',
            sidebar: {
              showSystemSetup: false,
              showLogbook: true,
              showDashboard: true,
              showEnergyData: true,
              showNetworkMonitor: true,
              showUserManagement: true,
              showObjectManagement: true,
              showGrafanaDashboards: true,
              showEfficiencyStrategy: true
            }
          }
        });
      }

      // Handle other demo users
      return res.json({
        id: session.user.id,
        email: session.user.email || 'demo@example.com',
        firstName: session.user.firstName || 'Demo',
        lastName: session.user.lastName || 'User',
        role: session.user.role || 'user',
        userProfileId: session.user.userProfileId,
        mandantId: session.user.mandantId,
        userProfile: {
          id: null,
          name: 'Standard User',
          startPage: '/dashboard',
          sidebar: {
            showSystemSetup: false,
            showLogbook: true,
            showDashboard: true,
            showEnergyData: true,
            showNetworkMonitor: true,
            showUserManagement: false,
            showObjectManagement: false,
            showGrafanaDashboards: true,
            showEfficiencyStrategy: true
          }
        }
      });
    }

    throw createAuthError("No valid session found");
  }),

  // Logout user
  logout: asyncHandler(async (req: Request, res: Response) => {
    const session = (req as any).session;
    
    if (session) {
      session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
          throw new Error("Logout failed");
        }
        console.log('👋 User session destroyed successfully');
      });
    }

    res.json({ message: "Logged out successfully" });
  }),

  // Heartbeat to extend session
  heartbeat: asyncHandler(async (req: Request, res: Response) => {
    const session = (req as any).session;
    
    if (!session?.user) {
      throw createAuthError("No active session");
    }

    // Session is automatically extended by accessing it
    res.json({ 
      message: "Session extended", 
      timestamp: new Date().toISOString() 
    });
  })
};