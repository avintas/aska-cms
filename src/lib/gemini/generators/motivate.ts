/* eslint-disable @typescript-eslint/no-explicit-any */
import { gemini } from '../client';
import { cleanJsonString } from '@/lib/content-helpers';
import { handleGeminiError } from '../error-handler';

export interface MotivateGenerationRequest {
  sourceContent: string;
  customPrompt: string;
  articleDate?: string | null;
}

export interface MotivateGenerationResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}

export async function generateMotivateContent(
  request: MotivateGenerationRequest,
): Promise<MotivateGenerationResponse> {
  try {
    const { sourceContent, customPrompt, articleDate } = request;

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

    // Process prompt placeholders
    let processedPrompt = customPrompt;
    
    // Replace {{ARTICLE_DATE}} with actual date or current date
    const dateToUse = articleDate 
      ? new Date(articleDate).toISOString().split('T')[0] // Format as YYYY-MM-DD
      : new Date().toISOString().split('T')[0];
    processedPrompt = processedPrompt.replace(/\{\{ARTICLE_DATE\}\}/g, dateToUse);
    
    // Replace {{PASTE_YOUR_CONTENT_HERE}} with source content
    processedPrompt = processedPrompt.replace(/\{\{PASTE_YOUR_CONTENT_HERE\}\}/g, sourceContent);
    
    // Also handle <source_text> tags if present (for backward compatibility)
    processedPrompt = processedPrompt.replace(/<source_text>/g, sourceContent);
    processedPrompt = processedPrompt.replace(/<\/source_text>/g, '');
    
    // If no placeholders were found, append source content at the end (backward compatibility)
    if (!processedPrompt.includes(sourceContent)) {
      processedPrompt = `${processedPrompt}\n\n<source_text>\n${sourceContent}\n</source_text>`;
    }

    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: processedPrompt }],
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

