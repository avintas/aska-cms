# Web App ↔ CMS Communication Architecture

## Overview

This document defines how the OnlyHockey.com web app (`apps/web`) communicates with the CMS (`apps/cms`) to access published content.

## Current Situation

- **Web App**: Port 3000 (onlyhockey.com - public-facing)
- **CMS**: Port 3001 (internal/admin use)
- **Shared Database**: Both apps connect to the same Supabase instance
- **Issue**: Web app is trying to fetch from CMS API endpoints that don't exist yet

## Architecture Options

### Option 1: Direct Database Access (Recommended) ⭐

**Pattern**: Web app queries Supabase directly for published content

```
Web App (port 3000) ──[queries]──> Supabase Database ──[RLS policies]──> Published Content
```

**Implementation**:
- Web app uses Supabase client to query tables directly
- RLS (Row Level Security) policies ensure only published content is accessible
- No inter-app communication needed
- No CORS issues

**Pros**:
- ✅ Simpler architecture - no API layer needed
- ✅ Faster - direct database access
- ✅ No CORS issues
- ✅ Scales better - no API bottleneck
- ✅ Consistent with "both apps share same database" principle

**Cons**:
- ⚠️ Requires RLS policies for public read access
- ⚠️ Web app needs database connection (already has it via env vars)

**Example**:
```typescript
// apps/web/src/app/shareables/page.tsx
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const { data: wisdom } = await supabase
  .from('collection_wisdom')
  .select('id, title, musing, from_the_box, theme, attribution')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(5);
```

**RLS Policy Required**:
```sql
-- Allow public read access to published content
CREATE POLICY "Public can read published wisdom"
ON collection_wisdom FOR SELECT
TO public
USING (status = 'published');
```

---

### Option 2: CMS API Endpoints

**Pattern**: Web app calls CMS REST API endpoints

```
Web App (port 3000) ──[HTTP requests]──> CMS API (port 3001) ──[queries]──> Supabase Database
```

**Implementation**:
- CMS provides public API routes (`/api/public/*`)
- Web app makes HTTP requests to CMS
- CMS handles authentication, filtering, and data formatting

**Pros**:
- ✅ Clear separation - CMS controls what's exposed
- ✅ Can add caching, rate limiting, analytics
- ✅ CMS can transform/format data before sending
- ✅ Easier to version APIs

**Cons**:
- ⚠️ Requires implementing API endpoints in CMS
- ⚠️ CORS configuration needed
- ⚠️ Extra network hop (slower)
- ⚠️ CMS must be running/accessible
- ⚠️ More complex error handling

**Example**:
```typescript
// apps/web/src/app/shareables/page.tsx
const cmsUrl = process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001';
const response = await fetch(`${cmsUrl}/api/public/wisdom/latest?limit=5`);
const { data } = await response.json();
```

**CMS API Route Required**:
```typescript
// apps/cms/src/app/api/public/wisdom/latest/route.ts
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('collection_wisdom')
    .select('id, title, musing, from_the_box, theme, attribution')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10);
  
  return NextResponse.json({ success: true, data });
}
```

---

## Recommended Approach: Option 1 (Direct Database Access)

**Why Option 1 is Better**:

1. **Simpler**: No API layer to build/maintain
2. **Faster**: Direct database queries are faster than HTTP → API → Database
3. **No CORS**: Same-origin database access
4. **Consistent**: Aligns with "both apps share same database" principle
5. **Scalable**: Database handles load, not a single API server
6. **Already Set Up**: Both apps already have Supabase connection

**When to Use Option 2**:
- If you need complex data transformations
- If you need rate limiting per user/IP
- If you want to expose APIs to external consumers
- If CMS needs to add analytics/monitoring

---

## Implementation Plan

### Phase 1: Set Up Direct Database Access (Recommended)

1. **Create Supabase utilities in web app**:
   ```typescript
   // apps/web/src/utils/supabase/client.ts
   import { createBrowserClient } from '@supabase/ssr';
   
   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   }
   ```

2. **Create RLS policies for public read access**:
   - `collection_wisdom` - published only
   - `collection_greetings` - published only
   - `collection_stats` - published only
   - `collection_motivational` - published only

3. **Update Shareables page to use direct queries**:
   - Replace fetch calls with Supabase queries
   - Filter by `status = 'published'`
   - Use proper error handling

### Phase 2: (Optional) Add CMS API Endpoints

If you decide you need APIs later:
1. Create `/api/public/*` routes in CMS
2. Add CORS headers
3. Update web app to use APIs instead of direct queries

---

## Security Considerations

### Direct Database Access (Option 1)

