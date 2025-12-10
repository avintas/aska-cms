import 'server-only';

import { type TriviaQuestion } from '@/lib/types';
import { generateGreetingsContent } from '@/lib/gemini/generators/greetings';
import { generateMotivationalContent } from '@/lib/gemini/generators/motivational';
import {
  generateMultipleChoice,
  type MultipleChoiceGenerationResponse,
} from '@/lib/gemini/generators/multiple-choice';
import { generateFactsContent } from '@/lib/gemini/generators/facts';
import {
  generateTrueFalse,
  type TrueFalseGenerationResponse,
} from '@/lib/gemini/generators/true-false';
import {
  generateWhoAmI,
  type WhoAmIGenerationResponse,
} from '@/lib/gemini/generators/who-am-i';
import { generateWisdomContent } from '@/lib/gemini/generators/wisdom';
import type {
  FactCreateInput,
  GreetingCreateInput,
  MotivationalCreateInput,
  MultipleChoiceTriviaCreateInput,
  TrueFalseTriviaCreateInput,
  WhoAmITriviaCreateInput,
  WisdomCreateInput,
} from '@aska/shared';
import { validateMultipleChoiceTriviaInput } from '@aska/shared';

import type {
  GeneratorTrackCreateMap,
  GeneratorTrackRegistry,
  GeneratorValidationResult,
} from './types';

const DEFAULT_STATUS: GeneratorTrackCreateMap[keyof GeneratorTrackCreateMap]['status'] = 'draft';

function coerceString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function coerceNullableString(value: unknown): string | undefined {
  const str = coerceString(value);
  return str ?? undefined;
}

function coerceStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
  return items.length > 0 ? items : null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function coerceBooleanFromText(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 't' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === 'f' || normalized === 'no') {
      return false;
    }
  }
  return null;
}

function validateRequiredStrings(
  fields: Array<{ value: string | null; label: string }>,
): GeneratorValidationResult {
  const errors = fields
    .filter((field) => !field.value)
    .map((field) => `${field.label} is required`);
  return { valid: errors.length === 0, errors };
}

function normalizeWisdomItem(item: Record<string, unknown>, _sourceId?: number | null): WisdomCreateInput | null {
  const title =
    coerceString(item.title) ??
    coerceString(item.content_title) ??
    coerceString(item.heading) ??
    'Untitled wisdom';
  const musing =
    coerceString(item.musing) ??
    coerceString(item.musings) ??
    coerceString(item.body) ??
    coerceString(item.content_text) ??
    null;
  const fromTheBox =
    coerceString(item.from_the_box) ??
    coerceString(item.pull_quote) ??
    coerceString(item.highlight) ??
    coerceString(item.quote) ??
    null;

  if (!musing || !fromTheBox) {
    return null;
  }

  return {
    title,
    musing,
    from_the_box: fromTheBox,
    theme: coerceNullableString(item.theme),
    category: coerceNullableString(item.category),
    attribution: coerceNullableString(item.attribution),
    status: DEFAULT_STATUS,
    source_content_id: typeof _sourceId === 'number' && Number.isFinite(_sourceId) ? _sourceId : undefined,
  };
}

function normalizeGreetingItem(item: Record<string, unknown>, _sourceId?: number | null): GreetingCreateInput | null {
  // Debug: Log what we're receiving
  // eslint-disable-next-line no-console
  console.log('normalizeGreetingItem - received item:', {
    hasGreetingText: !!item.greeting_text,
    hasContentText: !!item.content_text,
    contentTextValue: item.content_text,
    allKeys: Object.keys(item),
  });

  const message =
    coerceString(item.greeting_text) ??
    coerceString(item.content_text) ?? // Gemini often returns content_text
    coerceString(item.message) ??
    coerceString(item.text) ??
    coerceString(item.copy) ??
    null;

  // eslint-disable-next-line no-console
  console.log('normalizeGreetingItem - message result:', message);

  if (!message) {
    return null;
  }
  return {
    greeting_text: message,
    attribution: coerceNullableString(item.attribution),
    status: DEFAULT_STATUS,
    source_content_id: typeof _sourceId === 'number' && Number.isFinite(_sourceId) ? _sourceId : undefined,
  };
}

