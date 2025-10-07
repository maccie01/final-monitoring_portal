import React from 'react';
import { Building } from 'lucide-react';
import '../styles/object-list.css';

interface ObjectItem {
  id: number;
  name: string;
  objectid: string | number;
  city?: string;
  postalCode?: string;
}

interface ObjectListTemplateProps {
  objects: ObjectItem[];
  selectedObject?: ObjectItem | null;
  onObjectSelect: (object: ObjectItem) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

/**
 * ObjectListTemplate - Wiederverwendbare Vorlage für Objektlisten
 * 
 * Diese Komponente bietet eine konsistente Darstellung für alle Objektlisten
 * in der Anwendung. Sie implementiert das standardisierte Design mit:
 * - Alternierenden Zeilenhintergründen
 * - 6px blauem Rand für markierte Objekte
 * - Hover-Effekten
 * - Responsive Design
 * - Leere Zustandsanzeige
 * 
 * @param objects - Array der anzuzeigenden Objekte
 * @param selectedObject - Aktuell ausgewähltes Objekt
 * @param onObjectSelect - Callback beim Klick auf ein Objekt
 * @param isLoading - Ladezustand anzeigen
 * @param emptyMessage - Nachricht wenn keine Objekte vorhanden
 * @param emptySubMessage - Untertitel für leeren Zustand
 */
export const ObjectListTemplate: React.FC<ObjectListTemplateProps> = ({
  objects,
  selectedObject,
  onObjectSelect,
  isLoading = false,
  emptyMessage = "Keine Objekte gefunden",
  emptySubMessage = "Keine Daten in der Datenbank"
}) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, object: ObjectItem, index: number) => {
    if (selectedObject?.id !== object.id) {
      e.currentTarget.style.backgroundColor = 'rgb(147 197 253)'; // blue-300
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, object: ObjectItem, index: number) => {
    if (selectedObject?.id !== object.id) {
      e.currentTarget.style.backgroundColor = index % 2 === 0 
        ? 'rgba(255, 255, 255, 0.65)' 
        : 'rgba(255, 255, 255, 0.8)';
    }
  };

  if (isLoading) {
    return (
      <div className="object-list-container object-list-loading">
        <div className="object-list-empty">
          <Building className="object-list-empty-icon" />
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="object-list-container">
        <div className="object-list-empty">
          <Building className="object-list-empty-icon" />
          <p className="object-list-empty-title">{emptyMessage}</p>
          <p className="object-list-empty-subtitle">{emptySubMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="object-list-container">
      {/* Fixierter Tabellenkopf */}
      <div className="object-list-header">
        <div className="object-list-header-row">
          <div className="object-list-header-cell object-list-header-cell--name">
            Objekt
          </div>
          <div className="object-list-header-cell object-list-header-cell--location">
            Stadt
          </div>
        </div>
      </div>
      
      {/* Scrollbarer Tabellenbereich */}
      <div className="object-list-body">
        <div>
          {objects.map((object, index) => (
            <div 
              key={object.id}
              className={`
                object-list-row
                object-list-selectable
                ${selectedObject?.id === object.id ? 'object-list-row--selected' : ''}
                ${index % 2 === 0 ? 'object-list-row--even' : 'object-list-row--odd'}
              `}
              style={{
                borderRightColor: selectedObject?.id === object.id ? '' : '#f4f5f5',
                backgroundColor: selectedObject?.id === object.id 
                  ? '' 
                  : index % 2 === 0 
                    ? 'rgba(255, 255, 255, 0.65)' 
                    : 'rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => handleMouseEnter(e, object, index)}
              onMouseLeave={(e) => handleMouseLeave(e, object, index)}
              onClick={() => onObjectSelect(object)}
            >
              <div className="object-list-cell object-list-cell--name">
                <div className="object-list-text--primary">
                  {object.name}
                </div>
                <div className="object-list-text--secondary object-list-text--mono">
                  {object.objectid}
                </div>
              </div>
              <div className="object-list-cell object-list-cell--location">
                <div className="object-list-text--primary">
                  {object.city || ""}
                </div>
                <div className="object-list-text--secondary">
                  {object.postalCode || ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObjectListTemplate;