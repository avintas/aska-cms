import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '@/lib/gemini/client';
import { cleanJsonString } from '@/lib/content-helpers';
import {
  validateEnrichedContent,
  validateExtractedMetadata,
  validateContentSuitabilityAnalysis,
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
    const { valid, errors, value } = validateExtractedMetadata(parsed);
    if (!valid || !value) {
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


