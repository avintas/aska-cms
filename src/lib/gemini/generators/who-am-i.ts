/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../client';
import type { TriviaQuestion } from '@/lib/types';
import { cleanJsonString, parseJsonWithRepair } from '@/lib/content-helpers';
import { handleGeminiError } from '../error-handler';

export interface WhoAmIGenerationRequest {
  sourceContent: string;
  customPrompt: string;
}

export interface WhoAmIGenerationResponse {
  success: boolean;
  data?: TriviaQuestion[];
  error?: string;
}

export async function generateWhoAmI(
  request: WhoAmIGenerationRequest,
): Promise<WhoAmIGenerationResponse> {
  try {
    const { sourceContent, customPrompt } = request;

    if (!sourceContent?.trim() || !customPrompt?.trim()) {
      return {
        success: false,
        error: 'Source content and prompt are required.',
      };
    }

    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${customPrompt}\n\nSource Content:\n${sourceContent}` }],
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

    // Use improved JSON parsing with repair attempts
    const parseResult = parseJsonWithRepair(text);
    if (!parseResult.success) {
      // eslint-disable-next-line no-console
      console.error('JSON parse error in Who Am I generation:', parseResult.error);
      return {
        success: false,
        error: `Failed to parse AI response: ${parseResult.error}`,
      };
    }

    const parsedResponse = parseResult.data as { items?: unknown[] };
    if (!parsedResponse || !Array.isArray(parsedResponse.items)) {
      return {
        success: false,
        error: 'The AI returned an invalid format or was missing the "items" array.',
      };
    }

    const finalData: TriviaQuestion[] = parsedResponse.items.map((item: any) => ({
      question_type: 'who-am-i',
      question_text: item.question_text || '',
      correct_answer: item.correct_answer || '',
      wrong_answers: [], // Always empty for Who Am I
      explanation: item.explanation || '',
      theme: item.theme || '',
      category: item.category || null,
    }));

    return {
      success: true,
      data: finalData,
    };
  } catch (error) {
    const errorResult = handleGeminiError(error);
    return errorResult;
  }
}


