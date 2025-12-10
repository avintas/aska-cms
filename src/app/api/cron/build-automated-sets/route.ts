import { NextRequest, NextResponse } from 'next/server';
import { buildAutomatedSets } from '@/lib/automated-set-builder/build-automated-sets';

/**
 * POST /api/cron/build-automated-sets
 * Creates automated trivia sets based on configuration
 * 
 * This endpoint should be called by a cron job or scheduled task.
 * Can optionally accept a publish_date parameter to build sets for a specific date.
 * 
 * Request body (optional):
 * {
 *   publish_date?: string (ISO date string, e.g., "2025-01-15")
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   setsCreated: number,
 *   setsFailed: number,
 *   setIds: number[],
 *   errors: string[],
 *   warnings: string[]
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Optional: Add authentication/authorization check here
    // For cron jobs, you might want to check for a secret token
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse request body for numberOfSets, triviaType, overrides, and optional publish_date
    let publishDate: string | undefined;
    let numberOfSets: number | undefined;
    let triviaType: 'mc' | 'tf' | 'mix' | undefined;
    let overrides: {
      questions_per_set?: number;
      themes?: string[] | null;
      balance_themes?: boolean;
    } | undefined;
    try {
      const body = await request.json();
      publishDate = body.publish_date;
      numberOfSets = body.numberOfSets;
      triviaType = body.triviaType || 'mc';
      if (body.questions_per_set || body.themes !== undefined || body.balance_themes !== undefined) {
        overrides = {
          questions_per_set: body.questions_per_set,
          themes: body.themes,
          balance_themes: body.balance_themes,
        };
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Build automated sets
    const result = await buildAutomatedSets(publishDate, numberOfSets, triviaType, overrides);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          setsCreated: result.setsCreated,
          setsFailed: result.setsFailed,
          setIds: result.setIds,
          warnings: result.warnings,
          message: `Successfully created ${result.setsCreated} set(s)`,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          setsCreated: result.setsCreated,
          setsFailed: result.setsFailed,
          setIds: result.setIds,
          errors: result.errors,
          warnings: result.warnings,
          message: result.errors.join('; ') || 'Failed to create sets',
        },
        { status: result.setsCreated > 0 ? 207 : 500 }, // 207 = Multi-Status if partial success
      );
    }
  } catch (error) {
    console.error('Unexpected error in build-automated-sets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cron/build-automated-sets
 * Returns status information about the automated builder
 * Useful for monitoring/health checks
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { getAutomatedBuilderConfig } = await import('@/lib/automated-set-builder/config');
    const config = await getAutomatedBuilderConfig();

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      setsPerDay: config.sets_per_day,
      questionsPerSet: config.questions_per_set,
      lastRunAt: config.last_run_at,
      lastRunStatus: config.last_run_status,
      lastRunMessage: config.last_run_message,
    });
  } catch (error) {
    console.error('Error fetching automated builder status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

