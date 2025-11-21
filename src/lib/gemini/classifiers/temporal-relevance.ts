import 'server-only';

import { gemini } from '../client';
import { handleGeminiError } from '../error-handler';
import { cleanJsonString } from '@/lib/content-helpers';

export type TemporalClassification = 'proper' | 'improper' | 'needs_review';

export interface TemporalClassificationResult {
  success: boolean;
  classification?: TemporalClassification;
  confidence?: 'high' | 'medium' | 'low';
  reasoning?: string;
  error?: string;
}

export interface TemporalClassificationRequest {
  questionText: string;
  sourceContentDate: string | null; // ISO date string of when source was published/created
  currentYear: number; // Current year (2025)
}

/**
 * Classify a trivia question's temporal relevance using Gemini
 * Determines if question is proper (timeless/relevant), improper (outdated), or needs review
 */
export async function classifyTemporalRelevance(
  request: TemporalClassificationRequest,
): Promise<TemporalClassificationResult> {
  try {
    const { questionText, sourceContentDate, currentYear } = request;

    if (!questionText?.trim()) {
      return {
        success: false,
        error: 'Question text is required.',
      };
    }

    // Build context about the source date
    let sourceDateContext = '';
    if (sourceContentDate) {
      const sourceDate = new Date(sourceContentDate);
      const sourceYear = sourceDate.getFullYear();
      const yearsAgo = currentYear - sourceYear;
      sourceDateContext = `\n\nSource Content Date: ${sourceYear} (${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago)`;
    }

    const classificationPrompt = `You are analyzing a hockey trivia question for temporal relevance. Determine if this question is suitable for publication in ${currentYear}.

Question: "${questionText}"${sourceDateContext}

Classification Rules:
- **PROPER**: Question is timeless, historically accurate, or uses past tense correctly. Examples:
  - "Who won the Stanley Cup in 2020?" (historical fact, always valid)
  - "Which player scored the most goals in the 2019-2020 season?" (specific historical period)
  - "Wayne Gretzky played for which team?" (historical fact)
  
- **IMPROPER**: Question references outdated information as if it's current, or uses present tense for past events. Examples:
  - "How many goals did Player X score this year?" when source is from 2020 (should say "in 2020")
  - "Player A and Player B currently play on the same line" when source is 5 years old
  - "This season's leading scorer is..." when referring to a past season
  - Questions phrased as if we're still in the source year (e.g., "in 2020" when source is from 2020 and we're in 2025)
  - Questions containing phrases like "at the time the article was written", "at the time of writing", "when this article was published", or similar temporal references that tie the question to the article's publication date
  - **Meta-referential questions**: Questions that test knowledge about what was written in the article rather than factual hockey knowledge. These require reading the source article to answer, which defeats the purpose of trivia. Examples:
    - "Which team was said to have inconsistent goaltending?" (testing what the article said, not facts)
    - "According to the article, which player..." (meta-reference to the article)
    - "What was mentioned about..." (testing article content, not hockey facts)
    - Questions using phrases like "was said to", "according to", "was described as", "was noted for" when referring to article content rather than established facts

- **NEEDS_REVIEW**: Ambiguous cases that require human judgment. Examples:
  - Questions about player relationships that may have changed
  - Questions with unclear temporal references
  - Edge cases where classification is uncertain

Respond in JSON format:
{
  "classification": "proper" | "improper" | "needs_review",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Brief explanation of why this classification was chosen"
}`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: classificationPrompt }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = result.text;
    if (!text) {
      return { success: false, error: 'Gemini returned an empty response.' };
    }

    let parsed: any;
    try {
      const cleanText = cleanJsonString(text);
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      const errorMsg =
        parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return {
        success: false,
        error: `Failed to parse Gemini response: ${errorMsg}. Response: ${text.substring(0, 200)}`,
      };
    }

    // Validate classification (case-insensitive)
    const validClassifications: TemporalClassification[] = ['proper', 'improper', 'needs_review'];
    const rawClassification = String(parsed.classification || '').toLowerCase().trim();
    const classification = validClassifications.find((c) => c === rawClassification);
    
    if (!classification) {
      return {
        success: false,
        error: `Invalid classification: ${parsed.classification}. Expected one of: ${validClassifications.join(', ')}`,
      };
    }

    // Validate confidence (case-insensitive)
    const validConfidences = ['high', 'medium', 'low'];
    const rawConfidence = String(parsed.confidence || '').toLowerCase().trim();
    const confidence = validConfidences.find((c) => c === rawConfidence) as 'high' | 'medium' | 'low' | undefined;
    
    if (!confidence) {
      return {
        success: false,
        error: `Invalid confidence: ${parsed.confidence}. Expected one of: ${validConfidences.join(', ')}`,
      };
    }

    return {
      success: true,
      classification,
      confidence,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    const errorResult = handleGeminiError(error);
    return {
      success: false,
      error: errorResult.error || 'Classification failed',
    };
  }
}

