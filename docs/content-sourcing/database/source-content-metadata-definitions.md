# Source Content Metadata Field Definitions

## Purpose

This document defines the metadata fields used in the `source_content_ingested` table. These definitions will be used to:

- Create AI prompts for metadata extraction
- Ensure consistent metadata across all ingested content
- Guide manual editing and review
- Document the system's metadata structure

## Field Definitions

### Theme

**Definition:** The primary subject matter classification of the content. Must be one of the 13 standardized theme values used across the system.

**Standardized Themes (Required - Must be one of these 13):**

**Core Themes (5):**
1. **"Players"** - Individual player content, personal achievements, player statistics, records, historical player content
2. **"Teams & Organizations"** - Team content, franchise information, organizational content, events, tournaments, competitions
3. **"Venues & Locations"** - Venue information, location-based content, schedule-related content
4. **"Awards & Honors"** - Awards, achievements, legacy content, recognition, historical events, traditions
5. **"Leadership & Staff"** - Leadership content, management, coaching, mentorship, staff-related content

**Business, Economics, & Management (3):**
6. **"Business & Finance"** - Economics, contracts, CBAs, team valuations, revenue sharing, financial operations
7. **"Media, Broadcasting, & E-Sports"** - TV deals, streaming services, sports journalism, e-sports, video games
8. **"Marketing, Sponsorship, and Merchandising"** - Sponsorships, endorsements, merchandise, advertising, brand partnerships

**Technology, Training, & Performance (2):**
9. **"Equipment & Technology"** - Equipment design, innovation, technology systems, safety technology, ice maintenance
10. **"Training, Health, & Wellness"** - Training programs, nutrition, sports psychology, injury prevention, youth development

**Culture, Fandom, & Community (2):**
11. **"Fandom & Fan Culture"** - Fan experiences, traditions, community events, watch parties, rivalry culture
12. **"Social Impact & Diversity"** - Diversity, inclusion, charitable work, community impact, environmental impact

**Advanced Analysis & Strategy (1):**
13. **"Tactics & Advanced Analytics"** - Tactical analysis, advanced metrics, strategic breakdowns, rules & gameplay

**Characteristics:**

- **Single value** (not an array)
- **Standardized** (must be one of the 13 predefined themes)
- **Primary identifier** for content organization
- **Required field** - all content must have a theme
- **Consistent** across all content types (wisdom, motivational, stats, etc.)

**Examples:**

- ✅ "Players" (for content about individual players, player stats, personal achievements, records)
- ✅ "Teams & Organizations" (for content about teams, franchises, team history, events, tournaments)
- ✅ "Awards & Honors" (for content about awards, achievements, legacy, historical events)
- ✅ "Leadership & Staff" (for content about coaches, management, leadership)
- ✅ "Venues & Locations" (for content about venues, locations, schedules)
- ✅ "Business & Finance" (for content about contracts, salaries, financial operations)
- ✅ "Tactics & Advanced Analytics" (for content about rules, strategies, advanced metrics)
- ❌ "Winnipeg Jets" (too specific - use "Teams & Organizations" instead)
- ❌ "hockey" (not a valid theme - use one of the 13 standardized themes)
- ❌ "Player Statistics" (use "Players" theme with "Statistics & Records" category instead)

**Theme Selection Guidelines:**

**Use "Players" when content is about:**

- Individual players (names, careers, achievements)
- Player statistics and performance
- Personal qualities, growth, development
- Individual achievements and records
- Historical player content

**Use "Teams & Organizations" when content is about:**

- Teams, franchises, organizations
- Team history, championships, records
- Collective team concepts
- Organizational information
- Events, tournaments, competitions (Stanley Cup Playoffs, NHL Draft, All-Star Game, etc.)

**Use "Venues & Locations" when content is about:**

- Venues, arenas, stadiums
- Geographic locations
- Schedules, game locations
- Location-based information

**Use "Awards & Honors" when content is about:**

- Awards, trophies, recognition
- Achievements and accomplishments
- Legacy and impact
- Historical events, traditions, heritage

**Use "Leadership & Staff" when content is about:**