function normalizeMotivationalItem(item: Record<string, unknown>, _sourceId?: number | null): MotivationalCreateInput | null {
  // Debug: Log what we're receiving
  // eslint-disable-next-line no-console
  console.log('normalizeMotivationalItem - received item:', {
    hasQuote: !!item.quote,
    hasContentText: !!item.content_text,
    contentTextValue: item.content_text,
    allKeys: Object.keys(item),
  });

  const quote =
    coerceString(item.quote) ??
    coerceString(item.content_text) ?? // Gemini often returns content_text
    coerceString(item.musing) ??
    coerceString(item.text) ??
    coerceString(item.content) ??
    null;

  // eslint-disable-next-line no-console
  console.log('normalizeMotivationalItem - quote result:', quote);

  if (!quote) {
    return null;
  }
  return {
    quote,
    // Note: author and context fields removed - database schema does not have these columns
    // Attribution can be used instead if author information is needed
    theme: coerceNullableString(item.theme),
    category: coerceNullableString(item.category),
    attribution: coerceNullableString(item.author) ?? coerceNullableString(item.attribution),
    status: DEFAULT_STATUS,
    source_content_id: typeof _sourceId === 'number' && Number.isFinite(_sourceId) ? _sourceId : undefined,
  };
}

function normalizeMultipleChoiceItem(
  item: TriviaQuestion,
  sourceId?: number | null,
): MultipleChoiceTriviaCreateInput | null {
  if (!item) {
    return null;
  }

  const questionText = coerceString(item.question_text) ?? null;
  const correctAnswer = coerceString(item.correct_answer) ?? null;
  const wrongAnswers = Array.isArray(item.wrong_answers)
    ? item.wrong_answers
        .map((answer) => coerceString(answer) ?? '')
        .filter((answer) => answer.length > 0)
    : [];

  if (!questionText || !correctAnswer || wrongAnswers.length !== 3) {
    return null;
  }

  const input: MultipleChoiceTriviaCreateInput = {
    question_text: questionText,
    correct_answer: correctAnswer,
    wrong_answers: wrongAnswers,
    explanation: coerceNullableString(item.explanation) ?? null,
    category: coerceNullableString(item.category) ?? null,
    theme: coerceNullableString(item.theme) ?? null,
    difficulty: item.difficulty ?? null,
    tags: coerceStringArray((item as unknown as Record<string, unknown>).tags) ?? null,
    attribution: coerceNullableString((item as unknown as Record<string, unknown>).attribution) ?? null,
    status: DEFAULT_STATUS,
    source_content_id: typeof sourceId === 'number' && Number.isFinite(sourceId) ? sourceId : null,
  };

  const validation = validateMultipleChoiceTriviaInput(input);
  if (!validation.valid) {
    return null;
  }

  return input;
}

function normalizeTrueFalseItem(
  item: TriviaQuestion,
  sourceId?: number | null,
): TrueFalseTriviaCreateInput | null {
  if (!item) {
    return null;
  }
  const questionText = coerceString(item.question_text) ?? null;
  const boolAnswer = coerceBooleanFromText(item.correct_answer);
  if (!questionText || boolAnswer === null) {
    return null;
  }

  return {
    question_text: questionText,
    is_true: boolAnswer,
    explanation: coerceNullableString(item.explanation) ?? null,
    category: coerceNullableString(item.category) ?? null,
    theme: coerceNullableString(item.theme) ?? null,
    difficulty: item.difficulty ?? null,
    tags: coerceStringArray((item as unknown as Record<string, unknown>).tags) ?? null,
    attribution: coerceNullableString((item as unknown as Record<string, unknown>).attribution) ?? null,
    status: DEFAULT_STATUS,
    source_content_id: typeof sourceId === 'number' && Number.isFinite(sourceId) ? sourceId : null,
  };
}

function normalizeWhoAmIItem(
  item: TriviaQuestion,
  sourceId?: number | null,
): WhoAmITriviaCreateInput | null {
  if (!item) {
    return null;
  }
  const questionText = coerceString(item.question_text) ?? null;
  const correctAnswer = coerceString(item.correct_answer) ?? null;
  if (!questionText || !correctAnswer) {
    return null;
  }

  return {
    question_text: questionText,
    correct_answer: correctAnswer,
    explanation: coerceNullableString(item.explanation) ?? null,
    category: coerceNullableString(item.category) ?? null,
    theme: coerceNullableString(item.theme) ?? null,
    difficulty: item.difficulty ?? null,
    tags: coerceStringArray((item as unknown as Record<string, unknown>).tags) ?? null,
    attribution: coerceNullableString((item as unknown as Record<string, unknown>).attribution) ?? null,
    status: DEFAULT_STATUS,
    source_content_id: typeof sourceId === 'number' && Number.isFinite(sourceId) ? sourceId : null,
  };
}

