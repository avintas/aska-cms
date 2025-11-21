# Dynamic Question Pool Model - Implementation Plan

## Overview

Transition from static, pre-built trivia sets to a dynamic, on-demand question selection system that provides personalized gaming experiences through intelligent question selection from a large pool.

## Goals

- **On-demand selection**: Questions selected in real-time for user sessions
- **Intelligent algorithm**: Usage tracking, weighting, and cooldown prevent repetition
- **Campaign support**: Organize questions by themes/campaigns
- **Session management**: Time-based periods (1-5 minutes, multi-period games)
- **Scalability**: Support 1,000+ question pool with continuous growth

---

## Phase 1: Database Schema Updates

### 1.1 Add Usage Tracking to Questions

**File**: `sql/migrations/add-question-usage-tracking.sql`

```sql
-- Add usage tracking fields to trivia_multiple_choice
ALTER TABLE trivia_multiple_choice
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS campaign_usage_count JSONB DEFAULT '{}'::jsonb;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trivia_multiple_choice_usage_count 
ON trivia_multiple_choice(usage_count);

CREATE INDEX IF NOT EXISTS idx_trivia_multiple_choice_last_used 
ON trivia_multiple_choice(last_used_at);
```

**Purpose**: Track how often and when questions are used

### 1.2 Create Campaigns Table

**File**: `sql/migrations/create-campaigns-table.sql`

```sql
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  sequence_order INTEGER,
  release_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_code ON campaigns(code);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_release_date ON campaigns(release_date);

-- Auto-generate code function (numeric, sequential)
CREATE OR REPLACE FUNCTION generate_campaign_code()
RETURNS VARCHAR AS $$
DECLARE
  next_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) + 1 INTO next_code FROM campaigns;
  RETURN LPAD(next_code::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

**Purpose**: Organize questions by themes/campaigns

### 1.3 Link Questions to Campaigns

**File**: `sql/migrations/add-campaign-to-questions.sql`

```sql
-- Add campaign reference to questions
ALTER TABLE trivia_multiple_choice
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- Index for campaign filtering
CREATE INDEX IF NOT EXISTS idx_trivia_multiple_choice_campaign 
ON trivia_multiple_choice(campaign_id);
```

**Purpose**: Enable campaign-based question filtering

### 1.4 Create Sessions Table

**File**: `sql/migrations/create-trivia-sessions-table.sql`

```sql
CREATE TABLE IF NOT EXISTS trivia_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES campaigns(id),
  session_type VARCHAR NOT NULL CHECK (session_type IN ('single', 'multi-period')),
  duration_seconds INTEGER NOT NULL,
  questions_per_period INTEGER,
  periods_count INTEGER,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trivia_sessions_user_id ON trivia_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_sessions_campaign_id ON trivia_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_trivia_sessions_status ON trivia_sessions(status);
```

**Purpose**: Track user sessions and gameplay

### 1.5 Create Session Questions Table

**File**: `sql/migrations/create-session-questions-table.sql`

```sql
CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES trivia_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES trivia_multiple_choice(id),
  period_number INTEGER,
  sequence_order INTEGER,
  answered_at TIMESTAMP,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_question_id ON session_questions(question_id);
