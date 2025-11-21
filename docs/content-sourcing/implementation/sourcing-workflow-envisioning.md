# Sourcing Ingestion Workflow - System Envisioning

## Current State Analysis

### The Four Pages

1. **Sourcing (`/cms/sourcing`)**
   - Raw content input (paste/type)
   - Text processing (normalize, clean, format)
   - Save to `content_source` table
   - **Current Flow**: Input → Process → Save (single-step)

2. **Source Library (`/cms/library`)**
   - Browse/search ingested content
   - View content details
   - Select content to use as source
   - **Current Flow**: Browse → Select → Use (passive library)

3. **Prompt Creation (`/cms/prompts/create`)**
   - Create prompts with content type
   - Save to `prompts` table
   - **Current Flow**: Input → Save (single-step)

4. **Prompts Library (`/cms/prompts-library`)**
   - Browse/search prompts
   - View prompt details
   - Select prompt to use
   - **Current Flow**: Browse → Select → Use (passive library)

### Current Problems

1. **No Metadata Capture**: Source content saved without theme, tags, category
2. **Disconnected Workflows**: Each page operates independently
3. **No Process Tracking**: No visibility into ingestion quality or completeness
4. **Manual Metadata Assignment**: Theme/tags only added later (if at all)
5. **No Validation**: Content saved without quality checks or structure validation

## Modular Architecture - Detachable System

### Core Principle: Separation & Modularity

The new sourcing workflow system is designed as a **completely separate, detachable module** - similar to the process builder structure. It can be added or removed without affecting the existing system.

### Architecture Boundaries

```
Existing System (Untouched)
├── /cms/sourcing (existing page - remains as-is)
├── /cms/library (existing page - remains as-is)
├── /cms/prompts/create (existing page - remains as-is)
└── /cms/prompts-library (existing page - remains as-is)

New Modular System (Detachable)
└── process-builders/ingest-source-content/
    ├── Completely separate workflow
    ├── Can be removed without breaking existing pages
    └── Optional integration points only
```

### Separation Strategy

1. **Separate Directory Structure**
   - New workflow lives in `process-builders/ingest-source-content/`
   - Completely isolated from existing sourcing pages
   - No dependencies on existing sourcing code

2. **Optional Integration**
   - Existing `/cms/sourcing` page remains unchanged
   - New workflow can be accessed via separate route (e.g., `/cms/process-builders/ingest-source-content`)
   - Or optionally integrated into existing page (but not required)

3. **Database Isolation**
   - New table: `ai_extraction_prompts` (can be dropped if removing)
   - Enhanced `content_source` table columns (nullable, backward compatible)
   - Existing data remains untouched

4. **No Breaking Changes**
   - Existing sourcing flow continues to work
   - Existing library pages continue to work
   - Existing prompts pages continue to work
   - New system is additive only

### Modular Components

```
process-builders/
├── core/                          # Shared (already exists)
│   ├── executor.ts
│   ├── types.ts
│   └── validation.ts
└── ingest-source-content/         # NEW - Completely detachable
    ├── lib/
    │   ├── actions.ts
    │   ├── ingest-source-content.ts
    │   └── tasks/
    │       ├── validate-input.ts
    │       ├── process-content.ts
    │       ├── extract-metadata.ts
    │       ├── enrich-content.ts
    │       ├── validate-completeness.ts
    │       └── create-record.ts
    └── config.json
```

### Removal Strategy

If the new system needs to be removed:

