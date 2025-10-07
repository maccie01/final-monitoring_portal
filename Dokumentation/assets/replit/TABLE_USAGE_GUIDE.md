# Tabellen Design System - Verwendungsanleitung

## Schnellstartanleitung

### 1. StandardTable Komponente verwenden

```tsx
import { StandardTable, createUserGroupColumns } from '@/components/ui/StandardTable';

// In Ihrer Komponente:
const columns = createUserGroupColumns(handleEdit, handleDelete);

return (
  <StandardTable
    data={userGroups}
    columns={columns}
    loading={isLoading}
    emptyMessage="Keine Benutzergruppen vorhanden"
  />
);
```

### 2. Manuelle Implementierung

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow className="bg-gray-200 hover:bg-gray-200">
      <TableHead className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]">
        Name
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items?.map((item, index) => (
      <TableRow key={item.id} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
        <TableCell className="font-medium py-1 px-4 pl-[10px] pr-[10px]">
          {item.name}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Styling-Klassen Referenz

### Basis-Klassen (IMMER verwenden)

```tsx
// Tabellenkopf
className="bg-gray-200 hover:bg-gray-200"

// Kopfzellen
className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]"

// Tabellenzeilen (alternierende Hintergründe)
className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}

// Standard-Tabellenzellen
className="py-1 px-4 pl-[10px] pr-[10px]"
```

### Zusatz-Klassen für Zelleninhalte

```tsx
// Primärer Inhalt (z.B. Namen, Titel)
className="font-medium py-1 px-4 pl-[10px] pr-[10px]"

// Sekundärer Inhalt (z.B. Beschreibungen)
className="text-gray-600 py-1 px-4 pl-[10px] pr-[10px]"

// Datum/Zeit
className="text-gray-600 text-sm py-1 px-4 pl-[10px] pr-[10px]"

// Aktionen (rechtsbündig)
className="text-right py-1 px-4 pl-[10px] pr-[10px]"
```

## Beispiel-Implementierungen

### Benutzergruppen-Tabelle

```tsx
const userGroupColumns = [
  {
    key: 'name',
    header: 'Name',
    className: 'font-medium',
  },
  {
    key: 'description',
    header: 'Beschreibung',
    className: 'text-gray-600',
    render: (group) => group.description || "Keine Beschreibung",
  },
  {
    key: 'createdAt',
    header: 'Erstellt',
    className: 'text-gray-600 text-sm',
    render: (group) => 
      group.createdAt ? new Date(group.createdAt).toLocaleDateString('de-DE') : "N/A",
  },
];
```

### Mandate-Tabelle

```tsx
const mandateColumns = [
  {
    key: 'name',
    header: 'Name',
    className: 'font-medium',
  },
  {
    key: 'description',
    header: 'Beschreibung',
    className: 'text-gray-600',
    render: (mandate) => mandate.description || "Keine Beschreibung",
  },
  {
    key: 'actions',
    header: 'Aktionen',
    className: 'text-right',
    render: (mandate) => (
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => handleEdit(mandate)}>
          Bearbeiten
        </Button>
        <Button variant="destructive" size="sm" onClick={() => handleDelete(mandate)}>
          Löschen
        </Button>
      </div>
    ),
  },
];
```

## CardContent Container

**WICHTIG**: Verwenden Sie immer diese Container-Einstellung:

```tsx
<CardContent className="p-1">
  <StandardTable ... />
</CardContent>
```

Das `p-1` (4px Padding) sorgt für die kompakte, moderne Darstellung.

## Migration bestehender Tabellen

### Schritt 1: Identifizieren Sie die aktuelle Implementierung
Suchen Sie nach `<Table>`, `<TableRow>`, `<TableCell>` Komponenten in Ihren Dateien.

### Schritt 2: Ersetzen Sie die Styling-Klassen
- **Tabellenkopf**: Fügen Sie `bg-gray-200 hover:bg-gray-200` hinzu
- **Kopfzellen**: Verwenden Sie die Standard-Kopfzellen-Klassen
- **Zeilen**: Implementieren Sie alternierende Hintergründe und blauen Hover-Effekt
- **Zellen**: Standardisieren Sie Padding und Schriftgewichte

### Schritt 3: Testen und Validieren
- Überprüfen Sie die visuelle Darstellung
- Testen Sie Hover-Effekte
- Validieren Sie responsive Darstellung

## Häufige Fehler vermeiden

### ❌ Falsch
```tsx
// Inkonsistente Höhen
className="h-12"

// Falsches Padding
className="p-2"

// Fehlende alternierende Hintergründe
className="bg-white"

// Grauer Hover-Effekt
className="hover:bg-gray-100"
```

### ✅ Richtig
```tsx
// Konsistente 40px Zeilenhöhe
className="h-10"

// Standardisiertes Padding
className="py-1 px-4 pl-[10px] pr-[10px]"

// Alternierende Hintergründe
className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}

// Blauer Hover-Effekt
className="hover:bg-blue-50"
```

## Performance-Tipps

1. **Verwenden Sie den index für alternierende Zeilen** statt komplexe Berechnungen
2. **Nutzen Sie die StandardTable-Komponente** für neue Implementierungen
3. **Cachen Sie Spaltendefinitionen** außerhalb der Render-Funktion
4. **Verwenden Sie React.memo** für komplexe Zelleninhalte

## Barrierefreiheit-Checkliste

- [ ] Semantische HTML-Struktur (`<table>`, `<thead>`, `<tbody>`)
- [ ] Aussagekräftige Spaltenüberschriften
- [ ] Ausreichender Farbkontrast (4.5:1 Minimum)
- [ ] Keyboard-Navigation für interaktive Elemente
- [ ] Screen Reader kompatible Aktions-Buttons

---

*Diese Anleitung wird regelmäßig aktualisiert. Bei Fragen oder Verbesserungsvorschlägen wenden Sie sich an das Entwicklungsteam.*