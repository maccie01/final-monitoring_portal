import { ConnectionPoolManager } from "./connection-pool";
import { objects, objectMandant } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

/**
 * Synchronisiert Objekt-Mandanten-Zuordnungen basierend auf objects.objanlage JSON-Daten
 * Liest aus dem objanlage JSON-Feld die Mandanten-Zuordnungen und speichert sie in der object_mandant Tabelle
 */
export async function syncObjectMandantAssignments() {
  console.log("🔄 Starte Synchronisation der Objekt-Mandanten-Zuordnungen...");
  
  try {
    // Portal-DB Pool und Drizzle Client erstellen
    const pool = await ConnectionPoolManager.getInstance().getPool();
    const portalDb = drizzle({ client: pool, schema: { objects, objectMandant } });
    
    // Alle Objekte mit objanlage Daten abrufen
    const allObjects = await portalDb.select().from(objects);
    console.log(`📊 ${allObjects.length} Objekte gefunden`);
    
    // Alle verfügbaren Mandanten über SQL abrufen (Schema-Problem umgehen)
    const allMandants = await portalDb.execute(sql`SELECT id, name FROM mandants`);
    const mandantRows = allMandants.rows.map(row => ({ id: row[0] as number, name: row[1] as string }));
    console.log(`📊 ${mandantRows.length} Mandanten gefunden`);
    
    // Map für schnelle Mandanten-Suche mit Fehlerbehandlung
    const mandantMap = new Map();
    mandantRows.forEach(m => {
      if (m && m.name && m.id) {
        mandantMap.set(m.name.toLowerCase(), m.id);
      }
    });
    
    let processedCount = 0;
    let assignmentCount = 0;
    
    for (const object of allObjects) {
      try {
        // objanlage JSON parsen
        const objanlage = object.objanlage as any;
        if (!objanlage || typeof objanlage !== 'object') {
          continue;
        }
        
        // Mandanten-Zuordnungen extrahieren (Handwerker, Besitzer, Betreiber, Betreuer)
        const mandantFields = ['handwerker', 'besitzer', 'betreiber', 'betreuer'];
        const foundMandants = new Set<number>();
        
        for (const field of mandantFields) {
          const mandantName = objanlage[field];
          if (mandantName && typeof mandantName === 'string') {
            const mandantId = mandantMap.get(mandantName.toLowerCase());
            if (mandantId) {
              foundMandants.add(mandantId);
            }
          }
        }
        
        // Bestehende Zuordnungen für dieses Objekt löschen
        await portalDb.delete(objectMandant).where(eq(objectMandant.objectId, object.objectid));

        // Neue Zuordnungen einfügen
        for (const mandantId of Array.from(foundMandants)) {
          await portalDb.insert(objectMandant).values({
            objectId: object.objectid,
            mandantId: mandantId
          });
          assignmentCount++;
        }
        
        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`⏳ ${processedCount} Objekte verarbeitet, ${assignmentCount} Zuordnungen erstellt`);
        }
        
      } catch (error) {
        console.error(`❌ Fehler bei Objekt ${object.objectid}:`, error);
      }
    }
    
    console.log(`✅ Synchronisation abgeschlossen: ${processedCount} Objekte verarbeitet, ${assignmentCount} Zuordnungen erstellt`);
    
  } catch (error) {
    console.error("❌ Fehler bei der Synchronisation:", error);
    throw error;
  }
}

// CLI-Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  syncObjectMandantAssignments()
    .then(() => {
      console.log("🎉 Synchronisation erfolgreich abgeschlossen");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Synchronisation fehlgeschlagen:", error);
      process.exit(1);
    });
}