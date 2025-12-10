import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/utils/supabase/api-client';
import {
  getAutomatedBuilderConfig,
  updateAutomatedBuilderConfig,
} from '@/lib/automated-set-builder/config';

/**
 * GET /api/automated-set-builder/config
 * Get the current automated builder configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Validate user session
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getAutomatedBuilderConfig();

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching automated builder config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/automated-set-builder/config
 * Update the automated builder configuration
 * 
 * Request body:
 * {
 *   enabled?: boolean,
 *   sets_per_day?: number,
 *   questions_per_set?: number,
 *   themes?: string[] | null,
 *   balance_themes?: boolean,
 *   cron_schedule?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session
    const { supabase, userId } = await createApiClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (body.sets_per_day !== undefined && (typeof body.sets_per_day !== 'number' || body.sets_per_day < 1)) {
      return NextResponse.json(
        { success: false, error: 'sets_per_day must be a positive number' },
        { status: 400 },
      );
    }

    if (body.questions_per_set !== undefined && (typeof body.questions_per_set !== 'number' || body.questions_per_set < 1)) {
      return NextResponse.json(
        { success: false, error: 'questions_per_set must be a positive number' },
        { status: 400 },
      );
    }

    // Update configuration
    const result = await updateAutomatedBuilderConfig(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update configuration' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating automated builder config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

