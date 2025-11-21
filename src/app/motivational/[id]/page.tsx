import { FC } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { Motivational, MotivationalUpdateInput } from '@aska/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateMotivationalAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const motivationalData: MotivationalUpdateInput = {
    quote: formData.get('quote') as string,
    author: (formData.get('author') as string) || undefined,
    context: (formData.get('context') as string) || undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: (formData.get('status') as 'unpublished' | 'published' | 'archived') || undefined,
  };

  const { error } = await supabase
    .from('collection_motivational')
    .update(motivationalData)
    .eq('id', id);

  if (error) {
    console.error('Error updating motivational:', error);
    throw new Error('Failed to update motivational quote');
  }

  redirect('/motivational');
}

async function deleteMotivationalAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('collection_motivational').delete().eq('id', id);

  if (error) {
    console.error('Error deleting motivational:', error);
    throw new Error('Failed to delete motivational quote');
  }

  redirect('/motivational');
}

const EditMotivationalPage: FC<PageProps> = async ({ params }) => {
  const { id } = await params;
  const motivationalId = parseInt(id, 10);

  if (isNaN(motivationalId)) {
    notFound();
  }

  const supabase = await createServerClient();

  const { data: motivational, error } = await supabase
    .from('collection_motivational')
    .select('*')
    .eq('id', motivationalId)
    .single();

  if (error || !motivational) {
    notFound();
  }

  const motivationalData = motivational as Motivational;

  const updateAction = updateMotivationalAction.bind(null, motivationalId);
  const deleteAction = deleteMotivationalAction.bind(null, motivationalId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Motivational Quote
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update quote details</p>
        </div>

        <form id="update-form" action={updateAction} className="space-y-6">
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
                  defaultValue={motivationalData.quote}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.author || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.context || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.theme || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.category || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.attribution || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={motivationalData.status || 'unpublished'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                >
                  <option value="unpublished">Unpublished</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(motivationalData.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Updated
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(motivationalData.updated_at).toLocaleString()}
                    </dd>
                  </div>
                  {motivationalData.published_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Published
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(motivationalData.published_at).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between mt-6">
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </form>
          <div className="flex items-center space-x-4">
            <a
              href="/motivational"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </a>
            <button
              type="submit"
              form="update-form"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMotivationalPage;

