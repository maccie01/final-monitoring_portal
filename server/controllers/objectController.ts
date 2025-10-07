import { Request, Response } from "express";
import { storage } from "../storage";
import { createDatabaseError } from "../middleware/error";
import { insertObjectSchema } from "@shared/schema";
import { z } from "zod";
import { ConnectionPoolManager } from "../connection-pool";

export class ObjectController {
  constructor(private storage: any) {}

  // GET /api/objects - Alle Objekte abrufen mit Mandanten-Filterung
  getObjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user || (req.session as any)?.user;
      
      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }
      
      const isAdmin = user.role === 'admin';
      
      console.log(`🔍 [OBJECTS] Fetching objects for user: ${user.id}, role: ${user.role}, mandantId: ${user.mandantId}`);

      // Admin sieht alle Objekte, andere nur ihre Mandanten-Objekte
      let mandantIds: number[] | undefined;
      if (!isAdmin) {
        mandantIds = [user.mandantId];
        if (user.mandantAccess && user.mandantAccess.length > 0) {
          mandantIds.push(...user.mandantAccess);
        }
      }

      const objects = await this.storage.getObjects(mandantIds, isAdmin);
      
      console.log(`✅ [OBJECTS] Returning ${objects.length} objects for ${isAdmin ? 'admin' : 'user'}`);
      res.json(objects);
    } catch (error) {
      console.error('❌ [OBJECTS] Error fetching objects:', error);
      throw createDatabaseError('Fehler beim Laden der Objekte', error);
    }
  };

  // GET /api/objects/:id - Einzelnes Objekt abrufen
  getObject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [OBJECT] Fetching object ${id} for user ${user.id}`);

      // Portal-DB API Aufruf: Objekt-Daten abrufen mit mandant_id
      // SQL-Query: objects ohne LEFT JOIN (object_mandant existiert nicht)
      // Verwendung: o.mandant_id direkt als mandantId
      const pool = ConnectionPoolManager.getInstance().getPool();
      const objectQuery = `
        SELECT o.*, 
               o.mandant_id as mandantId
        FROM objects o
        WHERE o.objectid = $1
        LIMIT 1
      `;
      
      const objectResult = await pool.query(objectQuery, [parseInt(id)]);
      
      if (objectResult.rows.length === 0) {
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }
      
      const object = objectResult.rows[0];

      // Zugriffsprüfung gem. Dokumentation (außer für Admins):
      // User hat Zugriff wenn:
      // 1. object.mandant_id = user.mandantId ODER
      // 2. user.mandantId ist in object.mandant_access Array
      if (user.role !== 'admin') {
        const hasPrimaryAccess = object.mandant_id === user.mandantId;
        const hasSharedAccess = object.mandant_access && 
          Array.isArray(object.mandant_access) && 
          object.mandant_access.includes(user.mandantId);
        
        if (!hasPrimaryAccess && !hasSharedAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      console.log(`✅ [OBJECT] Object found: ${object.name}`);
      
      // Convert BigInt values to Numbers before JSON serialization
      const convertBigIntToNumber = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return Number(obj);
        if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
        if (typeof obj === 'object') {
          const converted: any = {};
          for (const key in obj) {
            converted[key] = convertBigIntToNumber(obj[key]);
          }
          return converted;
        }
        return obj;
      };
      
      res.json(convertBigIntToNumber(object));
    } catch (error) {
      console.error('❌ [OBJECT] Error fetching object:', error);
      throw createDatabaseError('Fehler beim Laden des Objekts', error);
    }
  };

  // GET /api/objects/by-objectid/:objectId - Objekt per ObjectID abrufen
  getObjectByObjectId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { objectId } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [OBJECT-BY-ID] Fetching object with objectId ${objectId} for user ${user.id}`);

      // Erst alle Objekte laden und dann das richtige finden
      const isAdmin = user.role === 'admin';
      let mandantIds: number[] | undefined;
      if (!isAdmin) {
        mandantIds = [user.mandantId];
        if (user.mandantAccess && user.mandantAccess.length > 0) {
          mandantIds.push(...user.mandantAccess);
        }
      }

      const objects = await this.storage.getObjects(mandantIds, isAdmin);
      const object = objects.find((obj: any) => obj.objectid.toString() === objectId);

      if (!object) {
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }

      console.log(`✅ [OBJECT-BY-ID] Object found: ${object.name}, mandantId: ${object.mandantId}`);
      
      // Convert BigInt values to Numbers before JSON serialization
      const convertBigIntToNumber = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return Number(obj);
        if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
        if (typeof obj === 'object') {
          const converted: any = {};
          for (const key in obj) {
            converted[key] = convertBigIntToNumber(obj[key]);
          }
          return converted;
        }
        return obj;
      };
      
      res.json(convertBigIntToNumber(object));
    } catch (error) {
      console.error('❌ [OBJECT-BY-ID] Error fetching object by objectId:', error);
      throw createDatabaseError('Fehler beim Laden des Objekts', error);
    }
  };

  // POST /api/objects - Neues Objekt erstellen
  createObject = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user || (req.session as any)?.user;
      
      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }
      
      console.log(`🔍 [CREATE-OBJECT] Creating object for user ${user.id}`, req.body);

      // Validiere Input
      const validatedData = insertObjectSchema.parse(req.body) as any;

      // Setze Mandant automatisch falls nicht angegeben
      if (!validatedData.mandantId) {
        validatedData.mandantId = user.mandantId;
      }

      // Prüfe Berechtigung für den Mandanten
      if (user.role !== 'admin' && validatedData.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(validatedData.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für diesen Mandanten" });
          return;
        }
      }

      const newObject = await this.storage.createObject(validatedData);
      
      console.log(`✅ [CREATE-OBJECT] Object created: ${newObject.name} with ID ${newObject.id}`);
      res.status(201).json(newObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Ungültige Eingabedaten", 
          errors: error.errors 
        });
        return;
      }
      console.error('❌ [CREATE-OBJECT] Error creating object:', error);
      throw createDatabaseError('Fehler beim Erstellen des Objekts', error);
    }
  };

  // PUT /api/objects/:id - Objekt aktualisieren
  updateObject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [UPDATE-OBJECT] Updating object ${id} for user ${user.id}`, req.body);

      // Prüfe ob Objekt existiert
      const existingObject = await this.storage.getObject(parseInt(id));
      if (!existingObject) {
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }

      // Prüfe Berechtigung
      if (user.role !== 'admin' && existingObject.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(existingObject.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      // Validiere Input (partiell)
      const validatedData = insertObjectSchema.partial().parse(req.body) as any;

      // Prüfe Mandanten-Änderung
      if (validatedData.mandantId && user.role !== 'admin' && validatedData.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(validatedData.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für den Ziel-Mandanten" });
          return;
        }
      }

      const updatedObject = await this.storage.updateObject(parseInt(id), validatedData);
      
      console.log(`✅ [UPDATE-OBJECT] Object updated: ${updatedObject.name}`);
      res.json(updatedObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Ungültige Eingabedaten", 
          errors: error.errors 
        });
        return;
      }
      console.error('❌ [UPDATE-OBJECT] Error updating object:', error);
      throw createDatabaseError('Fehler beim Aktualisieren des Objekts', error);
    }
  };

  // DELETE /api/objects/:id - Objekt löschen
  deleteObject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [DELETE-OBJECT] Deleting object ${id} for user ${user.id}`);

      // Prüfe ob Objekt existiert
      const existingObject = await this.storage.getObject(parseInt(id));
      if (!existingObject) {
        res.status(404).json({ message: "Objekt nicht gefunden" });
        return;
      }

      // Prüfe Berechtigung
      if (user.role !== 'admin' && existingObject.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(existingObject.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      await this.storage.deleteObject(parseInt(id));
      
      console.log(`✅ [DELETE-OBJECT] Object deleted: ${existingObject.name}`);
      res.json({ message: "Objekt erfolgreich gelöscht" });
    } catch (error) {
      console.error('❌ [DELETE-OBJECT] Error deleting object:', error);
      throw createDatabaseError('Fehler beim Löschen des Objekts', error);
    }
  };

  // GET /api/objects/:id/children - Kinder-Objekte abrufen
  getObjectChildren = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [OBJECT-CHILDREN] Fetching children for object ${id}`);

      // Prüfe Berechtigung für Parent-Objekt
      const parentObject = await this.storage.getObject(parseInt(id));
      if (!parentObject) {
        res.status(404).json({ message: "Parent-Objekt nicht gefunden" });
        return;
      }

      if (user.role !== 'admin' && parentObject.mandantId !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(parentObject.mandantId);
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
          return;
        }
      }

      const children = await this.storage.getObjectChildren(parseInt(id));
      
      console.log(`✅ [OBJECT-CHILDREN] Found ${children.length} children for object ${id}`);
      res.json(children);
    } catch (error) {
      console.error('❌ [OBJECT-CHILDREN] Error fetching object children:', error);
      throw createDatabaseError('Fehler beim Laden der Kinder-Objekte', error);
    }
  };

  // GET /api/objects/hierarchy/:mandantId - Objekt-Hierarchie für Mandant abrufen
  getObjectHierarchy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mandantId } = req.params;
      const user = (req as any).user || (req.session as any)?.user;

      if (!user) {
        res.status(401).json({ message: "Benutzer nicht authentifiziert" });
        return;
      }

      console.log(`🔍 [OBJECT-HIERARCHY] Fetching hierarchy for mandant ${mandantId}`);

      // Prüfe Berechtigung
      if (user.role !== 'admin' && parseInt(mandantId) !== user.mandantId) {
        const hasAccess = user.mandantAccess && user.mandantAccess.includes(parseInt(mandantId));
        if (!hasAccess) {
          res.status(403).json({ message: "Keine Berechtigung für diesen Mandanten" });
          return;
        }
      }

      const hierarchy = await this.storage.getObjectHierarchy(parseInt(mandantId));
      
      console.log(`✅ [OBJECT-HIERARCHY] Found ${hierarchy.length} objects in hierarchy for mandant ${mandantId}`);
      res.json(hierarchy);
    } catch (error) {
      console.error('❌ [OBJECT-HIERARCHY] Error fetching object hierarchy:', error);
      throw createDatabaseError('Fehler beim Laden der Objekt-Hierarchie', error);
    }
  };
}

// Export controller instance
export const objectController = new ObjectController(storage);