function validateTrueFalseInput(
  input: TrueFalseTriviaCreateInput,
): GeneratorValidationResult {
  return validateRequiredStrings([
    { value: input.question_text, label: 'question_text' },
  ]);
}

function validateWhoAmIInput(input: WhoAmITriviaCreateInput): GeneratorValidationResult {
  return validateRequiredStrings([
    { value: input.question_text, label: 'question_text' },
    { value: input.correct_answer, label: 'correct_answer' },
  ]);
}

function validateWisdomInput(input: WisdomCreateInput): GeneratorValidationResult {
  return validateRequiredStrings([
    { value: input.title, label: 'title' },
    { value: input.musing, label: 'musing' },
    { value: input.from_the_box, label: 'from_the_box' },
  ]);
}

function validateGreetingInput(input: GreetingCreateInput): GeneratorValidationResult {
  return validateRequiredStrings([{ value: input.greeting_text, label: 'greeting_text' }]);
}

function validateMotivationalInput(
  input: MotivationalCreateInput,
): GeneratorValidationResult {
  return validateRequiredStrings([{ value: input.quote, label: 'quote' }]);
}

function normalizeFactItem(item: Record<string, unknown>, _sourceId?: number | null): FactCreateInput | null {
  // Debug: Log what we're receiving
  // eslint-disable-next-line no-console
  console.log('normalizeFactItem - received item:', {
    hasFactText: !!item.fact_text,
    hasContentText: !!item.content_text,
    contentTextValue: item.content_text,
    allKeys: Object.keys(item),
  });

  const factText =
    coerceString(item.fact_text) ??
    coerceString(item.content_text) ?? // Gemini often returns content_text
    coerceString(item.fact) ??
    coerceString(item.statement) ??
    coerceString(item.summary) ??
    null;

  // eslint-disable-next-line no-console
  console.log('normalizeFactItem - factText result:', factText);

  if (!factText) {
    return null;
  }
  const factValue = coerceNullableString(item.fact_value) ?? coerceNullableString(item.value);
  const factCategory =
    coerceNullableString(item.fact_category) ?? coerceNullableString(item.category);
  const year =
    coerceNumber(item.year) ??
    coerceNumber(item.season) ??
    coerceNumber(item.fact_year) ??
    null;

  return {
    fact_text: factText,
    fact_value: factValue,
    fact_category: factCategory,
    year: year ?? undefined,
    theme: coerceNullableString(item.theme),
    category: coerceNullableString(item.category),
    // Note: attribution is NOT included - collection_hockey_facts table does not have this column
    status: DEFAULT_STATUS,
    source_content_id: typeof _sourceId === 'number' && Number.isFinite(_sourceId) ? _sourceId : undefined,
  };
}

function validateFactInput(input: FactCreateInput): GeneratorValidationResult {
  return validateRequiredStrings([{ value: input.fact_text, label: 'fact_text' }]);
}

