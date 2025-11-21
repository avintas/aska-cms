# Aska Monorepo Architecture

## Overview

The Aska monorepo consists of three main applications that work together to create and deliver trivia game content:

1. **CMS** (Content Management System) - Next.js app for content creators
2. **Workers** - Background processes for building trivia game sets
3. **Web** - Public-facing website for users

## Application Structure

```
aska/
├── apps/
│   ├── cms/          # Next.js CMS application (Port 3001)
│   ├── web/          # Next.js public website (Port 3000)
│   └── workers/      # Background worker processes
├── packages/
│   └── shared/       # Shared types, utilities, and functions
└── scripts/          # Build and utility scripts
```

## Communication Patterns

### 1. Shared Database (Supabase)

All apps connect to the same Supabase PostgreSQL database:

- **CMS**: Creates and manages content, trivia sets, and questions
- **Workers**: Reads content, processes it, and writes generated trivia sets
- **Web**: Reads published trivia sets and user data

**Database Access:**
- Each app uses `@supabase/supabase-js` with appropriate client (browser/server)
- Shared database types are defined in `packages/shared/src/types/`

### 2. API Calls Between Apps

Apps communicate via HTTP APIs:

- **CMS → Workers**: Triggers job processing via API endpoints
- **Workers → CMS**: Updates job status and results via API callbacks
- **Web → CMS**: Fetches published content (if needed)

**API Structure:**
- RESTful endpoints for inter-app communication
- Standardized response format: `ApiResponse<T>` from `@aska/shared`

### 3. Message Queues (Future)

For async job processing:

- Workers listen to job queues
- CMS publishes jobs to queues
- Enables scalable, distributed processing

**Queue Options:**
- BullMQ (Redis-based)
- Supabase Realtime/Webhooks
- Custom queue service

### 4. Shared Packages

Common code lives in `packages/shared/`:

- **Types**: `TriviaGameSet`, `TriviaQuestion`, `WorkerJob`, etc.
- **Utils**: Validation, formatting, API helpers
- **Constants**: Shared configuration values

**Usage:**
```typescript
import { TriviaGameSet, createApiResponse } from '@aska/shared';
```

## Data Flow

### Trivia Set Creation Flow

1. **CMS**: Content creator creates trivia content
2. **CMS**: Triggers worker job via API call
3. **Workers**: Processes content and generates trivia set
4. **Workers**: Saves trivia set to database
5. **Workers**: Updates job status (via API callback or database)
6. **CMS**: Displays generated trivia set
7. **Web**: Publishes trivia set for public access

## Technology Stack

### CMS & Web
- **Framework**: Next.js 15.5.2
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4.3
- **Database**: Supabase (PostgreSQL)

### Workers
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)

### Shared
- **Package Manager**: npm workspaces
- **Type System**: TypeScript strict mode

## Environment Variables

All apps share environment variables from root `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `POSTGRES_URL` - Direct database connection

Run `npm run sync-env` to sync `NEXT_PUBLIC_*` variables to all apps.

## Development Workflow

1. **CMS Development**: `npm run dev --workspace=apps/cms`
2. **Web Development**: `npm run dev --workspace=apps/web`
3. **Workers Development**: TBD (based on worker implementation)

## Security Considerations

- **CMS**: Admin authentication required
- **Workers**: Service role key for elevated permissions
- **Web**: Public anonymous key only
- **API Communication**: Internal network or API keys
- **Database**: Row Level Security (RLS) policies

## Future Enhancements

- [ ] Message queue implementation
- [ ] Real-time updates via Supabase Realtime
- [ ] Shared UI component library
- [ ] API gateway for inter-app communication
- [ ] Monitoring and logging infrastructure

