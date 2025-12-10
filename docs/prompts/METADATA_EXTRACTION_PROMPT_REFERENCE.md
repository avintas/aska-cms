# Metadata Extraction Prompt Reference

## Overview
This document describes what the `metadata_extraction` prompt should include. The prompt is stored in the `ai_extraction_prompts` table in the database.

## Current Implementation
The code automatically injects the valid themes list if it's not already present in the prompt (see `src/lib/sourcing/adapters.ts`).

## Required Prompt Structure

The prompt should instruct Gemini to extract structured metadata from source content and return it as JSON.

### Required Fields

1. **theme** (string, REQUIRED): Must be one of the 13 standardized themes (see below)
2. **tags** (array of strings, REQUIRED): At least one tag
3. **category** (string or null, OPTIONAL): Must be a valid category for the selected theme
4. **summary** (string, REQUIRED): A brief summary of the content

### Valid Themes (13 Total)

The prompt MUST include this list of valid themes:

1. **Players**
2. **Teams & Organizations**
3. **Venues & Locations**
4. **Awards & Honors**
5. **Leadership & Staff**
6. **Business & Finance**
7. **Media, Broadcasting, & E-Sports**
8. **Marketing, Sponsorship, and Merchandising**
9. **Equipment & Technology**
10. **Training, Health, & Wellness**
11. **Fandom & Fan Culture**
12. **Social Impact & Diversity**
13. **Tactics & Advanced Analytics**

### Valid Categories by Theme

#### Players
- Player Spotlight
- Sharpshooters
- Net Minders
- Icons
- Captains
- Hockey is Family
- Statistics & Records
- Career Achievements

#### Teams & Organizations
- Stanley Cup Playoffs
- NHL Draft
- Free Agency
- Game Day
- Hockey Nations
- All-Star Game
- Heritage Classic
- International Tournaments
- Olympics

#### Venues & Locations
- Stadium Series
- Global Series

#### Awards & Honors
- NHL Awards
- Milestones
- Historical Events
- Traditions
- Legacy Content

#### Leadership & Staff
- Coaching
- Management
- Front Office

#### Business & Finance
- Contracts & Salaries
- Collective Bargaining
- Team Valuations
- Revenue Sharing
- Financial Operations

#### Media, Broadcasting, & E-Sports
- Broadcasting & TV
- Streaming Services
- Sports Journalism
- E-Sports
- Video Games

#### Marketing, Sponsorship, and Merchandising
- Sponsorships
- Endorsements
- Merchandise
- Advertising
- Brand Partnerships

#### Equipment & Technology
- Equipment Design
- Technology Innovation
- Safety Technology
- Ice Maintenance
- Video Review Systems

#### Training, Health, & Wellness
- Training Programs
- Nutrition
- Sports Psychology
- Injury Prevention
- Recovery & Rehabilitation
- Youth Leagues
- Development Programs
- Junior Hockey

#### Fandom & Fan Culture
- Fan Traditions
- Community Events
- Watch Parties
- Rivalry Culture
- Fan Experiences

#### Social Impact & Diversity
- Diversity & Inclusion
- Charitable Initiatives
- Community Outreach
- Environmental Impact
- Social Programs

#### Tactics & Advanced Analytics
- Coaching Systems
- Tactical Analysis
- Advanced Metrics
- Strategy Breakdowns
- Performance Analysis
- Game Rules
- Penalties & Infractions
- Officiating

## Example Prompt Template

```
You are a content analysis expert. Analyze the provided source content and extract structured metadata.

## Required Output Format

Return a JSON object with the following structure:

{
  "theme": "string (REQUIRED - see valid themes below)",
  "tags": ["array", "of", "strings"],
  "category": "string or null (must be valid for selected theme)",
  "summary": "string (REQUIRED - brief summary of content)"
}

## Valid Themes (REQUIRED - must use exact spelling)

You MUST select one of these 13 standardized themes (use exact spelling and capitalization):

- Players (Categories: Player Spotlight, Sharpshooters, Net Minders, Icons, Captains, Hockey is Family, Statistics & Records, Career Achievements)
- Teams & Organizations (Categories: Stanley Cup Playoffs, NHL Draft, Free Agency, Game Day, Hockey Nations, All-Star Game, Heritage Classic, International Tournaments, Olympics)
- Venues & Locations (Categories: Stadium Series, Global Series)
- Awards & Honors (Categories: NHL Awards, Milestones, Historical Events, Traditions, Legacy Content)
- Leadership & Staff (Categories: Coaching, Management, Front Office)
- Business & Finance (Categories: Contracts & Salaries, Collective Bargaining, Team Valuations, Revenue Sharing, Financial Operations)
- Media, Broadcasting, & E-Sports (Categories: Broadcasting & TV, Streaming Services, Sports Journalism, E-Sports, Video Games)
- Marketing, Sponsorship, and Merchandising (Categories: Sponsorships, Endorsements, Merchandise, Advertising, Brand Partnerships)
- Equipment & Technology (Categories: Equipment Design, Technology Innovation, Safety Technology, Ice Maintenance, Video Review Systems)
- Training, Health, & Wellness (Categories: Training Programs, Nutrition, Sports Psychology, Injury Prevention, Recovery & Rehabilitation, Youth Leagues, Development Programs, Junior Hockey)
- Fandom & Fan Culture (Categories: Fan Traditions, Community Events, Watch Parties, Rivalry Culture, Fan Experiences)
- Social Impact & Diversity (Categories: Diversity & Inclusion, Charitable Initiatives, Community Outreach, Environmental Impact, Social Programs)
- Tactics & Advanced Analytics (Categories: Coaching Systems, Tactical Analysis, Advanced Metrics, Strategy Breakdowns, Performance Analysis, Game Rules, Penalties & Infractions, Officiating)

## Guidelines:

- **theme**: Must match one of the themes above EXACTLY (including capitalization and punctuation)
- **tags**: Provide at least 3-5 relevant tags that describe the content
- **category**: Optional, but if provided, must be one of the valid categories for the selected theme
- **summary**: Provide a concise 2-3 sentence summary of the content

## Important:

- Use exact theme names as listed above
- Category must be valid for the selected theme (or null)
- All fields except category are required
- Be accurate and specific in your analysis

Source Content:
```

## Auto-Injection Behavior

The code in `src/lib/sourcing/adapters.ts` automatically appends the themes list to the prompt if it's not already present. This ensures:

1. Even if the database prompt is outdated, themes are always included
2. The prompt is self-documenting
3. Gemini always knows what themes are valid

## Validation

The extracted metadata is validated in `src/lib/sourcing/validators.ts`:
- Theme must be one of the 13 valid themes (case-insensitive matching with auto-correction)
- Tags must be a non-empty array of strings
- Category must be valid for the selected theme (if provided)
- Summary is required

## Error Messages

If validation fails, the error message will include:
- The invalid theme that was received
- The complete list of valid themes
- Specific guidance on what went wrong