```

**Purpose**: Track which questions were shown in each session

---

## Phase 2: Backend Logic - Question Selection Algorithm

### 2.1 Create Selection Algorithm Helper

**File**: `apps/cms/src/lib/process-builders/build-trivia-set-multiple-choice/lib/helpers/question-selection.ts`

**Purpose**: Intelligent question selection with weighting

**Key Functions**:
- `calculateQuestionWeight()`: Time-decaying penalty for recently used questions
- `selectQuestionsForSession()`: Main selection algorithm
- `updateUsageTracking()`: Increment usage counts

**Algorithm Logic**:
1. Filter questions by campaign, status, tags
2. Calculate weight for each question:
   - Base weight: 1.0
   - Usage penalty: -0.1 per usage count
   - Time decay: +0.05 per day since last use (max 0.5)
3. Weighted random selection
4. Update usage tracking after selection

### 2.2 Update Query Questions Task

**File**: `apps/cms/src/lib/process-builders/build-trivia-set-multiple-choice/lib/tasks/query-questions.ts`

**Changes**:
- Accept `campaign_id` from rules
- Filter by campaign if provided
- Return all candidates (no pre-filtering by usage)
- Add metadata: total pool size, campaign filter applied

### 2.3 Update Select Balance Task

**File**: `apps/cms/src/lib/process-builders/build-trivia-set-multiple-choice/lib/tasks/select-balance.ts`

**Changes**:
- Replace simple shuffle with weighted selection
- Use `calculateQuestionWeight()` for each candidate
- Apply time-decaying penalty
- Return selected questions with weights for logging

### 2.4 Create Usage Tracking Helper

**File**: `apps/cms/src/lib/process-builders/build-trivia-set-multiple-choice/lib/helpers/usage-tracking.ts`

**Purpose**: Update question usage counts

**Functions**:
- `incrementQuestionUsage()`: Update usage_count, last_used_at
- `incrementCampaignUsage()`: Update campaign_usage_count JSONB
- `getQuestionUsageStats()`: Get usage statistics for a question

---

## Phase 3: Session Management System

### 3.1 Create Session Service

**File**: `apps/cms/src/lib/trivia-arena/session-service.ts`

**Purpose**: Manage trivia sessions

**Key Functions**:
- `createSession()`: Start new session
- `getNextQuestion()`: Get next question for active session
- `submitAnswer()`: Record answer and get next question
- `completeSession()`: End session and update stats

### 3.2 Create Session API Endpoints

**File**: `apps/cms/src/app/api/trivia-arena/sessions/route.ts`

**Endpoints**:
- `POST /api/trivia-arena/sessions` - Create new session
- `GET /api/trivia-arena/sessions/[id]` - Get session details
- `POST /api/trivia-arena/sessions/[id]/questions` - Get next question
- `POST /api/trivia-arena/sessions/[id]/answers` - Submit answer
- `PATCH /api/trivia-arena/sessions/[id]/complete` - Complete session

### 3.3 Create Question Selection Service

**File**: `apps/cms/src/lib/trivia-arena/question-selector.ts`

**Purpose**: Real-time question selection for sessions

**Key Functions**:
- `selectQuestionsForSession()`: Select N questions for session
- `selectNextQuestion()`: Get next question for active session
- `excludeUsedQuestions()`: Filter out questions already used in session

---

## Phase 4: Campaign Management

### 4.1 Create Campaign Service

**File**: `apps/cms/src/lib/campaigns/campaign-service.ts`

**Purpose**: Manage campaigns

**Key Functions**:
- `createCampaign()`: Create new campaign
- `getActiveCampaigns()`: Get campaigns for current week
- `getCampaignByCode()`: Get campaign by code
- `updateCampaign()`: Update campaign details

### 4.2 Create Campaign API

**File**: `apps/cms/src/app/api/campaigns/route.ts`

**Endpoints**:
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign
- `PATCH /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Archive campaign

### 4.3 Campaign Management UI

**File**: `apps/cms/src/app/campaigns/page.tsx`

**Purpose**: CMS interface for managing campaigns

**Features**:
- List all campaigns
- Create/edit campaigns
- Set release dates
- Configure tags
- View campaign stats

---

## Phase 5: Arena UI (User-Facing)

### 5.1 Arena Landing Page

**File**: `apps/web/src/app/arena/page.tsx`

**Purpose**: Main arena entry point

**Features**:
- Show available campaigns
- Session type selection (1 min, 2 min, 3 min, 5 min, multi-period)
- Start session button
- User stats/leaderboard

### 5.2 Session Play Interface

**File**: `apps/web/src/app/arena/session/[id]/page.tsx`

**Purpose**: Active session gameplay

**Features**:
- Timer countdown
- Question display
- Answer options
- Submit answer
- Period indicator (for multi-period)
- Score display

