export interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  processing: boolean;
}

export interface ProcessingResult {
  originalText: string;
  processedText: string;
  steps: ProcessingStep[];
  wordCount: number;
  charCount: number;
  processingTime: number;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'line-endings',
    name: 'Normalize line endings',
    description: 'Convert \\r\\n to \\n (Windows to Unix)',
    completed: false,
    processing: false,
  },
  {
    id: 'remove-decorators',
    name: 'Remove visual decorators',
    description: "Bullets, boxes, arrows (AI doesn't need them)",
    completed: false,
    processing: false,
  },
  {
    id: 'remove-unicode',
    name: 'Clean invisible characters',
    description: 'Zero-width spaces, byte order marks',
    completed: false,
    processing: false,
  },
  {
    id: 'smart-quotes',
    name: 'Normalize quotes',
    description: '"curly" to "straight" quotes',
    completed: false,
    processing: false,
  },
  {
    id: 'normalize-caps',
    name: 'Normalize capitalization',
    description: 'Title case (preserve acronyms)',
    completed: false,
    processing: false,
  },
  {
    id: 'join-sentences',
    name: 'Join broken sentences',
    description: 'Create continuous text flow',
    completed: false,
    processing: false,
  },
  {
    id: 'fix-spacing',
    name: 'Fix spacing issues',
    description: 'Double spaces, space before punctuation',
    completed: false,
    processing: false,
  },
  {
    id: 'final-cleanup',
    name: 'Final cleanup',
    description: 'Trim edges, normalize whitespace',
    completed: false,
    processing: false,
  },
];

export function processText(text: string): Promise<ProcessingResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let processedText = text;
    const steps = PROCESSING_STEPS.map((step) => ({ ...step }));

    // Process each step with a small delay for visual feedback
    const processStep = async (stepIndex: number): Promise<void> => {
      if (stepIndex >= steps.length) {
        const endTime = Date.now();
        const wordCount = processedText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        const charCount = processedText.length;

        resolve({
          originalText: text,
          processedText,
          steps,
          wordCount,
          charCount,
          processingTime: endTime - startTime,
        });
        return;
      }

      const step = steps[stepIndex];
      step.processing = true;

      // Simulate processing time for visual feedback
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));

      // Apply the actual processing
      switch (step.id) {
        case 'line-endings':
          processedText = processedText.replace(/\r\n/g, '\n');
          break;

        case 'remove-decorators':
          // Remove bullets and replace with period for sentence separation
          processedText = processedText.replace(/[•●○◦▪▫]/g, '. ');
          // Remove boxes, arrows, and other visual elements
          processedText = processedText.replace(/[□■◻◼►▸▹◄◂]/g, '');
          // Remove em dashes and en dashes (replace with regular dash)
          processedText = processedText.replace(/[—–]/g, '-');
          // Remove pipes, broken bars, and vertical separators
          processedText = processedText.replace(/[¦|]/g, ' ');
          // Remove other common decorative characters
          processedText = processedText.replace(/[†‡§¶]/g, '');
          break;

        case 'remove-unicode':
          // Remove zero-width spaces and joiners
          processedText = processedText.replace(/[\u200B-\u200D\uFEFF]/g, '');
          // Remove byte order marks
          processedText = processedText.replace(/\uFEFF/g, '');
          // Remove soft hyphens
          processedText = processedText.replace(/\u00AD/g, '');
          break;

        case 'smart-quotes':
          processedText = processedText
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/[«»]/g, '"')
            .replace(/[‹›]/g, "'");
          break;

        case 'normalize-caps':
          // Smart capitalization: preserve acronyms (2-4 consecutive caps) but normalize long runs of caps
          processedText = processedText.replace(/\b([A-Z]{5,})\b/g, (match) => {
            return match.charAt(0) + match.slice(1).toLowerCase();
          });
          break;

        case 'join-sentences':
          // Remove ALL line breaks, replace with spaces for continuous text flow
          processedText = processedText.replace(/\n+/g, ' ');
          break;

        case 'fix-spacing':
          // Fix double spaces
          processedText = processedText.replace(/\s{2,}/g, ' ');
          // Remove space before punctuation
          processedText = processedText.replace(/\s+([.,!?;:])/g, '$1');
          // Ensure space after punctuation (but not in numbers like 1,234)
          processedText = processedText.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');
          // Fix multiple periods (ellipsis)
          processedText = processedText.replace(/\.{4,}/g, '...');
          break;

        case 'final-cleanup':
          // Trim leading/trailing spaces
          processedText = processedText.trim();
          // Fix multiple consecutive periods from bullet removal
          processedText = processedText.replace(/\.{2,}\s/g, '. ');
          // Remove any remaining double spaces
          processedText = processedText.replace(/\s{2,}/g, ' ');
          break;
      }

      step.processing = false;
      step.completed = true;

      // Process next step
      processStep(stepIndex + 1);
    };

    // Start processing
    processStep(0);
  });
}

export function getInitialSteps(): ProcessingStep[] {
  return PROCESSING_STEPS.map((step) => ({ ...step }));
}

export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};


