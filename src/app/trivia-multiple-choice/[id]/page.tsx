import { FC } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { MultipleChoiceTrivia, MultipleChoiceTriviaUpdateInput } from '@aska/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateMultipleChoiceTriviaAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const wrongAnswers = [
    formData.get('wrong_answer_1') as string,
    formData.get('wrong_answer_2') as string,
    formData.get('wrong_answer_3') as string,
  ].filter((ans) => ans && ans.trim() !== '');

  const triviaData: MultipleChoiceTriviaUpdateInput = {
    question_text: formData.get('question_text') as string,
    correct_answer: formData.get('correct_answer') as string,
    wrong_answers: wrongAnswers.length === 3 ? wrongAnswers : undefined,
    explanation: (formData.get('explanation') as string) || null,
    category: (formData.get('category') as string) || null,
    theme: (formData.get('theme') as string) || null,
    difficulty: (formData.get('difficulty') as 'Easy' | 'Medium' | 'Hard') || null,
    attribution: (formData.get('attribution') as string) || null,
    status: (formData.get('status') as 'draft' | 'published' | 'archived') || undefined,
  };

  const { error } = await supabase
    .from('trivia_multiple_choice')
    .update(triviaData)
    .eq('id', id);

  if (error) {
    console.error('Error updating multiple choice trivia:', error);
    throw new Error('Failed to update trivia question');
  }

  redirect('/trivia-multiple-choice');
}

async function deleteMultipleChoiceTriviaAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('trivia_multiple_choice').delete().eq('id', id);

  if (error) {
    console.error('Error deleting multiple choice trivia:', error);
    throw new Error('Failed to delete trivia question');
  }

  redirect('/trivia-multiple-choice');
}

const EditMultipleChoiceTriviaPage: FC<PageProps> = async ({ params }) => {
  const { id } = await params;
  const triviaId = parseInt(id, 10);

  if (isNaN(triviaId)) {
    notFound();
  }

  const supabase = await createServerClient();

  const { data: trivia, error } = await supabase
    .from('trivia_multiple_choice')
    .select('*')
    .eq('id', triviaId)
    .single();

  if (error || !trivia) {
    notFound();
  }

  const triviaData = trivia as MultipleChoiceTrivia;

  const updateAction = updateMultipleChoiceTriviaAction.bind(null, triviaId);
  const deleteAction = deleteMultipleChoiceTriviaAction.bind(null, triviaId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Multiple Choice Question
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Update trivia question details
          </p>
        </div>

        <form id="update-form" action={updateAction} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <label
                  htmlFor="question_text"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="question_text"
                  id="question_text"
                  required
                  rows={3}
                  defaultValue={triviaData.question_text}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="correct_answer"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="correct_answer"
                  id="correct_answer"
                  required
                  defaultValue={triviaData.correct_answer}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wrong Answers <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="wrong_answer_1"
                  required
                  defaultValue={triviaData.wrong_answers[0] || ''}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  name="wrong_answer_2"
                  required
                  defaultValue={triviaData.wrong_answers[1] || ''}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  name="wrong_answer_3"
                  required
                  defaultValue={triviaData.wrong_answers[2] || ''}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                  defaultValue={triviaData.explanation || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
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
                    defaultValue={triviaData.difficulty || ''}
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
                    defaultValue={triviaData.status || 'draft'}
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
                  defaultValue={triviaData.category || ''}
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
                  defaultValue={triviaData.theme || ''}
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
                  defaultValue={triviaData.attribution || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(triviaData.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Updated
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(triviaData.updated_at).toLocaleString()}
                    </dd>
                  </div>
                  {triviaData.published_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Published
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(triviaData.published_at).toLocaleString()}
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
              href="/trivia-multiple-choice"
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

export default EditMultipleChoiceTriviaPage;