### 5.3 Session Results

**File**: `apps/web/src/app/arena/session/[id]/results/page.tsx`

**Purpose**: Show session results

**Features**:
- Final score
- Correct/incorrect breakdown
- Time spent
- Leaderboard position
- Play again option

---

## Phase 6: Migration & Data

### 6.1 Migrate Existing Sets (Optional)

**File**: `sql/migrations/migrate-existing-sets-to-sessions.sql`

**Purpose**: Convert existing sets to session format (if needed for historical data)

**Note**: May not be necessary if starting fresh with new system

### 6.2 Initialize Campaigns

**File**: `sql/seeds/seed-initial-campaigns.sql`

**Purpose**: Create initial campaigns (History, Modern NHL, International Hockey)

### 6.3 Backfill Usage Counts

**File**: `sql/migrations/backfill-question-usage-counts.sql`

**Purpose**: Calculate usage counts from existing sets (if migrating)

```sql
-- Update usage counts from existing sets
UPDATE trivia_multiple_choice q
SET usage_count = (
  SELECT COUNT(*)
  FROM sets_trivia_multiple_choice s
  WHERE s.question_data @> jsonb_build_array(jsonb_build_object('source_id', q.id))
);
```

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

**Files**:
- `apps/cms/src/lib/trivia-arena/__tests__/question-selector.test.ts`
- `apps/cms/src/lib/trivia-arena/__tests__/session-service.test.ts`
- `apps/cms/src/lib/campaigns/__tests__/campaign-service.test.ts`

### 7.2 Integration Tests

**Files**:
- `apps/cms/src/app/api/trivia-arena/__tests__/sessions.test.ts`
- `apps/cms/src/app/api/campaigns/__tests__/campaigns.test.ts`

### 7.3 E2E Tests

**Files**:
- `apps/web/src/app/arena/__tests__/session-flow.test.ts`

---

## Implementation Priority

### High Priority (MVP)
1. ✅ Phase 1: Database schema (usage tracking, campaigns, sessions)
2. ✅ Phase 2: Selection algorithm (weighting, usage tracking)
3. ✅ Phase 3: Session management (create, get questions, submit answers)
4. ✅ Phase 5: Arena UI (basic session play)

### Medium Priority (Enhanced Features)
5. ✅ Phase 4: Campaign management UI
6. ✅ Phase 6: Data migration (if needed)
7. ✅ Advanced analytics and reporting

### Low Priority (Nice to Have)
8. ✅ Phase 7: Comprehensive testing
9. ✅ Leaderboards and social features
10. ✅ Advanced session types

---

## Key Design Decisions

### Question Selection
- **Weighted random**: Not pure random, but weighted by usage and recency
- **No hard exclusions**: Questions can still appear, just less likely
- **Time decay**: Recently used questions have lower weight, but not zero

### Usage Tracking
- **Global count**: Total times question used across all sessions
- **Campaign count**: Times used within specific campaign (JSONB)
- **Last used**: Timestamp of most recent use

### Sessions
- **Stateless question delivery**: Each question request is independent
- **Session state**: Tracked in database, not in-memory
- **Flexible duration**: Support 1-5 minute sessions, multi-period

### Campaigns
- **Code-based**: Stable identifier for programmatic access
- **Tag-based filtering**: Questions can match multiple campaigns via tags
- **Release scheduling**: Support weekly release cycles

---

## Success Metrics

- **Question variety**: No question appears more than X% of sessions
- **User engagement**: Average session duration, return rate
- **Content freshness**: New questions added weekly
- **System performance**: < 200ms question selection time

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database schema)
3. Implement Phase 2 (Selection algorithm)
4. Build Phase 3 (Session management)
5. Create Phase 5 (Arena UI)
6. Iterate based on feedback

---

## Notes

- **Backward compatibility**: Existing set-based system can coexist during transition
- **Gradual rollout**: Can launch with limited campaigns, expand over time
- **Content strategy**: Need 1,000+ questions before full launch
- **Performance**: Consider caching for frequently accessed questions

