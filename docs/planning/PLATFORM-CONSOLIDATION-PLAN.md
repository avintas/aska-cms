# Platform Consolidation Plan

## Overview

Consolidate OnlyHockey CMS and OnlyHockey.com public site into a single monolithic Next.js application with clear separation and self-contained modules.

---

## Architecture

### Folder Structure

```
onlyhockey/
├── app/                      ← Next.js routes (App Router)
│   ├── (cms)/               ← OnlyHockey CMS routes (protected)
│   │   ├── page.tsx         → /cms (dashboard)
│   │   ├── trivia-sets/
│   │   └── ...
│   │
│   ├── (onlyhockey)/        ← OnlyHockey.com routes
│   │   ├── page.tsx         → / (homepage)
│   │   ├── trivia/          → /trivia (public)
│   │   ├── shop/            → /shop (public)
│   │   ├── games/           → /games (public)
│   │   ├── account/         → /account (protected)
│   │   └── purchases/       → /purchases (protected)
│   │
│   └── api/                 ← API routes (can deprecate later)
│
├── onlyhockey/              ← Self-contained OnlyHockey site
│   ├── components/          ← OnlyHockey-specific components
│   ├── lib/                 ← OnlyHockey utilities
│   │   ├── auth.ts          ← OnlyHockey authentication
│   │   ├── protected.ts     ← Protected route helpers
│   │   └── ecommerce.ts     ← Ecommerce logic
│   └── styles/              ← OnlyHockey styles
│
├── process-builders/        ← Process builder modules (existing)
├── components/              ← Shared UI components
├── lib/                     ← Shared utilities
└── public/                  ← Static assets
```

---

## Access Protocol & Routing

### Domain/Subdomain Routing

**Middleware** (`middleware.ts` at root) will handle:

1. **Domain-based routing:**
   - `onlyhockey.com/*` → `/app/(onlyhockey)/*`
   - `cms.onlyhockey.com/*` → `/app/(cms)/*`
   - `www.onlyhockey.com/*` → redirect to `onlyhockey.com/*`

2. **Path-based routing (fallback):**
   - `/cms/*` → CMS routes (protected)
   - `/*` → OnlyHockey routes (public or protected based on path)

### Protected Areas

**OnlyHockey Protected Routes:**
- `/account/*` - User account management
- `/purchases/*` - Purchase history
- `/settings/*` - User settings
- Any other user-specific areas

**CMS Protected Routes:**
- `/cms/*` - All CMS routes (admin only)

### Authentication Systems

**Two separate auth systems:**

1. **OnlyHockey Users:**
   - Customer accounts
   - Purchase tracking
   - Game progress
   - Stored in: `onlyhockey/lib/auth.ts`

2. **CMS Admins:**
   - Admin authentication
   - CMS access control
   - Stored in: `lib/auth-context.tsx` (existing)

---

## Migration Phases

### Phase 1: Structure Setup
- [x] Rename project from Tango to OnlyHockey
- [ ] Create `/app/(site)/` route group for public site
- [ ] Create `/site/` folder structure
- [ ] Set up middleware for path-based routing
- [x] Configure authentication middleware

### Phase 2: Public Site Migration
- [ ] Move OnlyHockey.com pages to `/app/(onlyhockey)/`
- [ ] Create OnlyHockey-specific components in `/onlyhockey/components/`
- [ ] Replace API calls with direct database queries
- [ ] Convert to Server Components where applicable

### Phase 3: Protected Routes
- [ ] Implement OnlyHockey user authentication
- [ ] Create protected route helpers (`onlyhockey/lib/protected.ts`)
- [ ] Add account management pages
- [ ] Add purchase history pages

### Phase 4: Ecommerce Integration
- [ ] Add payment processing (Stripe/PayPal)
- [ ] Connect to trivia sets
- [ ] Build shopping cart functionality
- [ ] Implement purchase tracking

### Phase 5: API Cleanup
- [ ] Mark public API endpoints as deprecated
- [ ] Remove redundant API routes (or keep for external consumers if needed)
- [ ] Update documentation

### Phase 6: Testing & Deployment
- [ ] Test domain/subdomain routing
- [ ] Test protected routes (Both OnlyHockey and CMS)
- [ ] Verify public site functionality
- [ ] Deploy unified application

---

## Key Principles

1. **Self-Contained Modules:**
   - `/onlyhockey/` is self-contained (like `/process-builders/`)
   - Can be safely removed without breaking CMS
   - Clear boundaries between modules

2. **Shared Infrastructure:**
   - Shared database (Supabase)
   - Shared UI components (`/components/ui/`)
   - Shared utilities (`/lib/`)

3. **Direct Database Access:**
   - No API layer needed for internal routes
   - Server Components query database directly
   - Better performance, simpler architecture

4. **Clear Separation:**
   - OnlyHockey routes ≠ CMS routes
   - OnlyHockey auth ≠ CMS auth
   - OnlyHockey components ≠ CMS components

---

## Benefits

- ✅ Single deployment
- ✅ Direct database queries (no API overhead)
- ✅ Shared components and utilities
- ✅ Simpler architecture
- ✅ Better performance
- ✅ Easier ecommerce integration
- ✅ Self-contained modules (easy to maintain)

---

## Next Steps

1. Review and approve this plan
2. Create detailed implementation steps for Phase 1
3. Begin structure setup
4. Iterate through phases

---

## Notes

- Route groups `(cms)` and `(onlyhockey)` don't affect URLs
- Middleware handles domain/subdomain routing
- Two separate auth systems (OnlyHockey users vs CMS admins)
- `/onlyhockey/` folder is self-contained like `/process-builders/`

