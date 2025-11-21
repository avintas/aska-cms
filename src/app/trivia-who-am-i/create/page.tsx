import { FC } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { WhoAmITriviaCreateInput } from '@aska/shared';

async function createWhoAmITriviaAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const triviaData: WhoAmITriviaCreateInput = {
    question_text: formData.get('question_text') as string,
    correct_answer: formData.get('correct_answer') as string,
    explanation: (formData.get('explanation') as string) || null,
    category: (formData.get('category') as string) || null,
    theme: (formData.get('theme') as string) || null,
    difficulty: (formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard') || null,
    attribution: (formData.get('attribution') as string) || null,
    status: (formData.get('status') as 'draft' | 'published') || 'draft',
  };

  const { error } = await supabase.from('trivia_who_am_i').insert(triviaData);

  if (error) {
    console.error('Error creating who am i trivia:', error);
    throw new Error('Failed to create trivia question');
  }

  redirect('/trivia-who-am-i');
}

const CreateWhoAmITriviaPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Who Am I Question
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add a new who am I trivia question with progressive clues
          </p>
        </div>

        <form action={createWhoAmITriviaAction} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <label
                  htmlFor="question_text"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Clues <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter progressive clues, one per line. Start with harder clues and end with
                  easier ones.
                </p>
                <textarea
                  name="question_text"
                  id="question_text"
                  required
                  rows={6}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Example:&#10;I was born in Brantford, Ontario&#10;I wore number 99&#10;I'm called 'The Great One'&#10;I hold 61 NHL records"
                />
              </div>

              <div>
                <label
                  htmlFor="correct_answer"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="correct_answer"
                  id="correct_answer"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="The person, team, or thing being described"
                />
              </div>

              <div>
                <label
                  htmlFor="explanation"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Explanation
                </label>
                <textarea
                  name="explanation"
                  id="explanation"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Additional context or interesting facts"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    id="difficulty"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    defaultValue="draft"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="e.g., Players, Teams, Coaches"
                />
              </div>

              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Theme
                </label>
                <input
                  type="text"
                  name="theme"
                  id="theme"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="e.g., NHL, Legends, Modern Era"
                />
              </div>

              <div>
                <label
                  htmlFor="attribution"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Attribution
                </label>
                <input
                  type="text"
                  name="attribution"
                  id="attribution"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Source"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <a
              href="/trivia-who-am-i"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWhoAmITriviaPage;

