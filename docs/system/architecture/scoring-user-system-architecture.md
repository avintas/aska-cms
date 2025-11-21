# Scoring & User System Architecture - High-Level Design

## Overview

OnlyHockey needs a scoring system to track user performance on trivia sets, enabling:

- Individual score tracking per trivia set
- Site-wide leaderboards/scoreboards
- Comparison between users (Person A vs Person B on same set)
- Achievement tracking and gamification

## Core Requirements

1. **User System** - Users must exist to track scores
2. **Score Tracking** - Record scores per trivia set per user
3. **Leaderboards** - Site-wide rankings/scoreboards
4. **Comparability** - Same set = comparable results (already solved with static sets)

## Database Architecture

### Tables Needed

#### 1. `users` Table

**Purpose:** Store user accounts

**Key Fields:**

- `id` (primary key)
- `username` / `email`
- `display_name`
- `avatar_url` (optional)
- `created_at`, `updated_at`
- `status` (active, suspended, etc.)

**Notes:**

- Authentication handled separately (NextAuth, Supabase Auth, etc.)
- This is just the user profile data

#### 2. `trivia_scores` Table

**Purpose:** Track individual game attempts/results

**Key Fields:**

- `id` (primary key)
- `user_id` (FK → users)
- `trivia_set_id` (FK → trivia_sets)
- `score` (integer - e.g., 7/10)
- `total_questions` (integer - e.g., 10)
- `correct_answers` (integer)
- `incorrect_answers` (integer)
- `time_taken` (integer - seconds)
- `completed_at` (timestamp)
- `created_at` (timestamp)

**Unique Constraint:**

- Should we allow multiple attempts per user per set?
  - Option A: One score per user per set (best attempt)
  - Option B: Multiple attempts allowed (track improvement)
  - **Recommendation:** Option B (track all attempts, show best on leaderboard)

#### 3. `leaderboards` Table (Optional - Computed View)

**Purpose:** Store aggregated leaderboard data

**Key Fields:**

- `trivia_set_id` (FK → trivia_sets)
- `user_id` (FK → users)
- `best_score` (integer)
- `attempts` (integer)
- `rank` (integer - computed)
- `last_played_at` (timestamp)

**Alternative:** This could be a database VIEW or computed on-demand

- Views are simpler but may be slower
- Computed on-demand is more flexible but requires more logic

## Score Calculation Options

### Option 1: Simple Score

```
Score = (correct_answers / total_questions) * 100
e.g., 7 correct out of 10 = 70%
```

### Option 2: Weighted Score

```
Score = (correct_answers / total_questions) * 100 + time_bonus
e.g., Fast completion = bonus points
```

### Option 3: Points-Based

```
Score = correct_answers * points_per_question
e.g., Each correct = 10 points, total = 70 points
```

**Recommendation:** Start with Option 1 (simple), add complexity later if needed

## Leaderboard Types

### 1. Set-Specific Leaderboard

- Top scores for a specific trivia set
- Shows: User, Score, Attempts, Date
- Query: `SELECT * FROM trivia_scores WHERE trivia_set_id = X ORDER BY score DESC`

### 2. Site-Wide Leaderboard

- Aggregate across all sets
- Options:
  - **Total points:** Sum of all scores across all sets
  - **Average score:** Average score across all sets played
  - **Sets completed:** Number of different sets played
  - **Win rate:** Percentage of sets where score > threshold

### 3. Category Leaderboard

- Top performers in specific category/theme
- e.g., "NHL Legends" category leaderboard

## Implementation Phases

### Phase 1: Infrastructure (Pre-User System)

**What we can prepare now:**

- Design database schema
- Create `trivia_scores` table structure
- Build API endpoints (even if user_id is placeholder)
- Document scoring logic

**What we can't do:**

- Actually save scores (no users yet)
- Show real leaderboards
- Track individual users

### Phase 2: Basic User System

**Add:**

- User authentication (NextAuth, Supabase Auth, etc.)
- `users` table
- Basic user profiles

**Then:**

- Link scores to users
- Track individual scores
- Show "Your Best Score" per set

### Phase 3: Leaderboards

**Add:**

- Leaderboard queries
- Leaderboard UI components
- Ranking calculations

**Features:**

- Set-specific leaderboards
- Site-wide leaderboards
- Category leaderboards

### Phase 4: Advanced Features

**Add:**

- Achievement system
- Streaks
- Badges
- Social features (friends, challenges)

## API Endpoints Needed

### Scoring Endpoints

```
POST /api/public/trivia-scores
- Submit a score after completing a set
- Requires: user_id, trivia_set_id, score data

GET /api/public/trivia-scores
- Get user's scores
- Query params: user_id, trivia_set_id (optional)

GET /api/public/trivia-scores/leaderboard
- Get leaderboard data
- Query params: trivia_set_id (optional), category, limit
```

### User Endpoints (Phase 2)

```
GET /api/public/users/:id
- Get user profile

GET /api/public/users/:id/scores
- Get user's score history
```

## Key Design Decisions

### 1. Score Storage

- **Store every attempt** or **only best score?**
- **Recommendation:** Store every attempt, compute best on-demand
- Allows tracking improvement over time

### 2. Leaderboard Calculation

- **Real-time** (computed on request) or **Pre-computed** (stored/cached)?
- **Recommendation:** Start with real-time, add caching later if needed

### 3. Anonymity

- **Anonymous scores** before user system?
- **Recommendation:** Wait for user system, or use "Guest" accounts

### 4. Score Validation

- **Client-side** (trust user) or **Server-side** (validate answers)?
- **Recommendation:** Server-side validation for security
- API receives user's answers, validates against correct answers, calculates score

## Integration with Trivia Sets

**The Relationship:**

```
trivia_sets (frozen sets)
    ↓
trivia_scores (user attempts)
    ↓
leaderboards (aggregated rankings)
```

**Flow:**

1. User plays trivia set (from `trivia_sets` table)
2. User submits answers
3. API validates answers against `trivia_sets.question_data`
4. API calculates score
5. API saves to `trivia_scores` table
6. Leaderboard queries `trivia_scores` to show rankings

## Questions to Answer Later

1. **Authentication System:** NextAuth? Supabase Auth? Custom?
2. **Score Format:** Percentage? Points? Both?
3. **Time Limits:** Should time affect score?
4. **Minimum Score:** Required to appear on leaderboard?
5. **Privacy:** Can users hide from leaderboards?

## Next Steps

1. **Now:** Design schema, create `trivia_scores` table structure
2. **Before user system:** Build score submission API (with placeholder user_id)
3. **After user system:** Link scores to real users, enable leaderboards
4. **Future:** Add advanced features (achievements, social, etc.)
