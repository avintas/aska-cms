import type {
  FactCreateInput,
  GreetingCreateInput,
  MotivationalCreateInput,
  MultipleChoiceTriviaCreateInput,
  TrueFalseTriviaCreateInput,
  WhoAmITriviaCreateInput,
  WisdomCreateInput,
} from '@aska/shared';
import type { PromptType } from '@/lib/prompts/repository';
import type { TriviaQuestion } from '@/lib/types';

export interface PromptSummary {
  label: string;
  description: string;
  preview: string;
}

export type GeneratorTrackKey =
  | 'wisdom'
  | 'greetings'
  | 'motivational'
  | 'facts'
  | 'trivia_multiple_choice'
  | 'trivia_true_false'
  | 'trivia_who_am_i';

export interface GeneratorRunArgs {
  sourceContent: string;
  customPrompt: string;
}

export interface GeneratorRunResult<TItem> {
  success: boolean;
  data?: TItem[];
  error?: string;
}

export interface GeneratorValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GeneratorAdapter<TRawItem, TCreateInput> {
  run: (args: GeneratorRunArgs) => Promise<GeneratorRunResult<TRawItem>>;
  normalize: (item: TRawItem, sourceId?: number | null) => TCreateInput | null;
  validate?: (input: TCreateInput) => GeneratorValidationResult;
}

export interface GeneratorTrackDefinition<TRawItem, TCreateInput> {
  key: GeneratorTrackKey;
  label: string;
  shortLabel: string;
  description: string;
  promptType: PromptType;
  targetTable: string;
  defaultStatus: 'draft' | 'published' | 'archived';
  adapter: GeneratorAdapter<TRawItem, TCreateInput>;
  promptSummary: PromptSummary;
}

export interface GeneratorTrackRawMap {
  wisdom: Record<string, unknown>;
  greetings: Record<string, unknown>;
  motivational: Record<string, unknown>;
  facts: Record<string, unknown>;
  trivia_multiple_choice: TriviaQuestion;
  trivia_true_false: TriviaQuestion;
  trivia_who_am_i: TriviaQuestion;
}

export interface GeneratorTrackCreateMap {
  wisdom: WisdomCreateInput;
  greetings: GreetingCreateInput;
  motivational: MotivationalCreateInput;
  facts: FactCreateInput;
  trivia_multiple_choice: MultipleChoiceTriviaCreateInput;
  trivia_true_false: TrueFalseTriviaCreateInput;
  trivia_who_am_i: WhoAmITriviaCreateInput;
}

export type GeneratorTrackRegistry = {
  [TKey in GeneratorTrackKey]: GeneratorTrackDefinition<
    GeneratorTrackRawMap[TKey],
    GeneratorTrackCreateMap[TKey]
  >;
};


