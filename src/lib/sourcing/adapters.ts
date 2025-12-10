import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '@/lib/gemini/client';
import { cleanJsonString } from '@/lib/content-helpers';
import {
  validateEnrichedContent,
  validateExtractedMetadata,
  validateContentSuitabilityAnalysis,
  getValidThemesList,
  getValidThemesWithCategories,
  type EnrichedContent,
  type ExtractedMetadata,
  type ContentSuitabilityAnalysis,
} from './validators';
import { handleGeminiError } from '@/lib/gemini/error-handler';

/**
 * Run Gemini with a DB-loaded prompt to extract metadata from processed source text.
 */
export async function extractMetadata(
  processedText: string,
  promptContent: string,
): Promise<{ success: true; data: ExtractedMetadata } | { success: false; error: string }> {
  try {
    // Ensure the prompt includes valid themes - append if not already present
    const themesList = getValidThemesList();
    const themesSection = `\n\n## Valid Themes (REQUIRED - must use exact spelling):
You MUST select one of these 13 standardized themes (use exact spelling and capitalization):
${getValidThemesWithCategories()}

IMPORTANT: The theme field must match one of the themes above EXACTLY (including capitalization and punctuation).`;

    // Check if prompt already mentions themes to avoid duplication
    // Look for indicators that themes are already listed
    const promptLower = promptContent.toLowerCase();
    const hasThemesInfo = 
      (promptLower.includes('theme') && promptLower.includes('standardized')) ||
      (promptLower.includes('13 standardized themes') || promptLower.includes('13 themes')) ||
      (promptLower.includes('players') && promptLower.includes('teams & organizations') && promptLower.includes('venues & locations'));

    const fullPrompt = `${promptContent.trim()}${hasThemesInfo ? '' : themesSection}

Source Content:
${processedText}`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
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

    const json = cleanJsonString(text);
    const parsed = JSON.parse(json) as unknown;
    
    // Log what Gemini generated for debugging
    // eslint-disable-next-line no-console
    console.log('Gemini extracted metadata (raw):', JSON.stringify(parsed, null, 2));
    
    const { valid, errors, value } = validateExtractedMetadata(parsed);
    if (!valid || !value) {
      // eslint-disable-next-line no-console
      console.error('Metadata validation failed:', {
        errors,
        receivedTheme: (parsed as Record<string, unknown>)?.theme,
        validThemes: [
          'Players',
          'Teams & Organizations',
          'Venues & Locations',
          'Awards & Honors',
          'Leadership & Staff',
          'Business & Finance',
          'Media, Broadcasting, & E-Sports',
          'Marketing, Sponsorship, and Merchandising',
          'Equipment & Technology',
          'Training, Health, & Wellness',
          'Fandom & Fan Culture',
          'Social Impact & Diversity',
          'Tactics & Advanced Analytics',
        ],
      });
      return { success: false, error: `AI output validation failed: ${errors.join('; ')}` };
    }
    return { success: true, data: value };
  } catch (error) {
    const err = handleGeminiError(error);
    return { success: false, error: err.error };
  }
}

/**
 * Run Gemini with a DB-loaded prompt to generate title and key phrases from processed source text.
 * If titleOverride is provided, it will be used instead of the AI-generated title.
 */
export async function enrichContent(
  processedText: string,
  promptContent: string,
  options?: { titleOverride?: string },
): Promise<{ success: true; data: EnrichedContent } | { success: false; error: string }> {
  try {
    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${promptContent}\n\nSource Content:\n${processedText}` }],
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

    const json = cleanJsonString(text);
    const parsed = JSON.parse(json) as unknown;
    const { valid, errors, value } = validateEnrichedContent(parsed);
    if (!valid || !value) {
      return { success: false, error: `AI output validation failed: ${errors.join('; ')}` };
    }

    return {
      success: true,
      data: {
        title: options?.titleOverride?.trim() ? options.titleOverride : value.title,
        key_phrases: value.key_phrases,
      },
    };
  } catch (error) {
    const err = handleGeminiError(error);
    return { success: false, error: err.error };
  }
}

/**
 * Run Gemini with a DB-loaded prompt to analyze content suitability for different content types.
 */
export async function analyzeContentSuitability(
  processedText: string,
  promptContent: string,
): Promise<{ success: true; data: ContentSuitabilityAnalysis } | { success: false; error: string }> {
  try {
    const fullPrompt = `${promptContent.trim()}

Source Content:
${processedText}`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
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

    const json = cleanJsonString(text);
    const parsed = JSON.parse(json) as unknown;
    const { valid, errors, value } = validateContentSuitabilityAnalysis(parsed);
    if (!valid || !value) {
      return { success: false, error: `AI output validation failed: ${errors.join('; ')}` };
    }
    return { success: true, data: value };
  } catch (error) {
    const err = handleGeminiError(error);
    return { success: false, error: err.error };
  }
}


