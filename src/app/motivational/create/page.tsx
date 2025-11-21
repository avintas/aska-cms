import { FC } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { MotivationalCreateInput } from '@aska/shared';

async function createMotivationalAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const motivationalData: MotivationalCreateInput = {
    quote: formData.get('quote') as string,
    author: (formData.get('author') as string) || undefined,
    context: (formData.get('context') as string) || undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: (formData.get('status') as 'unpublished' | 'published') || 'unpublished',
  };

  const { error } = await supabase.from('collection_motivational').insert(motivationalData);

  if (error) {
    console.error('Error creating motivational:', error);
    throw new Error('Failed to create motivational quote');
  }

  redirect('/motivational');
}

const CreateMotivationalPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Motivational Quote
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add a new motivational quote
          </p>
        </div>

        <form action={createMotivationalAction} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <label
                  htmlFor="quote"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="quote"
                  id="quote"
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Enter the motivational quote"
                />
              </div>

              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Author
                </label>
                <input
                  type="text"
                  name="author"
                  id="author"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Quote author"
                />
              </div>

              <div>
                <label
                  htmlFor="context"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Context
                </label>
                <textarea
                  name="context"
                  id="context"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Additional context or background"
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
                  placeholder="e.g., Dedication, Perseverance, Teamwork"
                />
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
                  placeholder="Category"
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
                  defaultValue="unpublished"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                >
                  <option value="unpublished">Unpublished</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <a
              href="/motivational"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMotivationalPage;
