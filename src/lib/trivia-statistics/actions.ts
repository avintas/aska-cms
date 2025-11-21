/**
 * Server Actions for Trivia Statistics
 * These actions can be called from client components
 */

'use server';

import { getCategories, getThemes, getDifficulties, type TriviaType } from './index';

/**
 * Server action to get categories for a trivia type and theme
 */
export async function getCategoriesAction(
  triviaType: TriviaType,
  theme: string,
) {
  try {
    const categories = await getCategories(triviaType, theme);
    return { success: true, data: categories };
  } catch (error) {
    console.error('Error in getCategoriesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Server action to get themes for a trivia type
 */
export async function getThemesAction(triviaType: TriviaType) {
  try {
    const themes = await getThemes(triviaType);
    return { success: true, data: themes };
  } catch (error) {
    console.error('Error in getThemesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Server action to get difficulties for a trivia type and theme
 */
export async function getDifficultiesAction(triviaType: TriviaType, theme: string) {
  try {
    const difficulties = await getDifficulties(triviaType, theme);
    return { success: true, data: difficulties };
  } catch (error) {
    console.error('Error in getDifficultiesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Server action to get theme count for a trivia type and theme
 */
export async function getThemeCountAction(triviaType: TriviaType, theme: string) {
  try {
    const { getThemeCount } = await import('./index');
    const count = await getThemeCount(triviaType, theme);
    return { success: true, data: count };
  } catch (error) {
    console.error('Error in getThemeCountAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: 0,
    };
  }
}

/**
 * Server action to get category count for a trivia type, theme, and category
 */
export async function getCategoryCountAction(
  triviaType: TriviaType,
  theme: string,
  category: string,
) {
  try {
    const { getCategoryCount } = await import('./index');
    const count = await getCategoryCount(triviaType, theme, category);
    return { success: true, data: count };
  } catch (error) {
    console.error('Error in getCategoryCountAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: 0,
    };
  }
}