1. Delete `process-builders/ingest-source-content/` directory
2. Drop `ai_extraction_prompts` table (optional)
3. Remove new columns from `content_source` (optional - they're nullable)
4. Existing system continues to function normally

### Integration Points (Optional)

If integrating with existing pages:

- **Option A**: Keep completely separate
  - New route: `/cms/process-builders/ingest-source-content`
  - Existing pages unchanged
- **Option B**: Add as alternative workflow
  - Existing `/cms/sourcing` page adds "Use Workflow" button
  - Routes to new workflow
  - Existing flow still available

### Benefits of Modular Approach

1. **Zero Risk**: Existing system unaffected
2. **Easy Testing**: Can test new system independently
3. **Easy Removal**: Delete directory, system still works
4. **Clear Boundaries**: Know exactly what's new vs. existing
5. **Incremental Adoption**: Can adopt gradually or not at all

### Workflow Structure

```
Process: "Ingest Source Content"
├── Task 1: Validate Input (JavaScript/TypeScript)
│   ├── Check content length
│   ├── Validate format
│   └── Basic structure checks
├── Task 2: Process Content (JavaScript/TypeScript)
│   ├── Normalize text (existing processText logic)
│   ├── Clean formatting
│   └── Structure content
├── Task 3: Extract Metadata (AI-Powered)
│   ├── Extract theme/topic (AI)
│   ├── Extract tags/keywords (AI - rich fabric)
│   ├── Detect category (AI)
│   └── Generate summary (AI)
├── Task 4: Enrich Content (AI-Powered)
│   ├── Generate title (AI)
│   ├── Extract key phrases (AI)
│   ├── Generate summary (if not done in Task 3)
│   └── Calculate statistics (JavaScript)
├── Task 5: Validate Completeness (JavaScript/TypeScript)
│   ├── Check metadata presence
│   ├── Validate metadata format
│   └── Ensure required fields exist
└── Task 6: Create Record
    ├── Save to database with metadata
    ├── Link relationships
    └── Return result
```

### Process Builder Pattern (Like Trivia Sets)

```typescript
// Similar to build-trivia-set pattern
export async function ingestSourceContentAction(
  goal: ProcessBuilderGoal, // "Ingest this content about Winnipeg Jets"
  rules: ProcessBuilderRules, // { theme: "Winnipeg Jets", category: "hockey" }
  options?: ProcessBuilderOptions, // { autoExtractMetadata: true }
);
```

### Key Differences from Current System

| Current             | Envisioned                        |
| ------------------- | --------------------------------- |
| Single-step save    | Multi-task workflow               |
| No metadata capture | Metadata extraction/enrichment    |
| Manual processing   | Automated validation & enrichment |
| No quality checks   | Quality scoring & validation      |
| No process tracking | Full execution log                |
| Disconnected pages  | Integrated workflow               |

## Proposed Architecture

### 1. Process Builder Structure

```
process-builders/
├── core/                    # Shared workflow engine (already exists)
│   ├── executor.ts          # Task execution engine
│   ├── types.ts             # Process builder types
│   └── validation.ts        # Validation utilities
└── ingest-source-content/   # NEW - Completely detachable module
    ├── lib/
    │   ├── actions.ts       # Server action entry point
    │   ├── ingest-source-content.ts  # Main workflow function
    │   └── tasks/
    │       ├── validate-input.ts
    │       ├── process-content.ts
    │       ├── extract-metadata.ts      # Uses prompts from database
    │       ├── enrich-content.ts        # Uses prompts from database
    │       ├── validate-completeness.ts
    │       └── create-record.ts
    └── config.json          # Workflow configuration

Note: This entire directory can be deleted without affecting existing system
```

### 2. Enhanced Database Schema

```sql
-- Enhanced content_source table
ALTER TABLE content_source ADD COLUMN IF NOT EXISTS:
  theme TEXT,                    -- AI-extracted primary theme
  tags TEXT[],                   -- AI-extracted rich tag fabric
  category TEXT,                 -- AI-detected category
  summary TEXT,                  -- AI-generated summary
  title TEXT,                    -- AI-generated title (if not provided)
  key_phrases TEXT[],            -- AI-extracted key phrases
  metadata JSONB,                -- Additional AI-generated metadata
  ingestion_process_id TEXT,     -- Link to process execution
  ingestion_status TEXT;         -- 'draft', 'validated', 'enriched', 'complete'

-- New table: AI extraction prompts (user-provided, stored in database)
CREATE TABLE IF NOT EXISTS ai_extraction_prompts (
  id BIGSERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL,     -- 'metadata_extraction', 'content_enrichment'
  prompt_content TEXT NOT NULL,  -- The actual prompt text
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for active prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active
  ON ai_extraction_prompts(is_active, prompt_type)
  WHERE is_active = true;
```

### 3. Workflow Tasks Breakdown

#### Task 1: Validate Input (JavaScript/TypeScript)

- **Purpose**: Ensure content meets minimum requirements
- **Implementation**: Pure JavaScript/TypeScript validation
- **Checks**:
  - Content length (min/max)
  - Character encoding validation
  - Basic format validation
  - Non-empty content check
- **Output**: Validation result + content stats

#### Task 2: Process Content (JavaScript/TypeScript)

- **Purpose**: Normalize and clean content
- **Implementation**: Use existing `processText` logic (JavaScript)
- **Steps**:
  - Text normalization (line endings, quotes, spacing)
  - Format cleanup (remove decorators, unicode)
  - Structure detection
- **Output**: Processed content ready for AI analysis

#### Task 3: Extract Metadata (AI-Powered) ⭐

- **Purpose**: Create rich fabric of tags and themes via AI
- **Implementation**: AI-powered extraction (Gemini API)
- **Prompt Source**: User-provided prompts stored in `ai_extraction_prompts` table
- **AI Tasks**:
  - **Extract theme/topic**: Primary subject matter (using prompt from database)
  - **Extract tags**: Rich array of relevant keywords/tags (using prompt from database)
  - **Detect category**: Content category classification (using prompt from database)
  - **Generate summary**: Brief content summary (using prompt from database)
- **Prompt Management**:
  - Prompts stored in database (not hardcoded)
  - User can create/edit prompts via UI
  - Active prompts retrieved for each extraction
- **Why AI**: Creates comprehensive, contextual metadata that manual tagging can't match
- **Output**: Rich metadata object (theme, tags[], category, summary)

#### Task 4: Enrich Content (AI-Powered) ⭐

- **Purpose**: Add AI-generated enhancements automatically
- **Implementation**: AI-powered enrichment (Gemini API)
- **Prompt Source**: User-provided prompts stored in `ai_extraction_prompts` table
- **AI Tasks**:
  - **Generate title**: Smart title from content (using prompt from database)
  - **Extract key phrases**: Important phrases/concepts (using prompt from database)
  - **Generate summary**: If not done in Task 3 (using prompt from database)
- **JavaScript Tasks**:
  - Calculate reading time
  - Calculate word/character counts
- **Prompt Management**:
  - Enrichment prompts stored in database
  - User can create/edit prompts via UI
  - Active prompts retrieved for each enrichment
- **Why AI**: Avoids manual, time-consuming enrichment work
- **Output**: Enriched content + AI-generated metadata

#### Task 5: Validate Completeness (JavaScript/TypeScript)

- **Purpose**: Ensure all metadata is present and valid
- **Implementation**: Pure JavaScript/TypeScript validation
- **Checks**:
  - Metadata completeness (theme, tags, category present)
  - Metadata format validation (tags is array, theme is string)
  - Required fields exist
  - No invalid values
- **Note**: Only checks completeness/validity - content quality assessment requires human review
- **Output**: Validation status + any missing fields

#### Task 6: Create Record

- **Purpose**: Save to database with all metadata
- **Steps**:
  - Insert into `content_source` with all metadata
  - Link related records (if applicable)
  - Return created record
- **Output**: Database record with rich metadata

### 4. UI Integration

#### Option A: Separate Route (Recommended for Modularity)

- **New Route**: `/cms/process-builders/ingest-source-content`
- **Completely separate** from existing `/cms/sourcing` page
- Existing sourcing page remains unchanged
- Can be removed without affecting existing pages

#### Option B: Optional Integration (If Desired)

- Add "Use Workflow" button to existing `/cms/sourcing` page
- Routes to new workflow
- Existing flow still available as fallback

#### Updated Sourcing Page (`/cms/sourcing`) - Only if Option B

- **Form Fields**:
  - Content input (existing)
  - **AI Extraction Toggle** (default: ON)
- **Workflow Execution**:
  - Submit triggers workflow
  - Show progress (like trivia sets)
  - Display AI extraction progress
  - Display execution log
  - Show final result with AI-generated metadata
- **Post-Processing Review**:
  - **Manual Editing Interface** (required now, optional later):
    - Review AI-extracted theme (editable)
    - Review AI-extracted tags (add/remove/edit)
    - Review AI-detected category (editable)
    - Review AI-generated title (editable)
    - Review AI-generated summary (editable)
  - Edit metadata before final save
  - Confirm and save with all metadata
- **Future**: Can be automated (skip manual review step)

#### Enhanced Source Library (`/cms/library`)

- **Filter by Metadata**:
  - Filter by theme (AI-extracted)
  - Filter by tags (AI-extracted rich fabric)
  - Filter by category (AI-detected)
- **Metadata Display**:
  - Show theme/tags/category in list
  - Show AI-generated summary preview
  - Metadata completeness indicator
  - Tags displayed as badges (rich fabric visible)

## Benefits of Workflow Approach

### 1. **Consistency**

- Same pattern as trivia sets
- Predictable execution flow
- Standardized error handling

### 2. **Rich Metadata Fabric**

- AI-powered theme/tags extraction creates rich, contextual metadata
- Automatic metadata extraction (no manual work)
- Comprehensive tag fabric for reliable downstream matching

### 3. **Process Visibility**

- Execution logs
- Task-by-task progress
- Error tracking

### 4. **Extensibility**

- Easy to add new tasks
- Reusable components
- Configurable workflows

### 5. **Automated Enrichment**

- AI handles time-consuming enrichment tasks
- No manual metadata tagging required
- Completeness validation ensures all fields present

## Implementation Phases

### Phase 0: Modular Setup (Critical)

1. Create `process-builders/ingest-source-content/` directory structure
2. Ensure complete separation from existing sourcing pages
3. Create separate route (don't modify existing pages)
4. Verify existing system still works

### Phase 1: Foundation

1. Create process builder structure
2. Implement basic workflow (3-4 tasks)
3. Add metadata fields to database
4. Update sourcing page to use workflow

### Phase 2: AI Metadata Extraction

1. Implement AI-powered metadata extraction task
2. Integrate Gemini API for theme/tags/category extraction
3. Create prompt templates for metadata extraction
4. Add user override fields (pre-filled by AI)
5. Test with various content types

### Phase 3: AI Content Enrichment

1. Implement AI-powered enrichment task
2. Generate titles, summaries, key phrases
3. Add enrichment results to database
4. Display AI-generated metadata in UI

### Phase 4: Integration

1. Link to prompt creation workflow
2. Link to question generation
3. Propagate metadata through lifecycle
4. Update Process Builder to use source metadata

## Comparison: Current vs. Envisioned

### Current Flow

```
User → Paste Content → Process → Save → Done
```

### Envisioned Flow

```
User → Paste Content →
  [Workflow Execution]
    → Validate (JS) → Process (JS) → Extract Metadata (AI) → Enrich (AI) → Validate Completeness (JS) → Save →
  [Result with Rich Metadata Fabric]
    → Review AI-generated metadata → Edit if needed → Confirm →
  [View in Library with Tags/Theme]
    → Use in Generation → Inherit Metadata → Reliable Matching
```

## Key Decisions Made

1. **Modularity**: ✅ **Completely Separate & Detachable**
   - New system lives in `process-builders/ingest-source-content/`
   - Can be removed without affecting existing system
   - Similar to process builder structure
   - Optional integration points only
   - Existing sourcing pages remain untouched

2. **Metadata Extraction**: ✅ **AI-Powered**
   - AI extracts theme, tags, category automatically
   - Creates rich fabric of tags for reliable downstream matching
   - User can override/edit AI suggestions

3. **Enrichment**: ✅ **AI-Powered**
   - AI generates title, summary, key phrases automatically
   - Avoids time-consuming manual enrichment
   - JavaScript handles statistics/calculations

4. **Normalization & Validation**: ✅ **JavaScript/TypeScript**
   - Text processing done in JavaScript (existing `processText`)
   - Validation checks done in TypeScript
   - No AI needed for these deterministic tasks

5. **Quality Validation**: ✅ **Completeness Only**
   - Checks that metadata is present and valid
   - Does NOT assess content quality (requires human review)
   - Format validation (tags is array, theme is string, etc.)

6. **Required vs. Optional**:
   - **Recommendation**: Theme required, tags/category optional (but AI will always extract)

7. **Backward Compatibility**:
   - Add metadata fields as nullable
   - Can backfill existing content with AI extraction later

## Next Steps

1. **Design Database Schema**:
   - Add metadata fields to `content_source` table
   - Create `ai_extraction_prompts` table for user-provided prompts
2. **Create Prompt Management UI**:
   - Interface for creating/editing AI prompts
   - Store prompts in database (not hardcoded)
3. **Design AI Prompt Structure**:
   - Define prompt types (metadata_extraction, content_enrichment)
   - Create initial prompt templates
4. **Create Process Builder**: Workflow structure with AI tasks
5. **Implement Tasks**:
   - Start with JS validation/processing tasks
   - Then add AI extraction/enrichment tasks (using prompts from database)
6. **Update UI**:
   - Integrate workflow into sourcing page with AI progress display
   - Add manual editing interface for AI-generated metadata
7. **Test & Iterate**: Validate with real content, refine AI prompts

## Conclusion

Treating sourcing ingestion as a workflow process with AI-powered metadata extraction provides:

- **Rich metadata fabric** via AI (theme, tags, category) for reliable downstream matching
- **Automated enrichment** (no manual, time-consuming work)
- **Consistent patterns** across the system (same as trivia sets)
- **Process visibility** for debugging and tracking
- **Extensibility** for future enhancements

**Key Innovation**: AI creates a rich fabric of tags and themes at ingestion time, solving the metadata inconsistency problem identified in the content lifecycle analysis. This metadata then flows through the entire content lifecycle, enabling reliable theme matching in Process Builder and other downstream processes.

## Implementation Details

### AI Prompt Storage

- **Location**: Database table `ai_extraction_prompts`
- **Types**:
  - `metadata_extraction` - For theme, tags, category extraction
  - `content_enrichment` - For title, summary, key phrases generation
- **Management**: User-provided prompts via UI (not hardcoded)
- **Retrieval**: Active prompts fetched from database for each workflow execution

### Manual Editing Workflow

- **Current**: Manual review and editing required before save
- **Future**: Can be automated (skip manual review step)
- **Editing Interface**:
  - Review AI-extracted metadata
  - Edit theme, tags, category, title, summary
  - Add/remove tags manually
  - Confirm and save

### Quality Validation

- **Scope**: Completeness checks only
- **Checks**:
  - Metadata presence (theme, tags, category exist)
  - Format validation (correct data types)
  - Required fields present
- **Does NOT**: Assess content quality (requires human review)

### Modularity & Detachability

- **Complete Separation**: New system is completely separate from existing sourcing pages
- **No Dependencies**: Existing pages don't depend on new system
- **Easy Removal**: Delete `process-builders/ingest-source-content/` directory to remove
- **Backward Compatible**: All database changes are additive (nullable columns)
- **Optional Integration**: Can integrate with existing pages, but not required
