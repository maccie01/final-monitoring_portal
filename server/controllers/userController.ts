import { Request, Response } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";

class UserController {
  /**
   * API: GET /api/user/users
   * Parameter: Keine URL-Parameter, Session-basierte Authentifizierung
   * Zweck: Lädt alle Benutzer basierend auf Admin-Berechtigung und Mandanten-Zugriff
   * Auth: Erfordert Admin oder Superadmin Session mit mandantAccess-Filterung
   * Rückgabe: Array von Benutzern gefiltert nach Mandanten-Berechtigung
   * DB-Zugriff: storage.getUsers() oder storage.getUsersByMandants() mit Berechtigung
   */
  async getUsers(req: Request, res: Response) {
    try {
      const sessionUser = (req as any).session?.user;
      
      // Check if user is authenticated
      if (!sessionUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }
      
      // Check if user is admin
      if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung für diese Aktion" });
      }

      // Refresh user data from storage to get latest mandantAccess
      const user = await storage.getUser(sessionUser.id) || sessionUser;

      let users: any[] = [];
      if (user.role === 'superadmin') {
        // Superadmin can see all users
        users = await storage.getUsers();
      } else {
        // Admin can see users from their mandant and additional mandants in mandantAccess
        const accessibleMandants = [user.mandantId];
        
        // Add mandantAccess array if it exists and has values
        if (user.mandantAccess && Array.isArray(user.mandantAccess) && user.mandantAccess.length > 0) {
          accessibleMandants.push(...user.mandantAccess);
        }
        
        // Remove duplicates and filter out null/undefined values
        const uniqueMandants = Array.from(new Set(accessibleMandants)).filter(id => id != null);
        
        // Use multi-mandant query if multiple mandants, single mandant query otherwise
        if (uniqueMandants.length > 1) {
          users = await storage.getUsersByMandants(uniqueMandants);
        } else if (uniqueMandants.length === 1) {
          users = await storage.getUsersByMandant(uniqueMandants[0]);
        } else {
          // Fallback: no accessible mandants
          users = [];
        }
      }

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Fehler beim Laden der Benutzer" });
    }
  }

  // Get single user by ID
  async getUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).session?.user;
      
      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }
      
      // Users can only view their own profile unless they're admin
      if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung für diese Aktion" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Fehler beim Laden des Benutzers" });
    }
  }

  // Update user profile
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).session?.user;
      const updateData = req.body;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Users can only update their own profile unless they're admin
      if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung für diese Aktion" });
      }

      // Remove sensitive fields that users shouldn't be able to update directly
      const { password, role, mandantId, ...allowedUpdates } = updateData;

      // Only admins can update role and mandant
      if ((role || mandantId) && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Ändern von Rolle oder Mandant" });
      }

      const finalUpdateData = requestingUser.role === 'admin' || requestingUser.role === 'superadmin' 
        ? updateData 
        : allowedUpdates;

      const updatedUser = await storage.updateUser(id, finalUpdateData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Benutzers" });
    }
  }

  // Change user password
  async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      const requestingUser = (req as any).session?.user;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Users can only change their own password unless they're admin
      if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung für diese Aktion" });
      }

      // Validate required fields
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Neues Passwort muss mindestens 6 Zeichen lang sein" });
      }

      // Get current user data
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // For non-admin users, verify current password
      if (requestingUser.id === id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        if (!currentPassword) {
          return res.status(400).json({ message: "Aktuelles Passwort erforderlich" });
        }

        // Verify current password (if user has one)
        if (user.password) {
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
          if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: "Aktuelles Passwort ist falsch" });
          }
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(id, { password: hashedPassword });

      res.json({ message: "Passwort erfolgreich geändert" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Fehler beim Ändern des Passworts" });
    }
  }

  // Create new user (admin only)
  async createUser(req: Request, res: Response) {
    try {
      const requestingUser = (req as any).session?.user;
      
      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }
      
      // Only admins can create users
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Erstellen von Benutzern" });
      }

      const userData = req.body;

      // Validate required fields
      if (!userData.username || !userData.email) {
        return res.status(400).json({ message: "Benutzername und E-Mail sind erforderlich" });
      }

      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Benutzername bereits vergeben" });
      }

      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "E-Mail bereits vergeben" });
      }

      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Set mandant for non-superadmin users
      if (requestingUser.role === 'admin') {
        userData.mandantId = requestingUser.mandantId;
      }

      const newUser = await storage.upsertUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Benutzers" });
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).session?.user;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Only admins can delete users
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen von Benutzern" });
      }

      // Prevent users from deleting themselves
      if (requestingUser.id === id) {
        return res.status(400).json({ message: "Sie können sich nicht selbst löschen" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Admins can only delete users from their mandant (except superadmin)
      if (requestingUser.role === 'admin' && user.mandantId !== requestingUser.mandantId) {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen dieses Benutzers" });
      }

      await storage.deleteUser(id);
      res.json({ message: "Benutzer erfolgreich gelöscht" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Fehler beim Löschen des Benutzers" });
    }
  }

  // Get user profiles (admin only)
  async getUserProfiles(req: Request, res: Response) {
    try {
      const requestingUser = (req as any).session?.user;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Only admins can view user profiles
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung für diese Aktion" });
      }

      const profiles = await storage.getUserProfiles();
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      res.status(500).json({ message: "Fehler beim Laden der Benutzerprofile" });
    }
  }

  // Create user profile (admin only)
  async createUserProfile(req: Request, res: Response) {
    try {
      const requestingUser = (req as any).session?.user;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Only admins can create user profiles
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Erstellen von Benutzerprofilen" });
      }

      const profileData = req.body;

      if (!profileData.name) {
        return res.status(400).json({ message: "Profilname ist erforderlich" });
      }

      const newProfile = await storage.createUserProfile(profileData);
      res.status(201).json(newProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Benutzerprofils" });
    }
  }

  // Update user profile (admin only)
  async updateUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).session?.user;
      const updateData = req.body;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Only admins can update user profiles
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Bearbeiten von Benutzerprofilen" });
      }

      const updatedProfile = await storage.updateUserProfile(parseInt(id), updateData);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Benutzerprofils" });
    }
  }

  // Delete user profile (admin only)
  async deleteUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).session?.user;

      // Check if user is authenticated
      if (!requestingUser) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Only admins can delete user profiles
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Keine Berechtigung zum Löschen von Benutzerprofilen" });
      }

      await storage.deleteUserProfile(parseInt(id));
      res.json({ message: "Benutzerprofil erfolgreich gelöscht" });
    } catch (error) {
      console.error('Error deleting user profile:', error);
      res.status(500).json({ message: "Fehler beim Löschen des Benutzerprofils" });
    }
  }
}

export const userController = new UserController();