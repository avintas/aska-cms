import 'server-only';
import { GoogleGenAI } from '@google/genai';

/**
 * Server-only Gemini client.
 * Reads the API key from GEMINI_API_KEY (preferred) or GOOGLE_GENERATIVE_AI_API_KEY.
 */
const apiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

if (!apiKey) {
  // Warn once at module load to aid configuration without crashing importers.
  // Callers should still defensively handle missing key scenarios.
  // eslint-disable-next-line no-console
  console.warn(
    'Gemini API key is not configured. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.',
  );
}

export const gemini = new GoogleGenAI({
  apiKey,
});


