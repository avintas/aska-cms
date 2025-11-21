/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../client';
import { cleanJsonString } from '@/lib/content-helpers';
import { handleGeminiError } from '../error-handler';

export interface MotivationalGenerationRequest {
  sourceContent: string;
  customPrompt: string;
}

export interface MotivationalGenerationResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}

export async function generateMotivationalContent(
  request: MotivationalGenerationRequest,
): Promise<MotivationalGenerationResponse> {
  try {
    const { sourceContent, customPrompt } = request;

    if (!sourceContent?.trim()) {
      return {
        success: false,
        error: 'Source content is required',
      };
    }

    if (!customPrompt?.trim()) {
      return {
        success: false,
        error: 'AI Prompt is required. Please load a prompt from the Prompts Library.',
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
      return {
        success: false,
        error: 'Gemini returned empty response',
      };
    }

    const cleanText = cleanJsonString(text);
    const parsedResponse = JSON.parse(cleanText);

    if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
      return {
        success: false,
        error: 'The AI response is missing the required "items" array.',
      };
    }

    const finalData = parsedResponse.items.map((item: any) => ({
      ...item,
      content_type: 'motivational',
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


