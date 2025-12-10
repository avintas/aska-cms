/**
 * Script to list all themes used in the trivia_multiple_choice table
 * Run with: npx tsx scripts/list-multiple-choice-themes.ts
 */

import { getSupabaseAdmin } from '@/utils/supabase/admin';

async function listThemes(): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Query all published questions and get distinct themes
    const { data, error } = await supabase
      .from('trivia_multiple_choice')
      .select('theme')
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching themes:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('No published questions found in trivia_multiple_choice table.');
      return;
    }

    // Extract unique themes
    const themes = new Set<string>();
    let uncategorizedCount = 0;

    for (const question of data) {
      if (question.theme && question.theme.trim()) {
        themes.add(question.theme.trim());
      } else {
        uncategorizedCount++;
      }
    }

    // Sort themes alphabetically
    const sortedThemes = Array.from(themes).sort();

    console.log('\n=== Themes in trivia_multiple_choice table (published questions) ===\n');
    
    if (sortedThemes.length > 0) {
      sortedThemes.forEach((theme, index) => {
        const count = data.filter(q => q.theme?.trim() === theme).length;
        console.log(`${index + 1}. ${theme} (${count} questions)`);
      });
    }

    if (uncategorizedCount > 0) {
      console.log(`\nUncategorized (null/empty theme): ${uncategorizedCount} questions`);
    }

    console.log(`\nTotal themes: ${sortedThemes.length}`);
    console.log(`Total published questions: ${data.length}\n`);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

listThemes();

