# Tango CMS Developer Handoff Summary

**Date:** October 29, 2025  
**Purpose:** Document patterns and architecture for future library implementations

---

## 🏗️ System Architecture

### The Big Picture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Tango CMS     │──API──▶ │   Public APIs    │──HTTP──▶│  omnipaki.com   │
│  (This System)  │         │ (No Auth Needed) │         │  (Front-end)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
     Database                      REST API                  Fetch Calls
     Supabase                    CORS Enabled               No DB Access
```

### Key Architectural Decisions

1. **Decoupled Design**
   - Tango CMS manages content via Supabase
   - Public APIs expose published content only
   - omnipaki.com consumes content via HTTP (no database credentials needed)

2. **Public APIs** (`/api/public/*` and `/api/hero-collections/*`)
   - No authentication required
   - CORS enabled for cross-origin requests
   - Only return published/active content
   - Clean, minimal response payloads

3. **Benefits**
   - ✅ Secure (database not exposed)
   - ✅ Independent development (teams don't block each other)
   - ✅ Simple integration (just HTTP fetch)
   - ✅ Scalable (API can be cached/CDN'd)

---

## 📚 What We've Built

### Completed Content Libraries

#### 1. **Wisdom Library** ✅

- **Table**: `wisdom` (see `sql/15-create-wisdom-table.sql`)
- **CMS Page**: `/cms/wisdom-library`
- **Public API**: `/api/public/wisdom`
- **Documentation**: `PUBLIC-WISDOM-API.md`
- **Fields**: `title`, `musing`, `from_the_box`, `theme`, `category`, `attribution`

#### 2. **Greetings Library** ✅

- **Table**: `greeting` (see `sql/18-create-greetings-table.sql`)
- **CMS Page**: `/cms/greetings-library`
- **Public API**: `/api/public/greetings`
- **Documentation**: `PUBLIC-GREETINGS-API.md`
- **Fields**: `greeting_text`, `tone`, `time_of_day`, `theme`, `attribution`

#### 3. **Hero Collections** ✅

- **Table**: `hero_collections` (see `sql/10-create-hero-collections.sql`)
- **CMS Page**: `/cms/hero-collections`
- **Public API**: `/api/hero-collections/default` and `/api/hero-collections/:id`
- **Documentation**: `PUBLIC-HERO-COLLECTIONS-API.md`
- **Special**: Curated sets of 7 items (2 motivational, 2 stats, 2 wisdom, 1 greeting)

---

## 🎯 Standard Pattern Established

### For Every Content Library, You Need:

#### 1. **Database Table** (`sql/XX-create-{type}-table.sql`)

```sql
CREATE TABLE public.{type} (
  -- Primary Key
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Content-Specific Fields (varies by type)
  [your content fields],

  -- STANDARD FIELDS (same for all tables)
  theme TEXT,
  category TEXT,
  attribution TEXT,
  status TEXT,
  source_content_id BIGINT,
  used_in TEXT[],
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- STANDARD INDEXES (same for all tables)
CREATE INDEX idx_{type}_status ON public.{type}(status);
CREATE INDEX idx_{type}_theme ON public.{type}(theme);
CREATE INDEX idx_{type}_created_at ON public.{type}(created_at DESC);
CREATE INDEX idx_{type}_published_at ON public.{type}(published_at DESC);
```

#### 2. **CMS Page** (`app/cms/{type}-library/page.tsx`)

- List all items
- Create/edit forms
- Search and filter
- Status management (draft → publish → archive)
- Displays: title, content, theme, status, dates

#### 3. **Public API** (`app/api/public/{type}/`)

Three standard endpoints:

- `GET /api/public/{type}/random` - Random published item
- `GET /api/public/{type}/latest?limit=10` - Latest N items
- `GET /api/public/{type}?theme=X&limit=20&offset=0` - Filtered/paginated

**Response format:**

```json
{
  "success": true,
  "data": { ... }, // or [...]
  "count": 10      // for lists
}
```

#### 4. **API Documentation** (`PUBLIC-{TYPE}-API.md`)

- Complete API reference
- Example code (vanilla JS + React)
- TypeScript types
- Error handling examples
- Performance tips
- Troubleshooting guide

#### 5. **Navigation** (update `components/app-shell.tsx`)

```typescript
{
  id: X,
  name: '{Type} Library',
  href: '/cms/{type}-library',
  initial: '🎯', // pick emoji
}
```

---

## 🔄 Recent Changes

### Hero Collections: `name` → `title` (Oct 29, 2025)

**What Changed:**

- Database field: `name` → `title`
- All TypeScript interfaces updated
- All API responses updated (still return `collection_name` for backward compatibility)
- All SQL files updated

**Why:**

- Better semantic clarity
- More conventional naming

**Migration:**

```sql
ALTER TABLE public.hero_collections RENAME COLUMN name TO title;
```

**Files Updated:**

1. `sql/10-create-hero-collections.sql`
2. `app/cms/hero-collections/page.tsx`
3. `app/api/hero-collections/default/route.ts`
4. `app/api/hero-collections/[hour]/route.ts`
5. `sql/11-populate-hero-collections-sample.sql`
6. `HERO-COLLECTIONS-INTEGRATION.md`

---

## 📖 Documentation You Should Read

### For Developers Working on Tango CMS:

1. **`CONTENT-LIBRARY-TABLE-PATTERN.md`** ⭐ START HERE
   - Complete pattern guide
   - Database schema template
   - Standard fields explained
   - Migration checklist

2. **`sql/15-create-wisdom-table.sql`**
   - Reference implementation
   - Shows pattern in action

### For omnipaki.com Developers:

3. **`ONLYHOCKEY-HANDOFF-PACKAGE.md`** ⭐ START HERE
   - Quick start guide
   - What they need to know

4. **`PUBLIC-WISDOM-API.md`**
5. **`PUBLIC-GREETINGS-API.md`**
6. **`PUBLIC-HERO-COLLECTIONS-API.md`**
   - API reference for each content type

### For Integration Help:

7. **`onlyhockey-examples/`**
   - `vanilla-js-example.js` - Plain JavaScript
   - `react-example.tsx` - React/Next.js

---

## 🚀 Next Libraries to Implement

### 1. **Motivational Library** 🔲

**Fields to include:**

```sql
quote TEXT NOT NULL,
author TEXT,
context TEXT,
-- + standard fields
```

**API endpoints:**

- `/api/public/motivational/random`
- `/api/public/motivational/latest?limit=10`
- `/api/public/motivational?theme=dedication`

**Documentation:** `PUBLIC-MOTIVATIONAL-API.md`

---

### 2. **Stats Library** 🔲

**Fields to include:**

```sql
stat_text TEXT NOT NULL,
stat_value TEXT,
stat_category TEXT,  -- 'player', 'team', 'league', 'historical'
year INTEGER,
-- + standard fields
```

**API endpoints:**

- `/api/public/stats/random`
- `/api/public/stats/latest?limit=10`
- `/api/public/stats?category=player&limit=50`

**Documentation:** `PUBLIC-STATS-API.md`

---

## ✅ Implementation Checklist (for next library)

When implementing a new content library, follow this checklist:

### Database

- [ ] Create table SQL: `sql/XX-create-{type}-table.sql`
- [ ] Include all standard fields
- [ ] Create 4 standard indexes
- [ ] Add table/column comments
- [ ] Test SQL runs without errors

### CMS

- [ ] Create CMS page: `app/cms/{type}-library/page.tsx`
- [ ] List view with search/filter
- [ ] Create/edit forms
- [ ] Status management (draft/publish/archive)
- [ ] Add to navigation in `app-shell.tsx`

### Public API

- [ ] Create: `app/api/public/{type}/random/route.ts`
- [ ] Create: `app/api/public/{type}/latest/route.ts`
- [ ] Create: `app/api/public/{type}/route.ts` (filtered/paginated)
- [ ] Return only published items
- [ ] Enable CORS
- [ ] Test all endpoints

### Documentation

- [ ] Create: `PUBLIC-{TYPE}-API.md`
- [ ] Include all 3 endpoints
- [ ] Vanilla JS examples
- [ ] React/Next.js examples
- [ ] TypeScript types
- [ ] Error handling
- [ ] Troubleshooting tips

### Testing

- [ ] Test in browser: `/api/public/{type}/random`
- [ ] Verify CORS works
- [ ] Check error responses
- [ ] Validate response structure

---

## 🎨 Code Style & Conventions

### Database

- **Table names**: lowercase, singular (`wisdom`, not `wisdoms`)
- **Column names**: `snake_case`
- **Timestamps**: Always use `TIMESTAMPTZ`
- **Text fields**: Use `TEXT` (not `VARCHAR`)

### TypeScript

- **File names**: `kebab-case.tsx`
- **Interfaces**: `PascalCase`
- **Functions**: `camelCase`
- **Components**: `PascalCase`

### API Responses

- **Success**: `{ "success": true, "data": {...} }`
- **Error**: `{ "success": false, "error": "message" }`
- **Lists**: Include `"count"` field
- **Field names**: `snake_case` in JSON

---

## 🔧 Common Tasks

### Add New Field to Existing Table

```sql
ALTER TABLE public.wisdom ADD COLUMN new_field TEXT;
```

### Update API to Return New Field

```typescript
// In route.ts
.select('id, title, musing, from_the_box, new_field, theme, attribution')
```

### Rename Field

```sql
ALTER TABLE public.{table} RENAME COLUMN old_name TO new_name;
```

Then update:

1. TypeScript interfaces
2. API route selects
3. CMS page queries
4. Documentation

---

## 🐛 Troubleshooting

### API Returns Empty

**Check:** Items are `status = 'published'` in database

### CORS Error

**Check:** API route has CORS headers enabled

```typescript
export const dynamic = "force-dynamic";
```

### Type Error in CMS

**Check:** TypeScript interface matches database fields

---

## 📞 Questions?

For architectural decisions or patterns:

1. Check `CONTENT-LIBRARY-TABLE-PATTERN.md`
2. Reference `sql/15-create-wisdom-table.sql`
3. Look at existing API implementations

For omnipaki.com integration:

1. Read `PUBLIC-{TYPE}-API.md` documentation
2. Check `onlyhockey-examples/` code samples

---

## 🎉 Key Takeaways

1. **Follow the Pattern** - Use wisdom/greetings as reference
2. **Standard Fields** - Always include the standard 11 fields
3. **Public APIs** - Create 3 endpoints (random, latest, filtered)
4. **Document Everything** - Create PUBLIC-{TYPE}-API.md for each type
5. **Test Thoroughly** - Verify APIs work from browser before declaring done

---

**Remember:** The pattern is proven and working. Don't reinvent the wheel—follow the established pattern for consistency! ✨
