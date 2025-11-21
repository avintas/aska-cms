/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../client';
import type { TriviaQuestion } from '@/lib/types';
import { cleanJsonString } from '@/lib/content-helpers';
import { handleGeminiError } from '../error-handler';

export interface MultipleChoiceGenerationRequest {
  sourceContent: string;
  customPrompt: string;
}

export interface MultipleChoiceGenerationResponse {
  success: boolean;
  data?: TriviaQuestion[];
  error?: string;
}

export async function generateMultipleChoice(
  request: MultipleChoiceGenerationRequest,
): Promise<MultipleChoiceGenerationResponse> {
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

    const cleanText = cleanJsonString(text);
    const parsedResponse = JSON.parse(cleanText);
    if (!parsedResponse || !Array.isArray(parsedResponse.items)) {
      return {
        success: false,
        error: 'The AI returned an invalid format or was missing the "items" array.',
      };
    }

    const finalData: TriviaQuestion[] = parsedResponse.items.map((item: any) => {
      // Normalize difficulty: convert to capitalized format (Easy, Medium, Hard)
      let difficulty: string | null = null;
      if (item.difficulty) {
        const diffLower = String(item.difficulty).toLowerCase().trim();
        if (diffLower === 'easy') difficulty = 'Easy';
        else if (diffLower === 'medium') difficulty = 'Medium';
        else if (diffLower === 'hard') difficulty = 'Hard';
      }

      return {
        question_type: 'multiple-choice',
        question_text: item.question_text || '',
        correct_answer: item.correct_answer || '',
        wrong_answers: item.wrong_answers || [],
        explanation: item.explanation || '',
        theme: item.theme || '',
        category: item.category || null,
        difficulty: (difficulty as TriviaQuestion['difficulty']) || null,
      };
    });

    return {
      success: true,
      data: finalData,
    };
  } catch (error) {
    const errorResult = handleGeminiError(error);
    return errorResult;
  }
}


