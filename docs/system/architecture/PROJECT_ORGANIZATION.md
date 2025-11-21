# Project Organization

This document describes the organization and structure of the Aska monorepo.

## Root Directory Structure

The root directory is kept clean and organized with minimal files:

### Configuration Files (Root)
These files must remain in root as tools expect them there:
- `package.json` - npm workspace configuration
- `package-lock.json` - npm lock file
- `tsconfig.json` - Root TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.gitignore` - Git ignore rules
- `.gitattributes` - Git attributes for line endings
- `.editorconfig` - Editor configuration

### Documentation Files (Root)
- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines

### Directories

#### `apps/`
Contains all applications:
- `web/` - Public-facing website (Next.js, port 3000)
- `cms/` - Content Management System (Next.js, port 3001)
- `workers/` - Background worker processes

#### `packages/`
Shared packages used across apps:
- `shared/` - Common types, utilities, and functions

#### `docs/`
All project documentation:
- `ARCHITECTURE.md` - System architecture
- `SYSTEM_DESIGN.md` - Design decisions
- `MEMORY_NOTES.md` - Important notes
- `API_DESIGN.md` - API specifications
- `PROJECT_ORGANIZATION.md` - This file

#### `sql/`
Database scripts organized by purpose:
- `schema/` - Schema definitions
- `migrations/` - Migration scripts
- `seeds/` - Seed data
- `queries/` - Common queries

#### `scripts/`
Utility scripts for monorepo management:
- `sync-env.js` - Environment variable sync

#### `.github/`
GitHub-specific configuration:
- `README.md` - Placeholder for workflows and templates

#### `.vscode/`
VS Code workspace settings:
- `settings.json` - Workspace settings
- `extensions.json` - Recommended extensions
- `launch.json` - Debug configurations

#### `.config/`
Future configuration organization:
- `README.md` - Documentation

#### `.husky/`
Git hooks configuration

## File Organization Principles

1. **Minimal Root**: Only essential config files and main README
2. **Categorized Directories**: Each type of file has its place
3. **Documentation Centralized**: All docs in `docs/`
4. **SQL Organized**: Database scripts in `sql/` with subdirectories
5. **Scripts Documented**: Each script directory has a README
6. **IDE Settings Tracked**: VS Code settings committed for consistency

## Adding New Files

### Documentation
→ Place in `docs/` directory

### SQL Scripts
→ Place in appropriate `sql/` subdirectory:
- Schema: `sql/schema/`
- Migrations: `sql/migrations/`
- Seeds: `sql/seeds/`
- Queries: `sql/queries/`

### Utility Scripts
→ Place in `scripts/` directory
→ Document in `scripts/README.md`

### Configuration
→ If tool supports it, place in `.config/`
→ Otherwise, keep in root with clear naming

## Maintenance

- Keep root directory clean
- Document all new directories
- Follow naming conventions
- Update this document when structure changes

