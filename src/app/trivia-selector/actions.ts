'use server';

import { createServerClient } from '@/utils/supabase/server';
import { classifyTemporalRelevance, type TemporalClassification } from '@/lib/gemini/classifiers/temporal-relevance';
import type { MultipleChoiceTrivia } from '@aska/shared';

export interface TriviaQuestionWithSource {
  id: number;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string | null;
  source_content_id: number | null;
  source_content_date: string | null; // created_at from source_content_ingested
}

export interface ClassificationResult {
  questionId: number;
  classification: TemporalClassification;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  success: boolean;
  error?: string;
}

export interface BatchClassificationResult {
  success: boolean;
  processed: number;
  proper: number;
  improper: number;
  needsReview: number;
  failed: number;
  results: ClassificationResult[];
  message: string;
}

/**
 * Get unpublished multiple-choice trivia questions with their source content dates
 */
export async function getUnpublishedQuestions(): Promise<{
  success: boolean;
  data?: TriviaQuestionWithSource[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Get unpublished questions (not archived)
    // Questions can have status: null, 'draft', or 'unpublished' - all are considered unpublished
    const { data: questions, error } = await supabase
      .from('trivia_multiple_choice')
      .select('id, question_text, correct_answer, wrong_answers, explanation, source_content_id')
      .or('status.is.null,status.eq.unpublished,status.eq.draft')
      .is('archived_at', null)
      .order('id', { ascending: true });

    if (error) {
      return { success: false, error: `Failed to fetch questions: ${error.message}` };
    }

    if (!questions || questions.length === 0) {
      return { success: true, data: [] };
    }

    // Get source content dates for questions that have source_content_id
    const sourceIds = questions
      .map((q: any) => q.source_content_id)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

    const sourceDatesMap = new Map<number, string | null>();
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('source_content_ingested')
        .select('id, created_at')
        .in('id', sourceIds);

      if (sources) {
        for (const source of sources) {
          sourceDatesMap.set(source.id, source.created_at);
        }
      }
    }

    // Transform to include source date
    const questionsWithSource: TriviaQuestionWithSource[] = questions.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      wrong_answers: q.wrong_answers,
      explanation: q.explanation,
      source_content_id: q.source_content_id,
      source_content_date: q.source_content_id ? sourceDatesMap.get(q.source_content_id) || null : null,
    }));

    return {
      success: true,
      data: questionsWithSource,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Get stats about unpublished questions
 */
export async function getUnpublishedStats(): Promise<{
  success: boolean;
  data?: { total: number };
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { count, error } = await supabase
      .from('trivia_multiple_choice')
      .select('*', { count: 'exact', head: true })
      .or('status.is.null,status.eq.unpublished,status.eq.draft')
      .is('archived_at', null);

    if (error) {
      return { success: false, error: `Failed to fetch stats: ${error.message}` };
    }

    return {
      success: true,
      data: { total: count ?? 0 },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Scan all unpublished questions and count how many are improper based on rule-based checks
 */
export async function scanImproperQuestions(): Promise<{
  success: boolean;
  data?: { total: number; improper: number; proper: number; ambiguous: number };
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Get all unpublished questions
    const { data: questions, error } = await supabase
      .from('trivia_multiple_choice')
      .select('id, question_text')
      .or('status.is.null,status.eq.unpublished,status.eq.draft')
      .is('archived_at', null);

    if (error) {
      return { success: false, error: `Failed to fetch questions: ${error.message}` };
    }

    if (!questions || questions.length === 0) {
      return {
        success: true,
        data: { total: 0, improper: 0, proper: 0, ambiguous: 0 },
      };
    }

    let improperCount = 0;
    let properCount = 0;
    let ambiguousCount = 0;

    for (const question of questions) {
      if (isObviousImproper(question.question_text)) {
        improperCount++;
      } else if (isObviousProper(question.question_text)) {
        properCount++;
      } else {
        ambiguousCount++;
      }
    }

    return {
      success: true,
      data: {
        total: questions.length,
        improper: improperCount,
        proper: properCount,
        ambiguous: ambiguousCount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Rule-based check for obvious proper questions
 * Returns true if question is clearly proper (timeless, historical facts)
 */
function isObviousProper(questionText: string): boolean {
  const properPatterns = [
    // Historical facts with specific years/seasons
    /\b(19|20)\d{2}\b/, // Contains a year (1900-2099)
    /\b(19|20)\d{2}-\d{2}\s*season\b/i, // Specific season (e.g., "2019-20 season")
    /\bstanley cup\b.*\b(19|20)\d{2}\b/i, // Stanley Cup with year
    /\bwon.*\b(19|20)\d{2}\b/i, // "won" with year
    /\b(19|20)\d{2}\s*stanley cup/i, // Year Stanley Cup
    
    // Historical player facts
    /\b(wayne gretzky|mario lemieux|bobby orr|gordie howe)\b/i, // Legendary players (always historical)
    
    // Past tense historical questions
    /\b(played|scored|won|lost|retired|traded)\b.*\bfor\b/i, // Past actions with "for"
    /\bwho\b.*\b(played|scored|won)\b.*\b(19|20)\d{2}\b/i, // "Who played/scored/won" with year
    
    // Established historical facts
    /\b(which team|which player)\b.*\b(19|20)\d{2}\b/i, // "Which team/player" with year
    /\bmost\b.*\b(goals|points|assists)\b.*\b(19|20)\d{2}\b/i, // "Most goals/points" with year
    
    // Historical career/role questions (timeless facts)
    /\bbefore\b.*\b(working|playing|coaching|managing)\b/i, // "Before working/playing" - historical career facts
    /\b(used to|previously)\b.*\b(play|work|cover|report)\b/i, // "Used to play/work" - past roles
    /\bdid\b.*\b(cover|report|play|work)\b.*\b(before|as|for)\b/i, // "Did cover/report/play before/as/for" - historical roles
    /\b(what|which)\b.*\b(team|player|coach)\b.*\bdid\b.*\b(cover|report|play|work)\b/i, // "What/Which team did X cover/report" - historical facts
    
    // Historical relationships and connections (timeless facts)
    /\b(was|were)\b.*\b(favorite|favourite|mentor|coach|teammate|line|partner)\b.*\bof\b/i, // "Was a favorite/mentor/coach of" - historical relationships
    /\b(favorite|favourite|mentor|coach|teammate)\b.*\bof\b/i, // "Favorite/mentor/coach of" - historical connections
    /\b(which|what)\b.*\b(coach|player|team)\b.*\b(was|were)\b.*\b(favorite|favourite|mentor)\b/i, // "Which coach was X a favorite of" - historical relationships
    /\b(played|played for|coached|coached by)\b.*\b(under|with|for)\b/i, // "Played under/with/for" - historical relationships
  ];

  const lowerText = questionText.toLowerCase();
  
  // Check if question matches any proper pattern
  return properPatterns.some((pattern) => pattern.test(questionText));
}

/**
 * Rule-based check for obvious improper questions
 * Returns true if question should be automatically archived
 */
function isObviousImproper(questionText: string): boolean {
  const improperPhrases = [
    // Temporal reference phrases
    'at the time the article was written',
    'at the time of writing',
    'when this article was published',
    'when the article was written',
    'at the time of publication',
    'when this was written',
    'at the time this article',
    'when the article was published',
    'the year prior to the time of the article',
    'prior to the time of the article',
    'before the time of the article',
    'the time of the article',
    'at the time of the article',
    'during the time of the article',
    'the year of the article',
    'the season of the article',
    // Meta-referential phrases (testing article content, not facts)
    'was said to',
    'according to the article',
    'according to this article',
    'according to the text',
    'the article said',
    'the article mentioned',
    'was described as',
    'was noted for',
    'was reported to',
    'the article described',
    'the article noted',
    'in the provided text',
    'in the text',
    'in the article',
    'in this article',
    'mentioned in the',
    'mentioned in the text',
    'mentioned in the article',
    'mentioned in this article',
    'mentioned in the provided',
    'referenced in the',
    'referenced in the text',
    'referenced in the article',
    'stated in the',
    'stated in the text',
    'stated in the article',
    // Present tense for potentially outdated info
    'currently plays',
    'currently plays for',
    'this year',
    'this season',
    'current season',
  ];

  const lowerText = questionText.toLowerCase();
  return improperPhrases.some((phrase) => lowerText.includes(phrase));
}

/**
 * Classify a single question's temporal relevance
 */
export async function classifyQuestionAction(questionId: number): Promise<ClassificationResult> {
  try {
    const supabase = await createServerClient();

    // Get question
    const { data: question, error } = await supabase
      .from('trivia_multiple_choice')
      .select('id, question_text, source_content_id')
      .eq('id', questionId)
      .maybeSingle();

    if (error || !question) {
      return {
        questionId,
        classification: 'needs_review',
        confidence: 'low',
        reasoning: 'Failed to fetch question',
        success: false,
        error: error?.message || 'Question not found',
      };
    }

    // Rule-based check: Archive obvious improper questions immediately
    if (isObviousImproper(question.question_text)) {
      // Auto-archive immediately
      await archiveQuestionAction(questionId);
      
      return {
        questionId,
        classification: 'improper',
        confidence: 'high',
        reasoning: 'Contains temporal reference phrase or meta-referential language - automatically archived',
        success: true,
      };
    }

    // Rule-based check: Auto-publish obvious proper questions immediately
    if (isObviousProper(question.question_text)) {
      // Auto-publish immediately
      await updateQuestionStatusAction(questionId, 'published');
      
      return {
        questionId,
        classification: 'proper',
        confidence: 'high',
        reasoning: 'Contains historical fact with specific year/season or established historical reference - automatically published',
        success: true,
      };
    }

    // Get source content date if source_content_id exists
    let sourceDate: string | null = null;
    if (question.source_content_id) {
      const { data: source } = await supabase
        .from('source_content_ingested')
        .select('created_at')
        .eq('id', question.source_content_id)
        .maybeSingle();

      sourceDate = source?.created_at || null;
    }

    const currentYear = new Date().getFullYear();

    const classificationResult = await classifyTemporalRelevance({
      questionText: question.question_text,
      sourceContentDate: sourceDate,
      currentYear,
    });

    if (!classificationResult.success || !classificationResult.classification) {
      return {
        questionId,
        classification: 'needs_review',
        confidence: 'low',
        reasoning: classificationResult.error || 'Classification failed',
        success: false,
        error: classificationResult.error,
      };
    }

    return {
      questionId,
      classification: classificationResult.classification,
      confidence: classificationResult.confidence || 'medium',
      reasoning: classificationResult.reasoning || 'No reasoning provided',
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      questionId,
      classification: 'needs_review',
      confidence: 'low',
      reasoning: `Error: ${message}`,
      success: false,
      error: message,
    };
  }
}

/**
 * Pre-filter questions using rule-based checks
 * Returns questions that need Gemini classification (ambiguous cases)
 */
async function preFilterQuestions(
  questions: TriviaQuestionWithSource[],
): Promise<{
  properCount: number;
  improperCount: number;
  ambiguousQuestions: TriviaQuestionWithSource[];
}> {
  let properCount = 0;
  let improperCount = 0;
  const ambiguousQuestions: TriviaQuestionWithSource[] = [];

  for (const question of questions) {
    if (isObviousImproper(question.question_text)) {
      // Auto-archive immediately
      await archiveQuestionAction(question.id);
      improperCount++;
    } else if (isObviousProper(question.question_text)) {
      // Auto-publish immediately
      await updateQuestionStatusAction(question.id, 'published');
      properCount++;
    } else {
      // Needs Gemini classification
      ambiguousQuestions.push(question);
    }
  }

  return {
    properCount,
    improperCount,
    ambiguousQuestions,
  };
}

/**
 * Batch classify multiple questions
 * First pre-filters with rules, then uses Gemini for ambiguous cases
 */
export async function batchClassifyQuestionsAction(
  questionIds: number[],
): Promise<BatchClassificationResult> {
  const supabase = await createServerClient();

  // Fetch all questions
  const { data: questions, error } = await supabase
    .from('trivia_multiple_choice')
    .select('id, question_text, correct_answer, wrong_answers, explanation, source_content_id')
    .in('id', questionIds);

  if (error || !questions) {
    return {
      success: false,
      processed: 0,
      proper: 0,
      improper: 0,
      needsReview: 0,
      failed: 0,
      results: [],
      message: `Failed to fetch questions: ${error?.message || 'Unknown error'}`,
    };
  }

  // Get source dates for questions
  const sourceIds = questions
    .map((q: any) => q.source_content_id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

  const sourceDatesMap = new Map<number, string | null>();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from('source_content_ingested')
      .select('id, created_at')
      .in('id', sourceIds);

    if (sources) {
      for (const source of sources) {
        sourceDatesMap.set(source.id, source.created_at);
      }
    }
  }

  const questionsWithSource: TriviaQuestionWithSource[] = questions.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    correct_answer: q.correct_answer,
    wrong_answers: q.wrong_answers,
    explanation: q.explanation,
    source_content_id: q.source_content_id,
    source_content_date: q.source_content_id ? sourceDatesMap.get(q.source_content_id) || null : null,
  }));

  // Step 1: Pre-filter with rule-based checks (auto-publish proper, auto-archive improper)
  const { properCount, improperCount, ambiguousQuestions } = await preFilterQuestions(
    questionsWithSource,
  );

  // Step 2: Classify ambiguous questions with Gemini
  const results: ClassificationResult[] = [];
  let proper = properCount;
  let improper = improperCount;
  let needsReview = 0;
  let failed = 0;

  // Add results for rule-based classifications
  for (const question of questionsWithSource) {
    if (isObviousImproper(question.question_text)) {
      results.push({
        questionId: question.id,
        classification: 'improper',
        confidence: 'high',
        reasoning: 'Rule-based: Contains temporal reference phrase or meta-referential language - automatically archived',
        success: true,
      });
    } else if (isObviousProper(question.question_text)) {
      results.push({
        questionId: question.id,
        classification: 'proper',
        confidence: 'high',
        reasoning: 'Rule-based: Contains historical fact with specific year/season or established historical reference - automatically published',
        success: true,
      });
    }
  }

  // Classify ambiguous questions with Gemini
  for (const question of ambiguousQuestions) {
    const result = await classifyQuestionAction(question.id);
    results.push(result);

    if (result.success) {
      if (result.classification === 'proper') proper++;
      else if (result.classification === 'improper') improper++;
      else needsReview++;
    } else {
      failed++;
    }

    // Delay to respect API rate limits (2 seconds between calls)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const message = `Processed ${questions.length} question(s): ${properCount} proper (auto-published), ${improperCount} improper (auto-archived), ${ambiguousQuestions.length} sent to Gemini. Results: ${proper} proper, ${improper} improper, ${needsReview} need review, ${failed} failed.`;

  return {
    success: failed === 0,
    processed: results.length,
    proper,
    improper,
    needsReview,
    failed,
    results,
    message,
  };
}

/**
 * Update question status based on classification
 */
export async function updateQuestionStatusAction(
  questionId: number,
  status: 'published' | 'unpublished',
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const updateData: { status: string; published_at?: string } = {
      status,
    };

    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trivia_multiple_choice')
      .update(updateData)
      .eq('id', questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Archive a question (set archived_at timestamp)
 */
export async function archiveQuestionAction(questionId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('trivia_multiple_choice')
      .update({
        archived_at: new Date().toISOString(),
        status: 'unpublished', // Keep as unpublished but archived
      })
      .eq('id', questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Bulk archive multiple questions
 */
export async function bulkArchiveQuestionsAction(
  questionIds: number[],
): Promise<{ success: boolean; archived: number; failed: number; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('trivia_multiple_choice')
      .update({
        archived_at: new Date().toISOString(),
        status: 'unpublished',
      })
      .in('id', questionIds);

    if (error) {
      return { success: false, archived: 0, failed: questionIds.length, error: error.message };
    }

    return { success: true, archived: questionIds.length, failed: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, archived: 0, failed: questionIds.length, error: message };
  }
}

/**
 * Bulk publish multiple questions
 */
export async function bulkPublishQuestionsAction(
  questionIds: number[],
): Promise<{ success: boolean; published: number; failed: number; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('trivia_multiple_choice')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .in('id', questionIds);

    if (error) {
      return { success: false, published: 0, failed: questionIds.length, error: error.message };
    }

    return { success: true, published: questionIds.length, failed: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, published: 0, failed: questionIds.length, error: message };
  }
}

/**
 * Archive all improper questions based on rule-based checks
 */
export async function archiveAllImproperAction(): Promise<{
  success: boolean;
  archived: number;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Get all unpublished questions
    const { data: questions, error: fetchError } = await supabase
      .from('trivia_multiple_choice')
      .select('id, question_text')
      .or('status.is.null,status.eq.unpublished,status.eq.draft')
      .is('archived_at', null);

    if (fetchError) {
      return { success: false, archived: 0, error: `Failed to fetch questions: ${fetchError.message}` };
    }

    if (!questions || questions.length === 0) {
      return { success: true, archived: 0 };
    }

    // Filter to only improper questions
    const improperQuestionIds = questions
      .filter((q) => isObviousImproper(q.question_text))
      .map((q) => q.id);

    if (improperQuestionIds.length === 0) {
      return { success: true, archived: 0 };
    }

    // Archive them
    const { error: updateError } = await supabase
      .from('trivia_multiple_choice')
      .update({
        archived_at: new Date().toISOString(),
        status: 'unpublished',
      })
      .in('id', improperQuestionIds);

    if (updateError) {
      return { success: false, archived: 0, error: updateError.message };
    }

    return { success: true, archived: improperQuestionIds.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, archived: 0, error: message };
  }
}

/**
 * Publish all proper questions based on rule-based checks
 */
export async function publishAllProperAction(): Promise<{
  success: boolean;
  published: number;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Get all unpublished questions
    const { data: questions, error: fetchError } = await supabase
      .from('trivia_multiple_choice')
      .select('id, question_text')
      .or('status.is.null,status.eq.unpublished,status.eq.draft')
      .is('archived_at', null);

    if (fetchError) {
      return { success: false, published: 0, error: `Failed to fetch questions: ${fetchError.message}` };
    }

    if (!questions || questions.length === 0) {
      return { success: true, published: 0 };
    }

    // Filter to only proper questions
    const properQuestionIds = questions
      .filter((q) => isObviousProper(q.question_text))
      .map((q) => q.id);

    if (properQuestionIds.length === 0) {
      return { success: true, published: 0 };
    }

    // Publish them
    const { error: updateError } = await supabase
      .from('trivia_multiple_choice')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .in('id', properQuestionIds);

    if (updateError) {
      return { success: false, published: 0, error: updateError.message };
    }

    return { success: true, published: properQuestionIds.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, published: 0, error: message };
  }
}

/**
 * Batch process: classify and auto-archive/publish based on classification
 */
export async function batchProcessClassificationsAction(
  results: ClassificationResult[],
): Promise<{
  success: boolean;
  published: number;
  archived: number;
  flagged: number;
  failed: number;
  message: string;
}> {
  let published = 0;
  let archived = 0;
  let flagged = 0;
  let failed = 0;

  for (const result of results) {
    if (!result.success) {
      failed++;
      continue;
    }

    try {
      if (result.classification === 'proper' && result.confidence === 'high') {
        // Auto-publish high-confidence proper questions
        const updateResult = await updateQuestionStatusAction(result.questionId, 'published');
        if (updateResult.success) {
          published++;
        } else {
          failed++;
        }
      } else if (result.classification === 'improper' && result.confidence === 'high') {
        // Auto-archive high-confidence improper questions
        const archiveResult = await archiveQuestionAction(result.questionId);
        if (archiveResult.success) {
          archived++;
        } else {
          failed++;
        }
      } else {
        // Flag for review (needs_review, or medium/low confidence)
        flagged++;
      }
    } catch (error) {
      failed++;
    }
  }

  const message = `Processed ${results.length} question(s): ${published} published, ${archived} archived, ${flagged} flagged for review, ${failed} failed.`;

  return {
    success: failed === 0,
    published,
    archived,
    flagged,
    failed,
    message,
  };
}

