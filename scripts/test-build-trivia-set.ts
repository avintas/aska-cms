/**
 * Test script for Build Trivia Set mechanism
 * Tests all three trivia set builders: Multiple Choice, True/False, and Who Am I
 * 
 * Usage:
 *   npx tsx scripts/test-build-trivia-set.ts [type] [theme] [questionCount] [category]
 * 
 * Examples:
 *   npx tsx scripts/test-build-trivia-set.ts
 *   npx tsx scripts/test-build-trivia-set.ts mc "Players" 10
 *   npx tsx scripts/test-build-trivia-set.ts tf "Teams & Organizations" 5 "NBA Teams"
 * 
 * Note: Make sure your .env.local file contains:
 *   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 */

// Try to load environment variables from .env files if dotenv is available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv');
  const { resolve } = require('path');
  
  // Try to load .env.local first, then .env
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
} catch {
  // dotenv not available, assume environment variables are set via system/env
  // This is fine for production or when env vars are set another way
}

import { buildTriviaSetMultipleChoice } from '@/lib/process-builders/build-trivia-set-multiple-choice/lib/build-trivia-set-multiple-choice';
import { buildTriviaSetTrueFalse } from '@/lib/process-builders/build-trivia-set-true-false/lib/build-trivia-set-true-false';
import { buildTriviaSetWhoAmI } from '@/lib/process-builders/build-trivia-set-who-am-i/lib/build-trivia-set-who-am-i';
import type {
  ProcessBuilderGoal,
  ProcessBuilderRules,
  ProcessBuilderOptions,
} from '@/lib/process-builders/core/types';

type TriviaType = 'mc' | 'tf' | 'wai' | 'all';

interface TestConfig {
  type: TriviaType;
  theme: string;
  questionCount: number;
  category?: string;
  allowPartial: boolean;
}

// Parse command line arguments
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  
  const type = (args[0] as TriviaType) || 'all';
  const theme = args[1] || 'Players';
  const questionCount = parseInt(args[2] || '10', 10);
  const category = args[3] || undefined;
  const allowPartial = args[4] !== 'false';

  return {
    type: ['mc', 'tf', 'wai', 'all'].includes(type) ? type : 'all',
    theme,
    questionCount: isNaN(questionCount) ? 10 : questionCount,
    category,
    allowPartial,
  };
}

// Format result for display
function formatResult(result: any, type: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Result: ${type.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Status: ${result.status}`);
  console.log(`Process: ${result.processName}`);
  console.log(`Execution Time: ${result.executionTime.toFixed(2)}ms`);
  
  if (result.errors && result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error: any, index: number) => {
      console.log(`  ${index + 1}. [${error.code}] ${error.message}`);
      if (error.taskId) {
        console.log(`     Task: ${error.taskId}`);
      }
      if (error.details) {
        console.log(`     Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    });
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((warning: string, index: number) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  if (result.results && result.results.length > 0) {
    console.log(`\nTasks Executed (${result.results.length}):`);
    result.results.forEach((taskResult: any, index: number) => {
      const status = taskResult.success ? '✓' : '✗';
      console.log(`  ${index + 1}. ${status} ${taskResult.metadata?.taskName || 'Unknown Task'}`);
      if (taskResult.errors && taskResult.errors.length > 0) {
        taskResult.errors.forEach((error: any) => {
          console.log(`     - ${error.message}`);
        });
      }
    });
  }

  // Show final result data if available
  if (result.finalResult) {
    console.log(`\nFinal Result:`);
    if (result.finalResult.triviaSet) {
      const set = result.finalResult.triviaSet;
      console.log(`  Title: ${set.title}`);
      console.log(`  Slug: ${set.slug}`);
      console.log(`  Question Count: ${set.question_count}`);
      console.log(`  Status: ${set.status}`);
      console.log(`  Theme: ${set.theme || 'N/A'}`);
      console.log(`  Category: ${set.category || 'N/A'}`);
      if (set.question_data && Array.isArray(set.question_data)) {
        console.log(`  Questions in Set: ${set.question_data.length}`);
      }
    } else {
      console.log(`  ${JSON.stringify(result.finalResult, null, 2)}`);
    }
  }

  console.log(`${'='.repeat(60)}\n`);
}

// Test a single trivia set builder
async function testTriviaSetBuilder(
  type: 'mc' | 'tf' | 'wai',
  config: TestConfig,
): Promise<void> {
  const typeNames = {
    mc: 'Multiple Choice',
    tf: 'True/False',
    wai: 'Who Am I',
  };

  console.log(`\n${'#'.repeat(60)}`);
  console.log(`Testing: ${typeNames[type]} Trivia Set Builder`);
  console.log(`${'#'.repeat(60)}`);
  console.log(`Theme: ${config.theme}`);
  console.log(`Question Count: ${config.questionCount}`);
  if (config.category) {
    console.log(`Category: ${config.category}`);
  }
  console.log(`Allow Partial: ${config.allowPartial}`);

  try {
    const goal: ProcessBuilderGoal = {
      text: config.theme,
    };

    const rules: ProcessBuilderRules = {
      questionCount: {
        key: 'questionCount',
        value: config.questionCount,
        type: 'number',
      },
    };

    if (config.category) {
      rules.category = {
        key: 'category',
        value: config.category,
        type: 'string',
      };
    }

    const options: ProcessBuilderOptions = {
      allowPartialResults: config.allowPartial,
    };

    let result;
    const startTime = Date.now();

    switch (type) {
      case 'mc':
        result = await buildTriviaSetMultipleChoice(goal, rules, options);
        break;
      case 'tf':
        result = await buildTriviaSetTrueFalse(goal, rules, options);
        break;
      case 'wai':
        result = await buildTriviaSetWhoAmI(goal, rules, options);
        break;
    }

    const endTime = Date.now();
    result.executionTime = endTime - startTime;

    formatResult(result, typeNames[type]);

    if (result.status === 'success') {
      console.log(`✅ ${typeNames[type]} trivia set created successfully!`);
    } else if (result.status === 'partial') {
      console.log(`⚠️  ${typeNames[type]} trivia set created with partial results.`);
    } else {
      console.log(`❌ ${typeNames[type]} trivia set creation failed.`);
    }
  } catch (error) {
    console.error(`\n❌ Error testing ${typeNames[type]}:`, error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

// Main test function
async function runTests(): Promise<void> {
  const config = parseArgs();

  console.log('\n🧪 Build Trivia Set Test Script');
  console.log('================================\n');
  console.log('Configuration:');
  console.log(`  Type: ${config.type}`);
  console.log(`  Theme: ${config.theme}`);
  console.log(`  Question Count: ${config.questionCount}`);
  console.log(`  Category: ${config.category || 'All'}`);
  console.log(`  Allow Partial: ${config.allowPartial}`);

  if (config.type === 'all') {
    // Test all three types
    await testTriviaSetBuilder('mc', config);
    await testTriviaSetBuilder('tf', config);
    await testTriviaSetBuilder('wai', config);
  } else {
    // Test specific type
    await testTriviaSetBuilder(config.type as 'mc' | 'tf' | 'wai', config);
  }

  console.log('\n✨ Test run completed!\n');
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

