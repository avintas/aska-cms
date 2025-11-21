# Folder Rename Quick Reference Guide

**⚠️ CRITICAL:** Before renaming any folder, read `PROJECT-AUDIT-FOLDER-RENAME-ISSUES.md` first!

---

## 🚨 DO NOT RENAME THESE FOLDERS

These folders have hardcoded dependencies and will break the project if renamed:

1. **`process-builders/`** 🔴 CRITICAL
   - Used in: `scripts/discover-process-builders.ts`
   - Used in: 294+ import statements
   - Used in: Route paths (`/cms/process-builders/*`)
   - **Impact:** Breaks entire process builder system

2. **`lib/`** 🟡 MEDIUM RISK
   - Used in: 200+ import statements
   - **Impact:** Breaks TypeScript compilation

3. **`components/`** 🟡 MEDIUM RISK
   - Used in: 150+ import statements
   - **Impact:** Breaks TypeScript compilation

4. **`app/`** 🟡 MEDIUM RISK
   - Used in: Next.js route structure
   - **Impact:** Changes all URLs

---

## ✅ SAFE TO RENAME

These folders have no code dependencies:

- `docs/` - Documentation only
- `public/` - Static assets (referenced by URL, not import)
- `sql/` - SQL files (no import dependencies)

---

## 📋 FOLDER RENAME CHECKLIST

If you must rename a folder, follow these steps:

### Step 1: Preparation
- [ ] Read `PROJECT-AUDIT-FOLDER-RENAME-ISSUES.md`
- [ ] Identify all files that import from the folder
- [ ] Check if folder name appears in routes
- [ ] Check if folder name appears in scripts
- [ ] Backup your work (commit to git)

### Step 2: Update Code
- [ ] Update all import statements (use find/replace)
- [ ] Update route paths if folder matches a route
- [ ] Update scripts that reference the folder
- [ ] Update TypeScript path aliases if needed
- [ ] Update documentation

### Step 3: Regenerate Files
- [ ] Run `npm run discover-builders` (if renaming `process-builders/`)
- [ ] Verify `process-builders-registry.json` is updated
- [ ] Check that registry matches actual folders

### Step 4: Testing
- [ ] Run `npm run build` - Check for TypeScript errors
- [ ] Run `npm run lint` - Check for linting errors
- [ ] Test all routes that use the folder
- [ ] Test process builders (if applicable)
- [ ] Test in browser - Verify all imports work

### Step 5: External Tools
- [ ] **Cursor Chat History** - Check if Cursor's chat storage references project path
  - Cursor stores chat history outside the project folder
  - If Cursor's storage uses absolute paths, renaming the project folder could break chat history
  - **Solution:** Check Cursor's app data location (usually `%APPDATA%\Cursor` on Windows)
  - Consider backing up Cursor's chat data before renaming

---

## 🔧 QUICK FIXES FOR COMMON ISSUES

### Issue: Process Builders Not Discovered

**Symptom:** Process builders don't appear in UI after folder rename

**Fix:**
```bash
npm run discover-builders
npm run build
```

### Issue: TypeScript Import Errors

**Symptom:** TypeScript can't resolve imports after folder rename

**Fix:**
1. Check `tsconfig.json` path aliases
2. Update all `@/folder-name/` imports
3. Run `npm run build` to verify

### Issue: Routes Broken

**Symptom:** URLs return 404 after folder rename

**Fix:**
1. Check if folder name matches route path
2. Update route structure in `app/` directory
3. Add redirects if needed (in `next.config.js`)

### Issue: Registry Out of Sync

**Symptom:** Registry file doesn't match actual folders

**Fix:**
```bash
npm run discover-builders
```

---

## 🛠️ HELPFUL COMMANDS

### Find All Imports of a Folder
```bash
# Find all imports referencing a folder
grep -r "@/folder-name" --include="*.ts" --include="*.tsx"
```

### Find All Route References
```bash
# Find route references
grep -r "/folder-name" --include="*.ts" --include="*.tsx"
```

### Regenerate Process Builder Registry
```bash
npm run discover-builders
```

### Check TypeScript Compilation
```bash
npm run build
```

---

## 📝 NOTES

### About Cursor Chat History

**Important:** Cursor's chat history is stored outside the project folder. If you rename the project's root folder, Cursor may lose track of chat history if it uses absolute paths.

**To prevent chat loss:**
1. Check Cursor's chat storage location (usually in `%APPDATA%\Cursor` on Windows)
2. Back up chat data before renaming
3. Consider using relative paths or workspace names instead of folder names

**If chat history is lost:**
- Check Cursor's app data folder for backups
- Contact Cursor support for recovery options
- Consider using Git commits to track conversation context

---

## 🆘 EMERGENCY RECOVERY

If you've renamed a folder and broken the project:

1. **Revert the rename** (if using Git):
   ```bash
   git checkout HEAD -- folder-name/
   ```

2. **Or manually rename back** to original name

3. **Regenerate registry**:
   ```bash
   npm run discover-builders
   ```

4. **Rebuild**:
   ```bash
   npm run build
   ```

---

## 📚 RELATED DOCUMENTATION

- `PROJECT-AUDIT-FOLDER-RENAME-ISSUES.md` - Complete audit
- `docs/process-builders-final-architecture.md` - Process builder architecture
- `process-builders/README.md` - Process builder documentation

---

**Last Updated:** 2024-12-19

