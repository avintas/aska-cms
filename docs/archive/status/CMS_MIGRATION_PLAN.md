# Aska CMS Migration Plan

**Date:** November 11, 2025  
**Source:** Legacy Tango CMS  
**Target:** Aska CMS (Modern Next.js 15 + TypeScript + Supabase)

---

## Executive Summary

### What We're Migrating

A complete hockey content management system with:
- **7 Content Types** (Trivia, Stats, Greetings, Wisdom, Motivational, Hero Collections)
- **AI Content Generation** (Gemini integration)
- **Process Builders** (Automated workflows for trivia set creation)
- **Content Sourcing** (AI-powered metadata extraction)
- **Public APIs** (For external consumption)

### Current State Analysis

**Database:** ✅ Already exists in Supabase (17 tables identified)  
**Legacy Code:** ✅ Well-documented with clear patterns  
**Architecture:** ✅ Solid foundation with process builders and modular design

---

## Database Analysis

### Existing Tables (From Screenshot)

#### Content Collections
1. `collection_greetings` - Hockey greetings (HUG system)
2. `collection_motivational` - Motivational quotes
3. `collection_stats` - Hockey statistics
4. `collection_wisdom` - Penalty Box Philosopher content

#### Trivia Questions
5. `trivia_multiple_choice` - Multiple choice questions
6. `trivia_true_false` - True/false questions
7. `trivia_who_am_i` - "Who Am I" questions

#### Trivia Sets (Process Builder Output)
8. `sets_trivia_multiple_choice` - MC trivia sets
9. `sets_trivia_true_false` - TF trivia sets
10. `sets_trivia_who_am_i` - Who Am I trivia sets
11. `trivia_sets_recipes` - Recipe templates for building sets

#### Content Sourcing & AI
12. `source_content_ingested` - Source content with AI metadata
13. `ai_extraction_prompts` - User-defined AI prompts
14. `prompts` - Additional prompts table
15. `ingested` - Legacy ingested content

#### Other
16. `hero_collections` - Curated 7-item collections (not visible in screenshot but documented)

---

## System Architecture Overview

### 1. Content Libraries (Collections)

**Pattern:** Each content type has:
- Database table with standard fields
- CMS management page
- Public API endpoints (random, latest, filtered)
- AI generation capability

**Content Types:**
- **Greetings** (`collection_greetings`) - Hockey Universal Greetings
- **Stats** (`collection_stats`) - Hockey statistics
- **Wisdom** (`collection_wisdom`) - Philosophical musings
- **Motivational** (`collection_motivational`) - Motivational quotes

**Standard Fields (All Collections):**
```typescript
{
  id: number;
  // Content-specific fields vary
  theme: string;
  category: string;
  attribution: string;
  status: 'draft' | 'published' | 'archived';
  source_content_id?: number;
  used_in: string[];
  display_order?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}
```

### 2. Trivia System

**Question Tables:**
- `trivia_multiple_choice` - MC questions with 4 options
- `trivia_true_false` - True/false questions
- `trivia_who_am_i` - Identity guessing questions

**Set Tables:**
- `sets_trivia_multiple_choice` - Curated MC sets
- `sets_trivia_true_false` - Curated TF sets
- `sets_trivia_who_am_i` - Curated Who Am I sets

**Recipe System:**
- `trivia_sets_recipes` - Reusable templates for building sets
- Category-bound selection (lighthouse pattern)
- Cooldown system to avoid repetition
- Auto/manual execution modes

### 3. Process Builders

**Architecture:** Modular, plug-and-play workflow system

**Structure:**
```
process-builders/
├── core/              # Generic system (executor, validation, monitoring)
├── shared/            # Utilities used by 3+ builders
└── build-trivia-set/  # Isolated module for trivia set creation
    ├── lib/
    │   ├── tasks/     # 6 tasks: query, select, generate, assemble, create, validate
    │   ├── types/     # Builder-specific types
    │   └── helpers/   # Builder-specific utilities
    └── components/    # UI components
```

**Key Features:**
- Auto-discovery (no manual registration)
- Complete isolation (delete folder = remove everything)
- Strict shared/ rules (only 3+ builders)
- Type-safe execution

### 4. Content Sourcing Workflow

**Tables:**
- `source_content_ingested` - AI-processed source content
- `ai_extraction_prompts` - User-defined prompts for AI

