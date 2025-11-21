# OnlyHockey.com Web App - Smart Adoption Plan

## Overview

This document outlines the strategy for adopting the existing OnlyHockey website (`C:\WebFarm\ohd`) into the monorepo's web app (`apps/web`). The goal is to selectively copy valuable design patterns, components, and content while rebuilding the architecture to work with the CMS-driven monorepo structure.

---

## What to Copy (Design & Content)

### ✅ Design System & Styling

**Color Palette:**
- Primary background: `#0a0e1a` (dark navy)
- Secondary background: `#16213e`, `#1e2a4a`
- Accent color: `#4cc9f0` (cyan blue)
- Text colors: `#a0aec0` (gray), white
- Border colors: `#2d3748`

**Typography:**
- Font: Geist Sans (from Next.js)
- Large, bold headings
- Clear hierarchy

**Component Patterns:**
- Dark theme throughout
- Rounded corners (`rounded-2xl`, `rounded-full`)
- Hover effects with scale transforms
- Shadow effects with accent color glows
- Border highlights on hover

### ✅ Brand Messaging & Content

**Core Positioning:**
- "THERE IS ONLY HOCKEY!" - Main hero message
- "L❤️VE FOR THE GAME IS ALL YOU NEED" - Tagline
- Trivia-first focus: "ultimate hockey trivia gaming experience"
- Four pillars structure (Trivia Games, Shareables, Stories, Shop)

**Key Phrases to Preserve:**
- "Challenge yourself solo, compete with friends, energize your corporate event"
- "Test your hockey IQ with questions spanning legendary moments, players, and stats"
- "Whether you're here for the competition, the camaraderie, or the pure joy of the game, you belong here"

### ✅ Component Structure

**Layout Components:**
- `PageLayout` - Wrapper with Header/Footer
- `Header` - Navigation with mobile menu
- `Footer` - Simple footer with links

**Landing Page Sections:**
- `HeroSection` - Main hero with trivia preview card
- `FeaturesSection` - Four pillars display
- `SocialProofSection` - Content counts/stats
- `FeaturedContentSection` - Featured content previews
- `TheCrew` - Persona avatars
- `FinalWelcome` - Closing message

**Design Patterns:**
- Grid layouts (2-column, 4-column)
- Card-based UI with hover effects
- CTA buttons with rounded-full style
- Mobile-responsive navigation

---

## What to Adapt (Architecture & Data)

### 🔄 Database Queries

**Current:** Direct Supabase queries in components
**New:** Use shared types from `packages/shared` and adapt queries to match monorepo database structure

**Example Adaptations:**
- Replace direct `supabaseAdmin` calls with proper server/client Supabase utilities
- Use shared types for trivia sets, collections, etc.
- Ensure queries match the CMS-managed database schema

### 🔄 Component Props & Types

**Current:** Local type definitions
**New:** Import from `packages/shared` where possible

**Example:**
```typescript
// Old (ohd)
import type { TriviaSetFromDB } from '@/lib/triviaSetLoader';

// New (monorepo)
import type { TriviaSet } from '@aska/shared';
```

### 🔄 File Structure

**Current:** Single app with CMS and web mixed
**New:** Separate web app, clean structure

**Adaptations:**
- Move components to `apps/web/src/components/`
- Create proper data fetching utilities in `apps/web/src/lib/`
- Use Next.js 15 App Router patterns consistently

---

## What to Rebuild (Architecture)

### ❌ Remove CMS-Specific Code

**Don't Copy:**
- Any CMS routes or pages (`/cms/*`)
- CMS-specific components
- Admin-only functionality
- Content management interfaces

### ❌ Rebuild Data Fetching

**Current:** Mixed patterns, some direct database access
**New:** Clean server-side data fetching

**Rebuild:**
- Create proper server actions or API routes
- Use Supabase client utilities from `apps/web/src/utils/supabase/`
- Ensure all data comes from CMS-managed database
- Handle loading and error states properly

### ❌ Rebuild Navigation & Routing

**Current:** May have CMS routes mixed in
**New:** Clean public website routes only

