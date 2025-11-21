import { Metadata } from 'next';
import { getCategories } from '@/lib/trivia-statistics';
import BuildTriviaSetClient from './components/build-trivia-set-client';
import type { CategoryStat } from '@/lib/trivia-statistics';

export const metadata: Metadata = {
  title: 'Build Trivia Set • Aska CMS',
  description: 'Create curated trivia sets from questions',
};

// Pre-fetch categories for all combinations
async function getAllCategories(): Promise<Record<string, CategoryStat[]>> {
  const themes: Array<'Players' | 'Teams & Organizations' | 'Venues & Locations' | 'Awards & Honors' | 'Leadership & Staff'> = [
    'Players',
    'Teams & Organizations',
    'Venues & Locations',
    'Awards & Honors',
    'Leadership & Staff',
  ];

  const triviaTypes: Array<'multiple_choice' | 'true_false' | 'who_am_i'> = [
    'multiple_choice',
    'true_false',
    'who_am_i',
  ];

  const categoriesMap: Record<string, CategoryStat[]> = {};

  // Fetch all combinations in parallel
  await Promise.all(
    triviaTypes.flatMap((type) =>
      themes.map(async (theme) => {
        const key = `${type}-${theme}`;
        try {
          const categories = await getCategories(type, theme);
          categoriesMap[key] = categories;
        } catch (error) {
          console.error(`Error fetching categories for ${key}:`, error);
          categoriesMap[key] = [];
        }
      }),
    ),
  );

  return categoriesMap;
}

export default async function BuildTriviaSetPage(): Promise<JSX.Element> {
  // Fetch all categories server-side
  const initialCategories = await getAllCategories();

  return <BuildTriviaSetClient initialCategories={initialCategories} />;
}

