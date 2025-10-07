# Archive Manifest

Created: 2025-10-07
Timestamp: 14:35:00

## Overview

This directory contains files that have been identified as unused, duplicate, or outdated during the codebase cleanup on 2025-10-07. All files are preserved here for reference and potential future restoration.

## Archived Files

### Root Directory Files

#### `/archive/root/db_test.js`
- **Original Path**: `/db_test.js`
- **Size**: ~4.5K
- **Type**: Test/Debug Script
- **Reason for Archival**: Test file not part of production code
- **Import Status**: Not imported by any active files
- **Date Archived**: 2025-10-07
- **Description**: Database inspection script for debugging purposes
- **Safe to Restore**: No (test/development only)

### Client Pages

#### `/archive/client/pages/ApiManagement_copy.tsx`
- **Original Path**: `/client/src/pages/ApiManagement (copy).tsx`
- **Size**: ~19K
- **Type**: Duplicate File
- **Reason for Archival**: Exact duplicate of `/client/src/pages/ApiManagement.tsx`
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: Copy of API management/testing interface
- **Safe to Restore**: No (duplicate content)
- **Note**: Active version exists at `/client/src/pages/ApiManagement.tsx`

#### `/archive/client/pages/GrafanaBoard.tsx`
- **Original Path**: `/client/src/pages/GrafanaBoard.tsx`
- **Size**: Unknown
- **Type**: Unused Page
- **Reason for Archival**: Not imported in App.tsx or any other file
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: Grafana board page (superseded by GrafanaDashboard.tsx)
- **Safe to Restore**: Maybe (check if functionality differs from GrafanaDashboard.tsx)
- **Note**: Similar functionality exists in `/client/src/pages/GrafanaDashboard.tsx`

#### `/archive/client/pages/GrafanaTest.tsx`
- **Original Path**: `/client/src/pages/GrafanaTest.tsx`
- **Size**: Unknown
- **Type**: Test Page
- **Reason for Archival**: Test/development page, not imported in production routing
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: Test page for Grafana integration
- **Safe to Restore**: Maybe (only for development/testing)
- **Note**: Should remain in archive unless needed for development

### Client Components

#### `/archive/client/components/TabLayoutExample.tsx`
- **Original Path**: `/client/src/components/TabLayoutExample.tsx`
- **Size**: Unknown
- **Type**: Example/Template File
- **Reason for Archival**: Example implementation not used in production
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: Example tab layout component
- **Safe to Restore**: No (example code only)
- **Note**: Active implementation exists at `/client/src/components/TabLayout.tsx`

#### `/archive/client/components/ObjectListTemplate.tsx`
- **Original Path**: `/client/src/components/ObjectListTemplate.tsx`
- **Size**: Unknown
- **Type**: Template/Unused Component
- **Reason for Archival**: Not imported by any active files
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: Object list template component
- **Safe to Restore**: Maybe (check if differs from ObjectListLayout.tsx)
- **Note**: Similar component exists at `/client/src/components/ObjectListLayout.tsx`

#### `/archive/client/components/UserProfileRedirect.tsx`
- **Original Path**: `/client/src/components/UserProfileRedirect.tsx`
- **Size**: Unknown
- **Type**: Unused Component
- **Reason for Archival**: Not imported by any active files
- **Import Status**: Not imported anywhere
- **Date Archived**: 2025-10-07
- **Description**: User profile redirect component
- **Safe to Restore**: Maybe (if redirect functionality is needed)

### Previously Archived

#### `/archive/GrafanaDiagramme_alt.tsx`
- **Original Path**: Unknown (archived before 2025-10-07)
- **Size**: ~74K
- **Type**: Alternative Implementation
- **Reason for Archival**: Alternative version of Grafana component
- **Import Status**: Not imported anywhere
- **Date Archived**: Before 2025-10-07
- **Description**: Alternative Grafana diagram implementation
- **Safe to Restore**: No (superseded by current version)
- **Note**: Active version exists at `/client/src/components/GrafanaDiagramme.tsx`

## Archive Statistics

- Total files archived: 8
- Test/Debug files: 1
- Duplicate files: 1
- Unused pages: 2
- Unused components: 3
- Previously archived: 1

## Verification Before Archival

All files were verified before archival:
1. Import analysis confirmed no active imports
2. Grep search verified no references in active code
3. App.tsx routing confirmed pages not in use
4. Component tree analysis confirmed no component usage

## Restoration Guidelines

To restore a file from archive:

1. Review the file content to ensure it's still compatible
2. Check if similar functionality already exists in active code
3. Update any imports/exports if file structure has changed
4. Add to appropriate routing if it's a page component
5. Test thoroughly before committing

### Restoration Command Template

```bash
# For pages
mv archive/client/pages/[FILENAME] client/src/pages/[FILENAME]

# For components
mv archive/client/components/[FILENAME] client/src/components/[FILENAME]

# For root files
mv archive/root/[FILENAME] ./[FILENAME]
```

## Notes

- No files were permanently deleted
- All archived files remain accessible in git history
- Archive directory structure mirrors original project structure
- Filenames with spaces were renamed (e.g., "(copy)" became "_copy")

## Related Documentation

- See `/FILE_STRUCTURE.md` for complete active file documentation
- See git history for when files were originally created
- See project documentation in `/Dokumentation/` for feature details