- Coaches, management, leadership
- Mentorship and guidance
- Staff and organizational leadership
- Leadership concepts and examples

**Use "Business & Finance" when content is about:**

- Player contracts, salaries, salary cap
- Collective bargaining agreements (CBAs)
- Team valuations, revenue sharing
- Financial operations and economics

**Use "Media, Broadcasting, & E-Sports" when content is about:**

- TV broadcasting deals, streaming services
- Sports journalism (traditional and social)
- E-sports tournaments
- Hockey video games

**Use "Marketing, Sponsorship, and Merchandising" when content is about:**

- Sponsorships, endorsements
- Team/player merchandise
- Brand partnerships
- In-arena advertising

**Use "Equipment & Technology" when content is about:**

- Equipment design and innovation (skates, sticks, pads)
- Safety technology (helmets, protective gear)
- Ice maintenance technology
- Video review systems

**Use "Training, Health, & Wellness" when content is about:**

- Training programs and methods
- Nutrition, sports psychology
- Injury prevention and recovery
- Youth development programs, junior leagues

**Use "Fandom & Fan Culture" when content is about:**

- Fan traditions, tailgating
- Watch parties, community events
- Rivalry culture from fan perspective
- Fan experiences and chants

**Use "Social Impact & Diversity" when content is about:**

- Diversity and inclusion initiatives
- Charitable foundations and community outreach
- Environmental impact
- Social programs and community impact

**Use "Tactics & Advanced Analytics" when content is about:**

- Coaching systems and tactical analysis
- Advanced metrics (Corsi, Fenwick, xG)
- Strategic breakdowns and play execution
- Rules, regulations, penalties, officiating

**Use Cases:**

- Primary filtering and organization
- Matching content to trivia set themes
- Content library browsing
- Process Builder theme matching
- Consistent classification across all content types

---

### Tag

**Definition:** A rich array of relevant keywords, topics, and concepts that describe various aspects of the content. Tags provide multiple entry points for discovery and matching.

**Characteristics:**

- **Array of strings** (multiple tags per content)
- **Granular and specific** (individual concepts)
- **Comprehensive coverage** (covers all aspects of content)
- **Optional field** (but AI should always extract tags)

**Examples:**

```json
[
  "Winnipeg Jets",
  "NHL",
  "hockey",
  "sports",
  "team history",
  "player statistics",
  "2024 season",
  "playoffs"
]
```

**Tag Types:**

- **Entities:** Team names, player names, locations
- **Topics:** Subject areas (hockey, sports, rules)
- **Temporal:** Time periods (2024, playoffs, season)
- **Concepts:** Abstract ideas (strategy, statistics, history)
- **Categories:** Broad classifications (sports, entertainment)

**Use Cases:**

- Rich filtering and search
- Content discovery
- Cross-referencing related content
- Process Builder tag matching

---

### Category

**Definition:** A theme-specific refinement that provides additional resolution within a theme. Categories are standardized content series/topics that help organize and classify content more granularly than themes alone.

**Characteristics:**

- **Single value** (not an array)
- **Theme-specific** (refines the theme, not independent)
- **Standardized** (must be one of ~20 predefined categories)
- **Optional field** (but AI should detect category)
- **Provides granularity** within the theme

**Standardized Categories by Theme:**

**Theme: "Players"**

1. Player Spotlight
2. Sharpshooters
3. Net Minders
4. Icons
5. Captains
6. Hockey is Family

**Theme: "Teams & Organizations"**

1. Stanley Cup Playoffs
2. NHL Draft
3. Free Agency
4. Game Day
5. Hockey Nations
6. All-Star Game
7. Heritage Classic

**Theme: "Venues & Locations"**

1. Stadium Series
2. Global Series

**Theme: "Awards & Honors"**

1. NHL Awards
2. Milestones

**Theme: "Leadership & Staff"**

1. Coaching
2. Management
3. Front Office

**Examples:**

- ✅ "Player Spotlight" (refines "Players" theme)
- ✅ "Stanley Cup Playoffs" (refines "Teams & Organizations" theme)
- ✅ "NHL Awards" (refines "Awards & Honors" theme)
- ❌ "Halloween" (should be a tag, not a category)
- ❌ "sports" (too broad - categories are theme-specific refinements)

