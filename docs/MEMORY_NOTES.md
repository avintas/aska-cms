# Memory Notes

Important decisions, patterns, and notes to remember throughout development.

## Project Context

- **CMS**: Next.js application for content creators to manage trivia content
- **Workers**: Background processes that analyze content and generate trivia game sets
- **Web**: Public-facing website for users to play trivia games

## Key Decisions

### Environment Variables
- Single source of truth: Root `.env.local`
- Sync script: `npm run sync-env` distributes `NEXT_PUBLIC_*` vars to all apps
- Never edit app-level `.env.local` files directly (they're auto-generated)

### Shared Code
- All shared types and utilities live in `packages/shared`
- Import via: `import { Type } from '@aska/shared'`
- Keep app-specific code in respective app directories

### Communication Patterns
1. **Database**: All apps connect to same Supabase instance
2. **APIs**: RESTful endpoints for inter-app communication
3. **Queues**: Future implementation for async job processing
4. **Shared Package**: Common types and utilities

## Development Workflow

- CMS runs on port 3001
- Web runs on port 3000
- Workers run as Node.js processes
- Use `npm run dev:cms` and `npm run dev:web` for development

## Important Reminders

- Always run `npm run sync-env` after updating root `.env.local`
- Use TypeScript strict mode
- Follow the architecture patterns in `ARCHITECTURE.md`
- Document SQL changes in `sql/` directory