**Workflow:**
1. User pastes source content
2. AI extracts metadata (theme, tags, category, summary, title)
3. Content stored with rich metadata
4. Used as source for generating trivia/collections

**AI Metadata:**
- Theme (required, standardized)
- Tags (rich tag fabric)
- Category (theme-specific)
- Summary, Title, Key Phrases
- JSONB metadata (flexible)

### 5. Gemini AI Integration

**Module:** Centralized Gemini client

**Generators:**
- `multiple-choice.ts` - Generate MC trivia
- `true-false.ts` - Generate TF trivia
- `who-am-i.ts` - Generate Who Am I trivia
- `stats.ts` - Generate stats content
- `motivational.ts` - Generate motivational quotes
- `greetings.ts` - Generate greetings
- `wisdom.ts` - Generate wisdom content

**Pattern:**
```typescript
export async function generateContent(request: Request): Promise<Response> {
  // 1. Validate input
  // 2. Call Gemini API with prompt
  // 3. Parse JSON response
  // 4. Normalize data
  // 5. Return typed result
}
```

### 6. Public APIs

**Purpose:** Read-only endpoints for external sites (onlyhockey.com)

**Pattern:**
- `/api/public/{type}` - Filtered/paginated list
- `/api/public/{type}/random` - Random item
- `/api/public/{type}/latest` - Latest items

**Features:**
- CORS enabled
- Only published content
- Pagination (limit/offset)
- Filtering (theme, category, etc.)

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

**Goal:** Set up shared infrastructure

#### 1.1 Database Types Generation
- Generate TypeScript types from Supabase schema
- Create shared types package
- Organize by domain (trivia, collections, sourcing)

#### 1.2 Shared Utilities
- Supabase client utilities (already done ✅)
- Error handling
- API response helpers
- Validation utilities

#### 1.3 CMS Layout & Navigation
- Update Header with proper navigation
- Create sidebar/menu structure
- Add dashboard sections

**Deliverables:**
- `packages/shared/src/types/database.ts` - Generated types
- `packages/shared/src/utils/supabase.ts` - Supabase helpers
- `apps/cms/src/components/layout/Sidebar.tsx` - Navigation
- `apps/cms/src/app/dashboard/page.tsx` - Dashboard with sections

---

### Phase 2: Content Libraries (Week 2-3)

**Goal:** Implement all 4 collection types

**Order:** Wisdom → Greetings → Stats → Motivational

#### 2.1 Wisdom Library
**Table:** `collection_wisdom`

**Fields:**
- `title` - Title of the wisdom
- `musing` - Main content
- `from_the_box` - Subtitle/tagline
- `theme`, `category`, `attribution`
- Standard fields

**Pages:**
- `/cms/wisdom` - List/manage wisdom
- `/cms/wisdom/create` - Create new
- `/cms/wisdom/[id]` - Edit existing

**API:**
- `/api/wisdom` - CRUD operations (internal)
- `/api/public/wisdom` - Public read-only

**AI Generation:**
- Integrate Gemini wisdom generator
- Custom prompt support

#### 2.2 Greetings Library
**Table:** `collection_greetings`

**Fields:**
- `greeting_text` - The greeting
- `tone` - Tone of greeting
- `time_of_day` - Morning/afternoon/evening
- `theme`, `attribution`
- Standard fields

**Implementation:** Same pattern as Wisdom

#### 2.3 Stats Library
**Table:** `collection_stats`

**Fields:**
- `stat_text` - The statistic
- `stat_value` - Numeric value
- `stat_category` - player/team/league/historical
- `year` - Year of stat
- `theme`, `attribution`
- Standard fields

**Implementation:** Same pattern as Wisdom

#### 2.4 Motivational Library
**Table:** `collection_motivational`

**Fields:**
- `quote` - The motivational quote
- `author` - Quote author
- `context` - Additional context
- `theme`, `attribution`
- Standard fields

**Implementation:** Same pattern as Wisdom

**Deliverables (Per Library):**
- List page with search/filter
- Create/edit forms
- Status management (draft/publish/archive)
- AI generation integration
- Public API endpoints
- TypeScript types

---

### Phase 3: Trivia System (Week 4-5)

**Goal:** Implement trivia question management

#### 3.1 Multiple Choice Trivia
**Table:** `trivia_multiple_choice`