**Category Selection Guidelines:**

- Categories must be selected from the standardized list
- Category must be appropriate for the content's theme
- If no category fits, leave category as NULL (theme alone is sufficient)
- Categories provide additional granularity for filtering and organization

**Use Cases:**

- Theme-specific content organization
- Granular filtering within themes
- Content series/topic classification
- Library navigation and browsing

---

### Summary

**Definition:** A brief, comprehensive overview of the content that captures the main points, key information, and essential details. Should be informative enough to understand the content without reading it in full.

**Characteristics:**

- **Single text value** (paragraph or multiple sentences)
- **Concise but comprehensive** (covers main points)
- **Informative** (allows understanding without full read)
- **Optional field** (but AI should always generate)

**Examples:**

**Good Summary:**

> "This content covers the history of the Winnipeg Jets NHL team, including their founding in 1999, relocation from Atlanta, key players like Patrik Laine and Mark Scheifele, and their playoff appearances. It includes statistics from recent seasons and notable achievements."

**Poor Summary:**

> "Winnipeg Jets hockey team." (too brief, not informative)

**Length Guidelines:**

- **Minimum:** 2-3 sentences (50+ words)
- **Maximum:** 5-7 sentences (200 words)
- **Ideal:** 3-5 sentences (100-150 words)

**Use Cases:**

- Content preview in library
- Quick content understanding
- Search result snippets
- Content discovery

---

### Title

**Definition:** A concise, descriptive heading that identifies and summarizes the content. Should be clear, specific, and informative.

**Characteristics:**

- **Single text value** (short phrase or sentence)
- **Concise** (typically 5-15 words)
- **Descriptive** (indicates content subject)
- **Optional field** (can be generated or provided manually)

**Examples:**

- ✅ "Winnipeg Jets: Team History and Key Players"
- ✅ "NHL Playoff Statistics for 2024 Season"
- ✅ "Wayne Gretzky's Career Achievements and Records"
- ✅ "Understanding Hockey Rules: Offsides and Icing"
- ❌ "Hockey" (too vague)
- ❌ "Content about Winnipeg Jets team including history, players, statistics, achievements, and recent seasons" (too long, reads like summary)

**Title Guidelines:**

- **Length:** 5-15 words (ideally 8-12 words)
- **Format:** Title Case or Sentence case
- **Style:** Descriptive, not promotional
- **Specificity:** Should identify the content uniquely

**Use Cases:**

- Content identification in lists
- Library display
- Content organization
- Quick reference

---

### Key Phrase

**Definition:** Important phrases, concepts, or terms extracted from the content that represent significant ideas, facts, or topics. These are specific phrases (not single words) that carry meaning.

**Characteristics:**

- **Array of strings** (multiple phrases per content)
- **Phrases, not single words** (2-5 words typically)
- **Significant concepts** (important ideas from content)
- **Optional field** (but AI should extract key phrases)

**Examples:**

```json
[
  "Winnipeg Jets",
  "NHL playoffs",
  "Patrik Laine",
  "Mark Scheifele",
  "team history",
  "playoff statistics",
  "2024 season",
  "hockey rules",
  "offside rule",
  "icing violation"
]
```

**Key Phrase Types:**

- **Named Entities:** "Winnipeg Jets", "Wayne Gretzky"
- **Concepts:** "playoff statistics", "team history"
- **Rules/Terms:** "offside rule", "icing violation"
- **Events:** "2024 playoffs", "Stanley Cup"
- **Statistics:** "career goals", "season record"

**Distinction from Tags:**

- **Tags:** Single words or very short phrases (e.g., "hockey", "NHL")
- **Key Phrases:** Multi-word phrases that carry specific meaning (e.g., "Winnipeg Jets", "playoff statistics")

**Use Cases:**

- Content analysis
- Concept extraction
- Search enhancement
- Content matching
- Topic modeling

---

## Field Relationships

### Theme vs. Tags