**RLS Policies**:
- ✅ Only allow `SELECT` on published content
- ✅ Never expose internal fields (`status`, `created_at`, etc.)
- ✅ Use `SELECT` with explicit column list
- ✅ Filter by `status = 'published'` in queries

**Example RLS Policy**:
```sql
-- Public can only read published wisdom
CREATE POLICY "public_read_published_wisdom"
ON collection_wisdom FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Only expose safe fields (not status, created_at, etc.)
-- Enforce via SELECT column list in application code
```

### CMS API Endpoints (Option 2)

**Security**:
- ✅ No authentication required (public APIs)
- ✅ Filter to published content only
- ✅ Don't expose internal fields
- ✅ Add rate limiting
- ✅ Add CORS headers

---

## Decision Matrix

| Factor | Option 1: Direct DB | Option 2: CMS API |
|--------|---------------------|-------------------|
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (with caching) |
| **Separation** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **CORS Issues** | ✅ None | ✅ None (same domain) |
| **Setup Time** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vercel Integration** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Caching** | ❌ None | ✅ Edge Cache, ISR |
| **Security** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Monitoring** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommendation for Vercel Hosting

**Use Option 2 (CMS API Endpoints)** ⭐ **RECOMMENDED FOR VERCEL**

For Vercel deployments, Option 2 is more modern, manageable, and stable:

### Why Option 2 is Better on Vercel:

1. **Serverless Functions**: API routes become Vercel serverless functions
   - ✅ Automatic scaling
   - ✅ Edge network distribution
   - ✅ Built-in monitoring and analytics

2. **Caching**: Can leverage Vercel's caching layers
   - ✅ Edge Cache (CDN) - reduces database load
   - ✅ ISR (Incremental Static Regeneration)
   - ✅ Redis for dynamic content caching

3. **Security**: Database queries happen server-side
   - ✅ Anon key never exposed to browser
   - ✅ Can add authentication/rate limiting
   - ✅ Better security posture

4. **Performance**: 
   - ✅ Edge caching reduces database load
   - ✅ Can batch/optimize queries server-side
   - ✅ Reduces client-side bundle size
   - ✅ Faster for users (cached responses)

5. **Monitoring**: Built-in Vercel analytics
   - ✅ API route performance metrics
   - ✅ Error tracking
   - ✅ Usage analytics

6. **No CORS Issues**: Same domain deployment
   - ✅ Can deploy both apps on same domain
   - ✅ Or use Vercel rewrites/proxies
   - ✅ API routes in web app = same origin

### Implementation Strategy for Vercel:

**Option A: API Routes in Web App** (Recommended)
- Create `/api/public/*` routes in `apps/web`
- Routes query Supabase server-side
- Same domain = no CORS
- Leverages Vercel Edge Cache

**Option B: Separate Deployments**
- Web app on `onlyhockey.com`
- CMS on `cms.onlyhockey.com` or `admin.onlyhockey.com`
- Use Vercel rewrites or API routes in web app

**Option C: Hybrid**
- Public content: API routes in web app (Option 2)
- Admin/Complex: Separate CMS APIs (Option 2)

---

## Next Steps for Vercel Deployment

### Recommended: Option 2 (CMS API Endpoints)

1. **Create API routes in web app** (`apps/web/src/app/api/public/*`)
   - `/api/public/wisdom/latest`
   - `/api/public/greetings/latest`
   - `/api/public/stats/latest`
   - `/api/public/motivational/latest`

2. **Implement server-side queries**
   - Use Supabase server client in API routes
   - Filter to published content only
   - Add proper error handling

3. **Add caching** (Vercel Edge Cache)
   ```typescript
   export async function GET() {
     const data = await fetchFromDatabase();
     return NextResponse.json(data, {
       headers: {
         'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
       }
     });
   }
   ```

4. **Update Shareables page**
   - Change fetch URLs to `/api/public/*` (same domain)
   - No CORS issues
   - Leverages Vercel Edge Cache

5. **Deploy both apps**
   - Web app: `onlyhockey.com`
   - CMS: `admin.onlyhockey.com` or `cms.onlyhockey.com`
   - Or: Unified deployment with API routes

### Alternative: Option 1 (Direct DB) - Simpler but Less Optimal

If you prefer simplicity over optimization:
1. Create Supabase client utilities in `apps/web`
2. Create RLS policies for public read access
3. Update Shareables page to use direct database queries
4. Accept that queries run client-side (visible in network tab)

---

**Last Updated**: 2025-01-XX  
**Status**: Architecture Decision Document  
**Decision**: Option 1 (Direct Database Access) - Recommended

