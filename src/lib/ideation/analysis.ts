import 'server-only';

import { gemini } from '@/lib/gemini/client';
import { handleGeminiError } from '@/lib/gemini/error-handler';
import { getAnalysisPrompt } from './prompts';

export interface IdeationAnalysisInput {
  summaries: string[];
  analysisType: 'pattern-discovery' | 'quality-scan' | 'opportunity-scan';
  promptOverride?: string;
}

export interface IdeationInsight {
  heading: string;
  detail: string;
  recommendations?: string[];
}

export interface IdeationAnalysisResult {
  success: boolean;
  insights: IdeationInsight[];
  raw?: unknown;
  error?: string;
}

export async function runIdeationAnalysis(
  input: IdeationAnalysisInput,
): Promise<IdeationAnalysisResult> {
  const basePrompt = input.promptOverride ?? (await getAnalysisPrompt());
  if (!basePrompt) {
    return {
      success: false,
      insights: [],
      error: 'No analysis prompt configured. Please add an active prompt in Prompts Library.',
    };
  }

  const prompt = `${basePrompt.trim()}

Analysis Type: ${input.analysisType}
Provide insights in JSON with the following structure:
{
  "insights": [
    {
      "heading": "Short title",
      "detail": "Detailed explanation",
      "recommendations": ["Optional actionable items"]
    }
  ]
}

Source Summaries:
${input.summaries.map((summary, idx) => `(${idx + 1}) ${summary}`).join('\n\n')}`;

  try {
    const result = await gemini.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const text = result.text;
    if (!text) {
      return { success: false, insights: [], error: 'Gemini returned an empty response.' };
    }

    const parsed = JSON.parse(text) as { insights?: IdeationInsight[] };
    return {
      success: true,
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      raw: parsed,
    };
  } catch (error) {
    const handled = handleGeminiError(error);
    return {
      success: false,
      insights: [],
      error: handled.error,
    };
  }
}