**Routes to Keep:**
- `/` - Landing page
- `/trivia-zone` - Trivia games
- `/captain-heart` - H.U.G.s
- `/motivate` - Motivational quotes
- `/stories` - Hockey stories
- `/shop` - Shop (placeholder)
- `/about`, `/faq`, `/support`, `/privacy`, `/terms` - Static pages

### ❌ Rebuild Content Loading

**Current:** May have hardcoded content or local files
**New:** All content from database/CMS

**Rebuild:**
- Trivia sets loading from database
- Collections (Wisdom, Greetings, Stats, Motivational) from database
- Featured content from database
- No local markdown files or hardcoded content

---

## Implementation Strategy

### Phase 1: Foundation (Design System)

1. **Copy Styling:**
   - Update `apps/web/src/app/globals.css` with color variables
   - Update `tailwind.config.ts` with color palette
   - Ensure dark theme is consistent

2. **Copy Layout Components:**
   - `PageLayout.tsx` - Adapt to monorepo structure
   - `Header.tsx` - Clean navigation, remove CMS links
   - `Footer.tsx` - Simple footer

3. **Test Layout:**
   - Verify dark theme works
   - Test responsive design
   - Ensure navigation works

### Phase 2: Landing Page Structure

1. **Copy Section Components:**
   - `HeroSection.tsx` - Adapt data fetching
   - `FeaturesSection.tsx` - Update links/routes
   - `SocialProofSection.tsx` - Connect to database counts
   - `FeaturedContentSection.tsx` - Connect to database
   - `TheCrew.tsx` - Copy as-is (static content)
   - `FinalWelcome.tsx` - Copy messaging

2. **Rebuild Data Fetching:**
   - Create server-side data fetching functions
   - Connect to shared database
   - Use shared types

3. **Update Routes:**
   - Ensure all links point to correct routes
   - Remove any CMS-specific navigation

### Phase 3: Content Integration

1. **Trivia Sets:**
   - Rebuild trivia set loading to use monorepo database
   - Connect to CMS-managed trivia sets
   - Ensure proper filtering (published only)

2. **Collections:**
   - Connect Wisdom, Greetings, Stats, Motivational to database
   - Use shared collection types
   - Ensure proper status filtering

3. **Featured Content:**
   - Pull featured content from database
   - Use CMS-managed featured flags

### Phase 4: Polish & Testing

1. **Responsive Design:**
   - Test all breakpoints
   - Verify mobile navigation
   - Check card layouts on all screens

2. **Performance:**
   - Optimize images
   - Ensure proper loading states
   - Test data fetching performance

3. **Accessibility:**
   - Verify ARIA labels
   - Check color contrast
   - Test keyboard navigation

---

## Key Files to Reference

### From `C:\WebFarm\ohd\src\components\`:
- `HeroSection.tsx` - Design and structure
- `FeaturesSection.tsx` - Four pillars layout
- `PageLayout.tsx` - Layout wrapper
- `Header.tsx` - Navigation
- `Footer.tsx` - Footer

### From `C:\WebFarm\ohd\src\app\`:
- `page.tsx` - Landing page structure
- `layout.tsx` - Root layout (metadata, fonts)

### From `C:\WebFarm\ohd\docs\`:
- `BRAND-POSITIONING-MESSAGING.md` - Brand guidelines
- `LANDING-PAGE-UPDATE-PLAN.md` - Content strategy

---

## Key Principles

1. **Design First:** Copy the look and feel exactly
2. **Content Second:** Preserve all messaging and phrasing
3. **Architecture Last:** Rebuild data layer to work with monorepo
4. **CMS-Driven:** All content must come from CMS-managed database
5. **Clean Separation:** No CMS code in web app

---

## Success Criteria

✅ Landing page matches existing design exactly
✅ All messaging and branding preserved
✅ Content loads from CMS-managed database
✅ No CMS-specific code in web app
✅ Responsive design works on all devices
✅ Performance is optimized
✅ All routes work correctly

---

**Status:** Planning Phase
**Last Updated:** 2024
**Next Steps:** Begin Phase 1 - Foundation (Design System)

