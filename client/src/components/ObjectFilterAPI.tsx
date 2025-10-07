/**
 * Gemeinsame API-Komponente für Objektfilter
 * Stellt einheitliche Filter-Logik für ObjectManagement und ObjectListLayout bereit
 */

export interface ObjectGroup {
  id: number;
  name: string;
  description?: string;
  type: string;
}

export interface FilterOptions {
  types: string[];
  handwerker: string[];
  objectGroups: ObjectGroup[];
  mandants: MandantOption[];
}

export interface MandantOption {
  id: number;
  name: string;
  role: string;
  objectCount: number;
}

export interface FilteredObject {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  address?: string;
  objanlage?: {
    Typ?: string;
    Handwerker?: string;
    thresholds?: string;
    [key: string]: any;
  };
  mandants?: Array<{
    mandant_id: number;
    mandant_name: string;
    mandant_role: string;
  }>;
  [key: string]: any;
}

/**
 * Extrahiert eindeutige Filterwerte aus Objektdaten
 * @param objects Array von Objekten
 * @param field Feldname in objanlage (z.B. 'Typ', 'Handwerker')
 * @returns Sortiertes Array eindeutiger Werte
 */
export const getFilterOptions = (objects: FilteredObject[] | undefined, field: string): string[] => {
  if (!Array.isArray(objects)) return [];
  
  const values = new Set<string>();
  objects.forEach((object) => {
    if (object.objanlage && typeof object.objanlage === 'object' && object.objanlage[field]) {
      values.add(object.objanlage[field]);
    }
  });
  
  return Array.from(values).sort();
};

/**
 * Erstellt FilterOptions Objekt aus Objektdaten
 * @param objects Array von Objekten
 * @param objectGroups Array von Object Groups aus der API
 * @returns FilterOptions mit types, handwerker, mandants Arrays und objectGroups
 */
export const createFilterOptions = (objects: FilteredObject[] | undefined, objectGroups: ObjectGroup[] = []): FilterOptions | null => {
  if (!objects) return null;
  
  // Extrahiere Mandanten aus object_mandant Zuordnungen
  const mandantMap = new Map<string, MandantOption>();
  
  objects.forEach((object) => {
    if (object.mandants && Array.isArray(object.mandants)) {
      object.mandants.forEach((mandant) => {
        const key = `${mandant.mandant_id}_${mandant.mandant_role}`;
        const existing = mandantMap.get(key);
        
        if (existing) {
          existing.objectCount += 1;
        } else {
          mandantMap.set(key, {
            id: mandant.mandant_id,
            name: mandant.mandant_name,
            role: mandant.mandant_role,
            objectCount: 1
          });
        }
      });
    }
  });
  
  return {
    types: getFilterOptions(objects, 'Typ'),
    handwerker: getFilterOptions(objects, 'Handwerker'),
    mandants: Array.from(mandantMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    objectGroups: objectGroups
  };
};

/**
 * Filtert Objekte basierend auf Suchbegriff und Filterkriterien
 * @param objects Array von Objekten
 * @param searchTerm Suchbegriff
 * @param filters Filterkriterien
 * @returns Gefilterte Objekte
 */
export const filterObjects = (
  objects: FilteredObject[] | undefined,
  searchTerm: string,
  filters: {
    typ?: string;
    handwerker?: string;
    mandantId?: number;
    mandantRole?: string;
  }
): FilteredObject[] => {
  if (!Array.isArray(objects)) return [];
  
  return objects.filter((object) => {
    // Suchbegriff-Filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      object.name.toLowerCase().includes(searchLower) ||
      object.objectid.toString().includes(searchLower) ||
      (object.city && object.city.toLowerCase().includes(searchLower)) ||
      (object.address && object.address.toLowerCase().includes(searchLower))
    );

    if (!matchesSearch) return false;

    // objanlage-Filter
    const objanlage = object.objanlage;
    
    // Typ-Filter
    const matchesTyp = !filters.typ || 
                      filters.typ === 'all' || 
                      filters.typ === '__all__' || 
                      (objanlage && objanlage.Typ === filters.typ);
    
    // Handwerker-Filter
    const matchesHandwerker = !filters.handwerker || 
                             filters.handwerker === 'all' || 
                             filters.handwerker === '__all__' || 
                             (objanlage && objanlage.Handwerker === filters.handwerker);
    
    // Mandanten-Filter (basierend auf object_mandant Zuordnungen)
    const matchesMandant = !filters.mandantId || 
                          !filters.mandantRole ||
                          (object.mandants && object.mandants.some(m => 
                            m.mandant_id === filters.mandantId && 
                            m.mandant_role === filters.mandantRole
                          ));

    return matchesTyp && matchesHandwerker && matchesMandant;
  });
};

/**
 * Hook für Objektfilterung (optional für React-Komponenten)
 */
export const useObjectFilter = (
  objects: FilteredObject[] | undefined,
  searchTerm: string,
  filters: { typ?: string; handwerker?: string; mandantId?: number; mandantRole?: string },
  objectGroups: ObjectGroup[] = []
) => {
  const filterOptions = createFilterOptions(objects, objectGroups);
  const filteredObjects = filterObjects(objects, searchTerm, filters);
  
  return {
    filterOptions,
    filteredObjects,
    getFilterOptions: (field: string) => getFilterOptions(objects, field)
  };
};

/**
 * Hilfsfunktionen für Filter-State-Management
 */
export const FILTER_ALL_VALUE = 'all';

export const isFilterActive = (filterValue: string | undefined): boolean => {
  return filterValue !== undefined && 
         filterValue !== FILTER_ALL_VALUE && 
         filterValue !== '__all__' && 
         filterValue !== '';
};

export const resetFilters = () => ({
  typ: FILTER_ALL_VALUE,
  handwerker: FILTER_ALL_VALUE,
  mandantId: undefined,
  mandantRole: undefined
});