**Fields:**
- `question_text` - The question
- `correct_answer` - Correct answer
- `wrong_answers` - Array of wrong answers
- `explanation` - Answer explanation
- `difficulty` - Easy/Medium/Hard
- `category`, `theme`
- Standard fields

**Pages:**
- `/cms/trivia/multiple-choice` - List/manage
- `/cms/trivia/multiple-choice/create` - Create
- `/cms/trivia/multiple-choice/[id]` - Edit

**AI Generation:**
- Integrate Gemini MC generator
- Batch generation support

#### 3.2 True/False Trivia
**Table:** `trivia_true_false`

**Fields:**
- `question_text` - The question
- `correct_answer` - true/false
- `explanation` - Answer explanation
- `difficulty`, `category`, `theme`
- Standard fields

**Implementation:** Same pattern as MC

#### 3.3 Who Am I Trivia
**Table:** `trivia_who_am_i`

**Fields:**
- `question_text` - Identity clues
- `correct_answer` - The person
- `explanation` - Additional info
- `difficulty`, `category`, `theme`
- Standard fields

**Implementation:** Same pattern as MC

**Deliverables (Per Type):**
- List page with filters
- Create/edit forms
- Bulk import
- AI generation
- Preview mode
- Public API endpoints

---

### Phase 4: Process Builders (Week 6-7)

**Goal:** Implement trivia set building system

#### 4.1 Process Builder Core
**Location:** `apps/cms/src/process-builders/`

**Components:**
- `core/` - Generic execution engine
- `shared/` - Shared utilities
- Registry system (auto-discovery)
- Monitoring & logging

#### 4.2 Build Trivia Set Process
**Location:** `apps/cms/src/process-builders/build-trivia-set/`

**Tasks:**
1. Query questions from database
2. Select balanced distribution
3. Generate metadata (title, description)
4. Assemble question data
5. Create trivia set record
6. Validate and finalize

**UI:**
- Recipe selector
- Parameter configuration
- Progress tracking
- Result preview

#### 4.3 Recipe System
**Table:** `trivia_sets_recipes`

**Features:**
- Category-bound selection
- Question type mix
- Cooldown system
- Auto/manual modes

**Pages:**
- `/cms/recipes` - Manage recipes
- `/cms/recipes/create` - Create recipe
- `/cms/recipes/[id]` - Edit recipe
- `/cms/recipes/[id]/execute` - Run recipe

**Deliverables:**
- Process builder framework
- Build trivia set implementation
- Recipe management UI
- Execution monitoring
- Result preview

---

### Phase 5: Content Sourcing (Week 8)

**Goal:** AI-powered content ingestion

#### 5.1 Source Content Management
**Table:** `source_content_ingested`

**Workflow:**
1. User pastes content
2. AI extracts metadata
3. Content saved with metadata
4. Available for content generation

**Pages:**
- `/cms/sourcing` - View source content
- `/cms/sourcing/ingest` - Add new content
- `/cms/sourcing/[id]` - View/edit content

#### 5.2 AI Prompts Management
**Table:** `ai_extraction_prompts`

**Features:**
- User-defined prompts
- Prompt types (extraction, enrichment)
- Active/inactive toggle
- Version history

**Pages:**
- `/cms/prompts` - Manage prompts
- `/cms/prompts/create` - Create prompt
- `/cms/prompts/[id]` - Edit prompt

**Deliverables:**
- Content ingestion UI
- AI metadata extraction
- Prompt management
- Source content library

---

### Phase 6: Public APIs (Week 9)

**Goal:** External consumption endpoints

#### 6.1 API Routes
**Pattern:** `/api/public/{type}/`

**Endpoints (Per Content Type):**
- `GET /api/public/{type}` - List with filters
- `GET /api/public/{type}/random` - Random item
- `GET /api/public/{type}/latest` - Latest items

**Features:**
- CORS enabled
- Published content only
- Pagination
- Filtering
- Rate limiting (future)

#### 6.2 API Documentation
**Create:** `docs/API_REFERENCE.md`

**Include:**
- Endpoint descriptions
- Request/response examples
- TypeScript types
- Error handling
- Code samples (JS, React)

**Deliverables:**
- All public API endpoints
- CORS configuration
- API documentation
- Example code

---

### Phase 7: Polish & Testing (Week 10)

**Goal:** Production-ready system

#### 7.1 UI/UX Polish
- Consistent styling
- Loading states
- Error messages
- Success notifications
- Keyboard shortcuts
- Accessibility

