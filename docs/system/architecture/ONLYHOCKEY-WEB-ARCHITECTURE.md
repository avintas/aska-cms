# OnlyHockey.com Web Architecture

## Core Distinction

**This document establishes the permanent architectural distinction between the public website and the CMS system.**

### OnlyHockey.com - The Public Website

- **Location**: `apps/web/`
- **Port**: 3000
- **Access**: `http://localhost:3000` (development) → onlyhockey.com (production)
- **Domain**: onlyhockey.com (public-facing)
- **Purpose**: Public website where users play trivia games, view content, and interact with OnlyHockey
- **Role**: **Content Consumer** - Displays content managed by the CMS

### CMS - The Content Management System

- **Location**: `apps/cms/`
- **Port**: 3001
- **Access**: `http://localhost:3001` (development) - Internal/admin use only
- **Purpose**: Internal content management system for content creators and administrators
- **Role**: **Content Producer** - Creates, manages, and publishes content that drives the web app

## Relationship

```
CMS (apps/cms) ──[manages content]──> Database ──[serves content]──> Web (apps/web)
     ↑                                                                    ↓
     └───────────────────────[onlyhockey.com displays]───────────────────┘
```

### Data Flow

1. **Content Creation**: Content creators use the CMS (`apps/cms`) to create, edit, and manage content
2. **Content Storage**: Content is stored in the shared Supabase database
3. **Content Display**: The web app (`apps/web`) reads from the database and displays content to users on onlyhockey.com

## Key Principles

1. **Separation of Concerns**
   - CMS is for content management (internal/admin use)
   - Web is for content consumption (public-facing)

2. **Single Source of Truth**
   - All content originates from the CMS
   - The web app is a read-only consumer of CMS-managed content

3. **Clear Boundaries**
   - Never refer to the web app as "CMS" or "web interface to CMS"
   - The web app is the public website (onlyhockey.com)
   - The CMS is the content management system

## Terminology

- ✅ **Correct**: "The web app (onlyhockey.com) is driven by the CMS"
- ✅ **Correct**: "The web app displays content managed by the CMS"
- ✅ **Correct**: "onlyhockey.com is the public website"
- ❌ **Incorrect**: "Web interface to CMS"
- ❌ **Incorrect**: "CMS web interface"

## Implementation Notes

- Both apps share the same database (Supabase)
- Both apps use shared types from `packages/shared`
- The web app consumes content via database queries and API endpoints
- The CMS provides content management interfaces and APIs

---

**Last Updated**: 2024
**Status**: Permanent architectural distinction
