-- Migration: Align suitability analysis keys with generator track keys
-- Date: 2025-12-10
-- Description: 
--   Updates the Content Suitability Analysis prompt to use key names that match
--   the generator track keys. This eliminates the need for key mapping.
--
--   Old keys → New keys:
--     multiple_choice_trivia → trivia_multiple_choice
--     true_false_trivia      → trivia_true_false
--     who_am_i_trivia        → trivia_who_am_i
--
--   Note: The validator has backwards compatibility for existing data with old keys.

BEGIN;

-- ========================================================================
-- STEP 1: Deactivate current active prompt
-- ========================================================================

UPDATE public.ai_extraction_prompts
SET is_active = false,
    updated_at = NOW()
WHERE prompt_type = 'content_suitability_analysis'
  AND is_active = true;

-- ========================================================================
-- STEP 2: Insert updated prompt with aligned key names
-- ========================================================================

INSERT INTO public.ai_extraction_prompts (
  prompt_name,
  prompt_type,
  prompt_content,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Content Suitability Analysis',
  'content_suitability_analysis',
  'You are a content analysis expert. Analyze the provided source content and determine its suitability for generating different types of content. For each content type, evaluate whether the source material is appropriate and provide:

1. **suitable** (boolean): Whether the content is suitable for this content type
2. **confidence** (number 0.0-1.0): Your confidence level in this assessment (0.0 = not confident, 1.0 = very confident)
3. **reasoning** (string): A brief explanation (1-2 sentences) of why the content is or isn''t suitable

## Content Types to Analyze:

### trivia_multiple_choice
Content is suitable if it contains:
- Factual information that can be formed into questions
- Clear, verifiable statements
- Multiple potential answer options possible
- Specific details, numbers, dates, or names that can be used as distractors

### trivia_true_false
Content is suitable if it contains:
- Statements that can be verified as true or false
- Binary facts or claims
- Clear assertions that can be confirmed or contradicted
- Factual claims rather than opinions or narratives

### trivia_who_am_i
Content is suitable if it contains:
- Information about specific players, teams, or hockey personalities
- Distinctive characteristics, achievements, or biographical details
- Multiple identifying clues that can be revealed progressively
- Enough detail to create 3-4 escalating clues leading to one correct answer
- Unique facts or milestones that identify a specific person or team

### motivational
Content is suitable if it contains:
- Inspirational language or themes
- Personal growth, achievement, or overcoming challenges
- Encouraging or uplifting messages
- Emotional depth or human struggle/triumph
- Leadership, teamwork, or resilience themes

### facts
Content is suitable if it contains:
- Numerical data, statistics, or metrics
- Verifiable factual statements
- Specific details, records, or achievements
- Hockey-specific facts, stats, or historical information
- Quantifiable information that can be extracted

### wisdom
Content is suitable if it contains:
- Philosophical insights or life lessons
- Reflective or contemplative content
- "Penalty Box" style musings or deep thoughts
- Metaphorical or symbolic meaning
- Wisdom about hockey, life, or human nature

## Output Format
Return a JSON object with the following structure. Include ALL six content types, even if some are not suitable:

{
  "trivia_multiple_choice": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  },
  "trivia_true_false": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  },
  "trivia_who_am_i": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  },
  "motivational": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  },
  "facts": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  },
  "wisdom": {
    "suitable": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation..."
  }
}

## Guidelines:
- Be honest and accurate in your assessments
- Confidence should reflect how clear-cut the suitability is
- Reasoning should be specific to the content, not generic
- If content is borderline, use lower confidence scores
- Consider the hockey context - content may be hockey-specific

Source Content:',
  'Analyzes source content suitability for multiple content types (trivia, motivational, facts, wisdom). Keys aligned with generator tracks.',
  true,
  NOW(),
  NOW()
);

-- ========================================================================
-- VERIFICATION QUERIES (uncomment to run manually)
-- ========================================================================

-- Verify prompt was updated
-- SELECT 
--   id,
--   prompt_name,
--   prompt_type,
--   is_active,
--   LENGTH(prompt_content) as prompt_length,
--   created_at
-- FROM public.ai_extraction_prompts
-- WHERE prompt_type = 'content_suitability_analysis'
-- ORDER BY updated_at DESC
-- LIMIT 1;

-- Verify new key names are used
-- SELECT 
--   CASE WHEN prompt_content LIKE '%trivia_multiple_choice%' THEN 'OK' ELSE 'MISSING' END as mc,
--   CASE WHEN prompt_content LIKE '%trivia_true_false%' THEN 'OK' ELSE 'MISSING' END as tf,
--   CASE WHEN prompt_content LIKE '%trivia_who_am_i%' THEN 'OK' ELSE 'MISSING' END as wai
-- FROM public.ai_extraction_prompts
-- WHERE prompt_type = 'content_suitability_analysis'
--   AND is_active = true
-- LIMIT 1;

COMMIT;