- **Theme:** Single, standardized classification (one of 13: "Players", "Teams & Organizations", "Venues & Locations", "Awards & Honors", "Leadership & Staff", "Business & Finance", "Media, Broadcasting, & E-Sports", "Marketing, Sponsorship, and Merchandising", "Equipment & Technology", "Training, Health, & Wellness", "Fandom & Fan Culture", "Social Impact & Diversity", "Tactics & Advanced Analytics")
- **Tags:** Multiple related concepts (e.g., ["Winnipeg Jets", "NHL", "hockey", "playoffs"])

### Tags vs. Key Phrases

- **Tags:** Single words or very short identifiers (e.g., "hockey", "NHL")
- **Key Phrases:** Multi-word meaningful phrases (e.g., "Winnipeg Jets", "playoff statistics")

### Category vs. Theme

- **Theme:** Broad classification (one of 13 standardized: "Players", "Teams & Organizations", "Venues & Locations", "Awards & Honors", "Leadership & Staff", "Business & Finance", "Media, Broadcasting, & E-Sports", "Marketing, Sponsorship, and Merchandising", "Equipment & Technology", "Training, Health, & Wellness", "Fandom & Fan Culture", "Social Impact & Diversity", "Tactics & Advanced Analytics")
- **Category:** Theme-specific refinement (e.g., "Player Spotlight" refines "Players" theme)
- **Relationship:** Category provides additional resolution within the theme

### Title vs. Summary

- **Title:** Short, concise heading (5-15 words)
- **Summary:** Comprehensive overview (100-150 words)

## AI Extraction Guidelines

### For Theme Extraction:

- Classify content into **one of the 13 standardized themes**
- Core themes: Players, Teams & Organizations, Venues & Locations, Awards & Honors, Leadership & Staff
- Business themes: Business & Finance, Media/Broadcasting/E-Sports, Marketing/Sponsorship/Merchandising
- Technology themes: Equipment & Technology, Training/Health/Wellness
- Culture themes: Fandom & Fan Culture, Social Impact & Diversity
- Analysis theme: Tactics & Advanced Analytics
- Single value only (must be exactly one of the 13 themes)
- Required - must always extract
- Must match the standardized theme system used across all collections
- Refer to theme selection guidelines for detailed guidance

### For Tag Extraction:

- Extract **multiple relevant tags** (5-15 tags recommended)
- Include entities, topics, concepts, temporal references
- **Include holidays/time-based markers** (e.g., "Halloween", "Christmas", "New Year", "Hanukkah")
- Mix of specific and general tags
- Should include the theme as a tag

### For Category Detection:

- Select from **standardized category list** (~20 categories)
- Category must be **appropriate for the content's theme**
- Single value only
- If no category fits, leave as NULL (theme alone is sufficient)
- Categories refine themes - they are not independent classifications

### For Summary Generation:

- Generate **3-5 sentence overview**
- Cover main points and key information
- 100-150 words ideal
- Informative and comprehensive

### For Title Generation:

- Create **concise, descriptive heading**
- 5-15 words (ideally 8-12 words)
- Title Case format
- Should identify content uniquely

### For Key Phrase Extraction:

- Extract **5-10 significant phrases**
- Multi-word phrases (2-5 words)
- Important concepts and entities
- Should include named entities and key concepts

## Examples: Complete Metadata Set

### Example 1: Team Content

**Content:** Article about Winnipeg Jets team history, players, and recent seasons.

**Metadata:**

```json
{
  "theme": "Teams & Organizations",
  "tags": [
    "Winnipeg Jets",
    "NHL",
    "hockey",
    "sports",
    "team history",
    "player statistics",
    "2024 season",
    "playoffs",
    "Patrik Laine",
    "Mark Scheifele"
  ],
  "category": "Stanley Cup Playoffs",
  "summary": "This content covers the history of the Winnipeg Jets NHL team, including their founding in 1999, relocation from Atlanta, key players like Patrik Laine and Mark Scheifele, and their playoff appearances. It includes statistics from recent seasons and notable achievements.",
  "title": "Winnipeg Jets: Team History and Key Players",
  "key_phrases": [
    "Winnipeg Jets",
    "NHL team",
    "team history",
    "Patrik Laine",
    "Mark Scheifele",
    "playoff appearances",
    "2024 season",
    "player statistics"
  ]
}
```