#### 7.2 Testing
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
- Performance testing

#### 7.3 Documentation
- User guide
- Developer guide
- Deployment guide
- Troubleshooting guide

**Deliverables:**
- Polished UI
- Comprehensive tests
- Complete documentation
- Deployment scripts

---

## Technical Decisions

### 1. TypeScript Types

**Strategy:** Generate from Supabase, organize by domain

```
packages/shared/src/types/
├── database.ts          # Generated from Supabase
├── collections.ts       # Collection types
├── trivia.ts            # Trivia types
├── sourcing.ts          # Sourcing types
├── process-builders.ts  # Process builder types
└── api.ts               # API response types
```

### 2. Component Organization

```
apps/cms/src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── dashboard/
│   ├── wisdom/
│   ├── greetings/
│   ├── stats/
│   ├── motivational/
│   ├── trivia/
│   │   ├── multiple-choice/
│   │   ├── true-false/
│   │   └── who-am-i/
│   ├── recipes/
│   ├── sourcing/
│   ├── prompts/
│   └── api/
│       ├── wisdom/
│       ├── greetings/
│       └── public/
│           ├── wisdom/
│           └── greetings/
└── components/
    ├── layout/
    ├── collections/     # Shared collection components
    ├── trivia/          # Shared trivia components
    └── process-builders/
```

### 3. State Management

**Approach:** Server Components + Server Actions (no client state library)

**Pattern:**
- Server Components for data fetching
- Server Actions for mutations
- React 19 `useOptimistic` for optimistic updates
- URL state for filters/pagination

### 4. Gemini Integration

**Location:** `packages/shared/src/lib/gemini/`

**Pattern:**
- Centralized client
- Generator functions per content type
- Error handling
- Rate limiting
- Retry logic

### 5. Process Builders

**Location:** `apps/cms/src/process-builders/`

**Architecture:**
- Auto-discovery (no manual registration)
- Isolated modules
- Shared utilities (3+ builders only)
- Type-safe execution

---

## Migration Checklist

### Week 1: Foundation
- [ ] Generate database types from Supabase
- [ ] Create shared utilities package
- [ ] Update CMS layout with navigation
- [ ] Create dashboard structure

### Week 2-3: Content Libraries
- [ ] Wisdom library (list, create, edit, AI generation)
- [ ] Greetings library
- [ ] Stats library
- [ ] Motivational library
- [ ] Public APIs for all collections

### Week 4-5: Trivia System
- [ ] Multiple choice trivia management
- [ ] True/false trivia management
- [ ] Who Am I trivia management
- [ ] AI generation for all types
- [ ] Public APIs for trivia

### Week 6-7: Process Builders
- [ ] Process builder core framework
- [ ] Build trivia set process
- [ ] Recipe management system
- [ ] Execution monitoring
- [ ] Result preview

### Week 8: Content Sourcing
- [ ] Source content ingestion
- [ ] AI metadata extraction
- [ ] Prompt management
- [ ] Source content library

### Week 9: Public APIs
- [ ] All public API endpoints
- [ ] CORS configuration
- [ ] API documentation
- [ ] Example code

### Week 10: Polish & Testing
- [ ] UI/UX polish
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Deployment preparation

---

## Key Principles

### 1. Follow the Pattern
The legacy system has proven patterns. Don't reinvent - adapt and improve.

### 2. Type Safety First
Everything must be properly typed. No `any` types.

### 3. Server Components by Default
Use Server Components unless client interactivity is needed.

### 4. Modular & Detachable
Each feature should be removable without affecting others.

### 5. Document as You Go
Create documentation alongside implementation.

---

## Questions for User

1. **Priority Order:** Do you want to follow the suggested order (Collections → Trivia → Process Builders → Sourcing)?
2. **Existing Data:** Should we migrate existing data or start fresh?
3. **Features:** Are there any features you want to skip or add?
4. **Timeline:** Is the 10-week timeline acceptable, or do you need faster/slower?
5. **Testing:** Do you want comprehensive tests or focus on core functionality first?

---

## Next Steps

**Immediate:**
1. User reviews this plan
2. User approves/adjusts priorities
3. We start with Phase 1 (Foundation)

**First Implementation:**
- Generate database types
- Create shared utilities
- Build dashboard structure
- Implement first content library (Wisdom)

---

**Ready to proceed?** Let me know your thoughts on this plan!

