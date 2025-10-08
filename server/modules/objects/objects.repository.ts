import { getDb } from "../../db";
import { objects, objectGroups } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { ConnectionPoolManager } from "../../connection-pool";
import type { ObjectType, InsertObject, ObjectGroup, InsertObjectGroup } from "@shared/schema";

/**
 * Objects Repository
 *
 * Data access layer for object operations.
 * Handles direct database queries for objects, object groups, and object-mandant assignments.
 * Uses Portal-DB via ConnectionPoolManager with fallback to Dev-DB.
 */

export class ObjectsRepository {
  // Helper function to convert BigInt to Number in any object/array
  private convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (Array.isArray(obj)) return obj.map(this.convertBigIntToNumber.bind(this));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertBigIntToNumber(obj[key]);
      }
      return converted;
    }
    return obj;
  }

  // Objects (hierarchical structure) - mit erweiterte Mandanten-Filterung und Admin-Zugriff
  async getObjects(mandantIds?: number | number[], isAdmin?: boolean): Promise<ObjectType[]> {
    // Normalize mandantIds to array
    const ids = mandantIds == null ? [] : (Array.isArray(mandantIds) ? mandantIds : [mandantIds]).map(Number).filter(Number.isFinite);
    // Admin-Benutzer sehen alle Objekte ohne Filterung
    if (isAdmin) {
      try {
        const pool = await ConnectionPoolManager.getInstance().getPool();
        const result = await pool.query(
          'SELECT * FROM objects ORDER BY name'
        );
        console.log(`🔍 [OBJECTS-ADMIN-SUCCESS] ${result.rows.length} objects fetched from Portal-DB for admin`);

        // Helper function to convert BigInt to Number in any object/array
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

        return result.rows.map((row: any) => ({
          id: row.id,
          objectid: BigInt(row.objectid),
          name: row.name,
          objectType: row.object_type,
          status: row.status,
          postalCode: row.postal_code,
          city: row.city,
          country: row.country,
          latitude: row.latitude,
          longitude: row.longitude,
          description: row.description,
          objdata: convertBigIntToNumber(row.objdata),
          objanlage: convertBigIntToNumber(row.objanlage),
          portdata: convertBigIntToNumber(row.portdata),
          meter: convertBigIntToNumber(row.meter),
          dashboard: convertBigIntToNumber(row.dashboard),
          alarm: convertBigIntToNumber(row.alarm),
          kianalyse: convertBigIntToNumber(row.kianalyse),
          statusdata: convertBigIntToNumber(row.statusdata),
          auswertung: convertBigIntToNumber(row.auswertung),
          report: convertBigIntToNumber(row.report),
          diagramm: convertBigIntToNumber(row.diagramm),
          fltemp: convertBigIntToNumber(row.fltemp),
          rttemp: convertBigIntToNumber(row.rttemp),
          energy: convertBigIntToNumber(row.energy),
          temperaturGrenzwert: row.temperatur_grenzwert,
          mandantAccess: row.mandant_access || [],
          mandantId: row.mandant_id,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        }));
      } catch (error) {
        console.error('Error fetching objects for admin from Portal-DB:', error);
        // Fallback to development DB
        const devObjects = await getDb().select().from(objects).orderBy(objects.name);
        console.log(`🔍 [OBJECTS-ADMIN-FALLBACK] ${devObjects.length} objects fetched from Development-DB for admin`);
        return devObjects;
      }
    }

    // Normale Benutzer sehen Objekte über mehrere Zugangswege basierend auf mandantAccess Array
    if (ids.length > 0) {
      try {
        // Verwende Portal DB mit korrekter JSONB @> Operator-Filterung (gem. Dokumentation)
        const pool = await ConnectionPoolManager.getInstance().getPool();

        const result = await pool.query(`
          SELECT DISTINCT o.*
          FROM objects o
          WHERE o.mandant_id = ANY($1::int[])
             OR o.mandant_access && $1::int[]
          ORDER BY o.name
        `, [ids]);

        const allObjects = result.rows.map((row: any) => ({
          id: row.id,
          objectid: BigInt(row.objectid),
          name: row.name,
          objectType: row.object_type,
          status: row.status,
          postalCode: row.postal_code,
          city: row.city,
          country: row.country,
          latitude: row.latitude,
          longitude: row.longitude,
          description: row.description,
          objdata: row.objdata,
          objanlage: row.objanlage,
          portdata: row.portdata,
          meter: row.meter,
          dashboard: row.dashboard,
          alarm: row.alarm,
          kianalyse: row.kianalyse,
          statusdata: row.statusdata,
          auswertung: row.auswertung,
          report: row.report,
          diagramm: row.diagramm,
          fltemp: row.fltemp,
          rttemp: row.rttemp,
          energy: row.energy,
          temperaturGrenzwert: row.temperatur_grenzwert,
          mandantAccess: row.mandant_access || [],
          mandantId: row.mandant_id,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        }));

        return allObjects;
      } catch (error) {
        console.error('Error fetching objects for user from Portal-DB:', error);
        // Fallback to development DB
        const results = await getDb().select().from(objects)
          .where(inArray(objects.mandantId, ids))
          .orderBy(objects.name);
        return results;
      }
    }

    // Fallback: keine Objekte wenn kein Mandant und kein Admin
    return [];
  }

  async getObject(id: number): Promise<ObjectType | undefined> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, objectid, name, location, latitude, longitude, postal_code as post_code, city, country, objdata, meter, created_at, updated_at FROM objects WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return undefined;
      const row = result.rows[0];
      return {
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type || 'building',
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        description: row.description,
        mandantId: row.mandant_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      } as any;
    } catch (error) {
      console.error('Error fetching object from Portal-DB:', error);
      // Fallback to development DB
      const [object] = await getDb().select().from(objects).where(eq(objects.id, id));
      return object;
    }
  }

  async getObjectByObjectId(objectid: bigint): Promise<ObjectType | undefined> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, objectid, name, location, latitude, longitude, postal_code as post_code, city, country, objdata, meter, report, created_at, updated_at FROM objects WHERE objectid = $1',
        [objectid]
      );
      if (result.rows.length === 0) return undefined;
      const row = result.rows[0];
      return {
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type || 'building',
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        description: row.description,
        mandantId: row.mandant_id,
        objdata: row.objdata, // KRITISCH: objdata für area-Berechnung hinzufügen
        meter: row.meter,
        report: row.report || {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      } as any;
    } catch (error) {
      console.error('Error fetching object by objectid from Portal-DB:', error);
      // Fallback to development DB
      const [object] = await getDb().select().from(objects).where(eq(objects.objectid, objectid));
      return object;
    }
  }

  async getObjectByPostalCode(postalCode: string): Promise<ObjectType | undefined> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, objectid, name, location, latitude, longitude, postal_code, city, country, objdata, meter, report, created_at, updated_at FROM objects WHERE postal_code = $1 LIMIT 1',
        [postalCode]
      );
      if (result.rows.length === 0) return undefined;
      const row = result.rows[0];
      return {
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type || 'building',
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        description: row.description,
        mandantId: row.mandant_id,
        objdata: row.objdata,
        meter: row.meter,
        report: row.report || {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      } as any;
    } catch (error) {
      console.error('Error fetching object by postal code from Portal-DB:', error);
      return undefined;
    }
  }

  // Performante API für Meter-Daten und Report
  async getObjectMeterByObjectId(objectid: bigint): Promise<{ objectid: bigint; meter: any; report?: any } | undefined> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT objectid, meter, report FROM objects WHERE objectid = $1',
        [objectid]
      );
      if (result.rows.length === 0) return undefined;
      const row = result.rows[0];
      return {
        objectid: BigInt(row.objectid),
        meter: row.meter,
        report: row.report || {} // Fallback zu leerem Objekt
      };
    } catch (error) {
      console.error('Error fetching meter by objectid from Portal-DB:', error);
      // Fallback to development DB
      const [object] = await getDb().select({
        objectid: objects.objectid,
        meter: objects.meter,
        report: objects.report
      }).from(objects).where(eq(objects.objectid, objectid));
      return object;
    }
  }

  async createObject(object: InsertObject): Promise<ObjectType> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'INSERT INTO objects (objectid, name, object_type, postal_code, city, country, description, mandant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, objectid, name, object_type, postal_code, city, country, description, mandant_id, created_at, updated_at',
        [object.objectid, object.name, object.objectType || 'building', object.postalCode, object.city, object.country, object.description, object.mandantId]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type || 'building',
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        description: row.description,
        mandantId: row.mandant_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      } as any;
    } catch (error) {
      console.error('Error creating object in Portal-DB:', error);
      // Fallback to development DB
      const [newObject] = await getDb().insert(objects).values(object).returning();
      return newObject;
    }
  }

  async updateObject(id: number, objectData: Partial<InsertObject>): Promise<ObjectType> {
    try {
      // Use Portal-DB for consistency with other object operations
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Handle ALL InsertObject fields to prevent data loss
      if (objectData.objectid !== undefined) {
        updateFields.push(`objectid = $${paramIndex++}`);
        values.push(objectData.objectid);
      }
      if (objectData.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(objectData.name);
      }
      if (objectData.objectType !== undefined) {
        updateFields.push(`object_type = $${paramIndex++}`);
        values.push(objectData.objectType);
      }
      if (objectData.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(objectData.status);
      }
      if (objectData.postalCode !== undefined) {
        updateFields.push(`postal_code = $${paramIndex++}`);
        values.push(objectData.postalCode);
      }
      if (objectData.city !== undefined) {
        updateFields.push(`city = $${paramIndex++}`);
        values.push(objectData.city);
      }
      if (objectData.country !== undefined) {
        updateFields.push(`country = $${paramIndex++}`);
        values.push(objectData.country);
      }
      if (objectData.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex++}`);
        values.push(objectData.latitude);
      }
      if (objectData.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex++}`);
        values.push(objectData.longitude);
      }
      if (objectData.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(objectData.description);
      }
      // JSONB fields
      if (objectData.objdata !== undefined) {
        updateFields.push(`objdata = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.objdata));
      }
      if (objectData.objanlage !== undefined) {
        updateFields.push(`objanlage = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.objanlage));
      }
      if (objectData.portdata !== undefined) {
        updateFields.push(`portdata = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.portdata));
      }
      if (objectData.meter !== undefined) {
        updateFields.push(`meter = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.meter));
      }
      if (objectData.dashboard !== undefined) {
        updateFields.push(`dashboard = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.dashboard));
      }
      if (objectData.alarm !== undefined) {
        updateFields.push(`alarm = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.alarm));
      }
      if (objectData.kianalyse !== undefined) {
        updateFields.push(`kianalyse = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.kianalyse));
      }
      if (objectData.statusdata !== undefined) {
        updateFields.push(`statusdata = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.statusdata));
      }
      if (objectData.auswertung !== undefined) {
        updateFields.push(`auswertung = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.auswertung));
      }
      if (objectData.report !== undefined) {
        updateFields.push(`report = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.report));
      }
      if (objectData.diagramm !== undefined) {
        updateFields.push(`diagramm = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.diagramm));
      }
      if (objectData.fltemp !== undefined) {
        updateFields.push(`fltemp = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.fltemp));
      }
      if (objectData.rttemp !== undefined) {
        updateFields.push(`rttemp = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.rttemp));
      }
      if (objectData.energy !== undefined) {
        updateFields.push(`energy = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.energy));
      }
      if (objectData.temperaturGrenzwert !== undefined) {
        updateFields.push(`temperatur_grenzwert = $${paramIndex++}`);
        values.push(objectData.temperaturGrenzwert);
      }
      if (objectData.mandantAccess !== undefined) {
        updateFields.push(`mandant_access = $${paramIndex++}`);
        values.push(JSON.stringify(objectData.mandantAccess));
      }
      if (objectData.mandantId !== undefined) {
        updateFields.push(`mandant_id = $${paramIndex++}`);
        values.push(objectData.mandantId);
      }

      // Always update updated_at timestamp
      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) { // Only updated_at field
        throw new Error('No fields to update');
      }

      values.push(id); // Add ID as last parameter
      const query = `UPDATE objects SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Object with ID ${id} not found`);
      }

      const row = result.rows[0];

      // Helper function to convert BigInt to Number
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

      return {
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type,
        status: row.status,
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        description: row.description,
        objdata: convertBigIntToNumber(row.objdata),
        objanlage: convertBigIntToNumber(row.objanlage),
        portdata: convertBigIntToNumber(row.portdata),
        meter: convertBigIntToNumber(row.meter),
        dashboard: convertBigIntToNumber(row.dashboard),
        alarm: convertBigIntToNumber(row.alarm),
        kianalyse: convertBigIntToNumber(row.kianalyse),
        statusdata: convertBigIntToNumber(row.statusdata),
        auswertung: convertBigIntToNumber(row.auswertung),
        report: convertBigIntToNumber(row.report),
        diagramm: convertBigIntToNumber(row.diagramm),
        fltemp: convertBigIntToNumber(row.fltemp),
        rttemp: convertBigIntToNumber(row.rttemp),
        energy: convertBigIntToNumber(row.energy),
        temperaturGrenzwert: row.temperatur_grenzwert,
        mandantAccess: convertBigIntToNumber(row.mandant_access),
        mandantId: row.mandant_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error updating object in Portal-DB:', error);
      // Fallback to development DB
      const [updatedObject] = await getDb()
        .update(objects)
        .set({ ...objectData, updatedAt: new Date() })
        .where(eq(objects.id, id))
        .returning();
      return updatedObject;
    }
  }

  async updateObjectCoordinates(id: number, latitude: number, longitude: number): Promise<ObjectType> {
    const [updatedObject] = await getDb()
      .update(objects)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        updatedAt: new Date(),
      })
      .where(eq(objects.id, id))
      .returning();
    return updatedObject;
  }

  async deleteObject(id: number): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query('DELETE FROM objects WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting object from Portal-DB:', error);
      // Fallback to development DB
      await getDb().delete(objects).where(eq(objects.id, id));
    }
  }

  async updateObjectMeter(id: number, meterData: any): Promise<Object> {
    const [updatedObject] = await getDb()
      .update(objects)
      .set({ meter: meterData })
      .where(eq(objects.id, id))
      .returning();

    if (!updatedObject) {
      throw new Error("Object not found");
    }

    return updatedObject;
  }

  async getObjectChildren(parentId: number): Promise<ObjectType[]> {
    try {
      // Since we don't have a parentId field in objects schema,
      // we'll use mandantId hierarchy or geographical proximity as alternative
      const pool = await ConnectionPoolManager.getInstance().getPool();

      // First get the parent object to understand its context
      const parentResult = await pool.query(
        'SELECT mandant_id, city, postal_code FROM objects WHERE id = $1',
        [parentId]
      );

      if (parentResult.rows.length === 0) {
        return [];
      }

      const parent = parentResult.rows[0];

      // Find "child" objects - same mandant and geographical area
      // Handle NULL city values by falling back to postal_code or mandant-only matching
      let query, params;

      if (parent.city && parent.city.trim() !== '') {
        // Primary: Match by mandant + city, handle NULL postal_code robustly
        query = `
          SELECT id, objectid, name, object_type, status, postal_code, city, country,
                 latitude, longitude, description, mandant_id, created_at, updated_at
          FROM objects
          WHERE mandant_id = $1
            AND (
              city = $2
              OR (city IS NULL AND COALESCE(postal_code,'') = COALESCE($3,''))
              OR ($3 IS NULL AND postal_code IS NULL)
              OR (city IS NULL AND postal_code IS NULL)
            )
            AND id != $4
            AND status = 'active'
          ORDER BY name
        `;
        params = [parent.mandant_id, parent.city, parent.postal_code, parentId];
      } else {
        // Fallback: Match by mandant + postal_code robustly (when city is NULL/empty)
        query = `
          SELECT id, objectid, name, object_type, status, postal_code, city, country,
                 latitude, longitude, description, mandant_id, created_at, updated_at
          FROM objects
          WHERE mandant_id = $1
            AND (
              COALESCE(postal_code,'') = COALESCE($2,'')
              OR ($2 IS NULL AND postal_code IS NULL)
            )
            AND id != $3
            AND status = 'active'
          ORDER BY name
        `;
        params = [parent.mandant_id, parent.postal_code, parentId];
      }

      const result = await pool.query(query, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        objectid: BigInt(row.objectid),
        name: row.name,
        objectType: row.object_type,
        status: row.status,
        postalCode: row.postal_code,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        description: row.description,
        mandantAccess: row.mandant_access || [],
        temperaturGrenzwert: row.temperatur_grenzwert,
        mandantId: row.mandant_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      } as any));
    } catch (error) {
      console.error('Error fetching object children:', error);
      return [];
    }
  }

  async getObjectHierarchy(mandantId: number): Promise<ObjectType[]> {
    return await getDb()
      .select()
      .from(objects)
      .where(eq(objects.mandantId, mandantId))
      .orderBy(objects.name);
  }

  // Object-Mandant Assignment methods
  async createObjectMandantAssignment(assignment: { objectId: number; mandantId: number; mandantRole: 'verwalter' | 'handwerker' | 'betreuer' | 'besitzer' }): Promise<void> {
    // Use raw SQL to avoid ORM type issues with bigint
    const pool = await ConnectionPoolManager.getInstance().getPool();
    await pool.query(
      'INSERT INTO object_mandant (objectid, mandant_id, mandant_role) VALUES ($1, $2, $3)',
      [assignment.objectId.toString(), assignment.mandantId, assignment.mandantRole]
    );
  }

  async getObjectMandantAssignments(objectId: number): Promise<any[]> {
    // Use raw SQL to avoid ORM type issues with bigint
    const pool = await ConnectionPoolManager.getInstance().getPool();
    const result = await pool.query(`
      SELECT
        om.id,
        om.objectid as "objectId",
        om.mandant_id as "mandantId",
        om.mandant_role as "mandantRole",
        m.name as "mandantName",
        m.category as "mandantCategory"
      FROM object_mandant om
      LEFT JOIN mandants m ON om.mandant_id = m.id
      WHERE om.objectid = $1
    `, [objectId.toString()]);
    return result.rows;
  }

  async deleteObjectMandantAssignments(objectId: number): Promise<void> {
    // Use raw SQL to avoid ORM type issues with bigint
    const pool = await ConnectionPoolManager.getInstance().getPool();
    await pool.query('DELETE FROM object_mandant WHERE objectid = $1', [objectId.toString()]);
  }

  async deleteObjectMandantAssignmentsByRole(objectId: number, role: string): Promise<void> {
    // Use raw SQL to avoid ORM type issues with bigint
    const pool = await ConnectionPoolManager.getInstance().getPool();
    await pool.query('DELETE FROM object_mandant WHERE objectid = $1 AND mandant_role = $2', [objectId.toString(), role]);
  }

  // Object Groups management - Using Portal-DB via settingsDbManager
  async getObjectGroups(): Promise<ObjectGroup[]> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, name, description, type, created_at, updated_at FROM object_groups ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching object groups from Portal-DB:', error);
      // Fallback to development DB if Portal-DB fails
      const groups = await getDb()
        .select()
        .from(objectGroups)
        .orderBy(objectGroups.createdAt);
      return groups;
    }
  }

  async createObjectGroup(groupData: InsertObjectGroup): Promise<ObjectGroup> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'INSERT INTO object_groups (name, description, type) VALUES ($1, $2, $3) RETURNING id, name, description, type, created_at, updated_at',
        [groupData.name, groupData.description, groupData.type || 'standard']
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error creating object group in Portal-DB:', error);
      // Fallback to development DB
      const [group] = await getDb()
        .insert(objectGroups)
        .values(groupData)
        .returning();
      return group;
    }
  }

  async updateObjectGroup(id: number, groupData: Partial<InsertObjectGroup>): Promise<ObjectGroup> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'UPDATE object_groups SET name = COALESCE($2, name), description = COALESCE($3, description), type = COALESCE($4, type), updated_at = NOW() WHERE id = $1 RETURNING id, name, description, type, created_at, updated_at',
        [id, groupData.name, groupData.description, groupData.type]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error updating object group in Portal-DB:', error);
      // Fallback to development DB
      const [group] = await getDb()
        .update(objectGroups)
        .set({ ...groupData, updatedAt: new Date() })
        .where(eq(objectGroups.id, id))
        .returning();
      return group;
    }
  }

  async deleteObjectGroup(id: number): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query('DELETE FROM object_groups WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting object group from Portal-DB:', error);
      // Fallback to development DB
      await getDb().delete(objectGroups).where(eq(objectGroups.id, id));
    }
  }
}

// Singleton instance
export const objectsRepository = new ObjectsRepository();