### Example 2: Player Content

**Content:** Article about Wayne Gretzky's career achievements and records.

**Metadata:**

```json
{
  "theme": "Players",
  "tags": [
    "Wayne Gretzky",
    "NHL",
    "hockey",
    "sports",
    "career records",
    "achievements",
    "statistics",
    "Hall of Fame"
  ],
  "category": "Icons",
  "summary": "This content covers Wayne Gretzky's legendary NHL career, including his record-breaking achievements, career statistics, and impact on the game of hockey. It includes details about his time with various teams and his lasting legacy.",
  "title": "Wayne Gretzky: Career Achievements and Records",
  "key_phrases": [
    "Wayne Gretzky",
    "career records",
    "NHL career",
    "career statistics",
    "Hall of Fame",
    "hockey legacy"
  ]
}
```

### Example 3: Awards Content

**Content:** Information about NHL awards and honors.

**Metadata:**

```json
{
  "theme": "Awards & Honors",
  "tags": [
    "NHL awards",
    "hockey",
    "sports",
    "trophies",
    "recognition",
    "achievements",
    "Hall of Fame"
  ],
  "category": "NHL Awards",
  "summary": "This content explains the various NHL awards and honors, including the Stanley Cup, Hart Trophy, and other major awards. It covers the history of these awards and notable recipients.",
  "title": "NHL Awards and Honors: A Complete Guide",
  "key_phrases": [
    "NHL awards",
    "Stanley Cup",
    "Hart Trophy",
    "award recipients",
    "hockey honors"
  ]
}
```

### Example 4: Rules Content

**Content:** Explanation of hockey rules including offsides and icing.

**Metadata:**

```json
{
  "theme": "Teams & Organizations",
  "tags": [
    "hockey",
    "rules",
    "sports",
    "offsides",
    "icing",
    "NHL rules",
    "game regulations",
    "penalties"
  ],
  "category": "Game Day",
  "summary": "This content explains key hockey rules including the offside rule, which prevents players from entering the offensive zone before the puck, and the icing rule, which occurs when a player shoots the puck across both goal lines. It covers how these rules are enforced and common violations.",
  "title": "Understanding Hockey Rules: Offsides and Icing",
  "key_phrases": [
    "hockey rules",
    "offside rule",
    "icing rule",
    "offensive zone",
    "goal lines",
    "rule enforcement",
    "common violations"
  ]
}
```

## Prompt Creation Guidelines

When creating AI prompts for metadata extraction:

1. **Reference these definitions** - Include field definitions in prompts
2. **Provide examples** - Show good examples of each field
3. **Specify format** - Request JSON format with exact field names
4. **Set expectations** - Clarify required vs. optional fields
5. **Give context** - Explain how fields will be used

## Validation Rules

### Theme

- ✅ Must be present (required)
- ✅ Single string value
- ✅ Must be exactly one of: "Players", "Teams & Organizations", "Venues & Locations", "Awards & Honors", "Leadership & Staff", "Business & Finance", "Media, Broadcasting, & E-Sports", "Marketing, Sponsorship, and Merchandising", "Equipment & Technology", "Training, Health, & Wellness", "Fandom & Fan Culture", "Social Impact & Diversity", "Tactics & Advanced Analytics"
- ✅ Not empty
- ✅ Matches standardized theme system

### Tags

- ✅ Array of strings
- ✅ Each tag is non-empty string
- ✅ Should include theme as a tag
- ✅ 5-15 tags recommended

### Category

- ✅ Single string value
- ✅ Must be one of the standardized categories (~20 total)
- ✅ Must be appropriate for the content's theme
- ✅ Can be NULL if no category fits

### Summary

- ✅ Single string value
- ✅ 50-200 words
- ✅ Informative and comprehensive

### Title

- ✅ Single string value
- ✅ 5-15 words
- ✅ Descriptive and specific

### Key Phrases

- ✅ Array of strings
- ✅ Each phrase is 2-5 words
- ✅ 5-10 phrases recommended