export const generatorTracks: GeneratorTrackRegistry = {
  wisdom: {
    key: 'wisdom',
    label: 'Wisdom',
    shortLabel: 'Wisdom',
    description: 'Penalty Box Philosopher musings ready for shareable storytelling.',
    promptType: 'generator_wisdom',
    targetTable: 'collection_hockey_wisdom',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateWisdomContent(args),
      normalize: normalizeWisdomItem,
      validate: validateWisdomInput,
    },
    promptSummary: {
      label: 'Penalty Box Philosopher template',
      description: 'Creates 2-3 musings plus a “from the box” quote rooted in the staged source.',
      preview: `System:\nYou are the Penalty Box Philosopher converting hockey insights into sharable wisdom.\n\nOutput:\n- 2-3 numbered musings (1-2 sentences each) grounded in the provided content.\n- A “from the box” rally line that ties the insight to game-time perspective.\n- Keep it factual, avoid embellishment.`,
    },
  },
  greetings: {
    key: 'greetings',
    label: 'Greetings',
    shortLabel: 'H.U.G.s',
    description: 'Supportive Hockey Universal Greetings for the community.',
    promptType: 'generator_greetings',
    targetTable: 'collection_greetings',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateGreetingsContent(args),
      normalize: normalizeGreetingItem,
      validate: validateGreetingInput,
    },
    promptSummary: {
      label: 'H.U.G. note',
      description: 'Crafts concise, inclusive Hockey Universal Greetings anchored in the source.',
      preview: `System:\nGenerate 2 short greeting messages inspired by the source content.\nEach message:\n- 1-2 sentences, warm and supportive.\n- References hockey culture subtly.\n- Avoids repetition and keeps tone inclusive.`,
    },
  },
  motivational: {
    key: 'motivational',
    label: 'Motivational',
    shortLabel: 'Motivation',
    description: 'Locker room ready motivation with quick share appeal.',
    promptType: 'generator_motivational',
    targetTable: 'collection_hockey_motivate',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateMotivationalContent(args),
      normalize: normalizeMotivationalItem,
      validate: validateMotivationalInput,
    },
    promptSummary: {
      label: 'Locker room motivation',
      description: 'Produces punchy motivational quotes with optional author/context lines.',
      preview: `System:\nCreate 2 motivational quotes derived from the source.\nEach quote includes:\n- Quote text (1 sentence).\n- Optional author/context lines when available.\nKeep language energetic and authentic.`,
    },
  },
  facts: {
    key: 'facts',
    label: 'Facts',
    shortLabel: 'Facts',
    description: 'Snackable fact nuggets anchored in authentic hockey data.',
    promptType: 'generator_facts',
    targetTable: 'collection_hockey_facts',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateFactsContent(args),
      normalize: normalizeFactItem,
      validate: validateFactInput,
    },
    promptSummary: {
      label: 'Fact nugget',
      description: 'Extracts numerical highlights and supporting context ready for social sharing.',
      preview: `System:\nIdentify 2-3 fact nuggets from the source.\nEach nugget should include:\n- A leading sentence summarizing the number.\n- Optional supporting context (team, season, comparison).\nEnsure accuracy and cite numbers from the source only.`,
    },
  },
  trivia_multiple_choice: {
    key: 'trivia_multiple_choice',
    label: 'Trivia (Multiple Choice)',
    shortLabel: 'Trivia MCQ',
    description: 'Four-option trivia with explanation and difficulty cues.',
    promptType: 'generator_trivia_multiple_choice',
    targetTable: 'trivia_multiple_choice',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateMultipleChoice(args),
      normalize: normalizeMultipleChoiceItem,
      validate: (input): GeneratorValidationResult => {
        const result = validateMultipleChoiceTriviaInput(input);
        return {
          valid: result.valid,
          errors: result.errors,
        };
      },
    },
    promptSummary: {
      label: 'Multiple-choice builder',
      description: 'Generates four-option trivia questions with wrong answers and explanations.',
      preview: `System:\nFrom the source, create multiple-choice trivia entries.\nEach entry contains:\n- question_text\n- correct_answer\n- three distinct wrong_answers\n- explanation\n- optional theme/category/difficulty when evident.`,
    },
  },
  trivia_true_false: {
    key: 'trivia_true_false',
    label: 'Trivia (True / False)',
    shortLabel: 'Trivia T/F',
    description: 'Quick hit true or false questions with optional context.',
    promptType: 'generator_trivia_true_false',
    targetTable: 'trivia_true_false',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateTrueFalse(args),
      normalize: normalizeTrueFalseItem,
      validate: validateTrueFalseInput,
    },
    promptSummary: {
      label: 'True/False builder',
      description: 'Produces rapid-fire statements tagged as true or false with explanations.',
      preview: `System:\nUsing the source, craft true/false trivia items.\nEach item includes:\n- question_text (statement)\n- correct_answer (true/false)\n- explanation referencing the source.`,
    },
  },
  trivia_who_am_i: {
    key: 'trivia_who_am_i',
    label: 'Trivia (Who Am I?)',
    shortLabel: 'Trivia Who Am I',
    description: 'Riddle-style reveals for player or team identities.',
    promptType: 'generator_trivia_who_am_i',
    targetTable: 'trivia_who_am_i',
    defaultStatus: 'draft',
    adapter: {
      run: (args) => generateWhoAmI(args),
      normalize: normalizeWhoAmIItem,
      validate: validateWhoAmIInput,
    },
    promptSummary: {
      label: 'Who Am I riddle',
      description: 'Builds multi-clue riddles culminating in a single correct identity.',
      preview: `System:\nGenerate "Who Am I" riddles from the source content.\nEach riddle should include:\n- question_text with 3-4 escalating clues.\n- correct_answer naming the person/team.
- Optional explanation clarifying the reveal.`,
    },
  },
};

export type GeneratorTrackKeyList = keyof typeof generatorTracks;


