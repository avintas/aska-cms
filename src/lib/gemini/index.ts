// Client
export { gemini } from './client';

// Error Handler
export { handleGeminiError } from './error-handler';

// Generators - Trivia
export {
  generateMultipleChoice,
  type MultipleChoiceGenerationRequest,
  type MultipleChoiceGenerationResponse,
} from './generators/multiple-choice';

export {
  generateTrueFalse,
  type TrueFalseGenerationRequest,
  type TrueFalseGenerationResponse,
} from './generators/true-false';

export {
  generateWhoAmI,
  type WhoAmIGenerationRequest,
  type WhoAmIGenerationResponse,
} from './generators/who-am-i';

// Generators - Collections
export {
  generateStatsContent,
  type StatsGenerationRequest,
  type StatsGenerationResponse,
} from './generators/stats';

export {
  generateMotivationalContent,
  type MotivationalGenerationRequest,
  type MotivationalGenerationResponse,
} from './generators/motivational';

export {
  generateGreetingsContent,
  type GreetingsGenerationRequest,
  type GreetingsGenerationResponse,
} from './generators/greetings';

export {
  generateWisdomContent,
  type WisdomGenerationRequest,
  type WisdomGenerationResponse,
} from './generators/wisdom';


