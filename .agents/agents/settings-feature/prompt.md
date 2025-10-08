# Settings Feature Extraction Task

## Objective
Extract Settings feature (Task 9) - System configuration, API management, device setup.

## Files to Move

### Pages
- SystemSettings.tsx → client/src/features/settings/pages/
- ApiManagement.tsx → client/src/features/settings/pages/
- ModbusConfig.tsx → client/src/features/settings/pages/
- Geraeteverwaltung.tsx → client/src/features/settings/pages/
- Devices.tsx → client/src/features/settings/pages/

### Components
- JsonConfigurationEditor.tsx → client/src/features/settings/components/
- PortalJsonEditor.tsx → client/src/features/settings/components/
- PortalConfigCard.tsx → client/src/features/settings/components/
- SystemPortalSetup.tsx → client/src/features/settings/components/
- CollapsiblePortalCards.tsx → client/src/features/settings/components/
- deviceanmeldung.tsx → client/src/features/settings/components/

## Tasks

### 1. Move Files
Use `git mv` to move all settings-related files to the settings feature directory.

### 2. Create settingsApi.ts
Location: `client/src/features/settings/api/settingsApi.ts`

Create API client with endpoints for:
- System settings CRUD
- API configuration
- Modbus device config
- Device management

### 3. Update Imports
- Update App.tsx
- Update any files importing settings components
- Update internal imports within moved files

### 4. Verify Build
- Run `npm run build`
- Fix any errors

### 5. Commit
```
feat(frontend): extract Settings feature module

- Move system settings, API management, device config pages
- Move configuration editor components
- Create settingsApi.ts
- Update all imports
- Build passing

Task 9/15 complete
```

## Success Criteria
- ✅ All settings files moved (11 files)
- ✅ settingsApi.ts created
- ✅ All imports updated
- ✅ Build passing
- ✅ Committed and pushed
