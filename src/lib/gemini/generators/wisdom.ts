/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../client';
import { cleanJsonString } from '@/lib/content-helpers';
import { handleGeminiError } from '../error-handler';

export interface WisdomGenerationRequest {
  sourceContent: string;
  customPrompt: string;
}

export interface WisdomGenerationResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}

export async function generateWisdomContent(
  request: WisdomGenerationRequest,
): Promise<WisdomGenerationResponse> {
  const { sourceContent, customPrompt } = request;

  if (!sourceContent || !customPrompt) {
    return {
      success: false,
      error: 'Source content and custom prompt are required.',
    };
  }

  try {
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
        error: 'The AI failed to generate a response.',
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
      content_type: 'wisdom',
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


