import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface StandardTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function StandardTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  emptyMessage = "Keine Daten verfügbar",
  className = "",
}: StandardTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="bg-gray-200 hover:bg-gray-200">
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className="h-8 px-4 text-left align-middle font-semibold text-gray-700 pl-[10px] pr-[10px]"
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow
            key={item.id}
            className={`h-10 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            } hover:bg-blue-50`}
          >
            {columns.map((column) => (
              <TableCell
                key={`${item.id}-${column.key}`}
                className={`py-1 px-4 pl-[10px] pr-[10px] ${
                  column.className || ''
                }`}
              >
                {column.render
                  ? column.render(item, index)
                  : (item as any)[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Vordefinierte Spalten-Klassen für konsistente Darstellung
export const TableCellStyles = {
  primary: "font-medium",
  secondary: "text-gray-600",
  actions: "text-right",
  date: "text-gray-600 text-sm",
  status: "font-medium",
} as const;

// Beispiel-Implementierung für UserGroups
export const createUserGroupColumns = (onEdit?: (group: any) => void, onDelete?: (group: any) => void) => [
  {
    key: 'name',
    header: 'Name',
    className: TableCellStyles.primary,
  },
  {
    key: 'description',
    header: 'Beschreibung',
    className: TableCellStyles.secondary,
    render: (group: any) => group.description || "Keine Beschreibung",
  },
  {
    key: 'createdAt',
    header: 'Erstellt',
    className: TableCellStyles.date,
    render: (group: any) => 
      group.createdAt ? new Date(group.createdAt).toLocaleDateString('de-DE') : "N/A",
  },
  {
    key: 'actions',
    header: 'Aktionen',
    className: TableCellStyles.actions,
    render: (group: any) => (
      <div className="flex space-x-2">
        {onEdit && (
          <button
            onClick={() => onEdit(group)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Bearbeiten
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(group)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Löschen
          </button>
        )}
      </div>
    ),
  },
];

// Beispiel-Implementierung für Mandates
export const createMandateColumns = (onEdit?: (mandate: any) => void, onDelete?: (mandate: any) => void) => [
  {
    key: 'name',
    header: 'Name',
    className: TableCellStyles.primary,
  },
  {
    key: 'description',
    header: 'Beschreibung',
    className: TableCellStyles.secondary,
    render: (mandate: any) => mandate.description || "Keine Beschreibung",
  },
  {
    key: 'createdAt',
    header: 'Erstellt',
    className: TableCellStyles.date,
    render: (mandate: any) => 
      mandate.createdAt ? new Date(mandate.createdAt).toLocaleDateString('de-DE') : "N/A",
  },
  {
    key: 'actions',
    header: 'Aktionen',
    className: TableCellStyles.actions,
    render: (mandate: any) => (
      <div className="flex space-x-2">
        {onEdit && (
          <button
            onClick={() => onEdit(mandate)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Bearbeiten
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(mandate)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Löschen
          </button>
        )}
      </div>
    ),
  },
];